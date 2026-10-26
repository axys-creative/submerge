export const CELL = 100;

/** Which parts of a zone the sub has seen, as a grid of CELL px squares. */
export class Explored {
  readonly cols: number;
  readonly rows: number;
  readonly cells: Uint8Array;
  version = 0;

  constructor(width: number, depth: number, saved = '') {
    this.cols = Math.ceil(width / CELL);
    this.rows = Math.ceil(depth / CELL) + 1;
    this.cells = new Uint8Array(this.cols * this.rows);
    try {
      const bits = Uint8Array.from(atob(saved), (c) => c.charCodeAt(0));
      for (let i = 0; i < this.cells.length && i >> 3 < bits.length; i++) this.cells[i] = (bits[i >> 3] >> (i & 7)) & 1;
    } catch {}
  }

  reveal(x: number, y: number, r: number) {
    const cx = x / CELL;
    const cy = Math.max(0, y) / CELL;
    const rc = r / CELL;
    let changed = false;
    for (let j = Math.max(0, Math.floor(cy - rc)); j <= Math.min(this.rows - 1, Math.ceil(cy + rc)); j++) {
      for (let i = Math.max(0, Math.floor(cx - rc)); i <= Math.min(this.cols - 1, Math.ceil(cx + rc)); i++) {
        const k = j * this.cols + i;
        if (this.cells[k] || Math.hypot(i + 0.5 - cx, j + 0.5 - cy) > rc) continue;
        this.cells[k] = 1;
        changed = true;
      }
    }
    if (changed) this.version++;
  }

  encode() {
    const bits = new Uint8Array(Math.ceil(this.cells.length / 8));
    for (let i = 0; i < this.cells.length; i++) if (this.cells[i]) bits[i >> 3] |= 1 << (i & 7);
    let bin = '';
    bits.forEach((b) => (bin += String.fromCharCode(b)));
    return btoa(bin);
  }
}
