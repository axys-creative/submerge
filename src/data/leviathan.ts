import type { Creature } from '../game/world';
import { MONSTER_SCALE as MS, MONSTER_TRAIL } from '../config';

/** The leviathan's body: points spaced evenly along the head's path starting at the head (relative to it), with each point's sideways direction and thickness. */
export function leviathanSpine(c: Creature) {
  const t = c.phase;
  const path = [{ x: c.x, y: c.y }, ...(c.trail ?? [])];
  const trail: { x: number; y: number }[] = [];
  let walked = 0;
  let from = 0;
  for (let k = 0; k < MONSTER_TRAIL; k++) {
    const want = k * 16;
    while (from < path.length - 1) {
      const len = Math.hypot(path[from + 1].x - path[from].x, path[from + 1].y - path[from].y);
      if (walked + len >= want) break;
      walked += len;
      from++;
    }
    if (from >= path.length - 1) break;
    const a = path[from];
    const b = path[from + 1];
    const len = Math.hypot(b.x - a.x, b.y - a.y) || 1;
    const u = (want - walked) / len;
    trail.push({ x: a.x + (b.x - a.x) * u, y: a.y + (b.y - a.y) * u });
  }
  const n = trail.length;
  const at = (k: number) => {
    const p = trail[Math.min(k, n - 1)];
    const a = trail[Math.min(k + 1, n - 1)];
    const b = trail[Math.max(k - 1, 0)];
    const len = Math.hypot(b.x - a.x, b.y - a.y) || 1;
    const nx = -(b.y - a.y) / len;
    const ny = (b.x - a.x) / len;
    const sway = Math.sin(t * 2 - k * 0.3) * 7 * MS * Math.min(1, k / 12);
    return { x: p.x - c.x + nx * sway, y: p.y - c.y + ny * sway, nx, ny };
  };
  const radius = (k: number) => (8 + 80 * (1 - k / MONSTER_TRAIL) ** 0.8) * MS;
  return { n, at, radius };
}

