"use client";
import { useState, useSyncExternalStore } from "react";
import { PUBLIC_API_URL } from "@/lib/api";
import { cn } from "@/lib/utils";

const TYPES = [["PLOT", "Plot"], ["APARTMENT", "Flat"], ["VILLA", "Villa"], ["GATED_COMMUNITY", "Gated community"], ["COMMERCIAL", "Commercial"]] as const;
const field = "w-full border-b border-white/25 bg-transparent py-3 text-[1.1rem] text-white outline-none transition-colors placeholder:text-white/35 focus:border-[#b6f400]";

/** Lead form: posts to the API, shows field errors from the server and a clear confirmation. */
export function SellForm() {
  const [state, setState] = useState<"idle" | "sending" | "done">("idle");
  const [errors, setErrors] = useState<string[]>([]);
  const [type, setType] = useState<string>("");
  // false while the server HTML is hydrating: the button stays disabled so a fast click can never fall back to a plain GET submit that puts the details in the URL
  const ready = useSyncExternalStore(() => () => {}, () => true, () => false);

  async function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setState("sending"); setErrors([]);
    const f = new FormData(e.currentTarget);
    const body = Object.fromEntries([...f.entries()].map(([k, v]) => [k, String(v)]));
    if (type) body.propertyType = type;
    try {
      const res = await fetch(`${PUBLIC_API_URL}/enquiries`, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(body) });
      if (res.ok) { setState("done"); return; }
      const data = await res.json().catch(() => null);
      setErrors(Array.isArray(data?.message) ? data.message : [data?.message ?? "Something went wrong. Please try again."]);
    } catch {
      setErrors(["We could not reach the server. Please check your connection and try again."]);
    }
    setState("idle");
  }

  if (state === "done") {
    return (
      <div role="status" className="rounded-3xl border border-white/15 bg-white/[0.04] p-10">
        <span className="grid h-12 w-12 place-items-center rounded-full bg-[#b6f400] text-xl text-black">✓</span>
        <h2 className="mt-6 text-[2rem] tracking-[-0.04em]">Thank you. An agent will call you.</h2>
        <p className="mt-3 max-w-[44ch] text-white/65">We usually respond within one working day. Keep your property papers handy: sale deed, approvals and recent tax receipts.</p>
      </div>
    );
  }

  return (
    <form onSubmit={submit} method="post" action="/sell" noValidate className="grid gap-x-10 gap-y-8 sm:grid-cols-2">
      <input name="website" tabIndex={-1} autoComplete="off" aria-hidden className="absolute -left-[9999px] h-0 w-0 opacity-0" />
      <label className="block"><span className="mono-label text-white/55">Your name</span><input name="name" required autoComplete="name" className={field} placeholder="Full name" /></label>
      <label className="block"><span className="mono-label text-white/55">Phone</span><input name="phone" required type="tel" autoComplete="tel" inputMode="tel" className={field} placeholder="+91" /></label>
      <label className="block"><span className="mono-label text-white/55">Email (optional)</span><input name="email" type="email" autoComplete="email" className={field} placeholder="name@email.com" /></label>
      <label className="block"><span className="mono-label text-white/55">Area</span><input name="locality" className={field} placeholder="For example Kokapet" /></label>
      <fieldset className="sm:col-span-2">
        <legend className="mono-label text-white/55">Property type</legend>
        <div className="mt-4 flex flex-wrap gap-2.5">
          {TYPES.map(([v, label]) => (
            <button key={v} type="button" aria-pressed={type === v} onClick={() => setType(type === v ? "" : v)} className={cn("mono-label cursor-pointer rounded-full border px-5 py-3 transition-colors", type === v ? "border-[#b6f400] bg-[#b6f400] text-black" : "border-white/25 text-white/75 hover:border-white hover:text-white")}>{label}</button>
          ))}
        </div>
      </fieldset>
      <label className="block"><span className="mono-label text-white/55">Expected price, in lakh (optional)</span><input name="expectedPriceLakh" type="number" min="1" inputMode="decimal" className={field} placeholder="85" /></label>
      <label className="block sm:col-span-2"><span className="mono-label text-white/55">Anything else we should know</span><textarea name="message" rows={3} className={cn(field, "resize-none")} placeholder="Size, facing, approvals, when you want to sell" /></label>
      {errors.length > 0 && (
        <ul role="alert" className="sm:col-span-2 space-y-1 rounded-xl border border-red-400/40 bg-red-400/10 p-4 text-[0.95rem] text-red-200">
          {errors.map((er) => <li key={er}>{er}</li>)}
        </ul>
      )}
      <div className="flex flex-wrap items-center gap-6 sm:col-span-2">
        <button type="submit" disabled={state === "sending" || !ready} className="mono-label inline-flex h-14 min-w-52 cursor-pointer items-center justify-center rounded-lg bg-[#b6f400] px-8 text-black transition-transform hover:scale-[1.03] active:scale-95 disabled:cursor-wait disabled:opacity-60">{state === "sending" ? "Sending…" : "Request a call"}</button>
        <p className="max-w-[34ch] text-sm leading-snug text-white/45">We use your details only to call you about this property.</p>
      </div>
    </form>
  );
}
