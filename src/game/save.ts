import { SAVE_KEY } from '../config';
import { UPGRADES, UPGRADE_ORDER, type Loadout, type UpgradeId } from '../data/upgrades';
import { SKINS, type SkinId } from '../data/skins';
import { ITEM_KINDS, type ItemKind } from '../data/items';
import { ZONES } from '../data/zones';
import { PORTALS } from '../data/routes';
import { START_DAY } from '../render/daylight';

export type SwitchMode = 'off' | 'on' | 'auto';

export interface SaveData {
  v: 1;
  money: number;
  upgrades: Loadout;
  /** Which stock slots of each upgrade's shops have been used up. */
  stock: Record<UpgradeId, number[]>;
  /** The submarine's look. */
  skin: SkinId;
  /** Skins the player has earned and can pick in settings. */
  skins: SkinId[];
  zone: number;
  shipX: number;
  day: number;
  /** Total game days played, which the weather follows. */
  days: number;
  cargo: Partial<Record<ItemKind, number>>;
  /** Whether the one-time dive weights have been bought. */
  weights: boolean;
  /** The spotlight and sonar switches: auto turns each on once the water is dark enough. */
  lamp: SwitchMode;
  sonar: SwitchMode;
  candles: number;
  scrubbers: boolean;
  electrolysis: boolean;
  /** Explored map cells per zone index, as base64 bitsets. */
  explored: Record<number, string>;
  /** Trash spots already collected per zone index. */
  trash: Record<number, number[]>;
  /** Cave loot slots already taken per zone index; caves never restock. */
  caveLoot: Record<number, number[]>;
  /** Whether the portal stone has been taken, opening the portals between Moana Deep and Crimson Sea. */
  portal: boolean;
  /** Whether the Crimson Sea monster has started chasing, which brings back that zone's portal. */
  monsterWoke: boolean;
  /** Zones the player has sailed or portaled into. */
  visited: number[];
  /** Earned achievement ids, such as 'trash-0'. */
  achievements: string[];
  stats: { dives: number; earned: number; deepest: number; deaths: number };
}

export function newSave(): SaveData {
  return {
    v: 1,
    money: 0,
    upgrades: { plating: 0, oxygen: 0, battery: 0, hull: 0, light: 0, sonar: 0, propeller: 0, cargo: 0 },
    stock: { plating: [], oxygen: [], battery: [], hull: [], light: [], sonar: [], propeller: [], cargo: [] },
    skin: 'standard',
    skins: ['standard'],
    zone: 0,
    shipX: 900,
    day: START_DAY,
    days: START_DAY,
    cargo: {},
    weights: false,
    lamp: 'auto',
    sonar: 'auto',
    candles: 0,
    scrubbers: false,
    electrolysis: false,
    explored: {},
    trash: {},
    caveLoot: {},
    portal: false,
    visited: [0],
    monsterWoke: false,
    achievements: [],
    stats: { dives: 0, earned: 0, deepest: 0, deaths: 0 },
  };
}

const num = (v: unknown, lo: number, hi: number, fallback: number) =>
  typeof v === 'number' && Number.isFinite(v) ? Math.min(hi, Math.max(lo, v)) : fallback;

