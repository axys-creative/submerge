import { ZONES, type ZoneDef, type CreatureSpawn } from '../data/zones';
import { ITEMS, ITEM_KINDS, type ItemKind } from '../data/items';
import { CREATURES, type CreatureKind } from '../data/creatures';
import { MONSTER_TRAIL, PX_PER_M, SCENERY_DENSITY } from '../config';
import { BONE_KINDS, BONE_WEIGHTS, type BoneKind } from '../art/bones';
import { clamp, mulberry32, rand, type Rng } from '../util';

/** The sea floor never rises above this depth in px, so kelp, creatures and the ship stay clear of the surface. */
const MIN_FLOOR = 15 * PX_PER_M;
/** How gently the floor eases into MIN_FLOOR instead of flattening abruptly. */
const FLOOR_SOFTNESS = 25;

/** Closest two surface items may spawn to each other, in px. */
const ITEM_SPACING = 160;
const NAV_CELL = 120;
const NAV_CLEAR = 130;

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
const TUNNEL_WIDEN = 1;

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
  /** How far the leviathan's jaws have closed while swallowing the sub, 0 (open) to 1; negative gapes wider. */
  bite?: number;
  /** How lit the leviathan's eyes and body lights are, 0 (asleep) to 1. */
  glow?: number;
  /** Harmless animals only: drawn over the submarine instead of behind it. */
  front?: boolean;
}

export interface Deco {
  kind: 'kelp' | 'coral' | 'rock' | 'stone' | 'starfish' | 'lungsub' | BoneKind;
  x: number;
  y: number;
  size: number;
  phase: number;
  tint: number;
  /** Sideways bend in px from the sub brushing past (kelp), the tilt in radians of bones and starfish, or the floor's slope for coral; and its speed. */
  push: number;
  pushV: number;
}

export class World {
  readonly def: ZoneDef;
  readonly width: number;
  /** Deepest point of the sea floor and of any tunnel or cavern. */
  readonly maxFloor: number;
  /** An open cavern below the tunnels, in px, if the zone has one. */
  readonly abyss: { from: number; to: number; zoom: number; lair: { x: number; y: number }; bones: number; relic: { x: number; y: number } } | null;
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
      ? { from: cave.abyss.from * PX_PER_M, to: cave.abyss.to * PX_PER_M, zoom: cave.abyss.zoom, lair: { x: cave.abyss.lair[0], y: cave.abyss.lair[1] * PX_PER_M }, bones: cave.abyss.bones, relic: { x: cave.abyss.relic[0], y: cave.abyss.relic[1] * PX_PER_M } }
      : null;

