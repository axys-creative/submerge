/** The sprite is drawn from a reference image in its pixels, then shrunk by this much; it stands about 170 px tall. */
const K = 0.18;
const CX = 994;
const CY = 527;
/** How much wider the body is than the reference image, and how far its edges (and what hangs off them) move out as a result, in image pixels. */
const WIDEN = 1.5;
const SHIFT = (CX - 893) * (WIDEN - 1);
const wx = (x: number) => CX + (x - CX) * WIDEN;
/** Centers in the picture's pixels, after widening: the pilot window and the hook on top. */
const WINDOW = { x: 958, y: 880 };
const HOOK_AT = { x: 994, y: 228 };

/**
 * Turns a point in the sprite's own space to where it lands at `pose` (1 upright, 0 lying with its top toward the front).
 * `lying` is true while it hangs from the ship; in the water the sprite is mirrored so the utility arm leads.
 */
export function challengerPoint(x: number, y: number, pose: number, lying: boolean) {
  const a = (1 - pose) * (Math.PI / 2);
  const px = x * Math.cos(a) - y * Math.sin(a);
  return { x: lying ? px : -px, y: x * Math.sin(a) + y * Math.cos(a) };
}

/** Where the front spotlight sits in the water: the flood lights on the utility-arm side. */
export const challengerLamp = (pose: number) => challengerPoint(-22 - SHIFT * K, -19, pose, false);
/** The booms swing out from the hull when the lights come on: folded down along the side at 0, straight out at 1. */
const swing = (out: number) => -(1 - out) * (Math.PI / 2);

/** Where each boom hinges on the hull and where its light sits when fully out, in the sprite's own space: one boom reaches toward the viewer, one away. */
const BOOMS = [
  { root: { x: -14.8 - SHIFT * K, y: 45.5 }, reach: { x: -45.7, y: 10.5 } },
  { root: { x: -13.3 - SHIFT * K, y: 40.9 }, reach: { x: -39.6, y: -1.1 } },
];
export const challengerBoomTips = (pose: number, out: number) =>
  BOOMS.map((b) => {
    const th = swing(out);
    const x = b.root.x + b.reach.x * Math.cos(th) - b.reach.y * Math.sin(th);
    const y = b.root.y + b.reach.x * Math.sin(th) + b.reach.y * Math.cos(th);
    return challengerPoint(x, y, pose, false);
  });

/** Radius of the pilot window's glass in the sprite's own space, so its glow stays inside the rim. */
export const CHALLENGER_GLASS = 18 * K;
export const CHALLENGER_RIM = 24 * K;

/** The two dive weights hang snugly side by side under the base, so close their edges overlap a little. */
const WEIGHT_X = 7;
const WEIGHT_Y = 89;
export const challengerWeights = (pose: number) => [-WEIGHT_X, WEIGHT_X].map((x) => challengerPoint(x, WEIGHT_Y, pose, false));

/** Where the pilot window sits in the water, for its glow. */
export const challengerViewport = (pose: number) => challengerPoint((WINDOW.x - CX) * K, (WINDOW.y - CY) * K, pose, false);

/** Where the crane hooks on while it lies on the ship: the side facing up, near the middle. */
export const CHALLENGER_HOOK = { x: -18 - SHIFT * K, y: -10 };
/** The base of the sub, where its thrusters blow bubbles and the weights hang. */
export const CHALLENGER_BASE = { x: 0, y: 81 };

const DARK = '#16181B';

