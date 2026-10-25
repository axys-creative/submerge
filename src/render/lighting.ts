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
const EDGE_LAYERS = 24;

/** Paints deep-water darkness on an offscreen layer and cuts holes in it for lights. */
export class Lighting {
  private canvas = document.createElement('canvas');
  private ctx = this.canvas.getContext('2d')!;

  resize(w: number, h: number) {
    this.canvas.width = w;
    this.canvas.height = h;
  }

  render(main: CanvasRenderingContext2D, tf: WorldTransform, startPx: number, fullPx: number, lights: Light[], night = 0) {
    const c = this.ctx;
    c.globalCompositeOperation = 'source-over';
    c.setTransform(1, 0, 0, 1, 0, 0);
    c.clearRect(0, 0, this.canvas.width, this.canvas.height);
    c.setTransform(tf.k, 0, 0, tf.k, tf.ox, tf.oy);

    const top = -16;
    const span = fullPx - top;
    const g = c.createLinearGradient(0, top, 0, fullPx);
    g.addColorStop(0, 'rgba(3,7,24,0)');
    g.addColorStop(clamp01((lerp(startPx, 30, night) - top) / span), `rgba(3,7,24,${0.55 * night})`);
    g.addColorStop(1, 'rgba(3,7,24,1)');
    c.fillStyle = g;
    const y0 = Math.max(tf.top - 50, top);
    c.fillRect(tf.left - 50, y0, tf.w + 100, tf.top + tf.h + 50 - y0);

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
          c.globalAlpha = a * 0.1;
          c.beginPath();
          c.moveTo(l.x, l.y);
          c.arc(l.x, l.y, l.r, l.angle - sp, l.angle + sp);
          c.closePath();
          c.fill();
        }
        c.globalAlpha = 1;
      }
    }

    main.save();
    main.setTransform(1, 0, 0, 1, 0, 0);
    main.drawImage(this.canvas, 0, 0);
    main.restore();
  }
}

const clamp01 = (v: number) => Math.min(1, Math.max(0, v));
