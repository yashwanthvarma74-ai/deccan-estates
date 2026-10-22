"use client";
import Link from "next/link";
import { useEffect, useState } from "react";
import { Building2, ChevronDown, House, LandPlot, MapPin, Phone, Search, Trees } from "lucide-react";
import { useRouter } from "next/navigation";

type Locality = { id: string; name: string; slug: string };
export type TypeCounts = Record<"PLOT" | "APARTMENT" | "VILLA" | "GATED_COMMUNITY", number>;

const choices = [
  { type: "PLOT", title: "Plots", Icon: LandPlot },
  { type: "APARTMENT", title: "Flats", Icon: Building2 },
  { type: "VILLA", title: "Villas", Icon: House },
  { type: "GATED_COMMUNITY", title: "Gated communities", Icon: Trees },
] as const;

/**
 * Full-bleed footage, a centred two-weight headline and one white search panel. The panel is the whole
 * flow: tap what you want (opens the matching homes at once) or pick an area. No menus to hunt through.
 */
export function HeroHome({ localities, counts }: { localities: Locality[]; counts: TypeCounts }) {
  const router = useRouter();
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
      <div className="absolute inset-0 -z-10 bg-[linear-gradient(180deg,rgb(7_12_38/0.55)_0%,rgb(7_12_38/0.35)_40%,rgb(7_12_38/0.92)_100%)]" />

      {/* Slowly turning hairline rings behind the headline. */}
      <div aria-hidden className="pointer-events-none absolute left-1/2 top-[42%] -z-10 hidden h-[110vmin] w-[110vmin] -translate-x-1/2 -translate-y-1/2 md:block">
        <div className="absolute inset-0 animate-[ring-spin_120s_linear_infinite] rounded-full border border-white/10" />
        <div className="absolute inset-[9%] animate-[ring-spin-rev_90s_linear_infinite] rounded-full border border-dashed border-white/10" />
        <div className="absolute inset-[22%] rounded-full border border-white/10" />
      </div>

      <div className="mx-auto flex w-full max-w-[1600px] flex-1 flex-col items-center justify-center px-5 pt-28 text-center sm:px-8 lg:px-[60px]">
        <h1 className="animate-[fade-up_900ms_ease-out_both] text-[clamp(2.3rem,5.4vw,4.4rem)] font-light leading-[1.1] tracking-[-0.02em] text-white">
          Your Private Horizon <b>Address</b>
        </h1>
        <p className="mt-4 animate-[fade-up_900ms_150ms_ease-out_both] text-[clamp(1.2rem,2.6vw,1.9rem)] font-light text-white/90">
          Find your plot, flat or villa in Hyderabad.
        </p>
        <p className="mt-3 max-w-2xl animate-[fade-up_900ms_300ms_ease-out_both] text-base text-white/65">
          Every listing is RERA-registered. Tap what you are looking for and we show you every verified option.
        </p>
        <span aria-hidden className="mt-9 flex h-14 w-14 animate-[fade-up_900ms_450ms_ease-out_both] items-center justify-center rounded-full border border-white/30">
          <svg viewBox="0 0 32 32" className="h-7 w-7" fill="none" stroke="currentColor" strokeWidth="1.2"><path d="M7 19.5 16 10l9 9.5M11 19.5V25h10v-5.5" strokeLinecap="round" strokeLinejoin="round" /></svg>
        </span>
      </div>

      <div className="mx-auto w-full max-w-[1600px] animate-[fade-up_900ms_500ms_ease-out_both] px-4 pb-8 lg:px-[60px]">
        <div className="rounded-2xl bg-white p-3 text-bg shadow-[0_20px_60px_rgb(0_0_0/0.35)]">
          <p className="px-2 pb-2 pt-1 text-sm"><span className="font-medium">Find now</span> <span className="text-bg/70">your property</span></p>
          <ul className="grid grid-cols-2 gap-1 lg:flex lg:items-stretch" aria-label="What are you looking for?">
            {choices.map(({ type, title, Icon }) => (
              <li key={type} className="lg:flex-1">
                <Link
                  href={`/listings?type=${type}`}
                  className="group flex h-full min-w-0 items-center gap-3 rounded-xl px-4 py-3 text-left transition-colors hover:bg-bg hover:text-white focus-visible:bg-bg focus-visible:text-white"
                >
                  <Icon className="h-7 w-7 shrink-0 opacity-80" strokeWidth={1.3} />
                  <span className="min-w-0">
                    <span className="block text-xs opacity-60">{counts[type]} homes</span>
                    <span className="block truncate text-[17px] font-semibold">{title}</span>
                  </span>
                </Link>
              </li>
            ))}
            <li className="col-span-2 lg:col-span-1 lg:flex-1">
              <label
                onClick={(e) => {
                  const sel = e.currentTarget.querySelector("select");
                  if (sel && e.target !== sel) { e.preventDefault(); try { sel.showPicker(); } catch { sel.focus(); } }
                }}
                className="relative flex h-full cursor-pointer items-center gap-3 rounded-xl px-4 py-3 transition-colors hover:bg-black/5 lg:border-l lg:border-bg/10"
              >
                <MapPin className="h-7 w-7 shrink-0 opacity-80" strokeWidth={1.3} />
                <span className="min-w-0 flex-1">
                  <span className="block text-xs opacity-60">Or choose an area</span>
                  <span className="relative block">
                    <select
                      aria-label="Pick an area in Hyderabad"
                      defaultValue=""
                      onChange={(e) => e.target.value && router.push(`/listings?locality=${e.target.value}`)}
                      className="block w-full cursor-pointer appearance-none bg-transparent pr-6 text-[17px] font-semibold outline-none [&>option]:text-black"
                    >
                      <option value="" disabled>Select area</option>
                      {localities.map((l) => <option key={l.id} value={l.slug}>{l.name}</option>)}
                    </select>
                    <ChevronDown className="pointer-events-none absolute right-0 top-1/2 h-4 w-4 -translate-y-1/2 opacity-70" aria-hidden />
                  </span>
                </span>
              </label>
            </li>
            <li className="col-span-2 flex items-center justify-center px-1 lg:col-span-1">
              <Link href="/listings" aria-label="See all homes" className="flex h-14 w-14 items-center justify-center rounded-full bg-bg text-white transition-transform hover:scale-105 active:scale-95">
                <Search className="h-5 w-5" />
              </Link>
            </li>
          </ul>
        </div>
        <p className="mt-4 flex items-center justify-center gap-2 text-sm text-white/70">
          <Phone className="h-4 w-4" /> Need help choosing? Call <a href="tel:+919848001000" className="font-medium text-white underline underline-offset-4">+91 98480 01000</a>
        </p>
      </div>
    </section>
  );
}
