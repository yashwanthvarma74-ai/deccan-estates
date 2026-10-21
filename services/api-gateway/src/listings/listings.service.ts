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
  q: z.string().max(100).optional(),
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

  list(query: ListingQuery) {
    return this.redis.cached(`listings:${JSON.stringify(query)}`, 60, async () => {
      const where: Prisma.ListingWhereInput = {
        status: 'ACTIVE',
        type: query.type,
        locality: query.locality ? { slug: query.locality } : undefined,
        priceInr: { gte: query.minPrice, lte: query.maxPrice },
        ...(query.q
          ? {
              OR: [
                { title: { contains: query.q, mode: 'insensitive' } },
                { description: { contains: query.q, mode: 'insensitive' } },
              ],
            }
          : {}),
      };
      const [items, total] = await this.prisma.$transaction([
        this.prisma.listing.findMany({
          where,
          include,
          orderBy: { createdAt: 'desc' },
          skip: (query.page - 1) * query.pageSize,
          take: query.pageSize,
        }),
        this.prisma.listing.count({ where }),
      ]);
      return { items: items.map(toDto), total, page: query.page, pageSize: query.pageSize };
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
