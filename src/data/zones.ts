import type { CreatureKind } from './creatures';

export interface CreatureSpawn {
  kind: CreatureKind;
  /** For fish this is the number of schools. */
  count: number;
  minDepth: number;
  maxDepth: number;
}

/** A tunnel through the land: a chain of [x in px, depth in m] points, or a single point for a round room. */
export interface CavePassage {
  pts: [number, number][];
  /** Tunnel radius in px. */
  r: number;
  /** Treasure items resting in this passage. */
  loot?: number;
}

/** A rocky headland with tunnels carved through it; collision inside x0..x1 uses the tunnels, not just the sea floor. */
export interface CaveDef {
  name: string;
  x0: number;
  x1: number;
  /** Raises the sea floor into a headland with steep sides, so the first tunnel can enter its side horizontally. */
  hill: { x: number; half: number; ramp: number; height: number };
  passages: CavePassage[];
}

export interface ZoneDef {
  name: string;
  /** How far the view zooms out while diving here: 1 is normal, smaller shows more of the ocean. */
  diveZoom: number;
  /** Where this zone sits on the route map, in a 360 x 200 box. */
  map: { x: number; y: number };
  /** Zone width in world pixels (10 px = 1 m). */
  width: number;
  /** Sea floor depth in meters, spread evenly from the west edge to the east edge. */
  floor: number[];
  sky: [string, string];
  water: [string, string];
  ground: [string, string];
  /** Depths in meters where the water starts to darken and where it is fully dark. */
  darkness: [number, number];
  items: number;
  creatures: CreatureSpawn[];
  islands: { x: number; name: string }[];
  wrecks: { x: number; kind: 'sloop' | 'galleon' }[];
  /** Vertical cave shafts cut into the sea floor; width in px, depth in meters. */
  shafts?: { name: string; x: number; width: number; depth: number }[];
  caves?: CaveDef[];
  /** The island shop here also sells the dive weights. */
  sellsWeights?: boolean;
  kelp: number;
  coral: number;
  rocks: number;
}

const smooth = (x: number, from: number, to: number) => {
  const u = Math.min(1, Math.max(0, (x - from) / (to - from)));
  return u * u * (3 - 2 * u);
};

/** Moana Deep: an open sea floor around 1500 m with a wide trench at each end, one about 3300 m deep and one about 4700 m. */
const MOANA_FLOOR = Array.from({ length: 36 }, (_, i) => {
  const x = i * 300;
  const hills = 1500 + 12 * Math.sin(i * 1.7) + 8 * Math.sin(i * 0.63 + 1);
  const left = 1 - smooth(x, 1500, 2400);
  const right = smooth(x, 8400, 9300);
  return Math.round(hills + left * (3300 + 90 * Math.sin(i * 2.3) - 1500) + right * (4700 + 140 * Math.sin(i * 1.9 + 2) - 1500));
});

