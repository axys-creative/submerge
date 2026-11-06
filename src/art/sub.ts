import type { Loadout } from '../data/upgrades';
import type { SkinId } from '../data/skins';
import { rrect } from '../util';
import { drawLostSubSkin, LOST_PORTHOLE } from './lostSub';
import { drawChallenger, challengerPoint, challengerLamp, challengerViewport, challengerWeights, challengerBoomTips, CHALLENGER_GLASS, CHALLENGER_RIM, CHALLENGER_HOOK, CHALLENGER_BASE } from './challenger';
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

export const logo = new Image();
logo.src = logoUrl;

/** How much wider the middle cabin is drawn, per cargo hold level. */
const CABIN_WIDEN = [1, 1.2];
/** How far the hull is stretched back per cargo level; the nose stays put and everything behind the cabin moves back with it. */
const STERN_STRETCH = [0, 12];
export const sternStretch = (cargo: number) => STERN_STRETCH[cargo];

/** Lamp position in the sub's local space, used to aim the spotlight. */
export const LAMP = { x: 30, y: 31 };
export const REAR_LAMP = { x: -50, y: 26 };
/** Where the front spotlight sits: the fixed spot, or on the Challenger skin the tip of its upper boom. */
export const lampFor = (skin: SkinId, pose = 1) => (skin === 'challenger' ? challengerLamp(pose) : LAMP);
export { challengerBoomTips, challengerViewport, challengerWeights };
/** Where the Challenger skin's bubbles rise from: its base, in the sub's local space. */
export const challengerBase = (pose: number) => challengerPoint(CHALLENGER_BASE.x, CHALLENGER_BASE.y, pose, false);
/** Center of the nose glass, where the cockpit's own faint glow comes from. */
export const COCKPIT = { x: 42, y: 0 };
/** Where the OceanGate skin's top thruster blows its bubbles from, in the sub's local space. */
export const GATE_THRUSTER_BUBBLES = { x: 4, y: -22 };
/** The OceanGate nose's glass sphere: only the part past the flat face at x = 59 shows. */
const GATE_ORB = { x: 55.4, y: 0, r: 7 };
/** The capsule skin's small round viewport in its dome. */
const CAPSULE_VIEWPORT = { x: 46, y: 0 };
/** The capsule skin's round viewport in the side of its tube. */
export const CAPSULE_SIDE_VIEWPORT = { x: -16, y: 0 };
/** Where the sonar sits on the tower. */
const SONAR_MOUNT = { x: 17, y: -29 };
/** Where the OceanGate skin's sonar sits: on the hull's top edge, above the logo near the rear. */
const GATE_SONAR_MOUNT = { x: -30, y: -22 };
/** The antenna's light. */
export const ANTENNA = { x: 3, y: -49 };
/** Where the crane cable attaches: on the antenna's horizontal arm, just behind the light. */
export const ANCHOR = { x: -4, y: -51 };
/** The capsule skins have no antenna, so the crane hooks onto the top of the fairing, or of the hull, instead. */
const ANCHOR_CAPSULE = { x: -4, y: -38 };
const ANCHOR_GATE = { x: -4, y: -26 };
const ANCHOR_LOST = { x: -4, y: -27 };
export const anchorFor = (skin: SkinId, pose = 0, lying = true) => (skin === 'challenger' ? challengerPoint(CHALLENGER_HOOK.x, CHALLENGER_HOOK.y, pose, lying) : skin === 'capsule' ? ANCHOR_CAPSULE : skin === 'oceangate' ? ANCHOR_GATE : skin === 'sm13' ? ANCHOR_LOST : ANCHOR);

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

