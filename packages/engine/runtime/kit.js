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

// ── a 3D camera over a world ────────────────────────────────────
// A recipe is a world the camera moves through, not a deck of cards. `stage` gets the perspective; `world` holds
// children placed in space with `place()`; the camera's position is applied to the world as its inverse.
//   const cam = camera(stage, world, { perspective: 2000 });
//   cam.place(title, { z: -1200, yaw: 8 });
//   s.update((t) => { cam.travel(t, [[0, { z: 1400 }], [3, { z: -200, yaw: 6 }, ease.inOutCubic]]); cam.focus(0, 900); });
// Rules: never set opacity < 1 on `world` (it flattens its children); fade the placed elements instead.
const CAM = { x: 0, y: 0, z: 0, yaw: 0, pitch: 0, roll: 0, zoom: 1 };
export function camera(stage, world, { perspective = 2000, origin = '50% 50%' } = {}) {
  Object.assign(stage.style, { perspective: `${perspective}px`, perspectiveOrigin: origin });
  Object.assign(world.style, { position: 'absolute', inset: 0, transformStyle: 'preserve-3d', transformOrigin: '50% 50%' });
  const placed = [];
  let pos = { ...CAM };
  const P = perspective;
  const cam = {
    /** Where the camera is (the last `at`/`travel`). */
    get pos() { return pos; },
    /** Puts an element in the world, centred on its own box: { x, y, z, yaw, pitch, roll, scale }. */
    place(el, p = {}) {
      const q = { x: 0, y: 0, z: 0, yaw: 0, pitch: 0, roll: 0, scale: 1, ...p };
      Object.assign(el.style, { position: 'absolute', left: '50%', top: '50%', transformStyle: 'preserve-3d', backfaceVisibility: 'hidden' });
      el.style.transform = `translate(-50%, -50%) translate3d(${q.x}px, ${q.y}px, ${q.z}px) rotateY(${q.yaw}deg) rotateX(${q.pitch}deg) rotateZ(${q.roll}deg) scale(${q.scale})`;
      el._pmPlace = q;
      if (!placed.includes(el)) placed.push(el);
      return el;
    },
    /** Moves the camera: the world gets the inverse transform. Fields missing keep the current value. */
    at(p) {
      pos = { ...pos, ...p };
      world.style.transform = `scale(${pos.zoom}) rotateZ(${-pos.roll}deg) rotateX(${-pos.pitch}deg) rotateY(${-pos.yaw}deg) translate3d(${-pos.x}px, ${-pos.y}px, ${-pos.z}px)`;
      return pos;
    },
    /** Keyframes for the camera: [[t, { x, y, z, yaw, pitch, roll, zoom }, ease?], …]. Fields carry over between frames. */
    travel(t, frames) {
      const full = [];
      let acc = { ...CAM, ...frames[0][1] };
      for (const [time, p, e] of frames) { acc = { ...acc, ...p }; full.push([time, acc, e]); }
      if (t <= full[0][0]) return cam.at(full[0][1]);
      for (let i = 1; i < full.length; i++) {
        const [t1, v1, e = ease.inOutCubic] = full[i], [t0, v0] = full[i - 1];
        if (t <= t1) { const q = e(clamp((t - t0) / (t1 - t0))); return cam.at(Object.fromEntries(Object.keys(CAM).map((k) => [k, lerp(v0[k], v1[k], q)]))); }
      }
      return cam.at(full[full.length - 1][1]);
    },
    /**
     * Depth of field and presence. Blur follows DEPTH: distance from the focal plane `z` ahead of the camera (sharp
     * within a third of `range`, up to `max` px). Presence follows DISTANCE in 3D from the point the camera looks at:
     * a place is whole within `fade`·0.4 and gone by `fade` (default `range`·0.85), so the next place is never
     * peeking into frame while the camera rests, and while it travels the two overlap instead of leaving an empty
     * frame. A place passing the lens softens and fades over the last stretch: it finishes its exit, never cuts.
     * `fade: Infinity` keeps everything present (a focus pull where only the blur should change).
     */
    focus(z = 0, range = 800, max = 12, { fade = range * 0.85 } = {}) {
      const fx = pos.x, fy = pos.y, fz = pos.z - z;          // the point in focus
      for (const el of placed) {
        const q = el._pmPlace;
        const blur = clamp((Math.abs(q.z - fz) - range * 0.33) / range) * max;
        const dist = Math.hypot(q.x - fx, q.y - fy, q.z - fz);
        const present = fade === Infinity ? 1 : 1 - clamp((dist - fade * 0.4) / Math.max(1, fade * 0.6));
        const toLens = pos.z - q.z;                          // distance left before it passes the camera
        const near = clamp((toLens - P * 0.03) / (P * 0.1));   // the last stretch before the lens, whatever the focus range
        const b = Math.max(blur, (1 - near) * max, (1 - present) * max * 0.6);
        el.style.filter = b > 0.3 ? `blur(${b.toFixed(1)}px)` : 'none';
        const o = Math.min(near, present);
        el.style.opacity = String(o);
        el.style.visibility = o < 0.005 ? 'hidden' : '';
      }
    },
  };
  cam.at({});
  return cam;
}
