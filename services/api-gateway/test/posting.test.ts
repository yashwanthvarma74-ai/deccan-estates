import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { PrismaClient } from '@prisma/client';
import { sniffImage } from '../src/posting/images';
import { postBody } from '../src/posting/posting.schema';
import { PostingService } from '../src/posting/posting.service';

const valid = {
  dealType: 'RENT', type: 'APARTMENT', title: '2BHK flat near the metro', description: 'Bright flat on the 4th floor with a balcony and covered parking.',
  locality: 'kondapur', priceInr: '32000', depositInr: '100000', areaSqft: '1100', bedrooms: '2', bathrooms: '2',
  contactName: 'Asha Rao', contactPhone: '+91 90000 11111', images: ['0b9e6e0e-6f2f-4c0b-8f7d-1f8a3a7c9b11.jpg'],
};

describe('image sniffing', () => {
  it('accepts real JPEG, PNG and WebP headers', () => {
    expect(sniffImage(Buffer.from([0xff, 0xd8, 0xff, 0xe0, 0, 0x10, 0x4a, 0x46, 0x49, 0x46, 0, 1, 1]))?.ext).toBe('jpg');
    expect(sniffImage(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0, 0, 0, 0]))?.ext).toBe('png');
    expect(sniffImage(Buffer.from('RIFF\0\0\0\0WEBPVP8 '))?.ext).toBe('webp');
  });
  it('rejects scripts and other files renamed as images', () => {
    expect(sniffImage(Buffer.from('<script>alert(1)</script>'))).toBeNull();
    expect(sniffImage(Buffer.from('%PDF-1.7 ....................'))).toBeNull();
  });
});

describe('post body', () => {
  it('accepts a normal rental and treats blank optional fields as missing', () => {
    const r = postBody.parse({ ...valid, floor: '', facing: '', plotAreaSqYd: '' });
    expect(r.priceInr).toBe(32000);
    expect(r.floor).toBeUndefined();
    expect(r.possession).toBe('READY');
  });
  it('rejects missing photos, made-up photo names, tiny prices and short text', () => {
    expect(postBody.safeParse({ ...valid, images: [] }).success).toBe(false);
    expect(postBody.safeParse({ ...valid, images: ['../../etc/passwd'] }).success).toBe(false);
    expect(postBody.safeParse({ ...valid, priceInr: '5' }).success).toBe(false);
    expect(postBody.safeParse({ ...valid, title: 'Flat' }).success).toBe(false);
    expect(postBody.safeParse({ ...valid, contactPhone: 'abc' }).success).toBe(false);
    expect(postBody.safeParse({ ...valid, amenities: ['ROCKET'] }).success).toBe(false);
  });
});

(process.env.DATABASE_URL ? describe : describe.skip)('posting service', () => {
  const prisma = new PrismaClient();
  const counters = new Map<string, number>();
  const redis = {
    client: { incr: async (k: string) => { counters.set(k, (counters.get(k) ?? 0) + 1); return counters.get(k)!; }, expire: async () => 1 },
    invalidateListings: async () => undefined,
  };
  const storage = { put: async () => undefined, remove: async () => undefined };
  const svc = new PostingService(prisma as never, redis as never, storage as never);
  const alice = 'test-user-alice';
  const bob = 'test-user-bob';
  const clean = () => prisma.listing.deleteMany({ where: { ownerId: { in: [alice, bob] } } });
  beforeAll(clean);
  afterAll(async () => { await clean(); await prisma.$disconnect(); });

  it('creates a rental owned by the user, without exposing owner details', async () => {
    const dto = (await svc.create(alice, postBody.parse(valid))) as Record<string, unknown>;
    expect(dto.dealType).toBe('RENT');
    expect(dto.depositInr).toBe(100000);
    expect(dto.agent).toBeNull();
    expect(dto.owner).toEqual({ name: 'Asha Rao' });
    expect(dto).not.toHaveProperty('ownerId');
    expect(dto).not.toHaveProperty('contactPhone');
    expect(String(dto.imageUrl)).toContain('/uploads/');
  });

  it('rejects an unknown area', async () => {
    await expect(svc.create(alice, postBody.parse({ ...valid, locality: 'atlantis' }))).rejects.toThrow('Choose an area');
  });

  it('lists only the user\'s own listings', async () => {
    expect((await svc.mine(alice)).length).toBeGreaterThan(0);
    expect(await svc.mine(bob)).toHaveLength(0);
  });

  it('lets only the owner pause, mark done or delete', async () => {
    const id = (await svc.mine(alice))[0].id;
    await expect(svc.setStatus(bob, id, 'DRAFT')).rejects.toThrow('not your listing');
    await expect(svc.remove(bob, id)).rejects.toThrow('not your listing');
    expect(await svc.setStatus(alice, id, 'DRAFT')).toEqual({ id, status: 'DRAFT' });
    await svc.remove(alice, id);
    expect(await prisma.listing.count({ where: { id } })).toBe(0);
  });

  it('reveals the poster\'s phone only through contact()', async () => {
    const dto = (await svc.create(alice, postBody.parse(valid))) as { id: string };
    expect(await svc.contact(dto.id)).toEqual({ name: 'Asha Rao', phone: '+91 90000 11111', by: 'owner' });
    expect(await svc.contact('missing')).toBeNull();
  });

  it('limits how often one person can post', async () => {
    for (let i = 0; i < 12; i++) await svc.create(bob, postBody.parse(valid)).catch(() => undefined);
    await expect(svc.create(bob, postBody.parse(valid))).rejects.toThrow('too often');
  });
});
