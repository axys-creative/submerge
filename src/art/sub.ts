import type { Loadout } from '../data/upgrades';
import type { SkinId } from '../data/skins';
import { rrect } from '../util';
import logoUrl from '../assets/svgs/logo-oceangate.svg';

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

const logo = new Image();
logo.src = logoUrl;

/** How much wider the middle cabin is drawn, per cargo hold level. */
const CABIN_WIDEN = [1, 1.2];
/** How far the hull is stretched back per cargo level; the nose stays put and everything behind the cabin moves back with it. */
const STERN_STRETCH = [0, 12];
export const sternStretch = (cargo: number) => STERN_STRETCH[cargo];

/** Lamp position in the sub's local space, used to aim the spotlight. */
export const LAMP = { x: 30, y: 31 };
export const REAR_LAMP = { x: -50, y: 26 };
/** Center of the nose glass, where the cockpit's own faint glow comes from. */
export const COCKPIT = { x: 42, y: 0 };
/** The capsule skin's small round viewport in its dome. */
const CAPSULE_VIEWPORT = { x: 46, y: 0 };
/** Where the sonar sits on the tower. */
const SONAR_MOUNT = { x: 17, y: -29 };
/** The antenna's light. */
export const ANTENNA = { x: 3, y: -49 };
/** Where the crane cable attaches: on the antenna's horizontal arm, just behind the light. */
export const ANCHOR = { x: -4, y: -51 };
/** The capsule skins have no antenna, so the crane hooks onto the top of the fairing, or of the hull, instead. */
const ANCHOR_CAPSULE = { x: -4, y: -38 };
const ANCHOR_GATE = { x: -4, y: -26 };
export const anchorFor = (skin: SkinId) => (skin === 'capsule' ? ANCHOR_CAPSULE : skin === 'oceangate' ? ANCHOR_GATE : ANCHOR);

/** Draws the sub facing right, centered on the origin, about 140 px long. */
/** Where the two dive weights hang, as x offsets in the sub's local space. */
export const WEIGHT_MOUNTS = [-18, 18];
/** Where the weights hang for a cargo level: under the bottom corners of the cabin, which widens with the hold. */
export const weightMounts = (cargo: number) => WEIGHT_MOUNTS.map((x) => x + Math.sign(x) * 20 * (CABIN_WIDEN[cargo] - 1));
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

export function drawSub(ctx: CanvasRenderingContext2D, up: Loadout, t: number, prop: number, alarm = false, weights = false, crush = 0, gear?: AirGear, facing = 1, skin: SkinId = 'standard') {
  const p = PLATING[up.plating];
  const capsule = skin === 'capsule';
  const gate = skin === 'oceangate';
  const E = STERN_STRETCH[up.cargo];
  const rear = (draw: () => void) => {
    ctx.save();
    ctx.translate(-E, 0);
    draw();
    ctx.restore();
  };
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
    weightMounts(up.cargo).forEach((x, i) =>
      part(i ? 'weightR' : 'weightL', () => {
        ctx.translate(x, WEIGHT_Y);
        drawWeight(ctx);
      }),
    );
  }
  if (gate) {
    part('hull', () => drawGateBody(ctx, E, facing));
    part('glass', () => drawCapsuleDome(ctx));
    ctx.restore();
    return;
  }
  part('prop', () => rear(() => drawPropeller(ctx, p, prop, up.propeller)));
  if (!capsule) {
    part('battery', () => rear(() => drawBattery(ctx, up.battery, t, p)));
    part('tower', () => drawTower(ctx, p));
    part('tank', () => rear(() => drawTank(ctx, up.oxygen, p)));
  }

  part('hull', () => {
    if (capsule) {
      drawCapsuleHull(ctx, p, E);
      return;
    }
    ctx.fillStyle = p.body;
    rrect(ctx, -56 - E, -22, 112 + E, 44, 22);
    ctx.fill();
    ctx.save();
    ctx.clip();
    ctx.fillStyle = p.shade;
    ctx.fillRect(-60 - E, 9, 120 + E, 16);
    ctx.restore();
    drawPlatingDetail(ctx, up.plating, p, t, E);
  });

  part('cabin', () => {
    const half = 20 * CABIN_WIDEN[up.cargo];
    if (capsule) {
      drawCapsuleFittings(ctx, p);
      return;
    }
    ctx.fillStyle = p.cabin;
    rrect(ctx, -half, -26, half * 2, 52, 6);
    ctx.fill();
    ctx.fillStyle = p.band;
    rrect(ctx, -half - 10, -25, 8, 50, 4);
    ctx.fill();
    rrect(ctx, half + 2, -25, 8, 50, 4);
    ctx.fill();
  });

  part('glass', () => {
    if (capsule) {
      drawCapsuleDome(ctx);
      return;
    }
    porthole(ctx, 0, 0, 12, p.band);
    drawNoseGlass(ctx, p, E);
  });

  part('hull', () => {
    if (!capsule) {
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
    }
    runningLights(ctx, t, alarm, E, !capsule);
  });
  part('bumpers', () => drawBumpers(ctx, up.hull, E));
  part('lamp', () => drawLamp(ctx, up.light));
  if (up.light === 3) part('rearLamp', () => rear(() => drawRearLamp(ctx)));
  part('sonar', () => drawSonar(ctx, up.sonar));
  if (gear?.scrubbers) part('scrubber', () => rear(() => drawScrubber(ctx, facing)));
  if (gear?.electrolysis) part('electro', () => drawElectrolysis(ctx, t, facing));
  if (gear?.candles) part('candles', () => drawCandles(ctx, gear.candles));
  ctx.restore();
}

