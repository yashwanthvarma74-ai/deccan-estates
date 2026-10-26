# 9. Verification reports as a Go gRPC service

Date: 2026-10-26 · Status: Accepted (slice 2 of Phase 2)

## Context
Report building is a pure, CPU-light function today living inside the NestJS gateway. Real checks will later call registries and run slowly, which suits a separate service with a typed contract.

## Decision
`services/verification` exposes `Verification.GetReport` over gRPC, defined in `proto/verification.proto`. The Go code ports the TypeScript logic, and a golden test compares 1,200 reports against the TypeScript output so the two cannot drift.

## Consequences
- The gateway still builds reports itself. Switching it to call this service, and storing reports from Kafka events, are later slices.
- Until then the TypeScript and Go versions both exist; the golden file is the safeguard and is regenerated from the TypeScript source when the logic changes.
