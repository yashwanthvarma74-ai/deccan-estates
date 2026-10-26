import { Injectable, Logger, OnModuleDestroy } from '@nestjs/common';
import { Kafka, logLevel, type Producer } from 'kafkajs';

export const TOPICS = { enquiryCreated: 'enquiry.created' } as const;

/**
 * Publishes domain events to Kafka. Publishing never blocks or fails a request:
 * with no KAFKA_BROKERS set it does nothing, and any send error is logged and dropped.
 */
@Injectable()
export class EventsService implements OnModuleDestroy {
  private log = new Logger(EventsService.name);
  private producer: Producer | null = null;
  private connecting: Promise<Producer | null> | null = null;

  private async connect(): Promise<Producer | null> {
    const brokers = process.env.KAFKA_BROKERS?.split(',').map((b) => b.trim()).filter(Boolean);
    if (!brokers?.length) return null;
    const producer = new Kafka({ clientId: 'deccan-api', brokers, logLevel: logLevel.NOTHING, connectionTimeout: 2000, retry: { retries: 2 } }).producer({ allowAutoTopicCreation: true });
    try {
      await producer.connect();
      return (this.producer = producer);
    } catch (e) {
      this.log.warn(`kafka unavailable, events are dropped: ${(e as Error).message}`);
      this.connecting = null; // try again on the next event
      return null;
    }
  }

  /** Fire and forget; resolves once the attempt is over. */
  async publish(topic: string, key: string, payload: object): Promise<boolean> {
    try {
      const producer = this.producer ?? (await (this.connecting ??= this.connect()));
      if (!producer) return false;
      await producer.send({ topic, messages: [{ key, value: JSON.stringify(payload) }] });
      return true;
    } catch (e) {
      this.log.warn(`could not publish to ${topic}: ${(e as Error).message}`);
      return false;
    }
  }

  async onModuleDestroy() {
    await this.producer?.disconnect().catch(() => undefined);
  }
}
