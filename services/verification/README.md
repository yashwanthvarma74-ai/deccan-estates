# Verification service

gRPC service (Go) that builds the due-diligence report for a listing. Port 4200 (`VERIFICATION_PORT`).

- Contract: `proto/verification.proto`. Regenerate code with `go run github.com/bufbuild/buf/cmd/buf@latest generate` (needs `protoc-gen-go` and `protoc-gen-go-grpc` on PATH).
- Logic: `internal/report`, a port of the TypeScript `buildReport`. `testdata/golden.json` holds 1,200 results produced by the TypeScript version; the test fails if the Go output differs.
- Run: `go run ./cmd/server`. Test: `go test ./...`.
- Health and reflection are enabled, so `grpcurl -plaintext localhost:4200 list` works.
