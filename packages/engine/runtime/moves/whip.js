import { ease, clamp } from '../core.js';
import { size, hblur } from '../kit.js';

/** B pushes A out very fast, with horizontal motion blur that follows the speed. `dir` is where A leaves to. */
export function whip(a, b, p, { dir = 'left', blur = 70, curve = ease.inOutQuint } = {}) {
  const q = curve(clamp(p)), v = (curve(clamp(p + 0.01)) - curve(clamp(p - 0.01))) / 0.02;
  const [w] = size(a, b), s = dir === 'left' ? -1 : 1;
  a.style.transform = `translateX(${q * w * s}px)`;
  b.style.transform = `translateX(${(q - 1) * w * s}px)`;
  const id = (a.parentElement._pmWhipId ??= `pm-whip-${Math.random().toString(36).slice(2, 8)}`); // one blur filter per stage, so two whips on a page don't share it
  const f = v > 0.15 ? hblur(id, (blur * v) / 5) : 'none';
  a.style.filter = f; b.style.filter = f;
  a.style.opacity = 1; b.style.opacity = 1;
}
