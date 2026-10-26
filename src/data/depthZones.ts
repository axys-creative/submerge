/** The ocean's depth layers, with real-world boundaries; the depth meter and its zone messages come from here. */
export interface DepthZone {
  name: string;
  /** Depth in meters where the layer begins. */
  from: number;
  color: string;
}

export const DEPTH_ZONES: DepthZone[] = [
  { name: 'Sunlit Zone', from: 0, color: '#4FD6F0' },
  { name: 'Twilight Zone', from: 200, color: '#2E86C9' },
  { name: 'Midnight Zone', from: 1000, color: '#1B3A82' },
  { name: 'Abyssal Zone', from: 4000, color: '#101D4A' },
  { name: 'Hadal Zone', from: 6000, color: '#070B24' },
];

/** How many meters of depth the gauge shows at once while its track scrolls past the pointer. */
export const METER_WINDOW = 100;

export const zoneIndexAt = (depth: number) => {
  let i = 0;
  while (i + 1 < DEPTH_ZONES.length && depth >= DEPTH_ZONES[i + 1].from) i++;
  return i;
};
