import type { Game } from '../game/game';
import type { Action } from '../game/input';
import { exportCode, importCode } from '../game/save';
import { UPGRADES, UPGRADE_ORDER, WEIGHTS, type Loadout, type UpgradeId } from '../data/upgrades';
import { ZONES } from '../data/zones';
import { DEPTH_ZONES, METER_WINDOW, zoneIndexAt } from '../data/depthZones';
import { ROUTES, routesFrom, type Endpoint } from '../data/routes';
import { ITEMS, ITEM_KINDS, type ItemKind } from '../data/items';
import { drawSub } from '../art/sub';
import { drawItem } from '../art/items';
import { money, mixColor } from '../util';

const ICON = {
  hull: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 2 4 5v6c0 5 3.4 9.4 8 11 4.6-1.6 8-6 8-11V5l-8-3Z"/></svg>',
  air: '<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="9" cy="14" r="6"/><circle cx="17.5" cy="6.5" r="3.5"/></svg>',
  bolt: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M13 2 4 14h7l-1 8 9-12h-7l1-8Z"/></svg>',
  menu: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 7h16M4 12h16M4 17h16" stroke="currentColor" stroke-width="2.6" stroke-linecap="round" fill="none"/></svg>',
};

const DIM_KEY = 'submerge.ui.v1';
const MAX_TEST_LEVEL = 3;

type ModalKind = 'title' | 'shop' | 'menu' | 'message' | 'map';

const $ = <T extends HTMLElement = HTMLElement>(root: ParentNode, sel: string) => root.querySelector(sel) as T;

const RING =
  '<svg class="ring" viewBox="0 0 44 44" aria-hidden="true"><circle class="track" cx="22" cy="22" r="18" pathLength="100"/><circle class="arc" cx="22" cy="22" r="18" pathLength="100"/></svg>';

