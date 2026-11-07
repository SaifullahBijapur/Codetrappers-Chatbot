/**
 * Website scraper: crawls codetrappers.com via its sitemaps and saves each page
 * as a PDF in ./content/website/<type>/<slug>.pdf, ready for `npm run ingest`.
 *
 * Pages are cleaned and converted to Markdown first, then rendered to PDF by
 * lib/pdf.ts, which stores title/url/access/type in the PDF metadata and uses a
 * fixed heading-size scale so ingest can rebuild the document structure.
 *
 *   npm run scrape                       # whole site
 *   npm run scrape -- --limit 10         # quick test run
 *   npm run scrape -- --only page,guide  # only some content types
 *
 * Output is deterministic (fixed PDF dates), so unchanged pages keep the same hash
 * and ingest skips them. Pages that disappear from the sitemap are deleted, and
 * ingest then removes them from the index.
 */
import fs from "node:fs";
import path from "node:path";
import * as cheerio from "cheerio";
import TurndownService from "turndown";
import { writePdf, type DocMeta } from "../lib/pdf";

const SITE = process.env.SCRAPE_SITE ?? "https://codetrappers.com";
const OUT_DIR = path.join(process.cwd(), "content", "website");
const UA = "CodeTrappersAssistantBot/1.0 (+https://codetrappers.com)";
const CONCURRENCY = 4;
const DELAY_MS = 250;
const MIN_CHARS = 200;

/** Map sitemap name -> content type (also the output sub-folder). null = skip. */
const SITEMAP_TYPES: Record<string, string | null> = {
  page: "page",
  post: "article",
  guides: "guide",
  casestudies: "case-study",
  research: "research",
  white_papers: "white-paper",
  showcase: "showcase",
  jobs: "job",
  category: null, // listing pages only, no unique content
};

const args = process.argv.slice(2);
const argVal = (name: string) => {
  const i = args.indexOf(`--${name}`);
  return i >= 0 ? args[i + 1] : undefined;
};
const LIMIT = Number(argVal("limit") ?? Infinity);
const ONLY = argVal("only")?.split(",").map((s) => s.trim());

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

async function get(url: string, tries = 3): Promise<string> {
  for (let attempt = 1; ; attempt++) {
    try {
      const res = await fetch(url, { headers: { "User-Agent": UA }, redirect: "follow" });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      return await res.text();
    } catch (e) {
      if (attempt >= tries) throw new Error(`${url}: ${e instanceof Error ? e.message : e}`);
      await sleep(1000 * attempt);
    }
  }
}

const locs = (xml: string) => [...xml.matchAll(/<loc>\s*([^<\s]+)\s*<\/loc>/g)].map((m) => m[1]);

async function collectUrls(): Promise<{ url: string; type: string }[]> {
  const index = await get(`${SITE}/sitemap_index.xml`);
  const out: { url: string; type: string }[] = [];
  const seen = new Set<string>();
  for (const sm of locs(index)) {
    const key = /\/([a-z_]+)-sitemap\d*\.xml$/i.exec(sm)?.[1] ?? "";
    const type = key in SITEMAP_TYPES ? SITEMAP_TYPES[key] : "page";
    if (!type || (ONLY && !ONLY.includes(type))) continue;
    for (const url of locs(await get(sm))) {
      if (/\.(jpe?g|png|gif|webp|svg|pdf)$/i.test(url) || seen.has(url)) continue;
      seen.add(url);
      out.push({ url, type });
    }
  }
  return out;
}

const td = new TurndownService({
  headingStyle: "atx",
  bulletListMarker: "-",
  codeBlockStyle: "fenced",
  emDelimiter: "*",
});
// Drop links whose text is empty (icon links), keep text-only for anchors/JS links.
td.addRule("cleanLinks", {
  filter: "a",
  replacement: (content, node) => {
    const text = content.trim();
    if (!text) return "";
    const href = (node as HTMLAnchorElement).getAttribute("href") ?? "";
    if (!href || href.startsWith("#") || href.startsWith("javascript:")) return text;
    const abs = href.startsWith("/") ? SITE + href : href;
    return `[${text}](${abs})`;
  },
});

function cleanTitle(t: string) {
  return t.replace(/\s*[|–-]\s*CodeTrappers\s*$/i, "").replace(/\s+/g, " ").trim();
}

