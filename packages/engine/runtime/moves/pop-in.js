import { clamp, spring } from '../core.js';
import { chars } from '../kit.js';

/** Letters pop up from the baseline on a spring. */
export function popIn(el, t, { start = 0, each = 0.04, stiffness = 260, damping = 13, rise = 0.45 } = {}) {
  chars(el).forEach((c, i) => {
    const dt = t - (start + i * each), q = spring(dt, { stiffness, damping });
    c.style.transformOrigin = '50% 90%';
    c.style.transform = `translateY(${(1 - q) * rise}em) scale(${q})`;
    c.style.opacity = clamp(dt / 0.06);
  });
}
