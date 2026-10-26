# Contributing

Thanks for your interest in Deccan Estates.

## Setup

Follow the [Quick start](README.md#quick-start). You need Node 22+, pnpm 12 and Docker; Go 1.27 and uv are only needed for the Go and Python services.

## Workflow

1. Open an issue describing the bug or idea before large changes.
2. Branch from `main` (`feat/…`, `fix/…`, `docs/…`).
3. Keep changes focused; add or update tests alongside the code.
4. Run the checks for what you touched (see [Testing](README.md#testing)). CI runs all of them on every pull request.
5. Open a pull request using the template.

## Commit messages

Use [Conventional Commits](https://www.conventionalcommits.org/): `feat(web): …`, `fix(api): …`, `docs: …`, `ci: …`. Explain *why* in the body when it is not obvious.

## Standards

- TypeScript is strict; no `any` without a comment explaining why.
- Anything that crosses a service boundary has a fallback and a test for it.
- Where two implementations must agree (TypeScript and Go verification, gateway and listings service), extend the parity tests rather than duplicating logic.
- Significant design choices get an ADR in `docs/adr` (copy `0000-template.md`).
