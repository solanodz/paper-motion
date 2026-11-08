import { ease, clamp, lerp, progress } from '../core.js';
import { dims, items, show, sp, settle, layer, hide, resetAll } from '../kit.js';

/** A winds up, then whips out tilted and smeared; a light streak crosses at full speed; B whips in, overshoots and settles, its content trailing. */
export function whipPan(a, b, p, { duration = 0.9, dir = 'left', tilt = 7, travel = 1.35 } = {}) {
  const slot = a.parentElement, [w] = dims(a), s = dir === 'left' ? -1 : 1;
  if (p <= 0 || p >= 1) { hide(slot, 'wpStreak'); resetAll(a, b, ...items(a), ...items(b)); show(a, b, p); return; }
  const wind = ease.outCubic(progress(p, 0, 0.18)) * (1 - ease.inCubic(progress(p, 0.18, 0.3)));
  const out = ease.inExpo(progress(p, 0.16, 0.5));
  a.style.transformOrigin = '50% 70%';
  a.style.transform = `translateX(${-s * 40 * wind + s * w * travel * out}px) rotate(${-s * 1.6 * wind + s * tilt * out}deg) skewX(${-s * 12 * out}deg) scale(${1 - 0.03 * wind})`;
  a.style.opacity = p < 0.5 ? 1 : 0;
  const e = settle(sp(p, 0.42, duration, { stiffness: 250, damping: 19 }), p), r = 1 - e;
  b.style.transformOrigin = '50% 70%';
  b.style.transform = `translateX(${-s * w * travel * r}px) rotate(${-s * tilt * r}deg) skewX(${s * 12 * clamp(r) * clamp(r)}deg)`;
  b.style.opacity = p > 0.42 ? 1 : 0;
  items(b).forEach((c, i) => { const ci = settle(sp(p, 0.47 + i * 0.03, duration, { stiffness: 230, damping: 17 }), p); c.style.transform = `translateX(${-s * 110 * (1 - ci)}px)`; });
  const st = progress(p, 0.28, 0.64), so = Math.sin(Math.PI * st), sw = w * 0.45;
  layer(slot, 'wpStreak', `display:${so > 0.01 ? 'block' : 'none'};left:${lerp(s < 0 ? w : -sw, s < 0 ? -sw : w, ease.inOutCubic(st))}px;top:-15%;width:${sw}px;height:130%;z-index:5;opacity:${0.7 * so};`
    + `background:linear-gradient(90deg,transparent,rgba(255,255,255,.85),transparent);transform:skewX(${-s * 18}deg);mix-blend-mode:screen;filter:blur(16px)`);
}
