import { describe, expect, it } from 'vitest';
import { EventsService } from '../src/events/events.service';

describe('EventsService', () => {
  it('does nothing and reports false when no brokers are configured', async () => {
    delete process.env.KAFKA_BROKERS;
    expect(await new EventsService().publish('t', 'k', { a: 1 })).toBe(false);
  });

  it('drops the event instead of throwing when the broker is unreachable', async () => {
    process.env.KAFKA_BROKERS = '127.0.0.1:1';
    const started = Date.now();
    expect(await new EventsService().publish('t', 'k', { a: 1 })).toBe(false);
    expect(Date.now() - started).toBeLessThan(15000);
    delete process.env.KAFKA_BROKERS;
  });
});
