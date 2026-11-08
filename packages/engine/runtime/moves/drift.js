import { clamp } from '../core.js';

/** A slow constant push-in over `duration` seconds (default: the whole scene). */
export function drift(el, t, { amount = 0.04, duration = 10, origin = '50% 50%' } = {}) {
  el.style.transformOrigin = origin;
  el.style.transform = `scale(${1 + amount * clamp(t / duration)})`;
}
