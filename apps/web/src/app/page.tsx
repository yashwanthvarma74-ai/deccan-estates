import Image from "next/image";
import Link from "next/link";
import { Suspense } from "react";
import { HeroCarousel } from "@/components/hero-carousel";
import { SearchBand } from "@/components/search-band";
import { CardGridSkeleton, Skeleton } from "@/components/skeletons";
import { ListingCard } from "@/components/listing-card";
import { typeLabels } from "@/lib/api";
import { getListings, getLocalities } from "@/lib/data";

async function Band() {
  return <SearchBand localities={await getLocalities()} />;
}

async function Slides() {
  const { items } = await getListings({ sort: "price_desc", page: "1" });
  // One slide per locality (priciest listing), always including Kokapet, which has its own footage.
  const byLocality = new Map(items.map((l) => [l.locality.slug, l] as const).reverse());
  if (!byLocality.has("kokapet")) {
    const kokapet = (await getListings({ locality: "kokapet", sort: "price_desc", page: "1" })).items[0];
    if (kokapet) byLocality.set("kokapet", kokapet);
  }
  const picked = [...byLocality.values()].sort((a, b) => b.priceInr - a.priceInr).slice(0, 5);
  if (!picked.some((l) => l.locality.slug === "kokapet") && byLocality.has("kokapet")) picked[picked.length - 1] = byLocality.get("kokapet")!;
  const slides = picked.map((l) => ({
    id: l.id,
    slug: l.locality.slug,
    place: l.locality.name,
    subtitle: `${typeLabels[l.type]}, Hyderabad`,
    price: l.priceInr,
  }));
  return <HeroCarousel slides={slides} />;
}

async function Featured() {
  const { items } = await getListings({ sort: "price_desc", page: "1", pageSize: "50" });
  // Spread featured picks across localities instead of showing six from one place.
  const seen = new Set<string>();
  const featured = items.filter((l) => !seen.has(l.locality.slug) && seen.add(l.locality.slug));
  return (
    <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
      {featured.slice(0, 6).map((l) => <ListingCard key={l.id} listing={l} />)}
    </div>
  );
}

async function Localities() {
  const localities = (await getLocalities()).slice(0, 4);
  return (
    <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
      {localities.map((l, i) => (
        <Link key={l.id} href={`/listings?locality=${l.slug}`} className="group relative block aspect-[4/5] overflow-hidden">
          <Image src={`https://picsum.photos/seed/locality-${i + 3}/600/750`} alt="" fill sizes="25vw" className="object-cover transition-transform duration-500 group-hover:scale-105" />
          <div className="absolute inset-0 bg-gradient-to-t from-navy-deep/80 to-transparent" />
          <div className="absolute bottom-5 left-5 text-white">
            <p className="font-display text-2xl">{l.name}</p>
            <p className="label mt-1 text-[0.7rem] text-white/80">{l.zone} Hyderabad · ₹{l.avgPricePerSqft.toLocaleString("en-IN")}/sq ft</p>
          </div>
        </Link>
      ))}
    </div>
  );
}

export default function Home() {
  return (
    <>
      <Suspense fallback={<div className="h-40 bg-navy" />}><Band /></Suspense>
      <Suspense fallback={<div className="h-[calc(100vh-15rem)] bg-navy-deep" />}><Slides /></Suspense>

      <section className="mx-auto max-w-[1800px] px-6 py-20">
        <div className="mb-8 flex items-end justify-between">
          <div><p className="label text-gold">Handpicked</p><h2 className="mt-2 text-4xl">Featured properties</h2></div>
          <Link href="/listings" className="label text-navy underline underline-offset-4">View all</Link>
        </div>
        <Suspense fallback={<CardGridSkeleton count={6} className="lg:grid-cols-3" />}><Featured /></Suspense>
      </section>

      <section className="bg-surface">
        <div className="mx-auto max-w-[1800px] px-6 py-20">
          <p className="label text-gold">Neighbourhoods</p>
          <h2 className="mb-8 mt-2 text-4xl">Explore localities</h2>
          <Suspense fallback={<div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">{[0, 1, 2, 3].map((i) => <Skeleton key={i} className="aspect-[4/5]" />)}</div>}><Localities /></Suspense>
        </div>
      </section>

      <section className="mx-auto grid max-w-[1800px] gap-10 px-6 py-20 md:grid-cols-3">
        {[
          ["Ask about any property", "An assistant reads sale deeds and RERA papers and answers with citations."],
          ["RERA-registered", "Every listing carries its RERA number so you can verify before you visit."],
          ["Compare side by side", "Line up three properties on price, area and price per square foot."],
        ].map(([t, d]) => (
          <div key={t} className="border-t border-navy pt-5">
            <h3 className="text-2xl">{t}</h3>
            <p className="mt-3 text-muted">{d}</p>
          </div>
        ))}
      </section>
    </>
  );
}
