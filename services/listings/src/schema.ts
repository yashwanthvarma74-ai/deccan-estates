import { bigint, boolean, doublePrecision, integer, pgEnum, pgTable, text, timestamp } from 'drizzle-orm/pg-core';

/** Mirrors the tables Prisma owns in the api-gateway; this service only reads them. */
export const propertyType = pgEnum('PropertyType', ['PLOT', 'VILLA', 'APARTMENT', 'GATED_COMMUNITY', 'COMMERCIAL']);
export const listingStatus = pgEnum('ListingStatus', ['ACTIVE', 'SOLD', 'DRAFT']);

export const locality = pgTable('Locality', {
  id: text().primaryKey(),
  name: text().notNull(),
  slug: text().notNull(),
  zone: text().notNull(),
  avgPricePerSqft: integer().notNull(),
  lat: doublePrecision().notNull(),
  lng: doublePrecision().notNull(),
});

export const listing = pgTable('Listing', {
  id: text().primaryKey(),
  title: text().notNull(),
  description: text().notNull(),
  type: propertyType().notNull(),
  status: listingStatus().notNull(),
  priceInr: bigint({ mode: 'number' }).notNull(),
  areaSqft: integer().notNull(),
  plotAreaSqYd: integer(),
  bedrooms: integer(),
  bathrooms: integer(),
  gated: boolean().notNull(),
  imageUrl: text().notNull(),
  lat: doublePrecision().notNull(),
  lng: doublePrecision().notNull(),
  localityId: text().notNull(),
  createdAt: timestamp({ precision: 3 }).notNull(),
});
