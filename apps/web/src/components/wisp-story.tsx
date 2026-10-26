"use client";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";

type Wisp = { x0: number; xe: number; sway: number; life: number; offset: number; size: number };

const WISPS: Wisp[] = [
  { x0: 0.28, xe: 0.43, sway: 0.1, life: 11, offset: 0.0, size: 1.0 },
  { x0: 0.64, xe: 0.57, sway: -0.12, life: 12, offset: 0.35, size: 1.15 },
  { x0: 0.08, xe: 0.3, sway: 0.16, life: 13, offset: 0.62, size: 1.3 },
  { x0: 0.92, xe: 0.72, sway: -0.15, life: 13, offset: 0.2, size: 1.25 },
  { x0: 0.46, xe: 0.5, sway: 0.08, life: 10, offset: 0.8, size: 0.8 },
  { x0: 0.76, xe: 0.62, sway: 0.05, life: 14, offset: 0.5, size: 1.0 },
];

const bez = (a: number, b: number, c: number, d: number, t: number) => {
  const u = 1 - t;
  return u * u * u * a + 3 * u * u * t * b + 3 * u * t * t * c + t * t * t * d;
};
const smoothstep = (a: number, b: number, x: number) => { const t = Math.min(1, Math.max(0, (x - a) / (b - a))); return t * t * (3 - 2 * t); };

/**
 * Pinned scroll stage: soft smoke wisps sweep down and converge as you scroll, with a bright tapered tip on
 * each one, over a field of drifting stars. The headline resolves into one connected, automated system.
 */
