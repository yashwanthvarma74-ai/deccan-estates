import Image from "next/image";
import Link from "next/link";
import { Suspense } from "react";
import { ListingCard } from "@/components/listing-card";
import { buttonVariants } from "@/components/ui/button";
import { typeLabels } from "@/lib/api";
import { getListings, getLocalities } from "@/lib/data";
import { cn } from "@/lib/utils";

async function Hero() {
  const localities = await getLocalities();
  const field = "h-14 w-full border border-white/40 bg-white px-4 text-sm text-ink";
  return (
    <form action="/listings" role="search" className="mt-10 grid max-w-4xl gap-3 md:grid-cols-[1fr_1fr_auto]">
      <select name="locality" aria-label="Locality" className={field} defaultValue="">
        <option value="">All localities</option>
        {localities.map((l) => <option key={l.id} value={l.slug}>{l.name}</option>)}
      </select>
      <select name="type" aria-label="Property type" className={field} defaultValue="">
        <option value="">Any type</option>
        {Object.entries(typeLabels).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
      </select>
      <button type="submit" className={cn(buttonVariants(), "h-14 border-white px-10 hover:bg-white hover:text-navy")}>Search</button>
    </form>
  );
}

async function Featured() {
  const { items } = await getListings({ page: "1" });
  return (
    <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
      {items.slice(0, 6).map((l) => <ListingCard key={l.id} listing={l} />)}
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
      <section className="relative isolate overflow-hidden bg-navy text-white">
        <Image src="https://picsum.photos/seed/hyderabad-skyline/1920/900" alt="" fill priority sizes="100vw" className="-z-10 object-cover opacity-40" />
        <div className="mx-auto max-w-[1800px] px-6 py-28 md:py-36">
          <p className="label text-white/80">Plots · Villas · Gated communities</p>
          <h1 className="mt-4 max-w-3xl text-5xl leading-tight md:text-6xl">Find your place in Hyderabad</h1>
          <Suspense fallback={<div className="mt-10 h-14" />}><Hero /></Suspense>
        </div>
      </section>

      <section className="mx-auto max-w-[1800px] px-6 py-20">
        <div className="mb-8 flex items-end justify-between">
          <h2 className="text-4xl">Featured properties</h2>
          <Link href="/listings" className="label text-navy underline underline-offset-4">View all</Link>
        </div>
        <Suspense fallback={<p className="text-muted">Loading…</p>}><Featured /></Suspense>
      </section>

      <section className="bg-surface">
        <div className="mx-auto max-w-[1800px] px-6 py-20">
          <h2 className="mb-8 text-4xl">Explore localities</h2>
          <Suspense fallback={<p className="text-muted">Loading…</p>}><Localities /></Suspense>
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
