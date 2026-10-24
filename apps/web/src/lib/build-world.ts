/**
 * A small wireframe "construction site" rendered on a canvas. The scene is plain data (line segments and
 * points in world units) plus a renderer that reveals it as a function of scroll progress `p` (0 → 1):
 * ground outlines are drawn on, and buildings rise from the ground up, floor by floor.
 */
export type V3 = [number, number, number];

/**
 * mode "draw":   the segment is drawn from `a` to `b` over the progress window [t0, t1].
 * mode "height": a building rises over [t0, t1] from `y0` to `top`; the segment shows where y <= height.
 * Height-mode segments always run from lower to higher y.
 */
export type Seg = { a: V3; b: V3; mode: "draw" | "height"; t0: number; t1: number; y0: number; top: number; w: 0 | 1 | 2 };

type Rect = { x0: number; x1: number; z0: number; z1: number };
export type Win = { y0: number; top: number; t0: number; t1: number };
export type Rise = { x0: number; x1: number; z0: number; z1: number; y0: number; top: number; t0: number; t1: number; step?: { y: number; rect: Rect } };
export type Lit = { p: V3; t: number };

export const TIMELINE = {
  plot: [0.07, 0.2],
  fence: [0.2, 0.33],
  villa: [0.33, 0.52],
  apartment: [0.52, 0.72],
  tower: [0.72, 0.94],
} as const;

/** Chapters used by the page copy: the progress at which each starts. */
export const CHAPTERS = [
  { id: "intro", at: 0, label: "Start" },
  { id: "plot", at: 0.07, label: "Plot" },
  { id: "fence", at: 0.2, label: "Fence" },
  { id: "villa", at: 0.33, label: "Villa" },
  { id: "apartment", at: 0.52, label: "Flats" },
  { id: "commercial", at: 0.72, label: "Commercial" },
  { id: "outro", at: 0.94, label: "Done" },
] as const;

export function chapterAt(p: number) {
  let current: (typeof CHAPTERS)[number] = CHAPTERS[0];
  for (const c of CHAPTERS) if (p >= c.at) current = c;
  return current;
}

export const clamp01 = (x: number) => Math.min(1, Math.max(0, x));
export const ease = (x: number) => (x < 0.5 ? 2 * x * x : 1 - Math.pow(-2 * x + 2, 2) / 2);
const lerp = (a: number, b: number, t: number) => a + (b - a) * t;

/** Fraction (0..1) of a segment, measured from `a`, that is visible at progress `p`. */
export function visibleFraction(s: Seg, p: number): number {
  const k = clamp01((p - s.t0) / (s.t1 - s.t0));
  if (s.mode === "draw") return ease(k);
  if (k <= 0) return 0; // the building has not started rising yet: nothing of it exists
  const h = lerp(s.y0, s.top, ease(k));
  const ya = s.a[1];
  const yb = s.b[1];
  if (ya === yb) return ya <= h ? 1 : 0;
  if (h >= yb) return 1;
  if (h <= ya) return 0;
  return (h - ya) / (yb - ya);
}

/** Current height of a rising building at progress `p`. */
export function riseHeight(r: Rise, p: number) {
  return lerp(r.y0, r.top, ease(clamp01((p - r.t0) / (r.t1 - r.t0))));
}

export type World = { segs: Seg[]; pts: { seg: number; u: number; j: V3 }[]; rises: Rise[]; lit: Lit[]; stars: [number, number, number][] };

// Deterministic pseudo-random so the scene looks the same on every load.
function rng(seed: number) {
  let s = seed >>> 0;
  return () => {
    s = (s * 1664525 + 1013904223) >>> 0;
    return s / 4294967296;
  };
}

export const PLOTS = {
  A: { x0: -58, x1: -30, z0: -16, z1: 16 },
  B: { x0: -14, x1: 14, z0: -16, z1: 16 },
  C: { x0: 30, x1: 62, z0: -16, z1: 16 },
} as const;

