import Link from "next/link";
import { Suspense } from "react";
import { ListingCard } from "@/components/listing-card";
import { SearchForm } from "@/components/search-form";
import { Button } from "@/components/ui/button";
import type { ListingFilters } from "@/lib/api";
import { getListings } from "@/lib/data";

async function Results({ searchParams }: { searchParams: Promise<ListingFilters> }) {
  const filters = await searchParams;
  const { items, total, page, pageSize } = await getListings(filters);
  const pages = Math.max(1, Math.ceil(total / pageSize));
  const href = (p: number) => `/listings?${new URLSearchParams({ ...filters, page: String(p) } as Record<string, string>)}`;

  return (
    <>
      <p className="text-sm text-neutral-500">{total} listings</p>
      {items.length === 0 ? (
        <p>No listings match these filters.</p>
      ) : (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {items.map((l) => (
            <ListingCard key={l.id} listing={l} />
          ))}
        </div>
      )}
      <div className="flex items-center gap-3">
        {page > 1 && <Link href={href(page - 1)}><Button variant="outline">Previous</Button></Link>}
        <span className="text-sm">Page {page} of {pages}</span>
        {page < pages && <Link href={href(page + 1)}><Button variant="outline">Next</Button></Link>}
      </div>
    </>
  );
}

async function Form({ searchParams }: { searchParams: Promise<ListingFilters> }) {
  return <SearchForm values={await searchParams} />;
}

export default function ListingsPage({ searchParams }: PageProps<"/listings">) {
  const sp = searchParams as unknown as Promise<ListingFilters>;
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Browse properties</h1>
      <Suspense fallback={<div className="h-10" />}>
        <Form searchParams={sp} />
      </Suspense>
      <Suspense fallback={<p>Loading…</p>}>
        <Results searchParams={sp} />
      </Suspense>
    </div>
  );
}