export function WispStory({ stats }: { stats: { listings: number; verified: number; areas: number; types: number } }) {
  const outer = useRef<HTMLElement>(null);
  const soft = useRef<HTMLCanvasElement>(null);
  const crisp = useRef<HTMLCanvasElement>(null);
  const [prog, setProg] = useState(0);
  const [reduced, setReduced] = useState(false);

  useEffect(() => {
    const cs = soft.current, cc = crisp.current, el = outer.current;
    const s = cs?.getContext("2d"), c = cc?.getContext("2d");
    if (!cs || !cc || !el || !s || !c) return;
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    setReduced(reduce);
    let mouse = 0.5, mouseShown = 0.5;
    const onMove = (e: PointerEvent) => { const r = el.getBoundingClientRect(); mouse = Math.min(1, Math.max(0, (e.clientX - r.left) / r.width)); };
    el.addEventListener("pointermove", onMove);
    let w = 0, h = 0, raf = 0, running = false, target = reduce ? 1 : 0, shown = target, last = 0;
    const stars = Array.from({ length: 90 }, (_, i) => ({ x: ((i * 0.6180339) % 1), y: ((i * 0.3819) % 1), r: 0.6 + ((i * 7) % 5) * 0.28, ph: i * 1.7 }));

    const size = () => {
      const dpr = Math.min(1.5, window.devicePixelRatio || 1);
      w = cs.clientWidth; h = cs.clientHeight;
      for (const cv of [cs, cc]) { cv.width = Math.round(w * dpr); cv.height = Math.round(h * dpr); }
      s.setTransform(dpr, 0, 0, dpr, 0, 0); c.setTransform(dpr, 0, 0, dpr, 0, 0);
    };
    const read = () => {
      const r = el.getBoundingClientRect();
      const sc = r.height - window.innerHeight;
      const p = sc > 0 ? Math.min(1, Math.max(0, -r.top / sc)) : 0;
      if (!reduce) target = p;
    };

    const frame = (now: number) => {
      const dt = last ? Math.min(250, now - last) : 16; last = now;
      shown += (target - shown) * (1 - Math.exp(-dt / 160));
      setProg((v) => (Math.abs(v - shown) > 0.004 ? shown : v));
      const t = now / 1000;
      mouseShown += (mouse - mouseShown) * (1 - Math.exp(-dt / 400));
      s.clearRect(0, 0, w, h); c.clearRect(0, 0, w, h);

      for (const st of stars) {
        const a = 0.25 + 0.5 * (0.5 + 0.5 * Math.sin(t * 0.8 + st.ph));
        const y = ((st.y - t * 0.004 * st.r + 1) % 1) * h;
        c.fillStyle = `rgba(210,222,235,${a * 0.7})`;
        c.beginPath(); c.arc(st.x * w, y, st.r, 0, 6.283); c.fill();
      }

      const conv = 0.85 + 0.15 * shown; // wisps pull toward the centre as the stage progresses
      for (const wp of WISPS) {
        const age = (((t / wp.life) + wp.offset) % 1);
        const env = smoothstep(0, 0.12, age) * (1 - smoothstep(0.82, 1, age));
        if (env <= 0.01) continue;
        const xe = wp.xe * w * (1 - 0.35 * shown) + 0.5 * w * 0.35 * shown + (mouseShown - 0.5) * w * 0.22 * wp.size;
        const X = (u: number) => bez(wp.x0 * w, (wp.x0 + wp.sway * 2) * w, (wp.xe - wp.sway * 1.6) * w, xe, u);
        const Y = (u: number) => bez(-0.12 * h, 0.18 * h, 0.34 * h, (0.58 + 0.06 * shown) * h, u);
        const N = 90, trail = 0.95;
        const pts: [number, number, number][] = [];
        for (let i = 0; i <= N; i++) {
          const u = Math.max(0, age - (i / N) * trail) * 1.0;
          const f = i / N;
          const x = X(Math.min(1, u)) + Math.sin(f * 6 + t * 0.5 + wp.offset * 9) * w * 0.03 * f, y = Y(Math.min(1, u));
          pts.push([x, y, i / N]);
        }
        const widthAt = (f: number) => wp.size * (f < 0.03 ? (f / 0.03) * 2.5 : 2.5 + 62 * Math.pow(Math.sin(Math.min(1, f) * Math.PI * 0.92), 0.9));
        const build = (from: number, to: number, mul: number) => {
          const L: [number, number][] = [], R: [number, number][] = [];
          for (let i = from; i <= to; i++) {
            const a = pts[Math.max(0, i - 1)], b = pts[Math.min(N, i + 1)];
            const dx = b[0] - a[0], dy = b[1] - a[1], len = Math.hypot(dx, dy) || 1;
            const nx = -dy / len, ny = dx / len, ww = widthAt(pts[i][2]) * mul * conv * 0.9;
            L.push([pts[i][0] + nx * ww, pts[i][1] + ny * ww]); R.push([pts[i][0] - nx * ww, pts[i][1] - ny * ww]);
          }
          return [...L, ...R.reverse()];
        };
        // soft body (the whole trail), blurred by CSS
        const body = build(0, N, 1);
        const g = s.createLinearGradient(pts[N][0], pts[N][1], pts[0][0], pts[0][1]);
        g.addColorStop(0, "rgba(140,160,180,0)"); g.addColorStop(0.55, `rgba(150,170,190,${0.5 * env})`); g.addColorStop(1, `rgba(200,215,230,${0.85 * env})`);
        s.fillStyle = g; s.beginPath(); body.forEach(([x, y], i) => (i ? s.lineTo(x, y) : s.moveTo(x, y))); s.closePath(); s.fill();
        // crisp bright tip (first 22% of the trail)
        const tip = build(0, Math.round(N * 0.2), 0.4);
        const tg = c.createLinearGradient(pts[Math.round(N * 0.2)][0], pts[Math.round(N * 0.2)][1], pts[0][0], pts[0][1]);
        tg.addColorStop(0, "rgba(220,235,250,0)"); tg.addColorStop(1, `rgba(255,255,255,${0.95 * env})`);
        c.fillStyle = tg; c.beginPath(); tip.forEach(([x, y], i) => (i ? c.lineTo(x, y) : c.moveTo(x, y))); c.closePath(); c.fill();
      }
      raf = requestAnimationFrame(frame);
    };
    const start = () => { if (!running) { running = true; last = 0; raf = requestAnimationFrame(frame); } };
    const stop = () => { running = false; cancelAnimationFrame(raf); };
    size(); read();
    const io = new IntersectionObserver(([e]) => (e.isIntersecting ? start() : stop()), { threshold: 0 });
    io.observe(el);
    const ro = new ResizeObserver(() => { size(); read(); });
    ro.observe(cs);
    window.addEventListener("scroll", read, { passive: true });
    return () => { stop(); io.disconnect(); ro.disconnect(); window.removeEventListener("scroll", read); el.removeEventListener("pointermove", onMove); };
  }, []);

  const a = 1 - smoothstep(0.28, 0.45, prog);          // first line fades out
  const b = smoothstep(0.4, 0.7, prog);
  const count = smoothstep(0.0, 0.2, prog);                 // headline resolves in
  return (
    <section ref={outer} aria-label="One connected, automated system" className={cn("relative bg-black", reduced ? "h-screen" : "h-[260vh]")}>
      <div className="sticky top-0 h-screen overflow-hidden">
        <canvas ref={soft} aria-hidden className="absolute inset-0 h-full w-full opacity-90 blur-[14px] [mask-image:linear-gradient(to_bottom,transparent_0,#000_30%,#000_88%,transparent_100%)]" />
        <canvas ref={crisp} aria-hidden className="absolute inset-0 h-full w-full [mask-image:linear-gradient(to_bottom,transparent_0,#000_30%,#000_88%,transparent_100%)]" />
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_50%_55%,transparent_20%,rgb(0_0_0/0.65)_100%)]" />

        <div style={{ opacity: a, transform: `translateY(${(1 - a) * -18}px)`, pointerEvents: a > 0.5 ? "auto" : "none" }} className="absolute inset-x-0 top-[23vh] mx-auto w-full max-w-[1180px] px-5 sm:px-8">
          <p className="mono-label text-center text-white/55">One platform · Hyderabad</p>
          <p className="mx-auto mt-5 max-w-[22ch] text-center text-[clamp(1.7rem,3.4vw,3.1rem)] leading-[1.06] tracking-[-0.045em] text-white">Plots, flats, villas and offices. Papers, prices and people.</p>

          <dl className="mt-12 grid grid-cols-2 gap-px overflow-hidden rounded-2xl bg-white/10 md:grid-cols-4">
            {[
              [stats.listings, "Homes listed", "/listings"],
              [stats.verified, "Verified clear", "/listings?verified=1"],
              [stats.areas, "Areas covered", "/#localities"],
              [stats.types, "Property types", "/listings"],
            ].map(([n, label, href]) => (
              <Link key={label as string} href={href as string} className="group relative bg-black/70 p-6 backdrop-blur transition-colors hover:bg-white md:p-7">
                <dd className="text-[clamp(2.2rem,3.6vw,3.4rem)] font-normal leading-none tracking-[-0.045em] tabular-nums text-white transition-colors group-hover:text-black">{Math.round((n as number) * count)}</dd>
                <dt className="mono-label mt-4 flex items-center justify-between text-white/55 transition-colors group-hover:text-black/70">{label} <span aria-hidden className="text-base transition-transform group-hover:translate-x-1">→</span></dt>
              </Link>
            ))}
          </dl>

          <ol className="mt-10 grid grid-cols-2 gap-y-6 md:grid-cols-4" aria-label="How it works">
            {[
              ["01", "Search", "Filter by type, area, budget and size.", "/listings"],
              ["02", "Check the papers", "See every approval and title check.", "/listings?verified=1"],
              ["03", "Compare", "Put homes side by side before you visit.", "/compare"],
              ["04", "Close", "Token, agreement and registration, in one place.", "/sell"],
            ].map(([n, t, d, href], i) => {
              const on = prog > 0.06 + i * 0.07;
              return (
                <li key={n} className="relative pr-6">
                  <span aria-hidden className="absolute left-0 right-0 top-[7px] h-px bg-white/15" />
                  <span aria-hidden className="absolute left-0 top-[7px] h-px bg-[#b6f400] transition-[width] duration-700" style={{ width: on ? "100%" : "0%" }} />
                  <span aria-hidden className={cn("relative block h-[15px] w-[15px] rounded-full border transition-colors duration-500", on ? "border-[#b6f400] bg-[#b6f400]" : "border-white/40 bg-black")} />
                  <Link href={href} className="mt-4 block">
                    <span className="mono-label text-white/45">{n}</span>
                    <span className="mt-1 block text-[1.2rem] tracking-[-0.02em] text-white">{t}</span>
                    <span className="mt-1 block max-w-[17rem] text-[15px] leading-snug text-white/55">{d}</span>
                  </Link>
                </li>
              );
            })}
          </ol>
        </div>
        <h2 style={{ opacity: b, transform: `translateY(${(1 - b) * 34}px)` }} className="absolute inset-x-0 bottom-[9vh] mx-auto max-w-[1100px] px-5 text-center text-[clamp(2.6rem,7.2vw,6.6rem)] font-normal leading-[0.98] tracking-[-0.055em] text-white">
          into one connected, automated system.
        </h2>
      </div>
    </section>
  );
}
