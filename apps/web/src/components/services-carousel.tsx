"use client";
import { useCallback, useEffect, useRef, useState } from "react";
import { ArrowLeft, ArrowRight } from "lucide-react";
import { cn } from "@/lib/utils";

/** Heading with a round Prev / Next pair on the right (the Prev dims at the start), above a snap track. */
export function ServicesCarousel({ title, children }: { title: React.ReactNode; children: React.ReactNode }) {
  const track = useRef<HTMLDivElement>(null);
  const [edge, setEdge] = useState({ start: true, end: false });

  const measure = useCallback(() => {
    const el = track.current;
    if (!el) return;
    const max = el.scrollWidth - el.clientWidth;
    setEdge({ start: el.scrollLeft < 4, end: el.scrollLeft > max - 4 });
  }, []);

  useEffect(() => {
    measure();
    const el = track.current;
    el?.addEventListener("scroll", measure, { passive: true });
    window.addEventListener("resize", measure);
    return () => { el?.removeEventListener("scroll", measure); window.removeEventListener("resize", measure); };
  }, [measure]);

  const go = (dir: 1 | -1) => {
    const el = track.current;
    const first = el?.firstElementChild as HTMLElement | null;
    if (el && first) el.scrollBy({ left: dir * (first.getBoundingClientRect().width + 20), behavior: "smooth" });
  };

  const btn = "flex h-12 w-12 cursor-pointer items-center justify-center rounded-full transition-all disabled:cursor-default";

  return (
    <div role="region" aria-roledescription="carousel" aria-label="Our services">
      <div className="flex items-center justify-between gap-6">
        <h2 className="text-[clamp(1.5rem,2.2vw,2rem)]">{title}</h2>
        <div className="flex gap-3">
          <button onClick={() => go(-1)} disabled={edge.start} aria-label="Previous" className={cn(btn, edge.start ? "bg-white/25 text-white/80" : "bg-white text-bg hover:scale-105")}><ArrowLeft className="h-5 w-5" /></button>
          <button onClick={() => go(1)} disabled={edge.end} aria-label="Next" className={cn(btn, edge.end ? "bg-white/25 text-white/80" : "bg-white text-bg hover:scale-105")}><ArrowRight className="h-5 w-5" /></button>
        </div>
      </div>
      <div ref={track} className="mt-10 flex snap-x snap-mandatory gap-5 overflow-x-auto scroll-smooth pb-2 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        {children}
      </div>
    </div>
  );
}
