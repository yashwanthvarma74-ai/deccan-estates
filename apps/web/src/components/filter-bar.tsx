"use client";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";
import { X, Search } from "lucide-react";
import { Popover } from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { typeLabels } from "@/lib/api";
import { cn, formatInr } from "@/lib/utils";

type Locality = { id: string; name: string; slug: string };

const priceSteps = [0, 2_000_000, 5_000_000, 10_000_000, 20_000_000, 50_000_000, 100_000_000];

/** All filters live in the URL so the server-rendered list and the client map stay in sync. */
export function useFilterParams() {
  const router = useRouter();
  const pathname = usePathname();
  const sp = useSearchParams();
  const set = (updates: Record<string, string | undefined>) => {
    const next = new URLSearchParams(sp.toString());
    for (const [k, v] of Object.entries(updates)) (v ? next.set(k, v) : next.delete(k));
    next.delete("page");
    router.push(`${pathname === "/" ? "/listings" : pathname}?${next}`, { scroll: false });
  };
  return { sp, set };
}

const select = "h-10 w-full rounded-lg border border-line bg-card px-3 text-sm";

export function FilterBar({ localities }: { localities: Locality[] }) {
  const { sp, set } = useFilterParams();
  const [text, setText] = useState("");
  const locality = localities.find((l) => l.slug === sp.get("locality"));
  const min = sp.get("minPrice") ?? "";
  const max = sp.get("maxPrice") ?? "";

  function submitText(value: string) {
    const match = localities.find((l) => l.name.toLowerCase() === value.trim().toLowerCase());
    if (match) set({ locality: match.slug, q: undefined });
    else set({ q: value.trim() || undefined, locality: undefined });
    setText("");
  }

  const chip = (label: string, onClear: () => void) => (
    <span key={label} className="flex h-9 items-center gap-2 rounded-full bg-white/10 px-3 text-sm">
      {label}
      <button aria-label={`Remove ${label}`} onClick={onClear} className="cursor-pointer text-muted hover:text-white"><X className="h-4 w-4" /></button>
    </span>
  );

  return (
    <div className="flex flex-wrap items-center gap-x-8 gap-y-4" role="search">
      <div className="flex min-h-12 w-full max-w-xl items-center gap-3 border-b border-white/25 focus-within:border-white md:w-[34rem]">
        <Search className="h-5 w-5 text-muted" aria-hidden />
        {locality && chip(locality.name, () => set({ locality: undefined }))}
        {sp.get("q") && chip(`“${sp.get("q")}”`, () => set({ q: undefined }))}
        <input
          list="locality-options"
          value={text}
          onChange={(e) => {
            setText(e.target.value);
            if (localities.some((l) => l.name === e.target.value)) submitText(e.target.value);
          }}
          onKeyDown={(e) => e.key === "Enter" && text.trim() && submitText(text)}
          placeholder={locality || sp.get("q") ? "" : "Locality, project or keyword"}
          aria-label="Search by locality, project or keyword"
          className="h-11 flex-1 bg-transparent text-sm outline-none placeholder:text-muted"
        />
        <datalist id="locality-options">
          {localities.map((l) => <option key={l.id} value={l.name} />)}
        </datalist>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <div className="flex" role="group" aria-label="Transaction">
          <button className="label h-10 rounded-lg bg-white px-6 text-bg" aria-pressed>Buy</button>
          <button className="label h-10 cursor-not-allowed rounded-lg border border-line px-6 text-muted" disabled title="Rentals coming soon">Rent</button>
        </div>

        <Popover label="Price range" active={!!(min || max)}>
          {(close) => (
            <div className="space-y-3">
              <label className="label block text-muted">Min
                <select className={cn(select, "mt-1")} value={min} onChange={(e) => set({ minPrice: e.target.value || undefined })}>
                  <option value="">No min</option>
                  {priceSteps.slice(1).map((v) => <option key={v} value={v}>{formatInr(v)}</option>)}
                </select>
              </label>
              <label className="label block text-muted">Max
                <select className={cn(select, "mt-1")} value={max} onChange={(e) => set({ maxPrice: e.target.value || undefined })}>
                  <option value="">No max</option>
                  {priceSteps.slice(1).map((v) => <option key={v} value={v}>{formatInr(v)}</option>)}
                </select>
              </label>
              <Button size="sm" className="w-full" onClick={close}>Done</Button>
            </div>
          )}
        </Popover>

        <Popover label="Bedrooms" active={!!sp.get("minBeds")}>
          {(close) => (
            <div>
              <p className="label mb-3 text-muted">Minimum bedrooms</p>
              <div className="flex gap-2">
                {["", "1", "2", "3", "4", "5"].map((b) => (
                  <button
                    key={b || "any"}
                    onClick={() => { set({ minBeds: b || undefined }); close(); }}
                    className={cn("label h-10 flex-1 cursor-pointer rounded-lg border px-2", (sp.get("minBeds") ?? "") === b ? "border-white bg-white text-bg" : "border-line hover:border-white")}
                  >
                    {b ? `${b}+` : "Any"}
                  </button>
                ))}
              </div>
            </div>
          )}
        </Popover>

        <Popover label="Home type" active={!!sp.get("type")}>
          {(close) => (
            <ul className="space-y-1">
              {[["", "Any type"], ...Object.entries(typeLabels)].map(([value, label]) => (
                <li key={value || "any"}>
                  <button
                    onClick={() => { set({ type: value || undefined }); close(); }}
                    className={cn("w-full cursor-pointer px-3 py-2 text-left text-sm hover:bg-white/10", (sp.get("type") ?? "") === value && "font-semibold text-white")}
                  >
                    {label}
                  </button>
                </li>
              ))}
            </ul>
          )}
        </Popover>

        <Popover label="Filters" align="right">
          {(close) => (
            <div className="space-y-3">
              <label className="label block text-muted">Keyword
                <Input
                  className="mt-1 h-10"
                  defaultValue={sp.get("q") ?? ""}
                  placeholder="e.g. ORR, RERA, corner plot"
                  onKeyDown={(e) => { if (e.key === "Enter") { set({ q: e.currentTarget.value || undefined }); close(); } }}
                />
              </label>
              <Button variant="quiet" size="sm" className="w-full" onClick={() => { set({ q: undefined, locality: undefined, type: undefined, minPrice: undefined, maxPrice: undefined, minBeds: undefined }); close(); }}>
                Clear all filters
              </Button>
            </div>
          )}
        </Popover>
      </div>
    </div>
  );
}
