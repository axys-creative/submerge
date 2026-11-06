import { PX_PER_M } from "../config";

export type UpgradeId = "plating" | "oxygen" | "battery" | "hull" | "light" | "sonar" | "propeller" | "cargo";
export type Loadout = Record<UpgradeId, number>;

export interface UpgradeLevel {
  name: string;
  cost: number;
  effect: string;
  gain?: string;
  /** What this level costs in battery, shown as a badge in the shop. */
  drain?: string;
}

/** One unit of stock: one of the named shops can sell this upgrade once, whichever level the player is up to. A slot naming two shops is a fork in the route. */
export interface StockSlot {
  zones: number[];
  shop: string | string[];
}

export interface UpgradeDef {
  title: string;
  blurb: string;
  levels: UpgradeLevel[];
  /** One slot per purchasable level; buying uses up the first unused slot that matches the shop. */
  stock: StockSlot[];
}

export interface LightSpec {
  range: number;
  spread: number;
  glow: number;
  rgb: string;
}

const COVE = "Coral Cove";
const GULL = "Gull Rock";
const PEARL = "Pearl Atoll";
const DOCK = "Driftwood Dock";
const LANTERN = "Lantern Isle";
const LAST_LIGHT = "Last Light Atoll";
const PALM = "Palm Atoll";
const PIER = "Trench Pier";

const slotHere = (slot: StockSlot, zone: number, island: string) =>
  slot.zones.includes(zone) && [slot.shop].flat().includes(island);

/** Whether a shop stocks the upgrade at all, and which unused slot a purchase there would use (-1 when sold out). */
export function stockAt(id: UpgradeId, used: number[], zone: number, island: string) {
  const here = UPGRADES[id].stock.map((slot, i) => (slotHere(slot, zone, island) ? i : -1)).filter((i) => i >= 0);
  const open = here.filter((i) => !used.includes(i));
  return { stocked: here.length > 0, open: open[0] ?? -1, left: open.length };
}

export const UPGRADE_ORDER: UpgradeId[] = [
  "oxygen",
  "plating",
  "battery",
  "propeller",
  "cargo",
  "hull",
  "light",
  "sonar",
];

export const STATS = {
  depthRating: [250, 700, 1500, 5000],
  /** Meters before the depth rating where the first "too deep" warning appears, per plating level. */
  deepWarning: [20, 40, 60, 250],
  oxygen: [30, 60, 120, 480],
  battery: [8000, 16000, 30000, 240000],
  maxHull: [0, 1, 2, 3],
  /** How many items the hold carries, per cargo level. */
  cargo: [10, 25],
  speed: [1, 1.3, 1.6],
  /** Battery spent per pixel travelled, per propeller level; stronger props burn more charge for the same distance. */
  driveDrain: [1, 1.3, 1.65],
  /** Battery spent per second while the spotlight is lit, per lamp level. */
  lampDrain: [0, 9, 15, 21],
  /** Battery spent per sonar ping, per sonar level. */
  sonarPingCost: [0, 60, 90, 120],
  sonarRange: [0, 900, 1400, 2000],
  /** Seconds between sonar pings (also the ping sound). */
  sonarInterval: [0, 5, 4.25, 3.5],
  /** Seconds a sonar reading stays visible after the ping reaches it. */
  sonarLinger: [0, 2, 2.5, 3],
  light: [
    null,
    { range: 300, spread: 0.4, glow: 170, rgb: "255,205,90" },
    { range: 440, spread: 0.48, glow: 220, rgb: "240,248,255" },
    { range: 580, spread: 0.56, glow: 280, rgb: "235,245,255" },
  ] as (LightSpec | null)[],
};


/** Rounds a multiplier for display: one decimal below 10, a whole number above. */
const times = (x: number) => `${x >= 10 ? Math.round(x) : Math.round(x * 10) / 10}×`;
const sonarEffect = (level: number) =>
  `${meters(STATS.sonarRange[level])} m range, pings every ${STATS.sonarInterval[level]} s, readings last ${STATS.sonarLinger[level]} s`;
const sonarDrain = (level: number) => `Each ping uses ${meters(STATS.sonarPingCost[level])} m of driving`;
const num = (n: number) => n.toLocaleString("en-US");
const meters = (px: number) => num(Math.round(px / PX_PER_M));
const perMinute = (perSecond: number) => `${meters(perSecond * 60)} m of driving per minute`;

