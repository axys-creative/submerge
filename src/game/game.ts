import { Input } from "./input";
import { World, MAX_SLOPE, type Creature, type ItemInst } from "./world";
import { updateCreature } from "./creatures";
import { DAY_SECONDS, START_DAY, daylight } from "../render/daylight";
import { AudioManager } from "./audio";
import { loadSave, newSave, writeSave, type SaveData } from "./save";
import { STATS, UPGRADES, type UpgradeId } from "../data/upgrades";
import { ITEMS, ITEM_KINDS } from "../data/items";
import { CREATURES, type CreatureKind } from "../data/creatures";
import { routesFrom, type Endpoint, type Side } from "../data/routes";
import {
  BREATH_TIME,
  FLICKER_TIME,
  SPEECH_TIME,
  PX_PER_M,
  SUB_DOCK_OFFSET,
  SUB_RADIUS,
  VIEW_AREA,
} from "../config";
import { clamp, damp, money, waveY } from "../util";
import { Lighting } from "../render/lighting";
import { renderScene } from "../render/scene";
import { UI } from "../ui/ui";

export type Mode = "docked" | "diving";

export interface Sub {
  x: number;
  y: number;
  vx: number;
  vy: number;
  facing: 1 | -1;
  tilt: number;
  prop: number;
  hull: number;
  oxygen: number;
  battery: number;
  crankLight: number;
  invuln: number;
  stress: number;
  /** Seconds of breath-holding left once the air tank is empty. */
  breath: number;
  diveTime: number;
}

export interface Bubble {
  x: number;
  y: number;
  r: number;
  vx: number;
  vy: number;
  life: number;
}

export interface Dust {
  x: number;
  y: number;
  vx: number;
  vy: number;
  r: number;
  life: number;
  max: number;
}

export interface Popup {
  x: number;
  y: number;
  text: string;
  color: string;
  life: number;
}

export interface Blip {
  x: number;
  y: number;
  danger: boolean;
  life: number;
}

export type DockSpot =
  | { kind: "shop"; name: string }
  | { kind: "sail"; side: Side; name: string }
  | null;

type WreckReason = CreatureKind | "pressure" | "oxygen";

const SUB_HALF_WIDTH = 66;
const SWING_REST = 3;
const SWING_MAX = 45;
const SWING_LENGTH = 115;
const SWING_K = 8.5;
const SWING_DAMPING = 1.6;
const SWING_PUSH = 0.35;
const KELP_REACH = 100;
const CLAW_REACH = 50;
const CLAW_EXTEND = 0.35;
const CLAW_GRAB = 0.15;
const CLAW_RETRACT = 0.4;
const CLAW_RADIUS = 36;
const CLAW_MOUNT = { x: 2, y: 22 };
/** Seagulls are heard within three island widths (an island is about 500 px across). */
const GULL_EARSHOT = 1500;
const SINK_START = 40;
const SINK_RAMP = 60;
const SINK_ACCEL = 24;
/** The sub counts as at the surface (refilling air) once it is above ENTER, until it sinks below STAY. */
const SURFACE_ENTER = 26;
const SURFACE_STAY = 38;
const DEATH_FADE_END = 6;
const SURFACE_Y = 8;
const SURFACE_RAMP = 12;
const SURFACE_GRAVITY = 1100;
const SHIP_MARGIN = 160;
const SAIL_ZONE = 260;

export class Game {
  readonly canvas: HTMLCanvasElement;
  readonly ctx: CanvasRenderingContext2D;
  readonly input = new Input();
  readonly lighting = new Lighting();
  readonly ui: UI;
  save: SaveData;
  world: World;
  hasSave: boolean;
  mode: Mode = "docked";
  day = START_DAY;
  audio = new AudioManager();
  underwater = false;
  private driving = false;
  private lastBump = 0;
  atSurface = false;
  /** The grabber arm: t is seconds since it was fired (-1 when stowed), dir is its world direction. */
  claw = { t: -1, dirX: 0, dirY: 1, grabbed: false };
  dust: Dust[] = [];
  /** 0 for the light HUD theme, 1 for dark: night, or deep water by day. Eases between the two. */
  uiDark = 0;
  private pinged = new Set<object>();
  private swing = { gap: SWING_REST, vel: 0 };
  private swingFacing: 1 | -1 = 1;
  private halfAir = false;
  private halfBattery = false;
  /** Short messages shown over the sub, newest first. */
  speech: { text: string; color: string; life: number; age: number; key?: string }[] = [];
  flicker = 0;
  warning = false;
  ship: { x: number; vx: number; facing: 1 | -1 } = { x: 0, vx: 0, facing: 1 };
  sub!: Sub;
  cam = { x: 0, y: 0 };
  view = { w: 1280, h: 720, scale: 1, dpr: 1 };
  t = 0;
  paused = true;
  bubbles: Bubble[] = [];
  popups: Popup[] = [];
  blips: Blip[] = [];
  sonar = { timer: 1, ring: -1 };
  shake = 0;
  hitFlash = 0;
  travel: { to: Endpoint; t: number; switched: boolean } | null = null;
  private saveTimer = 0;
  private batteryWarned = false;

