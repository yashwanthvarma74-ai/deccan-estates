"use client";
import { typeLabels, type Agent, type FilterKey } from "@/lib/api";
import {
  AMENITIES_BY_TYPE, AMENITY_LABELS, APPROVAL_LABELS, FACING_LABELS, FIELDS_BY_TYPE, FURNISHING_LABELS, POSSESSION_LABELS,
  SQFT_PER_SQYD, UNIT_LABEL, formatArea, keysForType, type AreaUnit, type FieldGroup, type PropertyType,
} from "@/lib/listing-meta";
import { cn, formatInr, PRICE_STEPS, TOP_PRICE } from "@/lib/utils";

type Locality = { id: string; name: string; slug: string };
export type FilterValues = Partial<Record<FilterKey, string>>;

const BUILT_UP = [500, 750, 1000, 1500, 2000, 3000, 4000, 5000, 7000, 10000];
const CARPET = [400, 600, 800, 1000, 1500, 2000, 3000, 4000, 5000];
const PLOT_SQYD = [100, 150, 200, 250, 300, 400, 500, 800, 1000, 2000, 4840, 9680, 24200];
const PPSF = [3000, 4000, 5000, 6000, 8000, 10000, 15000, 20000];
const PPSYD = [10000, 25000, 50000, 75000, 100000, 150000, 200000];

/** Clears filters that don't apply to the newly chosen property type, then sets the type. */
export function withType(values: FilterValues, type: string): FilterValues {
  const allowed = new Set([...keysForType(type || undefined), "q", "locality", "type", "minPrice", "maxPrice", "agent", "sort"]);
  const next: FilterValues = {};
  for (const [k, v] of Object.entries(values)) if (v && allowed.has(k)) next[k as FilterKey] = v;
  if (type) next.type = type;
  else delete next.type;
  return next;
}

const control = "mt-1.5 h-11 w-full rounded-lg border border-line bg-card px-3 text-[15px] text-white outline-none focus-visible:border-white/60 [&>option]:text-black";

function Box({ label, children, className }: { label: string; children: React.ReactNode; className?: string }) {
  return (
    <label
      className={cn("block", className)}
      onClick={(e) => {
        // Clicking the caption opens the dropdown too.
        const sel = e.currentTarget.querySelector("select");
        if (sel && e.target !== sel) {
          e.preventDefault();
          try { sel.showPicker(); } catch { sel.focus(); }
        }
      }}
    >
      <span className="text-xs text-muted">{label}</span>
      {children}
    </label>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <fieldset className="border-t border-line pt-5 first:border-t-0 first:pt-0">
      <legend className="mb-3 text-sm font-semibold text-white">{title}</legend>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">{children}</div>
    </fieldset>
  );
}

function Chips({ label, options, value, onChange, className, dark }: { label: string; options: Record<string, string>; value: string; onChange: (v: string) => void; className?: string; dark: boolean }) {
  const selected = new Set(value ? value.split(",") : []);
  const toggle = (k: string) => {
    const next = new Set(selected);
    if (next.has(k)) next.delete(k); else next.add(k);
    onChange([...next].join(","));
  };
  return (
    <div className={cn("sm:col-span-2 lg:col-span-4", className)} role="group" aria-label={label}>
      <span className="text-xs text-muted">{label}</span>
      <div className="mt-2 flex flex-wrap gap-2">
        {Object.entries(options).map(([k, text]) => {
          const on = selected.has(k);
          return (
            <button
              key={k}
              type="button"
              aria-pressed={on}
              onClick={() => toggle(k)}
              className={cn(
                "cursor-pointer rounded-full border px-3.5 py-1.5 text-sm transition-colors",
                dark
                  ? on ? "border-white bg-white text-bg" : "border-white/25 text-white/85 hover:border-white/60"
                  : on ? "border-bg bg-bg text-white" : "border-bg/25 text-bg/80 hover:border-bg/60",
              )}
            >
              {text}
            </button>
          );
        })}
      </div>
    </div>
  );
}

function Toggle({ label, checked, onChange, dark }: { label: string; checked: boolean; onChange: (v: boolean) => void; dark: boolean }) {
  return (
    <label className={cn("flex h-11 cursor-pointer items-center gap-3 self-end rounded-lg border px-3 text-[15px]", dark ? "border-line bg-card text-white" : "border-bg/15 bg-white text-bg")}>
      <input type="checkbox" checked={checked} onChange={(e) => onChange(e.target.checked)} className={cn("h-4 w-4", dark ? "accent-white" : "accent-[#070c26]")} />
      {label}
    </label>
  );
}

