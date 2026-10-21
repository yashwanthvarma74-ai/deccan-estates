# ADR-0002: Better Auth in the web app, JWTs verified by services

- Status: accepted
- Date: 2026-10-21

## Context
Buyers need email, OAuth and passkey login. Backend services (NestJS now, Go/Fastify later) must authorise requests without sharing a session store.

## Decision
Better Auth runs inside the Next.js app (tables in a dedicated `auth` Postgres schema). Its `jwt` plugin signs short-lived (15 min) EdDSA tokens and publishes a JWKS at `/api/auth/jwks`. Every service verifies the Bearer token against that JWKS (`jose` in NestJS) and trusts only `sub`.

## Alternatives considered
- Auth0/Clerk: faster, but hides the mechanics interviewers ask about and adds per-user cost.
- Sessions shared via Redis: couples every service to the web app's session format.
- Auth inside NestJS: Better Auth's React client and Next handlers integrate most cleanly in the web app.

## Consequences
Services stay stateless. Key rotation is handled by JWKS. Separate `auth` schema stops Prisma migrations from treating Better Auth tables as drift. The web app is the single issuer, so it is on the critical path for login.

## Interview answer (30 seconds)
"Auth is centralised in one issuer that publishes a JWKS, so each service verifies tokens locally with no network call per request and no shared session store."
