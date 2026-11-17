/** How much bigger than the standard sub the Ulysses is drawn; everything below is in the sub's local space (it faces right). */
export const ULYSSES_SCALE = 4;
const S = ULYSSES_SCALE;
export const ULYSSES_DOME = { x: 80 * S, y: 3 * S, r: 11 * S };
/** Where the crane hooks on: the flat top of the hull. */
export const ULYSSES_HOOK = { x: -7 * S, y: -16 * S };
/** The orange of every light the Ulysses gives off, as an rgb triple. */
export const ULYSSES_LIGHT_RGB = '255,160,70';
/** Where the front spotlight sits: on the frontmost belly lamp, at the front corner of the body. */
export const ULYSSES_LAMP = { x: 65 * S, y: 16 * S };
/** Where the rear spotlight sits: on the rearmost belly lamp. */
export const ULYSSES_REAR_LAMP = { x: -61 * S, y: 16 * S };
/** Centers, along the hull, of the overlapping glows that together light a rectangle the length of the body, tail panel included. */
export const ULYSSES_GLOW_X = Array.from({ length: 10 }, (_, i) => (-480 + i * 90));
/** Radius of each of those glows, so together they cover the hull's height and a bit more. */
export const ULYSSES_GLOW_R = 150;
/** Where the thrust bubbles start, at the tail. */
export const ULYSSES_TAIL = { x: -124 * S, y: -10 * S };
/** Where the four dive weights are kept: tucked inside the hull, out of sight, and let go from there. */
export const ULYSSES_WEIGHTS = [-48, -24, 16, 40].map((x) => ({ x: x * S, y: 4 * S }));
/** How far the hull reaches sideways, up and down from the sub's center, for bumping into terrain. */
export const ULYSSES_REACH = { half: 440, above: 64, below: 68 };

const HULL_TOP = '#3A4356';
const HULL_MID = '#262D3C';
const HULL_LOW = '#141823';
const RIB = '#4D5870';
/** One flat, lighter fill for the tusks and the top panel, close to the hull's upper shade, so they do not read darker than the body. */
const FRONT_FILL = '#303642';
const ORANGE_HI = '#FFC074';
const ORANGE_LO = '#D8581A';

/** The row of small domed lamps under the flat belly, lit while the sub's lights are on (`on` runs 0 to 1); drawn in the sub's local space, after the hull. */
export function drawUlyssesLamps(ctx: CanvasRenderingContext2D, on: number) {
  ctx.save();
  ctx.scale(S, S);
  for (let x = -61; x <= 65; x += 9) {
    if (x >= -16 && x <= 2) continue;
    ctx.fillStyle = '#2A2018';
    ctx.beginPath();
    ctx.arc(x, 15, 1.8, 0, Math.PI);
    ctx.closePath();
    ctx.fill();
    if (on > 0.01) {
      ctx.globalAlpha = on;
      ctx.fillStyle = '#FFC074';
      ctx.fill();
      ctx.globalAlpha = 1;
    }
  }
  ctx.restore();
}

