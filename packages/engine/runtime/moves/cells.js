import { ease, clamp } from '../core.js';
import { rects, clipTo, size } from '../kit.js';

/** B shows through a grid of squares that grow from their centres in a wave from `origin` (0..1, 0..1). */
export function cells(a, b, p, { cols = 16, rows = 9, origin = [0, 0], spread = 0.6, curve = ease.outCubic } = {}) {
  if (p >= 1) { b.style.clipPath = 'none'; b.style.opacity = 1; return; }
  const [w, h] = size(a, b), cw = w / cols, ch = h / rows, max = Math.hypot(Math.max(origin[0], 1 - origin[0]), Math.max(origin[1], 1 - origin[1]));
  const list = [];
  for (let j = 0; j < rows; j++) for (let i = 0; i < cols; i++) {
    const d = (spread * Math.hypot((i + 0.5) / cols - origin[0], (j + 0.5) / rows - origin[1])) / max;
    const q = curve(clamp((p - d) / (1 - spread)));
    if (q <= 0) continue;
    const k = Math.min(1, q * 1.08), sw = cw * k, sh = ch * k; // close the last hairline before the curve settles
    list.push([i * cw + (cw - sw) / 2, j * ch + (ch - sh) / 2, sw, sh]);
  }
  clipTo(b, rects(list)); b.style.opacity = 1;
}
