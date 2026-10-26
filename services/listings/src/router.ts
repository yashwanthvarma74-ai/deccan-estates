import { initTRPC, TRPCError } from '@trpc/server';
import { and, arrayContains, asc, count, desc, eq, gte, ilike, inArray, lte, or, sql, type SQL } from 'drizzle-orm';
import { z } from 'zod';
import type { Db } from './db.js';
import { listingQuery, type ListingQuery } from './query.js';
import { agent, listing, locality, verificationReport } from './schema.js';

export type Context = { db: Db };
const t = initTRPC.context<Context>().create();

const range = (col: Parameters<typeof gte>[0], min?: number, max?: number) => [min !== undefined ? gte(col, min) : undefined, max !== undefined ? lte(col, max) : undefined];
/** Escapes LIKE wildcards so a search for "50%" matches the text, as the gateway's `contains` does. */
const like = (v: string) => `%${v.replace(/[\\%_]/g, '\\$&')}%`;

function conditions(q: ListingQuery): SQL | undefined {
  const c: (SQL | undefined)[] = [
    eq(listing.status, 'ACTIVE'),
    eq(listing.dealType, q.deal),
    q.type ? eq(listing.type, q.type) : undefined,
    q.locality ? eq(locality.slug, q.locality) : undefined,
    ...range(listing.priceInr, q.minPrice, q.maxPrice),
    q.beds ? (q.beds >= 5 ? gte(listing.bedrooms, 5) : eq(listing.bedrooms, q.beds)) : q.minBeds ? gte(listing.bedrooms, q.minBeds) : undefined,
    ...range(listing.areaSqft, q.minArea, q.maxArea),
    q.agent ? eq(listing.agentId, q.agent) : undefined,
    ...range(listing.plotAreaSqYd, q.minPlotArea, q.maxPlotArea),
    ...range(listing.carpetSqft, q.minCarpet, q.maxCarpet),
    q.minBaths ? gte(listing.bathrooms, q.minBaths) : undefined,
    ...range(listing.floor, q.minFloor, q.maxFloor),
    q.minStoreys ? gte(listing.totalFloors, q.minStoreys) : undefined,
    q.minParking ? gte(listing.parking, q.minParking) : undefined,
    q.maxAge !== undefined ? lte(listing.ageYears, q.maxAge) : undefined,
    q.minRoad ? gte(listing.roadWidthFt, q.minRoad) : undefined,
    ...range(listing.pricePerSqft, q.minPpsf, q.maxPpsf),
    q.corner !== undefined ? eq(listing.cornerPlot, q.corner) : undefined,
    q.gated !== undefined ? eq(listing.gated, q.gated) : undefined,
    q.verified ? eq(verificationReport.status, 'VERIFIED') : undefined,
    q.facing ? inArray(listing.facing, q.facing as never) : undefined,
    q.furnishing ? inArray(listing.furnishing, q.furnishing as never) : undefined,
    q.possession ? inArray(listing.possession, q.possession as never) : undefined,
    q.approval ? inArray(listing.approval, q.approval as never) : undefined,
    q.amenities ? arrayContains(listing.amenities, q.amenities) : undefined,
    q.q ? or(ilike(listing.title, like(q.q)), ilike(listing.description, like(q.q))) : undefined,
  ];
  return and(...c);
}

/** Drizzle returns timestamps as "2026-10-26 09:00:00.123" (UTC); the API sends ISO strings. */
const iso = (s: string) => new Date(`${s.replace(' ', 'T')}Z`).toISOString();

type Row = { l: typeof listing.$inferSelect; loc: typeof locality.$inferSelect; a: typeof agent.$inferSelect | null; v: typeof verificationReport.$inferSelect | null };

const uploadsBase = () => (process.env.PUBLIC_UPLOADS_BASE ?? 'http://localhost:4000').replace(/\/$/, '');
/** Uploaded photos are stored as "/uploads/<file>"; clients get a full address. */
const publicImage = (u: string) => (u.startsWith('/uploads/') ? `${uploadsBase()}${u}` : u);

