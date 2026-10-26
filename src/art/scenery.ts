import { mulberry32, rrect } from '../util';
import { drawTankShape } from './sub';
import { drawBones, type BoneKind } from './bones';

export type DecoKind = 'kelp' | 'coral' | 'rock' | BoneKind;

function glow(ctx: CanvasRenderingContext2D, x: number, y: number, r: number, a: number) {
  ctx.save();
  ctx.globalCompositeOperation = 'lighter';
  const g = ctx.createRadialGradient(x, y, 0, x, y, r);
  g.addColorStop(0, `rgba(255,214,107,${a})`);
  g.addColorStop(1, 'rgba(255,214,107,0)');
  ctx.fillStyle = g;
  ctx.beginPath();
  ctx.arc(x, y, r, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}

/** Crane arm tip relative to the ship center, where the sub's cable hangs from. */
export const CRANE_TIP = { x: -215, y: -112 };

/** Deck spotlights relative to the ship center, aimed down and outward (a is the beam angle from straight down, toward the end of the ship). */
export const SHIP_LAMPS = [
  { x: 132, y: -42, dir: 1, a: 0.55 },
  { x: -130, y: -30, dir: -1, a: 0.55 },
];

/** Ship paint by tier, which follows the sub's lowest of plating and oxygen tank level. */
const SHIP_TIERS = [
  { hull: '#C9D1DA', shade: '#AEB8C4', deck: '#8F9AA8', dark: '#3E4552', accent: '#2AA6C9', text: '#3E4552' },
  { hull: '#7C8594', shade: '#656D7B', deck: '#4F5764', dark: '#2C323C', accent: '#2AA6C9', text: '#EEF2F6' },
  { hull: '#F39A3D', shade: '#DC7F25', deck: '#C96A1B', dark: '#3A3F4B', accent: '#7A4A1E', text: '#4A2A0A' },
  { hull: '#2A2D35', shade: '#1D2026', deck: '#14161B', dark: '#0E1013', accent: '#F28C28', text: '#F0F3F8' },
];

const GLASS = '#A8E1F2';

/** Fills the current path and rounds its corners with a same-colour stroke. */
function fillRounded(ctx: CanvasRenderingContext2D, color: string, width = 5) {
  ctx.fillStyle = color;
  ctx.strokeStyle = color;
  ctx.lineWidth = width;
  ctx.fill();
  ctx.stroke();
}

/** A curved reflection hugging the top-left corner of a window, like the sub's nose glass. */
function windowShine(ctx: CanvasRenderingContext2D, x: number, y: number, h: number, alpha: number) {
  ctx.strokeStyle = `rgba(255,255,255,${alpha})`;
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(x + 3, y + h - 3);
  ctx.quadraticCurveTo(x + 3, y + 3, x + 9, y + 3);
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(x + 13, y + 3);
  ctx.lineTo(x + 16, y + 3);
  ctx.stroke();
}

export function drawShip(ctx: CanvasRenderingContext2D, t: number, facing: 1 | -1 = 1, night = 0, tier = 0, oxygen = 0, alert = 0) {
  const c = SHIP_TIERS[tier];
  ctx.lineJoin = 'round';
  ctx.lineCap = 'round';

  // Stern A-frame crane
  ctx.strokeStyle = c.dark;
  ctx.lineWidth = 7;
  ctx.beginPath();
  ctx.moveTo(-118, -26);
  ctx.lineTo(-118, -112);
  ctx.lineTo(CRANE_TIP.x, CRANE_TIP.y);
  ctx.stroke();
  ctx.lineWidth = 4;
  ctx.beginPath();
  ctx.moveTo(-90, -26);
  ctx.lineTo(-118, -98);
  ctx.stroke();
  ctx.strokeStyle = c.accent;
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(-118, -112);
  ctx.lineTo(CRANE_TIP.x + 14, CRANE_TIP.y);
  ctx.stroke();
  ctx.fillStyle = c.dark;
  ctx.beginPath();
  ctx.arc(CRANE_TIP.x, CRANE_TIP.y, 5, 0, Math.PI * 2);
  ctx.fill();

  // Mast and radar
  ctx.strokeStyle = c.dark;
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(8, -98);
  ctx.lineTo(8, -124);
  ctx.stroke();
  const sweep = Math.abs(Math.cos(t * 2.2)) * 13 + 2;
  ctx.strokeStyle = c.accent;
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(8 - sweep, -118);
  ctx.lineTo(8 + sweep, -118);
  ctx.stroke();

  // Flybridge and wheelhouse, with a raked front
  ctx.fillStyle = c.hull;
  ctx.beginPath();
  ctx.moveTo(-14, -80);
  ctx.lineTo(-8, -98);
  ctx.lineTo(34, -98);
  ctx.lineTo(50, -80);
  ctx.closePath();
  fillRounded(ctx, c.hull);
  ctx.fillStyle = '#EEF2F6';
  ctx.beginPath();
  ctx.arc(24, -98, 7, Math.PI, 0);
  ctx.fill();
  ctx.strokeStyle = 'rgba(255,255,255,0.9)';
  ctx.lineWidth = 1.6;
  ctx.beginPath();
  ctx.arc(24, -98, 4.2, Math.PI * 1.1, Math.PI * 1.5);
  ctx.stroke();
  ctx.fillStyle = c.deck;
  ctx.beginPath();
  ctx.moveTo(-38, -30);
  ctx.lineTo(-28, -80);
  ctx.lineTo(50, -80);
  ctx.lineTo(92, -50);
  ctx.lineTo(98, -30);
  ctx.closePath();
  fillRounded(ctx, c.deck);
  ctx.fillStyle = 'rgba(255,255,255,0.12)';
  ctx.beginPath();
  ctx.moveTo(-28, -80);
  ctx.lineTo(50, -80);
  ctx.lineTo(54, -74);
  ctx.lineTo(-30, -74);
  ctx.closePath();
  ctx.fill();
  const lit = night > 0.3;
  const glass = lit ? '#FFD66B' : GLASS;
  const shine = lit ? 0.55 : 0.9;
  for (const x of [-18, 8, 34]) {
    ctx.fillStyle = c.hull;
    rrect(ctx, x - 1.5, -69.5, 25, 15, 6);
    ctx.fill();
    ctx.fillStyle = glass;
    rrect(ctx, x, -68, 22, 12, 4.5);
    ctx.fill();
    if (night > 0) glow(ctx, x + 11, -62, 40, 0.4 * night);
    windowShine(ctx, x, -68, 12, shine);
  }
  ctx.beginPath();
  ctx.moveTo(62, -68);
  ctx.lineTo(80, -54);
  ctx.lineTo(62, -54);
  ctx.closePath();
  fillRounded(ctx, glass, 3);
  ctx.strokeStyle = `rgba(255,255,255,${shine})`;
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(63.5, -58);
  ctx.quadraticCurveTo(63.5, -63.5, 68, -64.5);
  ctx.stroke();

  for (const l of SHIP_LAMPS) {
    ctx.strokeStyle = c.dark;
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(l.x, l.y + 12);
    ctx.lineTo(l.x, l.y);
    ctx.stroke();
    ctx.fillStyle = c.dark;
    rrect(ctx, l.x - 5, l.y - 5, 10, 8, 3);
    ctx.fill();
    ctx.fillStyle = night > 0.3 ? '#FFF6D8' : '#8A93A3';
    ctx.beginPath();
    ctx.arc(l.x + l.dir * 2, l.y - 1, 2.5, 0, Math.PI * 2);
    ctx.fill();
    if (night > 0) glow(ctx, l.x + l.dir * 2, l.y - 1, 26, 0.6 * night);
  }

  if (night > 0) {
    glow(ctx, 8, -128, 30, 0.5 * night);
    glow(ctx, CRANE_TIP.x, CRANE_TIP.y, 30, 0.5 * night);
    ctx.fillStyle = '#FFD66B';
    for (const [x, y] of [[8, -128], [CRANE_TIP.x, CRANE_TIP.y]]) {
      ctx.beginPath();
      ctx.arc(x, y, 3.5, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  ctx.fillStyle = c.accent;
  ctx.beginPath();
  ctx.arc(8, -126, 3, 0, Math.PI * 2);
  ctx.fill();
  if (alert > 0.02) {
    const pulse = 0.5 + 0.5 * Math.sin(t * 8);
    glow(ctx, 8, -128, 26 + 22 * pulse, alert);
    ctx.fillStyle = '#FFD34D';
    ctx.beginPath();
    ctx.arc(8, -128, 4 + pulse, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = `rgba(255,211,77,${alert * (1 - pulse)})`;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(8, -128, 8 + 12 * pulse, 0, Math.PI * 2);
    ctx.stroke();
  }

  // Cargo oxygen tanks on the aft deck, drawn like the sub's tank
  for (const cx of [-80, -64, -48]) {
    ctx.save();
    ctx.translate(cx - 26.5, -6);
    ctx.rotate(Math.PI / 2);
    drawTankShape(ctx, oxygen, c.accent);
    ctx.restore();
  }

  // Life preserver on the wheelhouse wall
  ctx.lineCap = 'butt';
  ctx.strokeStyle = c.dark;
  ctx.lineWidth = 9;
  ctx.beginPath();
  ctx.arc(74, -45, 6.5, 0, Math.PI * 2);
  ctx.stroke();
  ctx.lineWidth = 6;
  for (let i = 0; i < 4; i++) {
    ctx.strokeStyle = i % 2 ? '#E5484D' : '#F4FAFF';
    ctx.beginPath();
    ctx.arc(74, -45, 6.5, (i * Math.PI) / 2 + 0.3, ((i + 1) * Math.PI) / 2 + 0.3);
    ctx.stroke();
  }
  ctx.lineCap = 'round';

  // Bow rail
  const hullTop = (x: number) => -38 + ((x - 120) * 4) / 52;
  ctx.strokeStyle = '#EEF2F6';
  ctx.lineWidth = 2;
  for (const x of [128, 140, 152, 164]) {
    ctx.beginPath();
    ctx.moveTo(x, hullTop(x) + 2);
    ctx.lineTo(x, hullTop(x) - 12);
    ctx.stroke();
  }
  ctx.lineWidth = 2.5;
  ctx.beginPath();
  ctx.moveTo(128, hullTop(128) - 12);
  ctx.lineTo(164, hullTop(164) - 12);
  ctx.stroke();

  // Hull: angular, with a raked bow
  ctx.fillStyle = c.hull;
  ctx.beginPath();
  ctx.moveTo(-140, -26);
  ctx.lineTo(120, -38);
  ctx.lineTo(172, -34);
  ctx.lineTo(110, 26);
  ctx.lineTo(-122, 26);
  ctx.lineTo(-140, 6);
  ctx.closePath();
  fillRounded(ctx, c.hull, 7);
  ctx.beginPath();
  ctx.moveTo(-135, 12);
  ctx.lineTo(125, 12);
  ctx.lineTo(110, 26);
  ctx.lineTo(-122, 26);
  ctx.closePath();
  fillRounded(ctx, c.shade, 7);

  for (const x of [-104, -80, -56]) {
    ctx.fillStyle = c.accent;
    ctx.beginPath();
    ctx.arc(x, 0, 7, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = glass;
    ctx.beginPath();
    ctx.arc(x, 0, 4.5, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = `rgba(255,255,255,${shine})`;
    ctx.lineWidth = 1.6;
    ctx.beginPath();
    ctx.arc(x, 0, 2.6, Math.PI * 1.1, Math.PI * 1.5);
    ctx.stroke();
  }
  ctx.strokeStyle = c.accent;
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(-139, -12);
  ctx.lineTo(160, -26);
  ctx.stroke();
  ctx.strokeStyle = 'rgba(255,255,255,0.45)';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(-140, -26);
  ctx.lineTo(120, -38);
  ctx.lineTo(172, -34);
  ctx.stroke();

  drawSternBumper(ctx);

  ctx.fillStyle = c.text;
  ctx.font = '600 13px Fredoka, Nunito, sans-serif';
  const label = 'SUBMERGE';
  ctx.save();
  ctx.translate(20 + ctx.measureText(label).width / 2, 5);
  ctx.scale(facing, 1);
  ctx.textAlign = 'center';
  ctx.fillText(label, 0, 0);
  ctx.restore();
}

function drawSternBumper(ctx: CanvasRenderingContext2D) {
  ctx.strokeStyle = '#2D2F36';
  ctx.lineWidth = 7;
  ctx.beginPath();
  ctx.moveTo(-139, -22);
  ctx.lineTo(-139, 6);
  ctx.lineTo(-121, 24);
  ctx.stroke();
  ctx.strokeStyle = 'rgba(255,255,255,0.18)';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(-142, -20);
  ctx.lineTo(-142, 5);
  ctx.stroke();
}

export function drawIsland(ctx: CanvasRenderingContext2D, t: number, name: string) {
  ctx.lineJoin = 'round';
  ctx.lineCap = 'round';
  ctx.fillStyle = '#F5D58A';
  ctx.beginPath();
  ctx.moveTo(-250, 6);
  ctx.quadraticCurveTo(-160, -62, 0, -66);
  ctx.quadraticCurveTo(170, -62, 250, 6);
  ctx.closePath();
  ctx.fill();
  ctx.fillStyle = '#6CC57A';
  ctx.beginPath();
  ctx.moveTo(-170, -40);
  ctx.quadraticCurveTo(-60, -96, 40, -70);
  ctx.quadraticCurveTo(110, -60, 150, -38);
  ctx.quadraticCurveTo(0, -56, -170, -40);
  ctx.fill();

  palm(ctx, -120, -44, 1, t);
  palm(ctx, 150, -34, -0.8, t + 1);

  // A smaller second hut beside the shop
  ctx.fillStyle = '#B9784A';
  rrect(ctx, -78, -84, 40, 30, 4);
  ctx.fill();
  ctx.fillStyle = '#7A4B2E';
  rrect(ctx, -62, -70, 10, 16, [3, 3, 0, 0]);
  ctx.fill();
  ctx.fillStyle = '#BFE8F2';
  rrect(ctx, -75, -78, 9, 9, 2);
  ctx.fill();
  ctx.fillStyle = '#8A3B2E';
  ctx.beginPath();
  ctx.moveTo(-84, -84);
  ctx.lineTo(-58, -102);
  ctx.lineTo(-32, -84);
  ctx.closePath();
  ctx.fill();

  ctx.fillStyle = '#C98B52';
  rrect(ctx, -10, -108, 84, 52, 6);
  ctx.fill();
  ctx.fillStyle = '#8A5A3B';
  rrect(ctx, 22, -88, 20, 32, [4, 4, 0, 0]);
  ctx.fill();
  for (let i = 0; i < 6; i++) {
    ctx.fillStyle = i % 2 ? '#FFFFFF' : '#EC5B7F';
    ctx.beginPath();
    ctx.moveTo(-18 + i * 17, -108);
    ctx.lineTo(-1 + i * 17, -108);
    ctx.lineTo(-1 + i * 17, -96);
    ctx.quadraticCurveTo(-9.5 + i * 17, -90, -18 + i * 17, -96);
    ctx.closePath();
    ctx.fill();
  }
  ctx.fillStyle = '#2B4C8C';
  ctx.beginPath();
  ctx.moveTo(-22, -108);
  ctx.lineTo(32, -136);
  ctx.lineTo(86, -108);
  ctx.closePath();
  ctx.fill();

  ctx.font = '700 22px Fredoka, Nunito, sans-serif';
  ctx.textAlign = 'center';
  ctx.lineWidth = 6;
  ctx.strokeStyle = 'rgba(20,36,90,0.85)';
  ctx.strokeText(name, 30, -150);
  ctx.fillStyle = '#FFFFFF';
  ctx.fillText(name, 30, -150);
  ctx.font = '700 12px Nunito, sans-serif';
  ctx.fillStyle = '#FFF6EC';
  ctx.fillText('SHOP', 32, -66);
  ctx.textAlign = 'left';
}

function palm(ctx: CanvasRenderingContext2D, x: number, y: number, lean: number, t: number) {
  const topX = x + lean * 26;
  const topY = y - 92;
  const cx = x + lean * 4;
  const cy = y - 50;
  ctx.strokeStyle = '#9C6B3F';
  ctx.lineWidth = 9;
  ctx.beginPath();
  ctx.moveTo(x, y);
  ctx.quadraticCurveTo(cx, cy, topX, topY);
  ctx.stroke();
  ctx.strokeStyle = 'rgba(70,40,15,0.45)';
  ctx.lineWidth = 2;
  for (let k = 0.1; k < 0.95; k += 0.12) {
    const px = (1 - k) * (1 - k) * x + 2 * (1 - k) * k * cx + k * k * topX;
    const py = (1 - k) * (1 - k) * y + 2 * (1 - k) * k * cy + k * k * topY;
    const tx = 2 * (1 - k) * (cx - x) + 2 * k * (topX - cx);
    const ty = 2 * (1 - k) * (cy - y) + 2 * k * (topY - cy);
    const m = Math.hypot(tx, ty) || 1;
    ctx.beginPath();
    ctx.moveTo(px - (ty / m) * 4.5, py + (tx / m) * 4.5);
    ctx.lineTo(px + (ty / m) * 4.5, py - (tx / m) * 4.5);
    ctx.stroke();
  }
  const sway = Math.sin(t * 1.4) * 0.08;
  for (let i = 0; i < 6; i++) {
    const a = -Math.PI / 2 + (i - 2.5) * 0.62 + sway;
    ctx.save();
    ctx.translate(topX, topY);
    ctx.rotate(a);
    ctx.translate(26, 0);
    ctx.rotate(0.25);
    ctx.fillStyle = '#3FA86B';
    ctx.beginPath();
    ctx.ellipse(0, 0, 30, 8, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#2E8553';
    ctx.lineWidth = 1.6;
    ctx.beginPath();
    ctx.moveTo(-26, 0);
    ctx.lineTo(26, 0);
    ctx.stroke();
    ctx.fillStyle = '#5CC285';
    for (const px of [-14, 0, 14]) {
      ctx.beginPath();
      ctx.moveTo(px - 4, -5);
      ctx.lineTo(px, -10);
      ctx.lineTo(px + 4, -5);
      ctx.closePath();
      ctx.fill();
    }
    ctx.restore();
  }
  ctx.fillStyle = '#6B4423';
  for (const [dx, dy] of [[-5, 4], [4, 6], [0, 9]]) {
    ctx.beginPath();
    ctx.arc(topX + dx, topY + dy, 4, 0, Math.PI * 2);
    ctx.fill();
  }
}

interface CloudShape {
  width: number;
  puffs: { x: number; y: number; r: number }[];
  /** Baseline height in the sky, 0..1. */
  height: number;
}

const clouds = new Map<number, CloudShape>();

/** A cloud's shape is generated once per seed: poofy puffs along a mostly flat bottom, in widths from small to very wide. */
export function cloudShape(seed: number): CloudShape {
  let shape = clouds.get(seed);
  if (shape) return shape;
  const rnd = mulberry32(seed * 7919 + 13);
  const width = 90 + Math.pow(rnd(), 1.4) * 330;
  const n = Math.max(4, Math.round(width / 34));
  const puffs: CloudShape['puffs'] = [{ x: 12, y: -12, r: 12 }, { x: width - 12, y: -12, r: 12 }];
  for (let j = 0; j < n; j++) {
    const u = (j + 0.5) / n;
    const envelope = Math.pow(Math.sin(Math.PI * u), 0.7);
    const r = (15 + rnd() * 15) * (0.55 + 0.9 * envelope);
    puffs.push({ x: u * width + (rnd() - 0.5) * 10, y: -r * 0.55 - rnd() * 6, r });
  }
  const crown = 12 + rnd() * 14;
  puffs.push({ x: width * (0.35 + rnd() * 0.3), y: -crown * 1.5 - 6, r: crown * 1.2 });
  shape = { width, puffs, height: rnd() };
  clouds.set(seed, shape);
  return shape;
}

export function drawCloud(ctx: CanvasRenderingContext2D, seed: number, color = '#FFFFFF') {
  const { width, puffs } = cloudShape(seed);
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.moveTo(12, -14);
  ctx.lineTo(width - 12, -14);
  ctx.lineTo(width - 12, -2);
  ctx.quadraticCurveTo(width / 2, 5, 12, -2);
  ctx.closePath();
  ctx.fill();
  for (const p of puffs) {
    ctx.beginPath();
    ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
    ctx.fill();
  }
}

export function drawBuoy(ctx: CanvasRenderingContext2D, t: number, label: string, dir: 1 | -1) {
  ctx.save();
  ctx.rotate(Math.sin(t * 1.7) * 0.08);
  ctx.strokeStyle = '#2B3A67';
  ctx.lineWidth = 4;
  ctx.beginPath();
  ctx.moveTo(0, -20);
  ctx.lineTo(0, -80);
  ctx.stroke();
  ctx.fillStyle = '#F7C948';
  ctx.beginPath();
  ctx.moveTo(0, -80);
  ctx.lineTo(dir * 30, -71);
  ctx.lineTo(0, -62);
  ctx.closePath();
  ctx.fill();
  ctx.fillStyle = '#E9505C';
  rrect(ctx, -16, -26, 32, 30, 10);
  ctx.fill();
  ctx.fillStyle = '#FFFFFF';
  ctx.fillRect(-16, -16, 32, 8);
  ctx.restore();
  ctx.font = '700 16px Fredoka, Nunito, sans-serif';
  ctx.textAlign = 'center';
  ctx.lineWidth = 5;
  ctx.strokeStyle = 'rgba(20,36,90,0.85)';
  const text = dir > 0 ? `${label} →` : `← ${label}`;
  ctx.strokeText(text, 0, -96);
  ctx.fillStyle = '#FFFFFF';
  ctx.fillText(text, 0, -96);
  ctx.textAlign = 'left';
}

export function drawWreck(ctx: CanvasRenderingContext2D, kind: 'sloop' | 'galleon') {
  ctx.save();
  ctx.lineJoin = 'round';
  ctx.lineCap = 'round';
  ctx.rotate(-0.12);
  if (kind === 'galleon') ctx.scale(1.5, 1.5);
  ctx.fillStyle = '#6E4A35';
  ctx.beginPath();
  ctx.moveTo(-110, -16);
  ctx.lineTo(100, -34);
  ctx.quadraticCurveTo(96, 8, 60, 20);
  ctx.lineTo(-90, 20);
  ctx.quadraticCurveTo(-112, 8, -110, -16);
  ctx.fill();
  if (kind === 'galleon') {
    rrect(ctx, -108, -54, 50, 40, 4);
    ctx.fill();
  }
  ctx.strokeStyle = 'rgba(0,0,0,0.2)';
  ctx.lineWidth = 2;
  for (const y of [-6, 4, 12]) {
    ctx.beginPath();
    ctx.moveTo(-100, y);
    ctx.lineTo(80, y - 12);
    ctx.stroke();
  }
  ctx.fillStyle = '#2E2230';
  for (const x of [-60, -30, 0, 30]) {
    ctx.beginPath();
    ctx.arc(x, -10 - x * 0.06, 5, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.beginPath();
  ctx.moveTo(40, -20);
  ctx.lineTo(58, -10);
  ctx.lineTo(48, 4);
  ctx.lineTo(34, -4);
  ctx.closePath();
  ctx.fill();
  ctx.strokeStyle = '#5A3B29';
  ctx.lineWidth = 7;
  ctx.beginPath();
  ctx.moveTo(-10, -24);
  ctx.lineTo(4, -112);
  ctx.stroke();
  ctx.lineWidth = 5;
  ctx.beginPath();
  ctx.moveTo(-24, -84);
  ctx.lineTo(22, -90);
  ctx.stroke();
  if (kind === 'galleon') {
    ctx.lineWidth = 6;
    ctx.beginPath();
    ctx.moveTo(56, -30);
    ctx.lineTo(70, -80);
    ctx.stroke();
    ctx.fillStyle = 'rgba(231,220,194,0.7)';
    ctx.beginPath();
    ctx.moveTo(-20, -82);
    ctx.lineTo(20, -88);
    ctx.quadraticCurveTo(26, -60, 14, -40);
    ctx.lineTo(4, -50);
    ctx.lineTo(-6, -38);
    ctx.quadraticCurveTo(-24, -60, -20, -82);
    ctx.fill();
  }
  ctx.restore();
}

/** Traces one of four rock outlines (circle, rounded square, blob, chunky polygon); returns true if it needs a rounded stroke. */
function rockPath(ctx: CanvasRenderingContext2D, R: number, tint: number) {
  const variant = Math.floor(((tint * 1000) % 1) * 4);
  const rnd = (i: number) => {
    const v = Math.sin((tint * 97.3 + i) * 12.9898) * 43758.5453;
    return v - Math.floor(v);
  };
  ctx.beginPath();
  if (variant === 0) {
    ctx.arc(0, 0, R, 0, Math.PI * 2);
    return false;
  }
  if (variant === 1) {
    ctx.save();
    ctx.rotate((rnd(1) - 0.5) * 0.9);
    ctx.roundRect(-R * 0.88, -R * 0.88, R * 1.76, R * 1.76, R * 0.45);
    ctx.restore();
    return false;
  }
  const n = variant === 2 ? 5 : 6;
  const pts: [number, number][] = [];
  for (let i = 0; i < n; i++) {
    const a = (i / n) * Math.PI * 2 + rnd(i + 5) * 0.4;
    const r = R * (variant === 2 ? 0.8 + 0.3 * rnd(i) : 0.62 + 0.25 * rnd(i));
    pts.push([Math.cos(a) * r, Math.sin(a) * r]);
  }
  if (variant === 3) {
    pts.forEach(([x, y], i) => (i ? ctx.lineTo(x, y) : ctx.moveTo(x, y)));
    ctx.closePath();
    return true;
  }
  const mid = (a: [number, number], b: [number, number]): [number, number] => [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2];
  const start = mid(pts[n - 1], pts[0]);
  ctx.moveTo(start[0], start[1]);
  for (let i = 0; i < n; i++) {
    const m = mid(pts[i], pts[(i + 1) % n]);
    ctx.quadraticCurveTo(pts[i][0], pts[i][1], m[0], m[1]);
  }
  ctx.closePath();
  return false;
}

const CORAL = ['#FF8FA3', '#FFB070', '#B48CFF', '#FF6F91'];

export function drawDeco(ctx: CanvasRenderingContext2D, kind: DecoKind, size: number, tint: number, t: number, push = 0, pale = false) {
  ctx.lineJoin = 'round';
  ctx.lineCap = 'round';
  if (kind !== 'kelp' && kind !== 'coral' && kind !== 'rock') {
    drawBones(ctx, kind, size, tint, push);
    return;
  }
  if (kind === 'rock') {
    const color = pale ? (tint > 0.5 ? '#BDB6AC' : '#ADA69C') : tint > 0.5 ? '#5B6B8A' : '#4E5C7D';
    const R = 26 * size;
    ctx.save();
    ctx.translate(0, 4 * size);
    ctx.fillStyle = color;
    ctx.strokeStyle = color;
    const sharp = rockPath(ctx, R, tint);
    ctx.fill();
    if (sharp) {
      ctx.lineWidth = 9 * size;
      ctx.stroke();
    }
    ctx.fillStyle = 'rgba(255,255,255,0.12)';
    ctx.beginPath();
    ctx.ellipse(-0.3 * R, -0.5 * R, 0.45 * R, 0.2 * R, -0.5, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  } else if (kind === 'kelp') {
    const h = 90 + size * 80;
    const sway = Math.sin(t * 1.1 + tint * 10) * 14 + push;
    ctx.strokeStyle = '#3E9E5A';
    ctx.lineWidth = 5;
    ctx.beginPath();
    ctx.moveTo(0, 4);
    ctx.quadraticCurveTo(sway * 0.4, -h * 0.5, sway, -h);
    ctx.stroke();
    ctx.fillStyle = '#4FB86B';
    for (let i = 1; i < 6; i++) {
      const k = i / 6;
      const x = sway * (0.8 * k + 0.2 * k * k);
      const y = 4 * (1 - k) * (1 - k) - h * k;
      const side = i % 2 ? 1 : -1;
      const flap = Math.sin(t * 1.8 + i * 0.9 + tint * 7) * 0.25;
      const angle = side > 0 ? -0.45 + flap : Math.PI + 0.45 - flap;
      ctx.beginPath();
      ctx.ellipse(x + Math.cos(angle) * 10, y + Math.sin(angle) * 10, 10, 4, angle, 0, Math.PI * 2);
      ctx.fill();
    }
  } else {
    const c = CORAL[Math.floor(tint * CORAL.length)];
    ctx.strokeStyle = c;
    ctx.fillStyle = c;
    ctx.lineWidth = 7 * size;
    const branches: [number, number][] = [
      [-14, -30],
      [0, -44],
      [14, -32],
      [-6, -22],
    ];
    for (const [x, y] of branches) {
      ctx.beginPath();
      ctx.moveTo(0, 4);
      ctx.quadraticCurveTo(x * 0.3 * size, y * 0.5 * size, x * size, y * size);
      ctx.stroke();
      ctx.beginPath();
      ctx.arc(x * size, y * size, 5 * size, 0, Math.PI * 2);
      ctx.fill();
    }
  }
}