  constructor(canvas: HTMLCanvasElement) {
    this.canvas = canvas;
    this.ctx = canvas.getContext("2d")!;
    const loaded = loadSave();
    this.hasSave = !!loaded;
    this.save = loaded ?? newSave();
    this.world = new World(this.save.zone);
    this.ship.x = clamp(this.save.shipX, SHIP_MARGIN, this.world.width - SHIP_MARGIN);
    this.day = this.save.day;
    this.resetSub();
    this.snapCamera();
    this.resize();
    addEventListener("resize", () => this.resize());
    const flush = () => this.hasSave && this.persist();
    addEventListener("pagehide", flush);
    document.addEventListener("visibilitychange", () => document.hidden && flush());
    this.ui = new UI(this);
  }

  get up() {
    return this.save.upgrades;
  }
  get depthRating() {
    return STATS.depthRating[this.up.plating];
  }
  get maxOxygen() {
    return STATS.oxygen[this.up.oxygen];
  }
  get maxBattery() {
    return STATS.battery[this.up.battery];
  }
  get maxHull() {
    return STATS.maxHull[this.up.hull];
  }
  get depthM() {
    return this.mode === "diving" ? Math.max(0, this.sub.y / PX_PER_M) : 0;
  }
  /** 0..1 spotlight strength: follows the battery, or the hand crank once the battery is dead. */
  get lightPower() {
    const s = this.sub;
    return Math.max(Math.min(1, s.battery / this.maxBattery / 0.5), s.crankLight);
  }
  /** Rides the waves while the sub floats at the surface. */
  get surfaceBob() {
    if (this.mode !== "diving") return 0;
    return waveY(this.sub.x, this.t) * 0.9 * clamp(1 - (this.sub.y - 4) / 22, 0, 1);
  }
  get shipBob() {
    return Math.sin(this.t * 1.3) * 3;
  }

  start() {
    let last = performance.now();
    const frame = (now: number) => {
      const dt = Math.min(0.05, (now - last) / 1000);
      last = now;
      this.step(dt);
      renderScene(this);
      this.ui.update();
      this.input.endFrame();
      requestAnimationFrame(frame);
    };
    requestAnimationFrame(frame);
  }

  resize() {
    const dpr = Math.min(devicePixelRatio || 1, 2);
    const w = innerWidth;
    const h = innerHeight;
    this.canvas.width = Math.round(w * dpr);
    this.canvas.height = Math.round(h * dpr);
    const scale = Math.sqrt((w * h) / VIEW_AREA);
    this.view = { w: w / scale, h: h / scale, scale, dpr };
    this.lighting.resize(this.canvas.width, this.canvas.height);
  }

  // ---- Saves -------------------------------------------------------------

  persist() {
    this.save.shipX = this.ship.x;
    this.save.day = this.day;
    writeSave(this.save);
    this.hasSave = true;
  }

  loadGame(s: SaveData) {
    this.save = s;
    this.world = new World(s.zone);
    this.ship.x = clamp(s.shipX, SHIP_MARGIN, this.world.width - SHIP_MARGIN);
    this.day = s.day;
    this.ship.vx = 0;
    this.mode = "docked";
    this.travel = null;
    this.bubbles = [];
    this.popups = [];
    this.blips = [];
    this.resetSub();
    this.snapCamera();
    this.persist();
  }

  newGame() {
    this.loadGame(newSave());
  }

  // ---- Economy -----------------------------------------------------------

  cargoValue() {
    let v = 0;
    for (const k of ITEM_KINDS) v += (this.save.cargo[k] ?? 0) * ITEMS[k].value;
    return v;
  }

  cargoCount() {
    let n = 0;
    for (const k of ITEM_KINDS) n += this.save.cargo[k] ?? 0;
    return n;
  }

  sellAll() {
    const v = this.cargoValue();
    if (!v) return 0;
    this.save.money += v;
    this.save.stats.earned += v;
    this.save.cargo = {};
    this.persist();
    return v;
  }

  buy(id: UpgradeId) {
    const next = UPGRADES[id].levels[this.up[id] + 1];
    if (!next || this.save.money < next.cost) return false;
    this.save.money -= next.cost;
    this.up[id]++;
    this.audio.play("chime1");
    if (this.mode === "docked") this.resetSub();
    this.persist();
    return true;
  }

