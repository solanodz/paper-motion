// A chain: several blocks (or shots, recipes) rendered in the brand's look and joined into one piece.
//
//   pieces/<piece>/chain.json         what plays, how long, and how each part comes in
//   pieces/<piece>/01-search-type/    each part is an ordinary installed scene: edit its CONFIG
//
// chain.json:
//   { "title": "…", "format": "1920x1080", "join": "whip",
//     "parts": [ { "id": "search-type", "dir": "01-search-type", "name": "Búsqueda", "seconds": 2.5 },
//                { "id": "bar-grow", "dir": "02-bar-grow", "seconds": 3.2, "join": "dissolve", "from": 0 } ] }
//
// `join` on a part is how it comes in (the first part's is ignored); the chain's `join` is the default.
//   cut       a straight cut
//   whip      the frame slides out sideways with a motion smear and the next slides in (0.35 s, the default)
//   dissolve  a cross-fade (0.5 s)
//   dip       out to the brand's ground color and back in (0.5 s)
//   or a transition from the registry the user chose: wipe, push, zoom-through, iris, crossfade, slices, flash,
//   scan-reveal, mask-reveal, glitch, cells, flip-3d, whip-pan (see MOVE_JOINS)
// Each part plays from `from` (default 0) for `seconds` (default: the whole scene). A part cut before its
// land (the beat a block declares with B.cue(s, 'land', t)) gets a warning with the length that keeps it.
import crypto from 'node:crypto';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { spawn, spawnSync } from 'node:child_process';

export const JOINS = { cut: 0, whip: 0.35, dissolve: 0.5, dip: 0.5 };
// the registry's transitions the user may have chosen, as joins between parts: [ffmpeg xfade transition, seconds].
// So a chosen transition plays where one part becomes the next (it can also be built inside a part, by hand).
export const MOVE_JOINS = {
  crossfade: ['fade', 0.5], wipe: ['wipeleft', 0.5], push: ['slideleft', 0.45], 'zoom-through': ['zoomin', 0.5],
  iris: ['circleopen', 0.55], slices: ['hrslice', 0.5], flash: ['fadewhite', 0.4], 'scan-reveal': ['wipedown', 0.5],
  'mask-reveal': ['radial', 0.55], glitch: ['pixelize', 0.35], cells: ['dissolve', 0.5], 'flip-3d': ['squeezeh', 0.45],
  'whip-pan': ['slideleft', 0.35],
};
for (const [k, [, d]] of Object.entries(MOVE_JOINS)) JOINS[k] = d;
JOINS.whip = 0.35;   // the engine's own whip (slide + smear) wins over the registry's whip move of the same name
const OVERLAP = new Set(['whip', 'dissolve', ...Object.keys(MOVE_JOINS)]);   // joins that need the outgoing part to run on under the next
const LAND_HOLD = 0.6;                           // seconds after a land for the hit to read

const readJson = (f, d) => { try { return JSON.parse(fs.readFileSync(f, 'utf8')); } catch { return d; } };
const pad = (i) => String(i + 1).padStart(2, '0');

/** Where a piece lives: a name (pieces/<name>) or a folder that holds chain.json. */
export function pieceDir(piece, cwd = process.cwd()) {
  const asDir = path.resolve(cwd, piece);
  if (fs.existsSync(path.join(asDir, 'chain.json')) || piece.includes(path.sep) || piece.startsWith('.')) return asDir;
  return path.join(cwd, 'pieces', piece);
}

/** Parts from a structure (a board option): one part per beat, its block from the beat's id. */
export function partsFromStructure(st) {
  return st.beats.map((b) => ({ id: b.id ?? null, name: b.name, seconds: +(b.to - b.from).toFixed(2), what: b.what }));
}

/** Parts from "search-type:2.5,browser-frame:3,bar-grow". */
export function partsFromList(list) {
  return String(list).split(',').map((x) => x.trim()).filter(Boolean).map((x) => {
    const [id, sec] = x.split(':');
    return { id, ...(sec ? { seconds: Number(sec) } : {}) };
  });
}

