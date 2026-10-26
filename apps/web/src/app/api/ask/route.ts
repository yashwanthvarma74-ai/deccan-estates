import { createAgentUIStreamResponse, createUIMessageStream, createUIMessageStreamResponse, type UIMessage } from "ai";
import { z } from "zod";
import { pickChatModel } from "@/lib/assistant";
import { answerWithoutAI } from "@/lib/ask-answer";
import { buildAskAgent } from "@/lib/ask-agent";

export const maxDuration = 45;

const body = z.object({
  messages: z.array(z.any()).min(1).max(40),
  /** What the visitor is looking at, so "this flat" works. */
  context: z.object({ path: z.string().max(200).optional(), listingId: z.string().max(64).optional() }).optional(),
});

// A small per-visitor limit; the chat is public and each AI answer costs money.
const hits = new Map<string, number[]>();
function limited(ip: string) {
  const now = Date.now();
  const recent = (hits.get(ip) ?? []).filter((t) => now - t < 60_000);
  recent.push(now);
  hits.set(ip, recent);
  if (hits.size > 5000) hits.clear();
  return recent.length > 12;
}

const lastUserText = (messages: UIMessage[]) => {
  const last = [...messages].reverse().find((m) => m.role === "user");
  return (last?.parts ?? []).map((p) => (p.type === "text" ? p.text : "")).join(" ").trim();
};

export async function POST(req: Request) {
  const ip = (req.headers.get("x-forwarded-for") ?? "local").split(",")[0].trim();
  if (limited(ip)) return Response.json({ error: "You are asking too fast. Please wait a moment." }, { status: 429 });

  const parsed = body.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return Response.json({ error: "Invalid request" }, { status: 400 });
  const messages = parsed.data.messages.slice(-12) as UIMessage[];
  const question = lastUserText(messages).slice(0, 600);
  if (!question) return Response.json({ error: "Empty question" }, { status: 400 });

  const model = pickChatModel();
  if (model) return createAgentUIStreamResponse({ agent: buildAskAgent(model, parsed.data.context ?? {}), uiMessages: messages });

  // No AI key configured: answer straight from the listings.
  const { markdown } = await answerWithoutAI(question);
  const stream = createUIMessageStream({
    execute({ writer }) {
      writer.write({ type: "start" });
      writer.write({ type: "text-start", id: "t" });
      writer.write({ type: "text-delta", id: "t", delta: markdown });
      writer.write({ type: "text-end", id: "t" });
      writer.write({ type: "finish" });
    },
  });
  return createUIMessageStreamResponse({ stream });
}