/** Each level's description is built from STATS, so changing a number there updates the shop everywhere. */
// Level 0 is what a new sub starts with.
export const UPGRADES: Record<UpgradeId, UpgradeDef> = {
  plating: {
    title: "Plating",
    blurb: "Dive deeper before the hull starts to buckle.",
    stock: [{ zones: [0], shop: COVE }, { zones: [2], shop: DOCK }, { zones: [4], shop: PIER }],
    levels: [
      { name: "Silver Shell", cost: 0, effect: `Safe to ${num(STATS.depthRating[0])} m` },
      { name: "Graphite Steel", cost: 300, effect: `Safe to ${num(STATS.depthRating[1])} m` },
      { name: "Rescue Orange", cost: 1100, effect: `Safe to ${num(STATS.depthRating[2])} m` },
      { name: "Abyssal Black", cost: 3200, effect: `Safe to ${num(STATS.depthRating[3])} m` },
    ],
  },
  oxygen: {
    title: "Oxygen Tank",
    blurb: "Stay under longer. Surfacing refills it.",
    stock: [{ zones: [0], shop: COVE }, { zones: [2], shop: LANTERN }, { zones: [3], shop: LAST_LIGHT }],
    levels: [
      { name: "Silver Tank", cost: 0, effect: `${STATS.oxygen[0]} seconds of air` },
      { name: "Graphite Tank", cost: 250, effect: `${STATS.oxygen[1]} seconds of air` },
      { name: "Orange Tank", cost: 900, effect: `${STATS.oxygen[2]} seconds of air` },
      { name: "Black Tank", cost: 2000, effect: `${STATS.oxygen[3]} seconds of air` },
    ],
  },
  battery: {
    title: "Battery",
    blurb: "Drive farther before you have to hand-crank. Docking recharges it.",
    stock: [{ zones: [0], shop: GULL }, { zones: [1], shop: PEARL }, { zones: [4], shop: PALM }],
    levels: [
      { name: "Starter Cell", cost: 0, effect: `${meters(STATS.battery[0])} m of driving` },
      { name: "Twin Cells", cost: 200, effect: `${times(STATS.battery[1] / STATS.battery[0])} range (${meters(STATS.battery[1])} m)` },
      { name: "Triple Pack", cost: 650, effect: `${times(STATS.battery[2] / STATS.battery[0])} range (${meters(STATS.battery[2])} m)` },
      { name: "Gold Core", cost: 1800, effect: `${times(STATS.battery[3] / STATS.battery[0])} range (${meters(STATS.battery[3])} m)` },
    ],
  },
  propeller: {
    title: "Propeller",
    blurb: "Sail faster and cover more ocean per charge of air. Twin Blade and up unlock the boost: hold Shift to burn battery for speed.",
    stock: [{ zones: [0], shop: GULL }, { zones: [2], shop: DOCK }],
    levels: [
      { name: "Stock Prop", cost: 0, effect: "Standard speed" },
      { name: "Twin Blade", cost: 300, effect: `${times(STATS.speed[1])} speed`, drain: `Drains the battery ${times(STATS.speed[1] * STATS.driveDrain[1])} faster while driving` },
      { name: "Turbo Screw", cost: 1000, effect: `${times(STATS.speed[2])} speed`, drain: `Drains the battery ${times(STATS.speed[2] * STATS.driveDrain[2])} faster while driving` },
    ],
  },
  cargo: {
    title: "Cargo Hold",
    blurb: "Carry more before you have to head back to sell.",
    stock: [{ zones: [1], shop: PEARL }],
    levels: [
      { name: "Standard Hold", cost: 0, effect: `Carries ${STATS.cargo[0]} items` },
      { name: "Wide Hold", cost: 500, effect: `Carries ${STATS.cargo[1]} items` },
    ],
  },
  hull: {
    title: "Bumpers",
    blurb: "Each upgrade adds a shield that soaks up one bump from sharks and squid. Docking repairs them.",
    stock: [{ zones: [0], shop: GULL }, { zones: [2], shop: LANTERN }, { zones: [4], shop: PIER }],
    levels: [
      { name: "Bare Hull", cost: 0, effect: "No shields, the first hit sinks you" },
      { name: "Bow Bumper", cost: 400, effect: `${STATS.maxHull[1]} shield`, gain: `+${STATS.maxHull[1] - STATS.maxHull[0]} shield` },
      { name: "Full Fenders", cost: 1400, effect: `${STATS.maxHull[2]} shields`, gain: `+${STATS.maxHull[2] - STATS.maxHull[1]} ${STATS.maxHull[2] - STATS.maxHull[1] === 1 ? 'shield' : 'shields'}` },
      { name: "Armor Cage", cost: 3000, effect: `${STATS.maxHull[3]} shields`, gain: `+${STATS.maxHull[3] - STATS.maxHull[2]} ${STATS.maxHull[3] - STATS.maxHull[2] === 1 ? 'shield' : 'shields'}` },
    ],
  },
  light: {
    title: "Spotlight",
    blurb: "See in the dark water of the deep.",
    stock: [{ zones: [1], shop: PEARL }, { zones: [2], shop: LANTERN }, { zones: [3], shop: LAST_LIGHT }],
    levels: [
      { name: "Running Lights", cost: 0, effect: "Decorative only" },
      { name: "Amber Lamp", cost: 180, effect: `Short yellow beam, ${meters(STATS.light[1]!.range)} m`, drain: `Lamp uses ${perMinute(STATS.lampDrain[1])}` },
      { name: "White Floodlight", cost: 600, effect: `Long white beam, ${meters(STATS.light[2]!.range)} m`, drain: `Lamp uses ${perMinute(STATS.lampDrain[2])}` },
      { name: "White Beam", cost: 1600, effect: `Long, wide white beam, ${meters(STATS.light[3]!.range)} m, plus a rear light`, drain: `Lamp uses ${perMinute(STATS.lampDrain[3])}` },
    ],
  },
  sonar: {
    title: "Sonar",
    blurb: "Pings reveal what is hiding in the dark.",
    stock: [{ zones: [2], shop: DOCK }, { zones: [3], shop: LAST_LIGHT }, { zones: [4], shop: PALM }],
    levels: [
      { name: "No Sonar", cost: 0, effect: "Nothing detected" },
      { name: "Basic Sonar", cost: 350, effect: sonarEffect(1), drain: sonarDrain(1) },
      {
        name: "Long-Range Sonar",
        cost: 1000,
        effect: sonarEffect(2),
        drain: sonarDrain(2),
      },
      {
        name: "Deep Array",
        cost: 2600,
        effect: sonarEffect(3),
        drain: sonarDrain(3),
      },
    ],
  },
};

