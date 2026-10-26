export type CreatureKind = 'fish' | 'jelly' | 'shark' | 'hammerhead' | 'squid' | 'angler' | 'whale' | 'stingray' | 'manta' | 'colossal';

export interface CreatureDef {
  name: string;
  radius: number;
  harmful: boolean;
  /** For long bodies: circles along the body (offset in px toward the head, radius) used for collisions. */
  body?: [number, number][];
}

/** How much bigger the sperm whale is drawn and collides than its base 480 px design. */
export const WHALE_SCALE = 1.5;

/** How much bigger the colossal squid is drawn than the giant squid. */
export const COLOSSAL_SCALE = 2.6;

export const CREATURES: Record<CreatureKind, CreatureDef> = {
  fish: { name: 'Fish', radius: 10, harmful: false },
  jelly: { name: 'Jellyfish', radius: 16, harmful: false },
  shark: { name: 'Great White Shark', radius: 30, harmful: true },
  hammerhead: { name: 'Hammerhead Shark', radius: 32, harmful: true },
  squid: { name: 'Giant Squid', radius: 32, harmful: true },
  angler: { name: 'Anglerfish', radius: 21, harmful: true },
  stingray: { name: 'Stingray', radius: 26, harmful: false },
  manta: { name: 'Manta Ray', radius: 62, harmful: false },
  colossal: { name: 'Colossal Squid', radius: 100, harmful: true },
  whale: {
    name: 'Sperm Whale',
    radius: 130 * WHALE_SCALE,
    harmful: true,
    body: ([[150, 92], [40, 92], [-70, 80], [-170, 48]] as [number, number][]).map(([dx, r]): [number, number] => [dx * WHALE_SCALE, r * WHALE_SCALE]),
  },
};
