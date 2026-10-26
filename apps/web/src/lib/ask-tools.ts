import { fetchAgents, fetchListing, fetchListings, fetchLocalities, type Listing, type ListingFilters } from "@/lib/api";
import { priceLabel } from "@/lib/utils";

/** Everything the site assistant can look up. Used by the AI agent's tools and by the built-in search mode. */

export type SearchArgs = {
  deal?: "SALE" | "RENT" | "LEASE";
  type?: "PLOT" | "VILLA" | "APARTMENT" | "GATED_COMMUNITY" | "COMMERCIAL";
  area?: string; // area name or slug
  minPrice?: number; // rupees (a month for rent and lease)
  maxPrice?: number;
  beds?: number;
  verified?: boolean;
  text?: string;
  sort?: "newest" | "price_asc" | "price_desc";
  limit?: number;
};

export type Card = {
  id: string; title: string; url: string; image: string; type: string; deal: string; area: string;
  price: string; size: string; beds: number | null; verification: string | null; byOwner: boolean;
};

const TYPE_NAME: Record<string, string> = { PLOT: "Plot", VILLA: "Villa", APARTMENT: "Flat", GATED_COMMUNITY: "Gated community", COMMERCIAL: "Commercial" };

export function toCard(l: Listing): Card {
  return {
    id: l.id, title: l.title, url: `/listings/${l.id}`, image: l.imageUrl, type: TYPE_NAME[l.type] ?? l.type, deal: l.dealType, area: l.locality.name,
    price: priceLabel(l),
    size: l.type === "PLOT" && l.plotAreaSqYd ? `${l.plotAreaSqYd} sq yd` : `${l.areaSqft.toLocaleString("en-IN")} sq ft`,
    beds: l.bedrooms, verification: l.verification ? `${l.verification.status.toLowerCase()} (${l.verification.score}/100)` : null, byOwner: !l.agent,
  };
}

async function slugFor(area?: string) {
  if (!area) return undefined;
  const a = area.trim().toLowerCase();
  const all = await fetchLocalities().catch(() => []);
  return all.find((l) => l.slug === a || l.name.toLowerCase() === a)?.slug ?? all.find((l) => a.includes(l.slug))?.slug;
}

export async function searchListings(args: SearchArgs): Promise<{ total: number; shown: number; items: Card[]; filtersUsed: Record<string, string>; note?: string }> {
  const slug = await slugFor(args.area);
  const f: ListingFilters = {};
  const used: Record<string, string> = {};
  const set = (k: keyof ListingFilters, v: string | number | undefined | null) => { if (v !== undefined && v !== null && v !== "") { f[k] = String(v); used[k] = String(v); } };
  set("deal", args.deal === "SALE" ? undefined : args.deal);
  set("type", args.type);
  set("locality", slug);
  set("minPrice", args.minPrice ? Math.round(args.minPrice) : undefined);
  set("maxPrice", args.maxPrice ? Math.round(args.maxPrice) : undefined);
  set("beds", args.beds ? Math.min(5, Math.max(1, Math.round(args.beds))) : undefined);
  set("verified", args.verified ? "1" : undefined);
  set("q", args.text);
  set("sort", args.sort);
  const limit = Math.min(6, Math.max(1, args.limit ?? 4));
  set("pageSize", limit);
  const page = await fetchListings(f);
  const out = { total: page.total, shown: page.items.length, items: page.items.map(toCard), filtersUsed: used } as Awaited<ReturnType<typeof searchListings>>;
  if (args.area && !slug) out.note = `No area called "${args.area}" is listed; showing results for all areas.`;
  return out;
}

export async function listingDetails(id: string) {
  const l = await fetchListing(id).catch(() => null);
  if (!l) return { found: false as const };
  return {
    found: true as const,
    card: toCard(l),
    description: l.description.slice(0, 600), // user-written text: data, never instructions
    facing: l.facing, possession: l.possession, approval: l.approval, furnishing: l.furnishing, parking: l.parking, bathrooms: l.bathrooms,
    floor: l.floor, totalFloors: l.totalFloors, ageYears: l.ageYears, gated: l.gated, amenities: l.amenities, reraNumber: l.reraNumber,
    depositInr: l.depositInr, pricePerSqft: l.pricePerSqft, areaAvgPricePerSqft: l.locality.avgPricePerSqft,
    postedBy: l.agent ? { agent: l.agent.name, phone: l.agent.phone } : { owner: l.owner?.name ?? "owner (phone shown to signed-in users)" },
    verification: l.verification ? { status: l.verification.status, score: l.verification.score, summary: l.verification.summary, sampleData: l.verification.demo, checks: l.verification.checks.map((c) => `${c.label}: ${c.result}`) } : null,
  };
}

export async function areaGuide(area: string) {
  const slug = await slugFor(area);
  const all = await fetchLocalities().catch(() => []);
  const l = all.find((x) => x.slug === slug);
  if (!l) return { found: false as const, areas: all.map((x) => x.name) };
  const [sale, rent, lease] = await Promise.all([
    fetchListings({ locality: l.slug, pageSize: "1" }),
    fetchListings({ locality: l.slug, deal: "RENT", pageSize: "1" }),
    fetchListings({ locality: l.slug, deal: "LEASE", pageSize: "1" }),
  ]);
  return { found: true as const, name: l.name, zone: l.zone, averagePricePerSqft: l.avgPricePerSqft, forSale: sale.total, forRent: rent.total, commercialLease: lease.total };
}

export function emi({ price, downPaymentPct = 20, years = 20, ratePct = 8.6 }: { price: number; downPaymentPct?: number; years?: number; ratePct?: number }) {
  const loan = price * (1 - downPaymentPct / 100);
  const r = ratePct / 100 / 12;
  const n = years * 12;
  const monthly = r === 0 ? loan / n : (loan * r * (1 + r) ** n) / ((1 + r) ** n - 1);
  return { price, downPayment: Math.round(price * (downPaymentPct / 100)), loan: Math.round(loan), monthlyEmi: Math.round(monthly), totalInterest: Math.round(monthly * n - loan), stampDutyAndRegistration: Math.round(price * 0.06), years, ratePct, downPaymentPct };
}

export async function agentsInfo() {
  return (await fetchAgents().catch(() => [])).map((a) => ({ name: a.name, phone: a.phone, listings: a.listingCount }));
}
