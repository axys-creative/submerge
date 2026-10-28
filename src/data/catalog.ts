import { CREATURES, CREATURE_EXTENT, type CreatureKind } from './creatures';
import { ITEMS, ITEM_KINDS, type ItemKind } from './items';
import type { BoneKind } from '../art/bones';

type DecoKind = 'kelp' | 'coral' | 'rock' | 'starfish' | 'plank' | 'lungsub' | BoneKind;

export interface CatalogTerrain {
  x: number;
  label: string;
  deco?: { kind: DecoKind; size: number; tint: number };
  item?: ItemKind;
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
  ['fish'], ['jelly'], ['turtle'], ['stingray'], ['manta'], ['angler'],
  ['squid'], ['colossal'], ['bigfin'],
  ['shark'], ['hammerhead'], ['whale'], ['bluewhale'], ['leviathan'],
];
/** Half the sideways width a kind actually covers, where that differs from how far it is drawn (upright squid and jellyfish are narrow, a fish school is wide), so every column gets the same gap. */
const COLUMN_EXTENT: Partial<Record<CreatureKind, number>> = { fish: 110, jelly: 45, turtle: 55, stingray: 110, manta: 130, angler: 55, squid: 45, colossal: 110, bigfin: 70 };
/** Space between the edges of neighboring columns. */
const COLUMN_GAP = 180;
/** How far above a tall kind its name tag floats. */
const TAG_ABOVE: Partial<Record<CreatureKind, number>> = { colossal: 240, bigfin: 110 };

function build() {
  const terrain: CatalogTerrain[] = [];
  let x = TERRAIN_START;
  const add = (t: Omit<CatalogTerrain, 'x'>) => {
    terrain.push({ ...t, x });
    x += TERRAIN_GAP;
  };
  ([[0.7, 0.2, 'small'], [1.1, 0.8, 'medium'], [1.5, 0.2, 'large']] as const).forEach(([size, tint, name]) => add({ label: `Rock (${name})`, deco: { kind: 'rock', size, tint } }));
  ([[0.8, 'short'], [1.1, 'medium'], [1.5, 'tall']] as const).forEach(([size, name]) => add({ label: `Kelp (${name})`, deco: { kind: 'kelp', size, tint: 0.5 } }));
  [0.1, 0.3, 0.5, 0.7, 0.9].forEach((tint, i) => add({ label: `Coral ${i + 1}`, deco: { kind: 'coral', size: 1.2, tint } }));
  [0.1, 0.5, 0.9].forEach((tint, i) => add({ label: `Starfish ${i + 1}`, deco: { kind: 'starfish', size: 1, tint } }));
  [0.2, 0.8].forEach((tint, i) => add({ label: `Wood plank ${i + 1}`, deco: { kind: 'plank', size: 1.2, tint } }));
  for (const kind of BONES) add({ label: `Bones: ${kind}`, deco: { kind, size: 1, tint: 0.5 } });
  add({ label: 'Lost submarine', deco: { kind: 'lungsub', size: 1, tint: 0.5 } });
  for (const item of ITEM_KINDS) add({ label: ITEMS[item].name, item });

  const wrecks: { x: number; kind: (typeof WRECKS)[number]['kind'] }[] = [];
  x += 400;
  for (const w of WRECKS) {
    wrecks.push({ x, kind: w.kind });
    terrain.push({ x: x + (w.kind === 'freighter' ? 1400 : 0), label: `Wreck: ${w.kind}` });
    x += w.gap;
  }

  const rampFrom = x;
  const creatures: CatalogCreature[] = [];
  let cursor = rampFrom + RAMP + 500;
  for (const column of CREATURE_COLUMNS) {
    const extent = Math.max(...column.map((k) => COLUMN_EXTENT[k] ?? CREATURE_EXTENT[k]));
    let y = COLUMN_TOP;
    for (const kind of column) {
      const tints = CREATURE_EXTENT[kind] <= 200 ? [0.15, 0.5, 0.85] : [0.5];
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
  return { width, floor, wrecks, terrain, creatures };
}

/** The test zone's layout: terrain, wrecks and items on a shallow floor beside the ship, then every animal hanging in open water. */
export const CATALOG = build();
