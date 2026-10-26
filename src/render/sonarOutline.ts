import type { Creature, World } from '../game/world';
import { drawCreature } from '../art/creatures';
import { WHALE_SCALE } from '../data/creatures';
import type { WorldTransform } from './lighting';

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

    main.save();
    main.setTransform(1, 0, 0, 1, 0, 0);
    main.globalAlpha = alpha;
    main.drawImage(this.canvas, 0, 0, main.canvas.width, main.canvas.height);
    main.restore();
  }
}

/** Half the width in world px each kind needs, which sizes its outline image. */
const KIND_EXTENT: Record<Creature['kind'], number> = {
  fish: 36,
  jelly: 70,
  shark: 110,
  hammerhead: 110,
  squid: 140,
  angler: 80,
  whale: 270 * WHALE_SCALE,
  stingray: 130,
  manta: 170,
  colossal: 360,
};
/** Outline thickness in world px. */
const SHAPE_EDGE = 2.5;
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
    const pose = { ...shape, x: 0, y: 0, phase: (Math.round(shape.phase * 2) / 2) % 4 };
    const key = [shape.kind, shape.tint.toFixed(1), shape.facing, shape.state, pose.phase, Math.round(shape.vx / 30), Math.round(shape.vy / 30), Math.round(shape.angle * 4), rgb, k.toFixed(2)].join('|');
    const hit = this.cache.get(key);
    if (hit) return hit;
    if (this.cache.size >= SPRITE_LIMIT) this.cache.clear();

    const r = SHAPE_EDGE * k;
    const side = Math.ceil(KIND_EXTENT[shape.kind] * 2 * k + r * 2);
    if (this.scratch.width < side) {
      this.scratch.width = side;
      this.scratch.height = side;
    }
    const f = this.scratch.getContext('2d')!;
    f.globalCompositeOperation = 'source-over';
    f.setTransform(1, 0, 0, 1, 0, 0);
    f.clearRect(0, 0, side, side);
    f.setTransform(k, 0, 0, k, side / 2, side / 2);
    drawCreature(f, pose);
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
