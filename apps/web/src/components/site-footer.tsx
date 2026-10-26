import Link from "next/link";
import { Suspense } from "react";
import { Logo } from "@/components/logo";
import { FooterCurve } from "@/components/footer-curve";

const cols: Record<string, [string, string][]> = {
  Homes: [["All homes", "/listings"], ["Plots", "/listings?type=PLOT"], ["Flats", "/listings?type=APARTMENT"], ["Villas", "/listings?type=VILLA"], ["Gated communities", "/listings?type=GATED_COMMUNITY"], ["Commercial", "/listings?type=COMMERCIAL"]],
  Company: [["Verified listings", "/listings?verified=1"], ["Sell your property", "/sell"], ["Our agents", "/agents"], ["Compare homes", "/compare"], ["Guides", "/stories"]],
};

/** Deep-green closing section: curved top edge, one big line, one mono button, then the link columns. */
export function SiteFooter() {
  return (
    <footer className="relative bg-forest text-white">
      <Suspense fallback={null}><FooterCurve /></Suspense>
      <div className="mx-auto max-w-[1320px] px-5 pb-10 pt-32 sm:px-8">
        <div className="text-center">
          <h2 className="mx-auto max-w-[16ch] text-[clamp(2.6rem,6vw,5.2rem)] font-normal leading-[1] tracking-[-0.05em] text-white">Your next home starts today.</h2>
          <div className="mt-10 flex flex-wrap justify-center gap-3">
            <Link href="/listings" className="mono-label flex h-14 items-center rounded-lg bg-[#b6f400] px-9 text-black transition-transform hover:scale-[1.03]">Start searching</Link>
            <Link href="/sell" className="mono-label flex h-14 items-center rounded-lg bg-white/10 px-9 text-white transition-colors hover:bg-white/20">Sell with us</Link>
          </div>
        </div>

        <div className="mt-28 grid gap-12 border-t border-white/10 pt-12 md:grid-cols-[1.4fr_1fr_1fr_1.3fr]">
          <div>
            <Logo className="scale-110 origin-left" />
            <p className="mt-6 max-w-[17rem] text-[15px] leading-snug text-white/80">Plots, flats, villas and offices in Hyderabad, with the papers checked before you pay.</p>
          </div>
          {Object.entries(cols).map(([title, items]) => (
            <div key={title}>
              <p className="mono-label mb-5 text-white/70">{title}</p>
              <ul className="space-y-3 text-[1.05rem]">
                {items.map(([label, href]) => <li key={label}><Link href={href} className="text-white transition-colors hover:text-[#b6f400]">{label}</Link></li>)}
              </ul>
            </div>
          ))}
          <div>
            <p className="mono-label mb-5 text-white/70">Reach us</p>
            <p className="text-[1.05rem] leading-snug text-white">Ready to find your place in Hyderabad?</p>
            <a href="tel:+919985079998" className="mt-3 block text-[1.5rem] tracking-[-0.02em] text-white hover:text-[#b6f400]">+91 99850 79998</a>
            <a href="https://wa.me/919985079998" className="mono-label mt-5 inline-flex h-11 items-center rounded-lg border border-white/40 px-5 text-white hover:bg-white/10">WhatsApp us</a>
          </div>
        </div>

        <div className="mt-16 flex flex-wrap items-center justify-between gap-4 border-t border-white/10 pt-6 text-sm text-white/70">
          <div className="flex flex-wrap gap-x-8 gap-y-2"><Link href="/privacy" className="hover:text-white">Privacy policy</Link><Link href="/terms" className="hover:text-white">Terms of service</Link><span>RERA registration: demo only</span></div>
          <p>© 2026 Deccan Estates · Developed by Yashwanth Varma Konduru</p>
        </div>
      </div>
    </footer>
  );
}
