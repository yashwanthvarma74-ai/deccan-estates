import { buildReport } from '../src/verification/verification';
import { placeImages } from './places';
import { Approval, Facing, Furnishing, Possession, Prisma, PrismaClient, PropertyType } from '@prisma/client';

const prisma = new PrismaClient();

const localities = [
  { name: 'Gachibowli', zone: 'West', avg: 9500, lat: 17.4401, lng: 78.3489 },
  { name: 'Kondapur', zone: 'West', avg: 8200, lat: 17.4691, lng: 78.3568 },
  { name: 'Kokapet', zone: 'West', avg: 11000, lat: 17.395, lng: 78.33 },
  { name: 'Narsingi', zone: 'West', avg: 7800, lat: 17.387, lng: 78.359 },
  { name: 'Tellapur', zone: 'West', avg: 6200, lat: 17.458, lng: 78.283 },
  { name: 'Shamshabad', zone: 'South', avg: 3800, lat: 17.2543, lng: 78.429 },
  { name: 'Adibatla', zone: 'South', avg: 3200, lat: 17.22, lng: 78.55 },
  { name: 'Miyapur', zone: 'North-West', avg: 6000, lat: 17.496, lng: 78.357 },
  { name: 'Kompally', zone: 'North', avg: 5600, lat: 17.54, lng: 78.487 },
  { name: 'Uppal', zone: 'East', avg: 5200, lat: 17.405, lng: 78.559 },
];

/** Real aerial photos of Hyderabad, matched to the kind of property (no random stock images). */
const STILLS: Record<string, string[]> = {
  PLOT: ['s5', 's6'],
  VILLA: ['s5'],
  GATED_COMMUNITY: ['s5', 's6'],
  APARTMENT: ['s2', 's4', 's6'],
  COMMERCIAL: ['s1', 's3', 's4'],
};
const photoFor = (type: string, n: number) => `/stills/${STILLS[type][n % STILLS[type].length]}.jpg`;

const slug = (s: string) => s.toLowerCase().replace(/[^a-z0-9]+/g, '-');

