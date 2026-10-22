"use client";
import Link from "next/link";
import { useEffect, useState } from "react";
import { ArrowRight, Building2, House, LandPlot, Phone, Trees } from "lucide-react";
import { AreaPicker } from "@/components/area-picker";

type Locality = { id: string; name: string; slug: string };
export type TypeCounts = Record<"PLOT" | "APARTMENT" | "VILLA" | "GATED_COMMUNITY", number>;

const choices = [
  { type: "PLOT", title: "Plots", hint: "Land to build your own home", Icon: LandPlot },
  { type: "APARTMENT", title: "Flats", hint: "2, 3 and 4 BHK apartments", Icon: Building2 },
  { type: "VILLA", title: "Villas", hint: "Independent houses with a plot", Icon: House },
  { type: "GATED_COMMUNITY", title: "Gated communities", hint: "Villas inside secured layouts", Icon: Trees },
] as const;

/**
 * One question, one click: "What are you looking for?". Each answer opens the matching homes straight
 * away. Narrowing by area, budget or size happens on the next screen, where it can be undone easily.
 */
export function HeroHome({ localities, counts }: { localities: Locality[]; counts: TypeCounts }) {
  const [reduced, setReduced] = useState(false);
  useEffect(() => setReduced(window.matchMedia("(prefers-reduced-motion: reduce)").matches), []);

  return (
    <section className="relative isolate flex min-h-[100svh] flex-col overflow-hidden" aria-label="Find your property">
      <div className="absolute inset-0 -z-20">
        <div className="absolute inset-0 bg-cover bg-center" style={{ backgroundImage: "url(/videos/hero-poster.jpg)" }} />
        {!reduced && (
          <video className="absolute inset-0 h-full w-full object-cover" autoPlay muted loop playsInline preload="auto" poster="/videos/hero-poster.jpg">
            <source src="/videos/hero.mp4" type="video/mp4" />
          </video>
        )}
      </div>
      <div className="absolute inset-0 -z-10 bg-[linear-gradient(180deg,rgb(7_12_38/0.6)_0%,rgb(7_12_38/0.55)_45%,rgb(7_12_38/0.92)_100%)]" />

      <div className="mx-auto flex w-full max-w-[1200px] flex-1 flex-col justify-center px-5 pb-12 pt-28 sm:px-8">
        <h1 className="animate-[fade-up_700ms_ease-out_both] text-center text-[clamp(2.2rem,5.5vw,4rem)] font-semibold leading-[1.1] tracking-[-0.02em] text-white">
          Find your plot, flat or villa in Hyderabad
        </h1>
        <p className="mt-4 animate-[fade-up_700ms_100ms_ease-out_both] text-center text-[clamp(1.15rem,2.4vw,1.6rem)] text-white/90">
          What are you looking for? Tap one.
        </p>

        <ul className="mt-9 grid animate-[fade-up_700ms_200ms_ease-out_both] gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {choices.map(({ type, title, hint, Icon }) => (
            <li key={type}>
              <Link
                href={`/listings?type=${type}`}
                className="group flex h-full min-h-[11rem] flex-col rounded-2xl bg-white p-6 text-bg shadow-[0_12px_40px_rgb(0_0_0/0.35)] transition-transform duration-200 hover:-translate-y-1 active:scale-[0.98]"
              >
                <span className="flex h-14 w-14 items-center justify-center rounded-xl bg-bg text-white"><Icon className="h-8 w-8" strokeWidth={1.5} /></span>
                <span className="mt-4 text-2xl font-bold leading-tight">{title}</span>
                <span className="mt-1 text-base text-bg/70">{hint}</span>
                <span className="mt-auto flex items-center justify-between pt-4 text-base font-semibold">
                  {counts[type]} available
                  <span className="flex h-10 w-10 items-center justify-center rounded-full bg-bg text-white transition-transform group-hover:translate-x-1"><ArrowRight className="h-5 w-5" /></span>
                </span>
              </Link>
            </li>
          ))}
        </ul>

        <div className="mt-8 flex animate-[fade-up_700ms_300ms_ease-out_both] flex-col items-center justify-center gap-4 sm:flex-row">
          <AreaPicker localities={localities} />
          <a href="tel:+919848001000" className="inline-flex min-h-14 items-center gap-3 rounded-xl bg-white/15 px-5 text-lg font-semibold text-white backdrop-blur transition-colors hover:bg-white/25">
            <Phone className="h-6 w-6" /> Not sure? Call +91 98480 01000
          </a>
        </div>
      </div>
    </section>
  );
}
