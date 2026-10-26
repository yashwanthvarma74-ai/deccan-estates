import { agentsInfo, areaGuide, emi, searchListings, type Card } from "@/lib/ask-tools";
import { parseIntent, type Intent } from "@/lib/ask-parse";
import { fetchLocalities } from "@/lib/api";
import { formatInr } from "@/lib/utils";

const DEAL_WORD: Record<string, string> = { SALE: "for sale", RENT: "for rent", LEASE: "for lease" };

const NOUN: Record<string, [string, string]> = { PLOT: ["plot", "plots"], APARTMENT: ["flat", "flats"], VILLA: ["villa", "villas"], GATED_COMMUNITY: ["gated community home", "gated community homes"], COMMERCIAL: ["commercial space", "commercial spaces"] };

const line = (c: Card, i: number) =>
  `${i + 1}. **[${c.title}](${c.url})**: ${c.price}, ${c.size}${c.beds ? `, ${c.beds} BHK` : ""}, ${c.area}${c.verification ? `, papers ${c.verification}` : ""}${c.byOwner ? " (posted by owner)" : ""}`;

export const HELP = [
  "I can search every listing on Deccan Estates. Try asking:",
  "- \"2 BHK flat for rent in Kondapur under 40k\"",
  "- \"Verified plots in Kokapet below 2 crore\"",
  "- \"Office space for lease in Gachibowli\"",
  "- \"EMI for a 1.2 crore home, 20 years, 8.5%\"",
  "- \"How are prices in Miyapur?\"",
].join("\n");

/** Answers from the live listings without any AI model, so the assistant is useful even when no key is configured. */
export async function answerWithoutAI(text: string): Promise<{ markdown: string; intent: Intent }> {
  const areas = (await fetchLocalities().catch(() => [])).map((l) => ({ name: l.name, slug: l.slug }));
  const intent = parseIntent(text, areas);

  if (intent.kind === "help") {
    const asked = areas.find((a) => text.toLowerCase().includes(a.slug));
    if (asked) {
      const g = await areaGuide(asked.slug);
      if (g.found) return { intent, markdown: `**${g.name}** (${g.zone} Hyderabad): average price about Rs. ${g.averagePricePerSqft.toLocaleString("en-IN")} per sq ft. There are ${g.forSale} homes for sale, ${g.forRent} for rent and ${g.commercialLease} commercial lease listings. Ask me to show any of them, for example "flats in ${g.name} under 1 crore".` };
    }
    return { intent, markdown: HELP };
  }

  if (intent.kind === "emi") {
    const r = emi({ price: intent.price, downPaymentPct: intent.downPaymentPct, years: intent.years, ratePct: intent.ratePct });
    return { intent, markdown: `For a home of **${formatInr(r.price)}** with ${r.downPaymentPct}% down (${formatInr(r.downPayment)}), a loan of ${formatInr(r.loan)} over ${r.years} years at ${r.ratePct}%:\n- Monthly EMI: **${formatInr(r.monthlyEmi)}**\n- Interest over the loan: ${formatInr(r.totalInterest)}\n- Stamp duty and registration (about 6% in Telangana): ${formatInr(r.stampDutyAndRegistration)}\n\nYou can change the numbers in the calculator on the home page. Banks decide the final rate and terms.` };
  }

  if (intent.kind === "agents") {
    const a = await agentsInfo();
    return { intent, markdown: a.length ? "Our listing agents:\n" + a.map((x) => `- **${x.name}**, ${x.phone} (${x.listings} listings)`).join("\n") : "I could not load the agents right now. Please try again." };
  }

  const r = await searchListings({ ...intent.args, limit: 5 });
  if (!r.items.length) return { intent, markdown: `I could not find homes matching that. Try a wider budget, another area, or remove a filter.${r.note ? `\n\n${r.note}` : ""}` };
  const noun = (NOUN[intent.args.type ?? ""] ?? ["home", "homes"])[r.total === 1 ? 0 : 1];
  const head = `I found **${r.total}** ${noun} ${DEAL_WORD[intent.args.deal ?? "SALE"]}${intent.args.area ? ` in ${r.items[0].area}` : ""}. ${r.shown === r.total ? (r.total === 1 ? "Here it is:" : "Here they are:") : `Here are the first ${r.shown}:`}`;
  const shareable = new URLSearchParams(Object.entries(r.filtersUsed).filter(([k]) => k !== "pageSize")); // the results page picks its own page size
  return { intent, markdown: [head, ...r.items.map(line), r.total > r.shown ? `\nSee all ${r.total} on the [results page](/listings?${shareable.toString()}).` : "", r.note ?? ""].filter(Boolean).join("\n") };
}
