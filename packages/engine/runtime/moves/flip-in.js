import { ease, clamp, progress } from '../core.js';
import { chars } from '../kit.js';

/** Letters flip up into place around their baseline, in 3D. */
export function flipIn(el, t, { start = 0, each = 0.045, duration = 0.8, angle = -100, curve = ease.outBack } = {}) {
  chars(el).forEach((c, i) => {
    const p = progress(t, start + i * each, start + i * each + duration), q = curve(p);
    c.style.transformOrigin = '50% 100% -0.2em';
    c.style.transform = `perspective(700px) rotateX(${angle * (1 - q)}deg)`;
    c.style.opacity = clamp(p * 3);
  });
}
