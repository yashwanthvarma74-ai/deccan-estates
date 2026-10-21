import { Suspense } from "react";
import { ListingCard } from "@/components/listing-card";
import { SearchForm } from "@/components/search-form";
import { getListings } from "@/lib/data";

async function Featured() {
  const { items } = await getListings({ page: "1" });
  return (
    <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
      {items.slice(0, 6).map((l) => (
        <ListingCard key={l.id} listing={l} />
      ))}
    </div>
  );
}

export default function Home() {
  return (
    <div className="space-y-10">
      <section className="space-y-4">
        <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">
          Find your plot, villa or gated community in Hyderabad
        </h1>
        <p className="max-w-2xl text-neutral-600 dark:text-neutral-400">
          RERA-registered listings across Gachibowli, Kokapet, Shamshabad and more — with an AI assistant that reads
          the documents for you.
        </p>
        <Suspense fallback={<div className="h-10" />}>
          <SearchForm />
        </Suspense>
      </section>
      <section className="space-y-4">
        <h2 className="text-xl font-semibold">Latest listings</h2>
        <Suspense fallback={<p>Loading listings…</p>}>
          <Featured />
        </Suspense>
      </section>
    </div>
  );
}
