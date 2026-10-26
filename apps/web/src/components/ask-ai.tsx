"use client";
import { useChat } from "@ai-sdk/react";
import { DefaultChatTransport, type UIMessage } from "ai";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Fragment, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { ArrowUp, RotateCcw, Sparkles, Square, X } from "lucide-react";
import type { Card } from "@/lib/ask-tools";

const SUGGESTIONS = [
  "2 BHK flat for rent in Kondapur under 40k",
  "Verified plots in Kokapet below 2 crore",
  "Office space for lease in Gachibowli",
  "EMI for a 1.2 crore home, 20 years",
];

/** Bold text and links only; everything else stays plain text, so model output can never inject markup. */
function inline(text: string): ReactNode[] {
  const out: ReactNode[] = [];
  const re = /\*\*(.+?)\*\*(?!\*)|\[([^\]]+)\]\(([^)\s]+)\)/g;
  let last = 0;
  let m: RegExpExecArray | null;
  let k = 0;
  while ((m = re.exec(text))) {
    if (m.index > last) out.push(text.slice(last, m.index));
    if (m[1]) out.push(<strong key={k++} className="font-semibold text-white">{inline(m[1])}</strong>);
    else if (m[3].startsWith("/") && !m[3].startsWith("//")) out.push(<Link key={k++} href={m[3]} className="text-[#b6f400] underline underline-offset-2">{m[2]}</Link>);
    else if (/^https:\/\//.test(m[3])) out.push(<a key={k++} href={m[3]} target="_blank" rel="noopener noreferrer" className="text-[#b6f400] underline underline-offset-2">{m[2]}</a>);
    else out.push(m[2]);
    last = m.index + m[0].length;
  }
  if (last < text.length) out.push(text.slice(last));
  return out;
}

function Markdown({ text }: { text: string }) {
  const blocks: ReactNode[] = [];
  let list: string[] = [];
  const flush = () => { if (list.length) { blocks.push(<ul key={blocks.length} className="my-1.5 space-y-1.5 pl-1">{list.map((l, i) => <li key={i} className="flex gap-2"><span className="text-white/45">&bull;</span><span>{inline(l)}</span></li>)}</ul>); list = []; } };
  for (const raw of text.split("\n")) {
    const line = raw.trimEnd();
    const item = /^\s*(?:[-*]|\d+\.)\s+(.*)$/.exec(line);
    if (item) list.push(item[1]);
    else { flush(); if (line.trim()) blocks.push(<p key={blocks.length} className="my-1.5">{inline(line)}</p>); }
  }
  flush();
  return <>{blocks}</>;
}

function Cards({ items }: { items: Card[] }) {
  return (
    <ul className="my-2 grid gap-2">
      {items.map((c) => (
        <li key={c.id}>
          <Link href={c.url} className="flex gap-3 rounded-xl border border-white/12 bg-white/[0.04] p-2 transition-colors hover:border-[#b6f400]/60 hover:bg-white/[0.07]">
            <Image src={c.image} alt="" width={96} height={72} className="h-[60px] w-[80px] shrink-0 rounded-lg object-cover" />
            <span className="min-w-0 text-[13px] leading-snug">
              <span className="block truncate font-medium text-white">{c.title}</span>
              <span className="block text-white/75">{c.price} &middot; {c.size}{c.beds ? ` · ${c.beds} BHK` : ""}</span>
              <span className="block truncate text-white/55">{c.area} &middot; {c.type}{c.verification ? ` · papers ${c.verification}` : ""}</span>
            </span>
          </Link>
        </li>
      ))}
    </ul>
  );
}

function Message({ m }: { m: UIMessage }) {
  if (m.role === "user") {
    const text = m.parts.map((p) => (p.type === "text" ? p.text : "")).join("");
    return <div className="flex justify-end"><p className="max-w-[85%] rounded-2xl rounded-br-md bg-[#b6f400] px-3.5 py-2 text-[14px] text-black">{text}</p></div>;
  }
  return (
    <div className="max-w-[94%] text-[14px] leading-relaxed text-white/90">
      {m.parts.map((p, i) => {
        if (p.type === "text") return <Markdown key={i} text={p.text} />;
        if (p.type === "tool-searchListings" && "state" in p && p.state === "output-available") {
          const out = (p as { output?: { items?: Card[] } }).output;
          return out?.items?.length ? <Cards key={i} items={out.items} /> : null;
        }
        return <Fragment key={i} />;
      })}
    </div>
  );
}

