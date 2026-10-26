"use client";
import { useState } from "react";
import { Plus } from "lucide-react";
import { cn } from "@/lib/utils";

const GROUPS: Record<string, [string, string][]> = {
  Buying: [
    ["How do I know a plot is safe to buy?", "Open the listing and read its verified report: layout approval, land use, lake buffer, 30-year title chain, encumbrance, land records and court cases. Anything amber or red is explained in plain words."],
    ["What does the Verified badge mean?", "All checks on that listing passed. Amber means one or two items need a closer look; red means a serious issue was found and you should not pay until it is resolved."],
    ["Can I compare homes?", "Yes. Add up to four homes to compare and see price, area, approvals and verification side by side."],
  ],
  Verification: [
    ["Are the checks real?", "Right now the reports are sample data so you can see the format. Live document checks, where sellers upload deeds and certificates, are the next step, and each report says which kind it is."],
    ["Which records do you check?", "HMDA and DTCP approvals, the master plan, lake full-tank-level maps, sale deeds, the encumbrance certificate, Dharani land records and court cases."],
  ],
  Selling: [
    ["How do I list my property?", "Use Sell with us, tell us about the property and an agent contacts you. Verified listings get more enquiries."],
    ["Do I pay to list?", "Listing is free in this demo. Charges, if any, would be shown before you confirm."],
  ],
  Loans: [
    ["How is the EMI worked out?", "From the price, your down payment, tenure and rate, using the standard reducing-balance formula. Stamp duty and registration are estimated at about 6% for Telangana."],
    ["Can I search within my budget?", "Yes. The calculator links straight to verified homes at or below your price."],
  ],
};

/** Two columns: title and intro on the left; category pills and a hairline accordion on the right. */
export function Faq() {
  const [group, setGroup] = useState<keyof typeof GROUPS>("Buying");
  const [open, setOpen] = useState<number | null>(0);
  return (
    <section className="bg-paper px-5 pb-32 pt-10 text-paper-ink sm:px-8" aria-labelledby="faq-h">
      <div className="mx-auto grid max-w-[1320px] gap-12 lg:grid-cols-[0.8fr_1.2fr]">
        <div>
          <h2 id="faq-h" className="text-[clamp(2rem,2.8vw,2.6rem)] font-normal tracking-[-0.03em] text-paper-ink">FAQs</h2>
          <p className="mt-4 max-w-[26ch] text-[1.05rem] leading-snug text-paper-ink/70">Here are the most common questions people have before they start searching.</p>
        </div>
        <div>
          <div className="flex flex-wrap gap-2.5" role="tablist">
            {Object.keys(GROUPS).map((g) => (
              <button key={g} role="tab" aria-selected={g === group} onClick={() => { setGroup(g as keyof typeof GROUPS); setOpen(0); }} className={cn("mono-label cursor-pointer rounded-lg border px-[18px] py-3 transition-colors", g === group ? "border-transparent bg-paper-ink/[0.06] text-paper-ink" : "border-paper-ink/20 text-paper-ink/45 hover:text-paper-ink")}>{g}</button>
            ))}
          </div>
          <ul className="mt-6">
            {GROUPS[group].map(([q, a], i) => (
              <li key={q} className="border-b border-transparent [border-image:linear-gradient(90deg,rgb(182_244_0/0.0),rgb(182_244_0/0.7),rgb(182_244_0/0.0))_1]">
                <button onClick={() => setOpen(open === i ? null : i)} aria-expanded={open === i} className="flex w-full cursor-pointer items-center justify-between gap-6 py-6 text-left text-[1.1rem] tracking-[-0.01em] text-paper-ink">
                  {q}
                  <Plus className={cn("h-5 w-5 shrink-0 text-paper-ink/50 transition-transform duration-300", open === i && "rotate-45")} strokeWidth={1.4} />
                </button>
                <div className={cn("grid transition-[grid-template-rows] duration-400", open === i ? "grid-rows-[1fr]" : "grid-rows-[0fr]")}>
                  <p className="overflow-hidden pr-10 text-[1.02rem] leading-relaxed text-paper-ink/65"><span className="block pb-6">{a}</span></p>
                </div>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  );
}
