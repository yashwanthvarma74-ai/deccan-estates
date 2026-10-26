from contextlib import contextmanager

from pgvector.psycopg import register_vector
from psycopg_pool import ConnectionPool

from .config import settings

_pool: ConnectionPool | None = None


def init_schema() -> None:
    """Create the `ai` schema. Kept separate from Prisma's `public` and Better Auth's `auth`."""
    import psycopg

    with psycopg.connect(settings.database_url, autocommit=True) as conn:
        conn.execute("CREATE EXTENSION IF NOT EXISTS vector")
        conn.execute("CREATE SCHEMA IF NOT EXISTS ai")
        conn.execute(
            f"""
            CREATE TABLE IF NOT EXISTS ai.chunks (
              id BIGSERIAL PRIMARY KEY,
              listing_id TEXT NOT NULL,
              source TEXT NOT NULL,
              page INT,
              content TEXT NOT NULL,
              embedding vector({settings.embedding_dim}) NOT NULL
            )
            """
        )
        conn.execute("CREATE INDEX IF NOT EXISTS chunks_listing_idx ON ai.chunks (listing_id)")
        conn.execute(
            "CREATE INDEX IF NOT EXISTS chunks_embedding_idx ON ai.chunks "
            "USING hnsw (embedding vector_cosine_ops)"
        )


def pool() -> ConnectionPool:
    global _pool
    if _pool is None:
        _pool = ConnectionPool(settings.database_url, configure=register_vector, open=True)
    return _pool


@contextmanager
def conn():
    with pool().connection() as c:
        yield c