  dockSpot(): DockSpot {
    if (this.mode !== "docked") return null;
    const x = this.ship.x;
    for (const isl of this.world.def.islands)
      if (Math.abs(isl.x - x) < 200) return { kind: "shop", name: isl.name };
    const z = this.save.zone;
    if (x > this.world.width - SAIL_ZONE && routesFrom(z, "east").length)
      return { kind: "sail", side: "east", name: "the route map" };
    if (x < SAIL_ZONE && routesFrom(z, "west").length)
      return { kind: "sail", side: "west", name: "the route map" };
    return null;
  }

  // ---- Main update -------------------------------------------------------

  private step(dt: number) {
    if (this.input.pressed("menu")) this.ui.onMenuKey();
    this.t += dt;
    this.underwater = this.mode === "diving" && this.sub.y > (this.underwater ? 16 : 30);
    this.audio.setScene(this.underwater ? "dive" : "surface");
    this.flicker = Math.max(0, this.flicker - dt);
    if (this.speech.length) {
      for (const b of this.speech) {
        b.life -= dt;
        b.age += dt;
      }
      this.speech = this.speech.filter((b) => b.life > 0);
    }
    const listenX = this.mode === "diving" ? this.sub.x : this.ship.x;
    const islandDist = Math.min(Infinity, ...this.world.def.islands.map((isl) => Math.abs(isl.x - listenX)));
    const daytime = daylight(this.day).night < 0.5;
    this.audio.gulls(dt, daytime ? clamp(1 - islandDist / GULL_EARSHOT, 0, 1) : 0);
    this.audio.musicTick(dt, this.depthM);
    this.audio.gullMuffleTick(dt, this.depthM);
    const [dim, full] = this.world.def.darkness;
    const deep = this.mode === "diving" && this.depthM > dim + (full - dim) * 0.25;
    const wantDark = daylight(this.day).night > 0.5 || deep;
    this.uiDark += ((wantDark ? 1 : 0) - this.uiDark) * damp(2.5, dt);
    this.audio.setPropeller(this.driving);
    this.audio.tick(dt, this.warning && !this.paused);
    this.driving = false;
    this.warning = false;
    if (!this.paused) this.day = (this.day + dt / DAY_SECONDS) % 1;
    const live = !this.paused && !this.travel;

    if (live) {
      if (this.mode === "docked") this.updateDocked(dt);
      else this.updateDiving(dt);
    } else if (this.mode === "docked") {
      this.placeDockedSub();
    }
    if (this.travel) this.updateTravel(dt);

    const target = this.mode === "diving" && live ? { x: this.sub.x, y: this.sub.y } : null;
    const creatures = this.world.creatures;
    for (const c of creatures) updateCreature(c, dt, this.world, target);
    for (let i = creatures.length - 1; i >= 0; i--) {
      if (creatures[i].state === "dead" && creatures[i].dying > DEATH_FADE_END) creatures.splice(i, 1);
    }
    this.world.update(this.t);
    this.updateEffects(dt);
    this.updateCamera(dt);
  }

  private updateDocked(dt: number) {
    const ax = this.input.axis().x;
    if (Math.abs(ax) > 0.2) this.ship.facing = ax > 0 ? 1 : -1;
    const prevVx = this.ship.vx;
    this.ship.vx += (ax * 280 - this.ship.vx) * damp(2.5, dt);
    const x = this.ship.x + this.ship.vx * dt;
    this.ship.x = clamp(x, SHIP_MARGIN, this.world.width - SHIP_MARGIN);
    if (this.ship.x !== x) this.ship.vx = 0;
    this.updateSwing(dt, (this.ship.vx - prevVx) / dt);
    this.placeDockedSub();

    if (this.input.pressed("dive") || this.input.pressed("down")) {
      this.launch();
      return;
    }
    if (this.input.pressed("action")) this.useDockSpot();

    this.saveTimer += dt;
    if (this.saveTimer > 8 && this.hasSave) {
      this.saveTimer = 0;
      this.persist();
    }
  }

  /** Starts the trip to a zone end picked on the route map. */
  sailTo(dest: Endpoint) {
    if (this.mode !== "docked" || this.travel) return;
    this.travel = { to: dest, t: 0, switched: false };
  }

  useDockSpot() {
    const spot = this.dockSpot();
    if (!spot) return;
    if (spot.kind === "shop") this.ui.openShop(spot.name);
    else this.ui.openRouteMap({ zone: this.save.zone, side: spot.side });
  }

  launch() {
    if (this.mode !== "docked") return;
    this.mode = "diving";
    this.audio.play("splash");
    const x = this.dockedX();
    this.resetSub();
    const s = this.sub;
    s.x = x;
    s.y = 16;
    s.vy = 150;
    s.vx = this.ship.vx * 0.5;
    this.ship.vx = 0;
    this.batteryWarned = false;
    this.sonar = { timer: 0.6, ring: -1 };
    this.save.stats.dives++;
    this.emitBubbles(s.x, s.y + 10, 14, 40);
  }

