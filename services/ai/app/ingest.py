import tempfile
from pathlib import Path

from llama_index.core import Document
from llama_index.core.node_parser import SentenceSplitter
from llama_index.readers.file import PDFReader

from .db import conn
from .embeddings import embed

_splitter = SentenceSplitter(chunk_size=512, chunk_overlap=64)


def parse_pdf(data: bytes) -> list[Document]:
    """Parse a PDF into one LlamaIndex Document per page."""
    with tempfile.TemporaryDirectory() as d:
        path = Path(d) / "upload.pdf"
        path.write_bytes(data)
        return PDFReader().load_data(path)


def store_chunks(listing_id: str, source: str, pages: list[tuple[int | None, str]]) -> int:
    rows: list[tuple[int | None, str]] = []
    for page, text in pages:
        for chunk in _splitter.split_text(text):
            if chunk.strip():
                rows.append((page, chunk))
    if not rows:
        return 0
    vectors = embed([c for _, c in rows])
    with conn() as c:
        c.execute("DELETE FROM ai.chunks WHERE listing_id = %s AND source = %s", (listing_id, source))
        with c.cursor() as cur:
            cur.executemany(
                "INSERT INTO ai.chunks (listing_id, source, page, content, embedding) VALUES (%s,%s,%s,%s,%s)",
                [(listing_id, source, page, text, vec) for (page, text), vec in zip(rows, vectors)],
            )
    return len(rows)


def ingest_pdf(listing_id: str, filename: str, data: bytes) -> int:
    docs = parse_pdf(data)
    pages = [(int(d.metadata.get("page_label", i + 1)) if str(d.metadata.get("page_label", "")).isdigit() else i + 1, d.text) for i, d in enumerate(docs)]
    return store_chunks(listing_id, filename, pages)
