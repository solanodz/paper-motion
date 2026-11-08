import { ease, clamp, lerp, progress } from '../core.js';
import { dims, items, show, sp, settle, blur, layer, hide, resetAll } from '../kit.js';

/** A's items leave, A folds into a glowing line, a glint runs along it, and B unfolds out of the line with overshoot as its items rise from it. */
export function unfold(a, b, p, { duration = 1.2, radius = 14 } = {}) {
  const slot = a.parentElement, [w, h] = dims(a);
  if (p <= 0 || p >= 1) { hide(slot, 'ufLine'); resetAll(a, b, ...items(a), ...items(b)); show(a, b, p); return; }
  items(a).forEach((c, i) => { const l = progress(p, i * 0.03, i * 0.03 + 0.22); c.style.transform = `translateY(${-30 * ease.inCubic(l)}px)`; c.style.opacity = 1 - l; c.style.filter = blur(10 * l); });
  const f = ease.inOutCubic(progress(p, 0.16, 0.42)), ins = (h / 2 - 1.5) * f;
  a.style.clipPath = `inset(${ins}px 0 ${ins}px 0 round ${lerp(radius, 2, f)}px)`;
  a.style.opacity = p < 0.44 ? 1 : 0;
  const lp = progress(p, 0.36, 0.64), breathe = Math.sin(Math.PI * lp), g = ease.inOutCubic(lp) * 120 - 10;
  layer(slot, 'ufLine', `display:${lp > 0 && lp < 1 ? 'block' : 'none'};left:${(w - w * (1 + 0.08 * breathe)) / 2}px;width:${w * (1 + 0.08 * breathe)}px;top:${h / 2 - 1.5}px;height:3px;z-index:4;border-radius:2px;`
    + `background:linear-gradient(90deg,rgba(255,255,255,.35) ${g - 14}%,#fff ${g}%,rgba(255,255,255,.35) ${g + 14}%);box-shadow:0 0 ${18 * breathe}px rgba(255,255,255,${0.6 * breathe})`);
  const u = settle(sp(p, 0.5, duration, { stiffness: 230, damping: 16 }), p), bi = Math.max(0, (h / 2 - 1.5) * (1 - u));
  b.style.clipPath = `inset(${bi}px 0 ${bi}px 0 round ${lerp(2, radius, clamp(u))}px)`;
  b.style.transform = `scaleY(${1 + Math.max(0, u - 1) * 0.6})`;
  b.style.opacity = p > 0.5 ? 1 : 0;
  items(b).forEach((c, i) => { const q = ease.outExpo(progress(p, 0.6 + i * 0.04, 0.88 + i * 0.03)); c.style.transform = `translateY(${40 * (1 - q)}px)`; c.style.opacity = q; c.style.filter = blur(8 * (1 - q)); });
}
