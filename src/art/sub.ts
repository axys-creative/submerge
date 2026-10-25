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
export function drawSub(ctx: CanvasRenderingContext2D, up: Loadout, t: number, prop: number, alarm = false) {
  const p = PLATING[up.plating];
  ctx.save();
  ctx.lineJoin = 'round';
  ctx.lineCap = 'round';

  drawPropeller(ctx, p, prop, up.propeller);
  drawBattery(ctx, up.battery, t);
  drawTower(ctx, p);
  drawTank(ctx, up.oxygen, p);

  ctx.fillStyle = p.body;
  rrect(ctx, -56, -22, 112, 44, 22);
  ctx.fill();
  ctx.save();
  ctx.clip();
  ctx.fillStyle = p.shade;
  ctx.fillRect(-60, 9, 120, 16);
  ctx.restore();

  drawPlatingDetail(ctx, up.plating, p, t);

  ctx.fillStyle = p.cabin;
  rrect(ctx, -20, -26, 40, 52, 6);
  ctx.fill();
  ctx.fillStyle = p.band;
  rrect(ctx, -30, -25, 8, 50, 4);
  ctx.fill();
  rrect(ctx, 22, -25, 8, 50, 4);
  ctx.fill();

  porthole(ctx, 0, 0, 12, p.band);
  drawNoseGlass(ctx, p);

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
  drawBumpers(ctx, up.hull);
  drawLamp(ctx, up.light);
  if (up.light === 3) drawRearLamp(ctx);
  drawSonar(ctx, up.sonar);
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
  const tank = TANKS[level];
  ctx.fillStyle = tank.cap;
  rrect(ctx, -53, -31, 5, 6, 2);
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
  ctx.fillStyle = p.band;
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

function drawBattery(ctx: CanvasRenderingContext2D, level: number, t: number) {
  ctx.fillStyle = '#3A3F4B';
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
    rrect(ctx, -40 + i * 7, 22, 3.5, 6, 1.5);
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
