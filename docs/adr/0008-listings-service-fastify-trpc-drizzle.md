# 8. Listings read service on Fastify, tRPC and Drizzle

Date: 2026-10-26 · Status: Accepted (slice 1 of Phase 2)

## Context
Phase 2 moves backend responsibilities out of the NestJS gateway into focused services. Replacing the gateway in one step would put a working product at risk.

## Decision
`services/listings` is a read-only service built with Fastify, tRPC and Drizzle. It reads the same Postgres tables Prisma owns, exposes `listings.search`, `listings.byId`, `listings.map` and `localities.all` on port 4100, and runs beside the gateway. Prisma stays the schema owner, so the Drizzle table definitions mirror the migrations and need updating when those change.

## Consequences
- The web app is not switched over yet. The next slice moves its listing reads to this service once the filters match the gateway's.
- Search supports the core filters only (locality, type, price, bedrooms, text); the rest of the gateway's filters come across slice by slice.
- Later slices: a Go gRPC service for verification reports, and Kafka events for enquiries and listing changes.
