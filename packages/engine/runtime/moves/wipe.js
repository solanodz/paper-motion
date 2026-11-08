import { E } from '../kit.js';

/** B is uncovered by a soft edge at `angle` degrees; A stays underneath. */
export function wipe(a, b, p, { angle = 100, soft = 30, curve } = {}) {
  const w = E(p, curve) * (100 + soft) - soft;
  const m = `linear-gradient(${angle}deg, #000 ${w}%, transparent ${w + soft}%)`;
  b.style.opacity = 1; b.style.maskImage = m; b.style.webkitMaskImage = m;
  if (a) a.style.opacity = p >= 1 ? 0 : 1;
}
