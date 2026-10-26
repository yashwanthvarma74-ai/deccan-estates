import { z } from 'zod';

const FACINGS = ['EAST', 'WEST', 'NORTH', 'SOUTH', 'NORTH_EAST', 'NORTH_WEST', 'SOUTH_EAST', 'SOUTH_WEST'] as const;
const FURNISHINGS = ['UNFURNISHED', 'SEMI_FURNISHED', 'FURNISHED'] as const;
const POSSESSIONS = ['READY', 'UNDER_CONSTRUCTION', 'NEW_LAUNCH'] as const;
const APPROVALS = ['DTCP', 'HMDA', 'RERA'] as const;

/** "true" / "1" → true; anything else (or absent) → undefined, so the filter is simply off. */
const flag = z.string().optional().transform((v) => (v === '1' || v === 'true' ? true : undefined));

/** Comma-separated multi-select, validated against the allowed values. */
const list = <T extends readonly [string, ...string[]]>(values: T) =>
  z
    .string()
    .optional()
    .transform((v) => (v ? v.split(',').map((x) => x.trim()).filter(Boolean) : undefined))
    .pipe(z.array(z.enum(values)).min(1).optional());

/** Same query the api-gateway accepts (values arrive as strings from the URL), so the web app can pass its filters straight through. */
export const listingQuery = z.object({
  locality: z.string().optional(),
  type: z.enum(['PLOT', 'VILLA', 'APARTMENT', 'GATED_COMMUNITY', 'COMMERCIAL']).optional(),
  minPrice: z.coerce.number().int().nonnegative().optional(),
  maxPrice: z.coerce.number().int().positive().optional(),
  minBeds: z.coerce.number().int().min(0).max(10).optional(),
  minArea: z.coerce.number().int().nonnegative().optional(),
  maxArea: z.coerce.number().int().positive().optional(),
  agent: z.string().max(64).optional(),
  minPlotArea: z.coerce.number().nonnegative().optional(),
  maxPlotArea: z.coerce.number().positive().optional(),
  minCarpet: z.coerce.number().int().nonnegative().optional(),
  maxCarpet: z.coerce.number().int().positive().optional(),
  minBaths: z.coerce.number().int().min(0).max(10).optional(),
  minFloor: z.coerce.number().int().min(0).optional(),
  maxFloor: z.coerce.number().int().positive().optional(),
  minStoreys: z.coerce.number().int().min(1).max(10).optional(),
  minParking: z.coerce.number().int().min(0).max(10).optional(),
  maxAge: z.coerce.number().int().min(0).max(100).optional(),
  minRoad: z.coerce.number().int().min(0).optional(),
  minPpsf: z.coerce.number().int().nonnegative().optional(),
  maxPpsf: z.coerce.number().int().positive().optional(),
  corner: flag,
  gated: flag,
  verified: flag,
  facing: list(FACINGS),
  furnishing: list(FURNISHINGS),
  possession: list(POSSESSIONS),
  approval: list(APPROVALS),
  amenities: z.string().max(300).optional().transform((v) => (v ? v.split(',').map((a) => a.trim()).filter(Boolean) : undefined)),
  q: z.string().max(100).optional(),
  sort: z.enum(['newest', 'price_asc', 'price_desc']).default('newest'),
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(50).default(12),
});
export type ListingQuery = z.infer<typeof listingQuery>;
