import { mixColor, mulberry32 } from '../util';

const WHITE = '#FFFFFF';
const WING_TIP = '#4A2F2C';
const BEAK = '#F0522D';
const GULL_SIZE = 0.55;

type Gull = {
  perch: boolean;
  x: number;
  y: number;
  dir: 1 | -1;
  phase: number;
  speed: number;
  radius: number;
  height: number;
  bob: number;
};

/** Height of the island's sand at a world x offset from its center, matching the curve in `drawIsland`. */
function sandY(x: number, width: number) {
  const u = Math.max(-250, Math.min(250, x / width));
  const [p0, c, p1] = u < 0 ? [[-250, 6], [-160, -62], [0, -66]] : [[0, -66], [170, -62], [250, 6]];
  let lo = 0;
  let hi = 1;
  for (let i = 0; i < 18; i++) {
    const m = (lo + hi) / 2;
    const bx = (1 - m) ** 2 * p0[0] + 2 * (1 - m) * m * c[0] + m * m * p1[0];
    if (bx < u) lo = m;
    else hi = m;
  }
  return (1 - lo) ** 2 * p0[1] + 2 * (1 - lo) * lo * c[1] + lo * lo * p1[1];
}

const flocks = new Map<string, Gull[]>();

function flockFor(name: string, width: number): Gull[] {
  const key = `${name}:${width}`;
  let flock = flocks.get(key);
  if (flock) return flock;
  let h = 7;
  for (let i = 0; i < name.length; i++) h = (h * 31 + name.charCodeAt(i)) >>> 0;
  const rnd = mulberry32(h);
  const reach = 250 * width;
  flock = [];
  const spots = [-0.78, -0.55, 0.5, 0.72];
  for (let i = 0; i < 3; i++) {
    const x = spots[Math.floor(rnd() * spots.length)] * reach + (rnd() - 0.5) * 30;
    flock.push({ perch: true, x, y: sandY(x, width), dir: rnd() < 0.5 ? 1 : -1, phase: rnd() * 20, speed: 0, radius: 0, height: 0, bob: 0 });
  }
  const deckX = reach + 20 + rnd() * 100;
  flock.push({ perch: true, x: deckX, y: -9, dir: rnd() < 0.5 ? 1 : -1, phase: rnd() * 20, speed: 0, radius: 0, height: 0, bob: 0 });
  for (let i = 0; i < 3; i++) {
    flock.push({
      perch: false,
      x: (rnd() - 0.5) * reach * 0.2,
      y: 0,
      dir: 1,
      phase: rnd() * Math.PI * 2,
      speed: 0,
      radius: reach * (0.8 + rnd() * 2.1),
      height: 110 + rnd() * 110,
      bob: 14 + rnd() * 14,
    });
    const gull = flock[flock.length - 1];
    gull.speed = ((0.28 + rnd() * 0.22) * reach) / gull.radius;
  }
  flocks.set(key, flock);
  return flock;
}

