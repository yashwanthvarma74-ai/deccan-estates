import path from "node:path";
import type { NextConfig } from "next";

/** Photos posted by users are served by the API, so Next's image optimiser must be allowed to fetch from it. */
const api = new URL(process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000");

const nextConfig: NextConfig = {
  output: "standalone",
  outputFileTracingRoot: path.join(__dirname, "../.."),
  cacheComponents: true,
  partialPrefetching: true,
  images: {
    formats: ["image/avif", "image/webp"],
    remotePatterns: [{ protocol: api.protocol.replace(":", "") as "http" | "https", hostname: api.hostname, port: api.port, pathname: "/uploads/**" }],
    // The API is on localhost in development, which Next blocks by default.
    dangerouslyAllowLocalIP: api.hostname === "localhost" || api.hostname === "127.0.0.1",
  },
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
};

export default nextConfig;
