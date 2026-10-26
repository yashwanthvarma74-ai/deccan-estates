import type { Metadata } from "next";
import Link from "next/link";
import { PageHeader } from "@/components/page-header";

export const metadata: Metadata = { title: "Buying guides", description: "Plain-language guides to checking papers, picking an area and choosing between plots, flats and villas in Hyderabad." };

const guides = [
  { tag: "Papers", t: "Reading a sale deed before you pay a token", d: "Check the survey number against the land record, the seller's name against the owner, and the encumbrance certificate for open loans. A gap in the chain of title means stop and ask a lawyer.", href: "/listings?verified=1", cta: "See verified homes" },
  { tag: "Areas", t: "Why Kokapet and Gachibowli keep pulling ahead", d: "Closeness to the financial district and quick access to the Outer Ring Road drive demand. Compare price per sq ft with the area average before you decide.", href: "/listings?locality=kokapet", cta: "Browse Kokapet" },
  { tag: "Plots", t: "Plots or villas: what to buy first", d: "Approved plots cost less to hold and are easy to resell, but you build later. Villas are ready to live in and cost more to maintain. Check HMDA or DTCP approval either way.", href: "/listings?type=PLOT", cta: "Browse plots" },
  { tag: "Money", t: "What a home really costs", d: "Add about 6% for stamp duty and registration in Telangana to the price, then work out the EMI from your down payment, tenure and rate.", href: "/#calculator", cta: "Try the calculator" },
];

export default function StoriesPage() {
  return (
    <>
      <PageHeader eyebrow="Guides" title="Know before you buy.">Short guides on checking papers, choosing an area and working out the real cost of a home in Hyderabad.</PageHeader>
      <section className="mx-auto max-w-[1320px] px-5 pb-24 sm:px-8">
        <ul className="grid gap-4 md:grid-cols-2">
          {guides.map((g) => (
            <li key={g.t} className="flex flex-col rounded-2xl border border-white/12 bg-white/[0.03] p-8 transition-colors hover:border-white/30">
              <p className="mono-label text-[#b6f400]">{g.tag}</p>
              <h2 className="mt-4 text-[1.7rem] leading-[1.08] tracking-[-0.035em]">{g.t}</h2>
              <p className="mt-4 text-[1.05rem] leading-relaxed text-white/65">{g.d}</p>
              <Link href={g.href} className="mono-label mt-auto inline-flex h-11 w-fit items-center pt-6 text-white underline underline-offset-[6px] hover:text-[#b6f400]">{g.cta} →</Link>
            </li>
          ))}
        </ul>
      </section>
    </>
  );
}
