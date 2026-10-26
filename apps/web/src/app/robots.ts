import type { MetadataRoute } from "next";
import { siteUrl } from "@/lib/site-url";

export default function robots(): MetadataRoute.Robots {
  const base = siteUrl();
  return { rules: [{ userAgent: "*", allow: "/", disallow: ["/api/", "/saved", "/login"] }], sitemap: `${base}/sitemap.xml` };
}
