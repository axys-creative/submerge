import { clamp, lerp, mixColor, waveY } from '../util';

const hash = (n: number, salt = 0) => {
  const v = Math.sin(n * 127.1 + salt * 311.7) * 43758.5453;
  return v - Math.floor(v);
};

const tri = (v: number) => 1 - Math.abs(2 * (v - Math.floor(v)) - 1);

const NIGHT = '#0B1430';
const dim = (c: string, night: number) => mixColor(c, NIGHT, night * 0.7);

/** Half the width of the view at the surface in px: the range's first slope sits just past the right edge when the camera is at the zone's `peaks` position. */
const HALF_VIEW = 520;

/** How far in px along the range its first slope takes to rise to full height; the shape is fixed to the layer, so it never grows or shrinks as the camera moves. */
const RANGE_RAMP = 900;

interface MountainLayer {
  /** Share of the camera's sideways motion the layer follows. */
  p: number;
  height: number;
  wave: number;
  haze: number;
  seed: number;
}

const MOUNTAINS: MountainLayer[] = [
  { p: 0.22, height: 250, wave: 780, haze: 0.6, seed: 3 },
  { p: 0.4, height: 170, wave: 520, haze: 0.38, seed: 8 },
];

const ridge = (c: number, L: MountainLayer) =>
  (0.55 * tri(c / L.wave + hash(L.seed) * 9) ** 1.25 + 0.3 * tri(c / (L.wave * 0.43) + hash(L.seed, 1) * 9) + 0.15 * tri(c / (L.wave * 0.19) + hash(L.seed, 2) * 9)) * L.height;

/** Snow-capped mountains on the horizon; the right face of each peak is in shade. */
function drawMountains(ctx: CanvasRenderingContext2D, left: number, right: number, camX: number, haze: string, night: number, start: number) {
  const STEP = 10;
  for (const L of MOUNTAINS) {
    const shift = camX * (1 - L.p);
    const c0 = Math.floor((left - 40 - shift) / STEP) * STEP;
    const c1 = right + 40 - shift;
    const pts: [number, number][] = [];
    for (let c = c0; c <= c1; c += STEP) pts.push([c + shift, ridge(c, L) * Math.min(1, Math.max(0, (c - (HALF_VIEW + L.p * start)) / RANGE_RAMP))]);
    const body = dim(mixColor('#9DB9DE', haze, L.haze), night);
    const snow = dim(mixColor('#FFFFFF', haze, L.haze * 0.5), night);
    const fill = ctx.createLinearGradient(0, -L.height, 0, 0);
    fill.addColorStop(0, snow);
    fill.addColorStop(0.45, snow);
    fill.addColorStop(0.62, body);
    fill.addColorStop(1, mixColor(body, haze, 0.5));
    ctx.fillStyle = fill;
    ctx.beginPath();
    ctx.moveTo(pts[0][0], 10);
    for (const [x, h] of pts) ctx.lineTo(x, -h);
    ctx.lineTo(pts[pts.length - 1][0], 10);
    ctx.closePath();
    ctx.fill();

    ctx.fillStyle = dim(mixColor('#5D86BC', haze, L.haze), night).replace('rgb(', 'rgba(').replace(')', ',0.3)');
    for (let i = 1; i < pts.length - 1; i++) {
      if (!(pts[i][1] > pts[i - 1][1] && pts[i][1] >= pts[i + 1][1]) || pts[i][1] < L.height * 0.3) continue;
      let j = i;
      while (j + 1 < pts.length && pts[j + 1][1] < pts[j][1]) j++;
      ctx.beginPath();
      ctx.moveTo(pts[i][0], -pts[i][1]);
      for (let k = i + 1; k <= j; k++) ctx.lineTo(pts[k][0], -pts[k][1]);
      ctx.lineTo(pts[j][0], 6);
      ctx.lineTo(pts[i][0], 6);
      ctx.closePath();
      ctx.fill();
    }
  }
}

interface BergShape {
  top: [number, number][];
  hull: [number, number][];
}

const shapes = new Map<string, BergShape>();

/** An iceberg's outline: a jagged tip above the waterline and a wider, tapering mass below it, both centered on x = 0. */
function bergShape(seed: number, w: number, h: number, deep: number): BergShape {
  const key = `${seed}|${w}|${h}|${deep}`;
  let s = shapes.get(key);
  if (s) return s;
  const n = 5 + Math.floor(hash(seed, 1) * 3);
  const crown = Math.max(1, Math.min(n - 2, Math.round(n / 2 + (hash(seed, 2) - 0.5) * 2)));
  const top: [number, number][] = [[-w / 2, 0]];
  for (let i = 0; i < n; i++) {
    const u = (i + 0.5) / n;
    const x = -w / 2 + u * w + (hash(seed, 10 + i) - 0.5) * (w / n) * 0.5;
    const lift = i === crown ? 1 : 0.45 + hash(seed, 20 + i) * 0.45;
    const edge = 1.05 - Math.abs(2 * u - 1) * 0.6;
    top.push([x - (w / n) * 0.18, -h * lift * edge * 0.55]);
    top.push([x + (w / n) * 0.12, -h * lift * edge]);
  }
  top.push([w / 2, 0]);
  const hs = w / 2;
  const prof = (u: number) => (u < 0.14 ? 1 + 0.12 * (u / 0.14) : 1.12 * (1 - ((u - 0.14) / 0.86) * 0.86));
  const side = (dir: number, k: number) =>
    Array.from({ length: 8 }, (_, i) => {
      const u = 0.1 + i * 0.1;
      return [dir * hs * prof(u) * (1 + (hash(seed, 40 + i + k) - 0.5) * 0.16), deep * u] as [number, number];
    });
  const bw = hs * prof(0.8);
  const bottom: [number, number][] = [
    [bw * 0.9, deep * 0.82],
    [bw * 0.55, deep * (0.9 + 0.1 * hash(seed, 61))],
    [bw * 0.25, deep * 0.86],
    [-bw * 0.05, deep],
    [-bw * 0.4, deep * 0.87],
    [-bw * 0.7, deep * (0.9 + 0.08 * hash(seed, 62))],
    [-bw * 0.95, deep * 0.82],
  ];
  const hull: [number, number][] = [[-hs, 0], ...side(-1, 20), ...[...bottom].reverse(), ...side(1, 0).reverse(), [hs, 0]];
  s = { top, hull };
  shapes.set(key, s);
  return s;
}

