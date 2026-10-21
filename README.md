# Hyderabad Real Estate Platform

AI-powered platform for buying, selling and managing real estate in Hyderabad.

- `apps/` — web (Next.js), dashboard, mobile, design-system
- `services/` — api-gateway, listings, search, chat, ai, edge, payments, price-scraper
- `packages/` — ui, types, utils, config
- `infra/` — terraform, docker, k8s
- `docs/` — [Phase 1 plan](docs/phase-1-mvp.md), [ADRs](docs/adr)

## Getting started
Needs Node 22+, pnpm, uv, Postgres 17 with pgvector, and Redis (or `docker compose up -d`).

```bash
cp .env.example .env             # API reads services/api-gateway/.env, web reads apps/web/.env.local
pnpm install

# database
cd services/api-gateway && pnpm prisma migrate dev && pnpm prisma:seed
cd ../../apps/web && pnpm dlx auth@latest migrate --config src/lib/auth.ts -y   # needs `CREATE SCHEMA auth`

# run (separate terminals)
cd services/api-gateway && pnpm dev        # :4000, Swagger at /docs
cd services/ai && uv run uvicorn app.main:app --port 8000
cd apps/web && pnpm dev                    # :3000
curl -X POST localhost:8000/ingest/listings   # index listings for the assistant
```

## Docs
- [Phase 1 plan](docs/phase-1-mvp.md) · [ADRs](docs/adr)