/** Same JSON the api-gateway returns for a listing. The poster's account id and phone never leave the database. */
function toDto({ l, loc, a, v }: Row) {
  const { ownerId, contactName, ...rest } = l;
  return {
    ...rest,
    createdAt: iso(l.createdAt),
    amenities: l.amenities ?? [],
    imageUrl: publicImage(l.imageUrl),
    images: (l.images ?? []).map(publicImage),
    owner: ownerId ? { name: contactName ?? 'Owner' } : null,
    locality: loc,
    agent: a,
    verification: v ? { ...v, verifiedAt: iso(v.verifiedAt) } : null,
  };
}

const from = (db: Db) =>
  db
    .select({ l: listing, loc: locality, a: agent, v: verificationReport })
    .from(listing)
    .innerJoin(locality, eq(listing.localityId, locality.id))
    .leftJoin(agent, eq(listing.agentId, agent.id))
    .leftJoin(verificationReport, eq(verificationReport.listingId, listing.id));

export const appRouter = t.router({
  listings: t.router({
    search: t.procedure.input(listingQuery).query(async ({ ctx, input }) => {
      const where = conditions(input);
      const order = input.sort === 'price_asc' ? asc(listing.priceInr) : input.sort === 'price_desc' ? desc(listing.priceInr) : desc(listing.createdAt);
      const [rows, [{ total }]] = await Promise.all([
        from(ctx.db).where(where).orderBy(order, asc(listing.id)).limit(input.pageSize).offset((input.page - 1) * input.pageSize),
        ctx.db
          .select({ total: count() })
          .from(listing)
          .innerJoin(locality, eq(listing.localityId, locality.id))
          .leftJoin(verificationReport, eq(verificationReport.listingId, listing.id))
          .where(where),
      ]);
      return { items: rows.map(toDto), total, page: input.page, pageSize: input.pageSize };
    }),

    byId: t.procedure.input(z.object({ id: z.string().min(1) })).query(async ({ ctx, input }) => {
      const [row] = await from(ctx.db).where(eq(listing.id, input.id)).limit(1);
      if (!row) throw new TRPCError({ code: 'NOT_FOUND', message: 'Listing not found' });
      return toDto(row);
    }),

    /** Lightweight points for the map: every match, no pagination. */
    map: t.procedure.input(listingQuery.default({} as never)).query(async ({ ctx, input }) => {
      const rows = await ctx.db
        .select({
          id: listing.id, title: listing.title, lat: listing.lat, lng: listing.lng, priceInr: listing.priceInr, imageUrl: listing.imageUrl,
          dealType: listing.dealType, type: listing.type, areaSqft: listing.areaSqft, plotAreaSqYd: listing.plotAreaSqYd, bedrooms: listing.bedrooms, locality: locality.name,
        })
        .from(listing)
        .innerJoin(locality, eq(listing.localityId, locality.id))
        .leftJoin(verificationReport, eq(verificationReport.listingId, listing.id))
        .where(conditions(input))
        .limit(500);
      return rows.map((r) => ({ ...r, imageUrl: publicImage(r.imageUrl) }));
    }),
  }),

  localities: t.router({
    all: t.procedure.query(({ ctx }) => ctx.db.select().from(locality).orderBy(asc(locality.name))),
  }),

  agents: t.router({
    all: t.procedure.query(async ({ ctx }) => {
      const rows = await ctx.db
        .select({ id: agent.id, name: agent.name, phone: agent.phone, reraId: agent.reraId, listingCount: sql<number>`count(${listing.id})::int` })
        .from(agent)
        .leftJoin(listing, eq(listing.agentId, agent.id))
        .groupBy(agent.id)
        .orderBy(asc(agent.name));
      return rows;
    }),
  }),
});
export type AppRouter = typeof appRouter;
