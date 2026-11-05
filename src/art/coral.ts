import { rrect } from '../util';

const hash = (n: number) => {
  const v = Math.sin(n * 127.1) * 43758.5453;
  return v - Math.floor(v);
};

interface Palette {
  fill: string;
  dark: string;
}

const TEAL: Palette = { fill: '#4FC3B0', dark: '#2A8C88' };
const ORANGE: Palette = { fill: '#FFA766', dark: '#E0753A' };
const PINK: Palette = { fill: '#FF5C84', dark: '#D23A64' };
const PURPLE: Palette = { fill: '#8E8CEA', dark: '#5B5AC0' };
const ROCK = ['#8E9FD6', '#A9B8E8', '#7385BE'];

function branch(ctx: CanvasRenderingContext2D, p: Palette, x: number, y: number, a: number, len: number, w: number, seed: number, t: number, spots: boolean) {
  const sway = Math.sin(t * 1.1 + seed) * 0.025;
  const ang = a + sway;
  const ex = x + Math.cos(ang) * len;
  const ey = y + Math.sin(ang) * len;
  ctx.strokeStyle = p.fill;
  ctx.lineWidth = w;
  ctx.beginPath();
  ctx.moveTo(x, y);
  ctx.lineTo(ex, ey);
  ctx.stroke();
  if (w > 6) {
    ctx.strokeStyle = p.dark;
    ctx.lineWidth = Math.max(1.2, w * 0.13);
    const n = Math.floor(len / (w * 0.9));
    for (let i = 1; i <= n; i++) {
      const f = (i - 0.3) / (n + 0.4);
      const cx = x + (ex - x) * f;
      const cy = y + (ey - y) * f;
      const nx = -Math.sin(ang) * w * 0.32;
      const ny = Math.cos(ang) * w * 0.32;
      ctx.beginPath();
      ctx.moveTo(cx - nx, cy - ny);
      ctx.lineTo(cx + nx, cy + ny);
      ctx.stroke();
    }
    if (spots) {
      ctx.fillStyle = p.dark;
      for (let i = 0; i < 2; i++) {
        const f = 0.2 + hash(seed + i * 3.1) * 0.6;
        const o = (hash(seed + i * 7.7) - 0.5) * w * 0.4;
        ctx.beginPath();
        ctx.arc(x + (ex - x) * f - Math.sin(ang) * o, y + (ey - y) * f + Math.cos(ang) * o, w * 0.11, 0, Math.PI * 2);
        ctx.fill();
      }
    }
  }
  if (w < 6.5) return;
  const side = hash(seed) > 0.5 ? 1 : -1;
  const f = 0.4 + hash(seed + 1) * 0.15;
  const bx = x + (ex - x) * f;
  const by = y + (ey - y) * f;
  const nw = w * 0.66;
  branch(ctx, p, bx, by, ang + side * (0.75 + hash(seed + 4) * 0.3), len * 0.85, nw, seed * 1.7 + 1, t, spots);
  branch(ctx, p, ex, ey, ang - side * (0.3 + hash(seed + 2) * 0.25), len * 0.75, nw, seed * 1.1 + 3, t, spots);
}

function rocks(ctx: CanvasRenderingContext2D, x: number, w: number, h: number) {
  ctx.fillStyle = ROCK[0];
  ctx.beginPath();
  ctx.moveTo(x - w / 2, 6);
  ctx.lineTo(x - w * 0.42, -h * 0.55);
  ctx.lineTo(x - w * 0.05, -h);
  ctx.lineTo(x + w * 0.38, -h * 0.7);
  ctx.lineTo(x + w / 2, 6);
  ctx.closePath();
  ctx.fill();
  ctx.fillStyle = ROCK[1];
  ctx.beginPath();
  ctx.moveTo(x - w * 0.42, -h * 0.55);
  ctx.lineTo(x - w * 0.05, -h);
  ctx.lineTo(x + w * 0.38, -h * 0.7);
  ctx.lineTo(x - w * 0.02, -h * 0.45);
  ctx.closePath();
  ctx.fill();
  ctx.fillStyle = ROCK[2];
  ctx.beginPath();
  ctx.moveTo(x - w * 0.02, -h * 0.45);
  ctx.lineTo(x + w * 0.38, -h * 0.7);
  ctx.lineTo(x + w / 2, 6);
  ctx.lineTo(x + w * 0.1, 6);
  ctx.closePath();
  ctx.fill();
}

