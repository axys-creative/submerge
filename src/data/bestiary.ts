import { ZONES } from './zones';
import { CREATURES, type CreatureKind } from './creatures';

const UNLISTED: CreatureKind[] = ['leviathan'];

/** Every animal the catalog tracks, in the order they first show up across the zones. */
export const BESTIARY: CreatureKind[] = [];

/** The zone indexes each tracked animal lives in. */
export const BESTIARY_ZONES: Partial<Record<CreatureKind, number[]>> = {};

ZONES.forEach((z, i) => {
  if (z.catalog) return;
  for (const s of z.creatures ?? []) {
    if (UNLISTED.includes(s.kind)) continue;
    if (!BESTIARY.includes(s.kind)) BESTIARY.push(s.kind);
    const zones = (BESTIARY_ZONES[s.kind] ??= []);
    if (!zones.includes(i)) zones.push(i);
  }
});

export const creatureName = (k: CreatureKind) => CREATURES[k].name;

export const BEHAVIOR: Record<Exclude<CreatureKind, 'leviathan'>, string> = {
  fish: 'Darts away in schools when you get close.',
  jelly: 'Drifts with the current, glowing softly.',
  moonjelly: 'A big, slow drifter with a soft glow.',
  shark: 'Gives chase when you come near, but even a stock propeller outswims it.',
  hammerhead: 'Patrols back and forth across its patch.',
  squid: 'Lunges when you get close, then rests.',
  angler: 'Hunts by its glowing lure. A bump takes it out.',
  stingray: 'Cruises the sea floor and flees if you come close.',
  manta: 'Glides along in long, slow passes.',
  turtle: 'Paddles lazily and shies away when you approach.',
  bluewhale: 'A gentle giant drifting through the water.',
  whaleshark: 'A gentle giant on slow, steady passes.',
  bigfin: 'Drifts in the deep on long, harmless arms.',
  orca: 'Cruises in pods. Bump one and it hunts you down.',
  orcacalf: 'Stays close to its mother.',
  whale: 'Cruises slowly, and now and then dives deep before returning.',
  mobydick: 'Dives like any sperm whale, but lunges when you get close.',
  colossal: 'Ambushes from far away with a sudden lunge.',
  giant: 'Lunges with its long tentacles when you get close.',
};
