import { CREATURES, CREATURE_EXTENT, JELLY_SCALE, TURTLE_SCALES, type CreatureKind } from './creatures';
import { ITEMS, ITEM_KINDS, type ItemKind } from './items';
import type { BoneKind } from '../art/bones';
import { DEPTH_ZONES, zoneIndexAt } from './depthZones';

type DecoKind = 'kelp' | 'giantkelp' | 'coral' | 'rock' | 'starfish' | 'plank' | 'lungsub' | 'gem' | 'vent' | BoneKind;

export interface CatalogTerrain {
  x: number;
  label: string;
  deco?: { kind: DecoKind; size: number; tint: number };
  item?: ItemKind;
  /** A portal standing on the water's surface above this spot. */
  portal?: boolean;
}

export interface CatalogCreature {
  kind: CreatureKind;
  x: number;
  y: number;
  /** Where the name tag floats, above the animal. */
  tagY: number;
  tint: number;
  label: string;
}

/** Meters of depth the animals of each kind are found at in the zones (the giant squid has no zone yet, so it shares the colossal squid's range). */
const KIND_DEPTH: Record<CreatureKind, [number, number]> = {
  fish: [5, 400],
  jelly: [25, 1300],
  turtle: [5, 150],
  shark: [40, 350],
  hammerhead: [20, 350],
  angler: [1000, 2500],
  stingray: [10, 80],
  manta: [60, 800],
  squid: [180, 1300],
  colossal: [1000, 1450],
  giant: [1000, 1450],
  bigfin: [1050, 1300],
  whale: [400, 1100],
  mobydick: [400, 1100],
  bluewhale: [25, 160],
  leviathan: [250, 400],
};
/** The narrowest a column is laid out, so the sub fits beside the animals. */
const MIN_COLUMN_EXTENT = 100;
const SHALLOW_M = 35;
const DEEP_M = 200;
const TERRAIN_START = 1200;
const TERRAIN_GAP = 200;
const RAMP = 700;
/** Depth in px of the first animal in each species column, and the gap between stacked variants. */
const COLUMN_TOP = 500;
const ROW_GAP = 220;

const BONES: BoneKind[] = ['skull', 'jaw', 'fish', 'ribs', 'spine', 'bone', 'skeleton'];
const WRECKS = [
  { kind: 'sloop', gap: 900 },
  { kind: 'galleon', gap: 1300 },
  { kind: 'containers', gap: 1000 },
  { kind: 'freighter', gap: 3200 },
] as const;
/** One column per species group, left to right; the kinds in a column stack top to bottom. */
const CREATURE_COLUMNS: CreatureKind[][] = [
  ['fish'], ['jelly'], ['turtle'], ['shark'], ['hammerhead'], ['angler'], ['stingray'], ['manta'],
  ['squid'], ['colossal'], ['giant'], ['bigfin'],
  ['whale', 'mobydick'], ['bluewhale'], ['leviathan'],
];
/** Half the sideways width a kind actually covers, where that differs from how far it is drawn (upright squid and jellyfish are narrow, a fish school is wide), so every column gets the same gap. */
const COLUMN_EXTENT: Partial<Record<CreatureKind, number>> = { fish: 110, jelly: 45 * JELLY_SCALE, turtle: 55 * TURTLE_SCALES[TURTLE_SCALES.length - 1], stingray: 110, manta: 130, angler: 55, squid: 26, colossal: 60, giant: 50, bigfin: 35 };
/** Kinds shown once instead of in three tints. */
const SINGLE_VARIANT: CreatureKind[] = ['colossal', 'giant'];
/** How far above the highest name tag the column headings sit. */
const HEADER_ABOVE = -34;
/** Space between the edges of neighboring columns. */
const COLUMN_GAP = 180;
/** How far above a tall kind its name tag floats. */
const TAG_ABOVE: Partial<Record<CreatureKind, number>> = { colossal: 138, giant: 110, bigfin: 55, mobydick: 160 };
/** Extra space above a kind stacked under another in its column. */
const ROW_EXTRA: Partial<Record<CreatureKind, number>> = { mobydick: 60 };

