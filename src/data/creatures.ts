export type CreatureKind = 'fish' | 'jelly' | 'shark' | 'hammerhead' | 'squid' | 'angler';

export interface CreatureDef {
  name: string;
  radius: number;
  harmful: boolean;
}

export const CREATURES: Record<CreatureKind, CreatureDef> = {
  fish: { name: 'Fish', radius: 10, harmful: false },
  jelly: { name: 'Jellyfish', radius: 16, harmful: false },
  shark: { name: 'Great White Shark', radius: 30, harmful: true },
  hammerhead: { name: 'Hammerhead Shark', radius: 32, harmful: true },
  squid: { name: 'Giant Squid', radius: 32, harmful: true },
  angler: { name: 'Anglerfish', radius: 21, harmful: true },
};
