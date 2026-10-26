import { BadRequestException, ForbiddenException, HttpException, HttpStatus, Injectable, NotFoundException } from '@nestjs/common';
import { randomUUID } from 'node:crypto';
import { mkdir, unlink, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { PrismaService } from '../common/prisma.service';
import { RedisService } from '../common/redis.service';
import { toDto } from '../listings/listings.service';
import { assertImage } from './images';
import type { PostBody } from './posting.schema';

export const UPLOAD_DIR = path.resolve(process.env.UPLOAD_DIR ?? path.join(process.cwd(), 'uploads'));
const MAX_ACTIVE = 20;
const POSTS_PER_HOUR = 10;
const UPLOADS_PER_HOUR = 60;

const include = { locality: true, agent: true, verification: true } as const;

/** Small deterministic offset so owner listings in one locality do not sit on the same map point. */
function jitter(id: string, salt: number) {
  let h = salt;
  for (const c of id) h = (h * 31 + c.charCodeAt(0)) >>> 0;
  return ((h % 1000) / 1000 - 0.5) * 0.018;
}

@Injectable()
export class PostingService {
  constructor(private prisma: PrismaService, private redis: RedisService) {}

  /** Counts actions per user per hour; fails open if Redis is down. */
  private async limit(userId: string, what: string, max: number) {
    try {
      const key = `rl:${what}:${userId}:${Math.floor(Date.now() / 3_600_000)}`;
      const n = await this.redis.client.incr(key);
      if (n === 1) await this.redis.client.expire(key, 3600);
      if (n > max) throw new HttpException('You are doing that too often. Try again later.', HttpStatus.TOO_MANY_REQUESTS);
    } catch (e) {
      if (e instanceof HttpException) throw e;
    }
  }

  async saveUpload(userId: string, file: { buffer: Buffer; size: number } | undefined) {
    await this.limit(userId, 'upload', UPLOADS_PER_HOUR);
    const { ext } = assertImage(file);
    const name = `${randomUUID()}.${ext}`;
    await mkdir(UPLOAD_DIR, { recursive: true });
    await writeFile(path.join(UPLOAD_DIR, name), file!.buffer, { flag: 'wx' });
    return { file: name, url: `/uploads/${name}` };
  }

  async create(userId: string, b: PostBody) {
    await this.limit(userId, 'post', POSTS_PER_HOUR);
    const active = await this.prisma.listing.count({ where: { ownerId: userId, status: 'ACTIVE' } });
    if (active >= MAX_ACTIVE) throw new BadRequestException(`You can have ${MAX_ACTIVE} live listings at a time. Pause or remove one first.`);

    const loc = await this.prisma.locality.findFirst({ where: { OR: [{ slug: b.locality }, { name: { equals: b.locality, mode: 'insensitive' } }] } });
    if (!loc) throw new BadRequestException('Choose an area from the list');

    const images = b.images.map((f) => `/uploads/${f}`);
    const id = randomUUID();
    const row = await this.prisma.listing.create({
      data: {
        id,
        title: b.title,
        description: b.description,
        type: b.type,
        dealType: b.dealType,
        status: 'ACTIVE',
        priceInr: BigInt(b.priceInr),
        depositInr: b.dealType === 'SALE' || b.depositInr === undefined ? null : BigInt(b.depositInr),
        areaSqft: b.areaSqft,
        plotAreaSqYd: b.plotAreaSqYd,
        pricePerSqft: Math.round(b.priceInr / b.areaSqft),
        bedrooms: b.type === 'PLOT' ? null : b.bedrooms,
        bathrooms: b.type === 'PLOT' ? null : b.bathrooms,
        floor: b.floor,
        totalFloors: b.totalFloors,
        parking: b.parking ?? 0,
        ageYears: b.ageYears,
        facing: b.facing,
        furnishing: b.furnishing,
        possession: b.possession,
        gated: b.gated,
        amenities: b.amenities,
        imageUrl: images[0],
        images,
        lat: loc.lat + jitter(id, 7),
        lng: loc.lng + jitter(id, 13),
        localityId: loc.id,
        ownerId: userId,
        contactName: b.contactName,
        contactPhone: b.contactPhone,
      },
      include,
    });
    await this.redis.invalidateListings();
    return toDto(row);
  }

  async mine(userId: string) {
    const rows = await this.prisma.listing.findMany({ where: { ownerId: userId }, include, orderBy: { createdAt: 'desc' } });
    return rows.map((r) => ({ ...toDto(r), status: r.status }));
  }

  private async owned(userId: string, id: string) {
    const row = await this.prisma.listing.findUnique({ where: { id }, select: { ownerId: true, images: true } });
    if (!row) throw new NotFoundException('Listing not found');
    if (row.ownerId !== userId) throw new ForbiddenException('This is not your listing');
    return row;
  }

  async setStatus(userId: string, id: string, status: 'ACTIVE' | 'SOLD' | 'DRAFT') {
    await this.owned(userId, id);
    if (status === 'ACTIVE') {
      const active = await this.prisma.listing.count({ where: { ownerId: userId, status: 'ACTIVE', NOT: { id } } });
      if (active >= MAX_ACTIVE) throw new BadRequestException(`You can have ${MAX_ACTIVE} live listings at a time.`);
    }
    await this.prisma.listing.update({ where: { id }, data: { status } });
    await this.redis.invalidateListings();
    return { id, status };
  }

  async remove(userId: string, id: string) {
    const row = await this.owned(userId, id);
    await this.prisma.listing.delete({ where: { id } });
    await Promise.all(row.images.map((u) => unlink(path.join(UPLOAD_DIR, path.basename(u))).catch(() => undefined)));
    await this.redis.invalidateListings();
  }

  async contact(id: string) {
    const row = await this.prisma.listing.findUnique({ where: { id }, include: { agent: true } });
    if (!row) return null;
    if (row.ownerId) return { name: row.contactName ?? 'Owner', phone: row.contactPhone ?? '', by: 'owner' as const };
    return row.agent ? { name: row.agent.name, phone: row.agent.phone, by: 'agent' as const } : null;
  }
}
