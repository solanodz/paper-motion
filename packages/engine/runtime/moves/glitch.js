import { clamp, rng } from '../core.js';
import { rects, clipTo, size } from '../kit.js';

/** A few frames of torn bands, jitter and RGB split; the bands show more of B until B holds. */
export function glitch(a, b, p, { seed = 1, steps = 22, rgb = 16, shift = 140 } = {}) {
  const fringe = (el, s) => { for (const c of el.children) c.style.filter = s > 0.3 ? `drop-shadow(${s}px 0 0 rgba(255,30,70,.9)) drop-shadow(${-s}px 0 0 rgba(0,220,255,.9))` : 'none'; };
  if (p <= 0) { clipTo(b, ''); return; }
  if (p >= 1) { b.style.clipPath = 'none'; b.style.opacity = 1; fringe(a, 0); fringe(b, 0); return; }
  const r = rng(seed * 997 + Math.floor(p * steps)).next, amt = Math.sin(Math.PI * p), cover = clamp((p - 0.1) / 0.75);
  const [w, h] = size(a, b), list = [];
  for (let y = 0; y < h;) { const bh = h * (0.015 + 0.11 * r()); if (r() < cover) list.push([0, y, w, bh + 1]); y += bh; }
  clipTo(b, rects(list)); b.style.opacity = 1;
  b.style.transform = `translateX(${(r() - 0.5) * shift * amt}px)`;
  a.style.transform = `translateX(${(r() - 0.5) * shift * 0.6 * amt}px)`;
  fringe(a, rgb * amt * r()); fringe(b, rgb * amt);
}
