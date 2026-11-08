// paper-motion/kit: the small helpers the moves share (geometry, springs, effect layers, live copies).
// A move copied into a project with `pamo add` imports them from here, so the copy stays short and editable.
import { ease, clamp, lerp, progress, spring, split } from './core.js';

export const E = (p, curve = ease.inOutCubic) => curve(clamp(p));

export const words = (el) => {
  if (!el._pmWords) {
    // keep <br> line breaks: split each text run into words, leave the breaks where they were
    const parts = [...el.childNodes].flatMap((n) => (n.nodeName === 'BR' ? ['\n'] : (n.textContent ?? '').split(/(\s+)/)));
    el.textContent = '';
    el._pmWords = parts.map((w) => {
      if (w === '\n') { el.append(document.createElement('br')); return null; }
      if (!w) return null;
      if (/^\s+$/.test(w)) { el.append(w); return null; }
      const outer = Object.assign(document.createElement('span'), { style: 'display:inline-block;overflow:hidden;vertical-align:bottom;padding-bottom:0.08em;margin-bottom:-0.08em' });
      const inner = Object.assign(document.createElement('span'), { textContent: w, style: 'display:inline-block' });
      outer.append(inner); el.append(outer);
      return inner;
    }).filter(Boolean);
  }
  return el._pmWords;
};

export const chars = (el) => (el._labChars ??= split(el, 'chars'));

export const hash = (a, b) => { const x = Math.sin(a * 12.9898 + b * 78.233) * 43758.5453; return x - Math.floor(x); };

// integer edges: half-pixel edges of neighbouring rects leave faint seams
export const rects = (list) => list.map(([x, y, w, h]) => { const x0 = Math.floor(x), y0 = Math.floor(y), x1 = Math.ceil(x + w), y1 = Math.ceil(y + h); return `M${x0} ${y0}H${x1}V${y1}H${x0}Z`; }).join('');

export const clipTo = (el, d) => { const v = d ? `path('${d}')` : 'inset(100%)'; el.style.clipPath = v; el.style.webkitClipPath = v; };

export const size = (a, b) => [a.offsetWidth || b.offsetWidth, a.offsetHeight || b.offsetHeight];

/** A horizontal-only blur (an SVG filter shared per id), for motion blur on fast pushes. */
export function hblur(id, std) {
  let f = document.getElementById(id);
  if (!f) {
    const NS = 'http://www.w3.org/2000/svg';
    const svg = document.createElementNS(NS, 'svg');
    svg.setAttribute('width', 0); svg.setAttribute('height', 0); svg.style.position = 'absolute';
    svg.innerHTML = `<filter id="${id}" x="-30%" y="0" width="160%" height="100%" color-interpolation-filters="sRGB"><feGaussianBlur stdDeviation="0 0"/></filter>`;
    document.body.append(svg);
    f = svg.querySelector('filter');
  }
  f.firstElementChild.setAttribute('stdDeviation', `${std} 0`);
  return `url(#${id})`;
}

export const dims = (el) => [el.offsetWidth, el.offsetHeight];

/** Children that are content (not effect layers added by these moves). */
export const items = (el) => [...el.children].filter((c) => !c.classList.contains('pm-fx'));

export const show = (a, b, p) => { a.style.opacity = p >= 1 ? 0 : 1; b.style.opacity = p > 0 ? 1 : 0; };

/** A spring released at progress `start`, in the transition's seconds. */
export const sp = (p, start, duration, o = {}) => spring((p - start) * duration, { stiffness: 200, damping: 18, ...o });

/** Eases any value onto 1 over the last stretch, so a spring lands exactly at p = 1. */
export const settle = (v, p, from = 0.85) => lerp(v, 1, progress(p, from, 1));

export const blur = (px) => (px > 0.3 ? `blur(${px}px)` : 'none');

export const orig = (el, prop) => ((el._pmOrig ??= {})[prop] ??= { inline: el.style[prop], computed: getComputedStyle(el)[prop] });

export const rgba = (c) => { const v = (c.match(/[\d.]+/g) ?? ['0', '0', '0', '0']).map(Number); return [v[0], v[1], v[2], v[3] ?? 1]; };

export const mixRgba = (c1, c2, q) => { const x = rgba(c1), y = rgba(c2); return `rgba(${[0, 1, 2].map((i) => Math.round(lerp(x[i], y[i], q))).join(',')},${lerp(x[3], y[3], q)})`; };

/** Layout rect of `el` relative to `root` (transforms ignored, so it is stable while things move). */
export function rectIn(el, root) { let x = 0, y = 0, n = el; while (n && n !== root) { x += n.offsetLeft; y += n.offsetTop; n = n.offsetParent; } return { x, y, w: el.offsetWidth, h: el.offsetHeight }; }

export const lerpRect = (r1, r2, q) => ({ x: lerp(r1.x, r2.x, q), y: lerp(r1.y, r2.y, q), w: lerp(r1.w, r2.w, q), h: lerp(r1.h, r2.h, q) });

/** An effect layer owned by `host`, made once and restyled every frame. */
export function layer(host, key, css) {
  const k = `_pmFx_${key}`;
  let d = host[k];
  if (!d) { d = host[k] = document.createElement('div'); d.className = 'pm-fx'; host.append(d); }
  d.style.cssText = `position:absolute;pointer-events:none;${css}`;
  return d;
}

export const hide = (host, ...keys) => { for (const k of keys) { const d = host[`_pmFx_${k}`]; if (d) d.style.display = 'none'; } };

export const resetAll = (...els) => { for (const e of els) for (const k of ['transform', 'opacity', 'filter', 'clipPath', 'transformOrigin']) e.style[k] = ''; };

/** Live copies of `el` drawn into `host` (for moves that cut a component into pieces). */
export function copy(el) {
  const c = el.cloneNode(true);
  c.querySelectorAll('.pm-fx').forEach((x) => x.remove());
  Object.assign(c.style, { position: 'absolute', left: '0', top: '0', right: 'auto', bottom: 'auto', width: `${el.offsetWidth}px`, height: `${el.offsetHeight}px`, margin: '0', transform: 'none', opacity: '1', clipPath: 'none', filter: 'none', zIndex: 'auto' });
  return c;
}

export const partsOf = (el) => new Map([...el.querySelectorAll('[data-part]')].map((e) => [e.dataset.part, e]));
