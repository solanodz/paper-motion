// Deterministic sound-effects synthesizer. Scenes declare cues with
// s.sfx(t, type, opts); the renderer synthesizes them into a WAV and muxes it.
// Everything is generated from code (no samples) and seeded, so the same scene
// always produces the same audio.
import fs from 'node:fs';
import { loadBank } from './keys.mjs';

const SR = 48000;

function mulberry32(seed) {
  let a = seed >>> 0;
  return () => {
    a |= 0; a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

// RBJ biquad
class Biquad {
  constructor(type, freq, q = 0.707, gainDb = 0) {
    const w = (2 * Math.PI * Math.min(freq, SR * 0.45)) / SR, cos = Math.cos(w), alpha = Math.sin(w) / (2 * q);
    const A = 10 ** (gainDb / 40);
    let b0, b1, b2, a0, a1, a2;
    a0 = 1 + alpha; a1 = -2 * cos; a2 = 1 - alpha;
    if (type === 'lowpass') { b0 = (1 - cos) / 2; b1 = 1 - cos; b2 = b0; }
    else if (type === 'highpass') { b0 = (1 + cos) / 2; b1 = -(1 + cos); b2 = b0; }
    else if (type === 'peak') { b0 = 1 + alpha * A; b1 = -2 * cos; b2 = 1 - alpha * A; a0 = 1 + alpha / A; a2 = 1 - alpha / A; }
    else if (type === 'highshelf') {
      const sq = 2 * Math.sqrt(A) * alpha;
      b0 = A * ((A + 1) + (A - 1) * cos + sq); b1 = -2 * A * ((A - 1) + (A + 1) * cos); b2 = A * ((A + 1) + (A - 1) * cos - sq);
      a0 = (A + 1) - (A - 1) * cos + sq; a1 = 2 * ((A - 1) - (A + 1) * cos); a2 = (A + 1) - (A - 1) * cos - sq;
    }
    else { b0 = alpha; b1 = 0; b2 = -alpha; } // bandpass, 0 dB peak
    this.b = [b0 / a0, b1 / a0, b2 / a0]; this.a = [a1 / a0, a2 / a0];
    this.x1 = this.x2 = this.y1 = this.y2 = 0;
  }
  process(x) {
    const y = this.b[0] * x + this.b[1] * this.x1 + this.b[2] * this.x2 - this.a[0] * this.y1 - this.a[1] * this.y2;
    this.x2 = this.x1; this.x1 = x; this.y2 = this.y1; this.y1 = y;
    return y;
  }
}

const TAU = Math.PI * 2;
const smooth = (x) => (x <= 0 ? 0 : x >= 1 ? 1 : x * x * (3 - 2 * x));

/**
 * Voices. Each returns { len (s), fn(i, sr) -> sample } — mono; panning is applied by the mixer.
 * All of them are dark by design; the master low-pass (default 2 kHz) guarantees no harsh highs.
 */
const VOICES = {
  // Continuous low bed. { dur, freq=55, gain=0.05, attack=3, release=4 }
  drone({ dur = 10, freq = 55, gain = 0.05, attack = 3, release = 4 }, rnd) {
    const lp = new Biquad('lowpass', 260), ph = [rnd(), rnd(), rnd(), rnd()].map((p) => p * TAU);
    return { len: dur, fn: (i) => {
      const t = i / SR;
      const env = smooth(t / attack) * smooth((dur - t) / release);
      const am = 1 + 0.18 * Math.sin(TAU * 0.07 * t + ph[0]);
      const tone = Math.sin(TAU * freq * t + ph[1]) + 0.5 * Math.sin(TAU * freq * 1.5 * t + ph[2]) + 0.3 * Math.sin(TAU * freq * 2 * t + ph[3]);
      const air = lp.process(rnd() * 2 - 1) * 0.9;
      return gain * env * (tone * 0.6 * am + air);
    } };
  },
  // Slow chord pad: root, fifth, octave. { dur=4, freq=73.4, gain=0.1 }
  swell({ dur = 4, freq = 73.4, gain = 0.1 }) {
    const parts = [[1, 1], [1.5, 0.55], [2, 0.4], [1.003, 0.6], [1.497, 0.3]];
    return { len: dur, fn: (i) => {
      const t = i / SR, p = t / dur;
      const env = p < 0.45 ? Math.sin((p / 0.45) * Math.PI / 2) ** 2 : Math.cos(((p - 0.45) / 0.55) * Math.PI / 2) ** 2;
      let s = 0; for (const [r, a] of parts) s += a * Math.sin(TAU * freq * r * t);
      return gain * env * s * 0.35;
    } };
  },
  // Pen / pencil writing on paper: band-limited noise with stroke rhythm. { dur=1, gain=0.12, rate=7 }
  pen({ dur = 1, gain = 0.12, rate = 7, tone = 520 }, rnd) {
    const bp = new Biquad('bandpass', tone, 0.7), lp = new Biquad('lowpass', 1100);
    const r = rate * (0.85 + 0.3 * rnd()), ph = rnd() * TAU;
    return { len: dur, fn: (i) => {
      const t = i / SR;
      const env = smooth(t / 0.025) * smooth((dur - t) / 0.05);
      const stroke = 0.35 + 0.65 * Math.abs(Math.sin(TAU * r * t + ph + 0.6 * Math.sin(TAU * 1.3 * t))) ** 1.6;
      return gain * env * stroke * lp.process(bp.process(rnd() * 2 - 1)) * 2.2;
    } };
  },
  // Paper movement / whoosh. { dur=0.8, gain=0.14 }
  paper({ dur = 0.8, gain = 0.14 }, rnd) {
    const lp = new Biquad('lowpass', 650), hp = new Biquad('highpass', 90), lp2 = new Biquad('lowpass', 900);
    return { len: dur, fn: (i) => {
      const t = i / SR, p = t / dur;
      const env = Math.sin(Math.PI * Math.min(1, p)) ** 2;
      const crackle = rnd() < 0.002 ? (rnd() * 2 - 1) * 3 : 0;
      return gain * (env * hp.process(lp.process(rnd() * 2 - 1)) * 1.8 + env * lp2.process(crackle) * 0.6);
    } };
  },
  // Soft low stamp / body hit. { freq=62, gain=0.5, decay=0.45 }
  thud({ freq = 62, gain = 0.5, decay = 0.45 }, rnd) {
    const lp = new Biquad('lowpass', 320);
    let phase = 0;
    return { len: decay * 5, fn: (i) => {
      const t = i / SR;
      const f = freq * (1 + 0.8 * Math.exp(-t / 0.035));
      phase += (TAU * f) / SR;
      const env = smooth(t / 0.004) * Math.exp(-t / decay);
      const click = lp.process((rnd() * 2 - 1) * Math.exp(-t / 0.012));
      return gain * (env * Math.sin(phase) + click * 0.5);
    } };
  },
  // Wooden knock, low. { freq=140, gain=0.3, decay=0.16 }
  knock({ freq = 140, gain = 0.3, decay = 0.16 }, rnd) {
    const lp = new Biquad('lowpass', 520);
    return { len: decay * 6, fn: (i) => {
      const t = i / SR;
      const a = smooth(t / 0.002);
      const body = Math.sin(TAU * freq * t) * Math.exp(-t / decay) + 0.35 * Math.sin(TAU * freq * 2.31 * t) * Math.exp(-t / (decay * 0.4));
      const n = lp.process((rnd() * 2 - 1) * Math.exp(-t / 0.008));
      return gain * a * (body + n * 0.6);
    } };
  },
  // Tiny low tick (UI-ish but dull). { freq=200, gain=0.1, decay=0.05 }
  tick({ freq = 200, gain = 0.1, decay = 0.05 }) {
    return { len: decay * 6, fn: (i) => { const t = i / SR; return gain * smooth(t / 0.0015) * Math.exp(-t / decay) * Math.sin(TAU * freq * t); } };
  },
  // A keystroke, modeled like a real one: the bottom-out impact excites a few inharmonic keycap/plate
  // resonances plus a low case "thock"; a softer, higher upstroke follows; a hint of room around it.
  // { gain=0.3, kind='letter'|'space'|'enter', vel=1, style='creamy'|'thock'|'clack' }. Seeded variation.
  key({ gain = 0.3, kind = 'letter', vel = 1, style = 'creamy', bank }, rnd) {
    if (bank) {
      // Real keystrokes: pick a hit from the bank, vary level and pitch slightly so no two repeat exactly.
      const pool = (kind === 'space' || kind === 'enter') ? bank.heavy : bank.letter;
      const src = pool[Math.floor(rnd() * pool.length) % pool.length];
      const rate = 0.98 + 0.04 * rnd(), g = gain * vel * (0.82 + 0.3 * rnd()) * (kind === 'enter' ? 1.15 : 1);
      const len = src.length / rate / SR;
      return { len, bright: true, fn: (i) => {
        const p = i * rate, j = Math.floor(p), x = p - j;
        const y0 = src[j - 1] ?? 0, y1 = src[j] ?? 0, y2 = src[j + 1] ?? 0, y3 = src[j + 2] ?? 0;
        const soft = Math.min(1, i / (0.0035 * SR)); // a 3.5 ms rise rounds off the hardest edge of the click
        return g * soft * (y1 + 0.5 * x * (y2 - y0 + x * (2 * y0 - 5 * y1 + 4 * y2 - y3 + x * (3 * (y1 - y2) + y3 - y0))));
      } };
    }
    const S = {
      thock:  { modes: [[620, 0.016, 1], [1040, 0.011, 0.7], [1580, 0.008, 0.45], [2350, 0.006, 0.25]], body: [170, 0.026, 1.1], burst: 0.0009, up: 0.32 },
      creamy: { modes: [[780, 0.013, 1], [1290, 0.010, 0.75], [1960, 0.007, 0.5], [2900, 0.005, 0.3]], body: [210, 0.020, 0.8], burst: 0.0007, up: 0.4 },
      clack:  { modes: [[1150, 0.010, 0.8], [1850, 0.008, 1], [2750, 0.006, 0.7], [3900, 0.004, 0.4]], body: [260, 0.014, 0.5], burst: 0.0005, up: 0.5 },
    }[style] ?? null;
    if (!S) throw new Error(`key style "${style}": use creamy, thock or clack`);
    const heavy = kind === 'space' || kind === 'enter';
    const pitch = (heavy ? (kind === 'space' ? 0.72 : 0.84) : 1) * (0.93 + 0.14 * rnd());
    const len = 0.26, N = Math.ceil(len * SR), buf = new Float32Array(N);
    // one strike: noise burst + click into a bank of ringing band-passes (Q from the decay time)
    const strike = (at, amp, fMul) => {
      const bank = S.modes.map(([f, tau, g]) => {
        const fr = f * pitch * fMul * (0.96 + 0.08 * rnd());
        return { bq: new Biquad('bandpass', fr, Math.max(2, Math.PI * fr * tau * (heavy ? 1.3 : 1))), g: g * (0.8 + 0.4 * rnd()) };
      });
      const [bf, btau, bg] = S.body;
      const body = new Biquad('bandpass', bf * pitch * (0.95 + 0.1 * rnd()), Math.PI * bf * btau * (heavy ? 1.5 : 1));
      const hp = new Biquad('highpass', 400);
      const i0 = Math.round(at * SR), burst = S.burst * (heavy ? 1.6 : 1);
      for (let i = i0; i < N; i++) {
        const t = (i - i0) / SR;
        const ex = t < burst * 6 ? (rnd() * 2 - 1) * Math.exp(-t / burst) + (i === i0 ? 3 : 0) : 0;
        let y = 0;
        for (const m of bank) y += m.bq.process(ex) * m.g;
        y += body.process(ex) * bg * 1.6;
        y += hp.process(ex) * 0.12; // the contact "tick" itself
        buf[i] += amp * y;
      }
    };
    const pre = 0.004 + 0.008 * rnd();                // finger meets the cap
    strike(0, 0.08, 1.35);
    strike(pre, 1, 1);                                 // bottom-out
    if (kind === 'space') strike(pre + 0.007 + 0.005 * rnd(), 0.35, 1.25); // stabilizer rattle
    strike(pre + (heavy ? 0.11 : 0.075) + 0.035 * rnd(), S.up * (0.8 + 0.4 * rnd()), 1.18); // upstroke
    // a little room: two early reflections
    for (const [d, k] of [[0.0071, 0.16], [0.0133, 0.09]]) { const o = Math.round(d * SR); for (let i = N - 1; i >= o; i--) buf[i] += buf[i - o] * k; }
    let peak = 1e-9; for (let i = 0; i < N; i++) peak = Math.max(peak, Math.abs(buf[i]));
    const g = (gain * vel * (0.8 + 0.3 * rnd()) * (heavy ? 1.2 : 1)) / peak;
    return { len, bright: true, fn: (i) => buf[i] * g };
  },
  // Air moving past: a pass-by whoosh. The band sweeps from→to→back while the level peaks at `peak`.
  // { dur=0.7, gain=0.2, from=320, to=1200, peak=0.6, body=0 (low weight under it, 0..1) }
  whoosh({ dur = 0.7, gain = 0.2, from = 320, to = 1200, peak = 0.6, body = 0 }, rnd) {
    // state-variable filters so the centre frequency can move every sample
    const svf = () => { let low = 0, band = 0; return (x, fc, q) => { const f = 2 * Math.sin(Math.PI * Math.min(fc, SR / 6) / SR); low += f * band; const high = x - low - q * band; band += f * high; return band; }; };
    const A = svf(), B = svf();
    let pink = 0, flut = 0;
    const ph = rnd() * TAU, bf = 52 + 14 * rnd();
    return { len: dur, fn: (i) => {
      const t = i / SR, p = t / dur;
      const env = p < peak ? smooth(p / peak) ** 1.6 : Math.cos(((p - peak) / (1 - peak)) * Math.PI / 2) ** 2;
      const fc = p < peak ? from * (to / from) ** smooth(p / peak) : to * ((from * 0.8) / to) ** ((p - peak) / (1 - peak));
      const w = rnd() * 2 - 1;
      pink = 0.8 * pink + 0.2 * w; // gentle tilt, still airy
      flut = 0.9995 * flut + 0.0005 * (rnd() * 2 - 1);
      const n = pink * 1.6;
      const air = A(n, fc, 0.9) + 0.5 * B(n, fc * 1.6, 1.1);
      const low = body * Math.sin(TAU * bf * t + ph) * env * 0.5;
      return gain * env * (air * (1 + flut * 60) * 1.4 + low);
    } };
  },
  // A small card/paper flick (something light landing). { gain=0.12 }
  flick({ gain = 0.12 }, rnd) {
    const bp = new Biquad('bandpass', 700 + 500 * rnd(), 0.9), lp = new Biquad('lowpass', 1600);
    const f = 160 + 80 * rnd();
    return { len: 0.12, fn: (i) => {
      const t = i / SR;
      const n = lp.process(bp.process(rnd() * 2 - 1)) * Math.exp(-t / 0.012) * 2.4;
      const k = Math.sin(TAU * f * t) * Math.exp(-t / 0.02) * smooth(t / 0.001) * 0.5;
      return gain * (0.75 + 0.5 * rnd()) * (n + k);
    } };
  },
  // Pitch glide. { dur=0.6, from=160, to=80, gain=0.08 }
  sweep({ dur = 0.6, from = 160, to = 80, gain = 0.08 }) {
    let phase = 0;
    return { len: dur, fn: (i) => {
      const t = i / SR, p = t / dur;
      phase += (TAU * (from + (to - from) * p)) / SR;
      return gain * Math.sin(Math.PI * p) ** 2 * Math.sin(phase);
    } };
  },
};

export const SFX_TYPES = Object.keys(VOICES);

/**
 * @param cues     [{ t, type, pan?, seed?, ...voiceOpts }]
 * @param options  { duration, lowpass=2000, highpass=30, gain=1, peak=0.8, normalize=true }
 *                  normalize: true scales the mix up or down to `peak`; false keeps the cues' own gains and only
 *                  limits overs (used when the scene brings its own audio, so effects sit where their gains put them)
 * @returns { left: Float32Array, right: Float32Array, sampleRate }
 */
export function synthesize(cues, { duration, lowpass = 2000, highpass = 30, gain = 1, peak = 0.8, normalize = true } = {}) {
  const n = Math.ceil(duration * SR);
  const L = new Float32Array(n), R = new Float32Array(n);
  // Voices marked `bright` (keys) go through their own, gentler low-pass: a keystroke's click lives at 1–4 kHz.
  const BL = new Float32Array(n), BR = new Float32Array(n);
  cues.forEach((c, k) => {
    const voice = VOICES[c.type];
    if (!voice) throw new Error(`Unknown sfx type "${c.type}". Use: ${SFX_TYPES.join(', ')}`);
    const rnd = mulberry32((c.seed ?? k * 7919 + 13) >>> 0);
    const v = voice(typeof c.bank === 'string' ? { ...c, bank: loadBank(c.bank) } : c, rnd);
    const start = Math.round(c.t * SR), len = Math.ceil(v.len * SR);
    const pan = Math.max(-1, Math.min(1, c.pan ?? 0)), gl = Math.cos(((pan + 1) * Math.PI) / 4), gr = Math.sin(((pan + 1) * Math.PI) / 4);
    for (let i = 0; i < len; i++) {
      const j = start + i;
      if (j < 0) continue; if (j >= n) break;
      const s = v.fn(i);
      if (v.bright) { BL[j] += s * gl; BR[j] += s * gr; } else { L[j] += s * gl; R[j] += s * gr; }
    }
  });
  // Master: 24 dB/oct low-pass (no harsh highs), high-pass rumble, normalize, soft clip.
  for (const ch of [L, R]) {
    const f = [new Biquad('lowpass', lowpass), new Biquad('lowpass', lowpass), new Biquad('highpass', highpass)];
    for (let i = 0; i < n; i++) ch[i] = f[2].process(f[1].process(f[0].process(ch[i])));
  }
  // Keys bus: open on top (no low-pass), a little less box (~450 Hz), more presence and air above 4 kHz.
  [[BL, L], [BR, R]].forEach(([b, ch]) => {
    const f = [new Biquad('highpass', 110), new Biquad('peak', 450, 1.0, -3.5), new Biquad('highshelf', 4200, 0.7, 3.5)];
    for (let i = 0; i < n; i++) ch[i] += f[2].process(f[1].process(f[0].process(b[i])));
  });
  let max = 1e-9;
  for (let i = 0; i < n; i++) max = Math.max(max, Math.abs(L[i]), Math.abs(R[i]));
  const k = (normalize ? peak / max : Math.min(1, peak / max)) * gain;
  const fadeOut = Math.min(n, Math.round(0.05 * SR));
  for (let i = 0; i < n; i++) {
    const f = i > n - fadeOut ? (n - i) / fadeOut : 1;
    L[i] = Math.tanh(L[i] * k * 1.1) * f; R[i] = Math.tanh(R[i] * k * 1.1) * f;
  }
  return { left: L, right: R, sampleRate: SR };
}

export function writeWav(file, { left, right, sampleRate }) {
  const n = left.length, buf = Buffer.alloc(44 + n * 4);
  buf.write('RIFF', 0); buf.writeUInt32LE(36 + n * 4, 4); buf.write('WAVE', 8);
  buf.write('fmt ', 12); buf.writeUInt32LE(16, 16); buf.writeUInt16LE(1, 20); buf.writeUInt16LE(2, 22);
  buf.writeUInt32LE(sampleRate, 24); buf.writeUInt32LE(sampleRate * 4, 28); buf.writeUInt16LE(4, 32); buf.writeUInt16LE(16, 34);
  buf.write('data', 36); buf.writeUInt32LE(n * 4, 40);
  const rnd = mulberry32(1);
  for (let i = 0; i < n; i++) {
    const d = (rnd() - rnd()) / 32768; // TPDF dither
    buf.writeInt16LE(Math.max(-32768, Math.min(32767, Math.round((left[i] + d) * 32767))), 44 + i * 4);
    buf.writeInt16LE(Math.max(-32768, Math.min(32767, Math.round((right[i] + d) * 32767))), 46 + i * 4);
  }
  fs.writeFileSync(file, buf);
}
