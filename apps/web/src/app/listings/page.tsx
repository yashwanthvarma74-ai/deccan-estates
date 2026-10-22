import Link from "next/link";
import { Suspense } from "react";
import { CardGridSkeleton } from "@/components/skeletons";
import { ListingCard } from "@/components/listing-card";
import { ResultsMap } from "@/components/results-map";
import { SortSelect } from "@/components/sort-select";
import { Button } from "@/components/ui/button";
import type { ListingFilters } from "@/lib/api";
import { getListings, getLocalities } from "@/lib/data";

async function Results({ searchParams }: { searchParams: Promise<ListingFilters> }) {
  const filters = await searchParams;
  const [{ items, total, page, pageSize }, localities] = await Promise.all([getListings(filters), getLocalities()]);
  const pages = Math.max(1, Math.ceil(total / pageSize));
  const place = localities.find((l) => l.slug === filters.locality)?.name ?? "Hyderabad";
  const href = (p: number) => `/listings?${new URLSearchParams({ ...filters, page: String(p) } as Record<string, string>)}`;
  const from = (page - 1) * pageSize;

  return (
    <>
      <h1 className="text-3xl">
        Viewing {items.length ? `${from + 1}–${from + items.length}` : 0} of {total} Homes for Sale in {place}
      </h1>
      <p className="mt-2 text-muted">Showing listings marketed by all agents in the searched area.</p>
      <div className="mt-8 flex items-center justify-between">
        <Suspense><SortSelect /></Suspense>
      </div>
      {items.length === 0 ? (
        <p className="py-16 text-center text-muted">No listings match these filters.</p>
      ) : (
        <div id="results" className="mt-6 grid gap-6 xl:grid-cols-2">
          {items.map((l) => <ListingCard key={l.id} listing={l} />)}
        </div>
      )}
      <nav className="mt-10 flex items-center justify-center gap-4" aria-label="Pagination">
        {page > 1 && <Link href={href(page - 1)}><Button variant="outline" size="sm">Previous</Button></Link>}
        <span className="label text-muted">Page {page} of {pages}</span>
        {page < pages && <Link href={href(page + 1)}><Button variant="outline" size="sm">Next</Button></Link>}
      </nav>
    </>
  );
}

export default function ListingsPage({ searchParams }: PageProps<"/listings">) {
  const sp = searchParams as unknown as Promise<ListingFilters>;
  return (
    <div className="mx-auto max-w-[1800px] px-6">
      <div className="grid gap-8 pt-6 lg:grid-cols-[minmax(0,1.05fr)_minmax(0,1fr)]">
        <section className="order-2 pb-16 lg:order-1">
          <Suspense fallback={<div className="pt-10"><CardGridSkeleton count={6} className="xl:grid-cols-2" /></div>}>
            <Results searchParams={sp} />
          </Suspense>
        </section>
        <aside className="order-1 h-80 lg:sticky lg:top-[11.5rem] lg:order-2 lg:h-[calc(100vh-12.5rem)]">
          <Suspense><ResultsMap /></Suspense>
        </aside>
      </div>
    </div>
  );
}
