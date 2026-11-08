import { ease, clamp, lerp } from '../core.js';

/** The element rolls through `list` like a slot machine, one word every `every` seconds; its width follows. */
export function roll(el, list, t, { start = 0, every = 0.9, duration = 0.55, curve = ease.inOutQuart, line = 1.3 } = {}) {
  if (!el._labRoll) {
    el.textContent = '';
    Object.assign(el.style, { display: 'inline-block', overflow: 'hidden', verticalAlign: 'bottom', height: `${line}em`, lineHeight: `${line}em` });
    const strip = document.createElement('span');
    strip.style.display = 'block';
    const items = list.map((w) => { const s = document.createElement('span'); s.textContent = w; Object.assign(s.style, { display: 'block', whiteSpace: 'nowrap', width: 'max-content' }); strip.append(s); return s; });
    el.append(strip);
    el._labRoll = { strip, widths: items.map((s) => s.getBoundingClientRect().width) };
  }
  const { strip, widths } = el._labRoll;
  const x = Math.max(0, t - start) / every;
  let k = Math.floor(x), q = curve(clamp(((x - k) * every) / duration));
  if (k >= list.length - 1) { k = list.length - 1; q = 0; }
  strip.style.transform = `translateY(${-(k + q) * line}em)`;
  el.style.width = `${lerp(widths[k], widths[k + 1] ?? widths[k], q)}px`;
}