    let max = 0;
    for (let x = 0; x <= this.width; x += 20) max = Math.max(max, this.floorAt(x));
    this.floorMax = max;
    for (const b of this.caveBlobs) max = Math.max(max, b.y + b.r);
    if (this.abyss) max = Math.max(max, this.abyss.to + 400);
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
    this.spawnLeviathan();
  }

  /** Puts the sleeping leviathan in its lair, fully formed with its body stretched out to the west and its lights off, if the zone has one. */
  spawnLeviathan() {
    if (!this.abyss) return;
    const { x, y } = this.abyss.lair;
    this.creatures.push({
      kind: 'leviathan',
      x,
      y,
      vx: 0,
      vy: 0,
      facing: 1,
      heading: 1,
      angle: 0,
      homeY: y,
      minY: 0,
      maxY: 1e9,
      speed: 0,
      state: 'rest',
      dying: 0,
      timer: 0,
      phase: 0,
      tint: 0.5,
      nextDive: 0,
      plan: null,
      trail: Array.from({ length: MONSTER_TRAIL }, (_, k) => ({ x: x - k * 16, y })),
      glow: 0,
    });
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

  /** Height of the cavern's bumpy floor at x, with hills that rise and fall around the abyss's depth. */
  abyssBottom(x: number): number {
    const [a, b, c] = this.shape;
    return this.abyss!.to + Math.sin(x * 0.0021 + a) * 180 + Math.sin(x * 0.0057 + b) * 110 + Math.sin(x * 0.0143 + c) * 40;
  }

  /** The cavern's outline from x0 to x1: along the ceiling, then back along the floor, each pushed outward by `extra`. */
  abyssOutline(x0: number, x1: number, step: number, extra = 0): [number, number][] {
    const pts: [number, number][] = [];
    for (let x = x0; x <= x1; x += step) pts.push([x, this.abyssTop(x) - extra]);
    for (let x = Math.floor(x1 / step) * step; x >= x0; x -= step) pts.push([x, this.abyssBottom(x) + extra]);
    return pts;
  }

  private nav: { cols: number; rows: number; open: Int8Array; dist: Int32Array; goal: number } | null = null;

  private navOpen(i: number): boolean {
    const n = this.nav!;
    if (n.open[i] === 0) {
      const x = ((i % n.cols) + 0.5) * NAV_CELL;
      const y = (Math.floor(i / n.cols) + 0.5) * NAV_CELL;
      const free = (dx: number, dy: number) => !this.caveSolid(x + dx, y + dy);
      n.open[i] = free(0, 0) && free(NAV_CLEAR, 0) && free(-NAV_CLEAR, 0) && free(0, NAV_CLEAR) && free(0, -NAV_CLEAR) ? 1 : 2;
    }
    return n.open[i] === 1;
  }

  private navCell(x: number, y: number): number {
    const n = this.nav!;
    return clamp(Math.floor(y / NAV_CELL), 0, n.rows - 1) * n.cols + clamp(Math.floor(x / NAV_CELL), 0, n.cols - 1);
  }

  /** The nearest open cell to a point, searching outward a few rings, or -1. */
  private navNear(x: number, y: number): number {
    const n = this.nav!;
    const c0 = this.navCell(x, y);
    const cx = c0 % n.cols;
    const cy = Math.floor(c0 / n.cols);
    for (let ring = 0; ring <= 4; ring++) {
      for (let dy = -ring; dy <= ring; dy++) {
        for (let dx = -ring; dx <= ring; dx++) {
          if (Math.max(Math.abs(dx), Math.abs(dy)) !== ring) continue;
          const px = cx + dx;
          const py = cy + dy;
          if (px < 0 || py < 0 || px >= n.cols || py >= n.rows) continue;
          if (this.navOpen(py * n.cols + px)) return py * n.cols + px;
        }
      }
    }
    return -1;
  }

  /**
   * The next stop on the open route from (fx, fy) toward (tx, ty), a few cells ahead so the path is smooth, or null when no route exists.
   * Routes are found over a coarse grid of cells the leviathan fits through, and recomputed when the goal moves to another cell.
   */
  routeStep(fx: number, fy: number, tx: number, ty: number, ahead = 3): { x: number; y: number } | null {
    this.nav ??= (() => {
      const cols = Math.ceil(this.width / NAV_CELL);
      const rows = Math.ceil(this.maxFloor / NAV_CELL) + 1;
      return { cols, rows, open: new Int8Array(cols * rows), dist: new Int32Array(cols * rows), goal: -1 };
    })();
    const n = this.nav;
    const goal = this.navNear(tx, ty);
    if (goal < 0) return null;
    if (goal !== n.goal) {
      n.goal = goal;
      n.dist.fill(-1);
      n.dist[goal] = 0;
      const queue = [goal];
      for (let head = 0; head < queue.length; head++) {
        const i = queue[head];
        const cx = i % n.cols;
        const cy = Math.floor(i / n.cols);
        for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
          const px = cx + dx;
          const py = cy + dy;
          if (px < 0 || py < 0 || px >= n.cols || py >= n.rows) continue;
          const j = py * n.cols + px;
          if (n.dist[j] >= 0 || !this.navOpen(j)) continue;
          n.dist[j] = n.dist[i] + 1;
          queue.push(j);
        }
      }
    }
    let at = this.navNear(fx, fy);
    if (at < 0 || n.dist[at] < 0) return null;
    for (let step = 0; step < ahead && n.dist[at] > 0; step++) {
      const cx = at % n.cols;
      const cy = Math.floor(at / n.cols);
      let best = at;
      for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
        const px = cx + dx;
        const py = cy + dy;
        if (px < 0 || py < 0 || px >= n.cols || py >= n.rows) continue;
        const j = py * n.cols + px;
        if (n.dist[j] >= 0 && n.dist[j] < n.dist[best]) best = j;
      }
      at = best;
    }
    return { x: ((at % n.cols) + 0.5) * NAV_CELL, y: (Math.floor(at / n.cols) + 0.5) * NAV_CELL };
  }

  /** True when no rock lies on the straight line between two points. */
  clearLine(x0: number, y0: number, x1: number, y1: number): boolean {
    const len = Math.hypot(x1 - x0, y1 - y0);
    for (let d = 0; d < len; d += 60) {
      const u = d / len;
      if (this.caveSolid(x0 + (x1 - x0) * u, y0 + (y1 - y0) * u)) return false;
    }
    return true;
  }

  private mouthMemo = new Map<number, boolean>();

  /** True when something resting at (x, y) sits on the sea floor line right where a tunnel breaks through it, over the hole instead of on rock. */
  atMouth(x: number, y: number): boolean {
    const key = Math.round(x) * 100003 + Math.round(y);
    let hit = this.mouthMemo.get(key);
    if (hit === undefined) {
      const floor = this.floorAt(x);
      hit = this.inCave(x) && Math.abs(y - floor) < 45 && !this.caveSolid(x, floor + 10);
      this.mouthMemo.set(key, hit);
    }
    return hit;
  }

  /** True when x is inside the headland where collision follows the tunnels. */
  inCave(x: number): boolean {
    return !!this.def.caves?.some((c) => x >= c.x0 && x <= c.x1);
  }

  /** Rock: below the sea floor and outside every tunnel. */
  caveSolid(x: number, y: number): boolean {
    if (y <= this.floorAt(x)) return false;
    if (!this.inCave(x)) return true;
    if (this.abyss && y > this.abyssTop(x) && y <= this.abyssBottom(x)) return false;
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
    return m * PX_PER_M + (Math.sin(x * 0.0041 + a) * 28 + Math.sin(x * 0.0113 + b) * 12 + Math.sin(x * 0.029 + c) * 5) * (this.def.calm ?? 1);
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

  /** Rise of the sea floor per px sideways at x, limited so coral never leans past a steep face. */
  private floorSlope(x: number) {
    return clamp((this.floorAt(x + 30) - this.floorAt(x - 30)) / 60, -0.8, 0.8);
  }

  private buildDeco(r: Rng) {
    const scaled = (n: number) => Math.round(n * SCENERY_DENSITY);
    const add = (kind: Deco['kind'], count: number, maxDepth: number) => {
      for (let i = 0; i < scaled(count); i++) {
        const x = rand(r, 100, this.width - 100);
        const y = this.floorAt(x);
        if (y / PX_PER_M > maxDepth) continue;
        this.deco.push({ kind, x, y, size: rand(r, 0.7, 1.4), phase: r() * 10, tint: r(), push: kind === 'coral' ? this.floorSlope(x) : 0, pushV: 0 });
      }
    };
    add('rock', this.def.rocks, Infinity);
    add('kelp', this.def.kelp, 260);
    add('coral', this.def.coral, 170);
    for (let i = 0; i < scaled(this.def.reefs ?? 0); i++) {
      const cx = rand(r, 400, this.width - 400);
      const n = 10 + Math.floor(r() * 9);
      for (let j = 0; j < n; j++) {
        const x = cx + rand(r, -280, 280);
        const y = this.floorAt(x);
        if (y / PX_PER_M > 170 || this.atMouth(x, y) || Math.abs(this.floorAt(x + 20) - this.floorAt(x - 20)) > 30) continue;
        this.deco.push({ kind: 'coral', x, y, size: rand(r, 0.8, 1.9), phase: r() * 10, tint: r(), push: this.floorSlope(x), pushV: 0 });
      }
    }
    if (this.abyss) {
      const { x, y } = this.abyss.relic;
      let ground = y;
      while (!this.caveSolid(x, ground + 4)) ground += 4;
      this.deco.push({ kind: 'lungsub', x, y: ground, size: 1, phase: 0, tint: 0.5, push: 0, pushV: 0 });
    }
    const pickBone = (): BoneKind => {
      let roll = r();
      for (const k of BONE_KINDS) {
        roll -= BONE_WEIGHTS[k];
        if (roll <= 0) return k;
      }
      return 'bone';
    };
    const lay = (x: number, ground: (v: number) => number) => {
      const slope = Math.atan2(ground(x + 40) - ground(x - 40), 80);
      this.deco.push({ kind: pickBone(), x, y: ground(x), size: rand(r, 0.8, 1.3), phase: r() * 10, tint: r(), push: clamp(slope, -0.5, 0.5), pushV: 0 });
    };
    for (let i = 0; i < scaled(this.def.bones ?? 0); i++) lay(rand(r, 100, this.width - 100), (v) => this.floorAt(v));

    const cavern = (v: number) => this.abyssBottom(v);
    for (let i = 0; i < scaled(this.abyss?.bones ?? 0); i++) {
      const x = rand(r, 100, this.width - 100);
      if (this.caveSolid(x, cavern(x) + 12)) lay(x, cavern);
    }

    const tunnels = this.caveBlobs.filter((b) => !this.abyss || b.y + b.r < this.abyssTop(b.x) - 40);
    const floorBelow = (x: number, y: number) => {
      let g = y;
      while (g < y + 900 && !this.caveSolid(x, g + 4)) g += 4;
      return g;
    };
    const caveBones = scaled(this.def.caves?.reduce((n, c) => n + (c.bones ?? 0), 0) ?? 0);
    for (let i = 0, placed = 0; placed < caveBones && i < caveBones * 12 && tunnels.length; i++) {
      const b = tunnels[Math.floor(r() * tunnels.length)];
      const x = b.x + rand(r, -b.r * 0.5, b.r * 0.5);
      if (this.caveSolid(x, b.y)) continue;
      const g = floorBelow(x, b.y);
      if (g >= b.y + 900) continue;
      lay(x, (v) => floorBelow(v, g - 30));
      placed++;
    }
    const caveSum = (key: 'stones' | 'starfish') => scaled(this.def.caves?.reduce((n, c) => n + (c[key] ?? 0), 0) ?? 0);
    this.scatterCave(r, tunnels, floorBelow, 'stone', caveSum('stones'), 0.5, 1.7);
    this.scatterCave(r, tunnels, floorBelow, 'starfish', caveSum('starfish'), 0.5, 1.6);
  }

  /** Scatters decorations over the cave floors, `count` per cave that lists them. */
  private scatterCave(r: Rng, tunnels: { x: number; y: number; r: number }[], floorBelow: (x: number, y: number) => number, kind: 'stone' | 'starfish', count: number, lo: number, hi: number) {
    for (let i = 0, placed = 0; placed < count && i < count * 12 && tunnels.length; i++) {
      const b = tunnels[Math.floor(r() * tunnels.length)];
      const x = b.x + rand(r, -b.r * 0.6, b.r * 0.6);
      if (this.caveSolid(x, b.y)) continue;
      const g = floorBelow(x, b.y);
      if (g >= b.y + 900) continue;
      const slope = Math.atan2(floorBelow(x + 40, g - 30) - floorBelow(x - 40, g - 30), 80);
      this.deco.push({ kind, x, y: floorBelow(x, g - 30), size: rand(r, lo, hi), phase: r() * 10, tint: r(), push: kind === 'starfish' ? clamp(slope, -0.5, 0.5) : 0, pushV: 0 });
      placed++;
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
      if (this.atMouth(x, floor)) continue;
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
    it.x = w.x + (w.kind === 'freighter' ? 1400 : w.kind === 'containers' ? 200 : w.kind === 'galleon' ? 170 : 110);
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
      const front = !CREATURES[spec.kind].harmful && r() < 0.5;
      for (let i = 0; i < n; i++) {
        this.creatures.push({
          kind: spec.kind,
          front,
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
