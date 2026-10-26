import { Suspense } from "react";
import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import { AreasWall } from "@/components/areas-wall";
import { Faq } from "@/components/faq";
import { FeaturedCard } from "@/components/home-cards";
import { PlatformTabs } from "@/components/platform-tabs";
import { VerifyShowcase } from "@/components/verify-showcase";
import { BuildStory, type TypeCounts } from "@/components/build-story";
import { EmiCalculator } from "@/components/emi-calculator";
import { GridBridge } from "@/components/grid-bridge";
import { PathList } from "@/components/path-list";
import { Reveal } from "@/components/reveal";
import { Hero } from "@/components/hero";
import { IntroLoader } from "@/components/intro-loader";
import { WispStory } from "@/components/wisp-story";
import { Skeleton } from "@/components/skeletons";
import { SnapRow } from "@/components/snap-row";
import { getListings, getLocalities } from "@/lib/data";

async function Story() {
  const types = ["PLOT", "APARTMENT", "VILLA", "GATED_COMMUNITY", "COMMERCIAL"] as const;
  const pages = await Promise.all(types.map((type) => getListings({ type, page: "1", pageSize: "1" })));
  const counts = Object.fromEntries(types.map((t, i) => [t, pages[i].total])) as TypeCounts;
  return (
    <>
      <Hero counts={counts} />
      <BuildStory counts={counts} intro={false} />
    </>
  );
}

async function Paths() {
  const types = ["PLOT", "APARTMENT", "VILLA", "GATED_COMMUNITY", "COMMERCIAL"] as const;
  const pages = await Promise.all(types.map((type) => getListings({ type, page: "1", pageSize: "1" })));
  return <PathList counts={Object.fromEntries(types.map((t, i) => [t, pages[i].total]))} />;
}

async function Stage() {
  const types = ["PLOT", "APARTMENT", "VILLA", "GATED_COMMUNITY", "COMMERCIAL"] as const;
  const [all, verified, localities] = await Promise.all([getListings({ page: "1", pageSize: "1" }), getListings({ verified: "1", page: "1", pageSize: "1" }), getLocalities()]);
  return <WispStory stats={{ listings: all.total, verified: verified.total, areas: localities.length, types: types.length }} />;
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

async function Areas() {
  const localities = await getLocalities();
  const totals = await Promise.all(localities.map((l) => getListings({ locality: l.slug, page: "1", pageSize: "1" }).then((r) => r.total)));
  return <AreasWall areas={localities.map((l, i) => ({ name: l.name, slug: l.slug, count: totals[i] }))} />;
}


export default function Home() {
  return (
    <>
      <IntroLoader />
      <Suspense fallback={<div className="h-screen bg-black" />}><Story /></Suspense>
      <Suspense fallback={<div className="h-screen bg-black" />}><Stage /></Suspense>
      <GridBridge />

      <section className="bg-paper px-5 pb-24 pt-10 text-paper-ink sm:px-8 lg:pb-32" aria-labelledby="path-h">
        <div className="mx-auto max-w-[1320px]">
          <Reveal className="text-center">
            <h2 id="path-h" className="mx-auto max-w-[17ch] text-[clamp(2.8rem,6.4vw,5.6rem)] font-normal leading-[0.98] tracking-[-0.055em] text-paper-ink">Powering the homes behind the families you know</h2>
            <p className="mono-label mt-8 text-paper-ink/60">Ten areas across Hyderabad</p>
          </Reveal>
          <Suspense fallback={<div className="mt-16 h-72" />}><Areas /></Suspense>
        </div>
      </section>

      <section className="bg-paper px-5 pb-24 text-paper-ink sm:px-8" aria-labelledby="start-h">
        <div className="mx-auto max-w-[1320px]">
          <Reveal className="text-center">
            <h2 id="start-h" className="mx-auto max-w-[18ch] text-[clamp(2.6rem,5.2vw,4.4rem)] font-normal leading-[1] tracking-[-0.055em] text-paper-ink">Find one home today. Expand on your timetable.</h2>
          </Reveal>
          <Suspense fallback={<div className="mt-14 h-96" />}><Paths /></Suspense>
        </div>
      </section>

      <EmiCalculator />

      <section className="bg-paper px-5 pb-6 pt-16 text-center text-paper-ink sm:px-8" aria-labelledby="intro-h">
        <Reveal>
          <p className="text-[1.15rem] text-paper-ink/40">Why Deccan</p>
          <h2 id="intro-h" className="mx-auto mt-3 max-w-[16ch] text-[clamp(2.8rem,6vw,5rem)] font-normal leading-[0.98] tracking-[-0.055em] text-paper-ink">Introducing verified listings</h2>
          <p className="mx-auto mt-8 max-w-[58ch] text-[1.05rem] leading-snug text-paper-ink/70">Every plot, flat, villa and office carries a report: approvals, title, encumbrance and court checks, scored from 0 to 100. Its key benefits include:</p>
        </Reveal>
      </section>
      <VerifyShowcase />

      <PlatformTabs />

      <section className="bg-paper pb-24 text-paper-ink" aria-labelledby="featured-h">
        <Reveal className="mx-auto mb-12 max-w-[1320px] px-5 text-center sm:px-8">
          <p className="text-[1.15rem] text-paper-ink/40">Popular homes</p>
          <h2 id="featured-h" className="mx-auto mt-3 max-w-[18ch] text-[clamp(2.4rem,4.6vw,4rem)] font-normal leading-[1] tracking-[-0.055em] text-paper-ink">Homes people are looking at in Hyderabad</h2>
        </Reveal>
        <Reveal>
          <Suspense fallback={<Skeleton className="mx-auto aspect-[4/3] w-[66%] rounded-sm" />}><Featured /></Suspense>
        </Reveal>
        <div className="mt-10 flex justify-center">
          <Link href="/listings" className="mono-label inline-flex h-14 items-center gap-3 rounded-lg bg-paper-ink/[0.06] px-10 text-paper-ink transition-colors hover:bg-paper-ink hover:text-white">See all homes <ArrowUpRight className="h-4 w-4" /></Link>
        </div>
      </section>

      <Faq />
    </>
  );
}
