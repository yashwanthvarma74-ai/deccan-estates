import { describe, expect, it } from "vitest";
import { emi } from "./ask-tools";

describe("emi", () => {
  it("matches the standard instalment formula", () => {
    const r = emi({ price: 10_000_000, downPaymentPct: 20, years: 20, ratePct: 8.6 });
    expect(r.loan).toBe(8_000_000);
    expect(r.downPayment).toBe(2_000_000);
    expect(r.monthlyEmi).toBeGreaterThan(69_000);
    expect(r.monthlyEmi).toBeLessThan(71_000);
    expect(r.stampDutyAndRegistration).toBe(600_000);
  });
  it("handles a zero rate", () => {
    expect(emi({ price: 1_200_000, downPaymentPct: 0, years: 1, ratePct: 0 }).monthlyEmi).toBe(100_000);
  });
});
