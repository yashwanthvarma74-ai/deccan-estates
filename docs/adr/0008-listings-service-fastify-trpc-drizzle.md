# 8. Listings read service on Fastify, tRPC and Drizzle

Date: 2026-10-26 · Status: Accepted (slices 1 and 5 of Phase 2)

## Context
Phase 2 moves backend responsibilities out of the NestJS gateway into focused services. Replacing the gateway in one step would put a working product at risk.

## Decision
`services/listings` is a read-only service built with Fastify, tRPC and Drizzle. It reads the same Postgres tables Prisma owns, exposes `listings.search`, `listings.byId`, `listings.map` and `localities.all` on port 4100, and runs beside the gateway. Prisma stays the schema owner, so the Drizzle table definitions mirror the migrations and need updating when those change.

## Consequences
- The service returns the same JSON as the gateway for search (all filters), one listing, map points, localities and agents. A parity test compares them when `GATEWAY_URL` is set (11 filter combinations plus the other calls).
- The web app reads from it when `LISTINGS_URL` (server) and `NEXT_PUBLIC_LISTINGS_URL` (browser map) are set, and falls back to the gateway on any error. Unset, behaviour is unchanged. Writes, saved homes and enquiries stay on the gateway.
- Both services share one query contract (`src/query.ts` here, `listingQuery` in the gateway). Change them together.
- Fixing the parity test exposed that the gateway had no tie-break for listings with equal `createdAt`, so pages could repeat or skip listings. Both now order by id as the last key.
- Later slices: a Go gRPC service for verification reports, and Kafka events for enquiries and listing changes.
