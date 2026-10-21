from contextlib import asynccontextmanager

import httpx
from fastapi import FastAPI, File, Form, HTTPException, UploadFile
from pydantic import BaseModel, Field

from .config import settings
from .db import conn, init_schema
from .embeddings import embed
from .guard import is_suspicious
from .ingest import ingest_pdf, store_chunks

MAX_PDF_BYTES = 15 * 1024 * 1024


@asynccontextmanager
async def lifespan(_: FastAPI):
    init_schema()
    yield


app = FastAPI(title="Hyderabad Real Estate AI service", lifespan=lifespan)


class RetrieveRequest(BaseModel):
    query: str = Field(min_length=1, max_length=1000)
    listing_id: str | None = Field(default=None, max_length=64)
    k: int = Field(default=5, ge=1, le=10)


class Passage(BaseModel):
    source: str
    page: int | None
    content: str
    score: float
    listing_id: str


@app.get("/health")
def health():
    return {"status": "ok"}


@app.post("/ingest/pdf")
async def ingest(listing_id: str = Form(max_length=64), file: UploadFile = File(...)):
    if file.content_type != "application/pdf":
        raise HTTPException(415, "Only PDF uploads are supported")
    data = await file.read()
    if len(data) > MAX_PDF_BYTES:
        raise HTTPException(413, "PDF too large")
    chunks = ingest_pdf(listing_id, file.filename or "document.pdf", data)
    return {"listing_id": listing_id, "chunks": chunks}


@app.post("/ingest/listings")
async def ingest_listings():
    """Index every active listing description so the assistant can answer from them."""
    total = 0
    async with httpx.AsyncClient(base_url=settings.api_url, timeout=30) as client:
        page = 1
        while True:
            r = await client.get("/listings", params={"page": page, "pageSize": 50})
            r.raise_for_status()
            body = r.json()
            for l in body["items"]:
                text = (
                    f"{l['title']}. {l['description']} Price: INR {l['priceInr']}. "
                    f"Area: {l['areaSqft']} sq ft. RERA: {l['reraNumber']}. "
                    f"Agent: {l['agent']['name']}."
                )
                total += store_chunks(l["id"], "listing-description", [(None, text)])
            if page * body["pageSize"] >= body["total"]:
                break
            page += 1
    return {"chunks": total}


@app.post("/retrieve", response_model=list[Passage])
def retrieve(req: RetrieveRequest):
    (vec,) = embed([req.query])
    sql = """
        SELECT listing_id, source, page, content, 1 - (embedding <=> %s::vector) AS score
        FROM ai.chunks
        {where}
        ORDER BY embedding <=> %s::vector
        LIMIT %s
    """
    where = "WHERE listing_id = %s" if req.listing_id else ""
    params = [vec] + ([req.listing_id] if req.listing_id else []) + [vec, req.k * 2]
    with conn() as c:
        rows = c.execute(sql.format(where=where), params).fetchall()
    passages = [
        Passage(listing_id=r[0], source=r[1], page=r[2], content=r[3], score=float(r[4]))
        for r in rows
        if not is_suspicious(r[3])
    ]
    return passages[: req.k]
