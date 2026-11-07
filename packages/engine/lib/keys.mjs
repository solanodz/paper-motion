// Keystroke banks: split a recording of real typing into single hits, so the `key` sound effect can play
// real keystrokes instead of synthesized ones. Any audio ffmpeg reads (mp3, m4a, wav, mp4...).
import fs from 'node:fs';
import path from 'node:path';
import { spawnSync } from 'node:child_process';

const SR = 48000;

/** Decode any audio file to mono Float32 at 48 kHz. */
export function decode(file) {
  const r = spawnSync('ffmpeg', ['-v', 'error', '-i', file, '-ac', '1', '-ar', String(SR), '-f', 'f32le', '-'], { maxBuffer: 1 << 30 });
  if (r.status !== 0) throw new Error(`could not decode ${file}: ${r.stderr}`);
  return new Float32Array(r.stdout.buffer, r.stdout.byteOffset, r.stdout.byteLength / 4).slice();
}

/** 16-bit mono WAV. */
export function writeMonoWav(file, data) {
  const buf = Buffer.alloc(44 + data.length * 2);
  buf.write('RIFF', 0); buf.writeUInt32LE(36 + data.length * 2, 4); buf.write('WAVE', 8); buf.write('fmt ', 12);
  buf.writeUInt32LE(16, 16); buf.writeUInt16LE(1, 20); buf.writeUInt16LE(1, 22); buf.writeUInt32LE(SR, 24);
  buf.writeUInt32LE(SR * 2, 28); buf.writeUInt16LE(2, 32); buf.writeUInt16LE(16, 34); buf.write('data', 36); buf.writeUInt32LE(data.length * 2, 40);
  for (let i = 0; i < data.length; i++) buf.writeInt16LE(Math.round(Math.max(-1, Math.min(1, data[i])) * 32767), 44 + i * 2);
  fs.writeFileSync(file, buf);
}

/**
 * Find keystroke onsets with a fast/slow energy ratio, then cut each hit until just before the next.
 * @returns {{ hits: {file, t, dur, peak, low}[] }}
 */
export function extractKeys(input, outDir, { minGap = 0.055, maxLen = 0.28, sensitivity = 1 } = {}) {
  const x = decode(input);
  // envelope: fast (1.5 ms) vs slow (40 ms) RMS; an onset is where the fast one jumps above the slow one
  const fast = new Float32Array(x.length), slow = new Float32Array(x.length);
  const af = Math.exp(-1 / (0.0015 * SR)), as = Math.exp(-1 / (0.04 * SR));
  let f = 0, s = 0, peakAll = 1e-9;
  for (let i = 0; i < x.length; i++) {
    const e = x[i] * x[i];
    f = af * f + (1 - af) * e; s = as * s + (1 - as) * e;
    fast[i] = Math.sqrt(f); slow[i] = Math.sqrt(s);
    peakAll = Math.max(peakAll, fast[i]);
  }
  const floor = peakAll * 0.04 / sensitivity, gap = Math.round(minGap * SR);
  const onsets = [];
  for (let i = 1; i < x.length; i++) {
    if (fast[i] > floor && fast[i] > slow[i] * (2.2 / sensitivity) && (!onsets.length || i - onsets[onsets.length - 1] > gap)) onsets.push(i);
  }
  fs.mkdirSync(outDir, { recursive: true });
  const hits = [];
  onsets.forEach((o, k) => {
    const a = Math.max(0, o - Math.round(0.004 * SR));
    const end = Math.min(x.length, k + 1 < onsets.length ? onsets[k + 1] - Math.round(0.006 * SR) : x.length, a + Math.round(maxLen * SR));
    if (end - a < 0.03 * SR) return;
    const seg = x.slice(a, end);
    // fade in 2 ms, fade out the last 25 %, normalize to 0.9
    let pk = 1e-9; for (const v of seg) pk = Math.max(pk, Math.abs(v));
    const fi = Math.round(0.002 * SR), fo = Math.round(seg.length * 0.25);
    for (let i = 0; i < seg.length; i++) {
      const g = Math.min(1, i / fi) * Math.min(1, (seg.length - i) / fo);
      seg[i] = (seg[i] / pk) * 0.9 * g;
    }
    // a rough "weight": share of energy under 400 Hz (spacebars and enters are heavier)
    let lo = 0, all = 0, y = 0; const c = Math.exp(-2 * Math.PI * 400 / SR);
    for (const v of seg) { y = (1 - c) * v + c * y; lo += y * y; all += v * v; }
    const name = `key-${String(hits.length + 1).padStart(3, '0')}.wav`;
    writeMonoWav(path.join(outDir, name), seg);
    hits.push({ file: name, t: +(a / SR).toFixed(3), dur: +(seg.length / SR).toFixed(3), peak: +pk.toFixed(3), low: +(lo / Math.max(all, 1e-12)).toFixed(3) });
  });
  // the heaviest fifth become the space/enter pool
  const byLow = [...hits].sort((p, q) => q.low - p.low);
  const heavy = new Set(byLow.slice(0, Math.max(1, Math.round(hits.length / 5))).map((h) => h.file));
  for (const h of hits) h.kind = heavy.has(h.file) ? 'heavy' : 'letter';
  fs.writeFileSync(path.join(outDir, 'keys.json'), JSON.stringify({ source: path.basename(input), sampleRate: SR, hits }, null, 1) + '\n');
  return { hits };
}

const banks = new Map();
/** Load a bank folder written by extractKeys: { letter: Float32Array[], heavy: Float32Array[] }. */
export function loadBank(dir) {
  const abs = path.resolve(dir);
  if (banks.has(abs)) return banks.get(abs);
  const meta = JSON.parse(fs.readFileSync(path.join(abs, 'keys.json'), 'utf8'));
  const bank = { letter: [], heavy: [] };
  for (const h of meta.hits) {
    const b = fs.readFileSync(path.join(abs, h.file));
    const n = (b.length - 44) / 2, d = new Float32Array(n);
    for (let i = 0; i < n; i++) d[i] = b.readInt16LE(44 + i * 2) / 32768;
    (h.kind === 'heavy' ? bank.heavy : bank.letter).push(d);
  }
  if (!bank.letter.length) bank.letter = bank.heavy;
  if (!bank.heavy.length) bank.heavy = bank.letter;
  banks.set(abs, bank);
  return bank;
}
