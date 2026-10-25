import { ZONES, type ZoneDef, type CreatureSpawn } from '../data/zones';
import { ITEMS, ITEM_KINDS, type ItemKind } from '../data/items';
import { CREATURES, type CreatureKind } from '../data/creatures';
import { PX_PER_M } from '../config';
import { clamp, mulberry32, rand, type Rng } from '../util';

/** Steepest ground (rise over run) that can be climbed by sliding along it. */
export const MAX_SLOPE = 1;

/**
 * Background mountain layers, far to near. `p` is how much of the camera's sideways
 * motion the layer follows: smaller means farther away and slower.
 */
export const BACK_LAYERS = [
  { p: 0.45, lift: 260, amp: 90, offset: 2200, dark: 0.12 },
  { p: 0.7, lift: 170, amp: 70, offset: 900, dark: 0.26 },
  { p: 0.88, lift: 90, amp: 60, offset: 400, dark: 0.4 },
];

export interface ItemInst {
  kind: ItemKind;
  x: number;
  y: number;
  alive: boolean;
  respawnAt: number;
  phase: number;
  /** Index of the wreck this chest belongs to, or -1. */
  wreck: number;
}

export interface Creature {
  kind: CreatureKind;
  x: number;
  y: number;
  vx: number;
  vy: number;
  facing: 1 | -1;
  angle: number;
  homeY: number;
  minY: number;
  maxY: number;
  speed: number;
  state: 'idle' | 'chase' | 'rest' | 'lunge' | 'dead';
  /** Seconds since the creature died (anglerfish only). */
  dying: number;
  timer: number;
  phase: number;
  tint: number;
}

export interface Deco {
  kind: 'kelp' | 'coral' | 'rock';
  x: number;
  y: number;
  size: number;
  phase: number;
  tint: number;
  /** Sideways bend in px from the sub brushing past (kelp only), and its speed. */
  push: number;
  pushV: number;
}

export class World {
  readonly def: ZoneDef;
  readonly width: number;
  readonly maxFloor: number;
  readonly items: ItemInst[] = [];
  readonly creatures: Creature[] = [];
  readonly deco: Deco[] = [];
  private readonly shape: number[];
  private readonly rng: Rng;

  constructor(readonly index: number) {
    this.def = ZONES[index];
    this.width = this.def.width;
    // Terrain and scenery use a fixed seed so a zone always looks the same; loot and creatures vary.
    const layout = mulberry32(index * 9973 + 17);
    this.shape = [layout(), layout(), layout(), layout()].map((v) => v * 100);
    this.rng = mulberry32((Date.now() ^ (index * 7919)) >>> 0);

    let max = 0;
    for (let x = 0; x <= this.width; x += 20) max = Math.max(max, this.floorAt(x));
    this.maxFloor = max;

    this.buildDeco(layout);
    for (let i = 0; i < this.def.items; i++) {
      const it = this.blankItem();
      this.placeItem(it);
      this.items.push(it);
    }
    this.def.wrecks.forEach((_, i) => {
      const it = this.blankItem();
      it.kind = 'chest';
      it.wreck = i;
      this.placeChest(it);
      this.items.push(it);
    });
    for (const spec of this.def.creatures) for (let i = 0; i < spec.count; i++) this.spawn(spec);
  }

  floorAt(x: number): number {
    let y = this.terrainAt(x);
    for (const sh of this.def.shafts ?? []) {
      const ramp = 50;
      const u = clamp((sh.width / 2 + ramp - Math.abs(x - sh.x)) / ramp, 0, 1);
      const bottom = sh.depth * PX_PER_M + Math.sin(x * 0.05) * 6;
      if (u > 0 && bottom > y) y += (bottom - y) * u * u * (3 - 2 * u);
    }
    return y;
  }

  private terrainAt(x: number): number {
    const f = this.def.floor;
    const n = f.length - 1;
    const t = clamp(x / this.width, 0, 1) * n;
    const i = Math.min(n - 1, Math.floor(t));
    const u = t - i;
    const s = u * u * (3 - 2 * u);
    const m = f[i] + (f[i + 1] - f[i]) * s;
    const [a, b, c] = this.shape;
    return m * PX_PER_M + Math.sin(x * 0.0041 + a) * 28 + Math.sin(x * 0.0113 + b) * 12 + Math.sin(x * 0.029 + c) * 5;
  }

  /** Highest ground point within half a body width of x, so wide bodies stop at walls. */
  clearFloorAt(x: number, halfWidth: number): number {
    let y = Infinity;
    for (let i = -3; i <= 3; i++) y = Math.min(y, this.floorAt(x + (i / 3) * halfWidth));
    return y;
  }