/** A board's structure option, from a short id, a /b/<id> link or a long link (#fragment). */
export async function structureFromBoard(ref, option, { site }) {
  const { decodeBoard } = await import('./live-board.js');
  let board;
  if (String(ref).includes('#')) board = await decodeBoard(String(ref).slice(String(ref).indexOf('#') + 1));
  else {
    const id = String(ref).replace(/\/$/, '').split('/').pop();
    // a full link says where its board lives; a bare id is looked up on the site (--site, or the default)
    const from = /^https?:\/\//i.test(String(ref)) ? new URL(String(ref)).origin : site;
    const res = await fetch(`${from}/api/boards/${id}`);
    if (!res.ok) throw new Error(`board ${id}: ${res.status} from ${from} (expired or never stored there: pass the board's full link, the long #… link, or --site <url>)`);
    board = (await res.json()).board;
  }
  const opts = board?.options ?? [];
  // --option takes the letter from the reply line (D), or a structure's title; without it, the board's structure
  const letter = option && /^[a-z]$/i.test(option) ? option.toUpperCase() : null;
  const i = letter ? opts.findIndex((o, k) => (o.label ?? String.fromCharCode(65 + k)) === letter)
    : option ? opts.findIndex((o) => o.structure?.title === option) : opts.findIndex((o) => o.structure);
  const o = opts[i];
  if (!o) throw new Error(`board: no option ${option ?? 'with a structure'} (it has ${opts.length})`);
  if (o.structure) return { title: o.structure.title, parts: partsFromStructure(o.structure) };
  return { title: board.title, parts: [{ id: o.id }] };   // a single block or recipe chosen: a chain of one
}

/**
 * Installs each part as its own scene under pieces/<piece>/<nn>-<id>/ (in the requested format) and writes
 * chain.json. Parts with no block (a beat the agent didn't name) are listed with id null for the agent to fill.
 * Without parts, it syncs an existing chain.json: parts whose scene is missing are installed, the rest is kept.
 */
export async function initChain({ cwd = process.cwd(), piece, title, parts, format, join, registry, force = false }) {
  const { add, getItem, resolveRegistry } = await import('./registry.mjs');
  const reg = resolveRegistry(registry);
  const dir = pieceDir(piece, cwd), rel = path.relative(path.join(cwd, 'pieces'), dir), file = path.join(dir, 'chain.json');
  const old = readJson(file, null);
  if (old && parts && !force) throw new Error(`${path.relative(cwd, file)} exists: run init without --board/--parts to install parts you added, or --force to start over`);
  if (!old && !parts) throw new Error(`no ${path.relative(cwd, file)} yet: give --board or --parts`);
  const base = parts ? null : old;
  format = format ?? base?.format ?? '1920x1080'; join = join ?? base?.join ?? 'whip';
  if (!JOINS.hasOwnProperty(join)) throw new Error(`join "${join}": use ${Object.keys(JOINS).join(', ')}`);
  const out = [], notes = [];
  for (const [i, p] of (parts ?? old.parts).entries()) {
    if (!p.id) { out.push({ ...p, id: null, dir: null }); notes.push(`part ${i + 1} "${p.name ?? '?'}" has no block yet: set its id in chain.json and run chain init ${piece} again`); continue; }
    const sub = p.dir && p.dir.endsWith(`-${p.id}`) ? p.dir : `${pad(i)}-${p.id}`;
    if (base && fs.existsSync(path.join(dir, sub, 'scene.html'))) { out.push({ ...p, dir: sub }); continue; }   // installed already: your edits stay
    const it = await getItem(p.id, reg);
    if (it.install?.kind !== 'scene') throw new Error(`${p.id} is a ${it.type}, not a scene (chains take blocks, shots and recipes)`);
    const hasFormat = (it.params ?? []).some((x) => x.name === 'format');
    await add([p.id], { cwd, registry, force, name: path.join(rel, sub), set: hasFormat ? [`format=${format}`] : [] });
    if (!hasFormat && format !== '1920x1080') notes.push(`${p.id} has no format param: it renders at its own size`);
    const { id, name, seconds, what, dir: _, ...rest } = p;   // rest: from, join, anything the agent added
    out.push({ id, dir: sub, ...(name ? { name } : {}), ...(seconds ? { seconds } : {}), ...(what ? { what } : {}), ...rest });
  }
  const chain = { ...(base ?? {}), title: title ?? base?.title ?? piece, format, join, parts: out };
  fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(file, JSON.stringify(chain, null, 2) + '\n');
  const { readPiece, updatePiece } = await import('./piece.mjs');
  if (readPiece(dir)) updatePiece(dir, (p) => {
    const keep = new Set(out.map((x) => x.dir).filter(Boolean));
    for (const d of Object.keys(p.parts)) if (!keep.has(d)) delete p.parts[d];
    for (const d of keep) p.parts[d] ??= { status: 'queued' };
  });
  return { dir, chain, notes };
}

