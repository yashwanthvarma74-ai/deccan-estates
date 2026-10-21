import Link from "next/link";
import { Suspense } from "react";
import { HeroCarousel } from "@/components/hero-carousel";
import { SearchBand } from "@/components/search-band";
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
  const { items } = await getListings({ page: "1" });
  return (
    <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
      {items.slice(0, 6).map((l) => <ListingCard key={l.id} listing={l} />)}
    </div>
  );
}

const bands = ["bg-accent-purple", "bg-accent-pink", "bg-accent-orange", "bg-accent-teal"];

async function Localities() {
  const localities = (await getLocalities()).slice(0, 4);
  return (
    <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
      {localities.map((l, i) => (
        <Link key={l.id} href={`/listings?locality=${l.slug}`} className="group overflow-hidden rounded-xl border border-hairline bg-white transition-shadow hover:shadow-soft">
          {/* Colour-blocked header band from the sticker palette. */}
          <div className={`flex h-28 items-end p-6 ${bands[i % bands.length]}`}>
            <span aria-hidden className="text-5xl font-bold leading-none tracking-tight text-white/90">{l.name.slice(0, 1)}</span>
          </div>
          <div className="p-6">
            <p className="text-[22px] font-bold leading-tight tracking-tight">{l.name}</p>
            <p className="mt-1 text-sm text-ink-muted">{l.zone} Hyderabad</p>
            <p className="mt-4 text-sm text-ink-secondary">₹{l.avgPricePerSqft.toLocaleString("en-IN")} / sq ft average</p>
          </div>
        </Link>
      ))}
    </div>
  );
}

const features = [
  ["Ask about any property", "An assistant reads sale deeds and RERA papers and answers with citations.", "bg-accent-purple"],
  ["RERA-registered", "Every listing carries its RERA number so you can verify before you visit.", "bg-accent-green"],
  ["Compare side by side", "Line up three properties on price, area and price per square foot.", "bg-accent-sky"],
];

export default function Home() {
  return (
    <>
      <Suspense fallback={<div className="h-80 bg-secondary" />}><Band /></Suspense>
      <Suspense fallback={<div className="mx-auto h-[28rem] max-w-[1300px] px-6 py-10"><div className="h-full rounded-2xl bg-secondary" /></div>}><Slides /></Suspense>

      <section className="mx-auto max-w-[1300px] px-6 py-16">
        <div className="mb-8 flex items-end justify-between">
          <h2 className="text-[40px] tracking-[-1px]">Featured properties</h2>
          <Link href="/listings" className="label text-primary hover:underline">View all</Link>
        </div>
        <Suspense fallback={<p className="text-ink-muted">Loading…</p>}><Featured /></Suspense>
      </section>

      <section className="mx-auto max-w-[1300px] px-6 py-16">
        <h2 className="mb-8 text-[40px] tracking-[-1px]">Explore localities</h2>
        <Suspense fallback={<p className="text-ink-muted">Loading…</p>}><Localities /></Suspense>
      </section>

      <section className="mx-auto grid max-w-[1300px] gap-6 px-6 pb-24 pt-8 md:grid-cols-3">
        {features.map(([t, d, c]) => (
          <div key={t} className="rounded-xl border border-hairline bg-white p-6">
            <span aria-hidden className={`mb-5 block h-3 w-3 rounded-full ${c}`} />
            <h3 className="text-[22px] tracking-tight">{t}</h3>
            <p className="mt-3 text-ink-muted">{d}</p>
          </div>
        ))}
      </section>
    </>
  );
}
