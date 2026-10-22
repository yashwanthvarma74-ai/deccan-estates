"use client";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { ChevronDown, Home, MapPin, Search, SlidersHorizontal, Wallet, BedDouble } from "lucide-react";
import { typeLabels, type Agent, type FilterKey } from "@/lib/api";
import { AdvancedFields, type FilterValues } from "@/components/advanced-fields";
import { cn, formatInr, PRICE_STEPS } from "@/lib/utils";

type Locality = { id: string; name: string; slug: string };


function Field({ icon: Icon, label, active, children }: { icon: typeof Home; label: string; active?: boolean; children: React.ReactNode }) {
  return (
    <label className={cn("relative flex min-w-0 flex-1 cursor-pointer items-center gap-3 rounded-xl px-4 py-3 text-left transition-colors", active ? "bg-bg text-white" : "hover:bg-black/5")}>
      <Icon className="h-6 w-6 shrink-0 opacity-80" strokeWidth={1.3} />
      <span className="min-w-0 flex-1">
        <span className="block text-xs opacity-70">{label}</span>
        {children}
      </span>
      <ChevronDown className="h-4 w-4 shrink-0 opacity-70" />
    </label>
  );
}

const select = "block w-full cursor-pointer appearance-none bg-transparent pr-2 text-[15px] font-medium outline-none [&>option]:text-black";

export function SearchPanel({ localities, agents }: { localities: Locality[]; agents: Agent[] }) {
  const router = useRouter();
  const [v, setV] = useState<FilterValues>({});
  const [advanced, setAdvanced] = useState(false);
  const change = (k: FilterKey, val: string) => setV((prev) => ({ ...prev, [k]: val }));
  const set = (k: FilterKey) => (e: React.ChangeEvent<HTMLSelectElement>) => change(k, e.target.value);
  const activeAdvanced = ["q", "minPrice", "minArea", "maxArea", "agent", "sort"].filter((k) => v[k as FilterKey]).length;

  function submit(e: React.FormEvent) {
    e.preventDefault();
    const p = new URLSearchParams();
    for (const [k, val] of Object.entries(v)) if (val) p.set(k, val);
    router.push(`/listings?${p}`);
  }

  return (
    <form onSubmit={submit} role="search" aria-label="Find a home" className="rounded-2xl bg-white p-3 text-bg shadow-[0_20px_60px_rgb(0_0_0/0.35)]">
      <p className="px-2 pb-2 pt-1 text-sm"><span className="font-medium">Find now</span> <span className="text-bg/70">your dream home</span></p>
      <div className="flex flex-col gap-1 lg:flex-row lg:items-stretch">
        <Field icon={Home} label="Property type" active>
          <select value={v.type ?? ""} onChange={set("type")} className={select} aria-label="Property type">
            <option value="">Select type</option>
            {Object.entries(typeLabels).map(([k, l]) => <option key={k} value={k}>{l}</option>)}
          </select>
        </Field>
        <Field icon={MapPin} label="Locality">
          <select value={v.locality ?? ""} onChange={set("locality")} className={select} aria-label="Locality">
            <option value="">Select locality</option>
            {localities.map((l) => <option key={l.id} value={l.slug}>{l.name}</option>)}
          </select>
        </Field>
        <Field icon={Wallet} label="Budget">
          <select value={v.maxPrice ?? ""} onChange={set("maxPrice")} className={select} aria-label="Maximum budget">
            <option value="">Any budget (20 Cr+)</option>
            {PRICE_STEPS.map((b) => <option key={b} value={b}>Up to {formatInr(b)}</option>)}
          </select>
        </Field>
        <Field icon={BedDouble} label="Bedrooms">
          <select value={v.minBeds ?? ""} onChange={set("minBeds")} className={select} aria-label="Minimum bedrooms">
            <option value="">Any</option>
            {[1, 2, 3, 4, 5].map((n) => <option key={n} value={n}>{n}+ bedrooms</option>)}
          </select>
        </Field>
        <button
          type="button"
          onClick={() => setAdvanced(!advanced)}
          aria-expanded={advanced}
          aria-controls="advanced-filters"
          className="flex cursor-pointer items-center gap-2 border-bg/10 px-4 py-3 text-[15px] font-medium lg:border-l"
        >
          <SlidersHorizontal className="h-[18px] w-[18px]" /> Advanced
          {activeAdvanced > 0 && <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-bg px-1 text-[11px] text-white">{activeAdvanced}</span>}
          <ChevronDown className={cn("h-4 w-4 opacity-70 transition-transform", advanced && "rotate-180")} />
        </button>
        <button type="submit" aria-label="Search homes" className="flex h-14 w-14 shrink-0 cursor-pointer items-center justify-center self-center rounded-full bg-bg text-white transition-transform hover:scale-105 active:scale-95">
          <Search className="h-5 w-5" />
        </button>
      </div>
      <div id="advanced-filters" className={cn("grid transition-[grid-template-rows,opacity] duration-300", advanced ? "grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0")} aria-hidden={!advanced}>
        <div className="overflow-hidden">
          <div className="mt-3 border-t border-bg/10 px-2 pb-2 pt-4">
            <AdvancedFields values={v} onChange={change} localities={localities} agents={agents} dark={false} />
            <div className="mt-4 flex items-center justify-between">
              <button type="button" onClick={() => setV({})} className="cursor-pointer text-sm underline underline-offset-4">Clear all</button>
              <button type="submit" className="h-11 cursor-pointer rounded-lg bg-bg px-6 text-[15px] font-medium text-white transition-colors hover:bg-card-hi">Show homes</button>
            </div>
          </div>
        </div>
      </div>
    </form>
  );
}
