# ADR-0001: Monorepo with pnpm workspaces

- Status: accepted
- Date: 2026-10-21

## Context
Several apps and services share types, UI and config; solo developer.

## Decision
One repo with `apps/`, `services/`, `packages/`, `infra/`. JS/TS projects are pnpm workspaces; Go and Python services live in the same tree with their own toolchains.

## Alternatives considered
- Polyrepo: cross-service changes and shared types are painful solo.
- Nx/Turborepo: may add later for task caching.

## Consequences
One PR can change API and client. CI should filter by changed paths.

## Interview answer (30 seconds)
"Shared types and a solo dev made a monorepo cheaper; pnpm workspaces give linking with no extra tooling."
