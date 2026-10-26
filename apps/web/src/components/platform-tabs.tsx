"use client";
import Image from "next/image";
import Link from "next/link";
import { useRef, useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";

const ITEMS = [
  { tab: "Search", kicker: "FIND", title: "Search every plot, flat, villa and office on one map", text: "Type-aware filters, a live map and a shortlist you can compare side by side.", image: "/stills/s1.jpg", href: "/listings", cta: "Start searching" },
  { tab: "Verify", kicker: "CHECK", title: "See the papers before you pay a token", text: "Approvals, title, encumbrance and court checks are scored and shown on every listing.", image: "/stills/s4.jpg", href: "/listings?verified=1", cta: "Verified homes" },
  { tab: "Visit", kicker: "VISIT", title: "Book a visit with the listing agent", text: "Every agent shows a RERA ID and a direct line. Compare homes before you go.", image: "/stills/s3.jpg", href: "/compare", cta: "Compare homes" },
  { tab: "Sell", kicker: "SELL", title: "List your property in minutes", text: "Tell us about it and an agent contacts you. Verified listings get more calls.", image: "/stills/s6.jpg", href: "/sell", cta: "Sell with us" },
];

/** Centered intro, mono tab pills with prev/next, and a row of large rounded cards; the active one is dark with a photo. */
export function PlatformTabs() {
  const [i, setI] = useState(0);
  const track = useRef<HTMLDivElement>(null);
  const go = (n: number) => {
    const k = (n + ITEMS.length) % ITEMS.length;
    setI(k);
    const el = track.current?.children[k] as HTMLElement | undefined;
    if (el && track.current) track.current.scrollTo({ left: el.offsetLeft - track.current.offsetLeft - 8, behavior: "smooth" });
  };
  return (
    <section className="bg-paper px-0 pb-28 pt-10 text-paper-ink" aria-labelledby="plat-h">
      <div className="mx-auto max-w-[1320px] px-5 text-center sm:px-8">
        <p className="text-[1.15rem] text-paper-ink/40">Platform</p>
        <h2 id="plat-h" className="mx-auto mt-3 max-w-[22ch] text-[clamp(2rem,3.2vw,2.9rem)] font-normal leading-[1.1] tracking-[-0.03em] text-paper-ink">One modular platform, every way into a home</h2>
        <p className="mx-auto mt-6 max-w-[56ch] text-[1.05rem] leading-snug text-paper-ink/70">Start with the part you need most, then add the rest. Search, verification, visits and selling work together, so nothing is repeated and nothing is lost.</p>
        <div className="mt-12 flex items-center justify-between gap-4 text-left">
          <div className="flex flex-wrap gap-2.5" role="tablist" aria-label="Platform">
            {ITEMS.map((it, k) => (
              <button key={it.tab} role="tab" aria-selected={i === k} onClick={() => go(k)} className={cn("mono-label cursor-pointer rounded-lg border px-[18px] py-3 transition-colors", i === k ? "border-transparent bg-paper-ink/[0.06] text-paper-ink" : "border-paper-ink/20 text-paper-ink/45 hover:text-paper-ink")}>{it.tab}</button>
            ))}
          </div>
          <div className="flex gap-2">
            {[-1, 1].map((d) => (
              <button key={d} aria-label={d < 0 ? "Previous" : "Next"} onClick={() => go(i + d)} className={cn("flex h-11 w-11 cursor-pointer items-center justify-center rounded-lg transition-colors", d < 0 ? "bg-paper-ink/[0.12] text-paper-ink" : "border border-paper-ink/25 text-paper-ink hover:bg-paper-ink hover:text-white")}>
                {d < 0 ? <ChevronLeft className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
              </button>
            ))}
          </div>
        </div>
      </div>
      <div ref={track} className="mt-6 flex snap-x gap-4 overflow-x-auto px-5 pb-2 [scrollbar-width:none] sm:px-8 lg:pl-[max(2rem,calc((100vw-1320px)/2))] lg:pr-8 [&::-webkit-scrollbar]:hidden">
        {ITEMS.map((it, k) => (
          <article key={it.tab} onClick={() => setI(k)} className={cn("relative flex h-[34rem] w-[86%] shrink-0 snap-start flex-col justify-end overflow-hidden rounded-[22px] p-8 transition-colors duration-500 md:w-[62%] lg:w-[48%]", i === k ? "text-white" : "bg-[#b9bbbb] text-paper-ink")}>
            {i === k && <Image src={it.image} alt="" fill sizes="50vw" className="object-cover" />}
            {i === k && <div className="absolute inset-0 bg-[linear-gradient(180deg,rgb(0_0_0/0.35)_0%,rgb(0_0_0/0.15)_40%,rgb(0_0_0/0.8)_100%)]" />}
            <div className="relative">
              <p className="mono-label opacity-70">{it.kicker}</p>
              <h3 className="mt-4 max-w-[18ch] text-[clamp(1.8rem,3vw,2.8rem)] font-normal leading-[1.05] tracking-[-0.04em]">{it.title}</h3>
              <p className="mt-4 max-w-md text-[1.05rem] leading-snug opacity-80">{it.text}</p>
              <Link href={it.href} className={cn("mono-label mt-7 inline-flex h-12 items-center rounded-lg px-7 transition-transform hover:scale-[1.03]", i === k ? "bg-[#b6f400] text-black" : "bg-black/10 text-paper-ink")}>{it.cta}</Link>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}