/** Rebuilds a save from untrusted JSON, keeping only known fields within valid ranges. */
export function sanitize(raw: any): SaveData | null {
  if (!raw || typeof raw !== 'object' || raw.v !== 1) return null;
  const s = newSave();
  s.money = Math.floor(num(raw.money, 0, 1e9, 0));
  for (const id of UPGRADE_ORDER) {
    s.upgrades[id] = Math.floor(num(raw.upgrades?.[id], 0, UPGRADES[id].levels.length - 1, 0));
  }
  for (const id of UPGRADE_ORDER) {
    const slots = UPGRADES[id].stock.length;
    const used = raw.stock?.[id];
    s.stock[id] = Array.isArray(used)
      ? [...new Set<number>(used.map((n: unknown) => Math.floor(num(n, -1, slots, -1))).filter((n: number) => n >= 0 && n < slots))]
      : Array.from({ length: Math.min(s.upgrades[id], slots) }, (_, i) => i);
  }
  if (typeof raw.skin === 'string' && raw.skin in SKINS) s.skin = raw.skin as SkinId;
  if (Array.isArray(raw.skins)) s.skins = [...new Set<SkinId>(['standard', ...raw.skins.filter((k: unknown): k is SkinId => typeof k === 'string' && k in SKINS)])];
  if (!s.skins.includes(s.skin)) s.skins.push(s.skin);
  s.zone = Math.floor(num(raw.zone, 0, ZONES.length - 1, 0));
  s.shipX = num(raw.shipX, 0, ZONES[s.zone].width, s.shipX);
  s.day = num(raw.day, 0, 1, START_DAY) % 1;
  s.days = num(raw.days, 0, 1e6, s.day);
  for (const k of ITEM_KINDS) {
    const c = Math.floor(num(raw.cargo?.[k], 0, 9999, 0));
    if (c) s.cargo[k] = c;
  }
  s.weights = raw.weights === true;
  if (raw.lamp === 'off' || raw.lamp === 'on') s.lamp = raw.lamp;
  if (raw.sonar === 'off' || raw.sonar === 'on') s.sonar = raw.sonar;
  s.candles = Math.floor(num(raw.candles, 0, 3, 0));
  s.scrubbers = raw.scrubbers === true;
  s.electrolysis = raw.electrolysis === true;
  for (let z = 0; z < ZONES.length; z++) {
    const e = raw.explored?.[z];
    if (typeof e === 'string' && e.length < 40000 && /^[A-Za-z0-9+/=]*$/.test(e)) s.explored[z] = e;
  }
  for (let z = 0; z < ZONES.length; z++) {
    const t = raw.trash?.[z];
    if (Array.isArray(t)) s.trash[z] = [...new Set(t.map((n: unknown) => Math.floor(num(n, 0, 99, -1))).filter((n: number) => n >= 0))].slice(0, 100);
  }
  for (let z = 0; z < ZONES.length; z++) {
    const t = raw.caveLoot?.[z];
    if (Array.isArray(t)) s.caveLoot[z] = [...new Set(t.map((n: unknown) => Math.floor(num(n, 0, 99, -1))).filter((n: number) => n >= 0))].slice(0, 100);
  }
  s.portal = raw.portal === true;
  if (Array.isArray(raw.visited)) s.visited = [...new Set<number>([0, ...raw.visited.map((n: unknown) => Math.floor(num(n, 0, ZONES.length - 1, 0)))])];
  if (!s.visited.includes(s.zone)) s.visited.push(s.zone);
  s.monsterWoke = raw.monsterWoke === true || (!Array.isArray(raw.visited) && PORTALS.some((p) => p.chase && p.zone === s.zone));
  if (Array.isArray(raw.achievements)) {
    s.achievements = raw.achievements.filter((a: unknown) => typeof a === 'string' && /^trash-\d+$/.test(a) && Number(a.slice(6)) < ZONES.length);
  }
  s.stats.dives = Math.floor(num(raw.stats?.dives, 0, 1e9, 0));
  s.stats.earned = Math.floor(num(raw.stats?.earned, 0, 1e12, 0));
  s.stats.deepest = Math.floor(num(raw.stats?.deepest, 0, 1e5, 0));
  s.stats.deaths = Math.floor(num(raw.stats?.deaths, 0, 1e6, 0));
  return s;
}

export function loadSave(): SaveData | null {
  try {
    const text = localStorage.getItem(SAVE_KEY);
    return text ? sanitize(JSON.parse(text)) : null;
  } catch {
    return null;
  }
}

export function writeSave(s: SaveData): boolean {
  try {
    localStorage.setItem(SAVE_KEY, JSON.stringify(s));
    return true;
  } catch {
    return false;
  }
}

const CODE_PREFIX = 'SUBMERGE1-';

export function exportCode(s: SaveData): string {
  const bytes = new TextEncoder().encode(JSON.stringify(s));
  let bin = '';
  bytes.forEach((b) => (bin += String.fromCharCode(b)));
  return CODE_PREFIX + btoa(bin);
}

export function importCode(code: string): SaveData | null {
  try {
    const c = code.trim();
    if (!c.startsWith(CODE_PREFIX)) return null;
    const bin = atob(c.slice(CODE_PREFIX.length));
    const bytes = Uint8Array.from(bin, (ch) => ch.charCodeAt(0));
    return sanitize(JSON.parse(new TextDecoder().decode(bytes)));
  } catch {
    return null;
  }
}
