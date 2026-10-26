import type { Loadout } from '../data/upgrades';
import { rrect } from '../util';

interface Plating {
  body: string;
  cabin: string;
  band: string;
  tower: string;
  shade: string;
}

const PLATING: Plating[] = [
  { body: '#C9D1DA', cabin: '#8F9AA8', band: '#2AA6C9', tower: '#DDE3EA', shade: '#AEB8C4' },
  { body: '#7C8594', cabin: '#4F5764', band: '#2AA6C9', tower: '#98A1AF', shade: '#656D7B' },
  { body: '#F39A3D', cabin: '#C96A1B', band: '#7A4A1E', tower: '#F7B568', shade: '#DC7F25' },
  { body: '#2A2D35', cabin: '#14161B', band: '#F28C28', tower: '#3E434F', shade: '#1D2026' },
];

const GLASS = '#A8E1F2';

/** Lamp position in the sub's local space, used to aim the spotlight. */
export const LAMP = { x: 17, y: 31 };
export const REAR_LAMP = { x: -50, y: 26 };
/** Center of the nose glass, where the cockpit's own faint glow comes from. */
export const COCKPIT = { x: 42, y: 0 };
/** Where the sonar sits on the tower. */
const SONAR_MOUNT = { x: 17, y: -29 };
/** The antenna's light. */
export const ANTENNA = { x: 3, y: -49 };
/** Where the crane cable attaches: on the antenna's horizontal arm, just behind the light. */
export const ANCHOR = { x: -4, y: -51 };

/** Draws the sub facing right, centered on the origin, about 140 px long. */
/** Where the two dive weights hang, as x offsets in the sub's local space. */
export const WEIGHT_MOUNTS = [-1, 30];
/** How far below the sub's center the weights hang. */
export const WEIGHT_Y = 32;

/** One lead weight: a rounded block with a lifting handle, centered on the origin. */
export function drawWeight(ctx: CanvasRenderingContext2D) {
  ctx.strokeStyle = '#2D2F36';
  ctx.lineWidth = 2.5;
  ctx.beginPath();
  ctx.arc(0, -7, 4, Math.PI, 0);
  ctx.stroke();
  ctx.fillStyle = '#5C6578';
  rrect(ctx, -8, -7, 16, 14, 3);
  ctx.fill();
  ctx.fillStyle = '#9AA3B8';
  rrect(ctx, -6, -5, 12, 3, 1.5);
  ctx.fill();
  ctx.fillStyle = '#2D2F36';
  ctx.fillRect(-8, 3, 16, 4);
}

/** Where each separable part of the sub sits, when it starts to crumple (0..1 of the collapse), and how it tumbles. */
const PIECES: Record<string, { x: number; y: number; delay: number; spin: number; squash: number }> = {
  weightL: { x: WEIGHT_MOUNTS[0], y: WEIGHT_Y, delay: 0, spin: -1.6, squash: 0 },
  weightR: { x: WEIGHT_MOUNTS[1], y: WEIGHT_Y, delay: 0.05, spin: 1.4, squash: 0 },
  prop: { x: -70, y: 0, delay: 0.1, spin: 2.2, squash: 0.3 },
  battery: { x: -28, y: 24, delay: 0.15, spin: -1.3, squash: 0.2 },
  tower: { x: 0, y: -34, delay: 0, spin: -0.9, squash: 0.4 },
  tank: { x: -35, y: -26, delay: 0.05, spin: 1.5, squash: 0.2 },
  hull: { x: 0, y: 0, delay: 0.3, spin: 0.15, squash: 0.45 },
  cabin: { x: 0, y: 0, delay: 0.25, spin: -0.4, squash: 0.35 },
  glass: { x: 20, y: 0, delay: 0.2, spin: 0.7, squash: 0.3 },
  bumpers: { x: 0, y: 0, delay: 0.2, spin: -0.2, squash: 0.3 },
  lamp: { x: 17, y: 26, delay: 0.1, spin: 2.6, squash: 0 },
  rearLamp: { x: -50, y: 22, delay: 0.1, spin: -2.4, squash: 0 },
  sonar: { x: 17, y: -34, delay: 0, spin: 3, squash: 0 },
  scrubber: { x: -40, y: -1, delay: 0.1, spin: 1.8, squash: 0.2 },
  electro: { x: 28, y: -26, delay: 0.05, spin: -2, squash: 0.2 },
  candles: { x: 5, y: -19, delay: 0.1, spin: 2.4, squash: 0.2 },
};

