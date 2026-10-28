import type { Creature } from '../game/world';
import { MONSTER_SCALE as MS, MONSTER_TRAIL } from '../config';
import { leviathanSpine } from '../data/leviathan';
import { mulberry32 } from '../util';
import { BLUE_WHALE_SCALE, COLOSSAL_SCALE, SHARK_LENGTH, SHARK_SCALE, WHALE_SCALE, whalePitch } from '../data/creatures';

const FISH = ['#FFB547', '#FF7A6B', '#7BDFF2', '#B9F18C'];

const ANGLER_SCALE = 0.75;

/** How far a dead anglerfish has flipped belly-up, 0..1. */
const anglerFlip = (c: Creature) => (c.state === 'dead' ? Math.min(1, c.dying / 1.2) : 0);

/** How bright the lure still is: full while alive, dimming out over about three seconds once dead. */
export function lureGlow(c: Creature) {
  return c.state === 'dead' ? Math.max(0, 1 - c.dying / 3) : 1;
}

export function anglerLure(c: Creature) {
  const a = Math.PI * anglerFlip(c);
  const lx = 62 * ANGLER_SCALE;
  const ly = -36 * ANGLER_SCALE;
  return {
    x: c.x + c.facing * (lx * Math.cos(a) - ly * Math.sin(a)),
    y: c.y + lx * Math.sin(a) + ly * Math.cos(a),
  };
}

export type LeviathanPart = 'all' | 'back' | 'front';

export function drawCreature(ctx: CanvasRenderingContext2D, c: Creature, part: LeviathanPart = 'all') {
  ctx.save();
  ctx.translate(c.x, c.y);
  ctx.lineJoin = 'round';
  ctx.lineCap = 'round';
  switch (c.kind) {
    case 'fish':
      ctx.scale(c.facing, 1);
      fish(ctx, c);
      break;
    case 'jelly':
      jelly(ctx, c);
      break;
    case 'shark':
    case 'hammerhead':
      ctx.scale(c.facing, 1);
      ctx.rotate(Math.max(-0.8, Math.min(0.8, Math.atan2(c.vy, Math.max(Math.abs(c.vx), 40)))));
      ctx.scale(SHARK_LENGTH * SHARK_SCALE, SHARK_SCALE);
      shark(ctx, c, c.kind === 'hammerhead');
      break;
    case 'squid':
      ctx.rotate(c.angle + Math.PI / 2);
      squid(ctx, c, c.tint > SPOTTED_TINT ? SQUID_SPOTTED : SQUID_PALETTE);
      break;
    case 'angler':
      ctx.scale(c.facing, 1);
      angler(ctx, c);
      break;
    case 'stingray':
    case 'manta':
      ctx.scale(c.facing, 1);
      ctx.rotate(Math.max(-0.3, Math.min(0.3, Math.atan2(c.vy, Math.max(Math.abs(c.vx), 25)))));
      if (c.kind === 'manta') manta(ctx, c);
      else stingray(ctx, c);
      break;
    case 'bigfin':
      bigfin(ctx, c);
      break;
    case 'leviathan':
      if (part !== 'front') leviathan(ctx, c, 'back');
      if (part !== 'back') leviathan(ctx, c, 'front');
      break;
    case 'bluewhale':
      ctx.scale(c.facing * BLUE_WHALE_SCALE, BLUE_WHALE_SCALE);
      ctx.rotate(Math.max(-0.12, Math.min(0.12, Math.atan2(c.vy, Math.max(Math.abs(c.vx), 30)))));
      blueWhale(ctx, c);
      break;
    case 'turtle':
      ctx.scale(c.facing, 1);
      ctx.rotate(Math.max(-0.3, Math.min(0.3, Math.atan2(c.vy, Math.max(Math.abs(c.vx), 25)))));
      turtle(ctx, c);
      break;
    case 'colossal':
      ctx.rotate(c.angle + Math.PI / 2);
      ctx.scale(COLOSSAL_SCALE, COLOSSAL_SCALE);
      squid(ctx, c, c.tint > SPOTTED_TINT ? COLOSSAL_SPOTTED : COLOSSAL_PALETTE);
      break;
    case 'whale':
      ctx.scale(c.facing * WHALE_SCALE, WHALE_SCALE);
      ctx.rotate(whalePitch(c));
      whale(ctx, c);
      break;
  }
  ctx.restore();
}

