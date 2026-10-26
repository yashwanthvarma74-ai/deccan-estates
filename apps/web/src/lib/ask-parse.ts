import type { SearchArgs } from "@/lib/ask-tools";

/** Understands everyday phrases such as "3 bhk flat for rent in kondapur under 40k" without any AI service. */

export type Intent =
  | { kind: "search"; args: SearchArgs }
  | { kind: "emi"; price: number; downPaymentPct?: number; years?: number; ratePct?: number }
  | { kind: "agents" }
  | { kind: "help" };

const UNITS: [RegExp, number][] = [[/^(cr|crore|crores)$/, 1e7], [/^(l|lac|lacs|lakh|lakhs)$/, 1e5], [/^(k|thousand)$/, 1e3]];

/** Every amount in the text, in rupees, with the words in front of it. */
export function amounts(text: string): { value: number; before: string }[] {
  const out: { value: number; before: string }[] = [];
  const re = /(\d+(?:[.,]\d+)*)\s*(cr|crores?|lakhs?|lacs?|l|k|thousand)?\b/gi;
  let m: RegExpExecArray | null;
  while ((m = re.exec(text))) {
    const n = Number(m[1].replace(/,/g, ""));
    if (!Number.isFinite(n)) continue;
    const unit = (m[2] ?? "").toLowerCase();
    const mult = UNITS.find(([r]) => r.test(unit))?.[1];
    const after = text.slice(m.index + m[0].length, m.index + m[0].length + 8).toLowerCase();
    if (!mult && (/^\s*(bhk|bed|sq|%|year|yr|percent)/.test(after) || n < 1000)) continue; // sizes, rates and years are not prices
    out.push({ value: Math.round(n * (mult ?? 1)), before: text.slice(Math.max(0, m.index - 22), m.index).toLowerCase() });
  }
  return out;
}

export function parseIntent(text: string, areas: { name: string; slug: string }[]): Intent {
  const t = text.toLowerCase();

  if (/\b(emi|loan|instal+ment|monthly payment)\b/.test(t)) {
    const price = amounts(t)[0]?.value;
    if (price && price >= 100000) {
      const years = /(\d{1,2})\s*(?:years?|yrs?)/.exec(t);
      const rate = /(\d{1,2}(?:\.\d+)?)\s*(?:%|percent)/.exec(t);
      const down = /(\d{1,2})\s*(?:%|percent)?\s*down/.exec(t);
      return { kind: "emi", price, years: years ? Number(years[1]) : undefined, ratePct: rate ? Number(rate[1]) : undefined, downPaymentPct: down ? Number(down[1]) : undefined };
    }
  }
  if (/\b(agents?|contact|phone number|call)\b/.test(t) && !/\b(flat|plot|villa|rent|buy|lease)\b/.test(t)) return { kind: "agents" };

  const args: SearchArgs = {};
  if (/\b(rent|rents|rental|rentals|rented|renting|tenant)\b/.test(t)) args.deal = "RENT";
  else if (/\b(lease|leases|leasing|commercial lease)\b/.test(t)) args.deal = "LEASE";
  else if (/\b(buy|purchase|sale|sell)\b/.test(t)) args.deal = "SALE";

  if (/\b(plots?|land|layout)\b/.test(t)) args.type = "PLOT";
  else if (/\b(gated|community|township)\b/.test(t)) args.type = "GATED_COMMUNITY";
  else if (/\b(villas?|independent house)\b/.test(t)) args.type = "VILLA";
  else if (/\b(flats?|apartments?|bhk|condo)\b/.test(t)) args.type = "APARTMENT";
  else if (/\b(offices?|shops?|commercial|showroom|co-?working|retail)\b/.test(t)) args.type = "COMMERCIAL";
  if (!args.deal && /\b(office|shop|commercial|showroom)\b/.test(t) && /\b(lease|leasing)\b/.test(t)) args.deal = "LEASE";

  const bhk = /(\d)\s*(?:bhk|bed(?:room)?s?)/.exec(t);
  if (bhk) args.beds = Number(bhk[1]);

  const area = areas.find((a) => new RegExp(`\\b${a.slug}\\b`).test(t) || new RegExp(`\\b${a.name.toLowerCase()}\\b`).test(t));
  if (area) args.area = area.slug;

  if (/\b(verified|checked|clean title|safe)\b/.test(t)) args.verified = true;
  if (/\b(cheap(?:est)?|lowest|affordable)\b/.test(t)) args.sort = "price_asc";
  if (/\b(expensive|luxury|premium|costliest)\b/.test(t)) args.sort = "price_desc";

  const nums = amounts(t);
  const between = /between\s+([\d.,]+\s*\w*)\s+(?:and|to|-)\s+([\d.,]+\s*\w*)/.exec(t);
  if (between) {
    const [a, b] = [amounts(between[1])[0]?.value ?? 0, amounts(between[2])[0]?.value ?? 0];
    if (a && b) { args.minPrice = Math.min(a, b); args.maxPrice = Math.max(a, b); }
  } else {
    for (const n of nums) {
      if (/(under|below|upto|up to|within|max|maximum|less than|budget|around|about)\W*$/.test(n.before)) args.maxPrice = n.value;
      else if (/(above|over|min|minimum|more than|starting|from)\W*$/.test(n.before)) args.minPrice = n.value;
    }
    if (!args.maxPrice && !args.minPrice && nums.length === 1) args.maxPrice = nums[0].value;
  }

  const hasSignal = args.deal || args.type || args.area || args.beds || args.maxPrice || args.minPrice || args.verified || args.sort;
  if (!hasSignal) return /\b(homes?|propert(?:y|ies)|show|find|list|search)\b/.test(t) ? { kind: "search", args: {} } : { kind: "help" };
  return { kind: "search", args };
}
