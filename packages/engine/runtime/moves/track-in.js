import { ease, progress } from '../core.js';

/** Letters settle from wide spacing (`from`, em) to `to`. */
export function trackIn(el, t, { start = 0, duration = 1.0, from = 0.4, to = 0, curve = ease.outExpo } = {}) {
  const q = curve(progress(t, start, start + duration));
  el.style.letterSpacing = `${from + (to - from) * q}em`; el.style.opacity = Math.min(1, q * 2);
}
