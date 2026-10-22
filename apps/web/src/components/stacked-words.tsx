"use client";
import Link from "next/link";
import { useEffect, useRef } from "react";

export type Word = { label: string; href: string };

/**
 * Large uppercase list whose rows fade and blur with distance from the viewport centre,
 * so the row in focus is crisp and the rest recede.
 */
export function StackedWords({ words }: { words: Word[] }) {
  const refs = useRef<(HTMLLIElement | null)[]>([]);

  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    let raf = 0;
    const update = () => {
      raf = 0;
      const mid = window.innerHeight * 0.55;
      for (const el of refs.current) {
        if (!el) continue;
        const r = el.getBoundingClientRect();
        const d = Math.min(1, Math.abs(r.top + r.height / 2 - mid) / (window.innerHeight * 0.45));
        el.style.opacity = String(1 - d * 0.85);
        el.style.filter = `blur(${(d * 6).toFixed(1)}px)`;
        el.style.transform = `translateX(${(d * 12).toFixed(1)}px)`;
      }
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
  }, []);

  return (
    <ul>
      {words.map((w, i) => (
        <li key={w.label} ref={(el) => { refs.current[i] = el; }} className="will-change-[opacity,filter,transform]">
          <Link href={w.href} className="block py-1 text-[clamp(2rem,6.4vw,5.5rem)] font-light uppercase leading-[1.02] tracking-[-0.025em] text-ink transition-colors hover:text-muted">
            {w.label}
          </Link>
        </li>
      ))}
    </ul>
  );
}