function toMarkdown(html: string, url: string) {
  const $ = cheerio.load(html);
  const title = cleanTitle(
    $('meta[property="og:title"]').attr("content") || $("title").text() || $("h1").first().text() || url
  );
  const description = ($('meta[name="description"]').attr("content") ?? "").trim();

  const root = $("main#main").length ? $("main#main") : $("main").length ? $("main").first() : $("body");
  root
    .find(
      "script, style, noscript, template, svg, img, picture, video, iframe, form, button, input, select, textarea, " +
        "nav, .breadcrumb, [aria-hidden='true'], .ct-chat, [class*='ct-chat'], .screen-reader-text"
    )
    .remove();
  // Boilerplate repeated on every article: related-post teasers, sidebar CTA, post footer.
  root.find(".article__aside, [class^='postfoot'], [class*=' postfoot']").remove();
  root.find("section").filter((_, el) => /^\s*Keep reading\s*$/i.test($(el).find(".eyebrow").first().text())).remove();

  let md = td.turndown(root.html() ?? "");
  md = md
    .split("\n")
    .map((l) => l.replace(/\s+$/g, ""))
    .filter((l) => !/^\s*[-*]\s*$/.test(l)) // empty bullets
    .join("\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();

  // Ensure the document starts with a single H1 title so chunk headers make sense.
  if (!/^#\s/.test(md)) md = `# ${title}\n\n${md}`;
  if (description && !md.includes(description.slice(0, 60))) {
    md = md.replace(/^(# .*\n)/, `$1\n${description}\n`);
  }
  return { title, description, md };
}

async function save(rel: string, md: string, meta: DocMeta) {
  const file = path.join(OUT_DIR, rel);
  fs.mkdirSync(path.dirname(file), { recursive: true });
  fs.writeFileSync(file, await writePdf(md, meta));
}

function slugFor(url: string) {
  const p = new URL(url).pathname.replace(/^\/+|\/+$/g, "");
  return (p || "home").replace(/[^a-z0-9/_-]+/gi, "-").split("/").pop()!.toLowerCase() || "home";
}

async function main() {
  console.log(`Reading sitemaps from ${SITE} …`);
  let targets = await collectUrls();
  if (Number.isFinite(LIMIT)) targets = targets.slice(0, LIMIT);
  console.log(`${targets.length} pages to fetch\n`);

  const written = new Set<string>();
  const failed: string[] = [];
  let skipped = 0;
  let next = 0;

  // The site footer (outside <main>) holds phone, email, address and legal entity:
  // save it once as its own document.
  if (!ONLY || ONLY.includes("page")) {
    try {
      const $ = cheerio.load(await get(`${SITE}/`));
      const footer = $("footer.footer");
      footer.find("script, style, noscript, svg, img, form, button, [class*='ct-chat']").remove();
      const md = td.turndown(footer.html() ?? "").replace(/\n{3,}/g, "\n\n").trim();
      if (md) {
        const rel = path.join("page", "contact-details.pdf");
        const title = "CodeTrappers Contact Details and Site Directory";
        const description =
          "Phone, email, office address, social profiles, legal entity and the full list of services and solutions, as shown in the footer of every page on codetrappers.com.";
        await save(rel, `# ${title}\n\n${description}\n\n${md}\n`, {
          title, description, url: `${SITE}/contact/`, access: "public", type: "page",
        });
        written.add(rel);
        console.log(`saved    ${rel} (site footer)`);
      }
    } catch (e) {
      console.warn(`footer   ${e instanceof Error ? e.message : e}`);
    }
  }

  async function worker() {
    while (next < targets.length) {
      const { url, type } = targets[next++];
      try {
        const { title, description, md } = toMarkdown(await get(url), url);
        const bodyChars = md.replace(/^# .*$/m, "").trim().length;
        if (bodyChars < MIN_CHARS) {
          skipped++;
          console.log(`thin     ${url}`);
          continue;
        }
        let rel = path.join(type, `${slugFor(url)}.pdf`);
        if (written.has(rel)) rel = path.join(type, `${slugFor(url)}-${written.size}.pdf`);
        written.add(rel); // reserve the name before the async write
        await save(rel, md, { title, description, url, access: "public", type });
        console.log(`saved    ${rel} (${bodyChars} chars)`);
      } catch (e) {
        failed.push(url);
        console.warn(`failed   ${e instanceof Error ? e.message : e}`);
      }
      await sleep(DELAY_MS);
    }
  }
  await Promise.all(Array.from({ length: CONCURRENCY }, worker));

  // Remove files for pages no longer on the site (full runs only).
  let removed = 0;
  if (!Number.isFinite(LIMIT) && !ONLY && failed.length === 0 && fs.existsSync(OUT_DIR)) {
    const walk = (d: string): string[] =>
      fs.readdirSync(d, { withFileTypes: true }).flatMap((e) =>
        e.isDirectory() ? walk(path.join(d, e.name)) : [path.join(d, e.name)]
      );
    for (const f of walk(OUT_DIR)) {
      if (!written.has(path.relative(OUT_DIR, f))) {
        fs.unlinkSync(f);
        removed++;
      }
    }
  }

  console.log(`\nDone: ${written.size} saved, ${skipped} too thin, ${failed.length} failed, ${removed} stale removed.`);
  if (failed.length) process.exitCode = 1;
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
