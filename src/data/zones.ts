import type { CreatureKind } from './creatures';
import type { GearId } from './upgrades';
import type { ItemKind } from './items';
import { CATALOG } from './catalog';

export type WreckKind = 'sloop' | 'galleon' | 'freighter' | 'containers' | 'titanic';

export interface CreatureSpawn {
  kind: CreatureKind;
  /** For fish this is the number of schools. */
  count: number;
  /** Makes each spawn a loose cluster of this many (min, max) animals instead of a single one, so `count` is the number of clusters. */
  group?: [number, number];
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
  /** Fixed kinds for the loot, in order, instead of random picks. */
  kinds?: ItemKind[];
  /** Keeps the walls the same width all along instead of wavering, so the tunnel floor stays level. */
  flat?: boolean;
  /** For a round room: leaves a pillar of rock this many px wide in the middle, so the room is a loop around it. */
  hole?: number;
}

/** A rocky headland with tunnels carved through it; collision inside x0..x1 uses the tunnels, not just the sea floor. */
export interface CaveDef {
  name: string;
  x0: number;
  x1: number;
  /** Raises the sea floor into a headland with steep sides, so the first tunnel can enter its side horizontally. */
  hill: { x: number; half: number; ramp: number; height: number };
  passages: CavePassage[];
  /** Skips the random shifts of the tunnels each visit, so the layout stays exactly as listed. */
  fixed?: boolean;
  /** From outside only the mouth of the first passage shows; the rest is drawn once the sub is inside. */
  hidden?: boolean;
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
  /** Shown as question marks on maps and portals until the player has been there. */
  secret?: boolean;
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
  /** Roughens steep stretches of the sea floor by wobbling them sideways; 1 is bumpy. */
  rugged?: number;
  /** Hydrothermal vents spaced along the sea floor from x0 to x1, giving off light. */
  vents?: { x0: number; x1: number; count: number }[];
  sky: [string, string];
  water: [string, string];
  ground: [string, string];
  /** Depths in meters where the water starts to darken and where it is fully dark. */
  darkness: [number, number];
  items: number;
  /** Depth in meters past which floor items are chosen as if they lay at this depth, so a deep zone still has loot. */
  lootCap?: number;
  /** Fixed numbers of particular items laid on the sea floor wherever it is flat, whatever the depth. */
  floorLoot?: { kind: ItemKind; count: number }[];
  /** Junk on the sea floor at fixed spots; clearing all of it earns the zone's clean-up achievement. */
  trash?: number;
  creatures: CreatureSpawn[];
  /** What each shop sells is set by the stock slots in `src/data/upgrades.ts`. `gear` is the air gear sold only at this island, and `weights` means it also sells the dive weights. */
  islands: { x: number; name: string; weights?: boolean; gear?: Exclude<GearId, 'candles'>[] }[];
  wrecks: { x: number; kind: WreckKind }[];
  /** Vertical cave shafts cut into the sea floor; width in px, depth in meters. */
  shafts?: { name: string; x: number; width: number; depth: number }[];
  caves?: CaveDef[];
  /** A glowing stone resting on the sea floor at x; taking it opens the portals. */
  portalStone?: { x: number };
  /** An airless moon: black sky with a few stars, no sun, moon, clouds or day and night. */
  space?: boolean;
  /** How many times wider than the original design this zone's islands are; defaults to `ISLAND_WIDTH`. */
  islandWidth?: number;
  /** Tiny hazy islands on the horizon, purely decorative. */
  farScenery?: boolean;
  /** A frozen sea: icy mountains on the horizon, floating icebergs, and snow instead of rain. `bergs` are the iceberg positions (world x when the camera is there). */
  polar?: { /** Horizon icebergs as [camera x when centered, size]; none stand before the first one. */ bergs: [number, number][]; /** World x before which there are no floating floes either, so the zone opens on open water and snow. */ iceFrom?: number; /** A large decorative iceberg at the waterline that the ship and sub pass behind. */ giant?: { x: number; half: number }; /** An ice shelf: a rounded slab of ice from x0 to x1 that stands above the water and hangs below it. The ship stops at its west face; the sub gets past by diving under it. */ shelf?: { x0: number; x1: number; height: number }; /** The camera keeps its normal zoom on the ship until the ship reaches x `at`, where the shelf's far wall comes into view; it then eases out to `zoom` the way it does when the sub launches, and eases back if the ship sails back west. */ shipZoom?: { at: number; zoom: number }; /** Camera x where the horizon mountain range's first slope reaches the right edge of the screen; the range continues east, so it slides into view from the right. */ peaks?: number; /** Camera x range over which the underwater background ridges fade in; before it they are hidden. */ ridges?: [number, number] };
  /** Where the far islands sit (world x when the camera is there); without it they repeat across the zone. */
  farIslandsAt?: number[];
  /** World x of a tiny cruise ship on the horizon. */
  farShipAt?: number;
  kelp: number;
  /** Coral clusters on the shallow sea floor. */
  coral?: number;
  rocks: number;
  /** Skeleton pieces (skulls, rib cages, bones, whole skeletons) scattered on the sea floor. */
  bones?: number;
  /** Seagrass patches laid out the same every time over stretches of flat sea floor; each keeps at most one tire. */
  meadows?: { x0: number; x1: number; kelp: number }[];
  /** Kelp forests: `count` kelp plants spread over x0 to x1; `giant` is the share that are tall giant kelp (default 0.7). */
  forests?: { x0: number; x1: number; count: number; giant?: number }[];
  /** Rusted steel barrels lying on their sides across the sea floor. */
  barrels?: number;
  /** Extra rocks, coral and kelp placed at random between x0 and x1. */
  beds?: { x0: number; x1: number; rocks?: number; coral?: number; kelp?: number }[];
}

