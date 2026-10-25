import type { Creature } from '../game/world';

const FISH = ['#FFB547', '#FF7A6B', '#7BDFF2', '#B9F18C'];

const ANGLER_SCALE = 0.75;

/** How far a dead anglerfish has flipped belly-up, 0..1. */
const anglerFlip = (c: Creature) => (c.state === 'dead' ? Math.min(1, c.dying / 1.2) : 0);

/** How bright the lure still is: full while alive, dimming out over about three seconds once dead. */
export function lureGlow(c: Creature) {
  return c.state === 'dead' ? Math.max(0, 1 - c.dying / 3) : 1;
}

export function anglerLure(c: Creature) {
  const a = Math.PI * anglerFlip(c);
  const lx = 62 * ANGLER_SCALE;
  const ly = -36 * ANGLER_SCALE;
  return {
    x: c.x + c.facing * (lx * Math.cos(a) - ly * Math.sin(a)),
    y: c.y + lx * Math.sin(a) + ly * Math.cos(a),
  };
}

export function drawCreature(ctx: CanvasRenderingContext2D, c: Creature) {
  ctx.save();
  ctx.translate(c.x, c.y);
  ctx.lineJoin = 'round';
  ctx.lineCap = 'round';
  switch (c.kind) {
    case 'fish':
      ctx.scale(c.facing, 1);
      fish(ctx, c);
      break;
    case 'jelly':
      jelly(ctx, c);
      break;
    case 'shark':
    case 'hammerhead':
      ctx.scale(c.facing, 1);
      ctx.rotate(Math.max(-0.8, Math.min(0.8, Math.atan2(c.vy, Math.max(Math.abs(c.vx), 40)))));
      shark(ctx, c, c.kind === 'hammerhead');
      break;
    case 'squid':
      ctx.rotate(c.angle + Math.PI / 2);
      squid(ctx, c);
      break;
    case 'angler':
      ctx.scale(c.facing, 1);
      angler(ctx, c);
      break;
  }
  ctx.restore();
}

