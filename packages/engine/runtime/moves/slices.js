import { ease, clamp } from '../core.js';
import { rects, clipTo, size } from '../kit.js';

/** B comes in as `n` horizontal strips, alternating left and right, staggered top to bottom. */
export function slices(a, b, p, { n = 8, each = 0.05, curve = ease.outExpo } = {}) {
  if (p >= 1) { b.style.clipPath = 'none'; b.style.opacity = 1; return; }
  const [w, h] = size(a, b), sh = h / n, span = 1 - each * (n - 1), list = [];
  for (let i = 0; i < n; i++) {
    const q = curve(clamp((p - i * each) / span));
    if (q <= 0) continue;
    list.push(i % 2 ? [w * (1 - q), i * sh, w * q, sh + 1] : [0, i * sh, w * q, sh + 1]);
  }
  clipTo(b, rects(list)); b.style.opacity = 1;
}
