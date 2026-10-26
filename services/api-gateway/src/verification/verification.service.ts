import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import * as grpc from '@grpc/grpc-js';
import * as loader from '@grpc/proto-loader';
import { createHash } from 'node:crypto';
import path from 'node:path';
import { z } from 'zod';
import { PrismaService } from '../common/prisma.service';
import { RedisService } from '../common/redis.service';
import { buildReport, type Report } from './verification';

const PROTO = process.env.VERIFICATION_PROTO ?? path.resolve(__dirname, '../../../verification/proto/verification.proto');

const reply = z.object({
  status: z.enum(['VERIFIED', 'CAUTION', 'RISK']),
  score: z.number().int().min(0).max(100),
  summary: z.string().min(1),
  checks: z.array(z.object({ key: z.string(), label: z.string(), result: z.enum(['PASS', 'WARN', 'FAIL']), note: z.string(), source: z.string() })).min(1),
});

type Subject = { type: string; possession: string; approval: string | null; locality: string };
type Client = { GetReport(req: object, opts: { deadline: Date }, cb: (err: grpc.ServiceError | null, res?: unknown) => void): void };

/** A stable non-negative number for a listing, so its report never changes between calls. */
export const seedFor = (id: string) => createHash('sha256').update(id).digest().readUInt32BE(0) % 1_000_000;

/** Builds reports through the Go verification service; falls back to the in-process version if it is unset, down, slow or sends something unexpected. */
@Injectable()
export class VerificationService {
  private log = new Logger(VerificationService.name);
  private client: Client | null = null;

  constructor(private prisma: PrismaService, private redis: RedisService) {
    const addr = process.env.VERIFICATION_GRPC_ADDR;
    if (!addr) return;
    const def = loader.loadSync(PROTO, { enums: String, defaults: true, keepCase: false });
    const pkg = grpc.loadPackageDefinition(def) as unknown as { verification: { v1: { Verification: new (a: string, c: grpc.ChannelCredentials) => Client } } };
    this.client = new pkg.verification.v1.Verification(addr, grpc.credentials.createInsecure());
  }

  async report(subject: Subject, seed: number): Promise<{ report: Report; source: 'grpc' | 'local' }> {
    if (this.client) {
      try {
        return { report: await this.remote(subject, seed), source: 'grpc' };
      } catch (e) {
        this.log.warn(`verification service unavailable, using local reports: ${(e as Error).message}`);
      }
    }
    return { report: buildReport(subject, seed), source: 'local' };
  }

  private remote(s: Subject, seed: number): Promise<Report> {
    return new Promise((resolve, reject) => {
      this.client!.GetReport(
        { type: s.type, possession: s.possession, approval: s.approval ?? '', locality: s.locality, seed },
        { deadline: new Date(Date.now() + Number(process.env.VERIFICATION_TIMEOUT_MS ?? 1500)) },
        (err, res) => {
          if (err) return reject(err);
          const parsed = reply.safeParse(res);
          parsed.success ? resolve(parsed.data) : reject(new Error('unexpected reply shape'));
        },
      );
    });
  }

  /** Returns the stored report, creating it first when the listing has none. */
  async ensure(listingId: string) {
    const listing = await this.prisma.listing.findUnique({ where: { id: listingId }, include: { locality: true, verification: true } });
    if (!listing) throw new NotFoundException('Listing not found');
    if (listing.verification) return { created: false, source: 'stored' as const, report: listing.verification };
    const { report, source } = await this.report(
      { type: listing.type, possession: listing.possession, approval: listing.approval, locality: listing.locality.name },
      seedFor(listing.id),
    );
    const row = await this.prisma.verificationReport.upsert({
      where: { listingId },
      create: { listingId, status: report.status, score: report.score, summary: report.summary, checks: report.checks },
      update: {},
    });
    await this.redis.client.del(`listing:${listingId}`).catch(() => undefined);
    return { created: true, source, report: row };
  }
}
