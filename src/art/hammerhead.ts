import { drawHammerheadSkin } from './creatures';

/** How big the hammerhead creature's drawing is as the player's skin: about 150 px long. */
export const SHARK_SIZE = 0.75;
/** How much bigger the skin is than at its first size of 0.6, which the lamp, eye and camera positions were drawn for. */
const GROW = SHARK_SIZE / 0.6;

/** Where the hammerhead's spotlight sits, on the front of its head, in the shark's local space. */
export const SHARK_LAMP = { x: 46 * GROW, y: 5 * GROW };
/** Where the eye sits, where the glass cracks start. */
export const SHARK_EYE = { x: 50 * GROW, y: 10 * GROW };
/** Where the crane hooks on: the ring on top of the tank, in the tank's local space. */
export const TANK_HOOK = { x: 0, y: -62 };
/** How far below the tank's center the shark rests while inside it. */
export const SHARK_REST_Y = 12;

const HALF = 92;
const TOP = -52;
const BOTTOM = 56;
const WATER = -4;
/** Thickness of the three nested pieces of each floor door, biggest first, which slide out to meet in the middle. */
const FLOOR_SEGMENTS = [12, 9, 6];

function tankGlass(ctx: CanvasRenderingContext2D) {
  ctx.beginPath();
  ctx.moveTo(-HALF + 6, TOP);
  ctx.quadraticCurveTo(-HALF - 8, 2, -HALF + 6, BOTTOM);
  ctx.lineTo(HALF - 6, BOTTOM);
  ctx.quadraticCurveTo(HALF + 8, 2, HALF - 6, TOP);
  ctx.closePath();
}

