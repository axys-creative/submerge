import { Explored } from "./explored";
import { debrisColors } from "../art/sub";
import { Input } from "./input";
import { World, MAX_SLOPE, type Creature, type ItemInst } from "./world";
import { updateCreature } from "./creatures";
import { DAY_SECONDS, START_DAY, daylight } from "../render/daylight";
import { AudioManager } from "./audio";
import { loadSave, newSave, writeSave, type SaveData, type SwitchMode } from "./save";
import { GEAR, STATS, UPGRADES, WEIGHTS, type GearId, type UpgradeId } from "../data/upgrades";
import { WEIGHT_MOUNTS, WEIGHT_Y } from "../art/sub";
import { ITEMS, ITEM_KINDS } from "../data/items";
import { CREATURES, CREATURE_EXTENT, whalePitch, type CreatureKind } from "../data/creatures";
import { leviathanSpine } from "../data/leviathan";
import { routesFrom, type Endpoint, type Side } from "../data/routes";
import {
  BREATH_TIME,
  MAP_REVEAL_RADIUS,
  MONSTER_DEPTH,
  MONSTER_SCALE,
  MONSTER_TRAIL,
  SWALLOW_CLOSE,
  GLITCH_TIME,
  BOOST_SPEED,
  HOOK_TIME,
  BOOST_ZOOM,
  DEBUG_ZOOM,
  DEATH_GLITCH_DELAY,
  GLITCH_GAP,
  SWALLOW_SHUT,
  MONSTER_WAIT,
  WEIGHT_HEARING_MARGIN,
  SINK_FAST,
  SINK_RAMP_M,
  SINK_SLOW,
  IMPLODE_COLLAPSE,
  IMPLODE_MESSAGE,
  LOW_AIR,
  FLICKER_TIME,
  LAMP_ON_DEPTH_DAY,
  LAMP_ON_DEPTH_NIGHT,
  SONAR_ON_DEPTH_DAY,
  SONAR_ON_DEPTH_NIGHT,
  SWITCH_SLACK,
  MAX_CANVAS_PIXELS,
  MAX_FPS,
  SPEECH_TIME,
  PX_PER_M,
  SUB_DOCK_OFFSET,
  DOCK_RANGE,
  SUB_RADIUS,
  SONAR_RAYS,
  SONAR_RING_SPEED,
  TREASURE_DETECT_RANGE,
  VALUABLE_TREASURE,
  VIEW_AREA,
} from "../config";
import { clamp, damp, money, waveY } from "../util";
import { Lighting } from "../render/lighting";
import { SonarOutline, SonarShape, type ShapeSprite } from "../render/sonarOutline";
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

/** A bit of the ship's wake: foam spreading on the water or a droplet thrown up from the hull. */
export interface Foam {
  x: number;
  y: number;
  vx: number;
  vy: number;
  r: number;
  life: number;
  max: number;
  spray: boolean;
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
  /** Starting life, for the pulse. */
  max: number;
  /** How the creature looked when pinged, drawn as an outline instead of a dot. */
  shape?: Creature;
  /** A dropped dive weight, drawn as an outline at this tilt. */
  weight?: number;
  /** The downed submarine in the Leviathan's lair, drawn as an outline. */
  relic?: boolean;
  /** The outline image for `shape`, drawn the first time it is needed. */
  sprite?: ShapeSprite;
}

export type DockSpot =
  | { kind: "shop"; name: string }
  | { kind: "sail"; side: Side; name: string }
  | null;

const SPOT_NOTES: Partial<Record<CreatureKind, { key: string; text: string; color: string }>> = {
  bluewhale: { key: "bluewhale", text: "Wow, a blue whale! These gentle giants won't hurt us.", color: "#6CC5F0" },
  bigfin: { key: "bigfin", text: "A bigfin squid! Those long arms are harmless.", color: "#6CC5F0" },
  shark: { key: "shark", text: "A shark! Avoid it and keep your distance.", color: "#E5484D" },
  hammerhead: { key: "shark", text: "A shark! Avoid it and keep your distance.", color: "#E5484D" },
  whale: { key: "whale", text: "A sperm whale! Steer clear and don't make contact.", color: "#E5484D" },
  squid: { key: "squid", text: "A giant squid! Avoid it and don't get close.", color: "#E5484D" },
  colossal: { key: "squid", text: "A colossal squid! Avoid it and don't get close.", color: "#E5484D" },
};

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
const SINK_MAX_FACTOR = 6;
/** The sub counts as at the surface (refilling air) once it is above ENTER, until it sinks below STAY. */
const SURFACE_ENTER = 26;
const SURFACE_STAY = 38;
/** The ship direction hint appears a little deeper than the air refill zone. */
const SHIP_HINT_ENTER = SURFACE_STAY + 22;
const SHIP_HINT_STAY = SURFACE_STAY + 32;
const DEATH_FADE_END = 6;
const SURFACE_Y = 8;
const SURFACE_RAMP = 12;
const SURFACE_GRAVITY = 1100;
const SHIP_MARGIN = 160;
const SAIL_ZONE = 260;