export function buildWorld(): World {
  const segs: Seg[] = [];
  const rises: Rise[] = [];
  const lit: Lit[] = [];
  const rand = rng(7);

  const draw = (a: V3, b: V3, t0: number, t1: number, w: 0 | 1 | 2 = 1) => segs.push({ a, b, mode: "draw", t0, t1, y0: 0, top: 0, w });
  const up = (a: V3, b: V3, r: { y0: number; top: number; t0: number; t1: number }, w: 0 | 1 | 2 = 1) => {
    const [lo, hi] = a[1] <= b[1] ? [a, b] : [b, a];
    segs.push({ a: lo, b: hi, mode: "height", t0: r.t0, t1: r.t1, y0: r.y0, top: r.top, w });
  };

  /** Four edges of a rectangle at height y, drawn one after another. */
  const rectDraw = (r: Rect, y: number, t0: number, t1: number, w: 0 | 1 | 2 = 1) => {
    const c: V3[] = [[r.x0, y, r.z0], [r.x1, y, r.z0], [r.x1, y, r.z1], [r.x0, y, r.z1]];
    const step = (t1 - t0) / 4;
    for (let i = 0; i < 4; i++) draw(c[i], c[(i + 1) % 4], t0 + i * step, t0 + (i + 1) * step, w);
  };
  const rectUp = (r: Rect, y: number, w: { y0: number; top: number; t0: number; t1: number }, weight: 0 | 1 | 2 = 1) => {
    const c: V3[] = [[r.x0, y, r.z0], [r.x1, y, r.z0], [r.x1, y, r.z1], [r.x0, y, r.z1]];
    for (let i = 0; i < 4; i++) up(c[i], c[(i + 1) % 4], w, weight);
  };
  const corners = (r: Rect): V3[] => [[r.x0, 0, r.z0], [r.x1, 0, r.z0], [r.x1, 0, r.z1], [r.x0, 0, r.z1]];

  const windowsOn = (face: "n" | "s" | "e" | "w", r: Rect, y: number, h: number, count: number, ww: number, win: Win, weight: 0 | 1 | 2 = 1) => {
    for (let i = 0; i < count; i++) {
      const len = face === "n" || face === "s" ? r.x1 - r.x0 : r.z1 - r.z0;
      const mid = (i + 0.5) / count;
      const c = lerp(face === "n" || face === "s" ? r.x0 : r.z0, face === "n" || face === "s" ? r.x1 : r.z1, mid);
      const half = Math.min(ww, (len / count) * 0.7) / 2;
      const P = (u: number, yy: number): V3 =>
        face === "n" ? [u, yy, r.z0] : face === "s" ? [u, yy, r.z1] : face === "w" ? [r.x0, yy, u] : [r.x1, yy, u];
      const a = P(c - half, y), b = P(c + half, y), cc = P(c + half, y + h), d = P(c - half, y + h);
      up(a, b, win, weight); up(b, cc, win, weight); up(d, cc, win, weight); up(a, d, win, weight);
    }
  };

  const sprinkleLit = (r: Rect, y0: number, y1: number, floorH: number, tStart: number, tEnd: number, count: number) => {
    for (let i = 0; i < count; i++) {
      const floor = Math.floor(rand() * ((y1 - y0) / floorH));
      const face = Math.floor(rand() * 4);
      const u = rand();
      const y = y0 + floor * floorH + floorH * 0.55;
      const pos: V3 = face === 0 ? [lerp(r.x0, r.x1, u), y, r.z0] : face === 1 ? [lerp(r.x0, r.x1, u), y, r.z1] : face === 2 ? [r.x0, y, lerp(r.z0, r.z1, u)] : [r.x1, y, lerp(r.z0, r.z1, u)];
      lit.push({ p: pos, t: lerp(tStart, tEnd, rand()) });
    }
  };

  // ---- 01 Plot A: boundary, corner stakes, survey grid --------------------------------------------------
  const [pa0, pa1] = TIMELINE.plot;
  const A = PLOTS.A;
  rectDraw(A, 0, pa0, pa0 + (pa1 - pa0) * 0.45, 2);
  const stake = { y0: 0, top: 2.6, t0: pa0 + 0.02, t1: pa0 + 0.07 };
  for (const c of corners(A)) up(c, [c[0], 2.6, c[2]], stake, 2);
  for (let x = A.x0 + 4; x < A.x1; x += 4) draw([x, 0, A.z0], [x, 0, A.z1], pa0 + 0.04, pa1, 0);
  for (let z = A.z0 + 4; z < A.z1; z += 4) draw([A.x0, 0, z], [A.x1, 0, z], pa0 + 0.04, pa1, 0);

  // ---- 02 Fence A: posts rise one after another, then rails run between them ------------------------------
  const [fa0, fa1] = TIMELINE.fence;
  const postH = 3.2;
  const per: [V3, V3][] = [
    [[A.x0, 0, A.z0], [A.x1, 0, A.z0]], [[A.x1, 0, A.z0], [A.x1, 0, A.z1]],
    [[A.x1, 0, A.z1], [A.x0, 0, A.z1]], [[A.x0, 0, A.z1], [A.x0, 0, A.z0]],
  ];
  const posts: V3[] = [];
  const gate = { x0: -47, x1: -41 }; // gap in the front edge for the gate
  for (const [a, b] of per) {
    const len = Math.hypot(b[0] - a[0], b[2] - a[2]);
    const n = Math.round(len / 3.5);
    for (let i = 0; i < n; i++) {
      const u = i / n;
      const pt: V3 = [lerp(a[0], b[0], u), 0, lerp(a[2], b[2], u)];
      if (pt[2] === A.z1 && pt[0] > gate.x0 && pt[0] < gate.x1) continue;
      posts.push(pt);
    }
  }
  posts.forEach((pt, i) => {
    const t0 = fa0 + (fa1 - fa0) * 0.55 * (i / posts.length);
    up(pt, [pt[0], postH, pt[2]], { y0: 0, top: postH, t0, t1: t0 + 0.025 }, 1);
  });
  for (const [ga, gb] of [[gate.x0, 0], [gate.x1, 0]] as const) {
    void gb;
    up([ga, 0, A.z1], [ga, 4.4, A.z1], { y0: 0, top: 4.4, t0: fa0 + 0.06, t1: fa0 + 0.09 }, 2);
  }
  const railT0 = fa0 + (fa1 - fa0) * 0.5;
  for (const [i, [a, b]] of per.entries()) {
    const s0 = railT0 + ((fa1 - railT0) * i) / 4;
    const s1 = railT0 + ((fa1 - railT0) * (i + 0.9)) / 4;
    for (const y of [1.1, 2.4]) {
      if (i === 2) {
        draw([a[0], y, a[2]], [gate.x1, y, a[2]], s0, s1, 1);
        draw([gate.x0, y, a[2]], [b[0], y, b[2]], s0, s1, 1);
      } else draw([a[0], y, a[2]], [b[0], y, b[2]], s0, s1, 1);
    }
  }

  // ---- 03 Villa on plot A: slab, two floors of walls, windows, balcony, hip roof ---------------------------
  const [va0, va1] = TIMELINE.villa;
  const V: Rect = { x0: -51, x1: -37, z0: -8, z1: 8 };
  const slab: Rect = { x0: V.x0 - 1, x1: V.x1 + 1, z0: V.z0 - 1, z1: V.z1 + 1 };
  rectDraw(slab, 0, va0, va0 + 0.025, 2);
  rectDraw(V, 0, va0 + 0.01, va0 + 0.035, 1);
  const fh = 3.8;
  const wallsTop = fh * 2;
  const wallsWin = { y0: 0, top: wallsTop, t0: va0 + 0.03, t1: va0 + 0.145 };
  for (const c of corners(V)) up(c, [c[0], wallsTop, c[2]], wallsWin, 2);
  for (const y of [fh, wallsTop]) rectUp(V, y, wallsWin, 2);
  for (let f = 0; f < 2; f++) {
    const y = f * fh + 1.1;
    windowsOn("s", V, y, 1.9, 3, 2.8, wallsWin);
    windowsOn("n", V, y, 1.9, 3, 2.8, wallsWin);
    windowsOn("e", V, y, 1.9, 2, 3.2, wallsWin);
    windowsOn("w", V, y, 1.9, 2, 3.2, wallsWin);
  }
  // door and balcony on the front (south) face
  const doorX = (V.x0 + V.x1) / 2;
  up([doorX - 1, 0, V.z1], [doorX - 1, 2.9, V.z1], wallsWin, 2);
  up([doorX + 1, 0, V.z1], [doorX + 1, 2.9, V.z1], wallsWin, 2);
  up([doorX - 1, 2.9, V.z1], [doorX + 1, 2.9, V.z1], wallsWin, 2);
  const balc: Rect = { x0: doorX - 3, x1: doorX + 3, z0: V.z1, z1: V.z1 + 2.4 };
  rectUp(balc, fh, wallsWin, 1);
  rectUp(balc, fh + 1.1, wallsWin, 0);
  for (const c of [[balc.x0, balc.z1], [balc.x1, balc.z1], [balc.x0, balc.z0], [balc.x1, balc.z0]]) up([c[0], fh, c[1]], [c[0], fh + 1.1, c[1]], wallsWin, 0);
  // hip roof
  const roofWin = { y0: wallsTop, top: wallsTop + 3.6, t0: va0 + 0.145, t1: va1 };
  const eave: Rect = { x0: V.x0 - 1.2, x1: V.x1 + 1.2, z0: V.z0 - 1.2, z1: V.z1 + 1.2 };
  rectUp(eave, wallsTop, roofWin, 2);
  const ridgeY = wallsTop + 3.6;
  const rx = (V.x0 + V.x1) / 2;
  up([rx, ridgeY, V.z0 + 3], [rx, ridgeY, V.z1 - 3], roofWin, 2);
  for (const c of corners(eave)) up([c[0], wallsTop, c[2]], [rx, ridgeY, c[2] < 0 ? V.z0 + 3 : V.z1 - 3], roofWin, 1);
  for (let k = 1; k < 5; k++) {
    const z = lerp(V.z0 - 1.2, V.z1 + 1.2, k / 5);
    up([eave.x0, wallsTop, z], [rx, lerp(wallsTop, ridgeY, Math.min(1, 1 - Math.abs(z) / 10)), Math.max(V.z0 + 3, Math.min(V.z1 - 3, z))], roofWin, 0);
  }
  rises.push({ ...V, y0: 0, top: wallsTop, t0: wallsWin.t0, t1: wallsWin.t1 });
  sprinkleLit(V, 0, wallsTop, fh, va1 - 0.01, va1 + 0.04, 10);

  // ---- 04 Apartment on plot B: 7 floors with balconies ---------------------------------------------------
  const [ap0, ap1] = TIMELINE.apartment;
  const B = PLOTS.B;
  rectDraw(B, 0, ap0, ap0 + 0.035, 2);
  const AP: Rect = { x0: -9, x1: 9, z0: -9, z1: 9 };
  const aFloors = 7, afh = 3.4, aTop = aFloors * afh;
  const aWin = { y0: 0, top: aTop, t0: ap0 + 0.03, t1: ap1 - 0.02 };
  rectDraw({ x0: AP.x0 - 1, x1: AP.x1 + 1, z0: AP.z0 - 1, z1: AP.z1 + 1 }, 0, ap0 + 0.015, ap0 + 0.04, 1);
  for (const c of corners(AP)) up(c, [c[0], aTop, c[2]], aWin, 2);
  for (let f = 1; f <= aFloors; f++) rectUp(AP, f * afh, aWin, f === aFloors ? 2 : 1);
  for (let k = 1; k < 5; k++) {
    const x = lerp(AP.x0, AP.x1, k / 5);
    const z = lerp(AP.z0, AP.z1, k / 5);
    up([x, 0, AP.z0], [x, aTop, AP.z0], aWin, 0); up([x, 0, AP.z1], [x, aTop, AP.z1], aWin, 0);
    up([AP.x0, 0, z], [AP.x0, aTop, z], aWin, 0); up([AP.x1, 0, z], [AP.x1, aTop, z], aWin, 0);
  }
  for (let f = 1; f <= aFloors; f++) {
    const y = (f - 1) * afh + 0.2;
    for (const [x0, x1] of [[-6.5, -1.5], [1.5, 6.5]] as const) {
      const bl: Rect = { x0, x1, z0: AP.z1, z1: AP.z1 + 1.8 };
      rectUp(bl, y, aWin, 0);
      up([x0, y, bl.z1], [x0, y + 1.1, bl.z1], aWin, 0);
      up([x1, y, bl.z1], [x1, y + 1.1, bl.z1], aWin, 0);
    }
  }
  const aRoof = { y0: aTop, top: aTop + 2.4, t0: aWin.t1, t1: ap1 };
  rectUp({ x0: AP.x0 + 0.6, x1: AP.x1 - 0.6, z0: AP.z0 + 0.6, z1: AP.z1 - 0.6 }, aTop + 0.9, aRoof, 1);
  rectUp({ x0: -3, x1: 3, z0: -3, z1: 3 }, aTop + 2.4, aRoof, 1);
  for (const c of [[-3, -3], [3, -3], [3, 3], [-3, 3]]) up([c[0], aTop, c[1]], [c[0], aTop + 2.4, c[1]], aRoof, 0);
  rises.push({ ...AP, ...aWin });
  sprinkleLit(AP, 0, aTop, afh, ap1 - 0.01, ap1 + 0.05, 26);

  // ---- 05 Commercial tower on plot C: podium, 30 floors, setback crown, spire -----------------------------
  const [tw0, tw1] = TIMELINE.tower;
  const C = PLOTS.C;
  rectDraw(C, 0, tw0, tw0 + 0.03, 2);
  const POD: Rect = { x0: 33, x1: 59, z0: -12, z1: 12 };
  const podTop = 10.8;
  const podWin = { y0: 0, top: podTop, t0: tw0 + 0.025, t1: tw0 + 0.075 };
  for (const c of corners(POD)) up(c, [c[0], podTop, c[2]], podWin, 2);
  for (const y of [3.6, 7.2, podTop]) rectUp(POD, y, podWin, 1);
  for (let k = 1; k < 12; k++) {
    const x = lerp(POD.x0, POD.x1, k / 12);
    up([x, 0, POD.z0], [x, podTop, POD.z0], podWin, 0); up([x, 0, POD.z1], [x, podTop, POD.z1], podWin, 0);
  }
  const T: Rect = { x0: 37, x1: 55, z0: -9, z1: 9 };
  const T2: Rect = { x0: 39.5, x1: 52.5, z0: -6.5, z1: 6.5 };
  const tfh = 3.6, tFloors = 30, setbackAt = 24 * tfh, tTop = tFloors * tfh;
  const tWin = { y0: 0, top: tTop, t0: tw0 + 0.06, t1: tw1 - 0.02 };
  for (const c of corners(T)) up(c, [c[0], setbackAt, c[2]], tWin, 2);
  for (const c of corners(T2)) up([c[0], setbackAt, c[2]], [c[0], tTop, c[2]], tWin, 2);
  for (let f = 1; f <= tFloors; f++) {
    const y = f * tfh;
    rectUp(f <= 24 ? T : T2, y, tWin, f % 5 === 0 ? 2 : 1);
  }
  rectUp(T, setbackAt, tWin, 1);
  for (let k = 1; k < 8; k++) {
    const x = lerp(T.x0, T.x1, k / 8), z = lerp(T.z0, T.z1, k / 8);
    up([x, 0, T.z0], [x, setbackAt, T.z0], tWin, 0); up([x, 0, T.z1], [x, setbackAt, T.z1], tWin, 0);
    up([T.x0, 0, z], [T.x0, setbackAt, z], tWin, 0); up([T.x1, 0, z], [T.x1, setbackAt, z], tWin, 0);
    if (k > 1 && k < 7) {
      const x2 = lerp(T2.x0, T2.x1, (k - 1) / 6), z2 = lerp(T2.z0, T2.z1, (k - 1) / 6);
      up([x2, setbackAt, T2.z0], [x2, tTop, T2.z0], tWin, 0); up([x2, setbackAt, T2.z1], [x2, tTop, T2.z1], tWin, 0);
      up([T2.x0, setbackAt, z2], [T2.x0, tTop, z2], tWin, 0); up([T2.x1, setbackAt, z2], [T2.x1, tTop, z2], tWin, 0);
    }
  }
  const spire = { y0: tTop, top: tTop + 18, t0: tw1 - 0.02, t1: tw1 + 0.005 };
  const cx = (T.x0 + T.x1) / 2;
  up([cx, tTop, 0], [cx, tTop + 18, 0], spire, 2);
  for (const c of [[-2, -2], [2, -2], [2, 2], [-2, 2]]) up([cx + c[0], tTop, c[1]], [cx, tTop + 8, 0], spire, 0);
  rises.push({ ...T, ...tWin, step: { y: setbackAt, rect: T2 } });
  sprinkleLit(T, 0, setbackAt, tfh, tw1 - 0.02, tw1 + 0.05, 90);
  sprinkleLit(T2, setbackAt, tTop, tfh, tw1 - 0.02, tw1 + 0.05, 24);

  // ---- point cloud along every segment -------------------------------------------------------------------
  const pts: World["pts"] = [];
  segs.forEach((s, i) => {
    const len = Math.hypot(s.b[0] - s.a[0], s.b[1] - s.a[1], s.b[2] - s.a[2]);
    const n = Math.max(1, Math.ceil(len / (s.w === 0 ? 3.2 : 1.7)));
    for (let k = 0; k < n; k++) pts.push({ seg: i, u: (k + rand()) / n, j: [(rand() - 0.5) * 0.35, (rand() - 0.5) * 0.35, (rand() - 0.5) * 0.35] });
  });

  const stars: World["stars"] = Array.from({ length: 220 }, () => [rand(), rand(), rand()]);
  return { segs, pts, rises, lit, stars };
}

