import { mixColor, rrect } from '../util';

export const RIG_LEGS = [-386, 0, 382];
export const RIG_RISER = 214;
export const RIG_GUARD_BOTTOM = 5000;
/** Lamp depths on the riser guard, one every 50 m down to the guard's end. */
export const RIG_LAMPS = Array.from({ length: 15 }, (_, i) => (i + 1) * 500);
const GUARD_HALF = 38;
const LEG_HALF = 85;
const BRACE = 170;
const PONTOON_TOP = 250;
const MOORINGS = [-2100, -1500, 1500, 2100];

export interface RigOpts {
  t: number;
  night: number;
  /** Sea floor y at an x offset from the rig's center. */
  floorAt: (dx: number) => number;
  /** Visible world y range, relative to the waterline. */
  top: number;
  bottom: number;
  /** Deep water color the steel fades into. */
  deep: string;
}

/** A floating oil rig: legs over a pontoon, a riser down to the sea floor and mooring lines to anchors, with the lower deck and a flare tower above the waterline. the lower deck and a flare tower above it. The origin is the rig's center on the waterline. */
export function drawRig(ctx: CanvasRenderingContext2D, o: RigOpts) {
  const { t, night, floorAt, top, bottom, deep } = o;
  const d = (c: string) => (night > 0 ? mixColor(c, '#0B1430', night * 0.55) : c);
  ctx.save();
  ctx.translate(0, Math.sin(t * 0.9) * 3);
  ctx.lineJoin = 'round';
  ctx.lineCap = 'butt';

  const steel = ctx.createLinearGradient(0, 0, 0, 3000);
  steel.addColorStop(0, d('#6E7885'));
  steel.addColorStop(1, mixColor('#6E7885', deep, 0.85));
  const dark = ctx.createLinearGradient(0, 0, 0, 3000);
  dark.addColorStop(0, d('#3E4654'));
  dark.addColorStop(1, mixColor('#3E4654', deep, 0.9));

  if (bottom > 0) {
    RIG_LEGS.forEach((cx, i) => {
      const base = PONTOON_TOP;
      const from = Math.max(-190, top - BRACE);
      const to = Math.min(base, bottom + BRACE);
      ctx.fillStyle = steel;
      ctx.fillRect(cx - LEG_HALF - 6, Math.max(-190, top - 20), 12, Math.min(base, bottom + 20) - Math.max(-190, top - 20));
      ctx.fillRect(cx + LEG_HALF - 6, Math.max(-190, top - 20), 12, Math.min(base, bottom + 20) - Math.max(-190, top - 20));
      ctx.strokeStyle = steel;
      ctx.lineWidth = 7;
      ctx.beginPath();
      const k0 = Math.floor(Math.max(from, -190) / BRACE);
      for (let y = k0 * BRACE; y < to; y += BRACE) {
        const y1 = Math.min(y + BRACE, base);
        if (y1 <= -190) continue;
        const y0 = Math.max(y, -190);
        const flip = Math.round(y / BRACE) % 2 === 0;
        ctx.moveTo(cx + (flip ? -LEG_HALF : LEG_HALF), y0);
        ctx.lineTo(cx + (flip ? LEG_HALF : -LEG_HALF), y1);
        ctx.moveTo(cx - LEG_HALF, y1);
        ctx.lineTo(cx + LEG_HALF, y1);
      }
      ctx.stroke();
    });

    ctx.fillStyle = dark;
    rrect(ctx, RIG_LEGS[0] - 120, PONTOON_TOP, RIG_LEGS[2] - RIG_LEGS[0] + 240, 90, 40);
    ctx.fill();
    ctx.fillStyle = steel;
    ctx.fillRect(RIG_LEGS[0] - 90, PONTOON_TOP + 30, RIG_LEGS[2] - RIG_LEGS[0] + 180, 14);

    ctx.strokeStyle = dark;
    ctx.lineWidth = 5;
    ctx.beginPath();
    for (const dx of MOORINGS) {
      const sx = dx < 0 ? RIG_LEGS[0] - 90 : RIG_LEGS[2] + 90;
      ctx.moveTo(sx, PONTOON_TOP + 70);
      ctx.lineTo(dx, floorAt(dx));
    }
    ctx.stroke();
    ctx.fillStyle = dark;
    for (const dx of MOORINGS) ctx.fillRect(dx - 26, floorAt(dx) - 18, 52, 24);

    const rb = floorAt(RIG_RISER) + 12;
    ctx.fillStyle = dark;
    ctx.fillRect(RIG_RISER - 20, -190, 40, rb + 190);
    ctx.fillStyle = steel;
    for (let y = Math.ceil(Math.max(-190, top - 20) / 300) * 300; y < Math.min(rb - 140, bottom + 20); y += 300) {
      ctx.fillRect(RIG_RISER - 27, y, 54, 14);
    }
    const gTop = Math.max(-190, top - 20);
    const gBottom = Math.min(RIG_GUARD_BOTTOM, bottom + 20);
    if (gBottom > gTop) {
      ctx.fillStyle = steel;
      ctx.fillRect(RIG_RISER - GUARD_HALF - 5, gTop, 10, gBottom - gTop);
      ctx.fillRect(RIG_RISER + GUARD_HALF - 5, gTop, 10, gBottom - gTop);
      for (let y = Math.ceil(gTop / 125) * 125; y <= gBottom; y += 125) ctx.fillRect(RIG_RISER - GUARD_HALF - 5, y - 5, GUARD_HALF * 2 + 10, 10);
      if (gBottom >= RIG_GUARD_BOTTOM) ctx.fillRect(RIG_RISER - GUARD_HALF - 5, RIG_GUARD_BOTTOM - 5, GUARD_HALF * 2 + 10, 14);
    }
    for (const ly of RIG_LAMPS) {
      if (ly < top - 200 || ly > bottom + 200) continue;
      const glow = ctx.createRadialGradient(RIG_RISER, ly, 2, RIG_RISER, ly, 150);
      glow.addColorStop(0, 'rgba(255,226,140,0.5)');
      glow.addColorStop(1, 'rgba(255,226,140,0)');
      ctx.fillStyle = glow;
      ctx.fillRect(RIG_RISER - 150, ly - 150, 300, 300);
      ctx.fillStyle = '#FFE08A';
      rrect(ctx, RIG_RISER - 14, ly - 9, 28, 18, 5);
      ctx.fill();
    }
    ctx.fillStyle = steel;
    rrect(ctx, RIG_RISER - 52, rb - 150, 104, 150, 10);
    ctx.fill();
    ctx.fillStyle = dark;
    ctx.fillRect(RIG_RISER - 60, rb - 110, 120, 16);
    ctx.fillRect(RIG_RISER - 60, rb - 60, 120, 16);
    ctx.fillStyle = '#E8603C';
    ctx.globalAlpha = 0.55;
    ctx.fillRect(RIG_RISER - 34, rb - 142, 68, 22);
    ctx.globalAlpha = 1;
  }

  if (top < -150) {
    const red = d('#EA5B33');
    const redDark = d('#C0432A');
    const grey = d('#D6DADF');
    const greyDark = d('#9AA2AD');
    const glass = night > 0.05 ? mixColor('#5A4A7A', '#FFD36B', night) : '#5A4A7A';

    // Flare tower
    ctx.fillStyle = dark;
    ctx.fillRect(-520, -345, 10, -520);
    ctx.fillRect(-420, -345, 10, -520);
    ctx.strokeStyle = dark;
    ctx.lineWidth = 6;
    ctx.beginPath();
    for (let y = -345; y > -865; y -= 100) {
      ctx.moveTo(-520, y);
      ctx.lineTo(-410, y - 100);
      ctx.moveTo(-410, y);
      ctx.lineTo(-520, y - 100);
    }
    ctx.stroke();
    ctx.fillStyle = greyDark;
    ctx.fillRect(-505, -935, 80, 70);
    ctx.fillStyle = d('#3E4654');
    ctx.fillRect(-495, -985, 60, 50);
    const f = Math.sin(t * 9) * 8;
    const flame = ctx.createLinearGradient(0, -985, 0, -1120);
    flame.addColorStop(0, `rgba(255,214,90,${0.95})`);
    flame.addColorStop(1, 'rgba(255,110,40,0.85)');
    ctx.fillStyle = flame;
    ctx.beginPath();
    ctx.moveTo(-495, -985);
    ctx.quadraticCurveTo(-505 + f, -1060, -470 + f * 1.5, -1130);
    ctx.quadraticCurveTo(-455, -1060, -440 - f, -1090);
    ctx.quadraticCurveTo(-425, -1040, -435, -985);
    ctx.closePath();
    ctx.fill();
    if (night > 0.05) {
      const glow = ctx.createRadialGradient(-465, -1050, 10, -465, -1050, 330);
      glow.addColorStop(0, `rgba(255,170,70,${0.45 * night})`);
      glow.addColorStop(1, 'rgba(255,170,70,0)');
      ctx.fillStyle = glow;
      ctx.fillRect(-800, -1380, 700, 700);
    }

    // Crane
    ctx.fillStyle = d('#F2F2F2');
    ctx.fillRect(250, -520, 56, 175);
    ctx.fillStyle = red;
    ctx.fillRect(250, -560, 56, 40);
    ctx.strokeStyle = red;
    ctx.lineWidth = 14;
    ctx.beginPath();
    ctx.moveTo(300, -540);
    ctx.lineTo(620, -840);
    ctx.stroke();
    ctx.strokeStyle = d('#F2F2F2');
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.moveTo(620, -840);
    ctx.lineTo(640, -520);
    ctx.stroke();

    // Habitat block
    ctx.fillStyle = grey;
    ctx.fillRect(40, -500, 520, 155);
    ctx.fillStyle = greyDark;
    ctx.fillRect(40, -500, 520, 14);
    for (const y of [-455, -405]) {
      ctx.fillStyle = glass;
      ctx.fillRect(60, y, 480, 24);
      ctx.fillStyle = d('#B9C0C9');
      for (let x = 60; x < 540; x += 32) ctx.fillRect(x, y, 4, 24);
    }
    ctx.fillStyle = d('#2A8BCB');
    rrect(ctx, 400, -600, 50, 110, 22);
    ctx.fill();
    rrect(ctx, 460, -620, 50, 130, 22);
    ctx.fill();

    // Process deck
    ctx.fillStyle = grey;
    ctx.fillRect(-625, -480, 660, 135);
    ctx.fillStyle = greyDark;
    ctx.fillRect(-625, -480, 660, 14);
    ctx.fillStyle = red;
    for (const x of [-440, -330, -230, -120]) ctx.fillRect(x, -480, 36, 135);
    ctx.fillStyle = d('#F4F4F4');
    rrect(ctx, -300, -590, 46, 110, 20);
    ctx.fill();
    rrect(ctx, -240, -610, 46, 130, 20);
    ctx.fill();
    ctx.strokeStyle = red;
    ctx.lineWidth = 8;
    ctx.beginPath();
    for (const x of [-60, 0]) {
      ctx.moveTo(x, -480);
      ctx.lineTo(x, -640);
    }
    for (let y = -480; y > -640; y -= 40) {
      ctx.moveTo(-60, y);
      ctx.lineTo(0, y - 40);
    }
    ctx.stroke();

    // Walkway rail and hull
    ctx.fillStyle = grey;
    ctx.fillRect(-660, -347, 1320, 18);
    ctx.fillStyle = red;
    ctx.beginPath();
    ctx.moveTo(-625, -329);
    ctx.lineTo(625, -329);
    ctx.lineTo(625, -215);
    ctx.lineTo(660, -190);
    ctx.lineTo(-660, -190);
    ctx.lineTo(-625, -215);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = redDark;
    for (let x = 220; x < 590; x += 28) ctx.fillRect(x, -280, 14, 56);
    ctx.fillStyle = grey;
    for (const x of [-540, -240, -110, 330, 480]) {
      ctx.fillRect(x - 30, -325, 60, 120);
      ctx.strokeStyle = redDark;
      ctx.lineWidth = 6;
      ctx.beginPath();
      ctx.moveTo(x - 30, -325);
      ctx.lineTo(x + 30, -205);
      ctx.moveTo(x + 30, -325);
      ctx.lineTo(x - 30, -205);
      ctx.stroke();
    }

    if (night > 0.05) {
      ctx.fillStyle = `rgba(255,214,120,${0.9 * night})`;
      for (const x of [-600, -200, 100, 540]) {
        ctx.beginPath();
        ctx.arc(x, -352, 9, 0, Math.PI * 2);
        ctx.fill();
      }
    }
  }
  ctx.restore();
}
