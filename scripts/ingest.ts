/**
 * Incremental ingestion: reads ./content/**\/*.md, chunks, embeds (Voyage), and
 * stores in Supabase. Unchanged files are skipped; removed files are deleted.
 *
 * Front matter per file:
 *   ---
 *   title: Python Basics: Loops
 *   url: /courses/python-basics/loops
 *   access: public        # public | enrolled | paid
 *   type: lesson
 *   ---
 */
import fs from "node:fs";
import path from "node:path";
import { createHash } from "node:crypto";
import { createClient } from "@supabase/supabase-js";
import { chunkMarkdown } from "../lib/chunk";
import { embed } from "../lib/voyage";

const db = createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!, {
  auth: { persistSession: false },
});

const CONTENT_DIR = path.join(process.cwd(), "content");

function walk(dir: string): string[] {
  return fs.readdirSync(dir, { withFileTypes: true }).flatMap((e) => {
    const p = path.join(dir, e.name);
    return e.isDirectory() ? walk(p) : p.endsWith(".md") ? [p] : [];
  });
}

function parse(raw: string) {
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

async function main() {
  const files = walk(CONTENT_DIR);
  const seen = new Set<string>();

  for (const file of files) {
    const rel = path.relative(CONTENT_DIR, file);
    seen.add(rel);
    const raw = fs.readFileSync(file, "utf8");
    const hash = createHash("sha256").update(raw).digest("hex");
    const { meta, body } = parse(raw);

    const { data: existing } = await db
      .from("documents").select("id, content_hash").eq("source_path", rel).maybeSingle();
    if (existing?.content_hash === hash) {
      console.log(`skip     ${rel}`);
      continue;
    }

    const title = meta.title ?? path.basename(file, ".md");
    const access = ["public", "enrolled", "paid"].includes(meta.access) ? meta.access : "public";

    const { data: doc, error } = await db.from("documents").upsert(
      {
        source_path: rel, title, url: meta.url ?? null,
        content_type: meta.type ?? "lesson", access_level: access,
        content_hash: hash, updated_at: new Date().toISOString(),
      },
      { onConflict: "source_path" }
    ).select("id").single();
    if (error || !doc) throw error ?? new Error("upsert failed");

    await db.from("chunks").delete().eq("document_id", doc.id);

    const chunks = chunkMarkdown(body, title);
    const rows: Record<string, unknown>[] = [];
    for (let i = 0; i < chunks.length; i += 64) {
      const batch = chunks.slice(i, i + 64);
      const vectors = await embed(batch.map((c) => c.content), "document");
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