const FACET_TONES = ['#FFFFFF', '#E4F6FF', '#BFE8F8', '#8CCBEF', '#5FA9E4', '#3F86D2'];

/** Fills the current clip with slanted vertical bands in different shades of white and blue, like the faces of a cut crystal; bands toward the left run darker. `taper` pulls the bands toward the middle at the bottom. */
function drawFacets(ctx: CanvasRenderingContext2D, seed: number, hs: number, yTop: number, yBot: number, n: number, night: number, alpha: number, taper: number) {
  const step = (hs * 2) / n;
  const ym = (yTop + yBot) / 2;
  const edge = (k: number): [number, number, number] => {
    if (k === 0) return [-hs * 1.4, -hs * 1.4, -hs * 1.4];
    if (k === n) return [hs * 1.4, hs * 1.4, hs * 1.4];
    const x = -hs + k * step + (hash(seed, 200 + k) - 0.5) * step * 0.7;
    return [x, x * (1 - taper * 0.5) + (hash(seed, 230 + k) - 0.5) * step * 0.5, x * (1 - taper) + (hash(seed, 260 + k) - 0.5) * step * 0.5];
  };
  ctx.globalAlpha = alpha;
  let a = edge(0);
  for (let k = 1; k <= n; k++) {
    const b = edge(k);
    const tone = Math.min(0.999, hash(seed, 300 + k) * 0.65 + (1 - k / n) * 0.35);
    ctx.fillStyle = dim(FACET_TONES[Math.floor(tone * FACET_TONES.length)], night);
    ctx.beginPath();
    ctx.moveTo(a[0], yTop);
    ctx.lineTo(a[1], ym);
    ctx.lineTo(a[2], yBot);
    ctx.lineTo(b[2], yBot);
    ctx.lineTo(b[1], ym);
    ctx.lineTo(b[0], yTop);
    ctx.closePath();
    ctx.fill();
    a = b;
  }
  ctx.globalAlpha = 1;
}

/** The color an iceberg is filled with from its crown down to its tip, one gradient across the waterline so the two halves match. */
function bergBase(ctx: CanvasRenderingContext2D, h: number, deep: number, night: number) {
  const f = h / (h + deep);
  const g = ctx.createLinearGradient(0, -h, 0, deep);
  g.addColorStop(0, dim('#FFFFFF', night));
  g.addColorStop(f * 0.55, dim('#DDF3FF', night));
  g.addColorStop(f, dim('#A9E6F7', night));
  g.addColorStop(1, dim('#86D2EE', night));
  return g;
}

const bergFacets = (w: number) => Math.round(clamp(w / 30, 4, 14));

/** Moves an outline inward by `rim` px along its own edges' normals (the two end points, which sit on the waterline, move sideways), so the inner edge always stays inside the outline however jagged it is. */
function insetRim(pts: [number, number][], rim: number): [number, number][] {
  const n = pts.length;
  let area = 0;
  for (let i = 0; i < n; i++) {
    const j = (i + 1) % n;
    area += pts[i][0] * pts[j][1] - pts[j][0] * pts[i][1];
  }
  const sg = area >= 0 ? 1 : -1;
  const normal = (a: [number, number], b: [number, number]) => {
    const dx = b[0] - a[0];
    const dy = b[1] - a[1];
    const m = Math.hypot(dx, dy) || 1;
    return [(-sg * dy) / m, (sg * dx) / m];
  };
  return pts.map((p, i) => {
    if (i === 0) return [p[0] + rim, p[1]];
    if (i === n - 1) return [p[0] - rim, p[1]];
    const a = normal(pts[i - 1], p);
    const b = normal(p, pts[i + 1]);
    const d = Math.max(0.35, 1 + a[0] * b[0] + a[1] * b[1]);
    let vx = (a[0] + b[0]) / d;
    let vy = (a[1] + b[1]) / d;
    const m = Math.hypot(vx, vy);
    if (m > 2) {
      vx = (vx / m) * 2;
      vy = (vy / m) * 2;
    }
    return [p[0] + vx * rim, p[1] + vy * rim];
  });
}

/** The part of an iceberg above the water, drawn with its base at y = 0. */
function drawBergTip(ctx: CanvasRenderingContext2D, seed: number, w: number, h: number, deep: number, night: number) {
  const { top } = bergShape(seed, w, h, 0);
  const rim = clamp(deep * 0.025, 2, 16);
  const core = insetRim(top, rim);
  const shape = (pts: [number, number][]) => {
    ctx.beginPath();
    ctx.moveTo(pts[0][0], 8);
    for (const [x, y] of pts) ctx.lineTo(x, y);
    ctx.lineTo(pts[pts.length - 1][0], 8);
    ctx.closePath();
  };
  ctx.fillStyle = dim('#F2FDFF', night).replace('rgb(', 'rgba(').replace(')', ',0.78)');
  shape(top);
  ctx.fill();
  ctx.fillStyle = bergBase(ctx, h, deep, night);
  shape(core);
  ctx.fill();
  ctx.save();
  shape(core);
  ctx.clip();
  drawFacets(ctx, seed + 500, w / 2, -h, deep, bergFacets(w), night, 0.62, 0.55);
  ctx.restore();
  ctx.strokeStyle = dim('#EAFBFF', night).replace('rgb(', 'rgba(').replace(')', ',0.6)');
  ctx.lineWidth = 3;
  ctx.lineJoin = 'round';
  ctx.beginPath();
  top.forEach(([x, y], i) => (i ? ctx.lineTo(x, y) : ctx.moveTo(x, y)));
  ctx.stroke();
}

