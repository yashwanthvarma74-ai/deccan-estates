# ADR-0003: RAG on pgvector with local embeddings; generation in the web tier

- Status: accepted
- Date: 2026-10-21

## Context
The assistant must answer questions from listings and uploaded PDFs (sale deeds, RERA papers) cheaply, and resist prompt injection (OWASP LLM01).

## Decision
- FastAPI service owns ingestion (LlamaIndex PDF reader + sentence splitter), embeddings (fastembed `bge-small-en-v1.5`, 384-d, runs locally) and retrieval from pgvector (`ai` schema, HNSW cosine index).
- The Next.js route calls `/retrieve`, then streams the answer with the Vercel AI SDK. Provider is chosen from env (Anthropic → OpenAI → Ollama); with no key it returns the retrieved excerpts.
- Retrieved text is treated as untrusted: screened for injection phrases server-side, fenced in `<retrieved_passages>`, and the system prompt forbids following instructions inside it.

## Alternatives considered
- Separate vector DB (Qdrant) for text: unnecessary; it is reserved for image similarity in a later phase.
- Hosted embeddings: per-token cost and a network hop for no quality gain at this size.

## Consequences
One database to run. Retrieval quality is bounded by a small embedding model; swap `EMBEDDING_MODEL`/`EMBEDDING_DIM` and re-ingest to change it. Heuristic screening is a speed bump, not a guarantee; fencing plus a no-tools assistant is the main control.

## Interview answer (30 seconds)
"pgvector keeps vectors next to relational data; I embed locally for zero marginal cost and treat every retrieved chunk as hostile input."