export type Camera = { cx: number; s: number; yaw: number; shiftX: number };

const KEYS: { p: number; cam: Camera }[] = [
  { p: 0, cam: { cx: -44, s: 0.0108, yaw: 30, shiftX: 0.14 } },
  { p: 0.33, cam: { cx: -44, s: 0.0108, yaw: 34, shiftX: 0.14 } },
  { p: 0.5, cam: { cx: -44, s: 0.0098, yaw: 40, shiftX: 0.14 } },
  { p: 0.56, cam: { cx: -4, s: 0.0074, yaw: 42, shiftX: 0.12 } },
  { p: 0.72, cam: { cx: -2, s: 0.0068, yaw: 44, shiftX: 0.12 } },
  { p: 0.78, cam: { cx: 26, s: 0.0047, yaw: 47, shiftX: 0.1 } },
  { p: 0.94, cam: { cx: 14, s: 0.0020, yaw: 54, shiftX: 0.08 } },
  { p: 1, cam: { cx: 6, s: 0.0019, yaw: 60, shiftX: 0.06 } },
];

export function cameraAt(p: number): Camera {
  const q = clamp01(p);
  for (let i = 0; i < KEYS.length - 1; i++) {
    const a = KEYS[i], b = KEYS[i + 1];
    if (q >= a.p && q <= b.p) {
      const t = b.p === a.p ? 1 : (q - a.p) / (b.p - a.p);
      const e = t * t * (3 - 2 * t);
      return { cx: lerp(a.cam.cx, b.cam.cx, e), s: lerp(a.cam.s, b.cam.s, e), yaw: lerp(a.cam.yaw, b.cam.yaw, e), shiftX: lerp(a.cam.shiftX, b.cam.shiftX, e) };
    }
  }
  return KEYS[KEYS.length - 1].cam;
}

