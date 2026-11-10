import type { Creature } from '../game/world';
import { MONSTER_SCALE as MS, MONSTER_TRAIL } from '../config';
import { leviathanSpine } from '../data/leviathan';
import { mulberry32 } from '../util';
import { WHALE_REAR_TOP, WHALE_REAR_BOTTOM, WHALE_TAIL } from './whaleShapes';
import { FISH_FULL_SPEED, BIGFIN_SCALE, SQUID_SCALE, BLUE_WHALE_SCALE, MOBY_DICK_SCALE, COLOSSAL_SCALE, GIANT_SCALE, GIANT_TENTACLE, SHARK_LENGTH, SHARK_SCALE, greatWhiteScale, anglerScale, mantaScale, HAMMERHEAD_SCALE, turtleScale, JELLY_SCALE, WHALE_SCALE, whalePitch } from '../data/creatures';

const FISH = ['#FFB547', '#FF7A6B', '#7BDFF2', '#B9F18C'];

/** The lure is a small steady vertical pill, in world px. */
const LURE_W = 3;
const LURE_H = 9;

const REDUCED_MOTION = typeof matchMedia === 'function' && matchMedia('(prefers-reduced-motion: reduce)').matches;
/** How far down the tail the swing is delayed, in radians, and how far the tip sways sideways per unit of distance. */
const TAIL_PHASE_STEP = 1.2;
const TAIL_SWAY = 0.22;

interface TailSwing {
  speed: number;
  maxAngle: number;
}

/** The tail's swing angle at `d` (0 at the hinge, 1 at the tip): later and wider the farther from the hinge. */
function tailAngle(time: number, d: number, { speed, maxAngle }: TailSwing) {
  return REDUCED_MOTION ? 0 : Math.sin(time * speed - d * TAIL_PHASE_STEP) * maxAngle * (0.4 + 0.6 * d);
}

/** Fakes a swim-style tail flip in 2D: points are relative to the hinge with the tail pointing along -x, and the width (y) is squashed by the swing angle and shifted by it more toward the tip. */
function tailPoints(base: [number, number][], time: number, swing: TailSwing, length = Math.max(...base.map(([x]) => -x))): [number, number][] {
  return base.map(([x, y]) => {
    const d = Math.min(1, Math.max(0, -x / length));
    const a = tailAngle(time, d, swing);
    return [x, y * Math.cos(a) + Math.sin(a) * TAIL_SWAY * -x];
  });
}

/** -1..1: how far the tail tip is swung toward (positive) or away from the viewer. */
const tailDepth = (time: number, swing: TailSwing) => Math.sin(tailAngle(time, 1, swing));

/** The swing of a fish-type tail: it beats wider the faster the animal moves. */
const tailSwing = (c: Creature, speed: number, fullSpeed: number): TailSwing => ({
  speed,
  maxAngle: 0.6 + 0.4 * Math.min(1, Math.hypot(c.vx, c.vy) / fullSpeed),
});

/** Draws a fish-type tail flipping around its hinge: `path` traces the flipped points, and the tail is drawn larger and lighter when it swings toward the viewer, smaller and darker when away. */
function swimTail(
  ctx: CanvasRenderingContext2D,
  hinge: [number, number],
  time: number,
  swing: TailSwing,
  base: [number, number][],
  color: string,
  path: (p: [number, number][]) => void,
  after?: () => void,
) {
  const depth = tailDepth(time, swing);
  const pts = tailPoints(base, time, swing);
  ctx.save();
  ctx.translate(hinge[0], hinge[1]);
  ctx.scale(1 + 0.15 * depth, 1 + 0.15 * depth);
  ctx.fillStyle = color;
  path(pts);
  ctx.fill();
  ctx.fillStyle = depth > 0 ? `rgba(255,255,255,${0.08 * depth})` : `rgba(0,0,0,${-0.1 * depth})`;
  path(pts);
  ctx.fill();
  after?.();
  ctx.restore();
}

/** How far a dead anglerfish has flipped belly-up, 0..1. */
const anglerFlip = (c: Creature) => (c.state === 'dead' ? Math.min(1, c.dying / 1.2) : 0);

/** How bright the lure still is: full while alive, dimming out over about three seconds once dead. */
export function lureGlow(c: Creature) {
  return c.state === 'dead' ? Math.max(0, 1 - c.dying / 3) : 1;
}

export function anglerLure(c: Creature) {
  const a = Math.PI * anglerFlip(c);
  const sc = anglerScale(c.tint);
  const lx = 63 * sc;
  const ly = -23 * sc;
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
      ctx.scale(JELLY_SCALE, JELLY_SCALE);
      jelly(ctx, c);
      break;
    case 'shark':
    case 'hammerhead':
      ctx.scale(c.facing, 1);
      ctx.rotate(Math.max(-0.8, Math.min(0.8, Math.atan2(c.vy, Math.max(Math.abs(c.vx), 40)))));
      ctx.scale(SHARK_LENGTH * SHARK_SCALE, SHARK_SCALE);
      if (c.kind === 'shark') {
        const gw = greatWhiteScale(c.tint);
        ctx.scale(gw, gw);
      }
      if (c.kind === 'hammerhead') {
        ctx.scale(HAMMERHEAD_SCALE, HAMMERHEAD_SCALE);
        hammerhead(ctx, c);
      } else greatWhite(ctx, c);
      break;
    case 'squid':
      ctx.rotate(c.angle + Math.PI / 2);
      ctx.scale(SQUID_SCALE, SQUID_SCALE);
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
      if (c.kind === 'manta') {
        const ms = mantaScale(c.tint);
        ctx.scale(ms, ms);
        manta(ctx, c);
      } else stingray(ctx, c);
      break;
    case 'bigfin':
      ctx.scale(BIGFIN_SCALE, BIGFIN_SCALE);
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
    case 'turtle': {
      ctx.scale(c.facing, 1);
      ctx.rotate(Math.max(-0.3, Math.min(0.3, Math.atan2(c.vy, Math.max(Math.abs(c.vx), 25)))));
      const ts = turtleScale(c.tint);
      ctx.scale(ts, ts);
      turtle(ctx, c);
      break;
    }
    case 'colossal':
      ctx.rotate(c.angle + Math.PI / 2);
      ctx.scale(COLOSSAL_SCALE, COLOSSAL_SCALE);
      squid(ctx, c, c.tint > SPOTTED_TINT ? COLOSSAL_SPOTTED : COLOSSAL_PALETTE);
      break;
    case 'giant':
      ctx.rotate(c.angle + Math.PI / 2);
      ctx.scale(GIANT_SCALE, GIANT_SCALE);
      squid(ctx, c, c.tint > SPOTTED_TINT ? GIANT_SPOTTED : GIANT_PALETTE, GIANT_TENTACLE, 26, 0.88);
      break;
    case 'whale':
    case 'mobydick':
      {
        const size = c.kind === 'mobydick' ? MOBY_DICK_SCALE : WHALE_SCALE;
        ctx.scale(c.facing * size, size);
      }
      ctx.rotate(whalePitch(c));
      whale(ctx, c, c.kind === 'mobydick');
      break;
  }
  ctx.restore();
}

/** A whale's blowhole: a short wide oval pointing forward (+x), centered on (x, y) and tilted by `angle`. */
function drawBlowhole(ctx: CanvasRenderingContext2D, x: number, y: number, len: number, half: number, angle: number, color: string) {
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(angle);
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.moveTo(len / 2, 0);
  ctx.bezierCurveTo(len * (0.5 - 0.21), -half, len * (0.5 - 0.58), -half * 1.05, len * (0.5 - 0.83), -half * 0.6);
  ctx.quadraticCurveTo(-len / 2, 0, len * (0.5 - 0.83), half * 0.6);
  ctx.bezierCurveTo(len * (0.5 - 0.58), half * 1.05, len * (0.5 - 0.21), half, len / 2, 0);
  ctx.closePath();
  ctx.fill();
  ctx.restore();
}

