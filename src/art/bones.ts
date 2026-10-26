import { rrect } from '../util';

/**
 * Reusable sea-floor remains of marine animals: whale skulls and skeletons, shark jaws, fish skeletons.
 * Each is drawn lying on the ground, facing right, with the origin at its base.
 */
export type BoneKind = 'skull' | 'jaw' | 'fish' | 'ribs' | 'spine' | 'bone' | 'skeleton';

export const BONE_KINDS: BoneKind[] = ['skull', 'jaw', 'fish', 'ribs', 'spine', 'bone', 'skeleton'];
/** How often each piece turns up when a zone scatters bones; they add up to 1. */
export const BONE_WEIGHTS: Record<BoneKind, number> = { skull: 0.14, jaw: 0.16, fish: 0.2, ribs: 0.14, spine: 0.1, bone: 0.16, skeleton: 0.1 };

const BONE = '#EDE6D6';
const SHADE = '#CDC3AE';
const HOLLOW = '#3E352E';

/** A whale skull about 130 px long: a big rounded oval cranium, a small eye socket, and a bowed lower jaw lined with teeth. */
function whaleSkull(ctx: CanvasRenderingContext2D) {
  // Lower jaw: a thick curve under the skull, with small teeth along its top edge.
  ctx.lineCap = 'round';
  ctx.strokeStyle = SHADE;
  ctx.lineWidth = 11;
  ctx.beginPath();
  ctx.moveTo(66, -5);
  ctx.quadraticCurveTo(10, 16, -48, 2);
  ctx.stroke();
  ctx.fillStyle = '#FBF8EE';
  for (let i = 0; i < 8; i++) {
    const u = 0.1 + i * 0.11;
    const x = (1 - u) * (1 - u) * 66 + 2 * u * (1 - u) * 10 + u * u * -48;
    const y = (1 - u) * (1 - u) * -5 + 2 * u * (1 - u) * 16 + u * u * 2;
    ctx.beginPath();
    ctx.moveTo(x - 3, y - 4);
    ctx.lineTo(x, y - 12);
    ctx.lineTo(x + 3, y - 4);
    ctx.closePath();
    ctx.fill();
  }
  // Cranium: a long rounded oval, fuller at the back and tapering to the snout.
  ctx.fillStyle = BONE;
  ctx.beginPath();
  ctx.moveTo(-66, -26);
  ctx.quadraticCurveTo(-66, -58, -26, -58);
  ctx.quadraticCurveTo(36, -58, 68, -26);
  ctx.quadraticCurveTo(76, -12, 62, -8);
  ctx.quadraticCurveTo(10, -2, -44, -4);
  ctx.quadraticCurveTo(-66, -6, -66, -26);
  ctx.closePath();
  ctx.fill();
  ctx.strokeStyle = 'rgba(62,53,46,0.18)';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(-34, -56);
  ctx.quadraticCurveTo(-12, -34, -22, -6);
  ctx.moveTo(18, -52);
  ctx.quadraticCurveTo(30, -34, 22, -8);
  ctx.stroke();
  ctx.fillStyle = HOLLOW;
  ctx.beginPath();
  ctx.ellipse(-44, -22, 6.5, 7.5, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.beginPath();
  ctx.ellipse(52, -22, 4, 2.4, 0.2, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = 'rgba(255,255,255,0.75)';
  ctx.lineWidth = 2.6;
  ctx.beginPath();
  ctx.moveTo(-58, -38);
  ctx.quadraticCurveTo(-54, -52, -34, -53);
  ctx.stroke();
}

/** A shark's open jaws with rows of triangular teeth, about 62 px across. */
function sharkJaw(ctx: CanvasRenderingContext2D) {
  const arc = (dir: 1 | -1) => {
    ctx.fillStyle = SHADE;
    ctx.beginPath();
    ctx.moveTo(-30, dir * -4);
    ctx.quadraticCurveTo(0, dir * -40, 30, dir * -4);
    ctx.quadraticCurveTo(0, dir * -18, -30, dir * -4);
    ctx.fill();
    ctx.fillStyle = '#FBF8EE';
    for (let i = 0; i < 9; i++) {
      const u = -0.8 + i * 0.2;
      const x = u * 28;
      const y = dir * (-4 - (1 - u * u) * 15);
      ctx.beginPath();
      ctx.moveTo(x - 3.2, y);
      ctx.lineTo(x, y - dir * -7.5);
      ctx.lineTo(x + 3.2, y);
      ctx.closePath();
      ctx.fill();
    }
  };
  ctx.translate(0, -26);
  arc(1);
  ctx.translate(0, 8);
  arc(-1);
}

/** A fish skeleton about 80 px long: skull, backbone, ribs and a forked tail. */
function fishSkeleton(ctx: CanvasRenderingContext2D) {
  ctx.translate(0, -12);
  ctx.lineCap = 'round';
  ctx.strokeStyle = BONE;
  ctx.lineWidth = 3.4;
  ctx.beginPath();
  ctx.moveTo(-30, 0);
  ctx.lineTo(24, 0);
  ctx.stroke();
  ctx.lineWidth = 2.4;
  for (let i = 0; i < 8; i++) {
    const x = -22 + i * 6;
    const h = 11 - Math.abs(i - 3) * 1.2;
    ctx.beginPath();
    ctx.moveTo(x, 0);
    ctx.quadraticCurveTo(x + 3, -h * 0.9, x - 1, -h);
    ctx.moveTo(x, 0);
    ctx.quadraticCurveTo(x + 3, h * 0.9, x - 1, h);
    ctx.stroke();
  }
  ctx.lineWidth = 2.8;
  ctx.beginPath();
  ctx.moveTo(-30, 0);
  ctx.lineTo(-44, -13);
  ctx.moveTo(-30, 0);
  ctx.lineTo(-44, 13);
  ctx.moveTo(-34, 0);
  ctx.lineTo(-44, 0);
  ctx.stroke();
  ctx.fillStyle = BONE;
  ctx.beginPath();
  ctx.moveTo(24, -3);
  ctx.quadraticCurveTo(30, -12, 40, -6);
  ctx.quadraticCurveTo(46, 0, 40, 6);
  ctx.quadraticCurveTo(30, 12, 24, 3);
  ctx.closePath();
  ctx.fill();
  ctx.fillStyle = HOLLOW;
  ctx.beginPath();
  ctx.arc(34, -2, 3.2, 0, Math.PI * 2);
  ctx.fill();
}

/** Vertebrae as chunky discs with a hollow in the middle, shrinking along the row. */
function vertebrae(ctx: CanvasRenderingContext2D, count: number, step: number, shrink = 0) {
  for (let i = 0; i < count; i++) {
    const s = 1 - shrink * (i / Math.max(1, count - 1));
    const x = i * step;
    const y = Math.sin(i * 0.45) * 3;
    ctx.fillStyle = SHADE;
    rrect(ctx, x - 8 * s, y - 8 * s, 16 * s, 18 * s, 6 * s);
    ctx.fill();
    ctx.fillStyle = BONE;
    rrect(ctx, x - 8 * s, y - 10 * s, 16 * s, 16 * s, 6 * s);
    ctx.fill();
    ctx.fillStyle = HOLLOW;
    ctx.beginPath();
    ctx.ellipse(x, y - 2 * s, 3 * s, 3.4 * s, 0, 0, Math.PI * 2);
    ctx.fill();
  }
}

function whaleSpine(ctx: CanvasRenderingContext2D) {
  ctx.translate(-56, -9);
  vertebrae(ctx, 8, 16, 0.25);
}

/** Big curved whale ribs rising from the backbone. */
function whaleRibs(ctx: CanvasRenderingContext2D, count = 6, tall = 62) {
  ctx.lineCap = 'round';
  for (let i = 0; i < count; i++) {
    const x = -40 + i * 15;
    const h = tall - Math.abs(i - (count - 1) / 2) * 9;
    for (const [color, w] of [[SHADE, 8.5], [BONE, 5.5]] as const) {
      ctx.strokeStyle = color;
      ctx.lineWidth = w;
      ctx.beginPath();
      ctx.moveTo(x, -10);
      ctx.quadraticCurveTo(x + 18, -h * 1.2, x + 34, -h * 0.35);
      ctx.stroke();
    }
  }
  ctx.save();
  ctx.translate(-40, -6);
  vertebrae(ctx, count + 1, 15);
  ctx.restore();
}

/** A single long curved bone, like a rib or a jaw bone. */
function curvedBone(ctx: CanvasRenderingContext2D) {
  ctx.lineCap = 'round';
  for (const [color, w] of [[SHADE, 12], [BONE, 8]] as const) {
    ctx.strokeStyle = color;
    ctx.lineWidth = w;
    ctx.beginPath();
    ctx.moveTo(-46, -6);
    ctx.quadraticCurveTo(0, -34, 48, -4);
    ctx.stroke();
  }
  ctx.fillStyle = BONE;
  for (const [x, y] of [[-46, -6], [48, -4]]) {
    ctx.beginPath();
    ctx.arc(x, y, 7, 0, Math.PI * 2);
    ctx.fill();
  }
}

/** A whole whale skeleton about 330 px long: skull, long backbone, rib cage and tail. */
function whaleSkeleton(ctx: CanvasRenderingContext2D) {
  ctx.save();
  ctx.translate(-150, -4);
  vertebrae(ctx, 12, 17, 0.5);
  ctx.restore();
  ctx.save();
  ctx.translate(-50, 0);
  ctx.scale(1.05, 1.05);
  whaleRibs(ctx, 5, 66);
  ctx.restore();
  ctx.save();
  ctx.translate(116, 0);
  ctx.scale(0.95, 0.95);
  whaleSkull(ctx);
  ctx.restore();
}

export function drawBones(ctx: CanvasRenderingContext2D, kind: BoneKind, size: number, tint: number, slope: number) {
  ctx.save();
  ctx.lineJoin = 'round';
  ctx.lineCap = 'round';
  ctx.rotate(slope);
  ctx.translate(0, 5 * size);
  ctx.scale(size, size);
  const tilt = (tint - 0.5) * 0.3;
  if (kind === 'skull') {
    ctx.rotate(tilt);
    whaleSkull(ctx);
  } else if (kind === 'jaw') {
    ctx.rotate(tilt);
    sharkJaw(ctx);
  } else if (kind === 'fish') {
    ctx.rotate(tilt);
    fishSkeleton(ctx);
  } else if (kind === 'ribs') whaleRibs(ctx);
  else if (kind === 'spine') whaleSpine(ctx);
  else if (kind === 'bone') {
    ctx.rotate(tilt);
    curvedBone(ctx);
  } else whaleSkeleton(ctx);
  ctx.restore();
}
