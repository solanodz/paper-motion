import { ease, clamp } from '../core.js';

/** The frame flips over like a card (around Y) and B is on the back; it pulls back mid-flip. */
export function flip3D(a, b, p, { depth = 0.82, perspective = 2400, curve = ease.inOutCubic } = {}) {
  const q = curve(clamp(p)), pull = 1 - (1 - depth) * Math.sin(Math.PI * q);
  a.parentElement.style.perspective = `${perspective}px`;
  if (q < 0.5) { a.style.transform = `scale(${pull}) rotateY(${-180 * q}deg)`; a.style.opacity = 1; b.style.opacity = 0; }
  else { b.style.transform = `scale(${pull}) rotateY(${180 * (1 - q)}deg)`; b.style.opacity = 1; a.style.opacity = 0; }
}