/** The mass of an iceberg under the water, a pale glassy cyan that fades with depth, drawn from y = 0 down. */
function drawBergHull(ctx: CanvasRenderingContext2D, seed: number, w: number, h: number, deep: number, night: number) {
  const { hull } = bergShape(seed, w, 1, deep);
  const glass = ctx.createLinearGradient(0, 0, 0, deep);
  glass.addColorStop(0, dim('#F2FDFF', night).replace('rgb(', 'rgba(').replace(')', ',0.78)'));
  glass.addColorStop(0.5, dim('#A5E8FA', night).replace('rgb(', 'rgba(').replace(')', ',0.42)'));
  glass.addColorStop(1, dim('#7FD2F0', night).replace('rgb(', 'rgba(').replace(')', ',0.14)'));
  ctx.fillStyle = glass;
  ctx.beginPath();
  hull.forEach(([x, y], i) => (i ? ctx.lineTo(x, y) : ctx.moveTo(x, y)));
  ctx.closePath();
  ctx.fill();

  const rim = clamp(deep * 0.025, 2, 16);
  const core = insetRim(hull, rim);
  ctx.fillStyle = bergBase(ctx, h, deep, night);
  ctx.beginPath();
  core.forEach(([x, y], i) => (i ? ctx.lineTo(x, y) : ctx.moveTo(x, y)));
  ctx.closePath();
  ctx.fill();
  ctx.save();
  ctx.clip();
  drawFacets(ctx, seed + 500, w / 2, -h, deep, bergFacets(w), night, 0.62, 0.55);
  ctx.restore();

  ctx.strokeStyle = dim('#EAFBFF', night).replace('rgb(', 'rgba(').replace(')', ',0.6)');
  ctx.lineWidth = 3;
  ctx.lineJoin = 'round';
  ctx.beginPath();
  hull.forEach(([x, y], i) => (i ? ctx.lineTo(x, y) : ctx.moveTo(x, y)));
  ctx.stroke();
}

interface Berg {
  x: number;
  w: number;
  h: number;
  deep: number;
  seed: number;
}

const BERG_PARALLAX = 0.5;
const GROWLER_SPACING = 520;

/** A gentle drift for an iceberg in the swell: the bigger it is, the slower and the smaller the motion, so floes bob quickly and far while the great berg barely sways. */
function bob(seed: number, w: number, t: number) {
  const k = clamp(1 - w / 800, 0.15, 1);
  const a = (t / (11 - 7 * k)) * Math.PI * 2 + hash(seed, 400) * Math.PI * 2;
  return { x: Math.sin(a * 0.77 + 1.3) * (2 + 6 * k), y: Math.sin(a) * (2 + 5 * k), r: Math.sin(a * 0.9 + 2.1) * (0.004 + 0.045 * k) };
}

function applyBob(ctx: CanvasRenderingContext2D, seed: number, w: number, t: number) {
  const b = bob(seed, w, t);
  ctx.translate(b.x, b.y);
  ctx.rotate(b.r);
}

/** The icebergs standing on the horizon for the camera at camX, with their world x. */
function bergsAt(at: [number, number][], camX: number): Berg[] {
  return at.map(([ax, size], i) => ({
    x: ax * BERG_PARALLAX + camX * (1 - BERG_PARALLAX),
    w: (300 + hash(i, 3) * 340) * size,
    h: (80 + hash(i, 4) * 110) * size,
    deep: (380 + hash(i, 5) * 360) * size,
    seed: i + 1,
  }));
}

/** The big decorative iceberg in the middle of the zone: a tall crown of ice at the real waterline with a deep mass under it. It sits behind the ship and sub, which pass straight through it. */
const giantBerg = (giant: { x: number; half: number }): Berg => ({ x: giant.x, w: giant.half * 2, h: 300, deep: 1100, seed: 77 });

/** Small lumps of floating ice riding the waves at the real waterline. */
function growlers(left: number, right: number, giant?: { x: number; half: number }, from = 0, shelf?: { x0: number; x1: number }) {
  const out: Berg[] = [];
  for (let c = Math.floor((left - 100) / GROWLER_SPACING); c <= Math.floor((right + 100) / GROWLER_SPACING); c++) {
    if (hash(c, 7) < 0.35) continue;
    const gx = c * GROWLER_SPACING + hash(c, 9) * GROWLER_SPACING;
    if (gx < from || (giant && Math.abs(gx - giant.x) < giant.half + 80) || (shelf && gx > shelf.x0 - 250 && gx < shelf.x1 + 250)) continue;
    const w = 40 + hash(c, 8) * 60;
    out.push({ x: gx, w, h: 9 + hash(c, 11) * 14, deep: w * 0.55, seed: 100 + (c & 255) });
  }
  return out;
}

/** Everything polar that sits above the water: icy mountains, big icebergs on the horizon and small floes. Call before the water body so the sea covers their feet. */
export function drawPolarSky(ctx: CanvasRenderingContext2D, left: number, right: number, camX: number, t: number, haze: string, night: number, bergs: [number, number][], rangeStart = 0) {
  drawMountains(ctx, left, right, camX, haze, night, rangeStart);
  for (const b of bergsAt(bergs, camX)) {
    if (b.x + b.w < left || b.x - b.w > right) continue;
    ctx.save();
    ctx.translate(b.x, 0);
    applyBob(ctx, b.seed, b.w, t);
    drawBergTip(ctx, b.seed, b.w, b.h, b.deep, night);
    ctx.restore();
  }
}

