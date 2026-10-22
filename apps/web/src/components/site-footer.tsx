import Link from "next/link";
import { Phone, MessageCircle, LifeBuoy } from "lucide-react";
import { Logo } from "@/components/logo";

const cols: Record<string, [string, string][]> = {
  "Premium homes": [["All homes", "/listings"], ["Villas", "/listings?type=VILLA"], ["Plots", "/listings?type=PLOT"], ["Gated communities", "/listings?type=GATED_COMMUNITY"], ["Apartments", "/listings?type=APARTMENT"]],
  "Popular localities": [["Kokapet", "/listings?locality=kokapet"], ["Gachibowli", "/listings?locality=gachibowli"], ["Kondapur", "/listings?locality=kondapur"], ["Narsingi", "/listings?locality=narsingi"], ["Shamshabad", "/listings?locality=shamshabad"]],
  "Company": [["Sell your property", "/sell"], ["Our agents", "/agents"], ["Compare homes", "/compare"]],
};

export function SiteFooter() {
  return (
    <footer className="border-t border-white/10 bg-navy-deep">
      <div className="mx-auto max-w-[1600px] px-6 py-16 lg:px-[60px]">
        <div className="flex flex-wrap items-center justify-between gap-8 border-b border-white/10 pb-12">
          <div className="flex items-center gap-6">
            <Logo className="scale-125 origin-left" />
            <p className="hidden max-w-[16rem] text-sm leading-snug text-body md:block">The art of buying property in Hyderabad.</p>
          </div>
          <div className="flex items-center gap-3">
            {["Facebook", "Instagram", "X", "LinkedIn", "YouTube"].map((n) => (
              <span key={n} aria-label={n} title={n} className="flex h-11 w-11 items-center justify-center rounded-full border border-white/15 text-xs text-white/70">{n[0]}</span>
            ))}
          </div>
        </div>

        <div className="grid gap-12 pt-12 md:grid-cols-[repeat(3,1fr)_1.6fr]">
          {Object.entries(cols).map(([title, items]) => (
            <div key={title}>
              <p className="mb-5 text-sm font-semibold uppercase tracking-wider text-white/90">{title}</p>
              <ul className="space-y-3 text-[15px] text-body">
                {items.map(([label, href]) => <li key={label}><Link href={href} className="transition-colors hover:text-white">{label}</Link></li>)}
              </ul>
            </div>
          ))}
          <div className="space-y-6">
            <div className="flex items-start gap-4">
              <LifeBuoy className="mt-1 h-9 w-9 shrink-0 text-white/80" strokeWidth={1.2} />
              <div>
                <p className="text-lg font-medium">Help &amp; Support</p>
                <p className="mt-1 text-sm text-body">Talk to our experts and browse more homes.</p>
              </div>
            </div>
            <div className="flex flex-wrap gap-8">
              <a href="tel:+919848001000" className="flex items-center gap-3 hover:opacity-80"><Phone className="h-7 w-7 text-white/80" strokeWidth={1.3} /><span><span className="block text-xs text-muted">Call customer service</span>+91 98480 01000</span></a>
              <a href="https://wa.me/919848001000" className="flex items-center gap-3 hover:opacity-80"><MessageCircle className="h-7 w-7 text-white/80" strokeWidth={1.3} /><span><span className="block text-xs text-muted">WhatsApp</span><u>Click</u> and start</span></a>
            </div>
          </div>
        </div>

        <div className="mt-16 flex flex-wrap items-center justify-between gap-4 border-t border-white/10 pt-6 text-sm text-muted">
          <div className="flex flex-wrap gap-x-8 gap-y-2">
            <span>Privacy policy</span>
            <span>Terms of service</span>
            <span>RERA registration: demo only</span>
          </div>
          <p>© 2026 Deccan Estates · Demo project, sample data</p>
        </div>
      </div>
    </footer>
  );
}
