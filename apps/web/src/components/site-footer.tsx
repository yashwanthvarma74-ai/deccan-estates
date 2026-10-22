import Link from "next/link";

const cols: Record<string, string[]> = {
  Buy: ["Plots", "Villas", "Gated communities", "Apartments"],
  Localities: ["Gachibowli", "Kokapet", "Kondapur", "Shamshabad"],
  Company: ["Agents", "Stories", "Sell with us", "Contact"],
};

export function SiteFooter() {
  return (
    <footer className="bg-navy text-white">
      <div className="mx-auto grid max-w-[1800px] gap-10 px-6 py-14 md:grid-cols-4">
        <div>
          <p className="font-display text-2xl">Deccan Estates</p>
          <p className="mt-3 max-w-xs text-sm text-white/70">
            RERA-registered plots, villas and gated communities across Hyderabad, with an assistant that reads the documents.
          </p>
        </div>
        {Object.entries(cols).map(([title, items]) => (
          <div key={title}>
            <p className="label mb-4 text-white/60">{title}</p>
            <ul className="space-y-2 text-sm">
              {items.map((i) => (
                <li key={i}><Link href="/listings" className="hover:underline">{i}</Link></li>
              ))}
            </ul>
          </div>
        ))}
      </div>
      <div className="border-t border-white/10 py-5 text-center text-xs text-white/50">
        Demo project. Listings are sample data. Not a real brokerage.
      </div>
    </footer>
  );
}