/** The sperm whale's outline and its two lighter tones, traced from the reference image: about 480 px long, head at +x. */
const SPERM_SILHOUETTE: [number, number][][] = [
  [
    [-39.6, -56], [-43.3, -56], [-45.4, -55.3], [-49.4, -53.2], [-57.6, -47.6], [-61.3, -46], [-66.7, -45.7], [-74.8, -47.4],
    [-80.2, -47.4], [-83.9, -46.2], [-90.9, -42.7], [-94.4, -41.8], [-99.6, -41.8], [-106.6, -43.4], [-111.9, -43.4], [-115.2, -42.5],
    [-122, -39.2], [-126.6, -38], [-130.1, -37.6], [-139.9, -37.8], [-144.4, -37.1], [-146.9, -36.2], [-154.2, -32.2], [-162.8, -29.2],
    [-169.8, -25.7], [-181.9, -16.8], [-191.3, -8.4], [-202.5, -8.2], [-213.7, -7], [-223, -4.9], [-229.5, -2.3], [-230, -1.2],
    [-229.1, -0.2], [-223.9, 2.1], [-221.8, 4], [-220.7, 6.5], [-220.7, 13.3], [-219.5, 14.7], [-217.2, 15.6], [-219.5, 18.4],
    [-220.4, 20.3], [-221.1, 23.3], [-220.7, 27.1], [-218.6, 32.9], [-218.1, 37.8], [-219.5, 45], [-223.9, 56.2], [-223.9, 57.9],
    [-223, 59], [-220, 58.8], [-211.8, 54.6], [-204.1, 49], [-197.8, 42.9], [-193.8, 38], [-188.5, 29.9], [-177.5, 10],
    [-171.4, 7.9], [-163.3, 6.8], [-156.5, 6.8], [-150.2, 7.5], [-142.7, 9.1], [-126.2, 14], [-115.9, 16.1], [-107.3, 16.6],
    [-96.3, 15.9], [-83.5, 17.3], [-70.2, 20.3], [-37.7, 29.9], [-16.3, 34.5], [17.4, 38.7], [33.9, 39.9], [52.8, 40.4],
    [53.1, 40.6], [50.7, 45.3], [49.3, 50.4], [49.3, 53], [50.7, 54.6], [54.9, 54.6], [60.8, 53.7], [72.7, 50.2],
    [80.6, 46.9], [92.5, 40.4], [114.2, 42.5], [122.8, 42.5], [152.5, 39.9], [170.2, 39.7], [200.1, 44.1], [215.5, 44.3],
    [222.7, 43.4], [231.1, 40.8], [234.1, 39.4], [238.6, 36.4], [241.6, 33.4], [244.2, 29.9], [246, 26.4], [248.4, 20.1],
    [250, 11], [249.5, 1.6], [248.4, -3.7], [242.8, -18.7], [239.7, -24], [236.5, -27.3], [231.8, -30.1], [224.8, -32.4],
    [208.9, -35.5], [168.3, -39.9], [151.3, -42.5], [142, -44.3], [128.9, -45.7], [114.2, -46], [73.6, -48.3], [55.6, -48.3],
    [2.4, -46.4], [-18.4, -46.2], [-25.4, -47.8], [-28.6, -49.5], [-36.1, -54.6],
  ],
];
const SPERM_MID: [number, number][][] = [
  [
    [-38.9, -55.8], [-40.8, -55.5], [-40.5, -54.4], [-42.4, -54.1], [-37.5, -52], [-31.7, -47.8], [-30, -46.2], [-30, -45.5],
    [-31.4, -44.6], [-62.5, -42.5], [-97.2, -38], [-102.4, -37.8], [-122.9, -34.5], [-139, -31.3], [-144.8, -29.9], [-157.2, -25.7],
    [-172.4, -18.4], [-183.6, -10.7], [-197.8, 0.9], [-198.5, 0.7], [-197.6, -1.2], [-198, -2.3], [-211.6, -3.3], [-217.9, -1.9],
    [-218.8, -1.2], [-218.8, -0.2], [-215.1, 4.9], [-213.7, 10.3], [-212.5, 11.4], [-210.6, 12.1], [-209.7, 13.5], [-212.3, 18],
    [-213, 20.5], [-213, 26.6], [-212, 33.1], [-212.3, 38.3], [-212.7, 41.1], [-215.1, 47.1], [-214.8, 48.3], [-213.7, 48.3],
    [-210.2, 46], [-205, 40.8], [-200.1, 34.3], [-187.1, 14.5], [-175.2, -0.5], [-170.7, -5.1], [-170.3, -3.5], [-171.7, 0],
    [-171.2, 0.9], [-161.2, -0.7], [-155.1, -0.9], [-143.7, 0.5], [-129.7, 4], [-115.4, 6.5], [-84.6, 7.2], [-74.1, 8.2],
    [-62.9, 10], [-41.9, 15.2], [-22.6, 18.9], [-17.7, 19.1], [-11.1, 20.3], [15.7, 22.4], [29.3, 22.4], [37.7, 21.7],
    [54.7, 18.7], [70.1, 15.2], [83.9, 13.3], [88.8, 13.3], [95.1, 14.2], [100, 15.9], [111.2, 21.5], [114.9, 22.6],
    [119.3, 23.1], [123.5, 23.1], [134.3, 21.7], [157.8, 16.3], [169.7, 15.2], [177.2, 15.6], [181.6, 16.6], [208.2, 26.4],
    [214.5, 27.8], [219.9, 28], [228.5, 26.6], [234.4, 23.8], [240.7, 17.7], [242.8, 14], [244.2, 10], [244.4, 2.1],
    [242.3, -4.2], [239.5, -7], [232.3, -10], [232.3, -11], [233, -11.7], [238.1, -13.5], [240.2, -15.9], [240.7, -18.4],
    [239, -23.1], [236.7, -25.2], [236.5, -27.3], [234.1, -28.9], [229.5, -31], [222, -33.1], [199.6, -36.6], [169.3, -39.7],
    [142, -44.3], [128.9, -45.7], [121.9, -45.5], [120.5, -46], [91.8, -47.1], [90.6, -47.6], [82, -47.6], [80.8, -48.1],
    [74.8, -47.1], [72.9, -48.3], [55.9, -48.3], [54.2, -47.1], [50, -48.1], [46.5, -48.1], [45.1, -47.4], [43, -47.8],
    [37.7, -47.4], [31.8, -47.6], [30.4, -46.7], [28.6, -47.4], [25.3, -47.4], [23.9, -46.9], [10.1, -46.9], [2.6, -46.7],
    [1.2, -46.2], [-6, -46.4], [-7.4, -45.5], [-10.9, -46.2], [-17.4, -46], [-25.4, -47.8], [-29.8, -49.9], [-33.5, -53],
    [-35.6, -53.7], [-36.6, -54.8],
  ],
  [
    [87.4, 16.3], [82.9, 16.8], [77.3, 20.8], [67.3, 24.7], [59.6, 30.8], [54.9, 36.4], [53.5, 39], [51.2, 39.2],
    [50.5, 40.1], [53.1, 40.6], [50.7, 45.3], [49.6, 49], [49.3, 51.8], [50.5, 51.8], [50.7, 50.9], [51.2, 51.6],
    [53.5, 52], [58.9, 51.1], [72.4, 46.7], [79.4, 43.2], [82, 42.5], [86.7, 39.7], [89.5, 39], [91.8, 37.6],
    [95.1, 36.9], [98.3, 35], [101.6, 36.2], [111.6, 33.4], [112.1, 32.4], [111.4, 32], [111.2, 30.3], [110, 28.7],
    [102.3, 22.4], [93.7, 18],
  ],
];
const SPERM_LIGHT: [number, number][][] = [
  [
    [75.2, -46.2], [42.8, -46], [37.2, -45.5], [40.7, -44.8], [45.6, -45.3], [55.6, -45], [57.3, -45.5], [84.8, -45],
    [90.4, -44.1], [99, -43.6], [115.4, -42.9], [122.1, -43.2], [136.8, -42], [143.8, -40.4], [148.5, -40.1], [167.9, -36.9],
    [173, -36.9], [198.9, -33.6], [204.5, -33.6], [219, -31.5], [217.3, -32.2], [199.8, -34.8], [171.4, -37.3], [149.7, -40.8],
    [145.9, -42], [135.4, -43.4],
  ],
  [
    [30.7, -33.4], [17.1, -33.4], [-31.9, -31.7], [-57.8, -29.9], [-74.8, -28], [-102.1, -23.3], [-109.8, -20.8], [-113.1, -19.1],
    [-117.8, -15.4], [-118.5, -12.8], [-117.3, -11.2], [-114.7, -10], [-106.3, -7.9], [-86.5, -5.1], [-62.7, -4], [-42.2, -2.1],
    [-6.2, 4.2], [10.6, 5.6], [33.7, 5.1], [58.2, 2.1], [92, -3.5], [107, -4.9], [114.4, -4.7], [140.1, -0.2],
    [154.3, -0.2], [161.1, -1.2], [168.8, -3], [181.6, -7.5], [189.6, -11.9], [192.1, -15.6], [191.9, -19.1], [191.2, -20.5],
    [188.9, -22.6], [186.3, -24], [179.3, -25.4], [157.1, -26.8], [139.9, -29.2], [102.3, -32], [86.4, -32.7],
  ],
  [
    [82.7, 19.4], [80.8, 19.6], [76.2, 22.6], [66.8, 26.4], [62.9, 29.4], [58.9, 33.4], [54.5, 39.9], [52.6, 41.1],
    [51.9, 42.5], [53.1, 43.6], [52.6, 46.4], [54, 47.4], [58.2, 47.6], [66.8, 45.5], [79.4, 40.4], [86.7, 36.9],
    [90.2, 34.5], [92, 32.7], [93, 30.6], [92.5, 26.6], [88.8, 22.9],
  ],
];

