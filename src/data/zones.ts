import type { CreatureKind } from './creatures';
import type { UpgradeId } from './upgrades';
import { CATALOG } from './catalog';

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
  /** Rocks and starfish lying on the floors of the tunnels. */
  stones?: number;
  starfish?: number;
  /** An open cavern with no rock in it, from a bumpy ceiling around `from` meters deep down to `to`, running the whole width of the cave region with no side walls; the view zooms out to `zoom` inside it. */
  abyss?: { from: number; to: number; zoom: number; lair: [number, number]; relic: [number, number]; bones: number };
}

export interface ZoneDef {
  name: string;
  /** A test zone that lays out every animal, plant, rock, item and wreck for inspection; always daytime, hidden from the route map. */
  catalog?: boolean;
  /** How far the view zooms out while diving here: 1 is normal, smaller shows more of the ocean. */
  diveZoom: number;
  /** Where this zone sits on the route map, in a 360 x 200 box. */
  map: { x: number; y: number };
  /** Zone width in world pixels (10 px = 1 m). */
  width: number;
  /** Sea floor depth in meters, spread evenly from the west edge to the east edge. */
  floor: number[];
  /** Scales the small waves in the sea floor; below 1 makes it flatter. */
  calm?: number;
  sky: [string, string];
  water: [string, string];
  ground: [string, string];
  /** Depths in meters where the water starts to darken and where it is fully dark. */
  darkness: [number, number];
  items: number;
  /** Junk on the sea floor at fixed spots; clearing all of it earns the zone's clean-up achievement. */
  trash?: number;
  creatures: CreatureSpawn[];
  /** `sells` limits the island shop to those upgrades; without it the shop sells everything this zone offers. */
  islands: { x: number; name: string; sells?: UpgradeId[] }[];
  wrecks: { x: number; kind: 'sloop' | 'galleon' | 'freighter' | 'containers' }[];
  /** Vertical cave shafts cut into the sea floor; width in px, depth in meters. */
  shafts?: { name: string; x: number; width: number; depth: number }[];
  caves?: CaveDef[];
  /** An airless moon: black sky with a few stars, no sun, moon, clouds or day and night. */
  space?: boolean;
  /** The island shop here also sells the dive weights. */
  sellsWeights?: boolean;
  kelp: number;
  coral: number;
  /** Dense patches of vibrant coral on the sea floor. */
  reefs?: number;
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
    trash: 8,
    creatures: [
      { kind: 'fish', count: 10, minDepth: 5, maxDepth: 70 },
      { kind: 'jelly', count: 5, minDepth: 25, maxDepth: 80 },
      { kind: 'hammerhead', count: 4, minDepth: 20, maxDepth: 80 },
      { kind: 'stingray', count: 3, minDepth: 10, maxDepth: 80 },
      { kind: 'turtle', count: 3, minDepth: 5, maxDepth: 80 },
    ],
    islands: [
      { x: 650, name: 'Coral Cove', sells: ['plating', 'oxygen'] },
      { x: 6100, name: 'Gull Rock', sells: ['battery'] },
    ],
    wrecks: [{ x: 4400, kind: 'sloop' }],
    caves: [{
      name: 'Echo Caverns',
      stones: 40,
      x0: 5000,
      x1: 8600,
      hill: { x: 7300, half: 620, ramp: 220, height: 55 },
      passages: [
        { pts: [[6300, 55], [6700, 55], [6950, 58]], r: 190 },
        { pts: [[6950, 58], [6950, 120], [7100, 160], [7100, 205]], r: 190 },
        { pts: [[7100, 205], [6600, 205], [6450, 225], [6450, 262]], r: 95 },
        { pts: [[7100, 205], [7600, 215], [7900, 215], [7900, 250]], r: 190 },
        { pts: [[6450, 262], [7000, 270], [7500, 262], [7900, 250]], r: 190 },
        { pts: [[7000, 270], [7000, 330]], r: 95 },
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
      stones: 28,
      x0: 2700,
      x1: 5200,
      hill: { x: 3900, half: 0, ramp: 1, height: 0 },
      passages: [
        { pts: [[3900, 75], [3900, 130], [3700, 170], [3500, 200]], r: 190 },
        { pts: [[3500, 200], [3200, 215], [3050, 250]], r: 190 },
        { pts: [[3700, 170], [4100, 200], [4450, 230], [4800, 260]], r: 95 },
        { pts: [[3500, 205]], r: 290, loot: 1 },
        { pts: [[3050, 255]], r: 270, loot: 2 },
        { pts: [[4800, 262]], r: 260, loot: 1 },
      ],
    }, {
      name: 'Sunken Vaults',
      stones: 34,
      x0: 250,
      x1: 3300,
      hill: { x: 1500, half: 0, ramp: 1, height: 0 },
      passages: [
        { pts: [[1500, 50], [1450, 110], [1700, 160], [2000, 180]], r: 190 },
        { pts: [[2000, 180], [2400, 180], [2700, 215], [2700, 260]], r: 190 },
        { pts: [[2000, 180], [1700, 230], [1500, 255]], r: 95 },
        { pts: [[2050, 182]], r: 260, loot: 1 },
        { pts: [[1500, 258]], r: 300, loot: 1 },
        { pts: [[2700, 265]], r: 280, loot: 2 },
        { pts: [[1500, 258], [1100, 265], [800, 285]], r: 105 },
        { pts: [[650, 290]], r: 240, loot: 2 },
      ],
    }, {
      name: 'Drowned Hall',
      stones: 8,
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
    reefs: 5,
    rocks: 50,
  },
  {
    name: 'Coral Gardens',
    diveZoom: 0.85,
    map: { x: 92, y: 110 },
    width: 9500,
    floor: [40, 60, 90, 130, 110, 95, 140, 180, 160, 120, 150, 190, 170, 110, 70, 45],
    sky: ['#7FD6E8', '#F0FBFF'],
    water: ['#35C9B8', '#124A7A'],
    ground: ['#F6C9A8', '#7A6FA0'],
    darkness: [30, 300],
    items: 38,
    trash: 10,
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
        stones: 40,
        x0: 150,
        x1: 2800,
        hill: { x: 1450, half: 430, ramp: 260, height: 80 },
        passages: [
          { pts: [[500, 46], [800, 52], [1150, 70], [1400, 84]], r: 125 },
          { pts: [[1400, 84], [1300, 125], [1500, 150], [1350, 190]], r: 120 },
          { pts: [[1350, 190], [900, 200], [700, 235], [900, 265]], r: 120 },
          { pts: [[900, 265], [1400, 275], [1800, 265], [2100, 300]], r: 105 },
          { pts: [[1350, 190], [1800, 205], [2150, 195]], r: 105 },
          { pts: [[1800, 265], [1800, 330]], r: 90 },
          { pts: [[700, 240]], r: 200, loot: 1 },
          { pts: [[2150, 195]], r: 190, loot: 1 },
          { pts: [[2100, 305]], r: 230, loot: 2 },
          { pts: [[1800, 335]], r: 270, loot: 3 },
          { pts: [[1800, 330], [1500, 385], [1900, 435], [1500, 490], [1950, 545], [2300, 589], [2000, 633], [2500, 671], [3000, 700]], r: 115 },
          { pts: [[1500, 490], [1200, 506]], r: 100 },
          { pts: [[1200, 509]], r: 220, loot: 1 },
        ],
      },
      {
        name: 'Pearl Depths',
        stones: 40,
        x0: 7050,
        x1: 9300,
        hill: { x: 8200, half: 330, ramp: 240, height: 75 },
        passages: [
          { pts: [[7400, 100], [7850, 104], [8200, 118]], r: 125 },
          { pts: [[8200, 118], [8250, 170], [8150, 215], [8250, 260], [8200, 310]], r: 115 },
          { pts: [[8150, 215], [7800, 225], [7550, 255]], r: 100 },
          { pts: [[8250, 260], [8600, 270], [8900, 250]], r: 100 },
          { pts: [[8200, 310], [7800, 330], [7650, 350]], r: 100 },
          { pts: [[8200, 310], [8200, 365]], r: 90 },
          { pts: [[7550, 258]], r: 200, loot: 1 },
          { pts: [[8900, 250]], r: 220, loot: 2 },
          { pts: [[7650, 352]], r: 230, loot: 1 },
          { pts: [[8200, 370]], r: 290, loot: 3 },
          { pts: [[8200, 370], [8250, 427], [7900, 479], [8100, 531], [7700, 573], [7900, 625], [7400, 667]], r: 115 },
          { pts: [[7900, 479], [7600, 459]], r: 100 },
          { pts: [[7550, 462]], r: 200, loot: 1 },
        ],
      },
      {
        name: 'Abyssal Run',
        stones: 30,
        x0: 2700,
        x1: 7150,
        hill: { x: 5000, half: 0, ramp: 1, height: 0 },
        passages: [
          { pts: [[5000, 700]], r: 300, loot: 1 },
          { pts: [[3000, 700]], r: 280, loot: 1 },
          { pts: [[3000, 700], [3500, 661], [4000, 645], [4600, 672], [5000, 700]], r: 105 },
          { pts: [[3000, 700], [3500, 739], [4100, 755], [4700, 733], [5000, 700]], r: 105 },
          { pts: [[4000, 645], [4050, 700], [4100, 755]], r: 90 },
          { pts: [[4000, 648]], r: 220, loot: 1 },
          { pts: [[4100, 755], [4100, 799]], r: 90 },
          { pts: [[4100, 802]], r: 250, loot: 2 },
          { pts: [[5000, 700], [5500, 678], [6000, 700], [6500, 728], [7000, 700], [7400, 667]], r: 115 },
          { pts: [[5500, 678], [5500, 623]], r: 90 },
          { pts: [[5500, 620]], r: 200, loot: 1 },
          { pts: [[6000, 700], [6000, 766], [5700, 810]], r: 100 },
          { pts: [[5700, 813]], r: 270, loot: 2 },
        ],
      },
    ],
    kelp: 30,
    coral: 90,
    reefs: 14,
    rocks: 40,
  },
  {
    name: 'Kelp Canyons',
    diveZoom: 0.7,
    map: { x: 175, y: 55 },
    width: 10000,
    floor: [50, 90, 160, 230, 190, 340, 340, 230, 520, 900, 900, 900, 900, 900, 520, 120],
    calm: 0.35,
    sky: ['#79C6E6', '#E2F7EF'],
    water: ['#2FB3A0', '#0F2F5E'],
    ground: ['#C9B98A', '#4D5578'],
    darkness: [25, 330],
    items: 40,
    trash: 12,
    creatures: [
      { kind: 'fish', count: 10, minDepth: 5, maxDepth: 250 },
      { kind: 'jelly', count: 7, minDepth: 40, maxDepth: 350 },
      { kind: 'hammerhead', count: 4, minDepth: 25, maxDepth: 320 },
      { kind: 'shark', count: 2, minDepth: 40, maxDepth: 320 },
      { kind: 'squid', count: 3, minDepth: 180, maxDepth: 420 },
      { kind: 'jelly', count: 8, minDepth: 450, maxDepth: 880 },
      { kind: 'manta', count: 2, minDepth: 60, maxDepth: 300 },
    ],
    islands: [
      { x: 600, name: 'Driftwood Dock' },
      { x: 7300, name: 'Lantern Isle' },
    ],
    wrecks: [
      { x: 3600, kind: 'containers' },
      { x: 7300, kind: 'freighter' },
      { x: 2200, kind: 'sloop' },
    ],
    kelp: 140,
    coral: 25,
    reefs: 2,
    rocks: 60,
  },
  {
    name: 'Midnight Trench',
    diveZoom: 0.6,
    map: { x: 175, y: 150 },
    width: 11000,
    floor: [70, 160, 300, 450, 580, 680, 640, 540, 660, 780, 740, 600, 420, 240, 110],
    sky: ['#F49B7A', '#FFE2B8'],
    water: ['#2A86BE', '#081233'],
    ground: ['#9F94B8', '#2A2D4D'],
    darkness: [20, 380],
    items: 45,
    trash: 12,
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
    map: { x: 255, y: 110 },
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
    map: { x: 330, y: 110 },
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
        { pts: [[1500, 300], [1500, 380], [1700, 430]], r: 95 },
        { pts: [[1700, 430], [2300, 470], [2900, 450], [3100, 330]], r: 190 },
        { pts: [[400, 322], [500, 400], [900, 450], [1700, 430]], r: 95 },
        { pts: [[4300, 380], [4300, 450], [4700, 490], [5100, 470], [5400, 380]], r: 95 },
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
  {
    name: 'Catalog',
    catalog: true,
    diveZoom: 0.75,
    map: { x: 0, y: 0 },
    width: CATALOG.width,
    floor: CATALOG.floor,
    calm: 0,
    sky: ['#6CCBF2', '#D4F3FF'],
    water: ['#3CC3DA', '#173A86'],
    ground: ['#F2D49B', '#6B6F9E'],
    darkness: [150, 400],
    items: 0,
    creatures: [],
    islands: [],
    wrecks: CATALOG.wrecks,
    kelp: 0,
    coral: 0,
    rocks: 0,
  },
];

/** Zone indexes in the order the test panel steps through them: the catalog first, then the real zones. */
export const ZONE_ORDER = ZONES.map((_, i) => i).sort((a, b) => Number(!!ZONES[b].catalog) - Number(!!ZONES[a].catalog));

/** The number shown for a zone: the catalog is zone 0 and the rest count from 1. */
export const zoneNumber = (i: number) => (ZONES[i].catalog ? 0 : i + 1);
