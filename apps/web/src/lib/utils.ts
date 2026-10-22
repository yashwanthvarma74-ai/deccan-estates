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

/** Budget steps in rupees, 25 L up to 20 Cr. The top step reads "20 Cr+" when used as a minimum. */
export const PRICE_STEPS = [2_500_000, 5_000_000, 7_500_000, 10_000_000, 15_000_000, 20_000_000, 30_000_000, 50_000_000, 75_000_000, 100_000_000, 150_000_000, 200_000_000];
export const TOP_PRICE = PRICE_STEPS[PRICE_STEPS.length - 1];
