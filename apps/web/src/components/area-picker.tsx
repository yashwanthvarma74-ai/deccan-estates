"use client";
import { useRouter } from "next/navigation";
import { ChevronDown, MapPin } from "lucide-react";

type Locality = { id: string; name: string; slug: string };

/** Picking an area goes straight to its homes: no second button to press. */
export function AreaPicker({ localities }: { localities: Locality[] }) {
  const router = useRouter();
  return (
    <label className="group flex min-h-12 cursor-pointer items-center gap-3 px-1 text-[17px] text-white/90 transition-colors hover:text-white focus-within:text-white">
      <MapPin className="h-5 w-5 shrink-0 text-white/70" strokeWidth={1.5} aria-hidden />
      <span className="whitespace-nowrap text-white/70">Or choose an area</span>
      <span className="relative">
        <select
          aria-label="Pick an area in Hyderabad"
          defaultValue=""
          onChange={(e) => e.target.value && router.push(`/listings?locality=${e.target.value}`)}
          className="cursor-pointer appearance-none border-b border-white/40 bg-transparent py-1 pl-1 pr-7 font-medium outline-none transition-colors group-hover:border-white [&>option]:text-black"
        >
          <option value="" disabled>Select…</option>
          {localities.map((l) => <option key={l.id} value={l.slug}>{l.name}</option>)}
        </select>
        <ChevronDown className="pointer-events-none absolute right-0 top-1/2 h-4 w-4 -translate-y-1/2" aria-hidden />
      </span>
    </label>
  );
}
