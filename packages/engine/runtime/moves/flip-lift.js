import { ease, clamp, progress } from '../core.js';
import { items, show, sp, settle, layer, hide, resetAll } from '../kit.js';

/** A lifts toward the camera, flips with a wobble and a sheen across its face, and lands as B with an echo; B's parts pop in after. */
export function flipLift(a, b, p, { duration = 1.2, lift = 150, perspective = 1800 } = {}) {
  const slot = a.parentElement;
  if (p <= 0 || p >= 1) { hide(slot, 'flEcho'); hide(a, 'sheen'); hide(b, 'sheen'); resetAll(a, b, ...items(b)); a.style.backfaceVisibility = b.style.backfaceVisibility = ''; show(a, b, p); return; }
  slot.style.perspective = `${perspective}px`;
  const L = ease.outCubic(progress(p, 0, 0.22)) * (1 - ease.inOutCubic(progress(p, 0.6, 0.8)));
  const ang = 180 * settle(sp(p, 0.14, duration, { stiffness: 110, damping: 11 }), p);
  const dt = Math.max(0, (p - 0.8) * duration), imp = p > 0.8 ? Math.exp(-dt * 9) * Math.sin(dt * 30) * (1 - progress(p, 0.92, 1)) : 0;
  const tf = (deg) => `translateZ(${lift * L}px) rotateX(${-8 * L}deg) rotateY(${deg}deg) scale(${1 - 0.035 * imp})`;
  a.style.transform = tf(ang); b.style.transform = tf(ang - 180);
  a.style.backfaceVisibility = 'hidden'; b.style.backfaceVisibility = 'hidden'; a.style.opacity = 1; b.style.opacity = 1;
  const turn = Math.abs(Math.sin((ang * Math.PI) / 180));
  for (const [el, off] of [[a, 0], [b, 180]]) {
    const pos = 120 - ((ang - off + 180) / 360) * 140;
    layer(el, 'sheen', `display:block;inset:0;z-index:9;border-radius:inherit;background:linear-gradient(105deg,transparent 38%,rgba(255,255,255,.28) 50%,transparent 62%);background-size:300% 100%;background-position:${pos}% 0;opacity:${0.25 + 0.75 * turn}`);
  }
  a.style.filter = `brightness(${1 - 0.45 * turn})`; b.style.filter = `brightness(${1 - 0.45 * turn})`;
  const e = progress(p, 0.8, 1);
  layer(slot, 'flEcho', `display:${e > 0 && e < 1 ? 'block' : 'none'};inset:0;z-index:0;border-radius:14px;border:1.5px solid rgba(255,255,255,${0.55 * (1 - e)});transform:scale(${1 + 0.14 * ease.outCubic(e)})`);
  items(b).forEach((c, i) => { const q = settle(sp(p, 0.3 + i * 0.035, duration, { stiffness: 240, damping: 14 }), p); c.style.transform = `translateY(${26 * (1 - q)}px) scale(${0.92 + 0.08 * q})`; c.style.opacity = clamp(0.25 + q); });
}
