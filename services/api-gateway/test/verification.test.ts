import { describe, expect, it } from 'vitest';
import { buildReport } from '../src/verification/verification';

const plot = { type: 'PLOT', possession: 'READY', approval: 'HMDA', locality: 'Kokapet' };
const flat = { type: 'APARTMENT', possession: 'READY', approval: 'RERA', locality: 'Gachibowli' };

describe('verification report', () => {
  it('is deterministic for the same listing', () => {
    expect(buildReport(plot, 5)).toEqual(buildReport(plot, 5));
  });
  it('uses land checks for plots and project checks for flats', () => {
    expect(buildReport(plot, 1).checks.map((c) => c.key)).toContain('water');
    const keys = buildReport(flat, 1).checks.map((c) => c.key);
    expect(keys).toContain('rera');
    expect(keys).not.toContain('water');
  });
  it('flags RISK whenever any check fails, and the score never goes below 0', () => {
    for (let n = 0; n < 200; n++) {
      const r = buildReport(plot, n);
      if (r.checks.some((c) => c.result === 'FAIL')) expect(r.status).toBe('RISK');
      expect(r.score).toBeGreaterThanOrEqual(0);
      expect(r.score).toBeLessThanOrEqual(100);
    }
  });
  it('produces a believable mix across 80 listings', () => {
    const count = { VERIFIED: 0, CAUTION: 0, RISK: 0 };
    for (let n = 0; n < 80; n++) count[buildReport(n % 2 ? plot : flat, n).status]++;
    expect(count.VERIFIED).toBeGreaterThan(count.RISK);
    expect(count.RISK).toBeGreaterThan(0);
  });
});
