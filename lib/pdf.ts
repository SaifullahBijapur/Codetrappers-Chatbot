/**
 * PDF storage format for knowledge-base documents (used by scripts only, not the web app).
 *
 * writePdf():  Markdown -> PDF. Headings are rendered at fixed font sizes and the
 *              document's url/access/type are stored in the PDF Keywords field.
 * readPdf():   PDF -> { meta, markdown }. Font sizes are mapped back to Markdown
 *              headings so the heading-aware chunker keeps working.
 *
 * Output is deterministic (fixed dates, same input -> same bytes), so the ingest
 * hash check still skips unchanged files.
 */
import fs from "node:fs";
import path from "node:path";
import PDFDocument from "pdfkit";

export type DocMeta = { title: string; url?: string; access?: string; type?: string; description?: string };

// Font sizes double as the heading "protocol" between writer and reader.
const SIZES = { h1: 20, h2: 16, h3: 13.5, h4: 12, body: 10.5, code: 9 } as const;
const FIXED_DATE = new Date(Date.UTC(2000, 0, 1));
const COLORS = { ink: "#111827", muted: "#6b7280", link: "#2b50e0", rule: "#e3e6eb" };

const FONT_DIR = path.join(process.cwd(), "node_modules", "dejavu-fonts-ttf", "ttf");
const FONTS = {
  regular: path.join(FONT_DIR, "DejaVuSans.ttf"),
  bold: path.join(FONT_DIR, "DejaVuSans-Bold.ttf"),
  mono: path.join(FONT_DIR, "DejaVuSansMono.ttf"),
};

/* ------------------------------------------------------------------ */
/* Writing                                                             */
/* ------------------------------------------------------------------ */

type Seg = { text: string; bold?: boolean; link?: string };

/**
 * Remove characters the embedded font cannot draw (emoji, keycap/variation
 * selectors, zero-width joiners) and control characters. Undrawable glyphs would
 * otherwise come back from extraction as U+0000, which Postgres rejects.
 */
export const cleanText = (s: string) =>
  s
    .replace(/\p{Extended_Pictographic}|[\u{1F1E6}-\u{1F1FF}\u{1F3FB}-\u{1F3FF}︎️⃣‍]/gu, "")
    .replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F�]/g, " ");

