/** How the submarine looks. Skins are cosmetic only: they never change what the upgrades do. */
export type SkinId = 'standard' | 'capsule' | 'oceangate';

export const SKIN_ORDER: SkinId[] = ['standard', 'capsule', 'oceangate'];

export const SKINS: Record<SkinId, { name: string; blurb: string }> = {
  standard: { name: 'Standard Sub', blurb: 'The usual rounded submarine.' },
  capsule: { name: 'Expedition Capsule', blurb: 'A white tube hull with a metal dome nose, a top fairing and a side thruster. Keeps the other upgrades\' looks.' },
  oceangate: { name: 'OceanGate', blurb: 'A plain white hull with a swept tail, a brass dome nose and black landing gear. Ignores the upgrades\' looks.' },
};