/**
 * Every filter the search API understands, shown according to the chosen property type: plots get plot
 * area (sq yd / acre / sq ft), approvals, facing, corner and road width; flats get carpet and built-up
 * sq ft, floor and amenities; villas get plot area plus built-up and carpet area, and so on.
 */
export function AdvancedFields({ values, onChange, localities, agents, dark = true }: {
  values: FilterValues;
  onChange: (key: FilterKey, value: string) => void;
  localities: Locality[];
  agents: Agent[];
  dark?: boolean;
}) {
  const v = (k: FilterKey) => values[k] ?? "";
  const type = (values.type && values.type in typeLabels ? values.type : "ANY") as PropertyType | "ANY";
  const has = (g: FieldGroup) => FIELDS_BY_TYPE[type].includes(g);
  const unit = (values.unit as AreaUnit) || "sqyd";
  const field = dark ? control : control.replace("border-line bg-card text-white", "border-bg/15 bg-white text-bg");
  const wrap = dark ? "" : "[&_span]:text-bg/60 [&_legend]:text-bg [&_fieldset]:border-bg/10";

  const select = (key: FilterKey, label: string, anyLabel: string, options: { value: string | number; label: string }[], className?: string) => (
    <Box label={label} className={className}>
      <select value={v(key)} onChange={(e) => onChange(key, e.target.value)} className={field}>
        <option value="">{anyLabel}</option>
        {options.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
      </select>
    </Box>
  );

  const nPlus = (n: number) => ({ value: n, label: `${n}+` });
  const areaOptions = (list: number[], suffix: string, topIsPlus: boolean, asMin: boolean) =>
    list.map((a, i) => ({ value: a, label: `${a.toLocaleString("en-IN")}${asMin && topIsPlus && i === list.length - 1 ? "+" : ""} ${suffix}` }));
  const plotOptions = PLOT_SQYD.map((a) => ({ value: a, label: formatArea(a, unit) }));
  const perUnit = type === "PLOT" ? PPSYD : PPSF;
  const ppsfOptions = (list: number[]) =>
    list.map((p) => ({ value: type === "PLOT" ? Math.round(p / SQFT_PER_SQYD) : p, label: `₹${p.toLocaleString("en-IN")}` }));

  const amenityOptions = Object.fromEntries(AMENITIES_BY_TYPE[type].map((k) => [k, AMENITY_LABELS[k]]));

  return (
    <div className={cn("space-y-5", wrap)}>
      <Section title="Basics">
        <Box label="Keyword" className="sm:col-span-2">
          <input value={v("q")} onChange={(e) => onChange("q", e.target.value)} maxLength={100} placeholder="e.g. ORR access, corner plot" className={field} />
        </Box>
        <Box label="Property type">
          <select value={v("type")} onChange={(e) => onChange("type", e.target.value)} className={field}>
            <option value="">Any type</option>
            {Object.entries(typeLabels).map(([k, l]) => <option key={k} value={k}>{l}</option>)}
          </select>
        </Box>
        <Box label="Locality">
          <select value={v("locality")} onChange={(e) => onChange("locality", e.target.value)} className={field}>
            <option value="">All localities</option>
            {localities.map((l) => <option key={l.id} value={l.slug}>{l.name}</option>)}
          </select>
        </Box>
        {select("minPrice", "Min price", "No minimum", PRICE_STEPS.map((p) => ({ value: p, label: p === TOP_PRICE ? `${formatInr(p)}+` : formatInr(p) })))}
        {select("maxPrice", "Max price", "No maximum", PRICE_STEPS.map((p) => ({ value: p, label: formatInr(p) })))}
        {has("ppsf") && select("minPpsf", `Min price per ${type === "PLOT" ? "sq yd" : "sq ft"}`, "No minimum", ppsfOptions(perUnit))}
        {has("ppsf") && select("maxPpsf", `Max price per ${type === "PLOT" ? "sq yd" : "sq ft"}`, "No maximum", ppsfOptions(perUnit))}
        {select("agent", "Listing agent", "Any agent", agents.map((a) => ({ value: a.id, label: `${a.name} (${a.listingCount})` })))}
      </Section>

      <Section title={type === "PLOT" ? "Plot size" : type === "APARTMENT" ? "Size and layout" : "Size, plot and layout"}>
        {has("plotArea") && (
          <>
            <Box label="Area unit">
              <select value={unit} onChange={(e) => onChange("unit", e.target.value)} className={field}>
                {(Object.keys(UNIT_LABEL) as AreaUnit[]).map((u) => <option key={u} value={u}>{UNIT_LABEL[u][0].toUpperCase() + UNIT_LABEL[u].slice(1)}</option>)}
              </select>
            </Box>
            {select("minPlotArea", `Min plot area (${UNIT_LABEL[unit]})`, "No minimum", plotOptions)}
            {select("maxPlotArea", `Max plot area (${UNIT_LABEL[unit]})`, "No maximum", plotOptions)}
          </>
        )}
        {has("beds") && select("minBeds", "Bedrooms", "Any", [1, 2, 3, 4, 5].map(nPlus))}
        {has("baths") && select("minBaths", "Bathrooms", "Any", [1, 2, 3, 4, 5].map(nPlus))}
        {has("carpet") && select("minCarpet", "Min carpet area (sq ft)", "No minimum", areaOptions(CARPET, "sq ft", false, true))}
        {has("carpet") && select("maxCarpet", "Max carpet area (sq ft)", "No maximum", areaOptions(CARPET, "sq ft", false, false))}
        {has("builtUp") && select("minArea", `Min ${type === "ANY" ? "area" : "built-up area"} (sq ft)`, "No minimum", areaOptions(BUILT_UP, "sq ft", true, true))}
        {has("builtUp") && select("maxArea", `Max ${type === "ANY" ? "area" : "built-up area"} (sq ft)`, "No maximum", areaOptions(BUILT_UP, "sq ft", true, false))}
        {has("floor") && select("minFloor", "Min floor", "Any", [1, 3, 5, 10, 15, 20, 25].map((f) => ({ value: f, label: `Floor ${f}+` })))}
        {has("floor") && select("maxFloor", "Max floor", "Any", [3, 5, 10, 15, 20, 25, 30, 40].map((f) => ({ value: f, label: `Up to floor ${f}` })))}
        {has("storeys") && select("minStoreys", "Floors in the villa", "Any", [{ value: 2, label: "G+1 or more" }, { value: 3, label: "G+2 or more" }])}
        {has("road") && select("minRoad", "Road width", "Any", [20, 30, 40, 60, 80].map((r) => ({ value: r, label: `${r} ft or wider` })))}
      </Section>

      <Section title="Details">
        {has("possession") && <Chips dark={dark} label="Possession" options={POSSESSION_LABELS} value={v("possession")} onChange={(x) => onChange("possession", x)} />}
        {has("approval") && <Chips dark={dark} label="Approval" options={APPROVAL_LABELS} value={v("approval")} onChange={(x) => onChange("approval", x)} />}
        {has("facing") && <Chips dark={dark} label="Facing" options={FACING_LABELS} value={v("facing")} onChange={(x) => onChange("facing", x)} />}
        {has("furnishing") && <Chips dark={dark} label="Furnishing" options={FURNISHING_LABELS} value={v("furnishing")} onChange={(x) => onChange("furnishing", x)} />}
        {has("parking") && select("minParking", "Car parking", "Any", [1, 2, 3].map((n) => ({ value: n, label: `${n}+ covered` })))}
        {has("age") && select("maxAge", "Age of property", "Any", [{ value: 0, label: "New / under construction" }, { value: 1, label: "Up to 1 year" }, { value: 3, label: "Up to 3 years" }, { value: 5, label: "Up to 5 years" }, { value: 10, label: "Up to 10 years" }])}
        {has("corner") && <Toggle dark={dark} label="Corner plot only" checked={v("corner") === "1"} onChange={(c) => onChange("corner", c ? "1" : "")} />}
        {has("gated") && <Toggle dark={dark} label={type === "PLOT" ? "Gated layout only" : "Gated community only"} checked={v("gated") === "1"} onChange={(c) => onChange("gated", c ? "1" : "")} />}
      </Section>

      {has("amenities") && (
        <Section title="Amenities">
          <Chips dark={dark} label="Must have all selected" options={amenityOptions} value={v("amenities")} onChange={(x) => onChange("amenities", x)} />
        </Section>
      )}

      <Section title="Order">
        {select("sort", "Sort by", "Newest", [{ value: "price_asc", label: "Price: low to high" }, { value: "price_desc", label: "Price: high to low" }], "sm:col-span-2")}
      </Section>
    </div>
  );
}
