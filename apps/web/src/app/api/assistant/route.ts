import {
  convertToModelMessages,
  createUIMessageStream,
  createUIMessageStreamResponse,
  streamText,
  toUIMessageStream,
  type UIMessage,
} from "ai";
import { z } from "zod";
import { buildInstructions, extractiveAnswer, pickModel, type Passage } from "@/lib/assistant";

export const maxDuration = 30;

const body = z.object({
  listingId: z.string().max(64).optional(),
  messages: z.array(z.any()).min(1).max(30),
});

function lastUserText(messages: UIMessage[]) {
  const last = [...messages].reverse().find((m) => m.role === "user");
  return (last?.parts ?? []).map((p) => (p.type === "text" ? p.text : "")).join(" ").trim();
}

export async function POST(req: Request) {
  const parsed = body.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return Response.json({ error: "Invalid request" }, { status: 400 });

  const messages = parsed.data.messages as UIMessage[];
  const question = lastUserText(messages).slice(0, 1000);
  if (!question) return Response.json({ error: "Empty question" }, { status: 400 });

  const retrieval = await fetch(`${process.env.AI_URL ?? "http://localhost:8000"}/retrieve`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ query: question, listing_id: parsed.data.listingId, k: 5 }),
  }).catch(() => null);
  const passages: Passage[] = retrieval?.ok ? await retrieval.json() : [];

  const model = pickModel();
  if (!model) {
    const stream = createUIMessageStream({
      execute({ writer }) {
        writer.write({ type: "start" });
        writer.write({ type: "text-start", id: "t" });
        writer.write({ type: "text-delta", id: "t", delta: extractiveAnswer(passages) });
        writer.write({ type: "text-end", id: "t" });
        writer.write({ type: "finish" });
      },
    });
    return createUIMessageStreamResponse({ stream });
  }

  const result = streamText({
    model,
    instructions: buildInstructions(passages),
    messages: await convertToModelMessages(messages.slice(-10)),
  });
  return createUIMessageStreamResponse({ stream: toUIMessageStream({ stream: result.stream }) });
}
