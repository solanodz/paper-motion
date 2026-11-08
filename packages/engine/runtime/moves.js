// paper-motion moves: named, reusable pieces of motion. Each is a pure function of time or progress
// that sets styles on elements, so it can be called from s.update() and stays frame-exact.
//   import { wipe, typeOn, PACE } from 'paper-motion/moves';
// Transitions take progress p (0 → 1); text and camera moves take scene time t.
import { ease, clamp, lerp, progress, rng, noise, spring, split } from './index.js';

/** Timing per pace: transition length, hold between beats, stagger between items (seconds). */
export const PACE = {
  calm: { enter: 1.0, hold: 2.6, stagger: 0.12 },
  medium: { enter: 0.5, hold: 1.6, stagger: 0.08 },
  fast: { enter: 0.25, hold: 0.8, stagger: 0.05 },
};

/** Every move by name, with what it does, so skills can list and demo them. */
export const MOVES = {
  cut: 'hard cut from A to B, on the beat',
  crossfade: 'A dissolves into B',
  wipe: 'a soft diagonal edge uncovers B',
  push: 'B pushes A out of frame',
  maskReveal: 'B is revealed from one edge, behind a hard mask line',
  scanReveal: 'B draws in under a moving scan line',
  zoomThrough: 'the camera dives through A and lands on B',
  typeOn: 'text types itself, terminal style, with a block cursor',
  wordRise: 'words rise one by one from behind a mask line',
  blurIn: 'text comes into focus from a blur',
  trackIn: 'letters settle from wide spacing to their tracking',
  drift: 'a slow, constant push-in that keeps a still frame alive',
  scramble: 'letters cycle through random glyphs and lock into place, left to right',
  popIn: 'letters pop up one by one on a spring, with a little overshoot',
  flipIn: 'letters flip up into place in 3D, one after another',
  roll: 'the last word rolls like a slot machine through a list of words',
  odometer: 'a number counts up with rolling digit wheels, like an odometer',
  barReveal: 'a solid bar sweeps across and leaves the line behind it',
  whip: 'a fast push with horizontal motion blur',
  cells: 'B appears through a grid of squares that grow in a diagonal wave',
  slices: 'B comes in as horizontal strips from alternating sides',
  iris: 'B opens from a circle that grows out of a point',
  glitch: 'a few frames of torn bands and RGB split, then B',
  flip3D: 'the frame flips over like a card and shows B on the back',
  shake: 'a camera shake on each hit that dies out fast',
  punch: 'the frame punches in on each hit and springs back',
  orbit: 'a 3D camera moves around layers set at different depths',
  rgbSplit: 'red and cyan fringes burst out on each hit and fade',
  flash: 'an overexposed white flash hides the cut from A to B',
  drawOn: 'lines and shapes draw themselves stroke by stroke',
  magicMove: 'each part of A flies on its own spring into the matching part of B; text cross-blurs; the box reshapes',
  whipPan: 'A winds up, whips out tilted and smeared under a light streak; B whips in, overshoots, its content trails',
  diveIn: 'the camera dives into a detail of A; B opens inside it, a ring breaks outward, B\'s parts rise into focus',
  flipLift: 'A lifts toward the camera, flips with a wobble and a sheen, lands as B with an echo; B\'s parts pop in',
  squashDrop: 'A squashes, launches up stretched; B falls in, squashes on impact, wobbles; its content follows through',
  snapScroll: 'a vertical reel of cards scrolls past in 3D and snaps onto B; neighbours dim and tilt away',
  unfold: 'A\'s items leave, A folds into a glowing line, B unfolds out of the line with overshoot, items rise from it',
  tileSwirl: 'A breaks into tiles that lift and swirl in a wave, flipping over in flight to land as B',
};

const E = (p, curve = ease.inOutCubic) => curve(clamp(p));

// ── transitions: (a, b, p, options) ─────────────────────────────

export function cut(a, b, p) { a.style.opacity = p < 1 ? 1 : 0; b.style.opacity = p < 1 ? 0 : 1; }

export function crossfade(a, b, p, { curve } = {}) {
  const q = E(p, curve);
  a.style.opacity = 1 - q; b.style.opacity = q;
}

/** B is uncovered by a soft edge at `angle` degrees; A stays underneath. */
export function wipe(a, b, p, { angle = 100, soft = 30, curve } = {}) {
  const w = E(p, curve) * (100 + soft) - soft;
  const m = `linear-gradient(${angle}deg, #000 ${w}%, transparent ${w + soft}%)`;
  b.style.opacity = 1; b.style.maskImage = m; b.style.webkitMaskImage = m;
  if (a) a.style.opacity = p >= 1 ? 0 : 1;
}

/** B pushes A out; `dir` is where A leaves to. */
export function push(a, b, p, { dir = 'left', curve = ease.inOutQuart } = {}) {
  const q = E(p, curve);
  const horiz = dir === 'left' || dir === 'right';
  const size = horiz ? (a.offsetWidth || b.offsetWidth) : (a.offsetHeight || b.offsetHeight);
  const s = dir === 'left' || dir === 'up' ? -1 : 1;
  const ax = q * size * s, bx = (q - 1) * size * s;
  a.style.transform = horiz ? `translateX(${ax}px)` : `translateY(${ax}px)`;
  b.style.transform = horiz ? `translateX(${bx}px)` : `translateY(${bx}px)`;
  a.style.opacity = 1; b.style.opacity = 1;
}

