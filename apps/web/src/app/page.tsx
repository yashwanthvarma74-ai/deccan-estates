import Image from "next/image";
import Link from "next/link";
import { ArrowUpRight, FileCheck2, ShieldCheck, Sparkles } from "lucide-react";
import { Suspense } from "react";
import { DestinationCard, FeaturedCard, ServiceCard } from "@/components/home-cards";
import { HeroHome } from "@/components/hero-home";
import { Reveal } from "@/components/reveal";
import { Skeleton } from "@/components/skeletons";
import { SnapRow } from "@/components/snap-row";
import { getAgents, getListings, getLocalities } from "@/lib/data";

const STILLS = ["/stills/s1.jpg", "/stills/s2.jpg", "/stills/s3.jpg", "/stills/s4.jpg", "/stills/s6.jpg", "/stills/s5.jpg"];

function Heading({ lead, bold, text }: { lead: string; bold: string; text?: string }) {
  return (
    <div>
      <h2 className="text-[clamp(1.8rem,3.4vw,2.6rem)]">{lead} <b>{bold}</b></h2>
      {text && <p className="mt-3 max-w-md text-[15px] leading-relaxed text-body">{text}</p>}
    </div>
  );
}

async function Hero() {
  const [localities, agents] = await Promise.all([getLocalities(), getAgents()]);
  return <HeroHome localities={localities} agents={agents} />;
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

const services = [
  { title: "Verified listings", text: "Every plot, villa and community carries its RERA number and a named agent.", image: "/stills/s2.jpg" },
  { title: "Documents, read for you", text: "Ask the assistant about the sale deed and approvals, with citations.", image: "/stills/s4.jpg" },
  { title: "Site visits", text: "Book a visit slot with the listing agent and compare homes side by side.", image: "/stills/s3.jpg" },
  { title: "Registration support", text: "From token advance to agreement and registration, tracked in one place.", image: "/stills/s6.jpg" },
];

const stories = [
  { title: "Reading a sale deed before you pay a token advance", date: "Guide", image: "/stills/s1.jpg" },
  { title: "Why Kokapet and Gachibowli keep pulling ahead", date: "Market", image: "/stills/s5.jpg" },
  { title: "Plots vs. villas: what to buy first in Hyderabad", date: "Guide", image: "/stills/s6.jpg" },
];

export default function Home() {
  return (
    <>
      <Suspense fallback={<div className="min-h-screen bg-bg" />}><Hero /></Suspense>

      <section className="pb-24 pt-20 md:pt-28" aria-labelledby="featured-h">
        <Reveal className="mx-auto mb-10 flex max-w-[1600px] flex-wrap items-start justify-between gap-6 px-6 lg:px-[60px]">
          <div id="featured-h">
            <Heading lead="Homes for" bold="Sale" text="We do not list every property, only the finest. Explore our hand-picked homes across Hyderabad, chosen for their location, approvals and builders." />
          </div>
          <Link href="/listings" className="flex items-center gap-3 underline underline-offset-4">
            All homes <span className="flex h-8 w-8 items-center justify-center rounded border border-white/60"><ArrowUpRight className="h-4 w-4" /></span>
          </Link>
        </Reveal>
        <Reveal>
          <Suspense fallback={<Skeleton className="mx-auto aspect-[4/3] w-[66%] rounded-sm" />}><Featured /></Suspense>
        </Reveal>
      </section>

      <section id="localities" className="mx-auto grid max-w-[1600px] gap-10 px-6 py-24 lg:grid-cols-[minmax(0,0.9fr)_minmax(0,1.6fr)] lg:px-[60px]" aria-label="Localities">
        <Reveal className="flex flex-col justify-center">
          <span aria-hidden className="mb-6 flex h-12 w-12 items-center justify-center rounded-full border border-white/40"><ShieldCheck className="h-6 w-6" strokeWidth={1.3} /></span>
          <Heading lead="Explore" bold="Localities" text="Discover the most sought-after neighbourhoods in Hyderabad, from the financial district to the airport corridor." />
          <Link href="/listings" className="mt-8 inline-flex w-fit rounded-lg bg-white px-5 py-3 text-[15px] font-medium text-bg transition-colors hover:bg-white/90">Discover Hyderabad</Link>
        </Reveal>
        <Reveal delay={120}>
          <Suspense fallback={<Skeleton className="aspect-[4/5] w-[40%] rounded-2xl" />}><Destinations /></Suspense>
        </Reveal>
      </section>

      <section className="grid border-y border-white/10 lg:grid-cols-[minmax(0,0.9fr)_minmax(0,1.6fr)]" aria-label="Services">
        <div className="relative min-h-[22rem] overflow-hidden">
          <Image src="/stills/s3.jpg" alt="" fill sizes="(min-width:1024px) 35vw, 100vw" className="object-cover" />
          <div className="absolute inset-0 bg-gradient-to-t from-bg/90 via-bg/30 to-transparent" />
          <Reveal className="absolute inset-x-6 bottom-8 lg:inset-x-[60px]">
            <h2 className="text-[clamp(1.8rem,3vw,2.4rem)]">Neighbourhood <b>guides</b></h2>
            <p className="mt-3 flex max-w-xs items-start gap-3 text-sm text-body"><Sparkles className="mt-0.5 h-5 w-5 shrink-0" strokeWidth={1.3} />Discover the culture, check the commute, and picture the daily routine.</p>
            <Link href="/stories" className="mt-4 inline-flex items-center gap-2 text-sm underline underline-offset-4">See more <ArrowUpRight className="h-4 w-4" /></Link>
          </Reveal>
        </div>
        <div className="px-6 py-14 lg:px-[60px]">
          <Reveal>
            <h2 className="mb-8 text-[clamp(1.5rem,2.4vw,2rem)]">Our <b>Services</b></h2>
            <SnapRow label="Services" progress>
              {services.map((s) => <ServiceCard key={s.title} {...s} />)}
            </SnapRow>
          </Reveal>
        </div>
      </section>

      <section className="grid lg:grid-cols-2" aria-label="Why buyers choose us">
        <div className="bg-taupe px-6 py-16 text-white lg:px-[60px]">
          <Reveal>
            <p className="flex items-center gap-3 text-sm text-white/80"><FileCheck2 className="h-6 w-6" strokeWidth={1.3} />Don&apos;t take our word for it, check the papers.</p>
            <h2 className="mt-8 text-[clamp(1.8rem,3.2vw,2.6rem)]">Every document, <b>read for you</b></h2>
            <p className="mt-4 max-w-xl text-[15px] leading-relaxed text-white/85">
              Upload the sale deed or RERA certificate and ask in plain language: who owns the land, what is approved, what
              is pending. Answers cite the page they came from, and when the papers do not say, the assistant tells you so.
            </p>
            <Link href="/listings" className="mt-8 inline-flex items-center gap-2 text-sm underline underline-offset-4">Try it on a listing <ArrowUpRight className="h-4 w-4" /></Link>
          </Reveal>
        </div>
        <div className="px-6 py-16 lg:px-[60px]">
          <Reveal>
            <p className="flex items-center gap-3"><ShieldCheck className="h-6 w-6" strokeWidth={1.3} /><span className="text-2xl font-light">How we <b className="font-bold">verify</b></span></p>
            <ul className="mt-8 divide-y divide-white/10 text-[15px]">
              {["RERA number shown on every listing", "Agent registration displayed beside the contact", "Price per sq ft compared with the locality average", "Documents summarised with page citations"].map((t) => (
                <li key={t} className="flex items-center justify-between py-4"><span>{t}</span><span aria-hidden className="text-white/40">✓</span></li>
              ))}
            </ul>
          </Reveal>
        </div>
      </section>

      <section className="mx-auto max-w-[1600px] px-6 py-24 lg:px-[60px]" aria-label="Latest stories">
        <Reveal className="mb-10 flex items-end justify-between gap-6">
          <h2 className="text-[clamp(1.8rem,3vw,2.4rem)]">Latest <b>Stories</b></h2>
          <Link href="/stories" className="flex items-center gap-2 underline underline-offset-4">All stories <ArrowUpRight className="h-4 w-4" /></Link>
        </Reveal>
        <div className="grid gap-5 md:grid-cols-3">
          {stories.map((s, i) => (
            <Reveal key={s.title} delay={i * 100}>
              <Link href="/stories" className="group relative block aspect-[4/3] overflow-hidden rounded-lg bg-card">
                <Image src={s.image} alt="" fill sizes="(min-width:768px) 33vw, 100vw" className="object-cover transition-transform duration-[1200ms] group-hover:scale-105" />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
                <div className="absolute inset-x-5 bottom-5">
                  <h3 className="text-xl font-semibold leading-snug">{s.title}</h3>
                  <p className="mt-2 text-xs text-white/70">{s.date} · sample content</p>
                </div>
              </Link>
            </Reveal>
          ))}
        </div>
      </section>

      <section className="border-t border-white/10 px-6 py-24 text-center">
        <Reveal>
          <h2 className="mx-auto max-w-2xl text-[clamp(1.8rem,3.4vw,2.8rem)]">Looking to sell? <b>Talk to an advisor.</b></h2>
          <p className="mx-auto mt-4 max-w-md text-[15px] text-body">Our agents list, market and manage your property from valuation to registration.</p>
          <Link href="/sell" className="mt-8 inline-flex rounded-lg bg-white px-6 py-3.5 text-[15px] font-medium text-bg transition-colors hover:bg-white/90">Sell with us</Link>
        </Reveal>
      </section>
    </>
  );
}
