/**
 * Adds sample rent and lease listings so those tabs are not empty. Only adds; never changes or removes existing rows,
 * and does nothing if rent or lease listings already exist. They are marked as samples in the title.
 */
import { PrismaClient } from '@prisma/client';
import { placeImages } from './places';

const prisma = new PrismaClient();

type Rental = {
  deal: 'RENT' | 'LEASE';
  type: 'PLOT' | 'VILLA' | 'APARTMENT' | 'GATED_COMMUNITY' | 'COMMERCIAL';
  loc: string;
  title: string;
  rent: number;
  deposit: number;
  area: number;
  beds?: number;
  baths?: number;
  floor?: number;
  of?: number;
  plot?: number;
  furn: 'UNFURNISHED' | 'SEMI_FURNISHED' | 'FURNISHED' | null;
};

const RENTALS: Rental[] = [
  { deal: 'RENT', type: 'APARTMENT', loc: 'gachibowli', title: '2 BHK flat near the Financial District (sample)', rent: 38000, deposit: 150000, area: 1150, beds: 2, baths: 2, floor: 8, of: 18, furn: 'SEMI_FURNISHED' },
  { deal: 'RENT', type: 'APARTMENT', loc: 'kondapur', title: '3 BHK flat with club house (sample)', rent: 52000, deposit: 200000, area: 1650, beds: 3, baths: 3, floor: 12, of: 22, furn: 'FURNISHED' },
  { deal: 'RENT', type: 'VILLA', loc: 'kokapet', title: '4 BHK independent villa with garden (sample)', rent: 145000, deposit: 600000, area: 3600, beds: 4, baths: 5, furn: 'SEMI_FURNISHED' },
  { deal: 'RENT', type: 'APARTMENT', loc: 'miyapur', title: '2 BHK flat 5 minutes from the metro (sample)', rent: 21000, deposit: 80000, area: 1050, beds: 2, baths: 2, floor: 4, of: 12, furn: 'UNFURNISHED' },
  { deal: 'RENT', type: 'GATED_COMMUNITY', loc: 'tellapur', title: '3 BHK villa in a gated community (sample)', rent: 62000, deposit: 250000, area: 2400, beds: 3, baths: 4, furn: 'SEMI_FURNISHED' },
  { deal: 'RENT', type: 'APARTMENT', loc: 'uppal', title: '1 BHK flat for working professionals (sample)', rent: 12500, deposit: 50000, area: 640, beds: 1, baths: 1, floor: 3, of: 8, furn: 'FURNISHED' },
  { deal: 'LEASE', type: 'COMMERCIAL', loc: 'gachibowli', title: 'Office floor in an IT tower, 3-year lease (sample)', rent: 480000, deposit: 2880000, area: 8000, floor: 9, of: 20, furn: 'UNFURNISHED' },
  { deal: 'LEASE', type: 'COMMERCIAL', loc: 'kondapur', title: 'Ground-floor shop on the main road (sample)', rent: 95000, deposit: 570000, area: 900, floor: 0, of: 4, furn: 'UNFURNISHED' },
  { deal: 'LEASE', type: 'COMMERCIAL', loc: 'kokapet', title: 'Furnished office suite for a growing team (sample)', rent: 210000, deposit: 1260000, area: 3200, floor: 6, of: 15, furn: 'FURNISHED' },
  { deal: 'LEASE', type: 'PLOT', loc: 'shamshabad', title: 'Open commercial plot near the airport, long lease (sample)', rent: 150000, deposit: 900000, area: 21780, plot: 2420, furn: null },
];

async function main() {
  if ((await prisma.listing.count({ where: { dealType: { in: ['RENT', 'LEASE'] } } })) > 0) return console.log('rent/lease listings already exist; nothing added');
  const agents = await prisma.agent.findMany({ orderBy: { id: 'asc' } });
  const locs = await prisma.locality.findMany();
  let n = 0;
  for (const r of RENTALS) {
    const loc = locs.find((l) => l.slug === r.loc)!;
    const images = placeImages(loc.slug, r.type, n);
    await prisma.listing.create({
      data: {
        title: r.title,
        description: `${r.title.replace(' (sample)', '')} in ${loc.name}, Hyderabad. Sample listing for demonstration; details are illustrative.`,
        type: r.type,
        dealType: r.deal,
        priceInr: BigInt(r.rent),
        depositInr: BigInt(r.deposit),
        areaSqft: r.area,
        plotAreaSqYd: r.plot ?? null,
        pricePerSqft: Math.round(r.rent / r.area),
        bedrooms: r.beds ?? null,
        bathrooms: r.baths ?? null,
        floor: r.floor ?? null,
        totalFloors: r.of ?? null,
        parking: 1 + (n % 3),
        furnishing: r.furn,
        possession: 'READY',
        gated: r.type === 'GATED_COMMUNITY' || r.type === 'VILLA',
        amenities: [],
        imageUrl: images[0],
        images,
        lat: loc.lat + (((n * 37) % 100) - 50) / 3000,
        lng: loc.lng + (((n * 53) % 100) - 50) / 3000,
        localityId: loc.id,
        agentId: agents[n % agents.length].id,
      },
    });
    n++;
  }
  console.log(`added ${n} sample rent and lease listings`);
}

main().finally(() => prisma.$disconnect());
