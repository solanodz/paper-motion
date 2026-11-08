import { ease } from '../core.js';
import { E } from '../kit.js';

/** B draws in from the top under a scan line element (`line`, absolutely positioned inside B's parent). */
export function scanReveal(a, b, p, { line, curve = ease.linear } = {}) {
  const q = E(p, curve);
  b.style.clipPath = `inset(0 0 ${(1 - q) * 100}% 0)`; b.style.opacity = 1;
  if (line) { line.style.top = `${b.offsetTop + q * b.offsetHeight}px`; line.style.opacity = q > 0 && q < 1 ? 1 : 0; }
  if (a) a.style.opacity = p >= 1 ? 0 : 1;
}
