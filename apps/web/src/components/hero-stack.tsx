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
 * Stacked full-screen panels. Scrolling physically moves the page, so the next place rises from
 * below while its title is still blurred; the title sharpens as the panel reaches the centre and
 * blurs away again as it leaves. Panel images drift slightly slower than the page for depth.
 */
export function HeroStack({ slides, localities }: { slides: HeroSlide[]; localities: Locality[] }) {
  const router = useRouter();
  const root = useRef<HTMLDivElement>(null);
  const panels = useRef<(HTMLElement | null)[]>([]);
  const titles = useRef<(HTMLDivElement | null)[]>([]);
  const bgs = useRef<(HTMLDivElement | null)[]>([]);
  const bar = useRef<HTMLFormElement>(null);
  const [visible, setVisible] = useState<boolean[]>(() => slides.map((_, i) => i === 0));
  const [value, setValue] = useState("");
  const [reduced, setReduced] = useState(false);

  useEffect(() => {
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    setReduced(reduce);
    let raf = 0;
    const update = () => {
      raf = 0;
      const vh = window.innerHeight;
      panels.current.forEach((p, i) => {
        if (!p) return;
        const r = p.getBoundingClientRect();
        // -1 (panel fully above) … 0 (centred) … 1 (panel fully below)
        const offset = Math.max(-1, Math.min(1, (r.top + r.height / 2 - vh / 2) / vh));
        const d = Math.abs(offset);
        const t = titles.current[i];
        if (t && !reduce) {
          t.style.filter = `blur(${(d * 16).toFixed(1)}px)`;
          t.style.opacity = String(Math.max(0, 1 - d * 1.15));
          t.style.transform = `translateY(${(offset * -60).toFixed(1)}px)`;
        }
        const bg = bgs.current[i];
        if (bg && !reduce) bg.style.transform = `translateY(${(offset * -vh * 0.12).toFixed(1)}px) scale(1.18)`;
      });
      // The floating search bar only lives over the hero.
      const el = root.current;
      if (el && bar.current) {
        const bottom = el.getBoundingClientRect().bottom;
        const show = bottom > vh * 0.7;
        bar.current.style.opacity = show ? "1" : "0";
        bar.current.style.pointerEvents = show ? "auto" : "none";
      }
    };
    const onScroll = () => { if (!raf) raf = requestAnimationFrame(update); };
    update();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);

    // Only the panel in view plays its video.
    const io = new IntersectionObserver((entries) => {
      setVisible((prev) => {
        const next = [...prev];
        for (const e of entries) {
          const i = panels.current.indexOf(e.target as HTMLElement);
          if (i >= 0) next[i] = e.isIntersecting && e.intersectionRatio > 0.35;
        }
        return next;
      });
    }, { threshold: [0, 0.35, 0.6] });
    panels.current.forEach((p) => p && io.observe(p));

    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
      io.disconnect();
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

  return (
    <div ref={root} className="relative bg-black text-white" aria-roledescription="carousel" aria-label="Featured places">
      {slides.map((s, i) => (
        <section
          key={s.id}
          ref={(el) => { panels.current[i] = el; }}
          aria-label={s.place}
          className="relative h-screen overflow-hidden border-b border-white/10 last:border-b-0"
        >
          <div ref={(el) => { bgs.current[i] = el; }} className="absolute inset-0 will-change-transform [transform:scale(1.18)]">
            <Image src={s.image} alt="" fill priority={i === 0} sizes="100vw" className="object-cover" />
            {visible[i] && s.video && !reduced && (
              <video className="absolute inset-0 h-full w-full object-cover" autoPlay muted loop playsInline preload="auto">
                <source src={s.video} type="video/mp4" />
              </video>
            )}
          </div>
          <div className="absolute inset-0 bg-black/35" />
          <div className="absolute inset-x-0 bottom-0 h-56 bg-gradient-to-t from-black/60 to-transparent" />

          <div className="relative flex h-full flex-col items-center justify-center px-6 text-center">
            <div ref={(el) => { titles.current[i] = el; }} className="flex flex-col items-center will-change-[filter,opacity,transform]">
              <h2 className="text-[clamp(3rem,10vw,8.5rem)] font-light uppercase leading-none tracking-[-0.02em] text-white">{s.place}</h2>
              <p className="label mt-6 text-white/80">{s.subtitle} <span className="mx-2 opacity-50">/</span> {formatInr(s.price)}</p>
              <Link href={`/listings/${s.id}`} className="label mt-5 inline-flex items-center gap-2 border-b border-white/60 pb-1 hover:border-white">
                View listing <ArrowRight className="h-3.5 w-3.5" />
              </Link>
            </div>
          </div>

          <div className="pointer-events-none absolute bottom-28 left-6 hidden items-end gap-3 text-[0.65rem] tabular-nums md:flex">
            <span className="text-lg font-light">{String(i + 1).padStart(2, "0")}</span>
            <span className="mb-1 h-px w-10 bg-white/40" />
            <span className="mb-0.5 opacity-60">{String(slides.length).padStart(2, "0")}</span>
          </div>
        </section>
      ))}

      <form
        ref={bar}
        onSubmit={search}
        role="search"
        className={cn("fixed bottom-6 left-1/2 z-40 flex w-[min(92vw,34rem)] -translate-x-1/2 items-center gap-3 border border-white/20 bg-black/75 p-1.5 backdrop-blur transition-opacity duration-300")}
      >
        <div className="relative hidden h-11 w-12 shrink-0 overflow-hidden sm:block">
          <Image src={slides[0]?.image ?? "/stills/s1.jpg"} alt="" fill sizes="48px" className="object-cover" />
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
  );
}
