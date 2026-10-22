import Link from "next/link";
import { ArrowUpRight, FileCheck2, Phone, ShieldCheck } from "lucide-react";
import { Suspense } from "react";
import { DestinationCard, FeaturedCard } from "@/components/home-cards";
import { HeroHome, type TypeCounts } from "@/components/hero-home";
import { Reveal } from "@/components/reveal";
import { Skeleton } from "@/components/skeletons";
import { SnapRow } from "@/components/snap-row";
import { getListings, getLocalities } from "@/lib/data";

const STILLS = ["/stills/s1.jpg", "/stills/s2.jpg", "/stills/s3.jpg", "/stills/s4.jpg", "/stills/s6.jpg", "/stills/s5.jpg"];

async function Hero() {
  const types = ["PLOT", "APARTMENT", "VILLA", "GATED_COMMUNITY"] as const;
  const [localities, ...pages] = await Promise.all([
    getLocalities(),
    ...types.map((type) => getListings({ type, page: "1", pageSize: "1" })),
  ]);
  const counts = Object.fromEntries(types.map((t, i) => [t, pages[i].total])) as TypeCounts;
  return <HeroHome localities={localities} counts={counts} />;
}

async function Featured() {
  const { items } = await getListings({ sort: "price_desc", page: "1", pageSize: "50" });
  const seen = new Set<string>();
  const featured = items.filter((l) => !seen.has(l.locality.slug) && seen.add(l.locality.slug)).slice(0, 8);
  return (
    <SnapRow center progress label="Featured homes">
      {featured.map((l, i) => <FeaturedCard key={l.id} listing={l} index={i} />)}
    </SnapRow>
  );
}

async function Destinations() {
  const [localities, { items }] = await Promise.all([getLocalities(), getListings({ page: "1", pageSize: "50" })]);
  const counts = new Map<string, number>();
  for (const l of items) counts.set(l.locality.slug, (counts.get(l.locality.slug) ?? 0) + 1);
  return (
    <SnapRow label="Localities" controls="none">
      {localities.map((l, i) => (
        <DestinationCard key={l.id} name={l.name} slug={l.slug} count={counts.get(l.slug) ?? 0} image={STILLS[i % STILLS.length]} />
      ))}
    </SnapRow>
  );
}

export default function Home() {
  return (
    <>
      <Suspense fallback={<div className="min-h-screen bg-bg" />}><Hero /></Suspense>

      <section id="localities" className="mx-auto max-w-[1600px] px-5 py-16 sm:px-8 lg:px-[60px] lg:py-24" aria-labelledby="areas-h">
        <Reveal className="mb-8">
          <h2 id="areas-h" className="text-[clamp(1.8rem,3.4vw,2.6rem)]">Browse by <b>area</b></h2>
          <p className="mt-3 max-w-xl text-lg text-body">Tap an area to see every plot, flat and villa available there.</p>
        </Reveal>
        <Reveal>
          <Suspense fallback={<Skeleton className="aspect-[4/5] w-[40%] rounded-2xl" />}><Destinations /></Suspense>
        </Reveal>
      </section>

      <section className="pb-20 pt-4 lg:pb-28" aria-labelledby="featured-h">
        <Reveal className="mx-auto mb-10 flex max-w-[1600px] flex-wrap items-end justify-between gap-6 px-5 sm:px-8 lg:px-[60px]">
          <h2 id="featured-h" className="text-[clamp(1.8rem,3.4vw,2.6rem)]">Popular <b>homes</b></h2>
          <Link href="/listings" className="inline-flex min-h-12 items-center gap-3 rounded-xl border border-white/40 px-5 text-lg font-medium hover:bg-white/10">
            See all homes <ArrowUpRight className="h-5 w-5" />
          </Link>
        </Reveal>
        <Reveal>
          <Suspense fallback={<Skeleton className="mx-auto aspect-[4/3] w-[66%] rounded-sm" />}><Featured /></Suspense>
        </Reveal>
      </section>

      <section className="grid lg:grid-cols-2" aria-label="Why buyers choose us">
        <div className="bg-taupe px-5 py-14 text-white sm:px-8 lg:px-[60px]">
          <Reveal>
            <p className="flex items-center gap-3 text-base text-white/85"><FileCheck2 className="h-6 w-6" strokeWidth={1.4} />Check the papers before you visit</p>
            <h2 className="mt-6 text-[clamp(1.8rem,3.2vw,2.6rem)]">Ask about any document, <b>in plain words</b></h2>
            <p className="mt-4 max-w-xl text-lg leading-relaxed text-white/90">
              Open any home and ask our assistant about the sale deed or approvals. It answers in simple language and shows
              which page it read.
            </p>
          </Reveal>
        </div>
        <div className="px-5 py-14 sm:px-8 lg:px-[60px]">
          <Reveal>
            <p className="flex items-center gap-3 text-2xl"><ShieldCheck className="h-6 w-6" strokeWidth={1.4} />Every home is <b className="font-bold">verified</b></p>
            <ul className="mt-6 divide-y divide-white/10 text-lg">
              {["RERA number shown on every listing", "Agent registration shown next to the phone number", "Price per sq ft compared with the area average"].map((t) => (
                <li key={t} className="flex items-center justify-between gap-4 py-4"><span>{t}</span><span aria-hidden className="text-white/50">✓</span></li>
              ))}
            </ul>
          </Reveal>
        </div>
      </section>

      <section className="border-t border-white/10 px-5 py-20 text-center">
        <Reveal>
          <h2 className="mx-auto max-w-2xl text-[clamp(1.8rem,3.4vw,2.8rem)]">Want to sell your property?</h2>
          <p className="mx-auto mt-4 max-w-md text-lg text-body">Call us or tell us about it. Our agent will contact you.</p>
          <div className="mt-8 flex flex-wrap justify-center gap-4">
            <Link href="/sell" className="inline-flex min-h-14 items-center rounded-xl bg-white px-7 text-lg font-semibold text-bg hover:bg-white/90">Sell with us</Link>
            <a href="tel:+919848001000" className="inline-flex min-h-14 items-center gap-2 rounded-xl border border-white/40 px-7 text-lg font-semibold hover:bg-white/10"><Phone className="h-5 w-5" /> +91 98480 01000</a>
          </div>
        </Reveal>
      </section>
    </>
  );
}
