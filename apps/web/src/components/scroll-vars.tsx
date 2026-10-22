"use client";
import { useEffect } from "react";

/**
 * Publishes `--reveal` (0 → 1) on <html> while the fixed footer is being uncovered at the end of the
 * page, so content above it can blur and fade as the page "lifts" away.
 */
export function ScrollVars() {
  useEffect(() => {
    const root = document.documentElement;
    let raf = 0;
    const update = () => {
      raf = 0;
      const vh = window.innerHeight;
      const max = root.scrollHeight - vh;
      const start = max - vh; // footer begins to show when one viewport of margin remains
      const p = vh > 0 ? Math.min(1, Math.max(0, (window.scrollY - start) / (vh * 0.8))) : 0;
      root.style.setProperty("--reveal", p.toFixed(3));
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
  return null;
}