function run(bin, argv) {
  return new Promise((res, rej) => {
    const p = spawn(bin, argv, { stdio: ['ignore', 'ignore', 'pipe'] });
    let err = '';
    p.stderr.on('data', (d) => { err += d; });
    p.on('error', rej);
    p.on('close', (c) => (c === 0 ? res() : rej(new Error(`${bin} failed (${c}): ${err.trim().split('\n').slice(-6).join('\n')}`))));
  });
}
const FF = () => process.env.PAPER_MOTION_FFMPEG || 'ffmpeg';
function probe(file) {
  const r = spawnSync('ffprobe', ['-v', 'error', '-show_entries', 'format=duration:stream=codec_type', '-of', 'json', file], { encoding: 'utf8' });
  const j = JSON.parse(r.stdout || '{}');
  return { duration: Number(j.format?.duration ?? 0), audio: (j.streams ?? []).some((s) => s.codec_type === 'audio') };
}

/** What a scene declares: its config and the gestures it marks (land, transition, text). */
async function sceneInfo(browser, url) {
  const { openScene } = await import('./browser.mjs');
  const s = await openScene(browser, url);
  const marks = await s.page.evaluate(() => window.__pm.marks ?? []);
  await s.close();
  return { config: s.config, marks };
}

/** Checks a chain and works out each part's window, without rendering. */
export function plan(chain, infos) {
  const warnings = [];
  const parts = chain.parts.map((p, i) => {
    const info = infos[i], D = info.config.duration, from = p.from ?? 0;
    const join = i === 0 ? 'cut' : (p.join ?? chain.join ?? 'whip');
    if (!JOINS.hasOwnProperty(join)) throw new Error(`part ${i + 1}: join "${join}" (use ${Object.keys(JOINS).join(', ')})`);
    let seconds = p.seconds ?? D - from;
    if (from + seconds > D + 1e-6) { warnings.push(`${p.dir}: ${seconds} s from ${from} runs past its end (${D} s); it plays ${+(D - from).toFixed(2)} s`); seconds = D - from; }
    const lands = info.marks.filter((m) => m.gesture === 'land').map((m) => m.t).filter((t) => t >= from);
    const land = lands.length ? Math.max(...lands) : null;
    if (land !== null && from + seconds < land + LAND_HOLD) warnings.push(`${p.dir}: cut at ${seconds} s loses its land at ${+(land - from).toFixed(2)} s; give it at least ${+(land - from + LAND_HOLD).toFixed(1)} s`);
    return { ...p, from, seconds, join, D };
  });
  // the outgoing part runs on under an overlapping join, as far as it can
  for (const [i, p] of parts.entries()) {
    const next = parts[i + 1], d = next && OVERLAP.has(next.join) ? JOINS[next.join] : 0;
    p.to = Math.min(p.D, p.from + p.seconds + d);
  }
  return { parts, warnings, total: parts.reduce((a, p) => a + p.seconds, 0) };
}

// ── is a joined render still current, and is one being made right now ──────────────────────────────────────
/**
 * A fingerprint of everything a joined render shows: the order, lengths and joins in chain.json, each part's
 * files, the brand's tokens and backgrounds, the project's moves. A render made from another fingerprint is stale.
 */
export function chainSig(cwd, dir) {
  const h = crypto.createHash('sha1');
  const chain = readJson(path.join(dir, 'chain.json'), { parts: [] });
  h.update(JSON.stringify([chain.format ?? null, chain.join ?? null, (chain.parts ?? []).map((p) => [p.dir, p.id, p.seconds ?? null, p.from ?? null, p.join ?? null])]));
  const add = (f) => {
    try {
      const st = fs.statSync(f); if (st.isDirectory()) return;
      h.update(path.basename(f));
      if (/\.(html|json|js|mjs|css|svg)$/.test(f)) h.update(fs.readFileSync(f)); else h.update(`${st.size}:${Math.round(st.mtimeMs)}`);
    } catch { /* gone: nothing to add */ }
  };
  const all = (d, skip = () => false) => { try { for (const f of fs.readdirSync(d).sort()) if (!skip(f)) add(path.join(d, f)); } catch { /* no such folder */ } };
  for (const p of chain.parts ?? []) if (p.dir) all(path.join(dir, p.dir), (f) => f.endsWith('.md'));
  for (const f of ['brand/tokens.json', 'brand/shader-set/set.json', 'brand/sound.json']) add(path.join(cwd, f));
  all(path.join(cwd, 'moves'));
  return h.digest('hex').slice(0, 16);
}
const sigFile = (dir) => path.join(dir, 'renders', '.sig.json');
/** What each joined render in renders/ was made from: { "<file>": { sig, sfx, audio } }. */
export const readSigs = (dir) => readJson(sigFile(dir), {});