async function main() {
  await prisma.verificationReport.deleteMany();
  await prisma.savedListing.deleteMany();
  await prisma.listing.deleteMany();
  await prisma.agent.deleteMany();
  await prisma.locality.deleteMany();

  const locs = await Promise.all(
    localities.map((l) =>
      prisma.locality.create({
        data: { name: l.name, slug: slug(l.name), zone: l.zone, avgPricePerSqft: l.avg, lat: l.lat, lng: l.lng },
      }),
    ),
  );
  const agents = await Promise.all(
    ['Ravi Teja', 'Akhil Yadav', 'Imran Khan', 'Mahesh'].map((name, i) =>
      prisma.agent.create({
        data: { name, phone: `+91 98480 0${1000 + i}`, reraId: `A5560${1000 + i}` },
      }),
    ),
  );

  const types: PropertyType[] = ['PLOT', 'VILLA', 'APARTMENT', 'GATED_COMMUNITY', 'COMMERCIAL'];
  const names: Record<PropertyType, string> = {
    PLOT: 'DTCP-approved plot',
    VILLA: 'Independent villa',
    APARTMENT: 'apartment',
    GATED_COMMUNITY: 'Villa in gated community',
    COMMERCIAL: 'Office space',
  };

  const facings: Facing[] = ['EAST', 'NORTH', 'WEST', 'SOUTH', 'NORTH_EAST', 'SOUTH_EAST', 'NORTH_WEST', 'SOUTH_WEST'];
  const furnishings: Furnishing[] = ['UNFURNISHED', 'SEMI_FURNISHED', 'FURNISHED'];
  const approvals: Approval[] = ['DTCP', 'HMDA', 'RERA'];
  const aptAmenities = ['LIFT', 'GYM', 'SWIMMING_POOL', 'CLUBHOUSE', 'POWER_BACKUP', 'SECURITY_24X7', 'PARK', 'KIDS_PLAY_AREA'];
  const villaAmenities = ['PRIVATE_GARDEN', 'PRIVATE_POOL', 'SECURITY_24X7', 'POWER_BACKUP', 'PARK', 'CLUBHOUSE'];
  const communityAmenities = ['CLUBHOUSE', 'SWIMMING_POOL', 'GYM', 'PARK', 'JOGGING_TRACK', 'KIDS_PLAY_AREA', 'SECURITY_24X7', 'POWER_BACKUP'];
  const officeAmenities = ['LIFT', 'POWER_BACKUP', 'SECURITY_24X7', 'PARK', 'GYM', 'CLUBHOUSE'];
  const plotSizesSqYd = [150, 200, 240, 267, 300, 400, 500, 600, 1000, 2420, 4840];

  // Deterministic pick so reseeding gives the same data.
  const pick = <T,>(list: T[], n: number, salt = 0) => list[(n * 7 + salt * 3) % list.length];
  const subset = (list: string[], n: number, count: number) =>
    Array.from({ length: count }, (_, i) => list[(n + i * 3) % list.length]).filter((v, i, arr) => arr.indexOf(v) === i);

  let n = 0;
  for (const loc of locs) {
    for (let i = 0; i < 8; i++) {
      const type = types[n % types.length];
      const rate = loc.avgPricePerSqft * (0.85 + (i % 4) * 0.1);
      const common = {
        type,
        localityId: loc.id,
        agentId: agents[n % agents.length].id,
        reraNumber: `P0220000${n.toString().padStart(4, '0')}`,
        imageUrl: placeImages(slug(loc.name), type, n)[0],
        images: placeImages(slug(loc.name), type, n),
        lat: loc.lat + (((n * 37) % 100) - 50) / 3000,
        lng: loc.lng + (((n * 53) % 100) - 50) / 3000,
        facing: pick(facings, n),
      };
      let data: Prisma.ListingUncheckedCreateInput;

      if (type === 'PLOT') {
        // Larger plots (half-acre and acre) only in the outer, cheaper localities.
        const outer = loc.avgPricePerSqft < 4000;
        const sizes = outer ? plotSizesSqYd : plotSizesSqYd.filter((s) => s <= 1000);
        const sqYd = pick(sizes, n);
        const areaSqft = sqYd * 9;
        const price = Math.round((areaSqft * rate) / 10000) * 10000;
        data = {
          ...common,
          title: `${names.PLOT} in ${loc.name}`,
          description: `${sqYd} sq yd (${areaSqft} sq ft) ${approvals[n % 3]}-approved plot in ${loc.name}, Hyderabad (${loc.zone}). ${pick(facings, n)} facing, ${pick([30, 40, 60], n)} ft road. Clear title, RERA registered.`,
          priceInr: BigInt(price),
          areaSqft,
          plotAreaSqYd: sqYd,
          pricePerSqft: Math.round(price / areaSqft),
          approval: approvals[n % 3],
          cornerPlot: n % 4 === 0,
          roadWidthFt: pick([30, 40, 60], n),
          gated: n % 3 === 0,
          possession: 'READY',
          amenities: [],
        };
      } else if (type === 'APARTMENT') {
        const bhk = 2 + (n % 3);
        const builtUp = [1150, 1650, 2300][bhk - 2] + (n % 5) * 40;
        const price = Math.round((builtUp * rate) / 10000) * 10000;
        const floor = 1 + ((n * 5) % 30);
        const possession: Possession = n % 5 === 0 ? 'UNDER_CONSTRUCTION' : n % 7 === 0 ? 'NEW_LAUNCH' : 'READY';
        data = {
          ...common,
          title: `${bhk}BHK ${names.APARTMENT} in ${loc.name}`,
          description: `${bhk}BHK apartment in ${loc.name}, Hyderabad (${loc.zone}). ${builtUp} sq ft built-up, floor ${floor}. ${common.facing.replace('_', '-').toLowerCase()} facing. Clear title, RERA registered.`,
          priceInr: BigInt(price),
          areaSqft: builtUp,
          carpetSqft: Math.round(builtUp * 0.78),
          pricePerSqft: Math.round(price / builtUp),
          bedrooms: bhk,
          bathrooms: bhk,
          floor,
          totalFloors: floor + 2 + (n % 10),
          parking: 1 + (n % 2),
          ageYears: possession === 'READY' ? n % 9 : 0,
          furnishing: pick(furnishings, n),
          possession,
          gated: true,
          amenities: subset(aptAmenities, n, 4 + (n % 3)),
        };
      } else if (type === 'COMMERCIAL') {
        const builtUp = [800, 1200, 2000, 3500, 5000, 8000, 12000, 20000][n % 8];
        const price = Math.round((builtUp * rate * 1.05) / 10000) * 10000;
        const floor = 1 + ((n * 3) % 24);
        const possession: Possession = n % 6 === 0 ? 'UNDER_CONSTRUCTION' : n % 9 === 0 ? 'NEW_LAUNCH' : 'READY';
        data = {
          ...common,
          title: `${names.COMMERCIAL} in ${loc.name}`,
          description: `${builtUp} sq ft office space on floor ${floor} in ${loc.name}, Hyderabad (${loc.zone}). Grade-A building with power backup and 24x7 security. RERA registered.`,
          priceInr: BigInt(price),
          areaSqft: builtUp,
          carpetSqft: Math.round(builtUp * 0.75),
          pricePerSqft: Math.round(price / builtUp),
          bathrooms: 2 + Math.floor(builtUp / 4000),
          floor,
          totalFloors: floor + 3 + (n % 12),
          parking: 1 + Math.floor(builtUp / 2500),
          ageYears: possession === 'READY' ? n % 8 : 0,
          furnishing: pick(furnishings, n, 2),
          possession,
          gated: true,
          amenities: subset(officeAmenities, n, 4),
        };
      } else {
        const community = type === 'GATED_COMMUNITY';
        const bhk = community ? 3 + (n % 2) : 3 + (n % 3);
        const plotSqYd = community ? 150 + (n % 4) * 50 : 200 + (n % 6) * 80;
        const builtUp = community ? 1800 + (n % 5) * 300 : 2200 + (n % 6) * 420;
        const price = Math.round((builtUp * rate * 1.15) / 10000) * 10000;
        const possession: Possession = n % 6 === 0 ? 'UNDER_CONSTRUCTION' : n % 8 === 0 ? 'NEW_LAUNCH' : 'READY';
        data = {
          ...common,
          title: `${names[type]} in ${loc.name}`,
          description: `${bhk}BHK ${community ? 'villa in a gated community' : 'independent villa'} in ${loc.name}, Hyderabad (${loc.zone}). ${plotSqYd} sq yd plot, ${builtUp} sq ft built-up. Clear title, RERA registered.`,
          priceInr: BigInt(price),
          areaSqft: builtUp,
          plotAreaSqYd: plotSqYd,
          carpetSqft: Math.round(builtUp * 0.85),
          pricePerSqft: Math.round(price / builtUp),
          bedrooms: bhk,
          bathrooms: bhk + 1,
          totalFloors: 2 + ((n >> 1) % 2),
          parking: 2 + (n % 2),
          ageYears: possession === 'READY' ? n % 7 : 0,
          furnishing: pick(furnishings, n, 1),
          possession,
          gated: community,
          amenities: subset(community ? communityAmenities : villaAmenities, n, community ? 6 : 3),
        };
      }
      const created = await prisma.listing.create({ data });
      const report = buildReport({ type, possession: created.possession, approval: created.approval, locality: loc.name }, n);
      await prisma.verificationReport.create({
        data: { listingId: created.id, status: report.status, score: report.score, summary: report.summary, checks: report.checks, demo: true },
      });
      n++;
    }
  }
  console.log(`Seeded ${locs.length} localities, ${agents.length} agents, ${n} listings`);
}

main().finally(() => prisma.$disconnect());
