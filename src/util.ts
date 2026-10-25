export type Rng = () => number;

export function mulberry32(seed: number): Rng {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export const clamp = (v: number, lo: number, hi: number) => Math.max(lo, Math.min(hi, v));
export const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
export const rand = (rng: Rng, lo: number, hi: number) => lo + (hi - lo) * rng();

/** Frame-rate independent smoothing factor. */
export const damp = (k: number, dt: number) => 1 - Math.exp(-k * dt);

export const money = (n: number) => '$' + Math.floor(n).toLocaleString('en-US');

export function waveY(x: number, t: number) {
  return Math.sin(x * 0.012 + t * 1.6) * 5 + Math.sin(x * 0.031 - t * 2.2) * 2.5;
}

export function rrect(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number | number[]) {
  ctx.beginPath();
  ctx.roundRect(x, y, w, h, r);
}

function toRgb(c: string): number[] {
  if (c.startsWith('#')) {
    const n = parseInt(c.slice(1), 16);
    return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
  }
  return c.match(/\d+/g)!.map(Number);
}

/** Blends two #hex or rgb() colors; t = 0 gives a, t = 1 gives b. */
export function mixColor(a: string, b: string, t: number) {
  const [r1, g1, b1] = toRgb(a);
  const [r2, g2, b2] = toRgb(b);
  return `rgb(${Math.round(lerp(r1, r2, t))},${Math.round(lerp(g1, g2, t))},${Math.round(lerp(b1, b2, t))})`;
}