/** The electrolysis unit: a small box on the hull top with a green O2 light and a slatted seawater inlet on its front. */
function drawElectrolysis(ctx: CanvasRenderingContext2D, t: number, facing: number) {
  ctx.fillStyle = '#2D3A4D';
  rrect(ctx, 22, -31, 13, 10, 2.5);
  ctx.fill();
  ctx.fillStyle = '#5B6B82';
  rrect(ctx, 34, -29.5, 4.5, 7, 1.5);
  ctx.fill();
  ctx.strokeStyle = '#1C2533';
  ctx.lineWidth = 0.8;
  ctx.beginPath();
  for (const y of [-27.5, -26, -24.5]) {
    ctx.moveTo(35.2, y);
    ctx.lineTo(37.5, y);
  }
  ctx.stroke();
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

export function drawSub(ctx: CanvasRenderingContext2D, up: Loadout, t: number, prop: number, alarm = false, weights = false, crush = 0, gear?: AirGear, facing = 1, skin: SkinId = 'standard', pose = 1, lying = false, boom = 1) {
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

  if (skin === 'challenger') {
    part('hull', () => drawChallenger(ctx, pose, lying, boom, weights ? drawWeight : null));
    ctx.restore();
    return;
  }
  if (weights) {
    weightMounts(up.cargo).forEach((x, i) =>
      part(i ? 'weightR' : 'weightL', () => {
        ctx.translate(x, WEIGHT_Y);
        drawWeight(ctx);
      }),
    );
  }
  if (skin === 'sm13') {
    part('hull', () => drawLostSubSkin(ctx, prop));
    ctx.restore();
    return;
  }
  if (gate) {
    part('hull', () => drawGateBody(ctx, E, facing));
    part('glass', () => drawGateDome(ctx));
    part('prop', () => drawGateThrusters(ctx));
    part('hull', () => drawGateCables(ctx));
    part('sonar', () => rear(() => drawSonar(ctx, up.sonar, GATE_SONAR_MOUNT, () => GATE_SONAR_MOUNT.y, true)));
    ctx.restore();
    return;
  }
  part('prop', () => rear(() => drawPropeller(ctx, p, prop, up.propeller)));
  part('battery', () => rear(() => drawBattery(ctx, up.battery, t, p)));
  if (!capsule) {
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
      drawCapsuleDome(ctx, p);
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
      ctx.moveTo(-46 - E, -12);
      ctx.quadraticCurveTo(-42 - E, -18, -34 - E, -18);
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

  porthole(ctx, CAPSULE_SIDE_VIEWPORT.x, CAPSULE_SIDE_VIEWPORT.y, 8, '#DCE0E5');
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
    ctx.translate(-32 - stretch / 2, -6);
    ctx.scale(facing, 1);
    ctx.drawImage(logo, -23, -7.7, 46, 15.4);
    ctx.restore();
  }
}

/** The OceanGate skin's thrusters: two black pinched squares, one on the hull's top and one at the front, each on a short stub. They look the same at every propeller level. */
function drawGateThrusters(ctx: CanvasRenderingContext2D) {
  const S = 10;
  const pinch = 1.8;
  const box = (x: number, y: number, vertical: boolean, ox: number, oy: number) => {
    ctx.save();
    ctx.translate(ox, oy);
    ctx.scale(0.75, 0.75);
    ctx.translate(-ox, -oy);
    ctx.fillStyle = '#4A505B';
    if (vertical) rrect(ctx, x + S / 2 - 2.5, y - 5, 5, 5, 1);
    else rrect(ctx, x + S, y + S / 2 - 2.5, 5, 5, 1);
    ctx.fill();
    ctx.fillStyle = '#15171C';
    ctx.lineJoin = 'round';
    ctx.lineWidth = 1.5;
    ctx.strokeStyle = '#15171C';
    ctx.beginPath();
    if (vertical) {
      ctx.moveTo(x, y);
      ctx.lineTo(x + S, y);
      ctx.lineTo(x + S - pinch, y + S / 2);
      ctx.lineTo(x + S, y + S);
      ctx.lineTo(x, y + S);
      ctx.lineTo(x + pinch, y + S / 2);
    } else {
      ctx.moveTo(x, y);
      ctx.lineTo(x + S / 2, y + pinch);
      ctx.lineTo(x + S, y);
      ctx.lineTo(x + S, y + S);
      ctx.lineTo(x + S / 2, y + S - pinch);
      ctx.lineTo(x, y + S);
    }
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
    ctx.restore();
  };
  box(ANCHOR_GATE.x + 3, -18, true, ANCHOR_GATE.x + 8, -15.5);
  box(19, -5, false, 34, 0);
}

/** A tangle of cables looped over the top front of the hull, like the Titan's. */
function drawGateCables(ctx: CanvasRenderingContext2D) {
  const loops: [number, number, number, string][] = [
    [-4, 26, 15, '#1E2026'],
    [2, 18, 11, '#3A3F47'],
    [8, 30, 19, '#1E2026'],
    [14, 24, 8, '#5A606B'],
    [-1, 12, 13, '#2B2E35'],
    [12, 28, 12, '#1E2026'],
  ];
  ctx.save();
  ctx.translate(34, -22);
  ctx.scale(0.625, 0.625);
  ctx.translate(-34, 22);
  ctx.lineCap = 'round';
  ctx.lineWidth = 1.8;
  for (const [x0, x1, rise, color] of loops) {
    ctx.strokeStyle = color;
    ctx.beginPath();
    ctx.moveTo(x0, -22);
    ctx.bezierCurveTo(x0 - 4, -22 - rise, x1 + 4, -22 - rise * 0.4, x1, -22);
    ctx.stroke();
  }
  ctx.strokeStyle = '#1E2026';
  ctx.lineWidth = 2.4;
  ctx.beginPath();
  ctx.moveTo(-6, -22);
  ctx.quadraticCurveTo(10, -30, 30, -22);
  ctx.stroke();
  ctx.restore();
}

/** The capsule's nose: a dome in the hull's own metal, with one small round viewport. */
function drawCapsuleDome(ctx: CanvasRenderingContext2D, p: Plating) {
  const dome = () => {
    ctx.beginPath();
    ctx.moveTo(34, -22);
    ctx.arc(34, 0, 22, -Math.PI / 2, Math.PI / 2);
    ctx.closePath();
  };
  ctx.fillStyle = p.body;
  dome();
  ctx.fill();
  ctx.save();
  dome();
  ctx.clip();
  ctx.fillStyle = p.shade;
  ctx.fillRect(30, 10, 30, 16);
  ctx.fillStyle = 'rgba(255,255,255,0.4)';
  ctx.beginPath();
  ctx.ellipse(40, -15, 14, 3, 0.25, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
  ctx.strokeStyle = 'rgba(0,0,0,0.16)';
  ctx.lineWidth = 1.5;
  dome();
  ctx.stroke();
  porthole(ctx, CAPSULE_VIEWPORT.x, CAPSULE_VIEWPORT.y, 8, '#DCE0E5');
}

/** Fixed speckles over the OceanGate dome as [x, y, size, light]. */
const GATE_GRAIN = (() => {
  let seed = 7;
  const next = () => (seed = (seed * 16807) % 2147483647) / 2147483647;
  const grain: [number, number, number, boolean][] = [];
  for (let tries = 0; grain.length < 40 && tries < 2000; tries++) {
    const x = 34 + next() * 22;
    const y = (next() - 0.5) * 44;
    if ((x - 34) ** 2 + y * y < 21 ** 2 && grain.every(([gx, gy]) => (gx - x) ** 2 + (gy - y) ** 2 > 36)) grain.push([x, y, 0.5 + next() * 0.7, next() > 0.55]);
  }
  return grain;
})();

/** The OceanGate skin's nose: a dull grainy grey-brown metal dome with the viewport as a small flat-faced bump on the nose's outline. */
function drawGateDome(ctx: CanvasRenderingContext2D) {
  const dome = () => {
    ctx.beginPath();
    const edge = Math.asin(8 / 22);
    ctx.moveTo(34, -22);
    ctx.arc(34, 0, 22, -Math.PI / 2, -edge);
    const inner = 34 + 22 * Math.cos(edge);
    ctx.arcTo(59, -8, 59, 8, 2);
    ctx.arcTo(59, 8, inner, 8, 2);
    ctx.lineTo(inner, 8);
    ctx.arc(34, 0, 22, edge, Math.PI / 2);
    ctx.closePath();
  };
  const tone = ctx.createRadialGradient(42, -6, 2, 34, 0, 26);
  tone.addColorStop(0, '#77756E');
  tone.addColorStop(1, '#5B5A55');
  dome();
  ctx.fillStyle = tone;
  ctx.fill();
  ctx.save();
  dome();
  ctx.clip();
  for (const [x, y, r, light] of GATE_GRAIN) {
    ctx.fillStyle = light ? 'rgba(200,196,184,0.2)' : 'rgba(20,20,18,0.25)';
    ctx.fillRect(x, y, r, r);
  }
  ctx.restore();
  ctx.strokeStyle = '#46453F';
  ctx.lineWidth = 2;
  dome();
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(34, -22);
  ctx.lineTo(34, 22);
  ctx.strokeStyle = 'rgba(30,30,28,0.35)';
  ctx.lineWidth = 1.2;
  ctx.stroke();

  ctx.save();
  ctx.beginPath();
  ctx.rect(59, -10, 10, 20);
  ctx.clip();
  const glass = ctx.createRadialGradient(GATE_ORB.x + 3, -2, 0.5, GATE_ORB.x + 2, 0, GATE_ORB.r + 1);
  glass.addColorStop(0, '#E6F8FF');
  glass.addColorStop(1, '#7FB8CC');
  ctx.beginPath();
  ctx.arc(GATE_ORB.x, GATE_ORB.y, GATE_ORB.r, 0, Math.PI * 2);
  ctx.fillStyle = glass;
  ctx.fill();
  ctx.strokeStyle = '#46453F';
  ctx.lineWidth = 1.4;
  ctx.stroke();
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

/** An outboard motor clamped to the ship's stern, with the sub's propeller at the foot of its leg. */
export function drawShipPropeller(ctx: CanvasRenderingContext2D, prop: number, level: number, body: string, accent: string) {
  ctx.save();
  ctx.fillStyle = body;
  rrect(ctx, -150, -22, 14, 14, 3);
  ctx.fill();
  rrect(ctx, -156, 0, 14, 36, 5);
  ctx.fill();
  ctx.translate(-92, 30);
  drawPropeller(ctx, { band: body } as Plating, prop, level);
  ctx.translate(92, -30);
  ctx.fillStyle = body;
  rrect(ctx, -163, -17, 26, 21, 8);
  ctx.fill();
  ctx.fillStyle = accent;
  rrect(ctx, -163, -8, 26, 4, 2);
  ctx.fill();
  ctx.fillStyle = 'rgba(255,255,255,0.18)';
  rrect(ctx, -159, -14, 12, 3, 1.5);
  ctx.fill();
  ctx.restore();
}

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

const CRACKS: [number, number][][] = [
  [[0, 0], [-6, -5], [-9, -13], [-16, -17]],
  [[0, 0], [7, -4], [11, -11], [10, -19]],
  [[0, 0], [8, 3], [15, 5], [20, 12]],
  [[0, 0], [-3, 7], [-8, 11], [-7, 19]],
  [[0, 0], [-8, 1], [-15, 0], [-21, 5]],
  [[-9, -13], [-15, -11], [-19, -14]],
  [[11, -11], [17, -12], [21, -9]],
  [[8, 3], [9, 10], [14, 15]],
];

/** Cracks spreading from a point on the front glass; `progress` runs 0 to 1. */
export function drawGlassCracks(ctx: CanvasRenderingContext2D, progress: number, skin: SkinId = 'standard') {
  const standard = skin === 'standard';
  ctx.save();
  if (standard) ctx.translate(39, 9);
  else if (skin === 'oceangate') ctx.translate(GATE_ORB.x + 3, GATE_ORB.y);
  else if (skin === 'sm13') ctx.translate(LOST_PORTHOLE.x, LOST_PORTHOLE.y);
  else ctx.translate(CAPSULE_VIEWPORT.x, CAPSULE_VIEWPORT.y);
  const k = standard ? 0.45 : 0.225;
  ctx.scale(k, k);
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';
  CRACKS.forEach((line, i) => {
    const local = Math.min(1, Math.max(0, progress * 1.6 - (i < 5 ? 0 : 0.5)));
    if (local <= 0) return;
    const pts = line.length - 1;
    const reach = local * pts;
    ctx.beginPath();
    ctx.moveTo(line[0][0], line[0][1]);
    for (let j = 1; j <= pts; j++) {
      const f = Math.min(1, reach - (j - 1));
      if (f <= 0) break;
      const [x0, y0] = line[j - 1];
      const [x1, y1] = line[j];
      ctx.lineTo(x0 + (x1 - x0) * f, y0 + (y1 - y0) * f);
    }
    ctx.strokeStyle = 'rgba(30,50,70,0.55)';
    ctx.lineWidth = 3.2;
    ctx.stroke();
    ctx.strokeStyle = 'rgba(255,255,255,0.95)';
    ctx.lineWidth = 1.4;
    ctx.stroke();
  });
  ctx.restore();
}

/** Faint glow on the nose glass and side porthole, so an unlit sub still shows in dark water. */
export function glassGlow(ctx: CanvasRenderingContext2D, amount: number, skin: SkinId = 'standard', pose = 1) {
  if (amount <= 0) return;
  ctx.save();
  ctx.globalAlpha = Math.min(1, amount);
  ctx.fillStyle = '#C6F4FF';
  ctx.shadowColor = '#8FE3FF';
  ctx.shadowBlur = 14;
  if (skin === 'challenger') {
    const at = challengerViewport(pose);
    ctx.beginPath();
    ctx.arc(at.x, at.y, CHALLENGER_RIM, 0, Math.PI * 2);
    ctx.clip();
    ctx.beginPath();
    ctx.arc(at.x, at.y, CHALLENGER_GLASS, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
    return;
  }
  if (skin === 'oceangate') {
    ctx.beginPath();
    ctx.rect(59, -10, 10, 20);
    ctx.clip();
    ctx.beginPath();
    ctx.arc(GATE_ORB.x, GATE_ORB.y, GATE_ORB.r - 0.5, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
    return;
  }
  if (skin !== 'standard') {
    const at = skin === 'sm13' ? LOST_PORTHOLE : CAPSULE_VIEWPORT;
    ctx.beginPath();
    ctx.arc(at.x, at.y, 5, 0, Math.PI * 2);
    ctx.fill();
    if (skin === 'capsule') {
      ctx.beginPath();
      ctx.arc(CAPSULE_SIDE_VIEWPORT.x, CAPSULE_SIDE_VIEWPORT.y, 5, 0, Math.PI * 2);
      ctx.fill();
    }
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
  if (level < 3) return;
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

function drawSonar(ctx: CanvasRenderingContext2D, level: number, mount = SONAR_MOUNT, topAt = towerTop, grey = false) {
  const { x, y } = mount;
  if (level === 0) return;
  const tall = level >= 2 ? 13 : 9;
  const mast = (mx: number, my: number, h: number) => {
    ctx.strokeStyle = level === 3 && !grey ? '#F28C28' : '#8A93A3';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(mx, my);
    ctx.lineTo(mx, my - h);
    ctx.stroke();
    if (level === 3 && !grey) {
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
  mast(sx, topAt(sx), 5);
}
