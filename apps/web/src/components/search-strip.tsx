"use client";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";
import { BedDouble, ChevronDown, Home, MapPin, Ruler, Search, SlidersHorizontal, Wallet, X } from "lucide-react";
import { AdvancedFields, withType, type FilterValues } from "@/components/advanced-fields";
import { FILTER_KEYS, typeLabels, type Agent, type FilterKey } from "@/lib/api";
import { formatArea } from "@/lib/listing-meta";
import { budgetSteps, cn, DEAL_LABELS, formatInr, maxOptions } from "@/lib/utils";

type Locality = { id: string; name: string; slug: string };

const STORAGE_KEY = "last-search";
const BASIC = new Set<string>(["deal", "type", "locality", "maxPrice", "minBeds", "beds", "minPlotArea", "unit"]);

function fromParams(sp: URLSearchParams): FilterValues {
  const v: FilterValues = {};
  for (const k of FILTER_KEYS) {
    const val = sp.get(k);
    if (val) v[k] = val;
  }
  return v;
}

function toQuery(v: FilterValues) {
  const p = new URLSearchParams();
  for (const k of FILTER_KEYS) if (v[k]) p.set(k, v[k]!);
  return p.toString();
}

const selectCls = "block w-full cursor-pointer appearance-none bg-transparent pr-6 text-[15px] font-medium text-white outline-none [&>option]:text-black";

function Segment({ icon: Icon, label, children }: { icon: typeof Home; label: string; children: React.ReactNode }) {
  return (
    <label
      onClick={(e) => {
        // A click anywhere on the segment (icon, caption, arrow) opens its dropdown.
        const sel = e.currentTarget.querySelector("select");
        if (sel && e.target !== sel) {
          e.preventDefault();
          try { sel.showPicker(); } catch { sel.focus(); }
        }
      }}
      className="relative flex min-w-0 flex-1 cursor-pointer items-center gap-3 rounded-xl px-3 py-2.5 transition-colors hover:bg-white/10 focus-within:bg-white/10"
    >
      <Icon className="h-5 w-5 shrink-0 text-white/70" strokeWidth={1.4} />
      <span className="min-w-0 flex-1">
        <span className="block text-[11px] leading-none text-white/55">{label}</span>
        <span className="relative mt-1 block">
          {children}
          <ChevronDown className="pointer-events-none absolute right-0 top-1/2 h-4 w-4 -translate-y-1/2 text-white/60" aria-hidden />
        </span>
      </span>
    </label>
  );
}

/**
 * The same search as the home page, kept at the top of every other page so people can change their mind
 * at any moment. On the results page every change applies instantly; elsewhere "Search" takes you there.
 * The last search is remembered for the session so the strip never starts empty after you open a home.
 */
