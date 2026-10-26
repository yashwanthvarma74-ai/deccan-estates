import path from "node:path";
import type { NextConfig } from "next";

/** Photos posted by users are served by the API, so Next's image optimiser must be allowed to fetch from it. */
const api = new URL(process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000");
/** Where uploaded photos are served from: the API, or a storage bucket's public address when uploads go to one. */
const uploads = new URL(process.env.NEXT_PUBLIC_UPLOADS_URL ?? api.origin);

const nextConfig: NextConfig = {
  // Only the Docker image needs a self-contained server; Vercel builds the app its own way.
  ...(process.env.DOCKER_BUILD ? { output: "standalone" as const, outputFileTracingRoot: path.join(__dirname, "../..") } : {}),
  cacheComponents: true,
  partialPrefetching: true,
  images: {
    formats: ["image/avif", "image/webp"],
    remotePatterns: [{ protocol: uploads.protocol.replace(":", "") as "http" | "https", hostname: uploads.hostname, port: uploads.port, pathname: "/uploads/**" }],
    // The API is on localhost in development, which Next blocks by default.
    dangerouslyAllowLocalIP: uploads.hostname === "localhost" || uploads.hostname === "127.0.0.1",
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
