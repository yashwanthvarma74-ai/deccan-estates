import { z } from "zod";

export const API_URL = process.env.API_URL ?? "http://localhost:4000";
/** Browser-visible API origin (used by client components). */
export const PUBLIC_API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000";

/**
 * Optional Fastify listings service (services/listings). When set, listing reads go there
 * and fall back to the gateway above if it is unreachable. Unset = gateway only.
 */
const LISTINGS_URL = process.env.LISTINGS_URL;
const PUBLIC_LISTINGS_URL = process.env.NEXT_PUBLIC_LISTINGS_URL;

const locality = z.object({
  id: z.string(),
  name: z.string(),
  slug: z.string(),
  zone: z.string(),
  avgPricePerSqft: z.number(),
  lat: z.number(),
  lng: z.number(),
});

export const listingSchema = z.object({
  id: z.string(),
  title: z.string(),
  description: z.string(),
  type: z.enum(["PLOT", "VILLA", "APARTMENT", "GATED_COMMUNITY", "COMMERCIAL"]),
  priceInr: z.number(),
  areaSqft: z.number(),
  plotAreaSqYd: z.number().nullable(),
  carpetSqft: z.number().nullable(),
  pricePerSqft: z.number(),
  bedrooms: z.number().nullable(),
  bathrooms: z.number().nullable(),
  floor: z.number().nullable(),
  totalFloors: z.number().nullable(),
  parking: z.number(),
  ageYears: z.number().nullable(),
  facing: z.string().nullable(),
  furnishing: z.string().nullable(),
  possession: z.string(),
  approval: z.string().nullable(),
  cornerPlot: z.boolean(),
  roadWidthFt: z.number().nullable(),
  gated: z.boolean(),
  amenities: z.array(z.string()),
  reraNumber: z.string().nullable(),
  imageUrl: z.string(),
  lat: z.number(),
  lng: z.number(),
  locality,
  dealType: z.enum(["SALE", "RENT", "LEASE"]).default("SALE"),
  depositInr: z.number().nullable().default(null),
  images: z.array(z.string()).default([]),
  /** Set when a person posted the listing themselves instead of an agent. */
  owner: z.object({ name: z.string() }).nullable().default(null),
  status: z.enum(["ACTIVE", "SOLD", "DRAFT"]).optional(),
  agent: z.object({ name: z.string(), phone: z.string(), reraId: z.string() }).nullable(),
  verification: z
    .object({
      status: z.enum(["VERIFIED", "CAUTION", "RISK"]),
      score: z.number(),
      summary: z.string(),
      demo: z.boolean(),
      verifiedAt: z.string(),
      checks: z.array(z.object({ key: z.string(), label: z.string(), result: z.enum(["PASS", "WARN", "FAIL"]), note: z.string(), source: z.string() })),
    })
    .nullable()
    .optional(),
});
export type Listing = z.infer<typeof listingSchema>;

const listingPage = z.object({
  items: z.array(listingSchema),
  total: z.number(),
  page: z.number(),
  pageSize: z.number(),
});

export const typeLabels: Record<Listing["type"], string> = {
  PLOT: "Plot",
  VILLA: "Villa",
  APARTMENT: "Apartment",
  GATED_COMMUNITY: "Gated community",
  COMMERCIAL: "Commercial",
};

export type ListingFilters = Partial<Record<FilterKey | "page" | "pageSize", string>>;

async function get<T>(base: string, path: string, schema: z.ZodType<T>): Promise<T> {
  const res = await fetch(`${base}${path}`);
  if (!res.ok) throw new Error(`API ${res.status} for ${path}`);
  return schema.parse(await res.json());
}

/** Calls one tRPC query on the listings service, or returns null when it is not configured for this caller. */
async function viaListingsService<T>(base: string, procedure: string, input: unknown, schema: z.ZodType<T>): Promise<T | null> {
  const target = base === API_URL ? LISTINGS_URL : base === PUBLIC_API_URL ? PUBLIC_LISTINGS_URL : undefined;
  if (!target) return null;
  try {
    const res = await fetch(`${target}/trpc/${procedure}?input=${encodeURIComponent(JSON.stringify(input))}`);
    if (!res.ok) return null;
    return schema.parse(((await res.json()) as { result: { data: unknown } }).result.data);
  } catch {
    return null;
  }
}

const clean = (filters: ListingFilters) => Object.fromEntries(Object.entries(filters).filter(([, v]) => v));

function qs(filters: ListingFilters) {
  const p = new URLSearchParams();
  for (const [k, v] of Object.entries(filters)) if (v) p.set(k, v);
  return p.toString();
}

export const fetchListings = async (filters: ListingFilters, base = API_URL) =>
  (await viaListingsService(base, "listings.search", clean(filters), listingPage)) ?? get(base, `/listings?${qs(filters)}`, listingPage);

export const fetchListing = async (id: string, base = API_URL) =>
  (await viaListingsService(base, "listings.byId", { id }, listingSchema)) ?? get(base, `/listings/${encodeURIComponent(id)}`, listingSchema);

export const fetchLocalities = async (base = API_URL) =>
  (await viaListingsService(base, "localities.all", undefined, z.array(locality))) ?? get(base, "/localities", z.array(locality));

export const mapPointSchema = z.object({
  id: z.string(),
  title: z.string(),
  lat: z.number(),
  lng: z.number(),
  priceInr: z.number(),
  imageUrl: z.string(),
  dealType: z.string().default("SALE"),
  type: z.string(),
  areaSqft: z.number(),
  plotAreaSqYd: z.number().nullable(),
  bedrooms: z.number().nullable(),
  locality: z.string(),
});
export type MapPoint = z.infer<typeof mapPointSchema>;

export const fetchMapPoints = async (filters: ListingFilters, base = API_URL) => {
  const f = { ...filters, page: undefined, sort: undefined };
  return (await viaListingsService(base, "listings.map", clean(f), z.array(mapPointSchema))) ?? get(base, `/listings/map?${qs(f)}`, z.array(mapPointSchema));
};

export const agentSchema = z.object({ id: z.string(), name: z.string(), phone: z.string(), reraId: z.string(), listingCount: z.number() });
export type Agent = z.infer<typeof agentSchema>;

export const fetchAgents = async (base = API_URL) =>
  (await viaListingsService(base, "agents.all", undefined, z.array(agentSchema))) ?? get(base, "/agents", z.array(agentSchema));

/** Every filter the search supports, in one place so forms and URLs stay in sync. */
export const FILTER_KEYS = [
  "q", "locality", "type", "minPrice", "maxPrice", "minBeds", "beds", "minBaths",
  "minArea", "maxArea", "minPlotArea", "maxPlotArea", "minCarpet", "maxCarpet",
  "minFloor", "maxFloor", "minStoreys", "minParking", "maxAge", "minRoad", "minPpsf", "maxPpsf",
  "facing", "furnishing", "possession", "approval", "amenities", "corner", "gated", "verified",
  "agent", "sort", "unit", "deal",
] as const;
export type FilterKey = (typeof FILTER_KEYS)[number];