const smooth = (x: number, from: number, to: number) => {
  const u = Math.min(1, Math.max(0, (x - from) / (to - from)));
  return u * u * (3 - 2 * u);
};

/** Abyssal Plains is 39600 px wide: one big mountain (1500 m) with two peaks, one about 100 m down under the first island and a lower one about 180 m down between the islands, and the cave on its east side, a wide flat plain about 3800 m deep with the Titanic, then two bumpy trenches in the east (about 4400 m and 4900 m, the portal stone in the deeper). */
const ABYSSAL_FLOOR = Array.from({ length: 133 }, (_, k) => {
  const x = k * 300;
  const i = k;
  const shelf = smooth(x, 11500, 15000);
  const peak1 = 1 - smooth(Math.abs(x - 1000), 300, 1500);
  const peak2 = 1 - smooth(Math.abs(x - 2700), 300, 1500);
  const lift = Math.max(peak1 * 1400, peak2 * 1320);
  const trench1 = smooth(x, 30500, 32000) * (1 - smooth(x, 33500, 34800));
  const trench2 = smooth(x, 35400, 36800) * (1 - 0.6 * smooth(x, 38500, 39600));
  const amp = 5 + 30 * (1 - shelf) + 32 * smooth(x, 29500, 31000);
  const bumps = amp * (1 - Math.min(1, lift / 1400) * 0.8) * (0.6 * Math.sin(i * 1.9) + 0.5 * Math.sin(i * 3.1 + 1) + 0.4 * Math.sin(i * 5.3 + 2));
  const base = 1500 + 2300 * shelf - lift + trench1 * 600 + trench2 * 1100;
  return Math.round(base + bumps);
});

/** The sea floor of Frozen Expanse at x px in the zone's original 20000 px layout: 5000 m deep at the west end, rising in a bumpy slope to an average of about 2000 m in the east, with ridges and dips along the way. */
const frozenFloorAt = (x: number) => {
  const u = x / 20000;
  const i = u * 32;
  const base = 1850 + 3150 * (1 - u) ** 1.6;
  const amp = 0.08 * base + 120 + 350 * Math.exp(-(((u - 0.55) / 0.18) ** 2));
  return Math.min(5000, Math.max(1500, Math.round(base + amp * (0.7 * Math.sin(i * 1.9) + 0.5 * Math.sin(i * 0.73 + 1)))));
};

/** The zone is 29000 px wide: the ice shelf (11000 to 24500) is three times its original 4500 px, and the sea floor is the original one with that stretch spread over the longer span, so everything on either side of the shelf stays as it was. */
const FROZEN_FLOOR = Array.from({ length: 59 }, (_, k) => {
  const x = k * 500;
  return frozenFloorAt(x <= 11000 ? x : x >= 24500 ? x - 9000 : 11000 + (x - 11000) / 3);
});

