import Image from "next/image";
import Link from "next/link";
import { ArrowUpRight, Compass, FileCheck2, FileText, MapPin, Phone, ShieldCheck, CalendarCheck, Stamp } from "lucide-react";
import { Suspense } from "react";
import { DestinationCard, FeaturedCard, ServiceCard } from "@/components/home-cards";
import { ServicesCarousel } from "@/components/services-carousel";
import { BuildStory, type TypeCounts } from "@/components/build-story";
import { Reveal } from "@/components/reveal";
import { Skeleton } from "@/components/skeletons";
import { SnapRow } from "@/components/snap-row";
import { getListings, getLocalities } from "@/lib/data";

const STILLS = ["/stills/s1.jpg", "/stills/s2.jpg", "/stills/s3.jpg", "/stills/s4.jpg", "/stills/s6.jpg", "/stills/s5.jpg"];

async function Story() {
  const types = ["PLOT", "APARTMENT", "VILLA", "GATED_COMMUNITY", "COMMERCIAL"] as const;
  const pages = await Promise.all(types.map((type) => getListings({ type, page: "1", pageSize: "1" })));
  const counts = Object.fromEntries(types.map((t, i) => [t, pages[i].total])) as TypeCounts;
  return <BuildStory counts={counts} />;
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
  const localities = await getLocalities();
  // The list API caps a page at 50, so read each area's own total instead of counting a page.
  const totals = await Promise.all(localities.map((l) => getListings({ locality: l.slug, page: "1", pageSize: "1" }).then((r) => r.total)));
  return (
    <SnapRow label="Areas" controls="none">
      {localities.map((l, i) => (
        <DestinationCard key={l.id} name={l.name} slug={l.slug} count={totals[i]} image={STILLS[i % STILLS.length]} />
      ))}
    </SnapRow>
  );
}

const paths = [
  { type: "PLOT", mono: "Plots", title: "I want land to build on", text: "Approved plots with clear titles, measured in sq yd or acres.", image: "/stills/s5.jpg" },
  { type: "APARTMENT", mono: "Flats", title: "I want a ready flat", text: "2, 3 and 4 BHK homes in towers with lifts, parking and amenities.", image: "/stills/s2.jpg" },
  { type: "VILLA", mono: "Villas", title: "I want my own villa", text: "Independent houses on their own plot, built and ready to move in.", image: "/stills/s4.jpg" },
  { type: "GATED_COMMUNITY", mono: "Gated", title: "I want a secure community", text: "Villas inside gated layouts with clubhouse, parks and 24x7 security.", image: "/stills/s6.jpg" },
  { type: "COMMERCIAL", mono: "Commercial", title: "I want an office", text: "Grade-A floors in towers across Hyderabad's business districts.", image: "/stills/s1.jpg" },
];

const services = [
  { title: "Verified Listings", text: "Every plot, flat and villa shows its RERA number and a named agent.", image: "/stills/s2.jpg", icon: <ShieldCheck className="h-5 w-5" strokeWidth={1.4} /> },
  { title: "Papers Explained", text: "Ask the assistant about the sale deed and approvals, with page citations.", image: "/stills/s4.jpg", icon: <FileText className="h-5 w-5" strokeWidth={1.4} /> },
  { title: "Site Visits", text: "Book a visit with the listing agent and compare homes side by side.", image: "/stills/s3.jpg", icon: <CalendarCheck className="h-5 w-5" strokeWidth={1.4} /> },
  { title: "Registration Support", text: "From token advance to agreement and registration, in one place.", image: "/stills/s6.jpg", icon: <Stamp className="h-5 w-5" strokeWidth={1.4} /> },
];