  /** True when moving from x0 to x1 means climbing ground steeper than MAX_SLOPE at height y. */
  blocked(x0: number, x1: number, y: number, halfWidth: number, margin: number): boolean {
    const to = this.clearFloorAt(x1, halfWidth) - margin;
    if (y <= to) return false;
    return this.clearFloorAt(x0, halfWidth) - margin - to > Math.abs(x1 - x0) * MAX_SLOPE + 1;
  }

  /** Ridge height of a background layer at layer coordinate c (not world x; see BACK_LAYERS). */
  layerFloorAt(c: number, layer: number): number {
    const l = BACK_LAYERS[layer];
    return this.terrainAt(c + l.offset) - l.lift + Math.sin(c * 0.002 * (1 + layer * 0.4) + this.shape[3] + layer * 2) * l.amp;
  }

  update(t: number) {
    for (const it of this.items) {
      if (it.alive || t < it.respawnAt) continue;
      if (it.wreck >= 0) this.placeChest(it);
      else this.placeItem(it);
    }
  }

  private buildDeco(r: Rng) {
    const add = (kind: Deco['kind'], count: number, maxDepth: number) => {
      for (let i = 0; i < count; i++) {
        const x = rand(r, 100, this.width - 100);
        const y = this.floorAt(x);
        if (y / PX_PER_M > maxDepth) continue;
        this.deco.push({ kind, x, y, size: rand(r, 0.7, 1.4), phase: r() * 10, tint: r(), push: 0, pushV: 0 });
      }
    };
    add('rock', this.def.rocks, Infinity);
    add('kelp', this.def.kelp, 260);
    add('coral', this.def.coral, 170);
  }

  private blankItem(): ItemInst {
    return { kind: 'seaweed', x: 0, y: 0, alive: true, respawnAt: 0, phase: this.rng() * 10, wreck: -1 };
  }

  private placeItem(it: ItemInst) {
    const r = this.rng;
    for (let tries = 0; tries < 25; tries++) {
      const x = rand(r, 250, this.width - 250);
      const floor = this.floorAt(x);
      const kind = this.pickKind(floor / PX_PER_M);
      if (!kind) continue;
      it.kind = kind;
      it.x = x;
      it.y = kind === 'bottle' && r() < 0.5 ? rand(r, 120, floor - 80) : floor - ITEMS[kind].size * 0.45;
      it.alive = true;
      return;
    }
    it.alive = false;
    it.respawnAt = Infinity;
  }

  private placeChest(it: ItemInst) {
    const w = this.def.wrecks[it.wreck];
    it.x = w.x + (w.kind === 'galleon' ? 170 : 110);
    it.y = this.floorAt(it.x) - 16;
    it.alive = true;
  }

  private pickKind(depth: number): ItemKind | null {
    const pool: [ItemKind, number][] = [];
    let total = 0;
    for (const k of ITEM_KINDS) {
      const d = ITEMS[k];
      if (d.weight > 0 && depth >= d.minDepth && depth <= d.maxDepth) {
        pool.push([k, d.weight]);
        total += d.weight;
      }
    }
    if (!total) return null;
    let roll = this.rng() * total;
    for (const [k, w] of pool) {
      roll -= w;
      if (roll <= 0) return k;
    }
    return pool[pool.length - 1][0];
  }

  private spawn(spec: CreatureSpawn) {
    const r = this.rng;
    for (let tries = 0; tries < 30; tries++) {
      const x = rand(r, 300, this.width - 300);
      if (CREATURES[spec.kind].harmful && this.def.islands.some((isl) => Math.abs(isl.x - x) < 1000)) continue;
      const minY = spec.minDepth * PX_PER_M;
      const maxY = Math.min(spec.maxDepth * PX_PER_M, this.floorAt(x) - 60);
      if (maxY < minY + 10) continue;
      const y = rand(r, minY, maxY);
      const n = spec.kind === 'fish' ? 4 + Math.floor(r() * 4) : 1;
      const tint = r();
      const facing = r() < 0.5 ? 1 : -1;
      for (let i = 0; i < n; i++) {
        this.creatures.push({
          kind: spec.kind,
          x: x + rand(r, -50, 50),
          y: y + rand(r, -30, 30),
          vx: 0,
          vy: 0,
          facing,
          angle: -Math.PI / 2,
          homeY: y,
          minY,
          maxY: spec.maxDepth * PX_PER_M,
          speed: rand(r, 45, 75),
          state: 'idle',
          dying: 0,
          timer: rand(r, 0, 2),
          phase: r() * 10,
          tint,
        });
      }
      return;
    }
  }
}
