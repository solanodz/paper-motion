import { ease } from '../core.js';
import { E } from '../kit.js';

/** B is revealed from an edge (`from`: bottom, top, left, right) behind a hard mask. */
export function maskReveal(a, b, p, { from = 'bottom', curve = ease.outExpo } = {}) {
  const r = (1 - E(p, curve)) * 100;
  const inset = { bottom: `${r}% 0 0 0`, top: `0 0 ${r}% 0`, left: `0 ${r}% 0 0`, right: `0 0 0 ${r}%` }[from];
  b.style.clipPath = `inset(${inset})`; b.style.opacity = 1;
  if (a) a.style.opacity = p >= 1 ? 0 : 1;
}
