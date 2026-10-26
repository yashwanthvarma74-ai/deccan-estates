import { z } from 'zod';

export const AMENITIES = ['LIFT', 'GYM', 'SWIMMING_POOL', 'CLUBHOUSE', 'POWER_BACKUP', 'SECURITY_24X7', 'PARK', 'KIDS_PLAY_AREA', 'JOGGING_TRACK', 'PRIVATE_GARDEN', 'PRIVATE_POOL'] as const;

const blank = <T extends z.ZodType>(s: T) => z.preprocess((v) => (v === '' || v === null ? undefined : v), s.optional());
const int = (min: number, max: number) => blank(z.coerce.number().int().min(min).max(max));
const text = (max: number) => z.string().trim().min(1).max(max);

/** What a signed-in person sends to post a property. Photos are the file names returned by POST /uploads. */
export const postBody = z
  .object({
    dealType: z.enum(['SALE', 'RENT', 'LEASE']),
    type: z.enum(['PLOT', 'VILLA', 'APARTMENT', 'GATED_COMMUNITY', 'COMMERCIAL']),
    title: z.string().trim().min(8, 'Give it a title of at least 8 characters').max(100),
    description: z.string().trim().min(20, 'Describe the property in at least 20 characters').max(2000),
    locality: text(60),
    /** Sale price, or the monthly amount for rent and lease, in rupees. */
    priceInr: z.coerce.number().int().min(1000, 'Enter the price in rupees').max(100_000_000_000),
    depositInr: blank(z.coerce.number().int().min(0).max(1_000_000_000)),
    areaSqft: z.coerce.number().int().min(50, 'Enter the area in sq ft').max(10_000_000),
    plotAreaSqYd: int(1, 1_000_000),
    bedrooms: int(0, 20),
    bathrooms: int(0, 20),
    floor: int(0, 150),
    totalFloors: int(1, 150),
    parking: int(0, 50),
    ageYears: int(0, 100),
    facing: blank(z.enum(['EAST', 'WEST', 'NORTH', 'SOUTH', 'NORTH_EAST', 'NORTH_WEST', 'SOUTH_EAST', 'SOUTH_WEST'])),
    furnishing: blank(z.enum(['UNFURNISHED', 'SEMI_FURNISHED', 'FURNISHED'])),
    possession: z.enum(['READY', 'UNDER_CONSTRUCTION', 'NEW_LAUNCH']).default('READY'),
    gated: z.coerce.boolean().default(false),
    amenities: z.array(z.enum(AMENITIES)).max(AMENITIES.length).default([]),
    contactName: z.string().trim().min(2, 'Enter your name').max(80),
    contactPhone: z.string().trim().regex(/^[+0-9][0-9 ()-]{7,17}$/, 'Enter a valid phone number'),
    images: z
      .array(z.string().regex(/^[a-f0-9-]{36}\.(jpg|png|webp)$/, 'Unknown photo'))
      .min(1, 'Add at least one photo')
      .max(8, 'At most 8 photos'),
  });

export type PostBody = z.infer<typeof postBody>;

export const statusBody = z.object({ status: z.enum(['ACTIVE', 'SOLD', 'DRAFT']) });
