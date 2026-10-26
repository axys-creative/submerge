import { ZONES, type ZoneDef, type CreatureSpawn } from '../data/zones';
import { ITEMS, ITEM_KINDS, type ItemKind } from '../data/items';
import { CREATURES, type CreatureKind } from '../data/creatures';
import { PX_PER_M } from '../config';
import { BONE_KINDS, BONE_WEIGHTS, type BoneKind } from '../art/bones';
import { clamp, mulberry32, rand, type Rng } from '../util';

/** The sea floor never rises above this depth in px, so kelp, creatures and the ship stay clear of the surface. */
const MIN_FLOOR = 15 * PX_PER_M;
/** How gently the floor eases into MIN_FLOOR instead of flattening abruptly. */
const FLOOR_SOFTNESS = 25;

/** Closest two surface items may spawn to each other, in px. */
const ITEM_SPACING = 160;

/** Steepest ground (rise over run) that can be climbed by sliding along it. */
export const MAX_SLOPE = 1;

/**
 * Background mountain layers, far to near. `p` is how much of the camera's sideways
 * motion the layer follows: smaller means farther away and slower. `alpha` fades distant layers into the water.
 */
export const BACK_LAYERS = [
  { p: 0.45, lift: 260, amp: 90, offset: 2200, dark: 0.12, alpha: 0.45 },
  { p: 0.7, lift: 170, amp: 70, offset: 900, dark: 0.26, alpha: 1 },
  { p: 0.88, lift: 90, amp: 60, offset: 400, dark: 0.4, alpha: 1 },
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
  /** Where cave loot sits, and returns to when it respawns. */
  spot?: { x: number; y: number };
}

/** One round piece of tunnel; a cave is the union of many overlapping blobs. */
export interface CaveBlob {
  x: number;
  y: number;
  r: number;
}

/** Distance in px between blobs along a tunnel. */
const BLOB_SPACING = 22;
/** Tunnels (not round rooms) are drawn this many times wider than their listed radius. */
const TUNNEL_WIDEN = 1.5;

/**
 * Replaces each bend with either a diagonal cut or a curve, keeping the ends fixed.
 * Sharp turns alternate between the two (`sharpTurns` carries the count across passages).
 */
function smoothBends(pts: [number, number][], sharpTurns: { n: number }): [number, number][] {
  const out: [number, number][] = [pts[0]];
  for (let i = 1; i < pts.length - 1; i++) {
    const [vx, vy] = pts[i];
    const la = Math.hypot(pts[i - 1][0] - vx, pts[i - 1][1] - vy);
    const lb = Math.hypot(pts[i + 1][0] - vx, pts[i + 1][1] - vy);
    const cut = Math.min(la, lb) * 0.45;
    const p1: [number, number] = [vx + ((pts[i - 1][0] - vx) / la) * cut, vy + ((pts[i - 1][1] - vy) / la) * cut];
    const p2: [number, number] = [vx + ((pts[i + 1][0] - vx) / lb) * cut, vy + ((pts[i + 1][1] - vy) / lb) * cut];
    const turn = Math.abs(Math.atan2(vx - pts[i - 1][0], vy - pts[i - 1][1]) - Math.atan2(pts[i + 1][0] - vx, pts[i + 1][1] - vy));
    const sharp = Math.min(turn, Math.PI * 2 - turn) > Math.PI / 3;
    if (sharp && sharpTurns.n++ % 2 === 0) {
      out.push(p1, p2);
      continue;
    }
    for (let k = 0; k <= 8; k++) {
      const u = k / 8;
      const w = 1 - u;
      out.push([w * w * p1[0] + 2 * w * u * vx + u * u * p2[0], w * w * p1[1] + 2 * w * u * vy + u * u * p2[1]]);
    }
  }
  out.push(pts[pts.length - 1]);
  return out;
}

/** Stable pseudo-noise in -1..1 from a position along a tunnel. */
const wobble = (s: number, seed: number) =>
  (Math.sin(s * 0.011 + seed) * 0.6 + Math.sin(s * 0.037 + seed * 2.3) * 0.4);

export interface Creature {
  kind: CreatureKind;
  x: number;
  y: number;
  vx: number;
  vy: number;
  facing: 1 | -1;
  /** Where a slow swimmer is heading, which only changes now and then. */
  heading: 1 | -1;
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
  /** Seconds until a sperm whale's next dive. */
  nextDive: number;
  /** A sperm whale's dive in progress: how deep, whether it is going down, holding or coming up, and how long it stays down. */
  plan: { y: number; stage: 'down' | 'hold' | 'up'; hold: number } | null;
  /** Where the leviathan's head has been, newest first, which its body follows. */
  trail?: { x: number; y: number }[];
}

