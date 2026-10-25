import { clamp, mulberry32 } from '../util';

export const DAY_SECONDS = 240;
export const START_DAY = 0.35;

export interface Daylight {
  /** 0 in full daylight, 1 in full night. */
  night: number;
  /** Peaks at sunrise and sunset. */
  warm: number;
  sunAngle: number;
}

/** day runs 0..1: 0 midnight, 0.25 sunrise, 0.5 noon, 0.75 sunset. */
export function daylight(day: number): Daylight {
  const sunAngle = (day - 0.25) * Math.PI * 2;
  const h = Math.sin(sunAngle);
  const n = clamp((0.1 - h) / 0.45, 0, 1);
  return { night: n * n * (3 - 2 * n), warm: clamp(1 - Math.abs(h - 0.05) / 0.3, 0, 1), sunAngle };
}

const rng = mulberry32(7);
export const STARS = Array.from({ length: 70 }, () => ({ x: rng(), y: rng(), r: 0.8 + rng() * 1.6, p: rng() * 6 }));
