import { Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { z } from 'zod';
import { PrismaService } from '../common/prisma.service';
import { RedisService } from '../common/redis.service';

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

export const listingQuery = z.object({
  /** What is on offer; defaults to homes for sale so rentals and leases do not mix into buying results. */
  deal: z.enum(['SALE', 'RENT', 'LEASE']).default('SALE'),
  locality: z.string().optional(),
  type: z.enum(['PLOT', 'VILLA', 'APARTMENT', 'GATED_COMMUNITY', 'COMMERCIAL']).optional(),
  minPrice: z.coerce.number().int().nonnegative().optional(),
  maxPrice: z.coerce.number().int().positive().optional(),
  minBeds: z.coerce.number().int().min(0).max(10).optional(),
  /** Exactly this many bedrooms; 5 means five or more. */
  beds: z.coerce.number().int().min(1).max(10).optional(),
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

const include = { locality: true, agent: true, verification: true } satisfies Prisma.ListingInclude;
type ListingRow = Prisma.ListingGetPayload<{ include: typeof include }>;

const UPLOADS_BASE = () => (process.env.PUBLIC_UPLOADS_BASE ?? 'http://localhost:4000').replace(/\/$/, '');
/** Uploaded photos are stored as "/uploads/<file>"; clients get a full address. */
export const publicImage = (u: string) => (u.startsWith('/uploads/') ? `${UPLOADS_BASE()}${u}` : u);

export function toDto(l: ListingRow) {
  // Never expose the poster's account id or phone; the phone is revealed to signed-in users through /listings/:id/contact.
  const { ownerId, contactName, contactPhone, depositInr, images, ...rest } = l;
  return {
    ...rest,
    priceInr: Number(l.priceInr),
    depositInr: depositInr === null ? null : Number(depositInr),
    imageUrl: publicImage(l.imageUrl),
    images: images.map(publicImage),
    owner: ownerId ? { name: contactName ?? 'Owner' } : null,
    verification: l.verification ?? null,
  };
}

@Injectable()
export class ListingsService {
  constructor(private prisma: PrismaService, private redis: RedisService) {}

  private where(query: ListingQuery): Prisma.ListingWhereInput {
    return {
      status: 'ACTIVE',
      dealType: query.deal,
      type: query.type,
      locality: query.locality ? { slug: query.locality } : undefined,
      priceInr: { gte: query.minPrice, lte: query.maxPrice },
      bedrooms: query.beds ? (query.beds >= 5 ? { gte: 5 } : { equals: query.beds }) : query.minBeds ? { gte: query.minBeds } : undefined,
      areaSqft: { gte: query.minArea, lte: query.maxArea },
      agentId: query.agent,
      plotAreaSqYd: { gte: query.minPlotArea, lte: query.maxPlotArea },
      carpetSqft: { gte: query.minCarpet, lte: query.maxCarpet },
      bathrooms: query.minBaths ? { gte: query.minBaths } : undefined,
      floor: { gte: query.minFloor, lte: query.maxFloor },
      totalFloors: query.minStoreys ? { gte: query.minStoreys } : undefined,
      parking: query.minParking ? { gte: query.minParking } : undefined,
      ageYears: query.maxAge !== undefined ? { lte: query.maxAge } : undefined,
      roadWidthFt: query.minRoad ? { gte: query.minRoad } : undefined,
      pricePerSqft: { gte: query.minPpsf, lte: query.maxPpsf },
      cornerPlot: query.corner,
      gated: query.gated,
      verification: query.verified ? { is: { status: 'VERIFIED' } } : undefined,
      facing: query.facing ? { in: query.facing } : undefined,
      furnishing: query.furnishing ? { in: query.furnishing } : undefined,
      possession: query.possession ? { in: query.possession } : undefined,
      approval: query.approval ? { in: query.approval } : undefined,
      amenities: query.amenities ? { hasEvery: query.amenities } : undefined,
      ...(query.q
        ? {
            OR: [
              { title: { contains: query.q, mode: 'insensitive' } },
              { description: { contains: query.q, mode: 'insensitive' } },
            ],
          }
        : {}),
    };
  }

  list(query: ListingQuery) {
    return this.redis.cached(`listings:${JSON.stringify(query)}`, 60, async () => {
      const where = this.where(query);
      // `id` breaks ties so pages never repeat or skip a listing.
      const orderBy: Prisma.ListingOrderByWithRelationInput[] = [
        query.sort === 'price_asc' ? { priceInr: 'asc' } : query.sort === 'price_desc' ? { priceInr: 'desc' } : { createdAt: 'desc' },
        { id: 'asc' },
      ];
      const [items, total] = await this.prisma.$transaction([
        this.prisma.listing.findMany({
          where,
          include,
          orderBy,
          skip: (query.page - 1) * query.pageSize,
          take: query.pageSize,
        }),
        this.prisma.listing.count({ where }),
      ]);
      return { items: items.map(toDto), total, page: query.page, pageSize: query.pageSize };
    });
  }

  /** Lightweight points for the map: every match, no pagination. */
  mapPoints(query: ListingQuery) {
    return this.redis.cached(`map:${JSON.stringify({ ...query, page: 1, sort: 'newest' })}`, 60, async () => {
      const rows = await this.prisma.listing.findMany({
        where: this.where(query),
        select: { id: true, title: true, lat: true, lng: true, priceInr: true, imageUrl: true, dealType: true, type: true, areaSqft: true, plotAreaSqYd: true, bedrooms: true, locality: { select: { name: true } } },
        take: 500,
      });
      return rows.map(({ locality, ...r }) => ({ ...r, priceInr: Number(r.priceInr), imageUrl: publicImage(r.imageUrl), locality: locality.name }));
    });
  }

  async get(id: string) {
    const listing = await this.redis.cached(`listing:${id}`, 120, async () => {
      const row = await this.prisma.listing.findUnique({ where: { id }, include });
      return row ? toDto(row) : null;
    });
    if (!listing) throw new NotFoundException('Listing not found');
    return listing;
  }
}