export type PieceId = keyof typeof PIECES;

/** How much of its original size a piece still has, 1 (whole) to 0.12 (crushed). */
export function pieceScale(id: PieceId, crush: number) {
  const P = PIECES[id];
  const u = Math.min(1, Math.max(0, (crush - P.delay) / (1 - P.delay)));
  return 1 - 0.88 * u * u * (3 - 2 * u);
}

/** Moves, spins, squashes and shrinks one part of the sub toward its center as `crush` goes 0..1. */
export function crumplePiece(ctx: CanvasRenderingContext2D, id: PieceId, crush: number) {
  if (crush <= 0) return;
  const P = PIECES[id];
  const u = Math.min(1, Math.max(0, (crush - P.delay) / (1 - P.delay)));
  const f = pieceScale(id, crush);
  ctx.translate(P.x * f, P.y * f);
  ctx.rotate(P.spin * u * u * (3 - 2 * u));
  ctx.scale(f, f * (1 - P.squash * Math.sin(Math.PI * u)));
  ctx.translate(-P.x, -P.y);
}

/** Colors of the sub's parts, for the chunks that fly off when it implodes. */
export function debrisColors(plating: number) {
  const p = PLATING[plating];
  return [p.body, p.cabin, p.band, p.tower, p.shade, GLASS];
}

export interface AirGear {
  candles: number;
  scrubbers: boolean;
  electrolysis: boolean;
}

/** The CO2 scrubber: a small labeled box on the hull behind the cabin. */
function drawScrubber(ctx: CanvasRenderingContext2D, facing: number) {
  ctx.fillStyle = '#2D3A4D';
  rrect(ctx, -48, -8, 16, 14, 2.5);
  ctx.fill();
  ctx.fillStyle = '#E8EEF5';
  rrect(ctx, -46.5, -6.5, 13, 11, 1.5);
  ctx.fill();
  ctx.fillStyle = '#2D3A4D';
  ctx.font = '700 6px Fredoka, Nunito, sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.save();
  ctx.translate(-40, -0.5);
  ctx.scale(facing, 1);
  ctx.fillText('CO₂', 0, 0);
  ctx.restore();
  ctx.textAlign = 'left';
  ctx.textBaseline = 'alphabetic';
}

/** The electrolysis unit: a small box on the hull top with a green O2 light. */
function drawElectrolysis(ctx: CanvasRenderingContext2D, t: number, facing: number) {
  ctx.fillStyle = '#2D3A4D';
  rrect(ctx, 22, -31, 13, 10, 2.5);
  ctx.fill();
  ctx.fillStyle = '#6BE38A';
  ctx.globalAlpha = 0.65 + 0.35 * Math.sin(t * 3);
  ctx.beginPath();
  ctx.arc(25.5, -26, 1.6, 0, Math.PI * 2);
  ctx.fill();
  ctx.globalAlpha = 1;
  ctx.fillStyle = '#E8EEF5';
  ctx.font = '700 5px Fredoka, Nunito, sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.save();
  ctx.translate(30, -25.5);
  ctx.scale(facing, 1);
  ctx.fillText('O₂', 0, 0);
  ctx.restore();
  ctx.textAlign = 'left';
  ctx.textBaseline = 'alphabetic';
}

/** Up to three oxygen candles racked on the cabin, above the porthole. */
function drawCandles(ctx: CanvasRenderingContext2D, count: number) {
  ctx.fillStyle = '#2D3A4D';
  rrect(ctx, -2, -23, 14, 8, 2);
  ctx.fill();
  for (let i = 0; i < count; i++) {
    const x = -0.5 + i * 4;
    ctx.fillStyle = '#F1E4C8';
    rrect(ctx, x, -22, 3, 6, 1);
    ctx.fill();
    ctx.fillStyle = '#E5484D';
    ctx.fillRect(x, -22, 3, 1.8);
  }
}

