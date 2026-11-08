import { rng } from '../core.js';
import { chars, hash } from '../kit.js';

/** Letters show random glyphs, then lock into the real text from left to right. Widths stay fixed. */
export function scramble(el, t, { start = 0, duration = 1.4, fps = 30, rate = 2, seed = 1, glyphs = 'ABCDEFGHJKLMNPQRSTUVWXYZ0123456789#%&*+=/<>' } = {}) {
  const cs = chars(el);
  if (!el._labText) {
    el._labText = cs.map((c) => c.textContent);
    cs.forEach((c) => { c.style.width = `${c.getBoundingClientRect().width}px`; c.style.textAlign = 'center'; });
    const r = rng(seed); el._labJit = cs.map(() => r.next());
  }
  const n = cs.length, tick = Math.floor((t * fps) / rate);
  cs.forEach((c, i) => {
    const appear = start + (i / n) * duration * 0.35;
    const settle = start + duration * (0.3 + 0.7 * (i / n)) + el._labJit[i] * 0.1;
    if (t < appear) { c.style.opacity = 0; return; }
    if (t >= settle) { c.textContent = el._labText[i]; c.style.opacity = 1; return; }
    c.textContent = glyphs[Math.floor(hash(tick + seed, i) * glyphs.length)];
    c.style.opacity = 0.5;
  });
}