/** The submerged part of those icebergs, drawn over the water body and behind the sea floor. */
export function drawPolarUnder(ctx: CanvasRenderingContext2D, left: number, right: number, camX: number, t: number, shade: string, night: number, bergs: [number, number][]) {
  for (const b of bergsAt(bergs, camX)) {
    if (b.x + b.w < left || b.x - b.w > right) continue;
    ctx.save();
    ctx.translate(b.x, 0);
    applyBob(ctx, b.seed, b.w, t);
    drawBergHull(ctx, b.seed, b.w, b.h, b.deep, night);
    ctx.restore();
  }
}

/** Small floes of ice riding the waves at the waterline; drawn over the ship, which sails through them. */
export function drawPolarFloes(ctx: CanvasRenderingContext2D, left: number, right: number, t: number, shade: string, night: number, giant?: { x: number; half: number }, iceFrom = 0, shelf?: { x0: number; x1: number }) {
  for (const g of growlers(left, right, giant, iceFrom, shelf)) {
    ctx.save();
    ctx.translate(g.x, waveY(g.x, t) * 0.8 + 2);
    applyBob(ctx, g.seed, g.w, t);
    drawBergHull(ctx, g.seed, g.w, g.h, g.deep, night);
    drawBergTip(ctx, g.seed, g.w, g.h, g.deep, night);
    ctx.restore();
  }
}

/**
 * The big decorative iceberg, drawn over everything else in the scene including the lights, so nothing shows through it: its underwater mass first, then the crown.
 * `dark` repeats the scene's depth and night darkness over the underwater part, since the lighting pass has already run.
 */
export function drawPolarGiant(ctx: CanvasRenderingContext2D, left: number, right: number, t: number, night: number, giant: { x: number; half: number }, dark: { startPx: number; fullPx: number; rgb: string }) {
  if (giant.x + giant.half < left || giant.x - giant.half > right) return;
  const b = giantBerg(giant);
  ctx.save();
  ctx.translate(b.x, 0);
  applyBob(ctx, b.seed, b.w, t);
  drawBergHull(ctx, b.seed, b.w, b.h, b.deep, night);
  const { hull } = bergShape(b.seed, b.w, 1, b.deep);
  ctx.save();
  ctx.beginPath();
  hull.forEach(([x, y], i) => (i ? ctx.lineTo(x, y) : ctx.moveTo(x, y)));
  ctx.closePath();
  ctx.clip();
  const top = -16;
  const g = ctx.createLinearGradient(0, top, 0, dark.fullPx);
  g.addColorStop(0, `rgba(${dark.rgb},0)`);
  g.addColorStop(clamp((lerp(dark.startPx, 30, night) - top) / (dark.fullPx - top), 0, 1), `rgba(${dark.rgb},${0.55 * night})`);
  g.addColorStop(1, `rgba(${dark.rgb},1)`);
  ctx.fillStyle = g;
  ctx.fillRect(-b.w, top, b.w * 2, b.deep + 40);
  ctx.restore();
  drawBergTip(ctx, b.seed, b.w, b.h, b.deep, night);
  ctx.restore();
}

/** Clips to the big iceberg's outline, crown and underwater mass together, so the surface water can be drawn over it again. */
export function clipToGiant(ctx: CanvasRenderingContext2D, giant: { x: number; half: number }, t: number) {
  const b = giantBerg(giant);
  const { top, hull } = bergShape(b.seed, b.w, b.h, b.deep);
  const m = bob(b.seed, b.w, t);
  const cos = Math.cos(m.r);
  const sin = Math.sin(m.r);
  const at = (x: number, y: number): [number, number] => [b.x + m.x + x * cos - y * sin, m.y + x * sin + y * cos];
  const trace = (pts: [number, number][]) => pts.forEach(([x, y], i) => ctx[i ? 'lineTo' : 'moveTo'](...at(x, y)));
  ctx.beginPath();
  trace(hull);
  ctx.closePath();
  trace([[top[0][0], 8], ...top, [top[top.length - 1][0], 8]]);
  ctx.closePath();
  ctx.clip();
}

/** How far in px behind the shelf's end the far wall's root sits. */
const SHELF_SHOULDER = 380;
/** How far in px the shelf's face leans outward from the waterline to the top, and how many points trace it. */
const SHELF_LEAN = 90;
const SHELF_FACE_STEPS = 18;
/** Points tracing each end's face below the water, which carries on at the same angle as above it. */
const SHELF_DEEP_STEPS = 44;
/** How deep in px the shelf's underside is at its shallowest. */
const SHELF_BASE = 7600;
/** The underside steps down from the depth where each end's V face stops to the middle, where it is deepest. */
const SHELF_EDGE_DEPTH = 3400;
const SHELF_MID_DEPTH = 8600;

const shelfShapes = new Map<string, [number, number][]>();

