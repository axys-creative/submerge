/** How the submarine looks. Skins are cosmetic only: they never change what the upgrades do. */
export type SkinId = 'standard' | 'capsule' | 'oceangate' | 'sm13' | 'challenger' | 'ulysses' | 'hammerhead';

export const SKIN_ORDER: SkinId[] = ['standard', 'capsule', 'oceangate', 'challenger', 'ulysses', 'hammerhead', 'sm13'];

/** The Deepsea Challenger's hull takes about 16,500 psi, which is deeper than any trench, 50 m past the 11,000 m Challenger Deep: the safe depth in meters while it is worn. */
export const CHALLENGER_DEPTH_RATING = 11050;

/** Zone index of Abyssal Plains, the last real zone: arriving there with no wrecks unlocks the Ulysses. */
export const ULYSSES_ZONE = 4;

/** The Ulysses is built to go anywhere: the safe depth in meters while it is worn, the same as the Deepsea Challenger's. */
export const ULYSSES_DEPTH_RATING = 11050;

/** The Ulysses is huge, so while it is worn the dive camera zooms out to at most this far in every zone, as in Abyssal Plains. */
export const ULYSSES_DIVE_ZOOM = 0.5;

/** The hammerhead is built to go anywhere: the safe depth in meters while it is worn, the same as the Deepsea Challenger's. */
export const SHARK_DEPTH_RATING = 11050;

/** Wrecks in one game that unlock the Expedition Capsule. */
export const CAPSULE_DEATHS = 3;

export const SKINS: Record<SkinId, { name: string; blurb: string; hint: string; unlock: string }> = {
  standard: { name: 'Standard Sub', blurb: 'The usual rounded submarine.', hint: '', unlock: 'Your starting sub.' },
  capsule: { name: 'Expedition Capsule', blurb: 'A white tube hull with a metal dome nose, a top fairing and a side thruster. Keeps the other upgrades\' looks.', hint: 'Persistence pays off.', unlock: `Unlocked by wrecking your sub ${CAPSULE_DEATHS} times in one game.` },
  oceangate: { name: 'OceanGate', blurb: 'A plain white hull with a swept tail, a brass dome nose and black landing gear. Ignores the upgrades\' looks.', hint: 'Go deeper than your hull can take.', unlock: 'Unlocked by diving past what your hull can take and imploding.' },
  sm13: { name: 'SM-13', blurb: 'The lost submarine from the Crimson Sea, rusted but whole: twin ballast tanks and a dented nose. Ignores the upgrades\' looks.', hint: 'Follow the crack in the sea.', unlock: 'Unlocked by stepping through the portal into the Crimson Sea and launching into the blood ocean.' },
  ulysses: { name: 'Ulysses', blurb: 'A long, dark, ribbed hull with a swept tail and an orange caged glass dome, from Atlantis. Massive, with every upgrade and piece of gear maxed, unsinkable against creature hits, and a camera that pulls far back in every zone. Ignores the upgrades\' looks.', hint: 'Make it to the deepest zone unscathed.', unlock: 'Unlocked by reaching Abyssal Plains without wrecking your sub once.' },
  hammerhead: { name: 'Hammerhead Shark', blurb: 'Swim out of a glass tank hanging from the ship\'s crane as a hammerhead, and swim back in to be hoisted aboard. Every upgrade and all the gear but the dive weights are maxed and it can dive to any depth, and your own upgrades come back when you take it off. Ignores the upgrades\' looks.', hint: 'Know every creature in the sea.', unlock: 'Unlocked by earning the Marine Biologist achievement: every animal spotted and added to the catalog.' },
  challenger: { name: 'Deepsea Challenger', blurb: 'A tall green research sub with a window onto its batteries, light booms and a sampling arm. Its hull takes 16,500 psi, safe to any depth in the game. It lies on the ship and rights itself in the water.', hint: 'Own every upgrade.', unlock: 'Unlocked by earning the Fully Loaded achievement: every upgrade maxed and all the gear owned.' },
};
