import { ease, clamp } from '../core.js';
import { size } from '../kit.js';

/** B opens from a circle growing out of (x, y); A sinks back a little. */
export function iris(a, b, p, { x = '50%', y = '50%', curve = ease.inOutCubic } = {}) {
  const q = curve(clamp(p)), [w, h] = size(a, b);
  const r = q * Math.hypot(w, h) * 0.55;
  const v = q >= 1 ? 'none' : `circle(${r}px at ${x} ${y})`;
  b.style.clipPath = v; b.style.webkitClipPath = v; b.style.opacity = 1;
  b.style.transform = `scale(${1.1 - 0.1 * q})`;
  a.style.transform = `scale(${1 - 0.06 * q})`;
}
