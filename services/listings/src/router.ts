import { initTRPC, TRPCError } from '@trpc/server';
import { and, asc, count, desc, eq, gte, lte, ilike, or, type SQL } from 'drizzle-orm';
import { z } from 'zod';
import type { Db } from './db.js';
import { listing, locality } from './schema.js';

export type Context = { db: Db };
const t = initTRPC.context<Context>().create();

export const searchInput = z.object({
  locality: z.string().optional(),
  type: z.enum(['PLOT', 'VILLA', 'APARTMENT', 'GATED_COMMUNITY', 'COMMERCIAL']).optional(),
  minPrice: z.number().int().nonnegative().optional(),
  maxPrice: z.number().int().positive().optional(),
  minBeds: z.number().int().min(0).max(10).optional(),
  q: z.string().max(100).optional(),
  sort: z.enum(['newest', 'price_asc', 'price_desc']).default('newest'),
  page: z.number().int().min(1).default(1),
  pageSize: z.number().int().min(1).max(50).default(12),
});

function conditions(i: z.infer<typeof searchInput>): SQL | undefined {
  const c: (SQL | undefined)[] = [eq(listing.status, 'ACTIVE')];
  if (i.locality) c.push(eq(locality.slug, i.locality));
  if (i.type) c.push(eq(listing.type, i.type));
  if (i.minPrice !== undefined) c.push(gte(listing.priceInr, i.minPrice));
  if (i.maxPrice !== undefined) c.push(lte(listing.priceInr, i.maxPrice));
  if (i.minBeds !== undefined) c.push(gte(listing.bedrooms, i.minBeds));
  if (i.q) c.push(or(ilike(listing.title, `%${i.q}%`), ilike(locality.name, `%${i.q}%`)));
  return and(...c);
}

const summary = {
  id: listing.id,
  title: listing.title,
  type: listing.type,
  priceInr: listing.priceInr,
  areaSqft: listing.areaSqft,
  plotAreaSqYd: listing.plotAreaSqYd,
  bedrooms: listing.bedrooms,
  imageUrl: listing.imageUrl,
  lat: listing.lat,
  lng: listing.lng,
  locality: locality.name,
  localitySlug: locality.slug,
};

export const appRouter = t.router({
  listings: t.router({
    search: t.procedure.input(searchInput).query(async ({ ctx, input }) => {
      const where = conditions(input);
      const order = input.sort === 'price_asc' ? asc(listing.priceInr) : input.sort === 'price_desc' ? desc(listing.priceInr) : desc(listing.createdAt);
      const [items, [{ total }]] = await Promise.all([
        ctx.db.select(summary).from(listing).innerJoin(locality, eq(listing.localityId, locality.id)).where(where).orderBy(order, asc(listing.id)).limit(input.pageSize).offset((input.page - 1) * input.pageSize),
        ctx.db.select({ total: count() }).from(listing).innerJoin(locality, eq(listing.localityId, locality.id)).where(where),
      ]);
      return { items, total, page: input.page, pageSize: input.pageSize };
    }),

    byId: t.procedure.input(z.object({ id: z.string().min(1) })).query(async ({ ctx, input }) => {
      const [row] = await ctx.db
        .select({ ...summary, description: listing.description, bathrooms: listing.bathrooms, gated: listing.gated })
        .from(listing).innerJoin(locality, eq(listing.localityId, locality.id)).where(eq(listing.id, input.id)).limit(1);
      if (!row) throw new TRPCError({ code: 'NOT_FOUND', message: 'Listing not found' });
      return row;
    }),

    map: t.procedure.input(searchInput.pick({ locality: true, type: true, minPrice: true, maxPrice: true, minBeds: true, q: true }).default({})).query(({ ctx, input }) =>
      ctx.db.select(summary).from(listing).innerJoin(locality, eq(listing.localityId, locality.id)).where(conditions({ ...input, sort: 'newest', page: 1, pageSize: 12 })).limit(500),
    ),
  }),

  localities: t.router({
    all: t.procedure.query(({ ctx }) => ctx.db.select().from(locality).orderBy(asc(locality.name))),
  }),
});
export type AppRouter = typeof appRouter;
