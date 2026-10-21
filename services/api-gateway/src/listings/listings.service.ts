import { Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { z } from 'zod';
import { PrismaService } from '../common/prisma.service';
import { RedisService } from '../common/redis.service';

export const listingQuery = z.object({
  locality: z.string().optional(),
  type: z.enum(['PLOT', 'VILLA', 'APARTMENT', 'GATED_COMMUNITY']).optional(),
  minPrice: z.coerce.number().int().nonnegative().optional(),
  maxPrice: z.coerce.number().int().positive().optional(),
  minBeds: z.coerce.number().int().min(0).max(10).optional(),
  q: z.string().max(100).optional(),
  sort: z.enum(['newest', 'price_asc', 'price_desc']).default('newest'),
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(50).default(12),
});
export type ListingQuery = z.infer<typeof listingQuery>;

const include = { locality: true, agent: true } satisfies Prisma.ListingInclude;
type ListingRow = Prisma.ListingGetPayload<{ include: typeof include }>;

export function toDto(l: ListingRow) {
  return { ...l, priceInr: Number(l.priceInr) };
}

@Injectable()
export class ListingsService {
  constructor(private prisma: PrismaService, private redis: RedisService) {}

  private where(query: ListingQuery): Prisma.ListingWhereInput {
    return {
      status: 'ACTIVE',
      type: query.type,
      locality: query.locality ? { slug: query.locality } : undefined,
      priceInr: { gte: query.minPrice, lte: query.maxPrice },
      bedrooms: query.minBeds ? { gte: query.minBeds } : undefined,
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
      const orderBy: Prisma.ListingOrderByWithRelationInput =
        query.sort === 'price_asc'
          ? { priceInr: 'asc' }
          : query.sort === 'price_desc'
            ? { priceInr: 'desc' }
            : { createdAt: 'desc' };
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
        select: { id: true, title: true, lat: true, lng: true, priceInr: true, imageUrl: true },
        take: 500,
      });
      return rows.map((r) => ({ ...r, priceInr: Number(r.priceInr) }));
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