export function AskAI() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const [input, setInput] = useState("");
  const listRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  const transport = useMemo(() => new DefaultChatTransport({ api: "/api/ask" }), []);
  const { messages, sendMessage, status, stop, setMessages, error } = useChat({ transport });
  const busy = status === "submitted" || status === "streaming";

  useEffect(() => { listRef.current?.scrollTo({ top: listRef.current.scrollHeight, behavior: "smooth" }); }, [messages, status]);
  useEffect(() => {
    if (!open) return;
    inputRef.current?.focus();
    const key = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    window.addEventListener("keydown", key);
    return () => window.removeEventListener("keydown", key);
  }, [open]);

  const send = (text: string) => {
    const t = text.trim();
    if (!t || busy) return;
    // What the visitor is looking at travels with each question, so "this flat" works.
    sendMessage({ text: t.slice(0, 600) }, { body: { context: { path: pathname, listingId: /^\/listings\/([^/?]+)/.exec(pathname)?.[1] } } });
    setInput("");
  };

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        aria-label="Open the AI assistant"
        className="mono-label fixed bottom-5 right-5 z-[60] flex h-12 cursor-pointer items-center gap-2 rounded-full bg-[#b6f400] px-5 text-black shadow-[0_8px_30px_rgba(0,0,0,0.45)] transition-transform hover:scale-105"
      >
        <Sparkles className="h-4 w-4" /> Ask AI
      </button>
    );
  }

  return (
    <section
      role="dialog"
      aria-label="Deccan AI assistant"
      className="fixed inset-3 z-[60] flex flex-col overflow-hidden rounded-2xl border border-white/15 bg-black/95 shadow-[0_20px_70px_rgba(0,0,0,0.6)] backdrop-blur-xl sm:inset-auto sm:bottom-5 sm:right-5 sm:h-[min(640px,calc(100dvh-40px))] sm:w-[420px]"
    >
      <header className="flex items-center gap-3 border-b border-white/10 px-4 py-3">
        <span className="flex h-9 w-9 items-center justify-center rounded-full bg-[#b6f400] text-black"><Sparkles className="h-4 w-4" /></span>
        <div className="min-w-0 flex-1">
          <h2 className="text-[16px] font-medium leading-tight text-white">Deccan AI</h2>
          <p className="truncate text-[12px] text-white/60">Ask about homes, prices, areas and loans</p>
        </div>
        {messages.length > 0 && <button onClick={() => { stop(); setMessages([]); }} aria-label="Start a new chat" title="New chat" className="flex h-9 w-9 cursor-pointer items-center justify-center rounded-full text-white/70 hover:bg-white/10 hover:text-white"><RotateCcw className="h-4 w-4" /></button>}
        <button onClick={() => setOpen(false)} aria-label="Close the assistant" className="flex h-9 w-9 cursor-pointer items-center justify-center rounded-full text-white/70 hover:bg-white/10 hover:text-white"><X className="h-5 w-5" /></button>
      </header>

      <div ref={listRef} className="flex-1 space-y-3 overflow-y-auto px-4 py-4" aria-live="polite">
        {messages.length === 0 && (
          <div>
            <p className="text-[15px] leading-snug text-white/90">Hi, I&apos;m Deccan AI. Tell me what you&apos;re looking for in Hyderabad and I&apos;ll search the live listings for you.</p>
            <ul className="mt-4 flex flex-wrap gap-2">
              {SUGGESTIONS.map((s) => (
                <li key={s}><button onClick={() => send(s)} className="cursor-pointer rounded-full border border-white/20 bg-white/[0.05] px-3.5 py-2 text-left text-[13px] text-white/85 transition-colors hover:border-[#b6f400] hover:text-white">{s}</button></li>
              ))}
            </ul>
          </div>
        )}
        {messages.map((m) => <Message key={m.id} m={m} />)}
        {status === "submitted" && <p className="text-[13px] text-white/55">Searching…</p>}
        {error && <p role="alert" className="rounded-lg border border-red-400/40 bg-red-400/10 p-3 text-[13px] text-red-100">Sorry, something went wrong. Please try again in a moment.</p>}
      </div>

      <form onSubmit={(e) => { e.preventDefault(); send(input); }} className="border-t border-white/10 p-3">
        <div className="flex items-end gap-2 rounded-2xl border border-white/20 bg-white/[0.05] p-1.5 focus-within:border-[#b6f400]">
          <textarea
            ref={inputRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); send(input); } }}
            rows={1}
            maxLength={600}
            placeholder="Ask anything about properties…"
            aria-label="Your question"
            className="max-h-28 min-h-[40px] flex-1 resize-none bg-transparent px-3 py-2 text-[14px] text-white outline-none placeholder:text-white/40"
          />
          {busy ? (
            <button type="button" onClick={stop} aria-label="Stop" className="flex h-10 w-10 shrink-0 cursor-pointer items-center justify-center rounded-xl bg-white text-black"><Square className="h-4 w-4 fill-current" /></button>
          ) : (
            <button type="submit" disabled={!input.trim()} aria-label="Send" className="flex h-10 w-10 shrink-0 cursor-pointer items-center justify-center rounded-xl bg-[#b6f400] text-black disabled:cursor-not-allowed disabled:opacity-40"><ArrowUp className="h-5 w-5" /></button>
          )}
        </div>
        <p className="mt-2 text-center text-[11px] text-white/45">AI can make mistakes. Sample listings; confirm papers and prices with the agent.</p>
      </form>
    </section>
  );
}
