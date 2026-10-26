# Build from the repo root: docker build -f infra/docker/listings.Dockerfile -t deccan-listings .
FROM node:22-alpine
RUN corepack enable
WORKDIR /repo
ENV NODE_ENV=production LISTINGS_PORT=4100
COPY pnpm-lock.yaml pnpm-workspace.yaml package.json ./
COPY services/listings/package.json services/listings/
# dev dependencies stay: the service runs TypeScript directly through tsx
RUN pnpm install --frozen-lockfile --prod=false --filter @hyd/listings...
COPY services/listings services/listings
USER node
EXPOSE 4100
HEALTHCHECK --interval=15s CMD node -e "fetch('http://localhost:4100/health').then(r=>process.exit(r.ok?0:1)).catch(()=>process.exit(1))"
CMD ["pnpm", "--filter", "@hyd/listings", "start"]
