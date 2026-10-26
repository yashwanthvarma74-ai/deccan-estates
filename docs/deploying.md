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