// the join in progress, for the studio's "updating" notice and so two joins of the same file never run at once
const jobFile = (dir) => path.join(dir, '.job.json');
/** The join running on this piece right now (its process still alive), or null. */
export function readJob(dir) {
  const j = readJson(jobFile(dir), null);
  if (!j) return null;
  try { process.kill(j.pid, 0); return j; } catch { return null; }
}
const writeJob = (dir, j) => { try { fs.writeFileSync(jobFile(dir), JSON.stringify({ pid: process.pid, at: Date.now(), ...j })); } catch { /* read-only: no notice */ } };
const endJob = (dir) => { try { if (readJson(jobFile(dir), {}).pid === process.pid) fs.rmSync(jobFile(dir)); } catch { /* already gone */ } };

/**
 * Renders every part in the brand's look and joins them into one file.
 * Must run from the project root (where brand/ is): scenes load the brand from /brand.
 */
export async function renderChain({ cwd = process.cwd(), piece, out, motionBlur = 1, dpr = 1, audio, sfx = true, draft = false, onStep = () => {} }) {
  if (draft) { dpr = 0.5; motionBlur = 1; }
  // the piece's own draft and final are tracked (what they were made from, and that they are being made);
  // a render to another file (--out) is the caller's business
  const home = pieceDir(piece, cwd), kind = out ? null : draft ? 'assembly' : 'final', sig = kind ? chainSig(cwd, home) : null;
  if (kind) {
    const busy = readJob(home);
    if (busy && busy.pid !== process.pid && busy.kind === kind) throw new Error(`this piece's ${kind === 'assembly' ? 'draft' : 'final'} is already being rendered (${busy.of ? `part ${busy.part} of ${busy.of}` : 'starting'}): wait for it, then look at piece status`);
    writeJob(home, { kind });
  }
  try { return await withChain({ cwd, piece }, async ({ dir, url, parts, warnings, total, config }) => {
    const { renderVideo } = await import('./render.mjs');
    for (const w of warnings) onStep({ warning: w });
    const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'pm-chain-'));
    try {
      const files = [];
      for (const [i, p] of parts.entries()) {
        onStep({ part: i + 1, of: parts.length, dir: p.dir });
        if (kind) writeJob(home, { kind, part: i + 1, of: parts.length });
        const f = path.join(tmp, `${pad(i)}.mov`);
        await renderVideo({ url: url(p), out: f, format: 'prores', from: p.from, to: p.to, sfx, motionBlur, dpr });
        files.push(f);
      }
      const tokens = readJson(path.join(cwd, 'brand/tokens.json'), {}), sound = readJson(path.join(cwd, 'brand/sound.json'), {});
      const ground = (tokens.colors?.ground?.hex ?? '#000000').replace('#', '0x');
      const { width: W, height: H, fps } = config;
      out = path.resolve(cwd, out ?? path.join(dir, 'renders', `${path.basename(dir)}${draft ? '-draft' : ''}.mp4`));
      fs.mkdirSync(path.dirname(out), { recursive: true });
      onStep({ joining: true });
      if (kind) writeJob(home, { kind, part: parts.length, of: parts.length, joining: true });
      const j = await join({ files, parts, out, ground, fps, music: audio, lufs: sound.loudness ?? -16 });
      if (kind) fs.writeFileSync(sigFile(home), JSON.stringify({ ...readSigs(home), [path.basename(out)]: { sig, sfx, ...(audio ? { audio } : {}) } }, null, 2) + '\n');
      return { out, total: j.seconds, planned: total, parts: parts.length, warnings, W, H };
    } finally { fs.rmSync(tmp, { recursive: true, force: true }); }
  }); } finally { if (kind) endJob(home); }
}

