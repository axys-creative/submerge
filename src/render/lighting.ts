import { lerp } from '../util';

export interface Light {
  x: number;
  y: number;
  r: number;
  /** Set for a spotlight cone; omitted for a round glow. */
  angle?: number;
  spread?: number;
  /** Brightness multiplier, 1 when omitted. */
  a?: number;
  /** Set for the submarine's own lights, which also hide the sonar's terrain outline. */
  sub?: boolean;
}

export interface WorldTransform {
  k: number;
  ox: number;
  oy: number;
  left: number;
  top: number;
  w: number;
  h: number;
}

/** Thin wedges stacked from a bright core out past the cone's edge, so the edge fades smoothly instead of in stripes. */
const EDGE_LAYERS = 12;

/** The darkness layer is soft, so it is drawn at this fraction of the screen's resolution and scaled up. */
const LIGHT_RES = 0.5;

/** Cuts soft holes for lights (round glows and cones) out of whatever is already on a world-space layer. */
export function punchLights(c: CanvasRenderingContext2D, lights: Light[]) {
  c.globalCompositeOperation = 'destination-out';
  for (const l of lights) {
    const a = l.a ?? 1;
    const rg = c.createRadialGradient(l.x, l.y, 0, l.x, l.y, l.r);
    if (l.angle === undefined) {
      rg.addColorStop(0, 'rgba(0,0,0,0.95)');
      rg.addColorStop(0.5, 'rgba(0,0,0,0.6)');
      rg.addColorStop(1, 'rgba(0,0,0,0)');
      c.fillStyle = rg;
      c.globalAlpha = a;
      c.beginPath();
      c.arc(l.x, l.y, l.r, 0, Math.PI * 2);
      c.fill();
      c.globalAlpha = 1;
    } else {
      rg.addColorStop(0, 'rgba(0,0,0,1)');
      rg.addColorStop(0.6, 'rgba(0,0,0,0.85)');
      rg.addColorStop(1, 'rgba(0,0,0,0)');
      c.fillStyle = rg;
      const spread = l.spread ?? 0.4;
      for (let i = 0; i < EDGE_LAYERS; i++) {
        const sp = spread * (0.4 + 0.8 * (i / (EDGE_LAYERS - 1)));
        c.globalAlpha = a * (0.1 * 24) / EDGE_LAYERS;
        c.beginPath();
        c.moveTo(l.x, l.y);
        c.arc(l.x, l.y, l.r, l.angle - sp, l.angle + sp);
        c.closePath();
        c.fill();
      }
      c.globalAlpha = 1;
    }
  }
}

/** How strongly the submarine's own lights cover a point, 0 (dark) to 1 (clearly lit), up to a little past the visible edge of each light. */
export function lightCover(lights: Light[], x: number, y: number): number {
  let best = 0;
  for (const l of lights) {
    if (!l.sub) continue;
    const dx = x - l.x;
    const dy = y - l.y;
    const reach = l.r * 1.1;
    const d = Math.hypot(dx, dy);
    if (d >= reach) continue;
    let cover = clamp01((1 - d / reach) / 0.12);
    if (l.angle !== undefined) {
      const spread = (l.spread ?? 0.4) * 1.2;
      const diff = Math.abs(((Math.atan2(dy, dx) - l.angle + Math.PI * 3) % (Math.PI * 2)) - Math.PI);
      cover *= clamp01((spread - diff) / (spread * 0.2));
    }
    best = Math.max(best, cover * Math.min(1, (l.a ?? 1) * 1.6));
  }
  return best;
}

/** Paints deep-water darkness on an offscreen layer and cuts holes in it for lights. */
export class Lighting {
  private canvas = document.createElement('canvas');
  private ctx = this.canvas.getContext('2d')!;

  resize(w: number, h: number) {
    this.canvas.width = Math.ceil(w * LIGHT_RES);
    this.canvas.height = Math.ceil(h * LIGHT_RES);
  }

  render(main: CanvasRenderingContext2D, tf: WorldTransform, startPx: number, fullPx: number, lights: Light[], night = 0, rgb = '3,7,24') {
    const c = this.ctx;
    c.globalCompositeOperation = 'source-over';
    c.setTransform(1, 0, 0, 1, 0, 0);
    c.clearRect(0, 0, this.canvas.width, this.canvas.height);
    c.setTransform(tf.k * LIGHT_RES, 0, 0, tf.k * LIGHT_RES, tf.ox * LIGHT_RES, tf.oy * LIGHT_RES);

    const top = -16;
    const span = fullPx - top;
    const g = c.createLinearGradient(0, top, 0, fullPx);
    g.addColorStop(0, `rgba(${rgb},0)`);
    g.addColorStop(clamp01((lerp(startPx, 30, night) - top) / span), `rgba(${rgb},${0.55 * night})`);
    g.addColorStop(1, `rgba(${rgb},1)`);
    c.fillStyle = g;
    const y0 = Math.max(tf.top - 50, top);
    c.fillRect(tf.left - 50, y0, tf.w + 100, tf.top + tf.h + 50 - y0);

    punchLights(c, lights);

    main.save();
    main.setTransform(1, 0, 0, 1, 0, 0);
    main.drawImage(this.canvas, 0, 0, main.canvas.width, main.canvas.height);
    main.restore();
  }
}

const clamp01 = (v: number) => Math.min(1, Math.max(0, v));
