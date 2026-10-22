"use client";
import { useEffect, useState } from "react";

const DURATION = 1800;
const KEY = "preloader-seen";

/** First-visit loading screen: wordmark, percentage counter, then a curtain that lifts away. */
export function Preloader() {
  const [percent, setPercent] = useState(0);
  const [phase, setPhase] = useState<"loading" | "leaving" | "gone">("loading");

  useEffect(() => {
    let seen = false;
    try { seen = sessionStorage.getItem(KEY) === "1"; } catch {}
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (seen || reduce) {
      setPhase("gone");
      return;
    }
    const start = performance.now();
    let raf = 0;
    const tick = (now: number) => {
      const t = Math.min(1, (now - start) / DURATION);
      setPercent(Math.round((1 - Math.pow(1 - t, 3)) * 100));
      if (t < 1) raf = requestAnimationFrame(tick);
      else {
        setPhase("leaving");
        try { sessionStorage.setItem(KEY, "1"); } catch {}
        setTimeout(() => setPhase("gone"), 900);
      }
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, []);

  if (phase === "gone") return null;

  return (
    <div
      role="status"
      aria-label="Loading"
      className={`fixed inset-0 z-[100] flex flex-col items-center bg-white text-ink transition-transform duration-[900ms] ease-[cubic-bezier(0.76,0,0.24,1)] ${phase === "leaving" ? "-translate-y-full" : ""}`}
    >
      <div className="pt-6 text-center leading-none">
        <p className="text-[2rem] font-light tracking-tight">Deccan</p>
        <p className="label mt-1 text-[0.55rem] text-muted">Estates</p>
      </div>
      <div className="mt-auto flex w-full items-end justify-between px-6 pb-8">
        <span className="label text-muted">Loading</span>
        <span className="text-[clamp(4rem,12vw,9rem)] font-extralight leading-none tabular-nums">{percent}%</span>
      </div>
    </div>
  );
}
