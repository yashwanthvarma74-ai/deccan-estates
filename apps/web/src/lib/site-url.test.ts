import { afterEach, describe, expect, it } from "vitest";
import { siteUrl } from "./site-url";

const KEYS = ["SITE_URL", "NEXT_PUBLIC_SITE_URL", "VERCEL_PROJECT_PRODUCTION_URL"] as const;
const saved = Object.fromEntries(KEYS.map((k) => [k, process.env[k]]));
afterEach(() => { for (const k of KEYS) { if (saved[k] === undefined) delete process.env[k]; else process.env[k] = saved[k]; } });
const clear = () => KEYS.forEach((k) => delete process.env[k]);

describe("siteUrl", () => {
  it("falls back to localhost", () => { clear(); expect(siteUrl()).toBe("http://localhost:3000"); });
  it("uses the address Vercel provides, with https", () => { clear(); process.env.VERCEL_PROJECT_PRODUCTION_URL = "deccan-estates-zeta.vercel.app"; expect(siteUrl()).toBe("https://deccan-estates-zeta.vercel.app"); });
  it("prefers an explicit SITE_URL, and drops a trailing slash", () => {
    clear(); process.env.VERCEL_PROJECT_PRODUCTION_URL = "x.vercel.app"; process.env.SITE_URL = "https://deccanestates.in/";
    expect(siteUrl()).toBe("https://deccanestates.in");
  });
});
