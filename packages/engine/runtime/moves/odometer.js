import { ease, clamp, lerp, progress } from '../core.js';

/** Counts from `from` to `to` on rolling digit wheels; a wheel only turns when the one to its right rolls over. */
export function odometer(el, t, { from = 0, to = 1000, start = 0, duration = 2, curve = ease.outExpo, separator = ',' } = {}) {
  const v = lerp(from, to, curve(progress(t, start, start + duration)));
  if (!el._labOdo) {
    const nd = String(Math.round(Math.max(from, to))).length;
    el.textContent = '';
    const probe = document.createElement('span'); el.append(probe);
    const w = Math.max(...'0123456789'.split('').map((d) => { probe.textContent = d; return probe.getBoundingClientRect().width; }));
    probe.remove();
    el._labOdo = [];
    for (let i = 0; i < nd; i++) {
      const k = nd - 1 - i;
      const col = document.createElement('span');
      Object.assign(col.style, { display: 'inline-block', overflow: 'hidden', height: '1em', lineHeight: '1em', width: `${w}px`, textAlign: 'center', verticalAlign: 'bottom' });
      const strip = document.createElement('span');
      strip.style.display = 'block';
      strip.innerHTML = '01234567890'.split('').map((d) => `<span style="display:block">${d}</span>`).join('');
      col.append(strip); el.append(col);
      el._labOdo.push({ k, col, strip });
      if (separator && k > 0 && k % 3 === 0) { const s = document.createElement('span'); s.textContent = separator; s.style.verticalAlign = 'bottom'; s.style.lineHeight = '1em'; s.dataset.k = k; el.append(s); el._labOdo.push({ k, sep: s }); }
    }
  }
  for (const d of el._labOdo) {
    const on = d.k === 0 || v >= 10 ** d.k ? 1 : 0.16;
    if (d.sep) { d.sep.style.opacity = on; continue; }
    const pos = d.k === 0 ? v % 10 : (Math.floor(v / 10 ** d.k) % 10) + clamp(((v / 10 ** (d.k - 1)) % 10) - 9);
    d.strip.style.transform = `translateY(${-pos}em)`;
    d.col.style.opacity = on;
  }
}
