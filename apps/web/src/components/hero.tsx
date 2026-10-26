"use client";
import Link from "next/link";
import { useEffect, useRef, useState, useSyncExternalStore } from "react";
import { CosmosCanvas } from "@/components/cosmos-canvas";
import type { TypeCounts } from "@/components/build-story";

const TYPES = [
  { type: "PLOT", title: "Plots" }, { type: "APARTMENT", title: "Flats" }, { type: "VILLA", title: "Villas" },
  { type: "GATED_COMMUNITY", title: "Gated" }, { type: "COMMERCIAL", title: "Commercial" },
] as const;

const NARROW = "(max-width: 767px)";
const subscribeNarrow = (cb: () => void) => { const m = window.matchMedia(NARROW); m.addEventListener("change", cb); return () => m.removeEventListener("change", cb); };
/** On phones the whole villa has to fit across the width, so the scene is shown 'contain' over a matching sky and ground. */
const MOBILE_SKY = "linear-gradient(180deg,#cfc5d4 0%,#e3c7bb 20%,#efc19a 36%,#f3b070 46%,#f2a34a 53.5%,#1d100b 53.6%,#0d0604 62%,#060302 100%)";

const smooth = (x: number) => { const t = Math.min(1, Math.max(0, x)); return t * t * (3 - 2 * t); };

/** Warm-lit window with a hint of furniture inside, so the glass reads as rooms rather than flat boxes. */
function Room({ x, y, w, h, glow, seed }: { x: number; y: number; w: number; h: number; glow: number; seed: number }) {
  return (
    <g>
      <rect x={x} y={y} width={w} height={h} fill="url(#glass)" opacity={0.55 + 0.45 * glow} />
      <rect x={x} y={y} width={w} height={h * 0.16} fill="#fff1cf" opacity={0.35 * glow} />
      <g fill="#1b0f0b" opacity="0.8">
        {seed % 3 === 0 && <><rect x={x + w * 0.12} y={y + h * 0.62} width={w * 0.5} height={h * 0.38} rx="3" /><rect x={x + w * 0.12} y={y + h * 0.48} width={w * 0.12} height={h * 0.2} rx="3" /></>}
        {seed % 3 === 1 && <><rect x={x + w * 0.62} y={y + h * 0.1} width={2.5} height={h * 0.9} /><ellipse cx={x + w * 0.62 + 1} cy={y + h * 0.12} rx={w * 0.09} ry={h * 0.07} /><rect x={x + w * 0.1} y={y + h * 0.7} width={w * 0.38} height={h * 0.3} rx="2" /></>}
        {seed % 3 === 2 && <><rect x={x + w * 0.2} y={y + h * 0.58} width={w * 0.6} height={h * 0.07} /><rect x={x + w * 0.24} y={y + h * 0.65} width={3} height={h * 0.35} /><rect x={x + w * 0.74} y={y + h * 0.65} width={3} height={h * 0.35} /></>}
      </g>
      <rect x={x} y={y} width={w} height={h} fill="none" stroke="#120806" strokeWidth="4" />
    </g>
  );
}

function Palm({ x, h, lean, s = 1 }: { x: number; h: number; lean: number; s?: number }) {
  const t = { x: x + lean, y: 700 - h };
  const fr = Array.from({ length: 10 }, (_, i) => {
    const a = (i / 10) * Math.PI * 2, L = (84 + (i % 3) * 18) * s;
    return `M${t.x} ${t.y} Q${t.x + Math.cos(a) * L * 0.6} ${t.y + Math.sin(a) * L * 0.3 - 30 * s} ${t.x + Math.cos(a) * L} ${t.y + Math.sin(a) * L * 0.5 + 22 * s}`;
  });
  return (
    <g>
      <path d={`M${x - 7 * s} 700 Q${x + lean * 0.3} ${700 - h / 2} ${t.x - 3.5 * s} ${t.y} L${t.x + 3.5 * s} ${t.y} Q${x + lean * 0.3 + 7 * s} ${700 - h / 2} ${x + 7 * s} 700Z`} fill="#150a07" />
      {fr.map((d, i) => <path key={i} d={d} stroke="#150a07" strokeWidth={6 * s} fill="none" strokeLinecap="round" />)}
    </g>
  );
}

