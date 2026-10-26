# Deploying Deccan Estates

1. **Database and cache**: Postgres and Redis. Copy `services/api-gateway/.env.example` to `.env`, then run `pnpm --filter api-gateway prisma migrate deploy`.
2. **API**: `npx nest build`, then `node dist/main` (port `API_PORT`, default 4000). Set `WEB_ORIGIN` to the site's address.
3. **Web**: copy `apps/web/.env.example` to `.env.local`, set `NEXT_PUBLIC_SITE_URL`, `NEXT_PUBLIC_API_URL`, `AUTH_URL` and a fresh `BETTER_AUTH_SECRET`, then `pnpm --filter web build && pnpm --filter web start`.
4. **AI assistant** (optional): run `services/ai-service` and set `AI_URL`; add one provider key (Anthropic, OpenAI, or a local Ollama).
5. **Data**: `prisma db seed` loads sample listings and verification reports, all flagged `demo`. Replace them with real listings before announcing the site.

Source footage for the hero is kept outside the repo and is not needed at runtime.