/** One-time purchase sold in zone 5: strapped on at every launch, dropped with a key for a fast ride back up. */
export const WEIGHTS = {
  name: "Dive Weights",
  cost: 1500,
  blurb:
    "Lead weights that drag you down fast. Drop them for a quick ride back up. They are strapped back on every time you dock.",
  /** Speed multiplier for going down while the weights are on. */
  descent: 1.8,
  /** Speed multiplier for going up once they are dropped. */
  ascent: 1.1,
  /** Extra downward pull in px/s² while they are on. */
  pull: 90,
  /** Multiplier on the battery cost of holding depth while they are on. */
  holdDrain: 2,
  /** Upward kick in px/s when they are let go. */
  kick: 170,
};

const SCRUBBER_DRAIN = 0.65;
const SCRUBBER_BATTERY = 5;
const ELECTROLYSIS_BATTERY = 45;

export type GearId = "candles" | "scrubbers" | "electrolysis";

/** Air gear sold at the one island whose `gear` lists it (see `src/data/zones.ts`); candles are instead unlocked by cleaning up zones 1 to 3. */
export const GEAR = {
  candles: {
    name: "Oxygen Candles",
    max: 3,
    /** Seconds of air one candle adds. */
    seconds: 20,
    blurb:
      "Chemical candles that burn out extra air. One lights itself when your air is nearly gone. Cleaning up the trash in each of the first three zones lets you carry one more, and docking restocks them all.",
  },
  scrubbers: {
    name: "CO₂ Scrubbers",
    cost: 1400,
    /** Fraction of the normal air use while they run. */
    drain: SCRUBBER_DRAIN,
    /** Battery spent per second while they run; with a dead battery they stop. */
    batteryDrain: SCRUBBER_BATTERY,
    batteryNote: `Uses ${perMinute(SCRUBBER_BATTERY)}`,
    blurb: `Filters out the carbon dioxide that makes stale air toxic, so your tank lasts about ${Math.round((1 / SCRUBBER_DRAIN - 1) * 100)}% longer. They run on the battery, and stop when it is empty.`,
  },
  electrolysis: {
    name: "Electrolysis Unit",
    cost: 6000,
    /** Battery spent per second to make air. */
    drain: ELECTROLYSIS_BATTERY,
    /** Air made per second. */
    rate: 6,
    batteryNote: `Uses ${perMinute(ELECTROLYSIS_BATTERY)}`,
    blurb:
      "Splits seawater into fresh oxygen, so you never run out of air below the surface. It runs on the battery: when the battery is empty, you are back to your tank.",
  },
};
