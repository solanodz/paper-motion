import { spring } from '../core.js';

/** The frame jumps in by `amount` on each hit and springs back. */
export function punch(el, t, { hits = [0], amount = 0.09, stiffness = 420, damping = 16, origin = '50% 50%' } = {}) {
  let s = 1;
  for (const at of hits) { const dt = t - at; if (dt >= 0) s += amount * (1 - spring(dt, { stiffness, damping })); }
  el.style.transformOrigin = origin;
  el.style.transform = `scale(${s})`;
}
