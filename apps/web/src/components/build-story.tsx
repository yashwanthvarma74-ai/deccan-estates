"use client";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { ArrowRight } from "lucide-react";
import { CHAPTERS, buildWorld, chapterAt, renderWorld } from "@/lib/build-world";
import { cn } from "@/lib/utils";

export type TypeCounts = Record<"PLOT" | "APARTMENT" | "VILLA" | "GATED_COMMUNITY" | "COMMERCIAL", number>;

const COPY: Record<string, { label: string; title: string; text: string; cta?: { href: string; text: string } }> = {
  plot: {
    label: "01 — Plot",
    title: "Every home begins as land.",
    text: "Survey stakes go in, boundaries are marked, and a clear title makes it yours.",
    cta: { href: "/listings?type=PLOT", text: "Browse plots" },
  },
  fence: {
    label: "02 — Fence",
    title: "Secure it. Mark it. Own it.",
    text: "Boundary walls, a gate and an approved layout. Protected land is easier to build on and to resell.",
    cta: { href: "/listings?type=PLOT&gated=1", text: "See gated layouts" },
  },
  villa: {
    label: "03 — Villa",
    title: "Build the home you picture.",
    text: "Foundation, two floors, a roof over your head. Independent villas with your own plot.",
    cta: { href: "/listings?type=VILLA", text: "Browse villas" },
  },
  apartment: {
    label: "04 — Flats",
    title: "Or take a ready flat in a tower.",
    text: "Seven floors, lifts, parking and amenities already in place. Move in, no construction to manage.",
    cta: { href: "/listings?type=APARTMENT", text: "Browse flats" },
  },
  commercial: {
    label: "05 — Commercial",
    title: "Go as high as your business.",
    text: "Grade-A office floors in towers across Hyderabad's business districts.",
    cta: { href: "/listings?type=COMMERCIAL", text: "Browse commercial" },
  },
  outro: {
    label: "Built",
    title: "Plots, villas, flats and offices. All of Hyderabad.",
    text: "Pick where to start. Every listing carries its RERA number.",
    cta: { href: "/listings", text: "See all homes" },
  },
};

const TYPES = [
  { type: "PLOT", title: "Plots" },
  { type: "APARTMENT", title: "Flats" },
  { type: "VILLA", title: "Villas" },
  { type: "GATED_COMMUNITY", title: "Gated" },
  { type: "COMMERCIAL", title: "Commercial" },
] as const;

/**
 * Scroll-driven construction. The stage stays pinned while scrolling builds, in order: a plot, its fence,
 * a villa, an apartment tower and a commercial high-rise, each rising from the ground up on a canvas.
 */
