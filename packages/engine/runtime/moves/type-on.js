import { clamp, rng } from '../core.js';

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