export function drawSub(ctx: CanvasRenderingContext2D, up: Loadout, t: number, prop: number, alarm = false, weights = false, crush = 0, gear?: AirGear, facing = 1) {
  const p = PLATING[up.plating];
  ctx.save();
  ctx.lineJoin = 'round';
  ctx.lineCap = 'round';
  const part = (id: PieceId, draw: () => void) => {
    ctx.save();
    crumplePiece(ctx, id, crush);
    draw();
    ctx.restore();
  };

  if (weights) {
    WEIGHT_MOUNTS.forEach((x, i) =>
      part(i ? 'weightR' : 'weightL', () => {
        ctx.translate(x, WEIGHT_Y);
        drawWeight(ctx);
      }),
    );
  }
  part('prop', () => drawPropeller(ctx, p, prop, up.propeller));
  part('battery', () => drawBattery(ctx, up.battery, t, p));
  part('tower', () => drawTower(ctx, p));
  part('tank', () => drawTank(ctx, up.oxygen, p));

  part('hull', () => {
    ctx.fillStyle = p.body;
    rrect(ctx, -56, -22, 112, 44, 22);
    ctx.fill();
    ctx.save();
    ctx.clip();
    ctx.fillStyle = p.shade;
    ctx.fillRect(-60, 9, 120, 16);
    ctx.restore();
    drawPlatingDetail(ctx, up.plating, p, t);
  });

  part('cabin', () => {
    ctx.fillStyle = p.cabin;
    rrect(ctx, -20, -26, 40, 52, 6);
    ctx.fill();
    ctx.fillStyle = p.band;
    rrect(ctx, -30, -25, 8, 50, 4);
    ctx.fill();
    rrect(ctx, 22, -25, 8, 50, 4);
    ctx.fill();
  });

  part('glass', () => {
    porthole(ctx, 0, 0, 12, p.band);
    drawNoseGlass(ctx, p);
  });

  part('hull', () => {
    ctx.strokeStyle = 'rgba(255,255,255,0.6)';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(-46, -12);
    ctx.quadraticCurveTo(-42, -18, -34, -18);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(-14, -20);
    ctx.lineTo(-6, -20);
    ctx.stroke();
    runningLights(ctx, t, alarm);
  });
  part('bumpers', () => drawBumpers(ctx, up.hull));
  part('lamp', () => drawLamp(ctx, up.light));
  if (up.light === 3) part('rearLamp', () => drawRearLamp(ctx));
  part('sonar', () => drawSonar(ctx, up.sonar));
  if (gear?.scrubbers) part('scrubber', () => drawScrubber(ctx, facing));
  if (gear?.electrolysis) part('electro', () => drawElectrolysis(ctx, t, facing));
  if (gear?.candles) part('candles', () => drawCandles(ctx, gear.candles));
  ctx.restore();
}

