import { Injectable, OnModuleDestroy } from '@nestjs/common';
import Redis from 'ioredis';

@Injectable()
export class RedisService implements OnModuleDestroy {
  readonly client = new Redis(process.env.REDIS_URL ?? 'redis://localhost:6379', {
    lazyConnect: false,
    maxRetriesPerRequest: 2,
  });

  /** Read-through cache. Falls back to the loader if Redis is down. */
  async cached<T>(key: string, ttlSeconds: number, load: () => Promise<T>): Promise<T> {
    try {
      const hit = await this.client.get(key);
      if (hit) return JSON.parse(hit) as T;
    } catch {
      return load();
    }
    const value = await load();
    this.client.set(key, JSON.stringify(value), 'EX', ttlSeconds).catch(() => undefined);
    return value;
  }

  /** Drops cached listing pages, map points and single listings after one changes. Rate-limit counters are left alone. */
  async invalidateListings() {
    try {
      for (const pattern of ['listings:*', 'map:*', 'listing:*']) {
        let cursor = '0';
        do {
          const [next, keys] = await this.client.scan(cursor, 'MATCH', pattern, 'COUNT', 200);
          cursor = next;
          if (keys.length) await this.client.del(...keys);
        } while (cursor !== '0');
      }
    } catch {
      // the cache expires on its own within a minute or two
    }
  }

  onModuleDestroy() {
    this.client.disconnect();
  }
}
