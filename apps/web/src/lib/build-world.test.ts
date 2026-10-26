import { describe, expect, it } from "vitest";
import { TIMELINE, buildWorld, cameraAt, chapterAt, visibleFraction, type Seg } from "./build-world";

const wall = (a: number, b: number): Seg => ({ a: [0, a, 0], b: [0, b, 0], mode: "height", t0: 0.2, t1: 0.4, y0: 0, top: 10, w: 1 });

describe("visibleFraction", () => {
  it("shows nothing of a rising building before its window", () => {
    expect(visibleFraction(wall(0, 10), 0.1)).toBe(0);
    // a horizontal slab at the base height must not appear early either
    expect(visibleFraction({ ...wall(5, 5), y0: 5 }, 0.1)).toBe(0);
  });

  it("reveals a vertical line from the ground up as the building rises", () => {
    const mid = visibleFraction(wall(0, 10), 0.3);
    expect(mid).toBeGreaterThan(0.3);
    expect(mid).toBeLessThan(0.7);
    expect(visibleFraction(wall(0, 10), 0.4)).toBe(1);
  });

  it("shows a floor slab only once the building reaches that floor", () => {
    expect(visibleFraction(wall(8, 8), 0.25)).toBe(0);
    expect(visibleFraction(wall(8, 8), 0.4)).toBe(1);
  });

  it("draws ground lines on over their window", () => {
    const line: Seg = { a: [0, 0, 0], b: [10, 0, 0], mode: "draw", t0: 0.1, t1: 0.2, y0: 0, top: 0, w: 1 };
    expect(visibleFraction(line, 0.05)).toBe(0);
    expect(visibleFraction(line, 0.15)).toBeCloseTo(0.5, 1);
    expect(visibleFraction(line, 0.3)).toBe(1);
  });
});

describe("world", () => {
  const world = buildWorld();

  it("is well-formed", () => {
    expect(world.segs.length).toBeGreaterThan(300);
    for (const s of world.segs) {
      expect(s.t1).toBeGreaterThan(s.t0);
      expect(s.t0).toBeGreaterThanOrEqual(0);
      expect(s.t1).toBeLessThanOrEqual(1);
      if (s.mode === "height") expect(s.a[1]).toBeLessThanOrEqual(s.b[1]);
    }
  });

  it("builds in order: plot, fence, villa, apartment, tower", () => {
    const [plot, fence, villa, apt, tower] = [TIMELINE.plot, TIMELINE.fence, TIMELINE.villa, TIMELINE.apartment, TIMELINE.tower];
    expect(plot[1]).toBeLessThanOrEqual(fence[0]);
    expect(fence[1]).toBeLessThanOrEqual(villa[0]);
    expect(villa[1]).toBeLessThanOrEqual(apt[0]);
    expect(apt[1]).toBeLessThanOrEqual(tower[0]);
  });

  it("starts empty and ends with everything visible", () => {
    expect(world.segs.filter((s) => visibleFraction(s, 0) > 0)).toHaveLength(0);
    expect(world.segs.every((s) => visibleFraction(s, 1) === 1)).toBe(true);
  });

  it("maps scroll progress to chapters and a moving camera", () => {
    expect(chapterAt(0).id).toBe("intro");
    expect(chapterAt(0.25).id).toBe("fence");
    expect(chapterAt(0.6).id).toBe("apartment");
    expect(chapterAt(1).id).toBe("outro");
    expect(cameraAt(1).s).toBeLessThan(cameraAt(0).s);
  });
});
