export type UpgradeId = 'plating' | 'oxygen' | 'battery' | 'hull' | 'light' | 'sonar' | 'propeller';
export type Loadout = Record<UpgradeId, number>;

export interface UpgradeLevel {
  name: string;
  cost: number;
  effect: string;
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

export const UPGRADE_ORDER: UpgradeId[] = ['plating', 'oxygen', 'battery', 'propeller', 'hull', 'light', 'sonar'];

// Level 0 is what a new sub starts with.
export const UPGRADES: Record<UpgradeId, UpgradeDef> = {
  plating: {
    title: 'Plating',
    blurb: 'Dive deeper before the hull starts to buckle.',
    levels: [
      { name: 'Silver Shell', cost: 0, effect: 'Safe to 120 m' },
      { name: 'Graphite Steel', cost: 300, effect: 'Safe to 240 m' },
      { name: 'Rescue Orange', cost: 1100, effect: 'Safe to 420 m' },
      { name: 'Abyssal Black', cost: 3200, effect: 'Safe to 800 m' },
    ],
  },
  oxygen: {
    title: 'Oxygen Tank',
    blurb: 'Stay under longer. Surfacing refills it.',
    levels: [
      { name: 'Silver Tank', cost: 0, effect: '30 seconds of air' },
      { name: 'Graphite Tank', cost: 250, effect: '60 seconds of air' },
      { name: 'Orange Tank', cost: 900, effect: '120 seconds of air' },
      { name: 'Black Tank', cost: 2000, effect: '240 seconds of air' },
    ],
  },
  battery: {
    title: 'Battery',
    blurb: 'Drive farther before you have to hand-crank. Docking recharges it.',
    levels: [
      { name: 'Starter Cell', cost: 0, effect: 'Short range' },
      { name: 'Twin Cells', cost: 200, effect: '1.8× range' },
      { name: 'Triple Pack', cost: 650, effect: '2.9× range' },
      { name: 'Gold Core', cost: 1800, effect: '4.4× range' },
    ],
  },
  propeller: {
    title: 'Propeller',
    blurb: 'Sail faster and cover more ocean per charge of air.',
    levels: [
      { name: 'Stock Prop', cost: 0, effect: 'Standard speed' },
      { name: 'Twin Blade', cost: 300, effect: '1.3× speed' },
      { name: 'Turbo Screw', cost: 1000, effect: '1.6× speed' },
    ],
  },
  hull: {
    title: 'Bumpers',
    blurb: 'Take more bumps from sharks and squid. Docking repairs them.',
    levels: [
      { name: 'Bare Hull', cost: 0, effect: 'Survives 1 hit' },
      { name: 'Bow Bumper', cost: 400, effect: 'Survives 2 hits' },
      { name: 'Full Fenders', cost: 1400, effect: 'Survives 3 hits' },
    ],
  },
  light: {
    title: 'Spotlight',
    blurb: 'See in the dark water of the deep.',
    levels: [
      { name: 'Running Lights', cost: 0, effect: 'Decorative only' },
      { name: 'Amber Lamp', cost: 180, effect: 'Short yellow beam' },
      { name: 'White Floodlight', cost: 600, effect: 'Long white beam' },
      { name: 'White Beam', cost: 1600, effect: 'Long, wide white beam plus a rear light' },
    ],
  },
  sonar: {
    title: 'Sonar',
    blurb: 'Pings reveal what is hiding in the dark.',
    levels: [
      { name: 'No Sonar', cost: 0, effect: 'Nothing detected' },
      { name: 'Fish Finder', cost: 350, effect: 'Creatures within 45 m' },
      { name: 'Treasure Ping', cost: 1000, effect: 'Creatures and treasure within 70 m' },
      { name: 'Deep Array', cost: 2600, effect: 'Everything within 100 m' },
    ],
  },
};

export const STATS = {
  depthRating: [120, 240, 420, 800],
  oxygen: [30, 60, 120, 240],
  battery: [9000, 16000, 26000, 40000],
  maxHull: [1, 2, 3],
  speed: [1, 1.3, 1.6],
  sonarRange: [0, 450, 700, 1000],
  /** Seconds between sonar pings (also the ping sound). */
  sonarInterval: [0, 5, 4, 3],
  light: [
    null,
    { range: 300, spread: 0.4, glow: 170, rgb: '255,205,90' },
    { range: 440, spread: 0.48, glow: 220, rgb: '240,248,255' },
    { range: 580, spread: 0.56, glow: 280, rgb: '235,245,255' },
  ] as (LightSpec | null)[],
};