  private dock() {
    this.audio.play("clank1");
    this.mode = "docked";
    this.resetSub();
    this.blips = [];
    this.popup(
      this.ship.x + SUB_DOCK_OFFSET * this.ship.facing,
      -70,
      "Docked! Recharged",
      "#9CF2C4",
    );
    this.persist();
    if (this.cargoCount() > 0 && this.world.def.islands.length) {
      this.ui.toast("Sail to an island shop to sell your haul");
    }
  }

  private updateDiving(dt: number) {
    const s = this.sub;
    const inp = this.input;
    s.diveTime += dt;
    const a = inp.axis();
    const moving = Math.hypot(a.x, a.y) > 0.1;
    const cranks = inp.takeCranks();
    const speed = STATS.speed[this.up.propeller];
    s.crankLight = Math.max(0, Math.min(0.8, s.crankLight + cranks * 0.18 - dt * 0.15));

    if (s.battery > 0) {
      if (moving) {
        s.vx += a.x * 560 * speed * dt;
        s.vy += a.y * 560 * speed * dt;
      }
    } else if (cranks) {
      const dx = moving ? a.x : s.facing;
      const dy = moving ? a.y : 0;
      const m = Math.hypot(dx, dy) || 1;
      s.vx += (dx / m) * 75 * cranks;
      s.vy += (dy / m) * 75 * cranks;
      this.emitBubbles(s.x - s.facing * 70, s.y, 2, 6);
    }

    if (s.y < SURFACE_Y)
      s.vy += SURFACE_GRAVITY * clamp((SURFACE_Y - s.y) / SURFACE_RAMP, 0, 1) * dt;

    const drag = Math.exp(-2.4 * dt);
    const top = 250 * speed;
    s.vx *= drag;
    s.vy *= drag;
    const sp = Math.hypot(s.vx, s.vy);
    if (sp > top) {
      s.vx *= top / sp;
      s.vy *= top / sp;
    }

    const sinkDepth = s.y / PX_PER_M;
    if (sinkDepth > SINK_START) {
      const ramp = Math.min(1, (sinkDepth - SINK_START) / SINK_RAMP);
      s.vy += SINK_ACCEL * ramp * (1 + Math.max(0, sinkDepth - SINK_START - SINK_RAMP) / 300) * dt;
    }

    const px = s.x;
    const py = s.y;
    s.x = clamp(s.x + s.vx * dt, 60, this.world.width - 60);
    s.y += s.vy * dt;
    if (s.battery > 0 && moving) {
      s.battery = Math.max(0, s.battery - Math.hypot(s.x - px, s.y - py));
      if (s.battery === 0 && !this.batteryWarned) {
        this.batteryWarned = true;
        this.ui.toast(
          this.ui.touch
            ? "Battery empty! Tap the two crank buttons back and forth"
            : "Battery empty! Press E and R back and forth to hand-crank",
        );
      }
    }

    if (s.y < -90) {
      s.y = -90;
      s.vy = Math.max(0, s.vy);
    }
    if (this.world.blocked(px, s.x, s.y, SUB_HALF_WIDTH, 26)) {
      this.bump(Math.abs(s.vx));
      this.kickUpDust(px + Math.sign(s.vx) * SUB_HALF_WIDTH, s.y, -Math.sign(s.vx), 0, Math.abs(s.vx));
      s.x = px;
      s.vx = 0;
    }
    const clearAt = (x: number) => this.world.clearFloorAt(x, SUB_HALF_WIDTH) - 26;
    if (s.y > clearAt(s.x)) {
      const steep = Math.abs(clearAt(s.x + 8) - clearAt(s.x - 8)) / 16 > MAX_SLOPE;
      let pushed = false;
      for (let d = 4; steep && !pushed && d <= 64; d += 4) {
        for (const dir of [1, -1]) {
          if (s.y <= clearAt(s.x + dir * d)) {
            s.x += dir * d;
            pushed = true;
            break;
          }
        }
      }
      if (!pushed) {
        s.y = clearAt(s.x);
        if (s.vy > 0) {
          this.bump(s.vy);
          this.kickUpDust(s.x, s.y + 26, 0, -1, s.vy);
          s.vy *= -0.2;
        }
        s.vx *= 0.97;
      }
    }

    if (Math.abs(a.x) > 0.2) s.facing = a.x > 0 ? 1 : -1;
    s.tilt += (clamp(s.vy / 240, -1, 1) * 0.35 - s.tilt) * damp(6, dt);
    const spin = moving && s.battery > 0 ? 0.6 + sp * 0.012 : cranks ? 0.4 : 0;
    s.prop += spin * dt * 10;
    if (moving && s.battery > 0 && Math.random() < dt * 14)
      this.emitBubbles(s.x - s.facing * 72, s.y, 1, 8);

    this.driving = moving && s.battery > 0;
    this.atSurface = s.y < (this.atSurface ? SURFACE_STAY : SURFACE_ENTER);
    const surfaced = this.atSurface;
    if (surfaced) s.oxygen = Math.min(this.maxOxygen, s.oxygen + 30 * dt);
    else s.oxygen = Math.max(0, s.oxygen - dt);
    const holding = s.oxygen <= 0 && !surfaced;
    if (holding) {
      s.breath -= dt;
      this.shake = Math.max(this.shake, 0.08);
      if (s.breath <= 0) return this.wreck("oxygen");
    } else if (s.oxygen > 0) s.breath = BREATH_TIME;
    this.pinSpeech("breath", holding, "Holding my breath!", "#E5484D");

    const depth = s.y / PX_PER_M;
    this.save.stats.deepest = Math.max(this.save.stats.deepest, Math.floor(depth));
    this.warning =
      (!surfaced && s.oxygen < Math.min(20, this.maxOxygen * 0.25)) ||
      depth > this.depthRating - 10;
    this.audio.depthSounds(depth / this.depthRating, s.y, dt);
    this.pinSpeech(
      "rudders",
      s.battery <= 0,
      this.ui.touch
        ? "Use the rudders: tap the E and R buttons"
        : "Use the rudders with E and R (or J and K)",
      "#E5484D",
    );
    const depthFrac = depth / this.depthRating;
    this.pinSpeech(
      "depth",
      depthFrac >= 0.8,
      depthFrac > 1 ? "Too deep! Head up now!" : "We're going too deep!",
      "#E5484D",
    );
    this.halfAir = this.sayAtHalf(
      s.oxygen / this.maxOxygen,
      this.halfAir,
      "Air is at half!",
      "#2AA6C9",
    );
    this.halfBattery = this.sayAtHalf(
      s.battery / this.maxBattery,
      this.halfBattery,
      "Battery is at half!",
      "#D9A21E",
    );
    if (depth > this.depthRating) {
      s.stress += dt;
      this.shake = Math.max(this.shake, 0.08);
      if (s.stress >= 3) {
        s.stress = 0;
        if (this.damage(null)) return;
      }
    } else {
      s.stress = Math.max(0, s.stress - dt * 2);
    }

    s.invuln = Math.max(0, s.invuln - dt);
    for (const c of this.world.creatures) {
      if (c.state === "dead" || !CREATURES[c.kind].harmful || s.invuln > 0) continue;
      const r = CREATURES[c.kind].radius + SUB_RADIUS;
      if ((c.x - s.x) ** 2 + (c.y - s.y) ** 2 < r * r) {
        if (this.damage(c)) return;
      }
    }

    if (this.claw.t < 0 && this.input.pressed("dive")) this.fireClaw(a);
    this.updateClaw(dt);

    for (const it of this.world.items) {
      if (!it.alive) continue;
      const r = SUB_RADIUS + ITEMS[it.kind].size * 0.5;
      if ((it.x - s.x) ** 2 + (it.y - s.y) ** 2 < r * r) this.collect(it);
    }

    this.updateSonar(dt);

    if (s.diveTime > 1.5 && s.y < 50 && Math.abs(s.x - this.ship.x) < 230) this.dock();
  }