/** The tank's water, glass tint and open floor, drawn behind the shark. */
export function drawSharkTankBack(ctx: CanvasRenderingContext2D, t: number) {
  ctx.save();
  tankGlass(ctx);
  ctx.fillStyle = 'rgba(190,232,250,0.12)';
  ctx.fill();
  ctx.clip();
  const water = ctx.createLinearGradient(0, WATER, 0, BOTTOM);
  water.addColorStop(0, 'rgba(96,190,232,0.55)');
  water.addColorStop(1, 'rgba(28,100,160,0.7)');
  ctx.fillStyle = water;
  ctx.beginPath();
  ctx.moveTo(-HALF - 10, BOTTOM + 4);
  for (let x = -HALF - 10; x <= HALF + 10; x += 8) ctx.lineTo(x, WATER + Math.sin(x * 0.09 + t * 2.2) * 1.8);
  ctx.lineTo(HALF + 10, BOTTOM + 4);
  ctx.closePath();
  ctx.fill();
  ctx.strokeStyle = 'rgba(225,246,255,0.8)';
  ctx.lineWidth = 1.6;
  ctx.beginPath();
  for (let x = -HALF; x <= HALF; x += 8) ctx[x === -HALF ? 'moveTo' : 'lineTo'](x, WATER + Math.sin(x * 0.09 + t * 2.2) * 1.8);
  ctx.stroke();
  ctx.fillStyle = 'rgba(235,250,255,0.55)';
  for (let i = 0; i < 4; i++) {
    const u = (t * 0.35 + i * 0.27) % 1;
    ctx.beginPath();
    ctx.arc(-56 + i * 36 + Math.sin(t * 2 + i * 2) * 3, BOTTOM - 4 - u * (BOTTOM - WATER - 4), 1.6 + (i % 2), 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.restore();
}

/** The glass sheen, the two holding bars, the caps and the telescoping floor doors, drawn over the shark; `open` is how far the floor doors have retracted, 0 to 1. */
export function drawSharkTankFront(ctx: CanvasRenderingContext2D, open: number) {
  ctx.save();
  ctx.lineJoin = 'round';
  ctx.lineCap = 'round';
  tankGlass(ctx);
  ctx.save();
  ctx.clip();
  ctx.fillStyle = 'rgba(255,255,255,0.22)';
  ctx.beginPath();
  ctx.ellipse(-HALF + 14, 0, 4, 40, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = 'rgba(255,255,255,0.12)';
  ctx.beginPath();
  ctx.ellipse(HALF - 12, -6, 3, 28, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
  ctx.strokeStyle = 'rgba(210,240,255,0.75)';
  ctx.lineWidth = 2;
  ctx.stroke();

  for (const x of [-72, 0, 72]) {
    ctx.fillStyle = '#39455C';
    ctx.fillRect(x - 2.5, TOP - 6, 5, BOTTOM - TOP + 6);
    ctx.fillStyle = '#7C8AA6';
    ctx.fillRect(x - 1.7, TOP - 6, 1.4, BOTTOM - TOP + 6);
  }

  const cap = (y: number, h: number, bow: number) => {
    const g = ctx.createLinearGradient(0, y, 0, y + h);
    g.addColorStop(0, '#8E9BB5');
    g.addColorStop(1, '#46526B');
    ctx.fillStyle = g;
    ctx.strokeStyle = '#27304A';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(-HALF, y + h);
    ctx.lineTo(-HALF, y + 2);
    ctx.quadraticCurveTo(0, y + 2 - bow * 2, HALF, y + 2);
    ctx.lineTo(HALF, y + h);
    ctx.quadraticCurveTo(0, y + h - bow * 2, -HALF, y + h);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
  };
  cap(TOP - 6, 7, 2.5);
  ctx.strokeStyle = '#2B3A67';
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.arc(TANK_HOOK.x, TOP - 12, 5, 0, Math.PI * 2);
  ctx.stroke();
  ctx.fillStyle = '#46526B';
  ctx.fillRect(-6, TOP - 9, 12, 4);

  const ease = (u: number) => u * u * (3 - 2 * u);
  const segLen = HALF / FLOOR_SEGMENTS.length;
  const yc = BOTTOM + 3.5;
  for (const side of [-1, 1]) {
    ctx.save();
    ctx.scale(side, 1);
    ctx.translate(-HALF, 0);
    for (let k = FLOOR_SEGMENTS.length - 1; k >= 0; k--) {
      const reach = ease(Math.min(1, Math.max(0, (1 - open) * FLOOR_SEGMENTS.length - k)));
      const x0 = k * segLen - (k ? 5 : 0);
      const x1 = k ? (k + reach) * segLen : 12 + (segLen - 12) * reach;
      if (k && reach <= 0.01) continue;
      const h = FLOOR_SEGMENTS[k];
      const g = ctx.createLinearGradient(0, yc - h / 2, 0, yc + h / 2);
      g.addColorStop(0, '#8E9BB5');
      g.addColorStop(1, '#46526B');
      ctx.fillStyle = g;
      ctx.strokeStyle = '#27304A';
      ctx.lineWidth = 1.4;
      ctx.beginPath();
      ctx.roundRect(x0, yc - h / 2, x1 - x0, h, 2);
      ctx.fill();
      ctx.stroke();
      ctx.fillStyle = 'rgba(255,255,255,0.28)';
      ctx.fillRect(x0 + 2, yc - h / 2 + 1.2, x1 - x0 - 4, 1.4);
      if (k === 0) {
        ctx.fillStyle = '#27304A';
        for (const rx of [5, 9]) {
          ctx.beginPath();
          ctx.arc(rx, yc, 1, 0, Math.PI * 2);
          ctx.fill();
        }
      }
    }
    ctx.restore();
  }
  ctx.restore();
}

/** Where the camera strap crosses the shark's back, behind the dorsal fin, in the shark's local space, and the body's top and bottom there. */
/** How big the camera box is against its first design: 0.75 is a quarter smaller. */
const CAMERA_SCALE = 0.75;
const STRAP = { x: -6, top: -6.4, bottom: 7.4 };

/** The shark with a small action camera strapped on: a black band around the body and a rounded box on its back with a lens and a red light. */
export function drawCameraShark(ctx: CanvasRenderingContext2D, phase: number, chasing = false) {
  drawHammerheadSkin(ctx, phase, SHARK_SIZE, chasing);
  ctx.save();
  ctx.scale(GROW, GROW);
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';
  const { x, top, bottom } = STRAP;
  ctx.strokeStyle = '#14171F';
  ctx.lineWidth = 3.4;
  ctx.lineCap = 'butt';
  ctx.beginPath();
  ctx.moveTo(x - 1, top);
  ctx.quadraticCurveTo(x + 3, (top + bottom) / 2, x - 1, bottom);
  ctx.stroke();
  ctx.save();
  ctx.translate(x, top + 1.2);
  ctx.scale(CAMERA_SCALE, CAMERA_SCALE);
  ctx.fillStyle = '#222836';
  ctx.strokeStyle = '#0B0D12';
  ctx.lineWidth = 1.2;
  ctx.beginPath();
  ctx.roundRect(-6, -9.2, 12, 9.2, 2.5);
  ctx.fill();
  ctx.stroke();
  ctx.fillStyle = '#0B0D12';
  ctx.beginPath();
  ctx.arc(2.4, -4.7, 2.6, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#5B7AA8';
  ctx.beginPath();
  ctx.arc(2.4, -4.7, 1.4, 0, Math.PI * 2);
  ctx.fill();
  ctx.shadowColor = '#FF4A4A';
  ctx.shadowBlur = 5;
  ctx.fillStyle = '#FF5A5A';
  ctx.beginPath();
  ctx.arc(-3.3, -7, 1.1, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
  ctx.restore();
}
