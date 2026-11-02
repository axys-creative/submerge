const LOST_SKIN_SCALE = 0.4;
/** The wreck is drawn a little bigger than the skin, which matches the player's sub. */
export const LOST_WRECK_SCALE = 0.52;

/**
 * A rusted iron-lung submarine on twin ballast tanks with a flattened front caved in.
 * As the lost wreck it lies upside down with bite punctures, claw gashes and torn plating; as a skin it sits upright and unmarked.
 */
export function drawLostSub(ctx: CanvasRenderingContext2D, size: number, skin: boolean, theta = 0.7) {
  ctx.save();
  ctx.scale(size, size);
  if (!skin) {
    ctx.rotate(-0.06);
    ctx.translate(0, -62);
    ctx.rotate(Math.PI);
    ctx.translate(0, 62);
  }
  const L = 150;
  const H = 44;
  const cy = -80;
  const dark = '#160B0A';

  const tank = (x0: number, x1: number, y: number, r: number, top: string, bottom: string) => {
    const g = ctx.createLinearGradient(0, y - r, 0, y + r);
    g.addColorStop(0, top);
    g.addColorStop(1, bottom);
    ctx.fillStyle = g;
    ctx.fillRect(x0, y - r, x1 - x0, r * 2);
    ctx.fillStyle = 'rgba(25,12,10,0.7)';
    for (let x = x0 + 16; x < x1 - 10; x += 30) ctx.fillRect(x, y - r - 3, 7, r * 2 + 6);
    ctx.fillStyle = bottom;
    ctx.beginPath();
    ctx.ellipse(x1, y, r * 0.35, r, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = 'rgba(15,8,7,0.6)';
    ctx.beginPath();
    ctx.ellipse(x0, y, r * 0.35, r, 0, 0, Math.PI * 2);
    ctx.fill();
  };
  tank(-150, 95, -34, 14, '#5E382F', '#2B1714');
  ctx.strokeStyle = '#2A1614';
  ctx.lineWidth = 5;
  for (const x of [-85, 70]) {
    ctx.beginPath();
    ctx.moveTo(x, cy + H - 2);
    ctx.lineTo(x - 12, -24);
    ctx.stroke();
  }
  tank(-120, 140, -14, 14, '#7A4A3E', '#3A201B');
  ctx.fillStyle = '#2A1614';
  ctx.fillRect(-135, -3, 22, 4);
  ctx.fillRect(100, -3, 22, 4);

  // Tail: the hull's top and bottom edges run back as one frame, with a big two-blade propeller turning between them.
  const frame = (draw: () => void, w: number, color: string) => {
    ctx.lineWidth = w;
    ctx.strokeStyle = color;
    ctx.beginPath();
    draw();
    ctx.stroke();
  };
  const beam = (y: number, top: string, bottom: string) => {
    const g = ctx.createLinearGradient(0, y, 0, y + 9);
    g.addColorStop(0, top);
    g.addColorStop(1, bottom);
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.roundRect(-L - 66, y, 72, 9, 3);
    ctx.fill();
  };
  beam(cy - H, '#80503F', '#5B342C');
  beam(cy + H - 9, '#5B342C', '#2C1714');
  for (const flip of [1, -1]) {
    const y = (v: number) => cy + flip * v;
    const g = ctx.createLinearGradient(0, y(-H), 0, y(-H + 26));
    g.addColorStop(0, flip > 0 ? '#80503F' : '#2C1714');
    g.addColorStop(1, '#5B342C');
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.moveTo(-L - 42, y(-H + 9));
    ctx.quadraticCurveTo(-L - 20, y(-H + 9), -L - 16, y(-H + 26));
    ctx.lineTo(-L + 4, y(-H + 26));
    ctx.lineTo(-L + 4, y(-H + 9));
    ctx.closePath();
    ctx.fill();
  }
  ctx.lineCap = 'round';
  frame(() => {
    ctx.moveTo(-L - 14, cy);
    ctx.lineTo(-L - 40, cy);
  }, 6, '#2A1614');
  const R = 34;
  const hubX = -L - 42;
  [theta, theta + Math.PI]
    .map((a) => ({ depth: Math.sin(a), lift: Math.cos(a) }))
    .sort((p, q) => p.depth - q.depth)
    .forEach(({ depth, lift }, i) => {
      if (i === 1) {
        ctx.fillStyle = '#3A201C';
        ctx.beginPath();
        ctx.ellipse(hubX, cy, 7, 8, 0, 0, Math.PI * 2);
        ctx.fill();
      }
      const g = ctx.createLinearGradient(hubX - 6, 0, hubX + 6, 0);
      g.addColorStop(0, '#8A5646');
      g.addColorStop(1, '#4A2A25');
      ctx.fillStyle = g;
      ctx.beginPath();
      ctx.ellipse(hubX + depth * 3, cy + lift * R * 0.5, 6, R * 0.5 * (0.35 + 0.65 * Math.abs(lift)), depth * 0.2 * Math.sign(lift), 0, Math.PI * 2);
      ctx.fill();
      if (depth < 0) {
        ctx.fillStyle = 'rgba(15,8,7,0.4)';
        ctx.fill();
      }
    });

  // Hull.
  const hull = ctx.createLinearGradient(0, cy - H, 0, cy + H);
  hull.addColorStop(0, '#80503F');
  hull.addColorStop(0.5, '#5B342C');
  hull.addColorStop(1, '#2C1714');
  ctx.fillStyle = hull;
  ctx.beginPath();
  ctx.ellipse(-L, cy, 20, H, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillRect(-L, cy - H, L * 2 - 6, H * 2);
  ctx.fillStyle = 'rgba(160,92,52,0.22)';
  for (const [x, y, rx, ry] of [[-100, cy - 20, 30, 12], [-30, cy + 24, 40, 10], [60, cy - 26, 26, 9], [95, cy + 12, 22, 14]] as const) {
    ctx.beginPath();
    ctx.ellipse(x, y, rx, ry, 0.2, 0, Math.PI * 2);
    ctx.fill();
  }
  for (const x of [-105, -15, 85]) {
    ctx.fillStyle = '#6E4638';
    ctx.fillRect(x, cy - H, 9, H * 2);
    ctx.fillStyle = 'rgba(25,12,10,0.65)';
    for (let y = cy - H + 8; y < cy + H; y += 16) {
      ctx.beginPath();
      ctx.arc(x + 4.5, y, 1.6, 0, Math.PI * 2);
      ctx.fill();
    }
  }
  ctx.fillStyle = 'rgba(214,186,172,0.32)';
  ctx.font = 'bold 11px sans-serif';
  ctx.fillText('SM-13', -143, cy - 22);
  ctx.fillStyle = '#4C2A24';
  ctx.fillRect(-36, cy - H - 8, 24, 9);
  ctx.strokeStyle = '#2A1614';
  ctx.lineWidth = 2.5;
  ctx.strokeRect(-30, cy - H - 13, 12, 6);

  // Ladder up the hull behind the middle.
  ctx.strokeStyle = '#2A1614';
  ctx.lineWidth = 3;
  ctx.beginPath();
  for (const x of [-66, -42]) {
    ctx.moveTo(x, cy - H + 5);
    ctx.lineTo(x, cy + H - 5);
  }
  ctx.stroke();
  ctx.strokeStyle = '#9A6656';
  ctx.lineWidth = 2.5;
  ctx.beginPath();
  for (const y of [-30, -14, 14, 30]) {
    ctx.moveTo(-66, cy + y);
    ctx.lineTo(-42, cy + y);
  }
  ctx.stroke();

  // Gill vent with its flared fins.
  ctx.fillStyle = dark;
  ctx.fillRect(14, cy - 18, 40, 34);
  ctx.fillStyle = '#9A6656';
  for (let i = 0; i < 5; i++) {
    ctx.beginPath();
    ctx.moveTo(19 + i * 7.5, cy + 12);
    ctx.lineTo(23 + i * 7.5, cy - 13);
    ctx.lineTo(27 + i * 7.5, cy + 12);
    ctx.closePath();
    ctx.fill();
  }

  // Caved-in, flattened front: bent plate, exposed framework, a cracked porthole.
  ctx.fillStyle = '#3E2420';
  ctx.beginPath();
  ctx.moveTo(L - 8, cy - H + 2);
  ctx.lineTo(L + 10, cy - H + 14);
  ctx.lineTo(L + 3, cy - 10);
  ctx.lineTo(L + 13, cy + 10);
  ctx.lineTo(L + 5, cy + H - 8);
  ctx.lineTo(L - 8, cy + H);
  ctx.closePath();
  ctx.fill();
  ctx.strokeStyle = '#1E100E';
  ctx.lineWidth = 3;
  ctx.beginPath();
  for (const k of [0, 1, 2]) {
    ctx.moveTo(L - 40 + k * 8, cy - H);
    ctx.quadraticCurveTo(L + 6, cy - H + 4 + k * 4, L + 12 - k * 2, cy - H + 26 + k * 10);
  }
  ctx.stroke();
  ctx.fillStyle = '#8B5C4E';
  ctx.beginPath();
  ctx.moveTo(L - 46, cy - H);
  ctx.lineTo(L - 14, cy - H - 14);
  ctx.lineTo(L - 22, cy - H + 4);
  ctx.lineTo(L + 4, cy - H - 2);
  ctx.lineTo(L - 12, cy - H + 14);
  ctx.closePath();
  ctx.fill();
  ctx.fillStyle = '#20171A';
  ctx.beginPath();
  ctx.arc(L - 14, cy + 8, 14, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = '#7A4A3E';
  ctx.lineWidth = 4;
  ctx.stroke();
  ctx.strokeStyle = 'rgba(210,225,235,0.55)';
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.moveTo(L - 22, cy);
  ctx.lineTo(L - 13, cy + 8);
  ctx.lineTo(L - 16, cy + 18);
  ctx.moveTo(L - 13, cy + 8);
  ctx.lineTo(L - 4, cy + 4);
  ctx.stroke();

  // Bars reaching forward from the top and bottom of the nose, curving down a little at their tips.
  ctx.lineCap = 'round';
  for (const flip of [1, -1]) {
    for (let k = 0; k < 3; k++) {
      const sx = L - 50 + k * 14;
      const ex = L + 52 - k * 6;
      const ey = cy + flip * (-H + 16 + k * 5);
      const bend = cy + flip * (-H - 8 + k * 3);
      frame(() => {
        ctx.moveTo(sx, cy + flip * -H);
        ctx.quadraticCurveTo(L + 44 - k * 4, bend, ex, ey);
      }, 5, '#2A1614');
      frame(() => {
        ctx.moveTo(sx, cy + flip * (-H + 1));
        ctx.quadraticCurveTo(L + 44 - k * 4, bend + flip, ex, ey + flip);
      }, 1.8, '#8B5C4E');
    }
  }

  if (!skin) {
    // Bite marks: scalloped chunks torn from the hull edge, with rows of tooth punctures around them.
    const bite = (bx: number, by: number, r: number, up: boolean) => {
      const a0 = up ? Math.PI : 0;
      ctx.fillStyle = dark;
      ctx.beginPath();
      ctx.arc(bx, by, r, a0, a0 + Math.PI);
      ctx.closePath();
      ctx.fill();
      ctx.strokeStyle = '#B27A66';
      ctx.lineWidth = 2;
      ctx.beginPath();
      for (let i = 0; i <= 6; i++) {
        const a = a0 + (i / 6) * Math.PI;
        const rr = r + (i % 2 ? 4 : -1);
        const x = bx + Math.cos(a) * rr;
        const y = by + Math.sin(a) * rr;
        if (i) ctx.lineTo(x, y);
        else ctx.moveTo(x, y);
      }
      ctx.stroke();
      ctx.fillStyle = dark;
      ctx.strokeStyle = 'rgba(178,122,102,0.7)';
      ctx.lineWidth = 1.5;
      for (let i = 0; i < 5; i++) {
        const a = a0 + Math.PI * (0.12 + i * 0.19);
        const x = bx + Math.cos(a) * (r + 15);
        const y = by + Math.sin(a) * (r + 15);
        ctx.beginPath();
        ctx.arc(x, y, 3.2 + (i % 2), 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();
      }
    };
    bite(-5, cy - H + 1, 22, false);
    bite(112, cy + H - 1, 24, true);
    bite(-120, cy + H - 1, 14, true);
    ctx.lineCap = 'round';
    for (const o of [0, 9, 18]) {
      ctx.strokeStyle = dark;
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(48 + o, cy - 30);
      ctx.lineTo(78 + o, cy + 28);
      ctx.stroke();
      ctx.strokeStyle = 'rgba(178,122,102,0.4)';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(50 + o, cy - 30);
      ctx.lineTo(80 + o, cy + 28);
      ctx.stroke();
    }
  }
  ctx.restore();
}


/** The lost submarine as a skin: upright and unmarked, shrunk to the sub's size and centered on the origin. */
export function drawLostSubSkin(ctx: CanvasRenderingContext2D, prop: number) {
  ctx.save();
  ctx.scale(LOST_SKIN_SCALE, LOST_SKIN_SCALE);
  ctx.translate(5.5, 64);
  drawLostSub(ctx, 1, true, prop * 0.8);
  ctx.restore();
}
/** Where the cracked porthole sits in the skin's local space. */
export const LOST_PORTHOLE = { x: 56.6, y: -3.2 };
