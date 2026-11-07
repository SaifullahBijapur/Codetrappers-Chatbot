/**
 * Incremental ingestion: reads ./content/**\/*.{pdf,md}, chunks, embeds (Voyage),
 * and stores in Supabase. Unchanged files are skipped; removed files are deleted.
 *
 * PDF files (the scraped website, see scripts/scrape.ts): title from the PDF Title,
 * and url/access/type from the Keywords field as "url=...; access=public; type=page".
 * PDFs without those fields still work (title falls back to the file name, access
 * to public).
 *
 * Markdown files use front matter:
 *   ---
 *   title: Plans and Pricing
 *   url: /pricing
 *   access: public        # public | enrolled | paid
 *   type: pricing
 *   ---
 */
import fs from "node:fs";
import path from "node:path";
import { createHash } from "node:crypto";
import { createClient } from "@supabase/supabase-js";
import { chunkMarkdown } from "../lib/chunk";
import { embed } from "../lib/voyage";
import { readPdf, cleanText } from "../lib/pdf";

const db = createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!, {
  auth: { persistSession: false },
});

const CONTENT_DIR = path.join(process.cwd(), "content");

function walk(dir: string): string[] {
  return fs.readdirSync(dir, { withFileTypes: true }).flatMap((e) => {
    const p = path.join(dir, e.name);
    return e.isDirectory() ? walk(p) : /\.(md|pdf)$/i.test(p) ? [p] : [];
  });
}

function parse(raw: string) {
  raw = raw.replace(/\r\n/g, "\n"); // tolerate CRLF checkouts on Windows
  const m = /^---\n([\s\S]*?)\n---\n?/.exec(raw);
  const meta: Record<string, string> = {};
  if (m) {
    for (const line of m[1].split("\n")) {
      const i = line.indexOf(":");
      if (i > 0) meta[line.slice(0, i).trim()] = line.slice(i + 1).trim();
    }
  }
  return { meta, body: m ? raw.slice(m[0].length) : raw };
}

// ~16 chunks x ~500 tokens stays under the Voyage free tier's 10K tokens/minute.
const EMBED_BATCH = Number(process.env.EMBED_BATCH ?? 16);
const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

/** Embed with patient retries on Voyage rate limits (429), e.g. the free tier's 3 requests/minute. */
async function embedWithRetry(texts: string[], attempts = 8): Promise<number[][]> {
  for (let i = 1; ; i++) {
    try {
      return await embed(texts, "document");
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      if (!msg.includes(" 429 ") || i >= attempts) throw e;
      const wait = Math.min(25_000 * i, 90_000);
      console.log(`         rate limited by Voyage, waiting ${wait / 1000}s (attempt ${i}/${attempts - 1})`);
      await sleep(wait);
    }
  }
}

async function main() {
  const files = walk(CONTENT_DIR);
  const seen = new Set<string>();

  for (const file of files) {
    const rel = path.relative(CONTENT_DIR, file);
    seen.add(rel);
    const bytes = fs.readFileSync(file);
    const hash = createHash("sha256").update(bytes).digest("hex");

    const { data: existing } = await db
      .from("documents").select("id, content_hash, chunks(count)").eq("source_path", rel).maybeSingle();
    const chunkCount = (existing?.chunks as { count: number }[] | undefined)?.[0]?.count ?? 0;
    if (existing?.content_hash === hash && chunkCount > 0) {
      console.log(`skip     ${rel}`);
      continue;
    }

    // PDFs (from `npm run scrape` or added by hand) carry their metadata in the
    // PDF info dictionary; Markdown files use front matter.
    let meta: Record<string, string>;
    let body: string;
    if (/\.pdf$/i.test(file)) {
      const pdf = await readPdf(bytes);
      meta = Object.fromEntries(
        Object.entries(pdf.meta).filter((kv): kv is [string, string] => typeof kv[1] === "string" && kv[1] !== "")
      );
      body = pdf.markdown;
    } else {
      ({ meta, body } = parse(bytes.toString("utf8")));
    }

    // Postgres text cannot hold U+0000 and friends; strip them from any source.
    body = cleanText(body);
    const title = cleanText(meta.title ?? path.basename(file, path.extname(file))).trim();
    const access = ["public", "enrolled", "paid"].includes(meta.access) ? meta.access : "public";

    const { data: doc, error } = await db.from("documents").upsert(
      {
        source_path: rel, title, url: meta.url ?? null,
        content_type: meta.type ?? "lesson", access_level: access,
        // Real hash is written only after the chunks are stored, so a run that
        // fails half-way (e.g. rate limit) re-processes this file next time.
        content_hash: "pending", updated_at: new Date().toISOString(),
      },
      { onConflict: "source_path" }
    ).select("id").single();
    if (error || !doc) throw error ?? new Error("upsert failed");

    await db.from("chunks").delete().eq("document_id", doc.id);

    const chunks = chunkMarkdown(body, title);
    const rows: Record<string, unknown>[] = [];
    for (let i = 0; i < chunks.length; i += EMBED_BATCH) {
      const batch = chunks.slice(i, i + EMBED_BATCH);
      const vectors = await embedWithRetry(batch.map((c) => c.content));
      batch.forEach((c, j) =>
        rows.push({
          document_id: doc.id, chunk_index: i + j, section_path: c.section,
          content: c.content, access_level: access,
          embedding: JSON.stringify(vectors[j]),
        })
      );
    }
    const { error: insErr } = await db.from("chunks").insert(rows);
    if (insErr) throw insErr;
    const { error: hashErr } = await db.from("documents").update({ content_hash: hash }).eq("id", doc.id);
    if (hashErr) throw hashErr;
    console.log(`indexed  ${rel} (${rows.length} chunks, ${access})`);
  }

  // Remove documents whose source file was deleted (chunks cascade)
  const { data: all } = await db.from("documents").select("id, source_path");
  for (const d of all ?? []) {
    if (!seen.has(d.source_path)) {
      await db.from("documents").delete().eq("id", d.id);
      console.log(`removed  ${d.source_path}`);
    }
  }
  console.log("done");
}

main().catch((e) => { console.error(e); process.exit(1); });
