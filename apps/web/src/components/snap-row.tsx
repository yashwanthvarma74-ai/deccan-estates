"use client";
import { useCallback, useEffect, useRef, useState } from "react";
import { ArrowLeft, ArrowRight } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * Horizontal scroll-snap track with round Prev / Next buttons and an optional progress bar.
 * `center` pads the track so the first and last items can sit in the middle (peeking neighbours).
 */
export function SnapRow({ children, center = false, progress = false, controls = "inline", label }: { children: React.ReactNode; center?: boolean; progress?: boolean; controls?: "inline" | "none"; label: string }) {
  const track = useRef<HTMLDivElement>(null);
  const [ratio, setRatio] = useState(0);
  const [edge, setEdge] = useState({ start: true, end: false });

  const measure = useCallback(() => {
    const el = track.current;
    if (!el) return;
    const max = el.scrollWidth - el.clientWidth;
    setRatio(max > 0 ? el.scrollLeft / max : 0);
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
    if (!el || !first) return;
    el.scrollBy({ left: dir * (first.getBoundingClientRect().width + 16), behavior: "smooth" });
  };

  const btn = "flex h-11 w-11 cursor-pointer items-center justify-center rounded-full transition-all disabled:cursor-default disabled:opacity-40";

  return (
    <div className="relative" role="region" aria-roledescription="carousel" aria-label={label}>
      <div ref={track} className={cn("flex snap-x snap-mandatory gap-4 overflow-x-auto scroll-smooth pb-2 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden", center && "px-[8%] lg:px-[17%]")}>
        {children}
      </div>
      {controls === "inline" && (
        <>
          <button onClick={() => go(-1)} disabled={edge.start} aria-label="Previous" className={cn(btn, "absolute left-4 top-1/2 -translate-y-1/2 bg-white text-bg shadow-lg hover:scale-105 lg:left-[calc(17%-1.4rem)]")}><ArrowLeft className="h-5 w-5" /></button>
          <button onClick={() => go(1)} disabled={edge.end} aria-label="Next" className={cn(btn, "absolute right-4 top-1/2 -translate-y-1/2 bg-white text-bg shadow-lg hover:scale-105 lg:right-[calc(17%-1.4rem)]")}><ArrowRight className="h-5 w-5" /></button>
        </>
      )}
      {progress && (
        <div className="mt-6 h-[3px] w-full bg-white/15" role="presentation">
          <div className="h-full bg-white/70 transition-[width] duration-200" style={{ width: `${Math.max(8, ratio * 100)}%` }} />
        </div>
      )}
    </div>
  );
}
