/**
 * Gives every agent listing a real photo of its own area and kind of property (see places.ts).
 * Safe to run again; listings posted by users keep the photos they uploaded.
 */
import { PrismaClient } from '@prisma/client';
import { placeImages } from './places';

const prisma = new PrismaClient();

async function main() {
  const rows = await prisma.listing.findMany({ where: { ownerId: null }, include: { locality: true }, orderBy: { id: 'asc' } });
  let n = 0;
  for (const l of rows) {
    const images = placeImages(l.locality.slug, l.type, n++);
    await prisma.listing.update({ where: { id: l.id }, data: { imageUrl: images[0], images } });
  }
  console.log(`updated ${rows.length} listings`);
}

main().finally(() => prisma.$disconnect());
