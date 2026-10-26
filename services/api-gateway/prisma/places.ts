import places from './places.json';

type Kinds = Record<string, string>;
type Table = Record<string, Kinds> & { _pools?: Record<string, string[]> };
const table = places as unknown as Table;

const KIND: Record<string, string> = { PLOT: 'plot', VILLA: 'villa', APARTMENT: 'apartment', GATED_COMMUNITY: 'gated', COMMERCIAL: 'commercial' };
const STILL_FALLBACK = ['/stills/s5.jpg', '/stills/s6.jpg', '/stills/s4.jpg'];
const url = (f: string) => `/places/${f}`;

/**
 * Picks a cover photo for a listing that no other listing uses yet: first a photo of that kind of property in that
 * area, then the next unused photo of that kind from the shared Hyderabad pool, then the area's own scene.
 * Pass the same `used` set for every listing in a run so no two cards share a cover.
 */
export function coverFor(used: Set<string>, localitySlug: string, type: string, n = 0): string {
  const kind = KIND[type] ?? 'area';
  const own = table[localitySlug] ?? {};
  const generic = table.hyderabad ?? {};
  const pool = table._pools?.[kind] ?? [];
  const candidates = [own[kind], ...pool, generic[kind], own.area].filter((f): f is string => Boolean(f));
  const pick = candidates.find((f) => !used.has(url(f)));
  if (pick) {
    used.add(url(pick));
    return url(pick);
  }
  // Every photo of this kind is taken (more listings than photos): reuse is the only option left.
  return candidates.length ? url(candidates[n % candidates.length]) : STILL_FALLBACK[n % STILL_FALLBACK.length];
}

/** The cover first, then up to two more views of the same area or kind for the listing's gallery. */
export function placeImages(localitySlug: string, type: string, n = 0, used: Set<string> = new Set()): string[] {
  const kind = KIND[type] ?? 'area';
  const own = table[localitySlug] ?? {};
  const generic = table.hyderabad ?? {};
  const cover = coverFor(used, localitySlug, type, n);
  const more = [own.area, own[kind], generic[kind]].filter((f): f is string => Boolean(f)).map(url).filter((u) => u !== cover);
  return [cover, ...new Set(more)].slice(0, 3);
}
