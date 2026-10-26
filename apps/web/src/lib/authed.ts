"use client";
import { authClient } from "@/lib/auth-client";
import { PUBLIC_API_URL } from "@/lib/api";

/** Calls the API as the signed-in person and turns a rejected request into a readable message. */
export async function authedRequest<T = unknown>(path: string, init: RequestInit = {}): Promise<T> {
  const { data } = await authClient.token();
  if (!data) throw new Error("Please sign in again.");
  const res = await fetch(`${PUBLIC_API_URL}${path}`, { ...init, headers: { ...init.headers, Authorization: `Bearer ${data.token}` } });
  if (res.status === 204) return undefined as T;
  const body = await res.json().catch(() => null);
  if (!res.ok) {
    const m = (body as { message?: string | string[] } | null)?.message;
    throw new Error(Array.isArray(m) ? m.join("\n") : (m ?? `Something went wrong (${res.status}).`));
  }
  return body as T;
}
