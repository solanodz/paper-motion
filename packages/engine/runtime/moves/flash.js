import { ease, clamp } from '../core.js';

/** An overexposed white flash: A burns out, the cut happens at the peak, B comes back from the white. */
export function flash(a, b, p, { color = '#fff', bloom = 18, peak = 0.4 } = {}) {
  const parent = a.parentElement;
  let o = parent.querySelector(':scope > .lab-flash');
  if (!o) { o = document.createElement('div'); o.className = 'lab-flash'; Object.assign(o.style, { position: 'absolute', inset: 0, background: color, pointerEvents: 'none', zIndex: 50 }); parent.append(o); }
  const up = ease.inCubic(clamp(p / peak)), down = 1 - ease.outCubic(clamp((p - peak) / (1 - peak)));
  const k = p < peak ? up : down;
  o.style.opacity = p <= 0 || p >= 1 ? 0 : k;
  const cur = p < peak ? a : b;
  a.style.opacity = p < peak ? 1 : 0; b.style.opacity = p < peak ? 0 : 1;
  cur.style.filter = k > 0.02 ? `blur(${bloom * k}px) brightness(${1 + 1.5 * k})` : 'none';
  cur.style.transform = `scale(${1 + 0.04 * k})`;
}
