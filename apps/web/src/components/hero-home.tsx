"use client";
import { useEffect, useState } from "react";
import { SearchPanel } from "@/components/search-panel";
import type { Agent } from "@/lib/api";

type Locality = { id: string; name: string; slug: string };

/** Full-bleed video hero with slow concentric rings, a two-weight headline and the search panel. */
export function HeroHome({ localities, agents }: { localities: Locality[]; agents: Agent[] }) {
  const [reduced, setReduced] = useState(false);
  useEffect(() => setReduced(window.matchMedia("(prefers-reduced-motion: reduce)").matches), []);

  return (
    <section className="relative isolate flex min-h-[100svh] flex-col overflow-hidden" aria-label="Welcome">
      <div className="absolute inset-0 -z-20">
        <div className="absolute inset-0 bg-cover bg-center" style={{ backgroundImage: "url(/videos/hero-poster.jpg)" }} />
        {!reduced && (
          <video className="absolute inset-0 h-full w-full object-cover" autoPlay muted loop playsInline preload="auto" poster="/videos/hero-poster.jpg">
            <source src="/videos/hero.mp4" type="video/mp4" />
          </video>
        )}
      </div>
      <div className="absolute inset-0 -z-10 bg-[linear-gradient(180deg,rgb(7_12_38/0.55)_0%,rgb(7_12_38/0.35)_40%,rgb(7_12_38/0.92)_100%)]" />

      {/* Concentric hairline rings, turning slowly in opposite directions. */}
      <div aria-hidden className="pointer-events-none absolute left-1/2 top-[44%] -z-10 hidden h-[110vmin] w-[110vmin] -translate-x-1/2 -translate-y-1/2 md:block">
        <div className="absolute inset-0 animate-[ring-spin_120s_linear_infinite] rounded-full border border-white/10" />
        <div className="absolute inset-[9%] animate-[ring-spin-rev_90s_linear_infinite] rounded-full border border-dashed border-white/10" />
        <div className="absolute inset-[22%] rounded-full border border-white/10" />
      </div>

      <div className="mx-auto flex w-full max-w-[1600px] flex-1 flex-col items-center justify-center px-6 pt-32 text-center lg:px-[60px]">
        <h1 className="animate-[fade-up_900ms_ease-out_both] text-[clamp(2.25rem,5.4vw,4.4rem)] font-light leading-[1.1] tracking-[-0.02em] text-white">
          Your Private Horizon <b className="font-bold">Address</b>
        </h1>
        <p className="mt-4 animate-[fade-up_900ms_150ms_ease-out_both] text-[clamp(1.2rem,2.6vw,1.9rem)] font-light text-white/85">
          Exclusive plots, villas and gated communities in Hyderabad.
        </p>
        <p className="mt-3 max-w-2xl animate-[fade-up_900ms_300ms_ease-out_both] text-[15px] text-white/60">
          Every listing is RERA-registered. Our team and an AI assistant that reads the sale deed take you from the first
          shortlist to your final registration.
        </p>
        <span aria-hidden className="mt-10 flex h-14 w-14 animate-[fade-up_900ms_450ms_ease-out_both] items-center justify-center rounded-full border border-white/30">
          <svg viewBox="0 0 32 32" className="h-7 w-7" fill="none" stroke="currentColor" strokeWidth="1.2"><path d="M7 19.5 16 10l9 9.5M11 19.5V25h10v-5.5" strokeLinecap="round" strokeLinejoin="round" /></svg>
        </span>
      </div>

      <div className="mx-auto w-full max-w-[1600px] px-4 pb-[20vh] lg:px-[60px] lg:pb-[22vh]">
        <SearchPanel localities={localities} agents={agents} />
      </div>
    </section>
  );
}
