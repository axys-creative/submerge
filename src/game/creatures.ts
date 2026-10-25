import type { Creature, World } from './world';
import { CREATURES } from '../data/creatures';
import { clamp, damp } from '../util';

export interface Target {
  x: number;
  y: number;
}

function steer(c: Creature, tvx: number, tvy: number, k: number, dt: number) {
  const f = damp(k, dt);
  c.vx += (tvx - c.vx) * f;
  c.vy += (tvy - c.vy) * f;
}

export function updateCreature(c: Creature, dt: number, world: World, target: Target | null) {
  c.phase += dt;
  c.timer -= dt;
  const dx = target ? target.x - c.x : 0;
  const dy = target ? target.y - c.y : 0;
  const d = target ? Math.hypot(dx, dy) || 1 : Infinity;

  const wander = (speed: number, k: number) => {
    if (c.x < 200) c.facing = 1;
    else if (c.x > world.width - 200) c.facing = -1;
    else if (Math.random() < dt * 0.05) c.facing = c.facing === 1 ? -1 : 1;
    steer(c, c.facing * speed, (c.homeY - c.y) * 0.5 + Math.sin(c.phase * 0.8 + c.tint * 6) * 14, k, dt);
  };

  const dead = c.state === 'dead';
  if (dead) {
    c.dying += dt;
    c.vx *= Math.exp(-1.4 * dt);
    c.vy += (30 - c.vy) * damp(1.2, dt);
  }

  switch (dead ? null : c.kind) {
    case 'fish':
      if (d < 150) steer(c, (-dx / d) * 170, (-dy / d) * 120, 3, dt);
      else wander(c.speed, 1.5);
      break;
    case 'jelly':
      steer(c, Math.sin(c.phase * 0.3 + c.tint * 9) * 10, Math.sin(c.phase * 1.4) * 24 + (c.homeY - c.y) * 0.15, 2, dt);
      break;
    case 'hammerhead':
      wander(75, 1.2);
      break;
    case 'shark':
      if (c.state === 'idle' && d < 330 && c.timer <= 0) {
        c.state = 'chase';
        c.timer = 3.5;
      }
      if (c.state === 'chase') {
        if (d > 650 || c.timer <= 0) {
          c.state = 'rest';
          c.timer = 2.5;
        } else steer(c, (dx / d) * 130, (dy / d) * 130, 2.2, dt);
      } else {
        if (c.state === 'rest' && c.timer <= 0) c.state = 'idle';
        wander(75, 1.2);
      }
      break;
    case 'squid':
      if (c.state === 'lunge') {
        const f = Math.exp(-1.8 * dt);
        c.vx *= f;
        c.vy *= f;
        if (c.timer <= 0) {
          c.state = 'rest';
          c.timer = 2.2;
        }
      } else {
        if (c.state === 'rest' && c.timer <= 0) c.state = 'idle';
        if (c.state === 'idle' && d < 360) {
          c.state = 'lunge';
          c.timer = 1.3;
          c.vx = (dx / d) * 340;
          c.vy = (dy / d) * 340;
        } else {
          steer(c, Math.sin(c.phase * 0.4 + c.tint * 7) * 25, Math.sin(c.phase * 0.9) * 28 + (c.homeY - c.y) * 0.4, 1, dt);
        }
      }
      break;
    case 'angler':
      if (d < 420) steer(c, (dx / d) * 72, (dy / d) * 72, 1.2, dt);
      else wander(22, 0.8);
      break;
  }

  const r = CREATURES[c.kind].radius;
  const nx = clamp(c.x + c.vx * dt, 60, world.width - 60);
  if (world.blocked(c.x, nx, c.y, r * 2, r + 12)) {
    c.vx = 0;
    c.facing = c.facing === 1 ? -1 : 1;
  } else c.x = nx;
  c.y += c.vy * dt;
  const top = c.kind === 'fish' ? 30 : Math.max(40, c.minY * 0.5);
  const bottom = Math.min(world.clearFloorAt(c.x, r * 2) - r - 12, c.maxY * 1.15);
  if (c.y < top) {
    c.y = top;
    c.vy = Math.max(0, c.vy);
  }
  if (c.y > bottom) {
    c.y = bottom;
    c.vy = Math.min(0, c.vy);
  }
  if (Math.abs(c.vx) > 8) c.facing = c.vx > 0 ? 1 : -1;

  const speed = Math.hypot(c.vx, c.vy);
  const goal = speed > 60 ? Math.atan2(c.vy, c.vx) : -Math.PI / 2;
  const da = ((goal - c.angle + Math.PI * 3) % (Math.PI * 2)) - Math.PI;
  c.angle += da * damp(4, dt);
}