export function SearchStrip({ localities, agents }: { localities: Locality[]; agents: Agent[] }) {
  const pathname = usePathname();
  const router = useRouter();
  const sp = useSearchParams();
  const onResults = pathname === "/listings";
  const urlQuery = sp.toString();

  const [values, setValues] = useState<FilterValues>({});
  const [advanced, setAdvanced] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const root = useRef<HTMLDivElement>(null);
  const timer = useRef<ReturnType<typeof setTimeout>>(undefined);

  // On the results page the URL is the source of truth; elsewhere restore the last search.
  useEffect(() => {
    const id = window.setTimeout(() => {
      if (onResults) {
        const next = fromParams(new URLSearchParams(urlQuery));
        setValues(next);
        try { sessionStorage.setItem(STORAGE_KEY, toQuery(next)); } catch {}
      } else {
        try { setValues(fromParams(new URLSearchParams(sessionStorage.getItem(STORAGE_KEY) ?? ""))); } catch { setValues({}); }
      }
    }, 0);
    return () => window.clearTimeout(id);
  }, [onResults, urlQuery]);

  // Close the Advanced panel on outside click or Escape.
  useEffect(() => {
    if (!advanced) return;
    const down = (e: MouseEvent | TouchEvent) => { if (root.current && !root.current.contains(e.target as Node)) setAdvanced(false); };
    const key = (e: KeyboardEvent) => e.key === "Escape" && setAdvanced(false);
    document.addEventListener("mousedown", down);
    document.addEventListener("touchstart", down);
    document.addEventListener("keydown", key);
    return () => { document.removeEventListener("mousedown", down); document.removeEventListener("touchstart", down); document.removeEventListener("keydown", key); };
  }, [advanced]);

  const go = useCallback((next: FilterValues) => {
    const q = toQuery(next);
    try { sessionStorage.setItem(STORAGE_KEY, q); } catch {}
    router.push(q ? `/listings?${q}` : "/listings", { scroll: false });
  }, [router]);

  const change = (key: FilterKey, val: string) => {
    const next = key === "type" ? withType(values, val) : { ...values, [key]: val };
    if (!val) delete next[key];
    setValues(next);
    if (onResults) {
      clearTimeout(timer.current);
      // Typing in the keyword box waits for a pause; dropdowns apply immediately.
      timer.current = setTimeout(() => go(next), key === "q" ? 450 : 0);
    }
  };
  useEffect(() => () => clearTimeout(timer.current), []);

  const submit = (e?: React.FormEvent) => { e?.preventDefault(); clearTimeout(timer.current); go(values); setAdvanced(false); setMobileOpen(false); };
  const clear = () => { setValues({}); if (onResults) go({}); };

  if (pathname === "/") return null;

  const v = (k: FilterKey) => values[k] ?? "";
  const activeAdvanced = Object.entries(values).filter(([k, val]) => val && !BASIC.has(k)).length;
  const anyActive = Object.values(values).some(Boolean);
  const plot = values.type === "PLOT";
  const priceOpts = maxOptions(budgetSteps(values.deal), formatInr);

  const deal = values.deal ?? "SALE";
  // A different deal means a different price scale, so the old budget is dropped.
  const pickDeal = (d: keyof typeof DEAL_LABELS) => {
    const kept = Object.fromEntries(Object.entries(values).filter(([k]) => !["deal", "minPrice", "maxPrice"].includes(k))) as FilterValues;
    const next: FilterValues = d === "SALE" ? kept : { ...kept, deal: d };
    setValues(next);
    if (onResults) go(next);
  };
  const fields = (
    <>
      <div role="group" aria-label="Buy, rent or commercial" className="col-span-2 flex shrink-0 items-center gap-1 rounded-xl bg-black/30 p-1 lg:col-span-1">
        {(Object.keys(DEAL_LABELS) as (keyof typeof DEAL_LABELS)[]).map((d) => (
          <button
            key={d}
            type="button"
            aria-pressed={deal === d}
            onClick={() => pickDeal(d)}
            className={cn("mono-label h-10 flex-1 cursor-pointer rounded-lg px-4 text-[12px] transition-colors", deal === d ? "bg-[#b6f400] text-black" : "text-white/80 hover:text-white")}
          >
            {DEAL_LABELS[d]}
          </button>
        ))}
      </div>
      <Segment icon={Home} label="Property type">
        <select value={v("type")} onChange={(e) => change("type", e.target.value)} className={selectCls} aria-label="Property type">
          <option value="">Any type</option>
          {Object.entries(typeLabels).map(([k, l]) => <option key={k} value={k}>{l === "Apartment" ? "Flat" : l}</option>)}
        </select>
      </Segment>
      <Segment icon={MapPin} label="Area">
        <select value={v("locality")} onChange={(e) => change("locality", e.target.value)} className={selectCls} aria-label="Area">
          <option value="">All areas</option>
          {localities.map((l) => <option key={l.id} value={l.slug}>{l.name}</option>)}
        </select>
      </Segment>
      <Segment icon={Wallet} label="Budget">
        <select value={v("maxPrice")} onChange={(e) => change("maxPrice", e.target.value)} className={selectCls} aria-label="Maximum budget">
          <option value="">Any</option>
          {priceOpts.map((o) => <option key={o.value} value={o.value}>Up to {o.label}</option>)}
        </select>
      </Segment>
      {plot ? (
        <Segment icon={Ruler} label="Plot size">
          <select value={v("minPlotArea")} onChange={(e) => change("minPlotArea", e.target.value)} className={selectCls} aria-label="Minimum plot size">
            <option value="">Any size</option>
            {[100, 200, 300, 500, 1000, 2420, 4840].map((n) => <option key={n} value={n}>{formatArea(n, n >= 2420 ? "acre" : "sqyd")}+</option>)}
          </select>
        </Segment>
      ) : (
        <Segment icon={BedDouble} label="Bedrooms">
          <select value={v("beds")} onChange={(e) => change("beds", e.target.value)} className={selectCls} aria-label="Bedrooms">
            <option value="">Any</option>
            {[1, 2, 3, 4, 5].map((n) => <option key={n} value={n}>{n === 5 ? "5+" : n} BHK</option>)}
          </select>
        </Segment>
      )}
    </>
  );

  if (["/login", "/sell", "/post", "/account", "/privacy", "/terms", "/credits"].includes(pathname)) return null;
  return (
    <div ref={root} className="sticky top-[98px] z-40 border-b border-white/10 bg-bg/85 backdrop-blur-xl">
      <form onSubmit={submit} role="search" aria-label="Change your search" className="mx-auto max-w-[1600px] px-4 py-3 sm:px-6 lg:px-[60px]">
        {/* Small screens: one line, tap to open the fields. */}
        <button type="button" onClick={() => setMobileOpen(!mobileOpen)} aria-expanded={mobileOpen} className="flex w-full cursor-pointer items-center justify-between rounded-xl border border-white/15 bg-white/[0.07] px-4 py-3 text-left lg:hidden">
          <span className="flex items-center gap-3 text-[15px]"><Search className="h-5 w-5" />
            {[deal !== "SALE" && DEAL_LABELS[deal as keyof typeof DEAL_LABELS], v("type") && typeLabels[v("type") as keyof typeof typeLabels], localities.find((l) => l.slug === v("locality"))?.name].filter(Boolean).join(" · ") || "Change your search"}
          </span>
          <ChevronDown className={cn("h-5 w-5 transition-transform", mobileOpen && "rotate-180")} />
        </button>

        <div className={cn("items-stretch gap-1 rounded-2xl border border-white/15 bg-white/[0.07] p-1.5 lg:flex", mobileOpen ? "mt-2 grid grid-cols-2" : "hidden")}>
          {fields}
          <button
            type="button"
            onClick={() => setAdvanced(!advanced)}
            aria-expanded={advanced}
            aria-controls="strip-advanced"
            className="flex cursor-pointer items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-[15px] font-medium text-white transition-colors hover:bg-white/10 max-lg:col-span-2 lg:border-l lg:border-white/15"
          >
            <SlidersHorizontal className="h-[18px] w-[18px]" /> Advanced
            {activeAdvanced > 0 && <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-white px-1 text-[11px] font-semibold text-bg">{activeAdvanced}</span>}
            <ChevronDown className={cn("h-4 w-4 opacity-70 transition-transform", advanced && "rotate-180")} />
          </button>
          {anyActive && (
            <button type="button" onClick={clear} aria-label="Clear all filters" className="flex cursor-pointer items-center justify-center gap-1.5 rounded-xl px-3 text-sm text-white/70 hover:text-white max-lg:col-span-2">
              <X className="h-4 w-4" /> Clear
            </button>
          )}
          <button type="submit" className="flex h-12 cursor-pointer items-center justify-center gap-2 rounded-xl bg-white px-6 text-[15px] font-semibold text-bg transition-colors hover:bg-white/90 max-lg:col-span-2 lg:self-center">
            <Search className="h-[18px] w-[18px]" /> {onResults ? "Update" : "Search"}
          </button>
        </div>

        {advanced && (
          <div id="strip-advanced" className="mt-2 max-h-[70vh] overflow-y-auto rounded-2xl border border-white/15 bg-card p-5 shadow-2xl">
            <AdvancedFields values={values} onChange={change} localities={localities} agents={agents} />
            <div className="mt-5 flex items-center justify-between">
              <button type="button" onClick={clear} className="cursor-pointer text-sm underline underline-offset-4">Clear all</button>
              <button type="submit" className="h-11 cursor-pointer rounded-lg bg-white px-6 text-[15px] font-semibold text-bg hover:bg-white/90">Show homes</button>
            </div>
          </div>
        )}
      </form>
    </div>
  );
}
