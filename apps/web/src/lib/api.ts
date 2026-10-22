import { z } from "zod";

export const API_URL = process.env.API_URL ?? "http://localhost:4000";
/** Browser-visible API origin (used by client components). */
export const PUBLIC_API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000";

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
  type: z.enum(["PLOT", "VILLA", "APARTMENT", "GATED_COMMUNITY"]),
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
  agent: z.object({ name: z.string(), phone: z.string(), reraId: z.string() }),
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
};

export type ListingFilters = Partial<Record<FilterKey | "page" | "pageSize", string>>;

async function get<T>(base: string, path: string, schema: z.ZodType<T>): Promise<T> {
  const res = await fetch(`${base}${path}`);
  if (!res.ok) throw new Error(`API ${res.status} for ${path}`);
  return schema.parse(await res.json());
}

function qs(filters: ListingFilters) {
  const p = new URLSearchParams();
  for (const [k, v] of Object.entries(filters)) if (v) p.set(k, v);
  return p.toString();
}

export const fetchListings = (filters: ListingFilters, base = API_URL) =>
  get(base, `/listings?${qs(filters)}`, listingPage);

export const fetchListing = (id: string, base = API_URL) =>
  get(base, `/listings/${encodeURIComponent(id)}`, listingSchema);

export const fetchLocalities = (base = API_URL) =>
  get(base, "/localities", z.array(locality));

export const mapPointSchema = z.object({
  id: z.string(),
  title: z.string(),
  lat: z.number(),
  lng: z.number(),
  priceInr: z.number(),
  imageUrl: z.string(),
});
export type MapPoint = z.infer<typeof mapPointSchema>;

export const fetchMapPoints = (filters: ListingFilters, base = API_URL) =>
  get(base, `/listings/map?${qs({ ...filters, page: undefined, sort: undefined })}`, z.array(mapPointSchema));

export const agentSchema = z.object({ id: z.string(), name: z.string(), phone: z.string(), reraId: z.string(), listingCount: z.number() });
export type Agent = z.infer<typeof agentSchema>;

export const fetchAgents = (base = API_URL) => get(base, "/agents", z.array(agentSchema));

/** Every filter the search supports, in one place so forms and URLs stay in sync. */
export const FILTER_KEYS = [
  "q", "locality", "type", "minPrice", "maxPrice", "minBeds", "minBaths",
  "minArea", "maxArea", "minPlotArea", "maxPlotArea", "minCarpet", "maxCarpet",
  "minFloor", "maxFloor", "minStoreys", "minParking", "maxAge", "minRoad", "minPpsf", "maxPpsf",
  "facing", "furnishing", "possession", "approval", "amenities", "corner", "gated",
  "agent", "sort", "unit",
] as const;
export type FilterKey = (typeof FILTER_KEYS)[number];
