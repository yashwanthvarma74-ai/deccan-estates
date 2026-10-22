"use client";
import { useQueries } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { PUBLIC_API_URL, fetchListing, typeLabels } from "@/lib/api";
import { formatInr } from "@/lib/utils";
import { useCompare } from "@/stores/compare";

export default function ComparePage() {
  const { ids, clear } = useCompare();
  const results = useQueries({
    queries: ids.map((id) => ({ queryKey: ["listing", id], queryFn: () => fetchListing(id, PUBLIC_API_URL) })),
  });
  const listings = results.flatMap((r) => (r.data ? [r.data] : []));

  if (ids.length === 0) return <p className="p-10">Pick up to three listings with “Compare” to see them side by side.</p>;

  const rows: [string, (l: (typeof listings)[number]) => string][] = [
    ["Type", (l) => typeLabels[l.type]],
    ["Locality", (l) => l.locality.name],
    ["Price", (l) => formatInr(l.priceInr)],
    ["Area", (l) => `${l.areaSqft} sq ft`],
    ["₹ / sq ft", (l) => `₹${Math.round(l.priceInr / l.areaSqft).toLocaleString("en-IN")}`],
    ["Locality avg ₹ / sq ft", (l) => `₹${l.locality.avgPricePerSqft.toLocaleString("en-IN")}`],
    ["RERA", (l) => l.reraNumber ?? "—"],
  ];

  return (
    <div className="mx-auto max-w-[1800px] space-y-4 px-6 py-10">
      <div className="flex items-center justify-between">
        <h1 className="text-4xl">Compare</h1>
        <Button variant="outline" size="sm" onClick={clear}>Clear</Button>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm">
          <thead>
            <tr>
              <th />
              {listings.map((l) => <th key={l.id} className="p-2 font-display text-lg font-normal">{l.title}</th>)}
            </tr>
          </thead>
          <tbody>
            {rows.map(([label, fn]) => (
              <tr key={label} className="border-t border-line">
                <th scope="row" className="p-2 font-medium text-muted">{label}</th>
                {listings.map((l) => <td key={l.id} className="p-2">{fn(l)}</td>)}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
