import { clamp, lerp, progress } from '../core.js';
import { dims, show, sp, settle, resetAll, copy } from '../kit.js';

/** A vertical reel of cards (copies of A and B between them) scrolls past in 3D and snaps onto B; neighbours dim, shrink and tilt away. */
export function snapScroll(a, b, p, { duration = 1.2, count = 3, gap = 0.1, perspective = 1600 } = {}) {
  const slot = a.parentElement, [, h] = dims(a);
  slot._pmReel ??= [];
  const reel = slot._pmReel;
  if (p <= 0 || p >= 1) { reel.forEach((g) => { g.style.display = 'none'; }); resetAll(a, b); show(a, b, p); return; }
  slot.style.perspective = `${perspective}px`;
  while (reel.length < count - 1) { const g = document.createElement('div'); g.className = 'pm-fx'; g.style.position = 'absolute'; slot.append(g); reel.push(g); }
  const list = [a];
  for (let j = 1; j < count; j++) { const g = reel[j - 1], src = j % 2 ? b : a; g.replaceChildren(copy(src)); Object.assign(g.style, { display: 'block', left: `${src.offsetLeft}px`, top: `${src.offsetTop}px`, width: `${src.offsetWidth}px`, height: `${src.offsetHeight}px`, zIndex: 1 }); list.push(g); }
  list.push(b);
  const pos = count * settle(sp(p, 0, duration, { stiffness: 55, damping: 10 }), p, 0.8), env = progress(p, 0, 0.15) * (1 - progress(p, 0.85, 1));
  list.forEach((el, j) => {
    const d = j - pos, foc = clamp(1 - Math.abs(d)), near = Math.abs(d) < 2.2;
    el.style.transform = `translateY(${d * h * (1 + gap)}px) rotateX(${-d * 16}deg) scale(${0.8 + 0.2 * foc})`;
    el.style.filter = `brightness(${0.3 + 0.7 * foc})`;
    el.style.opacity = near ? lerp(env, 1, foc) * (1 - clamp(Math.abs(d) - 1.2)) : 0;
    el.style.zIndex = Math.round(10 - Math.abs(d) * 3);
  });
}