/** The capsule's body: a white tube with a short tail tapering up to a rounded tip, and a seam where the tail joins. */
function drawCapsuleHull(ctx: CanvasRenderingContext2D, p: Plating, stretch: number) {
  const tube = () => {
    ctx.beginPath();
    ctx.moveTo(-42 - stretch, -22);
    ctx.lineTo(34, -22);
    ctx.lineTo(34, 22);
    ctx.lineTo(-42 - stretch, 22);
    ctx.bezierCurveTo(-54 - stretch, 21, -62 - stretch, 12, -66 - stretch, 3);
    ctx.quadraticCurveTo(-69 - stretch, -6, -64 - stretch, -12);
    ctx.bezierCurveTo(-58 - stretch, -19, -50 - stretch, -22, -42 - stretch, -22);
    ctx.closePath();
  };
  ctx.fillStyle = p.body;
  tube();
  ctx.fill();
  ctx.save();
  tube();
  ctx.clip();
  ctx.fillStyle = p.shade;
  ctx.fillRect(-72 - stretch, 10, 110 + stretch, 16);
  ctx.fillStyle = 'rgba(255,255,255,0.4)';
  ctx.fillRect(-72 - stretch, -19, 110 + stretch, 4);
  ctx.strokeStyle = 'rgba(0,0,0,0.16)';
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.moveTo(-42 - stretch, -22);
  ctx.lineTo(-42 - stretch, 22);
  ctx.stroke();
  ctx.restore();
}

