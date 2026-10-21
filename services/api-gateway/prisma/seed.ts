import { PrismaClient, PropertyType } from '@prisma/client';

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

const slug = (s: string) => s.toLowerCase().replace(/[^a-z0-9]+/g, '-');

async function main() {
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
    ['Ravi Teja', 'Sneha Reddy', 'Imran Khan', 'Lakshmi Prasad'].map((name, i) =>
      prisma.agent.create({
        data: { name, phone: `+91 98480 0${1000 + i}`, reraId: `A5560${1000 + i}` },
      }),
    ),
  );

  const types: PropertyType[] = ['PLOT', 'VILLA', 'APARTMENT', 'GATED_COMMUNITY'];
  const names: Record<PropertyType, string> = {
    PLOT: 'DTCP-approved plot',
    VILLA: 'Independent villa',
    APARTMENT: '3BHK apartment',
    GATED_COMMUNITY: 'Villa in gated community',
  };

  let n = 0;
  for (const loc of locs) {
    for (let i = 0; i < 5; i++) {
      const type = types[(n + i) % types.length];
      const area = type === 'PLOT' ? 200 * 9 + i * 90 : 1400 + i * 350;
      const rate = loc.avgPricePerSqft * (0.85 + (i % 4) * 0.1);
      const price = BigInt(Math.round((area * rate) / 10000) * 10000);
      await prisma.listing.create({
        data: {
          title: `${names[type]} in ${loc.name}`,
          description:
            `${names[type]} in ${loc.name}, Hyderabad (${loc.zone}). ${area} sq ft. ` +
            `Close to ORR access, schools and IT corridor. Clear title, RERA registered.`,
          type,
          priceInr: price,
          areaSqft: area,
          bedrooms: type === 'PLOT' ? null : 3 + (i % 3),
          reraNumber: `P0220000${n.toString().padStart(4, '0')}`,
          lat: loc.lat + (((n * 37) % 100) - 50) / 3000,
          lng: loc.lng + (((n * 53) % 100) - 50) / 3000,
          imageUrl: `https://picsum.photos/seed/hyd-${n}/800/600`,
          localityId: loc.id,
          agentId: agents[n % agents.length].id,
        },
      });
      n++;
    }
  }
  console.log(`Seeded ${locs.length} localities, ${agents.length} agents, ${n} listings`);
}

main().finally(() => prisma.$disconnect());
