import type { MapPoint } from "@/lib/api";
import { typeLabels, type Listing } from "@/lib/api";
import { priceLabel } from "@/lib/utils";

/** Escapes text for HTML. Listing titles are written by users, so everything put into a map card goes through this. */
export const esc = (v: unknown) => String(v).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]!);

export function sizeLabel(p: MapPoint) {
  return p.type === "PLOT" ? `${p.plotAreaSqYd ?? Math.round(p.areaSqft / 9)} sq yd` : `${p.bedrooms ? `${p.bedrooms} BHK · ` : ""}${p.areaSqft.toLocaleString("en-IN")} sq ft`;
}

/** The card shown for a pin: photo, kind and area, title, price, size and a link to the listing. */
export function cardHtml(p: MapPoint) {
  const kind = typeLabels[p.type as Listing["type"]] ?? p.type;
  const image = /^(\/|https:\/\/|http:\/\/localhost)/.test(p.imageUrl) ? p.imageUrl : "";
  return `<div class="map-card pinned"><a href="/listings/${encodeURIComponent(p.id)}">${image ? `<img src="${esc(image)}" alt="" />` : ""}<span class="mc-body"><span class="mc-kind">${esc(kind)} · ${esc(p.locality)}</span><strong>${esc(p.title)}</strong><span class="mc-price">${esc(priceLabel({ priceInr: p.priceInr, dealType: p.dealType }))}</span><span class="mc-size">${esc(sizeLabel(p))}</span><span class="mc-open">View details &rarr;</span></span></a></div>`;
}
