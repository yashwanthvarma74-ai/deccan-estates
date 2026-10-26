import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { createDb, buildServer } from '../src/server.js';

const url = process.env.DATABASE_URL;
const run = url ? describe : describe.skip;

run('listings service', () => {
  const { db, close } = createDb(url);
  const app = buildServer(db);
  beforeAll(() => app.ready());
  afterAll(async () => { await app.close(); await close(); });

  const call = async (path: string, input?: unknown) => {
    const q = input === undefined ? '' : `?input=${encodeURIComponent(JSON.stringify(input))}`;
    return app.inject({ method: 'GET', url: `/trpc/${path}${q}` });
  };
  const data = (r: { body: string }) => JSON.parse(r.body).result.data;

  it('reports health', async () => {
    expect((await app.inject('/health')).json()).toMatchObject({ status: 'ok' });
  });

  it('pages and counts active listings', async () => {
    const r = data(await call('listings.search', { pageSize: 5 }));
    expect(r.items.length).toBeLessThanOrEqual(5);
    expect(r.total).toBeGreaterThanOrEqual(r.items.length);
  });

  it('filters by type and price, sorted ascending', async () => {
    const r = data(await call('listings.search', { type: 'PLOT', maxPrice: 100_000_000, sort: 'price_asc' }));
    expect(r.items.every((i: { type: string; priceInr: number }) => i.type === 'PLOT' && i.priceInr <= 100_000_000)).toBe(true);
    const prices = r.items.map((i: { priceInr: number }) => i.priceInr);
    expect(prices).toEqual([...prices].sort((a: number, b: number) => a - b));
  });

  it('returns one listing and 404s unknown ids', async () => {
    const first = data(await call('listings.search', { pageSize: 1 })).items[0];
    expect(data(await call('listings.byId', { id: first.id })).title).toBe(first.title);
    expect((await call('listings.byId', { id: 'nope' })).statusCode).toBe(404);
  });

  it('rejects bad input', async () => {
    expect((await call('listings.search', { pageSize: 500 })).statusCode).toBe(400);
  });

  it('lists localities and map points', async () => {
    expect(data(await call('localities.all')).length).toBeGreaterThan(0);
    expect(data(await call('listings.map', {})).length).toBeGreaterThan(0);
  });
});
