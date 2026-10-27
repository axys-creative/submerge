import type { Creature, World } from '../game/world';
import { drawCreature } from '../art/creatures';
import { CREATURE_EXTENT } from '../data/creatures';
import type { Light, WorldTransform } from './lighting';

/** Width in px of the glowing edge along rock. */
const EDGE = 7;

/** The terrain glow is soft, so it is drawn at this fraction of the screen's resolution and scaled up. */
const RES = 0.5;

/** Lights up the real rock edge (sea floor and cave walls) wherever a sonar ping has reached it. */
export class SonarOutline {
  private canvas = document.createElement('canvas');
  private ctx = this.canvas.getContext('2d')!;

  /**
   * `front` is how far the ping has travelled and `trail` how far behind the front the glow takes to fade out.
   * `hits` holds each ray's distance to rock from (ox, oy), or -1.
   */
  render(
    main: CanvasRenderingContext2D,
    tf: WorldTransform,
    world: World,
    origin: { x: number; y: number },
    hits: number[],
    front: number,
    range: number,
    trail: number,
    alpha: number,
    lights: Light[],
  ) {
    const c = this.ctx;
    const w = Math.ceil(main.canvas.width * RES);
    const h = Math.ceil(main.canvas.height * RES);
    if (this.canvas.width !== w || this.canvas.height !== h) {
      this.canvas.width = w;
      this.canvas.height = h;
    }
    c.globalCompositeOperation = 'source-over';
    c.setTransform(1, 0, 0, 1, 0, 0);
    c.clearRect(0, 0, this.canvas.width, this.canvas.height);
    c.setTransform(tf.k * RES, 0, 0, tf.k * RES, tf.ox * RES, tf.oy * RES);

    const left = tf.left - 30;
    const right = tf.left + tf.w + 30;
    const bottom = tf.top + tf.h + 30;
    const floor = () => {
      for (let x = Math.floor(left / 12) * 12; x <= right; x += 12) c.lineTo(x, world.floorAt(x));
    };
    const blobs = world.caveBlobs.filter((b) => b.x + b.r + EDGE > left && b.x - b.r - EDGE < right);

    const ab = world.abyss;
    const cavern = (extra: number) => {
      const pts = world.abyssOutline(Math.floor(left / 12) * 12, right, 12, extra);
      c.moveTo(pts[0][0], pts[0][1]);
      for (const [x, y] of pts) c.lineTo(x, y);
      c.closePath();
    };
    c.fillStyle = '#78FFD2';
    c.strokeStyle = '#78FFD2';
    c.save();
    c.beginPath();
    c.moveTo(left, bottom);
    floor();
    c.lineTo(right, bottom);
    c.closePath();
    c.clip();
    c.beginPath();
    for (const b of blobs) {
      c.moveTo(b.x + b.r + EDGE, b.y);
      c.arc(b.x, b.y, b.r + EDGE, 0, Math.PI * 2);
    }
    if (ab) cavern(EDGE);
    c.fill();
    c.restore();
    c.lineWidth = EDGE;
    c.lineJoin = 'round';
    c.beginPath();
    floor();
    c.stroke();

    c.globalCompositeOperation = 'destination-out';
    c.beginPath();
    for (const b of blobs) {
      c.moveTo(b.x + b.r, b.y);
      c.arc(b.x, b.y, b.r, 0, Math.PI * 2);
    }
    if (ab) cavern(0);
    c.fill();

    c.globalCompositeOperation = 'destination-in';
    c.beginPath();
    hits.forEach((d, i) => {
      const a = (i / hits.length) * Math.PI * 2;
      const r = Math.min(front, d >= 0 ? d + EDGE * 2 : range);
      const x = origin.x + Math.cos(a) * r;
      const y = origin.y + Math.sin(a) * r;
      if (i) c.lineTo(x, y);
      else c.moveTo(x, y);
    });
    c.closePath();
    c.fill();

    const fade = c.createRadialGradient(origin.x, origin.y, 0, origin.x, origin.y, front);
    const u0 = 1 - trail / front;
    if (u0 > 0) {
      fade.addColorStop(0, 'rgba(0,0,0,0)');
      fade.addColorStop(u0, 'rgba(0,0,0,0)');
    } else fade.addColorStop(0, `rgba(0,0,0,${1 - front / trail})`);
    fade.addColorStop(1, 'rgba(0,0,0,1)');
    c.fillStyle = fade;
    c.fillRect(left, tf.top - 30, right - left, bottom - tf.top + 30);

    c.globalCompositeOperation = 'destination-out';
    for (const l of lights) {
      if (!l.sub) continue;
      const reach = l.r * 1.1;
      const strength = Math.min(1, (l.a ?? 1) * 1.6);
      const glow = c.createRadialGradient(l.x, l.y, 0, l.x, l.y, reach);
      glow.addColorStop(0, `rgba(0,0,0,${strength})`);
      glow.addColorStop(0.88, `rgba(0,0,0,${strength})`);
      glow.addColorStop(1, 'rgba(0,0,0,0)');
      c.fillStyle = glow;
      if (l.angle === undefined) {
        c.beginPath();
        c.arc(l.x, l.y, reach, 0, Math.PI * 2);
        c.fill();
        continue;
      }
      const spread = (l.spread ?? 0.4) * 1.2;
      for (const [f, a] of [[1, 0.25], [0.93, 0.35], [0.86, 0.5], [0.8, 1]]) {
        c.beginPath();
        c.moveTo(l.x, l.y);
        c.arc(l.x, l.y, reach, l.angle - spread * f, l.angle + spread * f);
        c.closePath();
        c.globalAlpha = a;
        c.fill();
      }
      c.globalAlpha = 1;
    }

    main.save();
    main.setTransform(1, 0, 0, 1, 0, 0);
    main.globalAlpha = alpha;
    main.drawImage(this.canvas, 0, 0, main.canvas.width, main.canvas.height);
    main.restore();
  }
}

