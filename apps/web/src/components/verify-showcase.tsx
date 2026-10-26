"use client";
import { useEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";

const FEATURES = [
  { t: "Check the papers first", d: "Layout approval, land use, lake buffer, title chain, encumbrance and court records, shown on every listing before you call.", tag: "VERIFIED REPORT" },
  { t: "Search the way you think", d: "Filters change with the property type. Plots show approvals and road width, flats show floors and amenities, offices show carpet area.", tag: "SMART FILTERS" },
  { t: "Skip the legwork", d: "Compare homes side by side, save a shortlist and ask the assistant about any document in plain words.", tag: "ASSISTANT" },
  { t: "Close with confidence", d: "From token advance to agreement and registration, with the stamp duty and EMI worked out up front.", tag: "REGISTRATION" },
];

const CHECKS = [
  ["Layout approval", "HMDA", "PASS"], ["Land use zone", "MASTER PLAN", "PASS"], ["Lake and buffer zones", "FTL MAP", "PASS"], ["Chain of title, 30 years", "SALE DEEDS", "PASS"],
  ["Encumbrance certificate", "REGISTRATION", "WARN"], ["Land record match", "DHARANI", "PASS"], ["Litigation search", "COURT RECORDS", "PASS"],
] as const;

const FILTERS = {
  Plot: { count: 16, chips: ["HMDA approved", "DTCP approved", "Road 40 ft+", "Corner plot", "East facing", "Gated layout"] },
  Flat: { count: 16, chips: ["2 BHK+", "Floor 5 to 15", "Gym", "Clubhouse", "Ready to move", "2 parking"] },
  Office: { count: 16, chips: ["Carpet 1,500+ sq ft", "Parking 2+", "Lift", "Power backup", "Ready to move", "Floor 8+"] },
} as const;

const ANSWER = "Yes. The sale deeds trace ownership for 30 years without a break. One old charge on the encumbrance certificate has no closure record, so ask the seller for it before paying a token.";

const useTick = (on: boolean, ms: number, max: number) => {
  const [n, setN] = useState(0);
  useEffect(() => {
    if (!on) return;
    const id = window.setInterval(() => setN((v) => (v + 1) % max), ms);
    return () => window.clearInterval(id);
  }, [on, ms, max]);
  return n;
};

/** Counts from 0 to `to` over `ms` each time `on` turns true. */
function useCount(on: boolean, to: number, ms = 1100) {
  const [v, setV] = useState(0);
  useEffect(() => {
    if (!on) return;
    let raf = 0; const t0 = performance.now();
    const step = (now: number) => { const k = Math.min(1, (now - t0) / ms); setV(Math.round(to * (1 - Math.pow(1 - k, 3)))); if (k < 1) raf = requestAnimationFrame(step); };
    raf = requestAnimationFrame(step);
    return () => cancelAnimationFrame(raf);
  }, [on, to, ms]);
  return v;
}

/** Rows of small lit windows; some are dimmer so the facade does not look printed. */
function WindowField({ dim }: { dim: number }) {
  return (
    <svg className="absolute inset-0 h-full w-full" preserveAspectRatio="none">
      <defs>
        <pattern id="win-a" width="30" height="38" patternUnits="userSpaceOnUse"><rect x="11" y="13" width="8" height="12" rx="1.5" fill="#d9b67a" opacity={0.2 - dim * 0.05} /></pattern>
      </defs>
      <rect width="100%" height="100%" fill="url(#win-a)" />
    </svg>
  );
}

const stagger = (on: boolean, i: number) => ({ transitionDelay: on ? `${160 + i * 90}ms` : "0ms" });
const rise = (on: boolean) => cn("transition-all duration-700 ease-out", on ? "translate-y-0 opacity-100" : "translate-y-4 opacity-0");

function PapersScene({ on }: { on: boolean }) {
  const score = useCount(on, 92);
  return (
    <div className="flex h-full flex-col">
      <div className="flex items-start justify-between gap-4">
        <div><p className="mono-label text-white/50">Verified land report</p><p className="mt-2 text-[1.35rem] tracking-[-0.03em]">Plot 214 · Kokapet</p></div>
        <div className="text-right"><p className="text-[4rem] leading-none tracking-[-0.05em] tabular-nums">{score}</p><p className="mono-label mt-1 text-[#b6f400]">VERIFIED</p></div>
      </div>
      <ul className="mt-8 flex-1 divide-y divide-white/10 border-t border-white/10">
        {CHECKS.map(([label, src, res], i) => (
          <li key={label} className={cn("flex items-center gap-4 py-[0.95rem]", rise(on))} style={stagger(on, i)}>
            <span className={cn("grid h-6 w-6 shrink-0 place-items-center rounded-full text-[11px] font-bold text-black", res === "PASS" ? "bg-[#b6f400]" : "bg-[#ffb020]")}>{res === "PASS" ? "✓" : "!"}</span>
            <span className="flex-1 text-[1.05rem] leading-tight tracking-[-0.01em]">{label}</span>
            <span className="mono-label hidden text-[9px] text-white/40 sm:block">{src}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

function FiltersScene({ on }: { on: boolean }) {
  const keys = Object.keys(FILTERS) as (keyof typeof FILTERS)[];
  const k = useTick(on, 2600, keys.length);
  const type = keys[k];
  const f = FILTERS[type];
  return (
    <div className="flex h-full flex-col">
      <p className="mono-label text-white/50">Filters follow the property</p>
      <div className="mt-5 inline-flex w-fit rounded-xl border border-white/15 p-1">
        {keys.map((t) => (
          <span key={t} className={cn("mono-label rounded-lg px-5 py-3 transition-colors duration-500", t === type ? "bg-[#b6f400] text-black" : "text-white/55")}>{t}</span>
        ))}
      </div>
      <div key={type} className="mt-8 flex flex-wrap gap-2.5">
        {f.chips.map((c, i) => (
          <span key={c} className="rounded-full border border-white/20 bg-white/[0.06] px-4 py-2.5 text-[0.95rem] opacity-0 [animation:chip-in_600ms_cubic-bezier(0.2,0.7,0.2,1)_forwards]" style={{ animationDelay: `${i * 90}ms` }}>{c}</span>
        ))}
      </div>
      <div className="mt-auto rounded-2xl border border-white/10 bg-white/[0.05] p-6">
        <p className="mono-label text-white/50">Matching homes</p>
        <p className="mt-3 text-[3.4rem] leading-none tracking-[-0.05em] tabular-nums">{f.count}<span className="ml-3 text-[1.1rem] tracking-normal text-white/50">{type.toLowerCase()}s</span></p>
        <div className="mt-5 h-1.5 overflow-hidden rounded-full bg-white/10"><div key={type} className="h-full rounded-full bg-[#b6f400] [animation:bar-in_1.6s_ease-out_forwards]" /></div>
      </div>
    </div>
  );
}

function AssistantScene({ on }: { on: boolean }) {
  const [typed, setTyped] = useState(0);
  useEffect(() => {
    if (!on) return;
    const start = window.setTimeout(() => {
      setTyped(0);
      const id = window.setInterval(() => setTyped((v) => { if (v >= ANSWER.length) { window.clearInterval(id); return v; } return v + 2; }), 28);
    }, 1300);
    return () => window.clearTimeout(start);
  }, [on]);
  const done = typed >= ANSWER.length;
  return (
    <div className="flex h-full flex-col">
      <p className="mono-label text-white/50">Ask about any document</p>
      <div className="mt-6 space-y-4">
        <div className={cn("ml-auto max-w-[82%] rounded-2xl rounded-br-md bg-white px-5 py-3.5 text-[1rem] leading-snug text-black", rise(on))} style={stagger(on, 0)}>Is the title clear on Plot 214?</div>
        <div className={cn("max-w-[92%] rounded-2xl rounded-bl-md border border-white/12 bg-white/[0.07] px-5 py-4 text-[0.98rem] leading-relaxed", rise(on))} style={stagger(on, 5)}>
          {typed === 0 ? <span className="inline-flex gap-1.5 py-2">{[0, 1, 2].map((i) => <i key={i} className="h-2 w-2 animate-bounce rounded-full bg-white/60" style={{ animationDelay: `${i * 140}ms` }} />)}</span> : ANSWER.slice(0, typed)}
          {done && <span className="mono-label mt-3 block text-[#b6f400]">Sale deed · page 4 · Encumbrance cert. · page 1</span>}
        </div>
      </div>
      <div className="mt-auto grid grid-cols-2 gap-3">
        {[["Plot 214", "₹1.4 Cr", "92", true], ["Plot 87", "₹1.1 Cr", "84", false]].map(([n, p, s, best], i) => (
          <div key={n as string} className={cn("rounded-2xl border p-4", best ? "border-[#b6f400]/60 bg-[#b6f400]/[0.08]" : "border-white/12 bg-white/[0.04]", rise(on))} style={stagger(on, 7 + i)}>
            <p className="mono-label text-white/50">Compare</p>
            <p className="mt-2 text-[1.15rem]">{n}</p>
            <p className="mt-1 text-white/65">{p}</p>
            <p className="mono-label mt-3 text-[#b6f400]">Score {s}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

function CloseScene({ on }: { on: boolean }) {
  const duty = useCount(on, 51, 1300), emi = useCount(on, 59443, 1500);
  const steps = ["Token advance", "Agreement of sale", "Registration"];
  return (
    <div className="flex h-full flex-col">
      <p className="mono-label text-white/50">From token to keys</p>
      <ol className="relative mt-8 space-y-7 pl-10">
        <span aria-hidden className="absolute bottom-2 left-[13px] top-2 w-px bg-white/15" />
        <span aria-hidden className="absolute left-[13px] top-2 w-px bg-[#b6f400] transition-[height] duration-[1800ms] ease-out" style={{ height: on ? "calc(100% - 1rem)" : "0%" }} />
        {steps.map((s, i) => (
          <li key={s} className={cn("relative", rise(on))} style={stagger(on, i * 2)}>
            <span className="absolute -left-10 top-0.5 grid h-7 w-7 place-items-center rounded-full border border-[#b6f400] bg-black text-[11px] font-semibold text-[#b6f400]">{i + 1}</span>
            <p className="text-[1.2rem] tracking-[-0.02em]">{s}</p>
            <p className="mt-1 text-[0.95rem] text-white/50">{["Hold the home with a small advance.", "Terms, payment schedule and possession date.", "Stamp duty paid and the sale deed registered."][i]}</p>
          </li>
        ))}
      </ol>
      <div className="mt-auto grid grid-cols-2 gap-3">
        <div className={cn("rounded-2xl border border-white/12 bg-white/[0.05] p-5", rise(on))} style={stagger(on, 6)}>
          <p className="mono-label text-white/50">Stamp duty</p>
          <p className="mt-3 text-[2.2rem] leading-none tracking-[-0.04em] tabular-nums">₹{(duty / 10).toFixed(1)} L</p>
        </div>
        <div className={cn("rounded-2xl border border-[#b6f400]/50 bg-[#b6f400]/[0.08] p-5", rise(on))} style={stagger(on, 7)}>
          <p className="mono-label text-white/50">Monthly EMI</p>
          <p className="mt-3 text-[2.2rem] leading-none tracking-[-0.04em] tabular-nums">₹{emi.toLocaleString("en-IN")}</p>
        </div>
      </div>
    </div>
  );
}

/** Left: four points on a progress rail. Right: one pinned plate whose scene follows the active point. */
export function VerifyShowcase() {
  const [active, setActive] = useState(0);
  const [p, setP] = useState(0);
  const secRef = useRef<HTMLElement>(null);
  const refs = useRef<(HTMLLIElement | null)[]>([]);
  useEffect(() => {
    let raf = 0;
    const read = () => {
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(() => {
        const el = secRef.current; if (!el) return;
        const r = el.getBoundingClientRect();
        setP(Math.min(1, Math.max(0, (window.innerHeight * 0.7 - r.top) / (r.height - window.innerHeight * 0.1))));
      });
    };
    read();
    window.addEventListener("scroll", read, { passive: true });
    window.addEventListener("resize", read);
    return () => { cancelAnimationFrame(raf); window.removeEventListener("scroll", read); window.removeEventListener("resize", read); };
  }, []);
  useEffect(() => {
    const io = new IntersectionObserver((es) => es.forEach((e) => e.isIntersecting && setActive(Number(e.target.getAttribute("data-i")))), { rootMargin: "-35% 0px -45% 0px" });
    refs.current.forEach((el) => el && io.observe(el));
    return () => io.disconnect();
  }, []);
  const Scenes = [PapersScene, FiltersScene, AssistantScene, CloseScene];
  const lit = Math.round(Math.min(1, p * 1.08) * 100);          // % of the facade that is lit
  const crown = Math.min(1, Math.max(0, (p - 0.78) / 0.2));       // the crown ignites in the last stretch

  return (
    <section ref={secRef} className="bg-paper px-5 pb-0 text-paper-ink sm:px-8" aria-label="Verified listings">
      <div className="mx-auto grid max-w-[1320px] gap-12 lg:grid-cols-[1fr_1.05fr]">
        <ol className="relative py-6 pl-8 sm:pl-10 lg:py-[10vh]">
          <span aria-hidden className="absolute bottom-6 left-[7px] top-6 w-px bg-paper-ink/15 lg:bottom-[10vh] lg:top-[10vh]" />
          <span aria-hidden className="absolute left-[7px] w-px bg-paper-ink transition-[height] duration-700 ease-out [--rail-pad:3rem] [--rail-top:1.5rem] lg:[--rail-pad:20vh] lg:[--rail-top:10vh]" style={{ height: `calc((100% - var(--rail-pad)) * ${(active + 0.5) / FEATURES.length})`, top: "var(--rail-top)" }} />
          {FEATURES.map((f, i) => (
            <li key={f.t} data-i={i} ref={(el) => { refs.current[i] = el; }} className={cn("relative max-w-md py-8 transition-all duration-700 lg:min-h-[62vh] lg:py-0", active === i ? "translate-x-0 opacity-100" : "-translate-x-1 opacity-30")}>
              <span aria-hidden className={cn("absolute -left-8 top-1 h-[15px] w-[15px] rounded-full border transition-colors duration-500 sm:-left-10", i <= active ? "border-paper-ink bg-paper-ink" : "border-paper-ink/30 bg-paper")} />
              <span className="mono-label text-paper-ink/50">{String(i + 1).padStart(2, "0")} · {f.tag}</span>
              <h3 className="mt-5 text-[clamp(1.8rem,2.6vw,2.6rem)] font-normal leading-[1.05] tracking-[-0.04em] text-paper-ink">{f.t}</h3>
              <p className="mt-5 text-[1.3rem] leading-[1.3] tracking-[-0.02em] text-paper-ink/65">{f.d}</p>
            </li>
          ))}
        </ol>

        {/* The tower is the animation: floors light up from the ground as you scroll, a beam climbs the facade,
            the crown ignites at the end, and the plate inside it changes with each point. */}
        <div className="flex flex-col items-center" role="group" aria-label="A tower that lights up as you read">
          <div className="relative h-[460px] w-full max-w-[540px] bg-black sm:h-[640px] [clip-path:polygon(49.7%_0,50.3%_0,50.3%_12%,52.5%_12%,52.5%_20%,56%_24%,56%_26%,59%_26%,59%_36%,62%_36%,62%_38%,66%_38%,66%_50%,73%_50%,73%_64%,81%_64%,81%_78%,92%_78%,92%_100%,8%_100%,8%_78%,19%_78%,19%_64%,27%_64%,27%_50%,34%_50%,34%_38%,38%_38%,38%_36%,41%_36%,41%_26%,44%_26%,44%_24%,47.5%_20%,47.5%_12%,49.7%_12%)]">
            <div aria-hidden className="absolute inset-0 opacity-0 transition-opacity duration-300" style={{ opacity: crown }}>
              <WindowField dim={0.0} />
              <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_50%_8%,rgb(182_244_0/0.14),transparent_62%)]" />
            </div>
            <div aria-hidden className="absolute inset-0 [background-image:repeating-linear-gradient(to_bottom,transparent_0,transparent_15px,rgb(255_255_255/0.06)_15px,rgb(255_255_255/0.06)_16px)]" />
            {[26, 38, 50, 64, 78].map((y) => <div key={y} aria-hidden className="absolute inset-x-[8%] h-px bg-gradient-to-r from-transparent via-[#b6f400] to-transparent transition-opacity duration-500" style={{ top: `${y}%`, opacity: crown > 0.2 ? 0.25 + 0.7 * crown : 0.12 }} />)}
            <div aria-hidden className="absolute left-1/2 top-0 h-[14%] w-px -translate-x-1/2 bg-gradient-to-b from-[#b6f400] to-white/30" />
            <div aria-hidden className="absolute left-1/2 top-[1%] h-2.5 w-2.5 -translate-x-1/2 rounded-full bg-[#b6f400] transition-shadow duration-500" style={{ boxShadow: `0 0 ${10 + 26 * crown}px ${3 + 8 * crown}px rgb(182 244 0 / ${0.5 + 0.45 * crown})` }} />
          </div>

          <div className="relative -mt-px min-h-[44rem] w-[84%] max-w-[454px] flex-1 bg-black text-white">
            {/* lit floors: a field of windows revealed from the base up to the current scroll height */}
            <div aria-hidden className="absolute inset-0" style={{ WebkitMaskImage: `linear-gradient(to top, #000 0%, #000 calc(${lit}% - 6%), transparent ${lit}%)`, maskImage: `linear-gradient(to top, #000 0%, #000 calc(${lit}% - 6%), transparent ${lit}%)` }}>
              <WindowField dim={0.4} />
            </div>
            <div aria-hidden className="absolute inset-0 bg-[linear-gradient(90deg,rgb(255_255_255/0.08)_0%,transparent_12%,transparent_88%,rgb(255_255_255/0.05)_100%)]" />
            <div aria-hidden className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-[#b6f400]/60 to-transparent" />

            <div className="sticky top-24 p-4 sm:p-5">
              <div className="relative h-[min(640px,calc(100vh-8rem))] min-h-[560px] overflow-hidden rounded-2xl border border-white/10 bg-black/85 p-6 backdrop-blur-sm">
                {Scenes.map((Scene, i) => (
                  <div key={i} aria-hidden={active !== i} className={cn("absolute inset-0 p-6 transition-all duration-700 ease-out", active === i ? "translate-y-0 opacity-100" : i < active ? "-translate-y-6 opacity-0" : "translate-y-6 opacity-0")} style={{ pointerEvents: active === i ? "auto" : "none" }}>
                    <Scene on={active === i} />
                  </div>
                ))}
                <div className="absolute bottom-4 left-1/2 flex -translate-x-1/2 gap-2" aria-hidden>
                  {FEATURES.map((_, i) => <span key={i} className={cn("h-1 rounded-full transition-all duration-500", i === active ? "w-8 bg-[#b6f400]" : "w-2 bg-white/25")} />)}
                </div>
              </div>
            </div>
          </div>

          <div className="relative h-11 w-full max-w-[540px] bg-black">
            <div aria-hidden className="absolute inset-x-0 top-0 h-px bg-[#b6f400]/50" />
            <div aria-hidden className="absolute inset-0 bg-[linear-gradient(90deg,rgb(255_255_255/0.08),transparent_20%,transparent_80%,rgb(255_255_255/0.08))]" />
          </div>
        </div>
      </div>
    </section>
  );
}