export default function Home() {
  return (
    <>
      <Suspense fallback={<div className="h-screen bg-black" />}><Story /></Suspense>

      <section className="bg-paper px-5 py-24 text-paper-ink sm:px-8 lg:py-32" aria-labelledby="path-h">
        <div className="mx-auto max-w-[1320px]">
          <Reveal>
            <p className="mono-label text-paper-ink/60">Choose your path</p>
            <h2 id="path-h" className="mt-5 max-w-[16ch] text-[clamp(2.2rem,4.1vw,3.65rem)] font-normal leading-[1.04] tracking-[-0.045em] text-paper-ink">Start where you are. Build from there.</h2>
          </Reveal>
          <ul className="mt-14 grid gap-5 md:grid-cols-2 lg:grid-cols-3">
            {paths.map((p, i) => (
              <Reveal as="li" key={p.type} delay={i * 80}>
                <Link href={`/listings?type=${p.type}`} className="group flex h-full flex-col rounded-[20px] bg-paper-card p-7 transition-colors hover:bg-[#e1e3e3]">
                  <p className="mono-label text-paper-ink/60">{String(i + 1).padStart(2, "0")} {p.mono}</p>
                  <h3 className="mt-3 text-[clamp(1.2rem,1.4vw,1.5rem)] font-normal tracking-[-0.025em] text-paper-ink">{p.title}</h3>
                  <p className="mt-3 max-w-xs text-lg leading-snug text-paper-ink/65">{p.text}</p>
                  <div className="relative mt-7 aspect-[4/3] overflow-hidden rounded-xl bg-paper-ink/10">
                    <Image src={p.image} alt="" fill sizes="(min-width:1024px) 28vw, 90vw" className="object-cover transition-transform duration-[1200ms] group-hover:scale-105" />
                  </div>
                  <span className="mono-label mt-7 flex h-12 items-center justify-center rounded-lg bg-paper-ink/[0.07] text-paper-ink transition-colors group-hover:bg-paper-ink group-hover:text-white">Browse {p.mono.toLowerCase()}</span>
                </Link>
              </Reveal>
            ))}
          </ul>
        </div>
      </section>

      <section id="localities" className="mx-auto grid max-w-[1320px] items-center gap-12 px-5 py-20 sm:px-8 lg:grid-cols-[minmax(0,0.9fr)_minmax(0,2.4fr)] lg:gap-[4.5rem] lg:py-[7.5rem]" aria-labelledby="areas-h">
        <Reveal>
          <span aria-hidden className="mb-6 flex h-12 w-12 items-center justify-center rounded-full border border-white/40"><MapPin className="h-6 w-6" strokeWidth={1.3} /></span>
          <h2 id="areas-h" className="text-[clamp(1.6rem,1.9vw,2.25rem)]">Explore <b>Areas</b></h2>
          <p className="mt-4 max-w-xs text-lg text-body">Discover the most sought-after neighbourhoods in Hyderabad.</p>
          <Link href="/listings" className="mt-8 inline-flex min-h-12 items-center rounded-md bg-white px-5 text-[15px] font-medium text-bg transition-colors hover:bg-white/90">See all homes</Link>
        </Reveal>
        <Reveal delay={120} className="lg:-mr-[max(0px,calc((100vw-1320px)/2-1.5rem))]">
          <Suspense fallback={<Skeleton className="aspect-[3/4] w-[32%] rounded-2xl" />}><Destinations /></Suspense>
        </Reveal>
      </section>

      <section className="grid border-y border-white/10 lg:grid-cols-[0.4fr_0.6fr]" aria-label="Services">
        <div className="relative min-h-[26rem] overflow-hidden">
          <Image src="/stills/s3.jpg" alt="" fill sizes="(min-width:1024px) 40vw, 100vw" className="object-cover" />
          <div className="absolute inset-0 bg-[linear-gradient(180deg,rgb(8_60_90/0.35)_0%,rgb(7_12_38/0.45)_55%,rgb(7_12_38/0.85)_100%)]" />
          <Reveal className="relative flex h-full flex-col pad-l px-6 py-10 lg:pr-10">
            <h2 className="text-[clamp(1.6rem,1.9vw,2.25rem)]">Area guides</h2>
            <p className="mt-5 flex max-w-xs items-start gap-3 text-[15px] text-white/90"><Compass className="mt-0.5 h-8 w-8 shrink-0" strokeWidth={1.1} />Know the roads, the schools and the price per sq ft before you visit.</p>
            <div className="mt-auto pt-16">
              <p className="text-[clamp(1.3rem,1.3vw,1.6rem)]"><b className="font-semibold">Your Area,</b> <span className="font-light">Your Map</span></p>
              <p className="mt-3 max-w-md text-[15px] leading-relaxed text-white/80">See every plot, flat and villa on one map, compare areas side by side, and keep your shortlist in one place.</p>
              <Link href="/listings" className="mt-6 inline-flex items-center gap-3 text-[15px] underline underline-offset-4">See more <span className="flex h-8 w-8 items-center justify-center rounded-md border border-white/60 no-underline"><ArrowUpRight className="h-4 w-4" /></span></Link>
            </div>
          </Reveal>
        </div>
        <div className="pad-r px-5 py-14 sm:px-8 lg:py-16 lg:pl-14">
          <Reveal>
            <ServicesCarousel title="Our Services">
              {services.map((sv) => <ServiceCard key={sv.title} {...sv} />)}
            </ServicesCarousel>
          </Reveal>
        </div>
      </section>

      <section className="pb-20 pt-4 lg:pb-28" aria-labelledby="featured-h">
        <Reveal className="mx-auto mb-10 flex max-w-[1320px] flex-wrap items-end justify-between gap-6 px-5 sm:px-8">
          <h2 id="featured-h" className="text-[clamp(1.6rem,1.9vw,2.25rem)]">Popular <b>homes</b></h2>
          <Link href="/listings" className="inline-flex min-h-12 items-center gap-3 rounded-xl border border-white/40 px-5 text-lg font-medium hover:bg-white/10">
            See all homes <ArrowUpRight className="h-5 w-5" />
          </Link>
        </Reveal>
        <Reveal>
          <Suspense fallback={<Skeleton className="mx-auto aspect-[4/3] w-[66%] rounded-sm" />}><Featured /></Suspense>
        </Reveal>
      </section>

      <section className="grid lg:grid-cols-[1.85fr_1fr]" aria-label="Why buyers choose us">
        <div className="bg-taupe pad-l px-5 py-14 text-white sm:px-8 lg:py-20 lg:pr-16">
          <Reveal>
            <p className="flex items-center gap-3 text-base text-white/85"><FileCheck2 className="h-6 w-6" strokeWidth={1.4} />Check the papers before you visit</p>
            <h2 className="mt-6 text-[clamp(1.6rem,1.9vw,2.25rem)]">Ask about any document, <b>in plain words</b></h2>
            <p className="mt-4 max-w-xl text-lg leading-relaxed text-white/90">
              Open any home and ask our assistant about the sale deed or approvals. It answers in simple language and shows
              which page it read.
            </p>
          </Reveal>
        </div>
        <div className="pad-r px-5 py-14 sm:px-8 lg:py-20 lg:pl-12">
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
          <h2 className="mx-auto max-w-2xl text-[clamp(1.6rem,1.9vw,2.25rem)]">Want to sell your property?</h2>
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
