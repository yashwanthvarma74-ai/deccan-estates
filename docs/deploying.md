# Deploying Deccan Estates

1. **Database and cache**: Postgres and Redis. Copy `services/api-gateway/.env.example` to `.env`, then run `pnpm --filter api-gateway prisma migrate deploy`.
2. **API**: `npx nest build`, then `node dist/main` (port `API_PORT`, default 4000). Set `WEB_ORIGIN` to the site's address.
3. **Web**: copy `apps/web/.env.example` to `.env.local`, set `NEXT_PUBLIC_SITE_URL`, `NEXT_PUBLIC_API_URL`, `AUTH_URL` and a fresh `BETTER_AUTH_SECRET`, then `pnpm --filter web build && pnpm --filter web start`.
4. **AI assistant** (optional): run `services/ai-service` and set `AI_URL`; add one provider key (Anthropic, OpenAI, or a local Ollama).
5. **Data**: `prisma db seed` loads sample listings and verification reports, all flagged `demo`. Replace them with real listings before announcing the site.

Source footage for the hero is kept outside the repo and is not needed at runtime.

## Containers, Helm and Terraform

- Images: `docker build -f infra/docker/api.Dockerfile -t deccan-api .` and `docker build -f infra/docker/web.Dockerfile -t deccan-web .` (pass `--build-arg NEXT_PUBLIC_SITE_URL=... --build-arg NEXT_PUBLIC_API_URL=...` for the web image). `docker compose --profile app up --build` runs everything locally.
- Kubernetes: `helm install deccan infra/helm/deccan -f my-values.yaml`; create the `deccan-secrets` Secret first with `DATABASE_URL`, `REDIS_URL` and `BETTER_AUTH_SECRET`.
- Data stores: `infra/terraform` creates Postgres and Redis on AWS (`terraform init && terraform apply`).
- Tracing: set `OTEL_EXPORTER_OTLP_ENDPOINT` on the API and it exports OpenTelemetry traces; leave it unset to turn tracing off.
- Not yet run: the Docker images, Helm chart and Terraform were written but not built or applied, because Docker was not running and `helm` and `terraform` are not installed here.

## Listings service (Phase 2)

`services/listings` serves read-only listing queries over tRPC on port 4100 (`DATABASE_URL`, optional `LISTINGS_PORT`). Run it with `pnpm --filter @hyd/listings start`; test it with `DATABASE_URL=... pnpm --filter @hyd/listings test`. To make the web app use it, set `LISTINGS_URL` (server) and `NEXT_PUBLIC_LISTINGS_URL` (browser) and `WEB_ORIGIN` on the service; the web app falls back to the API if it is unreachable. See ADR 0008.

## Verification service (Phase 2)

`services/verification` is a Go gRPC service on port 4200. Run it with `go run ./cmd/server` from that folder, or build `infra/docker/verification.Dockerfile`. Set `VERIFICATION_GRPC_ADDR=host:4200` on the API and `POST /listings/:id/verification` (signed in) creates a missing report through it, falling back to the built-in report if it is unreachable. The seed script still uses the built-in version. See ADR 0009.

## Enquiry events (Phase 2)

Set `KAFKA_BROKERS` on the API to publish `enquiry.created`, and run `services/notifier` (`KAFKA_BROKERS`, optional `NOTIFY_WEBHOOK_URL` for a Slack-style webhook). Compose runs a single-node Kafka and the notifier under `--profile app`; in Helm set `kafkaBrokers`. Leave `KAFKA_BROKERS` unset to turn events off. Events are saved in the database first (outbox) and replayed if Kafka is down, so run `prisma migrate deploy` before upgrading. See ADR 0010. The broker path itself has not been run against a real Kafka.

## Wiring the listings service in containers

- Compose (`--profile app`) now runs `listings` on 4100 and builds the web image with `NEXT_PUBLIC_LISTINGS_URL=http://localhost:4100`; the web server reads it at `http://listings:4100`.
- The browser address is fixed when the web image is built, so pass `--build-arg NEXT_PUBLIC_LISTINGS_URL=https://your-domain.example` (the Helm ingress sends `/trpc` on the same host to the listings service). Set `listings.enabled: false` to run without it; the web app then uses the API.
- Build it with `docker build -f infra/docker/listings.Dockerfile -t deccan-listings .`. Not yet built or deployed, since Docker, `helm` and `terraform` are not available on this machine.

## Free hosting: Vercel + Neon + Upstash + Render + R2

1. Push the repo to GitHub (it has no remote yet).
2. **Neon** (Postgres): create a project. Use the direct, non-pooled connection string for the web app (the auth tables rely on a `search_path` setting that pooled connections reject). From your computer run `prisma migrate deploy`, `npx @better-auth/cli migrate`, then the seed scripts (`prisma db seed`, `prisma/seed-rentals.ts`, `prisma/apply-place-photos.ts`) against it.
3. **Redis is optional.** Skip Upstash by setting `REDIS_URL=off` on the API: it then reads straight from the database (a little slower, fine at small scale; posting and request limits are not enforced). To add the cache later, create an **Upstash** Redis database and put its `rediss://` URL in `REDIS_URL`.
4. **Cloudflare R2** (photo storage, 10 GB free): create a bucket, turn on its public address, and create an access key. On the API set `S3_BUCKET`, `S3_ENDPOINT` (`https://<account>.r2.cloudflarestorage.com`), `S3_ACCESS_KEY_ID`, `S3_SECRET_ACCESS_KEY`, and `PUBLIC_UPLOADS_BASE` to the bucket's public address. On Vercel set `NEXT_PUBLIC_UPLOADS_URL` to the same address. Any S3-compatible store works the same way.
5. **Render** (API): Web Service from the repo. Build: `pnpm install && pnpm --filter @hyd/api-gateway exec prisma generate && pnpm --filter @hyd/api-gateway build`. Start: `node services/api-gateway/dist/main`. Set `DATABASE_URL`, `REDIS_URL`, `WEB_ORIGIN` and `AUTH_URL` (your Vercel address) and the storage variables above. The free plan sleeps when idle.
6. **Vercel** (web): import the repo, root directory `apps/web`, include files outside the root. Set `DATABASE_URL`, `BETTER_AUTH_SECRET`, `AUTH_URL`, `NEXT_PUBLIC_SITE_URL`, `API_URL`, `NEXT_PUBLIC_API_URL`, `NEXT_PUBLIC_UPLOADS_URL`. Leave the listings-service variables empty.

Vercel's free Hobby plan is for non-commercial use; use a paid plan for a business site.

## Deccan AI chat

The "Ask AI" button (every page) calls `/api/ask`. Add `ANTHROPIC_API_KEY` to the Vercel environment variables to switch it to the newest Claude model (`ASK_MODEL`, default `claude-sonnet-5-5`), which uses tools to search the live listings, open one listing, look up an area and work out an EMI. Without a key it uses a built-in search that understands phrases such as "2 BHK flat for rent in Kondapur under 40k". Each visitor is limited to 12 questions a minute, and keys are billed by usage, so set a spending limit in the Anthropic console.

**Free AI:** instead of Anthropic, set `GROQ_API_KEY` (free key from console.groq.com; runs Llama 3.3 70B) or `GEMINI_API_KEY` (free key from aistudio.google.com/apikey; runs Gemini 2.5 Flash). The first one found is used in the order Anthropic, Groq, Gemini. Free tiers have daily and per-minute limits and may use questions to improve their models, so tell visitors not to type personal details. Without any key the chat still searches the listings.
