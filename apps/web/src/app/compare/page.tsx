"use client";
import { useQueries } from "@tanstack/react-query";
import Link from "next/link";
import { PageHeader } from "@/components/page-header";
import { PUBLIC_API_URL, fetchListing, typeLabels } from "@/lib/api";
import { areaSummary, pricePerUnit } from "@/lib/listing-meta";
import { formatInr } from "@/lib/utils";
import { useCompare } from "@/stores/compare";

export default function ComparePage() {
  const { ids, clear } = useCompare();
  const results = useQueries({
    queries: ids.map((id) => ({ queryKey: ["listing", id], queryFn: () => fetchListing(id, PUBLIC_API_URL) })),
  });
  const listings = results.flatMap((r) => (r.data ? [r.data] : []));

  if (ids.length === 0) {
    return (
      <>
        <PageHeader eyebrow="Compare" title="Side by side.">Add homes with “Compare” on any listing card and they appear here.</PageHeader>
        <section className="mx-auto max-w-[1320px] px-5 pb-24 sm:px-8"><Link href="/listings" className="mono-label inline-flex h-12 items-center rounded-lg bg-[#b6f400] px-7 text-black transition-transform hover:scale-[1.03]">Search homes</Link></section>
      </>
    );
  }

  const rows: [string, (l: (typeof listings)[number]) => string][] = [
    ["Type", (l) => typeLabels[l.type]],
    ["Locality", (l) => l.locality.name],
    ["Price", (l) => formatInr(l.priceInr)],
    ["Size", (l) => areaSummary(l)],
    ["Price per unit", (l) => `₹${pricePerUnit(l).value.toLocaleString("en-IN")} / ${pricePerUnit(l).unit}`],
    ["Locality avg ₹ / sq ft", (l) => `₹${l.locality.avgPricePerSqft.toLocaleString("en-IN")}`],
    ["RERA", (l) => l.reraNumber ?? "—"],
  ];

  return (
    <>
      <PageHeader eyebrow="Compare" title="Side by side." />
      <section className="mx-auto max-w-[1320px] px-5 pb-24 sm:px-8">
        <div className="mb-4 flex justify-end"><button onClick={clear} className="mono-label h-11 cursor-pointer rounded-lg border border-white/25 px-5 text-white/85 transition-colors hover:bg-white/10">Clear all</button></div>
        <div className="overflow-x-auto rounded-2xl border border-white/12 bg-white/[0.03] p-4 sm:p-6">
          <table className="w-full min-w-[34rem] text-left">
            <thead><tr><th className="w-40" />{listings.map((l) => <th key={l.id} className="p-3 align-bottom text-[1.15rem] font-medium tracking-[-0.02em]"><Link href={`/listings/${l.id}`} className="hover:text-[#b6f400]">{l.title}</Link></th>)}</tr></thead>
            <tbody>
              {[...rows, ["Verification", (l: (typeof listings)[number]) => (l.verification ? `${l.verification.score} / 100 · ${l.verification.status === "VERIFIED" ? "Verified" : l.verification.status === "CAUTION" ? "Check details" : "High risk"}` : "—")] as [string, (l: (typeof listings)[number]) => string]].map(([label, fn]) => (
                <tr key={label} className="border-t border-white/10">
                  <th scope="row" className="mono-label p-3 font-medium text-white/50">{label}</th>
                  {listings.map((l) => <td key={l.id} className="p-3 text-[1.02rem]">{fn(l)}</td>)}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </>
  );
}
