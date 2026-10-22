"use client";
import { typeLabels, type Agent, type FilterKey } from "@/lib/api";
import { formatInr, PRICE_STEPS, TOP_PRICE } from "@/lib/utils";

type Locality = { id: string; name: string; slug: string };
export type FilterValues = Partial<Record<FilterKey, string>>;

const AREAS = [500, 1000, 1500, 2000, 3000, 5000];

const box = "mt-1.5 h-11 w-full rounded-lg border border-line bg-card px-3 text-[15px] text-white outline-none focus-visible:border-white/60 [&>option]:text-black";

function Field({ label, children, className }: { label: string; children: React.ReactNode; className?: string }) {
  return (
    <label className={className}>
      <span className="text-xs text-muted">{label}</span>
      {children}
    </label>
  );
}

/**
 * Every filter the search API understands. Controlled: the parent owns the values and decides
 * what "apply" means (route to /listings from the home page, or update the URL on the search page).
 */
export function AdvancedFields({ values, onChange, localities, agents, dark = true }: {
  values: FilterValues;
  onChange: (key: FilterKey, value: string) => void;
  localities: Locality[];
  agents: Agent[];
  dark?: boolean;
}) {
  const v = (k: FilterKey) => values[k] ?? "";
  const field = dark ? box : box.replace("border-line bg-card text-white", "border-bg/15 bg-white text-bg");
  const labelCls = dark ? undefined : "[&>span]:text-bg/60";

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      <Field label="Keyword" className={`sm:col-span-2 ${labelCls ?? ""}`}>
        <input value={v("q")} onChange={(e) => onChange("q", e.target.value)} maxLength={100} placeholder="e.g. ORR access, corner plot, RERA" className={field} />
      </Field>
      <Field label="Property type" className={labelCls}>
        <select value={v("type")} onChange={(e) => onChange("type", e.target.value)} className={field}>
          <option value="">Any type</option>
          {Object.entries(typeLabels).map(([k, l]) => <option key={k} value={k}>{l}</option>)}
        </select>
      </Field>
      <Field label="Locality" className={labelCls}>
        <select value={v("locality")} onChange={(e) => onChange("locality", e.target.value)} className={field}>
          <option value="">All localities</option>
          {localities.map((l) => <option key={l.id} value={l.slug}>{l.name}</option>)}
        </select>
      </Field>

      <Field label="Min price" className={labelCls}>
        <select value={v("minPrice")} onChange={(e) => onChange("minPrice", e.target.value)} className={field}>
          <option value="">No minimum</option>
          {PRICE_STEPS.map((p) => <option key={p} value={p}>{p === TOP_PRICE ? `${formatInr(p)}+` : formatInr(p)}</option>)}
        </select>
      </Field>
      <Field label="Max price" className={labelCls}>
        <select value={v("maxPrice")} onChange={(e) => onChange("maxPrice", e.target.value)} className={field}>
          <option value="">No maximum (20 Cr+)</option>
          {PRICE_STEPS.map((p) => <option key={p} value={p}>{formatInr(p)}</option>)}
        </select>
      </Field>
      <Field label="Bedrooms" className={labelCls}>
        <select value={v("minBeds")} onChange={(e) => onChange("minBeds", e.target.value)} className={field}>
          <option value="">Any</option>
          {[1, 2, 3, 4, 5].map((n) => <option key={n} value={n}>{n}+ bedrooms</option>)}
        </select>
      </Field>
      <Field label="Listing agent" className={labelCls}>
        <select value={v("agent")} onChange={(e) => onChange("agent", e.target.value)} className={field}>
          <option value="">Any agent</option>
          {agents.map((a) => <option key={a.id} value={a.id}>{a.name} ({a.listingCount})</option>)}
        </select>
      </Field>

      <Field label="Min area (sq ft)" className={labelCls}>
        <select value={v("minArea")} onChange={(e) => onChange("minArea", e.target.value)} className={field}>
          <option value="">No minimum</option>
          {AREAS.map((a) => <option key={a} value={a}>{a.toLocaleString("en-IN")} sq ft</option>)}
        </select>
      </Field>
      <Field label="Max area (sq ft)" className={labelCls}>
        <select value={v("maxArea")} onChange={(e) => onChange("maxArea", e.target.value)} className={field}>
          <option value="">No maximum</option>
          {AREAS.map((a) => <option key={a} value={a}>{a.toLocaleString("en-IN")} sq ft</option>)}
        </select>
      </Field>
      <Field label="Sort by" className={`sm:col-span-2 ${labelCls ?? ""}`}>
        <select value={v("sort")} onChange={(e) => onChange("sort", e.target.value)} className={field}>
          <option value="">Newest</option>
          <option value="price_asc">Price: low to high</option>
          <option value="price_desc">Price: high to low</option>
        </select>
      </Field>
    </div>
  );
}