/**
 * Renders parts on their own, quickly (half resolution, no motion blur), to pieces/<piece>/drafts/<dir>.mp4: what
 * the user reviews part by part in the studio. Skips approved parts unless named in `only`. Tracks status in piece.json.
 */
export async function renderDrafts({ cwd = process.cwd(), piece, only, onStep = () => {} }) {
  const { readPiece, updatePiece } = await import('./piece.mjs');
  return withChain({ cwd, piece }, async ({ dir, url, parts, warnings }) => {
    const { renderVideo } = await import('./render.mjs');
    for (const w of warnings) onStep({ warning: w });
    const tracked = !!readPiece(dir), mark = (d, patch) => tracked && updatePiece(dir, (p) => { p.parts[d] = { ...(p.parts[d] ?? {}), ...patch }; });
    const todo = parts.filter((p) => (only?.length ? only.some((o) => p.dir === o || p.id === o || p.dir.startsWith(`${o}-`)) : (readPiece(dir)?.parts?.[p.dir]?.status ?? 'queued') !== 'approved'));
    for (const p of todo) mark(p.dir, { status: 'queued' });
    fs.mkdirSync(path.join(dir, 'drafts'), { recursive: true });
    const done = [];
    for (const [i, p] of todo.entries()) {
      onStep({ part: i + 1, of: todo.length, dir: p.dir });
      mark(p.dir, { status: 'rendering' });
      const out = path.join(dir, 'drafts', `${p.dir}.mp4`);
      try {
        await renderVideo({ url: url(p), out, from: p.from, to: p.from + p.seconds, dpr: 0.5, motionBlur: 1, crf: 26 });
      } catch (e) { mark(p.dir, { status: 'review', error: String(e.message ?? e).slice(0, 300) }); throw e; }
      const v = (readPiece(dir)?.parts?.[p.dir]?.v ?? 0) + 1;
      mark(p.dir, { status: 'review', v, error: undefined, note: undefined });
      done.push(out);
    }
    return { rendered: done, warnings };
  });
}

/** Plans a chain without rendering: each part's window, its join, and the warnings. */
export const checkChain = ({ cwd = process.cwd(), piece }) => withChain({ cwd, piece }, async (r) => r);

// Serves the project, opens each part once to read its size, duration and marks, and plans the chain.
async function withChain({ cwd, piece }, fn) {
  const dir = pieceDir(piece, cwd), chain = readJson(path.join(dir, 'chain.json'), null);
  if (!chain) throw new Error(`no chain.json in ${path.relative(cwd, dir) || '.'} (pamo chain init first)`);
  if (!chain.parts?.length) throw new Error('chain.json has no parts');
  const missing = chain.parts.filter((p) => !p.id || !p.dir || !fs.existsSync(path.join(dir, p.dir, 'scene.html')));
  if (missing.length) throw new Error(`parts without a scene: ${missing.map((p) => p.name ?? p.id ?? '?').join(', ')} (set their id in chain.json and run chain init again)`);
  if (!fs.existsSync(path.join(cwd, 'brand'))) throw new Error('no brand/ here: run chain from the project root');
  const { startServer } = await import('./server.mjs');
  const { launch } = await import('./browser.mjs');
  const server = await startServer({ root: cwd });
  const url = (p) => `http://127.0.0.1:${server.port}/${path.relative(cwd, path.join(dir, p.dir, 'scene.html')).split(path.sep).map(encodeURIComponent).join('/')}?render`;
  try {
    const browser = await launch(), infos = [];
    try { for (const p of chain.parts) infos.push(await sceneInfo(browser, url(p))); } finally { await browser.close(); }
    const sizes = new Set(infos.map((x) => `${x.config.width}x${x.config.height}`));
    if (sizes.size > 1) throw new Error(`parts come in different sizes (${[...sizes].join(', ')}): set the same format in each CONFIG`);
    const planned = plan(chain, infos);
    // the length the brief asked for ("unos 20 s", "~20s", "16:9 · 20 s"): say so when the chain drifts from it
    const brief = readJson(path.join(dir, 'piece.json'), null)?.brief?.format ?? '';
    const want = Number(String(brief).match(/(\d+(?:[.,]\d+)?)\s*(?:s\b|sec|seg)/i)?.[1]?.replace(',', '.'));
    if (want > 0 && Math.abs(planned.total - want) > Math.max(1.5, want * 0.08)) planned.warnings.push(`the chain runs ${planned.total.toFixed(1)} s and the brief asks for about ${want} s: change some parts' seconds in chain.json, or the brief`);
    return await fn({ dir, chain, url, config: infos[0].config, ...planned });
  } finally { await server.close(); }
}

