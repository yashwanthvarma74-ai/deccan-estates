/**
 * The site's public address, used for page metadata, the sitemap and robots.txt.
 * Order: SITE_URL (set it for a custom domain), NEXT_PUBLIC_SITE_URL (older name), the address Vercel gives the
 * production deployment automatically, then localhost for development. Never ends with a slash.
 */
export function siteUrl() {
  const vercel = process.env.VERCEL_PROJECT_PRODUCTION_URL ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}` : undefined;
  return (process.env.SITE_URL ?? process.env.NEXT_PUBLIC_SITE_URL ?? vercel ?? "http://localhost:3000").trim().replace(/\/+$/, "");
}
