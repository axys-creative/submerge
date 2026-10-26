import type { Game } from '../game/game';
import { COCKPIT_MIN, FLICKER_TIME, PX_PER_M, SONAR_RING_SPEED, SUB_DOCK_OFFSET } from '../config';
import { STATS } from '../data/upgrades';
import { ITEMS } from '../data/items';
import { buoyLabel, routesFrom } from '../data/routes';
import { batteryLights, drawSub, drawWeight, glassGlow, runningLights, LAMP, ANCHOR, COCKPIT, REAR_LAMP } from '../art/sub';
import { drawShip, drawIsland, drawCloud, cloudShape, drawBuoy, drawWreck, drawDeco, CRANE_TIP, SHIP_LAMPS } from '../art/scenery';
import { drawCreature, drawLureBulb, anglerLure, lureGlow } from '../art/creatures';
import { drawItem, drawSparkle } from '../art/items';
import { waveY, mixColor, lerp, clamp } from '../util';
import { BACK_LAYERS } from '../game/world';
import { daylight, STARS } from './daylight';
import type { Light } from './lighting';

const DEG = Math.PI / 180;
/** Highest angle of each spotlight cone below the sub's heading; each then sweeps further down by BEAM_SWEEP. */
const FRONT_BEAM_DOWN = 15 * DEG;
const REAR_BEAM_DOWN = 20 * DEG;
const BEAM_SWEEP = 10 * DEG;
const FRONT_BEAM_SWEEP = 15 * DEG;
const FRONT_SWEEP_SECONDS = 8;
const REAR_SWEEP_SECONDS = 11;

/** Slow back-and-forth 0..1 over `seconds`. */
const sweep = (t: number, seconds: number, phase = 0) => 0.5 - 0.5 * Math.cos((t / seconds) * Math.PI * 2 + phase);

const MOON_CRATERS = [
  { dx: -11, dy: -9, r: 7.5 },
  { dx: 10, dy: 4, r: 10 },
  { dx: -4, dy: 15, r: 5.5 },
  { dx: 14, dy: -14, r: 4 },
  { dx: -19, dy: 6, r: 3.5 },
];

