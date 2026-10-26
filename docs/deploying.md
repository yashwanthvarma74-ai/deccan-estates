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
