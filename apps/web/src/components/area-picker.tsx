"use client";
import { useRouter } from "next/navigation";
import { MapPin } from "lucide-react";

type Locality = { id: string; name: string; slug: string };

/** Picking an area goes straight to its homes: no second button to press. */
export function AreaPicker({ localities }: { localities: Locality[] }) {
  const router = useRouter();
  return (
    <label className="inline-flex min-h-14 cursor-pointer items-center gap-3 rounded-xl border border-white/30 bg-black/30 px-5 text-lg text-white backdrop-blur transition-colors hover:bg-black/45 focus-within:border-white">
      <MapPin className="h-6 w-6 shrink-0" aria-hidden />
      <span className="whitespace-nowrap">Or pick an area:</span>
      <select
        aria-label="Pick an area in Hyderabad"
        defaultValue=""
        onChange={(e) => e.target.value && router.push(`/listings?locality=${e.target.value}`)}
        className="min-w-0 cursor-pointer bg-transparent py-3 pr-2 text-lg font-semibold outline-none [&>option]:text-black"
      >
        <option value="" disabled>Choose…</option>
        {localities.map((l) => <option key={l.id} value={l.slug}>{l.name}</option>)}
      </select>
    </label>
  );
}
