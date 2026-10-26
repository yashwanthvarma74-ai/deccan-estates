import { describe, expect, it } from "vitest";
import { formatInr } from "./utils";

describe("formatInr", () => {
  it("uses crore and lakh shorthand", () => {
    expect(formatInr(12_500_000)).toBe("₹1.25 Cr");
    expect(formatInr(8_650_000)).toBe("₹86.5 L");
  });
});