/** B is revealed from an edge (`from`: bottom, top, left, right) behind a hard mask. */
export function maskReveal(a, b, p, { from = 'bottom', curve = ease.outExpo } = {}) {
  const r = (1 - E(p, curve)) * 100;
  const inset = { bottom: `${r}% 0 0 0`, top: `0 0 ${r}% 0`, left: `0 ${r}% 0 0`, right: `0 0 0 ${r}%` }[from];
  b.style.clipPath = `inset(${inset})`; b.style.opacity = 1;
  if (a) a.style.opacity = p >= 1 ? 0 : 1;
}

/** B draws in from the top under a scan line element (`line`, absolutely positioned inside B's parent). */
export function scanReveal(a, b, p, { line, curve = ease.linear } = {}) {
  const q = E(p, curve);
  b.style.clipPath = `inset(0 0 ${(1 - q) * 100}% 0)`; b.style.opacity = 1;
  if (line) { line.style.top = `${b.offsetTop + q * b.offsetHeight}px`; line.style.opacity = q > 0 && q < 1 ? 1 : 0; }
  if (a) a.style.opacity = p >= 1 ? 0 : 1;
}

/** The camera dives through A (scaling past the lens) and lands on B. */
/** `origin` is where the camera dives in (put it on the subject, e.g. '30% 50%'). B lands from slightly larger, so no edge shows. */
export function zoomThrough(a, b, p, { scale = 6, origin = '50% 50%', curve = ease.inOutCubic } = {}) {
  const q = E(p, curve);
  a.style.transformOrigin = origin;
  a.style.transform = `scale(${1 + (scale - 1) * Math.pow(q, 2)})`;
  a.style.opacity = 1 - clamp((q - 0.55) / 0.3);
  b.style.transform = `scale(${1.12 - 0.12 * q})`;
  b.style.opacity = clamp((q - 0.45) / 0.35);
}

// ── text: (el, t, options) ──────────────────────────────────────

/**
 * When each character of `text` appears, typed by a person: quick bursts inside words, a beat after spaces,
 * longer after punctuation, the odd hesitation. Deterministic per seed. Use the same times for the text
 * (typeOn's `times`) and the sound (keySounds), so every letter lands on its keystroke.
 * @returns {number[]} times in seconds, one per character
 */
export function typingTimes(text, { start = 0, cps = 11, seed = 1 } = {}) {
  const r = rng(seed).next, base = 1 / cps, out = [];
  let t = start;
  for (let i = 0; i < text.length; i++) {
    const prev = text[i - 1] ?? '', ch = text[i];
    let k = 0.7 + 0.45 * r();                             // inside a word: fast, uneven
    if (prev === ' ') k = 1.35 + 0.5 * r();               // starting a new word
    if (/[.,;:!?]/.test(prev)) k = 2.2 + 1.2 * r();       // after punctuation
    if (/[\/\-_@]/.test(ch) || /[\/\-_@]/.test(prev)) k *= 1.25; // symbols need a reach
    if (r() < 0.04) k *= 2.4;                             // a hesitation
    t += i === 0 ? 0 : base * k;
    out.push(t);
  }
  return out;
}

/** Schedules one keystroke sound per character at `times` (from typingTimes), plus an optional enter. */
export function keySounds(s, text, times, { bank, style, gain = 0.16, seed = 1, enter = null, pan = 0.04 } = {}) {
  [...text].forEach((ch, i) => s.sfx(times[i], 'key', { kind: ch === ' ' ? 'space' : 'letter', gain, seed: seed * 1000 + i, pan: ((i % 5) - 2) * pan, ...(bank ? { bank } : {}), ...(style ? { style } : {}) }));
  if (enter !== null) s.sfx(enter, 'key', { kind: 'enter', gain: gain * 1.1, seed: seed * 1000 + 999, ...(bank ? { bank } : {}), ...(style ? { style } : {}) });
}

/** Types `text` from `start` at `cps` characters a second, or at explicit `times` (typingTimes); `cursor` (an element) is solid while typing, blinks at `blink` Hz after. */
export function typeOn(el, text, t, { start = 0, cps = 35, times = null, cursor = null, blink = 2.2 } = {}) {
  if (times) start = times[0] ?? start;
  const n = times ? times.filter((x) => x <= t).length : clamp(Math.floor((t - start) * cps), 0, text.length);
  el.textContent = text.slice(0, n);
  if (cursor) {
    const typing = t >= start && (n < text.length || (times && t - times[times.length - 1] < 0.25));
    cursor.style.opacity = t < start ? 0 : typing || Math.floor((t - start) * blink * 2) % 2 === 0 ? 1 : 0;
  }
  return n;
}