/** The ffmpeg graph: each part's join applied in turn, sound carried along, loudness set once at the end. */
async function join({ files, parts, out, ground, fps, music, lufs }) {
  const lens = files.map((f) => probe(f));
  const inputs = files.flatMap((f) => ['-i', f]);
  const g = [];
  // every part gets a sound track (silent if it declares none) so the audio chain lines up
  const A = lens.map((l, i) => {
    if (l.audio) { g.push(`[${i}:a]aformat=sample_rates=48000:channel_layouts=stereo,atrim=0:${l.duration.toFixed(3)},asetpts=PTS-STARTPTS[a${i}]`); return `[a${i}]`; }
    g.push(`anullsrc=r=48000:cl=stereo,atrim=0:${l.duration.toFixed(3)}[a${i}]`); return `[a${i}]`;
  });
  // a dip fades the parts on either side into the ground color
  const V = parts.map((p, i) => {
    const f = [`fps=${fps}`, 'format=yuv444p10le', 'settb=AVTB', 'setpts=PTS-STARTPTS'];
    const half = JOINS.dip / 2;
    if (parts[i + 1]?.join === 'dip') f.push(`fade=t=out:st=${(lens[i].duration - half).toFixed(3)}:d=${half}:color=${ground}`);
    if (p.join === 'dip') f.push(`fade=t=in:st=0:d=${half}:color=${ground}`);
    g.push(`[${i}:v]${f.join(',')}[v${i}]`);
    return `[v${i}]`;
  });
  let v = V[0], a = A[0], len = lens[0].duration;
  const smears = [];
  for (let i = 1; i < parts.length; i++) {
    const j = parts[i].join, d = JOINS[j];
    if (OVERLAP.has(j)) {
      const off = Math.max(0, len - d);
      g.push(`${v}${V[i]}xfade=transition=${j === 'whip' ? 'slideleft' : MOVE_JOINS[j]?.[0] ?? 'fade'}:duration=${d}:offset=${off.toFixed(3)}[x${i}]`);
      g.push(`${a}${A[i]}acrossfade=d=${d}:c1=tri:c2=tri[y${i}]`);
      if (j === 'whip') smears.push([off + d * 0.12, off + d * 0.88]);
      len = off + lens[i].duration;
    } else {
      g.push(`${v}${V[i]}concat=n=2:v=1:a=0[x${i}]`);
      g.push(`${a}${A[i]}concat=n=2:v=0:a=1[y${i}]`);
      len += lens[i].duration;
    }
    v = `[x${i}]`; a = `[y${i}]`;
  }
  // the whip's smear: a horizontal blur over the middle of each slide
  if (smears.length) {
    const on = smears.map(([s, e]) => `between(t\\,${s.toFixed(3)}\\,${e.toFixed(3)})`).join('+');
    g.push(`${v}split[sa][sb];[sb]gblur=sigma=${48}:sigmaV=0.5[sc];[sa][sc]overlay=enable='${on}'[vs]`);
    v = '[vs]';
  }
  const extra = [];
  if (music) {
    extra.push('-i', path.resolve(music));
    const m = files.length;
    g.push(`[${m}:a]aformat=sample_rates=48000:channel_layouts=stereo,atrim=0:${len.toFixed(3)},afade=t=out:st=${Math.max(0, len - 1).toFixed(3)}:d=1[mu]`);
    g.push(`${a}[mu]amix=inputs=2:normalize=0[am]`);
    a = '[am]';
  }
  g.push(`${a}loudnorm=I=${lufs}:TP=-2:LRA=11,aresample=48000[aout]`);
  g.push(`${v}scale=out_color_matrix=bt709:out_range=tv,format=yuv420p[vout]`);
  await run(FF(), ['-hide_banner', '-y', ...inputs, ...extra, '-filter_complex', g.join(';'), '-map', '[vout]', '-map', '[aout]',
    '-c:v', 'libx264', '-preset', 'slow', '-crf', '16', '-x264-params', 'aq-mode=3', '-colorspace', 'bt709', '-color_primaries', 'bt709', '-color_trc', 'bt709',
    '-c:a', 'aac', '-b:a', '320k', '-movflags', '+faststart', '-t', len.toFixed(3), out]);
  return { out, seconds: len };
}
