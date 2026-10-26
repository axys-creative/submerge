import { MONSTER_SCALE } from '../config';

export type CreatureKind = 'fish' | 'jelly' | 'shark' | 'hammerhead' | 'squid' | 'angler' | 'whale' | 'stingray' | 'manta' | 'colossal' | 'turtle' | 'bluewhale' | 'bigfin' | 'leviathan';

export interface CreatureDef {
  name: string;
  radius: number;
  harmful: boolean;
  /** For long bodies: circles along the body (offset in px toward the head, radius) used for collisions. */
  body?: [number, number][];
}

/** How much bigger the sperm whale is drawn and collides than its base 480 px design. */
export const WHALE_SCALE = 1.5;

/** How much bigger the blue whale is drawn than its base 640 px design: about 32 m against a 6 m great white. */
export const BLUE_WHALE_SCALE = 1.3;

/** How much bigger the colossal squid is drawn than the giant squid. */
export const COLOSSAL_SCALE = 2.6;

/** Kinds drawn behind the sea floor and scenery, so the sub passes in front of them. */
export const BACKGROUND_KINDS: CreatureKind[] = ['bluewhale'];

export const CREATURES: Record<CreatureKind, CreatureDef> = {
  fish: { name: 'Fish', radius: 10, harmful: false },
  jelly: { name: 'Jellyfish', radius: 16, harmful: false },
  shark: { name: 'Great White Shark', radius: 30, harmful: true },
  hammerhead: { name: 'Hammerhead Shark', radius: 32, harmful: true },
  squid: { name: 'Giant Squid', radius: 32, harmful: true },
  angler: { name: 'Anglerfish', radius: 21, harmful: true },
  stingray: { name: 'Stingray', radius: 26, harmful: false },
  manta: { name: 'Manta Ray', radius: 62, harmful: false },
  turtle: { name: 'Sea Turtle', radius: 26, harmful: false },
  bluewhale: { name: 'Blue Whale', radius: 110, harmful: false },
  bigfin: { name: 'Bigfin Squid', radius: 26, harmful: false },
  leviathan: { name: 'Leviathan', radius: 95 * MONSTER_SCALE, harmful: true },
  colossal: { name: 'Colossal Squid', radius: 100, harmful: true },
  whale: {
    name: 'Sperm Whale',
    radius: 130 * WHALE_SCALE,
    harmful: true,
    body: ([[150, 92], [40, 92], [-70, 80], [-170, 48]] as [number, number][]).map(([dx, r]): [number, number] => [dx * WHALE_SCALE, r * WHALE_SCALE]),
  },
};

/** How far from its center each kind is drawn, in world px: sizes sonar outlines and keeps big animals from popping in or out at the screen edge. */
export const CREATURE_EXTENT: Record<CreatureKind, number> = {
  fish: 36,
  jelly: 70,
  shark: 110,
  hammerhead: 110,
  squid: 140,
  angler: 80,
  whale: 270 * WHALE_SCALE,
  stingray: 130,
  manta: 170,
  turtle: 70,
  bluewhale: 360 * BLUE_WHALE_SCALE,
  bigfin: 1000,
  leviathan: 2700,
  colossal: 360,
};

/** How far a sperm whale pitches nose-up or nose-down, in radians. */
const WHALE_PITCH_MAX = 0.55;

/** The tilt of a sperm whale from how it is moving; the drawing and the collision body both follow it. */
export const whalePitch = (c: { vx: number; vy: number }) =>
  Math.max(-WHALE_PITCH_MAX, Math.min(WHALE_PITCH_MAX, Math.atan2(c.vy, Math.max(Math.abs(c.vx), 30))));