/** The Deepsea Challenger skin: a tall green research sub whose front is the side with the utility arm and flood lights, and whose back carries two stabilizing fins. It lies on its side while hooked to the ship and rights itself in the water (`pose` 0 to 1). */
export function drawChallenger(ctx: CanvasRenderingContext2D, pose: number, lying: boolean, out: number, weight: ((ctx: CanvasRenderingContext2D) => void) | null) {
  const a = (1 - pose) * (Math.PI / 2);
  ctx.save();
  ctx.scale(lying ? 1 : -1, 1);
  ctx.rotate(a);
  if (weight) {
    for (const x of [-WEIGHT_X, WEIGHT_X]) {
      ctx.save();
      ctx.translate(x, WEIGHT_Y);
      weight(ctx);
      ctx.restore();
    }
  }
  ctx.scale(K, K);
  ctx.translate(-CX, -CY);
  ctx.lineJoin = 'round';
  ctx.lineCap = 'round';

  const boom = (pts: [number, number][]) => {
    ctx.fillStyle = '#1F2226';
    ctx.beginPath();
    pts.forEach(([x, y], i) => (i ? ctx.lineTo(x, y) : ctx.moveTo(x, y)));
    ctx.closePath();
    ctx.fill();
    ctx.strokeStyle = '#4A4F57';
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.moveTo(pts[0][0], pts[0][1]);
    ctx.lineTo(pts[1][0], pts[1][1]);
    ctx.stroke();
  };
  ctx.save();
  ctx.translate(SHIFT, 0);
  boom([[1090, 152], [1243, 158], [1243, 183], [1098, 196]]);
  boom([[1090, 890], [1232, 925], [1236, 950], [1096, 928]]);
  ctx.restore();

  // Flood lights on the front edge.
  ctx.save();
  ctx.translate(-SHIFT, 0);
  for (const y of [372, 412, 452, 492]) {
    ctx.fillStyle = DARK;
    ctx.fillRect(872, y, 24, 14);
    ctx.fillStyle = '#FFF1B0';
    ctx.beginPath();
    ctx.arc(874, y + 7, 6, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.restore();

  // The far utility boom, reaching away from the viewer: thinner and tucked behind the body.
  const light = (x: number, y: number, r: number) => {
    ctx.fillStyle = 'rgba(255,241,176,0.3)';
    ctx.beginPath();
    ctx.arc(x, y, r * 1.9, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#FFF1B0';
    ctx.beginPath();
    ctx.arc(x, y, r, 0, Math.PI * 2);
    ctx.fill();
  };
  ctx.save();
  ctx.translate(-SHIFT, 0);
  ctx.save();
  ctx.translate(920, 754);
  ctx.rotate(swing(out));
  ctx.translate(-920, -754);
  ctx.strokeStyle = DARK;
  ctx.lineWidth = 10;
  ctx.beginPath();
  ctx.moveTo(920, 754);
  ctx.lineTo(748, 748);
  ctx.stroke();
  ctx.fillStyle = DARK;
  ctx.beginPath();
  ctx.roundRect(696, 733, 58, 30, 10);
  ctx.fill();
  ctx.strokeStyle = '#6A7078';
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(840, 750);
  ctx.lineTo(910, 752);
  ctx.stroke();
  light(700, 748, 8.5);
  ctx.restore();
  ctx.restore();

  // Body: a tall slab with a sloped shoulder at the top back.
  const body = () => {
    ctx.beginPath();
    ctx.moveTo(893, 770);
    ctx.lineTo(893, 172);
    ctx.quadraticCurveTo(893, 130, 935, 130);
    ctx.lineTo(1095, 130);
    ctx.lineTo(1095, 960);
    ctx.quadraticCurveTo(1095, 972, 1060, 972);
    ctx.lineTo(1000, 972);
    ctx.quadraticCurveTo(978, 972, 970, 950);
    ctx.lineTo(912, 842);
    ctx.quadraticCurveTo(893, 810, 893, 770);
    ctx.closePath();
  };
  ctx.save();
  ctx.translate(CX, 0);
  ctx.scale(WIDEN, 1);
  ctx.translate(-CX, 0);
  const green = ctx.createLinearGradient(893, 0, 1095, 0);
  green.addColorStop(0, '#7EDC6C');
  green.addColorStop(0.55, '#55BE55');
  green.addColorStop(1, '#3A9442');
  ctx.fillStyle = green;
  body();
  ctx.fill();
  ctx.save();
  body();
  ctx.clip();
  ctx.fillStyle = 'rgba(255,255,255,0.22)';
  ctx.fillRect(903, 130, 16, 850);
  ctx.fillStyle = 'rgba(0,0,0,0.16)';
  ctx.fillRect(1070, 130, 30, 850);
  ctx.fillStyle = 'rgba(0,0,0,0.22)';
  ctx.fillRect(893, 332, 202, 5);

  // Window onto the batteries: rows of piping behind glass.
  ctx.fillStyle = 'rgba(28,88,44,0.6)';
  ctx.fillRect(895, 355, 165, 210);
  ctx.strokeStyle = 'rgba(0,0,0,0.28)';
  ctx.lineWidth = 4;
  ctx.strokeRect(895, 355, 165, 210);
  ctx.fillStyle = 'rgba(10,30,15,0.85)';
  ctx.fillRect(975, 360, 50, 16);
  ctx.fillRect(975, 382, 50, 16);
  ctx.strokeStyle = 'rgba(0,0,0,0.3)';
  ctx.lineWidth = 11;
  ctx.beginPath();
  for (let y = 412; y < 560; y += 20) {
    ctx.moveTo(950, y + 3);
    ctx.lineTo(1030, y + 3);
  }
  ctx.moveTo(940, 365);
  ctx.lineTo(940, 560);
  ctx.stroke();
  ctx.strokeStyle = 'rgba(222,232,216,0.7)';
  ctx.lineWidth = 7;
  ctx.beginPath();
  for (let y = 412; y < 560; y += 20) {
    ctx.moveTo(950, y);
    ctx.lineTo(1030, y);
  }
  ctx.moveTo(940, 365);
  ctx.lineTo(940, 560);
  ctx.stroke();
  ctx.fillStyle = '#245A31';
  for (let y = 378; y < 560; y += 28) {
    ctx.beginPath();
    ctx.ellipse(1048, y, 5 / WIDEN, 5, 0, 0, Math.PI * 2);
    ctx.fill();
  }
  for (let y = 384; y < 560; y += 26) {
    ctx.beginPath();
    ctx.ellipse(902, y, 4 / WIDEN, 4, 0, 0, Math.PI * 2);
    ctx.fill();
  }

  // Lower pockets with their thruster nozzles.
  ctx.fillStyle = 'rgba(20,70,35,0.65)';
  ctx.fillRect(895, 590, 60, 110);
  ctx.fillRect(1005, 590, 36, 110);
  ctx.fillStyle = 'rgba(240,220,120,0.75)';
  ctx.fillRect(964, 612, 5, 54);
  ctx.fillRect(994, 612, 5, 56);
  for (const x of [910, 932, 1010]) {
    ctx.fillStyle = DARK;
    ctx.beginPath();
    ctx.roundRect(x, 645, 16, 40, 6);
    ctx.fill();
    ctx.fillStyle = 'rgba(255,255,255,0.25)';
    ctx.fillRect(x + 3, 650, 3, 22);
  }
  ctx.fillStyle = 'rgba(32,70,40,0.8)';
  for (const [x, y] of [[912, 315], [937, 315], [962, 315], [987, 315], [905, 735], [925, 735], [940, 735], [995, 735], [1015, 735], [1035, 735]] as const) {
    ctx.beginPath();
    ctx.ellipse(x, y, 6 / WIDEN, 6, 0, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.strokeStyle = 'rgba(255,255,255,0.3)';
  ctx.lineWidth = 6;
  ctx.beginPath();
  ctx.moveTo(918, 856);
  ctx.lineTo(972, 954);
  ctx.stroke();
  ctx.fillStyle = DARK;
  ctx.fillRect(998, 842, 50, 64);
  ctx.fillStyle = '#2C3035';
  ctx.fillRect(1005, 850, 36, 20);
  ctx.restore();

  ctx.restore();

  // Pilot window on the angled lower front: a round dark rim around blue glass.
  for (const [r, color] of [[24, '#23272B'], [18, 'rgba(130,205,230,0.85)']] as const) {
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.arc(WINDOW.x, WINDOW.y, r, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.strokeStyle = 'rgba(255,255,255,0.7)';
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.arc(WINDOW.x, WINDOW.y, 11, Math.PI * 1.1, Math.PI * 1.6);
  ctx.stroke();

  // Lower lift point.
  const lx = wx(970);
  for (const [r, color] of [[15, '#2A2D31'], [9, '#6A6F77'], [5, DARK]] as const) {
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.arc(lx, 727, r, 0, Math.PI * 2);
    ctx.fill();
  }

  // Top hard point: a silver U-shaped hook on a dark plate, centered on the upper part of the hull.
  ctx.fillStyle = 'rgba(18,44,26,0.55)';
  ctx.beginPath();
  ctx.roundRect(HOOK_AT.x - 36, HOOK_AT.y - 32, 72, 66, 14);
  ctx.fill();
  const u = () => {
    ctx.beginPath();
    ctx.moveTo(HOOK_AT.x - 22, HOOK_AT.y - 20);
    ctx.lineTo(HOOK_AT.x - 22, HOOK_AT.y + 4);
    ctx.arc(HOOK_AT.x, HOOK_AT.y + 4, 22, Math.PI, 0, true);
    ctx.lineTo(HOOK_AT.x + 22, HOOK_AT.y - 20);
  };
  ctx.lineCap = 'butt';
  ctx.strokeStyle = '#8D939B';
  ctx.lineWidth = 12;
  u();
  ctx.stroke();
  ctx.strokeStyle = '#D9DEE5';
  ctx.lineWidth = 8;
  u();
  ctx.stroke();
  ctx.strokeStyle = 'rgba(255,255,255,0.85)';
  ctx.lineWidth = 2.5;
  ctx.beginPath();
  ctx.moveTo(HOOK_AT.x - 24, HOOK_AT.y - 16);
  ctx.lineTo(HOOK_AT.x - 24, HOOK_AT.y + 6);
  ctx.stroke();
  ctx.lineCap = 'round';
  ctx.fillStyle = '#4A4F57';
  for (const dx of [-22, 22]) {
    ctx.beginPath();
    ctx.arc(HOOK_AT.x + dx, HOOK_AT.y - 22, 7, 0, Math.PI * 2);
    ctx.fill();
  }

  // The near utility boom, reaching toward the viewer: thicker and in front of the body.
  ctx.save();
  ctx.translate(-SHIFT, 0);
  ctx.save();
  ctx.translate(912, 780);
  ctx.rotate(swing(out));
  ctx.translate(-912, -780);
  ctx.strokeStyle = DARK;
  ctx.lineWidth = 13;
  ctx.beginPath();
  ctx.moveTo(912, 780);
  ctx.lineTo(704, 836);
  ctx.stroke();
  ctx.strokeStyle = '#6A7078';
  ctx.lineWidth = 3.5;
  ctx.beginPath();
  ctx.moveTo(900, 774);
  ctx.lineTo(724, 822);
  ctx.stroke();
  ctx.fillStyle = DARK;
  ctx.beginPath();
  ctx.roundRect(652, 816, 66, 42, 12);
  ctx.fill();
  light(658, 838, 11);
  ctx.restore();
  ctx.restore();

  // Top: a camera dome on a glass column between two antenna rods.
  ctx.save();
  ctx.translate((1032 - CX) * (WIDEN - 1), 0);
  ctx.strokeStyle = '#2A2D31';
  ctx.lineWidth = 10;
  ctx.beginPath();
  ctx.moveTo(988, 92);
  ctx.lineTo(988, 130);
  ctx.moveTo(1072, 92);
  ctx.lineTo(1072, 130);
  ctx.stroke();
  ctx.fillStyle = '#4A4F57';
  for (const x of [988, 1072]) {
    ctx.beginPath();
    ctx.arc(x, 90, 8, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.fillStyle = '#4C9A50';
  ctx.fillRect(1005, 108, 57, 22);
  ctx.fillStyle = 'rgba(214,228,232,0.55)';
  ctx.fillRect(1004, 70, 56, 40);
  ctx.strokeStyle = 'rgba(40,50,56,0.7)';
  ctx.lineWidth = 3;
  ctx.strokeRect(1004, 70, 56, 40);
  for (const x of [1018, 1046]) {
    ctx.fillStyle = '#6B2E2A';
    ctx.beginPath();
    ctx.arc(x, 90, 14, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = 'rgba(255,255,255,0.35)';
    ctx.beginPath();
    ctx.arc(x - 4, 85, 4, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.fillStyle = '#23262A';
  ctx.beginPath();
  ctx.ellipse(1032, 68, 32, 14, 0, Math.PI, 0);
  ctx.fill();
  ctx.strokeStyle = '#555';
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(1032, 56);
  ctx.lineTo(1120, 52);
  ctx.stroke();
  ctx.restore();
  ctx.restore();
}