/**
 * Opening scene, after the Terminal hero: a clean golden-hour sky, one long modern villa in side-on silhouette with warm
 * rim light from a low sun, and a dark foreground. Scrolling slides the villa across, sinks the sun and fades to black.
 */
export function Hero({ counts }: { counts: TypeCounts }) {
  const outer = useRef<HTMLElement>(null);
  const [p, setP] = useState(0);
  const pRef = useRef(0);
  const narrow = useSyncExternalStore(subscribeNarrow, () => window.matchMedia(NARROW).matches, () => false);
  useEffect(() => {
    let raf = 0;
    const read = () => {
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(() => {
        const el = outer.current; if (!el) return;
        const r = el.getBoundingClientRect(), sc = r.height - window.innerHeight;
        const v = sc > 0 ? Math.min(1, Math.max(0, -r.top / sc)) : 0;
        pRef.current = v;
        setP(v);
      });
    };
    read();
    window.addEventListener("scroll", read, { passive: true });
    window.addEventListener("resize", read);
    return () => { cancelAnimationFrame(raf); window.removeEventListener("scroll", read); window.removeEventListener("resize", read); };
  }, []);

  const drop = smooth(p / 0.3);                       // sun sets
  const night = smooth((p - 0.12) / 0.28);            // sky turns dark, stars take over
  const ascend = smooth((p - 0.46) / 0.24);           // the ground falls away
  const fall = smooth((p - 0.9) / 0.1);               // into the black hole
  const glow = 0.35 + 0.65 * Math.max(drop, night);
  const cap = (a: number, b: number) => smooth((p - a) / 0.04) * (1 - smooth((p - b) / 0.04));

  return (
    <section ref={outer} aria-label="A villa at sunset" className="relative h-[520vh] bg-black">
      <div className="sticky top-0 h-screen overflow-hidden bg-[#0d0604]">
        <CosmosCanvas pRef={pRef} />
        <div className="absolute inset-0" style={{ transform: `translate3d(0, ${ascend * 105}vh, 0) scale(${1 + ascend * 0.25})`, transformOrigin: "50% 100%", opacity: 1 - smooth((p - 0.5) / 0.16), visibility: p > 0.68 ? "hidden" : "visible" }}>
        {narrow && <div aria-hidden className="absolute inset-0" style={{ background: MOBILE_SKY, opacity: 1 - night }} />}
        <svg aria-hidden viewBox="0 0 1920 1080" preserveAspectRatio={narrow ? "xMidYMid meet" : "xMidYMid slice"} className="absolute inset-0 h-full w-full">
          <defs>
            <linearGradient id="sky" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0" stopColor="#cfc5d4" /><stop offset="0.22" stopColor="#e3c7bb" /><stop offset="0.42" stopColor="#efc19a" />
              <stop offset="0.58" stopColor="#f3b070" /><stop offset="0.66" stopColor="#f2a34a" />
            </linearGradient>
            <radialGradient id="sun" cx="0.5" cy="0.5" r="0.5">
              <stop offset="0" stopColor="#fff6d6" stopOpacity="1" /><stop offset="0.16" stopColor="#ffd990" stopOpacity="0.85" />
              <stop offset="0.45" stopColor="#ffb25a" stopOpacity="0.28" /><stop offset="1" stopColor="#ff9a40" stopOpacity="0" />
            </radialGradient>
            <linearGradient id="glass" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#ffe8b3" /><stop offset="0.55" stopColor="#f6b25e" /><stop offset="1" stopColor="#c8742c" /></linearGradient>
            <linearGradient id="body" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stopColor="#170c09" /><stop offset="0.6" stopColor="#2a1913" /><stop offset="1" stopColor="#5a3b2d" /></linearGradient>
            <linearGradient id="rim" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stopColor="#ffbf7a" stopOpacity="0" /><stop offset="1" stopColor="#ffe2ad" stopOpacity="0.95" /></linearGradient>
            <linearGradient id="ground" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#1d100b" /><stop offset="0.25" stopColor="#0f0705" /><stop offset="1" stopColor="#060302" /></linearGradient>
            <linearGradient id="water" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#f6b970" stopOpacity="0.9" /><stop offset="1" stopColor="#6b3d24" stopOpacity="0.5" /></linearGradient>
            <filter id="soft" x="-20%" y="-200%" width="140%" height="500%"><feGaussianBlur stdDeviation="26" /></filter>
            <filter id="grain" x="0" y="0" width="100%" height="100%"><feTurbulence type="fractalNoise" baseFrequency="0.9" numOctaves="2" stitchTiles="stitch" /><feColorMatrix values="0 0 0 0 1  0 0 0 0 0.9  0 0 0 0 0.8  0 0 0 0.09 0" /></filter>
            <pattern id="slats" width="9" height="10" patternUnits="userSpaceOnUse"><rect width="4" height="10" fill="#0d0604" opacity="0.75" /></pattern>
          </defs>

          <rect width="1920" height="700" fill="url(#sky)" opacity={1 - night} />
          <g style={{ transform: `translateY(${drop * 330}px)` }} opacity={1 - night * 0.6}>
            <circle cx="1690" cy="640" r="520" fill="url(#sun)" opacity="0.9" />
            <circle cx="1690" cy="660" r="62" fill="#fff4cf" />
          </g>

          {/* faint distant palms behind the house on the right */}
          <g opacity="0.55" style={{ transform: `translateX(${-p * 40}px)` }}>
            <Palm x={1475} h={250} lean={-22} s={0.9} /><Palm x={1590} h={215} lean={20} s={0.8} />
          </g>

          <g style={{ transform: `translateX(${90 - p * 260}px) scale(${1 + p * 0.06})`, transformOrigin: "700px 700px" }}>
            {/* slab edges catch the sun */}
            <g fill="url(#body)">
              <rect x="120" y="396" width="150" height="304" />
              <rect x="106" y="380" width="178" height="16" />
              <rect x="300" y="410" width="860" height="130" />
              <rect x="280" y="394" width="900" height="16" />
              <rect x="180" y="552" width="1060" height="148" />
              <rect x="164" y="536" width="1092" height="16" />
              <rect x="1240" y="590" width="130" height="110" />
              <rect x="1226" y="578" width="158" height="12" />
              <rect x="1000" y="420" width="70" height="120" opacity="0" />
            </g>
            {/* stone feature wall */}
            <rect x="1160" y="552" width="80" height="148" fill="#2d1c15" />
            {Array.from({ length: 9 }, (_, i) => <rect key={i} x={1162} y={556 + i * 16} width={76} height={1.5} fill="#ffb878" opacity="0.18" />)}

            {/* glazing */}
            {[0, 1, 2, 3, 4, 5, 6].map((i) => <Room key={`g${i}`} x={206 + i * 144} y={572} w={128} h={118} glow={glow} seed={i} />)}
            <Room x={1262} y={606} w={86} h={84} glow={glow * 0.8} seed={4} />
            <Room x={140} y={420} w={30} h={260} glow={glow} seed={1} />
            {[0, 1, 2, 3, 4].map((i) => <Room key={`u${i}`} x={326 + i * 166} y={436} w={150} h={92} glow={glow} seed={i + 1} />)}
            <rect x="326" y="436" width="810" height="92" fill="url(#slats)" />

            {/* sun on the right-hand edges */}
            <g fill="url(#rim)">
              <rect x="280" y="394" width="900" height="3" /><rect x="164" y="536" width="1092" height="3" /><rect x="1226" y="578" width="158" height="3" /><rect x="106" y="380" width="178" height="3" />
              <rect x="1140" y="410" width="20" height="130" opacity="0.6" /><rect x="1220" y="552" width="20" height="148" opacity="0.55" /><rect x="1352" y="590" width="18" height="110" opacity="0.6" />
            </g>

            {/* pool terrace */}
            <rect x="150" y="700" width="1180" height="3" fill="#ffb878" opacity="0.5" />
            <rect x="230" y="708" width="860" height="26" fill="url(#water)" />
            <g fill="#150a07" opacity="0.9">{[300, 380, 470].map((x) => <path key={x} d={`M${x} 700 l30 -12 h26 l8 12Z`} />)}</g>
          </g>

          <rect x="-100" y="696" width="2120" height="500" fill="url(#ground)" />
          <rect x="-100" y="694" width="2120" height="3" fill="#ffc078" opacity="0.45" />
          {/* the low sun spilling across the ground, like the headlight in the reference */}
          <ellipse cx="1540" cy="748" rx="560" ry="40" fill="#ffb25a" filter="url(#soft)" opacity={0.3 + 0.25 * (1 - drop)} />
          <ellipse cx="1500" cy="730" rx="280" ry="14" fill="#ffe0a8" filter="url(#soft)" opacity="0.45" />
          <rect width="1920" height="1080" filter="url(#grain)" opacity="0.7" />
        </svg>
        </div>

        <div className="absolute inset-0 bg-black" style={{ opacity: fall }} />
        <div className="pointer-events-none absolute inset-0 grid place-items-center px-6 text-center">
          {[
            [0.26, 0.42, "Every light is a home.", "14%"],
            [0.58, 0.72, "Millions of them. One city."],
            [0.80, 0.9, "Let us begin at the ground."],
          ].map(([a2, b2, text, top]) => (
            <p key={text as string} className="absolute max-w-[18ch] text-[clamp(1.8rem,4vw,3.4rem)] font-normal leading-[1.05] tracking-[-0.045em] text-white" style={{ opacity: cap(a2 as number, b2 as number), ...(top ? { top: top as string } : {}), transform: `translateY(${(1 - cap(a2 as number, b2 as number)) * 24}px)` }}>{text}</p>
          ))}
        </div>

        <div className="absolute inset-x-0 bottom-0 z-10 px-5 pb-10 sm:px-8" style={{ opacity: 1 - smooth(p / 0.14), transform: `translateY(${p * 260}px)` }}>
          <div className="mx-auto w-full max-w-[1320px]">
            <p className="intro-rise mono-label flex items-center gap-3 text-white/70" style={{ animationDelay: "0ms" }}>
              <span className="h-px w-10 bg-[#b6f400]" />Hyderabad · Plots · Villas · Flats · Commercial
            </p>
            <h1 className="intro-rise mt-4 max-w-none text-[clamp(2.3rem,5.4vw,5rem)] font-normal leading-[1] tracking-[-0.055em] text-white" style={{ animationDelay: "140ms" }}>
              Build your place in <span className="tracking-[-0.04em] text-[#ffd9a3]">Hyderabad.</span>
            </h1>
            <ul className="intro-rise mt-6 flex flex-wrap gap-2.5" aria-label="What are you looking for?" style={{ animationDelay: "300ms" }}>
              {TYPES.map(({ type, title }) => (
                <li key={type}>
                  <Link href={`/listings?type=${type}`} className="mono-label group flex min-h-11 items-center gap-3 rounded-full border border-white/25 bg-white/[0.06] px-5 text-white backdrop-blur transition-colors hover:border-white hover:bg-white hover:text-black">
                    {title}<span className="text-white/55 transition-colors group-hover:text-black/60">{counts[type]}</span>
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </section>
  );
}
