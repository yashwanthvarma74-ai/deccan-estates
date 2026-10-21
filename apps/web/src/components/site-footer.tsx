import Link from "next/link";

const cols: Record<string, string[]> = {
  Buy: ["Plots", "Villas", "Gated communities", "Apartments"],
  Localities: ["Gachibowli", "Kokapet", "Kondapur", "Shamshabad"],
  Company: ["Agents", "Stories", "Sell with us", "Contact"],
};

export function SiteFooter() {
  return (
    <footer className="border-t border-hairline bg-canvas-soft text-ink-secondary">
      <div className="mx-auto grid max-w-[1300px] gap-10 px-6 py-14 md:grid-cols-4">
        <div>
          <p className="text-xl font-bold tracking-tight text-ink">Deccan Estates</p>
          <p className="mt-3 max-w-xs text-sm">
            RERA-registered plots, villas and gated communities across Hyderabad, with an assistant that reads the documents.
          </p>
        </div>
        {Object.entries(cols).map(([title, items]) => (
          <div key={title}>
            <p className="mb-4 text-sm font-semibold text-ink">{title}</p>
            <ul className="space-y-2 text-sm">
              {items.map((i) => (
                <li key={i}><Link href="/listings" className="hover:text-primary">{i}</Link></li>
              ))}
            </ul>
          </div>
        ))}
      </div>
      <div className="border-t border-hairline py-5 text-center text-xs text-ink-faint">
        Demo project. Listings are sample data. Not a real brokerage.
      </div>
    </footer>
  );
}