/** The shelf's whole outline in world coordinates: a gently rolling top with rounded shoulders, rounded ends, and an underside that steps down in jagged ledges from the edges to the deep middle. */
export function shelfPolygon(shelf: { x0: number; x1: number; height: number }): [number, number][] {
  const key = `${shelf.x0}|${shelf.x1}|${shelf.height}`;
  const hit = shelfShapes.get(key);
  if (hit) return hit;
  const { x0, x1, height: H } = shelf;
  const E = Math.round((SHELF_EDGE_DEPTH * SHELF_LEAN) / H);
  const xa = x0 + E;
  const xb = x1 - E;
  const mounds: { p: number; w: number; h: number }[] = [];
  for (let x = x0; x < x1; x += 130 + hash(x, 8) * 160) mounds.push({ p: x, w: 80 + hash(x, 9) * 130, h: 6 + hash(x, 10) * 20 });
  const flat = (x: number) => {
    const edge = Math.min(1, (x - (x0 - SHELF_LEAN)) / 220, (x1 + SHELF_LEAN - x) / 220);
    const waves = 11 * Math.sin(x * 0.0021 + 1) + 7 * Math.sin(x * 0.0057 + 2) + 5 * Math.sin(x * 0.013 + 0.5) + 3 * Math.sin(x * 0.031);
    const mound = mounds.reduce((m, k) => Math.max(m, k.h * (0.5 + 0.5 * Math.cos(Math.PI * Math.min(1, Math.abs(x - k.p) / k.w)))), 0);
    return Math.max(0, edge) * (waves - mound);
  };
  const rise = (v: number) => {
    const u = Math.min(1, Math.max(0, v));
    return u * u * (3 - 2 * u);
  };
  const stair = (d: number) => 0.26 * rise((d - 150) / 280) + 0.32 * rise((d - 640) / 300) + 0.42 * rise((d - 1180) / 460);
  const swing = (x: number) => {
    const into = smooth01((Math.min(x - xa, xb - x) - 1500) / 900);
    const t = x - xa;
    return into * (4300 * (0.5 - 0.5 * Math.cos((2 * Math.PI * t) / 4200)) + 1400 * Math.sin(t * 0.0021 + 1) ** 2);
  };
  const humps: { p: number; w: number; h: number }[] = [];
  for (let x = xa + 110; x < xb - 100; x += 150 + hash(x, 3) * 170) {
    const inward = Math.min(1, Math.min(x - xa, xb - x) / 1600);
    humps.push({ p: x, w: 120 + hash(x, 4) * 200, h: 60 + hash(x, 5) * 140 + 260 * inward * hash(x, 6) });
  }
  const under = (x: number) => {
    const base = SHELF_EDGE_DEPTH + (SHELF_MID_DEPTH - SHELF_EDGE_DEPTH) * stair(Math.max(0, Math.min(x - xa, xb - x)));
    const bump = humps.reduce((d, k) => Math.max(d, k.h * (0.5 + 0.5 * Math.cos(Math.PI * Math.min(1, Math.abs(x - k.p) / k.w)))), 0);
    return base + bump + 50 * Math.sin(x * 0.0047) + 30 * Math.sin(x * 0.013 + 2) - swing(x);
  };
  const pts: [number, number][] = [];
  const bumpy = (u: number, k: number) => Math.min(1, u * 5) * (5 * Math.sin(u * 23 + k) + 3 * Math.sin(u * 53 + k * 2.1));
  const lumpy = (u: number, k: number) => Math.min(1, u * 6) * (26 * Math.sin(u * 15 + k) + 15 * Math.sin(u * 38 + k * 2.3) + 7 * Math.sin(u * 83 + k * 1.7));
  const CORNER = 3;
  for (let i = 0; i <= SHELF_FACE_STEPS; i++) {
    const u = i / SHELF_FACE_STEPS;
    pts.push([x0 - SHELF_LEAN * u + bumpy(u, 1), -(H - CORNER) * u]);
  }
  for (let k = 1; k <= 3; k++) {
    const a = Math.PI + (k * (Math.PI / 2)) / 3;
    pts.push([x0 - SHELF_LEAN + CORNER + bumpy(1, 1) + CORNER * Math.cos(a), -H + CORNER + CORNER * Math.sin(a)]);
  }
  for (let x = x0 - SHELF_LEAN + 20; x < x1 + SHELF_LEAN - 20; x += 20) pts.push([x, -H + flat(x)]);
  for (let k = 0; k <= 3; k++) {
    const a = Math.PI * 1.5 + (k * (Math.PI / 2)) / 3;
    pts.push([x1 + SHELF_LEAN - CORNER + bumpy(1, 2) + CORNER * Math.cos(a), -H + CORNER + CORNER * Math.sin(a)]);
  }
  for (let i = SHELF_FACE_STEPS; i >= 0; i--) {
    const u = i / SHELF_FACE_STEPS;
    pts.push([x1 + SHELF_LEAN * u + bumpy(u, 2), -(H - CORNER) * u]);
  }
  const dr = under(xb);
  for (let i = 1; i <= SHELF_DEEP_STEPS; i++) {
    const u = i / SHELF_DEEP_STEPS;
    pts.push([x1 - E * u - lumpy(u, 3), dr * u]);
  }
  for (let x = xb - 20; x >= xa; x -= 20) pts.push([x, under(x)]);
  const dl = under(xa);
  for (let i = SHELF_DEEP_STEPS; i >= 0; i--) {
    const u = i / SHELF_DEEP_STEPS;
    pts.push([x0 + E * u + lumpy(u, 4), dl * u]);
  }
  shelfShapes.set(key, pts);
  return pts;
}

/** True when (x, y) lies inside the shelf's ice (ignoring its tunnels). */
export function shelfContains(shelf: { x0: number; x1: number; height: number }, x: number, y: number): boolean {
  if (x < shelf.x0 || x > shelf.x1) return false;
  const poly = shelfPolygon(shelf);
  let inside = false;
  for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) {
    const [xi, yi] = poly[i];
    const [xj, yj] = poly[j];
    if (yi > y !== yj > y && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi) inside = !inside;
  }
  return inside;
}

const shelfCanvas = document.createElement('canvas');

/** Layer colors from the shelf's top down to its underside, day tones. */
const SHELF_TONES: [number, string][] = [[-1e9, '#DDEFFA'], [0, '#AFD7EF'], [1150, '#9ECCE8'], [6630, '#82B8E0'], [11200, '#6AA3D2']];

/** Fills a gradient running from `height` px above the waterline down to `deepest` px below it with the shelf's colors, which sit at fixed depths whatever the shelf's height. */
function shelfColors(g: CanvasGradient, height: number, deepest: number, night: number) {
  for (const [y, c] of SHELF_TONES) g.addColorStop(clamp((y + height) / (deepest + height), 0, 1), dim(c, night));
}