function fish(ctx: CanvasRenderingContext2D, c: Creature) {
  const color = FISH[Math.floor(c.tint * FISH.length)];
  const wag = Math.sin(c.phase * 12) * 3;
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.moveTo(-10, 0);
  ctx.lineTo(-20, -7 + wag);
  ctx.lineTo(-20, 7 + wag);
  ctx.closePath();
  ctx.fill();
  ctx.beginPath();
  ctx.ellipse(0, 0, 13, 8, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = 'rgba(255,255,255,0.35)';
  ctx.beginPath();
  ctx.ellipse(1, -3, 7, 2.5, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#1B2238';
  ctx.beginPath();
  ctx.arc(6, -1.5, 2, 0, Math.PI * 2);
  ctx.fill();
}

function jelly(ctx: CanvasRenderingContext2D, c: Creature) {
  const pulse = 1 + Math.sin(c.phase * 2.8) * 0.08;
  ctx.strokeStyle = 'rgba(214,190,255,0.6)';
  ctx.lineWidth = 2.5;
  for (let i = -1.5; i <= 1.5; i++) {
    ctx.beginPath();
    ctx.moveTo(i * 7, 4);
    for (let s = 1; s <= 5; s++) ctx.lineTo(i * 7 + Math.sin(c.phase * 3 + s + i) * 3, 4 + s * 7);
    ctx.stroke();
  }
  ctx.save();
  ctx.scale(pulse, 1 / pulse);
  ctx.fillStyle = 'rgba(201,167,255,0.85)';
  ctx.beginPath();
  ctx.arc(0, 4, 18, Math.PI, 0);
  for (let i = 0; i < 4; i++) ctx.quadraticCurveTo(13.5 - i * 9, 9, 9 - i * 9, 4);
  ctx.fill();
  ctx.fillStyle = 'rgba(255,255,255,0.45)';
  ctx.beginPath();
  ctx.ellipse(-5, -5, 6, 3, -0.5, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}

function shark(ctx: CanvasRenderingContext2D, c: Creature, hammer = false) {
  const chasing = c.state === 'chase';
  const tail = Math.sin(c.phase * (chasing ? 12 : 7)) * 0.25;
  const fin = hammer ? '#6E7388' : '#6A82A8';
  ctx.save();
  ctx.translate(-54, 0);
  ctx.rotate(tail);
  ctx.fillStyle = fin;
  ctx.beginPath();
  ctx.moveTo(4, -5);
  ctx.lineTo(-26, -30);
  ctx.lineTo(-16, 0);
  ctx.lineTo(-26, 26);
  ctx.lineTo(4, 5);
  ctx.closePath();
  ctx.fill();
  ctx.restore();

  ctx.fillStyle = fin;
  ctx.beginPath();
  ctx.moveTo(-4, -20);
  ctx.lineTo(-16, -48);
  ctx.lineTo(18, -20);
  ctx.closePath();
  ctx.fill();

  const skin = hammer ? '#8E94A8' : '#7F97BD';
  ctx.fillStyle = skin;
  ctx.beginPath();
  ctx.moveTo(62, 2);
  ctx.quadraticCurveTo(44, -24, -8, -22);
  ctx.quadraticCurveTo(-44, -18, -58, -4);
  ctx.lineTo(-58, 4);
  ctx.quadraticCurveTo(-40, 18, -4, 20);
  ctx.quadraticCurveTo(42, 20, 62, 2);
  ctx.fill();
  ctx.fillStyle = '#EAF0F7';
  ctx.beginPath();
  ctx.moveTo(58, 6);
  ctx.quadraticCurveTo(34, 19, -4, 19);
  ctx.quadraticCurveTo(-30, 17, -50, 7);
  ctx.quadraticCurveTo(-10, 10, 24, 8);
  ctx.closePath();
  ctx.fill();

  if (hammer) {
    ctx.fillStyle = skin;
    ctx.beginPath();
    ctx.roundRect(46, -27, 17, 38, 8);
    ctx.fill();
    ctx.fillStyle = '#EAF0F7';
    ctx.beginPath();
    ctx.roundRect(46, 3, 17, 8, 4);
    ctx.fill();
  }

  ctx.fillStyle = fin;
  ctx.beginPath();
  ctx.moveTo(12, 10);
  ctx.lineTo(-6, 32);
  ctx.lineTo(24, 14);
  ctx.closePath();
  ctx.fill();

  ctx.strokeStyle = 'rgba(0,0,0,0.18)';
  ctx.lineWidth = 2;
  for (const x of [22, 27, 32]) {
    ctx.beginPath();
    ctx.moveTo(x, -6);
    ctx.lineTo(x - 2, 4);
    ctx.stroke();
  }

  if (chasing) {
    ctx.fillStyle = '#7A2E3B';
    ctx.beginPath();
    ctx.moveTo(60, 4);
    ctx.lineTo(36, 7);
    ctx.lineTo(54, 14);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = '#FFFFFF';
    for (const x of [42, 48, 54]) {
      ctx.beginPath();
      ctx.moveTo(x, 5);
      ctx.lineTo(x + 2.5, 9);
      ctx.lineTo(x + 5, 5);
      ctx.fill();
    }
  } else {
    ctx.strokeStyle = 'rgba(30,40,70,0.5)';
    ctx.beginPath();
    ctx.moveTo(56, 6);
    ctx.quadraticCurveTo(48, 10, 40, 8);
    ctx.stroke();
  }

  const eyeX = hammer ? 58 : 42;
  const eyeY = hammer ? -20 : -7;
  ctx.fillStyle = '#1B2238';
  ctx.beginPath();
  ctx.arc(eyeX, eyeY, chasing ? 4.5 : 4, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#FFFFFF';
  ctx.beginPath();
  ctx.arc(eyeX + 1.5, eyeY - 1.5, 1.4, 0, Math.PI * 2);
  ctx.fill();
  if (chasing) {
    ctx.strokeStyle = '#1B2238';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(34, -15);
    ctx.lineTo(48, -11);
    ctx.stroke();
  }
}

function squid(ctx: CanvasRenderingContext2D, c: Creature) {
  const lunging = c.state === 'lunge';
  ctx.strokeStyle = '#C94660';
  for (let i = 0; i < 8; i++) {
    const x0 = -15 + i * (30 / 7);
    const long = i === 2 || i === 5;
    const len = long ? 11 : 7;
    ctx.lineWidth = long ? 4 : 6;
    ctx.beginPath();
    ctx.moveTo(x0, 14);
    for (let s = 1; s <= len; s++) {
      const spread = lunging ? 0.3 : 1;
      const x = x0 * (1 + s * 0.12 * spread) + Math.sin(c.phase * 4 + s * 0.8 + i) * s * 0.9;
      ctx.lineTo(x, 14 + s * 11);
    }
    ctx.stroke();
    if (long) {
      ctx.fillStyle = '#C94660';
      ctx.beginPath();
      ctx.ellipse(x0 * (1 + len * 0.12) + Math.sin(c.phase * 4 + len * 0.8 + i) * len * 0.9, 14 + len * 11, 5, 9, 0, 0, Math.PI * 2);
      ctx.fill();
    }
  }
  ctx.fillStyle = '#E0607E';
  ctx.beginPath();
  ctx.moveTo(0, -72);
  ctx.quadraticCurveTo(28, -40, 22, 12);
  ctx.quadraticCurveTo(0, 26, -22, 12);
  ctx.quadraticCurveTo(-28, -40, 0, -72);
  ctx.fill();
  ctx.beginPath();
  ctx.moveTo(-6, -60);
  ctx.lineTo(-24, -72);
  ctx.lineTo(-12, -44);
  ctx.moveTo(6, -60);
  ctx.lineTo(24, -72);
  ctx.lineTo(12, -44);
  ctx.fill();
  ctx.fillStyle = '#F49AB0';
  for (const [x, y, r] of [
    [-8, -40, 4],
    [7, -30, 3],
    [-4, -18, 3.5],
    [9, -50, 2.5],
  ]) {
    ctx.beginPath();
    ctx.arc(x, y, r, 0, Math.PI * 2);
    ctx.fill();
  }
  for (const x of [-11, 11]) {
    ctx.fillStyle = '#FFFFFF';
    ctx.beginPath();
    ctx.arc(x, 4, 7.5, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#1B2238';
    ctx.beginPath();
    ctx.arc(x, 6, 4, 0, Math.PI * 2);
    ctx.fill();
  }
}

function angler(ctx: CanvasRenderingContext2D, c: Creature) {
  const dead = c.state === 'dead';
  ctx.scale(ANGLER_SCALE, ANGLER_SCALE);
  ctx.rotate(Math.PI * anglerFlip(c));
  if (dead) ctx.globalAlpha = Math.max(0, Math.min(1, (6 - c.dying) / 2));
  const wag = dead ? 0 : Math.sin(c.phase * 5) * 0.3;
  ctx.save();
  ctx.translate(-36, 0);
  ctx.rotate(wag);
  ctx.fillStyle = '#2E2445';
  ctx.beginPath();
  ctx.moveTo(4, 0);
  ctx.lineTo(-22, -18);
  ctx.lineTo(-18, 18);
  ctx.closePath();
  ctx.fill();
  ctx.restore();

  ctx.strokeStyle = '#4A3D6B';
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(8, -30);
  ctx.quadraticCurveTo(40, -66, 62, -36);
  ctx.stroke();

  ctx.fillStyle = '#3D3159';
  ctx.beginPath();
  ctx.ellipse(0, 0, 42, 32, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#4C3F6E';
  ctx.beginPath();
  ctx.ellipse(-6, 10, 28, 16, 0, 0, Math.PI * 2);
  ctx.fill();

  const open = 0.5 + Math.sin(c.phase * 2) * 0.15;
  ctx.fillStyle = '#1A1026';
  ctx.beginPath();
  ctx.moveTo(44, -6);
  ctx.lineTo(12, 6);
  ctx.lineTo(44, 6 + 22 * open);
  ctx.closePath();
  ctx.fill();
  ctx.fillStyle = '#F4F1FF';
  for (let i = 0; i < 4; i++) {
    const x = 20 + i * 7;
    ctx.beginPath();
    ctx.moveTo(x, 1 - i * 1.6);
    ctx.lineTo(x + 3, 9 - i);
    ctx.lineTo(x + 6, 1 - i * 1.6);
    ctx.fill();
    ctx.beginPath();
    ctx.moveTo(x, 10 + i * 4 * open);
    ctx.lineTo(x + 3, 3 + i * 3.5 * open);
    ctx.lineTo(x + 6, 10 + i * 4 * open);
    ctx.fill();
  }
  ctx.fillStyle = '#BFF7FF';
  ctx.beginPath();
  ctx.arc(18, -14, 4, 0, Math.PI * 2);
  ctx.fill();
}

/** The lure bulb is drawn after the darkness pass so it glows. */
export function drawLureBulb(ctx: CanvasRenderingContext2D, x: number, y: number, t: number, glow = 1) {
  if (glow <= 0.02) return;
  const r = (6 + Math.sin(t * 4) * 1.2) * (0.5 + 0.5 * glow);
  ctx.save();
  ctx.globalAlpha = glow;
  ctx.shadowColor = '#FFF3A3';
  ctx.shadowBlur = 22 * glow;
  ctx.fillStyle = '#FFF6B8';
  ctx.beginPath();
  ctx.arc(x, y, r, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}