// How the zones connect is in routes.ts.
export const ZONES: ZoneDef[] = [
  {
    name: 'Sunny Shallows',
    diveZoom: 1,
    map: { x: 40, y: 110 },
    width: 9000,
    floor: [30, 35, 45, 55, 50, 60, 70, 65, 75, 85, 80, 70, 60, 50, 40, 35],
    sky: ['#6CCBF2', '#D4F3FF'],
    water: ['#3CC3DA', '#173A86'],
    ground: ['#F2D49B', '#6B6F9E'],
    darkness: [30, 280],
    items: 35,
    creatures: [
      { kind: 'fish', count: 10, minDepth: 5, maxDepth: 70 },
      { kind: 'jelly', count: 5, minDepth: 25, maxDepth: 80 },
      { kind: 'hammerhead', count: 4, minDepth: 20, maxDepth: 80 },
      { kind: 'stingray', count: 3, minDepth: 10, maxDepth: 80 },
    ],
    islands: [
      { x: 650, name: 'Coral Cove' },
      { x: 6100, name: 'Gull Rock' },
    ],
    wrecks: [{ x: 4400, kind: 'sloop' }],
    caves: [{
      name: 'Echo Caverns',
      x0: 6000,
      x1: 8600,
      hill: { x: 7300, half: 620, ramp: 220, height: 45 },
      passages: [
        { pts: [[6300, 55], [6700, 55], [6950, 58]], r: 190 },
        { pts: [[6950, 58], [6950, 120], [7100, 160], [7100, 205]], r: 190 },
        { pts: [[7100, 205], [6600, 205], [6450, 225], [6450, 262]], r: 190 },
        { pts: [[7100, 205], [7600, 215], [7900, 215], [7900, 250]], r: 190 },
        { pts: [[6450, 262], [7000, 270], [7500, 262], [7900, 250]], r: 190 },
        { pts: [[7000, 270], [7000, 330]], r: 190 },
        { pts: [[7500, 262], [7500, 310], [7800, 330]], r: 190 },
        { pts: [[7600, 215], [7600, 160]], r: 170, loot: 1 },
        { pts: [[6600, 205], [6340, 225]], r: 170, loot: 1 },
        { pts: [[6450, 265]], r: 270, loot: 1 },
        { pts: [[7900, 215]], r: 300, loot: 1 },
        { pts: [[7000, 335]], r: 350, loot: 2 },
        { pts: [[7850, 335]], r: 250, loot: 2 },
      ],
    }],
    kelp: 60,
    coral: 40,
    rocks: 50,
  },
  {
    name: 'Coral Gardens',
    diveZoom: 0.85,
    map: { x: 110, y: 70 },
    width: 9500,
    floor: [40, 60, 90, 130, 110, 95, 140, 180, 160, 120, 150, 190, 170, 110, 70, 45],
    sky: ['#7FD6E8', '#F0FBFF'],
    water: ['#35C9B8', '#124A7A'],
    ground: ['#F6C9A8', '#7A6FA0'],
    darkness: [30, 300],
    items: 38,
    creatures: [
      { kind: 'fish', count: 14, minDepth: 5, maxDepth: 200 },
      { kind: 'jelly', count: 4, minDepth: 40, maxDepth: 220 },
      { kind: 'hammerhead', count: 3, minDepth: 25, maxDepth: 220 },
      { kind: 'shark', count: 1, minDepth: 40, maxDepth: 220 },
    ],
    islands: [{ x: 5000, name: 'Pearl Atoll' }],
    wrecks: [{ x: 2800, kind: 'sloop' }],
    caves: [
      {
        name: 'Shell Hollows',
        x0: 150,
        x1: 2800,
        hill: { x: 1450, half: 430, ramp: 260, height: 80 },
        passages: [
          { pts: [[500, 46], [800, 52], [1150, 70], [1400, 84]], r: 190 },
          { pts: [[1400, 84], [1500, 115], [1450, 150], [1550, 172]], r: 190 },
          { pts: [[1550, 172], [1150, 178], [950, 198], [950, 232]], r: 190 },
          { pts: [[1550, 172], [1900, 180], [2150, 180], [2200, 215]], r: 190 },
          { pts: [[950, 232], [1500, 240], [1950, 232], [2200, 215]], r: 190 },
          { pts: [[1500, 240], [1500, 288]], r: 190 },
          { pts: [[1900, 180], [1900, 135]], r: 170, loot: 1 },
          { pts: [[1150, 178], [780, 160]], r: 170, loot: 1 },
          { pts: [[950, 240]], r: 270, loot: 1 },
          { pts: [[2200, 222]], r: 300, loot: 2 },
          { pts: [[1500, 295]], r: 330, loot: 3 },
        ],
      },
      {
        name: 'Pearl Depths',
        x0: 7050,
        x1: 9300,
        hill: { x: 8200, half: 330, ramp: 240, height: 75 },
        passages: [
          { pts: [[7400, 100], [7850, 104], [8200, 118]], r: 190 },
          { pts: [[8200, 118], [8150, 160], [8300, 200], [8250, 240]], r: 190 },
          { pts: [[8250, 240], [7850, 248], [7650, 270], [7650, 305]], r: 190 },
          { pts: [[8250, 240], [8550, 250], [8800, 250], [8850, 285]], r: 190 },
          { pts: [[7650, 305], [8200, 312], [8650, 305], [8850, 285]], r: 190 },
          { pts: [[8200, 312], [8200, 355]], r: 190 },
          { pts: [[8550, 250], [8550, 205]], r: 170, loot: 1 },
          { pts: [[7850, 248], [7500, 230]], r: 170, loot: 1 },
          { pts: [[7650, 312]], r: 270, loot: 1 },
          { pts: [[8850, 290]], r: 300, loot: 2 },
          { pts: [[8200, 360]], r: 330, loot: 3 },
        ],
      },
    ],
    kelp: 30,
    coral: 90,
    rocks: 40,
  },
  {
    name: 'Kelp Canyons',
    diveZoom: 0.7,
    map: { x: 180, y: 120 },
    width: 10000,
    floor: [50, 90, 160, 230, 190, 250, 320, 370, 300, 230, 280, 350, 410, 320, 190, 90],
    sky: ['#79C6E6', '#E2F7EF'],
    water: ['#2FB3A0', '#0F2F5E'],
    ground: ['#C9B98A', '#4D5578'],
    darkness: [25, 330],
    items: 40,
    creatures: [
      { kind: 'fish', count: 10, minDepth: 5, maxDepth: 250 },
      { kind: 'jelly', count: 7, minDepth: 40, maxDepth: 350 },
      { kind: 'hammerhead', count: 4, minDepth: 25, maxDepth: 320 },
      { kind: 'shark', count: 2, minDepth: 40, maxDepth: 320 },
      { kind: 'squid', count: 3, minDepth: 180, maxDepth: 420 },
      { kind: 'manta', count: 2, minDepth: 60, maxDepth: 300 },
    ],
    islands: [
      { x: 600, name: 'Driftwood Dock' },
      { x: 7300, name: 'Lantern Isle' },
    ],
    wrecks: [
      { x: 3600, kind: 'galleon' },
      { x: 8400, kind: 'sloop' },
    ],
    kelp: 140,
    coral: 25,
    rocks: 60,
  },
  {
    name: 'Midnight Trench',
    diveZoom: 0.6,
    map: { x: 250, y: 70 },
    width: 11000,
    floor: [70, 160, 300, 450, 580, 680, 640, 540, 660, 780, 740, 600, 420, 240, 110],
    sky: ['#F49B7A', '#FFE2B8'],
    water: ['#2A86BE', '#081233'],
    ground: ['#9F94B8', '#2A2D4D'],
    darkness: [20, 380],
    items: 45,
    creatures: [
      { kind: 'fish', count: 8, minDepth: 5, maxDepth: 200 },
      { kind: 'jelly', count: 12, minDepth: 60, maxDepth: 700 },
      { kind: 'hammerhead', count: 3, minDepth: 25, maxDepth: 350 },
      { kind: 'shark', count: 3, minDepth: 40, maxDepth: 350 },
      { kind: 'squid', count: 6, minDepth: 220, maxDepth: 700 },
      { kind: 'angler', count: 8, minDepth: 320, maxDepth: 800 },
      { kind: 'manta', count: 2, minDepth: 80, maxDepth: 500 },
      { kind: 'colossal', count: 2, minDepth: 450, maxDepth: 720 },
    ],
    islands: [{ x: 650, name: 'Last Light Atoll' }],
    wrecks: [
      { x: 5300, kind: 'galleon' },
      { x: 9200, kind: 'galleon' },
    ],
    kelp: 40,
    coral: 10,
    rocks: 80,
  },
  {
    name: 'Moana Deep',
    sellsWeights: true,
    diveZoom: 0.5,
    map: { x: 320, y: 110 },
    width: 10500,
    floor: MOANA_FLOOR,
    sky: ['#9FB8E6', '#E6EEFF'],
    water: ['#3E8FD0', '#0A1E4A'],
    ground: ['#B7C6E0', '#3A4468'],
    darkness: [20, 360],
    items: 0,
    creatures: [
      { kind: 'fish', count: 2, minDepth: 20, maxDepth: 400 },
      { kind: 'jelly', count: 5, minDepth: 300, maxDepth: 1300 },
      { kind: 'squid', count: 3, minDepth: 500, maxDepth: 1300 },
      { kind: 'angler', count: 4, minDepth: 700, maxDepth: 1450 },
      { kind: 'whale', count: 2, minDepth: 400, maxDepth: 1100 },
      { kind: 'manta', count: 2, minDepth: 100, maxDepth: 800 },
      { kind: 'colossal', count: 2, minDepth: 900, maxDepth: 1400 },
    ],
    islands: [{ x: 700, name: 'Palm Atoll' }],
    wrecks: [],
    kelp: 0,
    coral: 0,
    rocks: 60,
  },
];
