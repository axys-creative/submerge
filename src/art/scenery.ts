import { mixColor, mulberry32, rrect } from '../util';
import { ISLAND_WIDTH } from '../config';
import { drawTankShape } from './sub';
import { drawBones, type BoneKind } from './bones';

export type DecoKind = 'kelp' | 'coral' | 'rock' | 'stone' | 'starfish' | 'plank' | 'lungsub' | BoneKind;

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

/** Where the dock's slanted poles meet the water, as offsets from the island center; they run on down into the underwater mountain. */
export const DOCK_POLES = [0.5, 0.7, 0.9].map((f) => 250 * ISLAND_WIDTH - 100 + 250 * f + 5);

export function drawIsland(ctx: CanvasRenderingContext2D, t: number, name: string, night = 0) {
  ctx.lineJoin = 'round';
  ctx.lineCap = 'round';
  const d = (c: string) => (night > 0 ? mixColor(c, '#0B1430', night * 0.55) : c);
  const glass = (x: number, y: number, w: number, h: number) => {
    if (night > 0.05) {
      const glow = ctx.createRadialGradient(x + w / 2, y + h / 2, 1, x + w / 2, y + h / 2, w * 2.2);
      glow.addColorStop(0, `rgba(255,214,120,${0.55 * night})`);
      glow.addColorStop(1, 'rgba(255,214,120,0)');
      ctx.fillStyle = glow;
      ctx.fillRect(x - w * 2, y - w * 2, w * 5, h + w * 4);
    }
    ctx.fillStyle = night > 0.05 ? mixColor('#BFE8F2', '#FFD36B', night) : '#BFE8F2';
    rrect(ctx, x, y, w, h, 2);
    ctx.fill();
  };

  ctx.save();
  ctx.scale(ISLAND_WIDTH, 1);
  ctx.fillStyle = d('#F5D58A');
  ctx.beginPath();
  ctx.moveTo(-250, 6);
  ctx.quadraticCurveTo(-160, -62, 0, -66);
  ctx.quadraticCurveTo(170, -62, 250, 6);
  ctx.closePath();
  ctx.fill();
  ctx.fillStyle = d('#6CC57A');
  ctx.beginPath();
  ctx.moveTo(-170, -40);
  ctx.quadraticCurveTo(-60, -96, 40, -70);
  ctx.quadraticCurveTo(110, -60, 150, -38);
  ctx.quadraticCurveTo(0, -56, -170, -40);
  ctx.fill();
  ctx.restore();

  const reach = 250 * ISLAND_WIDTH;
  const deckL = reach - 100;
  const deckR = reach + 150;
  const deckY = -9;
  ctx.fillStyle = d('#6B4A2B');
  for (let x = deckL + 14; x < deckR; x += 46) {
    rrect(ctx, x, deckY + 4, 7, 40, 2);
    ctx.fill();
  }
  ctx.fillStyle = d('#B98A55');
  rrect(ctx, deckL, deckY, deckR - deckL, 7, 2);
  ctx.fill();
  ctx.strokeStyle = d('#8A6238');
  ctx.lineWidth = 1.5;
  for (let x = deckL + 12; x < deckR; x += 12) {
    ctx.beginPath();
    ctx.moveTo(x, deckY);
    ctx.lineTo(x, deckY + 7);
    ctx.stroke();
  }
  ctx.fillStyle = d('#7A5330');
  rrect(ctx, deckR - 8, deckY - 26, 7, 28, 2);
  ctx.fill();
  if (night > 0.05) {
    const glow = ctx.createRadialGradient(deckR - 4, deckY - 30, 1, deckR - 4, deckY - 30, 34);
    glow.addColorStop(0, `rgba(255,214,120,${0.5 * night})`);
    glow.addColorStop(1, 'rgba(255,214,120,0)');
    ctx.fillStyle = glow;
    ctx.fillRect(deckR - 40, deckY - 66, 72, 72);
  }
  ctx.fillStyle = night > 0.05 ? mixColor('#E8E0C8', '#FFD36B', night) : '#E8E0C8';
  rrect(ctx, deckR - 9, deckY - 36, 9, 10, 3);
  ctx.fill();

  const spread = 170 * (ISLAND_WIDTH - 1);
  palm(ctx, -120 - spread, -44, 1, t, d);
  palm(ctx, 150 + spread, -34, -0.8, t + 1, d);
  if (spread) {
    palm(ctx, -120, -44, 1, t + 2, d);
    palm(ctx, 150, -34, -0.8, t + 3, d);
  }

  // A smaller second hut beside the shop
  ctx.fillStyle = d('#B9784A');
  rrect(ctx, -78, -84, 40, 30, 4);
  ctx.fill();
  ctx.fillStyle = d('#7A4B2E');
  rrect(ctx, -62, -70, 10, 16, [3, 3, 0, 0]);
  ctx.fill();
  glass(-75, -78, 9, 9);
  ctx.fillStyle = d('#8A3B2E');
  ctx.beginPath();
  ctx.moveTo(-84, -84);
  ctx.lineTo(-58, -102);
  ctx.lineTo(-32, -84);
  ctx.closePath();
  ctx.fill();

  // A third hut on the other side of the shop
  ctx.fillStyle = d('#A9C0C9');
  rrect(ctx, 96, -84, 40, 30, 4);
  ctx.fill();
  ctx.fillStyle = d('#5C7A86');
  rrect(ctx, 106, -70, 10, 16, [3, 3, 0, 0]);
  ctx.fill();
  glass(122, -78, 9, 9);
  ctx.fillStyle = d('#2F7C86');
  ctx.beginPath();
  ctx.moveTo(90, -84);
  ctx.lineTo(116, -102);
  ctx.lineTo(142, -84);
  ctx.closePath();
  ctx.fill();

  ctx.fillStyle = d('#C98B52');
  rrect(ctx, -10, -108, 84, 52, 6);
  ctx.fill();
  ctx.fillStyle = d('#8A5A3B');
  rrect(ctx, 22, -88, 20, 32, [4, 4, 0, 0]);
  ctx.fill();
  glass(-1, -84, 14, 14);
  glass(52, -84, 14, 14);
  for (let i = 0; i < 6; i++) {
    ctx.fillStyle = d(i % 2 ? '#FFFFFF' : '#EC5B7F');
    ctx.beginPath();
    ctx.moveTo(-18 + i * 17, -108);
    ctx.lineTo(-1 + i * 17, -108);
    ctx.lineTo(-1 + i * 17, -96);
    ctx.quadraticCurveTo(-9.5 + i * 17, -90, -18 + i * 17, -96);
    ctx.closePath();
    ctx.fill();
  }
  ctx.fillStyle = d('#2B4C8C');
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

function palm(ctx: CanvasRenderingContext2D, x: number, y: number, lean: number, t: number, d: (c: string) => string = (c) => c) {
  const topX = x + lean * 26;
  const topY = y - 92;
  const cx = x + lean * 4;
  const cy = y - 50;
  ctx.strokeStyle = d('#9C6B3F');
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
    ctx.fillStyle = d('#3FA86B');
    ctx.beginPath();
    ctx.ellipse(0, 0, 30, 8, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = d('#2E8553');
    ctx.lineWidth = 1.6;
    ctx.beginPath();
    ctx.moveTo(-26, 0);
    ctx.lineTo(26, 0);
    ctx.stroke();
    ctx.fillStyle = d('#5CC285');
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
  ctx.fillStyle = d('#6B4423');
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

export function drawWreck(ctx: CanvasRenderingContext2D, kind: 'sloop' | 'galleon' | 'freighter' | 'containers') {
  if (kind === 'freighter') return drawFreighter(ctx);
  if (kind === 'containers') return drawContainers(ctx);
  ctx.save();
  ctx.lineJoin = 'round';
  ctx.lineCap = 'round';
  ctx.rotate(-0.12);
  if (kind === 'galleon') ctx.scale(3, 3);
  const hull = () => {
    ctx.beginPath();
    ctx.moveTo(-110, -16);
    ctx.lineTo(100, -34);
    ctx.quadraticCurveTo(96, 8, 60, 20);
    ctx.lineTo(-90, 20);
    ctx.quadraticCurveTo(-112, 8, -110, -16);
  };
  ctx.fillStyle = '#6E4A35';
  hull();
  ctx.fill();
  if (kind === 'galleon') {
    rrect(ctx, -108, -46, 50, 32, 3);
    ctx.fill();
    ctx.fillStyle = '#8A6446';
    ctx.fillRect(-112, -50, 58, 5);
    ctx.fillStyle = '#5A3B29';
    for (const x of [-108, -88, -68, -57]) ctx.fillRect(x, -62, 4, 13);
    ctx.fillStyle = '#8A6446';
    ctx.fillRect(-112, -64, 58, 4);
    ctx.fillStyle = '#8A6446';
    ctx.beginPath();
    ctx.moveTo(-28, -10);
    ctx.lineTo(-28, -28);
    ctx.lineTo(-35, -28);
    ctx.lineTo(-35, -34);
    ctx.lineTo(-42, -34);
    ctx.lineTo(-42, -40);
    ctx.lineTo(-49, -40);
    ctx.lineTo(-49, -46);
    ctx.lineTo(-58, -46);
    ctx.lineTo(-58, -10);
    ctx.closePath();
    ctx.fill();
    ctx.save();
    hull();
    ctx.clip();
    ctx.fillStyle = '#6E4A35';
    ctx.fillRect(-60, -30, 34, 40);
    ctx.restore();
    ctx.strokeStyle = 'rgba(0,0,0,0.25)';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    for (const [x, y] of [[-35, -28], [-42, -34], [-49, -40]]) {
      ctx.moveTo(x, y);
      ctx.lineTo(x, y + 6);
    }
    ctx.stroke();
    ctx.fillStyle = '#2E2230';
    for (const x of [-94, -72]) {
      ctx.strokeStyle = '#A87B52';
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      ctx.arc(x, -32, 5.5, 0, Math.PI * 2);
      ctx.stroke();
      ctx.beginPath();
      ctx.arc(x, -32, 5, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.fillStyle = '#6E4A35';
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
    if (kind === 'galleon') {
      ctx.strokeStyle = '#A87B52';
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      ctx.arc(x, -10 - x * 0.06, 5.5, 0, Math.PI * 2);
      ctx.stroke();
    }
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
    const bx = 88;
    const by = -30;
    const tx = 148;
    const ty = -54;
    const len = Math.hypot(tx - bx, ty - by);
    const nx = -(ty - by) / len;
    const ny = (tx - bx) / len;
    ctx.fillStyle = '#6E4A35';
    ctx.beginPath();
    ctx.moveTo(bx + nx * 4.8, by + ny * 4.8);
    ctx.lineTo(tx + nx * 2.4, ty + ny * 2.4);
    ctx.lineTo(tx - nx * 2.4, ty - ny * 2.4);
    ctx.lineTo(bx - nx * 4.8, by - ny * 4.8);
    ctx.closePath();
    ctx.fill();
    ctx.beginPath();
    ctx.arc(tx, ty, 2.4, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#5A3B29';
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

/** Shipping containers spilled across the sea floor: a lopsided stack, a few toppled ones and a lid knocked loose. */
function drawContainers(ctx: CanvasRenderingContext2D) {
  const tones = ['#B8432F', '#D49A36', '#386FA8', '#3E8F68', '#8A8F99', '#7A4F9E'];
  const box = (x: number, y: number, rot: number, tone: number, open = false) => {
    const w = 130;
    const h = 52;
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(rot);
    ctx.fillStyle = tones[tone];
    ctx.fillRect(-w / 2, -h, w, h);
    ctx.fillStyle = 'rgba(0,0,0,0.2)';
    for (let k = 1; k < 14; k++) ctx.fillRect(-w / 2 + k * (w / 14), -h, 2.5, h);
    ctx.fillStyle = 'rgba(255,255,255,0.14)';
    ctx.fillRect(-w / 2, -h, w, 5);
    ctx.fillStyle = 'rgba(0,0,0,0.3)';
    ctx.fillRect(-w / 2, -h, 6, h);
    ctx.fillRect(w / 2 - 6, -h, 6, h);
    ctx.fillStyle = 'rgba(150,70,25,0.35)';
    ctx.beginPath();
    ctx.ellipse(-w * 0.15, -h * 0.4, 24, 9, 0, 0, Math.PI * 2);
    ctx.fill();
    if (open) {
      ctx.fillStyle = '#1B1A20';
      ctx.fillRect(w / 2 - 6, -h + 4, 6, h - 8);
    }
    ctx.restore();
  };
  ctx.save();
  box(-110, 14, -0.02, 0);
  box(30, 16, 0.03, 2);
  box(-40, -38, 0.04, 1);
  box(100, -36, -0.05, 4, true);
  box(-90, -92, -0.12, 3);
  box(-250, 18, 0.06, 5);
  box(185, 20, 1.45, 0, true);
  box(300, 24, -0.04, 2);
  ctx.restore();
}

/** A modern container ship broken on the sea floor, about 2,600 px long: stern bridge and funnel on the left, bow on the right. */
function drawFreighter(ctx: CanvasRenderingContext2D) {
  const rnd = mulberry32(2718);
  ctx.save();
  ctx.lineJoin = 'round';
  ctx.lineCap = 'round';
  ctx.scale(2, 2);
  ctx.rotate(-0.04);

  const hull = (x0: number, x1: number, bowRake: number) => {
    ctx.beginPath();
    ctx.moveTo(x0, -78);
    ctx.lineTo(x1 + bowRake, -88);
    ctx.lineTo(x1, 12);
    ctx.lineTo(x0 + 14, 14);
    ctx.closePath();
  };
  const section = (x0: number, x1: number, bowRake: number, drop: number) => {
    ctx.save();
    ctx.translate(0, drop);
    hull(x0, x1, bowRake);
    ctx.fillStyle = '#7C2F2B';
    ctx.fill();
    ctx.save();
    hull(x0, x1, bowRake);
    ctx.clip();
    ctx.fillStyle = '#2B2326';
    ctx.fillRect(x0 - 20, -22, x1 - x0 + 120, 50);
    ctx.fillStyle = 'rgba(255,255,255,0.1)';
    ctx.fillRect(x0 - 20, -84, x1 - x0 + 120, 5);
    ctx.strokeStyle = 'rgba(0,0,0,0.22)';
    ctx.lineWidth = 2;
    for (let x = x0 + 40; x < x1; x += 64) {
      ctx.beginPath();
      ctx.moveTo(x, -86);
      ctx.lineTo(x, 14);
      ctx.stroke();
    }
    ctx.fillStyle = 'rgba(190,80,30,0.35)';
    for (let i = 0; i < 12; i++) {
      ctx.beginPath();
      ctx.ellipse(x0 + rnd() * (x1 - x0), -70 + rnd() * 80, 10 + rnd() * 26, 5 + rnd() * 10, 0, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.restore();
    ctx.restore();
  };
  section(-650, -90, 0, 0);
  section(-70, 640, 70, 16);

  ctx.fillStyle = '#16181E';
  ctx.beginPath();
  ctx.moveTo(-96, -92);
  ctx.lineTo(-64, -80);
  ctx.lineTo(-84, -56);
  ctx.lineTo(-58, -30);
  ctx.lineTo(-80, -4);
  ctx.lineTo(-62, 18);
  ctx.lineTo(-100, 18);
  ctx.closePath();
  ctx.fill();

  const tones = ['#D9503F', '#E6A23C', '#3E7FC4', '#4FA67A', '#C9CED6', '#8A5FB5', '#D96B2B'];
  const stacks = (x0: number, x1: number, drop: number, tilt: number) => {
    ctx.save();
    ctx.translate(0, drop);
    ctx.rotate(tilt);
    for (let x = x0; x < x1; x += 46) {
      const rows = 1 + Math.floor(rnd() * 4);
      for (let r = 0; r < rows; r++) {
        if (rnd() < 0.08) continue;
        ctx.fillStyle = tones[Math.floor(rnd() * tones.length)];
        ctx.fillRect(x, -88 - (r + 1) * 28, 44, 27);
        ctx.fillStyle = 'rgba(0,0,0,0.18)';
        for (let k = 1; k < 5; k++) ctx.fillRect(x + k * 8.5, -88 - (r + 1) * 28, 1.5, 27);
      }
    }
    ctx.restore();
  };
  stacks(-330, -100, 0, 0);
  stacks(-60, 560, 16, 0.03);

  ctx.fillStyle = '#E9ECF1';
  ctx.fillRect(-600, -200, 190, 122);
  ctx.fillRect(-584, -246, 150, 46);
  ctx.fillRect(-596, -226, 174, 12);
  ctx.fillStyle = '#2C4A6B';
  for (let row = 0; row < 3; row++) {
    for (let i = 0; i < 7; i++) ctx.fillRect(-590 + i * 26, -190 + row * 34, 16, 14);
  }
  for (let i = 0; i < 6; i++) ctx.fillRect(-576 + i * 24, -238, 15, 22);
  ctx.fillStyle = '#C9341F';
  ctx.fillRect(-520, -300, 54, 56);
  ctx.fillStyle = '#16181E';
  ctx.fillRect(-520, -308, 54, 12);
  ctx.strokeStyle = '#2B2326';
  ctx.lineWidth = 4;
  ctx.beginPath();
  ctx.moveTo(-500, -246);
  ctx.lineTo(-500, -330);
  ctx.moveTo(-514, -330);
  ctx.lineTo(-486, -330);
  ctx.stroke();

  ctx.lineWidth = 7;
  ctx.strokeStyle = '#D9A23C';
  for (const [x, lean] of [[110, 0.05], [340, -0.04]] as const) {
    ctx.beginPath();
    ctx.moveTo(x, -78);
    ctx.lineTo(x + lean * 100, -190);
    ctx.lineTo(x + 70, -162);
    ctx.stroke();
  }

  ctx.fillStyle = 'rgba(255,230,160,0.65)';
  for (let x = -380; x < 600; x += 56) {
    ctx.beginPath();
    ctx.arc(x, -50 + (x > -80 ? 16 : 0), 3, 0, Math.PI * 2);
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

const CORAL = ['#FF5C8A', '#FF8A3D', '#FFC83D', '#B36BFF', '#3DD6C6', '#FF6F91', '#5CC8FF', '#9BE564', '#FF4D6D', '#F7A8FF'];

/** A rusted iron-lung submarine lying on twin ballast tanks, its flattened front caved in, with bite punctures, claw gashes and torn plating. */
function lungSub(ctx: CanvasRenderingContext2D, size: number) {
  ctx.save();
  ctx.scale(size, size);
  ctx.rotate(-0.06);
  ctx.translate(0, -62);
  ctx.rotate(Math.PI);
  ctx.translate(0, 62);
  const L = 150;
  const H = 44;
  const cy = -80;
  const dark = '#160B0A';

  const tank = (x0: number, x1: number, y: number, r: number, top: string, bottom: string) => {
    const g = ctx.createLinearGradient(0, y - r, 0, y + r);
    g.addColorStop(0, top);
    g.addColorStop(1, bottom);
    ctx.fillStyle = g;
    ctx.fillRect(x0, y - r, x1 - x0, r * 2);
    ctx.fillStyle = 'rgba(25,12,10,0.7)';
    for (let x = x0 + 16; x < x1 - 10; x += 30) ctx.fillRect(x, y - r - 3, 7, r * 2 + 6);
    ctx.fillStyle = bottom;
    ctx.beginPath();
    ctx.ellipse(x1, y, r * 0.35, r, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = 'rgba(15,8,7,0.6)';
    ctx.beginPath();
    ctx.ellipse(x0, y, r * 0.35, r, 0, 0, Math.PI * 2);
    ctx.fill();
  };
  tank(-150, 95, -34, 14, '#5E382F', '#2B1714');
  ctx.strokeStyle = '#2A1614';
  ctx.lineWidth = 5;
  for (const x of [-85, 70]) {
    ctx.beginPath();
    ctx.moveTo(x, cy + H - 2);
    ctx.lineTo(x - 12, -24);
    ctx.stroke();
  }
  tank(-120, 140, -14, 14, '#7A4A3E', '#3A201B');
  ctx.fillStyle = '#2A1614';
  ctx.fillRect(-135, -3, 22, 4);
  ctx.fillRect(100, -3, 22, 4);

  // Tail: rudder fin and a propeller hub.
  ctx.fillStyle = '#4A2A25';
  ctx.beginPath();
  ctx.moveTo(-L + 10, cy - H);
  ctx.lineTo(-L - 28, cy - H - 22);
  ctx.lineTo(-L - 6, cy - H + 12);
  ctx.closePath();
  ctx.fill();
  ctx.fillStyle = '#3A201C';
  ctx.beginPath();
  ctx.ellipse(-L - 12, cy, 12, 9, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = '#5E382F';
  ctx.lineWidth = 4;
  ctx.beginPath();
  ctx.moveTo(-L - 14, cy - 24);
  ctx.lineTo(-L - 10, cy + 24);
  ctx.stroke();

  // Hull.
  const hull = ctx.createLinearGradient(0, cy - H, 0, cy + H);
  hull.addColorStop(0, '#80503F');
  hull.addColorStop(0.5, '#5B342C');
  hull.addColorStop(1, '#2C1714');
  ctx.fillStyle = hull;
  ctx.beginPath();
  ctx.ellipse(-L, cy, 20, H, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillRect(-L, cy - H, L * 2 - 6, H * 2);
  ctx.fillStyle = 'rgba(160,92,52,0.22)';
  for (const [x, y, rx, ry] of [[-100, cy - 20, 30, 12], [-30, cy + 24, 40, 10], [60, cy - 26, 26, 9], [95, cy + 12, 22, 14]] as const) {
    ctx.beginPath();
    ctx.ellipse(x, y, rx, ry, 0.2, 0, Math.PI * 2);
    ctx.fill();
  }
  for (const x of [-105, -15, 85]) {
    ctx.fillStyle = '#6E4638';
    ctx.fillRect(x, cy - H, 9, H * 2);
    ctx.fillStyle = 'rgba(25,12,10,0.65)';
    for (let y = cy - H + 8; y < cy + H; y += 16) {
      ctx.beginPath();
      ctx.arc(x + 4.5, y, 1.6, 0, Math.PI * 2);
      ctx.fill();
    }
  }
  ctx.fillStyle = 'rgba(214,186,172,0.32)';
  ctx.font = 'bold 13px sans-serif';
  ctx.fillText('SM-13', -88, cy - 22);
  ctx.fillStyle = '#4C2A24';
  ctx.fillRect(-36, cy - H - 8, 24, 9);
  ctx.strokeStyle = '#2A1614';
  ctx.lineWidth = 2.5;
  ctx.strokeRect(-30, cy - H - 13, 12, 6);

  // Gill vent with its flared fins.
  ctx.fillStyle = dark;
  ctx.fillRect(14, cy - 18, 40, 34);
  ctx.fillStyle = '#9A6656';
  for (let i = 0; i < 5; i++) {
    ctx.beginPath();
    ctx.moveTo(19 + i * 7.5, cy + 12);
    ctx.lineTo(23 + i * 7.5, cy - 13);
    ctx.lineTo(27 + i * 7.5, cy + 12);
    ctx.closePath();
    ctx.fill();
  }

  // Caved-in, flattened front: bent plate, exposed framework, a cracked porthole.
  ctx.fillStyle = '#3E2420';
  ctx.beginPath();
  ctx.moveTo(L - 8, cy - H + 2);
  ctx.lineTo(L + 10, cy - H + 14);
  ctx.lineTo(L + 3, cy - 10);
  ctx.lineTo(L + 13, cy + 10);
  ctx.lineTo(L + 5, cy + H - 8);
  ctx.lineTo(L - 8, cy + H);
  ctx.closePath();
  ctx.fill();
  ctx.strokeStyle = '#1E100E';
  ctx.lineWidth = 3;
  ctx.beginPath();
  for (const k of [0, 1, 2]) {
    ctx.moveTo(L - 40 + k * 8, cy - H);
    ctx.quadraticCurveTo(L + 6, cy - H + 4 + k * 4, L + 12 - k * 2, cy - H + 26 + k * 10);
  }
  ctx.stroke();
  ctx.fillStyle = '#8B5C4E';
  ctx.beginPath();
  ctx.moveTo(L - 46, cy - H);
  ctx.lineTo(L - 14, cy - H - 14);
  ctx.lineTo(L - 22, cy - H + 4);
  ctx.lineTo(L + 4, cy - H - 2);
  ctx.lineTo(L - 12, cy - H + 14);
  ctx.closePath();
  ctx.fill();
  ctx.fillStyle = '#20171A';
  ctx.beginPath();
  ctx.arc(L - 14, cy + 8, 14, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = '#7A4A3E';
  ctx.lineWidth = 4;
  ctx.stroke();
  ctx.strokeStyle = 'rgba(210,225,235,0.55)';
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.moveTo(L - 22, cy);
  ctx.lineTo(L - 13, cy + 8);
  ctx.lineTo(L - 16, cy + 18);
  ctx.moveTo(L - 13, cy + 8);
  ctx.lineTo(L - 4, cy + 4);
  ctx.stroke();

  // Bite marks: scalloped chunks torn from the hull edge, with rows of tooth punctures around them.
  const bite = (bx: number, by: number, r: number, up: boolean) => {
    const a0 = up ? Math.PI : 0;
    ctx.fillStyle = dark;
    ctx.beginPath();
    ctx.arc(bx, by, r, a0, a0 + Math.PI);
    ctx.closePath();
    ctx.fill();
    ctx.strokeStyle = '#B27A66';
    ctx.lineWidth = 2;
    ctx.beginPath();
    for (let i = 0; i <= 6; i++) {
      const a = a0 + (i / 6) * Math.PI;
      const rr = r + (i % 2 ? 4 : -1);
      const x = bx + Math.cos(a) * rr;
      const y = by + Math.sin(a) * rr;
      if (i) ctx.lineTo(x, y);
      else ctx.moveTo(x, y);
    }
    ctx.stroke();
    ctx.fillStyle = dark;
    ctx.strokeStyle = 'rgba(178,122,102,0.7)';
    ctx.lineWidth = 1.5;
    for (let i = 0; i < 5; i++) {
      const a = a0 + Math.PI * (0.12 + i * 0.19);
      const x = bx + Math.cos(a) * (r + 15);
      const y = by + Math.sin(a) * (r + 15);
      ctx.beginPath();
      ctx.arc(x, y, 3.2 + (i % 2), 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
    }
  };
  bite(-5, cy - H + 1, 22, false);
  bite(112, cy + H - 1, 24, true);
  bite(-120, cy + H - 1, 14, true);
  ctx.lineCap = 'round';
  for (const o of [0, 9, 18]) {
    ctx.strokeStyle = dark;
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(48 + o, cy - 30);
    ctx.lineTo(78 + o, cy + 28);
    ctx.stroke();
    ctx.strokeStyle = 'rgba(178,122,102,0.4)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(50 + o, cy - 30);
    ctx.lineTo(80 + o, cy + 28);
    ctx.stroke();
  }
  ctx.restore();
}

const STARFISH = ['#F28C38', '#E5484D', '#F58FB0', '#8E6CCF', '#F7C948', '#D9A066', '#4F8FD8', '#FF6F61'];
const STAR_ARMS = [5, 5, 5, 5, 6, 7, 9, 12];
const frac = (v: number) => v - Math.floor(v);

/** A starfish lying on the floor; its color, number of arms, plumpness and angle all come from `tint`, so each one looks different. */
/** A board broken off a wreck, resting on the floor; `lean` (the deco's push) tilts it about its lower end so a tilted one pokes up off the ground. */
function drawPlank(ctx: CanvasRenderingContext2D, size: number, tint: number, lean: number) {
  const L = (44 + tint * 40) * size;
  const W = 12 * size;
  const pivot = lean > 0 ? L / 2 : -L / 2;
  ctx.save();
  ctx.translate(pivot, 0);
  ctx.rotate(lean);
  ctx.translate(-pivot, 0);
  ctx.fillStyle = tint > 0.5 ? '#7A5438' : '#6B4A33';
  ctx.beginPath();
  ctx.moveTo(-L / 2, 0);
  ctx.lineTo(-L / 2, -W);
  ctx.lineTo(L / 2 - 8 * size, -W);
  ctx.lineTo(L / 2 - 3 * size, -W * 0.55);
  ctx.lineTo(L / 2, -W * 0.8);
  ctx.lineTo(L / 2 - 5 * size, 0);
  ctx.closePath();
  ctx.fill();
  ctx.fillStyle = 'rgba(255,225,180,0.16)';
  ctx.fillRect(-L / 2, -W, L - 10 * size, W * 0.28);
  ctx.strokeStyle = 'rgba(0,0,0,0.22)';
  ctx.lineWidth = 1.2 * size;
  ctx.beginPath();
  ctx.moveTo(-L / 2 + 3 * size, -W * 0.5);
  ctx.lineTo(L / 2 - 14 * size, -W * 0.5);
  ctx.stroke();
  ctx.fillStyle = '#2E2230';
  ctx.beginPath();
  ctx.arc(-L / 2 + 6 * size, -W * 0.5, 1.4 * size, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}

function drawStarfish(ctx: CanvasRenderingContext2D, size: number, tint: number) {
  const color = STARFISH[Math.floor(frac(tint * 8.7) * STARFISH.length)];
  const arms = STAR_ARMS[Math.floor(frac(tint * 31.3) * STAR_ARMS.length)];
  const inner = 0.3 + frac(tint * 57.1) * 0.25;
  const spin = frac(tint * 113.7) * Math.PI * 2;
  const R = 18 * size;
  ctx.save();
  ctx.translate(0, -3 * size);
  ctx.scale(1, 0.55);
  const star = () => {
    ctx.beginPath();
    for (let i = 0; i < arms * 2; i++) {
      const a = spin + (i * Math.PI) / arms;
      const r = i % 2 ? R * inner : R;
      ctx.lineTo(Math.cos(a) * r, Math.sin(a) * r);
    }
    ctx.closePath();
  };
  ctx.lineJoin = 'round';
  ctx.strokeStyle = mixColor(color, '#2A1A10', 0.45);
  ctx.lineWidth = R * 0.34;
  star();
  ctx.stroke();
  ctx.fillStyle = color;
  ctx.strokeStyle = color;
  ctx.lineWidth = R * 0.2;
  star();
  ctx.fill();
  ctx.stroke();
  ctx.fillStyle = mixColor(color, '#FFFFFF', 0.45);
  for (let i = 0; i < arms; i++) {
    const a = spin + (i * 2 * Math.PI) / arms;
    for (const f of [0.35, 0.6, 0.82]) {
      ctx.beginPath();
      ctx.arc(Math.cos(a) * R * f, Math.sin(a) * R * f, R * 0.05, 0, Math.PI * 2);
      ctx.fill();
    }
  }
  ctx.fillStyle = mixColor(color, '#2A1A10', 0.3);
  ctx.beginPath();
  ctx.arc(0, 0, R * 0.14, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}

export function drawDeco(ctx: CanvasRenderingContext2D, kind: DecoKind, size: number, tint: number, t: number, push = 0, pale = false) {
  ctx.lineJoin = 'round';
  ctx.lineCap = 'round';
  if (kind === 'lungsub') {
    lungSub(ctx, size);
    return;
  }
  if (kind === 'starfish') {
    drawStarfish(ctx, size, tint);
    return;
  }
  if (kind === 'plank') {
    drawPlank(ctx, size, tint, push);
    return;
  }
  if (kind === 'stone') kind = 'rock';
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
    const c = CORAL[Math.floor(tint * CORAL.length) % CORAL.length];
    const light = mixColor(c, '#FFFFFF', 0.4);
    const dark = mixColor(c, '#3A1030', 0.35);
    const type = frac(tint * 17.3);
    ctx.save();
    ctx.strokeStyle = c;
    ctx.fillStyle = c;
    if (type < 0.35) {
      const n = 4 + Math.floor(frac(tint * 5.1) * 4);
      ctx.lineWidth = 7 * size;
      for (let i = 0; i < n; i++) {
        const x = (i - (n - 1) / 2) * 11 * size;
        const y = -(24 + 22 * frac(tint * (i + 3) * 13.7)) * size;
        ctx.strokeStyle = c;
        ctx.beginPath();
        ctx.moveTo(0, 4);
        ctx.quadraticCurveTo(x * 0.3, y * 0.5, x, y);
        ctx.stroke();
        if (y < -36 * size) {
          ctx.lineWidth = 4.5 * size;
          ctx.beginPath();
          ctx.moveTo(x * 0.6, y * 0.55);
          ctx.lineTo(x + 9 * size * (i % 2 ? 1 : -1), y - 8 * size);
          ctx.stroke();
          ctx.lineWidth = 7 * size;
        }
        ctx.fillStyle = light;
        ctx.beginPath();
        ctx.arc(x, y, 5 * size, 0, Math.PI * 2);
        ctx.fill();
      }
    } else if (type < 0.6) {
      const R = 36 * size;
      const sway = Math.sin(t * 1.2 + tint * 9) * 0.05;
      ctx.lineWidth = 4 * size;
      ctx.beginPath();
      ctx.moveTo(0, 4);
      ctx.lineTo(0, -10 * size);
      ctx.stroke();
      ctx.translate(0, -10 * size);
      ctx.globalAlpha = 0.35;
      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.arc(0, 0, R, Math.PI * 1.15 + sway, Math.PI * 1.85 + sway);
      ctx.closePath();
      ctx.fill();
      ctx.globalAlpha = 1;
      ctx.lineWidth = 2.2 * size;
      for (let i = 0; i < 9; i++) {
        const a = Math.PI * (1.15 + (i / 8) * 0.7) + sway;
        ctx.beginPath();
        ctx.moveTo(0, 0);
        ctx.lineTo(Math.cos(a) * R, Math.sin(a) * R);
        ctx.stroke();
      }
      ctx.strokeStyle = light;
      ctx.lineWidth = 1.6 * size;
      for (const f of [0.5, 0.75, 1]) {
        ctx.beginPath();
        ctx.arc(0, 0, R * f, Math.PI * 1.15 + sway, Math.PI * 1.85 + sway);
        ctx.stroke();
      }
    } else if (type < 0.8) {
      const rx = 24 * size;
      const ry = 18 * size;
      ctx.beginPath();
      ctx.ellipse(0, 4, rx, ry, 0, Math.PI, 0);
      ctx.closePath();
      ctx.fill();
      ctx.strokeStyle = dark;
      ctx.lineWidth = 1.8 * size;
      for (let i = 0; i < 4; i++) {
        const y = 2 - i * 4.5 * size;
        const w = rx * (1 - i * 0.2) * 0.86;
        ctx.beginPath();
        ctx.moveTo(-w, y);
        for (let k = 1; k <= 6; k++) ctx.quadraticCurveTo(-w + ((k - 0.5) * 2 * w) / 6, y + (k % 2 ? -3 : 3) * size, -w + (k * 2 * w) / 6, y);
        ctx.stroke();
      }
      ctx.fillStyle = 'rgba(255,255,255,0.22)';
      ctx.beginPath();
      ctx.ellipse(-rx * 0.35, -ry * 0.55, rx * 0.3, ry * 0.18, -0.4, 0, Math.PI * 2);
      ctx.fill();
    } else {
      const n = 4 + Math.floor(frac(tint * 9.3) * 2);
      for (let i = 0; i < n; i++) {
        const x = (i - (n - 1) / 2) * 11 * size;
        const h = (22 + 20 * frac(tint * (i + 2) * 19.1)) * size;
        const w = 8 * size;
        const base = 4 + push * x + Math.abs(push) * w * 0.5 + 2;
        ctx.fillStyle = c;
        rrect(ctx, x - w / 2, base - h, w, h, [w / 2, w / 2, 0, 0]);
        ctx.fill();
        ctx.fillStyle = light;
        rrect(ctx, x - w / 2 + 1.5 * size, base - h + 3 * size, 2 * size, h - 6 * size, 1);
        ctx.fill();
        ctx.fillStyle = dark;
        ctx.beginPath();
        ctx.ellipse(x, base - h + 2.5 * size, w * 0.32, w * 0.22, 0, 0, Math.PI * 2);
        ctx.fill();
      }
    }
    ctx.restore();
  }
}
