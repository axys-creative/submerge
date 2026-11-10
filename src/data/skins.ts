/** How the submarine looks. Skins are cosmetic only: they never change what the upgrades do. */
export type SkinId = 'standard' | 'capsule' | 'oceangate' | 'sm13' | 'challenger';

export const SKIN_ORDER: SkinId[] = ['standard', 'capsule', 'oceangate', 'challenger', 'sm13'];

/** The Deepsea Challenger's hull takes about 16,500 psi, which is deeper than any trench, 50 m past the 11,000 m Challenger Deep: the safe depth in meters while it is worn. */
export const CHALLENGER_DEPTH_RATING = 11050;

/** Wrecks in one game that unlock the Expedition Capsule. */
export const CAPSULE_DEATHS = 3;

export const SKINS: Record<SkinId, { name: string; blurb: string; hint: string; unlock: string }> = {
  standard: { name: 'Standard Sub', blurb: 'The usual rounded submarine.', hint: '', unlock: 'Your starting sub.' },
  capsule: { name: 'Expedition Capsule', blurb: 'A white tube hull with a metal dome nose, a top fairing and a side thruster. Keeps the other upgrades\' looks.', hint: 'Persistence pays off.', unlock: `Unlocked by wrecking your sub ${CAPSULE_DEATHS} times in one game.` },
  oceangate: { name: 'OceanGate', blurb: 'A plain white hull with a swept tail, a brass dome nose and black landing gear. Ignores the upgrades\' looks.', hint: 'Go deeper than your hull can take.', unlock: 'Unlocked by diving past what your hull can take and imploding.' },
  sm13: { name: 'SM-13', blurb: 'The lost submarine from the Crimson Sea, rusted but whole: twin ballast tanks and a dented nose. Ignores the upgrades\' looks.', hint: 'Follow the crack in the sea.', unlock: 'Unlocked by stepping through the portal into the Crimson Sea and launching into the blood ocean.' },
  challenger: { name: 'Deepsea Challenger', blurb: 'A tall green research sub with a window onto its batteries, light booms and a sampling arm. Its hull takes 16,500 psi, safe to any depth in the game. It lies on the ship and rights itself in the water.', hint: 'Own every upgrade.', unlock: 'Unlocked by earning the Fully Loaded achievement: every upgrade maxed and all the gear owned.' },
};
