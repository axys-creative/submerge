import type { Creature, World } from './world';
import { CREATURES } from '../data/creatures';
import { MONSTER_SPEED, MONSTER_SURGE, MONSTER_TRAIL } from '../config';
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

  /** Keeps a heading that only now and then reverses, turning back near the zone edges. */
  const turn = (margin: number, minWait: number, spread: number) => {
    if (c.x < margin) c.heading = 1;
    else if (c.x > world.width - margin) c.heading = -1;
    else if (c.timer <= 0) {
      c.timer = minWait + Math.random() * spread;
      if (Math.random() < 0.5) c.heading = c.heading === 1 ? -1 : 1;
    }
  };

  /** Slow steady swimming: keeps a heading that only now and then reverses, and bobs gently around its home depth. */
  const cruise = (speed: number, margin: number, minWait: number, spread: number, depthPull: number, bob: number, bobRate: number, k: number) => {
    turn(margin, minWait, spread);
    steer(c, c.heading * speed, (c.homeY - c.y) * depthPull + Math.sin(c.phase * bobRate + c.tint * 6) * bob, k, dt);
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
    case 'whale':
      if (!c.plan) {
        cruise(42, 900, 30, 40, 0.1, 6, 0.12, 0.35);
        c.nextDive -= dt;
        if (c.nextDive <= 0) {
          const bottom = Math.min(c.maxY * 1.1, world.clearFloorAt(c.x, 300) - 300);
          const y = Math.min(c.homeY + 600 + Math.random() * 500, bottom);
          if (y > c.homeY + 250) c.plan = { y, stage: 'down', hold: 12 + Math.random() * 20 };
          else c.nextDive = 30;
        }
      } else {
        const p = c.plan;
        turn(900, 30, 40);
        let goal = p.y;
        if (p.stage === 'down' && c.y > p.y - 40) p.stage = 'hold';
        if (p.stage === 'hold') {
          p.hold -= dt;
          if (p.hold <= 0) p.stage = 'up';
          goal = p.y + Math.sin(c.phase * 0.5) * 20;
        }
        if (p.stage === 'up') {
          goal = c.homeY;
          if (c.y < c.homeY + 30) {
            c.plan = null;
            c.nextDive = 45 + Math.random() * 75;
          }
        }
        steer(c, c.heading * 38, clamp((goal - c.y) * 0.5, -80, 80), 0.5, dt);
      }
      break;
    case 'manta':
      cruise(55, 500, 15, 30, 0.25, 18, 0.35, 0.6);
      break;
    case 'leviathan': {
      if (!target || c.state === 'rest') {
        steer(c, 0, 0, 1, dt);
        break;
      }
      const speed = d < 600 ? MONSTER_SURGE : MONSTER_SPEED;
      const stop = d > 400 && !world.clearLine(c.x, c.y, target.x, target.y) ? world.routeStep(c.x, c.y, target.x, target.y) : null;
      const want = stop ? Math.atan2(stop.y - c.y, stop.x - c.x) : Math.atan2(dy, dx);
      let heading = want + Math.PI;
      for (const off of [0, 0.35, -0.35, 0.7, -0.7, 1.1, -1.1, 1.6, -1.6]) {
        const a = want + off;
        const cos = Math.cos(a);
        const sin = Math.sin(a);
        if (!world.caveSolid(c.x + cos * 110, c.y + sin * 110) && !world.caveSolid(c.x + cos * 240, c.y + sin * 240)) {
          heading = a;
          break;
        }
      }
      steer(c, Math.cos(heading) * speed, Math.sin(heading) * speed, 1.6, dt);
      break;
    }
    case 'bigfin':
      steer(c, Math.sin(c.phase * 0.15 + c.tint * 9) * 7, Math.sin(c.phase * 0.45) * 9 + (c.homeY - c.y) * 0.2, 1, dt);
      break;
    case 'bluewhale':
      cruise(30, 900, 40, 50, 0.12, 8, 0.1, 0.35);
      break;
    case 'turtle':
      cruise(34, 500, 14, 28, 0.3, 14, 0.45, 0.6);
      break;
    case 'stingray': {
      const flee = d < 220;
      if (c.x < 300) c.heading = 1;
      else if (c.x > world.width - 300) c.heading = -1;
      else if (c.timer <= 0) {
        c.timer = 8 + Math.random() * 14;
        if (Math.random() < 0.5) c.heading = c.heading === 1 ? -1 : 1;
      }
      steer(c, flee ? (-dx / d) * 110 : c.heading * 28, (world.floorAt(c.x) - 42 - c.y) * 0.8, flee ? 2.5 : 0.9, dt);
      break;
    }
    case 'colossal':
      if (c.state === 'lunge') {
        const f = Math.exp(-1.4 * dt);
        c.vx *= f;
        c.vy *= f;
        if (c.timer <= 0) {
          c.state = 'rest';
          c.timer = 3.5;
        }
      } else {
        if (c.state === 'rest' && c.timer <= 0) c.state = 'idle';
        if (c.state === 'idle' && d < 520) {
          c.state = 'lunge';
          c.timer = 1.8;
          c.vx = (dx / d) * 360;
          c.vy = (dy / d) * 360;
        } else {
          steer(c, Math.sin(c.phase * 0.25 + c.tint * 7) * 18, Math.sin(c.phase * 0.6) * 18 + (c.homeY - c.y) * 0.3, 0.8, dt);
        }
      }
      break;
    case 'angler':
      if (d < 420) steer(c, (dx / d) * 72, (dy / d) * 72, 1.2, dt);
      else wander(22, 0.8);
      break;
  }

  if (c.kind === 'leviathan') {
    c.x = clamp(c.x + c.vx * dt, 60, world.width - 60);
    c.y += c.vy * dt;
    const goal = Math.hypot(c.vx, c.vy) > 40 ? Math.atan2(c.vy, c.vx) : c.angle;
    c.angle += (((goal - c.angle + Math.PI * 3) % (Math.PI * 2)) - Math.PI) * damp(3, dt);
    const trail = (c.trail ??= [{ x: c.x, y: c.y }]);
    if (Math.hypot(trail[0].x - c.x, trail[0].y - c.y) >= 16) {
      trail.unshift({ x: c.x, y: c.y });
      if (trail.length > MONSTER_TRAIL) trail.pop();
    }
    return;
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
