import Link from "next/link";
import { Curtain } from "@/components/curtain";

const letters = "DECCAN".split("");

/** Revealed from beneath the page as you reach the end (the content above scrolls away over it). */
export function SiteFooter() {
  return (
    <footer className="fixed inset-x-0 bottom-0 z-0 flex h-screen flex-col overflow-hidden bg-white text-ink">
      <div className="relative z-10 px-6 pt-[18vh]">
        <p aria-label="Deccan" className="flex justify-between text-[clamp(4.5rem,17vw,17rem)] font-light uppercase leading-[0.9]">
          {letters.map((l, i) => <span aria-hidden key={i}>{l}</span>)}
        </p>
        <p aria-hidden className="mt-[3vh] flex justify-between pr-[38%] text-[clamp(0.9rem,2.2vw,2rem)] font-normal uppercase">
          {"ESTATES".split("").map((l, i) => <span key={i}>{l}</span>)}
        </p>
      </div>

      <div className="relative -mt-[6vh] flex-1">
        <Curtain className="absolute inset-0 h-full w-full" />
      </div>

      <div className="relative z-10 mx-auto grid w-full max-w-[1800px] gap-6 px-6 pb-4 text-[14px] md:grid-cols-[1fr_1fr_auto_auto] md:items-end">
        <p className="max-w-[16rem] leading-snug">Full responsibility from first shortlist to registration.</p>
        <p className="leading-snug">India, Hyderabad,<br />Road No. 36, Banjara Hills</p>
        <div className="flex gap-6">
          <Link href="/listings" className="hover:opacity-60">Search</Link>
          <Link href="/agents" className="hover:opacity-60">Agents</Link>
          <Link href="/sell" className="hover:opacity-60">Sell</Link>
        </div>
        <div className="flex items-center gap-8 md:justify-end">
          <a href="tel:+919848001000" className="hover:opacity-60">+91 98480 01000</a>
          <a href="#top" className="flex items-center gap-2 hover:opacity-60">Back to top <span aria-hidden>↑</span></a>
        </div>
      </div>
      <div className="relative z-10 mx-auto flex w-full max-w-[1800px] justify-between border-t border-dashed border-line px-6 py-4 text-[11px] text-muted">
        <span>© 2026</span>
        <span>17.3850° N · 78.4867° E</span>
        <span>Demo project, sample data</span>
      </div>
    </footer>
  );
}
