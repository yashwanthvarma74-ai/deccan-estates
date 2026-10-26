import { bigint, boolean, doublePrecision, integer, jsonb, pgEnum, pgTable, text, timestamp } from 'drizzle-orm/pg-core';

/** Mirrors the tables Prisma owns in the api-gateway; this service only reads them. Update it when a migration changes them. */
export const propertyType = pgEnum('PropertyType', ['PLOT', 'VILLA', 'APARTMENT', 'GATED_COMMUNITY', 'COMMERCIAL']);
export const dealType = pgEnum('DealType', ['SALE', 'RENT', 'LEASE']);
export const listingStatus = pgEnum('ListingStatus', ['ACTIVE', 'SOLD', 'DRAFT']);
export const facing = pgEnum('Facing', ['EAST', 'WEST', 'NORTH', 'SOUTH', 'NORTH_EAST', 'NORTH_WEST', 'SOUTH_EAST', 'SOUTH_WEST']);
export const furnishing = pgEnum('Furnishing', ['UNFURNISHED', 'SEMI_FURNISHED', 'FURNISHED']);
export const possession = pgEnum('Possession', ['READY', 'UNDER_CONSTRUCTION', 'NEW_LAUNCH']);
export const approval = pgEnum('Approval', ['DTCP', 'HMDA', 'RERA']);
export const verifyStatus = pgEnum('VerifyStatus', ['VERIFIED', 'CAUTION', 'RISK']);

export const locality = pgTable('Locality', {
  id: text().primaryKey(),
  name: text().notNull(),
  slug: text().notNull(),
  zone: text().notNull(),
  avgPricePerSqft: integer().notNull(),
  lat: doublePrecision().notNull(),
  lng: doublePrecision().notNull(),
});

export const agent = pgTable('Agent', {
  id: text().primaryKey(),
  name: text().notNull(),
  phone: text().notNull(),
  reraId: text().notNull(),
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
  carpetSqft: integer(),
  pricePerSqft: integer().notNull(),
  bathrooms: integer(),
  floor: integer(),
  totalFloors: integer(),
  parking: integer().notNull(),
  ageYears: integer(),
  facing: facing(),
  furnishing: furnishing(),
  possession: possession().notNull(),
  approval: approval(),
  cornerPlot: boolean().notNull(),
  roadWidthFt: integer(),
  gated: boolean().notNull(),
  amenities: text().array(),
  bedrooms: integer(),
  reraNumber: text(),
  imageUrl: text().notNull(),
  lat: doublePrecision().notNull(),
  lng: doublePrecision().notNull(),
  localityId: text().notNull(),
  agentId: text(),
  dealType: dealType().notNull(),
  ownerId: text(),
  contactName: text(),
  depositInr: bigint({ mode: 'number' }),
  images: text().array(),
  createdAt: timestamp({ precision: 3, mode: 'string' }).notNull(),
});

export const verificationReport = pgTable('VerificationReport', {
  listingId: text().primaryKey(),
  status: verifyStatus().notNull(),
  score: integer().notNull(),
  summary: text().notNull(),
  checks: jsonb().notNull(),
  demo: boolean().notNull(),
  verifiedAt: timestamp({ precision: 3, mode: 'string' }).notNull(),
});
