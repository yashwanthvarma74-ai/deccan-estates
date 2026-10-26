import { describe, expect, it } from "vitest";
import { FIELDS_BY_TYPE, formatArea, keysForType, sqydTo } from "./listing-meta";

describe("listing meta", () => {
  it("converts plot area between sq yd, acre and sq ft", () => {
    expect(sqydTo("sqft", 200)).toBe(1800);
    expect(sqydTo("acre", 4840)).toBe(1);
    expect(formatArea(4840, "acre")).toBe("1 acre");
    expect(formatArea(2420, "acre")).toBe("0.5 acre");
    expect(formatArea(300)).toBe("300 sq yd");
  });

  it("shows plot filters for plots but not bedrooms, and flat filters for flats", () => {
    expect(FIELDS_BY_TYPE.PLOT).toContain("plotArea");
    expect(FIELDS_BY_TYPE.PLOT).not.toContain("beds");
    expect(FIELDS_BY_TYPE.APARTMENT).toContain("carpet");
    expect(FIELDS_BY_TYPE.APARTMENT).not.toContain("plotArea");
    expect(FIELDS_BY_TYPE.VILLA).toEqual(expect.arrayContaining(["plotArea", "builtUp", "carpet"]));
  });

  it("lists the URL keys that belong to a type", () => {
    expect(keysForType("PLOT")).toContain("minPlotArea");
    expect(keysForType("APARTMENT")).not.toContain("minPlotArea");
    expect(keysForType(undefined)).toContain("minBeds");
  });
});

import { maxOptions, minOptions, NO_CAP, plusAfterNumber } from "./utils";

describe("range options", () => {
  it("puts + right after the number on the last option", () => {
    expect(plusAfterNumber("5,000 sq ft", "+")).toBe("5,000+ sq ft");
    expect(plusAfterNumber("₹20 Cr", "+")).toBe("₹20+ Cr");
    expect(minOptions([1, 2], (n) => `${n} sq ft`).map((o) => o.label)).toEqual(["1 sq ft", "2+ sq ft"]);
  });

  it("makes the last max option open-ended", () => {
    const opts = maxOptions([1, 2], (n) => `${n} sq ft`);
    expect(opts[0].value).toBe(1);
    expect(opts[1]).toEqual({ value: NO_CAP, label: "2+ sq ft" });
  });
});
