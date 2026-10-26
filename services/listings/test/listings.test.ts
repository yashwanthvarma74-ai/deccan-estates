import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { createDb, buildServer } from '../src/server.js';

const url = process.env.DATABASE_URL;
const gateway = process.env.GATEWAY_URL; // when set, results must equal the api-gateway's
const run = url ? describe : describe.skip;

run('listings service', () => {
  const { db, close } = createDb(url);
  const app = buildServer(db);
  beforeAll(() => app.ready());
  afterAll(async () => { await app.close(); await close(); });

  const call = (path: string, input?: unknown) =>
    app.inject({ method: 'GET', url: `/trpc/${path}${input === undefined ? '' : `?input=${encodeURIComponent(JSON.stringify(input))}`}` });
  const data = (r: { body: string }) => JSON.parse(r.body).result.data;

  it('reports health', async () => {
    expect((await app.inject('/health')).json()).toMatchObject({ status: 'ok' });
  });

  it('pages and counts active listings', async () => {
    const r = data(await call('listings.search', { pageSize: '5' }));
    expect(r.items.length).toBeLessThanOrEqual(5);
    expect(r.total).toBeGreaterThanOrEqual(r.items.length);
    expect(r.items[0]).toHaveProperty('locality.slug');
    expect(r.items[0]).toHaveProperty('agent.reraId');
  });

  it('filters by type and price, sorted ascending', async () => {
    const r = data(await call('listings.search', { type: 'PLOT', maxPrice: '100000000', sort: 'price_asc' }));
    expect(r.items.every((i: { type: string; priceInr: number }) => i.type === 'PLOT' && i.priceInr <= 100_000_000)).toBe(true);
    const prices = r.items.map((i: { priceInr: number }) => i.priceInr);
    expect(prices).toEqual([...prices].sort((a: number, b: number) => a - b));
  });

  it('applies multi-select, flag and verified filters', async () => {
    const r = data(await call('listings.search', { verified: '1', gated: '1', possession: 'READY,NEW_LAUNCH' }));
    for (const i of r.items) {
      expect(i.verification.status).toBe('VERIFIED');
      expect(i.gated).toBe(true);
      expect(['READY', 'NEW_LAUNCH']).toContain(i.possession);
    }
  });

  it('returns one listing and 404s unknown ids', async () => {
    const first = data(await call('listings.search', { pageSize: '1' })).items[0];
    expect(data(await call('listings.byId', { id: first.id })).title).toBe(first.title);
    expect((await call('listings.byId', { id: 'nope' })).statusCode).toBe(404);
  });

  it('rejects bad input', async () => {
    expect((await call('listings.search', { pageSize: '500' })).statusCode).toBe(400);
  });

  it('lists localities, agents and map points', async () => {
    expect(data(await call('localities.all')).length).toBeGreaterThan(0);
    expect(data(await call('agents.all'))[0]).toHaveProperty('listingCount');
    expect(data(await call('listings.map', {})).length).toBeGreaterThan(0);
  });

  const parity = gateway ? it : it.skip;
  const queries: Record<string, string>[] = [
    {}, { pageSize: '50' }, { locality: 'kondapur' }, { type: 'PLOT', sort: 'price_desc' }, { minPrice: '20000000', maxPrice: '80000000' },
    { verified: '1' }, { gated: '1', minBeds: '3' }, { possession: 'READY', approval: 'RERA,HMDA' }, { q: 'villa' }, { facing: 'EAST,NORTH', sort: 'price_asc' }, { page: '2', pageSize: '5' },
  ];
  parity.each(queries)('matches the gateway for %j', async (q) => {
    const mine = data(await call('listings.search', q));
    const theirs = await fetch(`${gateway}/listings?${new URLSearchParams(q)}`).then((r) => r.json());
    expect(mine).toEqual(theirs);
  });
  parity('matches the gateway for one listing, map points, localities and agents', async () => {
    const id = data(await call('listings.search', { pageSize: '1' })).items[0].id;
    expect(data(await call('listings.byId', { id }))).toEqual(await fetch(`${gateway}/listings/${id}`).then((r) => r.json()));
    const sortId = (a: { id: string }[]) => [...a].sort((x, y) => x.id.localeCompare(y.id));
    expect(sortId(data(await call('listings.map', {})))).toEqual(sortId(await fetch(`${gateway}/listings/map`).then((r) => r.json())));
    expect(data(await call('localities.all'))).toEqual(await fetch(`${gateway}/localities`).then((r) => r.json()));
    expect(data(await call('agents.all'))).toEqual(await fetch(`${gateway}/agents`).then((r) => r.json()));
  });
});
