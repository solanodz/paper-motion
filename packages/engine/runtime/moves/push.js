import { ease } from '../core.js';
import { E } from '../kit.js';

/** B pushes A out; `dir` is where A leaves to. */
export function push(a, b, p, { dir = 'left', curve = ease.inOutQuart } = {}) {
  const q = E(p, curve);
  const horiz = dir === 'left' || dir === 'right';
  const size = horiz ? (a.offsetWidth || b.offsetWidth) : (a.offsetHeight || b.offsetHeight);
  const s = dir === 'left' || dir === 'up' ? -1 : 1;
  const ax = q * size * s, bx = (q - 1) * size * s;
  a.style.transform = horiz ? `translateX(${ax}px)` : `translateY(${ax}px)`;
  b.style.transform = horiz ? `translateX(${bx}px)` : `translateY(${bx}px)`;
  a.style.opacity = 1; b.style.opacity = 1;
}