/** Outline thickness in world px. */
const SHAPE_EDGE = 2.5;
/** The longest side in px an outline image is drawn at; huge animals are drawn smaller and scaled up. */
const SPRITE_MAX_SIDE = 1400;
/** Outline images kept for reuse before the cache is emptied. */
const SPRITE_LIMIT = 160;

/** A creature's outline, drawn once and reused every frame; `k` is the scale it was drawn at. */
export interface ShapeSprite {
  canvas: HTMLCanvasElement;
  k: number;
}

/** Turns a frozen creature into a glowing outline image (with a faint fill), reusing images between similar poses. */
export class SonarShape {
  private scratch = document.createElement('canvas');
  private cache = new Map<string, ShapeSprite>();

  sprite(k: number, shape: Creature, rgb: string): ShapeSprite {
    const pose = {
      ...shape,
      x: 0,
      y: 0,
      phase: (Math.round(shape.phase * 2) / 2) % 4,
      trail: shape.trail?.map((p) => ({ x: p.x - shape.x, y: p.y - shape.y })),
    };
    const bend = shape.trail ? [10, 30, 60, 100, 140].map((i) => shape.trail![Math.min(i, shape.trail!.length - 1)]).map((p) => `${Math.round((p.x - shape.x) / 40)},${Math.round((p.y - shape.y) / 40)}`).join(';') : '';
    const key = [shape.kind, shape.tint.toFixed(1), shape.facing, shape.state, pose.phase, Math.round(shape.vx / 30), Math.round(shape.vy / 30), Math.round(shape.angle * 4), bend, rgb, k.toFixed(2)].join('|');
    return this.outline(key, CREATURE_EXTENT[shape.kind], k, rgb, (f) => drawCreature(f, pose));
  }

  /** Outline of an object drawn by `draw` around the origin, reaching at most `extent` px from it. */
  outline(key: string, extent: number, k: number, rgb: string, draw: (ctx: CanvasRenderingContext2D) => void): ShapeSprite {
    const hit = this.cache.get(key);
    if (hit) return hit;
    if (this.cache.size >= SPRITE_LIMIT) this.cache.clear();

    k *= Math.min(1, SPRITE_MAX_SIDE / (extent * 2 * k));
    const r = SHAPE_EDGE * k;
    const side = Math.ceil(extent * 2 * k + r * 2);
    if (this.scratch.width < side) {
      this.scratch.width = side;
      this.scratch.height = side;
    }
    const f = this.scratch.getContext('2d')!;
    f.globalCompositeOperation = 'source-over';
    f.setTransform(1, 0, 0, 1, 0, 0);
    f.clearRect(0, 0, side, side);
    f.setTransform(k, 0, 0, k, side / 2, side / 2);
    draw(f);
    f.setTransform(1, 0, 0, 1, 0, 0);
    f.globalCompositeOperation = 'source-in';
    f.fillStyle = `rgb(${rgb})`;
    f.fillRect(0, 0, side, side);

    const canvas = document.createElement('canvas');
    canvas.width = side;
    canvas.height = side;
    const e = canvas.getContext('2d')!;
    for (let i = 0; i < 8; i++) {
      const a = (i / 8) * Math.PI * 2;
      e.drawImage(this.scratch, 0, 0, side, side, Math.cos(a) * r, Math.sin(a) * r, side, side);
    }
    e.globalCompositeOperation = 'destination-out';
    e.drawImage(this.scratch, 0, 0, side, side, 0, 0, side, side);
    e.globalCompositeOperation = 'source-over';
    e.globalAlpha = 0.2;
    e.drawImage(this.scratch, 0, 0, side, side, 0, 0, side, side);

    const sprite = { canvas, k };
    this.cache.set(key, sprite);
    return sprite;
  }

  draw(main: CanvasRenderingContext2D, k: number, sx: number, sy: number, sprite: ShapeSprite, alpha: number) {
    const scale = k / sprite.k;
    const w = sprite.canvas.width * scale;
    const h = sprite.canvas.height * scale;
    main.save();
    main.setTransform(1, 0, 0, 1, 0, 0);
    main.globalAlpha = alpha;
    main.drawImage(sprite.canvas, sx - w / 2, sy - h / 2, w, h);
    main.restore();
  }
}
