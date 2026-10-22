"use client";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { ArrowRight } from "lucide-react";
import { cn, formatInr } from "@/lib/utils";

export type HeroSlide = {
  id: string;
  slug: string;
  place: string;
  subtitle: string;
  price: number;
  image: string;
  video?: string;
};

type Locality = { id: string; name: string; slug: string };

/**
 * Scroll-through hero: the stage stays pinned while vertical scrolling steps through slides.
 * Each slide cross-fades its image (or plays its own clip) under a large light uppercase title.
 */
export function HeroScroller({ slides, localities }: { slides: HeroSlide[]; localities: Locality[] }) {
  const router = useRouter();
  const outer = useRef<HTMLDivElement>(null);
  const [active, setActive] = useState(0);
  const [value, setValue] = useState("");
  const [reduced, setReduced] = useState(false);

  useEffect(() => {
    setReduced(window.matchMedia("(prefers-reduced-motion: reduce)").matches);
    let raf = 0;
    const update = () => {
      raf = 0;
      const el = outer.current;
      if (!el) return;
      const rect = el.getBoundingClientRect();
      const scrollable = rect.height - window.innerHeight;
      const progress = scrollable > 0 ? Math.min(1, Math.max(0, -rect.top / scrollable)) : 0;
      setActive(Math.min(slides.length - 1, Math.floor(progress * slides.length * 0.9999)));
    };
    const onScroll = () => { if (!raf) raf = requestAnimationFrame(update); };
    update();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
      if (raf) cancelAnimationFrame(raf);
    };
  }, [slides.length]);

  function search(e: React.FormEvent) {
    e.preventDefault();
    const text = value.trim();
    const match = localities.find((l) => l.name.toLowerCase() === text.toLowerCase());
    const params = new URLSearchParams();
    if (match) params.set("locality", match.slug);
    else if (text) params.set("q", text);
    router.push(`/listings?${params}`);
  }

  const current = slides[active];

  return (
    <div ref={outer} style={{ height: `${slides.length * 100}vh` }} className="relative bg-black" aria-roledescription="carousel" aria-label="Featured places">
      <div className="sticky top-0 h-screen overflow-hidden text-white">
        {slides.map((s, i) => {
          const on = i === active;
          return (
            <div key={s.id} aria-hidden={!on} className={cn("absolute inset-0 transition-opacity duration-[900ms] ease-out", on ? "opacity-100" : "opacity-0")}>
              <Image src={s.image} alt="" fill priority={i === 0} sizes="100vw" className={cn("object-cover transition-transform duration-[2500ms] ease-out", on ? "scale-100" : "scale-110")} />
              {on && s.video && !reduced && (
                <video key={s.video} className="absolute inset-0 h-full w-full object-cover" autoPlay muted loop playsInline preload="auto">
                  <source src={s.video} type="video/mp4" />
                </video>
              )}
              <div className="absolute inset-0 bg-black/35" />
              <div className="absolute inset-x-0 bottom-0 h-56 bg-gradient-to-t from-black/60 to-transparent" />
            </div>
          );
        })}

        <div className="relative flex h-full flex-col items-center justify-center px-6 text-center">
          {slides.map((s, i) => (
            <div
              key={s.id}
              aria-live={i === active ? "polite" : "off"}
              className={cn(
                "absolute inset-x-6 flex flex-col items-center transition-all duration-[900ms] ease-out",
                i === active ? "translate-y-0 opacity-100 blur-0" : "pointer-events-none translate-y-6 opacity-0 blur-md",
              )}
            >
              <h2 className="text-[clamp(3rem,9.5vw,8rem)] font-light uppercase leading-none tracking-[-0.02em] text-white">{s.place}</h2>
              <p className="label mt-6 text-white/80">{s.subtitle} <span className="mx-2 opacity-50">/</span> {formatInr(s.price)}</p>
              <Link href={`/listings/${s.id}`} tabIndex={i === active ? 0 : -1} className="label mt-5 inline-flex items-center gap-2 border-b border-white/60 pb-1 hover:border-white">
                View listing <ArrowRight className="h-3.5 w-3.5" />
              </Link>
            </div>
          ))}
        </div>

        <div className="pointer-events-none absolute bottom-28 left-6 hidden items-end gap-3 text-[0.65rem] tabular-nums md:flex">
          <span className="text-lg font-light">{String(active + 1).padStart(2, "0")}</span>
          <span className="mb-1 h-px w-10 bg-white/40" />
          <span className="mb-0.5 opacity-60">{String(slides.length).padStart(2, "0")}</span>
        </div>
        <p className="label pointer-events-none absolute bottom-28 right-6 hidden text-[0.6rem] text-white/60 md:block">Scroll</p>

        <form
          onSubmit={search}
          role="search"
          className="absolute bottom-6 left-1/2 flex w-[min(92vw,34rem)] -translate-x-1/2 items-center gap-3 border border-white/20 bg-black/75 p-1.5 pr-1.5 backdrop-blur"
        >
          <div className="relative hidden h-11 w-12 shrink-0 overflow-hidden sm:block">
            <Image src={current?.image ?? "/stills/s1.jpg"} alt="" fill sizes="48px" className="object-cover" />
          </div>
          <label className="sr-only" htmlFor="hero-search">Search by locality or keyword</label>
          <input
            id="hero-search"
            list="hero-localities"
            value={value}
            onChange={(e) => setValue(e.target.value)}
            placeholder="Find homes by locality"
            className="h-11 min-w-0 flex-1 bg-transparent px-2 text-[13px] text-white outline-none placeholder:text-white/60"
          />
          <datalist id="hero-localities">
            {localities.map((l) => <option key={l.id} value={l.name} />)}
          </datalist>
          <button type="submit" className="h-11 shrink-0 cursor-pointer bg-white px-5 text-[12px] font-medium text-black transition-colors hover:bg-white/85">
            Search
          </button>
        </form>
      </div>
    </div>
  );
}