const H_SCALE = 1.35;
const COS30 = Math.cos(Math.PI / 6);

/** Isometric-style projection with a slowly turning camera. */
export function makeProjector(cam: Camera, w: number, h: number) {
  const ref = Math.min(w, h * 1.5);
  const scale = cam.s * ref;
  const yaw = (cam.yaw * Math.PI) / 180;
  const cos = Math.cos(yaw), sin = Math.sin(yaw);
  const rot = (x: number, z: number) => [x * cos - z * sin, x * sin + z * cos] as const;
  const [ox, oz] = rot(cam.cx, 0);
  const baseX = w * (0.5 + cam.shiftX);
  const baseY = h * 0.74;
  return (x: number, y: number, z: number): [number, number] => {
    const [rx, rz] = rot(x, z);
    const dx = rx - ox, dz = rz - oz;
    return [baseX + (dx - dz) * COS30 * scale, baseY + (dx + dz) * 0.5 * 0.62 * scale - y * H_SCALE * scale];
  };
}

const COLORS = ["rgba(150,180,215,0.30)", "rgba(205,225,255,0.62)", "rgba(255,255,255,0.95)"];

/** Draws the whole scene for progress `p`. */
export function renderWorld(ctx: CanvasRenderingContext2D, world: World, w: number, h: number, p: number, time: number) {
  ctx.clearRect(0, 0, w, h);
  const cam = cameraAt(p);
  const P = makeProjector(cam, w, h);

  // stars
  for (const [sx, sy, sz] of world.stars) {
    const a = 0.25 + 0.5 * (0.5 + 0.5 * Math.sin(time * 0.0006 + sz * 40));
    ctx.fillStyle = `rgba(210,225,255,${(a * (0.3 + sz * 0.7)).toFixed(3)})`;
    ctx.fillRect(sx * w, sy * h * 0.8, sz > 0.85 ? 1.6 : 1, sz > 0.85 ? 1.6 : 1);
  }

  // faint ground grid so the scene has a floor
  ctx.strokeStyle = "rgba(120,150,190,0.07)";
  ctx.lineWidth = 1;
  ctx.beginPath();
  for (let x = -110; x <= 110; x += 8) { const [x1, y1] = P(x, 0, -50); const [x2, y2] = P(x, 0, 50); ctx.moveTo(x1, y1); ctx.lineTo(x2, y2); }
  for (let z = -48; z <= 48; z += 8) { const [x1, y1] = P(-110, 0, z); const [x2, y2] = P(110, 0, z); ctx.moveTo(x1, y1); ctx.lineTo(x2, y2); }
  ctx.stroke();

  // segments, batched by brightness
  const fr = world.segs.map((s) => visibleFraction(s, p));
  for (const weight of [0, 1, 2] as const) {
    ctx.strokeStyle = COLORS[weight];
    ctx.lineWidth = weight === 2 ? 1.5 : weight === 1 ? 1 : 0.7;
    ctx.beginPath();
    world.segs.forEach((s, i) => {
      const f = fr[i];
      if (s.w !== weight || f <= 0) return;
      const [x1, y1] = P(s.a[0], s.a[1], s.a[2]);
      const [x2, y2] = P(lerpN(s.a[0], s.b[0], f), lerpN(s.a[1], s.b[1], f), lerpN(s.a[2], s.b[2], f));
      ctx.moveTo(x1, y1);
      ctx.lineTo(x2, y2);
    });
    ctx.stroke();
  }

  // point cloud: the dots along each line, brighter near a rising front
  ctx.fillStyle = "rgba(190,215,255,0.8)";
  for (const pt of world.pts) {
    const s = world.segs[pt.seg];
    const f = fr[pt.seg];
    if (f <= 0 || pt.u > f) continue;
    const [x, y] = P(lerpN(s.a[0], s.b[0], pt.u) + pt.j[0], lerpN(s.a[1], s.b[1], pt.u) + pt.j[1], lerpN(s.a[2], s.b[2], pt.u) + pt.j[2]);
    ctx.fillRect(x, y, 1.3, 1.3);
  }

  // soft glass faces up to the height a building has reached, so each one reads as a solid
  for (const r of world.rises) {
    if (p <= r.t0) continue;
    const hh = riseHeight(r, p);
    const faces = (rect: Rect, yA: number, yB: number) => {
      if (yB <= yA) return;
      const q = [[rect.x0, rect.z0], [rect.x1, rect.z0], [rect.x1, rect.z1], [rect.x0, rect.z1]];
      ctx.beginPath();
      for (let i = 0; i < 4; i++) {
        const [xa, za] = q[i], [xb, zb] = q[(i + 1) % 4];
        const pts = [P(xa, yA, za), P(xb, yA, zb), P(xb, yB, zb), P(xa, yB, za)];
        pts.forEach(([x, y], k) => (k ? ctx.lineTo(x, y) : ctx.moveTo(x, y)));
        ctx.closePath();
      }
      ctx.fill();
    };
    ctx.fillStyle = "rgba(110,160,230,0.05)";
    if (r.step) {
      faces(r, 0, Math.min(hh, r.step.y));
      faces(r.step.rect, r.step.y, hh);
    } else faces(r, 0, hh);
  }

  // scanning ring at the height a building has reached
  for (const r of world.rises) {
    const k = (p - r.t0) / (r.t1 - r.t0);
    if (k <= 0 || k >= 1) continue;
    const y = riseHeight(r, p);
    const m = 1.4;
    const f = r.step && y > r.step.y ? r.step.rect : r;
    const c = [P(f.x0 - m, y, f.z0 - m), P(f.x1 + m, y, f.z0 - m), P(f.x1 + m, y, f.z1 + m), P(f.x0 - m, y, f.z1 + m)];
    ctx.strokeStyle = "rgba(120,215,255,0.65)";
    ctx.lineWidth = 1.2;
    ctx.beginPath();
    c.forEach(([x, yy], i) => (i ? ctx.lineTo(x, yy) : ctx.moveTo(x, yy)));
    ctx.closePath();
    ctx.stroke();
    ctx.fillStyle = "rgba(120,215,255,0.07)";
    ctx.fill();
  }

  drawCrane(ctx, world, P, p);

  // lit windows switch on once a building is finished
  for (const l of world.lit) {
    const a = clamp01((p - l.t) / 0.02);
    if (a <= 0) continue;
    const [x, y] = P(l.p[0], l.p[1], l.p[2]);
    ctx.fillStyle = `rgba(255,214,150,${(0.85 * a * (0.75 + 0.25 * Math.sin(time * 0.002 + l.t * 90))).toFixed(3)})`;
    ctx.fillRect(x - 1, y - 1, 2.4, 2.4);
  }
}

