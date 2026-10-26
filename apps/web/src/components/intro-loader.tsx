"use client";
import { useEffect, useRef, useState } from "react";
import { Logo } from "@/components/logo";

const DURATION = 2000;
const ease = (t: number) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);
const NOTES = ["Surveying the land", "Checking the papers", "Raising the walls", "Opening the doors"];

/**
 * Full-screen counter from 0 to 100 in three seconds while the hero photos load, then a two-part curtain lifts.
 * The page content is already rendered underneath; scrolling is locked until the curtain opens.
 */
export function IntroLoader() {
  const [n, setN] = useState(0);
  const [phase, setPhase] = useState<"count" | "open" | "gone">("count");
  const start = useRef(0);

  useEffect(() => {
    const root = document.documentElement;
    root.dataset.intro = "loading";
    root.style.overflow = "hidden";
    let raf = 0, finished = false;
    const finish = () => {
      if (finished) return;
      finished = true;
      setN(100);
      setPhase("open");
      root.dataset.intro = "done";
      window.setTimeout(() => { setPhase("gone"); root.style.overflow = ""; }, 1100);
    };
    const tick = (now: number) => {
      if (!start.current) start.current = now;
      const t = Math.min(1, (now - start.current) / DURATION);
      setN(Math.round(ease(t) * 100));
      if (t < 1) raf = requestAnimationFrame(tick);
      else finish();
    };
    raf = requestAnimationFrame(tick);
    // browsers pause animation frames in background tabs; this timer guarantees the curtain still opens
    const guard = window.setTimeout(finish, DURATION + 400);
    return () => { cancelAnimationFrame(raf); window.clearTimeout(guard); root.style.overflow = ""; };
  }, []);

  if (phase === "gone") return null;
  const open = phase === "open";
  const note = NOTES[Math.min(NOTES.length - 1, Math.floor(n / 26))];

  return (
    <div aria-hidden={open} role="status" aria-label={`Loading ${n} percent`} className="fixed inset-0 z-[100] text-white">
      {["top", "bottom"].map((half) => (
        <div key={half} className="absolute inset-x-0 bg-black transition-transform duration-[1000ms] ease-[cubic-bezier(0.76,0,0.24,1)]" style={half === "top" ? { top: 0, height: "50.2%", transform: open ? "translateY(-101%)" : "none" } : { bottom: 0, height: "50.2%", transform: open ? "translateY(101%)" : "none" }} />
      ))}
      <div className="absolute inset-0 transition-opacity duration-500" style={{ opacity: open ? 0 : 1 }}>
        <div className="absolute left-5 top-6 sm:left-10 sm:top-9"><Logo /></div>
        <p className="mono-label absolute right-5 top-8 text-white/50 sm:right-10 sm:top-11">{note}</p>
        <div className="absolute inset-x-5 bottom-10 sm:inset-x-10 sm:bottom-14">
          <div className="flex items-end justify-between gap-6">
            <p className="text-[clamp(6rem,22vw,19rem)] font-normal leading-[0.78] tracking-[-0.07em] tabular-nums">{n}</p>
            <p className="mono-label pb-3 text-right text-white/50">Hyderabad<br />Real estate, verified</p>
          </div>
          <div className="mt-8 h-px w-full bg-white/15"><div className="h-px bg-[#b6f400] shadow-[0_0_14px_rgb(182_244_0/0.9)]" style={{ width: `${n}%` }} /></div>
        </div>
      </div>
    </div>
  );
}