/** The Ulysses from Atlantis: a long dark ribbed hull with a flat bottom that curves up into a thin flat tail panel, with three wide overlapping fins on the end, with an orange caged glass dome, centered on the origin. */
export function drawUlysses(ctx: CanvasRenderingContext2D) {
  ctx.save();
  ctx.scale(S, S);
  ctx.lineJoin = 'round';
  ctx.lineCap = 'round';

  const hull = new Path2D();
  hull.moveTo(72, -10);
  hull.lineTo(36, -15);
  hull.lineTo(-20, -15);
  hull.lineTo(-84, -11);
  hull.lineTo(-124, -11);
  hull.lineTo(-124, -9);
  hull.lineTo(-96, -9);
  hull.bezierCurveTo(-78, -9, -82, 15, -60, 15);
  hull.lineTo(72, 15);
  hull.closePath();
  const body = ctx.createLinearGradient(0, -15, 0, 15);
  body.addColorStop(0, HULL_TOP);
  body.addColorStop(0.5, HULL_MID);
  body.addColorStop(1, HULL_LOW);
  ctx.fillStyle = body;
  ctx.fill(hull);

  ctx.save();
  ctx.clip(hull);
  ctx.strokeStyle = RIB;
  ctx.lineWidth = 1.3;
  ctx.beginPath();
  for (let x = -70; x < 72; x += 9) {
    ctx.moveTo(x, -17);
    ctx.lineTo(x, 17);
    ctx.moveTo(x, -10);
    ctx.lineTo(x + 9, 2);
    ctx.moveTo(x + 9, -10);
    ctx.lineTo(x, 2);
  }
  ctx.moveTo(-70, 2);
  ctx.lineTo(74, 2);
  ctx.stroke();
  ctx.fillStyle = '#323B4E';
  ctx.fillRect(-16, -17, 18, 34);
  ctx.strokeStyle = '#586480';
  ctx.lineWidth = 1.2;
  ctx.strokeRect(-16, -17, 18, 34);
  for (const y of [-6, 7]) {
    const g = ctx.createRadialGradient(-7.5, y - 1, 0.5, -7, y, 5);
    g.addColorStop(0, ORANGE_HI);
    g.addColorStop(1, ORANGE_LO);
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.ellipse(-7, y, 4.5, 4, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#2A1A14';
    ctx.lineWidth = 0.6;
    ctx.beginPath();
    ctx.ellipse(-7, y, 2, 4, 0, 0, Math.PI * 2);
    ctx.moveTo(-11.5, y);
    ctx.lineTo(-2.5, y);
    ctx.moveTo(-10.2, y - 2);
    ctx.lineTo(-3.8, y - 2);
    ctx.moveTo(-10.2, y + 2);
    ctx.lineTo(-3.8, y + 2);
    ctx.stroke();
    ctx.beginPath();
    ctx.ellipse(-7, y, 4.5, 4, 0, 0, Math.PI * 2);
    ctx.stroke();
  }
  ctx.restore();

  ctx.strokeStyle = '#0E111A';
  ctx.lineWidth = 1.6;
  ctx.stroke(hull);

  // Cable run along the top, held off the hull by short posts, with two small orange domes behind the mounting plate.
  const topY = (x: number) => (x >= 36 ? -15 + ((x - 36) * 5) / 36 : x >= -20 ? -15 : -15 + ((-20 - x) * 4) / 60);
  ctx.strokeStyle = '#1B202C';
  ctx.lineWidth = 1.3;
  ctx.beginPath();
  const cable = [60, 36, -20, -84];
  cable.forEach((x, i) => (i ? ctx.lineTo(x, topY(x) - 4) : ctx.moveTo(x, topY(x) - 4)));
  for (const x of [50, 20, 0, -40, -60]) {
    ctx.moveTo(x, topY(x) - 4);
    ctx.lineTo(x, topY(x));
  }
  ctx.stroke();
  for (const x of [-32, -68]) {
    const g = ctx.createRadialGradient(x - 1, topY(x) - 3, 0.5, x, topY(x), 5);
    g.addColorStop(0, ORANGE_HI);
    g.addColorStop(1, ORANGE_LO);
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.ellipse(x, topY(x), 5, 4, 0, Math.PI, 0);
    ctx.closePath();
    ctx.fill();
    ctx.strokeStyle = '#2A1A14';
    ctx.lineWidth = 1;
    ctx.stroke();
    ctx.lineWidth = 0.6;
    ctx.beginPath();
    ctx.ellipse(x, topY(x), 2.2, 4, 0, Math.PI, 0);
    ctx.moveTo(x - 4.33, topY(x) - 2);
    ctx.lineTo(x + 4.33, topY(x) - 2);
    ctx.stroke();
  }

  // Three wide fins overlapping like cards, the one nearest the hull in front, each with a thin point on two opposite corners (top rear and bottom front) like a Z; one shade for all.
  const fins: [number, number, number][] = [[-122, -26, 2], [-119, -24, 4], [-116, -22, 6]];
  ctx.fillStyle = '#262D3C';
  ctx.strokeStyle = '#0E111A';
  ctx.lineWidth = 1;
  for (const [x, top, bottom] of fins) {
    ctx.beginPath();
    ctx.moveTo(x, bottom);
    ctx.lineTo(x, top + 2);
    ctx.lineTo(x - 5, top + 1);
    ctx.lineTo(x, top);
    ctx.lineTo(x + 9, top);
    ctx.lineTo(x + 9, bottom - 2);
    ctx.lineTo(x + 14, bottom - 1);
    ctx.lineTo(x + 9, bottom);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
  }

  // Tusks and the top panel share the hull's gradient, and only their free edges get an outline, so they read as one piece with the body.
  const tusk = (dx: number, dy: number, shade: number) => drawTusk(ctx, FRONT_FILL, dx, dy, shade);
  ctx.save();
  ctx.beginPath();
  ctx.rect(72, -100, 200, 200);
  ctx.clip();
  tusk(2, -4, 0.2);
  ctx.restore();

  // Caged orange dome on the nose, drawn in unscaled units.
  const [dx, dy, r] = [ULYSSES_DOME.x / S, ULYSSES_DOME.y / S, ULYSSES_DOME.r / S];
  const glass = ctx.createRadialGradient(dx - 3, dy - 4, 1, dx, dy, r);
  glass.addColorStop(0, ORANGE_HI);
  glass.addColorStop(0.6, '#F08A3C');
  glass.addColorStop(1, ORANGE_LO);
  ctx.fillStyle = glass;
  ctx.beginPath();
  ctx.arc(dx, dy, r, 0, Math.PI * 2);
  ctx.fill();
  cage(ctx, dx, dy, r);
  ctx.strokeStyle = 'rgba(255,235,200,0.6)';
  ctx.lineWidth = 1.4;
  ctx.beginPath();
  ctx.arc(dx, dy, r - 3, Math.PI * 1.15, Math.PI * 1.55);
  ctx.stroke();

  tusk(0, 0, 0);

  drawPanel(ctx, FRONT_FILL);
  ctx.restore();
}

/** The metal bars of the dome's cage: two curved ribs, a belt around the middle, one more bar above it and a rim. */
function cage(ctx: CanvasRenderingContext2D, dx: number, dy: number, r: number) {
  ctx.strokeStyle = '#2A1A14';
  ctx.lineWidth = 1.1;
  ctx.beginPath();
  ctx.ellipse(dx, dy, r * 0.45, r, 0, 0, Math.PI * 2);
  ctx.moveTo(dx - r, dy);
  ctx.lineTo(dx + r, dy);
  ctx.moveTo(dx - r * 0.866, dy - r * 0.5);
  ctx.lineTo(dx + r * 0.866, dy - r * 0.5);
  ctx.stroke();
  ctx.lineWidth = 1.1;
  ctx.beginPath();
  ctx.arc(dx, dy, r, 0, Math.PI * 2);
  ctx.stroke();
}

/** The cage bars alone, drawn solid over the glass glow so the light does not shine through them; in the sub's local space. */
export function drawUlyssesCage(ctx: CanvasRenderingContext2D) {
  ctx.save();
  ctx.scale(S, S);
  cage(ctx, ULYSSES_DOME.x / S, ULYSSES_DOME.y / S, ULYSSES_DOME.r / S);
  ctx.restore();
}

function drawTusk(ctx: CanvasRenderingContext2D, body: string, dx: number, dy: number, shade: number) {
  ctx.save();
  ctx.translate(dx, dy);
  ctx.fillStyle = body;
  ctx.beginPath();
  ctx.moveTo(60, 5);
  ctx.lineTo(94, 6);
  ctx.lineTo(97, 7.5);
  ctx.lineTo(97, 9.5);
  ctx.lineTo(64, 11);
  ctx.fill();
  if (shade) {
    ctx.fillStyle = `rgba(0,0,0,${shade})`;
    ctx.fill();
  }
  ctx.strokeStyle = '#0E111A';
  ctx.lineWidth = 1.2;
  ctx.stroke();
  ctx.strokeStyle = 'rgba(170,178,196,0.26)';
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(66, 6.2);
  ctx.lineTo(94, 7);
  ctx.stroke();
  ctx.restore();
}

function drawPanel(ctx: CanvasRenderingContext2D, body: string) {
  ctx.fillStyle = body;
  ctx.beginPath();
  ctx.moveTo(56, -12);
  ctx.lineTo(98, -12);
  ctx.lineTo(98, -7.2);
  ctx.quadraticCurveTo(78, -9.6, 58, -7.2);
  ctx.fill();
  ctx.strokeStyle = '#0E111A';
  ctx.lineWidth = 1.2;
  ctx.beginPath();
  ctx.moveTo(56, -12);
  ctx.lineTo(98, -12);
  ctx.lineTo(98, -7.2);
  ctx.quadraticCurveTo(78, -9.6, 58, -7.2);
  ctx.stroke();
  ctx.strokeStyle = 'rgba(170,178,196,0.26)';
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(60, -11.2);
  ctx.lineTo(96, -11.2);
  ctx.stroke();
}

/** Cuts the near tusk and the top panel out of the clip, so glows drawn afterwards (the glass glow, the dome's orange light) do not shine over them; the caller saves and restores the context. */
export function clipOutUlyssesFront(ctx: CanvasRenderingContext2D) {
  const p = new Path2D();
  p.rect(-1000, -1000, 2000, 2000);
  p.moveTo(60, 5);
  p.lineTo(94, 6);
  p.lineTo(97, 7.5);
  p.lineTo(97, 9.5);
  p.lineTo(64, 11);
  p.closePath();
  p.moveTo(56, -12);
  p.lineTo(98, -12);
  p.lineTo(98, -7.2);
  p.quadraticCurveTo(78, -9.6, 58, -7.2);
  p.closePath();
  ctx.scale(S, S);
  ctx.clip(p, 'evenodd');
  ctx.scale(1 / S, 1 / S);
}