/**
 * An ice shelf drawn in world coordinates (the world transform must be set): a rounded slab of ice that stands above the water and hangs below it, with the tunnels of its cave cut through.
 * Its look is soft: a smooth gradient with blurry flows of lighter and darker ice and a few thin cracks, never a grid.
 */
export function drawShelf(
  ctx: CanvasRenderingContext2D,
  view: { left: number; right: number; top: number; bottom: number },
  shelf: { x0: number; x1: number; height: number },
  blobs: { x: number; y: number; r: number }[],
  night: number,
  water: string,
  ground: string,
) {
  const { x0, x1, height } = shelf;
  if (view.right < x0 - 40 || view.left > x1 + 40 || view.bottom < -height - 20) return;
  const poly = shelfPolygon(shelf);
  const inRange = blobs.filter((b) => b.x + b.r > view.left && b.x - b.r < view.right && b.y + b.r > view.top && b.y - b.r < view.bottom);
  const deepest = SHELF_BASE + 3600;
  const path = (c2: CanvasRenderingContext2D) => {
    c2.beginPath();
    poly.forEach(([x, y], i) => (i ? c2.lineTo(x, y) : c2.moveTo(x, y)));
    c2.closePath();
  };

  const off = shelfCanvas;
  if (off.width !== ctx.canvas.width || off.height !== ctx.canvas.height) {
    off.width = ctx.canvas.width;
    off.height = ctx.canvas.height;
  }
  const oc = off.getContext('2d')!;
  oc.setTransform(1, 0, 0, 1, 0, 0);
  oc.globalCompositeOperation = 'source-over';
  oc.clearRect(0, 0, off.width, off.height);
  oc.setTransform(ctx.getTransform());

  const base = oc.createLinearGradient(0, -height, 0, deepest);
  shelfColors(base, height, deepest, night);
  oc.fillStyle = base;
  path(oc);
  oc.fill();

  oc.save();
  path(oc);
  oc.clip();
  const cell = 110;
  for (let c = Math.floor(Math.max(x0, view.left - 200) / cell); c <= Math.floor(Math.min(x1, view.right + 200) / cell); c++) {
    for (let k = 0; k < 3; k++) {
      const seed = c * 3 + k;
      const cx = c * cell + hash(seed, 71) * cell;
      const len = 260 + hash(seed, 72) * 1500;
      const top = -height + hash(seed, 73) * (deepest + height - len * 0.5);
      if (top > view.bottom || top + len < view.top) continue;
      const wide = 26 + hash(seed, 74) * 120;
      const lean = (hash(seed, 75) - 0.5) * wide * 2;
      const light = hash(seed, 76) > 0.45;
      oc.fillStyle = light ? dim('#FFFFFF', night).replace('rgb(', 'rgba(').replace(')', ',0.2)') : dim('#4F8FC8', night).replace('rgb(', 'rgba(').replace(')', ',0.16)');
      oc.beginPath();
      oc.moveTo(cx, top);
      oc.quadraticCurveTo(cx + wide + lean, top + len * 0.45, cx + lean, top + len);
      oc.quadraticCurveTo(cx - wide + lean, top + len * 0.5, cx, top);
      oc.fill();
    }
    if (hash(c, 77) > 0.55) {
      const cx = c * cell + hash(c, 78) * cell;
      const top = -height + hash(c, 79) * 9000;
      oc.strokeStyle = dim('#5E9AD0', night).replace('rgb(', 'rgba(').replace(')', ',0.3)');
      oc.lineWidth = 2;
      oc.lineJoin = 'round';
      oc.beginPath();
      oc.moveTo(cx, top);
      let px = cx;
      for (let j = 1; j <= 9; j++) {
        px += (hash(c * 11 + j, 80) - 0.5) * 36;
        oc.lineTo(px, top + j * (40 + hash(c + j, 81) * 50));
      }
      oc.stroke();
    }
  }
  const left = x0 - SHELF_LEAN - 20;
  const right = x1 + SHELF_LEAN + 20;
  const edgeL = oc.createLinearGradient(left, 0, left + 1400, 0);
  edgeL.addColorStop(0, dim('#4A78AE', night).replace('rgb(', 'rgba(').replace(')', ',0.2)'));
  edgeL.addColorStop(1, dim('#4A78AE', night).replace('rgb(', 'rgba(').replace(')', ',0)'));
  oc.fillStyle = edgeL;
  oc.fillRect(left, -height - 20, 1400, deepest + height + 20);
  const edgeR = oc.createLinearGradient(right - 1400, 0, right, 0);
  edgeR.addColorStop(0, 'rgba(255,255,255,0)');
  edgeR.addColorStop(1, 'rgba(255,255,255,0.16)');
  oc.fillStyle = edgeR;
  oc.fillRect(right - 1400, -height - 20, 1400, deepest + height + 20);
  const wc = water.replace('rgb(', 'rgba(').replace(')', ',');
  const wash = oc.createLinearGradient(0, 0, 0, deepest);
  wash.addColorStop(0, wc + '0.1)');
  wash.addColorStop(1, wc + '0.55)');
  oc.fillStyle = wash;
  oc.fillRect(x0, 0, x1 - x0, deepest);
  const glow = oc.createLinearGradient(0, 0, 0, 120);
  glow.addColorStop(0, dim('#7EE8F2', night).replace('rgb(', 'rgba(').replace(')', ',0.4)'));
  glow.addColorStop(1, dim('#7EE8F2', night).replace('rgb(', 'rgba(').replace(')', ',0)'));
  oc.fillStyle = glow;
  oc.fillRect(x0, 0, x1 - x0, 120);
  path(oc);
  oc.lineJoin = 'round';
  oc.strokeStyle = dim('#CFF1FA', night).replace('rgb(', 'rgba(').replace(')', ',0.07)');
  for (const width of [150, 100, 64, 38, 20]) {
    oc.lineWidth = width;
    oc.stroke();
  }
  oc.restore();
  path(oc);
  oc.lineJoin = 'round';
  oc.strokeStyle = dim('#F2FCFF', night).replace('rgb(', 'rgba(').replace(')', ',0.5)');
  oc.lineWidth = 3;
  oc.stroke();

  oc.globalCompositeOperation = 'destination-out';
  oc.beginPath();
  for (const b of inRange) {
    oc.moveTo(b.x + b.r, b.y);
    oc.arc(b.x, b.y, b.r, 0, Math.PI * 2);
  }
  oc.fill();
  oc.globalCompositeOperation = 'source-over';

  ctx.save();
  path(ctx);
  ctx.clip();
  for (const [color, extra] of [[dim('#CFEFFF', night), 8], [dim(mixColor(ground, '#0B2A52', 0.55), night), 0]] as const) {
    ctx.fillStyle = color;
    ctx.beginPath();
    for (const b of inRange) {
      ctx.moveTo(b.x + b.r + extra, b.y);
      ctx.arc(b.x, b.y, b.r + extra, 0, Math.PI * 2);
    }
    ctx.fill();
  }
  ctx.restore();
  ctx.save();
  ctx.setTransform(1, 0, 0, 1, 0, 0);
  ctx.drawImage(off, 0, 0);
  ctx.restore();
}

