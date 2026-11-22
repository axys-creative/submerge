import type { ItemKind } from '../data/items';
import { rrect } from '../util';

const GOLD = '#F6C445';
const GOLD_DARK = '#D99A1E';

/** Draws an item centered on the origin, about 30 px across, turned by `spin` radians (junk turns only while it floats). */
export function drawItem(ctx: CanvasRenderingContext2D, kind: ItemKind, t: number, spin = 0) {
  ctx.lineJoin = 'round';
  ctx.lineCap = 'round';
  ctx.rotate(spin);
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
      ctx.scale(0.5, 0.5);
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
      ctx.save();
      ctx.scale(0.75, 0.75);
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
      ctx.restore();
      break;
    case 'bottle':
      ctx.save();
      ctx.scale(0.75, 0.75);
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
    case 'can':
      ctx.save();
      ctx.scale(0.75, 0.75);
      ctx.rotate(0.55);
      ctx.fillStyle = '#B7BEC9';
      rrect(ctx, -9, -11, 18, 24, 3);
      ctx.fill();
      ctx.fillStyle = '#D9503F';
      ctx.fillRect(-9, -3, 18, 8);
      ctx.fillStyle = '#8D95A3';
      ctx.beginPath();
      ctx.ellipse(0, -11, 9, 3.5, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = 'rgba(40,45,60,0.55)';
      ctx.beginPath();
      ctx.moveTo(-9, 4);
      ctx.lineTo(-3, 7);
      ctx.lineTo(-9, 10);
      ctx.closePath();
      ctx.fill();
      ctx.strokeStyle = 'rgba(255,255,255,0.5)';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(5, -8);
      ctx.lineTo(5, -4);
      ctx.stroke();
      ctx.restore();
      break;
    case 'sack': {
      const color = '#A8DAE8';
      const sway = Math.sin(t * 1.8 + 1.4) * 0.5;
      ctx.save();
      ctx.rotate(Math.sin(t * 0.9) * 0.07);
      ctx.fillStyle = color;
      ctx.strokeStyle = color;
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(-7.5, -14.5);
      ctx.quadraticCurveTo(-5, -17.5, -1.5, -16);
      ctx.quadraticCurveTo(4, -14.5, 9.5, -12.5);
      ctx.quadraticCurveTo(13, -11.5, 13.8, -8.5);
      ctx.bezierCurveTo(13.8, -6, 10.2, -3, 9.2, 3);
      ctx.lineTo(8.8 + sway, 14.4);
      ctx.quadraticCurveTo(8.7 + sway, 17.6, 5.4 + sway, 17.6);
      ctx.quadraticCurveTo(2.2 + sway, 17.6, 2 + sway, 14.4);
      ctx.lineTo(1.8, 4.4);
      ctx.quadraticCurveTo(1.6, 1.8, -3, 2.2);
      ctx.quadraticCurveTo(-6, 2.5, -8, 3);
      ctx.quadraticCurveTo(-10.5, -4, -9.5, -8);
      ctx.quadraticCurveTo(-9, -12, -7.5, -14.5);
      ctx.closePath();
      ctx.roundRect(4 + sway, 7, 3, 6.4, 1.3);
      ctx.fill('evenodd');
      const leg = (x: number, y: number, rot: number) => {
        ctx.save();
        ctx.translate(x, y);
        ctx.rotate(rot);
        ctx.beginPath();
        ctx.roundRect(-3.4, -6.5, 6.8, 13, 2.8);
        ctx.roundRect(-1.3, -1.2, 2.6, 6, 1.2);
        ctx.fill('evenodd');
        ctx.restore();
      };
      leg(-9.6, 7, 0.42 + Math.sin(t * 1.8) * 0.06);
      ctx.restore();
      break;
    }
    case 'jug': {
      ctx.save();
      ctx.scale(0.75, 0.75);
      ctx.rotate(-0.25);
      ctx.fillStyle = '#4A90C8';
      ctx.beginPath();
      ctx.moveTo(-4.4, -8.6);
      ctx.quadraticCurveTo(-8.8, -3, -8.7, 6);
      ctx.quadraticCurveTo(-8.8, 12, -6, 14.6);
      ctx.quadraticCurveTo(0, 16.2, 6, 14.6);
      ctx.quadraticCurveTo(8.8, 12, 8.7, 4);
      ctx.quadraticCurveTo(8.2, -3, 4.4, -8.6);
      ctx.closePath();
      const hole = { x: -2.6, y: -2.4, rx: 4.2, ry: 2.6, rot: -0.6 };
      ctx.moveTo(hole.x + hole.rx * Math.cos(hole.rot), hole.y + hole.rx * Math.sin(hole.rot));
      ctx.ellipse(hole.x, hole.y, hole.rx, hole.ry, hole.rot, 0, Math.PI * 2);
      ctx.fill('evenodd');
      ctx.save();
      ctx.clip('evenodd');
      ctx.fillStyle = '#86B9DE';
      ctx.fillRect(5.2, -9, 4, 26);
      ctx.fillStyle = '#3B73A8';
      ctx.beginPath();
      ctx.moveTo(-9, 2);
      ctx.quadraticCurveTo(-7.4, 12, 5, 15.4);
      ctx.lineTo(-9, 16);
      ctx.closePath();
      ctx.fill();
      ctx.restore();
      ctx.strokeStyle = '#3B73A8';
      ctx.lineWidth = 1.3;
      ctx.beginPath();
      ctx.ellipse(hole.x, hole.y, hole.rx, hole.ry, hole.rot, 0, Math.PI * 2);
      ctx.stroke();
      ctx.fillStyle = '#707074';
      rrect(ctx, -4.8, -12.2, 9.6, 3.8, 0.8);
      ctx.fill();
      ctx.fillStyle = '#B9BCC1';
      rrect(ctx, -4.3, -15.2, 8.6, 3.6, 1.6);
      ctx.fill();
      ctx.restore();
      break;
    }
    case 'canister': {
      ctx.save();
      ctx.rotate(0.22);
      ctx.fillStyle = '#D8473E';
      ctx.beginPath();
      ctx.moveTo(-12, -12);
      ctx.quadraticCurveTo(-12, -13.7, -10.3, -13.7);
      ctx.lineTo(0.9, -13.7);
      ctx.lineTo(7.2, -8.2);
      ctx.quadraticCurveTo(12.3, -4, 12.2, 6);
      ctx.lineTo(12.2, 10);
      ctx.quadraticCurveTo(12.2, 14.3, 7, 14.3);
      ctx.lineTo(-6.5, 14.3);
      ctx.quadraticCurveTo(-12, 14.3, -12, 9);
      ctx.closePath();
      ctx.moveTo(-5.3, -12.5);
      ctx.lineTo(-0.3, -12.5);
      ctx.lineTo(4, -10);
      ctx.lineTo(-3.9, -10);
      ctx.closePath();
      ctx.fill('evenodd');
      ctx.save();
      ctx.clip('evenodd');
      ctx.fillStyle = '#BF3A33';
      ctx.fillRect(-12.2, -14, 4.8, 30);
      ctx.fillStyle = '#E0554B';
      ctx.fillRect(-7.4, -14, 14.8, 30);
      ctx.fillStyle = '#C93F37';
      ctx.fillRect(7.4, -14, 5.2, 30);
      ctx.restore();
      ctx.strokeStyle = '#A83029';
      ctx.lineWidth = 1.2;
      ctx.beginPath();
      ctx.moveTo(-5.3, -12.5);
      ctx.lineTo(-0.3, -12.5);
      ctx.lineTo(4, -10);
      ctx.lineTo(-3.9, -10);
      ctx.closePath();
      ctx.stroke();
      ctx.save();
      ctx.translate(8.4, -9.4);
      ctx.rotate(0.78);
      ctx.fillStyle = '#A83029';
      rrect(ctx, -1.8, -3.2, 3.6, 4, 0.8);
      ctx.fill();
      ctx.fillStyle = '#F2C230';
      rrect(ctx, -2.4, -5.4, 4.8, 2.8, 0.9);
      ctx.fill();
      ctx.restore();
      ctx.restore();
      break;
    }
    case 'tire':
      ctx.fillStyle = '#2B2B33';
      ctx.beginPath();
      ctx.arc(0, 0, 16, 0, Math.PI * 2);
      ctx.arc(0, 0, 7, 0, Math.PI * 2, true);
      ctx.fill('evenodd');
      ctx.strokeStyle = '#4A4A56';
      ctx.lineWidth = 2;
      for (let a = 0; a < Math.PI * 2; a += Math.PI / 6) {
        ctx.beginPath();
        ctx.moveTo(Math.cos(a) * 12, Math.sin(a) * 12);
        ctx.lineTo(Math.cos(a) * 16, Math.sin(a) * 16);
        ctx.stroke();
      }
      ctx.strokeStyle = 'rgba(255,255,255,0.25)';
      ctx.beginPath();
      ctx.arc(0, 0, 13, Math.PI * 1.1, Math.PI * 1.45);
      ctx.stroke();
      break;
    case 'coin':
      ctx.scale(0.5, 0.5);
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
      ctx.scale(0.75, 0.75);
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
      ctx.scale(0.5, 0.5);
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
    case 'diamond':
      ctx.fillStyle = '#BFE9FF';
      ctx.beginPath();
      ctx.moveTo(-12, -4);
      ctx.lineTo(-7, -12);
      ctx.lineTo(7, -12);
      ctx.lineTo(12, -4);
      ctx.lineTo(0, 13);
      ctx.closePath();
      ctx.fill();
      ctx.fillStyle = '#FFFFFF';
      ctx.beginPath();
      ctx.moveTo(-7, -12);
      ctx.lineTo(0, -4);
      ctx.lineTo(-12, -4);
      ctx.closePath();
      ctx.fill();
      ctx.beginPath();
      ctx.moveTo(7, -12);
      ctx.lineTo(0, -4);
      ctx.lineTo(7, -4);
      ctx.closePath();
      ctx.fill();
      ctx.fillStyle = '#8FCBEA';
      ctx.beginPath();
      ctx.moveTo(-12, -4);
      ctx.lineTo(0, -4);
      ctx.lineTo(0, 13);
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
