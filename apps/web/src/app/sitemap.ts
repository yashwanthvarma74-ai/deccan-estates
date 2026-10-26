import type { MetadataRoute } from "next";
import { getListings } from "@/lib/data";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const base = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";
  const pages = ["", "/listings", "/sell", "/agents", "/stories", "/compare", "/privacy", "/terms", "/credits"].map((p) => ({ url: `${base}${p}`, changeFrequency: "daily" as const, priority: p === "" ? 1 : 0.7 }));
  const items: { id: string }[] = [];
  for (let page = 1; page <= 4; page++) {
    const r = await getListings({ page: String(page), pageSize: "50" }).catch(() => null);
    if (!r) break;
    items.push(...r.items);
    if (items.length >= r.total) break;
  }
  return [...pages, ...items.map((l) => ({ url: `${base}/listings/${l.id}`, changeFrequency: "weekly" as const, priority: 0.6 }))];
}
