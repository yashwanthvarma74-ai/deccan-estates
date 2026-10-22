"use client";
import Link from "next/link";
import { useEffect, useState } from "react";
import { ArrowUpRight, Building2, House, LandPlot, Phone, Trees } from "lucide-react";
import { AreaPicker } from "@/components/area-picker";
import { cn } from "@/lib/utils";

type Locality = { id: string; name: string; slug: string };
export type TypeCounts = Record<"PLOT" | "APARTMENT" | "VILLA" | "GATED_COMMUNITY", number>;

const choices = [
  { type: "PLOT", title: "Plots", hint: "Land to build your own home", Icon: LandPlot },
  { type: "APARTMENT", title: "Flats", hint: "2, 3 and 4 BHK apartments", Icon: Building2 },
  { type: "VILLA", title: "Villas", hint: "Independent houses with a plot", Icon: House },
  { type: "GATED_COMMUNITY", title: "Gated communities", hint: "Villas inside secured layouts", Icon: Trees },
] as const;

/**
 * One question, one tap: "What are you looking for?". Each answer opens the matching homes straight away;
 * narrowing by area, budget or size happens on the next screen, where it is easy to undo.
 * Visually: cinematic footage, a light italic-serif accent, frosted-glass choices and no heavy boxes.
 */
export function HeroHome({ localities, counts }: { localities: Locality[]; counts: TypeCounts }) {
  const [reduced, setReduced] = useState(false);
  useEffect(() => setReduced(window.matchMedia("(prefers-reduced-motion: reduce)").matches), []);
  const total = Object.values(counts).reduce((a, b) => a + b, 0);

  return (
    <section className="relative isolate flex min-h-[100svh] flex-col overflow-hidden" aria-label="Find your property">
      <div className="absolute inset-0 -z-20">
        <div className="absolute inset-0 animate-[kenburns_30s_ease-in-out_infinite_alternate] bg-cover bg-center" style={{ backgroundImage: "url(/videos/hero-poster.jpg)" }} />
        {!reduced && (
          <video className="absolute inset-0 h-full w-full object-cover" autoPlay muted loop playsInline preload="auto" poster="/videos/hero-poster.jpg">
            <source src="/videos/hero.mp4" type="video/mp4" />
          </video>
        )}
      </div>
      {/* Light vignette so the footage stays vivid; deeper only where text sits. */}
      <div className="absolute inset-0 -z-10 bg-[radial-gradient(ellipse_at_50%_40%,rgb(7_12_38/0.15)_0%,rgb(7_12_38/0.55)_75%),linear-gradient(180deg,rgb(7_12_38/0.55)_0%,transparent_30%,transparent_55%,rgb(7_12_38/0.95)_100%)]" />

      <div className="mx-auto flex w-full max-w-[1280px] flex-1 flex-col justify-end px-5 pb-10 pt-32 sm:px-8 lg:pb-14">
        <p className="mb-5 animate-[fade-up_800ms_ease-out_both] text-sm font-medium tracking-[0.28em] text-white/75 uppercase">
          Hyderabad · Plots · Flats · Villas
        </p>
        <h1 className="max-w-[16ch] animate-[fade-up_900ms_100ms_ease-out_both] text-[clamp(2.9rem,7.2vw,6rem)] font-light leading-[1.02] tracking-[-0.035em] text-white [text-shadow:0_2px_40px_rgb(0_0_0/0.35)] sm:max-w-[18ch]">
          Find the place you will <b>call home.</b>
        </h1>
        <p className="mt-6 max-w-xl animate-[fade-up_900ms_200ms_ease-out_both] text-[clamp(1.1rem,1.7vw,1.3rem)] leading-relaxed text-white/85">
          Tell us what you are looking for. We will show you every verified option, nothing more.
        </p>

        <ul
          className="mt-10 grid animate-[fade-up_900ms_320ms_ease-out_both] grid-cols-2 overflow-hidden rounded-2xl border border-white/20 bg-white/[0.09] backdrop-blur-xl lg:grid-cols-4"
          aria-label="What are you looking for?"
        >
          {choices.map(({ type, title, hint, Icon }, i) => (
            <li key={type} className={cn("border-white/15", i % 2 === 1 && "border-l", i >= 2 && "border-t lg:border-t-0", i > 0 && "lg:border-l")}>
              <Link
                href={`/listings?type=${type}`}
                className="group flex h-full items-center gap-4 px-5 py-5 text-white transition-colors duration-300 hover:bg-white hover:text-bg focus-visible:bg-white focus-visible:text-bg sm:px-6 sm:py-6"
              >
                <Icon className="h-9 w-9 shrink-0 text-white/90 transition-colors group-hover:text-bg group-focus-visible:text-bg" strokeWidth={1.2} />
                <span className="min-w-0 flex-1">
                  <span className="block text-[1.3rem] font-medium leading-tight tracking-[-0.01em] sm:text-[1.45rem]">{title}</span>
                  <span className="mt-0.5 block truncate text-[0.95rem] text-white/65 transition-colors group-hover:text-bg/65">{counts[type]} homes</span>
                </span>
                <ArrowUpRight className="h-5 w-5 shrink-0 opacity-60 transition-all group-hover:translate-x-0.5 group-hover:-translate-y-0.5 group-hover:opacity-100" />
                <span className="sr-only">{hint}</span>
              </Link>
            </li>
          ))}
        </ul>

        <div className="mt-6 flex animate-[fade-up_900ms_440ms_ease-out_both] flex-col gap-3 border-t border-white/15 pt-5 sm:flex-row sm:items-center sm:justify-between">
          <AreaPicker localities={localities} />
          <p className="hidden text-[0.95rem] text-white/60 lg:block">RERA number on every listing · {total} verified homes across {localities.length} areas</p>
          <a href="tel:+919848001000" className="flex min-h-12 items-center gap-3 px-1 text-[17px] text-white/90 transition-colors hover:text-white">
            <Phone className="h-5 w-5 text-white/70" strokeWidth={1.5} /> Need help? <span className="font-medium">+91 98480 01000</span>
          </a>
        </div>
      </div>
    </section>
  );
}
