import { ease, progress } from '../core.js';
import { words } from '../kit.js';

/** Words rise one by one from behind a mask line. */
export function wordRise(el, t, { start = 0, each = 0.08, duration = 0.5, curve = ease.outExpo } = {}) {
  words(el).forEach((w, i) => {
    const q = curve(progress(t, start + i * each, start + i * each + duration));
    // fully below the mask line, and hidden until it moves: tall glyphs overflow a tight line-height box
    w.style.transform = `translateY(${(1 - q) * 125}%)`;
    w.style.opacity = q > 0.001 ? 1 : 0;
  });
}