export interface Deco {
  kind: 'kelp' | 'coral' | 'rock' | BoneKind;
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
  /** Deepest point of the sea floor and of any tunnel or cavern. */
  readonly maxFloor: number;
  /** An open cavern below the tunnels, in px, if the zone has one. */
  readonly abyss: { from: number; to: number; zoom: number } | null;
  /** Deepest point of the sea floor alone. */
  readonly floorMax: number;
  readonly items: ItemInst[] = [];
  readonly creatures: Creature[] = [];
  readonly deco: Deco[] = [];
  private readonly shape: number[];
  readonly caveBlobs: CaveBlob[] = [];
  private readonly rng: Rng;

  constructor(readonly index: number) {
    this.def = ZONES[index];
    this.width = this.def.width;
    // Terrain and scenery use a fixed seed so a zone always looks the same; loot and creatures vary.
    const layout = mulberry32(index * 9973 + 17);
    this.shape = [layout(), layout(), layout(), layout()].map((v) => v * 100);
    this.rng = mulberry32((Date.now() ^ (index * 7919)) >>> 0);

    this.buildCave();
    const cave = this.def.caves?.find((c) => c.abyss);
    this.abyss = cave?.abyss
      ? { from: cave.abyss.from * PX_PER_M, to: cave.abyss.to * PX_PER_M, zoom: cave.abyss.zoom }
      : null;

    let max = 0;
    for (let x = 0; x <= this.width; x += 20) max = Math.max(max, this.floorAt(x));
    this.floorMax = max;
    for (const b of this.caveBlobs) max = Math.max(max, b.y + b.r);
    if (this.abyss) max = Math.max(max, this.abyss.to);
    this.maxFloor = max;

    this.buildDeco(layout);
    for (let i = 0; i < this.def.items; i++) {
      const it = this.blankItem();
      this.placeItem(it);
      this.items.push(it);
    }
    this.placeCaveLoot();
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
    for (const { hill } of this.def.caves ?? []) {
      const u = clamp((hill.half + hill.ramp - Math.abs(x - hill.x)) / hill.ramp, 0, 1);
      y -= hill.height * PX_PER_M * u * u * (3 - 2 * u);
    }
    if (y > MIN_FLOOR + FLOOR_SOFTNESS * 20) return y;
    return MIN_FLOOR + FLOOR_SOFTNESS * Math.log(1 + Math.exp((y - MIN_FLOOR) / FLOOR_SOFTNESS));
  }

  /** Height of the abyss ceiling at x: a smooth, bumpy line like the sea floor. */
  abyssTop(x: number): number {
    const [a, b, c] = this.shape;
    return this.abyss!.from + Math.sin(x * 0.0037 + a) * 55 + Math.sin(x * 0.0101 + b) * 30 + Math.sin(x * 0.027 + c) * 12;
  }

  /** True when x is inside the headland where collision follows the tunnels. */
  inCave(x: number): boolean {
    return !!this.def.caves?.some((c) => x >= c.x0 && x <= c.x1);
  }

  /** Rock: below the sea floor and outside every tunnel. */
  caveSolid(x: number, y: number): boolean {
    if (y <= this.floorAt(x)) return false;
    if (!this.inCave(x)) return true;
    if (this.abyss && y > this.abyssTop(x)) return y > this.abyss.to;
    for (const b of this.caveBlobs) {
      const dx = x - b.x;
      const dy = y - b.y;
      if (dx * dx + dy * dy < b.r * b.r) return false;
    }
    return true;
  }

  /** True when a body centered at (x, y), halfWidth wide, overlaps rock. */
  caveHit(x: number, y: number, halfWidth: number): boolean {
    for (const dx of [-0.85, -0.45, 0, 0.45, 0.85]) {
      for (const dy of [-24, 0, 24]) {
        if (Math.abs(dx) > 0.7 && dy !== 0) continue;
        if (this.caveSolid(x + dx * halfWidth, y + dy)) return true;
      }
    }
    return false;
  }