/** A sperm whale about 480 px long, facing right: a huge blocky head, a slim tail stock that curves down, and flukes that sway slowly. */
function whale(ctx: CanvasRenderingContext2D, c: Creature, white = false) {
  const sway = Math.sin(c.phase * 0.9) * 16;
  const dark = white ? '#B4C0CC' : '#263642';
  const mid = white ? '#D0D9E2' : '#364855';
  const light = white ? '#EAF0F5' : '#415663';
  const line = white ? '#6F8194' : '#0E1822';
  const eye = white ? '#2A3642' : '#0E1822';
  const fill = (poly: [number, number][]) => {
    const m = (a: [number, number], b: [number, number]): [number, number] => [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2];
    ctx.beginPath();
    ctx.moveTo(...m(poly[poly.length - 1], poly[0]));
    poly.forEach((p, i) => ctx.quadraticCurveTo(p[0], p[1], ...m(p, poly[(i + 1) % poly.length])));
    ctx.closePath();
  };
  const layers = () => {
    ctx.lineJoin = 'round';
    ctx.lineWidth = 1.1;
    ctx.strokeStyle = line;
    ctx.fillStyle = dark;
    for (const p of SPERM_SILHOUETTE) {
      fill(p);
      ctx.fill();
      ctx.stroke();
    }
    ctx.fillStyle = mid;
    for (const p of SPERM_MID) {
      fill(p);
      ctx.fill();
    }
    ctx.fillStyle = light;
    for (const p of SPERM_LIGHT) {
      fill(p);
      ctx.fill();
    }
  };

  ctx.save();
  ctx.beginPath();
  ctx.rect(-400, -200, 243, 400);
  ctx.clip();
  ctx.translate(-160, -17);
  ctx.rotate(sway * 0.004);
  ctx.translate(160, 17);
  layers();
  ctx.restore();

  const open = Math.pow(0.5 - 0.5 * Math.cos(c.phase * 0.3), 2) * 0.32;
  const hingeX = 158;
  const hingeY = 34;
  const mouth = (t: number): [number, number] => [
    (1 - t) ** 2 * 227.8 + 2 * (1 - t) * t * 192.6 + t * t * 159,
    (1 - t) ** 2 * 41.8 + 2 * (1 - t) * t * 40.5 + t * t * 34.5,
  ];
  const lip = (t: number): [number, number] => {
    const [x, y] = mouth(t);
    return [x, y - 1.2];
  };
  const swing = (p: [number, number]): [number, number] => {
    const dx = p[0] - hingeX;
    const dy = p[1] - hingeY;
    return [hingeX + dx * Math.cos(open) - dy * Math.sin(open), hingeY + dx * Math.sin(open) + dy * Math.cos(open)];
  };
  const jaw = (pad = 0) => {
    ctx.moveTo(lip(0)[0], lip(0)[1] - pad);
    for (let i = 1; i <= 10; i++) ctx.lineTo(lip(i / 10)[0], lip(i / 10)[1] - pad);
    ctx.lineTo(155 - pad, 32.8 - pad);
    ctx.lineTo(155 - pad, 60 + pad);
    ctx.lineTo(224.6, 60 + pad);
    ctx.lineTo(224.6, 44.82 + pad);
    ctx.arc(224.6, 41.5, 3.32 + pad, Math.PI / 2, -0.27, true);
    ctx.closePath();
  };

  ctx.save();
  ctx.beginPath();
  ctx.rect(-160, -200, 560, 400);
  ctx.clip();
  ctx.save();
  ctx.translate(hingeX, hingeY);
  ctx.rotate(open);
  ctx.translate(-hingeX, -hingeY);
  ctx.fillStyle = '#EDE6D3';
  for (let i = 0; i < 14; i++) {
    const [x, y] = mouth(0.06 + i * 0.068);
    ctx.beginPath();
    ctx.moveTo(x - 1.3, y);
    ctx.lineTo(x, y - 5);
    ctx.lineTo(x + 1.3, y);
    ctx.closePath();
    ctx.fill();
  }
  ctx.save();
  ctx.beginPath();
  jaw(1);
  ctx.clip();
  layers();
  ctx.restore();
  ctx.restore();
  ctx.save();
  ctx.beginPath();
  ctx.rect(-400, -200, 800, 400);
  jaw();
  ctx.clip('evenodd');
  layers();
  ctx.restore();
  ctx.strokeStyle = line;
  ctx.lineWidth = 1.1;
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';
  ctx.beginPath();
  ctx.moveTo(232.5, 40.6);
  ctx.lineTo(229.2, 41.7);
  ctx.quadraticCurveTo(226.4, 42, ...lip(0.05));
  for (let i = 1; i <= 10; i++) ctx.lineTo(...lip(i / 10));
  ctx.stroke();
  ctx.restore();

  drawBlowhole(ctx, 203, -29, 15, 2.6, 0.17, white ? 'rgba(60,80,100,0.6)' : 'rgba(8,16,24,0.7)');
  ctx.fillStyle = eye;
  ctx.beginPath();
  ctx.ellipse(119.6, 13.5, 5.5, 2.6, 0.05, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#FFFFFF';
  ctx.beginPath();
  ctx.arc(120.6, 12.8, 0.9, 0, Math.PI * 2);
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
const MANTA_LOOKS = [
  { dark: '#2F4A5C', tail: '#24404F', belly: '#B9D8DE' },
  { dark: '#37405F', tail: '#2A3050', belly: '#C0CCE6' },
  { dark: '#2F3E5C', tail: '#24304A', belly: '#B7D1E8' },
];

function manta(ctx: CanvasRenderingContext2D, c: Creature) {
  const flap = Math.sin(c.phase * 1.8 + c.tint * 6);
  const look = MANTA_LOOKS[Math.floor(c.tint * 3) % 3];
  const dark = look.dark;
  ctx.lineCap = 'round';
  ctx.strokeStyle = look.tail;
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
  ctx.fillStyle = look.belly;
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


/** A blue whale about 620 px long before BLUE_WHALE_SCALE, facing right: a long slim blue-grey body, a pale pleated throat, a small dorsal fin near the tail, a broad flipper and big slow tail flukes. Points are traced from a side-view reference (left-facing, 1150 px long) and mirrored. */
function blueWhale(ctx: CanvasRenderingContext2D, c: Creature) {
  const k = 0.54;
  const P = (x: number, y: number): [number, number] => [(686 - x) * k, (y - 380) * k];
  const smooth = (pts: [number, number][]) => {
    const m = (a: [number, number], b: [number, number]) => P((a[0] + b[0]) / 2, (a[1] + b[1]) / 2);
    ctx.moveTo(...m(pts[pts.length - 1], pts[0]));
    pts.forEach((p, i) => ctx.quadraticCurveTo(...P(p[0], p[1]), ...m(p, pts[(i + 1) % pts.length])));
    ctx.closePath();
  };
  const sway = Math.sin(c.phase * 0.7);
  const skin = '#6D82A1';
  const dark = '#5A7292';
  const belly = '#C5D8E8';
  const shade = '#5B7090';
  const glow = '#7B90AE';
  const outline = '#3F5374';
  /** The tail's inner end curves in toward the middle, so its edges stay hidden inside the body as it swings. */
  const tailShape: [number, number][] = WHALE_TAIL.map(([x, y]) => {
    const t = Math.max(0, (1010 - x) / 40);
    return [x, y + (382 - y) * 0.13 * t * t];
  });
  ctx.save();
  const [tx, ty] = P(1000, 382);
  ctx.translate(tx, ty);
  ctx.rotate(sway * 0.07);
  ctx.translate(-tx, -ty);
  ctx.fillStyle = skin;
  ctx.beginPath();
  smooth(tailShape);
  ctx.fill();
  const fade = (from: number, to: number, rgb: string) => {
    const g = ctx.createLinearGradient(P(from, 0)[0], 0, P(to, 0)[0], 0);
    g.addColorStop(0, `rgba(${rgb},0)`);
    g.addColorStop(1, `rgba(${rgb},1)`);
    return g;
  };
  ctx.save();
  ctx.beginPath();
  smooth(tailShape);
  ctx.clip();
  ctx.strokeStyle = fade(1090, 1160, '91,112,144');
  ctx.lineWidth = 10;
  ctx.lineJoin = 'round';
  ctx.beginPath();
  smooth(tailShape);
  ctx.stroke();
  ctx.fillStyle = shade;
  ctx.beginPath();
  smooth([[1088, 343], [1112, 336], [1142, 328], [1150, 330], [1140, 335], [1112, 343], [1090, 349]]);
  ctx.fill();
  ctx.restore();
  ctx.strokeStyle = outline;
  ctx.lineWidth = 1.1;
  ctx.lineJoin = 'round';
  ctx.beginPath();
  smooth(tailShape);
  ctx.stroke();
  ctx.restore();

  const topEdge: [number, number][] = [
    [112, 353], [200, 326], [300, 304], [335, 297], [362, 289], [388, 289], [415, 295], [500, 292], [650, 300], [800, 318],
    ...WHALE_REAR_TOP,
  ];
  const bottomEdge: [number, number][] = [...WHALE_REAR_BOTTOM, [650, 452], [500, 465], [350, 462], [230, 440], [150, 400], [116, 366]];
  const body = () => {
    ctx.beginPath();
    smooth([...topEdge, ...bottomEdge]);
  };
  const edge = (pts: [number, number][]) => {
    const m = (a: [number, number], b: [number, number]) => P((a[0] + b[0]) / 2, (a[1] + b[1]) / 2);
    ctx.beginPath();
    ctx.moveTo(...P(...pts[0]));
    for (let i = 1; i < pts.length - 1; i++) ctx.quadraticCurveTo(...P(...pts[i]), ...m(pts[i], pts[i + 1]));
    ctx.lineTo(...P(...pts[pts.length - 1]));
  };
  ctx.fillStyle = skin;
  body();
  ctx.fill();

  ctx.save();
  body();
  ctx.clip();
  ctx.fillStyle = shade;
  ctx.beginPath();
  smooth([[114, 358], [250, 349], [350, 362], [430, 392], [415, 404], [300, 366], [114, 362]]);
  ctx.fill();
  ctx.beginPath();
  smooth([[430, 392], [560, 396], [700, 402], [850, 404], [930, 412], [990, 424], [930, 450], [430, 450]]);
  ctx.fill();
  ctx.fillStyle = glow;
  ctx.beginPath();
  smooth([[330, 330], [420, 317], [560, 312], [700, 320], [830, 334], [930, 346], [990, 354], [930, 372], [800, 378], [660, 382], [520, 374], [420, 364], [350, 350]]);
  ctx.fill();
  ctx.restore();

  ctx.save();
  body();
  ctx.clip();
  ctx.fillStyle = belly;
  ctx.beginPath();
  ctx.moveTo(...P(90, 360));
  ctx.lineTo(...P(114, 360));
  ctx.quadraticCurveTo(...P(300, 362), ...P(420, 402));
  for (const [x, y] of [[560, 418], [700, 428], [850, 430], [940, 432], [1000, 426], [1030, 426], [1030, 540], [90, 540]]) ctx.lineTo(...P(x, y));
  ctx.closePath();
  ctx.fill();
  ctx.strokeStyle = 'rgba(70,95,135,0.6)';
  ctx.lineWidth = 1.3;
  for (let i = 0; i < 6; i++) {
    ctx.beginPath();
    ctx.moveTo(...P(130 + i * 14, 372 + i * 10));
    ctx.quadraticCurveTo(...P(300, 400 + i * 10), ...P(485 + i * 2, 428 + i * 3));
    ctx.stroke();
  }
  ctx.restore();

  ctx.strokeStyle = outline;
  ctx.lineWidth = 1.1;
  ctx.lineJoin = 'round';
  edge([...bottomEdge, ...topEdge]);
  ctx.stroke();

  ctx.strokeStyle = 'rgba(40,60,95,0.7)';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(...P(114, 360));
  ctx.quadraticCurveTo(...P(300, 362), ...P(420, 402));
  ctx.stroke();


  drawBlowhole(ctx, ...P(379, 298.5), 18 * k, 4 * k, 0, 'rgba(30,48,80,0.75)');

  ctx.save();
  const [fx, fy] = P(475, 392);
  ctx.translate(fx, fy);
  ctx.rotate(Math.sin(c.phase * 0.5) * 0.06);
  ctx.translate(-fx, -fy);
  ctx.fillStyle = skin;
  ctx.strokeStyle = dark;
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(...P(432, 396));
  ctx.bezierCurveTo(...P(430, 380), ...P(515, 380), ...P(522, 400));
  ctx.bezierCurveTo(...P(530, 440), ...P(570, 490), ...P(565, 518));
  ctx.bezierCurveTo(...P(560, 528), ...P(525, 526), ...P(505, 505));
  ctx.bezierCurveTo(...P(470, 470), ...P(440, 430), ...P(432, 396));
  ctx.closePath();
  ctx.fill();
  ctx.save();
  const [px, py] = P(497, 450);
  ctx.translate(px, py);
  ctx.scale(0.6, 0.6);
  ctx.translate(-px, -py);
  ctx.fillStyle = glow;
  ctx.beginPath();
  ctx.moveTo(...P(432, 396));
  ctx.bezierCurveTo(...P(430, 380), ...P(515, 380), ...P(522, 400));
  ctx.bezierCurveTo(...P(530, 440), ...P(570, 490), ...P(565, 518));
  ctx.bezierCurveTo(...P(560, 528), ...P(525, 526), ...P(505, 505));
  ctx.bezierCurveTo(...P(470, 470), ...P(440, 430), ...P(432, 396));
  ctx.closePath();
  ctx.fill();
  ctx.restore();
  ctx.beginPath();
  ctx.moveTo(...P(522, 400));
  ctx.bezierCurveTo(...P(530, 440), ...P(570, 490), ...P(565, 518));
  ctx.bezierCurveTo(...P(560, 528), ...P(525, 526), ...P(505, 505));
  ctx.bezierCurveTo(...P(470, 470), ...P(440, 430), ...P(432, 396));
  ctx.stroke();
  ctx.restore();

  const [ex, ey] = P(370, 360);
  ctx.fillStyle = '#16233A';
  ctx.beginPath();
  ctx.arc(ex, ey, 3.4, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#FFFFFF';
  ctx.beginPath();
  ctx.arc(ex + 1, ey - 1.1, 1.1, 0, Math.PI * 2);
  ctx.fill();
  ctx.lineCap = 'round';
  ctx.strokeStyle = 'rgba(30,48,80,0.85)';
  ctx.lineWidth = 1.4;
  ctx.beginPath();
  ctx.moveTo(ex - 6.5, ey - 1);
  ctx.quadraticCurveTo(ex, ey - 7, ex + 6.5, ey - 1.5);
  ctx.stroke();
  ctx.strokeStyle = 'rgba(30,48,80,0.5)';
  ctx.lineWidth = 1.1;
  ctx.beginPath();
  ctx.moveTo(ex - 5, ey + 3.5);
  ctx.quadraticCurveTo(ex, ey + 6, ex + 5.5, ey + 3);
  ctx.stroke();
}

/** A sea turtle about 90 px long, facing right, seen from above and slightly to the side. Points are traced in px from a reference image. */
function turtle(ctx: CanvasRenderingContext2D, c: Creature) {
  const stroke = Math.sin(c.phase * 1.6 + c.tint * 6);
  const i = Math.floor(c.tint * 3) % 3;
  const skin = ['#A8BF9D', '#B3C08F', '#A0C0B0'][i];
  const skinDark = ['#6A8F6E', '#72905A', '#5E9082'][i];
  const shell = ['#5E8566', '#6B8A55', '#52877A'][i];
  const rim = ['#3F5F46', '#475F38', '#38605A'][i];
  const seam = '#B9CBA0';

  ctx.save();
  ctx.scale(0.2, 0.2);
  ctx.translate(-260, -215);
  ctx.lineJoin = 'round';
  ctx.lineCap = 'round';
  const smooth = (pts: number[][]) => {
    const mid = (a: number[], b: number[]) => [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2];
    ctx.beginPath();
    ctx.moveTo(...(mid(pts[pts.length - 1], pts[0]) as [number, number]));
    pts.forEach((q, k) => {
      const m = mid(q, pts[(k + 1) % pts.length]);
      ctx.quadraticCurveTo(q[0], q[1], m[0], m[1]);
    });
    ctx.closePath();
  };
  const part = (pivot: [number, number], rot: number, color: string, pts: number[][], spots: number[][]) => {
    ctx.save();
    ctx.translate(pivot[0], pivot[1]);
    ctx.rotate(rot);
    ctx.translate(-pivot[0], -pivot[1]);
    ctx.fillStyle = color;
    smooth(pts);
    ctx.fill();
    ctx.fillStyle = 'rgba(70,100,80,0.28)';
    for (const [x, y, rx, ry, a] of spots) {
      ctx.beginPath();
      ctx.ellipse(x, y, rx, ry, a, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.restore();
  };

  ctx.save();
  ctx.translate(0, 30);
  part([335, 135], -stroke * 0.18, skin, [[355, 132], [368, 105], [340, 80], [290, 64], [240, 66], [212, 86], [238, 102], [282, 120], [315, 132]], [[270, 78, 18, 7, 0.1], [320, 98, 12, 6, 0.5], [240, 90, 8, 4, 0]]);
  ctx.restore();
  part([140, 250], stroke * 0.1, skinDark, [[150, 232], [105, 215], [68, 238], [62, 266], [108, 262], [140, 262]], [[95, 240, 12, 5, 0.3]]);
  part([150, 290], -stroke * 0.1, skin, [[165, 285], [120, 292], [86, 322], [66, 340], [82, 346], [122, 332], [160, 308]], [[110, 320, 10, 4, -0.6]]);
  ctx.save();
  ctx.translate(0, -30);
  part([375, 280], stroke * 0.18, skin, [[372, 262], [388, 295], [372, 345], [320, 385], [262, 412], [246, 392], [282, 352], [330, 305], [350, 272]], [[330, 360, 14, 6, -0.7], [365, 320, 7, 12, 0.2], [290, 395, 10, 4, -0.5]]);
  ctx.restore();

  part([135, 278], stroke * 0.15, skin, [[140, 270], [108, 276], [90, 284], [108, 290], [142, 288]], []);

  ctx.fillStyle = skin;
  smooth([[368, 158], [392, 156], [420, 150], [440, 156], [440, 196], [418, 206], [392, 208], [368, 204]]);
  ctx.fill();
  ctx.fillStyle = 'rgba(70,100,80,0.22)';
  ctx.beginPath();
  ctx.ellipse(410, 196, 28, 8, 0.05, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = skin;
  smooth([[392, 168], [412, 150], [442, 142], [480, 146], [506, 168], [512, 190], [494, 205], [450, 208], [410, 196], [392, 186]]);
  ctx.fill();
  ctx.fillStyle = 'rgba(70,100,80,0.28)';
  ctx.beginPath();
  ctx.ellipse(430, 156, 16, 6, 0.1, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#E3DCA8';
  smooth([[395, 196], [450, 206], [494, 205], [500, 200], [450, 200], [405, 190]]);
  ctx.fill();
  ctx.fillStyle = 'rgba(70,100,80,0.3)';
  ctx.beginPath();
  ctx.ellipse(468, 170, 19, 7, -0.1, 0, Math.PI * 2);
  ctx.ellipse(467, 191, 16, 5, 0.05, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#1B2238';
  ctx.beginPath();
  ctx.moveTo(453, 183);
  ctx.quadraticCurveTo(468, 167, 484, 179);
  ctx.quadraticCurveTo(468, 192, 453, 183);
  ctx.fill();
  ctx.strokeStyle = 'rgba(55,85,65,0.7)';
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(453, 183);
  ctx.quadraticCurveTo(468, 167, 484, 179);
  ctx.stroke();
  ctx.fillStyle = '#fff';
  ctx.beginPath();
  ctx.arc(473, 176, 2.6, 0, Math.PI * 2);
  ctx.fill();

  const outline = [[120, 268], [150, 215], [195, 160], [250, 133], [310, 125], [388, 150], [403, 160], [394, 176], [388, 196], [388, 218], [380, 245], [350, 280], [300, 303], [240, 312], [180, 303], [140, 288]];
  ctx.fillStyle = rim;
  smooth(outline);
  ctx.fill();
  ctx.save();
  ctx.translate(262, 205);
  ctx.scale(0.93, 0.93);
  ctx.translate(-262, -205);
  ctx.fillStyle = shell;
  smooth(outline);
  ctx.fill();
  ctx.clip();
  ctx.fillStyle = seam;
  ctx.fillRect(100, 110, 320, 220);
  ctx.translate(262, 205);
  ctx.scale(0.9, 0.9);
  ctx.translate(-262, -205);
  smooth(outline);
  ctx.clip();
  ctx.translate(262, 205);
  ctx.scale(1 / 0.9, 1 / 0.9);
  ctx.translate(-262, -205);
  ctx.strokeStyle = shell;
  ctx.lineWidth = 6;
  [
    [[105, 110], [214, 110], [219, 224], [105, 218]],
    [[105, 218], [219, 224], [224, 325], [105, 325]],
    [[214, 110], [310, 110], [306, 188], [218, 192]],
    [[218, 192], [306, 188], [304, 246], [221, 250]],
    [[221, 250], [304, 246], [300, 325], [224, 325]],
    [[310, 110], [420, 110], [420, 222], [305, 210]],
    [[305, 210], [420, 222], [420, 325], [300, 325]],
  ].forEach((plate, k) => {
    const cx = plate.reduce((t, q) => t + q[0], 0) / plate.length;
    const cy = plate.reduce((t, q) => t + q[1], 0) / plate.length;
    ctx.beginPath();
    plate.forEach(([x, y], j) => {
      const d = Math.hypot(x - cx, y - cy);
      const px = cx + ((x - cx) * (d - 8)) / d;
      const py = cy + ((y - cy) * (d - 8)) / d;
      if (j) ctx.lineTo(px, py);
      else ctx.moveTo(px, py);
    });
    ctx.closePath();
    ctx.fillStyle = shell;
    ctx.fill();
    ctx.stroke();
    if (k % 2) {
      ctx.fillStyle = 'rgba(0,0,0,0.08)';
      ctx.fill();
    }
  });
  ctx.restore();
  ctx.restore();
}

function fish(ctx: CanvasRenderingContext2D, c: Creature) {
  const color = FISH[Math.floor(c.tint * FISH.length)];
  swimTail(ctx, [-10, 0], c.phase, tailSwing(c, 12, FISH_FULL_SPEED), [[0, 0], [-5, -3.5], [-10, -7], [-10, 7], [-5, 3.5]], color, (p) => {
    ctx.beginPath();
    p.forEach(([x, y], i) => (i ? ctx.lineTo(x, y) : ctx.moveTo(x, y)));
    ctx.closePath();
  });
  ctx.fillStyle = color;
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

const GLASS_JELLIES = [
  { outline: 'rgba(255,226,150,0.9)', body: 'rgba(40,40,110,0.22)', glow: 'rgba(255,214,120,0.8)', tentacle: 'rgba(255,214,140,0.55)' },
  { outline: 'rgba(160,240,255,0.9)', body: 'rgba(20,60,110,0.22)', glow: 'rgba(120,225,255,0.8)', tentacle: 'rgba(150,230,255,0.55)' },
];

/** A glass jelly: a clear dome with only its outline and a glowing lower rim, trailing many fine tentacles. */
function glassJelly(ctx: CanvasRenderingContext2D, c: Creature, look: (typeof GLASS_JELLIES)[number]) {
  const pulse = 1 + Math.sin(c.phase * 2.8) * 0.08;
  ctx.strokeStyle = look.tentacle;
  ctx.lineWidth = 1;
  for (let i = -3; i <= 3; i++) {
    ctx.beginPath();
    ctx.moveTo(i * 4.5, 4);
    for (let s = 1; s <= 7; s++) ctx.lineTo(i * 4.5 + Math.sin(c.phase * 3 + s * 0.8 + i) * (1 + s * 0.6), 4 + s * 7);
    ctx.stroke();
  }
  ctx.save();
  ctx.scale(pulse, 1 / pulse);
  ctx.fillStyle = look.body;
  ctx.beginPath();
  ctx.arc(0, 4, 18, Math.PI, 0);
  ctx.quadraticCurveTo(0, 9, -18, 4);
  ctx.fill();
  ctx.lineWidth = 1.6;
  ctx.strokeStyle = look.outline;
  ctx.stroke();
  const rim = ctx.createLinearGradient(0, -6, 0, 6);
  rim.addColorStop(0, 'rgba(255,255,255,0)');
  rim.addColorStop(1, look.glow);
  ctx.fillStyle = rim;
  ctx.beginPath();
  ctx.ellipse(0, 2, 14, 7, 0, 0, Math.PI);
  ctx.fill();
  ctx.strokeStyle = look.glow;
  ctx.lineWidth = 1;
  for (let i = -5; i <= 5; i++) {
    ctx.beginPath();
    ctx.moveTo(i * 2.6, 0 + Math.abs(i) * 0.4);
    ctx.lineTo(i * 2.6, 6 - Math.abs(i) * 0.3);
    ctx.stroke();
  }
  ctx.restore();
}

function jelly(ctx: CanvasRenderingContext2D, c: Creature) {
  if (c.tint >= 1 / 3) return glassJelly(ctx, c, GLASS_JELLIES[c.tint >= 2 / 3 ? 1 : 0]);
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

/** A shark's tail beats at this speed (slower than other fish) and its body sways this many reference px at the tail. */
const SHARK_TAIL_SPEED = 3.5;
const SHARK_BODY_SWAY = 75;
/** Width of a shark's outline, twice what shows since the fills cover the inner half. */
const SHARK_OUTLINE = 2.2;

/** Sets up drawing a shark at true proportions from a reference traced in px: `map` takes reference px into the great white's space, so every shark shares one tail, one body sway and one tail join. */
function sharkRig(ctx: CanvasRenderingContext2D, c: Creature, map: (x: number, y: number) => [number, number] = (x, y) => [x, y]) {
  const chasing = c.state === 'chase';
  ctx.scale(1 / SHARK_LENGTH, 1);
  const m = 0.1325;
  const speed = chasing ? SHARK_TAIL_SPEED * 1.7 : SHARK_TAIL_SPEED;
  const sway = (x: number) => {
    const d = Math.min(1, Math.max(0, (x - 500) / 1250));
    return REDUCED_MOTION ? 0 : Math.sin(c.phase * speed - d * TAIL_PHASE_STEP) * d * d * SHARK_BODY_SWAY;
  };
  const at = (x: number, y: number): [number, number] => [(885 - x) * m, (y + sway(x) - 400) * m];
  const P = (x: number, y: number) => at(...map(x, y));
  const poly = (pts: [number, number][]) => {
    ctx.beginPath();
    pts.forEach(([x, y], i) => (i ? ctx.lineTo(...P(x, y)) : ctx.moveTo(...P(x, y))));
    ctx.closePath();
  };
  const smooth = (pts: [number, number][]) => {
    const mid = (a: [number, number], b: [number, number]) => P((a[0] + b[0]) / 2, (a[1] + b[1]) / 2);
    ctx.beginPath();
    ctx.moveTo(...mid(pts[pts.length - 1], pts[0]));
    pts.forEach((q, i) => ctx.quadraticCurveTo(...P(q[0], q[1]), ...mid(q, pts[(i + 1) % pts.length])));
    ctx.closePath();
  };
  const hinge = at(1390, 400);
  const local = ([x, y]: [number, number]): [number, number] => [at(x, y)[0] - hinge[0], at(x, y)[1] - hinge[1]];
  const tailEdge = (
    [[1360, 392], [1440, 335], [1520, 280], [1620, 218], [1700, 182], [1745, 172], [1722, 208], [1708, 244], [1650, 292], [1595, 345], [1565, 405],
      [1580, 480], [1600, 580], [1632, 670], [1560, 630], [1480, 562], [1420, 485], [1390, 448], [1360, 442], [1360, 392]] as [number, number][]
  ).map(local);
  const tailPale = ([[1360, 428], [1448, 428], [1470, 500], [1555, 598], [1628, 668], [1545, 622], [1455, 552], [1408, 475], [1390, 445], [1360, 440]] as [number, number][]).map(local);
  const swing = tailSwing(c, speed, 150);
  const trace = (pts: [number, number][]) => {
    ctx.beginPath();
    pts.forEach((q, i) => (i ? ctx.lineTo(...q) : ctx.moveTo(...q)));
    ctx.closePath();
  };
  const tail = (color: string, pale: string) =>
    swimTail(ctx, hinge, c.phase, swing, tailEdge, color, trace, () => {
      ctx.fillStyle = pale;
      trace(tailPoints(tailPale, c.phase, swing, Math.max(...tailEdge.map(([x]) => -x))));
      ctx.fill();
    });
  const outline = (shapes: (() => void)[], color: string) => {
    ctx.save();
    ctx.lineJoin = 'round';
    ctx.lineWidth = SHARK_OUTLINE;
    ctx.strokeStyle = color;
    ctx.fillStyle = color;
    for (const shape of shapes) {
      shape();
      ctx.stroke();
      ctx.fill();
    }
    const depth = tailDepth(c.phase, swing);
    ctx.translate(hinge[0], hinge[1]);
    ctx.scale(1 + 0.15 * depth, 1 + 0.15 * depth);
    trace(tailPoints(tailEdge, c.phase, swing));
    ctx.stroke();
    ctx.fill();
    ctx.restore();
  };
  return { chasing, m, P, poly, smooth, tail, outline };
}

/** A great white in side view facing right, about 200 px long: a blue back over a pale belly, a tall dorsal fin, long pectoral fins and a crescent tail. Points are traced from a left-facing reference (1720 px long) and mirrored, and drawn at true proportions despite the shark's stretch. */
const GREAT_WHITE_LOOKS = [
  { fin: '#506C88', finFar: '#3F566E', shade: ['#5F7C98', '#6E8CA8', '#62819D'], tail: '#6A88A4' },
  { fin: '#5B6B7C', finFar: '#495664', shade: ['#6B7F92', '#7A8FA4', '#6F8498'], tail: '#78899A' },
  { fin: '#4E6A78', finFar: '#3C5360', shade: ['#5B7A88', '#6A8896', '#5F7F8D'], tail: '#6A8794' },
];

function greatWhite(ctx: CanvasRenderingContext2D, c: Creature) {
  const { chasing, m, P, poly, smooth, tail, outline } = sharkRig(ctx, c);
  const look = GREAT_WHITE_LOOKS[Math.floor(c.tint * 3) % 3];
  const fin = look.fin;
  const finFar = look.finFar;
  const belly = '#D3E3F3';

  const finFarShape = () => poly([[575, 580], [612, 596], [632, 680], [648, 746], [598, 722], [578, 650]]);
  const dorsal = () => poly([[595, 282], [640, 245], [690, 186], [740, 132], [780, 110], [797, 108], [788, 150], [790, 205], [815, 252], [850, 285], [900, 305], [700, 310], [600, 295]]);
  const underfin = () =>
    poly(([[950, 470], [1100, 440], [1090, 505], [1072, 560], [1048, 568], [1000, 545], [965, 520]] as [number, number][]).map(([x, y]) => [1025 + (x - 1025) * 0.67 + 101, 470 + (y - 470) * 0.67 - 19]));
  const body = () =>
    smooth([
      [6, 438], [30, 408], [80, 386], [150, 362], [250, 334], [330, 313], [460, 292], [600, 277], [720, 272], [860, 292], [1000, 322], [1130, 348], [1205, 337], [1240, 352],
      [1290, 380], [1390, 398], [1390, 436], [1300, 440], [1150, 462], [1000, 492], [850, 530], [700, 568], [600, 586], [500, 580], [400, 568],
      [300, 552], [215, 538], [160, 530], [124, 524], [106, 506], [101, 476], [64, 470], [22, 454],
    ]);
  const pectoral = () => poly([[402, 470], [402, 505], [425, 580], [465, 650], [520, 715], [575, 755], [620, 780], [604, 735], [590, 675], [584, 600], [592, 514], [596, 470]]);
  const open = 0.6 + 0.4 * (c.mouth ?? (chasing ? 1 : 0));
  const drawBody = () => {
    outline([finFarShape, dorsal, underfin, body, pectoral], '#2C3E52');

    ctx.fillStyle = finFar;
    finFarShape();
    ctx.fill();
    ctx.fillStyle = fin;
    dorsal();
    ctx.fill();
    ctx.fillStyle = '#B4C6D8';
    underfin();
    ctx.fill();

    const shade = ctx.createLinearGradient(0, P(0, 270)[1], 0, P(0, 590)[1]);
    shade.addColorStop(0, look.shade[0]);
    shade.addColorStop(0.35, look.shade[1]);
    shade.addColorStop(1, look.shade[2]);
    ctx.fillStyle = shade;
    body();
    ctx.fill();
    ctx.save();
    body();
    ctx.clip();
    ctx.fillStyle = belly;
    poly([[0, 468], [62, 468], [150, 484], [300, 497], [420, 510], [590, 514], [800, 500], [1000, 470], [1200, 442], [1450, 428], [1450, 720], [0, 720]]);
    ctx.fill();
    ctx.restore();

    tail(look.tail, belly);

    ctx.fillStyle = shade;
    pectoral();
    ctx.fill();

    ctx.strokeStyle = 'rgba(20,35,60,0.5)';
    ctx.lineWidth = 1.5;
    for (let i = 0; i < 6; i++) {
      const x = 352 + i * 16;
      ctx.beginPath();
      ctx.moveTo(...P(x, 388));
      ctx.quadraticCurveTo(...P(x - 8, 435), ...P(x, 482));
      ctx.stroke();
    }

    const [ex, ey] = P(124, 410);
    const eyeR = (chasing ? 19 : 15) * m;
    ctx.fillStyle = '#0A0D14';
    ctx.beginPath();
    ctx.arc(ex, ey, eyeR, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#FFFFFF';
    ctx.beginPath();
    ctx.arc(ex - eyeR * 0.35, ey - eyeR * 0.35, eyeR * 0.3, 0, Math.PI * 2);
    ctx.fill();
  };
  const [hx, hy] = P(210, 489);
  const ulip: [number, number][] = [[62, 468], [100, 475], [150, 483], [210, 489]];
  const along = (pts: [number, number][], x: number) => {
    for (let i = 1; i < pts.length; i++) {
      if (x <= pts[i][0]) return pts[i - 1][1] + ((pts[i][1] - pts[i - 1][1]) * (x - pts[i - 1][0])) / (pts[i][0] - pts[i - 1][0]);
    }
    return pts[pts.length - 1][1];
  };
  const edge = (pts: [number, number][]) => {
    ctx.strokeStyle = '#2C3E52';
    ctx.lineWidth = 1.4;
    ctx.beginPath();
    pts.forEach(([x, y], i) => (i ? ctx.lineTo(...P(x, y)) : ctx.moveTo(...P(x, y))));
    ctx.stroke();
  };
  const teeth = (lip: [number, number][], dir: 1 | -1, shift: number, len: number, from = 0) => {
    ctx.fillStyle = '#FFFFFF';
    for (let i = 0; i < 8; i++) {
      const x = 68 + shift + i * 17;
      if (x < from) continue;
      const y0 = along(lip, x);
      const y1 = along(lip, x + 13);
      poly([[x, y0], [x + 13, y1], [x + 6.5, (y0 + y1) / 2 + dir * len]]);
      ctx.fill();
    }
  };
  const pivot = (angle: number, draw: () => void) => {
    ctx.save();
    if (angle < 0) ctx.translate(0, angle * 40 * m);
    ctx.translate(hx, hy);
    ctx.rotate(angle);
    ctx.translate(-hx, -hy);
    draw();
    ctx.restore();
  };
  const piece = (region: [number, number][]) => {
    ctx.save();
    poly(region);
    ctx.clip();
    drawBody();
    ctx.restore();
  };

  pivot(-open * 0.2, () => {
    piece([[-300, -300], [213, -300], [213, 489], ...[...ulip].reverse(), [-300, 468]]);
    edge(ulip);
    teeth(ulip, 1, 0, 12);
  });
  pivot(open * 0.55, () => {
    piece([[98, 474], ...ulip.slice(1), [213, 489], [213, 900], [98, 900]]);
    edge([[101, 476], ...ulip.slice(2)]);
    teeth(ulip, -1, 8, 10, 106);
  });
  piece([[213, -300], [2000, -300], [2000, 900], [213, 900]]);
}

function hammerhead(ctx: CanvasRenderingContext2D, c: Creature) {
  const { chasing, m, P, poly, smooth, tail, outline } = sharkRig(ctx, c, (x, y) => [1770 - x, y - 40]);
  const fin = '#6E7388';
  const finFar = '#5A5F73';
  const belly = '#EAF0F7';

  const dorsal = () => poly([[1062, 325], [1075, 250], [1082, 190], [1100, 170], [1140, 178], [1190, 225], [1240, 290], [1290, 328], [1180, 340], [1100, 335]]);
  const dorsal2 = () => poly([[590, 420], [598, 345], [615, 332], [680, 352], [760, 385], [700, 412], [640, 422]]);
  const body = () =>
    smooth([
      [385, 432], [480, 428], [600, 412], [760, 380], [900, 352], [1070, 322], [1280, 325], [1450, 368], [1580, 418], [1632, 436], [1618, 395],
      [1625, 362], [1665, 350], [1710, 358], [1738, 388], [1744, 430], [1722, 470], [1708, 505], [1726, 555], [1728, 600], [1700, 630], [1645, 633],
      [1598, 615], [1584, 590], [1598, 540], [1560, 538], [1450, 560], [1300, 582], [1200, 588], [1000, 568], [860, 535], [700, 512], [540, 498],
      [440, 488], [385, 478],
    ]);
  const anal = () => poly([[575, 545], [595, 505], [670, 515], [620, 534]]);
  const pelvic = () => poly([[800, 572], [850, 540], [920, 510], [950, 520], [1000, 548], [950, 575], [880, 585], [820, 585]]);
  const pectoral = () => poly([[1205, 540], [1195, 600], [1185, 660], [1165, 750], [1215, 720], [1290, 660], [1330, 590], [1335, 545]]);
  outline([dorsal, dorsal2, body, anal, pelvic, pectoral], '#2F3345');

  ctx.fillStyle = fin;
  dorsal();
  ctx.fill();
  dorsal2();
  ctx.fill();

  const shade = ctx.createLinearGradient(0, P(0, 170)[1], 0, P(0, 635)[1]);
  shade.addColorStop(0, '#848AA0');
  shade.addColorStop(0.4, '#8E94A8');
  shade.addColorStop(1, '#8A90A5');
  ctx.fillStyle = shade;
  body();
  ctx.fill();
  ctx.save();
  body();
  ctx.clip();
  ctx.fillStyle = belly;
  poly([[385, 470], [500, 485], [700, 508], [850, 530], [1000, 543], [1200, 548], [1330, 548], [1450, 540], [1560, 520], [1594, 512], [1594, 700], [385, 700]]);
  ctx.fill();
  ctx.restore();

  tail('#8A90A5', belly);

  ctx.fillStyle = finFar;
  anal();
  ctx.fill();
  ctx.fillStyle = fin;
  pelvic();
  ctx.fill();
  pectoral();
  ctx.fill();

  ctx.strokeStyle = 'rgba(30,35,55,0.5)';
  ctx.lineWidth = 1.5;
  for (let i = 0; i < 4; i++) {
    const x = 1360 + i * 28;
    ctx.beginPath();
    ctx.moveTo(...P(x, 470));
    ctx.quadraticCurveTo(...P(x + 6, 498), ...P(x, 526));
    ctx.stroke();
  }

  if (chasing) {
    ctx.fillStyle = '#7A2E3B';
    poly([[1525, 548], [1600, 522], [1618, 560]]);
    ctx.fill();
    ctx.fillStyle = '#FFFFFF';
    for (const x of [1560, 1584]) {
      poly([[x, 534], [x + 14, 530], [x + 8, 550]]);
      ctx.fill();
    }
  } else {
    ctx.strokeStyle = 'rgba(30,35,55,0.5)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(...P(1550, 540));
    ctx.quadraticCurveTo(...P(1580, 535), ...P(1600, 520));
    ctx.stroke();
  }

  const [ex, ey] = P(1660, 603);
  const eyeR = (chasing ? 20 : 17) * m;
  ctx.fillStyle = '#EAF0F7';
  ctx.beginPath();
  ctx.arc(ex, ey, eyeR, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#0A0D14';
  ctx.beginPath();
  ctx.arc(ex, ey, eyeR * 0.6, 0, Math.PI * 2);
  ctx.fill();
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
const GIANT_PALETTE: SquidPalette = { arm: '#5E3A6E', body: '#764A87', spot: '#65407A', sucker: '#9370A3' };
const GIANT_SPOTTED: SquidPalette = { arm: '#6B4478', body: '#855A92', spot: '#6B4579', sucker: '#A586B0', speckle: '#3A2147' };
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

function squid(ctx: CanvasRenderingContext2D, c: Creature, pal: SquidPalette = SQUID_PALETTE, tentacleLen = 11, finExtra = 0, finWidth = 1) {
  const lunging = c.state === 'lunge';
  ctx.strokeStyle = pal.arm;
  for (let i = 0; i < 10; i++) {
    const x0 = -16 + i * (32 / 9);
    const long = i === 3 || i === 6;
    const len = long ? tentacleLen : SHORT_ARM_LEN[i];
    const whip = long && tentacleLen > 11;
    ctx.lineWidth = long ? 4 : 6;
    ctx.beginPath();
    ctx.moveTo(x0, 14);
    const pts: [number, number][] = [];
    for (let s = 1; s <= len; s++) {
      const spread = lunging ? 0.3 : 1;
      const x = whip
        ? x0 * (1 + Math.min(s, 9) * 0.12 * spread) + Math.sign(x0) * s * 0.5 + Math.sin(c.phase * 3 + s * 0.35) * Math.min(s, 16) * 0.7
        : x0 * (1 + s * 0.12 * spread) + Math.sin(c.phase * 4 + s * 0.8 + i) * s * 0.9;
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
  ctx.moveTo(0, -84 - finExtra);
  ctx.quadraticCurveTo(24 * finWidth, -70 - finExtra * 0.3, 30 * finWidth, -48);
  ctx.quadraticCurveTo(22 * finWidth, -40, 12, -34);
  ctx.lineTo(-12, -34);
  ctx.quadraticCurveTo(-22 * finWidth, -40, -30 * finWidth, -48);
  ctx.quadraticCurveTo(-24 * finWidth, -70 - finExtra * 0.3, 0, -84 - finExtra);
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
  ctx.moveTo(0, -80 - finExtra);
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

const ANGLER_PALETTES = [
  { skin: '#C45F2F', belly: '#DDA474', fin: '#8CA3BF', ray: '#6C86A8' },
  { skin: '#1F2D52', belly: '#5A6C8F', fin: '#4F6A9A', ray: '#3A5282' },
  { skin: '#27506B', belly: '#6F96A8', fin: '#5B8DA6', ray: '#427590' },
];

/** An anglerfish about 120 px long before its scale, facing right: a deep orange body with a big gaping mouth (the sea shows through), a pale lower jaw, a lure on a curved stalk and blue fins. Points are traced from a left-facing side view (1550 px long) and mirrored. */
function angler(ctx: CanvasRenderingContext2D, c: Creature) {
  const dead = c.state === 'dead';
  const sc = anglerScale(c.tint);
  ctx.scale(sc, sc);
  ctx.rotate(Math.PI * anglerFlip(c));
  if (dead) ctx.globalAlpha = Math.max(0, Math.min(1, (6 - c.dying) / 2));
  const k = 0.085;
  const P = (x: number, y: number): [number, number] => [(860 - x) * k, (y - 500) * k];
  const poly = (pts: [number, number][]) => {
    ctx.beginPath();
    pts.forEach(([x, y], i) => (i ? ctx.lineTo(...P(x, y)) : ctx.moveTo(...P(x, y))));
    ctx.closePath();
  };
  const smooth = (pts: [number, number][]) => {
    const m = (a: [number, number], b: [number, number]) => P((a[0] + b[0]) / 2, (a[1] + b[1]) / 2);
    ctx.beginPath();
    ctx.moveTo(...m(pts[pts.length - 1], pts[0]));
    pts.forEach((p, i) => ctx.quadraticCurveTo(...P(p[0], p[1]), ...m(p, pts[(i + 1) % pts.length])));
    ctx.closePath();
  };
  const open = dead ? 0.02 : 0.07 + Math.sin(c.phase * 2) * 0.05;
  const { skin, belly, fin, ray } = ANGLER_PALETTES[Math.floor(c.tint * ANGLER_PALETTES.length) % ANGLER_PALETTES.length];

  const hinge = P(1120, 460);
  const local = (x: number, y: number): [number, number] => [P(x, y)[0] - hinge[0], P(x, y)[1] - hinge[1]];
  const tailEdge: [number, number][] = [
    [1100, 400], [1220, 372], [1330, 345], [1440, 335], [1520, 355], [1550, 405], [1535, 440], [1470, 462], [1400, 490], [1385, 522],
    [1415, 560], [1445, 615], [1452, 640], [1420, 690], [1345, 712], [1270, 680], [1190, 620], [1130, 560], [1100, 525], [1090, 460],
  ].map(([x, y]) => local(x, y));
  const rayEnds = ([[1500, 372], [1520, 420], [1440, 470], [1420, 560], [1430, 640], [1360, 700], [1260, 660]] as [number, number][]).map(([x, y]) => local(x, y));
  const swing = dead ? { speed: 6, maxAngle: 0 } : tailSwing(c, 6, 60);
  swimTail(
    ctx,
    hinge,
    c.phase,
    swing,
    tailEdge,
    fin,
    (pts) => {
      const mid = (a: [number, number], b: [number, number]): [number, number] => [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2];
      ctx.beginPath();
      ctx.moveTo(...mid(pts[pts.length - 1], pts[0]));
      pts.forEach((q, i) => ctx.quadraticCurveTo(...q, ...mid(q, pts[(i + 1) % pts.length])));
      ctx.closePath();
    },
    () => {
      ctx.strokeStyle = ray;
      ctx.lineWidth = 1;
      for (const [ex, ey] of tailPoints(rayEnds, c.phase, swing)) {
        ctx.beginPath();
        ctx.moveTo(0, 0);
        ctx.lineTo(ex, ey);
        ctx.stroke();
      }
    },
  );

  ctx.fillStyle = fin;
  poly([[615, 197], [748, 146], [765, 178], [795, 178], [810, 200], [905, 225], [920, 248], [970, 248], [985, 268], [1030, 285], [1045, 330], [1070, 365], [1000, 340], [800, 265], [650, 215]]);
  ctx.fill();
  poly([[900, 640], [950, 628], [1008, 655], [1022, 690], [1030, 712], [960, 725], [900, 735], [840, 740], [778, 745], [800, 715], [850, 680]]);
  ctx.fill();

  ctx.strokeStyle = '#6B5A78';
  ctx.lineWidth = 1.6;
  ctx.beginPath();
  ctx.moveTo(...P(490, 224));
  ctx.bezierCurveTo(...P(465, 130), ...P(330, 60), ...P(210, 92));
  ctx.bezierCurveTo(...P(150, 108), ...P(118, 150), ...P(116, 205));
  ctx.stroke();
  ctx.fillStyle = '#B9B2A0';
  ctx.beginPath();
  const [lx, ly] = P(115, 228);
  ctx.roundRect(lx - LURE_W / sc / 2, ly - LURE_H / sc / 2, LURE_W / sc, LURE_H / sc, LURE_W / sc / 2);
  ctx.fill();

  const body = () =>
    smooth([
      [335, 328], [380, 290], [440, 250], [510, 215], [580, 198], [650, 200], [740, 225], [850, 268], [950, 315], [1040, 358], [1110, 392],
      [1160, 440], [1150, 500], [1100, 525], [1030, 550], [960, 580], [900, 630], [840, 700], [760, 765], [660, 805], [560, 815],
      [470, 805], [400, 775], [365, 725], [440, 690], [525, 646], [490, 560], [455, 480], [410, 400], [360, 350],
    ]);
  ctx.fillStyle = skin;
  body();
  ctx.fill();
  ctx.save();
  body();
  ctx.clip();
  ctx.fillStyle = belly;
  ctx.beginPath();
  ctx.moveTo(...P(330, 690));
  ctx.lineTo(...P(440, 640));
  ctx.lineTo(...P(525, 640));
  ctx.quadraticCurveTo(...P(660, 700), ...P(560, 830));
  ctx.lineTo(...P(380, 830));
  ctx.lineTo(...P(320, 740));
  ctx.closePath();
  ctx.fill();
  ctx.fillStyle = 'rgba(255,225,185,0.22)';
  for (const [x, y, r] of [[560, 300, 60], [760, 360, 70], [650, 520, 55], [880, 470, 50], [1000, 450, 40], [770, 600, 45], [470, 420, 40]]) {
    ctx.beginPath();
    ctx.ellipse(...P(x, y), r * k, r * k * 0.8, 0.3, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.restore();

  ctx.fillStyle = '#F4F1FF';
  for (let i = 0; i < 7; i++) {
    const u = i / 6;
    const bx = 350 + u * 125 - Math.sin(u * Math.PI) * -10;
    const by = 345 + u * 190;
    const len = 120 - u * 40;
    poly([[bx, by], [bx + 26, by + 26], [bx - 0.75 * len, by + 0.66 * len]]);
    ctx.fill();
  }

  ctx.save();
  const [hx, hy] = P(525, 646);
  ctx.translate(hx, hy);
  ctx.rotate(open);
  ctx.translate(-hx, -hy);
  ctx.fillStyle = '#F4F1FF';
  for (let i = 0; i < 5; i++) {
    const bx = 215 + i * 62;
    const by = 506 + i * 26;
    poly([[bx, by + 6], [bx + 34, by + 14], [bx + 20, by - 58]]);
    ctx.fill();
  }
  ctx.fillStyle = belly;
  poly([[172, 497], [260, 503], [370, 550], [470, 620], [525, 648], [470, 720], [375, 732], [330, 697], [260, 615], [200, 540], [172, 508]]);
  ctx.fill();
  ctx.restore();

  ctx.fillStyle = '#46301F';
  ctx.beginPath();
  ctx.arc(...P(542, 358), 76 * k, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#E9E5D8';
  ctx.beginPath();
  ctx.arc(...P(542, 358), 60 * k, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#FFFFFF';
  ctx.beginPath();
  ctx.arc(...P(520, 338), 16 * k, 0, Math.PI * 2);
  ctx.fill();
}

/** The lure bulb is drawn after the darkness pass so it glows. */
export function drawLureBulb(ctx: CanvasRenderingContext2D, x: number, y: number, glow = 1) {
  if (glow <= 0.02) return;
  ctx.save();
  ctx.globalAlpha = glow;
  ctx.shadowColor = '#FFF3A3';
  ctx.shadowBlur = 8 * glow;
  ctx.fillStyle = '#FFF6B8';
  ctx.beginPath();
  ctx.roundRect(x - LURE_W / 2, y - LURE_H / 2, LURE_W, LURE_H, LURE_W / 2);
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