  /** Returns true when the hit wrecked the sub. */
  /** Posts a message the first time `frac` drops to 50%; returns the new "already said" flag. */
  private sayAtHalf(frac: number, said: boolean, text: string, color: string) {
    if (frac > 0.5) return false;
    if (!said) this.speech.unshift({ text, color, life: SPEECH_TIME, age: 0 });
    return true;
  }

  /** Keeps a bubble up for as long as `on` is true. */
  private pinSpeech(key: string, on: boolean, text: string, color: string) {
    const existing = this.speech.find((b) => b.key === key);
    if (!on) {
      if (existing) this.speech = this.speech.filter((b) => b !== existing);
    } else if (existing) {
      existing.text = text;
      existing.color = color;
    } else this.speech.unshift({ text, color, life: Infinity, age: 0, key });
  }

  private fireClaw(aim: { x: number; y: number }) {
    const strong = Math.hypot(aim.x, aim.y) > 0.3;
    let x = strong ? aim.x : this.sub.facing * Math.tan((15 * Math.PI) / 180);
    let y = strong ? aim.y : 1;
    y = Math.max(y, 0.3);
    const m = Math.hypot(x, y);
    this.claw = { t: 0, dirX: x / m, dirY: y / m, grabbed: false };
  }

  /** Where the claw's mount and tip are in the world, and how open its jaws are (1 open, 0 shut). */
  clawState() {
    const c = this.claw;
    if (c.t < 0) return null;
    const s = this.sub;
    const cos = Math.cos(s.tilt);
    const sin = Math.sin(s.tilt);
    const px = s.x + s.facing * (CLAW_MOUNT.x * cos - CLAW_MOUNT.y * sin);
    const py = s.y + CLAW_MOUNT.x * sin + CLAW_MOUNT.y * cos;
    const ease = (u: number) => u * u * (3 - 2 * u);
    const grabEnd = CLAW_EXTEND + CLAW_GRAB;
    let len = CLAW_REACH;
    let open = 1;
    if (c.t < CLAW_EXTEND) len = CLAW_REACH * ease(c.t / CLAW_EXTEND);
    else if (c.t < grabEnd) open = 1 - (c.t - CLAW_EXTEND) / CLAW_GRAB;
    else {
      open = 0;
      len = CLAW_REACH * (1 - ease(Math.min(1, (c.t - grabEnd) / CLAW_RETRACT)));
    }
    return { px, py, tx: px + c.dirX * len, ty: py + c.dirY * len, dirX: c.dirX, dirY: c.dirY, open };
  }

