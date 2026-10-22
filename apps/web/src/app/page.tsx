import Link from "next/link";
import { Suspense } from "react";
import { Counter } from "@/components/counter";
import { FeatureSlider } from "@/components/feature-slider";
import { HeroStack, type HeroSlide } from "@/components/hero-stack";
import { Marquee } from "@/components/marquee";
import { Skeleton } from "@/components/skeletons";
import { StackedWords } from "@/components/stacked-words";
import { API_URL, typeLabels } from "@/lib/api";
import { getListings, getLocalities } from "@/lib/data";

const FOOTAGE: Record<string, { video: string; image: string }> = {
  kokapet: { video: "/videos/kokapet.mp4", image: "/stills/s5.jpg" },
};
const STILLS = ["/stills/s1.jpg", "/stills/s2.jpg", "/stills/s3.jpg", "/stills/s4.jpg", "/stills/s6.jpg"];

async function Hero() {
  const [{ items }, localities] = await Promise.all([
    getListings({ sort: "price_desc", page: "1", pageSize: "50" }),
    getLocalities(),
  ]);
  // One slide per locality (priciest listing), always including Kokapet, which has its own footage.
  const byLocality = new Map(items.map((l) => [l.locality.slug, l] as const).reverse());
  const picked = [...byLocality.values()].sort((a, b) => b.priceInr - a.priceInr).slice(0, 5);
  const kokapet = byLocality.get("kokapet");
  if (kokapet && !picked.includes(kokapet)) picked[picked.length - 1] = kokapet;

  const slides: HeroSlide[] = picked.map((l, i) => {
    const own = FOOTAGE[l.locality.slug];
    return {
      id: l.id,
      slug: l.locality.slug,
      place: l.locality.name,
      subtitle: `${typeLabels[l.type]}, Hyderabad`,
      price: l.priceInr,
      image: own?.image ?? STILLS[i % STILLS.length],
      video: own?.video ?? (i === 0 ? "/videos/hero.mp4" : undefined),
    };
  });
  return <HeroStack slides={slides} localities={localities} />;
}

const words = [
  { label: "Plots", href: "/listings?type=PLOT" },
  { label: "Villas", href: "/listings?type=VILLA" },
  { label: "Gated communities", href: "/listings?type=GATED_COMMUNITY" },
  { label: "Apartments", href: "/listings?type=APARTMENT" },
  { label: "Kokapet", href: "/listings?locality=kokapet" },
  { label: "Gachibowli", href: "/listings?locality=gachibowli" },
  { label: "Narsingi", href: "/listings?locality=narsingi" },
  { label: "Shamshabad", href: "/listings?locality=shamshabad" },
];

async function Featured() {
  const { items } = await getListings({ sort: "price_desc", page: "1", pageSize: "50" });
  const seen = new Set<string>();
  const featured = items.filter((l) => !seen.has(l.locality.slug) && seen.add(l.locality.slug)).slice(0, 8);
  return <FeatureSlider items={featured} />;
}

async function Stats() {
  const [{ total }, localities, agents] = await Promise.all([
    getListings({ page: "1" }),
    getLocalities(),
    fetch(`${API_URL}/agents`, { next: { revalidate: 300 } }).then((r) => r.json() as Promise<unknown[]>).catch(() => []),
  ]);
  const stats: [number, string, string][] = [
    [total, "", "Active listings"],
    [localities.length, "", "Localities covered"],
    [agents.length, "", "RERA-registered agents"],
    [100, "%", "Listings with a RERA number"],
  ];
  return (
    <dl className="grid gap-12 sm:grid-cols-2 lg:grid-cols-4">
      {stats.map(([n, suffix, label]) => (
        <div key={label} className="border-t border-ink pt-5">
          <dd className="text-[clamp(3.5rem,8vw,6.5rem)] font-extralight leading-none tracking-[-0.04em] text-ink"><Counter to={n} suffix={suffix} /></dd>
          <dt className="label mt-4 text-muted">{label}</dt>
        </div>
      ))}
    </dl>
  );
}

async function Cities() {
  const localities = await getLocalities();
  return <Marquee items={localities.map((l) => l.name)} />;
}

export default function Home() {
  return (
    <>
      <Suspense fallback={<div className="h-screen bg-black" />}><Hero /></Suspense>

      <section className="mx-auto grid max-w-[1800px] gap-10 px-6 py-28 md:grid-cols-[1fr_2fr] md:py-40">
        <p className="label text-muted">About us</p>
        <div>
          <p className="max-w-4xl text-[clamp(1.5rem,3vw,2.75rem)] font-light leading-[1.2] tracking-[-0.02em] text-ink">
            Deccan Estates helps families and investors buy RERA-registered plots, villas and gated communities across
            Hyderabad, from first shortlist to registration.
          </p>
          <p className="mt-8 max-w-xl text-[15px] leading-relaxed text-body">
            Every listing carries its RERA number, every agent is registered, and an assistant reads the sale deed and
            approval papers so you can ask questions before you visit.
          </p>
          <Link href="/listings" className="label mt-8 inline-block border-b border-ink pb-1 text-ink hover:opacity-60">Browse all homes ↗</Link>
        </div>
      </section>

      <section className="border-y border-line py-24 md:py-32" aria-label="Browse by type and locality">
        <div className="mx-auto grid max-w-[1800px] gap-12 px-6 md:grid-cols-[1.8fr_1fr]">
          <StackedWords words={words} />
          <p className="max-w-xs self-start text-[13px] leading-relaxed text-body md:sticky md:top-32 md:justify-self-end">
            Start from the kind of home you want, or from the neighbourhood you have in mind. Every route opens the same
            map view with filters for price, bedrooms and type.
          </p>
        </div>
      </section>

      <section className="mx-auto max-w-[1800px] px-6 py-28 md:py-40">
        <h2 className="mb-14 text-[clamp(2rem,5vw,4rem)]">Featured homes</h2>
        <Suspense fallback={<Skeleton className="mx-auto aspect-[3/4] w-full max-w-[26rem]" />}><Featured /></Suspense>
      </section>

      <section className="mx-auto max-w-[1800px] px-6 pb-28 md:pb-40">
        <Suspense fallback={<Skeleton className="h-40 w-full" />}><Stats /></Suspense>
      </section>

      <section className="border-t border-line py-20" aria-label="Localities">
        <p className="label mx-auto mb-10 max-w-[1800px] px-6 text-muted">We cover</p>
        <Suspense fallback={<Skeleton className="h-16 w-full" />}><Cities /></Suspense>
      </section>

      <section className="bg-black px-6 py-28 text-center text-white will-change-[filter,opacity] md:py-40 [filter:blur(calc(var(--reveal,0)*10px))] [opacity:calc(1-var(--reveal,0)*0.55)]">
        <h2 className="mx-auto max-w-4xl text-[clamp(2.2rem,6vw,5rem)] text-white">Find your place in Hyderabad, right now.</h2>
        <Link href="/listings" className="label mt-12 inline-flex h-14 items-center bg-white px-10 text-black transition-colors hover:bg-white/85">
          Start searching
        </Link>
      </section>
    </>
  );
}
