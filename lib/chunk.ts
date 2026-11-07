export type Chunk = { content: string; section: string };

const MAX_CHARS = 2000; // roughly 500 tokens
const OVERLAP_CHARS = 250;

type Section = { path: string[]; lines: string[] };

/** Split markdown into heading-based sections (headings inside code fences are ignored). */
function splitSections(md: string): Section[] {
  const sections: Section[] = [];
  const stack: string[] = [];
  let cur: Section = { path: [], lines: [] };
  let inCode = false;
  for (const line of md.split("\n")) {
    if (line.trim().startsWith("```")) inCode = !inCode;
    const m = !inCode ? /^(#{1,4})\s+(.*)$/.exec(line) : null;
    if (m) {
      if (cur.lines.join("\n").trim()) sections.push(cur);
      const depth = m[1].length;
      stack.length = depth - 1;
      stack[depth - 1] = m[2].trim();
      cur = { path: [...stack].filter(Boolean), lines: [line] };
    } else {
      cur.lines.push(line);
    }
  }
  if (cur.lines.join("\n").trim()) sections.push(cur);
  return sections;
}

/** Break a section into blocks: paragraphs and whole code fences (never split). */
function toBlocks(lines: string[]): string[] {
  const blocks: string[] = [];
  let buf: string[] = [];
  let inCode = false;
  const flush = () => {
    const t = buf.join("\n").trim();
    if (t) blocks.push(t);
    buf = [];
  };
  for (const line of lines) {
    if (line.trim().startsWith("```")) inCode = !inCode;
    if (!inCode && line.trim() === "" && !line.trim().startsWith("```")) {
      flush();
    } else {
      buf.push(line);
    }
  }
  flush();
  return blocks;
}

function splitLongProse(block: string): string[] {
  if (block.length <= MAX_CHARS || block.startsWith("```")) return [block];
  const parts: string[] = [];
  for (let i = 0; i < block.length; i += MAX_CHARS - OVERLAP_CHARS) {
    parts.push(block.slice(i, i + MAX_CHARS));
  }
  return parts;
}

export function chunkMarkdown(md: string, docTitle: string): Chunk[] {
  const out: Chunk[] = [];
  for (const sec of splitSections(md)) {
    const section = sec.path.join(" > ") || docTitle;
    const blocks = toBlocks(sec.lines).flatMap(splitLongProse);
    let current: string[] = [];
    let size = 0;
    const emit = () => {
      if (!current.length) return;
      const body = current.join("\n\n");
      // Contextual header improves retrieval of otherwise ambiguous chunks.
      out.push({ section, content: `${docTitle} > ${section}\n\n${body}` });
      const last = current[current.length - 1];
      current = last.length <= OVERLAP_CHARS && !last.startsWith("```") ? [last] : [];
      size = current.join("\n\n").length;
    };
    for (const b of blocks) {
      if (size + b.length > MAX_CHARS && current.length) emit();
      current.push(b);
      size += b.length + 2;
    }
    // Final emit without carrying overlap into the next section
    if (current.length) {
      const body = current.join("\n\n");
      out.push({ section, content: `${docTitle} > ${section}\n\n${body}` });
    }
  }
  return out;
}
