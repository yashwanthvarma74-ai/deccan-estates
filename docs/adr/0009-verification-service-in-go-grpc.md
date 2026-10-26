# 9. Verification reports as a Go gRPC service

Date: 2026-10-26 · Status: Accepted (slices 2 and 3 of Phase 2)

## Context
Report building is a pure, CPU-light function today living inside the NestJS gateway. Real checks will later call registries and run slowly, which suits a separate service with a typed contract.

## Decision
`services/verification` exposes `Verification.GetReport` over gRPC, defined in `proto/verification.proto`. The Go code ports the TypeScript logic, and a golden test compares 1,200 reports against the TypeScript output so the two cannot drift.

## Consequences
- The gateway calls this service (`VERIFICATION_GRPC_ADDR`) through `VerificationService`, with a 1.5 s deadline (`VERIFICATION_TIMEOUT_MS`). If the address is unset, or the call fails, times out or returns something malformed, it logs a warning and uses the in-process report, so verification never blocks the API. Storing reports from Kafka events is a later slice.
- Until then the TypeScript and Go versions both exist; the golden file is the safeguard and is regenerated from the TypeScript source when the logic changes.
