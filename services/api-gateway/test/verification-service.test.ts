import * as grpc from '@grpc/grpc-js';
import * as loader from '@grpc/proto-loader';
import path from 'node:path';
import { afterEach, describe, expect, it } from 'vitest';
import { VerificationService, seedFor } from '../src/verification/verification.service';
import { buildReport } from '../src/verification/verification';

const proto = path.resolve(__dirname, '../../verification/proto/verification.proto');
const subject = { type: 'PLOT', possession: 'READY', approval: 'HMDA', locality: 'Kokapet' };

type Handler = (call: { request: { seed: number } }, cb: (e: Error | null, r?: unknown) => void) => void;

async function fakeServer(handler: Handler) {
  const pkg = grpc.loadPackageDefinition(loader.loadSync(proto, { enums: String, defaults: true })) as any;
  const server = new grpc.Server();
  server.addService(pkg.verification.v1.Verification.service, { GetReport: handler });
  const port = await new Promise<number>((res, rej) => server.bindAsync('127.0.0.1:0', grpc.ServerCredentials.createInsecure(), (e, p) => (e ? rej(e) : res(p))));
  return { addr: `127.0.0.1:${port}`, stop: () => server.forceShutdown() };
}

const make = (addr?: string, timeout = '500') => {
  if (addr) process.env.VERIFICATION_GRPC_ADDR = addr; else delete process.env.VERIFICATION_GRPC_ADDR;
  process.env.VERIFICATION_TIMEOUT_MS = timeout;
  return new VerificationService({} as never, {} as never);
};

let stop: (() => void) | undefined;
afterEach(() => { stop?.(); stop = undefined; delete process.env.VERIFICATION_GRPC_ADDR; });

describe('VerificationService', () => {
  it('uses the local report when no service address is set', async () => {
    const r = await make().report(subject, 5);
    expect(r.source).toBe('local');
    expect(r.report).toEqual(buildReport(subject, 5));
  });

  it('returns the remote report when the service answers', async () => {
    const remote = { status: 'CAUTION', score: 84, summary: 'from grpc', checks: [{ key: 'k', label: 'L', result: 'WARN', note: 'n', source: 's' }] };
    const s = await fakeServer((_c, cb) => cb(null, remote));
    stop = s.stop;
    const r = await make(s.addr).report(subject, 5);
    expect(r.source).toBe('grpc');
    expect(r.report.summary).toBe('from grpc');
  });

  it('falls back when the service is down', async () => {
    const r = await make('127.0.0.1:1').report(subject, 5);
    expect(r.source).toBe('local');
    expect(r.report).toEqual(buildReport(subject, 5));
  });

  it('falls back when the service is too slow', async () => {
    const s = await fakeServer(() => undefined);
    stop = s.stop;
    expect((await make(s.addr, '150').report(subject, 5)).source).toBe('local');
  });

  it('falls back when the reply is malformed', async () => {
    const s = await fakeServer((_c, cb) => cb(null, { status: 'STATUS_UNSPECIFIED', score: 0, summary: '', checks: [] }));
    stop = s.stop;
    expect((await make(s.addr).report(subject, 5)).source).toBe('local');
  });

  it('gives a listing the same seed every time', () => {
    expect(seedFor('abc')).toBe(seedFor('abc'));
    expect(seedFor('abc')).not.toBe(seedFor('abd'));
    expect(seedFor('abc')).toBeGreaterThanOrEqual(0);
  });
});
