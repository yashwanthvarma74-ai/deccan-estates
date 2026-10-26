import { describe, expect, it } from "vitest";
import { amounts, parseIntent } from "./ask-parse";

const areas = ["Gachibowli", "Kokapet", "Kondapur", "Miyapur", "Uppal"].map((name) => ({ name, slug: name.toLowerCase() }));
const search = (t: string) => {
  const i = parseIntent(t, areas);
  if (i.kind !== "search") throw new Error(`expected a search, got ${i.kind}`);
  return i.args;
};

describe("amounts", () => {
  it("reads crore, lakh and thousand shorthand", () => {
    expect(amounts("under 1.2 crore").map((a) => a.value)).toEqual([12_000_000]);
    expect(amounts("50 lakh or 75L").map((a) => a.value)).toEqual([5_000_000, 7_500_000]);
    expect(amounts("rent below 40k").map((a) => a.value)).toEqual([40_000]);
    expect(amounts("budget 4,500,000").map((a) => a.value)).toEqual([4_500_000]);
  });
  it("ignores sizes, bedrooms, years and rates", () => {
    expect(amounts("3 bhk 1200 sq ft 20 years 8.5%")).toEqual([]);
  });
});

describe("parseIntent", () => {
  it("understands a rental search", () => {
    expect(search("2 BHK flat for rent in Kondapur under 40k")).toMatchObject({ deal: "RENT", type: "APARTMENT", beds: 2, area: "kondapur", maxPrice: 40_000 });
  });
  it("understands verified plots with a budget", () => {
    expect(search("verified plots in Kokapet below 2 crore")).toMatchObject({ type: "PLOT", area: "kokapet", verified: true, maxPrice: 20_000_000 });
  });
  it("sends offices for lease to commercial lease", () => {
    expect(search("office space for lease in Gachibowli")).toMatchObject({ deal: "LEASE", type: "COMMERCIAL", area: "gachibowli" });
  });
  it("reads a price range", () => {
    expect(search("villas between 1 crore and 3 crore")).toMatchObject({ type: "VILLA", minPrice: 10_000_000, maxPrice: 30_000_000 });
  });
  it("answers EMI questions with the numbers given", () => {
    expect(parseIntent("emi for 1.2 crore home, 15 years at 9%", areas)).toMatchObject({ kind: "emi", price: 12_000_000, years: 15, ratePct: 9 });
  });
  it("understands plural words such as rentals and leases", () => {
    expect(search("show me rentals")).toMatchObject({ deal: "RENT" });
    expect(search("commercial leases in Uppal")).toMatchObject({ deal: "LEASE", area: "uppal" });
  });
  it("shows help for unrelated chat", () => {
    expect(parseIntent("hello there", areas).kind).toBe("help");
  });
  it("asks for agents", () => {
    expect(parseIntent("who are your agents", areas).kind).toBe("agents");
  });
});
