import { Injectable, Logger, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../common/prisma.service';
import { EventsService } from './events.service';

const SWEEP_MS = Number(process.env.OUTBOX_SWEEP_MS ?? 5000);
const KEEP_DAYS = 7;

/**
 * Transactional outbox: an event is saved in the same transaction as the change it describes,
 * then published to Kafka. If the broker is down the row stays unpublished and a periodic sweep
 * replays it, so no event is lost. Delivery is at least once: a crash between publishing and
 * marking a row can send it twice, so consumers must tolerate repeats.
 */
@Injectable()
export class OutboxService implements OnModuleInit, OnModuleDestroy {
  private log = new Logger(OutboxService.name);
  private timer: NodeJS.Timeout | null = null;
  private running = false;

  constructor(private prisma: PrismaService, private events: EventsService) {}

  /** Events are off when no brokers are configured, so nothing is queued that could never be sent. */
  get enabled() {
    return Boolean(process.env.KAFKA_BROKERS?.trim());
  }

  /** Call inside the transaction that makes the change. */
  enqueue(tx: Prisma.TransactionClient, topic: string, key: string, payload: Prisma.InputJsonObject) {
    return this.enabled ? tx.outboxEvent.create({ data: { topic, key, payload } }) : Promise.resolve(null);
  }

  onModuleInit() {
    if (!this.enabled) return;
    this.timer = setInterval(() => void this.dispatch(), SWEEP_MS);
    this.timer.unref();
  }

  onModuleDestroy() {
    if (this.timer) clearInterval(this.timer);
  }

  /** Publishes up to `limit` waiting events, oldest first. Safe to run on several replicas at once. */
  async dispatch(limit = 50): Promise<{ sent: number; failed: number }> {
    if (!this.enabled || this.running) return { sent: 0, failed: 0 };
    this.running = true;
    let sent = 0;
    let failed = 0;
    try {
      await this.prisma.$transaction(
        async (tx) => {
          const rows = await tx.$queryRaw<{ id: string; topic: string; key: string; payload: unknown }[]>`
            SELECT id, topic, key, payload FROM "OutboxEvent"
            WHERE "publishedAt" IS NULL ORDER BY "createdAt", id LIMIT ${limit}
            FOR UPDATE SKIP LOCKED`;
          for (const r of rows) {
            const ok = await this.events.publish(r.topic, r.key, r.payload as object);
            if (ok) {
              sent++;
              await tx.outboxEvent.update({ where: { id: r.id }, data: { publishedAt: new Date() } });
            } else {
              failed++;
              await tx.outboxEvent.update({ where: { id: r.id }, data: { attempts: { increment: 1 }, lastError: 'publish failed' } });
              break; // the broker is unreachable; keep order and try again on the next sweep
            }
          }
        },
        { timeout: 30_000 },
      );
      await this.prisma.outboxEvent
        .deleteMany({ where: { publishedAt: { lt: new Date(Date.now() - KEEP_DAYS * 86_400_000) } } })
        .catch(() => undefined);
    } catch (e) {
      this.log.warn(`outbox sweep failed: ${(e as Error).message}`);
    } finally {
      this.running = false;
    }
    if (failed) this.log.warn(`${failed} event(s) not published yet; will retry`);
    return { sent, failed };
  }
}
