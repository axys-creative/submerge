export type ItemKind =
  | 'seaweed'
  | 'shell'
  | 'boot'
  | 'bottle'
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
  /** Treasure shows up on Treasure Ping sonar. */
  treasure: boolean;
}

export const ITEMS: Record<ItemKind, ItemDef> = {
  seaweed: { name: 'Seaweed', value: 5, minDepth: 0, maxDepth: 160, weight: 10, size: 30, treasure: false },
  shell: { name: 'Conch Shell', value: 8, minDepth: 0, maxDepth: 220, weight: 6, size: 24, treasure: false },
  boot: { name: 'Old Boot', value: 4, minDepth: 0, maxDepth: 900, weight: 3, size: 26, treasure: false },
  bottle: { name: 'Message in a Bottle', value: 15, minDepth: 0, maxDepth: 400, weight: 4, size: 26, treasure: false },
  coin: { name: 'Gold Coins', value: 25, minDepth: 20, maxDepth: 900, weight: 7, size: 24, treasure: true },
  anchor: { name: 'Anchor', value: 60, minDepth: 40, maxDepth: 900, weight: 4, size: 34, treasure: true },
  wheel: { name: 'Ship Wheel', value: 90, minDepth: 80, maxDepth: 900, weight: 3, size: 36, treasure: true },
  pearl: { name: 'Pearl Clam', value: 140, minDepth: 120, maxDepth: 900, weight: 3, size: 28, treasure: true },
  goldbar: { name: 'Gold Bars', value: 220, minDepth: 180, maxDepth: 900, weight: 2.5, size: 30, treasure: true },
  gem: { name: 'Sea Sapphire', value: 450, minDepth: 300, maxDepth: 900, weight: 1.5, size: 26, treasure: true },
  idol: { name: 'Sunken Idol', value: 900, minDepth: 450, maxDepth: 900, weight: 1, size: 34, treasure: true },
  chest: { name: 'Treasure Chest', value: 350, minDepth: 0, maxDepth: 0, weight: 0, size: 38, treasure: true },
};

export const ITEM_KINDS = Object.keys(ITEMS) as ItemKind[];
