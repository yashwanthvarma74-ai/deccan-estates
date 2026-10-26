"use client";
import { useEffect, useRef, type MutableRefObject } from "react";

const sm = (a: number, b: number, x: number) => { const t = Math.min(1, Math.max(0, (x - a) / (b - a))); return t * t * (3 - 2 * t); };

type Star = { x: number; y: number; z: number; r: number; hue: number; ph: number };
function makeStars(n: number): Star[] {
  let s = 7;
  const r = () => { s = (s * 1664525 + 1013904223) >>> 0; return s / 4294967296; };
  return Array.from({ length: n }, () => ({ x: r() * 2 - 1, y: r() * 2 - 1, z: 1 + r() * 2.2, r: 0.5 + r() * 1.3, hue: r(), ph: r() * 6.28 }));
}

/**
 * The night behind the villa and everything beyond it, drawn from one scroll value `p` (0..1):
 * dusk fades to a starry night with a rising moon, the camera climbs out of the atmosphere, stars stream past,
 * a nebula glows, and a black hole with a bright accretion disk grows until we fall into it.
 */
export function CosmosCanvas({ pRef }: { pRef: MutableRefObject<number> }) {
  const ref = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    const cv = ref.current; const ctx = cv?.getContext("2d");
    if (!cv || !ctx) return;
    const stars = makeStars(900);
    let w = 0, h = 0, raf = 0, visible = true;
    const io = new IntersectionObserver(([en]) => { visible = en.isIntersecting; }, { threshold: 0 });
    io.observe(cv);
    const size = () => {
      const dpr = Math.min(1.5, window.devicePixelRatio || 1);
      w = cv.clientWidth; h = cv.clientHeight;
      cv.width = Math.round(w * dpr); cv.height = Math.round(h * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };
    size();
    const ro = new ResizeObserver(size); ro.observe(cv);

    const frame = (now: number) => {
      if (!visible) { raf = requestAnimationFrame(frame); return; }
      const p = pRef.current, t = now / 1000;
      const night = sm(0.12, 0.4, p);          // dusk to night
      const ascend = sm(0.46, 0.7, p);          // leaving the ground
      const space = sm(0.52, 0.72, p);          // atmosphere gone
      const travel = sm(0.46, 0.96, p);         // forward flight through the stars
      const bh = sm(0.7, 0.93, p);              // black hole size
      ctx.clearRect(0, 0, w, h);
      ctx.lineCap = "round";

      // sky: dusk blue at the horizon fading to space black
      const g = ctx.createLinearGradient(0, 0, 0, h);
      g.addColorStop(0, `rgb(${4 + 6 * (1 - space)}, ${6 + 8 * (1 - space)}, ${16 + 26 * (1 - space)})`);
      g.addColorStop(0.7, `rgb(${10 + 30 * (1 - ascend)}, ${14 + 14 * (1 - ascend)}, ${34 + 20 * (1 - ascend)})`);
      g.addColorStop(1, `rgb(${40 * (1 - ascend) + 6}, ${22 * (1 - ascend) + 8}, ${30 * (1 - ascend) + 14})`);
      ctx.fillStyle = g; ctx.fillRect(0, 0, w, h);

      // nebula
      if (space > 0.01) {
        const blobs: [number, number, number, string][] = [[0.22, 0.3, 0.55, "120,60,200"], [0.78, 0.42, 0.5, "40,120,220"], [0.5, 0.75, 0.6, "200,70,130"], [0.65, 0.18, 0.4, "30,170,170"]];
        for (const [bx, by, br, rgb] of blobs) {
          const cx = bx * w + Math.sin(t * 0.05 + bx * 9) * 30, cy = by * h + Math.cos(t * 0.04 + by * 7) * 24, rad = br * Math.max(w, h) * (1 + travel * 0.5);
          const rg = ctx.createRadialGradient(cx, cy, 0, cx, cy, rad);
          rg.addColorStop(0, `rgba(${rgb},${0.22 * space * (1 - bh * 0.6)})`); rg.addColorStop(1, `rgba(${rgb},0)`);
          ctx.fillStyle = rg; ctx.fillRect(0, 0, w, h);
        }
      }

      // stars: fixed in the night sky, then streaming toward us as we travel
      const cx = w / 2, cy = h * 0.5 + (1 - ascend) * h * 0.04, half = Math.max(w, h) * 0.5;
      const starAlpha = Math.max(night, space);
      if (starAlpha > 0.01) {
        for (const s of stars) {
          const z = ((s.z - travel * 2.6 - 0.12 + 30) % 3.3) + 0.12;
          const zp = ((s.z - Math.max(0, travel - 0.018) * 2.6 - 0.12 + 30) % 3.3) + 0.12;
          const sx = cx + (s.x * half) / z, sy = cy + (s.y * half) / z;
          if (sx < -40 || sx > w + 40 || sy < -40 || sy > h + 40) continue;
          // before the climb, stars live only in the sky above the horizon
          if (ascend < 0.98 && sy > h * (0.69 + 0.31 * ascend)) continue;
          const tw = 0.65 + 0.35 * Math.sin(t * 1.6 + s.ph);
          const near = Math.min(1, 1.1 / z);
          const a = starAlpha * tw * (0.35 + 0.65 * near);
          ctx.strokeStyle = `hsla(${s.hue < 0.5 ? 215 : 38}, 60%, ${88 - s.hue * 10}%, ${a})`;
          ctx.lineWidth = s.r * (0.6 + near);
          const px = cx + (s.x * half) / zp, py = cy + (s.y * half) / zp;
          ctx.beginPath();
          if (travel > 0.02 && Math.hypot(sx - px, sy - py) > 1.2) { ctx.moveTo(px, py); ctx.lineTo(sx, sy); } else { ctx.moveTo(sx, sy); ctx.lineTo(sx + 0.01, sy + 0.01); }
          ctx.stroke();
        }
      }

      // moon rises and then drifts away as the camera climbs
      if (night > 0.02 && ascend < 0.98) {
        const mx = w * 0.2, my = h * (0.44 - 0.28 * night) + ascend * h * 1.1, mr = Math.min(w, h) * 0.075;
        const halo = ctx.createRadialGradient(mx, my, mr * 0.6, mx, my, mr * 5);
        halo.addColorStop(0, `rgba(210,225,255,${0.35 * night})`); halo.addColorStop(1, "rgba(210,225,255,0)");
        ctx.fillStyle = halo; ctx.fillRect(mx - mr * 5, my - mr * 5, mr * 10, mr * 10);
        const mg = ctx.createRadialGradient(mx - mr * 0.3, my - mr * 0.3, mr * 0.1, mx, my, mr);
        mg.addColorStop(0, "#fffef4"); mg.addColorStop(0.7, "#e6e8ee"); mg.addColorStop(1, "#b9bfcc");
        ctx.globalAlpha = night; ctx.fillStyle = mg; ctx.beginPath(); ctx.arc(mx, my, mr, 0, 6.283); ctx.fill();
        ctx.fillStyle = "rgba(120,130,150,0.28)";
        for (const [dx, dy, dr] of [[-0.35, -0.2, 0.22], [0.3, 0.1, 0.17], [-0.05, 0.4, 0.14], [0.4, -0.35, 0.1], [-0.45, 0.25, 0.09]]) { ctx.beginPath(); ctx.arc(mx + dx * mr, my + dy * mr, dr * mr, 0, 6.283); ctx.fill(); }
        ctx.globalAlpha = 1;
      }

      // black hole: lensing halo, back of the disk, event horizon, photon ring, front of the disk
      if (bh > 0.005) {
        const R = (14 + bh * bh * Math.max(w, h) * 0.5);
        const bx = w / 2, by = h * 0.5;
        const lens = ctx.createRadialGradient(bx, by, R * 0.9, bx, by, R * 4.2);
        lens.addColorStop(0, `rgba(255,190,110,${0.35 * bh})`); lens.addColorStop(0.35, `rgba(255,120,60,${0.12 * bh})`); lens.addColorStop(1, "rgba(0,0,0,0)");
        ctx.fillStyle = lens; ctx.fillRect(0, 0, w, h);
        const disk = (front: boolean) => {
          ctx.save(); ctx.translate(bx, by); ctx.rotate(-0.22);
          for (let i = 0; i < 26; i++) {
            const k = i / 25, rx = R * (1.25 + k * 2.4), ry = rx * 0.17;
            const heat = 1 - k;
            ctx.strokeStyle = `rgba(255,${Math.round(150 + 105 * heat)},${Math.round(60 + 150 * heat * heat)},${(0.12 + 0.55 * heat) * bh})`;
            ctx.lineWidth = Math.max(1, R * 0.045 * (1 - k * 0.6));
            ctx.beginPath(); ctx.ellipse(0, 0, rx, ry, 0, front ? 0 : Math.PI, front ? Math.PI : 6.283); ctx.stroke();
          }
          ctx.restore();
        };
        disk(false);
        // light bent over the top and under the bottom of the hole
        ctx.save(); ctx.translate(bx, by);
        for (let i = 0; i < 10; i++) { const k = i / 9; ctx.strokeStyle = `rgba(255,${190 - 60 * k},${110 - 50 * k},${(0.5 - 0.35 * k) * bh})`; ctx.lineWidth = Math.max(1, R * 0.05 * (1 - k * 0.6)); ctx.beginPath(); ctx.arc(0, 0, R * (1.12 + k * 0.28), 0, 6.283); ctx.stroke(); }
        ctx.restore();
        ctx.fillStyle = "#000"; ctx.beginPath(); ctx.arc(bx, by, R, 0, 6.283); ctx.fill();
        ctx.strokeStyle = `rgba(255,244,220,${0.95 * bh})`; ctx.lineWidth = Math.max(1.5, R * 0.018); ctx.beginPath(); ctx.arc(bx, by, R * 1.005, 0, 6.283); ctx.stroke();
        disk(true);
        ctx.fillStyle = "#000"; ctx.beginPath(); ctx.arc(bx, by, R * 0.992, 0, Math.PI, false); ctx.fill();
      }
      raf = requestAnimationFrame(frame);
    };
    raf = requestAnimationFrame(frame);
    return () => { cancelAnimationFrame(raf); ro.disconnect(); io.disconnect(); };
  }, [pRef]);
  return <canvas ref={ref} aria-hidden className="absolute inset-0 h-full w-full" />;
}
