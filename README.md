# Hyderabad Real Estate Platform

AI-powered platform for buying, selling and managing real estate in Hyderabad.

- `apps/` — web (Next.js), dashboard, mobile, design-system
- `services/` — api-gateway, listings, search, chat, ai, edge, payments, price-scraper
- `packages/` — ui, types, utils, config
- `infra/` — terraform, docker, k8s
- `docs/` — [Phase 1 plan](docs/phase-1-mvp.md), [ADRs](docs/adr)

## Getting started
```bash
cp .env.example .env
docker compose up -d
pnpm install
```
