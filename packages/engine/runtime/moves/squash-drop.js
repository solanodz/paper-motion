import { ease, progress } from '../core.js';
import { dims, items, show, layer, hide, resetAll } from '../kit.js';

/** A squashes, then launches up stretched; B falls in stretched, squashes on impact and wobbles to rest while its content follows through. */
export function squashDrop(a, b, p, { duration = 1.1, height = 1.3 } = {}) {
  const slot = a.parentElement, [w, h] = dims(a);
  if (p <= 0 || p >= 1) { hide(slot, 'sdL', 'sdR'); resetAll(a, b, ...items(b)); show(a, b, p); return; }
  const sq = ease.outQuad(progress(p, 0, 0.13)) * (1 - progress(p, 0.13, 0.2)), up = ease.inCubic(progress(p, 0.12, 0.38));
  a.style.transformOrigin = '50% 100%';
  a.style.transform = `translateY(${-h * height * up}px) scale(${1 + 0.05 * sq - 0.07 * up}, ${1 - 0.09 * sq + 0.16 * up})`;
  a.style.opacity = p < 0.38 ? 1 : 0;
  const HIT = 0.58, fall = ease.inCubic(progress(p, 0.3, HIT)), dt = Math.max(0, (p - HIT) * duration), end = 1 - progress(p, 0.9, 1);
  const wob = p > HIT ? Math.exp(-dt * 7) * Math.cos(dt * 24) * end : 0, st = p < HIT ? 0.14 * fall : 0;
  b.style.transformOrigin = '50% 100%';
  b.style.transform = `translateY(${-h * height * (1 - fall)}px) scale(${1 - 0.06 * st + 0.09 * wob}, ${1 + st - 0.13 * wob})`;
  b.style.opacity = p > 0.3 ? 1 : 0;
  items(b).forEach((c, i) => { const y = p < HIT ? -24 * fall : -24 * Math.exp(-dt * 8) * Math.cos(dt * 20 + i * 0.4) * end; c.style.transform = `translateY(${y}px)`; });
  const l = progress(p, HIT, HIT + 0.22), on = l > 0 && l < 1 ? 'block' : 'none', len = 120 * (1 - l) + 12, reach = 150 * ease.outCubic(l);
  layer(slot, 'sdL', `display:${on};left:${-reach - len}px;top:${h - 2}px;width:${len}px;height:3px;background:#fff;opacity:${1 - l};z-index:4`);
  layer(slot, 'sdR', `display:${on};left:${w + reach}px;top:${h - 2}px;width:${len}px;height:3px;background:#fff;opacity:${1 - l};z-index:4`);
}
