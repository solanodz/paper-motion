import { ease, clamp } from '../core.js';
import { E } from '../kit.js';

/** The camera dives through A (scaling past the lens) and lands on B. */
/** `origin` is where the camera dives in (put it on the subject, e.g. '30% 50%'). B lands from slightly larger, so no edge shows. */
export function zoomThrough(a, b, p, { scale = 6, origin = '50% 50%', curve = ease.inOutCubic } = {}) {
  const q = E(p, curve);
  a.style.transformOrigin = origin;
  a.style.transform = `scale(${1 + (scale - 1) * Math.pow(q, 2)})`;
  a.style.opacity = 1 - clamp((q - 0.55) / 0.3);
  b.style.transform = `scale(${1.12 - 0.12 * q})`;
  b.style.opacity = clamp((q - 0.45) / 0.35);
}
