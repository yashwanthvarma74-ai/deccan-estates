import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import { PrismaClient } from '@prisma/client';
import { OutboxService } from '../src/events/outbox.service';
import type { EventsService } from '../src/events/events.service';

const run = process.env.DATABASE_URL ? describe : describe.skip;

run('outbox', () => {
  const prisma = new PrismaClient();
  let sent: { topic: string; key: string }[] = [];
  let up = false;
  const events = { publish: async (topic: string, key: string) => (up ? (sent.push({ topic, key }), true) : false) } as unknown as EventsService;
  const outbox = new OutboxService(prisma as never, events);
  const TOPIC = 'test.outbox';

  beforeAll(() => { process.env.KAFKA_BROKERS = 'test:9092'; });
  beforeEach(async () => { sent = []; up = false; await prisma.outboxEvent.deleteMany({ where: { topic: TOPIC } }); });
  afterAll(async () => { await prisma.outboxEvent.deleteMany({ where: { topic: TOPIC } }); await prisma.$disconnect(); delete process.env.KAFKA_BROKERS; });

  const enqueue = (key: string) => prisma.$transaction((tx) => outbox.enqueue(tx, TOPIC, key, { id: key }));

  it('keeps an event when the broker is down and replays it once it is back', async () => {
    await enqueue('a');
    expect(await outbox.dispatch()).toEqual({ sent: 0, failed: 1 });
    const waiting = await prisma.outboxEvent.findFirstOrThrow({ where: { topic: TOPIC } });
    expect(waiting.publishedAt).toBeNull();
    expect(waiting.attempts).toBe(1);

    up = true;
    expect(await outbox.dispatch()).toEqual({ sent: 1, failed: 0 });
    expect((await prisma.outboxEvent.findFirstOrThrow({ where: { topic: TOPIC } })).publishedAt).not.toBeNull();
    expect(sent).toEqual([{ topic: TOPIC, key: 'a' }]);
  });

  it('does not publish an event twice', async () => {
    up = true;
    await enqueue('b');
    await outbox.dispatch();
    await outbox.dispatch();
    expect(sent.filter((s) => s.key === 'b')).toHaveLength(1);
  });

  it('sends events oldest first', async () => {
    await enqueue('first');
    await new Promise((r) => setTimeout(r, 5));
    await enqueue('second');
    up = true;
    await outbox.dispatch();
    expect(sent.map((s) => s.key)).toEqual(['first', 'second']);
  });

  it('rolls the event back with the transaction that failed', async () => {
    await prisma.$transaction(async (tx) => { await outbox.enqueue(tx, TOPIC, 'c', { id: 'c' }); throw new Error('boom'); }).catch(() => undefined);
    expect(await prisma.outboxEvent.count({ where: { topic: TOPIC } })).toBe(0);
  });

  it('queues nothing and sends nothing when no brokers are configured', async () => {
    delete process.env.KAFKA_BROKERS;
    await enqueue('d');
    expect(await prisma.outboxEvent.count({ where: { topic: TOPIC } })).toBe(0);
    expect(await outbox.dispatch()).toEqual({ sent: 0, failed: 0 });
    process.env.KAFKA_BROKERS = 'test:9092';
  });
});
