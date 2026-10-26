# Build from the repo root: docker build -f infra/docker/api.Dockerfile -t deccan-api .
FROM node:22-slim AS build
RUN corepack enable && apt-get update && apt-get install -y openssl && rm -rf /var/lib/apt/lists/*
WORKDIR /repo
COPY pnpm-lock.yaml pnpm-workspace.yaml package.json ./
COPY services/api-gateway/package.json services/api-gateway/
RUN pnpm install --frozen-lockfile --filter @hyd/api-gateway...
COPY services/api-gateway services/api-gateway
COPY services/verification/proto services/verification/proto
RUN pnpm --filter @hyd/api-gateway exec prisma generate && pnpm --filter @hyd/api-gateway build

FROM node:22-slim
RUN corepack enable && apt-get update && apt-get install -y openssl && rm -rf /var/lib/apt/lists/*
WORKDIR /repo
ENV NODE_ENV=production API_PORT=4000
COPY --from=build /repo ./
USER node
EXPOSE 4000
HEALTHCHECK --interval=15s CMD node -e "fetch('http://localhost:4000/health').then(r=>process.exit(r.ok?0:1)).catch(()=>process.exit(1))"
CMD ["sh", "-c", "pnpm --filter @hyd/api-gateway exec prisma migrate deploy && node services/api-gateway/dist/main"]
