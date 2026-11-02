import { rrect } from '../util';
import { drawShipPropeller, drawTankShape } from './sub';
import { CRANE_TIP, SHIP_LAMPS } from './shipMounts';

const HULL = '#6E4A3C';
const SHADE = '#4B2F27';
const DARK = '#2A1714';
const PLATE = '#8A5E4C';
const RUST = '#B8714A';

function glow(ctx: CanvasRenderingContext2D, x: number, y: number, r: number, a: number) {
  ctx.save();
  ctx.globalCompositeOperation = 'lighter';
  const g = ctx.createRadialGradient(x, y, 0, x, y, r);
  g.addColorStop(0, `rgba(255,190,100,${a})`);
  g.addColorStop(1, 'rgba(255,190,100,0)');
  ctx.fillStyle = g;
  ctx.beginPath();
  ctx.arc(x, y, r, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}

const rivets = (ctx: CanvasRenderingContext2D, x: number, y0: number, y1: number, step = 12) => {
  ctx.fillStyle = 'rgba(25,12,10,0.6)';
  for (let y = y0; y < y1; y += step) {
    ctx.beginPath();
    ctx.arc(x, y, 1.6, 0, Math.PI * 2);
    ctx.fill();
  }
};

const hullPath = (ctx: CanvasRenderingContext2D) => {
  ctx.beginPath();
  ctx.moveTo(-150, -46);
  ctx.lineTo(168, -46);
  ctx.lineTo(180, -34);
  ctx.lineTo(152, 28);
  ctx.lineTo(-136, 28);
  ctx.lineTo(-150, 12);
  ctx.closePath();
};

/** The SM-13 skin's mothership: a rusted, boxy support ship with a heavy gantry crane, built to match the iron-lung submarine. Same crane tip and lamp spots as the standard ship. */
export function drawIronShip(ctx: CanvasRenderingContext2D, t: number, facing: 1 | -1, night: number, oxygen: number, alert: number, prop: number, propLevel: number) {
  ctx.lineJoin = 'round';
  ctx.lineCap = 'round';
  const lit = night > 0.3;

  // Gantry crane: two posts, a lattice boom out over the stern and a strut down to the hull corner.
  ctx.strokeStyle = DARK;
  ctx.lineWidth = 9;
  ctx.beginPath();
  ctx.moveTo(-140, -44);
  ctx.lineTo(-140, -112);
  ctx.moveTo(-112, -44);
  ctx.lineTo(-112, -112);
  ctx.moveTo(-108, -112);
  ctx.lineTo(CRANE_TIP.x + 4, CRANE_TIP.y);
  ctx.stroke();
  ctx.lineWidth = 6;
  ctx.beginPath();
  ctx.moveTo(-204, -108);
  ctx.lineTo(-146, -46);
  ctx.stroke();
  ctx.lineWidth = 2.5;
  ctx.beginPath();
  for (let x = -112, up = false; x > CRANE_TIP.x + 12; x -= 15, up = !up) {
    ctx.moveTo(x, up ? -112 : -97);
    ctx.lineTo(x - 15, up ? -97 : -112);
  }
  ctx.moveTo(-108, -97);
  ctx.lineTo(CRANE_TIP.x + 4, -97);
  ctx.stroke();
  ctx.strokeStyle = PLATE;
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(-138, -50);
  ctx.lineTo(-138, -110);
  ctx.moveTo(-110, -50);
  ctx.lineTo(-110, -110);
  ctx.stroke();
  ctx.fillStyle = DARK;
  rrect(ctx, CRANE_TIP.x - 11, CRANE_TIP.y - 9, 22, 24, 4);
  ctx.fill();
  ctx.fillStyle = PLATE;
  ctx.beginPath();
  ctx.arc(CRANE_TIP.x, CRANE_TIP.y, 6, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = DARK;
  ctx.beginPath();
  ctx.arc(CRANE_TIP.x, CRANE_TIP.y, 2.4, 0, Math.PI * 2);
  ctx.fill();

  // Mast with a crooked antenna, like the sub's vent stack.
  ctx.strokeStyle = DARK;
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(8, -104);
  ctx.lineTo(8, -126);
  ctx.moveTo(-6, -116);
  ctx.lineTo(22, -112);
  ctx.moveTo(-2, -108);
  ctx.lineTo(18, -108);
  ctx.stroke();

  // Aft deck: a rack of oxygen tanks and a soot-stained exhaust stack.
  for (const cx of [-86, -70, -54]) {
    ctx.save();
    ctx.translate(cx - 26.5, -26);
    ctx.rotate(Math.PI / 2);
    drawTankShape(ctx, oxygen, RUST);
    ctx.restore();
  }
  ctx.fillStyle = SHADE;
  rrect(ctx, -36, -92, 18, 48, 3);
  ctx.fill();
  ctx.fillStyle = DARK;
  ctx.fillRect(-38, -94, 22, 6);
  ctx.fillRect(-37, -72, 20, 3);
  ctx.fillStyle = 'rgba(120,70,50,0.5)';
  ctx.fillRect(-33, -88, 4, 42);
  for (let i = 0; i < 4; i++) {
    const u = (t * 0.25 + i / 4) % 1;
    ctx.fillStyle = `rgba(50,40,38,${0.3 * (1 - u)})`;
    ctx.beginPath();
    ctx.arc(-27 + Math.sin(t + i * 2) * 4 + u * 14, -98 - u * 46, 6 + u * 12, 0, Math.PI * 2);
    ctx.fill();
  }

  // Wheelhouse: a plain box with slit windows and a flat roof.
  const house = ctx.createLinearGradient(0, -98, 0, -46);
  house.addColorStop(0, '#7A5242');
  house.addColorStop(1, SHADE);
  ctx.fillStyle = house;
  ctx.fillRect(0, -98, 78, 54);
  ctx.fillStyle = DARK;
  ctx.fillRect(-6, -104, 90, 7);
  ctx.fillStyle = PLATE;
  ctx.fillRect(-6, -104, 90, 2);
  for (const x of [10, 46]) {
    ctx.fillStyle = DARK;
    ctx.fillRect(x - 2, -86, 28, 14);
    ctx.fillStyle = lit ? '#FFC36B' : '#2B1B16';
    ctx.fillRect(x, -84, 24, 10);
    if (night > 0) glow(ctx, x + 12, -79, 40, 0.5 * night);
    ctx.strokeStyle = DARK;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(x + 12, -84);
    ctx.lineTo(x + 12, -74);
    ctx.stroke();
  }
  ctx.fillStyle = DARK;
  ctx.fillRect(34, -64, 14, 20);
  ctx.fillStyle = 'rgba(184,113,74,0.4)';
  ctx.fillRect(2, -62, 28, 4);
  ctx.fillRect(54, -66, 20, 3);
  rivets(ctx, 3, -94, -48, 10);
  rivets(ctx, 75, -94, -48, 10);

  // Foredeck: a generator shed and stacked crates.
  ctx.fillStyle = '#5E3C31';
  ctx.fillRect(94, -70, 44, 24);
  ctx.fillStyle = DARK;
  ctx.fillRect(92, -72, 48, 4);
  ctx.strokeStyle = 'rgba(20,10,8,0.6)';
  ctx.lineWidth = 2;
  ctx.beginPath();
  for (let y = -62; y < -48; y += 5) {
    ctx.moveTo(100, y);
    ctx.lineTo(132, y);
  }
  ctx.stroke();
  for (const [x, y, w, h] of [[146, -64, 22, 18], [149, -78, 16, 14]] as const) {
    ctx.fillStyle = '#7C5A3C';
    ctx.fillRect(x, y, w, h);
    ctx.strokeStyle = '#3A2A1A';
    ctx.lineWidth = 1.5;
    ctx.strokeRect(x, y, w, h);
    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.lineTo(x + w, y + h);
    ctx.moveTo(x + w, y);
    ctx.lineTo(x, y + h);
    ctx.stroke();
  }

  // Hull: a heavy slab-sided box with a flat deck and a stubby bow.
  const hull = ctx.createLinearGradient(0, -46, 0, 28);
  hull.addColorStop(0, '#80574A');
  hull.addColorStop(0.5, HULL);
  hull.addColorStop(1, '#3A231E');
  hullPath(ctx);
  ctx.fillStyle = hull;
  ctx.strokeStyle = HULL;
  ctx.lineWidth = 5;
  ctx.fill();
  ctx.stroke();
  ctx.save();
  hullPath(ctx);
  ctx.clip();
  ctx.fillStyle = 'rgba(160,92,52,0.22)';
  for (const [x, y, rx, ry] of [[-100, -30, 34, 10], [-20, 6, 46, 9], [60, -34, 30, 8], [118, 0, 26, 12], [-60, 18, 26, 6]] as const) {
    ctx.beginPath();
    ctx.ellipse(x, y, rx, ry, 0.2, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.fillStyle = 'rgba(20,10,8,0.55)';
  ctx.fillRect(-160, 12, 340, 20);
  ctx.fillStyle = 'rgba(30,20,16,0.35)';
  ctx.fillRect(-160, -46, 340, 4);
  for (const x of [-104, -20, 64, 140]) {
    ctx.fillStyle = PLATE;
    ctx.fillRect(x, -46, 10, 74);
    rivets(ctx, x + 5, -38, 26, 12);
  }
  for (const x of [-62, 22, 102]) {
    ctx.strokeStyle = 'rgba(20,10,8,0.45)';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(x, -42);
    ctx.lineTo(x, 12);
    ctx.stroke();
  }
  ctx.restore();

  for (const x of [-80, -52, 36, 80]) {
    ctx.fillStyle = DARK;
    ctx.beginPath();
    ctx.arc(x, 0, 8, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = lit ? '#FFC36B' : '#2B1B16';
    ctx.beginPath();
    ctx.arc(x, 0, 5.5, 0, Math.PI * 2);
    ctx.fill();
    if (night > 0) glow(ctx, x, 0, 26, 0.45 * night);
    ctx.strokeStyle = '#8B5C4E';
    ctx.lineWidth = 2;
    ctx.stroke();
  }

  ctx.fillStyle = 'rgba(214,186,172,0.4)';
  ctx.font = 'bold 14px sans-serif';
  const label = 'CARRIER-13';
  ctx.save();
  ctx.translate(-100 + ctx.measureText(label).width / 2, -22);
  ctx.scale(facing, 1);
  ctx.textAlign = 'center';
  ctx.fillText(label, 0, 0);
  ctx.restore();

  for (const l of SHIP_LAMPS) {
    ctx.strokeStyle = DARK;
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(l.x, l.y + 12);
    ctx.lineTo(l.x, l.y);
    ctx.stroke();
    ctx.fillStyle = DARK;
    rrect(ctx, l.x - 5, l.y - 5, 10, 8, 3);
    ctx.fill();
    ctx.fillStyle = night > 0.3 ? '#FFF6D8' : '#8A7A70';
    ctx.beginPath();
    ctx.arc(l.x + l.dir * 2, l.y - 1, 2.5, 0, Math.PI * 2);
    ctx.fill();
    if (night > 0) glow(ctx, l.x + l.dir * 2, l.y - 1, 26, 0.6 * night);
  }

  if (night > 0) {
    glow(ctx, 8, -128, 30, 0.5 * night);
    glow(ctx, CRANE_TIP.x, CRANE_TIP.y - 12, 30, 0.5 * night);
    ctx.fillStyle = '#FFD66B';
    for (const [x, y] of [[8, -128], [CRANE_TIP.x, CRANE_TIP.y - 12]]) {
      ctx.beginPath();
      ctx.arc(x, y, 3.5, 0, Math.PI * 2);
      ctx.fill();
    }
  }
  ctx.fillStyle = RUST;
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

  drawShipPropeller(ctx, prop, propLevel, DARK, RUST);
}
