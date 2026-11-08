#!/usr/bin/env node
// Builds the engine's default keystroke bank (assets/keys) from a CC0 pack:
//   "Keyboard Soundpack #1" by unicaegames, OpenGameArt, CC0
//   https://opengameart.org/content/keyboard-soundpack-1-typing-and-single-keystrokes
// The bank ships inside the npm package only; it is never committed (the repo keeps no audio).
// Runs on `npm pack` / `npm publish` (prepack). Usage: node scripts/fetch-keys.mjs [--if-missing]
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import crypto from 'node:crypto';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { decode, extractKeys, writeMonoWav } from '../lib/keys.mjs';

const ENGINE = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const OUT = path.join(ENGINE, 'assets/keys');
const URL = 'https://opengameart.org/sites/default/files/unicae_games_keyboard_soundpack_1.zip';
const SHA256 = '96507fc9aeec34cdff0e7c558dabb96afec4156c06532a38d7006b9acdf31f06';

if (process.argv.includes('--if-missing') && fs.existsSync(path.join(OUT, 'keys.json'))) process.exit(0);

const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'pm-keys-'));
try {
  const res = await fetch(URL, { headers: { 'user-agent': 'Mozilla/5.0 (paper-motion build)' } });
  if (!res.ok) throw new Error(`download failed: HTTP ${res.status}`);
  const zip = Buffer.from(await res.arrayBuffer());
  const sum = crypto.createHash('sha256').update(zip).digest('hex');
  if (sum !== SHA256) throw new Error(`checksum mismatch: ${sum}`);
  fs.writeFileSync(path.join(tmp, 'pack.zip'), zip);
  const u = spawnSync('unzip', ['-q', '-o', 'pack.zip', '-d', 'pack'], { cwd: tmp, stdio: 'inherit' });
  if (u.status !== 0) throw new Error('unzip failed');

  // One take for the splitter: the 32 single keypresses with air between them, then two human typing passes.
  const SR = 48000, gap = new Float32Array(Math.round(0.35 * SR));
  const singles = fs.readdirSync(path.join(tmp, 'pack/Single Keys')).filter((f) => f.endsWith('.wav')).sort();
  const parts = [];
  for (const f of singles) parts.push(decode(path.join(tmp, 'pack/Single Keys', f)), gap);
  for (const f of ['human_vel-003.wav', 'human_vel-005.wav']) parts.push(decode(path.join(tmp, 'pack/Human Typing', f)), gap);
  const all = new Float32Array(parts.reduce((n, p) => n + p.length, 0));
  let o = 0; for (const p of parts) { all.set(p, o); o += p.length; }
  const take = path.join(tmp, 'take.wav');
  writeMonoWav(take, all);

  fs.rmSync(OUT, { recursive: true, force: true });
  extractKeys(take, OUT);
  // keep 64 clean hits (no clipped tails), spread across the take, and re-pick the heaviest fifth for space/enter
  const meta = JSON.parse(fs.readFileSync(path.join(OUT, 'keys.json'), 'utf8'));
  const clean = meta.hits.filter((h) => h.dur >= 0.07);
  const step = Math.max(1, clean.length / 64);
  const keep = Array.from({ length: Math.min(64, clean.length) }, (_, i) => clean[Math.floor(i * step)]);
  const kept = new Set(keep.map((h) => h.file));
  for (const h of meta.hits) if (!kept.has(h.file)) fs.rmSync(path.join(OUT, h.file));
  const heavy = new Set([...keep].sort((a, b) => b.low - a.low).slice(0, Math.round(keep.length / 5)).map((h) => h.file));
  for (const h of keep) h.kind = heavy.has(h.file) ? 'heavy' : 'letter';
  meta.hits = keep;
  const hits = keep;
  meta.source = 'Keyboard Soundpack #1 by unicaegames (OpenGameArt, CC0)';
  meta.url = 'https://opengameart.org/content/keyboard-soundpack-1-typing-and-single-keystrokes';
  meta.license = 'CC0-1.0';
  fs.writeFileSync(path.join(OUT, 'keys.json'), JSON.stringify(meta, null, 1) + '\n');
  console.log(`✓ default keystroke bank: ${hits.length} hits → ${path.relative(process.cwd(), OUT)}`);
} finally {
  fs.rmSync(tmp, { recursive: true, force: true });
}