  private updateClaw(dt: number) {
    const c = this.claw;
    if (c.t < 0) return;
    c.t += dt;
    if (!c.grabbed && c.t >= CLAW_EXTEND + CLAW_GRAB * 0.6) {
      c.grabbed = true;
      const st = this.clawState()!;
      let got = false;
      for (const it of this.world.items) {
        if (!it.alive) continue;
        const r = CLAW_RADIUS + ITEMS[it.kind].size * 0.5;
        if ((it.x - st.tx) ** 2 + (it.y - st.ty) ** 2 < r * r) {
          this.collect(it);
          got = true;
        }
      }
      this.audio.hit(got ? 0.4 : 0.25);
    }
    if (c.t >= CLAW_EXTEND + CLAW_GRAB + CLAW_RETRACT) c.t = -1;
  }

  /** Puffs of grit away from a surface (normal nx, ny) the sub just hit. */
  private kickUpDust(x: number, y: number, nx: number, ny: number, speed: number) {
    if (speed < 45) return;
    const n = Math.min(14, 4 + Math.floor(speed / 25));
    for (let i = 0; i < n; i++) {
      const away = 20 + Math.random() * 60;
      const side = (Math.random() - 0.5) * 90;
      const life = 0.9 + Math.random() * 0.9;
      this.dust.push({
        x: x + (Math.random() - 0.5) * 30 * Math.abs(ny),
        y: y + (Math.random() - 0.5) * 30 * Math.abs(nx),
        vx: nx * away - ny * side,
        vy: ny * away + nx * side,
        r: 1.5 + Math.random() * 2.5,
        life,
        max: life,
      });
    }
  }

  private bump(speed: number) {
    if (speed < 40 || this.t - this.lastBump < 0.35) return;
    this.lastBump = this.t;
    this.flicker = FLICKER_TIME;
    this.audio.hit(clamp(speed / 200, 0.4, 1));
  }

  private damage(c: Creature | null): boolean {
    const s = this.sub;
    s.hull--;
    this.flicker = FLICKER_TIME;
    if (c || s.hull > 0) this.audio.hit();
    s.invuln = 2;
    this.shake = 0.45;
    this.hitFlash = 0.35;
    if (c) {
      const dx = s.x - c.x;
      const dy = s.y - c.y;
      const d = Math.hypot(dx, dy) || 1;
      s.vx += (dx / d) * 280;
      s.vy += (dy / d) * 280;
      c.vx = (-dx / d) * 220;
      c.vy = (-dy / d) * 220;
      if (c.kind === "angler") {
        c.state = "dead";
        c.dying = 0;
      } else {
        c.state = "rest";
        c.timer = 2.5;
      }
    }
    if (s.hull <= 0) {
      this.wreck(c ? c.kind : "pressure");
      return true;
    }
    this.popup(s.x, s.y - 50, c ? "Ouch!" : "Creeeak!", "#FF8A8E");
    return false;
  }

  private wreck(reason: WreckReason) {
    if (reason === "pressure") this.audio.play("implosion");
    const lostValue = this.cargoValue();
    const lostCount = this.cargoCount();
    this.save.cargo = {};
    this.persist();
    const titles: Record<WreckReason, string> = {
      shark: "Great white attack!",
      hammerhead: "Hammerhead attack!",
      squid: "Squeezed by a squid!",
      angler: "Anglerfish ambush!",
      fish: "Bonked by a fish!",
      jelly: "Stung!",
      pressure: "Hull crushed!",
      oxygen: "Out of air!",
    };
    const tips: Record<WreckReason, string> = {
      shark: "Great whites give chase, but even a stock propeller outswims them. Bumper upgrades help you survive a hit.",
      hammerhead: "Hammerheads patrol back and forth. Steer around them.",
      squid: "Squid lunge when you get close. Give them room.",
      angler: "Anglerfish hunt by their glowing lure. Sonar spots them early.",
      fish: "",
      jelly: "",
      pressure: `Your plating is only safe to ${this.depthRating} m. Upgrade it to go deeper.`,
      oxygen: "Head back up to the surface to refill your air.",
    };
    const lost = lostCount
      ? `You lost ${lostCount} ${lostCount === 1 ? "item" : "items"} worth ${money(lostValue)}.`
      : "Luckily your hold was empty.";
    this.ui.showMessage(
      titles[reason],
      `A rescue crew towed your sub back to the ship. ${lost}`,
      tips[reason],
      () => this.recover(),
      () => {
        this.recover();
        this.ui.showTitle();
      },
    );
  }