function porthole(ctx: CanvasRenderingContext2D, x: number, y: number, r: number, rim: string) {
  ctx.fillStyle = rim;
  ctx.beginPath();
  ctx.arc(x, y, r, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = GLASS;
  ctx.beginPath();
  ctx.arc(x, y, r - 3, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = 'rgba(255,255,255,0.8)';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.arc(x, y, r - 6, Math.PI * 1.1, Math.PI * 1.5);
  ctx.stroke();
}

function drawNoseGlass(ctx: CanvasRenderingContext2D, p: Plating) {
  ctx.save();
  rrect(ctx, -56, -22, 112, 44, 22);
  ctx.clip();
  ctx.beginPath();
  ctx.moveTo(30, -22);
  ctx.lineTo(34, -22);
  ctx.arc(34, 0, 22, -Math.PI / 2, Math.PI / 2);
  ctx.lineTo(30, 22);
  ctx.closePath();
  ctx.fillStyle = GLASS;
  ctx.fill();
  ctx.strokeStyle = p.band;
  ctx.lineWidth = 4;
  ctx.stroke();
  ctx.strokeStyle = 'rgba(255,255,255,0.8)';
  ctx.lineWidth = 2.5;
  ctx.beginPath();
  ctx.arc(34, 0, 14, -1.35, -0.35);
  ctx.stroke();
  ctx.restore();
}

const PROP_SIZE = [
  { w: 16, h: 30, color: '#B9C1CC', line: 'rgba(30,60,80,0.35)' },
  { w: 20, h: 36, color: '#F28C28', line: 'rgba(90,40,0,0.35)' },
  { w: 24, h: 42, color: '#22252C', line: 'rgba(242,140,40,0.4)' },
];

function drawPropeller(ctx: CanvasRenderingContext2D, p: Plating, prop: number, level: number) {
  const { w, h, color, line } = PROP_SIZE[level];
  const x0 = -60 - w;
  ctx.fillStyle = p.band;
  rrect(ctx, -62, -7, 10, 14, 3);
  ctx.fill();
  ctx.fillStyle = color;
  rrect(ctx, x0, -h / 2, w, h, 4);
  ctx.fill();
  ctx.save();
  rrect(ctx, x0, -h / 2, w, h, 4);
  ctx.clip();
  ctx.strokeStyle = line;
  ctx.lineWidth = 3;
  const off = (prop * 40) % 12;
  for (let y = -h / 2 - 3 + off; y < h / 2 + 3; y += 12) {
    ctx.beginPath();
    ctx.moveTo(x0 - 2, y);
    ctx.lineTo(-58, y + 4);
    ctx.stroke();
  }
  ctx.restore();
}

function drawTower(ctx: CanvasRenderingContext2D, p: Plating) {
  ctx.fillStyle = p.tower;
  ctx.beginPath();
  ctx.moveTo(-18, -20);
  ctx.lineTo(-18, -37);
  ctx.lineTo(6, -37);
  ctx.lineTo(20, -27);
  ctx.lineTo(20, -20);
  ctx.closePath();
  ctx.fill();
  ctx.fillStyle = 'rgba(0,0,0,0.08)';
  ctx.beginPath();
  ctx.moveTo(6, -37);
  ctx.lineTo(20, -27);
  ctx.lineTo(20, -20);
  ctx.lineTo(6, -20);
  ctx.closePath();
  ctx.fill();
  ctx.strokeStyle = 'rgba(255,255,255,0.7)';
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(-12, -32);
  ctx.lineTo(-2, -32);
  ctx.stroke();
  ctx.strokeStyle = p.cabin;
  ctx.lineWidth = 4;
  ctx.beginPath();
  ctx.moveTo(-8, -37);
  ctx.lineTo(-8, -49);
  ctx.lineTo(0, -49);
  ctx.stroke();
  ctx.fillStyle = p.cabin;
  ctx.beginPath();
  ctx.arc(ANTENNA.x, ANTENNA.y, 3.5, 0, Math.PI * 2);
  ctx.fill();
}

const TANKS = [
  { fill: '#CDD4DE', shine: '#F2F5F9', cap: '#8A93A3', stripe: '#E5484D', mark: '#3A4A66' },
  { fill: '#8C95A3', shine: '#B4BCC8', cap: '#5E6674', stripe: '#E5484D', mark: '#25304A' },
  { fill: '#F28C28', shine: '#FFC47F', cap: '#B8631A', stripe: '#7A3A10', mark: '#4A2408' },
  { fill: '#22252C', shine: '#424858', cap: '#4A505E', stripe: '#F28C28', mark: '#E8EDF5' },
];

function drawTank(ctx: CanvasRenderingContext2D, level: number, p: Plating) {
  drawTankShape(ctx, level, p.band);
}

/** One horizontal oxygen tank in the sub's local space, shared with the ship's cargo tanks. */
export function drawTankShape(ctx: CanvasRenderingContext2D, level: number, band: string) {
  const tank = TANKS[level];
  ctx.fillStyle = tank.cap;
  rrect(ctx, -53, -29.5, 5, 6, 2);
  ctx.fill();
  ctx.fillStyle = tank.fill;
  rrect(ctx, -50, -34, 30, 15, 7.5);
  ctx.fill();
  ctx.fillStyle = tank.shine;
  rrect(ctx, -46, -32, 20, 3, 1.5);
  ctx.fill();
  ctx.save();
  rrect(ctx, -50, -34, 30, 15, 7.5);
  ctx.clip();
  ctx.fillStyle = tank.stripe;
  if (level === 3) ctx.fillRect(-50, -23, 30, 2.5);
  else for (let i = 0; i <= level; i++) ctx.fillRect(-48 + i * 3, -34, 2, 15);
  ctx.restore();
  ctx.fillStyle = band;
  ctx.fillRect(-28, -35, 3, 17);

  ctx.strokeStyle = tank.mark;
  ctx.lineWidth = 1.8;
  ctx.beginPath();
  ctx.arc(-33, -26.5, 3.4, 0, Math.PI * 2);
  ctx.stroke();
}

const CELLS = [
  { n: 1, color: '#6BE38A' },
  { n: 2, color: '#6BE38A' },
  { n: 3, color: '#5BC0F8' },
  { n: 4, color: '#F6C445' },
];

function drawBattery(ctx: CanvasRenderingContext2D, level: number, t: number, p: Plating) {
  ctx.fillStyle = p.band;
  rrect(ctx, -44, 16, 32, 15, 5);
  ctx.fill();
  batteryLights(ctx, level, t);
}

/** The battery's cell lights, drawn again over the darkness so they count as the sub's base light. */
export function batteryLights(ctx: CanvasRenderingContext2D, level: number, t: number) {
  const c = CELLS[level];
  if (level === 3) {
    ctx.shadowColor = c.color;
    ctx.shadowBlur = 8 + Math.sin(t * 3) * 3;
  }
  ctx.fillStyle = c.color;
  for (let i = 0; i < c.n; i++) {
    const x = -40 + i * 7;
    ctx.beginPath();
    ctx.moveTo(x + 2.5, 22);
    ctx.lineTo(x + 6, 22);
    ctx.lineTo(x + 3.5, 28);
    ctx.lineTo(x, 28);
    ctx.closePath();
    ctx.fill();
  }
  ctx.shadowBlur = 0;
}

function drawPlatingDetail(ctx: CanvasRenderingContext2D, level: number, p: Plating, t: number) {
  if (level === 1) {
    ctx.strokeStyle = 'rgba(0,0,0,0.12)';
    ctx.lineWidth = 2;
    for (const x of [-42, 34]) {
      ctx.beginPath();
      ctx.moveTo(x, -20);
      ctx.lineTo(x, 20);
      ctx.stroke();
    }
  }
  if (level >= 2) {
    ctx.fillStyle = 'rgba(0,0,0,0.2)';
    for (let x = -48; x <= 50; x += 9) {
      if (x > -32 && x < 32) continue;
      for (const y of [-14, 14]) {
        ctx.beginPath();
        ctx.arc(x, y, 1.6, 0, Math.PI * 2);
        ctx.fill();
      }
    }
  }
  if (level === 3) {
    ctx.shadowColor = p.band;
    ctx.shadowBlur = 10 + Math.sin(t * 2) * 4;
    ctx.fillStyle = p.band;
    rrect(ctx, -52, -3, 18, 5, 2.5);
    ctx.fill();
    ctx.shadowBlur = 0;
  }
}

/** Faint glow on the nose glass and side porthole, so an unlit sub still shows in dark water. */
export function glassGlow(ctx: CanvasRenderingContext2D, amount: number) {
  if (amount <= 0) return;
  ctx.save();
  ctx.globalAlpha = Math.min(1, amount);
  ctx.fillStyle = '#C6F4FF';
  ctx.shadowColor = '#8FE3FF';
  ctx.shadowBlur = 14;
  ctx.beginPath();
  ctx.moveTo(30, -22);
  ctx.lineTo(34, -22);
  ctx.arc(34, 0, 22, -Math.PI / 2, Math.PI / 2);
  ctx.lineTo(30, 22);
  ctx.closePath();
  ctx.fill();
  ctx.beginPath();
  ctx.arc(0, 0, 9, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}

export function runningLights(ctx: CanvasRenderingContext2D, t: number, alarm = false) {
  const dots: [number, number, string, number][] = [
    [-44, 12, '#FF6B6B', 2.6],
    [-38, 12, '#FFD166', 2.6],
    [2, 16, '#6BE38A', 2.6],
    [ANTENNA.x, ANTENNA.y, '#FFF3C4', 3.5],
  ];
  const flash = Math.floor(t * 4) % 2 === 0;
  for (const [x, y, c, r] of dots) {
    ctx.globalAlpha = alarm ? (flash ? 1 : 0.2) : 0.95;
    ctx.fillStyle = alarm ? '#FF3B3B' : c;
    if (alarm && flash) {
      ctx.shadowColor = '#FF3B3B';
      ctx.shadowBlur = 8;
    }
    ctx.beginPath();
    ctx.arc(x, y, r, 0, Math.PI * 2);
    ctx.fill();
    ctx.shadowBlur = 0;
  }
  ctx.globalAlpha = 1;
}

function drawBumpers(ctx: CanvasRenderingContext2D, level: number) {
  if (level < 1) return;
  ctx.strokeStyle = '#2D2F36';
  ctx.lineWidth = 6;
  ctx.beginPath();
  ctx.arc(34, 0, 24, -0.85, 0.85);
  ctx.stroke();
  if (level < 2) return;
  ctx.beginPath();
  ctx.arc(-34, 0, 24, Math.PI - 0.7, Math.PI + 0.7);
  ctx.stroke();
  ctx.lineWidth = 4;
  ctx.beginPath();
  ctx.moveTo(-30, 21);
  ctx.lineTo(24, 21);
  ctx.stroke();
}

const LAMPS = [
  null,
  { w: 8, h: 10, r: 4, housing: '#3A3F4B', lens: '#FFD166' },
  { w: 10, h: 14, r: 6, housing: '#3A3F4B', lens: '#F4FAFF' },
  { w: 12, h: 16, r: 7, housing: '#C9D1DC', lens: '#F4FAFF' },
];

function drawLamp(ctx: CanvasRenderingContext2D, level: number) {
  const l = LAMPS[level];
  if (!l) return;
  ctx.fillStyle = l.housing;
  const pod = l.w * 0.5;
  rrect(ctx, LAMP.x - pod / 2, 18, pod, LAMP.y + l.h / 2 - 18, 2);
  ctx.fill();
  ctx.fillStyle = l.lens;
  ctx.shadowColor = l.lens;
  ctx.shadowBlur = 10;
  ctx.beginPath();
  ctx.arc(LAMP.x, LAMP.y, l.r * 0.8, 0, Math.PI * 2);
  ctx.fill();
  ctx.shadowBlur = 0;
}

function drawRearLamp(ctx: CanvasRenderingContext2D) {
  ctx.fillStyle = LAMPS[3]!.housing;
  rrect(ctx, REAR_LAMP.x - 2, 13, 4, REAR_LAMP.y + 6 - 13, 2);
  ctx.fill();
  ctx.fillStyle = LAMPS[3]!.lens;
  ctx.shadowColor = LAMPS[3]!.lens;
  ctx.shadowBlur = 8;
  ctx.beginPath();
  ctx.arc(REAR_LAMP.x, REAR_LAMP.y, 3, 0, Math.PI * 2);
  ctx.fill();
  ctx.shadowBlur = 0;
}

/** Height of the tower's top edge at x, which slopes down toward the nose. */
function towerTop(x: number) {
  return x <= 6 ? -37 : -37 + (x - 6) * (10 / 14);
}

function drawSonar(ctx: CanvasRenderingContext2D, level: number) {
  const { x, y } = SONAR_MOUNT;
  if (level === 0) return;
  const tall = level >= 2 ? 13 : 9;
  const mast = (mx: number, my: number, h: number) => {
    ctx.strokeStyle = level === 3 ? '#F28C28' : '#8A93A3';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(mx, my);
    ctx.lineTo(mx, my - h);
    ctx.stroke();
    if (level === 3) {
      ctx.strokeStyle = '#FFFFFF';
      ctx.lineWidth = 1.6;
      ctx.beginPath();
      ctx.moveTo(mx - 2.5, my - h / 2);
      ctx.lineTo(mx + 2.5, my - h / 2);
      ctx.stroke();
    }
  };
  mast(x, y, tall);
  if (level < 2) return;
  const sx = x - 4;
  mast(sx, towerTop(sx), 5);
}
