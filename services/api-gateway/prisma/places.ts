import places from './places.json';

type Kinds = Record<string, string>;
const table = places as Record<string, Kinds>;

const KIND: Record<string, string> = { PLOT: 'plot', VILLA: 'villa', APARTMENT: 'apartment', GATED_COMMUNITY: 'gated', COMMERCIAL: 'commercial' };
/** A generic Hyderabad photo of the same kind beats an unrelated area scene (a road, a metro station). */
const STILL_FALLBACK = ['/stills/s5.jpg', '/stills/s6.jpg', '/stills/s4.jpg'];

/**
 * Real photos for a listing: first a photo of that kind of property in that area (villa community, tower, plot layout…),
 * then a generic Hyderabad one of the same kind, then the area's own photo, then the older aerial stills.
 */
export function placeImages(localitySlug: string, type: string, n = 0): string[] {
  const kind = KIND[type] ?? 'area';
  const own = table[localitySlug] ?? {};
  const generic = table.hyderabad ?? {};
  const chain = [own[kind], generic[kind], own.area];
  const out = [...new Set([own[kind], own.area, generic[kind]].filter((f): f is string => Boolean(f)))].map((f) => `/places/${f}`);
  const first = chain.find(Boolean);
  const ordered = first ? [`/places/${first}`, ...out.filter((u) => u !== `/places/${first}`)] : [];
  return ordered.length ? ordered : [STILL_FALLBACK[n % STILL_FALLBACK.length]];
}