/** An uneven, rimmed crater: a wobbly outline with a darker floor and a lit lip on one side. */
function crater(ctx: CanvasRenderingContext2D, x: number, y: number, r: number, seed: number) {
  const n = 9;
  const pts: [number, number][] = [];
  for (let i = 0; i < n; i++) {
    const wobble = Math.sin((seed + 1) * 12.9898 + i * 78.233) * 43758.5453;
    const k = 0.78 + 0.4 * (wobble - Math.floor(wobble));
    const a = (i / n) * Math.PI * 2;
    pts.push([x + Math.cos(a) * r * k * 1.08, y + Math.sin(a) * r * k * 0.92]);
  }
  const mid = (a: [number, number], b: [number, number]): [number, number] => [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2];
  const trace = () => {
    const start = mid(pts[n - 1], pts[0]);
    ctx.beginPath();
    ctx.moveTo(start[0], start[1]);
    for (let i = 0; i < n; i++) {
      const m = mid(pts[i], pts[(i + 1) % n]);
      ctx.quadraticCurveTo(pts[i][0], pts[i][1], m[0], m[1]);
    }
    ctx.closePath();
  };
  trace();
  ctx.fillStyle = 'rgba(150,155,182,0.4)';
  ctx.fill();
  ctx.save();
  ctx.clip();
  ctx.fillStyle = 'rgba(120,125,155,0.35)';
  ctx.beginPath();
  ctx.arc(x + r * 0.35, y + r * 0.35, r * 0.95, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
  trace();
  ctx.strokeStyle = 'rgba(255,255,255,0.35)';
  ctx.lineWidth = 1;
  ctx.stroke();
}

/** Height of the sky above the waterline, in world px; matches the view at the surface. */
const SKY_HEIGHT = 400;

const SHIP_BEAM_RANGE = 190;
const SHIP_BEAM_SPREAD = 0.5;

export function renderScene(g: Game) {
  const { ctx, view, cam, world, t } = g;
  const def = world.def;
  const k = view.scale * view.dpr;
  const W = view.w;
  const H = view.h;
  const left = cam.x - W / 2;
  const top = cam.y - H / 2;
  const right = left + W;
  const bottom = top + H;
  const sx = g.shake > 0 ? (Math.random() - 0.5) * g.shake * 24 : 0;
  const sy = g.shake > 0 ? (Math.random() - 0.5) * g.shake * 24 : 0;
  const ox = (-left + sx) * k;
  const oy = (-top + sy) * k;
  const inView = (x: number, m = 150) => x > left - m && x < right + m;

  const { night, warm, sunAngle } = daylight(g.day);
  const water0 = mixColor(def.water[0], '#0E2A5C', night * 0.65);
  const water1 = mixColor(def.water[1], '#030818', night * 0.55);

  ctx.setTransform(1, 0, 0, 1, 0, 0);
  ctx.fillStyle = water1;
  ctx.fillRect(0, 0, g.canvas.width, g.canvas.height);
  ctx.setTransform(k, 0, 0, k, ox, oy);

  // Sky
  if (top < 20) {
    const sky = ctx.createLinearGradient(0, -SKY_HEIGHT, 0, 0);
    sky.addColorStop(0, mixColor(mixColor(def.sky[0], '#F28BA0', warm * 0.3), '#060B2A', night));
    sky.addColorStop(1, mixColor(mixColor(def.sky[1], '#FFA070', warm * 0.55), '#1C2C68', night));
    ctx.fillStyle = sky;
    ctx.fillRect(left - 20, top - 20, W + 40, -top + 40);

    // Stars, sun, moon and clouds are far away, so they ignore the dive zoom and stay at their normal size.
    const k0 = view.ui * view.dpr;
    ctx.save();
    ctx.setTransform(k0, 0, 0, k0, 0, oy);
    const skyW = g.canvas.width / k0;
    const skyH = SKY_HEIGHT * view.zoom;

    if (night > 0) {
      ctx.fillStyle = '#FFFFFF';
      STARS.forEach((st) => {
        ctx.globalAlpha = night * (0.55 + 0.45 * Math.sin(t * 2 + st.p));
        ctx.beginPath();
        ctx.arc(st.x * skyW, -st.y * SKY_HEIGHT * 0.95, st.r, 0, Math.PI * 2);
        ctx.fill();
      });
      ctx.globalAlpha = 1;
    }

    const body = (angle: number) => ({ x: skyW * (0.5 - 0.42 * Math.cos(angle)), y: 10 - 0.75 * skyH * Math.sin(angle) });
    if (Math.sin(sunAngle) > -0.25) {
      const p = body(sunAngle);
      ctx.fillStyle = 'rgba(255,240,170,0.35)';
      ctx.beginPath();
      ctx.arc(p.x, p.y, 70, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = mixColor('#FFE58A', '#FF9F6B', warm * 0.8);
      ctx.beginPath();
      ctx.arc(p.x, p.y, 44, 0, Math.PI * 2);
      ctx.fill();
    }
    if (night > 0 && Math.sin(sunAngle + Math.PI) > -0.25) {
      const p = body(sunAngle + Math.PI);
      ctx.globalAlpha = night;
      ctx.fillStyle = '#F4F1DC';
      ctx.beginPath();
      ctx.arc(p.x, p.y, 34, 0, Math.PI * 2);
      ctx.fill();
      MOON_CRATERS.forEach((c, i) => {
        crater(ctx, p.x + c.dx, p.y + c.dy, c.r, i);
      });
      ctx.globalAlpha = 1;
    }

    const cloudColor = mixColor('#FFFFFF', '#46567F', night * 0.85);
    const span = skyW + 900;
    for (let i = 0; i < 9; i++) {
      const shape = cloudShape(i);
      const x = -450 + ((((i * 610 - cam.x * 0.3 + t * (5 + (i % 3) * 2)) % span) + span) % span);
      ctx.save();
      ctx.translate(x, (-340 + shape.height * 140) * (skyH / SKY_HEIGHT));
      drawCloud(ctx, i, cloudColor);
      ctx.restore();
    }
    ctx.globalAlpha = 1;
    ctx.restore();
  }

  for (const isl of def.islands) {
    if (!inView(isl.x, 300)) continue;
    ctx.save();
    ctx.translate(isl.x, 0);
    drawIsland(ctx, t, isl.name);
    ctx.restore();
  }

  // Water body
  const deepPx = def.darkness[1] * PX_PER_M;
  const water = ctx.createLinearGradient(0, 0, 0, deepPx);
  water.addColorStop(0, water0);
  water.addColorStop(1, water1);
  ctx.fillStyle = water;
  ctx.beginPath();
  ctx.moveTo(left - 20, bottom + 20);
  for (let x = left - 20; x <= right + 20; x += 16) ctx.lineTo(x, waveY(x, t));
  ctx.lineTo(right + 20, bottom + 20);
  ctx.closePath();
  ctx.fill();

  if (top < 500) {
    ctx.fillStyle = `rgba(255,255,255,${0.05 * (1 - night)})`;
    const step = 260;
    for (let x0 = Math.floor(left / step) * step - step; x0 < right + step; x0 += step) {
      const sway = Math.sin(t * 0.4 + x0) * 30;
      ctx.beginPath();
      ctx.moveTo(x0 + sway, 0);
      ctx.lineTo(x0 + 60 + sway, 0);
      ctx.lineTo(x0 + 200, 520);
      ctx.lineTo(x0 + 80, 520);
      ctx.closePath();
      ctx.fill();
    }
  }

  // Parallax mountains sit behind everything else, including the islands' underwater peaks.
  if (bottom > 200) {
    BACK_LAYERS.forEach((layer, i) => {
      const shift = cam.x * (1 - layer.p);
      const fill = ctx.createLinearGradient(0, 0, 0, deepPx);
      fill.addColorStop(0, mixColor(water0, '#0A1A3E', layer.dark));
      fill.addColorStop(1, mixColor(water1, '#0A1A3E', layer.dark));
      ctx.fillStyle = fill;
      ctx.globalAlpha = layer.alpha;
      ctx.beginPath();
      ctx.moveTo(left - 30, bottom + 30);
      for (let c = Math.floor((left - 30 - shift) / 24) * 24; c + shift <= right + 30; c += 24) {
        ctx.lineTo(c + shift, world.layerFloorAt(c, i));
      }
      ctx.lineTo(right + 30, bottom + 30);
      ctx.closePath();
      ctx.fill();
      ctx.globalAlpha = 1;
    });
  }

  // Each island is the peak of a faint mountain that keeps going down behind everything.
  const peakDepth = world.floorMax + 200;
  const mountains = def.islands.filter((isl) => inView(isl.x, 1400));
  if (mountains.length) {
    ctx.save();
    ctx.beginPath();
    ctx.moveTo(left - 20, bottom + 20);
    for (let x = Math.floor((left - 20) / 16) * 16; x <= right + 20; x += 16) ctx.lineTo(x, waveY(x, t));
    ctx.lineTo(right + 20, bottom + 20);
    ctx.closePath();
    ctx.clip();
    const y0 = Math.max(6, Math.floor((top - 60) / 60) * 60);
    const y1 = Math.min(peakDepth, Math.ceil((bottom + 60) / 60) * 60);
    const fade = ctx.createLinearGradient(0, 0, 0, deepPx);
    fade.addColorStop(0, mixColor(water0, '#0A1A3E', 0.3));
    fade.addColorStop(1, mixColor(water1, '#0A1A3E', 0.3));
    for (const isl of mountains) {
      if (y1 <= y0) continue;
      const half = (y: number) => 250 + y * 0.25 + Math.sin(y * 0.01 + isl.x) * 18 * Math.min(1, y / 200);
      const rows: number[] = [y0];
      for (let y = Math.floor(y0 / 60) * 60 + 60; y <= y1; y += 60) if (y > y0) rows.push(y);
      ctx.beginPath();
      for (const y of rows) ctx.lineTo(isl.x - half(y), y);
      for (let i = rows.length - 1; i >= 0; i--) ctx.lineTo(isl.x + half(rows[i]), rows[i]);
      ctx.closePath();
      ctx.fillStyle = fade;
      ctx.fill();
      ctx.strokeStyle = 'rgba(190,225,255,0.04)';
      ctx.lineWidth = 3;
      for (const dir of [-1, 1]) {
        ctx.beginPath();
        for (const y of rows) ctx.lineTo(isl.x + dir * half(y), y);
        ctx.stroke();
      }
    }
    ctx.restore();
  }

  // Sea floor
  if (bottom > 200) {
    def.wrecks.forEach((w) => {
      if (!inView(w.x, 300)) return;
      ctx.save();
      ctx.translate(w.x, world.floorAt(w.x) + 16);
      drawWreck(ctx, w.kind);
      ctx.restore();
    });

    for (const d of world.deco) {
      if (d.kind !== 'rock' || !inView(d.x)) continue;
      ctx.save();
      ctx.translate(d.x, d.y + 2);
      drawDeco(ctx, d.kind, d.size, d.tint, t);
      ctx.restore();
    }

    const ground = ctx.createLinearGradient(0, 0, 0, world.floorMax);
    ground.addColorStop(0, def.ground[0]);
    ground.addColorStop(1, def.ground[1]);
    ctx.fillStyle = ground;
    ctx.beginPath();
    ctx.moveTo(left - 30, bottom + 30);
    for (let x = Math.floor((left - 30) / 12) * 12; x <= right + 30; x += 12) ctx.lineTo(x, world.floorAt(x));
    ctx.lineTo(right + 30, bottom + 30);
    ctx.closePath();
    ctx.fill();
    ctx.strokeStyle = 'rgba(255,255,255,0.18)';
    ctx.lineWidth = 4;
    ctx.beginPath();
    for (let x = Math.floor((left - 30) / 12) * 12; x <= right + 30; x += 12) ctx.lineTo(x, world.floorAt(x) + 2);
    ctx.stroke();

    if (def.caves?.some((c) => right > c.x0 - 200 && left < c.x1 + 200)) {
      ctx.save();
      ctx.beginPath();
      ctx.moveTo(left - 30, bottom + 30);
      for (let x = Math.floor((left - 30) / 12) * 12; x <= right + 30; x += 12) ctx.lineTo(x, world.floorAt(x));
      ctx.lineTo(right + 30, bottom + 30);
      ctx.closePath();
      ctx.clip();
      const blobs = world.caveBlobs.filter((b) => b.x + b.r > left && b.x - b.r < right);
      for (const [color, extra] of [[mixColor(def.ground[1], '#FFFFFF', 0.14), 8], [mixColor(def.ground[1], '#050A1E', 0.7), 0]] as const) {
        ctx.fillStyle = color;
        ctx.beginPath();
        for (const b of blobs) {
          ctx.moveTo(b.x + b.r + extra, b.y);
          ctx.arc(b.x, b.y, b.r + extra, 0, Math.PI * 2);
        }
        ctx.fill();
      }
      ctx.restore();
    }

    for (const d of world.deco) {
      if (d.kind === 'rock' || !inView(d.x)) continue;
      ctx.save();
      ctx.translate(d.x, d.y + 2);
      drawDeco(ctx, d.kind, d.size, d.tint, t, d.push);
      ctx.restore();
    }

    for (const it of world.items) {
      if (!it.alive || !inView(it.x)) continue;
      ctx.save();
      ctx.translate(it.x, it.y + (it.y < world.floorAt(it.x) - 60 ? Math.sin(t * 1.5 + it.phase) * 4 : 0));
      drawItem(ctx, it.kind, t + it.phase);
      if (ITEMS[it.kind].treasure) {
        const a = Math.max(0, Math.sin(t * 2.2 + it.phase * 3));
        if (a > 0.6) drawSparkle(ctx, 10, -12, 6 * a, a);
      }
      ctx.restore();
    }
  }

  for (const c of world.creatures) if (inView(c.x)) drawCreature(ctx, c);

  // Zone exits
  const z = g.save.zone;
  if (routesFrom(z, 'east').length && inView(world.width - 200)) {
    ctx.save();
    ctx.translate(world.width - 200, waveY(world.width - 200, t));
    drawBuoy(ctx, t, buoyLabel(z, 'east'), 1);
    ctx.restore();
  }
  if (routesFrom(z, 'west').length && inView(200)) {
    ctx.save();
    ctx.translate(200, waveY(200, t));
    drawBuoy(ctx, t, buoyLabel(z, 'west'), -1);
    ctx.restore();
  }

  // Ship and sub
  const bob = g.shipBob;
  const s = g.sub;
  const subY = s.y + g.surfaceBob;
  if (g.mode === 'docked') {
    ctx.strokeStyle = '#2B3A67';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(g.ship.x + CRANE_TIP.x * g.ship.facing, CRANE_TIP.y + bob);
    const cos = Math.cos(s.tilt);
    const sin = Math.sin(s.tilt);
    ctx.lineTo(s.x + s.facing * (ANCHOR.x * cos - ANCHOR.y * sin), s.y + ANCHOR.x * sin + ANCHOR.y * cos);
    ctx.stroke();
  }
  ctx.save();
  ctx.translate(g.ship.x, bob);
  ctx.scale(g.ship.facing, 1);
  ctx.rotate(Math.sin(t * 0.9) * 0.02);
  drawShip(ctx, t, g.ship.facing, night, Math.min(g.up.plating, g.up.oxygen), g.up.oxygen, g.treasureAlert);
  ctx.restore();

  for (const w of g.weightFx) {
    ctx.save();
    ctx.translate(w.x, w.y);
    ctx.rotate(w.rot);
    drawWeight(ctx);
    ctx.restore();
  }

  const blink = s.invuln > 0 && Math.floor(t * 12) % 2 === 0;
  ctx.save();
  ctx.translate(s.x, subY);
  ctx.scale(s.facing, 1);
  ctx.rotate(s.tilt);
  if (blink) ctx.globalAlpha = 0.4;
  drawSub(ctx, g.up, t, s.prop, g.warning, g.weightsOn);
  ctx.restore();

  const claw = g.clawState();
  if (claw && g.mode === 'diving') {
    const bob = g.surfaceBob;
    const px = claw.px;
    const py = claw.py + bob;
    const tx = claw.tx;
    const ty = claw.ty + bob;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.strokeStyle = '#5E6674';
    ctx.lineWidth = 6;
    ctx.beginPath();
    ctx.moveTo(px, py);
    ctx.lineTo(tx, ty);
    ctx.stroke();
    ctx.strokeStyle = '#A9B2C0';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(px, py);
    ctx.lineTo(px + (tx - px) * 0.7, py + (ty - py) * 0.7);
    ctx.stroke();
    ctx.fillStyle = '#4A505E';
    ctx.beginPath();
    ctx.arc(px, py, 5, 0, Math.PI * 2);
    ctx.fill();
    const base = Math.atan2(claw.dirY, claw.dirX);
    ctx.strokeStyle = '#8A93A3';
    ctx.lineWidth = 4;
    for (const side of [-1, 1]) {
      const a1 = base + side * (0.25 + claw.open * 0.7);
      const mx = tx + Math.cos(a1) * 14;
      const my = ty + Math.sin(a1) * 14;
      const a2 = base - side * (0.2 + claw.open * 0.1);
      ctx.beginPath();
      ctx.moveTo(tx, ty);
      ctx.lineTo(mx, my);
      ctx.lineTo(mx + Math.cos(a2) * 10, my + Math.sin(a2) * 10);
      ctx.stroke();
    }
    ctx.fillStyle = '#6C7482';
    ctx.beginPath();
    ctx.arc(tx, ty, 4, 0, Math.PI * 2);
    ctx.fill();
  }

  if (g.dust.length) {
    ctx.fillStyle = mixColor(def.ground[0], '#C8CDD8', 0.45);
    for (const d of g.dust) {
      ctx.globalAlpha = 0.7 * (d.life / d.max);
      ctx.beginPath();
      ctx.arc(d.x, d.y, d.r * (0.6 + 0.4 * (d.life / d.max)), 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.globalAlpha = 1;
  }

  ctx.fillStyle = 'rgba(255,255,255,0.5)';
  ctx.strokeStyle = 'rgba(255,255,255,0.8)';
  ctx.lineWidth = 1.2;
  for (const b of g.bubbles) {
    ctx.beginPath();
    ctx.arc(b.x, b.y, b.r, 0, Math.PI * 2);
    ctx.stroke();
  }

  if (night > 0 && top < 40) {
    const dusk = ctx.createLinearGradient(0, -10, 0, 30);
    dusk.addColorStop(0, `rgba(8,14,56,${0.32 * night})`);
    dusk.addColorStop(1, 'rgba(8,14,56,0)');
    ctx.fillStyle = dusk;
    ctx.fillRect(left - 20, top - 20, W + 40, 50 - top);
  }

  // Front wave band so hulls sit in the water
  if (top < 60) {
    ctx.globalAlpha = 0.55;
    ctx.fillStyle = water0;
    ctx.beginPath();
    ctx.moveTo(left - 20, 30);
    for (let x = left - 20; x <= right + 20; x += 16) ctx.lineTo(x, waveY(x, t + 0.7) + 5);
    ctx.lineTo(right + 20, 30);
    ctx.closePath();
    ctx.fill();
    ctx.globalAlpha = 1;
    ctx.strokeStyle = 'rgba(255,255,255,0.55)';
    ctx.lineWidth = 3;
    ctx.beginPath();
    for (let x = left - 20; x <= right + 20; x += 16) ctx.lineTo(x, waveY(x, t + 0.7) + 5);
    ctx.stroke();
  }

  // Darkness and lights
  const startPx = def.darkness[0] * PX_PER_M;
  const lights: Light[] = [];
  const diving = g.mode === 'diving';
  const spot = STATS.light[g.up.light];
  let lamp: { x: number; y: number; angle: number } | null = null;
  const elapsed = FLICKER_TIME - g.flicker;
  const dip = g.flicker > 0 && ((elapsed > 0.05 && elapsed < 0.15) || (elapsed > 0.27 && elapsed < 0.37));
  const a = dip ? 0.25 : 1;
  const power = g.lightPower;
  const lit = !!spot && power > 0.02;
  const reach = 0.35 + 0.65 * power;
  const fade = Math.min(1, power * 2.5);
  const frontDown = FRONT_BEAM_DOWN + FRONT_BEAM_SWEEP * sweep(t, FRONT_SWEEP_SECONDS);
  const rearDown = REAR_BEAM_DOWN + BEAM_SWEEP * sweep(t, REAR_SWEEP_SECONDS, Math.PI / 2);
  const cockpitPower = Math.max(
    COCKPIT_MIN,
    Math.min(1, (s.battery / g.maxBattery / 0.5) * 2.5),
    s.crankLight / 0.8,
  );
  if (diving) {
    if (spot && lit) {
      lights.push({ x: s.x, y: subY, r: spot.glow * reach, a: fade });
      const cos = Math.cos(s.tilt);
      const sin = Math.sin(s.tilt);
      lamp = {
        x: s.x + s.facing * (LAMP.x * cos - LAMP.y * sin),
        y: subY + LAMP.x * sin + LAMP.y * cos,
        angle: s.facing > 0 ? s.tilt + frontDown : Math.PI - (s.tilt + frontDown),
      };
      lights.push({ x: lamp.x, y: lamp.y, r: spot.range * reach, angle: lamp.angle, spread: spot.spread, a: a * fade });
      if (g.up.light === 3) {
        lights.push({
          x: s.x + s.facing * (REAR_LAMP.x * cos - REAR_LAMP.y * sin),
          y: subY + REAR_LAMP.x * sin + REAR_LAMP.y * cos,
          r: 420 * reach,
          angle: s.facing > 0 ? Math.PI + s.tilt - rearDown : rearDown - s.tilt,
          spread: 0.5,
          a: a * fade,
        });
      }
    } else {
      const cos = Math.cos(s.tilt);
      const sin = Math.sin(s.tilt);
      lights.push({
        x: s.x + s.facing * (COCKPIT.x * cos - COCKPIT.y * sin),
        y: subY + COCKPIT.x * sin + COCKPIT.y * cos,
        r: 48,
        a: 0.6 * cockpitPower,
      });
    }
  }
  const shipBeams = night > 0.05
    ? SHIP_LAMPS.map((l) => ({
        x: g.ship.x + l.x * g.ship.facing,
        y: g.shipBob + l.y,
        angle: Math.PI / 2 - l.dir * g.ship.facing * l.a,
      }))
    : [];
  for (const b of shipBeams) {
    lights.push({ x: b.x, y: b.y, r: SHIP_BEAM_RANGE, angle: b.angle, spread: SHIP_BEAM_SPREAD, a: night });
  }
  const lures: { x: number; y: number; glow: number }[] = [];
  for (const c of world.creatures) {
    if (!inView(c.x)) continue;
    if (c.kind === 'angler') {
      const glow = lureGlow(c);
      const l = { ...anglerLure(c), glow };
      lures.push(l);
      if (glow > 0) lights.push({ x: l.x, y: l.y, r: 70 * (0.4 + 0.6 * glow), a: glow });
    } else if (c.kind === 'jelly') {
      lights.push({ x: c.x, y: c.y, r: 50 });
    }
  }
  if (bottom > lerp(startPx, 0, night)) {
    g.lighting.render(ctx, { k, ox, oy, left, top, w: W, h: H }, startPx, deepPx, lights, night);
    if (lamp && spot) {
      ctx.save();
      ctx.globalCompositeOperation = 'lighter';
      const halo = ctx.createRadialGradient(s.x, subY, 0, s.x, subY, spot.glow * reach);
      halo.addColorStop(0, `rgba(${spot.rgb},${0.14 * fade})`);
      halo.addColorStop(1, `rgba(${spot.rgb},0)`);
      ctx.fillStyle = halo;
      ctx.beginPath();
      ctx.arc(s.x, subY, spot.glow * reach, 0, Math.PI * 2);
      ctx.fill();
      const tint = ctx.createRadialGradient(lamp.x, lamp.y, 0, lamp.x, lamp.y, spot.range * reach);
      tint.addColorStop(0, `rgba(${spot.rgb},${0.016 * a * fade})`);
      tint.addColorStop(1, `rgba(${spot.rgb},0)`);
      ctx.fillStyle = tint;
      for (let i = 0; i < 10; i++) {
        const k = 0.4 + 0.8 * (i / 9);
        ctx.beginPath();
        ctx.moveTo(lamp.x, lamp.y);
        ctx.arc(lamp.x, lamp.y, spot.range * reach, lamp.angle - spot.spread * k, lamp.angle + spot.spread * k);
        ctx.closePath();
        ctx.fill();
      }
      ctx.restore();
    }
  }
  if (shipBeams.length && bottom > lerp(startPx, 0, night)) {
    ctx.save();
    ctx.globalCompositeOperation = 'lighter';
    for (const b of shipBeams) {
      const tint = ctx.createRadialGradient(b.x, b.y, 0, b.x, b.y, SHIP_BEAM_RANGE);
      tint.addColorStop(0, `rgba(255,246,216,${0.02 * night})`);
      tint.addColorStop(1, 'rgba(255,246,216,0)');
      ctx.fillStyle = tint;
      for (let i = 0; i < 10; i++) {
        const k = 0.4 + 0.8 * (i / 9);
        ctx.beginPath();
        ctx.moveTo(b.x, b.y);
        ctx.arc(b.x, b.y, SHIP_BEAM_RANGE, b.angle - SHIP_BEAM_SPREAD * k, b.angle + SHIP_BEAM_SPREAD * k);
        ctx.closePath();
        ctx.fill();
      }
    }
    ctx.restore();
  }
  if (diving) {
    ctx.save();
    ctx.translate(s.x, subY);
    ctx.scale(s.facing, 1);
    ctx.rotate(s.tilt);
    runningLights(ctx, t, g.warning);
    batteryLights(ctx, g.up.battery, t);
    if (bottom > lerp(startPx, 0, night)) {
      const dark = Math.max(clamp((s.y - startPx) / (deepPx - startPx), 0, 1), night * 0.8);
      glassGlow(ctx, dark * 0.55 * cockpitPower);
    }
    ctx.restore();
  }
  for (const l of lures) drawLureBulb(ctx, l.x, l.y, t, l.glow);

  // Sonar
  if (diving && g.sonar.ring >= 0) {
    const range = STATS.sonarRange[g.up.sonar];
    ctx.strokeStyle = `rgba(120,255,210,${0.1 * (1 - g.sonar.ring / range)})`;
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.arc((g.sonarPings.at(-1) ?? s).x, (g.sonarPings.at(-1) ?? s).y, g.sonar.ring, 0, Math.PI * 2);
    ctx.stroke();
  }
  if (diving && g.sonarDark > 0.15) {
    for (const ping of g.sonarPings) {
      const speed = ping.range * SONAR_RING_SPEED;
      const front = Math.max(1, (g.t - ping.start) * speed);
      g.sonarOutline.render(ctx, { k, ox, oy, left, top, w: W, h: H }, world, ping, ping.hits, front, ping.range, speed * ping.linger, g.sonarDark * 0.9);
    }
  }
  for (const b of g.blips) {
    const a = Math.min(1, b.life / 0.6);
    const color = b.danger ? '255,90,95' : b.shape ? '150,245,170' : '255,211,77';
    if (b.shape) {
      b.sprite ??= g.sonarShape.sprite(k, b.shape, color);
      g.sonarShape.draw(ctx, k, b.x * k + ox, b.y * k + oy, b.sprite, a);
      continue;
    }
    const pulse = (b.max - b.life) * 14;
    ctx.strokeStyle = `rgba(${color},${a * 0.5})`;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(b.x, b.y, 8 + pulse, 0, Math.PI * 2);
    ctx.stroke();
    ctx.fillStyle = `rgba(${color},${a})`;
    ctx.beginPath();
    ctx.arc(b.x, b.y, 7, 0, Math.PI * 2);
    ctx.fill();
  }

  ctx.font = `700 ${18 / view.zoom}px Fredoka, Nunito, sans-serif`;
  ctx.textAlign = 'center';
  ctx.lineJoin = 'round';
  for (const p of g.popups) {
    ctx.globalAlpha = Math.min(1, p.life / 0.4);
    ctx.lineWidth = 5 / view.zoom;
    ctx.strokeStyle = 'rgba(20,36,90,0.9)';
    ctx.strokeText(p.text, p.x, p.y);
    ctx.fillStyle = p.color;
    ctx.fillText(p.text, p.x, p.y);
  }
  ctx.globalAlpha = 1;
  ctx.textAlign = 'left';

  // Screen effects
  ctx.setTransform(1, 0, 0, 1, 0, 0);
  const cw = g.canvas.width;
  const ch = g.canvas.height;
  const choking = diving && s.oxygen <= 0 && !g.atSurface;
  const stress = (diving && g.depthM > g.depthRating) || choking ? 0.35 + Math.sin(t * 8) * 0.15 : 0;
  const red = Math.max(stress, g.hitFlash * 1.6);
  if (red > 0) {
    const v = ctx.createRadialGradient(cw / 2, ch / 2, Math.min(cw, ch) * 0.3, cw / 2, ch / 2, Math.max(cw, ch) * 0.7);
    v.addColorStop(0, 'rgba(255,60,70,0)');
    v.addColorStop(1, `rgba(255,60,70,${Math.min(0.6, red)})`);
    ctx.fillStyle = v;
    ctx.fillRect(0, 0, cw, ch);
  }
  if (diving && g.shipHint && (g.ship.x + 150 < left || g.ship.x - 150 > right)) {
    const dir = g.ship.x > s.x ? 1 : -1;
    const u = k;
    const x = dir > 0 ? cw - 56 * u : 56 * u;
    const y = Math.min(ch - 60 * u, Math.max(60 * u, s.y * k + oy));
    const nudge = Math.sin(t * 4) * 5 * u * dir;
    ctx.save();
    ctx.translate(x + nudge, y);
    ctx.scale(dir * u, u);
    ctx.lineJoin = 'round';
    ctx.lineWidth = 6;
    ctx.strokeStyle = 'rgba(20,36,90,0.9)';
    ctx.fillStyle = '#FFD34D';
    ctx.beginPath();
    ctx.moveTo(-14, -12);
    ctx.lineTo(4, -12);
    ctx.lineTo(4, -22);
    ctx.lineTo(24, 0);
    ctx.lineTo(4, 22);
    ctx.lineTo(4, 12);
    ctx.lineTo(-14, 12);
    ctx.closePath();
    ctx.stroke();
    ctx.fill();
    ctx.restore();
    ctx.font = `700 ${14 * u}px Fredoka, Nunito, sans-serif`;
    ctx.textAlign = 'center';
    ctx.lineWidth = 4 * u;
    ctx.strokeStyle = 'rgba(20,36,90,0.9)';
    ctx.fillStyle = '#FFFFFF';
    const label = `Ship ${Math.round(Math.abs(g.ship.x - s.x) / PX_PER_M)} m`;
    ctx.strokeText(label, x, y + 40 * u);
    ctx.fillText(label, x, y + 40 * u);
    ctx.textAlign = 'left';
  }
  if (g.speech.length && (diving || g.mode === 'docked')) {
    const u = view.ui * view.dpr;
    const baseX = (diving ? s.x : g.ship.x) * k + ox;
    const baseY = (diving ? s.y : bob - 60) * k + oy;
    ctx.font = `500 ${14 * u}px Fredoka, Nunito, sans-serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.lineJoin = 'round';
    g.speech.forEach((b, i) => {
      const pop = Math.min(1, b.age / 0.2);
      ctx.globalAlpha = Math.min(pop, b.life / 0.4);
      const w = ctx.measureText(b.text).width + 62 * u;
      const h = 54 * u;
      const r = 14 * u;
      const cx = Math.min(cw - w / 2 - 8 * u, Math.max(w / 2 + 8 * u, baseX + 20 * u));
      const cy = baseY - (96 + i * 64) * u;
      ctx.save();
      ctx.translate(cx, cy);
      ctx.scale(0.8 + 0.2 * pop, 0.8 + 0.2 * pop);
      ctx.fillStyle = mixColor('#FFFFFF', '#0E1838', g.uiDark);
      ctx.strokeStyle = mixColor('#14245A', '#8FA2E0', g.uiDark);
      ctx.lineWidth = 1.5 * u;
      const x0 = -w / 2;
      const x1 = w / 2;
      const y0 = -h / 2;
      const y1 = h / 2;
      ctx.beginPath();
      ctx.moveTo(x0 + r, y0);
      ctx.lineTo(x1 - r, y0);
      ctx.arcTo(x1, y0, x1, y0 + r, r);
      ctx.lineTo(x1, y1 - r);
      ctx.arcTo(x1, y1, x1 - r, y1, r);
      if (i === 0) {
        const tx = Math.min(x1 - r - 8 * u, Math.max(x0 + r + 8 * u, baseX - cx));
        ctx.lineTo(tx + 8 * u, y1);
        ctx.lineTo(tx, y1 + 12 * u);
        ctx.lineTo(tx - 8 * u, y1);
      }
      ctx.lineTo(x0 + r, y1);
      ctx.arcTo(x0, y1, x0, y1 - r, r);
      ctx.lineTo(x0, y0 + r);
      ctx.arcTo(x0, y0, x0 + r, y0, r);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
      ctx.fillStyle = b.color;
      ctx.beginPath();
      ctx.arc(x0 + 28 * u, 0, 5 * u, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = mixColor('#14245A', '#E8EEFF', g.uiDark);
      ctx.fillText(b.text, 8 * u, 1 * u);
      ctx.restore();
    });
    ctx.globalAlpha = 1;
    ctx.textAlign = 'left';
    ctx.textBaseline = 'alphabetic';
  }
  if (g.travel) {
    const tt = g.travel.t;
    ctx.fillStyle = `rgba(10,18,50,${tt < 0.5 ? tt / 0.5 : 1 - (tt - 0.5) / 0.5})`;
    ctx.fillRect(0, 0, cw, ch);
  }
}
