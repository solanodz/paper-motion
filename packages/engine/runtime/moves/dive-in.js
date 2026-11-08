import { ease, lerp, progress } from '../core.js';
import { dims, items, show, blur, rectIn, layer, hide, resetAll } from '../kit.js';

/** The camera dives into a detail of A (`target`); B opens inside it as it fills the slot, a ring breaks outward, B's parts rise into focus. */
export function diveIn(a, b, p, { duration = 1.1, target = '[data-part="media"]', depth = 16 } = {}) {
  const slot = a.parentElement, t = a.querySelector(target) ?? a, R = rectIn(t, a), cx = R.x + R.w / 2, cy = R.y + R.h / 2;
  if (p <= 0 || p >= 1) { hide(slot, 'diveRing'); resetAll(a, b, ...items(b)); show(a, b, p); return; }
  const [w, h] = dims(a), full = Math.hypot(Math.max(cx, w - cx), Math.max(cy, h - cy));
  const z = ease.inExpo(progress(p, 0.02, 0.5)), sa = 1 + (depth - 1) * z;
  a.style.transformOrigin = `${cx}px ${cy}px`; a.style.transform = `scale(${sa})`;
  a.style.filter = blur(10 * ease.inQuad(progress(p, 0.25, 0.5))); a.style.opacity = 1 - progress(p, 0.46, 0.56);
  const rad = Math.max((Math.min(R.w, R.h) / 2) * 0.8 * sa, lerp(0, full * 1.05, ease.inOutCubic(progress(p, 0.42, 0.78))));
  const bz = ease.outExpo(progress(p, 0.3, 1)), sb = 1.6 - 0.6 * bz;
  b.style.transformOrigin = `${cx}px ${cy}px`; b.style.transform = `scale(${sb})`; b.style.filter = blur(12 * (1 - bz));
  b.style.clipPath = rad >= full ? 'none' : `circle(${rad / sb}px at ${cx}px ${cy}px)`;
  b.style.opacity = p > 0.1 ? 1 : 0; b.style.zIndex = 3; a.style.zIndex = 2;
  items(b).forEach((c, i) => { const q = ease.outExpo(progress(p, 0.55 + i * 0.035, 0.85 + i * 0.035)); c.style.transform = `translateY(${40 * (1 - q)}px)`; c.style.opacity = q; c.style.filter = blur(8 * (1 - q)); });
  const ring = progress(p, 0.4, 0.82), rr = rad + 60 * ease.outCubic(ring);
  layer(slot, 'diveRing', `display:${ring > 0 && ring < 1 ? 'block' : 'none'};left:${cx - rr}px;top:${cy - rr}px;width:${2 * rr}px;height:${2 * rr}px;border-radius:50%;z-index:4;`
    + `border:${2 + 6 * (1 - ring)}px solid rgba(255,255,255,${0.75 * (1 - ring)})`);
}
