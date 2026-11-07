// paper-motion moves: named, reusable pieces of motion. Each is a pure function of time or progress
// that sets styles on elements, so it can be called from s.update() and stays frame-exact.
//   import { wipe, typeOn, PACE } from 'paper-motion/moves';
// Transitions take progress p (0 → 1); text and camera moves take scene time t.
import { ease, clamp, progress, rng } from './index.js';

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
export function zoomThrough(a, b, p, { scale = 6, curve = ease.inOutCubic } = {}) {
  const q = E(p, curve);
  a.style.transform = `scale(${1 + (scale - 1) * Math.pow(q, 2)})`;
  a.style.opacity = 1 - clamp((q - 0.55) / 0.3);
  b.style.transform = `scale(${0.86 + 0.14 * q})`;
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
    const txt = el.textContent;
    el.textContent = '';
    el._pmWords = txt.split(/(\s+)/).map((w) => {
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
