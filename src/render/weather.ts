import { clamp, mulberry32 } from '../util';

const SLOT_DAYS = 3;
const STORM_CHANCE = 0.8;
const FADE_DAYS = 0.05;
const DROPS = 220;

const rng = mulberry32(31);
const DROP = Array.from({ length: DROPS }, () => ({ x: rng(), p: rng() }));
const hash = (n: number) => {
  const v = Math.sin(n * 127.1) * 43758.5453;
  return v - Math.floor(v);
};

/** How hard it rains (0 dry, 1 downpour) after `days` of game time; one storm of 0.15 to 0.35 days may fall in each three-day stretch, whatever the time of day. */
export function rainAt(days: number) {
  const slot = Math.floor(days / SLOT_DAYS);
  const g = mulberry32(slot * 7919 + 13);
  if (g() > STORM_CHANCE) return 0;
  const start = slot * SLOT_DAYS + (0.1 + g() * 0.6) * SLOT_DAYS;
  const len = 0.15 + g() * 0.2;
  const into = days - start;
  const u = clamp(Math.min(into, len - into) / FADE_DAYS, 0, 1);
  return u * u * (3 - 2 * u);
}

/** Streaks of rain in screen pixels from the top of the screen down to the waterline `waterY`. */
export function drawRainFall(ctx: CanvasRenderingContext2D, w: number, h: number, waterY: number, t: number, rain: number, night: number, dpr: number) {
  const floor = Math.min(h, waterY);
  if (floor <= 0 || rain <= 0.01) return;
  ctx.save();
  ctx.setTransform(1, 0, 0, 1, 0, 0);
  ctx.beginPath();
  ctx.rect(0, 0, w, floor);
  ctx.clip();
  ctx.lineCap = 'round';
  const tone = night > 0.5 ? '170,185,215' : '205,218,235';
  const layers = [
    { speed: 900, len: 26, width: 1, alpha: 0.4, from: 0, to: 0.6 },
    { speed: 1300, len: 40, width: 1.6, alpha: 0.55, from: 0.6, to: 1 },
  ];
  for (const L of layers) {
    const n = Math.floor(DROPS * (L.to - L.from) * rain);
    const first = Math.floor(DROPS * L.from);
    const len = L.len * dpr;
    const span = h + len;
    ctx.strokeStyle = `rgba(${tone},${L.alpha * Math.min(1, rain * 1.3)})`;
    ctx.lineWidth = L.width * dpr;
    ctx.beginPath();
    for (let i = first; i < first + n; i++) {
      const d = DROP[i];
      const y = ((t * L.speed * dpr + d.p * span) % span) - len;
      const x = d.x * (w + 100) - 50 + (y / span) * 30;
      ctx.moveTo(x - len * 0.18, y - len);
      ctx.lineTo(x, y);
    }
    ctx.stroke();
  }
  ctx.restore();
}

/** Rings spreading where drops hit the water, in world coordinates (call with the world transform set). */
export function drawRainRipples(ctx: CanvasRenderingContext2D, left: number, width: number, t: number, rain: number, surfaceY: (x: number) => number) {
  const CELL = 60;
  const SLOTS = 2;
  ctx.lineWidth = 1.2;
  for (let c = Math.floor(left / CELL); c <= Math.floor((left + width) / CELL); c++) {
    for (let j = 0; j < SLOTS; j++) {
      const seed = c * 7.13 + j * 131;
      if (hash(seed + 977) > rain) continue;
      const phase = t * 1.4 + hash(seed) * 10;
      const cycle = Math.floor(phase);
      const life = phase - cycle;
      const x = c * CELL + hash(seed + cycle * 17.3) * CELL;
      const r = 2 + life * 10;
      ctx.strokeStyle = `rgba(235,245,255,${(1 - life) * 0.55})`;
      ctx.beginPath();
      ctx.ellipse(x, surfaceY(x) + 1, r, r * 0.28, 0, 0, Math.PI * 2);
      ctx.stroke();
    }
  }
}
