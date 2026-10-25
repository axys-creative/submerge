import type { ItemKind } from '../data/items';
import { rrect } from '../util';

const GOLD = '#F6C445';
const GOLD_DARK = '#D99A1E';

/** Draws an item centered on the origin, about 30 px across. */
export function drawItem(ctx: CanvasRenderingContext2D, kind: ItemKind, t: number) {
  ctx.lineJoin = 'round';
  ctx.lineCap = 'round';
  switch (kind) {
    case 'seaweed':
      for (let i = -1; i <= 1; i++) {
        const sway = Math.sin(t * 1.8 + i * 1.3) * 7;
        ctx.strokeStyle = i === 0 ? '#58C474' : '#3FA35E';
        ctx.lineWidth = 6;
        ctx.beginPath();
        ctx.moveTo(i * 7, 14);
        ctx.quadraticCurveTo(i * 9 + sway * 0.5, 0, i * 6 + sway, -16 + Math.abs(i) * 5);
        ctx.stroke();
      }
      break;
    case 'shell':
      ctx.fillStyle = '#FFB59E';
      ctx.beginPath();
      ctx.moveTo(0, 10);
      ctx.arc(0, 10, 17, Math.PI * 1.1, Math.PI * 1.9);
      ctx.closePath();
      ctx.fill();
      ctx.strokeStyle = '#E48A73';
      ctx.lineWidth = 2;
      for (let a = 1.22; a < 1.8; a += 0.14) {
        ctx.beginPath();
        ctx.moveTo(0, 10);
        ctx.lineTo(Math.cos(a * Math.PI) * 16, 10 + Math.sin(a * Math.PI) * 16);
        ctx.stroke();
      }
      ctx.fillStyle = '#E48A73';
      ctx.beginPath();
      ctx.ellipse(0, 11, 6, 3.5, 0, 0, Math.PI * 2);
      ctx.fill();
      break;
    case 'boot':
      ctx.fillStyle = '#8A5A3B';
      ctx.beginPath();
      ctx.moveTo(-10, -14);
      ctx.lineTo(3, -14);
      ctx.lineTo(4, 1);
      ctx.lineTo(14, 4);
      ctx.quadraticCurveTo(17, 12, 10, 12);
      ctx.lineTo(-10, 12);
      ctx.closePath();
      ctx.fill();
      ctx.fillStyle = '#5E3B26';
      rrect(ctx, -11, 9, 26, 5, 2);
      ctx.fill();
      ctx.strokeStyle = '#E8C9A0';
      ctx.lineWidth = 2;
      for (const y of [-8, -3]) {
        ctx.beginPath();
        ctx.moveTo(-7, y);
        ctx.lineTo(1, y);
        ctx.stroke();
      }
      break;
    case 'bottle':
      ctx.save();
      ctx.rotate(-0.6);
      ctx.fillStyle = 'rgba(108,203,142,0.92)';
      rrect(ctx, -8, -8, 16, 24, 6);
      ctx.fill();
      rrect(ctx, -4, -16, 8, 10, 2);
      ctx.fill();
      ctx.fillStyle = '#C99A6B';
      rrect(ctx, -4, -21, 8, 6, 2);
      ctx.fill();
      ctx.fillStyle = '#FFF4D6';
      rrect(ctx, -4, -3, 8, 14, 3);
      ctx.fill();
      ctx.strokeStyle = 'rgba(255,255,255,0.6)';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(-5, -4);
      ctx.lineTo(-5, 10);
      ctx.stroke();
      ctx.restore();
      break;
    case 'coin':
      for (let i = 0; i < 3; i++) {
        ctx.fillStyle = GOLD_DARK;
        ctx.beginPath();
        ctx.ellipse(-6, 10 - i * 4, 10, 4, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = GOLD;
        ctx.beginPath();
        ctx.ellipse(-6, 8.5 - i * 4, 10, 4, 0, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.fillStyle = GOLD;
      ctx.strokeStyle = GOLD_DARK;
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      ctx.arc(7, -2, 10, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
      ctx.lineWidth = 1.8;
      ctx.beginPath();
      ctx.arc(7, -2, 5.5, 0, Math.PI * 2);
      ctx.stroke();
      break;
    case 'anchor':
      ctx.strokeStyle = '#8393AA';
      ctx.lineWidth = 5;
      ctx.beginPath();
      ctx.arc(0, -15, 5, 0, Math.PI * 2);
      ctx.moveTo(0, -10);
      ctx.lineTo(0, 13);
      ctx.moveTo(-9, -4);
      ctx.lineTo(9, -4);
      ctx.stroke();
      ctx.beginPath();
      ctx.arc(0, 0, 14, Math.PI * 0.15, Math.PI * 0.85);
      ctx.stroke();
      ctx.fillStyle = '#8393AA';
      for (const s of [-1, 1]) {
        ctx.beginPath();
        ctx.moveTo(s * 14, 0);
        ctx.lineTo(s * 17, 7);
        ctx.lineTo(s * 9, 6);
        ctx.closePath();
        ctx.fill();
      }
      break;
    case 'wheel':
      ctx.strokeStyle = '#A8693B';
      ctx.fillStyle = '#A8693B';
      ctx.lineWidth = 3.5;
      for (let i = 0; i < 8; i++) {
        const a = (i / 8) * Math.PI * 2 + 0.2;
        ctx.beginPath();
        ctx.moveTo(0, 0);
        ctx.lineTo(Math.cos(a) * 17, Math.sin(a) * 17);
        ctx.stroke();
        ctx.beginPath();
        ctx.arc(Math.cos(a) * 18, Math.sin(a) * 18, 2.8, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.lineWidth = 4.5;
      ctx.beginPath();
      ctx.arc(0, 0, 12, 0, Math.PI * 2);
      ctx.stroke();
      ctx.fillStyle = '#7E4A26';
      ctx.beginPath();
      ctx.arc(0, 0, 4.5, 0, Math.PI * 2);
      ctx.fill();
      break;
    case 'pearl':
      ctx.fillStyle = '#E890AE';
      ctx.beginPath();
      ctx.ellipse(0, 4, 17, 9, 0, 0, Math.PI);
      ctx.closePath();
      ctx.fill();
      ctx.fillStyle = '#F7BFD2';
      ctx.beginPath();
      ctx.ellipse(-2, 0, 17, 9, -0.4, Math.PI, Math.PI * 2);
      ctx.closePath();
      ctx.fill();
      ctx.fillStyle = '#FFFFFF';
      ctx.beginPath();
      ctx.arc(3, 1, 6.5, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#DDE5FF';
      ctx.beginPath();
      ctx.arc(5, 3, 3, 0, Math.PI * 2);
      ctx.fill();
      break;
    case 'goldbar':
      for (const [x, y] of [
        [-10, 9],
        [10, 9],
        [0, -1],
      ]) {
        ctx.fillStyle = GOLD;
        ctx.beginPath();
        ctx.moveTo(x - 11, y + 5);
        ctx.lineTo(x + 11, y + 5);
        ctx.lineTo(x + 8, y - 5);
        ctx.lineTo(x - 8, y - 5);
        ctx.closePath();
        ctx.fill();
        ctx.fillStyle = '#FFE08A';
        ctx.fillRect(x - 7, y - 5, 14, 3);
      }
      break;
    case 'gem':
      ctx.fillStyle = '#3FBFD9';
      ctx.beginPath();
      ctx.moveTo(0, -14);
      ctx.lineTo(13, -4);
      ctx.lineTo(8, 12);
      ctx.lineTo(-8, 12);
      ctx.lineTo(-13, -4);
      ctx.closePath();
      ctx.fill();
      ctx.fillStyle = '#8AE6F5';
      ctx.beginPath();
      ctx.moveTo(0, -14);
      ctx.lineTo(13, -4);
      ctx.lineTo(0, 0);
      ctx.closePath();
      ctx.fill();
      ctx.fillStyle = '#C8F5FC';
      ctx.beginPath();
      ctx.moveTo(-13, -4);
      ctx.lineTo(0, -14);
      ctx.lineTo(0, 0);
      ctx.closePath();
      ctx.fill();
      break;
    case 'idol':
      ctx.fillStyle = '#B98320';
      rrect(ctx, -13, 12, 26, 6, 2);
      ctx.fill();
      ctx.fillStyle = '#E8B23A';
      rrect(ctx, -9, -4, 18, 18, 4);
      ctx.fill();
      ctx.fillStyle = '#E9505C';
      ctx.beginPath();
      ctx.moveTo(-12, -18);
      ctx.lineTo(0, -28);
      ctx.lineTo(12, -18);
      ctx.closePath();
      ctx.fill();
      ctx.fillStyle = GOLD;
      rrect(ctx, -11, -20, 22, 18, 6);
      ctx.fill();
      ctx.fillStyle = '#5A3A12';
      ctx.fillRect(-6, -14, 4, 3);
      ctx.fillRect(2, -14, 4, 3);
      ctx.fillRect(-4, -8, 8, 2);
      break;
    case 'chest':
      ctx.fillStyle = '#A8693B';
      rrect(ctx, -19, -4, 38, 20, 4);
      ctx.fill();
      ctx.fillStyle = '#8A5530';
      rrect(ctx, -19, -17, 38, 14, [9, 9, 2, 2]);
      ctx.fill();
      ctx.fillStyle = GOLD;
      ctx.fillRect(-13, -17, 4, 33);
      ctx.fillRect(9, -17, 4, 33);
      rrect(ctx, -4, -7, 8, 9, 2);
      ctx.fill();
      break;
  }
}

export function drawSparkle(ctx: CanvasRenderingContext2D, x: number, y: number, s: number, alpha: number) {
  ctx.fillStyle = `rgba(255,255,255,${alpha})`;
  ctx.beginPath();
  ctx.moveTo(x, y - s);
  ctx.quadraticCurveTo(x, y, x + s, y);
  ctx.quadraticCurveTo(x, y, x, y + s);
  ctx.quadraticCurveTo(x, y, x - s, y);
  ctx.quadraticCurveTo(x, y, x, y - s);
  ctx.fill();
}
