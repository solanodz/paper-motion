import { ease, progress } from '../core.js';

/** Text comes into focus from a blur. */
export function blurIn(el, t, { start = 0, duration = 0.8, blur = 14, curve = ease.outCubic } = {}) {
  const q = curve(progress(t, start, start + duration));
  el.style.filter = `blur(${(1 - q) * blur}px)`; el.style.opacity = q;
}