const WELCOMES = ["Welcome back!", "Welcome back, captain!", "Good to have you back!", "Back safe and sound!"];

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
  private airLow = false;
  private holdingBreath = false;
  /** The grabber arm: t is seconds since it was fired (-1 when stowed), dir is its world direction. */
  claw = { t: -1, dirX: 0, dirY: 1, grabbed: false };
  dust: Dust[] = [];
  /** 0 for the light HUD theme, 1 for dark: night, or deep water by day. Eases between the two. */
  uiDark = 0;
  private pinged = new Set<object>();
  private swing = { gap: SWING_REST, vel: 0 };
  private swingFacing: 1 | -1 = 1;
  private deepWarned = false;
  private halfAir = false;
  private halfBattery = false;
  private lowAir = false;
  private lowBattery = false;
  /** Short messages shown over the sub, newest first. */
  speech: { text: string; color: string; life: number; age: number; key?: string }[] = [];
  flicker = 0;
  warning = false;
  /** 0..1, how strongly the ship's mast light signals valuable treasure below. */
  treasureAlert = 0;
  /** The dive weights are strapped on, and whether they were let go this dive. */
  /** Whether the spotlight is switched on right now, and how bright it is (it eases in and out). */
  lampOn = false;
  lampLevel = 0;
  /** Seconds the spotlight has been on, which times its beam sweeps. */
  lampClock = 0;
  private sonarOnline = false;
  weightsOn = false;
  weightsDropped = false;
  /** Weights that have been dropped and are sinking or resting on the bottom. */
  weightFx: { x: number; y: number; vx: number; vy: number; rot: number; vr: number; rest: boolean }[] = [];
  shipHint = false;
  ship: { x: number; vx: number; facing: 1 | -1 } = { x: 0, vx: 0, facing: 1 };
  sub!: Sub;
  cam = { x: 0, y: 0 };
  /** `ui` is the scale for screen-space drawing; `scale` also includes the dive zoom. */
  view = { w: 1280, h: 720, scale: 1, dpr: 1, ui: 1, zoom: 1 };
  private zoom = 1;
  t = 0;
  paused = true;
  bubbles: Bubble[] = [];
  foam: Foam[] = [];
  /** How far the ship's bow is lifted (negative) or dipped, in radians. */
  shipPitch = 0;
  /** How far the ship's boost is engaged, 0 to 1, which also widens the camera. */
  private boost = 0;
  /** How far the crane hook is reeled up, 0 (down at the sub's mount) to 1 (up under the crane tip). */
  reel = 0;
  /** Set when the warning horn sounded during a dive, for the ship's remark on return. */
  private alarmed = false;
  /** Docks left before the ship says welcome back. */
  private welcomeIn = 3;
  /** Seconds of sailing left before the sub suggests the boost, and whether the player has used it. */
  private boostTipWait = 12;
  private boostUsed = false;
  /** How much the lowered hook is reaching for the sub itself rather than the ship's mounting spot, 0 to 1. */
  hookGrip = 0;
  popups: Popup[] = [];
  blips: Blip[] = [];
  sonarOutline = new SonarOutline();
  sonarShape = new SonarShape();
  /** Pings still fading, oldest first: where each started, when, and how far each ray went before hitting rock (-1 for none). */
  sonarPings: { x: number; y: number; start: number; range: number; linger: number; hits: number[]; scanned: number }[] = [];
  sonar = { timer: 1, ring: -1 };
  shake = 0;
  implode: { t: number; x: number; y: number } | null = null;
  debris: { x: number; y: number; vx: number; vy: number; rot: number; vr: number; w: number; h: number; color: string; life: number }[] = [];
  private electrolysisOn = false;
  private spotted = new Set<string>();
  /** Remarks made once per game session, not once per dive. */
  private said = new Set<string>();
  /** The Crimson Sea monster: it wakes deep in the cavern, then rises from below and chases. */
  /** The sub being eaten by the leviathan: seconds since the mouth took it, and whether the wreck message has been shown. */
  swallow: { t: number; done: boolean } | null = null;
  private monster: { stage: "idle" | "wait" | "chase"; t: number } = { stage: "idle", t: 0 };
  private growlTimer = 0;
  /** Seconds of instrument glitching left in the Crimson Sea, and the wait until the next one. */
  glitch = 0;
  /** Debug mode, from the test panel: the sub is four times as fast, never runs out of air or battery, the water is fully lit, the camera is zoomed far out, the minimap is fully shown and the glitches are off. */
  debugFast = false;
  private deathGlitch: number | null = null;
  private glitchWait = 0;
  private switchStash: { lamp: SwitchMode; sonar: SwitchMode } | null = null;
  /** Candles left this dive; docking restocks them to what the upgrade allows. */
  candlesLeft = 0;
  private sinkSpeed: number | null = null;
  private implodeMessage: (() => void) | null = null;
  hitFlash = 0;
  travel: { to: Endpoint; t: number; switched: boolean } | null = null;
  private saveTimer = 0;
  explored: Explored | null = null;
  private exploredZone = -1;
  private batteryWarned = false;

  constructor(canvas: HTMLCanvasElement) {
    this.canvas = canvas;
    this.ctx = canvas.getContext("2d")!;
    const loaded = loadSave();
    this.hasSave = !!loaded;
    this.save = loaded ?? newSave();
    this.world = new World(this.save.zone);
    this.applyZoneSwitches(true);
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

  /** Scales the canvas resolution down when frames run slow; 1 is full resolution. */
  private quality = 1;
  private maxQuality = 1;

  start() {
    let last = performance.now();
    let prev = last;
    let vsync = 1000 / 60;
    let sum = 0;
    let frames = 0;
    let calm = 0;
    let sinceRaise = Infinity;
    const frame = (now: number) => {
      requestAnimationFrame(frame);
      const gap = now - prev;
      prev = now;
      if (gap > 2) vsync = gap < vsync ? gap : vsync + (gap - vsync) * 0.01;
      const elapsed = now - last;
      if (elapsed < 1000 / MAX_FPS - vsync / 2) return;
      last = now;
      this.step(Math.min(0.05, elapsed / 1000));
      renderScene(this);
      this.ui.update();
      this.input.endFrame();

      if (document.hidden || elapsed > 200) return;
      sum += elapsed;
      if (++frames < 90) return;
      const avg = sum / frames;
      sum = 0;
      frames = 0;
      sinceRaise++;
      if (avg > 24 && this.quality > 0.5) {
        if (sinceRaise <= 3) this.maxQuality = this.quality;
        this.quality = Math.max(0.5, this.quality * 0.85);
        calm = 0;
        this.resize();
      } else if (avg < 18 && this.quality < this.maxQuality) {
        if (++calm >= 8) {
          this.quality = Math.min(this.maxQuality, this.quality / 0.9);
          calm = 0;
          sinceRaise = 0;
          this.resize();
        }
      } else calm = 0;
    };
    requestAnimationFrame(frame);
  }

  resize() {
    const w = innerWidth;
    const h = innerHeight;
    const dpr = Math.max(0.5, Math.min(devicePixelRatio || 1, 2, Math.sqrt(MAX_CANVAS_PIXELS / (w * h))) * this.quality);
    this.canvas.width = Math.round(w * dpr);
    this.canvas.height = Math.round(h * dpr);
    this.view.ui = Math.sqrt((w * h) / VIEW_AREA);
    this.view.dpr = dpr;
    this.applyView();
    this.lighting.resize(this.canvas.width, this.canvas.height);
  }

  /** Sizes the visible world area from the screen, the base scale and the current dive zoom. */
  private applyView() {
    const scale = this.view.ui * this.zoom;
    this.view = { ...this.view, w: innerWidth / scale, h: innerHeight / scale, scale, zoom: this.zoom };
  }

  // ---- Saves -------------------------------------------------------------

  private updateExplored() {
    const w = this.world;
    if (this.exploredZone !== w.index) {
      this.syncExplored();
      this.exploredZone = w.index;
      this.explored = new Explored(w.width, w.maxFloor + 100, this.save.explored[w.index]);
    }
    const diving = this.mode === "diving";
    this.explored!.reveal(diving ? this.sub.x : this.ship.x, diving ? this.sub.y : 0, MAP_REVEAL_RADIUS);
  }

  private syncExplored() {
    if (this.explored) this.save.explored[this.exploredZone] = this.explored.encode();
  }

  persist() {
    this.syncExplored();
    this.save.shipX = this.ship.x;
    this.save.day = this.day;
    writeSave(this.save);
    this.hasSave = true;
  }

  loadGame(s: SaveData) {
    this.save = s;
    this.implode = null;
    this.sinkSpeed = null;
    this.electrolysisOn = false;
    this.debris = [];
    this.implodeMessage = null;
    this.explored = null;
    this.exploredZone = -1;
    this.world = new World(s.zone);
    this.switchStash = null;
    this.applyZoneSwitches(true);
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

  /** Price of the next purchase of an item, or null when it is fully bought. */
  gearCost(id: GearId) {
    if (id === "candles") return this.save.candles >= GEAR.candles.max ? null : GEAR.candles.costs[this.save.candles];
    return this.save[id] ? null : GEAR[id].cost;
  }

  buyGear(id: GearId) {
    const cost = this.gearCost(id);
    if (cost === null || this.save.money < cost) return false;
    this.save.money -= cost;
    if (id === "candles") this.save.candles++;
    else this.save[id] = true;
    this.candlesLeft = this.save.candles;
    this.audio.play("chime1");
    this.persist();
    return true;
  }

  /** Adds or removes air gear without a purchase (for the test panel); `all` sets the whole range instead of one step. */
  setGear(id: GearId, step: number, all = false) {
    if (id === "candles") this.save.candles = clamp(all ? (step > 0 ? GEAR.candles.max : 0) : this.save.candles + step, 0, GEAR.candles.max);
    else this.save[id] = step > 0;
    this.candlesLeft = this.save.candles;
    this.persist();
  }

  /**
   * The airless Crimson Sea starts with the spotlight and sonar off every time you arrive, whatever you chose before;
   * leaving it puts your choices back. `fresh` is a game load, where the saved values may be this zone's own and are not trusted.
   */
  private applyZoneSwitches(fresh: boolean) {
    const space = !!this.world.def.space;
    if (space && !this.switchStash) {
      this.switchStash = fresh ? { lamp: "auto", sonar: "auto" } : { lamp: this.save.lamp, sonar: this.save.sonar };
      this.save.lamp = "off";
      this.save.sonar = "off";
    } else if (!space && this.switchStash) {
      this.save.lamp = this.switchStash.lamp;
      this.save.sonar = this.switchStash.sonar;
      this.switchStash = null;
    }
  }

  setSwitch(key: "lamp" | "sonar", mode: SwitchMode) {
    this.save[key] = mode;
    this.persist();
  }

  buyWeights() {
    if (this.save.weights || this.save.money < WEIGHTS.cost) return false;
    this.save.money -= WEIGHTS.cost;
    this.save.weights = true;
    this.audio.play("chime1");
    if (this.mode === "docked") this.resetSub();
    this.persist();
    return true;
  }

  /** Gives or takes away the dive weights without a purchase (for the test panel). */
  setWeights(on: boolean) {
    this.save.weights = on;
    this.weightsOn = on;
    this.weightsDropped = false;
    this.weightFx = [];
    this.persist();
  }

  /** Lets both weights go: they drop away with a burst of bubbles, and the sub shoots upward. */
  private dropWeights() {
    const s = this.sub;
    this.weightsOn = false;
    this.weightsDropped = true;
    s.vy -= WEIGHTS.kick;
    const cos = Math.cos(s.tilt);
    const sin = Math.sin(s.tilt);
    for (const lx of WEIGHT_MOUNTS) {
      this.weightFx.push({
        x: s.x + s.facing * (lx * cos - WEIGHT_Y * sin),
        y: s.y + lx * sin + WEIGHT_Y * cos,
        vx: s.vx * 0.3 + (lx - 14) * 1.2,
        vy: 30,
        rot: s.tilt,
        vr: (Math.random() - 0.5) * 5,
        rest: false,
      });
    }
    this.emitBubbles(s.x, s.y + 24, 26, 70);
    this.audio.play("clank2", 0.9);
    this.audio.play("splash", 0.4);
    this.shake = Math.max(this.shake, 0.18);
    this.popup(s.x, s.y - 60, "Weights dropped!", "#FFD34D");
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
    this.updateGear(dt);
    this.audio.setScene(this.underwater ? "dive" : "surface");
    this.audio.setSailing(this.mode === "docked" && !this.paused && !this.travel && Math.abs(this.input.axis().x) > 0.2);
    this.audio.setMusicOff(!!this.world.def.space);
    this.audio.setNightMusic(daylight(this.day).night > 0.5);
    this.audio.setCrimson(!!this.world.def.space && this.underwater, this.world.abyss !== null && this.sub.y > this.world.abyssTop(this.sub.x));
    this.flicker = Math.max(0, this.flicker - dt);
    this.glitch = Math.max(0, this.glitch - dt);
    if (this.deathGlitch !== null && (this.deathGlitch -= dt) <= 0) {
      this.deathGlitch = null;
      this.startGlitch();
    }
    if (this.implode) this.tickImplode(dt);
    if (this.sinkSpeed !== null) this.tickSink(dt);
    if (this.speech.length) {
      for (const b of this.speech) {
        b.life -= dt;
        b.age += dt;
      }
      this.speech = this.speech.filter((b) => b.life > 0);
    }
    const listenX = this.mode === "diving" ? this.sub.x : this.ship.x;
    const islandDist = Math.min(Infinity, ...this.world.def.islands.map((isl) => Math.abs(isl.x - listenX)));
    const daytime = !this.world.def.space && daylight(this.day).night < 0.5;
    this.audio.gulls(dt, daytime ? clamp(1 - islandDist / GULL_EARSHOT, 0, 1) : 0);
    this.audio.musicTick(dt, this.depthM);
    this.audio.gullMuffleTick(dt, this.depthM);
    const [dim, full] = this.world.def.darkness;
    const deep = this.mode === "diving" && this.depthM > dim + (full - dim) * 0.25;
    const wantDark = this.world.def.space || daylight(this.day).night > 0.5 || deep;
    this.uiDark += ((wantDark ? 1 : 0) - this.uiDark) * damp(2.5, dt);
    this.audio.setPropeller(this.driving);
    this.audio.setHeartbeat(this.mode === "diving" && !this.paused && (this.holdingBreath || this.monster.stage === "chase"));
    this.audio.tick(dt, this.warning && !this.paused);
    let whaleDist = Infinity;
    let whaleDx = 0;
    if (this.mode === "diving" && !this.paused) {
      for (const c of this.world.creatures) {
        if (c.kind !== "whale" && c.kind !== "bluewhale") continue;
        const d = Math.hypot(c.x - this.sub.x, c.y - this.sub.y);
        if (d < whaleDist) {
          whaleDist = d;
          whaleDx = c.x - this.sub.x;
        }
      }
    }
    this.audio.whales(dt, whaleDist, whaleDx);
    if (this.mode === "diving" && !this.paused) {
      this.spotCreatures();
      this.updateMonster(dt);
      this.updateGlitch(dt);
    }
    this.driving = false;
    this.warning = false;
    if (!this.paused) this.day = (this.day + dt / DAY_SECONDS) % 1;
    const live = !this.paused && !this.travel;
    const cavern = this.world.abyss?.zoom;
    const inAbyss = cavern !== undefined && this.sub.y > this.world.abyssTop(this.sub.x) && this.sub.y < this.world.abyssBottom(this.sub.x);
    const zoomTarget = this.mode === "diving" ? (this.debugFast ? DEBUG_ZOOM : inAbyss ? cavern : this.world.def.diveZoom) : 1 - (1 - BOOST_ZOOM) * this.boost;
    if (Math.abs(zoomTarget - this.zoom) > 0.001) {
      this.zoom += (zoomTarget - this.zoom) * damp(1.6, dt);
      this.applyView();
    }

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
    this.updateExplored();
    this.updateEffects(dt);
    this.updateCamera(dt);
  }

  private updateDocked(dt: number) {
    const ax = this.input.axis().x;
    if (Math.abs(ax) > 0.2) this.ship.facing = ax > 0 ? 1 : -1;
    const prevVx = this.ship.vx;
    const boosting = this.input.isDown("drop") && Math.abs(ax) > 0.2;
    this.boost += ((boosting ? 1 : 0) - this.boost) * damp(2.5, dt);
    if (boosting) this.boostUsed = true;
    if (Math.abs(ax) > 0.2 && !this.boostUsed && !this.speech.length && (this.boostTipWait -= dt) <= 0) {
      this.boostTipWait = 25 + Math.random() * 20;
      this.say(this.ui.touch ? "Hold the Boost button to sail faster!" : "Hold Q or ? to boost the ship!", "#6CC5F0");
    }
    this.ship.vx += (ax * 280 * (1 + (BOOST_SPEED - 1) * this.boost) - this.ship.vx) * damp(2.5 + this.boost, dt);
    const x = this.ship.x + this.ship.vx * dt;
    this.ship.x = clamp(x, SHIP_MARGIN, this.world.width - SHIP_MARGIN);
    if (this.ship.x !== x) this.ship.vx = 0;
    const accel = (this.ship.vx - prevVx) / dt;
    this.updateSwing(dt, accel);
    const pitchTo = clamp(-0.035 * Math.abs(this.ship.vx / 280) - 0.00007 * accel * this.ship.facing, -0.17, 0.05);
    this.shipPitch += (pitchTo - this.shipPitch) * damp(4, dt);
    this.emitWake(dt, Math.abs(this.ship.vx) / 280);
    this.placeDockedSub();

    const over = this.world.items.some(
      (it) =>
        it.alive &&
        ITEMS[it.kind].value >= VALUABLE_TREASURE &&
        Math.abs(it.x - this.ship.x) < TREASURE_DETECT_RANGE,
    );
    this.pinSpeech("treasure", over, "Something valuable below!", "#F6C445");
    this.treasureAlert += ((over ? 1 : 0) - this.treasureAlert) * damp(6, dt);

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
    this.hookGrip = 0;
    this.alarmed = false;
    this.audio.play("splash");
    this.treasureAlert = 0;
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
    this.sonarPings = [];
    this.airLow = false;
    this.holdingBreath = false;
    this.electrolysisOn = false;
    this.spotted.clear();
    if (this.world.def.space && !this.said.has("blood")) {
      this.said.add("blood");
      this.say("Is this... blood?", "#E5484D");
    }
    this.save.stats.dives++;
    this.emitBubbles(s.x, s.y + 10, 14, 40);
  }

  /** True when the sub has settled in at the ship's mounting spot at the surface, ready for the hook to come down. */
  private inDockPosition() {
    const s = this.sub;
    return s.diveTime > 1.5 && s.y < 50 && Math.abs(s.x - (this.ship.x + SUB_DOCK_OFFSET * this.ship.facing)) < DOCK_RANGE;
  }

  private dock() {
    this.audio.play("clank1");
    if (this.airLow) this.audio.play("breathResurface");
    this.airLow = false;
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
    if (this.alarmed) {
      this.alarmed = false;
      this.welcomeIn = 3 + Math.floor(Math.random() * 2);
      this.say("That was a close one back there. Glad you made it back safely!", "#F6C445");
    } else if (--this.welcomeIn <= 0) {
      this.welcomeIn = 3 + Math.floor(Math.random() * 2);
      this.say(WELCOMES[Math.floor(Math.random() * WELCOMES.length)], "#9CF2C4");
    }
  }

  private tickSwallow(dt: number, sw: { t: number; done: boolean }) {
    const s = this.sub;
    const beast = this.world.creatures.find((c) => c.kind === "leviathan");
    sw.t += dt;
    s.vx = 0;
    s.vy = 0;
    if (!beast) return;
    const into = (70 - 60 * clamp(sw.t / SWALLOW_CLOSE, 0, 1)) * MONSTER_SCALE;
    const tx = beast.x + Math.cos(beast.angle) * into;
    const ty = beast.y + Math.sin(beast.angle) * into;
    const pull = damp(sw.t < SWALLOW_CLOSE ? 2.5 : 8, dt);
    s.x += (tx - s.x) * pull;
    s.y += (ty - s.y) * pull;
    s.tilt += (Math.atan2(Math.sin(beast.angle) * s.facing, Math.abs(Math.cos(beast.angle))) * 0.5 - s.tilt) * damp(3, dt);
    const shut = clamp((sw.t - SWALLOW_CLOSE) / SWALLOW_SHUT, 0, 1);
    beast.bite = shut > 0 ? -0.25 + 1.25 * shut : -0.25 * clamp(sw.t / 0.5, 0, 1);
    if (sw.t >= SWALLOW_CLOSE + SWALLOW_SHUT && !sw.done) {
      sw.done = true;
      this.shake = 0.6;
      this.audio.hit();
      this.sub.hull = 0;
      this.wreck("leviathan");
    }
  }

  private updateDiving(dt: number) {
    const s = this.sub;
    if (this.swallow) return this.tickSwallow(dt, this.swallow);
    const inp = this.input;
    s.diveTime += dt;
    const a = inp.axis();
    const moving = Math.hypot(a.x, a.y) > 0.1;
    const cranks = inp.takeCranks();
    const speed = STATS.speed[this.up.propeller] * (this.debugFast ? 4 : 1);
    if (this.debugFast) {
      s.oxygen = this.maxOxygen;
      s.battery = this.maxBattery;
    }
    const airborne = s.y < SURFACE_Y;
    if (inp.pressed("drop") && this.weightsOn) this.dropWeights();
    const fall = this.weightsOn ? WEIGHTS.descent : 1;
    const rise = this.weightsDropped ? WEIGHTS.ascent : 1;
    s.crankLight = Math.max(0, Math.min(0.8, s.crankLight + cranks * 0.18 - dt * 0.15));

    if (s.battery > 0) {
      if (moving) {
        s.vx += a.x * 560 * speed * dt;
        const ay = airborne ? Math.max(0, a.y) : a.y;
        s.vy += ay * 560 * speed * (ay > 0 ? fall : rise) * dt;
      }
    } else if (cranks) {
      const dx = moving ? a.x : s.facing;
      const dy = moving ? a.y : 0;
      const m = Math.hypot(dx, dy) || 1;
      s.vx += (dx / m) * 75 * cranks;
      s.vy += ((airborne ? Math.max(0, dy) : dy) / m) * 75 * cranks;
      this.emitBubbles(s.x - s.facing * 70, s.y, 2, 6);
    }

    if (this.weightsOn) s.vy += WEIGHTS.pull * dt;
    if (s.y < SURFACE_Y)
      s.vy += SURFACE_GRAVITY * clamp((SURFACE_Y - s.y) / SURFACE_RAMP, 0, 1) * dt;

    const drag = Math.exp(-2.4 * dt);
    const top = 250 * speed;
    s.vx *= drag;
    s.vy *= drag;
    const sp = Math.hypot(s.vx, s.vy);
    const limit = top * (s.vy > 0 ? fall : s.vy < 0 ? rise : 1);
    if (sp > limit) {
      s.vx *= limit / sp;
      s.vy *= limit / sp;
    }

    const sinkDepth = s.y / PX_PER_M;
    if (sinkDepth > SINK_START) {
      const ramp = Math.min(1, (sinkDepth - SINK_START) / SINK_RAMP);
      s.vy += SINK_ACCEL * ramp * Math.min(SINK_MAX_FACTOR, 1 + Math.max(0, sinkDepth - SINK_START - SINK_RAMP) / 300) * dt;
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
    if (this.world.inCave(s.x) && this.world.inCave(px)) {
      this.collideCave(px, py);
    } else {
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
    }

    if (Math.abs(a.x) > 0.2) s.facing = a.x > 0 ? 1 : -1;
    s.tilt += (clamp(s.vy / 240, -1, 1) * 0.35 - s.tilt) * damp(6, dt);
    const spin = moving && s.battery > 0 ? 0.6 + sp * 0.012 : cranks ? 0.4 : 0;
    s.prop += spin * dt * 10;
    if (moving && s.battery > 0 && Math.random() < dt * 14)
      this.emitBubbles(s.x - s.facing * 72, s.y, 1, 8);

    this.driving = moving && s.battery > 0;
    const wasSurfaced = this.atSurface;
    this.atSurface = s.y < (this.atSurface ? SURFACE_STAY : SURFACE_ENTER);
    this.shipHint = s.y < (this.shipHint ? SHIP_HINT_STAY : SHIP_HINT_ENTER);
    const surfaced = this.atSurface;
    if (surfaced && !wasSurfaced && this.airLow) this.audio.play("breathResurface");
    if (surfaced) this.airLow = false;
    else if (s.oxygen <= this.maxOxygen * LOW_AIR) this.airLow = true;
    if (this.lampOn) s.battery = Math.max(0, s.battery - STATS.lampDrain[this.up.light] * dt);
    const electrolysis = this.save.electrolysis && s.battery > 0;
    if (this.electrolysisOn && !electrolysis && !surfaced) this.say("Electrolysis offline: out of battery", "#E5484D");
    this.electrolysisOn = electrolysis;
    if (surfaced) s.oxygen = Math.min(this.maxOxygen, s.oxygen + 30 * dt);
    else if (electrolysis) {
      s.battery = Math.max(0, s.battery - GEAR.electrolysis.drain * dt);
      s.oxygen = Math.min(this.maxOxygen, s.oxygen + GEAR.electrolysis.rate * dt);
    } else s.oxygen = Math.max(0, s.oxygen - dt * (this.save.scrubbers ? GEAR.scrubbers.drain : 1));
    if (s.oxygen <= 0 && !surfaced && this.candlesLeft > 0) {
      this.candlesLeft--;
      s.oxygen = GEAR.candles.seconds;
      this.audio.play("chime2");
      this.say("Lit an oxygen candle!", "#F6C445");
    }
    const holding = s.oxygen <= 0 && !surfaced;
    if (holding && !this.holdingBreath) this.audio.play("holdBreath");
    this.holdingBreath = holding;
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
    if (this.warning) this.alarmed = true;
    this.audio.depthSounds(depth / this.depthRating, s.y, dt, this.up.plating === UPGRADES.plating.levels.length - 1);
    this.pinSpeech(
      "rudders",
      s.battery <= 0,
      this.ui.touch
        ? "Use the rudders: tap the E and R buttons"
        : "Use the rudders with E and R (or J and K)",
      "#E5484D",
    );
    const metersLeft = this.depthRating - depth;
    if (metersLeft > STATS.deepWarning[this.up.plating] || s.vy < -10) this.deepWarned = false;
    else if (s.vy > 10) this.deepWarned = true;
    this.pinSpeech(
      "depth",
      metersLeft <= 0 || this.deepWarned,
      metersLeft <= 0 ? "Too deep! Head up now!" : "We're going too deep!",
      "#E5484D",
    );
    const airFrac = s.oxygen / this.maxOxygen;
    const batteryFrac = s.battery / this.maxBattery;
    this.halfAir = this.sayAtLevel(airFrac, 0.5, this.halfAir, "Oxygen is at 50%!", "#2AA6C9");
    this.halfBattery = this.sayAtLevel(batteryFrac, 0.5, this.halfBattery, "Battery is at 50%!", "#D9A21E");
    this.lowAir = this.sayAtLevel(airFrac, 0.2, this.lowAir, "Oxygen is at 20%!", "#E5484D");
    this.lowBattery = this.sayAtLevel(batteryFrac, 0.2, this.lowBattery, "Battery is at 20%!", "#E5484D");
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
      if (c.state === "dead" || !CREATURES[c.kind].harmful) continue;
      if (c.kind === "leviathan") {
        if (c.state === "rest") continue;
        if (Math.hypot(c.x - s.x, c.y - s.y) < CREATURES.leviathan.radius * 0.8 + SUB_RADIUS) {
          this.swallow = { t: 0, done: false };
          this.audio.play("monster", 1, 0, 0.8);
          return;
        }
        if (s.invuln <= 0) {
          const { n, at, radius } = leviathanSpine(c);
          for (let k = 6; k < n; k += 2) {
            const p = at(k);
            if (Math.hypot(c.x + p.x - s.x, c.y + p.y - s.y) < radius(k) * 0.8 + SUB_RADIUS * 0.7) {
              if (this.damage(c)) return;
              break;
            }
          }
        }
        continue;
      }
      if (s.invuln > 0) continue;
      const def = CREATURES[c.kind];
      const pitch = c.kind === "whale" ? whalePitch(c) : 0;
      const circles = def.body
        ? def.body.map(([dx, r]) => [c.x + c.facing * dx * Math.cos(pitch), c.y + dx * Math.sin(pitch), r] as const)
        : [[c.x, c.y, def.radius] as const];
      if (circles.some(([x, y, r]) => (x - s.x) ** 2 + (y - s.y) ** 2 < (r + SUB_RADIUS) ** 2)) {
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

    if (this.inDockPosition() && this.reel <= 0) this.dock();
  }

  /** Returns true when the hit wrecked the sub. */
  /** Shows a speech bubble over the sub. */
  private say(text: string, color: string) {
    this.speech.unshift({ text, color, life: SPEECH_TIME, age: 0 });
  }

  /** Posts a message the first time `frac` drops to `level`; returns the new "already said" flag. */
  private sayAtLevel(frac: number, level: number, said: boolean, text: string, color: string) {
    if (frac > level) return false;
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

  /** Slides the sub along tunnel walls: each axis is tried alone, and a blocked one is undone. */
  private collideCave(px: number, py: number) {
    const s = this.sub;
    const w = this.world;
    if (w.caveHit(px, py, SUB_HALF_WIDTH)) return;
    const nx = s.x;
    const ny = s.y;
    s.y = py;
    if (w.caveHit(nx, py, SUB_HALF_WIDTH)) {
      this.bump(Math.abs(s.vx));
      this.kickUpDust(px + Math.sign(s.vx) * SUB_HALF_WIDTH, s.y, -Math.sign(s.vx), 0, Math.abs(s.vx));
      s.x = px;
      s.vx = 0;
    }
    s.y = ny;
    if (w.caveHit(s.x, ny, SUB_HALF_WIDTH)) {
      this.bump(Math.abs(s.vy));
      this.kickUpDust(s.x, py + Math.sign(s.vy) * 26, 0, -Math.sign(s.vy), Math.abs(s.vy));
      s.y = py;
      s.vy *= -0.2;
    }
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

  /** After suffocating, the wrecked sub drifts down behind the message: it rests on the bottom or implodes once past its depth rating. */
  /** The first time each kind of big animal comes on screen in a dive, or the cavern is entered, the sub says something about it. */
  private spotCreatures() {
    const ab = this.world.abyss;
    if (ab && !this.spotted.has("cavern") && this.sub.y > this.world.abyssTop(this.sub.x)) {
      this.spotted.add("cavern");
      this.say("Whoa, a huge underground cavern!", "#6CC5F0");
    }
    for (const c of this.world.creatures) {
      const note = SPOT_NOTES[c.kind];
      if (!note || c.state === "dead" || this.spotted.has(note.key)) continue;
      const reach = CREATURE_EXTENT[c.kind];
      if (Math.abs(c.x - this.cam.x) > this.view.w / 2 + reach * 0.5 || Math.abs(c.y - this.cam.y) > this.view.h / 2) continue;
      this.spotted.add(note.key);
      this.say(note.text, note.color);
    }
  }

  private updateGlitch(dt: number) {
    if (!this.world.def.space || !this.underwater) return;
    this.glitchWait -= dt;
    if (this.glitchWait > 0) return;
    this.glitchWait = GLITCH_GAP[0] + Math.random() * (GLITCH_GAP[1] - GLITCH_GAP[0]);
    this.startGlitch();
  }

  private startGlitch() {
    if (this.debugFast) return;
    this.glitch = GLITCH_TIME;
    this.audio.play("static");
  }

  private updateMonster(dt: number) {
    const m = this.monster;
    const lair = this.world.abyss?.lair;
    if (!lair) return;
    if (m.stage === "idle") {
      if (this.depthM >= MONSTER_DEPTH) {
        this.monster = { stage: "wait", t: 0 };
        this.audio.play("monster");
      }
      return;
    }
    m.t += dt;
    const beast = this.world.creatures.find((c) => c.kind === "leviathan");
    if (beast && m.stage === "wait") beast.glow = clamp(m.t / MONSTER_WAIT, 0, 1);
    if (beast && m.stage === "wait" && m.t >= MONSTER_WAIT) {
      beast.state = "idle";
      this.monster = { stage: "chase", t: 0 };
      this.growlTimer = 2;
    } else if (m.stage === "chase") {
      this.growlTimer -= dt;
      if (this.growlTimer <= 0 && beast) {
        const dx = beast.x - this.sub.x;
        const near = 1 - clamp(Math.hypot(dx, beast.y - this.sub.y) / 3000, 0, 0.75);
        this.audio.play("monster", near, clamp(dx / 1500, -1, 1) * 0.7, 0.85 + Math.random() * 0.15);
        this.growlTimer = 7 + Math.random() * 6;
      }
    }
  }

  private tickSink(dt: number) {
    const s = this.sub;
    const w = this.world;
    const py = s.y;
    const ease = clamp(this.depthM / SINK_RAMP_M, 0, 1);
    const target = SINK_SLOW + (SINK_FAST - SINK_SLOW) * ease * ease * (3 - 2 * ease);
    this.sinkSpeed = this.sinkSpeed! + clamp(target - this.sinkSpeed!, -40 * dt, 12 * dt);
    s.vx *= Math.exp(-1.5 * dt);
    s.x += s.vx * dt;
    s.y += this.sinkSpeed * dt;
    s.tilt += (0.35 - s.tilt) * damp(1, dt);
    if (Math.random() < dt * 5) this.emitBubbles(s.x, s.y - 20, 1, 10);
    const landed = w.inCave(s.x) ? w.caveHit(s.x, s.y, SUB_HALF_WIDTH) : s.y > w.clearFloorAt(s.x, SUB_HALF_WIDTH) - 26;
    if (landed) {
      s.y = py;
      this.sinkSpeed = null;
      this.audio.hit(0.5);
    } else if (this.depthM > this.depthRating) {
      this.sinkSpeed = null;
      this.audio.play("implosion", 1, 0, 1.5);
      this.implode = { t: 0, x: s.x, y: s.y };
    }
  }

  private tickImplode(dt: number) {
    const im = this.implode!;
    const before = im.t;
    im.t += dt;
    if (before < IMPLODE_COLLAPSE && im.t >= IMPLODE_COLLAPSE) {
      this.shake = 0.6;
      this.emitBubbles(im.x, im.y, 40, 140);
      const colors = debrisColors(this.up.plating);
      this.debris = Array.from({ length: 9 }, (_, i) => {
        const a = (i / 9) * Math.PI * 2 + Math.random() * 0.6;
        const v = 90 + Math.random() * 170;
        return {
          x: im.x,
          y: im.y,
          vx: Math.cos(a) * v,
          vy: Math.sin(a) * v * 0.6,
          rot: Math.random() * 6,
          vr: (Math.random() - 0.5) * 8,
          w: 10 + Math.random() * 14,
          h: 7 + Math.random() * 10,
          color: colors[i % colors.length],
          life: 3.5 + Math.random() * 1.5,
        };
      });
    }
    for (const d of this.debris) {
      const drag = Math.exp(-1.8 * dt);
      d.vx *= drag;
      d.vy = d.vy * drag + 70 * dt;
      d.x += d.vx * dt;
      d.y += d.vy * dt;
      d.rot += d.vr * dt;
      d.life -= dt;
    }
    this.debris = this.debris.filter((d) => d.life > 0);
    if (this.implodeMessage && im.t >= IMPLODE_MESSAGE) {
      this.implodeMessage();
      this.implodeMessage = null;
    }
  }

  private wreck(reason: WreckReason) {
    if (reason === "pressure") this.audio.play("implosion", 1, 0, 1.5);
    if (reason === "oxygen") {
      this.audio.play("wheeze");
      this.sinkSpeed = 0;
    }
    const lostValue = this.cargoValue();
    const lostCount = this.cargoCount();
    this.save.cargo = {};
    this.persist();
    const titles: Record<WreckReason, string> = {
      shark: "Great white attack!",
      hammerhead: "Hammerhead attack!",
      squid: "Squeezed by a squid!",
      angler: "Anglerfish ambush!",
      whale: "Hit by a whale!",
      stingray: "",
      manta: "",
      turtle: "",
      bluewhale: "",
      bigfin: "",
      leviathan: "Swallowed whole!",
      colossal: "Caught by a colossal squid!",
      fish: "Bonked by a fish!",
      jelly: "Stung!",
      pressure: "Hull crushed!",
      oxygen: "Ran out of oxygen!",
    };
    const tips: Record<WreckReason, string> = {
      shark: "Great whites give chase, but even a stock propeller outswims them. Bumper upgrades help you survive a hit.",
      hammerhead: "Hammerheads patrol back and forth. Steer around them.",
      squid: "Squid lunge when you get close. Give them room.",
      angler: "Anglerfish hunt by their glowing lure. Sonar spots them early.",
      stingray: "",
      manta: "",
      turtle: "",
      bluewhale: "",
      bigfin: "",
      leviathan: "Something enormous lives at the bottom of the Crimson Sea. When it shows itself, run for the surface.",
      colossal: "Colossal squid ambush from the dark and lunge from far away. Sonar spots them early; give them a wide berth.",
      whale: "Sperm whales ignore you, but they are enormous and slow to turn. Keep clear of them.",
      fish: "",
      jelly: "",
      pressure: `Your plating is only safe to ${this.depthRating} m. Upgrade it to go deeper.`,
      oxygen: "A sealed sub has no endless air. Once the oxygen runs out, carbon dioxide (CO₂) builds up to toxic levels and the cabin becomes unbreathable. Head back up to refill your air.",
    };
    const lost = lostCount
      ? `You lost ${lostCount} ${lostCount === 1 ? "item" : "items"} worth ${money(lostValue)}.`
      : "Luckily your hold was empty.";
    const show = () => {
      this.deathGlitch = DEATH_GLITCH_DELAY;
      this.ui.showMessage(
        titles[reason],
        `Return to the ship. ${lost}`,
        tips[reason],
        () => this.recover(),
        () => {
          this.recover();
          this.ui.showTitle();
        },
      );
    };
    if (reason === "pressure") {
      this.paused = true;
      this.implode = { t: 0, x: this.sub.x, y: this.sub.y };
      this.implodeMessage = show;
    } else show();
  }

  /** Moves the wrecked sub back to the ship once the player dismisses the wreck message. */
  private recover() {
    this.implode = null;
    this.sinkSpeed = null;
    this.debris = [];
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

  /** True when it is dark at the surface: night, or always on a moon. */
  private get surfaceDark() {
    return !!this.world.def.space || daylight(this.day).night > 0.5;
  }

  /** The spotlight and sonar switch on by themselves once the sub is deep enough; the depth is shallower at night. */
  private updateGear(dt: number) {
    const depth = this.mode === "diving" ? this.depthM : 0;
    const diving = this.mode === "diving";
    const auto = depth > (this.surfaceDark ? LAMP_ON_DEPTH_NIGHT : LAMP_ON_DEPTH_DAY) - (this.lampOn ? SWITCH_SLACK : 0);
    const mode = this.save.lamp;
    const lampWanted = diving && this.up.light > 0 && (mode === "auto" ? auto : mode === "on");
    if (lampWanted !== this.lampOn) {
      this.lampOn = lampWanted;
      this.audio.play("lightSwitch");
      if (diving) {
        if (lampWanted) this.flicker = FLICKER_TIME * 0.8;
        this.say(lampWanted ? "Spotlight activated!" : "Spotlight disabled", lampWanted ? "#F7C948" : "#9AA7C2");
      }
    }
    this.lampClock = this.lampOn ? this.lampClock + (this.paused ? 0 : dt) : 0;
    this.lampLevel += ((this.lampOn ? 1 : 0) - this.lampLevel) * damp(14, dt);
    const sonarDepth = this.surfaceDark ? SONAR_ON_DEPTH_NIGHT : SONAR_ON_DEPTH_DAY;
    const sonarAuto = depth > sonarDepth - (this.sonarOnline ? SWITCH_SLACK : 0);
    const sonarMode = this.save.sonar;
    const online = diving && this.up.sonar > 0 && (sonarMode === "auto" ? sonarAuto : sonarMode === "on");
    if (online && !this.sonarOnline) {
      this.sonar.timer = Math.min(this.sonar.timer, 0.6);
      this.say("Sonar activated!", "#4FC98E");
    } else if (!online && this.sonarOnline && diving) {
      this.say("Sonar disabled", "#9AA7C2");
    }
    this.sonarOnline = online;
  }

  private updateSonar(dt: number) {
    const level = this.up.sonar;
    this.sonarPings = this.sonarPings.filter((p) => this.t - p.start < 1 / SONAR_RING_SPEED + p.linger);
    if (!level || !this.sonarOnline) {
      this.sonar.ring = -1;
      if (!level) this.blips = [];
      return;
    }
    const range = STATS.sonarRange[level];
    if (this.sonar.ring >= 0) {
      this.sonar.ring += range * dt * SONAR_RING_SPEED;
      this.markSonarContacts();
      if (this.sonarDark > 0.15) this.markSonarWalls();
      if (this.sonar.ring > range) this.sonar.ring = -1;
    }
    this.sonar.timer -= dt;
    if (this.sonar.timer > 0) return;
    const cost = STATS.sonarPingCost[level];
    if (this.sub.battery < cost) {
      this.sonar.timer = 1;
      return;
    }
    this.sub.battery -= cost;
    this.sonar.timer = STATS.sonarInterval[level];
    this.sonar.ring = 0;
    this.sonarPings.push({
      x: this.sub.x,
      y: this.sub.y,
      start: this.t,
      range,
      linger: STATS.sonarLinger[level],
      hits: new Array(SONAR_RAYS).fill(-1),
      scanned: 0,
    });
    this.pinged.clear();
    this.audio.play("sonar");
  }

  /** How dark the water is at the sub's depth, 0 near the surface to 1 well into the dark. */
  get sonarDark() {
    const [dim, full] = this.world.def.darkness;
    return clamp((this.depthM - dim) / ((full - dim) * 0.5), 0, 1);
  }

  /** Finds how far each ray from the ping's origin goes before it first meets rock, checking the ground the ring crossed since last frame. */
  private markSonarWalls() {
    const ping = this.sonarPings[this.sonarPings.length - 1];
    if (!ping) return;
    const ring = this.sonar.ring;
    const rock = (cos: number, sin: number, d: number) =>
      ping.y + sin * d >= 0 && this.world.caveSolid(ping.x + cos * d, ping.y + sin * d);
    for (let i = 0; i < SONAR_RAYS; i++) {
      if (ping.hits[i] >= 0) continue;
      const cos = Math.cos((i / SONAR_RAYS) * Math.PI * 2);
      const sin = Math.sin((i / SONAR_RAYS) * Math.PI * 2);
      let lo = ping.scanned;
      for (let d = lo + 24; ; d += 24) {
        const at = Math.min(d, ring);
        if (rock(cos, sin, at)) {
          let hi = at;
          for (let k = 0; k < 5; k++) {
            const mid = (lo + hi) / 2;
            if (rock(cos, sin, mid)) hi = mid;
            else lo = mid;
          }
          ping.hits[i] = hi;
          break;
        }
        lo = at;
        if (at >= ring) break;
      }
    }
    ping.scanned = ring;
  }

  /** Adds a blip for any danger or treasure (and, at the top level, every animal) the expanding ping ring has just reached, where it was at that moment. */
  private markSonarContacts() {
    const ping = this.sonarPings[this.sonarPings.length - 1];
    if (!ping) return;
    const reach = this.sonar.ring;
    const hit = (x: number, y: number, radius: number) => Math.hypot(x - ping.x, y - ping.y) - radius <= reach;
    for (const c of this.world.creatures) {
      const harmful = CREATURES[c.kind].harmful;
      if (c.state === "dead" || this.pinged.has(c) || (!harmful && this.up.sonar < 3)) continue;
      if (hit(c.x, c.y, CREATURES[c.kind].radius)) {
        this.pinged.add(c);
        this.blips.push({
          x: c.x,
          y: c.y,
          danger: harmful,
          life: ping.linger,
          max: ping.linger,
          shape: this.up.sonar >= 3 || c.kind === "leviathan" ? { ...c, trail: c.trail?.map((p) => ({ ...p })) } : undefined,
        });
      }
    }
    for (const w of this.weightFx) {
      if (this.pinged.has(w) || !hit(w.x, w.y, 10)) continue;
      this.pinged.add(w);
      this.blips.push({ x: w.x, y: w.y, danger: false, life: ping.linger, max: ping.linger, weight: w.rot });
    }
    for (const d of this.world.deco) {
      if (d.kind !== "lungsub" || this.pinged.has(d) || !hit(d.x, d.y - 60, 180)) continue;
      this.pinged.add(d);
      this.blips.push({ x: d.x, y: d.y, danger: false, life: ping.linger, max: ping.linger, relic: true });
    }
    for (const it of this.world.items) {
      if (this.pinged.has(it) || !it.alive || !ITEMS[it.kind].treasure) continue;
      if (hit(it.x, it.y, ITEMS[it.kind].size * 0.45)) {
        this.pinged.add(it);
        this.blips.push({ x: it.x, y: it.y, danger: false, life: ping.linger, max: ping.linger });
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
      this.applyZoneSwitches(false);
      this.ship.x = tr.to.side === "west" ? SHIP_MARGIN + 40 : this.world.width - SHIP_MARGIN - 40;
      this.ship.facing = tr.to.side === "west" ? 1 : -1;
      this.ship.vx = 0;
      this.resetSub();
      this.bubbles = [];
      this.popups = [];
      this.snapCamera();
      this.persist();
      this.ui.toast(`Welcome to ${this.world.def.name}`);
      if (this.world.def.space && !this.said.has("arrive")) {
        this.said.add("arrive");
        this.say("What is this place? Where are we?", "#E5484D");
      }
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

  private emitWake(dt: number, speed: number) {
    if (speed < 0.1) return;
    const f = this.ship.facing;
    const stern = this.ship.x - f * 150;
    const bow = this.ship.x + f * 165;
    const surface = (x: number) => waveY(x, this.t) + 4;
    const kick = 1 + 0.4 * (speed - 1 > 0 ? speed - 1 : 0);
    const add = (x: number, vx: number, vy: number, r: number, life: number, spray: boolean) =>
      this.foam.push({ x, y: surface(x) - (spray ? 2 : 0), vx: vx * (spray ? kick : 1), vy: vy * (spray ? kick : 1), r: r * (spray ? 1 : Math.min(1.6, kick)), life, max: life, spray });
    if (Math.random() < dt * 45 * speed) add(stern - f * Math.random() * 40, -f * (15 + Math.random() * 40), 0, 7 + Math.random() * 10, 1.8 + Math.random() * 1.4, false);
    if (Math.random() < dt * 30 * speed) add(stern, -f * (40 + Math.random() * 90), -(90 + Math.random() * 150), 1.6 + Math.random() * 2, 1, true);
    if (Math.random() < dt * 30 * speed) add(bow, f * (25 + Math.random() * 60), -(70 + Math.random() * 120), 1.5 + Math.random() * 2, 0.9, true);
    if (Math.random() < dt * 18 * speed) add(bow, f * (10 + Math.random() * 30), 0, 5 + Math.random() * 6, 1.2 + Math.random() * 0.8, false);
  }

  private updateEffects(dt: number) {
    this.updateKelp(dt);
    for (const p of this.foam) {
      p.life -= dt;
      p.x += p.vx * dt;
      if (p.spray) {
        p.vy += 520 * dt;
        p.y += p.vy * dt;
        if (p.vy > 0 && p.y > waveY(p.x, this.t) + 4) p.life = 0;
      } else {
        p.vx *= Math.exp(-1.2 * dt);
        p.r += 14 * dt;
        p.y = waveY(p.x, this.t) + 4;
      }
    }
    this.foam = this.foam.filter((p) => p.life > 0);
    if (this.mode !== "docked") {
      this.shipPitch *= Math.exp(-3 * dt);
      this.boost = 0;
      const ready = this.inDockPosition();
      this.reel = clamp(this.reel + (ready ? -1 : 1) * (dt / HOOK_TIME), 0, 1);
      if (ready) this.hookGrip += (1 - this.hookGrip) * damp(8, dt);
      else if (this.reel >= 1) this.hookGrip = 0;
    } else {
      this.reel += (0 - this.reel) * damp(7, dt);
      this.hookGrip = 1;
    }
    for (const w of this.weightFx) {
      if (w.rest) continue;
      w.vy = Math.min(420, w.vy + 520 * dt) * Math.exp(-0.3 * dt);
      w.vx *= Math.exp(-1.4 * dt);
      w.x += w.vx * dt;
      w.y += w.vy * dt;
      w.rot += w.vr * dt;
      if (Math.random() < dt * 12) this.emitBubbles(w.x, w.y - 8, 1, 6);
      const landed = this.world.inCave(w.x) ? this.world.caveSolid(w.x, w.y + 8) : w.y > this.world.floorAt(w.x) - 8;
      if (landed) {
        w.rest = true;
        w.vr = 0;
        this.emitBubbles(w.x, w.y, 6, 20);
        const dx = w.x - this.cam.x;
        const away = Math.hypot(Math.max(0, Math.abs(dx) - this.view.w / 2), Math.max(0, Math.abs(w.y - this.cam.y) - this.view.h / 2));
        if (away < WEIGHT_HEARING_MARGIN) {
          this.audio.play("clank1", 0.4 * (1 - 0.7 * (away / WEIGHT_HEARING_MARGIN)), clamp(dx / (this.view.w / 2), -1, 1) * 0.6);
        }
      }
    }
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
    this.deepWarned = false;
    this.weightsOn = this.save.weights;
    this.candlesLeft = this.save.candles;
    this.monster = { stage: "idle", t: 0 };
    this.swallow = null;
    this.glitch = 0;
    this.deathGlitch = null;
    this.glitchWait = GLITCH_GAP[0] + Math.random() * (GLITCH_GAP[1] - GLITCH_GAP[0]);
    this.audio.stop("monster");
    this.audio.stop("static");
    const beasts = this.world.creatures;
    for (let i = beasts.length - 1; i >= 0; i--) if (beasts[i].kind === "leviathan") beasts.splice(i, 1);
    this.world.spawnLeviathan();
    this.weightsDropped = false;
    this.weightFx = [];
    this.halfAir = false;
    this.halfBattery = false;
    this.lowAir = false;
    this.lowBattery = false;
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
