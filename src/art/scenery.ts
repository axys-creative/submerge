import { mixColor, mulberry32, rrect } from '../util';
import { ISLAND_WIDTH } from '../config';
import { drawTankShape, drawShipPropeller, logo } from './sub';
import type { SkinId } from '../data/skins';
import { drawCoral } from './coral';
import { drawBones, type BoneKind } from './bones';
import { drawLostSub, LOST_WRECK_SCALE } from './lostSub';
import { CRANE_TIP, SHIP_LAMPS } from './shipMounts';
import { drawIronShip } from './ironShip';

export type DecoKind = 'kelp' | 'coral' | 'rock' | 'stone' | 'starfish' | 'plank' | 'lungsub' | 'gem' | 'vent' | BoneKind;

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

export { CRANE_TIP, SHIP_LAMPS };

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

export function drawShip(ctx: CanvasRenderingContext2D, t: number, facing: 1 | -1 = 1, night = 0, tier = 0, oxygen = 0, alert = 0, prop = 0, propLevel = 0, skin: SkinId = 'standard') {
  if (skin === 'sm13') return drawIronShip(ctx, t, facing, night, oxygen, alert, prop, propLevel);
  const c = SHIP_TIERS[tier];
  const gate = skin === 'oceangate';
  const cabin = gate ? { hull: '#E9EDF2', deck: '#D3DAE3' } : { hull: c.hull, deck: c.deck };
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
  fillRounded(ctx, cabin.hull);
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
  fillRounded(ctx, cabin.deck);
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
  for (const x of [-25, 1, 27]) {
    ctx.fillStyle = cabin.hull;
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
  ctx.lineTo(80, -56);
  ctx.lineTo(62, -56);
  ctx.closePath();
  fillRounded(ctx, glass, 3);
  ctx.strokeStyle = `rgba(255,255,255,${shine})`;
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(65, -59);
  ctx.quadraticCurveTo(65, -62.4, 68, -60.4);
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(70.5, -58.7);
  ctx.lineTo(72.5, -57.4);
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
  ctx.strokeStyle = gate ? '#B9C2CD' : c.deck;
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
  fillRounded(ctx, skin === 'oceangate' ? '#F1F4F8' : c.hull, 7);
  ctx.beginPath();
  ctx.moveTo(-135, 12);
  ctx.lineTo(125, 12);
  ctx.lineTo(110, 26);
  ctx.lineTo(-122, 26);
  ctx.closePath();
  fillRounded(ctx, skin === 'oceangate' ? '#F1F4F8' : c.shade, 7);

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

  drawShipPropeller(ctx, prop, propLevel, c.dark, c.accent);

  if (skin === 'oceangate' && logo.complete && logo.naturalWidth) {
    ctx.save();
    ctx.translate(56, 0);
    ctx.rotate(-0.06);
    ctx.scale(facing, 1);
    ctx.fillStyle = '#F1F4F8';
    rrect(ctx, -40.5, -15, 81, 30, 6);
    ctx.fill();
    ctx.drawImage(logo, -36, -12, 72, 24);
    ctx.restore();
    return;
  }
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

/** Where the dock's slanted poles meet the water, as offsets from the island center; they run on down into the underwater mountain. */
export const dockPoles = (w: number) => [0.5, 0.7, 0.9].map((f) => 250 * w - 100 + 250 * f + 5);

export function drawIsland(ctx: CanvasRenderingContext2D, t: number, name: string, night = 0, width = ISLAND_WIDTH) {
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
  ctx.scale(width, 1);
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

  const reach = 250 * width;
  const deckL = reach - 100;
  const deckR = reach + 150;
  const deckY = -9;
  ctx.fillStyle = d('#6B4A2B');
  ctx.strokeStyle = d('#6B4A2B');
  ctx.lineWidth = 9;
  for (const off of dockPoles(width)) {
    ctx.beginPath();
    ctx.moveTo(off, -4);
    ctx.lineTo(off - 8, 6);
    ctx.stroke();
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

  const spread = 170 * (width - 1);
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

const RIFT = (() => {
  const r = mulberry32(4242);
  const N = 14;
  const main: [number, number][] = Array.from({ length: N + 1 }, (_, i) => [Math.sin((i / N) * 5.1) * 14 + (r() - 0.5) * 16, -112 + (i / N) * 224]);
  const branches: [number, number][][] = [];
  for (let k = 0; k < 10; k++) {
    let [x, y] = main[1 + Math.floor(r() * (N - 1))];
    let ang = (r() < 0.5 ? 0 : Math.PI) + (r() - 0.5) * 1.6;
    const len = k < 3 ? 120 + r() * 40 : 30 + r() * 60;
    const pts: [number, number][] = [[x, y]];
    for (let i = 0; i < 5; i++) {
      ang += (r() - 0.5) * 0.7;
      x += (Math.cos(ang) * len) / 5 + (r() - 0.5) * 6;
      y += (Math.sin(ang) * len) / 5 + (r() - 0.5) * 6;
      pts.push([x, y]);
    }
    branches.push(pts);
  }
  const wisps = Array.from({ length: 30 }, () => ({ at: r() * N, side: r() < 0.5 ? -1 : 1, phase: r(), speed: 0.15 + r() * 0.25, size: 3 + r() * 7, sway: r() * 6 }));
  return { main, branches, wisps };
})();

/** A crack in reality standing over the water: long white-hot fissures in a red halo of pushed-out energy, with ghostly wisps drifting off them, and the destination's name above. */
export function drawPortal(ctx: CanvasRenderingContext2D, t: number, label: string) {
  const flicker = 0.88 + 0.12 * Math.sin(t * 7.3) * Math.sin(t * 2.9);
  ctx.save();
  ctx.translate(0, -78);
  ctx.globalCompositeOperation = 'lighter';
  const breathe = 0.85 + 0.15 * Math.sin(t * 1.6);
  const halo = ctx.createRadialGradient(0, 0, 6, 0, 0, 170);
  halo.addColorStop(0, `rgba(255,120,120,${0.5 * breathe})`);
  halo.addColorStop(0.45, `rgba(220,40,70,${0.22 * breathe})`);
  halo.addColorStop(1, 'rgba(120,0,30,0)');
  ctx.fillStyle = halo;
  ctx.beginPath();
  ctx.ellipse(0, 0, 130, 170, 0, 0, Math.PI * 2);
  ctx.fill();
  for (let i = 0; i < 3; i++) {
    const u = (t * 0.35 + i / 3) % 1;
    ctx.strokeStyle = `rgba(255,110,130,${0.28 * (1 - u)})`;
    ctx.lineWidth = 2 + 6 * (1 - u);
    ctx.beginPath();
    ctx.ellipse(0, 0, 30 + 110 * u, 55 + 130 * u, 0, 0, Math.PI * 2);
    ctx.stroke();
  }
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';
  const trace = (pts: [number, number][], scale: number) => {
    for (const [w, color] of [
      [14, `rgba(255,60,90,${0.16 * flicker})`],
      [7, `rgba(255,120,140,${0.4 * flicker})`],
      [2.6, `rgba(255,235,235,${0.95 * flicker})`],
    ] as const) {
      ctx.lineWidth = w * scale;
      ctx.strokeStyle = color;
      ctx.beginPath();
      pts.forEach(([x, y], i) => (i ? ctx.lineTo(x, y) : ctx.moveTo(x, y)));
      ctx.stroke();
    }
  };
  trace(RIFT.main, 1);
  for (const br of RIFT.branches) trace(br, 0.6);
  for (const w of RIFT.wisps) {
    const u = (t * w.speed + w.phase) % 1;
    const i = Math.min(RIFT.main.length - 2, Math.floor(w.at));
    const f = w.at - i;
    const bx = RIFT.main[i][0] + (RIFT.main[i + 1][0] - RIFT.main[i][0]) * f;
    const by = RIFT.main[i][1] + (RIFT.main[i + 1][1] - RIFT.main[i][1]) * f;
    const x = bx + w.side * (6 + u * 44) + Math.sin(t * 1.3 + w.phase * 9) * w.sway;
    const y = by - u * 34;
    const a = Math.sin(u * Math.PI) * 0.5;
    const g = ctx.createRadialGradient(x, y, 0, x, y, w.size * (1 + u));
    g.addColorStop(0, `rgba(255,225,225,${a})`);
    g.addColorStop(1, 'rgba(255,90,110,0)');
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.ellipse(x, y, w.size * (1 + u) * 0.7, w.size * (1 + u) * 1.5, w.side * 0.3, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.restore();
  ctx.font = '700 16px Fredoka, Nunito, sans-serif';
  ctx.textAlign = 'center';
  ctx.lineWidth = 5;
  ctx.strokeStyle = 'rgba(20,36,90,0.85)';
  ctx.strokeText(label, 0, -216);
  ctx.fillStyle = '#FFFFFF';
  ctx.fillText(label, 0, -216);
  ctx.textAlign = 'left';
}

/** The ruby that opens the portals: a regular pentagon cut in facets, lit from the upper left, that bobs and pulses. */
export function drawPortalStone(ctx: CanvasRenderingContext2D, t: number) {
  const pulse = 0.75 + 0.25 * Math.sin(t * 2.2);
  const R = 22;
  const ring = (r: number) => Array.from({ length: 5 }, (_, k) => [Math.cos(-Math.PI / 2 + (k * 2 * Math.PI) / 5) * r, Math.sin(-Math.PI / 2 + (k * 2 * Math.PI) / 5) * r] as const);
  const outer = ring(R);
  const inner = ring(R * 0.48);
  ctx.save();
  ctx.translate(0, Math.sin(t * 1.4) * 2);
  ctx.scale(0.5, 0.5);
  ctx.globalCompositeOperation = 'lighter';
  const glow = ctx.createRadialGradient(0, 0, 2, 0, 0, 100);
  glow.addColorStop(0, `rgba(255,70,90,${0.6 * pulse})`);
  glow.addColorStop(1, 'rgba(200,20,40,0)');
  ctx.fillStyle = glow;
  ctx.beginPath();
  ctx.arc(0, 0, 100, 0, Math.PI * 2);
  ctx.fill();
  ctx.globalCompositeOperation = 'source-over';
  ctx.lineJoin = 'round';
  const FACETS = ['#FF8A8F', '#E8333F', '#A81428', '#7A0C1E', '#C41E34'];
  for (let k = 0; k < 5; k++) {
    const n = (k + 1) % 5;
    ctx.fillStyle = FACETS[k];
    ctx.beginPath();
    ctx.moveTo(outer[k][0], outer[k][1]);
    ctx.lineTo(outer[n][0], outer[n][1]);
    ctx.lineTo(inner[n][0], inner[n][1]);
    ctx.lineTo(inner[k][0], inner[k][1]);
    ctx.closePath();
    ctx.fill();
  }
  ctx.fillStyle = '#FF4F5E';
  ctx.beginPath();
  inner.forEach(([x, y], k) => (k ? ctx.lineTo(x, y) : ctx.moveTo(x, y)));
  ctx.closePath();
  ctx.fill();
  ctx.strokeStyle = 'rgba(70,0,12,0.7)';
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  outer.forEach(([x, y], k) => (k ? ctx.lineTo(x, y) : ctx.moveTo(x, y)));
  ctx.closePath();
  ctx.stroke();
  ctx.beginPath();
  outer.forEach(([x, y], k) => {
    ctx.moveTo(x, y);
    ctx.lineTo(inner[k][0], inner[k][1]);
  });
  ctx.stroke();
  ctx.fillStyle = `rgba(255,255,255,${0.55 + 0.3 * Math.sin(t * 3)})`;
  ctx.beginPath();
  ctx.arc(inner[0][0] - 4, inner[0][1] + 3, 2.6, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}

export function drawWreck(ctx: CanvasRenderingContext2D, kind: 'sloop' | 'galleon' | 'freighter' | 'containers', fx?: WreckFx) {
  if (kind === 'freighter') return drawFreighter(ctx, fx);
  if (kind === 'containers') return drawContainers(ctx);
  ctx.save();
  ctx.lineJoin = 'round';
  ctx.lineCap = 'round';
  ctx.rotate(-0.12);
  ctx.scale(kind === 'galleon' ? 3 : 1.25, kind === 'galleon' ? 3 : 1.25);
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
    const swing = fx?.sail?.push ?? 0;
    const at = (x: number, y: number): [number, number] => {
      const k = Math.pow(Math.max(0, (y + 88) / 50), 1.3);
      return [x + swing * k, y - Math.abs(swing) * 0.12 * k];
    };
    const path: [string, ...[number, number][]][] = [
      ['m', at(-20, -82)],
      ['l', at(20, -88)],
      ['q', at(26, -60), at(14, -40)],
      ['l', at(4, -50)],
      ['l', at(-6, -38)],
      ['q', at(-24, -60), at(-20, -82)],
    ];
    ctx.beginPath();
    for (const [op, a, b] of path) {
      if (op === 'm') ctx.moveTo(a[0], a[1]);
      else if (op === 'l') ctx.lineTo(a[0], a[1]);
      else ctx.quadraticCurveTo(a[0], a[1], b![0], b![1]);
    }
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

const GLASS_SALT = Math.floor(Math.random() * 2 ** 31);

export const FREIGHTER_CRANES = [
  { x: 110, y: -62, lean: 0.04, drop: 22 },
  { x: 340, y: -66, lean: -0.03, drop: 28 },
];
export const CRANE_TIP_X = 84;
export const CRANE_HOOK_DROP = 110;

export interface GlassShard {
  win: number;
  /** Where the shard hangs, in the freighter's own space. */
  x: number;
  y: number;
  /** Triangle corners relative to x, y. */
  pts: [number, number][];
}

let glassPlanCache: { windows: [number, number, number, number][]; damage: number[]; shards: GlassShard[] } | null = null;

/** The tower's windows, how broken each is (0 intact, 1 cracked, 2 shattered, 3 knocked out) and the glass still hanging in the knocked-out ones. */
export function glassPlan() {
  if (glassPlanCache) return glassPlanCache;
  const windows: [number, number, number, number][] = [];
  for (let row = 0; row < 3; row++) for (let i = 0; i < 7; i++) windows.push([-593 + i * 26, -190 + row * 34, 20, 18]);
  for (let i = 0; i < 6; i++) windows.push([-578 + i * 24, -240, 19, 26]);
  const pick = mulberry32(GLASS_SALT);
  const order = windows.map((_, i) => i);
  for (let i = order.length - 1; i > 0; i--) {
    const j = Math.floor(pick() * (i + 1));
    [order[i], order[j]] = [order[j], order[i]];
  }
  const damage = windows.map(() => 0);
  order.forEach((w, k) => (damage[w] = k < 3 ? 3 : k < 7 ? 2 : k < 14 ? 1 : 0));
  const shards: GlassShard[] = [];
  windows.forEach(([x, y, w, h], i) => {
    if (damage[i] !== 3) return;
    const edges = [[x, y, 1, 0, w, 0, 1], [x, y + h, 1, 0, w, 0, -1], [x, y, 0, 1, h, 1, 0], [x + w, y, 0, 1, h, -1, 0]] as const;
    edges.forEach(([sx, sy, ux, uy, len, nx, ny], e) => {
      const g = mulberry32(GLASS_SALT + i * 977 + e * 131 + 7);
      const between = (lo: number, hi: number) => lo + (hi - lo) * g();
      if (g() < 0.35) return;
      const base = between(3, 5.5);
      const t = between(2, Math.max(2.5, len - base - 2));
      const lean = between(0.15, 0.85);
      const tall = between(2, 5);
      const pts: [number, number][] = [
        [sx + ux * t, sy + uy * t],
        [sx + ux * (t + base), sy + uy * (t + base)],
        [sx + ux * (t + base * lean) + nx * tall, sy + uy * (t + base * lean) + ny * tall],
      ];
      const cx = (pts[0][0] + pts[1][0] + pts[2][0]) / 3;
      const cy = (pts[0][1] + pts[1][1] + pts[2][1]) / 3;
      shards.push({ win: i, x: cx, y: cy, pts: pts.map(([px, py]) => [px - cx, py - cy] as [number, number]) });
    });
  });
  return (glassPlanCache = { windows, damage, shards });
}

/** One shard of window glass, either still in its frame (`state` 0), drifting down (1), or lying on the sea floor (2). */
export interface FallenGlass {
  state: 0 | 1 | 2;
  x: number;
  y: number;
  vx: number;
  vy: number;
  rot: number;
  rotV: number;
  /** Seconds left before a shard the sub has brushed lets go, or -1 while it is untouched. */
  wait: number;
}

/** Movable parts of a wreck, in the wreck's own space. */
export interface WreckFx {
  glass: FallenGlass[];
  /** Sideways swing of each deck crane's hook cable. */
  cranes: { push: number; pushV: number; drive: number; held: boolean }[];
  /** How the wreck is drawn: its tilt and scale, so the sub's position can be mapped into its space. */
  tilt: number;
  scale: number;
  /** Sideways swing of the galleon's torn sail. */
  sail?: { push: number; pushV: number; drive: number; held: boolean };
}

function drawShard(ctx: CanvasRenderingContext2D, sh: GlassShard) {
  ctx.beginPath();
  sh.pts.forEach(([x, y], i) => (i ? ctx.lineTo(x, y) : ctx.moveTo(x, y)));
  ctx.closePath();
  ctx.fillStyle = '#2C4A6B';
  ctx.fill();
  ctx.strokeStyle = 'rgba(232,242,252,0.8)';
  ctx.lineWidth = 0.7;
  ctx.stroke();
}

/** A modern container ship broken on the sea floor, about 2,600 px long: stern bridge and funnel on the left, bow on the right. */
function drawFreighter(ctx: CanvasRenderingContext2D, fx?: WreckFx) {
  const rnd = mulberry32(2718);
  ctx.save();
  ctx.lineJoin = 'round';
  ctx.lineCap = 'round';
  ctx.scale(2, 2);
  ctx.rotate(-0.04);

  const TORN: [number, number][] = [[6, 12], [-6, 2], [-16, 22], [-30, 4], [-40, 9], [-48, 1], [-58, 16], [-68, 3]];
  const hull = (x0: number, x1: number, bowRake: number, lean = 14, torn = false, squareTop = false) => {
    const pts: [number, number, number][] = [[x0, -78, 4], [x1 + bowRake, -88, squareTop ? 0 : 4], [x1, 12, 4], [x0 + lean, 14, 4]];
    if (torn) for (const [y, d] of TORN) pts.push([x0 + d, y, 0]);
    const n = pts.length;
    ctx.beginPath();
    ctx.moveTo((pts[n - 1][0] + pts[0][0]) / 2, (pts[n - 1][1] + pts[0][1]) / 2);
    pts.forEach(([x, y, r], i) => {
      const q = pts[(i + 1) % n];
      ctx.arcTo(x, y, (x + q[0]) / 2, (y + q[1]) / 2, r);
    });
    ctx.closePath();
  };
  const section = (x0: number, x1: number, bowRake: number, drop: number, lean = 14, torn = false, squareTop = false) => {
    ctx.save();
    ctx.translate(0, drop);
    hull(x0, x1, bowRake, lean, torn, squareTop);
    ctx.fillStyle = '#7C2F2B';
    ctx.fill();
    ctx.save();
    hull(x0, x1, bowRake, lean, torn, squareTop);
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
  const tones = ['#D9503F', '#E6A23C', '#3E7FC4', '#4FA67A', '#C9CED6', '#8A5FB5', '#D96B2B'];
  const stacks = (x0: number, x1: number, hx0: number, hy0: number, hx1: number, hy1: number) => {
    const slope = (hy1 - hy0) / (hx1 - hx0);
    for (let x = x0; x < x1; x += 84) {
      const bx = x + (rnd() - 0.5) * 8;
      const by = hy0 + (bx - hx0) * slope + 12 + rnd() * 8;
      const rows = 1 + Math.floor(rnd() * 3);
      ctx.save();
      ctx.translate(bx, by);
      ctx.rotate(Math.atan(slope) + (rnd() - 0.5) * 0.1);
      for (let r = 0; r < rows; r++) {
        if (r && rnd() < 0.08) break;
        const dx = r ? (rnd() - 0.5) * 8 : 0;
        ctx.fillStyle = tones[Math.floor(rnd() * tones.length)];
        ctx.beginPath();
        ctx.roundRect(dx, -(r + 1) * 52, 80, 51, 2);
        ctx.fill();
        ctx.fillStyle = 'rgba(0,0,0,0.18)';
        for (let k = 1; k < 7; k++) ctx.fillRect(dx + k * 10, -(r + 1) * 52, 2, 51);
      }
      ctx.restore();
    }
  };
  stacks(-330, -120, -650, -78, -90, -88);
  stacks(-60, 560, -70, -62, 710, -72);

  ctx.fillStyle = '#E9ECF1';
  const panel = (x: number, y: number, w: number, h: number, r: number, flat = false) => {
    ctx.beginPath();
    ctx.roundRect(x, y, w, h, flat ? [r, r, 0, 0] : r);
    ctx.fill();
  };
  panel(-600, -200, 190, 122, 2, true);
  panel(-584, -246, 150, 46, 2, true);
  panel(-596, -226, 174, 12, 2, true);
  ctx.fillStyle = '#2C4A6B';
  ctx.strokeStyle = '#5B6472';
  ctx.lineWidth = 1.5;
  const plan = glassPlan();
  const win = (x: number, y: number, w: number, h: number, damage: number, idx: number) => {
    const crk = mulberry32(GLASS_SALT + idx * 7919 + 5);
    const between = (lo: number, hi: number) => lo + (hi - lo) * crk();
    panel(x, y, w, h, 2);
    ctx.stroke();
    if (!damage) return;
    ctx.save();
    ctx.beginPath();
    ctx.roundRect(x, y, w, h, 2);
    ctx.clip();
    if (damage === 3) {
      ctx.fillStyle = '#070D14';
      ctx.fillRect(x, y, w, h);
      plan.shards.forEach((sh, k) => {
        if (sh.win !== idx || (fx && fx.glass[k].state)) return;
        ctx.save();
        ctx.translate(sh.x, sh.y);
        drawShard(ctx, sh);
        ctx.restore();
      });
      ctx.restore();
      ctx.lineWidth = 1.5;
      ctx.strokeStyle = '#5B6472';
      return;
    }
    const cx = x + w * between(0.2, 0.8);
    const cy = y + h * between(0.2, 0.8);
    if (damage === 2) {
      ctx.fillStyle = '#0B1520';
      ctx.beginPath();
      const n = 3 + Math.floor(crk() * 3);
      const spin = crk() * Math.PI * 2;
      for (let k = 0; k < n; k++) {
        const a = spin + (k / n) * Math.PI * 2 + between(-0.3, 0.3);
        const r = between(0.15, 0.45) * Math.max(w, h);
        ctx.lineTo(cx + Math.cos(a) * r, cy + Math.sin(a) * r);
      }
      ctx.closePath();
      ctx.fill();
    }
    ctx.strokeStyle = 'rgba(232,242,252,0.9)';
    ctx.lineWidth = between(0.7, 1.1);
    ctx.beginPath();
    const rays = damage === 2 ? 5 + Math.floor(crk() * 4) : 2 + Math.floor(crk() * 4);
    const spin = crk() * Math.PI * 2;
    for (let k = 0; k < rays; k++) {
      const a = spin + (k / rays) * Math.PI * 2 + between(-0.35, 0.35);
      const len = Math.max(w, h) * between(0.35, 1.1);
      const bend = between(-0.35, 0.35);
      const mid = len * between(0.3, 0.6);
      const mx = cx + Math.cos(a) * mid;
      const my = cy + Math.sin(a) * mid;
      ctx.moveTo(cx, cy);
      ctx.lineTo(mx, my);
      ctx.lineTo(cx + Math.cos(a + bend) * len, cy + Math.sin(a + bend) * len);
      if (crk() < 0.4) {
        const f = a + (crk() < 0.5 ? -1 : 1) * between(0.5, 1);
        ctx.moveTo(mx, my);
        ctx.lineTo(mx + Math.cos(f) * len * 0.35, my + Math.sin(f) * len * 0.35);
      }
    }
    ctx.stroke();
    if (crk() < 0.55) {
      const n = 5 + Math.floor(crk() * 3);
      const r0 = between(2.5, 5);
      const spin2 = crk() * Math.PI * 2;
      ctx.beginPath();
      for (let k = 0; k <= n; k++) {
        const a = spin2 + (k / n) * Math.PI * 2;
        const r = r0 * between(0.7, 1.2);
        k % n === 0 && k ? ctx.closePath() : ctx.lineTo(cx + Math.cos(a) * r, cy + Math.sin(a) * r);
      }
      ctx.stroke();
    }
    ctx.restore();
    ctx.lineWidth = 1.5;
    ctx.strokeStyle = '#5B6472';
  };
  plan.windows.forEach(([x, y, w, h], i) => win(x, y, w, h, plan.damage[i], i));
  ctx.fillStyle = '#C9341F';
  panel(-520, -300, 54, 56, 2, true);
  ctx.fillStyle = '#16181E';
  panel(-520, -308, 54, 12, 2, true);
  ctx.strokeStyle = '#2B2326';
  ctx.lineWidth = 4;
  ctx.beginPath();
  ctx.moveTo(-500, -246);
  ctx.lineTo(-500, -330);
  ctx.moveTo(-514, -330);
  ctx.lineTo(-486, -330);
  ctx.stroke();

  const line = (x0: number, y0: number, x1: number, y1: number) => {
    ctx.beginPath();
    ctx.moveTo(x0, y0);
    ctx.lineTo(x1, y1);
    ctx.stroke();
  };
  const bolt = (x: number, y: number, r: number) => {
    ctx.fillStyle = '#1D1B20';
    ctx.beginPath();
    ctx.arc(x, y, r, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = 'rgba(255,255,255,0.35)';
    ctx.lineWidth = 1;
    ctx.stroke();
  };
  const crane = (x: number, y: number, lean: number, boomDrop: number, sway: number) => {
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(lean);
    const steel = ctx.createLinearGradient(-9, 0, 9, 0);
    steel.addColorStop(0, '#F0C25A');
    steel.addColorStop(0.45, '#C98F2C');
    steel.addColorStop(1, '#7A5415');
    const H = 108;
    const swing = sway / 98;
    const guy = Math.max(-40, Math.min(40, sway));
    const cableAt = (dist: number, frac: number, off: number): [number, number] => [tipX + off * Math.cos(swing) + dist * Math.sin(swing * frac), tipY + dist * Math.cos(swing * frac)];
    const tipX = 84;
    const tipY = -H + boomDrop;

    ctx.fillStyle = '#4A4C55';
    ctx.beginPath();
    ctx.moveTo(-22, 4);
    ctx.lineTo(-14, -14);
    ctx.lineTo(14, -14);
    ctx.lineTo(22, 4);
    ctx.closePath();
    ctx.fill();
    ctx.strokeStyle = '#4A4C55';
    ctx.lineWidth = 3;
    ctx.stroke();
    for (const bx of [-16, -6, 6, 16]) bolt(bx, -4, 2);

    ctx.strokeStyle = steel;
    ctx.lineWidth = 5;
    line(-8, -12, -6, -H);
    line(8, -12, 6, -H);
    ctx.lineWidth = 2;
    ctx.strokeStyle = '#8F6419';
    for (let yy = -12, flip = 1; yy > -H + 12; yy -= 16, flip = -flip) {
      line(-8 * flip, yy, 8 * flip, yy - 16);
      line(-8, yy, 8, yy);
    }
    ctx.fillStyle = '#1D1B20';
    for (let yy = -26; yy > -H + 14; yy -= 32) {
      ctx.beginPath();
      ctx.arc(0, yy, 2.2, 0, Math.PI * 2);
      ctx.fill();
    }

    ctx.fillStyle = steel;
    ctx.beginPath();
    ctx.roundRect(-26, -H - 6, 40, 30, 4);
    ctx.fill();
    ctx.strokeStyle = '#5E4210';
    ctx.lineWidth = 1.5;
    ctx.stroke();
    ctx.fillStyle = '#2C4A6B';
    ctx.beginPath();
    ctx.roundRect(-5, -H - 1, 14, 10, 2);
    ctx.fill();
    ctx.fillStyle = 'rgba(255,255,255,0.35)';
    ctx.beginPath();
    ctx.roundRect(-5, -H - 1, 14, 3, 1.5);
    ctx.fill();
    for (const px of [-20, -14]) {
      ctx.fillStyle = '#1D1B20';
      ctx.beginPath();
      ctx.arc(px, -H + 9, 3, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = '#E8D9A8';
      ctx.lineWidth = 1.2;
      ctx.stroke();
    }

    ctx.fillStyle = '#5A5D68';
    ctx.beginPath();
    ctx.roundRect(-40, -H - 2, 16, 20, 3);
    ctx.fill();
    ctx.fillStyle = 'rgba(255,255,255,0.18)';
    ctx.beginPath();
    ctx.roundRect(-40, -H - 2, 16, 4, 2);
    ctx.fill();
    bolt(-32, -H + 8, 2.5);

    ctx.strokeStyle = steel;
    ctx.lineWidth = 4;
    line(8, -H, tipX, tipY - 6);
    line(8, -H + 14, tipX, tipY + 6);
    line(tipX, tipY - 6, tipX, tipY + 6);
    ctx.lineWidth = 1.8;
    ctx.strokeStyle = '#8F6419';
    for (let i = 0; i < 5; i++) {
      const t0 = 0.08 + i * 0.18;
      const t1 = t0 + 0.18;
      const at = (t: number, off: number) => [8 + (tipX - 8) * t, -H + (tipY + H) * t + off] as const;
      const [ax, ay] = at(t0, i % 2 ? 14 : -6);
      const [bx, by] = at(t1, i % 2 ? -6 : 14);
      line(ax, ay, bx, by);
    }
    ctx.fillStyle = '#4A4C55';
    ctx.beginPath();
    ctx.arc(tipX, tipY, 8, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#1D1B20';
    ctx.beginPath();
    ctx.arc(tipX, tipY, 3.5, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = 'rgba(255,255,255,0.4)';
    ctx.lineWidth = 1.2;
    ctx.beginPath();
    ctx.arc(tipX, tipY, 8, 0, Math.PI * 2);
    ctx.stroke();

    ctx.lineCap = 'butt';
    ctx.strokeStyle = '#2B2326';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(-36, -H - 2);
    ctx.lineTo(tipX, tipY - 6);
    ctx.stroke();

    ctx.strokeStyle = '#34363D';
    ctx.lineWidth = 2.2;
    ctx.beginPath();
    ctx.moveTo(tipX, tipY + 8);
    ctx.bezierCurveTo(...cableAt(40, 0.3, 12), ...cableAt(70, 0.7, -14), ...cableAt(98, 1, 6));
    ctx.stroke();
    ctx.lineWidth = 3.5;
    ctx.beginPath();
    ctx.arc(...cableAt(108, 1, 12), 9, Math.PI * 1.1, Math.PI * 2.4);
    ctx.stroke();

    ctx.lineWidth = 1.6;
    ctx.strokeStyle = '#3A3C44';
    ctx.beginPath();
    ctx.moveTo(-6, -H + 4);
    ctx.quadraticCurveTo(-60 + guy * 0.3, -40, -70, 6);
    ctx.moveTo(tipX - 20, tipY + 2);
    ctx.quadraticCurveTo(tipX + 20 + guy * 0.4, -30, tipX + 30, 8);
    ctx.stroke();
    ctx.lineCap = 'round';
    ctx.restore();
  };
  FREIGHTER_CRANES.forEach((c, i) => crane(c.x, c.y, c.lean, c.drop, fx?.cranes[i].push ?? 0));

  section(-650, -90, 0, 0, 14, false, true);

  ctx.fillStyle = '#16181E';
  ctx.fillRect(-90, -88, 20, 118);
  ctx.fillRect(-70, -62, 24, 92);

  section(-70, 640, 70, 16, 0, true);



  ctx.fillStyle = 'rgba(255,230,160,0.65)';
  ctx.strokeStyle = '#6B5A3A';
  ctx.lineWidth = 1.5;
  for (let x = -380; x < 600; x += 56) {
    ctx.beginPath();
    ctx.arc(x, -50 + (x > -80 ? 16 : 0), 4.5, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
  }
  if (fx) {
    const shards = glassPlan().shards;
    fx.glass.forEach((g, k) => {
      if (!g.state) return;
      ctx.save();
      ctx.translate(g.x, g.y);
      ctx.rotate(g.rot);
      drawShard(ctx, shards[k]);
      ctx.restore();
    });
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

function drawVent(ctx: CanvasRenderingContext2D, size: number, tint: number, t: number) {
  const chimneys = tint > 0.5 ? [[0, 1], [26, 0.6]] : [[0, 1]];
  const lit = 0.8 + 0.2 * Math.sin(t * 3 + tint * 9);
  for (const [dx, k] of chimneys) {
    const w = 26 * size * k;
    const h = 46 * size * k;
    ctx.save();
    ctx.translate(dx * size, 4);
    ctx.fillStyle = '#2B2F3F';
    ctx.beginPath();
    ctx.moveTo(-w * 1.5, 0);
    ctx.quadraticCurveTo(-w * 0.9, -h * 0.3, -w * 0.45, -h);
    ctx.lineTo(w * 0.45, -h);
    ctx.quadraticCurveTo(w * 0.9, -h * 0.3, w * 1.5, 0);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = 'rgba(190,120,60,0.28)';
    ctx.beginPath();
    ctx.moveTo(-w * 0.45, -h);
    ctx.quadraticCurveTo(-w * 0.9, -h * 0.3, -w * 1.1, -h * 0.12);
    ctx.lineTo(-w * 0.5, -h * 0.5);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = '#12141C';
    ctx.beginPath();
    ctx.ellipse(0, -h, w * 0.45, w * 0.16, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.globalCompositeOperation = 'lighter';
    const glow = ctx.createRadialGradient(0, -h, 1, 0, -h, 46 * size * k);
    glow.addColorStop(0, `rgba(255,150,60,${0.5 * lit})`);
    glow.addColorStop(1, 'rgba(255,90,20,0)');
    ctx.fillStyle = glow;
    ctx.beginPath();
    ctx.arc(0, -h, 46 * size * k, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = `rgba(255,170,80,${0.7 * lit})`;
    ctx.beginPath();
    ctx.ellipse(0, -h, w * 0.3, w * 0.09, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.globalCompositeOperation = 'source-over';
    const rise = 190 * size * k;
    for (let i = 0; i < 12; i++) {
      const u = frac(t * 0.45 + i / 12 + tint * 3 + dx * 0.01);
      const wob = Math.sin(u * 9 + i * 2.1) * (3 + 10 * u) * size;
      ctx.fillStyle = `rgba(215,235,255,${0.55 * (1 - u)})`;
      ctx.beginPath();
      ctx.arc(wob, -h - u * rise, (1.5 + 2.6 * frac(i * 0.37 + 0.2)) * size * (0.7 + 0.5 * u), 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.restore();
  }
}

export function drawDeco(ctx: CanvasRenderingContext2D, kind: DecoKind, size: number, tint: number, t: number, push = 0, pale = false) {
  ctx.lineJoin = 'round';
  ctx.lineCap = 'round';
  if (kind === 'lungsub') {
    drawLostSub(ctx, size * LOST_WRECK_SCALE, false);
    return;
  }
  if (kind === 'gem') {
    ctx.translate(0, -15);
    drawPortalStone(ctx, t);
    return;
  }
  if (kind === 'vent') {
    drawVent(ctx, size, tint, t);
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
  if (kind === 'coral') {
    drawCoral(ctx, size, tint, t, push);
    return;
  }
  if (kind === 'stone') kind = 'rock';
  if (kind !== 'kelp' && kind !== 'rock') {
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
  }
}
