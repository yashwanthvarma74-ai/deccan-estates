import { betterAuth } from "better-auth";
import { nextCookies } from "better-auth/next-js";
import { jwt } from "better-auth/plugins";
import { passkey } from "@better-auth/passkey";
import { Pool } from "pg";

const baseURL = process.env.AUTH_URL ?? "http://localhost:3000";

export const auth = betterAuth({
  baseURL,
  secret: process.env.BETTER_AUTH_SECRET,
  database: new Pool({
    connectionString: process.env.DATABASE_URL,
    // Own schema so Prisma migrations in the API never see these tables as drift.
    options: "-c search_path=auth",
  }),
  emailAndPassword: { enabled: true },
  socialProviders:
    process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET
      ? {
          google: {
            clientId: process.env.GOOGLE_CLIENT_ID,
            clientSecret: process.env.GOOGLE_CLIENT_SECRET,
          },
        }
      : undefined,
  plugins: [
    // Issues short-lived JWTs that the NestJS API verifies via /api/auth/jwks.
    jwt({ jwt: { issuer: baseURL, audience: undefined, expirationTime: "15m" } }),
    passkey({ rpID: new URL(baseURL).hostname, rpName: "Hyderabad Homes", origin: baseURL }),
    nextCookies(),
  ],
});
