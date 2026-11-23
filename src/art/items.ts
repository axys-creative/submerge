import type { ItemKind } from '../data/items';
import { rrect } from '../util';

const GOLD = '#F6C445';
const GOLD_DARK = '#D99A1E';

/** Fills the current path; the first pass lays a darker, wider copy down as the outline (details outside the silhouette skip it). */
function paintShape(ctx: CanvasRenderingContext2D, pass: number, fill: string, line: string, width: number, base = true) {
  if (pass === 0) {
    if (!base) return;
    ctx.fillStyle = line;
    ctx.strokeStyle = line;
    ctx.lineWidth = width;
    ctx.fill();
    ctx.stroke();
  } else {
    ctx.fillStyle = fill;
    ctx.fill();
  }
}

const CARDBOARD_SCALE = 1.25;

function face(ctx: CanvasRenderingContext2D, pts: number[][], fill: string) {
  ctx.fillStyle = fill;
  ctx.beginPath();
  pts.forEach(([x, y], i) => (i ? ctx.lineTo(x, y) : ctx.moveTo(x, y)));
  ctx.closePath();
  ctx.fill();
  ctx.stroke();
}

/** Draws an item centered on the origin, about 30 px across, turned by `spin` radians (junk turns only while it floats). */
export function drawItem(ctx: CanvasRenderingContext2D, kind: ItemKind, t: number, spin = 0) {
  ctx.lineJoin = 'round';
  ctx.lineCap = 'round';
  ctx.rotate(spin);
  switch (kind) {
    case 'seaweed':
      for (const pass of [0, 1]) {
        for (let i = -1; i <= 1; i++) {
          const sway = Math.sin(t * 1.8 + i * 1.3) * 7;
          ctx.strokeStyle = pass ? (i === 0 ? '#58C474' : '#3FA35E') : '#1F6B3A';
          ctx.lineWidth = pass ? 6 : 7.2;
          ctx.beginPath();
          ctx.moveTo(i * 7, 14);
          ctx.quadraticCurveTo(i * 9 + sway * 0.5, 0, i * 6 + sway, -16 + Math.abs(i) * 5);
          ctx.stroke();
        }
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
    case 'box': {
      ctx.scale(CARDBOARD_SCALE, CARDBOARD_SCALE);
      ctx.strokeStyle = '#8A5428';
      ctx.lineWidth = 0.9;
      face(ctx, [[-13, -3], [-8, -8], [12, -8], [7, -3]], '#DDAA62');
      face(ctx, [[7, -3], [12, -8], [12, 7], [7, 12]], '#A8703A');
      face(ctx, [[-13, -3], [7, -3], [7, 12], [-13, 12]], '#C98E4B');
      ctx.fillStyle = 'rgba(255,225,170,0.35)';
      rrect(ctx, -11, -1, 6, 11, 2);
      ctx.fill();
      ctx.lineWidth = 0.8;
      face(ctx, [[-4, -3], [0, -3], [5, -8], [1, -8]], '#E8C68E');
      ctx.strokeStyle = '#8A5428';
      ctx.lineWidth = 0.8;
      ctx.beginPath();
      ctx.moveTo(-1.5, -3);
      ctx.lineTo(-1.5, 3);
      ctx.moveTo(-10, 8);
      ctx.lineTo(-8, 7);
      ctx.moveTo(3, 5);
      ctx.lineTo(3, 9);
      ctx.stroke();
      break;
    }
    case 'openbox': {
      ctx.scale(CARDBOARD_SCALE, CARDBOARD_SCALE);
      ctx.strokeStyle = '#8A5428';
      ctx.lineWidth = 0.9;
      face(ctx, [[-13, -3], [-8, -8], [12, -8], [7, -3]], '#7A4E26');
      face(ctx, [[-8, -8], [-6, -17], [14, -15], [12, -8]], '#D9A862');
      face(ctx, [[-13, -3], [-8, -8], [-17, -10], [-21, -4]], '#C98E4B');
      face(ctx, [[7, -3], [12, -8], [12, 7], [7, 12]], '#A8703A');
      face(ctx, [[-13, -3], [-5, -3.6], [-2, -2], [3, -3.4], [7, -3], [7, 12], [-13, 12]], '#C98E4B');
      face(ctx, [[7, -3], [12, -8], [18, -6], [11, 0]], '#DDAA62');
      face(ctx, [[-13, -3], [-5, -3.6], [-3, 3], [-14, 2]], '#E0B374');
      ctx.fillStyle = 'rgba(255,225,170,0.3)';
      rrect(ctx, -11, 4, 5, 6, 2);
      ctx.fill();
      ctx.lineWidth = 0.8;
      ctx.beginPath();
      ctx.moveTo(-2, -2);
      ctx.lineTo(0, 3);
      ctx.lineTo(-1.5, 6);
      ctx.moveTo(-9, 11);
      ctx.lineTo(-7, 9);
      ctx.moveTo(3, 6);
      ctx.lineTo(3, 10);
      ctx.moveTo(9.5, 0);
      ctx.lineTo(10, 5);
      ctx.stroke();
      break;
    }
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
      for (const pass of [0, 1]) {
        const grow = pass ? 0 : 1.2;
        ctx.strokeStyle = pass ? '#8393AA' : '#4C586B';
        ctx.fillStyle = ctx.strokeStyle;
        ctx.lineWidth = 5 + grow;
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
        ctx.lineWidth = grow;
        for (const s of [-1, 1]) {
          ctx.beginPath();
          ctx.moveTo(s * 14, 0);
          ctx.lineTo(s * 17, 7);
          ctx.lineTo(s * 9, 6);
          ctx.closePath();
          ctx.fill();
          if (grow) ctx.stroke();
        }
      }
      break;
    case 'wheel':
      ctx.scale(0.75, 0.75);
      for (const pass of [0, 1]) {
        const grow = pass ? 0 : 1.6;
        ctx.strokeStyle = pass ? '#A8693B' : '#5E3519';
        ctx.fillStyle = ctx.strokeStyle;
        ctx.lineWidth = 3.5 + grow;
        for (let i = 0; i < 8; i++) {
          const a = (i / 8) * Math.PI * 2 + 0.2;
          ctx.beginPath();
          ctx.moveTo(0, 0);
          ctx.lineTo(Math.cos(a) * 17, Math.sin(a) * 17);
          ctx.stroke();
          ctx.beginPath();
          ctx.arc(Math.cos(a) * 18, Math.sin(a) * 18, 2.8 + grow / 2, 0, Math.PI * 2);
          ctx.fill();
        }
        ctx.lineWidth = 4.5 + grow;
        ctx.beginPath();
        ctx.arc(0, 0, 12, 0, Math.PI * 2);
        ctx.stroke();
      }
      ctx.fillStyle = '#7E4A26';
      ctx.beginPath();
      ctx.arc(0, 0, 4.5, 0, Math.PI * 2);
      ctx.fill();
      break;
    case 'pearl':
      ctx.scale(0.5, 0.5);
      for (const pass of [0, 1]) {
        const paint = (fill: string, base = true) => paintShape(ctx, pass, fill, '#A8506E', 2.4, base);
        ctx.beginPath();
        ctx.ellipse(0, 4, 17, 9, 0, 0, Math.PI);
        ctx.closePath();
        paint('#E890AE');
        ctx.beginPath();
        ctx.ellipse(-2, 0, 17, 9, -0.4, Math.PI, Math.PI * 2);
        ctx.closePath();
        paint('#F7BFD2');
        ctx.beginPath();
        ctx.arc(3, 1, 6.5, 0, Math.PI * 2);
        paint('#FFFFFF', false);
        ctx.beginPath();
        ctx.arc(5, 3, 3, 0, Math.PI * 2);
        paint('#DDE5FF', false);
      }
      break;
    case 'goldbar':
      for (const [x, y] of [
        [-10, 9],
        [10, 9],
        [0, -1],
      ]) {
        for (const pass of [0, 1]) {
          ctx.beginPath();
          ctx.moveTo(x - 11, y + 5);
          ctx.lineTo(x + 11, y + 5);
          ctx.lineTo(x + 8, y - 5);
          ctx.lineTo(x - 8, y - 5);
          ctx.closePath();
          paintShape(ctx, pass, GOLD, '#9A6A12', 1.2);
        }
        ctx.fillStyle = '#FFE08A';
        ctx.fillRect(x - 7, y - 5, 14, 3);
      }
      break;
    case 'gem':
      ctx.scale(0.5, 0.5);
      for (const pass of [0, 1]) {
        const paint = (fill: string, base = true) => paintShape(ctx, pass, fill, '#1E7C93', 2.4, base);
        ctx.beginPath();
        ctx.moveTo(0, -14);
        ctx.lineTo(13, -4);
        ctx.lineTo(8, 12);
        ctx.lineTo(-8, 12);
        ctx.lineTo(-13, -4);
        ctx.closePath();
        paint('#3FBFD9');
        ctx.beginPath();
        ctx.moveTo(0, -14);
        ctx.lineTo(13, -4);
        ctx.lineTo(0, 0);
        ctx.closePath();
        paint('#8AE6F5', false);
        ctx.beginPath();
        ctx.moveTo(-13, -4);
        ctx.lineTo(0, -14);
        ctx.lineTo(0, 0);
        ctx.closePath();
        paint('#C8F5FC', false);
      }
      break;
    case 'diamond':
      ctx.scale(0.75, 0.75);
      for (const pass of [0, 1]) {
        const paint = (fill: string, base = true) => paintShape(ctx, pass, fill, '#4F8DB0', 1.6, base);
        ctx.beginPath();
        ctx.moveTo(-12, -4);
        ctx.lineTo(-7, -12);
        ctx.lineTo(7, -12);
        ctx.lineTo(12, -4);
        ctx.lineTo(0, 13);
        ctx.closePath();
        paint('#BFE9FF');
        ctx.beginPath();
        ctx.moveTo(-7, -12);
        ctx.lineTo(0, -4);
        ctx.lineTo(-12, -4);
        ctx.closePath();
        paint('#FFFFFF', false);
        ctx.beginPath();
        ctx.moveTo(7, -12);
        ctx.lineTo(0, -4);
        ctx.lineTo(7, -4);
        ctx.closePath();
        paint('#FFFFFF', false);
        ctx.beginPath();
        ctx.moveTo(-12, -4);
        ctx.lineTo(0, -4);
        ctx.lineTo(0, 13);
        ctx.closePath();
        paint('#8FCBEA', false);
      }
      break;
    case 'idol': {
      ctx.translate(0, -4.5);
      const GOLDEN = '#FFD21F';
      const SHADOW = '#B8862B';
      const ROBE = '#FBC41A';
      const FOLD = '#D9A016';
      const INK = '#4A3008';
      for (const pass of [0, 1]) {
        const paint = (fill: string) => {
          paintShape(ctx, pass, fill, INK, 1.2);
          if (pass) {
            ctx.strokeStyle = INK;
            ctx.lineWidth = 0.6;
            ctx.stroke();
          }
        };
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
        ctx.beginPath();
        ctx.rect(-14, 14, 28, 2);
        paint(GOLDEN);
        for (let i = 0; i < 9; i++) {
          const cx = -12.4 + i * 3.1;
          ctx.beginPath();
          ctx.moveTo(cx - 1.55, 16);
          ctx.lineTo(cx, 14.5);
          ctx.lineTo(cx + 1.55, 16);
          ctx.lineTo(cx + 1.1, 18.3);
          ctx.lineTo(cx, 20.3);
          ctx.lineTo(cx - 1.1, 18.3);
          ctx.closePath();
          paint(GOLDEN);
        }
        ctx.beginPath();
        ctx.moveTo(-6.4, -5.6);
        ctx.quadraticCurveTo(-3.4, -6.6, -1.3, -7.4);
        ctx.lineTo(2.5, -7.4);
        ctx.quadraticCurveTo(5.6, -6.6, 7.6, -5.2);
        ctx.lineTo(7.4, 4);
        ctx.lineTo(6, 9);
        ctx.lineTo(-5, 9);
        ctx.lineTo(-6.6, 2);
        ctx.closePath();
        paint(GOLDEN);
        ctx.beginPath();
        ctx.moveTo(2.5, -7.4);
        ctx.quadraticCurveTo(5.6, -6.6, 7.6, -5.2);
        ctx.lineTo(7.4, 4);
        ctx.lineTo(6, 9);
        ctx.lineTo(-3.8, 8.6);
        ctx.quadraticCurveTo(-3.6, 0, 2.5, -7.4);
        ctx.closePath();
        paint(ROBE);
        ctx.beginPath();
        ctx.moveTo(-13.8, 12.2);
        ctx.quadraticCurveTo(-14, 9.6, -8.5, 8.2);
        ctx.lineTo(8, 8.2);
        ctx.quadraticCurveTo(14, 9.6, 13.9, 12.2);
        ctx.quadraticCurveTo(13.8, 14.2, 11, 14.2);
        ctx.lineTo(-11, 14.2);
        ctx.quadraticCurveTo(-13.8, 14.2, -13.8, 12.2);
        ctx.closePath();
        paint(GOLDEN);
        for (const [pts, w] of [
          [[[-6.6, -4.8], [-7.6, 5], [-7.2, 11]], 3.6],
          [[[7.2, -4.6], [7.9, 3.5], [4.5, 6.8], [-1.5, 8.6]], 3.6],
        ] as const) {
          for (const fill of pass ? [INK, GOLDEN] : [INK]) {
            ctx.strokeStyle = fill;
            ctx.lineWidth = fill === INK ? w + (pass ? 0.9 : 1.2) : w;
            ctx.beginPath();
            pts.forEach(([x, y], i) => (i ? ctx.lineTo(x, y) : ctx.moveTo(x, y)));
            ctx.stroke();
          }
        }
        ctx.beginPath();
        ctx.ellipse(-7.3, 12.4, 1.5, 2.3, 0, 0, Math.PI * 2);
        paint(GOLDEN);
        ctx.beginPath();
        ctx.ellipse(-0.5, 8.8, 3.4, 1.2, 0, 0, Math.PI * 2);
        paint(SHADOW);
        ctx.beginPath();
        ctx.rect(-1.3, -8.6, 3.8, 1.6);
        paint(GOLDEN);
        for (const x of [-2.9, 3.5]) {
          ctx.beginPath();
          ctx.ellipse(x, -10.2, 0.8, 2, 0, 0, Math.PI * 2);
          paint(GOLDEN);
        }
        ctx.beginPath();
        ctx.ellipse(0.3, -11, 2.9, 3, 0, 0, Math.PI * 2);
        paint(GOLDEN);
        ctx.beginPath();
        ctx.ellipse(0.4, -14, 3.9, 2.4, 0, 0, Math.PI * 2);
        for (let i = 0; i < 7; i++) {
          const a = Math.PI * (1.05 + i * 0.15);
          ctx.moveTo(0.4 + Math.cos(a) * 3.9 + 1.1, -14 + Math.sin(a) * 2.4);
          ctx.arc(0.4 + Math.cos(a) * 3.9, -14 + Math.sin(a) * 2.4, 1.1, 0, Math.PI * 2);
        }
        paint('#F0B90F');
        ctx.beginPath();
        ctx.arc(0.5, -16.8, 1.5, 0, Math.PI * 2);
        paint('#F0B90F');
        ctx.beginPath();
        ctx.moveTo(-0.8, -17.6);
        ctx.lineTo(0.6, -20.6);
        ctx.lineTo(2, -17.6);
        ctx.closePath();
        paint(GOLDEN);
      }
      ctx.fillStyle = SHADOW;
      ctx.beginPath();
      ctx.moveTo(-4.4, -3.2);
      ctx.lineTo(-2.8, -2);
      ctx.lineTo(-3.9, 2);
      ctx.lineTo(-5.2, 0);
      ctx.closePath();
      ctx.fill();
      ctx.lineCap = 'round';
      ctx.strokeStyle = FOLD;
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(1.8, -6.6);
      ctx.quadraticCurveTo(-2.4, -1.6, -2.6, 6.8);
      ctx.stroke();
      ctx.lineWidth = 0.6;
      ctx.beginPath();
      ctx.moveTo(3.6, -5.8);
      ctx.quadraticCurveTo(0, -0.8, -0.6, 7.2);
      ctx.moveTo(5.2, -4.2);
      ctx.quadraticCurveTo(2.4, 0.4, 2, 7.6);
      ctx.moveTo(-3, 8);
      ctx.quadraticCurveTo(1.5, 8.7, 6, 8.2);
      ctx.stroke();
      ctx.strokeStyle = SHADOW;
      ctx.lineWidth = 0.9;
      ctx.beginPath();
      ctx.moveTo(-5.6, -3.6);
      ctx.lineTo(-6, 5);
      ctx.lineTo(-5.8, 10.4);
      ctx.moveTo(5.8, -2.6);
      ctx.quadraticCurveTo(6.2, 3.2, 3.6, 5.8);
      ctx.stroke();
      ctx.strokeStyle = INK;
      ctx.lineWidth = 0.75;
      ctx.beginPath();
      ctx.moveTo(2.4, -7.2);
      ctx.quadraticCurveTo(-3.4, -1.5, -3.8, 8.4);
      ctx.moveTo(-1.7, -11.4);
      ctx.quadraticCurveTo(-0.9, -11.9, -0.2, -11.4);
      ctx.moveTo(1.3, -11.4);
      ctx.quadraticCurveTo(2, -11.9, 2.7, -11.4);
      ctx.moveTo(0.4, -11);
      ctx.lineTo(0.2, -9.9);
      ctx.moveTo(-0.3, -9.2);
      ctx.lineTo(0.9, -9.2);
      ctx.lineWidth = 0.6;
      ctx.moveTo(-8.4, 4.4);
      ctx.quadraticCurveTo(-7.5, 5.4, -6.2, 4.6);
      ctx.moveTo(6.4, 3);
      ctx.quadraticCurveTo(7.6, 4.4, 9.2, 3.4);
      for (const x of [-7.9, -7.3, -6.7]) {
        ctx.moveTo(x, 12.8);
        ctx.lineTo(x - 0.1, 13.9);
      }
      ctx.moveTo(-5.9, 11.6);
      ctx.lineTo(-6.2, 12.8);
      for (const x of [-2.6, -1.6, -0.6, 0.4]) {
        ctx.moveTo(x, 8.4);
        ctx.lineTo(x + 0.1, 9.5);
      }
      ctx.moveTo(1.8, 8.4);
      ctx.quadraticCurveTo(2.6, 8.8, 3.2, 8.1);
      ctx.stroke();
      ctx.strokeStyle = 'rgba(255,255,255,0.7)';
      ctx.lineWidth = 0.9;
      ctx.beginPath();
      ctx.moveTo(6.3, -4.6);
      ctx.lineTo(6.7, -2.4);
      ctx.moveTo(-6, -3.4);
      ctx.lineTo(-6.1, -0.6);
      ctx.stroke();
      break;
    }
    case 'chest':
      for (const pass of [0, 1]) {
        rrect(ctx, -19, -4, 38, 20, 4);
        paintShape(ctx, pass, '#A8693B', '#5C3515', 1.2);
        rrect(ctx, -19, -17, 38, 14, [9, 9, 2, 2]);
        paintShape(ctx, pass, '#8A5530', '#5C3515', 1.2);
      }
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
