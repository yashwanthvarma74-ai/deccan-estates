import Link from "next/link";

const cols: Record<string, [string, string][]> = {
  Buy: [["Plots", "/listings?type=PLOT"], ["Villas", "/listings?type=VILLA"], ["Gated communities", "/listings?type=GATED_COMMUNITY"], ["Apartments", "/listings?type=APARTMENT"]],
  Company: [["Agents", "/agents"], ["Stories", "/stories"], ["Sell with us", "/sell"]],
};

export function SiteFooter() {
  return (
    <footer className="bg-black text-white">
      <div className="mx-auto grid max-w-[1800px] gap-12 px-6 pb-10 pt-20 md:grid-cols-[1.4fr_1fr_1fr_1.2fr]">
        <div>
          <p className="max-w-xs text-xl font-light leading-snug">Full responsibility from first shortlist to registration.</p>
          <p className="label mt-8 text-white/60">India, Hyderabad<br />Road No. 36, Banjara Hills</p>
          <a href="tel:+919848001000" className="label mt-3 block hover:opacity-70">+91 98480 01000</a>
        </div>
        {Object.entries(cols).map(([title, items]) => (
          <div key={title}>
            <p className="label mb-5 text-white/50">{title}</p>
            <ul className="space-y-3 text-[13px]">
              {items.map(([label, href]) => (
                <li key={label}><Link href={href} className="hover:opacity-60">{label}</Link></li>
              ))}
            </ul>
          </div>
        ))}
        <div className="label space-y-1 text-white/70">
          <p className="mb-5 text-white/50">Hours</p>
          <p>Mon–Sat — 10:00–19:00</p>
          <p>Sun — Closed</p>
        </div>
      </div>

      <p aria-hidden className="select-none overflow-hidden px-4 text-center text-[clamp(3.5rem,17vw,16rem)] font-extralight uppercase leading-[0.85] tracking-[-0.05em] text-white">
        Deccan
      </p>

      <div className="label mx-auto flex max-w-[1800px] flex-wrap items-center justify-between gap-4 px-6 py-6 text-[0.6rem] text-white/50">
        <span>© 2026 Deccan Estates · Demo project, sample data</span>
        <a href="#top" className="hover:text-white">Back to top ↑</a>
      </div>
    </footer>
  );
}
