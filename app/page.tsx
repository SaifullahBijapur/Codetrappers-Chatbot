"use client";

import { useCallback, useEffect, useLayoutEffect, useRef, useState, type ReactNode } from "react";
import ReactMarkdown, { type Components } from "react-markdown";
import * as I from "./icons";

type Source = { n: number; title: string; url: string | null; section: string | null };
type Msg = {
  role: "user" | "assistant";
  content: string;
  sources?: Source[];
  cited?: number[];
  logId?: string | null;
  feedback?: 1 | -1;
  error?: boolean;
  stopped?: boolean;
};

const MAX_LEN = 2000;

const STARTERS: { icon: (p: React.SVGProps<SVGSVGElement>) => ReactNode; label: string; prompt: string }[] = [
  { icon: I.Building, label: "Services", prompt: "What services does CodeTrappers offer?" },
  { icon: I.Briefcase, label: "Maintenance & retainers", prompt: "How does a monthly WordPress retainer work?" },
  { icon: I.Headset, label: "Get in touch", prompt: "How can I contact CodeTrappers or book a consultation?" },
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

const plainText = (s: string) => s.replace(/\s?\[\d+\]/g, "").trim();

function markdownComponents(sources: Source[] = []): Components {
  return {
    a: ({ node: _node, children, href, ...rest }) => {
      const label = Array.isArray(children) ? children.join("") : String(children ?? "");
      const cite = label.match(/^\[(\d+)\]$/);
      if (cite) {
        const s = sources[Number(cite[1]) - 1];
        const title = s ? (s.section && s.section !== s.title ? `${s.title} – ${s.section}` : s.title) : undefined;
        return href && href !== "#" ? (
          <a href={href} className="cite" title={title} target="_blank" rel="noreferrer">{cite[1]}</a>
        ) : (
          <span className="cite" title={title}>{cite[1]}</span>
        );
      }
      return <a href={href} {...rest} target="_blank" rel="noreferrer">{children}</a>;
    },
  };
}

export default function Home() {
  const [messages, setMessages] = useState<Msg[]>([]);
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);
  const [showJump, setShowJump] = useState(false);
  const [copied, setCopied] = useState<number | null>(null);

  const threadRef = useRef<HTMLElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const abortRef = useRef<AbortController | null>(null);
  const stickRef = useRef(true);

  // Follow the stream only while the reader is already at the bottom.
  useEffect(() => {
    const el = threadRef.current;
    if (el && messages.length > 0 && stickRef.current) el.scrollTop = el.scrollHeight;
  }, [messages]);

  // Auto-grow the composer.
  useLayoutEffect(() => {
    const ta = inputRef.current;
    if (!ta) return;
    ta.style.height = "auto";
    ta.style.height = `${Math.min(ta.scrollHeight, 200)}px`;
  }, [input]);

  useEffect(() => inputRef.current?.focus(), []);

  const onScroll = useCallback(() => {
    const el = threadRef.current;
    if (!el) return;
    const atBottom = el.scrollHeight - el.scrollTop - el.clientHeight < 80;
    stickRef.current = atBottom;
    setShowJump(!atBottom);
  }, []);

  function jumpToLatest() {
    const el = threadRef.current;
    if (!el) return;
    stickRef.current = true;
    el.scrollTo({ top: el.scrollHeight, behavior: "smooth" });
  }

  /** Stream an answer for `history`, which must end with a user message. */
  async function run(history: Msg[]) {
    const ctrl = new AbortController();
    abortRef.current = ctrl;
    stickRef.current = true;
    setBusy(true);
    setMessages([...history, { role: "assistant", content: "" }]);

    const patch = (fn: (m: Msg) => Msg) => {
      if (abortRef.current !== ctrl) return; // conversation was reset
      setMessages((prev) => prev.map((m, i) => (i === prev.length - 1 ? fn(m) : m)));
    };

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        signal: ctrl.signal,
        body: JSON.stringify({
          messages: history
            .filter((m) => !m.error && m.content)
            .map(({ role, content }) => ({ role, content })),
        }),
      });
      if (!res.ok || !res.body) {
        const j = await res.json().catch(() => ({}));
        throw new Error(j.error ?? "Request failed. Please try again.");
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
      if (ctrl.signal.aborted) {
        patch((m) => ({ ...m, stopped: true }));
      } else {
        patch((m) => ({ ...m, content: e instanceof Error ? e.message : "Something went wrong.", error: true }));
      }
    } finally {
      if (abortRef.current === ctrl) {
        abortRef.current = null;
        setBusy(false);
      }
    }
  }

  function send(text: string) {
    const question = text.trim();
    if (!question || busy) return;
    setInput("");
    run([...messages, { role: "user", content: question }]);
  }

  /** Re-ask the question that produced the assistant message at `index`. */
  function regenerate(index: number) {
    if (busy) return;
    run(messages.slice(0, index));
  }

  function stop() {
    abortRef.current?.abort();
  }

  function newChat() {
    abortRef.current?.abort();
    abortRef.current = null;
    setBusy(false);
    setMessages([]);
    setInput("");
    setShowJump(false);
    inputRef.current?.focus();
  }

  function rate(index: number, value: 1 | -1) {
    const m = messages[index];
    if (!m.logId || m.feedback) return;
    setMessages((prev) => prev.map((x, i) => (i === index ? { ...x, feedback: value } : x)));
    fetch("/api/feedback", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ logId: m.logId, feedback: value }),
    }).catch(() => {});
  }

  async function copy(index: number) {
    try {
      await navigator.clipboard.writeText(plainText(messages[index].content));
      setCopied(index);
      setTimeout(() => setCopied((c) => (c === index ? null : c)), 1600);
    } catch {
      /* clipboard unavailable */
    }
  }

  const empty = messages.length === 0;
  const lastIndex = messages.length - 1;

  return (
    <div className="app">
      <header className="topbar">
        <div className="topbar-inner">
          <div className="brand">
            <I.Logo className="brand-logo" width={28} height={28} />
            <span className="brand-name">CodeTrappers</span>
            <span className="brand-sep" aria-hidden />
            <span className="brand-sub">Help Assistant</span>
          </div>
          {!empty && (
            <button className="btn-ghost" onClick={newChat}>
              <I.Plus width={16} height={16} />
              <span>New chat</span>
            </button>
          )}
        </div>
      </header>

      <main ref={threadRef} className="thread" onScroll={onScroll}>
        <div className="column">
          {empty ? (
            <section className="welcome">
              <div className="welcome-mark"><I.Logo width={44} height={44} /></div>
              <h1>How can we help you today?</h1>
              <p>
                Ask about our WordPress, WooCommerce and AI services, past projects, pricing or how to get started. Every answer is drawn from
                official CodeTrappers pages and links back to its source.
              </p>
              <div className="starters">
                {STARTERS.map(({ icon: Icon, label, prompt }) => (
                  <button key={label} className="starter" onClick={() => send(prompt)}>
                    <span className="starter-icon"><Icon /></span>
                    <span className="starter-text">
                      <span className="starter-label">{label}</span>
                      <span className="starter-prompt">{prompt}</span>
                    </span>
                  </button>
                ))}
              </div>
            </section>
          ) : (
            <ol className="messages" aria-live="polite">
              {messages.map((m, i) =>
                m.role === "user" ? (
                  <li key={i} className="row row-user">
                    <div className="bubble">{m.content}</div>
                  </li>
                ) : (
                  <li key={i} className="row row-bot">
                    <div className="avatar" aria-hidden><I.Logo width={30} height={30} /></div>
                    <div className="bot-body">
                      <div className="bot-name">Assistant</div>

                      {m.error ? (
                        <div className="alert" role="alert">
                          <I.Alert width={18} height={18} />
                          <span>{m.content}</span>
                          {!busy && (
                            <button className="alert-retry" onClick={() => regenerate(i)}>
                              <I.Refresh width={14} height={14} /> Try again
                            </button>
                          )}
                        </div>
                      ) : m.content ? (
                        <div className={`prose${busy && i === lastIndex ? " streaming" : ""}`}>
                          <ReactMarkdown components={markdownComponents(m.sources)}>
                            {linkCitations(m.content, m.sources)}
                          </ReactMarkdown>
                        </div>
                      ) : m.stopped ? (
                        <p className="muted-note">Response stopped.</p>
                      ) : (
                        <div className="thinking">
                          <span className="dots" aria-hidden><i /><i /><i /></span>
                          <span>{m.sources ? "Writing an answer…" : "Searching CodeTrappers content…"}</span>
                        </div>
                      )}

                      {m.stopped && m.content && <p className="muted-note">Response stopped.</p>}

                      {m.cited && m.cited.length > 0 && m.sources && (
                        <div className="sources">
                          <div className="sources-title">Sources</div>
                          <ul>
                            {m.cited.map((n) => {
                              const s = m.sources![n - 1];
                              if (!s) return null;
                              const inner = (
                                <>
                                  <span className="source-n">{n}</span>
                                  <span className="source-text">
                                    <span className="source-title">{s.title}</span>
                                    {s.section && s.section !== s.title && <span className="source-sec">{s.section}</span>}
                                  </span>
                                  {s.url ? <I.External className="source-ext" width={14} height={14} /> : <I.Doc className="source-ext" width={14} height={14} />}
                                </>
                              );
                              return (
                                <li key={n}>
                                  {s.url ? (
                                    <a className="source" href={s.url} target="_blank" rel="noreferrer">{inner}</a>
                                  ) : (
                                    <div className="source">{inner}</div>
                                  )}
                                </li>
                              );
                            })}
                          </ul>
                        </div>
                      )}

                      {!m.error && m.content && !(busy && i === lastIndex) && (
                        <div className="actions">
                          <button className="icon-btn" onClick={() => copy(i)} aria-label="Copy answer" title="Copy">
                            {copied === i ? <I.Check width={16} height={16} /> : <I.Copy width={16} height={16} />}
                          </button>
                          {i === lastIndex && (
                            <button className="icon-btn" onClick={() => regenerate(i)} disabled={busy} aria-label="Regenerate answer" title="Regenerate">
                              <I.Refresh width={16} height={16} />
                            </button>
                          )}
                          {m.logId && (
                            <>
                              <span className="actions-sep" aria-hidden />
                              <button
                                className={`icon-btn${m.feedback === 1 ? " on" : ""}`}
                                disabled={!!m.feedback}
                                onClick={() => rate(i, 1)}
                                aria-label="Helpful"
                                aria-pressed={m.feedback === 1}
                                title="Helpful"
                              >
                                <I.ThumbUp width={16} height={16} />
                              </button>
                              <button
                                className={`icon-btn${m.feedback === -1 ? " on" : ""}`}
                                disabled={!!m.feedback}
                                onClick={() => rate(i, -1)}
                                aria-label="Not helpful"
                                aria-pressed={m.feedback === -1}
                                title="Not helpful"
                              >
                                <I.ThumbDown width={16} height={16} />
                              </button>
                              {m.feedback && <span className="thanks">Thanks for the feedback</span>}
                            </>
                          )}
                        </div>
                      )}
                    </div>
                  </li>
                )
              )}
            </ol>
          )}
        </div>
      </main>

      <footer className="dock">
        <div className="column">
          {showJump && !empty && (
            <button className="jump" onClick={jumpToLatest} aria-label="Jump to latest message">
              <I.ArrowDown width={16} height={16} />
            </button>
          )}
          <form
            className="composer"
            onSubmit={(e) => {
              e.preventDefault();
              send(input);
            }}
          >
            <label htmlFor="ask" className="sr-only">Your question</label>
            <textarea
              id="ask"
              ref={inputRef}
              value={input}
              rows={1}
              maxLength={MAX_LEN}
              placeholder="Ask about services, projects, WordPress help or getting in touch…"
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey && !e.nativeEvent.isComposing) {
                  e.preventDefault();
                  send(input);
                } else if (e.key === "Escape" && busy) {
                  stop();
                }
              }}
            />
            {busy ? (
              <button type="button" className="send stop" onClick={stop} aria-label="Stop generating" title="Stop">
                <I.Stop width={16} height={16} />
              </button>
            ) : (
              <button type="submit" className="send" disabled={!input.trim()} aria-label="Send message" title="Send">
                <I.Send width={18} height={18} />
              </button>
            )}
          </form>
          <div className="footnote">
            <span>Answers come from codetrappers.com and can be wrong. Check the cited sources.</span>
            {input.length > MAX_LEN * 0.8 && (
              <span className={`count${input.length >= MAX_LEN ? " max" : ""}`}>{input.length}/{MAX_LEN}</span>
            )}
          </div>
        </div>
      </footer>
    </div>
  );
}