const words = (el) => {
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

/** Words rise one by one from behind a mask line. */
export function wordRise(el, t, { start = 0, each = 0.08, duration = 0.5, curve = ease.outExpo } = {}) {
  words(el).forEach((w, i) => {
    const q = curve(progress(t, start + i * each, start + i * each + duration));
    w.style.transform = `translateY(${(1 - q) * 110}%)`;
  });
}

/** Text comes into focus from a blur. */
export function blurIn(el, t, { start = 0, duration = 0.8, blur = 14, curve = ease.outCubic } = {}) {
  const q = curve(progress(t, start, start + duration));
  el.style.filter = `blur(${(1 - q) * blur}px)`; el.style.opacity = q;
}

/** Letters settle from wide spacing (`from`, em) to `to`. */
export function trackIn(el, t, { start = 0, duration = 1.0, from = 0.4, to = 0, curve = ease.outExpo } = {}) {
  const q = curve(progress(t, start, start + duration));
  el.style.letterSpacing = `${from + (to - from) * q}em`; el.style.opacity = Math.min(1, q * 2);
}

// ── camera ──────────────────────────────────────────────────────

/** A slow constant push-in over `duration` seconds (default: the whole scene). */
export function drift(el, t, { amount = 0.04, duration = 10, origin = '50% 50%' } = {}) {
  el.style.transformOrigin = origin;
  el.style.transform = `scale(${1 + amount * clamp(t / duration)})`;
}

// ── helpers for the moves below ─────────────────────────────────

const chars = (el) => (el._labChars ??= split(el, 'chars'));
const hash = (a, b) => { const x = Math.sin(a * 12.9898 + b * 78.233) * 43758.5453; return x - Math.floor(x); };
// integer edges: half-pixel edges of neighbouring rects leave faint seams
const rects = (list) => list.map(([x, y, w, h]) => { const x0 = Math.floor(x), y0 = Math.floor(y), x1 = Math.ceil(x + w), y1 = Math.ceil(y + h); return `M${x0} ${y0}H${x1}V${y1}H${x0}Z`; }).join('');
const clipTo = (el, d) => { const v = d ? `path('${d}')` : 'inset(100%)'; el.style.clipPath = v; el.style.webkitClipPath = v; };
const size = (a, b) => [a.offsetWidth || b.offsetWidth, a.offsetHeight || b.offsetHeight];

/** A horizontal-only blur (an SVG filter shared per id), for motion blur on fast pushes. */
function hblur(id, std) {
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

// ── more text ─────────────────────────────────────────────────────────

/** Letters show random glyphs, then lock into the real text from left to right. Widths stay fixed. */
export function scramble(el, t, { start = 0, duration = 1.4, fps = 30, rate = 2, seed = 1, glyphs = 'ABCDEFGHJKLMNPQRSTUVWXYZ0123456789#%&*+=/<>' } = {}) {
  const cs = chars(el);
  if (!el._labText) {
    el._labText = cs.map((c) => c.textContent);
    cs.forEach((c) => { c.style.width = `${c.getBoundingClientRect().width}px`; c.style.textAlign = 'center'; });
    const r = rng(seed); el._labJit = cs.map(() => r.next());
  }
  const n = cs.length, tick = Math.floor((t * fps) / rate);
  cs.forEach((c, i) => {
    const appear = start + (i / n) * duration * 0.35;
    const settle = start + duration * (0.3 + 0.7 * (i / n)) + el._labJit[i] * 0.1;
    if (t < appear) { c.style.opacity = 0; return; }
    if (t >= settle) { c.textContent = el._labText[i]; c.style.opacity = 1; return; }
    c.textContent = glyphs[Math.floor(hash(tick + seed, i) * glyphs.length)];
    c.style.opacity = 0.5;
  });
}

/** Letters pop up from the baseline on a spring. */
export function popIn(el, t, { start = 0, each = 0.04, stiffness = 260, damping = 13, rise = 0.45 } = {}) {
  chars(el).forEach((c, i) => {
    const dt = t - (start + i * each), q = spring(dt, { stiffness, damping });
    c.style.transformOrigin = '50% 90%';
    c.style.transform = `translateY(${(1 - q) * rise}em) scale(${q})`;
    c.style.opacity = clamp(dt / 0.06);
  });
}

/** Letters flip up into place around their baseline, in 3D. */
export function flipIn(el, t, { start = 0, each = 0.045, duration = 0.8, angle = -100, curve = ease.outBack } = {}) {
  chars(el).forEach((c, i) => {
    const p = progress(t, start + i * each, start + i * each + duration), q = curve(p);
    c.style.transformOrigin = '50% 100% -0.2em';
    c.style.transform = `perspective(700px) rotateX(${angle * (1 - q)}deg)`;
    c.style.opacity = clamp(p * 3);
  });
}

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

// ── transitions ─────────────────────────────────────────────────

/** B pushes A out very fast, with horizontal motion blur that follows the speed. `dir` is where A leaves to. */
export function whip(a, b, p, { dir = 'left', blur = 70, curve = ease.inOutQuint } = {}) {
  const q = curve(clamp(p)), v = (curve(clamp(p + 0.01)) - curve(clamp(p - 0.01))) / 0.02;
  const [w] = size(a, b), s = dir === 'left' ? -1 : 1;
  a.style.transform = `translateX(${q * w * s}px)`;
  b.style.transform = `translateX(${(q - 1) * w * s}px)`;
  const f = v > 0.15 ? hblur('lab-whip', (blur * v) / 5) : 'none';
  a.style.filter = f; b.style.filter = f;
  a.style.opacity = 1; b.style.opacity = 1;
}

/** B shows through a grid of squares that grow from their centres in a wave from `origin` (0..1, 0..1). */
export function cells(a, b, p, { cols = 16, rows = 9, origin = [0, 0], spread = 0.6, curve = ease.outCubic } = {}) {
  if (p >= 1) { b.style.clipPath = 'none'; b.style.opacity = 1; return; }
  const [w, h] = size(a, b), cw = w / cols, ch = h / rows, max = Math.hypot(Math.max(origin[0], 1 - origin[0]), Math.max(origin[1], 1 - origin[1]));
  const list = [];
  for (let j = 0; j < rows; j++) for (let i = 0; i < cols; i++) {
    const d = (spread * Math.hypot((i + 0.5) / cols - origin[0], (j + 0.5) / rows - origin[1])) / max;
    const q = curve(clamp((p - d) / (1 - spread)));
    if (q <= 0) continue;
    const k = Math.min(1, q * 1.08), sw = cw * k, sh = ch * k; // close the last hairline before the curve settles
    list.push([i * cw + (cw - sw) / 2, j * ch + (ch - sh) / 2, sw, sh]);
  }
  clipTo(b, rects(list)); b.style.opacity = 1;
}

/** B comes in as `n` horizontal strips, alternating left and right, staggered top to bottom. */
export function slices(a, b, p, { n = 8, each = 0.05, curve = ease.outExpo } = {}) {
  if (p >= 1) { b.style.clipPath = 'none'; b.style.opacity = 1; return; }
  const [w, h] = size(a, b), sh = h / n, span = 1 - each * (n - 1), list = [];
  for (let i = 0; i < n; i++) {
    const q = curve(clamp((p - i * each) / span));
    if (q <= 0) continue;
    list.push(i % 2 ? [w * (1 - q), i * sh, w * q, sh + 1] : [0, i * sh, w * q, sh + 1]);
  }
  clipTo(b, rects(list)); b.style.opacity = 1;
}

/** B opens from a circle growing out of (x, y); A sinks back a little. */
export function iris(a, b, p, { x = '50%', y = '50%', curve = ease.inOutCubic } = {}) {
  const q = curve(clamp(p)), [w, h] = size(a, b);
  const r = q * Math.hypot(w, h) * 0.55;
  const v = q >= 1 ? 'none' : `circle(${r}px at ${x} ${y})`;
  b.style.clipPath = v; b.style.webkitClipPath = v; b.style.opacity = 1;
  b.style.transform = `scale(${1.1 - 0.1 * q})`;
  a.style.transform = `scale(${1 - 0.06 * q})`;
}

/** A few frames of torn bands, jitter and RGB split; the bands show more of B until B holds. */
export function glitch(a, b, p, { seed = 1, steps = 22, rgb = 16, shift = 140 } = {}) {
  const fringe = (el, s) => { for (const c of el.children) c.style.filter = s > 0.3 ? `drop-shadow(${s}px 0 0 rgba(255,30,70,.9)) drop-shadow(${-s}px 0 0 rgba(0,220,255,.9))` : 'none'; };
  if (p <= 0) { clipTo(b, ''); return; }
  if (p >= 1) { b.style.clipPath = 'none'; b.style.opacity = 1; fringe(a, 0); fringe(b, 0); return; }
  const r = rng(seed * 997 + Math.floor(p * steps)).next, amt = Math.sin(Math.PI * p), cover = clamp((p - 0.1) / 0.75);
  const [w, h] = size(a, b), list = [];
  for (let y = 0; y < h;) { const bh = h * (0.015 + 0.11 * r()); if (r() < cover) list.push([0, y, w, bh + 1]); y += bh; }
  clipTo(b, rects(list)); b.style.opacity = 1;
  b.style.transform = `translateX(${(r() - 0.5) * shift * amt}px)`;
  a.style.transform = `translateX(${(r() - 0.5) * shift * 0.6 * amt}px)`;
  fringe(a, rgb * amt * r()); fringe(b, rgb * amt);
}

/** The frame flips over like a card (around Y) and B is on the back; it pulls back mid-flip. */
export function flip3D(a, b, p, { depth = 0.82, perspective = 2400, curve = ease.inOutCubic } = {}) {
  const q = curve(clamp(p)), pull = 1 - (1 - depth) * Math.sin(Math.PI * q);
  a.parentElement.style.perspective = `${perspective}px`;
  if (q < 0.5) { a.style.transform = `scale(${pull}) rotateY(${-180 * q}deg)`; a.style.opacity = 1; b.style.opacity = 0; }
  else { b.style.transform = `scale(${pull}) rotateY(${180 * (1 - q)}deg)`; b.style.opacity = 1; a.style.opacity = 0; }
}

/** An overexposed white flash: A burns out, the cut happens at the peak, B comes back from the white. */
export function flash(a, b, p, { color = '#fff', bloom = 18, peak = 0.4 } = {}) {
  const parent = a.parentElement;
  let o = parent.querySelector(':scope > .lab-flash');
  if (!o) { o = document.createElement('div'); o.className = 'lab-flash'; Object.assign(o.style, { position: 'absolute', inset: 0, background: color, pointerEvents: 'none', zIndex: 50 }); parent.append(o); }
  const up = ease.inCubic(clamp(p / peak)), down = 1 - ease.outCubic(clamp((p - peak) / (1 - peak)));
  const k = p < peak ? up : down;
  o.style.opacity = p <= 0 || p >= 1 ? 0 : k;
  const cur = p < peak ? a : b;
  a.style.opacity = p < peak ? 1 : 0; b.style.opacity = p < peak ? 0 : 1;
  cur.style.filter = k > 0.02 ? `blur(${bloom * k}px) brightness(${1 + 1.5 * k})` : 'none';
  cur.style.transform = `scale(${1 + 0.04 * k})`;
}

// ── camera ──────────────────────────────────────────────────────

/** A camera shake on each time in `hits`, dying out at `decay`. */
export function shake(el, t, { hits = [0], amount = 34, rot = 1.4, decay = 7, freq = 24, seed = 1 } = {}) {
  let x = 0, y = 0, r = 0;
  for (const [i, at] of hits.entries()) {
    const dt = t - at;
    if (dt < 0) continue;
    const e = Math.exp(-decay * dt), z = (seed + i) * 3.1;
    x += amount * e * (noise(dt * freq, z, 0) * 2 - 1);
    y += amount * e * (noise(dt * freq, z, 5) * 2 - 1);
    r += rot * e * (noise(dt * freq, z, 9) * 2 - 1);
  }
  el.style.transform = `translate(${x}px, ${y}px) rotate(${r}deg)`;
}

/** The frame jumps in by `amount` on each hit and springs back. */
export function punch(el, t, { hits = [0], amount = 0.09, stiffness = 420, damping = 16, origin = '50% 50%' } = {}) {
  let s = 1;
  for (const at of hits) { const dt = t - at; if (dt >= 0) s += amount * (1 - spring(dt, { stiffness, damping })); }
  el.style.transformOrigin = origin;
  el.style.transform = `scale(${s})`;
}

/** A 3D camera around a world whose children sit at different translateZ. Ranges are [from, to]. */
export function orbit(world, t, { start = 0, duration = 5, yaw = [-20, 20], pitch = [8, -6], dolly = [-200, 200], curve = ease.inOutSine } = {}) {
  const q = curve(progress(t, start, start + duration));
  world.style.transformStyle = 'preserve-3d';
  world.style.transform = `translateZ(${lerp(...dolly, q)}px) rotateX(${lerp(...pitch, q)}deg) rotateY(${lerp(...yaw, q)}deg)`;
}

/** Red and cyan fringes burst out on each hit and fade. */
export function rgbSplit(el, t, { hits = [0], amount = 22, decay = 6, base = 0 } = {}) {
  let d = base;
  for (const at of hits) { const dt = t - at; if (dt >= 0) d += amount * Math.exp(-decay * dt); }
  el.style.filter = d > 0.3 ? `drop-shadow(${d}px 0 0 rgba(255,30,70,.95)) drop-shadow(${-d}px 0 0 rgba(0,220,255,.95))` : 'none';
}

/** Every stroke in `svg` (paths, lines, circles, rects, polylines) draws itself, one after another. */
export function drawOn(svg, t, { start = 0, each = 0.12, duration = 1.2, curve = ease.inOutCubic } = {}) {
  svg._labStrokes ??= [...svg.querySelectorAll('path, line, circle, rect, polyline, polygon')].map((el) => ({ el, len: el.getTotalLength() }));
  svg._labStrokes.forEach(({ el, len }, i) => {
    const q = curve(progress(t, start + i * each, start + i * each + duration));
    el.style.strokeDasharray = `${len} ${len}`;
    el.style.strokeDashoffset = `${len * (1 - q)}`;
    el.style.opacity = q > 0 ? 1 : 0;
  });
}

// ── component transitions: helpers ──────────────────────────────
// Choreographed transitions for a component (a card, a button, a panel) or a whole frame: parts of A become
// parts of B, springs with overshoot, layers a few frames apart, and a secondary effect. A and B are stacked
// in one positioned slot (their parent); `duration` (s) keeps the springs' feel; render with `--motion-blur 5`.
// Call each one through p = 1: that is when it hides the layers and copies it made.

const dims = (el) => [el.offsetWidth, el.offsetHeight];
/** Children that are content (not effect layers added by these moves). */
const items = (el) => [...el.children].filter((c) => !c.classList.contains('pm-fx'));
const show = (a, b, p) => { a.style.opacity = p >= 1 ? 0 : 1; b.style.opacity = p > 0 ? 1 : 0; };
/** A spring released at progress `start`, in the transition's seconds. */
const sp = (p, start, duration, o = {}) => spring((p - start) * duration, { stiffness: 200, damping: 18, ...o });
/** Eases any value onto 1 over the last stretch, so a spring lands exactly at p = 1. */
const settle = (v, p, from = 0.85) => lerp(v, 1, progress(p, from, 1));
const blur = (px) => (px > 0.3 ? `blur(${px}px)` : 'none');
const orig = (el, prop) => ((el._pmOrig ??= {})[prop] ??= { inline: el.style[prop], computed: getComputedStyle(el)[prop] });
const rgba = (c) => { const v = (c.match(/[\d.]+/g) ?? ['0', '0', '0', '0']).map(Number); return [v[0], v[1], v[2], v[3] ?? 1]; };
const mixRgba = (c1, c2, q) => { const x = rgba(c1), y = rgba(c2); return `rgba(${[0, 1, 2].map((i) => Math.round(lerp(x[i], y[i], q))).join(',')},${lerp(x[3], y[3], q)})`; };
/** Layout rect of `el` relative to `root` (transforms ignored, so it is stable while things move). */
function rectIn(el, root) { let x = 0, y = 0, n = el; while (n && n !== root) { x += n.offsetLeft; y += n.offsetTop; n = n.offsetParent; } return { x, y, w: el.offsetWidth, h: el.offsetHeight }; }
const lerpRect = (r1, r2, q) => ({ x: lerp(r1.x, r2.x, q), y: lerp(r1.y, r2.y, q), w: lerp(r1.w, r2.w, q), h: lerp(r1.h, r2.h, q) });
/** An effect layer owned by `host`, made once and restyled every frame. */
function layer(host, key, css) {
  const k = `_pmFx_${key}`;
  let d = host[k];
  if (!d) { d = host[k] = document.createElement('div'); d.className = 'pm-fx'; host.append(d); }
  d.style.cssText = `position:absolute;pointer-events:none;${css}`;
  return d;
}
const hide = (host, ...keys) => { for (const k of keys) { const d = host[`_pmFx_${k}`]; if (d) d.style.display = 'none'; } };
const resetAll = (...els) => { for (const e of els) for (const k of ['transform', 'opacity', 'filter', 'clipPath', 'transformOrigin']) e.style[k] = ''; };
/** Live copies of `el` drawn into `host` (for moves that cut a component into pieces). */
function copy(el) {
  const c = el.cloneNode(true);
  c.querySelectorAll('.pm-fx').forEach((x) => x.remove());
  Object.assign(c.style, { position: 'absolute', left: '0', top: '0', right: 'auto', bottom: 'auto', width: `${el.offsetWidth}px`, height: `${el.offsetHeight}px`, margin: '0', transform: 'none', opacity: '1', clipPath: 'none', filter: 'none', zIndex: 'auto' });
  return c;
}
const partsOf = (el) => new Map([...el.querySelectorAll('[data-part]')].map((e) => [e.dataset.part, e]));

// ── component transitions ───────────────────────────────────────────────────

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

/** A winds up, then whips out tilted and smeared; a light streak crosses at full speed; B whips in, overshoots and settles, its content trailing. */
export function whipPan(a, b, p, { duration = 0.9, dir = 'left', tilt = 7, travel = 1.35 } = {}) {
  const slot = a.parentElement, [w] = dims(a), s = dir === 'left' ? -1 : 1;
  if (p <= 0 || p >= 1) { hide(slot, 'wpStreak'); resetAll(a, b, ...items(a), ...items(b)); show(a, b, p); return; }
  const wind = ease.outCubic(progress(p, 0, 0.18)) * (1 - ease.inCubic(progress(p, 0.18, 0.3)));
  const out = ease.inExpo(progress(p, 0.16, 0.5));
  a.style.transformOrigin = '50% 70%';
  a.style.transform = `translateX(${-s * 40 * wind + s * w * travel * out}px) rotate(${-s * 1.6 * wind + s * tilt * out}deg) skewX(${-s * 12 * out}deg) scale(${1 - 0.03 * wind})`;
  a.style.opacity = p < 0.5 ? 1 : 0;
  const e = settle(sp(p, 0.42, duration, { stiffness: 250, damping: 19 }), p), r = 1 - e;
  b.style.transformOrigin = '50% 70%';
  b.style.transform = `translateX(${-s * w * travel * r}px) rotate(${-s * tilt * r}deg) skewX(${s * 12 * clamp(r) * clamp(r)}deg)`;
  b.style.opacity = p > 0.42 ? 1 : 0;
  items(b).forEach((c, i) => { const ci = settle(sp(p, 0.47 + i * 0.03, duration, { stiffness: 230, damping: 17 }), p); c.style.transform = `translateX(${-s * 110 * (1 - ci)}px)`; });
  const st = progress(p, 0.28, 0.64), so = Math.sin(Math.PI * st), sw = w * 0.45;
  layer(slot, 'wpStreak', `display:${so > 0.01 ? 'block' : 'none'};left:${lerp(s < 0 ? w : -sw, s < 0 ? -sw : w, ease.inOutCubic(st))}px;top:-15%;width:${sw}px;height:130%;z-index:5;opacity:${0.7 * so};`
    + `background:linear-gradient(90deg,transparent,rgba(255,255,255,.85),transparent);transform:skewX(${-s * 18}deg);mix-blend-mode:screen;filter:blur(16px)`);
}

/** The camera dives into a detail of A (`target`); B opens inside it as it fills the slot, a ring breaks outward, B's parts rise into focus. */
export function diveIn(a, b, p, { duration = 1.1, target = '[data-part="media"]', depth = 16 } = {}) {
  const slot = a.parentElement, t = a.querySelector(target) ?? a, R = rectIn(t, a), cx = R.x + R.w / 2, cy = R.y + R.h / 2;
  if (p <= 0 || p >= 1) { hide(slot, 'diveRing'); resetAll(a, b, ...items(b)); show(a, b, p); return; }
  const [w, h] = dims(a), full = Math.hypot(Math.max(cx, w - cx), Math.max(cy, h - cy));
  const z = ease.inExpo(progress(p, 0.02, 0.5)), sa = 1 + (depth - 1) * z;
  a.style.transformOrigin = `${cx}px ${cy}px`; a.style.transform = `scale(${sa})`;
  a.style.filter = blur(10 * ease.inQuad(progress(p, 0.25, 0.5))); a.style.opacity = 1 - progress(p, 0.46, 0.56);
  const rad = Math.max((Math.min(R.w, R.h) / 2) * 0.8 * sa, lerp(0, full * 1.05, ease.inOutCubic(progress(p, 0.42, 0.78))));
  const bz = ease.outExpo(progress(p, 0.3, 1)), sb = 1.6 - 0.6 * bz;
  b.style.transformOrigin = `${cx}px ${cy}px`; b.style.transform = `scale(${sb})`; b.style.filter = blur(12 * (1 - bz));
  b.style.clipPath = rad >= full ? 'none' : `circle(${rad / sb}px at ${cx}px ${cy}px)`;
  b.style.opacity = p > 0.1 ? 1 : 0; b.style.zIndex = 3; a.style.zIndex = 2;
  items(b).forEach((c, i) => { const q = ease.outExpo(progress(p, 0.55 + i * 0.035, 0.85 + i * 0.035)); c.style.transform = `translateY(${40 * (1 - q)}px)`; c.style.opacity = q; c.style.filter = blur(8 * (1 - q)); });
  const ring = progress(p, 0.4, 0.82), rr = rad + 60 * ease.outCubic(ring);
  layer(slot, 'diveRing', `display:${ring > 0 && ring < 1 ? 'block' : 'none'};left:${cx - rr}px;top:${cy - rr}px;width:${2 * rr}px;height:${2 * rr}px;border-radius:50%;z-index:4;`
    + `border:${2 + 6 * (1 - ring)}px solid rgba(255,255,255,${0.75 * (1 - ring)})`);
}

/** A lifts toward the camera, flips with a wobble and a sheen across its face, and lands as B with an echo; B's parts pop in after. */
export function flipLift(a, b, p, { duration = 1.2, lift = 150, perspective = 1800 } = {}) {
  const slot = a.parentElement;
  if (p <= 0 || p >= 1) { hide(slot, 'flEcho'); hide(a, 'sheen'); hide(b, 'sheen'); resetAll(a, b, ...items(b)); a.style.backfaceVisibility = b.style.backfaceVisibility = ''; show(a, b, p); return; }
  slot.style.perspective = `${perspective}px`;
  const L = ease.outCubic(progress(p, 0, 0.22)) * (1 - ease.inOutCubic(progress(p, 0.6, 0.8)));
  const ang = 180 * settle(sp(p, 0.14, duration, { stiffness: 110, damping: 11 }), p);
  const dt = Math.max(0, (p - 0.8) * duration), imp = p > 0.8 ? Math.exp(-dt * 9) * Math.sin(dt * 30) * (1 - progress(p, 0.92, 1)) : 0;
  const tf = (deg) => `translateZ(${lift * L}px) rotateX(${-8 * L}deg) rotateY(${deg}deg) scale(${1 - 0.035 * imp})`;
  a.style.transform = tf(ang); b.style.transform = tf(ang - 180);
  a.style.backfaceVisibility = 'hidden'; b.style.backfaceVisibility = 'hidden'; a.style.opacity = 1; b.style.opacity = 1;
  const turn = Math.abs(Math.sin((ang * Math.PI) / 180));
  for (const [el, off] of [[a, 0], [b, 180]]) {
    const pos = 120 - ((ang - off + 180) / 360) * 140;
    layer(el, 'sheen', `display:block;inset:0;z-index:9;border-radius:inherit;background:linear-gradient(105deg,transparent 38%,rgba(255,255,255,.28) 50%,transparent 62%);background-size:300% 100%;background-position:${pos}% 0;opacity:${0.25 + 0.75 * turn}`);
  }
  a.style.filter = `brightness(${1 - 0.45 * turn})`; b.style.filter = `brightness(${1 - 0.45 * turn})`;
  const e = progress(p, 0.8, 1);
  layer(slot, 'flEcho', `display:${e > 0 && e < 1 ? 'block' : 'none'};inset:0;z-index:0;border-radius:14px;border:1.5px solid rgba(255,255,255,${0.55 * (1 - e)});transform:scale(${1 + 0.14 * ease.outCubic(e)})`);
  items(b).forEach((c, i) => { const q = settle(sp(p, 0.3 + i * 0.035, duration, { stiffness: 240, damping: 14 }), p); c.style.transform = `translateY(${26 * (1 - q)}px) scale(${0.92 + 0.08 * q})`; c.style.opacity = clamp(0.25 + q); });
}

/** A squashes, then launches up stretched; B falls in stretched, squashes on impact and wobbles to rest while its content follows through. */
export function squashDrop(a, b, p, { duration = 1.1, height = 1.3 } = {}) {
  const slot = a.parentElement, [w, h] = dims(a);
  if (p <= 0 || p >= 1) { hide(slot, 'sdL', 'sdR'); resetAll(a, b, ...items(b)); show(a, b, p); return; }
  const sq = ease.outQuad(progress(p, 0, 0.13)) * (1 - progress(p, 0.13, 0.2)), up = ease.inCubic(progress(p, 0.12, 0.38));
  a.style.transformOrigin = '50% 100%';
  a.style.transform = `translateY(${-h * height * up}px) scale(${1 + 0.05 * sq - 0.07 * up}, ${1 - 0.09 * sq + 0.16 * up})`;
  a.style.opacity = p < 0.38 ? 1 : 0;
  const HIT = 0.58, fall = ease.inCubic(progress(p, 0.3, HIT)), dt = Math.max(0, (p - HIT) * duration), end = 1 - progress(p, 0.9, 1);
  const wob = p > HIT ? Math.exp(-dt * 7) * Math.cos(dt * 24) * end : 0, st = p < HIT ? 0.14 * fall : 0;
  b.style.transformOrigin = '50% 100%';
  b.style.transform = `translateY(${-h * height * (1 - fall)}px) scale(${1 - 0.06 * st + 0.09 * wob}, ${1 + st - 0.13 * wob})`;
  b.style.opacity = p > 0.3 ? 1 : 0;
  items(b).forEach((c, i) => { const y = p < HIT ? -24 * fall : -24 * Math.exp(-dt * 8) * Math.cos(dt * 20 + i * 0.4) * end; c.style.transform = `translateY(${y}px)`; });
  const l = progress(p, HIT, HIT + 0.22), on = l > 0 && l < 1 ? 'block' : 'none', len = 120 * (1 - l) + 12, reach = 150 * ease.outCubic(l);
  layer(slot, 'sdL', `display:${on};left:${-reach - len}px;top:${h - 2}px;width:${len}px;height:3px;background:#fff;opacity:${1 - l};z-index:4`);
  layer(slot, 'sdR', `display:${on};left:${w + reach}px;top:${h - 2}px;width:${len}px;height:3px;background:#fff;opacity:${1 - l};z-index:4`);
}

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

/** A's items leave, A folds into a glowing line, a glint runs along it, and B unfolds out of the line with overshoot as its items rise from it. */
export function unfold(a, b, p, { duration = 1.2, radius = 14 } = {}) {
  const slot = a.parentElement, [w, h] = dims(a);
  if (p <= 0 || p >= 1) { hide(slot, 'ufLine'); resetAll(a, b, ...items(a), ...items(b)); show(a, b, p); return; }
  items(a).forEach((c, i) => { const l = progress(p, i * 0.03, i * 0.03 + 0.22); c.style.transform = `translateY(${-30 * ease.inCubic(l)}px)`; c.style.opacity = 1 - l; c.style.filter = blur(10 * l); });
  const f = ease.inOutCubic(progress(p, 0.16, 0.42)), ins = (h / 2 - 1.5) * f;
  a.style.clipPath = `inset(${ins}px 0 ${ins}px 0 round ${lerp(radius, 2, f)}px)`;
  a.style.opacity = p < 0.44 ? 1 : 0;
  const lp = progress(p, 0.36, 0.64), breathe = Math.sin(Math.PI * lp), g = ease.inOutCubic(lp) * 120 - 10;
  layer(slot, 'ufLine', `display:${lp > 0 && lp < 1 ? 'block' : 'none'};left:${(w - w * (1 + 0.08 * breathe)) / 2}px;width:${w * (1 + 0.08 * breathe)}px;top:${h / 2 - 1.5}px;height:3px;z-index:4;border-radius:2px;`
    + `background:linear-gradient(90deg,rgba(255,255,255,.35) ${g - 14}%,#fff ${g}%,rgba(255,255,255,.35) ${g + 14}%);box-shadow:0 0 ${18 * breathe}px rgba(255,255,255,${0.6 * breathe})`);
  const u = settle(sp(p, 0.5, duration, { stiffness: 230, damping: 16 }), p), bi = Math.max(0, (h / 2 - 1.5) * (1 - u));
  b.style.clipPath = `inset(${bi}px 0 ${bi}px 0 round ${lerp(2, radius, clamp(u))}px)`;
  b.style.transform = `scaleY(${1 + Math.max(0, u - 1) * 0.6})`;
  b.style.opacity = p > 0.5 ? 1 : 0;
  items(b).forEach((c, i) => { const q = ease.outExpo(progress(p, 0.6 + i * 0.04, 0.88 + i * 0.03)); c.style.transform = `translateY(${40 * (1 - q)}px)`; c.style.opacity = q; c.style.filter = blur(8 * (1 - q)); });
}

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
