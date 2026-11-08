import { ease, progress } from '../core.js';
import { dims, show, copy } from '../kit.js';

/** A breaks into tiles that lift and swirl outward in a diagonal wave, flipping over in flight, and land as B. */
export function tileSwirl(a, b, p, { cols = 6, rows = 4, lift = 280, perspective = 1600 } = {}) {
  const slot = a.parentElement, [w, h] = dims(a), cw = w / cols, ch = h / rows;
  slot._pmTiles ??= [];
  const tiles = slot._pmTiles;
  if (p <= 0 || p >= 1) { tiles.forEach((t) => { t.style.display = 'none'; }); show(a, b, p); return; }
  slot.style.perspective = `${perspective}px`;
  while (tiles.length < cols * rows) {
    const t = document.createElement('div'); t.className = 'pm-fx';
    t.innerHTML = '<div class="f"></div><div class="f"></div>';
    slot.append(t); tiles.push(t);
  }
  a.style.opacity = 0; b.style.opacity = 0;
  for (let j = 0; j < rows; j++) for (let i = 0; i < cols; i++) {
    const t = tiles[j * cols + i], [front, back] = t.children, x = i * cw, y = j * ch;
    const d = (i / (cols - 1)) * 0.32 + (j / (rows - 1)) * 0.12, q = ease.inOutCubic(progress(p, d, d + 0.56)), arc = Math.sin(Math.PI * q);
    const ox = ((i + 0.5) / cols - 0.5) * w * 0.55 * arc, oy = ((j + 0.5) / rows - 0.5) * h * 0.55 * arc - 50 * arc, spin = (((i * 7 + j * 3) % 5) - 2) * 9 * arc;
    t.style.cssText = `position:absolute;left:${x}px;top:${y}px;width:${Math.ceil(cw) + 1}px;height:${Math.ceil(ch) + 1}px;z-index:${5 + Math.round(arc * 10)};transform-style:preserve-3d;`
      + `transform:translate3d(${ox}px,${oy}px,${lift * arc}px) rotateZ(${spin}deg) rotateY(${180 * q}deg) scale(${1 - 0.18 * arc})`;
    for (const [face, src, flip] of [[front, a, ''], [back, b, 'rotateY(180deg)']]) {
      face.style.cssText = `position:absolute;inset:0;overflow:hidden;backface-visibility:hidden;transform:${flip || 'none'};filter:brightness(${1 - 0.35 * arc})`;
      const c = copy(src); c.style.left = `${-x}px`; c.style.top = `${-y}px`;
      face.replaceChildren(c);
    }
  }
}
