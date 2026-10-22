"use client";
import Link from "next/link";
import { useEffect, useRef } from "react";

export type Word = { label: string; href: string };

/**
 * Large uppercase list. Rows tilt, blur and fade with their distance from the viewport centre, so the
 * row in focus is straight and crisp and the rest swing away from it as the page scrolls.
 * The first word of each label is dark; the rest is lighter, so long labels read in two tones.
 */
export function StackedWords({ words }: { words: Word[] }) {
  const refs = useRef<(HTMLLIElement | null)[]>([]);

  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    let raf = 0;
    const update = () => {
      raf = 0;
      const vh = window.innerHeight;
      const mid = vh * 0.55;
      for (const el of refs.current) {
        if (!el) continue;
        const r = el.getBoundingClientRect();
        const signed = Math.max(-1, Math.min(1, (r.top + r.height / 2 - mid) / (vh * 0.5)));
        const d = Math.abs(signed);
        el.style.opacity = String(1 - d * 0.9);
        el.style.filter = `blur(${(d * 9).toFixed(1)}px)`;
        // Rows above centre tilt one way, rows below the other: the list appears to twist around the focus row.
        el.style.transform = `rotate(${(signed * 5).toFixed(2)}deg) translateX(${(d * 28).toFixed(1)}px) scale(${(1 - d * 0.05).toFixed(3)})`;
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
      {words.map((w, i) => {
        const [first, ...rest] = w.label.split(" ");
        return (
          <li key={w.label} ref={(el) => { refs.current[i] = el; }} className="group origin-left will-change-[opacity,filter,transform] hover:!opacity-100 hover:![filter:none] hover:![transform:translateX(12px)] hover:transition-[opacity,filter,transform] hover:duration-300">
            <Link href={w.href} className="block py-1 text-[clamp(2rem,6.4vw,5.5rem)] font-light uppercase leading-[1.02] tracking-[-0.025em] text-ink">
              {first}
              {rest.length > 0 && <span className="text-muted transition-colors duration-300 group-hover:text-ink"> {rest.join(" ")}</span>}
            </Link>
          </li>
        );
      })}
    </ul>
  );
}
