import { ease, progress } from '../core.js';

/** A solid bar grows over the line, then pulls away to the other side, leaving the text behind it. */
export function barReveal(el, t, { start = 0, duration = 0.8, color = '#fff', curve = ease.inOutQuart } = {}) {
  if (!el._labBar) {
    const content = document.createElement('span');
    content.append(...el.childNodes);
    const bar = document.createElement('span');
    Object.assign(bar.style, { position: 'absolute', inset: '0.06em -0.04em', background: color });
    el.style.position = 'relative'; el.style.display = 'inline-block';
    el.append(content, bar);
    el._labBar = { content, bar };
  }
  const { content, bar } = el._labBar, half = start + duration / 2;
  const a = curve(progress(t, start, half)), b = curve(progress(t, half, start + duration));
  bar.style.transformOrigin = t < half ? '0 50%' : '100% 50%';
  bar.style.transform = `scaleX(${t < half ? a : 1 - b})`;
  content.style.opacity = t >= half ? 1 : 0;
}