  /** Turns the cave's passages into overlapping blobs with smoothed bends and a wavering rock wall. */
  private buildCave() {
    const sharpTurns = { n: 0 };
    (this.def.caves ?? []).flatMap((c) => c.passages).forEach((p, n) => {
      const seed = n * 1.7;
      const pts = p.pts.map(([x, m]) => [x, m * PX_PER_M] as [number, number]);
      if (pts.length === 1) {
        const [x, y] = pts[0];
        this.caveBlobs.push({ x, y, r: p.r });
        for (let k = 0; k < 9; k++) {
          const a = (k / 9) * Math.PI * 2 + seed;
          const w = wobble(k * 90, seed);
          this.caveBlobs.push({ x: x + Math.cos(a) * p.r * (0.25 + 0.08 * w), y: y + Math.sin(a) * p.r * (0.25 + 0.08 * w), r: p.r * (0.82 + 0.1 * w) });
        }
        return;
      }
      const r = p.r * TUNNEL_WIDEN;
      const path = smoothBends(pts, sharpTurns);
      let dist = 0;
      let next = 0;
      for (let i = 0; i < path.length - 1; i++) {
        const [ax, ay] = path[i];
        const [bx, by] = path[i + 1];
        const len = Math.hypot(bx - ax, by - ay);
        for (; next <= dist + len; next += BLOB_SPACING) {
          const u = len ? (next - dist) / len : 0;
          this.caveBlobs.push({ x: ax + (bx - ax) * u, y: ay + (by - ay) * u, r: r * (1 + 0.17 * wobble(next, seed)) });
        }
        dist += len;
      }
      const [lx, ly] = path[path.length - 1];
      this.caveBlobs.push({ x: lx, y: ly, r });
    });
  }

  private placeCaveLoot() {
    const r = this.rng;
    for (const p of (this.def.caves ?? []).flatMap((c) => c.passages)) {
      if (!p.loot) continue;
      const low = p.pts.reduce((a, b) => (b[1] > a[1] ? b : a));
      for (let i = 0; i < p.loot; i++) {
        const it = this.blankItem();
        const kind = this.pickKind(low[1], true);
        if (!kind) continue;
        const width = p.pts.length === 1 ? p.r : p.r * TUNNEL_WIDEN;
        const reach = width * (p.pts.length === 1 ? 0.6 : 0.3);
        const cy = low[1] * PX_PER_M;
        let x = 0;
        let y = cy;
        let landed = false;
        for (let tries = 0; tries < 60 && !landed; tries++) {
          x = low[0] + rand(r, -reach, reach);
          y = cy;
          while (y < cy + width * 2.2 && !this.caveSolid(x, y + 4)) y += 4;
          landed = !this.caveSolid(x, cy) && this.caveSolid(x, y + 4);
        }
        if (!landed) continue;
        it.kind = kind;
        it.x = x;
        it.y = y - ITEMS[kind].size * 0.45;
        it.spot = { x, y: it.y };
        this.items.push(it);
      }
    }
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
      if (it.spot) {
        it.x = it.spot.x;
        it.y = it.spot.y;
        it.alive = true;
      } else if (it.wreck >= 0) this.placeChest(it);
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
    for (let i = 0; i < (this.def.bones ?? 0); i++) {
      const x = rand(r, 100, this.width - 100);
      let roll = r();
      let kind: BoneKind = 'bone';
      for (const k of BONE_KINDS) {
        roll -= BONE_WEIGHTS[k];
        if (roll <= 0) {
          kind = k;
          break;
        }
      }
      const slope = Math.atan2(this.floorAt(x + 40) - this.floorAt(x - 40), 80);
      this.deco.push({ kind, x, y: this.floorAt(x), size: rand(r, 0.8, 1.3), phase: r() * 10, tint: r(), push: Math.max(-0.5, Math.min(0.5, slope)), pushV: 0 });
    }
  }

  private blankItem(): ItemInst {
    return { kind: 'seaweed', x: 0, y: 0, alive: true, respawnAt: 0, phase: this.rng() * 10, wreck: -1 };
  }

  private placeItem(it: ItemInst) {
    const r = this.rng;
    for (let tries = 0; tries < 25; tries++) {
      const x = rand(r, 250, this.width - 250);
      const floor = this.floorAt(x);
      if (Math.abs(this.floorAt(x + 20) - this.floorAt(x - 20)) > 20) continue;
      if (this.items.some((o) => o !== it && o.alive && Math.abs(o.x - x) < ITEM_SPACING)) continue;
      const kind = this.pickKind(floor / PX_PER_M);
      if (!kind) continue;
      it.kind = kind;
      it.x = x;
      it.y = kind === 'bottle' && r() < 0.25 ? rand(r, 120, floor - 80) : floor - ITEMS[kind].size * 0.45;
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

  private pickKind(depth: number, treasureOnly = false): ItemKind | null {
    const pool: [ItemKind, number][] = [];
    let total = 0;
    for (const k of ITEM_KINDS) {
      const d = ITEMS[k];
      if (d.weight > 0 && (!treasureOnly || d.treasure) && depth >= d.minDepth && depth <= d.maxDepth) {
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
      const y = spec.kind === 'stingray' ? this.floorAt(x) - 50 : rand(r, minY, maxY);
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
          heading: facing,
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
          nextDive: rand(r, 15, 70),
          plan: null,
        });
      }
      return;
    }
  }
}
