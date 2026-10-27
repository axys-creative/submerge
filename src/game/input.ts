export type Action = 'left' | 'right' | 'up' | 'down' | 'dive' | 'action' | 'crankJ' | 'crankK' | 'menu' | 'drop' | 'hold' | 'lamp' | 'sonar';

const KEYMAP: Record<string, Action> = {
  ArrowLeft: 'left',
  KeyA: 'left',
  ArrowRight: 'right',
  KeyD: 'right',
  ArrowUp: 'up',
  KeyW: 'up',
  ArrowDown: 'down',
  KeyS: 'down',
  Space: 'dive',
  KeyE: 'action',
  Enter: 'action',
  KeyJ: 'crankJ',
  KeyK: 'crankK',
  KeyQ: 'drop',
  Slash: 'drop',
  Period: 'hold',
  KeyL: 'lamp',
  KeyO: 'sonar',
  Escape: 'menu',
  KeyP: 'menu',
};

const CRANK_ALIAS: Record<string, Action> = { KeyE: 'crankJ', KeyR: 'crankK' };

export class Input {
  /** Analog stick from the touch joystick, each axis -1..1. */
  stick = { x: 0, y: 0 };
  private held = new Set<Action>();
  private hits = new Set<Action>();
  private lastCrank: Action | null = null;
  private cranks = 0;

  constructor() {
    addEventListener('keydown', (e) => {
      const a = KEYMAP[e.code];
      const crank = CRANK_ALIAS[e.code];
      if (!a && !crank) return;
      const t = e.target;
      if (t instanceof HTMLInputElement || t instanceof HTMLTextAreaElement) return;
      if (t instanceof HTMLButtonElement && (e.code === 'Enter' || e.code === 'Space')) return;
      e.preventDefault();
      if (crank && !e.repeat) this.tap(crank);
      if (e.code === 'KeyE' && !e.repeat) this.tap('hold');
      if (!a) return;
      if (!e.repeat) this.tap(a);
      this.held.add(a);
    });
    addEventListener('keyup', (e) => {
      const a = KEYMAP[e.code];
      if (a) this.held.delete(a);
    });
    addEventListener('blur', () => this.held.clear());
  }

  tap(a: Action) {
    this.hits.add(a);
    if (a === 'crankJ' || a === 'crankK') {
      // Only alternating presses turn the crank.
      if (this.lastCrank !== a) this.cranks++;
      this.lastCrank = a;
    }
  }

  /** Holds an action down, for on-screen buttons that act as long as they are pressed. */
  hold(a: Action, down: boolean) {
    if (down) {
      this.tap(a);
      this.held.add(a);
    } else this.held.delete(a);
  }

  pressed(a: Action) {
    return this.hits.has(a);
  }

  isDown(a: Action) {
    return this.held.has(a);
  }

  takeCranks() {
    const c = this.cranks;
    this.cranks = 0;
    return c;
  }

  axis() {
    let x = (this.isDown('right') ? 1 : 0) - (this.isDown('left') ? 1 : 0) + this.stick.x;
    let y = (this.isDown('down') ? 1 : 0) - (this.isDown('up') ? 1 : 0) + this.stick.y;
    const m = Math.hypot(x, y);
    if (m > 1) {
      x /= m;
      y /= m;
    }
    return { x, y };
  }

  endFrame() {
    this.hits.clear();
  }
}