const esc = (s: string) => s.replace(/[&<>"']/g, (c) => `&#${c.charCodeAt(0)};`);

export class UI {
  touch = false;
  private modalKind: ModalKind | null = null;
  private root: HTMLElement;
  private modal: HTMLElement;
  private cache = new Map<string, string>();
  private toastTimer = 0;
  private shopRaf = 0;
  private shopPreview: UpgradeId | null = null;

  constructor(private game: Game) {
    this.root = document.getElementById('ui')!;
    this.root.innerHTML = `
      <div class="hud">
        <div class="panel vitals">
          <div class="vitals-top"><div class="hull-row" id="hud-hull"></div><button class="dim-switch" id="btn-dim" role="switch" tabindex="-1" aria-label="Dim the interface" aria-checked="false" title="Dim the interface"><span class="dim-knob"></span></button></div>
          <div class="dials">
            <div class="dial-col"><div class="dial air" id="hud-air">${RING}${ICON.air}</div><span class="pct" id="pct-air">100%</span></div>
            <div class="dial-col"><div class="dial batt" id="hud-batt">${RING}${ICON.bolt}</div><span class="pct" id="pct-batt">100%</span></div>
          </div>
        </div>
        <div class="panel purse"><div class="money" id="hud-money">$0</div><div class="cargo" id="hud-cargo">Hold empty</div></div>
        <button class="icon-btn" id="btn-menu" aria-label="Menu">${ICON.menu}</button>
      </div>
      <div class="prompt" id="prompt" hidden></div>
      <div class="toast" id="toast" hidden></div>
      <div class="touch" id="touch" hidden>
        <div class="stick-zone" id="stick-zone"></div>
        <div class="stick" id="stick"><div class="knob" id="knob"></div></div>
        <div class="touch-buttons">
          <button class="round-btn crank" data-act="crankJ" hidden>E</button>
          <button class="round-btn crank" data-act="crankK" hidden>R</button>
          <button class="round-btn secondary" id="btn-drop" data-act="drop" hidden>Drop</button>
          <button class="round-btn secondary" id="btn-spot" data-act="action" hidden>Shop</button>
          <button class="round-btn primary" id="btn-dive" data-act="dive" hidden>Dive</button>
        </div>
      </div>
      <div class="depth-meter" id="depth-meter" hidden>
        <div class="panel dm-tag" id="dm-current"></div>
        <div class="dm-track" id="dm-track">
          <div class="dm-frame"><div class="dm-scale" id="dm-scale">${this.depthMeterBands()}<div class="dm-limit" id="dm-limit"></div></div></div>
          <div class="dm-labels" id="dm-labels">${this.depthMeterLabels()}</div>
          <div class="dm-marker"><b class="dm-depth" id="dm-depth">0 m</b></div>
        </div>
        <div class="dm-foot"><div class="panel dm-tag" id="dm-next"></div><div class="panel dm-tag" id="dm-limit-tag"></div></div>
      </div>
      <canvas class="minimap" id="minimap" width="440" height="220"></canvas>
      <div class="minimap-tab" id="map-zone"></div>
      <div class="debug-upgrades" id="debug-up"></div>
      <div class="overlay" id="modal" hidden></div>`;
    this.modal = $(this.root, '#modal');

    $(this.root, '#debug-up').onclick = (e) => {
      const btn = (e.target as HTMLElement).closest<HTMLButtonElement>('[data-dbg], [data-zone], [data-all], [data-weights]');
      if (!btn) return;
      btn.blur();
      if (btn.dataset.weights) {
        this.game.setWeights(btn.dataset.weights === '1');
        return;
      }
      if (btn.dataset.all) {
        const g = this.game;
        const level = Math.max(0, Math.min(MAX_TEST_LEVEL, this.masterLevel() + Number(btn.dataset.all)));
        for (const id of UPGRADE_ORDER) g.save.upgrades[id] = Math.min(level, UPGRADES[id].levels.length - 1);
        g.setWeights(level === MAX_TEST_LEVEL);
        g.audio.play('chime1');
        g.sub.hull = g.maxHull;
        g.sub.oxygen = g.maxOxygen;
        g.sub.battery = g.maxBattery;
        return;
      }
      if (btn.dataset.zone) {
        const zone = this.game.save.zone + Number(btn.dataset.zone);
        if (zone >= 0 && zone < ZONES.length) this.game.sailTo({ zone, side: 'west' });
        return;
      }
      const [id, step] = btn.dataset.dbg!.split(':') as [UpgradeId, string];
      const g = this.game;
      const max = UPGRADES[id].levels.length - 1;
      const before = g.save.upgrades[id];
      g.save.upgrades[id] = Math.max(0, Math.min(max, before + Number(step)));
      if (g.save.upgrades[id] > before) g.audio.play('chime1');
      g.sub.hull = g.maxHull;
      g.sub.oxygen = g.maxOxygen;
      g.sub.battery = g.maxBattery;
    };

    $(this.root, '#btn-menu').addEventListener('click', () => this.openMenu());
    let tickTarget: Element | null = null;
    this.root.addEventListener('pointerover', (e) => {
      if (e.pointerType !== 'mouse') return;
      const el = (e.target as HTMLElement).closest('button, [data-act], .upg, input[type="range"], label.sound-row');
      if (el === tickTarget) return;
      tickTarget = el;
      if (el && !(el as HTMLButtonElement).disabled && !el.closest('#debug-up')) this.game.audio.play('menuTick');
    });
    new ResizeObserver(() => {
      this.trackHeight = $(this.root, '#dm-track').clientHeight;
      this.cache.delete('dm-ppm');
    }).observe($(this.root, '#dm-track'));
    const dimBtn = $(this.root, '#btn-dim');
    dimBtn.addEventListener('click', () => {
      this.setDim(!this.dim);
      dimBtn.blur();
    });
    try {
      this.setDim(localStorage.getItem(DIM_KEY) === '1');
    } catch {}
    this.setupTouch();
    this.showTitle();
  }

  private dim = false;
  /** The level the test panel's master arrows show: the lowest upgrade level, counting a maxed upgrade as top level. */
  private masterLevel() {
    return Math.min(
      ...UPGRADE_ORDER.map((id) => {
        const lv = this.game.save.upgrades[id];
        return lv >= UPGRADES[id].levels.length - 1 ? MAX_TEST_LEVEL : lv;
      }),
    );
  }

  /** Fades the HUD panels, minimap and depth gauge so they are still readable but out of the way. */
  private setDim(on: boolean) {
    this.dim = on;
    this.root.classList.toggle('ui-dim', on);
    const btn = this.root.querySelector('#btn-dim');
    btn?.classList.toggle('on', on);
    btn?.setAttribute('aria-checked', String(on));
    try {
      localStorage.setItem(DIM_KEY, on ? '1' : '0');
    } catch {}
  }

  // ---- Depth meter -------------------------------------------------------

  /** Positions below are in meters times --ppm (pixels per meter), so the track keeps its scale at any gauge height. */
  private depthMeterBands() {
    return DEPTH_ZONES.map((z, i) => {
      const end = DEPTH_ZONES[i + 1]?.from ?? z.from + 5000;
      return `<div class="dm-band" style="top:calc(${z.from} * var(--ppm));height:calc(${end - z.from} * var(--ppm));background:${z.color}"></div>`;
    }).join('');
  }

  private depthMeterLabels() {
    return DEPTH_ZONES.filter((z) => z.from > 0)
      .map((z) => `<span style="top:calc(${z.from} * var(--ppm))">${z.name} · ${z.from.toLocaleString()} m</span>`)
      .join('');
  }

  private deepestZone = 0;
  private trackHeight = 0;

  private updateDepthMeter(depth: number) {
    const g = this.game;
    const diving = g.mode === 'diving';
    const meter = $(this.root, '#depth-meter');
    meter.hidden = !diving;
    if (!diving) {
      this.deepestZone = 0;
      return;
    }
    const zone = zoneIndexAt(depth);
    if (zone > this.deepestZone) {
      this.deepestZone = zone;
      this.toast(`Entering the ${DEPTH_ZONES[zone].name}`);
    }
    const track = $(this.root, '#dm-track');
    const height = this.trackHeight || track.clientHeight;
    const ppm = height / METER_WINDOW;
    this.set('dm-ppm', `${ppm.toFixed(3)}|${g.depthRating}`, () => {
      track.style.setProperty('--ppm', `${ppm}px`);
      $(this.root, '#dm-limit').style.top = `${g.depthRating * ppm}px`;
    });
    const shift = `translateY(${(height / 2 - depth * ppm).toFixed(1)}px)`;
    $(this.root, '#dm-scale').style.transform = shift;
    $(this.root, '#dm-labels').style.transform = shift;
    const over = depth > g.depthRating;
    meter.classList.toggle('danger', over);
    this.set('dm-read', `${Math.round(depth)}|${g.depthRating}|${over}`, () => {
      $(this.root, '#dm-depth').textContent = `${Math.round(depth)} m`;
      const tag = $(this.root, '#dm-limit-tag');
      tag.textContent = over ? 'Too deep!' : `Safe to ${g.depthRating.toLocaleString()} m`;
      tag.classList.toggle('danger', over);
      $(this.root, '#dm-depth').classList.toggle('danger', over);
    });
    this.set('dm-zone', String(zone), () => {
      $(this.root, '#dm-current').textContent = DEPTH_ZONES[zone].name;
    });
    const next = DEPTH_ZONES[zone + 1];
    this.set('dm-next', next ? `${next.name}|${Math.ceil((next.from - depth) / 10) * 10}` : 'none', () => {
      const el = $(this.root, '#dm-next');
      el.hidden = !next;
      if (next) el.textContent = `${next.name} in ${(Math.ceil((next.from - depth) / 10) * 10).toLocaleString()} m`;
    });
  }

  // ---- HUD ---------------------------------------------------------------

  update() {
    const g = this.game;
    const s = g.sub;
    const diving = g.mode === 'diving';

    this.set('hull', `${s.hull}/${g.maxHull}`, () => {
      $(this.root, '#hud-hull').innerHTML = Array.from({ length: g.maxHull }, (_, i) =>
        ICON.hull.replace('<svg', `<svg class="${i < s.hull ? '' : 'empty'}"`),
      ).join('');
    });
    this.set('dbg', UPGRADE_ORDER.map((id) => g.save.upgrades[id]).join() + `|${g.save.zone}|${g.mode}|${g.save.weights}`, () => {
      const zone = g.save.zone;
      const master = this.masterLevel();
      const off = (ok: boolean) => (ok && g.mode === 'docked' ? '' : ' disabled');
      $(this.root, '#debug-up').innerHTML =
        '<h4>Zone (test)</h4>' +
        `<div class="dbg-row"><button tabindex="-1" data-zone="-1"${off(zone > 0)}>◀</button><span><b>Zone ${zone + 1}/${ZONES.length}</b><small>${ZONES[zone].name}</small></span><button tabindex="-1" data-zone="1"${off(zone < ZONES.length - 1)}>▶</button></div>` +
        '<h4>Upgrades (test)</h4>' +
        `<div class="dbg-row all"><button tabindex="-1" data-all="-1"${master > 0 ? '' : ' disabled'}>−</button><span><b>All upgrades</b><small>Level ${master + 1}/${MAX_TEST_LEVEL + 1}</small></span><button tabindex="-1" data-all="1"${master < MAX_TEST_LEVEL ? '' : ' disabled'}>+</button></div>` +
        UPGRADE_ORDER.map((id) => {
          const def = UPGRADES[id];
          const lv = g.save.upgrades[id];
          return `<div class="dbg-row"><button tabindex="-1" data-dbg="${id}:-1">−</button><span><b>${def.title} ${lv + 1}/${def.levels.length}</b><small>${def.levels[lv].name}</small></span><button tabindex="-1" data-dbg="${id}:1">+</button></div>`;
        }).join('') +
        `<div class="dbg-row"><button tabindex="-1" data-weights="0"${g.save.weights ? '' : ' disabled'}>−</button><span><b>${WEIGHTS.name}</b><small>${g.save.weights ? 'Owned' : 'Not owned'}</small></span><button tabindex="-1" data-weights="1"${g.save.weights ? ' disabled' : ''}>+</button></div>`;
    });
    this.drawMap();
    this.set("zone", String(g.save.zone), () => {
      $(this.root, "#map-zone").textContent = `Zone ${g.save.zone + 1} · ${ZONES[g.save.zone].name}`;
    });
    this.set("theme", String(g.uiDark > 0.5), () => this.root.classList.toggle("ui-dark", g.uiDark > 0.5));
    this.meter('air', s.oxygen / g.maxOxygen);
    this.meter('batt', s.battery / g.maxBattery);

    this.updateDepthMeter(g.depthM);
    this.set('money', money(g.save.money), (v) => ($(this.root, '#hud-money').textContent = v));
    const n = g.cargoCount();
    this.set('cargo', n ? `Hold: ${n} · ${money(g.cargoValue())}` : 'Hold empty', (v) => ($(this.root, '#hud-cargo').textContent = v));

    const spot = g.dockSpot();
    const prompt = this.promptText(spot);
    this.set('prompt', prompt, (v) => {
      const el = $(this.root, '#prompt');
      el.innerHTML = v;
      el.hidden = !v;
    });

    if (this.touch) {
      const docked = !diving && !this.modalKind && !g.travel;
      const canAct = !this.modalKind && !g.travel;
      this.set('t-dive', `${canAct}|${diving}`, () => {
        const b = $(this.root, '#btn-dive');
        b.hidden = !canAct;
        b.textContent = diving ? 'Grab' : 'Dive';
      });
      const label = docked && spot ? (spot.kind === 'shop' ? 'Shop' : spot.side === 'east' ? 'Map →' : '← Map') : '';
      this.set('t-spot', label, () => {
        const b = $(this.root, '#btn-spot');
        b.textContent = label;
        b.hidden = !label;
      });
      const drop = diving && g.weightsOn;
      this.set('t-drop', String(drop), () => ($(this.root, '#btn-drop').hidden = !drop));
      const crank = diving && s.battery <= 0;
      this.set('t-crank', String(crank), () => this.root.querySelectorAll<HTMLElement>('.crank').forEach((b) => (b.hidden = !crank)));
    }
  }

  private promptText(spot: ReturnType<Game['dockSpot']>) {
    const g = this.game;
    if (this.modalKind || g.travel) return '';
    const key = (k: string) => (this.touch ? '' : `<kbd>${k}</kbd> `);
    if (g.mode === 'docked') {
      if (spot?.kind === 'shop') return `${key('E')}Visit the ${esc(spot.name)} shop`;
      if (spot?.kind === 'sail') return `${key('E')}Open the route map`;
      return this.touch ? 'Drag to sail · Tap Dive to dive' : '<kbd>←</kbd><kbd>→</kbd> Sail &nbsp;·&nbsp; <kbd>Space</kbd> Dive';
    }
    const s = g.sub;
    if (s.battery <= 0) return this.touch ? 'Battery empty! Tap E and R back and forth' : 'Battery empty! Tap <kbd>E</kbd><kbd>R</kbd> back and forth to crank';
    if (g.depthM > g.depthRating) return `Too deep! Rise above ${g.depthRating} m`;
    if (s.oxygen < g.maxOxygen * 0.25) return 'Air running low! Head for the surface';
    if (g.weightsOn && s.diveTime < 7) return this.touch ? 'Tap Drop to let go of your weights' : '<kbd>Q</kbd> or <kbd>?</kbd> Drop your weights to rise fast';
    if (s.diveTime < 4 && g.save.stats.dives <= 2) return 'Return to the ship to dock and recharge';
    return '';
  }

  private mapBg: { world: Game['world']; canvas: HTMLCanvasElement } | null = null;
  private mapScroll = 0;

  private drawMap() {
    const g = this.game;
    const w = g.world;
    const ctx = ($(this.root, '#minimap') as HTMLCanvasElement).getContext('2d')!;
    const W = 440;
    const H = 220;
    const sx = W / w.width;
    const sy = sx;
    const fullH = Math.max(H, Math.ceil(24 + (w.maxFloor + 100) * sy));
    const mx = (x: number) => x * sx;
    const my = (y: number) => 24 + Math.max(0, y) * sy;

    if (this.mapBg?.world !== w) {
      const c = document.createElement('canvas');
      c.width = W;
      c.height = fullH;
      const b = c.getContext('2d')!;
      b.fillStyle = w.def.water[1];
      b.fillRect(0, 0, W, fullH);
      const sea = b.createLinearGradient(0, 24, 0, fullH);
      sea.addColorStop(0, w.def.water[0]);
      sea.addColorStop(1, w.def.water[1]);
      b.fillStyle = sea;
      b.fillRect(0, 24, W, fullH - 24);
      b.fillStyle = w.def.sky[1];
      b.fillRect(0, 0, W, 24);
      b.fillStyle = w.def.ground[0];
      b.beginPath();
      b.moveTo(0, fullH);
      for (let px = 0; px <= W; px += 2) b.lineTo(px, my(w.floorAt(px / sx)));
      b.lineTo(W, fullH);
      b.closePath();
      b.fill();
      b.fillStyle = mixColor(w.def.ground[1], '#050A1E', 0.7);
      b.beginPath();
      for (const c of w.caveBlobs) {
        b.moveTo(mx(c.x + c.r), my(c.y));
        b.ellipse(mx(c.x), my(c.y), Math.max(1, c.r * sx), Math.max(1, c.r * sy), 0, 0, Math.PI * 2);
      }
      b.fill();
      for (const isl of w.def.islands) {
        const ix = mx(isl.x);
        b.fillStyle = '#F5D58A';
        b.beginPath();
        b.moveTo(ix - 11, 24);
        b.quadraticCurveTo(ix, 4, ix + 11, 24);
        b.closePath();
        b.fill();
        b.fillStyle = '#6CC57A';
        b.beginPath();
        b.moveTo(ix - 7, 17);
        b.quadraticCurveTo(ix, 8, ix + 7, 17);
        b.closePath();
        b.fill();
      }
      this.mapBg = { world: w, canvas: c };
      this.mapScroll = 0;
    }
    ctx.clearRect(0, 0, W, H);
    ctx.drawImage(this.mapBg.canvas, 0, 0);

    const follow = g.mode === 'diving' ? my(g.sub.y) - H / 2 : 0;
    const scroll = Math.max(0, Math.min(fullH - H, follow));
    this.mapScroll += (scroll - this.mapScroll) * 0.12;
    ctx.clearRect(0, 0, W, H);
    ctx.drawImage(this.mapBg.canvas, 0, this.mapScroll, W, H, 0, 0, W, H);
    ctx.save();
    ctx.translate(0, -this.mapScroll);

    ctx.lineWidth = 2;
    ctx.strokeStyle = 'rgba(255,255,255,0.55)';
    const hw = g.view.w;
    const hh = g.view.h;
    ctx.strokeRect(mx(g.cam.x - hw / 2), my(g.cam.y - hh / 2), hw * sx, hh * sy);

    ctx.fillStyle = '#FFFFFF';
    ctx.fillRect(mx(g.ship.x) - 7, 16, 14, 8);
    if (g.mode === 'diving') {
      ctx.fillStyle = '#FFD34D';
      ctx.strokeStyle = '#14245A';
      ctx.beginPath();
      ctx.arc(mx(g.sub.x), my(g.sub.y), 5, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
    }
    ctx.restore();
  }

  private meter(id: string, frac: number) {
    const pct = Math.max(0, Math.min(1, frac));
    this.set(id, String((pct * 200) | 0), () => {
      const el = $(this.root, `#hud-${id}`);
      this.setArc(el, pct);
      el.classList.toggle('low', pct < 0.25);
      const label = $(this.root, `#pct-${id}`);
      label.textContent = `${Math.ceil(pct * 100)}%`;
      label.classList.toggle('low', pct < 0.25);
    });
  }

  private setArc(el: HTMLElement, frac: number) {
    $(el, '.arc').style.strokeDashoffset = String(100 - Math.max(0, Math.min(1, frac)) * 100);
  }

  private set(key: string, value: string, apply: (v: string) => void) {
    if (this.cache.get(key) === value) return;
    this.cache.set(key, value);
    apply(value);
  }

  toast(text: string) {
    const el = $(this.root, '#toast');
    el.textContent = text;
    el.hidden = false;
    el.classList.remove('out');
    clearTimeout(this.toastTimer);
    this.toastTimer = window.setTimeout(() => {
      el.classList.add('out');
      this.toastTimer = window.setTimeout(() => (el.hidden = true), 300);
    }, 3200);
  }

  // ---- Touch controls ----------------------------------------------------

  private setupTouch() {
    const enable = () => {
      if (this.touch) return;
      this.touch = true;
      document.body.classList.add('is-touch');
      $(this.root, '#touch').hidden = false;
      this.cache.clear();
    };
    if (matchMedia('(pointer: coarse)').matches) enable();
    addEventListener('touchstart', enable, { passive: true });

    const zone = $(this.root, '#stick-zone');
    const stick = $(this.root, '#stick');
    const knob = $(this.root, '#knob');
    const R = 56;
    let id: number | null = null;
    let ox = 0;
    let oy = 0;
    const move = (e: PointerEvent) => {
      let dx = e.clientX - ox;
      let dy = e.clientY - oy;
      const m = Math.hypot(dx, dy);
      if (m > R) {
        dx *= R / m;
        dy *= R / m;
      }
      knob.style.transform = `translate(${dx}px, ${dy}px)`;
      const dead = m < 8;
      this.game.input.stick.x = dead ? 0 : dx / R;
      this.game.input.stick.y = dead ? 0 : dy / R;
    };
    zone.addEventListener('pointerdown', (e) => {
      id = e.pointerId;
      zone.setPointerCapture(id);
      ox = e.clientX;
      oy = e.clientY;
      stick.style.left = `${ox}px`;
      stick.style.top = `${oy}px`;
      stick.classList.add('active');
      move(e);
    });
    zone.addEventListener('pointermove', (e) => e.pointerId === id && move(e));
    const end = (e: PointerEvent) => {
      if (e.pointerId !== id) return;
      id = null;
      this.game.input.stick.x = 0;
      this.game.input.stick.y = 0;
      knob.style.transform = '';
      stick.style.left = '';
      stick.style.top = '';
      stick.classList.remove('active');
    };
    zone.addEventListener('pointerup', end);
    zone.addEventListener('pointercancel', end);

    this.root.querySelectorAll<HTMLButtonElement>('.round-btn').forEach((b) => {
      b.addEventListener('pointerdown', (e) => {
        e.preventDefault();
        this.game.input.tap(b.dataset.act as Action);
        b.classList.add('pressed');
      });
      const up = () => b.classList.remove('pressed');
      b.addEventListener('pointerup', up);
      b.addEventListener('pointerleave', up);
    });
  }

  // ---- Modals ------------------------------------------------------------

  private open(kind: ModalKind, html: string, cls = '') {
    this.modalKind = kind;
    this.game.paused = true;
    this.modal.className = `overlay ${cls}`;
    this.modal.innerHTML = html;
    this.modal.hidden = false;
    this.cache.clear();
    const first = this.modal.querySelector<HTMLElement>('[data-autofocus]');
    first?.focus();
  }

  close() {
    cancelAnimationFrame(this.shopRaf);
    this.modalKind = null;
    this.modal.hidden = true;
    this.modal.innerHTML = '';
    this.game.paused = false;
    this.cache.clear();
  }

  onMenuKey() {
    if (this.modalKind === 'title' || this.modalKind === 'message') return;
    if (this.modalKind) this.close();
    else this.openMenu();
  }

  showTitle() {
    const g = this.game;
    const has = g.hasSave;
    this.open(
      'title',
      `<div class="title-screen">
        <h1 class="logo">Submerge</h1>
        <p class="tagline">Dive for treasure. Dodge the sharks. Upgrade your sub.</p>
        <div class="title-actions">
          ${
            has
              ? `<button class="btn big" data-act="continue" data-autofocus>Continue</button>
                 <button class="btn ghost" data-act="new">New game</button>`
              : `<button class="btn big" data-act="start" data-autofocus>Start diving</button>`
          }
        </div>
        <div class="confirm" hidden>
          <p>Start over? This erases your saved sub, money and upgrades.</p>
          <div class="row"><button class="btn danger" data-act="erase">Erase and start over</button><button class="btn ghost" data-act="cancel">Keep my game</button></div>
        </div>
        <p class="title-hint">${this.touch ? 'Drag on the left side to steer. Buttons on the right.' : 'Arrow keys or WASD to move · Space to dive · E to use shops · Esc for the menu'}</p>
      </div>`,
      'title-overlay',
    );
    this.modal.onclick = (e) => {
      const act = (e.target as HTMLElement).closest<HTMLElement>('[data-act]')?.dataset.act;
      if (!act) return;
      if (act === 'continue') this.close();
      if (act === 'start') {
        g.newGame();
        this.close();
        this.toast(`${this.touch ? 'Tap Dive' : 'Press Space'} to dive. Grab treasure, then sell it at an island shop.`);
      }
      if (act === 'new') $(this.modal, '.confirm').hidden = false;
      if (act === 'cancel') $(this.modal, '.confirm').hidden = true;
      if (act === 'erase') {
        g.newGame();
        this.close();
      }
    };
  }

  showMessage(title: string, body: string, tip: string, onCheckpoint: () => void, onMenu: () => void) {
    this.open(
      'message',
      `<div class="card message">
        <h2>${esc(title)}</h2>
        <p>${esc(body)}</p>
        ${tip ? `<p class="tip">${esc(tip)}</p>` : ''}
        <div class="row">
          <button class="btn big" data-act="checkpoint" data-autofocus disabled>Last checkpoint</button>
          <button class="btn big ghost" data-act="menu" disabled>Main menu</button>
        </div>
      </div>`,
      'wreck-overlay',
    );
    const buttons = this.modal.querySelectorAll<HTMLButtonElement>('button');
    setTimeout(() => {
      buttons.forEach((b) => (b.disabled = false));
      buttons[0].focus();
    }, 1400);
    this.modal.onclick = (e) => {
      const act = (e.target as HTMLElement).closest<HTMLButtonElement>('[data-act]');
      if (!act || act.disabled) return;
      this.close();
      if (act.dataset.act === 'checkpoint') onCheckpoint();
      else onMenu();
    };
  }

  /** The route map: every zone and how they connect, with the routes from this zone end to choose from. */
  openRouteMap(from: Endpoint) {
    const dests = routesFrom(from.zone, from.side);
    const half = 25;
    const same = (a: Endpoint, b: Endpoint) => a.zone === b.zone && a.side === b.side;
    const port = (e: Endpoint) => {
      const m = ZONES[e.zone].map;
      return { x: m.x + (e.side === 'east' ? half : -half), y: m.y };
    };
    const edges = ROUTES.map(([a, b]) => {
      const pa = port(a);
      const pb = port(b);
      const mx = (pa.x + pb.x) / 2;
      const active = same(a, from) || same(b, from);
      return `<path class="edge${active ? ' active' : ''}" d="M${pa.x},${pa.y} C${mx},${pa.y} ${mx},${pb.y} ${pb.x},${pb.y}"/>`;
    }).join('');
    const nodes = ZONES.map((z, i) => {
      const here = i === from.zone;
      const dest = dests.some((d) => d.zone === i);
      const route = dests.find((d) => d.zone === i);
      const attrs = dest && route ? ` data-act="route" data-zone="${route.zone}" data-side="${route.side}"` : '';
      const ports = (['west', 'east'] as const)
        .map((side) => {
          const p = port({ zone: i, side });
          const mine = here && side === from.side;
          return `<circle class="port${mine ? ' here' : ''}" cx="${p.x}" cy="${p.y}" r="${mine ? 4.5 : 3}"/>`;
        })
        .join('');
      return `<g class="node${here ? ' here' : ''}${dest ? ' dest' : ''}"${attrs}>
        <rect x="${z.map.x - half}" y="${z.map.y - 12}" width="${half * 2}" height="24" rx="7"/>
        <text class="num" x="${z.map.x}" y="${z.map.y + 4}">${i + 1}</text>
        <text class="name" x="${z.map.x}" y="${z.map.y + 25}">${esc(z.name)}</text>${ports}
      </g>`;
    }).join('');
    const list = dests
      .map(
        (d, i) =>
          `<button class="btn" data-act="route" data-zone="${d.zone}" data-side="${d.side}"${i === 0 ? ' data-autofocus' : ''}>Sail to ${esc(ZONES[d.zone].name)}</button>`,
      )
      .join('');
    this.open(
      'map',
      `<div class="card route-map">
        <header class="card-head">
          <div><span class="eyebrow">Route map</span><h2>Where to?</h2></div>
          <button class="btn small ghost" data-act="close">Stay here</button>
        </header>
        <svg class="route-svg" viewBox="0 0 360 200" role="img" aria-label="Map of zones and the routes between them">${edges}${nodes}</svg>
        <div class="route-list">${list}</div>
      </div>`,
    );
    this.modal.onclick = (e) => {
      const target = e.target as HTMLElement;
      if (target === this.modal) return this.close();
      const el = target.closest<HTMLElement>('[data-act]');
      if (!el) return;
      if (el.dataset.act === 'close') this.close();
      if (el.dataset.act === 'route') {
        this.close();
        this.game.sailTo({ zone: Number(el.dataset.zone), side: el.dataset.side as Endpoint['side'] });
      }
    };
  }

  openMenu() {
    if (this.modalKind === 'title') return;
    const g = this.game;
    const st = g.save.stats;
    this.open(
      'menu',
      `<div class="card menu">
        <header class="card-head"><h2>Paused</h2><button class="btn small" data-act="resume" data-autofocus>Resume</button></header>
        <div class="stats">
          <div><b>${st.dives}</b><span>Dives</span></div>
          <div><b>${st.deepest} m</b><span>Deepest</span></div>
          <div><b>${money(st.earned)}</b><span>Earned</span></div>
        </div>
        <section>
          <h3>How to play</h3>
          <ul class="howto">
            <li>${this.touch ? 'Drag on the left side of the screen' : 'Arrow keys or WASD'} to sail the ship and steer the sub.</li>
            <li>${this.touch ? 'Tap <b>Dive</b>' : 'Press <kbd>Space</kbd>'} to drop the sub. Drive back up to the ship to dock, recharge and repair.</li>
            <li>${this.touch ? 'Tap <b>Grab</b>' : 'Press <kbd>Space</kbd>'} underwater to reach out with the claw. Hold a direction to aim it, and use it to grab treasure you can't reach.</li>
            <li>Surface anywhere to refill your air.</li>
            <li>When the battery runs out, ${this.touch ? 'tap the <b>E</b> and <b>R</b> buttons' : 'press <kbd>E</kbd> and <kbd>R</kbd>'} back and forth to hand-crank.</li>
            <li>Sail next to an island and ${this.touch ? 'tap <b>Shop</b>' : 'press <kbd>E</kbd>'} to sell your haul and buy upgrades.</li>
            <li>Sail to the buoy at the end of a zone and ${this.touch ? 'tap <b>Map</b>' : 'press <kbd>E</kbd>'} to open the route map. Pick where to sail next; some ends have more than one route.</li>
          </ul>
        </section>
        <section>
          <h3>Sound</h3>
          <label class="sound-row"><input type="checkbox" id="sound-on" ${g.audio.muted ? '' : 'checked'}> Sound on</label>
          <label class="sound-row">Sound volume <input type="range" id="volume" min="0" max="100" value="${Math.round(g.audio.volume * 100)}"></label>
          <label class="sound-row">Music volume <input type="range" id="music-volume" min="0" max="100" value="${Math.round(g.audio.musicVolume * 100)}"></label>
        </section>
        <section>
          <h3>Save code</h3>
          <p class="muted">Your game saves in this browser automatically. Copy this code to back it up or move it to another device.</p>
          <textarea id="save-out" readonly rows="3">${exportCode(g.save)}</textarea>
          <div class="row"><button class="btn small blue" data-act="copy">Copy code</button><span class="muted" id="copy-msg"></span></div>
        </section>
        <section>
          <h3>Load a save code</h3>
          <textarea id="save-in" rows="3" placeholder="Paste a code that starts with SUBMERGE1-"></textarea>
          <div class="row"><button class="btn small blue" data-act="load">Load game</button><span class="error" id="load-msg"></span></div>
        </section>
        <section>
          <h3>Start over</h3>
          <div class="row"><button class="btn small ghost" data-act="new">New game</button></div>
          <div class="confirm" hidden>
            <p>This erases your saved sub, money and upgrades in this browser.</p>
            <div class="row"><button class="btn small danger" data-act="erase">Erase and start over</button><button class="btn small ghost" data-act="cancel">Cancel</button></div>
          </div>
        </section>
      </div>`,
    );
    this.modal.oninput = (e) => {
      const el = e.target as HTMLInputElement;
      if (el.id === 'volume') g.audio.setVolume(Number(el.value) / 100);
      if (el.id === 'music-volume') g.audio.setMusicVolume(Number(el.value) / 100);
      if (el.id === 'sound-on') g.audio.setMuted(!el.checked);
    };
    this.modal.onclick = async (e) => {
      const target = e.target as HTMLElement;
      if (target === this.modal) return this.close();
      const act = target.closest<HTMLElement>('[data-act]')?.dataset.act;
      if (act === 'resume') this.close();
      if (act === 'copy') {
        const ta = $<HTMLTextAreaElement>(this.modal, '#save-out');
        const msg = $(this.modal, '#copy-msg');
        try {
          await navigator.clipboard.writeText(ta.value);
          msg.textContent = 'Copied';
        } catch {
          ta.select();
          msg.textContent = 'Selected. Press Ctrl+C or Cmd+C to copy.';
        }
      }
      if (act === 'load') {
        const s = importCode($<HTMLTextAreaElement>(this.modal, '#save-in').value);
        if (!s) {
          $(this.modal, '#load-msg').textContent = "That code didn't work. Check that you copied all of it.";
          return;
        }
        g.loadGame(s);
        this.close();
        this.toast('Save loaded');
      }
      if (act === 'new') $(this.modal, '.confirm').hidden = false;
      if (act === 'cancel') $(this.modal, '.confirm').hidden = true;
      if (act === 'erase') {
        g.newGame();
        this.close();
        this.toast('New game started');
      }
    };
  }

  // ---- Shop --------------------------------------------------------------

  openShop(island: string) {
    this.shopPreview = null;
    this.open(
      'shop',
      `<div class="card shop">
        <header class="card-head">
          <div><span class="eyebrow">${esc(this.game.world.def.name)} · Island shop</span><h2>${esc(island)}</h2></div>
          <div class="wallet" id="shop-wallet"></div>
          <button class="btn small ghost" data-act="close" data-autofocus>Set sail</button>
        </header>
        <section class="haul" id="shop-haul"></section>
        <div class="shop-body">
          <div class="preview-wrap"><canvas id="shop-preview"></canvas><p class="muted" id="preview-label">Your sub</p></div>
          <div class="upgrades" id="shop-upgrades"></div>
        </div>
      </div>`,
      'shop-overlay',
    );
    this.renderShop();
    this.modal.onclick = (e) => {
      const target = e.target as HTMLElement;
      if (target === this.modal) return this.close();
      const btn = target.closest<HTMLElement>('[data-act]');
      if (!btn) return;
      const act = btn.dataset.act;
      if (act === 'close') this.close();
      if (act === 'sell') {
        const v = this.game.sellAll();
        if (v) this.toast(`Sold your haul for ${money(v)}`);
        this.renderShop();
      }
      if (act === 'buyWeights' && this.game.buyWeights()) {
        this.toast(`Strapped on the ${WEIGHTS.name}`);
        this.renderShop();
      }
      if (act === 'buy') {
        const id = btn.dataset.id as UpgradeId;
        if (this.game.buy(id)) {
          const lvl = UPGRADES[id].levels[this.game.up[id]];
          this.toast(`Installed ${lvl.name}`);
          this.shopPreview = null;
          this.renderShop();
        }
      }
    };
    const setPreview = (e: Event) => {
      const row = (e.target as HTMLElement).closest<HTMLElement>('.upg');
      const id = row?.dataset.id;
      this.shopPreview = row && id && id in UPGRADES && !row.classList.contains('maxed') ? (id as UpgradeId) : null;
    };
    this.modal.addEventListener('pointerover', setPreview);
    this.modal.addEventListener('focusin', setPreview);
    this.drawPreviewLoop();
  }

  private renderShop() {
    const g = this.game;
    $(this.modal, '#shop-wallet').textContent = money(g.save.money);

    const kinds = ITEM_KINDS.filter((k) => g.save.cargo[k]);
    const haul = $(this.modal, '#shop-haul');
    if (!kinds.length) {
      haul.innerHTML = `<p class="muted">Your hold is empty. Dive for seaweed, junk and treasure to sell here.</p>`;
    } else {
      haul.innerHTML = `
        <ul class="chips">${kinds
          .map((k) => {
            const n = g.save.cargo[k]!;
            return `<li><canvas data-item="${k}" width="64" height="64"></canvas><span>${esc(ITEMS[k].name)} <b>×${n}</b></span><em>${money(n * ITEMS[k].value)}</em></li>`;
          })
          .join('')}</ul>
        <button class="btn big" data-act="sell">Sell all for ${money(g.cargoValue())}</button>`;
      haul.querySelectorAll<HTMLCanvasElement>('canvas[data-item]').forEach((c) => {
        const ctx = c.getContext('2d')!;
        ctx.setTransform(1.5, 0, 0, 1.5, 32, 32);
        drawItem(ctx, c.dataset.item as ItemKind, 0);
      });
    }

    $(this.modal, '#shop-upgrades').innerHTML = UPGRADE_ORDER.map((id) => {
      const def = UPGRADES[id];
      const lvl = g.up[id];
      const now = def.levels[lvl];
      const next = def.levels[lvl + 1];
      const pips = def.levels.map((_, i) => `<i class="${i <= lvl ? 'on' : ''}"></i>`).join('');
      const action = next
        ? `<button class="btn small" data-act="buy" data-id="${id}" ${g.save.money < next.cost ? 'disabled' : ''}>Buy ${money(next.cost)}</button>`
        : `<span class="maxed-tag">Maxed out</span>`;
      return `<div class="upg ${next ? '' : 'maxed'}" data-id="${id}" tabindex="-1">
        <div class="upg-head"><h3>${def.title}</h3><div class="pips">${pips}</div></div>
        <p class="upg-now">${esc(now.name)} · ${esc(now.effect)}</p>
        ${next ? `<p class="upg-next">Next: <b>${esc(next.name)}</b> · ${esc(next.effect)}</p>` : `<p class="upg-next">${esc(def.blurb)}</p>`}
        <div class="upg-buy">${action}</div>
      </div>`;
    }).join('') + (g.world.def.sellsWeights ? this.weightsCard() : '');
  }

  private weightsCard() {
    const g = this.game;
    const action = g.save.weights
      ? '<span class="maxed-tag">Owned</span>'
      : `<button class="btn small" data-act="buyWeights" ${g.save.money < WEIGHTS.cost ? 'disabled' : ''}>Buy ${money(WEIGHTS.cost)}</button>`;
    return `<div class="upg ${g.save.weights ? 'maxed' : ''}" data-id="weights" tabindex="-1">
        <div class="upg-head"><h3>${WEIGHTS.name}</h3></div>
        <p class="upg-now">${g.save.weights ? 'Strapped on every dive' : 'One-time purchase'}</p>
        <p class="upg-next">${WEIGHTS.blurb} Drop them with ${this.touch ? 'the <b>Drop</b> button' : '<kbd>Q</kbd> or <kbd>?</kbd>'}.</p>
        <div class="upg-buy">${action}</div>
      </div>`;
  }

  private drawPreviewLoop() {
    const canvas = $<HTMLCanvasElement>(this.modal, '#shop-preview');
    const label = $(this.modal, '#preview-label');
    const ctx = canvas.getContext('2d')!;
    const frame = (now: number) => {
      if (this.modalKind !== 'shop') return;
      const dpr = Math.min(devicePixelRatio || 1, 2);
      const w = canvas.clientWidth;
      const h = canvas.clientHeight;
      if (canvas.width !== Math.round(w * dpr)) canvas.width = Math.round(w * dpr);
      if (canvas.height !== Math.round(h * dpr)) canvas.height = Math.round(h * dpr);
      const t = now / 1000;
      const up: Loadout = { ...this.game.up };
      const pid = this.shopPreview;
      if (pid && up[pid] < UPGRADES[pid].levels.length - 1) up[pid]++;
      this.set('preview-label', pid ? `Preview: ${UPGRADES[pid].levels[up[pid]].name}` : 'Your sub', (v) => (label.textContent = v));

      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      const bg = ctx.createLinearGradient(0, 0, 0, h);
      bg.addColorStop(0, '#3CC3DA');
      bg.addColorStop(1, '#1F5FA8');
      ctx.fillStyle = bg;
      ctx.fillRect(0, 0, w, h);
      ctx.fillStyle = 'rgba(255,255,255,0.18)';
      for (let i = 0; i < 6; i++) {
        const y = h - ((t * 30 + i * 40) % (h + 20));
        ctx.beginPath();
        ctx.arc(w * (0.15 + ((i * 0.37) % 0.7)), y, 3 + (i % 3), 0, Math.PI * 2);
        ctx.fill();
      }
      const scale = Math.min(w / 190, h / 130);
      ctx.translate(w / 2, h / 2 + 6 + Math.sin(t * 1.6) * 4);
      ctx.scale(scale, scale);
      drawSub(ctx, up, t, t * 6);
      this.shopRaf = requestAnimationFrame(frame);
    };
    this.shopRaf = requestAnimationFrame(frame);
  }
}
