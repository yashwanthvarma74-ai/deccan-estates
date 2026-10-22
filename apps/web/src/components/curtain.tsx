"use client";
import { useEffect, useRef } from "react";

/**
 * A soft white drape drawn on a canvas. It sways gently on its own, and the folds gather and the hem
 * lifts around the pointer, so moving the mouse across it moves the cloth like a curtain.
 */
export function Curtain({ className }: { className?: string }) {
  const canvas = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const cv = canvas.current;
    const ctx = cv?.getContext("2d");
    if (!cv || !ctx) return;
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    let w = 0, h = 0, dpr = 1;
    const mouse = { x: 0.5, targetX: 0.5, y: 0.5, targetY: 0.5, active: 0, targetActive: 0 };
    let raf = 0;
    let running = false;
    let t = 0;

    const resize = () => {
      dpr = Math.min(2, window.devicePixelRatio || 1);
      const r = cv.getBoundingClientRect();
      w = r.width; h = r.height;
      cv.width = Math.round(w * dpr); cv.height = Math.round(h * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      draw();
    };

    const gauss = (x: number, c: number, s: number) => Math.exp(-Math.pow((x - c) / s, 2));

    function draw() {
      ctx!.clearRect(0, 0, w, h);
      const step = 3;
      const px = mouse.x * w;
      for (let x = 0; x < w; x += step) {
        const u = x / w;
        const near = gauss(x, px, w * 0.14) * mouse.active;
        // Fold shading: two sine layers, with the fold frequency tightening near the pointer.
        const phase = t * 0.6;
        const fold =
          Math.sin(u * 34 + phase + near * 3) * 0.55 +
          Math.sin(u * 13 - phase * 0.7) * 0.35 +
          Math.sin(u * 71 + phase * 1.4) * 0.1;
        const shade = 0.5 + 0.5 * fold;
        const hem = h * 0.84 + Math.sin(u * 9 + phase) * h * 0.025 + Math.sin(u * 23 - phase * 1.3) * h * 0.015 - near * h * 0.09;
        const grey = Math.round(252 - shade * 46 - near * 8);
        ctx!.fillStyle = `rgb(${grey},${grey},${grey})`;
        ctx!.fillRect(x, 0, step + 0.6, hem);
        // Soft shadow under the hem.
        const g = ctx!.createLinearGradient(0, hem, 0, hem + h * 0.08);
        g.addColorStop(0, "rgba(0,0,0,0.10)");
        g.addColorStop(1, "rgba(0,0,0,0)");
        ctx!.fillStyle = g;
        ctx!.fillRect(x, hem, step + 0.6, h * 0.08);
      }
      // Fade the cloth into the page at the top so it appears to hang from the lettering.
      const top = ctx!.createLinearGradient(0, 0, 0, h * 0.45);
      top.addColorStop(0, "rgba(255,255,255,1)");
      top.addColorStop(1, "rgba(255,255,255,0)");
      ctx!.fillStyle = top;
      ctx!.fillRect(0, 0, w, h * 0.45);
    }

    const loop = () => {
      t += 0.016;
      mouse.x += (mouse.targetX - mouse.x) * 0.06;
      mouse.active += (mouse.targetActive - mouse.active) * 0.05;
      draw();
      raf = requestAnimationFrame(loop);
    };
    const start = () => { if (!running && !reduce) { running = true; raf = requestAnimationFrame(loop); } };
    const stop = () => { running = false; cancelAnimationFrame(raf); };

    const onMove = (e: PointerEvent) => {
      const r = cv.getBoundingClientRect();
      mouse.targetX = (e.clientX - r.left) / r.width;
      mouse.targetY = (e.clientY - r.top) / r.height;
      mouse.targetActive = 1;
    };
    const onLeave = () => { mouse.targetActive = 0; };

    const io = new IntersectionObserver(([e]) => (e.isIntersecting ? start() : stop()), { threshold: 0.05 });
    io.observe(cv);
    resize();
    window.addEventListener("resize", resize);
    window.addEventListener("pointermove", onMove, { passive: true });
    cv.addEventListener("pointerleave", onLeave);
    return () => {
      stop();
      io.disconnect();
      window.removeEventListener("resize", resize);
      window.removeEventListener("pointermove", onMove);
      cv.removeEventListener("pointerleave", onLeave);
    };
  }, []);

  return <canvas ref={canvas} aria-hidden className={className} />;
}
