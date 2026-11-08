import { E } from '../kit.js';

export function crossfade(a, b, p, { curve } = {}) {
  const q = E(p, curve);
  a.style.opacity = 1 - q; b.style.opacity = q;
}