const shelfFarCanvas = document.createElement('canvas');

const smooth01 = (v: number) => {
  const u = Math.min(1, Math.max(0, v));
  return u * u * (3 - 2 * u);
};

/** The same slow wobble the shelf's own faces have underwater, so the far wall's face matches it. */
const faceLumps = (u: number, k: number) => Math.min(1, u * 6) * (26 * Math.sin(u * 15 + k) + 15 * Math.sin(u * 38 + k * 2.3) + 7 * Math.sin(u * 83 + k * 1.7));

/** How long in px each end of the shelf's far wall is when the camera is far from it and how short it gets right beside the shelf. */
const FAR_WALL_MAX = 1200;
const FAR_WALL_MIN = 130;
/** Camera distances in px from the shelf's end over which the far wall shrinks from its longest to its shortest. */
const FAR_WALL_NEAR = 320;
const FAR_WALL_FAR = 2900;
/** The share of the far wall's visible length, from its far tip, over which it fades in from clear to solid; 0 for no fade, 0.2 to fade the first fifth. */
const FAR_WALL_FADE = 0;

/**
 * The shelf's far wall: a long, bumpy, solid sliver of the same ice that runs off each end of the shelf and slopes down toward a far tip, with a line dropping from the tip where the shelf's edge would be.
 * Its far tip is hung on the camera instead of the world, so it lags behind as you sail: the nearer you get to the shelf the shorter the sliver, and the same drop over less distance turns it steeper, as if the wall were swinging round to face you.
 * It has no outline. Optionally (`FAR_WALL_FADE`) it fades in from clear at the far tip to solid, above and below the water, which sells the distance. It reaches down into the sea as a solid wall of the shelf's own ice. Scenery only; drawn behind the shelf, and nothing collides with it.
 */
export function drawShelfFar(ctx: CanvasRenderingContext2D, view: { left: number; right: number }, camX: number, shelf: { x0: number; x1: number; height: number }, night: number, haze: string, water: string) {
  const H = shelf.height;
  for (const dir of [1, -1]) {
    const end = dir > 0 ? shelf.x1 : shelf.x0;
    const start = end - dir * SHELF_SHOULDER;
    const u = clamp((Math.abs(camX - end) - FAR_WALL_NEAR) / (FAR_WALL_FAR - FAR_WALL_NEAR), 0, 1);
    const reach = FAR_WALL_MIN + (FAR_WALL_MAX - FAR_WALL_MIN) * u * u * (3 - 2 * u);
    const far = end + dir * reach;
    if (Math.max(start, far) < view.left || Math.min(start, far) > view.right) continue;
    const steps = 48;
    const bump = Math.min(1, reach / FAR_WALL_MAX);
    const x = (s: number) => start + (far - start) * s;
    const sEdge = SHELF_SHOULDER / (SHELF_SHOULDER + reach);
    const crest = (s: number) => {
      const t = Math.max(0, (s - sEdge) / (1 - sEdge));
      const level = s < sEdge ? 1 - 0.38 * (s / sEdge) : 0.62 - 0.6 * t ** 0.8;
      return -H * level + ((hash(Math.round(s * steps), 91 + dir) - 0.5) * 12 * Math.min(1, s * 3) + 4 * Math.sin(s * 11)) * bump;
    };
    const deepRoot = SHELF_EDGE_DEPTH;
    const deepTip = SHELF_EDGE_DEPTH * 0.85;
    const deepest = SHELF_BASE + 3600;
    const off = shelfFarCanvas;
    if (off.width !== ctx.canvas.width || off.height !== ctx.canvas.height) {
      off.width = ctx.canvas.width;
      off.height = ctx.canvas.height;
    }
    const oc = off.getContext('2d')!;
    oc.setTransform(1, 0, 0, 1, 0, 0);
    oc.globalCompositeOperation = 'source-over';
    oc.clearRect(0, 0, off.width, off.height);
    oc.setTransform(ctx.getTransform());
    const body = oc.createLinearGradient(0, -H, 0, deepest);
    shelfColors(body, H, deepest, night);
    oc.fillStyle = body;
    oc.beginPath();
    oc.moveTo(x(0), crest(0));
    for (let i = 1; i <= steps; i++) oc.lineTo(x(i / steps), crest(i / steps));
    const tipRun = Math.min((deepTip * SHELF_LEAN) / H, Math.abs(start - far) - 10);
    const tipX = far - dir * tipRun;
    for (let i = 0; i <= SHELF_DEEP_STEPS; i++) {
      const v = i / SHELF_DEEP_STEPS;
      oc.lineTo(far - dir * (tipRun * v + faceLumps(v, 5 + dir)), deepTip * v);
    }
    const joinX = end - dir * ((SHELF_EDGE_DEPTH * SHELF_LEAN) / H + 80);
    for (let i = 1; i <= 24; i++) {
      const v = i / 24;
      oc.lineTo(tipX + (joinX - tipX) * v, deepTip + (deepRoot - deepTip) * smooth01(v) + 70 * Math.sin(v * 19 + dir) * Math.min(1, v * 5) * (1 - v * v));
    }
    oc.closePath();
    oc.fill();
    const wc = water.replace('rgb(', 'rgba(').replace(')', ',');
    const wash = oc.createLinearGradient(0, 0, 0, deepest);
    wash.addColorStop(0, wc + '0.1)');
    wash.addColorStop(1, wc + '0.55)');
    oc.globalCompositeOperation = 'source-atop';
    oc.fillStyle = wash;
    oc.fillRect(Math.min(start, far) - 4, 0, Math.abs(far - start) + 8, deepest);
    oc.globalCompositeOperation = 'source-atop';
    const mist = oc.createLinearGradient(far, 0, end, 0);
    const sky = dim(haze, night).replace('rgb(', 'rgba(').replace(')', ',');
    mist.addColorStop(0, sky + '0.8)');
    mist.addColorStop(1, sky + '0)');
    oc.fillStyle = mist;
    oc.fillRect(Math.min(start, far) - 10, -H - 60, Math.abs(far - start) + 20, deepest + H + 120);
    if (FAR_WALL_FADE > 0) {
      oc.globalCompositeOperation = 'destination-in';
      const fade = oc.createLinearGradient(far, 0, end, 0);
      fade.addColorStop(0, 'rgba(0,0,0,0)');
      fade.addColorStop(FAR_WALL_FADE, 'rgba(0,0,0,1)');
      oc.fillStyle = fade;
      oc.fillRect(Math.min(start, far) - 10, -H - 60, Math.abs(far - start) + 20, deepest + H + 120);
    }
    oc.globalCompositeOperation = 'source-over';
    ctx.save();
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.drawImage(off, 0, 0);
    ctx.restore();
  }
}