function drawFlyer(ctx: CanvasRenderingContext2D, flap: number, tint: (c: string) => string) {
  const wing = Math.sin(flap);
  const tipY = -10 * wing - 2;
  ctx.fillStyle = tint(WHITE);
  ctx.beginPath();
  ctx.ellipse(0, 0, 8, 3.2, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.beginPath();
  ctx.arc(7.5, -1.2, 2.5, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = tint(BEAK);
  ctx.beginPath();
  ctx.moveTo(9.6, -1.6);
  ctx.lineTo(13, -0.8);
  ctx.lineTo(9.6, -0.2);
  ctx.fill();
  ctx.fillStyle = tint(WING_TIP);
  ctx.beginPath();
  ctx.moveTo(-8, 0);
  ctx.lineTo(-11, 0.5);
  ctx.lineTo(-8, 1.6);
  ctx.fill();
  ctx.fillStyle = tint(WHITE);
  ctx.beginPath();
  ctx.moveTo(3, -1);
  ctx.quadraticCurveTo(-2, tipY * 0.7, -9, tipY);
  ctx.quadraticCurveTo(-4, tipY * 0.3 - 1, -4, 0);
  ctx.closePath();
  ctx.fill();
  ctx.fillStyle = tint(WING_TIP);
  ctx.beginPath();
  ctx.moveTo(-5.5, tipY * 0.8);
  ctx.lineTo(-10.5, tipY);
  ctx.lineTo(-6.5, tipY * 0.5 + 1);
  ctx.closePath();
  ctx.fill();
  ctx.fillStyle = '#2A1F22';
  ctx.beginPath();
  ctx.arc(8, -1.8, 0.6, 0, Math.PI * 2);
  ctx.fill();
}

function drawPerched(ctx: CanvasRenderingContext2D, peck: number, tint: (c: string) => string) {
  ctx.strokeStyle = tint(BEAK);
  ctx.lineWidth = 1.1;
  ctx.beginPath();
  ctx.moveTo(-1, -5);
  ctx.lineTo(-1, 0);
  ctx.moveTo(1.5, -5);
  ctx.lineTo(1.5, 0);
  ctx.stroke();
  ctx.fillStyle = tint(WING_TIP);
  ctx.beginPath();
  ctx.moveTo(-6, -8.5);
  ctx.lineTo(-11, -6.5);
  ctx.lineTo(-6, -5.5);
  ctx.fill();
  ctx.fillStyle = tint(WHITE);
  ctx.beginPath();
  ctx.ellipse(-1, -8, 7, 4, -0.2, 0, Math.PI * 2);
  ctx.fill();
  const hx = 4.5 + peck * 2.5;
  const hy = -12.5 + peck * 6;
  ctx.beginPath();
  ctx.moveTo(2, -9);
  ctx.lineTo(hx - 2, hy + 3);
  ctx.lineTo(hx + 1, hy + 3);
  ctx.lineTo(4, -7);
  ctx.fill();
  ctx.beginPath();
  ctx.arc(hx, hy, 2.6, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = tint(BEAK);
  ctx.beginPath();
  ctx.moveTo(hx + 2, hy - 0.8);
  ctx.lineTo(hx + 5.2 + peck, hy + 0.6 + peck * 1.5);
  ctx.lineTo(hx + 2, hy + 1);
  ctx.fill();
  ctx.fillStyle = '#2A1F22';
  ctx.beginPath();
  ctx.arc(hx + 0.8, hy - 0.5, 0.6, 0, Math.PI * 2);
  ctx.fill();
}

/** Small gulls that stand on the island and dock, plus a few circling above; all deterministic from the island name and time. */
export function drawIslandGulls(ctx: CanvasRenderingContext2D, t: number, name: string, width: number, night: number) {
  const tint = (c: string) => (night > 0 ? mixColor(c, '#0B1430', night * 0.55) : c);
  for (const g of flockFor(name, width)) {
    ctx.save();
    if (g.perch) {
      ctx.translate(g.x, g.y);
      ctx.scale(g.dir * GULL_SIZE, GULL_SIZE);
      const cycle = (t + g.phase) % 7;
      const peck = cycle < 1 ? Math.sin(cycle * Math.PI * 3) ** 2 * Math.sin(cycle * Math.PI) : 0;
      drawPerched(ctx, peck, tint);
    } else {
      if (night > 0.6) {
        ctx.restore();
        continue;
      }
      ctx.globalAlpha = 1 - night / 0.6;
      const a = t * g.speed + g.phase;
      const vx = Math.cos(a);
      const x = g.x + Math.sin(a) * g.radius;
      const y = -g.height - Math.sin(a * 2 + g.phase) * g.bob;
      ctx.translate(x, y);
      const turn = Math.max(-1, Math.min(1, vx * 4));
      ctx.scale(turn * GULL_SIZE, GULL_SIZE);
      ctx.rotate(-Math.cos(a * 2 + g.phase) * 0.12);
      const glide = Math.sin(t * 0.35 + g.phase * 3) > 0.55;
      drawFlyer(ctx, glide ? 0.9 : t * 7 + g.phase * 5, tint);
    }
    ctx.restore();
  }
}