/** The capsule's top fairing with its round opening and nub, and the small side thruster low on the tube. */
function drawCapsuleFittings(ctx: CanvasRenderingContext2D, p: Plating) {
  ctx.beginPath();
  ctx.moveTo(-30, -21);
  ctx.bezierCurveTo(-30, -31, -22, -37, -7, -37);
  ctx.bezierCurveTo(8, -37, 17, -31, 19, -21);
  ctx.closePath();
  ctx.fillStyle = p.body;
  ctx.fill();
  ctx.strokeStyle = 'rgba(0,0,0,0.14)';
  ctx.lineWidth = 1.5;
  ctx.stroke();
  ctx.fillStyle = 'rgba(255,255,255,0.45)';
  ctx.beginPath();
  ctx.ellipse(-12, -32, 10, 2.6, -0.1, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = p.shade;
  ctx.beginPath();
  ctx.arc(2, -29, 5, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#6B717B';
  ctx.beginPath();
  ctx.arc(11, -27, 2.6, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = p.shade;
  rrect(ctx, -2, 8, 24, 11, 5);
  ctx.fill();
  ctx.fillStyle = '#3A3F47';
  ctx.beginPath();
  ctx.ellipse(20, 13.5, 3.5, 5, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = '#9AA0A8';
  ctx.lineWidth = 1.5;
  ctx.stroke();
}

/** The OceanGate skin's body: a plain white rectangle whose back bottom corner sweeps up in a big curve to a point, standing on black landing gear. Upgrades do not change how it looks. */
function drawGateBody(ctx: CanvasRenderingContext2D, stretch: number, facing: number) {
  const tail = -66 - stretch;
  ctx.fillStyle = '#1E2026';
  for (const x of [-38 - stretch, 24]) {
    rrect(ctx, x - 2.5, 18, 5, 17, 1.5);
    ctx.fill();
  }
  rrect(ctx, -52 - stretch, 33, 92 + stretch, 4.5, 2.2);
  ctx.fill();

  const shape = () => {
    ctx.beginPath();
    ctx.moveTo(34, -22);
    ctx.lineTo(tail, -22);
    ctx.bezierCurveTo(tail + 2, 6, tail + 20, 22, tail + 48, 22);
    ctx.lineTo(34, 22);
    ctx.closePath();
  };
  ctx.fillStyle = '#F1F4F8';
  shape();
  ctx.fill();
  ctx.save();
  shape();
  ctx.clip();
  ctx.fillStyle = '#C9D0DA';
  ctx.fillRect(tail - 4, 10, 110 + stretch, 16);
  ctx.fillStyle = 'rgba(255,255,255,0.7)';
  ctx.fillRect(tail - 4, -19, 110 + stretch, 4);
  ctx.restore();
  if (logo.complete && logo.naturalWidth) {
    ctx.save();
    ctx.translate(-14 - stretch / 2, -2);
    ctx.scale(facing, 1);
    ctx.drawImage(logo, -29, -9.7, 58, 19.3);
    ctx.restore();
  }
}

/** The capsule's nose: a metal dome with one small round viewport. */
function drawCapsuleDome(ctx: CanvasRenderingContext2D) {
  const shine = ctx.createRadialGradient(40, -8, 2, 34, 0, 26);
  shine.addColorStop(0, '#D4D0BE');
  shine.addColorStop(1, '#6F6D60');
  ctx.beginPath();
  ctx.moveTo(34, -22);
  ctx.arc(34, 0, 22, -Math.PI / 2, Math.PI / 2);
  ctx.closePath();
  ctx.fillStyle = shine;
  ctx.fill();
  ctx.strokeStyle = '#4F4E45';
  ctx.lineWidth = 2;
  ctx.stroke();
  porthole(ctx, CAPSULE_VIEWPORT.x, CAPSULE_VIEWPORT.y, 8, '#DCE0E5');
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

function drawNoseGlass(ctx: CanvasRenderingContext2D, p: Plating, stretch: number) {
  ctx.save();
  rrect(ctx, -56 - stretch, -22, 112 + stretch, 44, 22);
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

function drawPlatingDetail(ctx: CanvasRenderingContext2D, level: number, p: Plating, t: number, stretch: number) {
  if (level === 1) {
    ctx.strokeStyle = 'rgba(0,0,0,0.12)';
    ctx.lineWidth = 2;
    for (const x of [-42 - stretch, 34]) {
      ctx.beginPath();
      ctx.moveTo(x, -20);
      ctx.lineTo(x, 20);
      ctx.stroke();
    }
  }
  if (level >= 2) {
    ctx.fillStyle = 'rgba(0,0,0,0.2)';
    for (let x = -48 - stretch; x <= 50; x += 9) {
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
    rrect(ctx, -52 - stretch, -3, 18, 5, 2.5);
    ctx.fill();
    ctx.shadowBlur = 0;
  }
}

/** Faint glow on the nose glass and side porthole, so an unlit sub still shows in dark water. */
export function glassGlow(ctx: CanvasRenderingContext2D, amount: number, skin: SkinId = 'standard') {
  if (amount <= 0) return;
  ctx.save();
  ctx.globalAlpha = Math.min(1, amount);
  ctx.fillStyle = '#C6F4FF';
  ctx.shadowColor = '#8FE3FF';
  ctx.shadowBlur = 14;
  if (skin !== 'standard') {
    ctx.beginPath();
    ctx.arc(CAPSULE_VIEWPORT.x, CAPSULE_VIEWPORT.y, 5, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
    return;
  }
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

export function runningLights(ctx: CanvasRenderingContext2D, t: number, alarm = false, stretch = 0, antenna = true) {
  const dots: [number, number, string, number][] = [
    [-44 - stretch, 12, '#FF6B6B', 2.6],
    [-38 - stretch, 12, '#FFD166', 2.6],
    [2, 16, '#6BE38A', 2.6],
    ...(antenna ? ([[ANTENNA.x, ANTENNA.y, '#FFF3C4', 3.5]] as [number, number, string, number][]) : []),
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

function drawBumpers(ctx: CanvasRenderingContext2D, level: number, stretch: number) {
  if (level < 1) return;
  ctx.strokeStyle = '#2D2F36';
  ctx.lineWidth = 6;
  ctx.beginPath();
  ctx.arc(34, 0, 24, -0.85, 0.85);
  ctx.stroke();
  if (level < 2) return;
  ctx.beginPath();
  ctx.arc(-34 - stretch, 0, 24, Math.PI - 0.7, Math.PI + 0.7);
  ctx.stroke();
  ctx.lineWidth = 4;
  ctx.beginPath();
  ctx.moveTo(-30 - stretch, 21);
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
  rrect(ctx, LAMP.x - pod / 2, 18, pod, LAMP.y - 18, 2);
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
  rrect(ctx, REAR_LAMP.x - 2, 13, 4, REAR_LAMP.y - 13, 2);
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
