
/** Red and cyan fringes burst out on each hit and fade. */
export function rgbSplit(el, t, { hits = [0], amount = 22, decay = 6, base = 0 } = {}) {
  let d = base;
  for (const at of hits) { const dt = t - at; if (dt >= 0) d += amount * Math.exp(-decay * dt); }
  el.style.filter = d > 0.3 ? `drop-shadow(${d}px 0 0 rgba(255,30,70,.95)) drop-shadow(${-d}px 0 0 rgba(0,220,255,.95))` : 'none';
}