export function BuildStory({ counts }: { counts: TypeCounts }) {
  const outer = useRef<HTMLElement>(null);
  const canvas = useRef<HTMLCanvasElement>(null);
  const [chapter, setChapter] = useState<string>("intro");
  const [reduced, setReduced] = useState(false);

  useEffect(() => {
    const cv = canvas.current;
    const el = outer.current;
    const ctx = cv?.getContext("2d");
    if (!cv || !el || !ctx) return;
    const world = buildWorld();
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    setReduced(reduce);

    let w = 0, h = 0, dpr = 1;
    let target = reduce ? 1 : 0;
    let shown = target;
    let raf = 0;
    let running = false;
    let lastChapter = "";

    const size = () => {
      dpr = Math.min(2, window.devicePixelRatio || 1);
      w = cv.clientWidth; h = cv.clientHeight;
      cv.width = Math.round(w * dpr); cv.height = Math.round(h * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };
    const readScroll = () => {
      if (reduce) return;
      const r = el.getBoundingClientRect();
      const scrollable = r.height - window.innerHeight;
      target = scrollable > 0 ? Math.min(1, Math.max(0, -r.top / scrollable)) : 0;
    };
    let last = 0;
    const frame = (now: number) => {
      // Ease toward the scroll position (time-based, so it feels the same at any frame rate).
      const dt = last ? Math.min(250, now - last) : 16;
      last = now;
      shown += (target - shown) * (1 - Math.exp(-dt / 120));
      if (Math.abs(target - shown) < 0.0004) shown = target;
      renderWorld(ctx, world, w, h, shown, now);
      const c = chapterAt(shown).id;
      if (c !== lastChapter) { lastChapter = c; setChapter(c); }
      raf = requestAnimationFrame(frame);
    };
    const start = () => { if (!running) { running = true; raf = requestAnimationFrame(frame); } };
    const stop = () => { running = false; cancelAnimationFrame(raf); };

    size(); readScroll(); shown = reduce ? 1 : target;
    const io = new IntersectionObserver(([e]) => (e.isIntersecting ? start() : stop()), { threshold: 0 });
    io.observe(el);
    window.addEventListener("scroll", readScroll, { passive: true });
    // Watch the canvas itself so any layout change (window, devtools, sidebar) resizes the drawing buffer.
    const ro = new ResizeObserver(() => { size(); readScroll(); });
    ro.observe(cv);
    return () => {
      stop(); io.disconnect(); ro.disconnect();
      window.removeEventListener("scroll", readScroll);
    };
  }, []);

  const copy = COPY[chapter];
  const idx = CHAPTERS.findIndex((c) => c.id === chapter);

  return (
    <section ref={outer} aria-label="Build your place" className={cn("relative bg-black", reduced ? "h-screen" : "h-[900vh]")}>
      <div className="sticky top-0 h-screen overflow-hidden">
        <canvas ref={canvas} aria-hidden className="absolute inset-0 h-full w-full" />
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_30%_80%,transparent_0%,rgb(0_0_0/0.55)_100%)]" />

        {/* Intro: one clear question and one-tap answers. */}
        <div className={cn("absolute inset-0 flex flex-col justify-center px-5 pb-10 pt-24 transition-all duration-700 sm:px-8", chapter === "intro" ? "opacity-100" : "pointer-events-none -translate-y-6 opacity-0")}>
          <div className="mx-auto w-full max-w-[1320px]">
            <p className="mono-label text-white/60">Hyderabad · Plots · Villas · Flats · Commercial</p>
            <h1 className="mt-5 max-w-[14ch] text-[clamp(2.8rem,7vw,6.2rem)] font-normal text-white">Build your place in Hyderabad.</h1>
            <p className="mt-6 max-w-md text-lg text-white/70">Tap what you are looking for, or keep scrolling and watch it get built.</p>
            <ul className="mt-9 flex flex-wrap gap-2.5" aria-label="What are you looking for?">
              {TYPES.map(({ type, title }) => (
                <li key={type}>
                  <Link href={`/listings?type=${type}`} className="mono-label group flex min-h-12 items-center gap-3 rounded-full border border-white/25 bg-white/[0.06] px-5 text-white backdrop-blur transition-colors hover:border-white hover:bg-white hover:text-black">
                    {title}
                    <span className="text-white/50 transition-colors group-hover:text-black/60">{counts[type]}</span>
                  </Link>
                </li>
              ))}
            </ul>
          </div>
          <div className="absolute bottom-8 left-1/2 flex -translate-x-1/2 flex-col items-center gap-3 text-white/60">
            <span className="mono-label">Scroll to build</span>
            <span className="h-10 w-px overflow-hidden bg-white/20"><span className="block h-full w-full animate-[scroll-cue_2.4s_ease-in-out_infinite] bg-white" /></span>
          </div>
        </div>

        {/* Chapter copy */}
        {copy && chapter !== "intro" && (
          <div key={chapter} className="absolute bottom-[12vh] left-5 right-5 animate-[fade-up_700ms_ease-out_both] sm:left-8 md:bottom-auto md:left-[max(2rem,calc((100vw-1320px)/2))] md:right-auto md:top-1/2 md:max-w-[26rem] md:-translate-y-1/2">
            <p className="mono-label text-white/60">{copy.label}</p>
            <h2 className="mt-4 text-[clamp(2rem,3.6vw,3.4rem)] font-normal leading-[1.05] text-white">{copy.title}</h2>
            <p className="mt-4 max-w-sm text-base leading-relaxed text-white/70">{copy.text}</p>
            {copy.cta && (
              <Link href={copy.cta.href} className="mono-label pointer-events-auto mt-7 inline-flex min-h-12 items-center gap-3 rounded-full bg-white px-6 text-black transition-transform hover:scale-[1.03] active:scale-95">
                {copy.cta.text} <ArrowRight className="h-4 w-4" />
              </Link>
            )}
          </div>
        )}

        {/* Progress */}
        <ol className="absolute right-5 top-1/2 hidden -translate-y-1/2 flex-col gap-3 md:flex lg:right-[max(2rem,calc((100vw-1320px)/2))]" aria-label="Build progress">
          {CHAPTERS.filter((c) => c.id !== "intro").map((c) => {
            const i = CHAPTERS.findIndex((x) => x.id === c.id);
            const done = idx >= i;
            return (
              <li key={c.id} className="flex items-center justify-end gap-3">
                <span className={cn("mono-label transition-opacity", idx === i ? "text-white opacity-100" : "text-white/50 opacity-0")}>{c.label}</span>
                <span className={cn("block h-2 w-2 rounded-full border transition-colors", done ? "border-white bg-white" : "border-white/40")} />
              </li>
            );
          })}
        </ol>
      </div>
    </section>
  );
}
