import { SAVE_KEY } from '../config';
import { UPGRADES, UPGRADE_ORDER, type Loadout } from '../data/upgrades';
import { ITEM_KINDS, type ItemKind } from '../data/items';
import { ZONES } from '../data/zones';
import { START_DAY } from '../render/daylight';

export type SwitchMode = 'off' | 'on' | 'auto';

export interface SaveData {
  v: 1;
  money: number;
  upgrades: Loadout;
  zone: number;
  shipX: number;
  day: number;
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
  stats: { dives: number; earned: number; deepest: number };
}

export function newSave(): SaveData {
  return {
    v: 1,
    money: 0,
    upgrades: { plating: 0, oxygen: 0, battery: 0, hull: 0, light: 0, sonar: 0, propeller: 0 },
    zone: 0,
    shipX: 900,
    day: START_DAY,
    cargo: {},
    weights: false,
    lamp: 'auto',
    sonar: 'auto',
    candles: 0,
    scrubbers: false,
    electrolysis: false,
    explored: {},
    stats: { dives: 0, earned: 0, deepest: 0 },
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
  s.zone = Math.floor(num(raw.zone, 0, ZONES.length - 1, 0));
  s.shipX = num(raw.shipX, 0, ZONES[s.zone].width, s.shipX);
  s.day = num(raw.day, 0, 1, START_DAY) % 1;
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
  s.stats.dives = Math.floor(num(raw.stats?.dives, 0, 1e9, 0));
  s.stats.earned = Math.floor(num(raw.stats?.earned, 0, 1e12, 0));
  s.stats.deepest = Math.floor(num(raw.stats?.deepest, 0, 1e5, 0));
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
