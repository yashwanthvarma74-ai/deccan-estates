"use client";
import { useChat } from "@ai-sdk/react";
import { DefaultChatTransport } from "ai";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export function Assistant({ listingId }: { listingId: string }) {
  const [input, setInput] = useState("");
  const { messages, sendMessage, status } = useChat({
    transport: new DefaultChatTransport({ api: "/api/assistant", body: { listingId } }),
  });

  return (
    <aside className="flex h-[32rem] flex-col overflow-hidden rounded-2xl border border-line bg-card" aria-label="Property assistant">
      <h2 className="border-b border-line p-4 text-xl">Ask about this property</h2>
      <div className="flex-1 space-y-3 overflow-y-auto p-3 text-sm" aria-live="polite">
        {messages.length === 0 && (
          <p className="text-muted">Try: “Is this RERA registered?” or “What is the price per sq ft?”</p>
        )}
        {messages.map((m) => (
          <div key={m.id} className={m.role === "user" ? "text-right" : ""}>
            <p className={m.role === "user" ? "inline-block rounded-xl bg-white px-3 py-2 text-bg" : "whitespace-pre-wrap"}>
              {m.parts.map((p) => (p.type === "text" ? p.text : "")).join("")}
            </p>
          </div>
        ))}
        {status === "submitted" && <p className="text-muted">Thinking…</p>}
      </div>
      <form
        className="flex gap-2 border-t border-line p-3"
        onSubmit={(e) => {
          e.preventDefault();
          if (input.trim()) sendMessage({ text: input });
          setInput("");
        }}
      >
        <Input className="h-12" value={input} onChange={(e) => setInput(e.target.value)} placeholder="Ask a question…" aria-label="Question" maxLength={500} />
        <Button type="submit" disabled={status !== "ready" && status !== "error"}>Send</Button>
      </form>
    </aside>
  );
}
