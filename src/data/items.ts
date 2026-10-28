export type ItemKind =
  | 'seaweed'
  | 'shell'
  | 'boot'
  | 'bottle'
  | 'can'
  | 'tire'
  | 'coin'
  | 'anchor'
  | 'wheel'
  | 'pearl'
  | 'goldbar'
  | 'gem'
  | 'idol'
  | 'chest';

export interface ItemDef {
  name: string;
  value: number;
  /** Depth band in meters where this item can appear on the sea floor. */
  minDepth: number;
  maxDepth: number;
  /** Relative spawn chance; 0 means it only appears in special places (wrecks). */
  weight: number;
  size: number;
  /** Treasure shows up on sonar. */
  treasure: boolean;
  /** Junk placed at fixed spots that never respawns while you are in the zone, counted by the zone's clean-up achievement. */
  trash?: boolean;
  /** Never found in caves, which were once dry land: only things from ships belong in the open sea. */
  wreckOnly?: boolean;
  /** Spawn chance inside caves, ignoring depth, instead of `weight`. */
  caveWeight?: number;
}

export const ITEMS: Record<ItemKind, ItemDef> = {
  seaweed: { name: 'Seaweed', value: 5, minDepth: 0, maxDepth: 160, weight: 10, size: 30, treasure: false },
  shell: { name: 'Conch Shell', value: 8, minDepth: 0, maxDepth: 220, weight: 6, size: 24, treasure: false },
  boot: { name: 'Old Boot', value: 0, minDepth: 0, maxDepth: 900, weight: 0, size: 26, treasure: false, trash: true },
  bottle: { name: 'Message in a Bottle', value: 0, minDepth: 0, maxDepth: 400, weight: 0, size: 26, treasure: false, trash: true },
  can: { name: 'Bent Can', value: 0, minDepth: 0, maxDepth: 900, weight: 0, size: 24, treasure: false, trash: true },
  tire: { name: 'Old Tire', value: 0, minDepth: 0, maxDepth: 900, weight: 0, size: 32, treasure: false, trash: true },
  coin: { name: 'Gold Coins', value: 25, minDepth: 20, maxDepth: 900, weight: 7, size: 24, treasure: true },
  anchor: { name: 'Anchor', value: 60, minDepth: 40, maxDepth: 900, weight: 4, size: 34, treasure: true, wreckOnly: true },
  wheel: { name: 'Ship Wheel', value: 90, minDepth: 80, maxDepth: 900, weight: 3, size: 36, treasure: true, wreckOnly: true },
  pearl: { name: 'Pearl Clam', value: 140, minDepth: 120, maxDepth: 900, weight: 3, size: 28, treasure: true },
  goldbar: { name: 'Gold Bars', value: 220, minDepth: 180, maxDepth: 900, weight: 2.5, size: 30, treasure: true, wreckOnly: true },
  gem: { name: 'Sea Sapphire', value: 450, minDepth: 300, maxDepth: 900, weight: 1.5, size: 26, treasure: true },
  idol: { name: 'Sunken Idol', value: 900, minDepth: 450, maxDepth: 900, weight: 1, size: 34, treasure: true, wreckOnly: true },
  chest: { name: 'Treasure Chest', value: 350, minDepth: 0, maxDepth: 0, weight: 0, size: 38, treasure: true, caveWeight: 2 },
};

export const ITEM_KINDS = Object.keys(ITEMS) as ItemKind[];
