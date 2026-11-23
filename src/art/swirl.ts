/** Faint wavy strands trailing behind a propeller, drawn like the glass jelly's tentacles. `width` is the propeller's height, which the strands start across; `amount` is 0 to 1 and also lengthens them. The trail runs toward negative x, turned by `dir` radians. `lead` is -1 (moving straight up) to 1 (straight down): the strand on that side of the propeller starts closer to the sub. */
export function drawBoostSwirl(ctx: CanvasRenderingContext2D, t: number, amount: number, sternX: number, width: number, scale = 1, y = 0, dir = 0, lead = 0) {
  if (amount < 0.03) return;
  ctx.save();
  ctx.translate(sternX, y);
  ctx.scale(scale, scale);
  ctx.lineCap = 'butt';
  ctx.lineJoin = 'round';
  ctx.lineWidth = 2.6;
  const strands = 2;
  const segs = 16;
  const step = 8 * (0.7 + amount * 0.9);
  const fade = ctx.createLinearGradient(0, 0, -segs * step, 0);
  fade.addColorStop(0, `rgba(220,245,255,${0.1 * amount})`);
  fade.addColorStop(1, 'rgba(220,245,255,0)');
  ctx.strokeStyle = fade;
  for (let i = 0; i < strands; i++) {
    const phase = (i / strands) * Math.PI * 2;
    const edge = (i / (strands - 1) - 0.5) * width * 0.9;
    const pull = Math.sign(edge) === Math.sign(lead) ? Math.abs(lead) * 0.7 : 0;
    const y0 = 0;
    ctx.save();
    ctx.translate(0, edge * (1 - pull));
    ctx.rotate(dir);
    ctx.translate(0, Math.sign(edge) * Math.abs(lead) * width * 0.12);
    ctx.beginPath();
    for (let s = 0; s <= segs; s++) {
      const y = y0 + Math.sin(t * 7 - s * 0.6 + phase) * width * (0.12 + s * 0.012) * amount;
      if (s === 0) ctx.moveTo(0, y);
      else ctx.lineTo(-s * step, y);
    }
    ctx.stroke();
    ctx.restore();
  }
  ctx.restore();
}
