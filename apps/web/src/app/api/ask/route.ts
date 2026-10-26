import { createAgentUIStream, createUIMessageStream, createUIMessageStreamResponse, generateText, type UIMessage } from "ai";
import { z } from "zod";
import { chatProviderName, pickChatModel } from "@/lib/assistant";
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
  const fallback = async (writer: Writer, note?: string) => {
    const { markdown } = await answerWithoutAI(question);
    writer.write({ type: "start" });
    writer.write({ type: "text-start", id: "t" });
    writer.write({ type: "text-delta", id: "t", delta: note ? `${note}\n\n${markdown}` : markdown });
    writer.write({ type: "text-end", id: "t" });
    writer.write({ type: "finish" });
  };

  const stream = createUIMessageStream({
    async execute({ writer }) {
      if (!model) return fallback(writer);
      // The AI service can be down, over its limit or misconfigured. Hold the first chunks back; if the very first
      // real chunk is an error, answer from the built-in search instead of showing an error.
      const held: Parameters<Writer["write"]>[0][] = [];
      let committed = false;
      try {
        const ui = await createAgentUIStream({ agent: buildAskAgent(model, parsed.data.context ?? {}), uiMessages: messages });
        for await (const chunk of ui) {
          if (committed) { writer.write(chunk); continue; }
          if (chunk.type === "error") throw new Error(chunk.errorText);
          held.push(chunk);
          if (chunk.type !== "start" && chunk.type !== "start-step") { committed = true; held.forEach((c) => writer.write(c)); }
        }
        if (!committed) held.forEach((c) => writer.write(c));
      } catch (e) {
        console.error("[ask] AI call failed, using built-in search:", e instanceof Error ? e.message : e);
        if (committed) { writer.write({ type: "error", errorText: "The AI stopped answering. Please try again." }); return; }
        await fallback(writer, "The AI is busy right now, so here is what I found by searching the listings.");
      }
    },
  });
  return createUIMessageStreamResponse({ stream });
}

type Writer = Parameters<Parameters<typeof createUIMessageStream>[0]["execute"]>[0]["writer"];

/** Status check: open /api/ask in a browser to see which AI the site uses and whether it answers. Never shows keys. */
export async function GET(req: Request) {
  const ip = (req.headers.get("x-forwarded-for") ?? "local").split(",")[0].trim();
  if (limited(ip)) return Response.json({ error: "Too many checks. Wait a minute." }, { status: 429 });
  const provider = chatProviderName();
  const model = pickChatModel();
  if (!model) return Response.json({ provider, aiReady: false, mode: "built-in search (no AI key set)" });
  try {
    const r = await generateText({ model, prompt: "Reply with the single word: ok", maxOutputTokens: 8 });
    return Response.json({ provider, aiReady: true, reply: r.text.trim().slice(0, 40) });
  } catch (e) {
    const err = e as { message?: string; statusCode?: number; responseBody?: string };
    // A retired or misspelled model is the most common failure: list what this key can use so ASK_MODEL can be set to one.
    let availableModels: string[] | undefined;
    if (err.statusCode === 404 && provider === "groq") {
      const r = await fetch("https://api.groq.com/openai/v1/models", { headers: { authorization: `Bearer ${process.env.GROQ_API_KEY}` } }).catch(() => null);
      const list = r?.ok ? ((await r.json()) as { data?: { id: string }[] }).data : undefined;
      availableModels = list?.map((m) => m.id).filter((id) => !/whisper|tts|guard|embed/i.test(id)).slice(0, 15);
    }
    const scrub = (t: string) => t.replace(/(gsk_|AIza|sk-ant-|sk-)[A-Za-z0-9_-]+/g, "[key]").slice(0, 400);
    return Response.json({ provider, aiReady: false, status: err.statusCode, error: scrub(err.message ?? "unknown error"), providerSaid: err.responseBody ? scrub(err.responseBody) : undefined, availableModels });
  }
}