  /** Moves the wrecked sub back to the ship once the player dismisses the wreck message. */
  private recover() {
    this.mode = "docked";
    this.resetSub();
    this.blips = [];
    this.snapCamera();
    this.persist();
  }

  private collect(it: ItemInst) {
    const def = ITEMS[it.kind];
    it.alive = false;
    if (def.treasure) this.audio.play("chime2");
    it.respawnAt = this.t + (it.wreck >= 0 ? 240 : 60 + Math.random() * 60);
    this.save.cargo[it.kind] = (this.save.cargo[it.kind] ?? 0) + 1;
    this.popup(
      it.x,
      it.y - 30,
      `+${money(def.value)} ${def.name}`,
      def.treasure ? "#FFD95A" : "#FFFFFF",
    );
    this.emitBubbles(it.x, it.y, 6, 20);
  }

  private updateSonar(dt: number) {
    const level = this.up.sonar;
    if (!level) {
      this.sonar.ring = -1;
      this.blips = [];
      return;
    }
    const range = STATS.sonarRange[level];
    if (this.sonar.ring >= 0) {
      this.sonar.ring += range * dt * 0.9;
      this.markSonarContacts(level);
      if (this.sonar.ring > range) this.sonar.ring = -1;
    }
    this.sonar.timer -= dt;
    if (this.sonar.timer > 0) return;
    this.sonar.timer = STATS.sonarInterval[level];
    this.sonar.ring = 0;
    this.pinged.clear();
    this.audio.play("sonar");
  }

  /** Adds a blip for anything the expanding ping ring has just reached, where it was at that moment. */
  private markSonarContacts(level: number) {
    const s = this.sub;
    const reach = this.sonar.ring;
    const hit = (x: number, y: number, radius: number) => Math.hypot(x - s.x, y - s.y) - radius <= reach;
    for (const c of this.world.creatures) {
      const harmful = CREATURES[c.kind].harmful;
      if (c.state === "dead" || this.pinged.has(c) || (!harmful && level < 3)) continue;
      if (hit(c.x, c.y, CREATURES[c.kind].radius)) {
        this.pinged.add(c);
        this.blips.push({ x: c.x, y: c.y, danger: harmful, life: 2.4 });
      }
    }
    if (level < 2) return;
    for (const it of this.world.items) {
      if (this.pinged.has(it) || !it.alive || (!ITEMS[it.kind].treasure && level < 3)) continue;
      if (hit(it.x, it.y, ITEMS[it.kind].size * 0.45)) {
        this.pinged.add(it);
        this.blips.push({ x: it.x, y: it.y, danger: false, life: 2.4 });
      }
    }
  }

  private updateTravel(dt: number) {
    const tr = this.travel!;
    tr.t += dt;
    if (tr.t >= 0.5 && !tr.switched) {
      tr.switched = true;
      this.save.zone = tr.to.zone;
      this.world = new World(this.save.zone);
      this.ship.x = tr.to.side === "west" ? SHIP_MARGIN + 40 : this.world.width - SHIP_MARGIN - 40;
      this.ship.facing = tr.to.side === "west" ? 1 : -1;
      this.ship.vx = 0;
      this.resetSub();
      this.bubbles = [];
      this.popups = [];
      this.snapCamera();
      this.persist();
      this.ui.toast(`Welcome to ${this.world.def.name}`);
    }
    if (tr.t >= 1) this.travel = null;
  }

  /** Kelp near the sub bends with the water the sub pushes past it, then springs back. */
  private updateKelp(dt: number) {
    const s = this.sub;
    const near = this.mode === "diving";
    for (const d of this.world.deco) {
      if (d.kind !== "kelp") continue;
      const dx = d.x - s.x;
      if (near && Math.abs(dx) < KELP_REACH) {
        const height = 90 + d.size * 80;
        if (s.y > d.y - height - 20 && s.y < d.y + 10) {
          const influence = 1 - Math.abs(dx) / KELP_REACH;
          const drag = s.vx * 0.9 + Math.sign(dx) * Math.abs(s.vy) * 0.4;
          d.pushV += drag * influence * 6 * dt;
        }
      }
      d.pushV += (-d.push * 14 - d.pushV * 3) * dt;
      d.push = clamp(d.push + d.pushV * dt, -50, 50);
    }
  }

