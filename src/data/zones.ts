import type { CreatureKind } from './creatures';
import type { UpgradeId } from './upgrades';

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
  /** Skeleton pieces scattered on the floors of the tunnels above the cavern. */
  bones?: number;
  /** An open cavern with no rock in it, from a bumpy ceiling around `from` meters deep down to `to`, running the whole width of the cave region with no side walls; the view zooms out to `zoom` inside it. */
  abyss?: { from: number; to: number; zoom: number; lair: [number, number]; relic: [number, number]; bones: number };
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
  /** `sells` limits the island shop to those upgrades; without it the shop sells everything this zone offers. */
  islands: { x: number; name: string; sells?: UpgradeId[] }[];
  wrecks: { x: number; kind: 'sloop' | 'galleon' }[];
  /** Vertical cave shafts cut into the sea floor; width in px, depth in meters. */
  shafts?: { name: string; x: number; width: number; depth: number }[];
  caves?: CaveDef[];
  /** An airless moon: black sky with a few stars, no sun, moon, clouds or day and night. */
  space?: boolean;
  /** The island shop here also sells the dive weights. */
  sellsWeights?: boolean;
  kelp: number;
  coral: number;
  rocks: number;
  /** Skeleton pieces (skulls, rib cages, bones, whole skeletons) scattered on the sea floor. */
  bones?: number;
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
    map: { x: 30, y: 110 },
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
      { kind: 'turtle', count: 3, minDepth: 5, maxDepth: 80 },
    ],
    islands: [
      { x: 650, name: 'Coral Cove', sells: ['plating', 'oxygen'] },
      { x: 6100, name: 'Gull Rock', sells: ['battery', 'propeller'] },
    ],
    wrecks: [{ x: 4400, kind: 'sloop' }],
    caves: [{
      name: 'Echo Caverns',
      x0: 5000,
      x1: 8600,
      hill: { x: 7300, half: 620, ramp: 220, height: 55 },
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
        { pts: [[6450, 262], [6050, 275], [5650, 272], [5250, 266], [4800, 262]], r: 105 },
      ],
    }, {
      name: 'Tidewater Grotto',
      x0: 2700,
      x1: 5200,
      hill: { x: 3900, half: 0, ramp: 1, height: 0 },
      passages: [
        { pts: [[3900, 75], [3900, 130], [3700, 170], [3500, 200]], r: 190 },
        { pts: [[3500, 200], [3200, 215], [3050, 250]], r: 190 },
        { pts: [[3700, 170], [4100, 200], [4450, 230], [4800, 260]], r: 190 },
        { pts: [[3500, 205]], r: 290, loot: 1 },
        { pts: [[3050, 255]], r: 270, loot: 2 },
        { pts: [[4800, 262]], r: 260, loot: 1 },
      ],
    }, {
      name: 'Sunken Vaults',
      x0: 250,
      x1: 3300,
      hill: { x: 1500, half: 0, ramp: 1, height: 0 },
      passages: [
        { pts: [[1500, 50], [1450, 110], [1700, 160], [2000, 180]], r: 190 },
        { pts: [[2000, 180], [2400, 180], [2700, 215], [2700, 260]], r: 190 },
        { pts: [[2000, 180], [1700, 230], [1500, 255]], r: 190 },
        { pts: [[2050, 182]], r: 260, loot: 1 },
        { pts: [[1500, 258]], r: 300, loot: 1 },
        { pts: [[2700, 265]], r: 280, loot: 2 },
        { pts: [[1500, 258], [1100, 265], [800, 285]], r: 105 },
        { pts: [[650, 290]], r: 240, loot: 2 },
      ],
    }, {
      name: 'Drowned Hall',
      x0: 8350,
      x1: 8950,
      hill: { x: 8600, half: 0, ramp: 1, height: 0 },
      passages: [
        { pts: [[8600, 45], [8600, 110], [8550, 170], [8600, 230]], r: 190 },
        { pts: [[8600, 235]], r: 300, loot: 2 },
      ],
    }],
    kelp: 60,
    coral: 40,
    rocks: 50,
  },
  {
    name: 'Coral Gardens',
    diveZoom: 0.85,
    map: { x: 92, y: 70 },
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
      { kind: 'turtle', count: 3, minDepth: 8, maxDepth: 150 },
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
    map: { x: 154, y: 120 },
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
    map: { x: 216, y: 70 },
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
      { kind: 'manta', count: 2, minDepth: 80, maxDepth: 500 },
      { kind: 'bluewhale', count: 2, minDepth: 25, maxDepth: 160 },
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
    map: { x: 278, y: 110 },
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
      { kind: 'angler', count: 8, minDepth: 1000, maxDepth: 2500 },
      { kind: 'whale', count: 2, minDepth: 400, maxDepth: 1100 },
      { kind: 'manta', count: 2, minDepth: 100, maxDepth: 800 },
      { kind: 'bluewhale', count: 2, minDepth: 25, maxDepth: 160 },
      { kind: 'colossal', count: 2, minDepth: 1000, maxDepth: 1450 },
      { kind: 'bigfin', count: 3, minDepth: 1050, maxDepth: 1300 },
    ],
    islands: [{ x: 700, name: 'Palm Atoll' }],
    wrecks: [],
    kelp: 0,
    coral: 0,
    rocks: 60,
  },
  {
    name: 'Crimson Sea',
    space: true,
    diveZoom: 0.75,
    map: { x: 336, y: 75 },
    width: 9000,
    floor: [120, 140, 180, 210, 250, 230, 200, 240, 270, 250, 220, 190, 170, 150, 130, 110],
    sky: ['#000000', '#04050A'],
    water: ['#C1272D', '#2B0407'],
    ground: ['#E6E2DC', '#8C857E'],
    darkness: [5, 90],
    items: 0,
    caves: [{
      name: 'Crimson Warrens',
      x0: 0,
      x1: 9000,
      hill: { x: 4500, half: 0, ramp: 1, height: 0 },
      bones: 45,
      abyss: { from: 560, to: 3000, zoom: 0.5, lair: [5150, 3900], relic: [3550, 3360], bones: 160 },
      passages: [
        { pts: [[700, 150], [700, 215], [950, 265]], r: 190 },
        { pts: [[3300, 222], [3300, 290], [3100, 330]], r: 190 },
        { pts: [[5700, 238], [5700, 300], [5900, 350]], r: 190 },
        { pts: [[8000, 155], [8000, 225], [7800, 275]], r: 190 },
        { pts: [[950, 265], [1500, 300], [2100, 340], [2700, 350], [3100, 330], [3700, 345], [4300, 380], [4900, 400], [5400, 380], [5900, 350], [6500, 320], [7100, 300], [7800, 275]], r: 190 },
        { pts: [[7800, 275], [8300, 260], [8600, 240]], r: 190 },
        { pts: [[950, 265], [600, 290], [400, 322]], r: 190 },
        { pts: [[1500, 300], [1500, 380], [1700, 430]], r: 190 },
        { pts: [[1700, 430], [2300, 470], [2900, 450], [3100, 330]], r: 190 },
        { pts: [[400, 322], [500, 400], [900, 450], [1700, 430]], r: 190 },
        { pts: [[4300, 380], [4300, 450], [4700, 490], [5100, 470], [5400, 380]], r: 190 },
        { pts: [[6500, 320], [6700, 400], [7100, 430], [7500, 400], [7800, 275]], r: 190 },
        { pts: [[3700, 345], [3700, 420], [3400, 470]], r: 105 },
        { pts: [[5900, 350], [6100, 420], [6400, 480]], r: 105 },
        { pts: [[2100, 340], [2200, 285]], r: 170 },
        { pts: [[8600, 240]], r: 300 },
        { pts: [[400, 325]], r: 280 },
        { pts: [[2300, 475]], r: 330 },
        { pts: [[4700, 495]], r: 340 },
        { pts: [[7100, 435]], r: 300 },
        { pts: [[3400, 475]], r: 250 },
        { pts: [[6450, 485]], r: 280 },
        { pts: [[900, 455]], r: 260 },
        { pts: [[4700, 495], [4700, 575]], r: 260 },
        { pts: [[2300, 475], [2300, 575]], r: 250 },
        { pts: [[7100, 435], [7100, 575]], r: 240 },
        { pts: [[4500, 2985], [4500, 3070], [4350, 3180], [4330, 3330], [4800, 3240], [5300, 3200], [5800, 3320], [6100, 3560], [6250, 3800], [6300, 3900]], r: 190 },
        { pts: [[4350, 3180], [3950, 3250], [3600, 3330]], r: 190 },
        { pts: [[3550, 3360]], r: 260 },
        { pts: [[2600, 3900], [3400, 3905], [4300, 3900], [5200, 3900], [5800, 3905], [6300, 3900], [6900, 3905], [7600, 3900]], r: 190 },
        { pts: [[2500, 3900]], r: 330 },
        { pts: [[5100, 3900]], r: 380 },
        { pts: [[7700, 3900]], r: 330 },
        { pts: [[7700, 3900], [7800, 3650], [7850, 3300], [7800, 2985]], r: 190 },
      ],
    }],
    creatures: [],
    islands: [],
    wrecks: [],
    kelp: 0,
    coral: 0,
    rocks: 70,
  },
];
