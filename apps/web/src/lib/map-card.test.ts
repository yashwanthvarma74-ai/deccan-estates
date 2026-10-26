import { describe, expect, it } from "vitest";
import { cardHtml, esc } from "./map-card";
import type { MapPoint } from "@/lib/api";

const point: MapPoint = { id: "abc", title: "2 BHK flat", lat: 17.4, lng: 78.4, priceInr: 4_500_000, imageUrl: "/places/x.jpg", dealType: "SALE", type: "APARTMENT", areaSqft: 1100, plotAreaSqYd: null, bedrooms: 2, locality: "Kondapur" };

describe("map card", () => {
  it("shows the facts and links to the listing", () => {
    const h = cardHtml(point);
    expect(h).toContain('href="/listings/abc"');
    expect(h).toContain("2 BHK flat");
    expect(h).toContain("Kondapur");
    expect(h).toContain("2 BHK · 1,100 sq ft");
  });
  it("cannot be used to inject markup through a title, area or photo address", () => {
    const h = cardHtml({ ...point, id: 'a"><script>x</script>', title: '<img src=x onerror=alert(1)>', locality: "<b>hi</b>", imageUrl: 'javascript:alert(1)' });
    expect(h).not.toContain("<script");
    expect(h).not.toContain("<img src=x");
    expect(h).not.toContain("<b>hi");
    expect(h).not.toContain("javascript:");
  });
  it("escapes quotes too", () => { expect(esc(`"'<>&`)).toBe("&quot;&#39;&lt;&gt;&amp;"); });
});
