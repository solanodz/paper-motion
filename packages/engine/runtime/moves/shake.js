import { noise } from '../core.js';

/** A camera shake on each time in `hits`, dying out at `decay`. */
export function shake(el, t, { hits = [0], amount = 34, rot = 1.4, decay = 7, freq = 24, seed = 1 } = {}) {
  let x = 0, y = 0, r = 0;
  for (const [i, at] of hits.entries()) {
    const dt = t - at;
    if (dt < 0) continue;
    const e = Math.exp(-decay * dt), z = (seed + i) * 3.1;
    x += amount * e * (noise(dt * freq, z, 0) * 2 - 1);
    y += amount * e * (noise(dt * freq, z, 5) * 2 - 1);
    r += rot * e * (noise(dt * freq, z, 9) * 2 - 1);
  }
  el.style.transform = `translate(${x}px, ${y}px) rotate(${r}deg)`;
}