function barrel(ctx: CanvasRenderingContext2D, x: number, w: number, h: number) {
  ctx.fillStyle = PURPLE.fill;
  rrect(ctx, x - w / 2, -h, w, h + 4, [w / 2, w / 2, 3, 3]);
  ctx.fill();
  ctx.strokeStyle = PURPLE.dark;
  ctx.lineWidth = 1.8;
  for (let y = h - 8; y > 6; y -= 8) {
    ctx.beginPath();
    ctx.moveTo(x - w / 2 + 2, -y);
    ctx.quadraticCurveTo(x, -y + 4, x + w / 2 - 2, -y);
    ctx.stroke();
  }
}

function leaf(ctx: CanvasRenderingContext2D, x: number, y: number, a: number, len: number, w: number) {
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(a);
  ctx.fillStyle = '#5FCDB5';
  ctx.beginPath();
  ctx.moveTo(0, 0);
  ctx.quadraticCurveTo(len * 0.5, -w, len, 0);
  ctx.quadraticCurveTo(len * 0.5, w * 0.8, 0, 0);
  ctx.fill();
  ctx.strokeStyle = '#2F9C93';
  ctx.lineWidth = 1.6;
  ctx.beginPath();
  ctx.moveTo(len * 0.08, 0);
  ctx.lineTo(len * 0.85, 0);
  ctx.stroke();
  ctx.restore();
}

/** A reef cluster on the floor; `tint` picks one of four designs (0 to 1 in quarters) and `push` is the floor's slope. */
export function drawCoral(ctx: CanvasRenderingContext2D, size: number, tint: number, t: number, push: number) {
  const variant = Math.min(3, Math.floor(tint * 4));
  ctx.save();
  ctx.translate(0, 4 * size);
  ctx.rotate(Math.atan(push) * 0.7);
  ctx.scale(size * 0.85, size * 0.85);
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';
  const up = -Math.PI / 2;
  if (variant === 0) {
    branch(ctx, ORANGE, 26, -6, up + 0.15, 26, 10, 4.2, t, true);
    branch(ctx, TEAL, -14, -6, up - 0.55, 28, 14, 1.3, t, true);
    branch(ctx, TEAL, -4, -6, up + 0.25, 30, 15, 2.1, t, true);
    rocks(ctx, 0, 72, 22);
  } else if (variant === 1) {
    branch(ctx, PINK, -22, -6, up - 0.3, 30, 11, 2.6, t, true);
    branch(ctx, PINK, 24, -6, up + 0.3, 30, 11, 5.5, t, true);
    branch(ctx, PURPLE, 0, -6, up, 34, 15, 3.4, t, true);
    rocks(ctx, 4, 70, 22);
  } else if (variant === 2) {
    branch(ctx, PINK, -6, -6, up + 0.05, 32, 19, 6.1, t, true);
    rocks(ctx, -10, 64, 20);
    leaf(ctx, 22, -6, -1.0, 52, 12);
    leaf(ctx, 20, -4, -0.45, 40, 9);
    rocks(ctx, 24, 28, 11);
  } else {
    branch(ctx, PINK, -2, -6, up - 0.15, 40, 7, 7.3, t, false);
    barrel(ctx, -38, 24, 40);
    barrel(ctx, -14, 26, 54);
    barrel(ctx, -30, 24, 30);
    branch(ctx, ORANGE, 26, -4, up + 0.04, 44, 18, 8.8, t, true);
    branch(ctx, ORANGE, 28, -26, up + 1.0, 28, 12, 9.4, t, true);
    rocks(ctx, 0, 76, 20);
  }
  ctx.restore();
}
