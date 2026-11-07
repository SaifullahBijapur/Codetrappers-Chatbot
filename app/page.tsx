"use client";

import { useEffect, useRef, useState } from "react";
import ReactMarkdown from "react-markdown";

type Source = { n: number; title: string; url: string | null; section: string | null };
type Msg = {
  role: "user" | "assistant";
  content: string;
  sources?: Source[];
  cited?: number[];
  logId?: string | null;
  feedback?: 1 | -1;
  error?: boolean;
};

const STARTERS = [
  "What does CodeTrappers offer?",
  "How do I get a refund?",
  "How can I contact support?",
];

/** Turn [n] markers into links to the matching source, leaving code untouched. */
function linkCitations(text: string, sources: Source[] = []) {
  return text
    .split(/(```[\s\S]*?```|`[^`\n]*`)/g)
    .map((part, i) =>
      i % 2 === 1
        ? part
        : part.replace(/\[(\d+)\]/g, (m, n) => {
            const s = sources[Number(n) - 1];
            if (!s) return m;
            const href = (s.url ?? "#").replace(/\(/g, "%28").replace(/\)/g, "%29").replace(/ /g, "%20");
            return `[[${n}]](${href})`;
          })
    )
    .join("");
}

export default function Home() {
  const [messages, setMessages] = useState<Msg[]>([]);
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [messages]);

  async function send(text: string) {
    const question = text.trim();
    if (!question || busy) return;
    setInput("");
    setBusy(true);
    const history: Msg[] = [...messages, { role: "user", content: question }];
    setMessages([...history, { role: "assistant", content: "" }]);

    const patch = (fn: (m: Msg) => Msg) =>
      setMessages((prev) => prev.map((m, i) => (i === prev.length - 1 ? fn(m) : m)));

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: history.map(({ role, content }) => ({ role, content })) }),
      });
      if (!res.ok || !res.body) {
        const j = await res.json().catch(() => ({}));
        throw new Error(j.error ?? "Request failed");
      }
      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let buf = "";
      for (;;) {
        const { value, done } = await reader.read();
        if (done) break;
        buf += decoder.decode(value, { stream: true });
        const lines = buf.split("\n");
        buf = lines.pop() ?? "";
        for (const line of lines) {
          if (!line.trim()) continue;
          const ev = JSON.parse(line);
          if (ev.type === "sources") patch((m) => ({ ...m, sources: ev.sources }));
          else if (ev.type === "text") patch((m) => ({ ...m, content: m.content + ev.text }));
          else if (ev.type === "done") patch((m) => ({ ...m, cited: ev.cited, logId: ev.logId }));
          else if (ev.type === "error") patch((m) => ({ ...m, content: ev.message, error: true }));
        }
      }
    } catch (e) {
      patch((m) => ({ ...m, content: e instanceof Error ? e.message : "Something went wrong.", error: true }));
    } finally {
      setBusy(false);
    }
  }

  async function rate(index: number, value: 1 | -1) {
    const m = messages[index];
    if (!m.logId || m.feedback) return;
    setMessages((prev) => prev.map((x, i) => (i === index ? { ...x, feedback: value } : x)));
    fetch("/api/feedback", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ logId: m.logId, feedback: value }),
    }).catch(() => {});
  }

  return (
    <div className="shell">
      <header className="top">
        <span className="brand">CodeTrappers</span>
        <span className="sub">Assistant</span>
      </header>

      <main className="thread" aria-live="polite">
        {messages.length === 0 && (
          <section className="empty">
            <h1>Ask anything about CodeTrappers.</h1>
            <p>Courses, pricing, billing, accounts and support. Answers come from CodeTrappers' own pages, with a link to the source.</p>
            <div className="starters">
              {STARTERS.map((s) => (
                <button key={s} onClick={() => send(s)}>{s}</button>
              ))}
            </div>
          </section>
        )}

        {messages.map((m, i) =>
          m.role === "user" ? (
            <div key={i} className="msg user">{m.content}</div>
          ) : (
            <div key={i} className={`msg bot${m.error ? " err" : ""}`}>
              {m.content ? (
                <ReactMarkdown
                  components={{ a: (props) => <a {...props} target="_blank" rel="noreferrer" /> }}
                >
                  {linkCitations(m.content, m.sources)}
                </ReactMarkdown>
              ) : (
                <span className="dots" aria-label="Thinking"><i /><i /><i /></span>
              )}

              {m.cited && m.cited.length > 0 && m.sources && (
                <ul className="sources">
                  {m.cited.map((n) => {
                    const s = m.sources![n - 1];
                    return (
                      <li key={n}>
                        <span className="n">{n}</span>
                        {s.url ? <a href={s.url} target="_blank" rel="noreferrer">{s.title}</a> : s.title}
                        {s.section && s.section !== s.title && <span className="sec"> – {s.section}</span>}
                      </li>
                    );
                  })}
                </ul>
              )}

              {m.logId && (
                <div className="rate">
                  <button disabled={!!m.feedback} className={m.feedback === 1 ? "on" : ""} onClick={() => rate(i, 1)} aria-label="Helpful">Helpful</button>
                  <button disabled={!!m.feedback} className={m.feedback === -1 ? "on" : ""} onClick={() => rate(i, -1)} aria-label="Not helpful">Not helpful</button>
                </div>
              )}
            </div>
          )
        )}
        <div ref={bottomRef} />
      </main>

      <footer className="composer">
        <textarea
          value={input}
          rows={1}
          maxLength={2000}
          placeholder="Ask about courses, pricing, billing or support"
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); send(input); }
          }}
        />
        <button onClick={() => send(input)} disabled={busy || !input.trim()}>Send</button>
      </footer>
    </div>
  );
}