const unescapeMd = (s: string) => s.replace(/\\([\\`*_{}\[\]()#+\-.!|>~])/g, "$1");

/** Split a Markdown line into styled segments: **bold**, [text](url), `code`. */
function inlineSegments(line: string): Seg[] {
  const segs: Seg[] = [];
  const re = /\*\*(.+?)\*\*|\[([^\]]+)\]\(([^)\s]+)\)|`([^`]+)`/g;
  let last = 0;
  for (const m of line.matchAll(re)) {
    if (m.index! > last) segs.push({ text: line.slice(last, m.index) });
    if (m[1] !== undefined) segs.push(...inlineSegments(m[1]).map((s) => ({ ...s, bold: true })));
    else if (m[2] !== undefined) {
      const text = m[2].replace(/\*\*/g, "");
      const url = m[3];
      segs.push({ text, link: url });
      // Keep web URLs visible in the text so they survive extraction and can be cited.
      if (/^https?:/.test(url) && !text.includes(url)) segs.push({ text: ` (${url})` });
    } else segs.push({ text: m[4] });
    last = m.index! + m[0].length;
  }
  if (last < line.length) segs.push({ text: line.slice(last) });
  return segs.map((s) => ({ ...s, text: unescapeMd(s.text).replace(/(^|\s)\*([^*]+)\*/g, "$1$2") }));
}

function writeInline(doc: PDFKit.PDFDocument, segs: Seg[], opts: PDFKit.Mixins.TextOptions, size: number) {
  const parts = segs.filter((s) => s.text);
  if (!parts.length) return;
  parts.forEach((s, i) => {
    doc
      .font(s.bold ? "bold" : "regular")
      .fontSize(size)
      .fillColor(s.link ? COLORS.link : COLORS.ink)
      .text(s.text, { ...opts, continued: i < parts.length - 1, link: s.link ?? null, underline: false });
  });
  doc.fillColor(COLORS.ink);
}

export function writePdf(markdown: string, meta: DocMeta): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({
      size: "A4",
      margins: { top: 64, bottom: 64, left: 64, right: 64 },
      bufferPages: false,
      info: {
        Title: cleanText(meta.title),
        Subject: cleanText(meta.description ?? ""),
        Keywords: [`url=${meta.url ?? ""}`, `access=${meta.access ?? "public"}`, `type=${meta.type ?? "page"}`].join("; "),
        Author: "CodeTrappers",
        Creator: "codetrappers-chatbot scraper",
        CreationDate: FIXED_DATE,
        ModDate: FIXED_DATE,
      },
    });
    const chunks: Buffer[] = [];
    doc.on("data", (b: Buffer) => chunks.push(b));
    doc.on("end", () => resolve(Buffer.concat(chunks)));
    doc.on("error", reject);

    doc.registerFont("regular", FONTS.regular);
    doc.registerFont("bold", FONTS.bold);
    doc.registerFont("mono", FONTS.mono);

    const left = doc.page.margins.left;
    const fullWidth = () => doc.page.width - doc.page.margins.left - doc.page.margins.right;
    const gap = (n = 0.6) => doc.moveDown(n);

    // Source line under the title area
    if (meta.url) {
      doc.font("regular").fontSize(8.5).fillColor(COLORS.muted).text(`Source: ${meta.url}`, { link: meta.url });
      doc.fillColor(COLORS.ink);
      gap(1);
    }

    const lines = cleanText(markdown.replace(/\r\n/g, "\n")).split("\n");
    let para: string[] = [];
    const flushPara = () => {
      if (!para.length) return;
      doc.x = left;
      writeInline(doc, inlineSegments(para.join(" ")), { width: fullWidth(), lineGap: 3 }, SIZES.body);
      gap();
      para = [];
    };

    let inCode = false;
    let code: string[] = [];
    let afterItem = false; // add a paragraph-sized gap when a list ends
    for (const raw of lines) {
      if (raw.trim().startsWith("```")) {
        if (inCode) {
          doc.x = left;
          doc.font("mono").fontSize(SIZES.code).fillColor("#1f2937").text(code.join("\n") || " ", { width: fullWidth(), lineGap: 2 });
          doc.fillColor(COLORS.ink);
          gap();
          code = [];
        } else flushPara();
        inCode = !inCode;
        continue;
      }
      if (inCode) {
        code.push(raw);
        continue;
      }

      const line = raw.replace(/\s+$/, "");
      if (!line.trim()) {
        flushPara();
        if (afterItem) gap(0.5);
        afterItem = false;
        continue;
      }
      afterItem = false;

      // Headings, including ones nested in list items ("1.  ### Title").
      const h = /^\s*(?:(?:[-*+]|\d+\.)\s+)?(#{1,6})\s+(.*)$/.exec(line);
      if (h) {
        flushPara();
        const level = Math.min(h[1].length, 4) as 1 | 2 | 3 | 4;
        const size = SIZES[`h${level}`];
        doc.x = left;
        if (level <= 2) gap(0.4);
        doc.font("bold").fontSize(size).fillColor(COLORS.ink).text(unescapeMd(h[2].replace(/\*\*/g, "")), { width: fullWidth(), lineGap: 2 });
        if (level === 1) {
          const y = doc.y + 4;
          doc.moveTo(left, y).lineTo(left + fullWidth(), y).lineWidth(0.6).strokeColor(COLORS.rule).stroke();
          gap(0.6);
        }
        gap(0.4);
        continue;
      }

      // List items: "-   text" / "1.  text", indented by 4 spaces per level.
      const li = /^(\s*)([-*+]|\d+\.)\s+(.*)$/.exec(line);
      if (li) {
        flushPara();
        const depth = Math.floor(li[1].replace(/\t/g, "    ").length / 4);
        const marker = /\d/.test(li[2]) ? li[2] : "•";
        const indent = 12 + depth * 16;
        doc.x = left + indent;
        writeInline(doc, [{ text: `${marker}  ` }, ...inlineSegments(li[3])], { width: fullWidth() - indent, lineGap: 3 }, SIZES.body);
        doc.moveDown(0.25);
        doc.x = left;
        afterItem = true;
        continue;
      }

      // Indented continuation of a list item, or ordinary paragraph text.
      para.push(line.trim());
    }
    flushPara();
    doc.end();
  });
}

/* ------------------------------------------------------------------ */
/* Reading                                                             */
/* ------------------------------------------------------------------ */

type Line = { text: string; size: number; y: number; page: number };

function headingPrefix(size: number) {
  if (size >= SIZES.h1 - 1) return "# ";
  if (size >= SIZES.h2 - 1) return "## ";
  if (size >= SIZES.h3 - 0.5) return "### ";
  if (size >= SIZES.h4 - 0.3) return "#### ";
  return "";
}

export async function readPdf(data: Buffer | Uint8Array): Promise<{ meta: DocMeta; markdown: string }> {
  const { getDocument } = await import("pdfjs-dist/legacy/build/pdf.mjs");
  const task = getDocument({ data: new Uint8Array(data), verbosity: 0 });
  const pdf = await task.promise;

  const info = ((await pdf.getMetadata()).info ?? {}) as Record<string, string>;
  const kw: Record<string, string> = {};
  for (const part of (info.Keywords ?? "").split(";")) {
    const i = part.indexOf("=");
    if (i > 0) kw[part.slice(0, i).trim()] = part.slice(i + 1).trim();
  }
  const meta: DocMeta = {
    title: cleanText(info.Title ?? "").trim(),
    url: kw.url || undefined,
    access: kw.access || undefined,
    type: kw.type || undefined,
    description: cleanText(info.Subject ?? "").trim() || undefined,
  };

  // Rebuild visual lines from text items.
  const lines: Line[] = [];
  for (let p = 1; p <= pdf.numPages; p++) {
    const page = await pdf.getPage(p);
    const tc = await page.getTextContent();
    let cur: Line | null = null;
    for (const item of tc.items as { str: string; height: number; transform: number[] }[]) {
      if (typeof item.str !== "string") continue;
      const y = item.transform[5];
      if (!cur || Math.abs(y - cur.y) > 1) {
        if (cur && cur.text.trim()) lines.push(cur);
        cur = { text: "", size: 0, y, page: p };
      }
      cur.text += item.str;
      if (item.str.trim()) cur.size = Math.max(cur.size, item.height);
    }
    if (cur && cur.text.trim()) lines.push(cur);
    page.cleanup();
  }
  await task.destroy();

  // Turn lines into Markdown: headings from size, bullets from "•", blank lines from vertical gaps.
  const out: string[] = [];
  let skippedSource = false;
  for (let i = 0; i < lines.length; i++) {
    const l = lines[i];
    let text = cleanText(l.text).replace(/\s+/g, " ").trim();
    if (!skippedSource && i === 0 && text.startsWith("Source: ")) {
      skippedSource = true;
      continue;
    }
    const prev = lines[i - 1];
    const h = headingPrefix(l.size);
    const prevWasHeading = prev ? headingPrefix(prev.size) !== "" : false;
    const gapBefore = prev && prev.page === l.page ? prev.y - l.y : 0;
    const paraBreak = gapBefore > l.size * 1.9;

    if (text.startsWith("• ") || text === "•") text = `- ${text.slice(1).trim()}`;
    const isItem = /^(- |\d+\.\s)/.test(text);

    // Index of the last non-blank output line (target for unwrapping).
    let lastIdx = out.length - 1;
    while (lastIdx >= 0 && out[lastIdx] === "") lastIdx--;

    if (h) {
      // Consecutive heading lines of the same size are one wrapped heading.
      if (prev && prevWasHeading && headingPrefix(prev.size) === h && !paraBreak && lastIdx >= 0) {
        out[lastIdx] += ` ${text}`;
        continue;
      }
      out.push("", h + text, "");
      continue;
    }
    if (paraBreak || prevWasHeading || lastIdx < 0) {
      if (out.length && out[out.length - 1] !== "") out.push("");
      out.push(text);
      continue;
    }
    if (isItem) {
      // New list item: own line; blank line before the first item of a list.
      if (!/^(- |\d+\.\s)/.test(out[lastIdx])) out.push("");
      out.push(text);
      continue;
    }
    // Wrapped continuation line: unwrap into the previous line. Inside an open
    // "(http..." URL, join without a space so links stay intact.
    const prevLine = out[lastIdx];
    const openUrl = prevLine.lastIndexOf("(http") > prevLine.lastIndexOf(")");
    out[lastIdx] = prevLine + (openUrl ? "" : " ") + text;
  }

  const markdown = out.join("\n").replace(/\n{3,}/g, "\n\n").trim() + "\n";
  return { meta, markdown };
}

/** Convenience for scripts: read a PDF file from disk. */
export async function readPdfFile(file: string) {
  return readPdf(fs.readFileSync(file));
}
