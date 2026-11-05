import { clamp } from '../util';
import { FREIGHTER_CRANES, CRANE_TIP_X, CRANE_HOOK_DROP, glassPlan, type WreckFx } from '../art/scenery';

const SHARD_REACH = 90;
const GLASS_SINK = 45;
const GLASS_DELAY: [number, number] = [0.1, 0.3];
const GLASS_GRAVITY = 70;
const CABLE_REACH = 90;
const CABLE_LAG = 10;
const CABLE_HOLD = 25;
const CABLE_LENGTH = 98;
const CABLE_LIMIT = CABLE_LENGTH * 1.05;
const CABLE_OVERSHOOT = 20;
const CABLE_CAP = CABLE_LIMIT * 2;
const CABLE_MAX_SPEED = 150;
const CABLE_SLOW = 0.2;
const SAIL_LENGTH = 40;
const SAIL_LIMIT = SAIL_LENGTH * 0.8;
const SAIL_X = 0;
const SAIL_REACH = 40;
const SAIL_TOP = -95;
const SAIL_BOTTOM = -32;

export function createWreckFx(kind: string): WreckFx | null {
  if (kind === 'galleon') return { glass: [], cranes: [], tilt: -0.12, scale: 3, sail: { push: 0, pushV: 0, drive: 0, held: false } };
  if (kind !== 'freighter') return null;
  return {
    tilt: -0.04,
    scale: 2,
    glass: glassPlan().shards.map(() => ({ state: 0, x: 0, y: 0, vx: 0, vy: 0, rot: 0, rotV: 0, wait: -1 })),
    cranes: FREIGHTER_CRANES.map(() => ({ push: 0, pushV: 0, drive: 0, held: false })),
  };
}

/** Lets the sub knock glass loose and brush the crane cables as it passes; `ox`, `oy` is where the wreck is drawn from. */
export function updateWreckFx(
  fx: WreckFx,
  ox: number,
  oy: number,
  sub: { x: number; y: number; vx: number; vy: number } | null,
  dt: number,
  floorAt: (x: number) => number,
) {
  const SCALE = fx.scale;
  const cos = Math.cos(fx.tilt);
  const sin = Math.sin(fx.tilt);
  const toLocal = (wx: number, wy: number) => {
    const dx = (wx - ox) / SCALE;
    const dy = (wy - oy) / SCALE;
    return { x: dx * cos + dy * sin, y: -dx * sin + dy * cos };
  };
  const toWorldX = (lx: number, ly: number) => ox + SCALE * (lx * cos - ly * sin);
  const me = sub ? toLocal(sub.x, sub.y) : null;
  const speed = sub ? Math.hypot(sub.vx, sub.vy) : 0;

  const shards = glassPlan().shards;
  fx.glass.forEach((g, k) => {
    const sh = shards[k];
    if (g.state === 0) {
      if (g.wait < 0) {
        const passed = me && sub && (me.x - sh.x) * Math.sign(sub.vx) > -10;
        if (!passed || Math.hypot(me!.x - sh.x, me!.y - sh.y) > SHARD_REACH || Math.random() > dt * 1.5 * clamp(speed / 80, 0.2, 1.5)) return;
        g.wait = GLASS_DELAY[0] + Math.random() * (GLASS_DELAY[1] - GLASS_DELAY[0]);
        return;
      }
      g.wait -= dt;
      if (g.wait > 0) return;
      g.state = 1;
      g.x = sh.x;
      g.y = sh.y;
      g.vx = (sub ? sub.vx : 0) * 0.04 + (Math.random() - 0.5) * 12;
      g.vy = 0;
      g.rotV = (Math.random() - 0.5) * 4;
      return;
    }
    if (g.state === 2) return;
    g.vy = Math.min(GLASS_SINK, g.vy + GLASS_GRAVITY * dt);
    g.vx *= 1 - Math.min(1, 1.5 * dt);
    g.x += (g.vx + Math.sin(g.y * 0.15 + k) * 6) * dt;
    g.y += g.vy * dt;
    g.rot += g.rotV * dt;
    const wx = toWorldX(g.x, g.y);
    const ground = toLocal(wx, floorAt(wx) + 2).y;
    if (g.y >= ground) {
      g.y = ground;
      g.state = 2;
      g.rotV = 0;
    }
  });

  fx.cranes.forEach((c, i) => {
    const def = FREIGHTER_CRANES[i];
    const tipX = def.x + CRANE_TIP_X * Math.cos(def.lean) - (-108 + def.drop) * Math.sin(def.lean);
    const tipY = def.y + CRANE_TIP_X * Math.sin(def.lean) + (-108 + def.drop) * Math.cos(def.lean);
    let target = 0;
    const m = c.held ? CABLE_HOLD : 0;
    const touching = !!me && Math.abs(me.x - tipX) < CABLE_REACH + m && me.y > tipY - 20 - m && me.y < tipY + CRANE_HOOK_DROP + 20 + m && (me.x - tipX) * Math.sign(sub!.vx) > -10 - m;
    c.held = touching;
    if (touching) {
      target = ((sub!.vx * 0.9) / SCALE) * Math.max(0, 1 - Math.abs(me.x - tipX) / CABLE_REACH) * 12.5;
    }
    c.drive += (target - c.drive) * Math.min(1, CABLE_LAG * dt);
    c.pushV = clamp(c.pushV + c.drive * dt, -CABLE_MAX_SPEED, CABLE_MAX_SPEED);
    const sdt = dt * CABLE_SLOW;
    const excess = Math.max(0, Math.abs(c.push) - CABLE_LIMIT) * Math.sign(c.push);
    c.pushV += (-2.2 * CABLE_LENGTH * Math.sin(c.push / CABLE_LENGTH) - CABLE_OVERSHOOT * excess - c.pushV * 2.4) * sdt;
    c.push = clamp(c.push + c.pushV * sdt, -CABLE_CAP, CABLE_CAP);
  });

  const sail = fx.sail;
  if (sail) {
    const touching = !!me && Math.abs(me.x - SAIL_X) < SAIL_REACH + (sail.held ? 12 : 0) && me.y > SAIL_TOP && me.y < SAIL_BOTTOM && (me.x - SAIL_X) * Math.sign(sub!.vx) > -4;
    sail.held = touching;
    const target = touching ? ((sub!.vx * 0.9) / SCALE) * Math.max(0, 1 - Math.abs(me!.x - SAIL_X) / SAIL_REACH) * 6 : 0;
    sail.drive += (target - sail.drive) * Math.min(1, CABLE_LAG * dt);
    sail.pushV = clamp(sail.pushV + sail.drive * dt, -CABLE_MAX_SPEED, CABLE_MAX_SPEED);
    const sdt = dt * CABLE_SLOW * 2;
    const excess = Math.max(0, Math.abs(sail.push) - SAIL_LIMIT) * Math.sign(sail.push);
    sail.pushV += (-2.2 * SAIL_LENGTH * Math.sin(sail.push / SAIL_LENGTH) - CABLE_OVERSHOOT * excess - sail.pushV * 1.6) * sdt;
    sail.push = clamp(sail.push + sail.pushV * sdt, -SAIL_LIMIT * 1.3, SAIL_LIMIT * 1.3);
  }
}
