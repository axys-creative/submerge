import { PX_PER_M } from "../config";

export type UpgradeId = "plating" | "oxygen" | "battery" | "hull" | "light" | "sonar" | "propeller" | "cargo";
export type Loadout = Record<UpgradeId, number>;

export interface UpgradeLevel {
  name: string;
  cost: number;
  effect: string;
  /** The island shops that sell this level, by name; omitted when every shop that stocks the upgrade sells it. */
  soldAt?: string[];
}

export interface UpgradeDef {
  title: string;
  blurb: string;
  levels: UpgradeLevel[];
}

export interface LightSpec {
  range: number;
  spread: number;
  glow: number;
  rgb: string;
}

export const UPGRADE_ORDER: UpgradeId[] = [
  "plating",
  "oxygen",
  "battery",
  "propeller",
  "cargo",
  "hull",
  "light",
  "sonar",
];

/** First zone (0-based) whose shop sells each upgrade; unlisted upgrades are sold everywhere. */
export const UPGRADE_FIRST_ZONE: Partial<Record<UpgradeId, number>> = {
  hull: 1,
  light: 1,
  sonar: 2,
};

export const STATS = {
  depthRating: [250, 700, 1500, 5000],
  /** Meters before the depth rating where the first "too deep" warning appears, per plating level. */
  deepWarning: [20, 40, 60, 250],
  oxygen: [30, 60, 120, 480],
  battery: [9000, 16000, 26000, 200000],
  maxHull: [1, 2, 3],
  /** How many items the hold carries, per cargo level. */
  cargo: [10, 25],
  speed: [1, 1.3, 1.6],
  /** Battery spent per second while the spotlight is lit, per lamp level. */
  lampDrain: [0, 6, 10, 14],
  /** Battery spent per sonar ping, per sonar level. */
  sonarPingCost: [0, 40, 60, 80],
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
const num = (n: number) => n.toLocaleString("en-US");
const meters = (px: number) => num(Math.round(px / PX_PER_M));

/** Each level's description is built from STATS, so changing a number there updates the shop everywhere. */
// Level 0 is what a new sub starts with.
export const UPGRADES: Record<UpgradeId, UpgradeDef> = {
  plating: {
    title: "Plating",
    blurb: "Dive deeper before the hull starts to buckle.",
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
    levels: [
      { name: "Starter Cell", cost: 0, effect: `${meters(STATS.battery[0])} m of driving` },
      { name: "Twin Cells", cost: 200, effect: `${times(STATS.battery[1] / STATS.battery[0])} range (${meters(STATS.battery[1])} m)` },
      { name: "Triple Pack", cost: 650, effect: `${times(STATS.battery[2] / STATS.battery[0])} range (${meters(STATS.battery[2])} m)` },
      { name: "Gold Core", cost: 1800, effect: `${times(STATS.battery[3] / STATS.battery[0])} range (${meters(STATS.battery[3])} m)` },
    ],
  },
  propeller: {
    title: "Propeller",
    blurb: "Sail faster and cover more ocean per charge of air.",
    levels: [
      { name: "Stock Prop", cost: 0, effect: "Standard speed" },
      { name: "Twin Blade", cost: 300, effect: `${times(STATS.speed[1])} speed`, soldAt: ["Pearl Atoll"] },
      { name: "Turbo Screw", cost: 1000, effect: `${times(STATS.speed[2])} speed`, soldAt: ["Last Light Atoll"] },
    ],
  },
  cargo: {
    title: "Cargo Hold",
    blurb: "Carry more before you have to head back to sell.",
    levels: [
      { name: "Standard Hold", cost: 0, effect: `Carries ${STATS.cargo[0]} items` },
      { name: "Wide Hold", cost: 500, effect: `Carries ${STATS.cargo[1]} items` },
    ],
  },
  hull: {
    title: "Bumpers",
    blurb: "Take more bumps from sharks and squid. Docking repairs them.",
    levels: [
      { name: "Bare Hull", cost: 0, effect: `Survives ${STATS.maxHull[0]} hit` },
      { name: "Bow Bumper", cost: 400, effect: `Survives ${STATS.maxHull[1]} hits` },
      { name: "Full Fenders", cost: 1400, effect: `Survives ${STATS.maxHull[2]} hits` },
    ],
  },
  light: {
    title: "Spotlight",
    blurb: "See in the dark water of the deep.",
    levels: [
      { name: "Running Lights", cost: 0, effect: "Decorative only" },
      { name: "Amber Lamp", cost: 180, effect: `Short yellow beam, ${meters(STATS.light[1]!.range)} m` },
      { name: "White Floodlight", cost: 600, effect: `Long white beam, ${meters(STATS.light[2]!.range)} m` },
      { name: "White Beam", cost: 1600, effect: `Long, wide white beam, ${meters(STATS.light[3]!.range)} m, plus a rear light` },
    ],
  },
  sonar: {
    title: "Sonar",
    blurb: "Pings reveal what is hiding in the dark.",
    levels: [
      { name: "No Sonar", cost: 0, effect: "Nothing detected" },
      { name: "Basic Sonar", cost: 350, effect: sonarEffect(1) },
      {
        name: "Long-Range Sonar",
        cost: 1000,
        effect: sonarEffect(2),
      },
      {
        name: "Deep Array",
        cost: 2600,
        effect: sonarEffect(3),
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
  ascent: 1.7,
  /** Extra downward pull in px/s² while they are on. */
  pull: 90,
  /** Multiplier on the battery cost of holding depth while they are on. */
  holdDrain: 2,
  /** Upward kick in px/s when they are let go. */
  kick: 170,
};

const SCRUBBER_DRAIN = 0.65;

export type GearId = "candles" | "scrubbers" | "electrolysis";

/** Air gear sold in the island shops from `firstZone` (0-based) onward. */
export const GEAR = {
  candles: {
    name: "Oxygen Candles",
    /** Price of carrying 1, 2 and 3 candles. */
    costs: [150, 300, 600],
    cost: 150,
    max: 3,
    firstZone: 1,
    /** Seconds of air one candle adds. */
    seconds: 20,
    blurb:
      "Chemical candles that burn out extra air. One lights itself when your air is nearly gone. Each upgrade carries one more, and docking restocks them all.",
  },
  scrubbers: {
    name: "CO₂ Scrubbers",
    cost: 1400,
    firstZone: 2,
    /** Fraction of the normal air use while they run. */
    drain: SCRUBBER_DRAIN,
    blurb: `Filters out the carbon dioxide that makes stale air toxic, so your tank lasts about ${Math.round((1 / SCRUBBER_DRAIN - 1) * 100)}% longer.`,
  },
  electrolysis: {
    name: "Electrolysis Unit",
    cost: 6000,
    firstZone: 4,
    /** Battery spent per second to make air. */
    drain: 30,
    /** Air made per second. */
    rate: 6,
    blurb:
      "Splits seawater into fresh oxygen, so you never run out of air below the surface. It runs on the battery: when the battery is empty, you are back to your tank.",
  },
};