  private updateEffects(dt: number) {
    this.updateKelp(dt);
    const drag = Math.exp(-2.5 * dt);
    for (const d of this.dust) {
      d.vx *= drag;
      d.vy = d.vy * drag + 10 * dt;
      d.x += d.vx * dt;
      d.y += d.vy * dt;
      d.life -= dt;
    }
    this.dust = this.dust.filter((d) => d.life > 0);
    for (const b of this.bubbles) {
      b.vy -= 40 * dt;
      b.x += (b.vx + Math.sin(b.life * 6 + b.r) * 10) * dt;
      b.y += b.vy * dt;
      b.life -= dt;
    }
    this.bubbles = this.bubbles.filter((b) => b.life > 0 && b.y > 4);
    for (const p of this.popups) {
      p.y -= 30 * dt;
      p.life -= dt;
    }
    this.popups = this.popups.filter((p) => p.life > 0);
    for (const b of this.blips) b.life -= dt;
    this.blips = this.blips.filter((b) => b.life > 0);
    this.shake = Math.max(0, this.shake - dt);
    this.hitFlash = Math.max(0, this.hitFlash - dt);
  }

  private updateCamera(dt: number) {
    const docked = this.mode === "docked";
    const tx = docked ? this.ship.x - 60 : this.sub.x;
    const ty = docked ? -80 : this.sub.y;
    const f = damp(docked ? 4 : 6, dt);
    this.cam.x += (tx - this.cam.x) * f;
    this.cam.y += (ty - this.cam.y) * f;
    this.clampCamera();
  }

  private snapCamera() {
    const docked = this.mode === "docked";
    this.cam.x = docked ? this.ship.x - 60 : this.sub.x;
    this.cam.y = docked ? -80 : this.sub.y;
    this.clampCamera();
  }

  private clampCamera() {
    const hw = this.view.w / 2;
    const hh = this.view.h / 2;
    this.cam.x = clamp(this.cam.x, hw - 400, this.world.width - hw + 400);
    const minY = hh - 400;
    this.cam.y = clamp(this.cam.y, minY, Math.max(minY, this.world.maxFloor + 160 - hh));
  }

  private resetSub() {
    this.halfAir = false;
    this.halfBattery = false;
    this.speech = [];
    this.swing = { gap: SWING_REST, vel: 0 };
    this.claw.t = -1;
    this.sub = {
      x: this.ship.x + SUB_DOCK_OFFSET * this.ship.facing,
      y: -2,
      vx: 0,
      vy: 0,
      facing: this.ship.facing,
      tilt: 0,
      prop: 0,
      hull: this.maxHull,
      oxygen: this.maxOxygen,
      battery: this.maxBattery,
      crankLight: 0,
      invuln: 0,
      stress: 0,
      breath: BREATH_TIME,
      diveTime: 0,
    };
  }

  /** Where the hanging sub is, including how far it has swung back from the ship. */
  private dockedX() {
    return this.ship.x + this.ship.facing * (SUB_DOCK_OFFSET - (this.swing.gap - SWING_REST));
  }

  private placeDockedSub() {
    this.sub.x = this.dockedX();
    this.sub.y = -2 + this.shipBob;
    this.sub.tilt = ((this.swing.gap - SWING_REST) / SWING_LENGTH) * 0.8;
    this.sub.facing = this.ship.facing;
  }

  /** The sub hangs from the crane like a pendulum: it trails the ship and bumps the stern when the ship stops. */
  private updateSwing(dt: number, accel: number) {
    const w = this.swing;
    if (this.swingFacing !== this.ship.facing) {
      this.swingFacing = this.ship.facing;
      w.gap = SWING_REST;
      w.vel = 0;
      return;
    }
    const forward = accel * this.ship.facing;
    w.vel += (-SWING_K * (w.gap - SWING_REST) - SWING_DAMPING * w.vel + forward * SWING_PUSH) * dt;
    w.gap += w.vel * dt;
    if (w.gap > SWING_MAX) {
      w.gap = SWING_MAX;
      w.vel = Math.min(0, w.vel);
    }
    if (w.gap < 0) {
      const impact = -w.vel;
      w.gap = 0;
      w.vel = impact * 0.35;
      if (impact > 30 && this.t - this.lastBump > 0.35) {
        this.lastBump = this.t;
        this.audio.hit(Math.min(0.5, impact / 120));
      }
    }
  }

  emitBubbles(x: number, y: number, n: number, spread: number) {
    for (let i = 0; i < n; i++) {
      this.bubbles.push({
        x: x + (Math.random() - 0.5) * spread,
        y: y + (Math.random() - 0.5) * spread,
        r: 2 + Math.random() * 4,
        vx: (Math.random() - 0.5) * 30,
        vy: -20 - Math.random() * 40,
        life: 1.5 + Math.random() * 1.5,
      });
    }
  }

  popup(x: number, y: number, text: string, color: string) {
    this.popups.push({ x, y, text, color, life: 1.6 });
  }
}
