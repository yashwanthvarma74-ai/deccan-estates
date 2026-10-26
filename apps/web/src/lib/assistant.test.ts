import { afterEach, describe, expect, it, vi } from "vitest";
import { pickChatModel } from "./assistant";

const KEYS = ["ANTHROPIC_API_KEY", "GROQ_API_KEY", "GEMINI_API_KEY", "OPENAI_API_KEY", "OLLAMA_BASE_URL", "ASK_MODEL"] as const;
const saved = Object.fromEntries(KEYS.map((k) => [k, process.env[k]]));
afterEach(() => { for (const k of KEYS) { if (saved[k] === undefined) delete process.env[k]; else process.env[k] = saved[k]; } vi.unstubAllGlobals(); });
const clear = () => { for (const k of KEYS) delete process.env[k]; };

/** Calls the model once with a fake network and reports where the request went. */
async function probe() {
  const seen: { url: string; auth: string | null; model: string }[] = [];
  vi.stubGlobal("fetch", async (url: string, init: RequestInit) => {
    seen.push({ url: String(url), auth: new Headers(init.headers).get("authorization"), model: JSON.parse(String(init.body)).model });
    return new Response(JSON.stringify({ id: "x", created: 1, model: "m", choices: [{ index: 0, message: { role: "assistant", content: "hi" }, finish_reason: "stop" }], usage: { prompt_tokens: 1, completion_tokens: 1, total_tokens: 2 } }), { headers: { "content-type": "application/json" } });
  });
  const model = pickChatModel();
  if (!model || typeof model === "string") throw new Error("no model");
  await model.doGenerate({ prompt: [{ role: "user", content: [{ type: "text", text: "hi" }] }] });
  return seen[0];
}

describe("pickChatModel", () => {
  it("returns null with no keys, so the built-in search answers", () => {
    clear();
    expect(pickChatModel()).toBeNull();
  });
  it("uses Groq's chat-completions endpoint with the free Llama model", async () => {
    clear(); process.env.GROQ_API_KEY = "gsk_test";
    const r = await probe();
    expect(r.url).toBe("https://api.groq.com/openai/v1/chat/completions");
    expect(r.auth).toBe("Bearer gsk_test");
    expect(r.model).toBe("llama-3.3-70b-versatile");
  });
  it("uses Gemini's OpenAI-compatible endpoint", async () => {
    clear(); process.env.GEMINI_API_KEY = "g_test";
    const r = await probe();
    expect(r.url).toBe("https://generativelanguage.googleapis.com/v1beta/openai/chat/completions");
    expect(r.model).toBe("gemini-2.5-flash");
  });
  it("lets ASK_MODEL choose another model", async () => {
    clear(); process.env.GROQ_API_KEY = "gsk_test"; process.env.ASK_MODEL = "llama-3.1-8b-instant";
    expect((await probe()).model).toBe("llama-3.1-8b-instant");
  });
});
