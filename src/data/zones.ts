import type { CreatureKind } from './creatures';

export interface CreatureSpawn {
  kind: CreatureKind;
  /** For fish this is the number of schools. */
  count: number;
  minDepth: number;
  maxDepth: number;
}

export interface ZoneDef {
  name: string;
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
  kelp: number;
  coral: number;
  rocks: number;
}

// How the zones connect is in routes.ts.
export const ZONES: ZoneDef[] = [
  {
    name: 'Sunny Shallows',
    map: { x: 46, y: 100 },
    width: 9000,
    floor: [35, 45, 70, 95, 80, 110, 145, 125, 170, 215, 195, 150, 115, 85, 60, 45],
    sky: ['#6CCBF2', '#D4F3FF'],
    water: ['#3CC3DA', '#173A86'],
    ground: ['#F2D49B', '#6B6F9E'],
    darkness: [30, 280],
    items: 70,
    creatures: [
      { kind: 'fish', count: 10, minDepth: 5, maxDepth: 180 },
      { kind: 'jelly', count: 5, minDepth: 40, maxDepth: 220 },
      { kind: 'hammerhead', count: 4, minDepth: 25, maxDepth: 220 },
    ],
    islands: [
      { x: 650, name: 'Coral Cove' },
      { x: 6100, name: 'Gull Rock' },
    ],
    wrecks: [{ x: 4400, kind: 'sloop' }],
    shafts: [{ name: 'Little Canyon Tunnel', x: 1900, width: 600, depth: 1000 }],
    kelp: 60,
    coral: 40,
    rocks: 50,
  },
  {
    name: 'Kelp Canyons',
    map: { x: 124, y: 100 },
    width: 10000,
    floor: [50, 90, 160, 230, 190, 250, 320, 370, 300, 230, 280, 350, 410, 320, 190, 90],
    sky: ['#79C6E6', '#E2F7EF'],
    water: ['#2FB3A0', '#0F2F5E'],
    ground: ['#C9B98A', '#4D5578'],
    darkness: [25, 330],
    items: 80,
    creatures: [
      { kind: 'fish', count: 10, minDepth: 5, maxDepth: 250 },
      { kind: 'jelly', count: 7, minDepth: 40, maxDepth: 350 },
      { kind: 'hammerhead', count: 4, minDepth: 25, maxDepth: 320 },
      { kind: 'shark', count: 2, minDepth: 40, maxDepth: 320 },
      { kind: 'squid', count: 3, minDepth: 180, maxDepth: 420 },
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
    map: { x: 214, y: 50 },
    width: 11000,
    floor: [70, 160, 300, 450, 580, 680, 640, 540, 660, 780, 740, 600, 420, 240, 110],
    sky: ['#F49B7A', '#FFE2B8'],
    water: ['#2A86BE', '#081233'],
    ground: ['#9F94B8', '#2A2D4D'],
    darkness: [20, 380],
    items: 90,
    creatures: [
      { kind: 'fish', count: 8, minDepth: 5, maxDepth: 200 },
      { kind: 'jelly', count: 12, minDepth: 60, maxDepth: 700 },
      { kind: 'hammerhead', count: 3, minDepth: 25, maxDepth: 350 },
      { kind: 'shark', count: 3, minDepth: 40, maxDepth: 350 },
      { kind: 'squid', count: 6, minDepth: 220, maxDepth: 700 },
      { kind: 'angler', count: 8, minDepth: 320, maxDepth: 800 },
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
    name: 'Coral Gardens',
    map: { x: 214, y: 150 },
    width: 9500,
    floor: [40, 60, 90, 130, 110, 95, 140, 180, 160, 120, 150, 190, 170, 110, 70, 45],
    sky: ['#7FD6E8', '#F0FBFF'],
    water: ['#35C9B8', '#124A7A'],
    ground: ['#F6C9A8', '#7A6FA0'],
    darkness: [30, 300],
    items: 75,
    creatures: [
      { kind: 'fish', count: 14, minDepth: 5, maxDepth: 200 },
      { kind: 'jelly', count: 4, minDepth: 40, maxDepth: 220 },
      { kind: 'hammerhead', count: 3, minDepth: 25, maxDepth: 220 },
      { kind: 'shark', count: 1, minDepth: 40, maxDepth: 220 },
    ],
    islands: [{ x: 5000, name: 'Pearl Atoll' }],
    wrecks: [{ x: 2800, kind: 'sloop' }],
    kelp: 30,
    coral: 90,
    rocks: 40,
  },
  {
    name: 'Frostbite Reach',
    map: { x: 304, y: 100 },
    width: 10500,
    floor: [60, 120, 220, 380, 520, 460, 540, 700, 620, 480, 560, 640, 500, 320, 160, 80],
    sky: ['#9FB8E6', '#E6EEFF'],
    water: ['#3E8FD0', '#0A1E4A'],
    ground: ['#B7C6E0', '#3A4468'],
    darkness: [20, 360],
    items: 90,
    creatures: [
      { kind: 'fish', count: 8, minDepth: 5, maxDepth: 250 },
      { kind: 'jelly', count: 8, minDepth: 60, maxDepth: 600 },
      { kind: 'shark', count: 3, minDepth: 40, maxDepth: 400 },
      { kind: 'squid', count: 5, minDepth: 200, maxDepth: 650 },
      { kind: 'angler', count: 6, minDepth: 300, maxDepth: 750 },
    ],
    islands: [
      { x: 700, name: 'Glacier Quay' },
      { x: 7600, name: 'Frost Harbor' },
    ],
    wrecks: [{ x: 6200, kind: 'galleon' }],
    kelp: 20,
    coral: 5,
    rocks: 90,
  },
];
