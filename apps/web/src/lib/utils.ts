import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/** Formats rupees as Indian lakh/crore shorthand, e.g. ₹1.25 Cr, ₹85 L. */
export function formatInr(value: number) {
  if (value >= 1e7) return `₹${+(value / 1e7).toFixed(2)} Cr`;
  if (value >= 1e5) return `₹${+(value / 1e5).toFixed(1)} L`;
  return `₹${value.toLocaleString("en-IN")}`;
}

export type Deal = "SALE" | "RENT" | "LEASE";
export const DEAL_LABELS: Record<Deal, string> = { SALE: "Buy", RENT: "Rent", LEASE: "Commercial" };
export const DEAL_TAGS: Record<Deal, string> = { SALE: "For sale", RENT: "For rent", LEASE: "Commercial lease" };

/** Price as shown to people: rent and lease are monthly amounts. */
export function priceLabel(l: { priceInr: number; dealType?: string }) {
  return l.dealType === "RENT" || l.dealType === "LEASE" ? `${formatInr(l.priceInr)} / month` : formatInr(l.priceInr);
}

/** Monthly budget steps in rupees for rent and lease searches. */
export const RENT_STEPS = [5_000, 10_000, 15_000, 25_000, 40_000, 60_000, 100_000, 200_000, 500_000];
export const budgetSteps = (deal?: string) => (deal === "RENT" || deal === "LEASE" ? RENT_STEPS : PRICE_STEPS);

/** Budget steps in rupees, 25 L up to 20 Cr. The top step reads "20 Cr+" when used as a minimum. */
export const PRICE_STEPS = [2_500_000, 5_000_000, 7_500_000, 10_000_000, 15_000_000, 20_000_000, 30_000_000, 50_000_000, 75_000_000, 100_000_000, 150_000_000, 200_000_000];
export const TOP_PRICE = PRICE_STEPS[PRICE_STEPS.length - 1];

/** Value used for the open-ended top option of a "max" list ("20 Cr+", "10,000+"): effectively no cap. */
export const NO_CAP = 2_000_000_000;

/** Puts "+" right after the number in a label like "5,000 sq ft" → "5,000+ sq ft". */
export function plusAfterNumber(label: string, plus: string) {
  if (!plus) return label;
  const i = label.search(/\d[\d,.]*(?!.*\d)/);
  if (i < 0) return label + plus;
  const m = label.slice(i).match(/^\d[\d,.]*/)!;
  return label.slice(0, i + m[0].length) + plus + label.slice(i + m[0].length);
}

/** Options for a min list: the last entry reads "N+". */
export function minOptions(list: number[], label: (n: number) => string) {
  return list.map((n, i) => ({ value: n, label: plusAfterNumber(label(n), i === list.length - 1 ? "+" : "") }));
}

/** Options for a max list: the last entry reads "N+" and means no upper limit. */
export function maxOptions(list: number[], label: (n: number) => string) {
  return list.map((n, i) => {
    const last = i === list.length - 1;
    return { value: last ? NO_CAP : n, label: plusAfterNumber(label(n), last ? "+" : "") };
  });
}
