import Link from "next/link";
import { ArrowUpRight } from "lucide-react";

type Path = { type: string; mono: string; title: string; text: string; chips: [string, string][] };

const PATHS: Path[] = [
  { type: "PLOT", mono: "Plots", title: "I want land to build on", text: "Approved plots with clear titles, measured in sq yd or acres.", chips: [["DTCP approved", "approval=DTCP"], ["HMDA approved", "approval=HMDA"], ["Corner plots", "corner=1"], ["Verified only", "verified=1"]] },
  { type: "APARTMENT", mono: "Flats", title: "I want a ready flat", text: "2, 3 and 4 BHK homes in towers with lifts, parking and amenities.", chips: [["2 BHK+", "minBeds=2"], ["3 BHK+", "minBeds=3"], ["Ready to move", "possession=READY"], ["Verified only", "verified=1"]] },
  { type: "VILLA", mono: "Villas", title: "I want my own villa", text: "Independent houses on their own plot, built and ready to move in.", chips: [["4 bedrooms+", "minBeds=4"], ["Private garden", "amenities=PRIVATE_GARDEN"], ["Private pool", "amenities=PRIVATE_POOL"], ["Verified only", "verified=1"]] },
  { type: "GATED_COMMUNITY", mono: "Gated", title: "I want a secure community", text: "Villas inside gated layouts with clubhouse, parks and 24x7 security.", chips: [["Clubhouse", "amenities=CLUBHOUSE"], ["Swimming pool", "amenities=SWIMMING_POOL"], ["Ready to move", "possession=READY"], ["Verified only", "verified=1"]] },
  { type: "COMMERCIAL", mono: "Commercial", title: "I want an office", text: "Grade-A floors in towers across Hyderabad's business districts.", chips: [["Ready to move", "possession=READY"], ["With parking", "minParking=1"], ["Under 2,000 sq ft", "maxArea=2000"], ["Verified only", "verified=1"]] },
];

/** The five ways in. Each row is one big tap target; hovering reveals what it holds and filtered shortcuts. */
export function PathList({ counts }: { counts: Record<string, number> }) {
  return (
    <ul className="mt-14 divide-y divide-paper-ink/15 border-y border-paper-ink/15">
      {PATHS.map((p, i) => (
        <li key={p.type} className="group relative transition-colors duration-300 hover:bg-paper-ink">
          <Link href={`/listings?type=${p.type}`} className="grid grid-cols-[2.5rem_1fr_auto] items-center gap-4 px-2 py-7 sm:grid-cols-[4rem_1fr_auto_3.5rem] sm:px-6 sm:py-9" aria-label={`${p.mono}: ${p.title}`}>
            <span className="mono-label text-paper-ink/50 transition-colors group-hover:text-white/60">{String(i + 1).padStart(2, "0")}</span>
            <span>
              <span className="mono-label block text-paper-ink/55 transition-colors group-hover:text-[#b6f400]">{p.mono}</span>
              <span className="mt-2 block text-[clamp(1.7rem,3.6vw,3.3rem)] leading-[1.02] tracking-[-0.05em] text-paper-ink transition-colors group-hover:text-white">{p.title}</span>
            </span>
            <span className="hidden text-right sm:block">
              <span className="block text-[clamp(1.6rem,2.6vw,2.4rem)] leading-none tracking-[-0.04em] tabular-nums text-paper-ink transition-colors group-hover:text-white">{counts[p.type] ?? 0}</span>
              <span className="mono-label mt-2 block text-paper-ink/50 transition-colors group-hover:text-white/60">listed</span>
            </span>
            <span aria-hidden className="flex h-12 w-12 items-center justify-center rounded-full border border-paper-ink/30 text-paper-ink transition-all duration-300 group-hover:rotate-45 group-hover:border-[#b6f400] group-hover:bg-[#b6f400] group-hover:text-black">
              <ArrowUpRight className="h-5 w-5" />
            </span>
          </Link>
          <div className="grid grid-rows-[0fr] transition-[grid-template-rows] duration-500 ease-out group-focus-within:grid-rows-[1fr] group-hover:grid-rows-[1fr] max-md:grid-rows-[1fr]">
            <div className="overflow-hidden">
              <div className="flex flex-wrap items-center gap-x-8 gap-y-4 px-2 pb-8 sm:pl-[calc(4rem+1.5rem)] sm:pr-6">
                <p className="max-w-sm text-lg leading-snug text-paper-ink/65 group-hover:text-white/75">{p.text}</p>
                <div className="flex flex-wrap gap-2">
                  {p.chips.map(([label, q]) => (
                    <Link key={label} href={`/listings?type=${p.type}&${q}`} className="mono-label rounded-full border border-paper-ink/25 px-4 py-2.5 text-paper-ink transition-colors hover:!border-[#b6f400] hover:!bg-[#b6f400] hover:!text-black group-hover:border-white/30 group-hover:text-white">{label}</Link>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </li>
      ))}
    </ul>
  );
}