/** A sperm whale about 480 px long, facing right: blunt square head, long jaw, and tail flukes that sway slowly. */
function whale(ctx: CanvasRenderingContext2D, c: Creature) {
  const sway = Math.sin(c.phase * 0.9) * 16;
  const skin = '#5B6A86';
  const belly = '#8E9CB6';
  const dark = '#46536E';

  ctx.save();
  ctx.translate(-212, 4);
  ctx.rotate(sway * 0.004);
  ctx.fillStyle = dark;
  ctx.beginPath();
  ctx.moveTo(14, -6);
  ctx.quadraticCurveTo(-18, -14, -48, -52 + sway * 0.5);
  ctx.quadraticCurveTo(-30, -10, -34, 0);
  ctx.quadraticCurveTo(-30, 10, -48, 52 + sway * 0.5);
  ctx.quadraticCurveTo(-18, 14, 14, 6);
  ctx.closePath();
  ctx.fill();
  ctx.restore();

  const body = () => {
    ctx.beginPath();
    ctx.moveTo(126, -66);
    ctx.lineTo(206, -64);
    ctx.quadraticCurveTo(236, -60, 236, -28);
    ctx.lineTo(236, 22);
    ctx.quadraticCurveTo(234, 42, 208, 44);
    ctx.lineTo(120, 56);
    ctx.quadraticCurveTo(10, 70, -90, 42);
    ctx.quadraticCurveTo(-170, 20, -214, 6);
    ctx.lineTo(-214, -4);
    ctx.quadraticCurveTo(-150, -36, -50, -54);
    ctx.quadraticCurveTo(40, -68, 126, -66);
    ctx.closePath();
  };
  ctx.fillStyle = skin;
  body();
  ctx.fill();

  ctx.save();
  body();
  ctx.clip();
  ctx.fillStyle = belly;
  ctx.beginPath();
  ctx.moveTo(240, 18);
  ctx.quadraticCurveTo(120, 30, 20, 34);
  ctx.quadraticCurveTo(-110, 28, -220, 12);
  ctx.lineTo(-220, 80);
  ctx.lineTo(240, 80);
  ctx.closePath();
  ctx.fill();
  ctx.strokeStyle = 'rgba(255,255,255,0.13)';
  ctx.lineWidth = 3;
  ctx.lineCap = 'round';
  for (const x of [-120, -70, -20, 30, 80]) {
    ctx.beginPath();
    ctx.moveTo(x, -50 + Math.abs(x) * 0.08);
    ctx.quadraticCurveTo(x + 14, -30, x + 4, -10);
    ctx.stroke();
  }
  ctx.fillStyle = 'rgba(255,255,255,0.1)';
  for (const [x, y] of [[170, -6], [188, 6], [160, 10], [196, -14]]) {
    ctx.beginPath();
    ctx.arc(x, y, 5, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.restore();

  ctx.strokeStyle = dark;
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(234, 20);
  ctx.quadraticCurveTo(170, 26, 126, 36);
  ctx.stroke();

  ctx.fillStyle = dark;
  ctx.beginPath();
  ctx.moveTo(62, 40);
  ctx.quadraticCurveTo(48, 78, 18, 84);
  ctx.quadraticCurveTo(30, 54, 34, 44);
  ctx.closePath();
  ctx.fill();

  ctx.fillStyle = '#1B2438';
  ctx.beginPath();
  ctx.arc(176, 14, 6, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#FFFFFF';
  ctx.beginPath();
  ctx.arc(178, 12, 2, 0, Math.PI * 2);
  ctx.fill();
}

/** A stingray seen from above, about 135 px long with its tail: a rounded diamond with rippling wing tips. */
function stingray(ctx: CanvasRenderingContext2D, c: Creature) {
  const flap = Math.sin(c.phase * 3 + c.tint * 6);
  const skin = ['#B79A6D', '#9DA9B8', '#B08F8F'][Math.floor(c.tint * 3) % 3];
  ctx.strokeStyle = '#6E5E45';
  ctx.lineWidth = 3.5;
  ctx.beginPath();
  ctx.moveTo(-26, 0);
  ctx.quadraticCurveTo(-62, 10 * flap, -108, 6 * flap);
  ctx.stroke();
  ctx.fillStyle = skin;
  ctx.beginPath();
  ctx.moveTo(38, 0);
  ctx.quadraticCurveTo(14, -24 - flap * 3, -10, -34 + flap * 5);
  ctx.quadraticCurveTo(-22, -16, -30, 0);
  ctx.quadraticCurveTo(-22, 16, -10, 34 - flap * 5);
  ctx.quadraticCurveTo(14, 24 + flap * 3, 38, 0);
  ctx.fill();
  ctx.fillStyle = 'rgba(255,255,255,0.22)';
  ctx.beginPath();
  ctx.ellipse(6, 0, 20, 9, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#2B2A33';
  for (const y of [-9, 9]) {
    ctx.beginPath();
    ctx.arc(22, y, 3, 0, Math.PI * 2);
    ctx.fill();
  }
}

/** A cartoon manta ray seen from below, about 150 px long and 195 px across: a pale belly in a dark outline, rounded curled head fins, swept wing tips and a long thin tail with two small bumps at its root. */
function manta(ctx: CanvasRenderingContext2D, c: Creature) {
  const flap = Math.sin(c.phase * 1.8 + c.tint * 6);
  const dark = '#2F3E5C';
  ctx.lineCap = 'round';
  ctx.strokeStyle = '#24304A';
  ctx.lineWidth = 3.5;
  ctx.beginPath();
  ctx.moveTo(-56, 0);
  ctx.quadraticCurveTo(-96, 12 * flap, -150, 9 * flap);
  ctx.stroke();

  ctx.fillStyle = dark;
  for (const dir of [-1, 1]) {
    ctx.save();
    ctx.translate(-49, dir * 5.5);
    ctx.rotate(-dir * (0.45 + flap * 0.08));
    ctx.beginPath();
    ctx.ellipse(-6, 0, 9, 3.8, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }

  const half = (dir: 1 | -1) => {
    ctx.moveTo(-58, 0);
    const tipX = -34 - flap * 6;
    const tipY = dir * (100 + flap * 10);
    ctx.quadraticCurveTo(-18, dir * 34, tipX + 3, tipY - dir * 15);
    ctx.quadraticCurveTo(tipX, tipY, tipX + 13, tipY - dir * 7);
    ctx.quadraticCurveTo(26, dir * 66, 56, dir * 34);
    ctx.quadraticCurveTo(61, dir * 28, 62, dir * 16);
    ctx.quadraticCurveTo(58, dir * 8, 56, 0);
    ctx.closePath();
  };
  ctx.beginPath();
  half(-1);
  half(1);
  ctx.fill();

  for (const dir of [-1, 1]) {
    const steps = 18;
    const at = (t: number) => {
      const u = 1 - t;
      return [u * u * 58 + 2 * u * t * 82 + t * t * 98, dir * (u * u * 26 + 2 * u * t * 40 + t * t * 24)];
    };
    const width = (t: number) => 5 - 2 * t;
    const left: number[][] = [];
    const right: number[][] = [];
    for (let i = 0; i <= steps; i++) {
      const t = i / steps;
      const [x, y] = at(t);
      const [nx, ny] = at(Math.min(1, t + 0.01));
      const [px, py] = at(Math.max(0, t - 0.01));
      const len = Math.hypot(nx - px, ny - py) || 1;
      const ox = (-(ny - py) / len) * width(t);
      const oy = ((nx - px) / len) * width(t);
      left.push([x + ox, y + oy]);
      right.push([x - ox, y - oy]);
    }
    const [tx, ty] = at(1);
    ctx.beginPath();
    ctx.moveTo(left[0][0], left[0][1]);
    for (const [x, y] of left) ctx.lineTo(x, y);
    for (let i = right.length - 1; i >= 0; i--) ctx.lineTo(right[i][0], right[i][1]);
    ctx.closePath();
    ctx.fill();
    ctx.beginPath();
    ctx.arc(tx, ty, width(1), 0, Math.PI * 2);
    ctx.fill();
  }

  ctx.save();
  ctx.beginPath();
  half(-1);
  half(1);
  ctx.clip();
  ctx.fillStyle = '#B7D1E8';
  ctx.beginPath();
  ctx.moveTo(58, -22);
  ctx.quadraticCurveTo(53, 0, 58, 22);
  ctx.quadraticCurveTo(34, 42, 6, 38);
  ctx.quadraticCurveTo(-24, 22, -50, 0);
  ctx.quadraticCurveTo(-24, -22, 6, -38);
  ctx.quadraticCurveTo(34, -42, 58, -22);
  ctx.closePath();
  ctx.fill();
  ctx.fillStyle = 'rgba(225,238,248,0.7)';
  for (const dir of [-1, 1]) {
    ctx.beginPath();
    ctx.ellipse(18, dir * 11, 20, 3.2, dir * 0.15, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.strokeStyle = 'rgba(60,85,120,0.5)';
  ctx.lineWidth = 1.3;
  for (const dir of [-1, 1]) {
    for (let i = 0; i < 4; i++) {
      ctx.beginPath();
      ctx.moveTo(38 - i * 6, dir * (19 + i * 2));
      ctx.lineTo(30 - i * 6, dir * (26 + i * 2));
      ctx.stroke();
    }
  }
  ctx.restore();

  ctx.fillStyle = '#14192A';
  for (const dir of [-1, 1]) {
    ctx.beginPath();
    ctx.arc(60, dir * 27, 2.4, 0, Math.PI * 2);
    ctx.fill();
  }
}

/**
 * The Crimson Sea leviathan: a huge ridged worm whose body follows the path of its head, with a gaping mouth ringed in fine teeth
 * and pale root-like tendrils streaming from its neck.
 */
function leviathan(ctx: CanvasRenderingContext2D, c: Creature, part: LeviathanPart) {
  const t = c.phase;
  const { n, at, radius } = leviathanSpine(c);

  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';
  if (part !== 'front') {
    for (let k = n - 1; k >= 3; k--) {
      const p = at(k);
      const r = radius(k);
      ctx.fillStyle = k % 4 < 2 ? '#5D626C' : '#484C55';
      ctx.beginPath();
      ctx.arc(p.x, p.y, r, 0, Math.PI * 2);
      ctx.fill();
      if (k % 2 === 0) {
        ctx.strokeStyle = 'rgba(15,16,20,0.45)';
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.moveTo(p.x + p.nx * r, p.y + p.ny * r);
        ctx.lineTo(p.x - p.nx * r, p.y - p.ny * r);
        ctx.stroke();
      }
      ctx.fillStyle = 'rgba(190,196,206,0.12)';
      ctx.beginPath();
      ctx.arc(p.x - p.nx * r * 0.35, p.y - p.ny * r * 0.35, r * 0.45, 0, Math.PI * 2);
      ctx.fill();
    }

    ctx.strokeStyle = 'rgba(236,236,226,0.8)';
    for (let j = 6; j < 40; j += 3) {
      if (j >= n) break;
      const p = at(j);
      const side = j % 2 ? 1 : -1;
      const len = (110 + ((j * 53) % 120)) * MS;
      const sx = p.x + p.nx * side * radius(j) * 0.8;
      const sy = p.y + p.ny * side * radius(j) * 0.8;
      const sway = Math.sin(t * 1.4 + j) * 22;
      const ex = sx + p.nx * side * len * 0.8 + sway;
      const ey = sy + p.ny * side * len * 0.8 + len * 0.7;
      ctx.lineWidth = 2.6;
      ctx.beginPath();
      ctx.moveTo(sx, sy);
      ctx.quadraticCurveTo(sx + p.nx * side * len * 0.7, sy + len * 0.2, ex, ey);
      ctx.stroke();
      ctx.lineWidth = 1.4;
      ctx.beginPath();
      ctx.moveTo((sx + ex) / 2, (sy + ey) / 2);
      ctx.quadraticCurveTo(ex + 20 * side, ey - 10, ex + side * 50 + sway, ey + 50);
      ctx.stroke();
    }
  }

  ctx.save();
  ctx.rotate(c.angle);
  if (Math.cos(c.angle) < 0) ctx.scale(1, -1);
  ctx.scale(MS, MS);
  const open = (0.85 + 0.15 * Math.sin(t * 3)) * (1 - (c.bite ?? 0));
  const up = { x0: 6, y0: -4, cx: 80, cy: -92 * open, x1: 142, y1: -66 * open };
  const down = { x0: 6, y0: 4, cx: 80, cy: 92 * open, x1: 142, y1: 66 * open };
  const mouth = () => {
    ctx.moveTo(up.x0, up.y0);
    ctx.quadraticCurveTo(up.cx, up.cy, up.x1, up.y1);
    ctx.quadraticCurveTo(168, 0, down.x1, down.y1);
    ctx.quadraticCurveTo(down.cx, down.cy, down.x0, down.y0);
    ctx.closePath();
  };
  if (part !== 'front') {
    ctx.fillStyle = '#090A0D';
    ctx.beginPath();
    mouth();
    ctx.fill();
  }
  if (part === 'back') {
    ctx.restore();
    return;
  }
  ctx.save();
  ctx.beginPath();
  ctx.ellipse(-8, 0, 104, 84, 0, 0, Math.PI * 2);
  mouth();
  ctx.clip('evenodd');
  ctx.fillStyle = '#656B76';
  ctx.fillRect(-120, -90, 240, 180);
  ctx.fillStyle = 'rgba(190,196,206,0.14)';
  ctx.beginPath();
  ctx.ellipse(-20, -30, 70, 28, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
  ctx.strokeStyle = '#8A909B';
  ctx.lineWidth = 10;
  for (const jaw of [up, down]) {
    ctx.beginPath();
    ctx.moveTo(jaw.x0, jaw.y0);
    ctx.quadraticCurveTo(jaw.cx, jaw.cy, jaw.x1, jaw.y1);
    ctx.stroke();
  }
  for (const [jaw, dir] of [[up, 1], [down, -1]] as const) {
    for (let i = 1; i < 22; i++) {
      const u = i / 22;
      const x = (1 - u) ** 2 * jaw.x0 + 2 * (1 - u) * u * jaw.cx + u * u * jaw.x1;
      const y = (1 - u) ** 2 * jaw.y0 + 2 * (1 - u) * u * jaw.cy + u * u * jaw.y1;
      const len = 14 + ((i * 37) % 24);
      ctx.strokeStyle = 'rgba(224,224,212,0.9)';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(x, y);
      ctx.lineTo(x + 8 * (1 - u), y + dir * len * 0.9);
      ctx.stroke();
      ctx.strokeStyle = 'rgba(200,204,196,0.5)';
      ctx.lineWidth = 1.6;
      ctx.beginPath();
      ctx.moveTo(x, y);
      ctx.lineTo(x - 10, y - dir * (22 + ((i * 29) % 36)) + Math.sin(t * 2 + i) * 5);
      ctx.stroke();
    }
  }
  ctx.fillStyle = '#B8BDB8';
  for (const side of [-1, 1]) {
    ctx.beginPath();
    ctx.arc(34, side * 62, 9, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.restore();
}

/** A bigfin squid hovering head-up: a small mantle with two big rounded fins, and ten very long thin arms that bend out at an elbow and hang far below. */
function bigfin(ctx: CanvasRenderingContext2D, c: Creature) {
  const t = c.phase;
  const flap = Math.sin(t * 1.1 + c.tint * 6);
  const skin = '#8C5A66';
  const fins = '#B98893';
  const arm = '#D9B5BB';

  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';
  /** Ten arms fan out from the neck over the width of the cap and then hang straight down; the two in the middle are much longer. */
  const ARMS = [
    { xe: -34, len: 700 },
    { xe: -26, len: 640 },
    { xe: -18, len: 760 },
    { xe: -10, len: 680 },
    { xe: -3, len: 940 },
    { xe: 3, len: 920 },
    { xe: 10, len: 720 },
    { xe: 18, len: 780 },
    { xe: 26, len: 640 },
    { xe: 34, len: 700 },
  ];
  ARMS.forEach((a, i) => {
    const long = a.len > 900;
    ctx.strokeStyle = arm;
    ctx.globalAlpha = 0.85;
    ctx.lineWidth = long ? 2.4 : 1.7;
    ctx.beginPath();
    ctx.moveTo(a.xe * 0.3, 14);
    ctx.lineTo(a.xe, 22);
    const steps = 40;
    for (let j = 1; j <= steps; j++) {
      const u = j / steps;
      const wave = Math.sin(t * 0.7 - u * 7 + i * 1.3) * 14 * u * u;
      ctx.lineTo(a.xe + wave, 22 + a.len * u);
    }
    ctx.stroke();
    ctx.fillStyle = '#F3E2E4';
    ctx.globalAlpha = 0.4;
    for (let j = 14; j <= steps; j += 2) {
      const u = j / steps;
      const wave = Math.sin(t * 0.7 - u * 7 + i * 1.3) * 14 * u * u;
      ctx.beginPath();
      ctx.arc(a.xe + wave, 22 + a.len * u, long ? 1.1 : 0.85, 0, Math.PI * 2);
      ctx.fill();
    }
  });
  ctx.globalAlpha = 1;

  ctx.fillStyle = skin;
  ctx.beginPath();
  ctx.ellipse(0, -10, 11, 26, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.beginPath();
  ctx.ellipse(0, 10, 12, 9, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = 'rgba(255,255,255,0.14)';
  ctx.beginPath();
  ctx.ellipse(-3, -16, 3, 14, 0, 0, Math.PI * 2);
  ctx.fill();
  const top = -46 - 40 * (1 - 0.1 * flap);
  const mid = (top - 8) / 2;
  const corners = [[0, top], [46 * (1 + 0.14 * flap), mid], [0, -8], [-46 * (1 + 0.14 * flap), mid]];
  ctx.fillStyle = fins;
  ctx.beginPath();
  corners.forEach(([x, y], k) => {
    const [px, py] = corners[(k + 3) % 4];
    const [nx, ny] = corners[(k + 1) % 4];
    const back = 18 / Math.hypot(px - x, py - y);
    const fwd = 18 / Math.hypot(nx - x, ny - y);
    const entry = [x + (px - x) * back, y + (py - y) * back];
    const exit = [x + (nx - x) * fwd, y + (ny - y) * fwd];
    if (k === 0) ctx.moveTo(entry[0], entry[1]);
    else ctx.lineTo(entry[0], entry[1]);
    ctx.quadraticCurveTo(x, y, exit[0], exit[1]);
  });
  ctx.closePath();
  ctx.fill();
  ctx.strokeStyle = 'rgba(70,35,45,0.4)';
  ctx.lineWidth = 1.5;
  ctx.stroke();
  ctx.strokeStyle = 'rgba(70,35,45,0.16)';
  ctx.lineWidth = 1.2;
  ctx.beginPath();
  ctx.moveTo(0, top + 14);
  ctx.lineTo(0, -22);
  ctx.stroke();
  ctx.fillStyle = '#1B1420';
  for (const side of [-1, 1]) {
    ctx.beginPath();
    ctx.arc(side * 7, 10, 3, 0, Math.PI * 2);
    ctx.fill();
  }
}

/** A blue whale about 620 px long before BLUE_WHALE_SCALE, facing right: a slim mottled blue-grey body, a pleated pale throat and big slow tail flukes. */
function blueWhale(ctx: CanvasRenderingContext2D, c: Creature) {
  const sway = Math.sin(c.phase * 0.7) * 18;
  const skin = '#5C7FA6';
  const dark = '#46668C';
  const belly = '#A9C3D8';

  ctx.save();
  ctx.translate(-286, 0);
  ctx.rotate(sway * 0.004);
  ctx.fillStyle = dark;
  ctx.beginPath();
  ctx.moveTo(16, -5);
  ctx.quadraticCurveTo(-14, -10, -52, -50 + sway * 0.5);
  ctx.quadraticCurveTo(-30, -8, -38, 0);
  ctx.quadraticCurveTo(-30, 8, -52, 50 + sway * 0.5);
  ctx.quadraticCurveTo(-14, 10, 16, 5);
  ctx.closePath();
  ctx.fill();
  ctx.restore();

  const body = () => {
    ctx.beginPath();
    ctx.moveTo(312, 8);
    ctx.quadraticCurveTo(304, -34, 224, -50);
    ctx.quadraticCurveTo(100, -70, -40, -56);
    ctx.quadraticCurveTo(-190, -36, -290, -6);
    ctx.lineTo(-290, 6);
    ctx.quadraticCurveTo(-190, 34, -40, 54);
    ctx.quadraticCurveTo(100, 68, 224, 46);
    ctx.quadraticCurveTo(304, 32, 312, 8);
    ctx.closePath();
  };
  ctx.fillStyle = skin;
  body();
  ctx.fill();

  ctx.save();
  body();
  ctx.clip();
  ctx.fillStyle = belly;
  ctx.beginPath();
  ctx.moveTo(320, 20);
  ctx.quadraticCurveTo(160, 24, 30, 30);
  ctx.quadraticCurveTo(-140, 24, -300, 8);
  ctx.lineTo(-300, 90);
  ctx.lineTo(320, 90);
  ctx.closePath();
  ctx.fill();
  ctx.strokeStyle = 'rgba(40,70,100,0.35)';
  ctx.lineWidth = 2;
  for (let i = 0; i < 9; i++) {
    const y = 26 + i * 4;
    ctx.beginPath();
    ctx.moveTo(250 - i * 4, y);
    ctx.quadraticCurveTo(160, y + 6, 40, y + 4);
    ctx.stroke();
  }
  ctx.fillStyle = 'rgba(190,215,235,0.28)';
  for (const [x, y, r] of [[60, -32, 14], [-20, -38, 18], [-110, -28, 12], [130, -40, 10], [-190, -18, 9], [20, -12, 8]]) {
    ctx.beginPath();
    ctx.ellipse(x, y, r * 1.6, r * 0.7, 0.1, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.restore();

  ctx.fillStyle = dark;
  ctx.beginPath();
  ctx.moveTo(-150, -36);
  ctx.quadraticCurveTo(-170, -52, -190, -58);
  ctx.quadraticCurveTo(-182, -44, -188, -26);
  ctx.closePath();
  ctx.fill();
  ctx.beginPath();
  ctx.moveTo(130, 44);
  ctx.quadraticCurveTo(90, 86, 28, 96 + sway * 0.2);
  ctx.quadraticCurveTo(70, 66, 96, 52);
  ctx.closePath();
  ctx.fill();

  ctx.fillStyle = '#16233A';
  ctx.beginPath();
  ctx.ellipse(200, -49, 11, 3.6, 0.06, 0, Math.PI * 2);
  ctx.fill();

  ctx.strokeStyle = 'rgba(30,50,80,0.5)';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(300, 16);
  ctx.quadraticCurveTo(250, 24, 210, 20);
  ctx.stroke();
  ctx.fillStyle = '#16233A';
  ctx.beginPath();
  ctx.arc(236, 10, 4, 0, Math.PI * 2);
  ctx.fill();
}

/** A sea turtle about 90 px long, facing right, with a domed shell and flippers that stroke slowly. */
function turtle(ctx: CanvasRenderingContext2D, c: Creature) {
  const stroke = Math.sin(c.phase * 1.6 + c.tint * 6);
  const skin = '#A5BF6E';
  const shell = ['#5E8F4E', '#6C8A3F', '#4F8A66'][Math.floor(c.tint * 3) % 3];
  ctx.fillStyle = skin;
  ctx.beginPath();
  ctx.moveTo(-34, 4);
  ctx.lineTo(-52, 8 + stroke * 2);
  ctx.lineTo(-34, 11);
  ctx.closePath();
  ctx.fill();
  const flipper = (x: number, y: number, len: number, rot: number) => {
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(rot);
    ctx.beginPath();
    ctx.ellipse(len / 2, 0, len / 2, 5, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  };
  ctx.fillStyle = skin;
  flipper(-22, 12, 20, 2.3 - stroke * 0.35);
  flipper(20, 12, 34, 0.9 + stroke * 0.7);
  ctx.beginPath();
  ctx.arc(46, -1, 9, 0, Math.PI * 2);
  ctx.fill();
  ctx.beginPath();
  ctx.ellipse(36, 2, 9, 6, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#D8D6A0';
  ctx.beginPath();
  ctx.ellipse(0, 10, 32, 7, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = shell;
  ctx.beginPath();
  ctx.moveTo(-38, 10);
  ctx.bezierCurveTo(-38, -26, 34, -26, 36, 10);
  ctx.closePath();
  ctx.fill();
  ctx.strokeStyle = 'rgba(20,40,20,0.35)';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(-18, 8);
  ctx.quadraticCurveTo(-14, -8, -8, -17);
  ctx.moveTo(2, 8);
  ctx.quadraticCurveTo(4, -6, 2, -19);
  ctx.moveTo(20, 8);
  ctx.quadraticCurveTo(16, -6, 10, -17);
  ctx.moveTo(-30, -2);
  ctx.quadraticCurveTo(0, -10, 30, -2);
  ctx.stroke();
  ctx.fillStyle = 'rgba(255,255,255,0.2)';
  ctx.beginPath();
  ctx.ellipse(-4, -14, 14, 3, -0.1, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#1B2238';
  ctx.beginPath();
  ctx.arc(50, -3, 1.8, 0, Math.PI * 2);
  ctx.fill();
}

function fish(ctx: CanvasRenderingContext2D, c: Creature) {
  const color = FISH[Math.floor(c.tint * FISH.length)];
  const wag = Math.sin(c.phase * 12) * 3;
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.moveTo(-10, 0);
  ctx.lineTo(-20, -7 + wag);
  ctx.lineTo(-20, 7 + wag);
  ctx.closePath();
  ctx.fill();
  ctx.beginPath();
  ctx.ellipse(0, 0, 13, 8, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = 'rgba(255,255,255,0.35)';
  ctx.beginPath();
  ctx.ellipse(1, -3, 7, 2.5, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#1B2238';
  ctx.beginPath();
  ctx.arc(6, -1.5, 2, 0, Math.PI * 2);
  ctx.fill();
}

function jelly(ctx: CanvasRenderingContext2D, c: Creature) {
  const pulse = 1 + Math.sin(c.phase * 2.8) * 0.08;
  ctx.strokeStyle = 'rgba(214,190,255,0.6)';
  ctx.lineWidth = 2.5;
  for (let i = -1.5; i <= 1.5; i++) {
    ctx.beginPath();
    ctx.moveTo(i * 7, 4);
    for (let s = 1; s <= 5; s++) ctx.lineTo(i * 7 + Math.sin(c.phase * 3 + s + i) * 3, 4 + s * 7);
    ctx.stroke();
  }
  ctx.save();
  ctx.scale(pulse, 1 / pulse);
  ctx.fillStyle = 'rgba(201,167,255,0.85)';
  ctx.beginPath();
  ctx.arc(0, 4, 18, Math.PI, 0);
  for (let i = 0; i < 4; i++) ctx.quadraticCurveTo(13.5 - i * 9, 9, 9 - i * 9, 4);
  ctx.fill();
  ctx.fillStyle = 'rgba(255,255,255,0.45)';
  ctx.beginPath();
  ctx.ellipse(-5, -5, 6, 3, -0.5, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}

function shark(ctx: CanvasRenderingContext2D, c: Creature, hammer = false) {
  const chasing = c.state === 'chase';
  const tail = Math.sin(c.phase * (chasing ? 12 : 7)) * 0.25;
  const fin = hammer ? '#6E7388' : '#4F6F9A';
  ctx.save();
  ctx.translate(-56, 0);
  ctx.rotate(tail);
  ctx.fillStyle = fin;
  ctx.beginPath();
  ctx.moveTo(6, -3);
  ctx.quadraticCurveTo(-8, -10, -30, -40);
  ctx.quadraticCurveTo(-26, -16, -16, -2);
  ctx.quadraticCurveTo(-18, 8, -22, 24);
  ctx.quadraticCurveTo(-8, 10, 6, 3);
  ctx.closePath();
  ctx.fill();
  ctx.restore();

  ctx.fillStyle = fin;
  ctx.beginPath();
  ctx.moveTo(-34, -13);
  ctx.quadraticCurveTo(-42, -22, -46, -20);
  ctx.quadraticCurveTo(-42, -12, -40, -10);
  ctx.closePath();
  ctx.fill();
  ctx.save();
  ctx.translate(14, 0);
  ctx.scale(-1, 1);
  ctx.beginPath();
  ctx.moveTo(-8, -22);
  ctx.quadraticCurveTo(0, -42, 8, -56);
  ctx.quadraticCurveTo(10, -36, 22, -20);
  ctx.closePath();
  ctx.fill();
  ctx.restore();

  const skin = hammer ? '#8E94A8' : '#5C7FAE';
  const body = () => {
    ctx.beginPath();
    ctx.moveTo(66, 4);
    ctx.quadraticCurveTo(52, -12, 20, -21);
    ctx.quadraticCurveTo(-26, -26, -52, -6);
    ctx.lineTo(-58, -3);
    ctx.lineTo(-58, 3);
    ctx.quadraticCurveTo(-30, 18, 2, 21);
    ctx.quadraticCurveTo(46, 22, 66, 4);
    ctx.closePath();
  };
  ctx.fillStyle = skin;
  body();
  ctx.fill();
  ctx.save();
  body();
  ctx.clip();
  ctx.fillStyle = '#EAF0F7';
  ctx.beginPath();
  ctx.moveTo(70, 6);
  ctx.quadraticCurveTo(40, 6, 10, 9);
  ctx.quadraticCurveTo(-26, 8, -60, -1);
  ctx.lineTo(-60, 30);
  ctx.lineTo(70, 30);
  ctx.closePath();
  ctx.fill();
  ctx.restore();

  if (hammer) {
    ctx.fillStyle = skin;
    ctx.beginPath();
    ctx.roundRect(63 - 17 / SHARK_LENGTH, -27, 17 / SHARK_LENGTH, 38, 8);
    ctx.fill();
    ctx.fillStyle = '#EAF0F7';
    ctx.beginPath();
    ctx.roundRect(63 - 17 / SHARK_LENGTH, 3, 17 / SHARK_LENGTH, 8, 4);
    ctx.fill();
  }

  ctx.fillStyle = fin;
  ctx.beginPath();
  ctx.moveTo(28, 12);
  ctx.quadraticCurveTo(14, 30, -16, 42);
  ctx.quadraticCurveTo(0, 22, 6, 14);
  ctx.closePath();
  ctx.fill();

  ctx.strokeStyle = 'rgba(0,0,0,0.22)';
  ctx.lineWidth = 2;
  for (const x of [24, 29, 34]) {
    ctx.beginPath();
    ctx.moveTo(x, -9);
    ctx.quadraticCurveTo(x - 3, -3, x - 1, 4);
    ctx.stroke();
  }

  if (chasing) {
    ctx.fillStyle = '#7A2E3B';
    ctx.beginPath();
    ctx.moveTo(60, 4);
    ctx.lineTo(36, 7);
    ctx.lineTo(52, 12);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = '#FFFFFF';
    for (const x of [42, 48, 54]) {
      ctx.beginPath();
      ctx.moveTo(x, 5);
      ctx.lineTo(x + 2.5, 9);
      ctx.lineTo(x + 5, 5);
      ctx.fill();
    }
  } else {
    ctx.strokeStyle = 'rgba(30,40,70,0.5)';
    ctx.beginPath();
    ctx.moveTo(56, 6);
    ctx.quadraticCurveTo(48, 10, 40, 8);
    ctx.stroke();
  }

  const eyeX = hammer ? 58 : 46;
  const eyeY = hammer ? -20 : -4;
  ctx.fillStyle = '#1B2238';
  ctx.beginPath();
  const eyeR = hammer ? (chasing ? 4.5 : 4) : chasing ? 3.4 : 3;
  ctx.ellipse(eyeX, eyeY, eyeR / SHARK_LENGTH, eyeR, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#FFFFFF';
  ctx.beginPath();
  ctx.ellipse(eyeX + 1.5 / SHARK_LENGTH, eyeY - 1.5, 1.4 / SHARK_LENGTH, 1.4, 0, 0, Math.PI * 2);
  ctx.fill();
  if (chasing) {
    ctx.strokeStyle = '#1B2238';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(38, -11);
    ctx.lineTo(52, -7);
    ctx.stroke();
  }
}

interface SquidPalette {
  arm: string;
  body: string;
  spot: string;
  sucker: string;
  /** The darker dots covering a spotted squid; plain squid have none. */
  speckle?: string;
}
const SQUID_PALETTE: SquidPalette = { arm: '#C94660', body: '#E0607E', spot: '#CC5573', sucker: '#E58AA0' };
const COLOSSAL_PALETTE: SquidPalette = { arm: '#7E2A45', body: '#9C3858', spot: '#873050', sucker: '#A8566F' };
const SQUID_SPOTTED: SquidPalette = { arm: '#D96B69', body: '#EA7F78', spot: '#C4605F', sucker: '#E9A19B', speckle: '#8E3A47' };
const COLOSSAL_SPOTTED: SquidPalette = { arm: '#8A3A44', body: '#A74C4C', spot: '#8A3C40', sucker: '#B76F70', speckle: '#4F1F2B' };
/** How many segments each of a squid's ten limbs has: eight arms, and two long tentacles (3 and 6) that are set separately. */
const SHORT_ARM_LEN = [6, 4, 7, 0, 5, 4, 0, 6, 5, 7];
/** Squid with a tint above this are the spotted kind. */
const SPOTTED_TINT = 0.7;

/** Fixed speckle positions over the mantle, fins and head of a spotted squid. */
const SQUID_SPECKLES = (() => {
  const r = mulberry32(41);
  const dots: [number, number, number][] = [];
  const finHalf = (y: number) => (y < -48 ? (30 * (y + 84)) / 36 : 30 - (y + 48) * 1.3);
  const mantleHalf = (y: number) => 12 + ((y + 44) / 40) * 6;
  const add = (n: number, y0: number, y1: number, half: (y: number) => number) => {
    for (let i = 0; i < n; i++) {
      const y = y0 + r() * (y1 - y0);
      dots.push([(r() * 2 - 1) * half(y) * 0.85, y, 0.7 + r() * 1.1]);
    }
  };
  add(26, -80, -36, finHalf);
  add(34, -44, -6, mantleHalf);
  for (let i = 0; i < 8; i++) dots.push([(r() * 2 - 1) * 3.5, -2 + r() * 14, 0.7 + r() * 0.7]);
  return dots;
})();

function squid(ctx: CanvasRenderingContext2D, c: Creature, pal: SquidPalette = SQUID_PALETTE) {
  const lunging = c.state === 'lunge';
  ctx.strokeStyle = pal.arm;
  for (let i = 0; i < 10; i++) {
    const x0 = -16 + i * (32 / 9);
    const long = i === 3 || i === 6;
    const len = long ? 11 : SHORT_ARM_LEN[i];
    ctx.lineWidth = long ? 4 : 6;
    ctx.beginPath();
    ctx.moveTo(x0, 14);
    const pts: [number, number][] = [];
    for (let s = 1; s <= len; s++) {
      const spread = lunging ? 0.3 : 1;
      const x = x0 * (1 + s * 0.12 * spread) + Math.sin(c.phase * 4 + s * 0.8 + i) * s * 0.9;
      ctx.lineTo(x, 14 + s * 11);
      pts.push([x, 14 + s * 11]);
    }
    ctx.stroke();
    const tip = pts[pts.length - 1];
    if (long) {
      ctx.fillStyle = pal.arm;
      ctx.beginPath();
      ctx.ellipse(tip[0], tip[1], 5, 9, 0, 0, Math.PI * 2);
      ctx.fill();
    }
    if (pal.speckle) {
      ctx.fillStyle = pal.speckle;
      pts.forEach(([px, py], k) => {
        ctx.beginPath();
        ctx.arc(px - 1, py - 4, 0.9, 0, Math.PI * 2);
        ctx.fill();
        if (k % 2) {
          ctx.beginPath();
          ctx.arc(px + 1.2, py + 2, 0.7, 0, Math.PI * 2);
          ctx.fill();
        }
      });
    }
    ctx.fillStyle = pal.sucker;
    const alpha = ctx.globalAlpha;
    ctx.globalAlpha = alpha * 0.7;
    pts.forEach(([px, py], k) => {
      if (k < 2) return;
      const side = (k % 2 ? 1 : -1) * (long ? 1.2 : 1.8);
      ctx.beginPath();
      ctx.arc(px + side, py + Math.sin(i * 5.1 + k * 2.3) * 3, long ? 1.1 : 1.5, 0, Math.PI * 2);
      ctx.fill();
    });
    if (long) {
      for (const [dx, dy] of [[-1.8, -4], [1.6, -1], [-1.4, 2.5], [1.4, 5]]) {
        ctx.beginPath();
        ctx.arc(tip[0] + dx, tip[1] + dy, 1.2, 0, Math.PI * 2);
        ctx.fill();
      }
    }
    ctx.globalAlpha = alpha;
  }
  ctx.fillStyle = pal.body;
  ctx.beginPath();
  ctx.moveTo(0, -84);
  ctx.quadraticCurveTo(24, -70, 30, -48);
  ctx.quadraticCurveTo(22, -40, 12, -34);
  ctx.lineTo(-12, -34);
  ctx.quadraticCurveTo(-22, -40, -30, -48);
  ctx.quadraticCurveTo(-24, -70, 0, -84);
  ctx.fill();
  ctx.beginPath();
  ctx.moveTo(-13, -44);
  ctx.bezierCurveTo(-22, -30, -20, -14, -15, -4);
  ctx.lineTo(15, -4);
  ctx.bezierCurveTo(20, -14, 22, -30, 13, -44);
  ctx.closePath();
  ctx.fill();
  ctx.beginPath();
  ctx.ellipse(0, 5, 17, 13, 0, 0, Math.PI * 2);
  ctx.fill();
  if (pal.speckle) {
    ctx.fillStyle = pal.speckle;
    for (const [x, y, r] of SQUID_SPECKLES) {
      ctx.beginPath();
      ctx.arc(x, y, r, 0, Math.PI * 2);
      ctx.fill();
    }
  }
  ctx.lineWidth = 2;
  ctx.strokeStyle = pal.spot;
  ctx.beginPath();
  ctx.moveTo(0, -80);
  ctx.lineTo(0, -34);
  ctx.moveTo(-15, -4);
  ctx.quadraticCurveTo(0, 2, 15, -4);
  ctx.stroke();
  ctx.fillStyle = pal.spot;
  for (const [x, y, r] of [
    [-7, -26, 3.2],
    [6, -18, 2.4],
    [-3, -12, 2],
    [8, -30, 1.8],
  ]) {
    ctx.beginPath();
    ctx.arc(x, y, r, 0, Math.PI * 2);
    ctx.fill();
  }
  for (const x of [-10, 10]) {
    ctx.fillStyle = '#FFFFFF';
    ctx.beginPath();
    ctx.arc(x, 5, 5.5, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#1B2238';
    ctx.beginPath();
    ctx.arc(x, 5, 3.8, 0, Math.PI * 2);
    ctx.fill();
  }
}

function angler(ctx: CanvasRenderingContext2D, c: Creature) {
  const dead = c.state === 'dead';
  ctx.scale(ANGLER_SCALE, ANGLER_SCALE);
  ctx.rotate(Math.PI * anglerFlip(c));
  if (dead) ctx.globalAlpha = Math.max(0, Math.min(1, (6 - c.dying) / 2));
  const wag = dead ? 0 : Math.sin(c.phase * 5) * 0.3;
  ctx.save();
  ctx.translate(-36, 0);
  ctx.rotate(wag);
  ctx.fillStyle = '#2E2445';
  ctx.beginPath();
  ctx.moveTo(4, 0);
  ctx.lineTo(-22, -18);
  ctx.lineTo(-18, 18);
  ctx.closePath();
  ctx.fill();
  ctx.restore();

  ctx.strokeStyle = '#4A3D6B';
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(8, -30);
  ctx.quadraticCurveTo(40, -66, 62, -36);
  ctx.stroke();

  ctx.fillStyle = '#3D3159';
  ctx.beginPath();
  ctx.ellipse(0, 0, 42, 32, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#4C3F6E';
  ctx.beginPath();
  ctx.ellipse(-6, 10, 28, 16, 0, 0, Math.PI * 2);
  ctx.fill();

  const open = 0.5 + Math.sin(c.phase * 2) * 0.15;
  ctx.fillStyle = '#1A1026';
  ctx.beginPath();
  ctx.moveTo(44, -6);
  ctx.lineTo(12, 6);
  ctx.lineTo(44, 6 + 22 * open);
  ctx.closePath();
  ctx.fill();
  ctx.fillStyle = '#F4F1FF';
  for (let i = 0; i < 4; i++) {
    const x = 20 + i * 7;
    ctx.beginPath();
    ctx.moveTo(x, 1 - i * 1.6);
    ctx.lineTo(x + 3, 9 - i);
    ctx.lineTo(x + 6, 1 - i * 1.6);
    ctx.fill();
    ctx.beginPath();
    ctx.moveTo(x, 10 + i * 4 * open);
    ctx.lineTo(x + 3, 3 + i * 3.5 * open);
    ctx.lineTo(x + 6, 10 + i * 4 * open);
    ctx.fill();
  }
  ctx.fillStyle = '#BFF7FF';
  ctx.beginPath();
  ctx.arc(18, -14, 4, 0, Math.PI * 2);
  ctx.fill();
}

/** The lure bulb is drawn after the darkness pass so it glows. */
export function drawLureBulb(ctx: CanvasRenderingContext2D, x: number, y: number, t: number, glow = 1) {
  if (glow <= 0.02) return;
  const r = (6 + Math.sin(t * 4) * 1.2) * (0.5 + 0.5 * glow);
  ctx.save();
  ctx.globalAlpha = glow;
  ctx.shadowColor = '#FFF3A3';
  ctx.shadowBlur = 22 * glow;
  ctx.fillStyle = '#FFF6B8';
  ctx.beginPath();
  ctx.arc(x, y, r, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}

/** The leviathan's bioluminescence in world coordinates: its eyes and the rows of lights down both sides of its body. */
export function leviathanGlows(c: Creature) {
  const { n, at, radius } = leviathanSpine(c);
  const glows: { x: number; y: number; r: number; core: number; power: number }[] = [];
  const power = c.glow ?? 1;
  if (power < 0.02) return glows;
  const cos = Math.cos(c.angle);
  const sin = Math.sin(c.angle);
  for (const side of [-1, 1]) {
    const ex = 34 * MS;
    const ey = side * 62 * MS;
    glows.push({ x: c.x + ex * cos - ey * sin, y: c.y + ex * sin + ey * cos, r: 150, core: 11 * MS, power });
  }
  for (let k = 4; k < n; k += 5) {
    const p = at(k);
    const r = radius(k);
    for (const side of [-1, 1]) {
      glows.push({ x: c.x + p.x + p.nx * side * r * 0.6, y: c.y + p.y + p.ny * side * r * 0.6, r: Math.max(50, r * 0.7), core: Math.max(3, r * 0.07), power });
    }
  }
  return glows;
}

export function drawLeviathanGlows(ctx: CanvasRenderingContext2D, glows: ReturnType<typeof leviathanGlows>, t: number) {
  ctx.save();
  ctx.globalCompositeOperation = 'lighter';
  glows.forEach((g, i) => {
    const pulse = (0.8 + 0.2 * Math.sin(t * 1.5 + i * 0.7)) * g.power;
    const halo = ctx.createRadialGradient(g.x, g.y, 0, g.x, g.y, g.r * 0.6);
    halo.addColorStop(0, `rgba(200,225,245,${0.175 * pulse})`);
    halo.addColorStop(1, 'rgba(200,225,245,0)');
    ctx.fillStyle = halo;
    ctx.beginPath();
    ctx.arc(g.x, g.y, g.r * 0.6, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = `rgba(240,248,255,${0.425 * pulse})`;
    ctx.beginPath();
    ctx.arc(g.x, g.y, g.core, 0, Math.PI * 2);
    ctx.fill();
  });
  ctx.restore();
}
