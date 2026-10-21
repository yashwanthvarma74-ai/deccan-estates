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
});

export const listingSchema = z.object({
  id: z.string(),
  title: z.string(),
  description: z.string(),
  type: z.enum(["PLOT", "VILLA", "APARTMENT", "GATED_COMMUNITY"]),
  priceInr: z.number(),
  areaSqft: z.number(),
  bedrooms: z.number().nullable(),
  reraNumber: z.string().nullable(),
  imageUrl: z.string(),
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

export type ListingFilters = {
  locality?: string;
  type?: string;
  minPrice?: string;
  maxPrice?: string;
  q?: string;
  page?: string;
};

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
