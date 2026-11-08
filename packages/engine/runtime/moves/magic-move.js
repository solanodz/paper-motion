import { ease, clamp, lerp, progress } from '../core.js';
import { show, sp, settle, blur, orig, mixRgba, rectIn, lerpRect, layer, hide, resetAll, partsOf } from '../kit.js';

/**
 * Magic move: parts with the same `data-part` in A and B fly from A's place and size to B's, each on its own spring,
 * a few frames apart; text parts scale evenly and cross-blur; parts only in A leave, parts only in B pop in.
 * The box behind (background, border, corners) reshapes from A's to B's.
 */
export function magicMove(a, b, p, { duration = 1.1, stagger = 0.045, stiffness = 190, damping = 17 } = {}) {
  const slot = a.parentElement, PA = partsOf(a), PB = partsOf(b);
  const bgA = orig(a, 'backgroundColor'), bgB = orig(b, 'backgroundColor'), bcA = orig(a, 'borderTopColor'), bcB = orig(b, 'borderTopColor');
  const parts = [...PA.values(), ...PB.values()];
  if (p <= 0 || p >= 1) {
    hide(slot, 'mmBox'); resetAll(...parts);
    a.style.backgroundColor = bgA.inline; b.style.backgroundColor = bgB.inline; a.style.borderColor = bcA.inline; b.style.borderColor = bcB.inline;
    a.style.overflow = ''; b.style.overflow = ''; show(a, b, p); return;
  }
  const RA = rectIn(a, slot), RB = rectIn(b, slot), cq = settle(sp(p, 0, duration, { stiffness: stiffness * 0.65, damping: damping * 0.9 }), p), R = lerpRect(RA, RB, cq);
  const k = progress(p, 0.14, 0.5, ease.inOutCubic); // colour, border and corners change while the content swaps
  const bw = lerp(parseFloat(orig(a, 'borderTopWidth').computed) || 0, parseFloat(orig(b, 'borderTopWidth').computed) || 0, k);
  const rad = lerp(parseFloat(orig(a, 'borderTopLeftRadius').computed) || 0, parseFloat(orig(b, 'borderTopLeftRadius').computed) || 0, k);
  layer(slot, 'mmBox', `left:${R.x}px;top:${R.y}px;width:${R.w}px;height:${R.h}px;box-sizing:border-box;z-index:1;background:${mixRgba(bgA.computed, bgB.computed, k)};border:${bw}px solid ${mixRgba(bcA.computed, bcB.computed, k)};border-radius:${rad}px`);
  a.style.backgroundColor = 'transparent'; b.style.backgroundColor = 'transparent'; a.style.borderColor = 'transparent'; b.style.borderColor = 'transparent';
  a.style.overflow = 'visible'; b.style.overflow = 'visible';
  a.style.opacity = 1; b.style.opacity = 1; a.style.zIndex = 2; b.style.zIndex = 3;
  [...new Set([...PA.keys(), ...PB.keys()])].forEach((key, i) => {
    const ea = PA.get(key), eb = PB.get(key), t0 = 0.04 + i * stagger;
    if (ea && eb) {
      const q = settle(sp(p, t0, duration, { stiffness, damping }), p), ra = rectIn(ea, slot), rb = rectIn(eb, slot), r = lerpRect(ra, rb, q);
      const text = !ea.children.length && !eb.children.length;
      const place = (e, e0) => {
        const sx = r.w / e0.w, sy = r.h / e0.h;
        e.style.transformOrigin = '50% 50%';
        e.style.transform = `translate(${r.x + r.w / 2 - (e0.x + e0.w / 2)}px, ${r.y + r.h / 2 - (e0.y + e0.h / 2)}px) scale(${text ? sy : sx}, ${sy})`;
      };
      place(ea, ra); place(eb, rb);
      // boxes stretch when their shapes differ, so they hand over sooner than text does
      const fa = text ? progress(p, t0 + 0.08, t0 + 0.36) : progress(p, t0 + 0.02, t0 + 0.18), fb = text ? progress(p, t0 + 0.16, t0 + 0.46) : progress(p, t0 + 0.08, t0 + 0.34);
      ea.style.opacity = 1 - fa; ea.style.filter = blur(fa < 1 ? 9 * fa : 0);
      eb.style.opacity = fb; eb.style.filter = blur(9 * (1 - fb));
    } else if (ea) {
      const l = progress(p, t0, t0 + 0.3, ease.inCubic);
      ea.style.transform = `translateY(${-26 * l}px) scale(${1 - 0.1 * l})`; ea.style.opacity = 1 - l; ea.style.filter = blur(10 * l);
    } else {
      const q = settle(sp(p, 0.35 + t0, duration, { stiffness: 260, damping: 15 }), p);
      eb.style.transform = `scale(${0.7 + 0.3 * q})`; eb.style.opacity = clamp(q * 1.5); eb.style.filter = blur(8 * clamp(1 - q));
    }
  });
}