const lerpN = lerp;

/** A tower crane that climbs with the tower, then lifts away when it is complete. */
function drawCrane(ctx: CanvasRenderingContext2D, world: World, P: ReturnType<typeof makeProjector>, p: number) {
  const tower = world.rises[world.rises.length - 1];
  const [tw0, tw1] = TIMELINE.tower;
  if (p < tw0 + 0.04 || p > tw1 + 0.03) return;
  const h = riseHeight(tower, p);
  const fade = 1 - clamp01((p - (tw1 - 0.005)) / 0.035);
  const mastX = 60, mastZ = -13;
  const top = h + 9;
  ctx.strokeStyle = `rgba(255,205,120,${(0.75 * fade).toFixed(3)})`;
  ctx.lineWidth = 1.1;
  ctx.beginPath();
  const m = (x: number, y: number, z: number) => P(x, y, z);
  for (const dz of [-0.9, 0.9]) {
    const [x1, y1] = m(mastX, 0, mastZ + dz), [x2, y2] = m(mastX, top, mastZ + dz);
    ctx.moveTo(x1, y1); ctx.lineTo(x2, y2);
  }
  for (let y = 0, flip = 0; y < top; y += 2.4, flip++) {
    const [x1, y1] = m(mastX, y, mastZ + (flip % 2 ? 0.9 : -0.9));
    const [x2, y2] = m(mastX, Math.min(top, y + 2.4), mastZ + (flip % 2 ? -0.9 : 0.9));
    ctx.moveTo(x1, y1); ctx.lineTo(x2, y2);
  }
  const jibEnd = 36, counter = 68;
  const [j1, j2] = m(mastX, top + 1.2, mastZ), [j3, j4] = m(jibEnd, top + 1.2, mastZ);
  ctx.moveTo(j1, j2); ctx.lineTo(j3, j4);
  const [c1, c2] = m(counter, top + 1.2, mastZ);
  ctx.moveTo(j1, j2); ctx.lineTo(c1, c2);
  const [a1, a2] = m(mastX, top + 5, mastZ);
  ctx.moveTo(a1, a2); ctx.lineTo(j3, j4); ctx.moveTo(a1, a2); ctx.lineTo(c1, c2); ctx.moveTo(j1, j2); ctx.lineTo(a1, a2);
  const hookX = 46, hookY = Math.max(h + 2, 4);
  const [h1, h2] = m(hookX, top + 1.2, mastZ), [h3, h4] = m(hookX, hookY, mastZ);
  ctx.moveTo(h1, h2); ctx.lineTo(h3, h4);
  ctx.stroke();
  ctx.fillStyle = `rgba(255,205,120,${(0.9 * fade).toFixed(3)})`;
  ctx.fillRect(h3 - 2, h4, 4, 4);
}