/** The trench is 16500 px wide, one and a half times its original 11000: the sea floor keeps its original slope down to the first deep point (index 45), then runs flat at the bottom for 28 more steps before the original climb back up, so every sample stays 11000 / 56 px apart. */
const TRENCH_FLOOR_ORIGINAL = [230, 245, 260, 275, 290, 308, 325, 342, 360, 382, 405, 428, 450, 482, 515, 548, 580, 605, 630, 655, 680, 670, 660, 650, 640, 615, 590, 565, 540, 570, 600, 1000, 1480, 1480, 1480, 1480, 1480, 1750, 1750, 1750, 2250, 2250, 2800, 3270, 3270, 3270, 2800, 2300, 2300, 1500, 900, 560, 430, 370, 320, 270, 230];
const TRENCH_FLOOR = [...TRENCH_FLOOR_ORIGINAL.slice(0, 46), ...Array<number>(28).fill(TRENCH_FLOOR_ORIGINAL[45]), ...TRENCH_FLOOR_ORIGINAL.slice(46)];

// How the zones connect is in routes.ts.
export const ZONES: ZoneDef[] = [
  {
    name: 'Sunny Shallows',
    farScenery: true,
    farIslandsAt: [3400],
    farShipAt: 1800,
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
      { x: 650, name: 'Coral Cove' },
      { x: 6100, name: 'Gull Rock' },
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
    coral: 30,
    rocks: 50,
    meadows: [{ x0: 6700, x1: 8000, kelp: 20 }],
  },
  {
    name: 'Coral Gardens',
    farScenery: true,
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
      { kind: 'stingray', count: 2, minDepth: 10, maxDepth: 100 },
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
    coral: 70,
    rocks: 40,
  },
  {
    name: 'Kelp Canyons',
    diveZoom: 0.7,
    map: { x: 175, y: 55 },
    width: 11340,
    floor: [50, 90, 150, 185, 180, 340, 340, 230, 520, 900, 900, 900, 900, 900, 900, 900, 720, 500],
    calm: 0.35,
    sky: ['#79C6E6', '#E2F7EF'],
    water: ['#2FB3A0', '#0F2F5E'],
    ground: ['#C9B98A', '#4D5578'],
    darkness: [25, 330],
    items: 40,
    trash: 12,
    creatures: [
      { kind: 'fish', count: 10, minDepth: 5, maxDepth: 250 },
      { kind: 'jelly', count: 3, minDepth: 40, maxDepth: 350 },
      { kind: 'jelly', count: 1, group: [7, 9], minDepth: 40, maxDepth: 350 },
      { kind: 'hammerhead', count: 4, minDepth: 25, maxDepth: 320 },
      { kind: 'shark', count: 2, minDepth: 40, maxDepth: 320 },
      { kind: 'squid', count: 3, minDepth: 180, maxDepth: 420 },
      { kind: 'jelly', count: 1, group: [7, 9], minDepth: 450, maxDepth: 880 },
      { kind: 'moonjelly', count: 3, minDepth: 100, maxDepth: 600 },
      { kind: 'manta', count: 2, minDepth: 60, maxDepth: 300 },
      { kind: 'whaleshark', count: 2, minDepth: 30, maxDepth: 300 },
    ],
    islands: [
      { x: 1300, name: 'Driftwood Dock', gear: ['scrubbers'] },
      { x: 7900, name: 'Lantern Isle' },
    ],
    caves: [{
      name: 'Cargo Hollow',
      hidden: true,
      stones: 30,
      x0: 800,
      x1: 4100,
      hill: { x: 3000, half: 0, ramp: 1, height: 0 },
      passages: [
        { pts: [[3290, 322], [3100, 340], [2800, 372], [2500, 400]], r: 190 },
        { pts: [[2500, 400], [2300, 372], [2050, 340], [1800, 322]], r: 180 },
        { pts: [[2050, 292]], r: 200, loot: 1 },
        { pts: [[2050, 340], [2050, 292]], r: 95 },
        { pts: [[1950, 385]], r: 170 },
        { pts: [[2050, 340], [2000, 370], [1950, 385]], r: 95 },
        { pts: [[1700, 322]], r: 260, loot: 1 },
        { pts: [[2500, 400], [2450, 470], [2650, 540], [2900, 600]], r: 190 },
        { pts: [[2900, 600], [3200, 640], [3450, 680], [3650, 690]], r: 190 },
        { pts: [[3650, 692]], r: 300, loot: 1 },
        { pts: [[2900, 600], [2500, 640], [2200, 690], [1900, 740]], r: 190 },
        { pts: [[1850, 745]], r: 300, loot: 1 },
        { pts: [[2900, 600], [2950, 700], [2800, 790], [2850, 880]], r: 190 },
        { pts: [[2850, 890]], r: 350, loot: 2 },
        { pts: [[1900, 740], [1500, 760], [1200, 790]], r: 105 },
        { pts: [[1150, 795]], r: 240, loot: 1 },
      ],
    }],
    wrecks: [
      { x: 3600, kind: 'containers' },
      { x: 7900, kind: 'freighter' },
      { x: 2200, kind: 'sloop' },
    ],
    kelp: 140,
    forests: [
      { x0: 350, x1: 1250, count: 14 },
      { x0: 1350, x1: 2650, count: 58 },
    ],
    beds: [{ x0: 3050, x1: 4000, rocks: 16, coral: 3, kelp: 4 }],
    coral: 25,
    rocks: 60,
    barrels: 10,
  },
  {
    name: 'Midnight Trench',
    islandWidth: 1,
    diveZoom: 0.6,
    map: { x: 175, y: 150 },
    width: 16500,
    floor: TRENCH_FLOOR,
    sky: ['#F49B7A', '#FFE2B8'],
    water: ['#2A86BE', '#081233'],
    ground: ['#9F94B8', '#2A2D4D'],
    darkness: [20, 380],
    items: 68,
    trash: 18,
    creatures: [
      { kind: 'fish', count: 12, minDepth: 5, maxDepth: 200 },
      { kind: 'jelly', count: 6, minDepth: 60, maxDepth: 700 },
      { kind: 'jelly', count: 2, group: [7, 9], minDepth: 60, maxDepth: 700 },
      { kind: 'moonjelly', count: 5, minDepth: 100, maxDepth: 700 },
      { kind: 'hammerhead', count: 4, minDepth: 25, maxDepth: 350 },
      { kind: 'shark', count: 4, minDepth: 40, maxDepth: 350 },
      { kind: 'squid', count: 9, minDepth: 220, maxDepth: 700 },
      { kind: 'manta', count: 3, minDepth: 80, maxDepth: 500 },
      { kind: 'angler', count: 4, minDepth: 400, maxDepth: 700 },
      { kind: 'whaleshark', count: 2, minDepth: 30, maxDepth: 300 },
      { kind: 'bluewhale', count: 3, minDepth: 25, maxDepth: 300 },
      { kind: 'giant', count: 1, minDepth: 450, maxDepth: 700 },
    ],
    islands: [{ x: 1650, name: 'Last Light Atoll' }],
    wrecks: [
      { x: 5300, kind: 'galleon' },
    ],
    kelp: 40,
    coral: 10,
    rocks: 120,
    rugged: 1,
    vents: [{ x0: 8450, x1: 8850, count: 4 }, { x0: 7900, x1: 8010, count: 1 }, { x0: 9270, x1: 9390, count: 2 }, { x0: 10000, x1: 11200, count: 3 }, { x0: 11800, x1: 13000, count: 3 }, { x0: 13200, x1: 14200, count: 2 }],
    caves: [{
      name: 'Trench Hollows',
      stones: 220,
      fixed: true,
      x0: 0,
      x1: 6700,
      hill: { x: 6450, half: 0, ramp: 1, height: 0 },
      passages: [
        { pts: [[6450, 1462.4], [6000, 1462.4]], r: 190, flat: true },
        { pts: [[6000, 1462.4], [5500, 1454.4], [5000, 1468.4], [4500, 1453.4], [4000, 1469.4], [3500, 1456.4], [3000, 1467.4], [2700, 1460.4]], r: 190 },
        { pts: [[5500, 1454.4], [4700, 1362.4], [4100, 1362.4]], r: 190 },
        { pts: [[4100, 1362.4], [3700, 1362.4]], r: 190 },
        { pts: [[4100, 1362.4], [3500, 1297.4], [3200, 1297.4]], r: 190 },
        { pts: [[5000, 1468.4], [4200, 1562.4], [3500, 1562.4]], r: 190 },
        { pts: [[1900, 1462.4]], r: 900, hole: 300, loot: 1, kinds: ['diamond'] },
        { pts: [[1350, 1402.4], [800, 1342.4], [550, 1342.4]], r: 190 },
        { pts: [[1050, 1482.4], [700, 1482.4]], r: 190 },
        { pts: [[3500, 1362.4]], r: 250, loot: 1, kinds: ['pearl'] },
        { pts: [[3000, 1297.4]], r: 250, loot: 1 },
        { pts: [[3300, 1562.4]], r: 280, loot: 1, kinds: ['giantpearl'] },
        { pts: [[350, 1342.4]], r: 250, loot: 1 },
        { pts: [[450, 1482.4]], r: 260, loot: 1 },
        { pts: [[5200, 1462.4], [5100, 1462.4]], r: 190, flat: true, loot: 1, kinds: ['pearl'] },
        { pts: [[4750, 1458.4], [4650, 1458.4]], r: 190, flat: true, loot: 1, kinds: ['coin'] },
        { pts: [[4250, 1462.4], [4150, 1462.4]], r: 190, flat: true, loot: 1, kinds: ['pearl'] },
        { pts: [[3750, 1464.4], [3650, 1464.4]], r: 190, flat: true, loot: 1, kinds: ['gem'] },
        { pts: [[3250, 1459.4], [3150, 1459.4]], r: 190, flat: true, loot: 1 },
        { pts: [[2950, 1462.4], [2850, 1462.4]], r: 190, flat: true, loot: 1 },
      ],
    }],
  },
  {
    name: 'Abyssal Plains',
    islandWidth: 1,
    diveZoom: 0.5,
    map: { x: 255, y: 110 },
    width: 39600,
    floor: ABYSSAL_FLOOR,
    sky: ['#9FB8E6', '#E6EEFF'],
    water: ['#3E8FD0', '#0A1E4A'],
    ground: ['#B7C6E0', '#3A4468'],
    darkness: [20, 360],
    items: 5,
    lootCap: 890,
    creatures: [
      { kind: 'fish', count: 9, minDepth: 20, maxDepth: 400 },
      { kind: 'jelly', count: 8, minDepth: 300, maxDepth: 1300 },
      { kind: 'jelly', count: 3, group: [7, 9], minDepth: 300, maxDepth: 1300 },
      { kind: 'moonjelly', count: 9, minDepth: 300, maxDepth: 1300 },
      { kind: 'squid', count: 5, minDepth: 500, maxDepth: 1300 },
      { kind: 'angler', count: 12, minDepth: 1000, maxDepth: 3700 },
      { kind: 'whale', count: 3, minDepth: 400, maxDepth: 1100 },
      { kind: 'mobydick', count: 1, minDepth: 400, maxDepth: 1100 },
      { kind: 'shark', count: 3, minDepth: 40, maxDepth: 400 },
      { kind: 'orca', count: 5, minDepth: 60, maxDepth: 450 },
      { kind: 'orcacalf', count: 3, minDepth: 60, maxDepth: 450 },
      { kind: 'manta', count: 3, minDepth: 100, maxDepth: 800 },
      { kind: 'bluewhale', count: 3, minDepth: 25, maxDepth: 300 },
      { kind: 'colossal', count: 3, minDepth: 1000, maxDepth: 1450 },
      { kind: 'bigfin', count: 3, minDepth: 1050, maxDepth: 1300 },
    ],
    islands: [
      { x: 850, name: 'Palm Atoll', gear: ['electrolysis'] },
      { x: 4500, name: 'Trench Pier', weights: true },
    ],
    wrecks: [{ x: 20000, kind: 'titanic' }],
    portalStone: { x: 37700 },
    caves: [{
      name: 'Trench Pocket',
      stones: 6,
      x0: 10450,
      x1: 13850,
      hill: { x: 13700, half: 0, ramp: 1, height: 0 },
      passages: [
        { pts: [[13700, 3100], [13250, 3095], [12750, 3105], [12250, 3095], [11750, 3105], [11250, 3100]], r: 190 },
        { pts: [[11250, 3102]], r: 330, loot: 1, kinds: ['pearl'] },
        { pts: [[12250, 3095], [12250, 3150], [12050, 3190], [12050, 3240]], r: 190 },
        { pts: [[12050, 3245]], r: 270, loot: 1, kinds: ['giantpearl'] },
        { pts: [[11250, 3100], [11150, 3150], [10950, 3180]], r: 190 },
        { pts: [[10950, 3185]], r: 260, loot: 1, kinds: ['gem'] },
        { pts: [[12750, 3105], [12750, 3060], [12600, 3020], [12600, 2990]], r: 190 },
        { pts: [[12600, 2985]], r: 250 },
      ],
    }],
    kelp: 0,
    rocks: 270,
    rugged: 1,
  },
  {
    name: 'Frozen Expanse',
    islandWidth: 1,
    diveZoom: 0.6,
    map: { x: 330, y: 165 },
    width: 29000,
    floor: FROZEN_FLOOR,
    sky: ['#9FD6F2', '#EAF8FF'],
    water: ['#6FDCEC', '#0C3F86'],
    ground: ['#DCEFF9', '#3E5A8C'],
    darkness: [25, 420],
    polar: { bergs: [[6000, 0.35], [7100, 0.5], [8000, 0.7], [26800, 1], [28000, 1.1]], iceFrom: 5700, giant: { x: 9000, half: 340 }, shelf: { x0: 11000, x1: 24500, height: 624 }, shipZoom: { at: 10350, zoom: 0.5 }, peaks: 26200, ridges: [10000, 14000] },
    items: 85,
    floorLoot: [
      { kind: 'anchor', count: 4 },
      { kind: 'wheel', count: 3 },
      { kind: 'goldbar', count: 5 },
      { kind: 'chest', count: 3 },
      { kind: 'gem', count: 5 },
      { kind: 'diamond', count: 2 },
    ],
    creatures: [
      { kind: 'orca', count: 4, minDepth: 90, maxDepth: 400 },
      { kind: 'orcacalf', count: 2, minDepth: 90, maxDepth: 400 },
      { kind: 'bluewhale', count: 2, minDepth: 25, maxDepth: 300 },
    ],
    islands: [],
    wrecks: [{ x: 3400, kind: 'galleon' }],
    kelp: 0,
    rocks: 170,
  },
  {
    name: 'Crimson Sea',
    secret: true,
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
      abyss: { from: 560, to: 1500, zoom: 0.5, lair: [5150, 2400], relic: [3550, 1860], bones: 160 },
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
        { pts: [[4500, 1485], [4500, 1570], [4350, 1680], [4330, 1830], [4800, 1740], [5300, 1700], [5800, 1820], [6100, 2060], [6250, 2300], [6300, 2400]], r: 190 },
        { pts: [[4350, 1680], [3950, 1750], [3600, 1830]], r: 190 },
        { pts: [[3550, 1860]], r: 260 },
        { pts: [[2600, 2400], [3400, 2405], [4300, 2400], [5200, 2400], [5800, 2405], [6300, 2400], [6900, 2405], [7600, 2400]], r: 190 },
        { pts: [[2500, 2400]], r: 330 },
        { pts: [[5100, 2400]], r: 380 },
        { pts: [[7700, 2400]], r: 330 },
        { pts: [[7700, 2400], [7800, 2150], [7850, 1800], [7800, 1485]], r: 190 },
      ],
    }],
    creatures: [],
    islands: [],
    wrecks: [],
    kelp: 0,
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
    rocks: 0,
  },
];

/** Zone indexes in the order the test panel steps through them: the catalog first, then the real zones. */
export const ZONE_ORDER = ZONES.map((_, i) => i).sort((a, b) => Number(!!ZONES[b].catalog) - Number(!!ZONES[a].catalog));

/** The number shown for a zone: the catalog is zone 0 and the rest count from 1. */
export const zoneNumber = (i: number) => (ZONES[i].catalog ? 0 : i + 1);