function build() {
  const terrain: CatalogTerrain[] = [];
  let x = TERRAIN_START;
  const add = (t: Omit<CatalogTerrain, 'x'>) => {
    terrain.push({ ...t, x });
    x += TERRAIN_GAP;
  };
  ([[0.7, 0.2, 'small'], [1.1, 0.8, 'medium'], [1.5, 0.2, 'large']] as const).forEach(([size, tint, name]) => add({ label: `Rock (${name})`, deco: { kind: 'rock', size, tint } }));
  ([[0.8, 'short'], [1.1, 'medium'], [1.5, 'tall']] as const).forEach(([size, name]) => add({ label: `Kelp stalk (${name})`, deco: { kind: 'kelp', size, tint: 0.2 } }));
  ([[1.1, 'bunch'], [1.5, 'tall bunch']] as const).forEach(([size, name]) => add({ label: `Kelp ${name}`, deco: { kind: 'kelp', size, tint: 0.5 } }));
  add({ label: 'Kelp ribbon', deco: { kind: 'kelp', size: 1.2, tint: 0.85 } });
  ([[0.7, 'medium'], [1.3, 'tall']] as const).forEach(([size, name]) => add({ label: `Giant kelp (${name})`, deco: { kind: 'giantkelp', size, tint: 0.4 } }));
  [0.1, 0.35, 0.6, 0.85].forEach((tint, i) => add({ label: `Coral ${i + 1}`, deco: { kind: 'coral', size: 1.2, tint } }));
  [0.1, 0.5, 0.9].forEach((tint, i) => add({ label: `Starfish ${i + 1}`, deco: { kind: 'starfish', size: 1, tint } }));
  [0.2, 0.8].forEach((tint, i) => add({ label: `Wood plank ${i + 1}`, deco: { kind: 'plank', size: 1.2, tint } }));
  ([[0.9, 0.2, 'single'], [1.2, 0.8, 'double']] as const).forEach(([size, tint, name]) => add({ label: `Hydrothermal vent (${name})`, deco: { kind: 'vent', size, tint } }));
  for (const kind of BONES) add({ label: `Bones: ${kind}`, deco: { kind, size: 1, tint: 0.5 } });
  add({ label: 'Lost submarine', deco: { kind: 'lungsub', size: 1, tint: 0.5 } });
  add({ label: 'Ruby gem', deco: { kind: 'gem', size: 1, tint: 0.5 } });
  add({ label: 'Portal (on the surface)', portal: true });
  for (const item of [...ITEM_KINDS].sort((a, b) => ITEMS[a].value - ITEMS[b].value)) add({ label: ITEMS[item].name, item });

  const wrecks: { x: number; kind: (typeof WRECKS)[number]['kind'] }[] = [];
  x += 400;
  for (const w of WRECKS) {
    wrecks.push({ x, kind: w.kind });
    terrain.push({ x: x + (w.kind === 'freighter' ? 1400 : 0), label: `Wreck: ${w.kind}` });
    x += w.gap;
  }

  const rampFrom = x;
  const creatures: CatalogCreature[] = [];
  const columns: { x: number; label: string; zones: string }[] = [];
  let cursor = rampFrom + RAMP + 500;
  for (const column of CREATURE_COLUMNS) {
    const extent = Math.max(MIN_COLUMN_EXTENT, ...column.map((k) => COLUMN_EXTENT[k] ?? CREATURE_EXTENT[k]));
    const label = column.map((k) => CREATURES[k].name).join(' & ');
    const shallow = Math.min(...column.map((k) => KIND_DEPTH[k][0]));
    const deep = Math.max(...column.map((k) => KIND_DEPTH[k][1]));
    const first = DEPTH_ZONES[zoneIndexAt(shallow)].name.replace(' Zone', '');
    const last = DEPTH_ZONES[zoneIndexAt(deep)].name.replace(' Zone', '');
    columns.push({ x: cursor + extent, label, zones: `${first === last ? first : `${first} – ${last}`} Zone` });
    let y = COLUMN_TOP;
    for (const kind of column) {
      if (y > COLUMN_TOP) y += ROW_EXTRA[kind] ?? 0;
      const tints = (CREATURE_EXTENT[kind] <= 200 || kind === 'shark') && !SINGLE_VARIANT.includes(kind) ? [0.15, 0.5, 0.85] : [0.5];
      tints.forEach((tint, row) => {
        creatures.push({
          kind,
          x: cursor + extent,
          y,
          tagY: y - (TAG_ABOVE[kind] ?? Math.max(CREATURES[kind].radius, 50) + 50),
          tint,
          label: tints.length > 1 ? `${CREATURES[kind].name} ${row + 1}` : CREATURES[kind].name,
        });
        y += ROW_GAP;
      });
    }
    cursor += extent * 2 + COLUMN_GAP;
  }
  const width = Math.ceil((cursor + 1200) / 100) * 100;

  const smooth = (v: number) => v * v * (3 - 2 * v);
  const floor = Array.from({ length: width / 100 + 1 }, (_, i) => {
    const u = Math.min(1, Math.max(0, (i * 100 - rampFrom) / RAMP));
    return SHALLOW_M + (DEEP_M - SHALLOW_M) * smooth(u);
  });
  const headerY = Math.min(...creatures.map((c) => c.tagY)) - HEADER_ABOVE;
  return { width, floor, wrecks, terrain, creatures, columns, headerY };
}

/** The test zone's layout: terrain, wrecks and items on a shallow floor beside the ship, then every animal hanging in open water. */
export const CATALOG = build();