/** Clips to everything outside the shelf, so the surface water drawn afterwards passes behind the shelf instead of over it. */
export function clipOutsideShelf(ctx: CanvasRenderingContext2D, shelf: { x0: number; x1: number; height: number }) {
  ctx.beginPath();
  ctx.rect(-1e6, -1e6, 2e6, 2e6);
  shelfPolygon(shelf).forEach(([x, y], i) => (i ? ctx.lineTo(x, y) : ctx.moveTo(x, y)));
  ctx.closePath();
  ctx.clip('evenodd');
}

/** Seconds between splashes on each face of the shelf, and how long a splash lasts. */
const SPLASH_GAP = [4.6, 5.7];
const SPLASH_LENGTH = 1.5;

/** Water slapping against the shelf's two faces at the waterline: every few seconds a swell breaks against the ice, throwing droplets out over the sea and spray up the face, then settles to a little foam until the next one. Drawn in front of the shelf. */
export function drawShelfSplash(ctx: CanvasRenderingContext2D, view: { left: number; right: number }, shelf: { x0: number; x1: number }, t: number, night: number) {
  const tone = Math.round(255 - night * 80);
  [[shelf.x0, -1, SPLASH_GAP[0], 0], [shelf.x1, 1, SPLASH_GAP[1], 2.3]].forEach(([face, out, gap, offset]) => {
    if (face < view.left - 160 || face > view.right + 160) return;
    const clock = t + offset;
    const cycle = Math.floor(clock / gap);
    const into = clock - cycle * gap;
    const burst = into < SPLASH_LENGTH ? Math.sin((Math.PI * into) / SPLASH_LENGTH) : 0;
    const sea = (x: number) => waveY(x, t) + 1;
    ctx.fillStyle = `rgba(${tone},${tone},${tone},${0.18 + 0.4 * burst})`;
    for (let k = 0; k < 3; k++) {
      const swell = 0.5 + 0.5 * Math.sin(t * 1.7 + k * 2.1 + face * 0.01);
      const grow = 0.55 + 0.45 * burst;
      ctx.beginPath();
      ctx.ellipse(face + out * (12 + k * 17), sea(face), (16 + 11 * swell) * grow, (3.6 + 2.2 * swell) * grow, 0, 0, Math.PI * 2);
      ctx.fill();
    }
    if (into >= SPLASH_LENGTH) return;
    for (let i = 0; i < 16; i++) {
      const seed = i + cycle * 31 + (out > 0 ? 7 : 0);
      const delay = hash(seed, 511) * 0.5;
      const life = 0.55 + hash(seed, 512) * 0.4;
      const u = (into - delay) / life;
      if (u <= 0 || u >= 1) continue;
      const fade = Math.sin(Math.PI * u) ** 0.7;
      const r = 2.2 + hash(seed, 503) * 3;
      let x: number;
      let y: number;
      if (i % 2 === 0) {
        x = face + out * (5 + u * (20 + hash(seed, 504) * 40));
        y = sea(face) - (14 + hash(seed, 505) * 42) * Math.sin(Math.PI * u);
      } else {
        x = face + out * (3 + hash(seed, 506) * 6);
        y = sea(face) - u * (40 + hash(seed, 507) * 75);
      }
      ctx.fillStyle = `rgba(${tone},${tone},${tone},${0.75 * fade})`;
      ctx.beginPath();
      ctx.arc(x, y, r, 0, Math.PI * 2);
      ctx.fill();
    }
  });
}
