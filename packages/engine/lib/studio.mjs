// pamo studio: a local page where the user follows a piece through its stages, watches each stage's renders,
// approves or asks for changes, and edits the brief, the words on screen, lengths, joins and order by hand.
//
//   GET  /                         the studio page (studio/index.html)
//   GET  /api/pieces               pieces in this project that have a piece.json
//   GET  /api/piece?p=<piece>      everything the page shows: piece.json + chain + look + media
//   POST /api/piece?p=<piece>      an action: { type, … } (see act())
//   POST /api/focus?p=<piece>      brings the agent's app to the front (the app the CLI found itself running in)
//   GET  /files/<path>             files under the project (renders, drafts), with byte ranges for video
//
// Edits that need no judgment are applied here: a text goes into the part's CONFIG and the part re-renders as a
// draft; lengths, joins and order go into chain.json; and when the piece already has a joined draft, the studio
// joins it again by itself. Everything the user does is also an event in piece.json, which `pamo piece review`
// hands to the agent.
//
// The page always says whose turn it is: /api/piece carries whether a command of the agent is waiting on the piece
// (`agent.listening`), a question it asked in the chat (`ask`), the join in progress (`job`), and whether the
// joined draft or the final were made from something that has changed since (`media.assemblyStale`, `finalStale`).
import fs from 'node:fs';
import http from 'node:http';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { pieceDir, JOINS, chainSig, readSigs, readJob } from './chain.mjs';
import { STAGES, BRIEF_KEYS, readPiece, updatePiece, addEvent, eventLine, sceneTexts, setSceneText, listening, agentState, settleChoice } from './piece.mjs';
import { replyLine } from './live-board.js';
import { setArgs } from './customize.mjs';
import { videoView, editVideo, styleView, editStyle, undo, canUndo } from './edit.mjs';
import { KINDS, EDITABLE, ADDABLE, MULTI, PLAIN, GROUPS, listText, loadRaw, normalize, candidates, scenesOf, describe, applyEdit, evalFill, fillConfig } from './inventory.mjs';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const PAGE = path.join(HERE, '..', 'studio', 'index.html');
const SITE = (process.env.PAPER_MOTION_SITE ?? 'https://paper-motion.vercel.app').replace(/\/$/, '');
const TYPES = { '.mp4': 'video/mp4', '.webm': 'video/webm', '.mov': 'video/quicktime', '.gif': 'image/gif', '.png': 'image/png', '.jpg': 'image/jpeg', '.json': 'application/json', '.html': 'text/html; charset=utf-8', '.css': 'text/css', '.js': 'text/javascript', '.woff2': 'font/woff2' };
const readJson = (f, d) => { try { return JSON.parse(fs.readFileSync(f, 'utf8')); } catch { return d; } };

/** Pieces in the project that the studio can show. */
export function listPieces(cwd) {
  const root = path.join(cwd, 'pieces');
  if (!fs.existsSync(root)) return [];
  return fs.readdirSync(root).filter((d) => fs.existsSync(path.join(root, d, 'piece.json'))).map((d) => {
    const p = readJson(path.join(root, d, 'piece.json'), {});
    return { piece: d, title: p.title, stage: p.stage, status: p.stages?.[p.stage]?.status, updated: p.updated };
  }).sort((a, b) => String(b.updated).localeCompare(String(a.updated)));
}

const fileUrl = (cwd, f) => {
  if (!fs.existsSync(f)) return null;
  return `/files/${path.relative(cwd, f).split(path.sep).map(encodeURIComponent).join('/')}?v=${Math.round(fs.statSync(f).mtimeMs)}`;
};

/** Whether the piece's joined draft and final still show what the piece is now, and the join running on it. */
export function filmState(cwd, dir) {
  const name = path.basename(dir), sigs = readSigs(dir), sig = chainSig(cwd, dir), renders = path.join(dir, 'renders');
  const has = (f) => fs.existsSync(path.join(renders, f));
  const stale = (f) => has(f) && !!sigs[f]?.sig && sigs[f].sig !== sig;   // a render with no record is taken as current
  const job = readJob(dir);
  return {
    draft: has(`${name}-draft.mp4`), final: has(`${name}.mp4`), opts: sigs[`${name}-draft.mp4`] ?? {},
    assemblyStale: stale(`${name}-draft.mp4`), finalStale: stale(`${name}.mp4`),
    job: job ? { kind: job.kind, part: job.part ?? null, of: job.of ?? null, joining: !!job.joining } : null,
  };
}
const joinErrors = new Map();   // piece folder → why the studio's last join failed

// the blocks and shots that show content and the library's backgrounds, read once when the studio starts (the
// registry may be the site); LIVE is the scene server the page's live previews play from
let SCENES = [], BACKGROUNDS = [], TITLES = new Map(), PALETTES = [], FONTPAIRS = [], LIVE = null;
// How it looks: the library's palettes (every colour by role), font pairs (families and their stylesheets) and
// background resources (to recolour them into a palette), read with the index
let LOOK = { palettes: [], fonts: [], bgItems: new Map(), entrances: [], items: new Map() };
const building = new Set(), rendering = new Map();   // pieces whose first version or final is being made by the studio
// a resource's sample (clip and still): the repo's own when the studio runs inside it (new blocks show before the
// site has them), else the site's
const LOCAL_PREVIEWS = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../../../apps/web/public/previews');
const preview = (id, ext) => (fs.existsSync(path.join(LOCAL_PREVIEWS, `${id}.${ext}`)) ? `/previews/${id}.${ext}` : `${SITE}/previews/${id}.${ext}`);

// What of a block a person may tune: its numbers and its either/or choices (its words come from the content).
const NOT_TUNED = new Set(['format', 'background', 'fps', 'codec', 'winner', 'mark', 'detail', 'highlight']);
function tunables(block, filled, values = {}) {
  return (block.params ?? []).filter((p) => !filled.has(p.name) && !NOT_TUNED.has(p.name) && (p.type === 'enum' || p.type === 'number')).map((p) => {
    const d = p.default, num = p.type === 'number';
    const min = num ? p.min ?? +(d * 0.4).toFixed(2) : null, max = num ? p.max ?? +(d * 1.8).toFixed(2) : null;
    // a setting whose every choice has its own sample (a sentence's entrance) is chosen by watching them
    const demos = block.repeat?.param === p.name && block.repeat.previews ? (p.options ?? []).map((o) => { const r = block.repeat.previews[o]; return { value: o, title: TITLES.get(r) ?? o, clip: r ? preview(r, 'webm') : null, poster: r ? preview(r, 'jpg') : null }; }) : null;
    return { name: p.name, label: (p.description ?? p.name).replace(/^./, (c) => c.toUpperCase()), kind: num ? 'number' : 'enum', options: p.options ?? null, min, max, step: num ? +(Math.max((max - min) / 40, 0.01)).toFixed(2) : null, default: d, value: values[p.name] ?? d, set: p.name in values, demos, varies: block.repeat?.param === p.name };
  });
}
// the blocks that can show an item, in the order the page offers them: one that can play several times first
const ways = (it) => [...candidates(it, SCENES)].sort((a, b) => (b.repeat ? 1 : 0) - (a.repeat ? 1 : 0));
const filledBy = (block) => new Set(block.needs.flatMap((n) => Object.keys(n.fill ?? {})));
// the brand's own backgrounds (shader entries, not image filters), as the page shows them
const brandBackgrounds = (cwd) => (readJson(path.join(cwd, 'brand/shader-set/set.json'), {}).entries ?? []).filter((e) => e.shader && !e.image).map((e) => ({ id: e.id, title: e.id, colors: (e.props?.colors ?? [e.props?.colorBack, e.props?.colorFront]).filter((c) => /^#[0-9a-f]{6}/i.test(c ?? '')).slice(0, 5), entry: { shader: e.shader, props: e.props, background: e.background } }));

/**
 * A block as it will really play for one item: installed under pieces/<piece>/.try/, its CONFIG filled with the
 * item's content and the user's tuning, in the brand's look. Returns the address the page plays it from.
 */
async function tryScene(cwd, piece, itemId, blockId) {
  if (!LIVE) throw new Error('the live preview is not ready yet');
  const dir = pieceDir(piece, cwd), p = readPiece(dir), all = normalize(loadRaw(dir), { cwd }).all;
  const it = all.find((i) => i.id === itemId), b = SCENES.find((x) => x.id === blockId);
  if (!it || !b) throw new Error('no such item or block');
  const need = b.needs[0], fits = (i) => i.kind === need.kind && i.status !== 'removed' && (need.has ?? []).every((f) => i[f] !== undefined && i[f] !== '') && Object.entries(need.where ?? {}).every(([k, v]) => i[k] === v);
  const group = [it, ...all.filter((i) => i !== it && fits(i))].slice(0, need.count ?? 1);
  const fill = { ...evalFill(need.fill, group, p?.brief ?? {}) };
  for (const n of b.needs.slice(1)) if (n.kind === 'name') Object.assign(fill, evalFill(n.fill, [], p?.brief ?? {}));
  Object.assign(fill, it.tune ?? {});
  const sub = path.join('.try', `${it.id}--${b.id}`), file = path.join(dir, sub, 'scene.html');
  if (!fs.existsSync(file)) {
    const { add } = await import('./registry.mjs');
    const f = String(p?.brief?.format ?? ''), format = /9\s*:\s*16/.test(f) ? '1080x1920' : /1\s*:\s*1/.test(f) ? '1080x1080' : '1920x1080';
    await add([b.id], { cwd, force: true, name: path.join(path.relative(path.join(cwd, 'pieces'), dir), sub), set: (b.params ?? []).some((x) => x.name === 'format') ? [`format=${format}`] : [] });
  }
  fs.writeFileSync(file, fillConfig(fs.readFileSync(file, 'utf8'), fill));
  return { url: `${LIVE}/${path.relative(cwd, file).split(path.sep).map(encodeURIComponent).join('/')}?embed&v=${Date.now()}` };
}
/** The piece's inventory for the page: every item with where it stands, what can show it and what it lacks. */
function inventoryView(cwd, dir) {
  // the page speaks the user's language: everyday names, the fields a person would recognise, labelled
  const kinds = Object.fromEntries(ADDABLE.map((k) => [k, { name: PLAIN[k].name, fields: EDITABLE[k].filter((f) => PLAIN[k].fields[f]).map((f) => [f, PLAIN[k].fields[f], KINDS[k].needs.includes(f)]) }]));
  let raw = [], all = [];
  try { raw = loadRaw(dir); all = normalize(raw, { cwd }).all; } catch (e) { return { items: [], kinds, groups: GROUPS, error: e.message }; }
  const byId = new Map(raw.map((r) => [r.id, r]));
  const mine = brandBackgrounds(cwd), have = new Set(mine.map((m) => m.id));
  // about how many moments the length in the brief holds (a block runs about four seconds, the close is one of them)
  const secs = Number(String(readPiece(dir)?.brief?.format ?? '').match(/(\d+(?:\.\d+)?)\s*(?:s\b|sec|seconds?)/i)?.[1]) || null;
  return { kinds, groups: GROUPS, live: LIVE, moments: secs ? Math.max(2, Math.round((secs - 4) / 4.2) + 1) : null, seconds: secs, backgrounds: { mine, library: BACKGROUNDS.filter((b) => !have.has(b.id)) }, items: all.map((it) => {
    const K = KINDS[it.kind], r = byId.get(it.id) ?? {}, H = PLAIN[it.kind] ?? { name: it.kind, group: 'show', fields: {} };
    const how = (f) => MULTI[it.kind]?.[f] ?? 'text';
    return {
      id: it.id, kind: it.kind, name: H.name, group: H.group, status: it.status, must: !!it.must, what: { line: it.text, voice: it.script, command: it.command }[it.kind] ?? describe(it), source: it.source ?? '',   // a sentence or a command is shown whole
      missing: (it.missing ?? []).map((f) => H.fields[f] ?? f),
      // how it could look: the library's own samples of the blocks that show this kind of thing
      // a block that can play several times (a sentence, arriving its own way each time) is the first way to show it
      looks: ways(it).map((b) => ({ id: b.id, title: b.title ?? b.id, summary: b.summary ?? '', poster: preview(b.id, 'jpg'), clip: preview(b.id, 'webm') })),
      // the block the user picked for it (or none: the plan picks), and what of that block they may tune
      show: ways(it).some((b) => b.id === it.show) ? it.show : null, tune: it.tune ?? {},
      tunable: (() => { const c = ways(it), b = c.find((x) => x.id === it.show) ?? c[0]; return b ? tunables(b, filledBy(b), it.tune ?? {}) : []; })(),
      shown: K.role === 'bed' || it.kind === 'logo' ? 'always' : null,
      thumb: it.image ? fileUrl(cwd, path.join(cwd, it.image.replace(/^\//, ''))) : null,
      // [field, value as text, needed, how it is edited, its label]: only what a person would recognise
      fields: Object.entries(H.fields).map(([f, label]) => [f, how(f) === 'text' ? r[f] ?? '' : listText(r[f], how(f)), K.needs.includes(f), how(f), label]),
    };
  }) };
}

// What can be added to a video, by what the user wants to do, each named by what it does; and the transitions.
const INTENTS = [['say', 'Say something'], ['show', 'Show the product'], ['prove', 'Prove it'], ['how', 'How it works'], ['end', 'End']];
const JOIN_NAMES = { whip: 'Fast slide', crossfade: 'Soft fade', wipe: 'Wipe', push: 'Push', iris: 'Circle opens', 'zoom-through': 'Zoom through', flash: 'Flash', cells: 'Squares', slices: 'Strips', glitch: 'Glitch', 'flip-3d': 'Card flip', cut: 'Straight cut', dissolve: 'Dissolve', dip: 'Dip to your colour', 'mask-reveal': 'Mask', 'scan-reveal': 'Scan line', 'whip-pan': 'Whip pan' };
function libraryView() {
  const group = (b) => { const k = b.needs?.[0]?.kind; return !b.needs?.length ? null : k === 'name' || k === 'logo' ? 'end' : PLAIN[k]?.group === 'brand' ? 'end' : PLAIN[k]?.group ?? null; };
  const blocks = SCENES.map((b) => ({ id: b.id, title: b.title, summary: b.summary ?? '', group: group(b), poster: preview(b.id, 'jpg'), clip: preview(b.id, 'webm') })).filter((b) => b.group);
  return {
    intents: INTENTS.map(([id, title]) => ({ id, title, blocks: blocks.filter((b) => b.group === id) })).filter((g) => g.blocks.length),
    joins: Object.keys(JOINS).filter((j) => j !== 'dip' && j !== 'dissolve' || true).map((id) => ({ id, title: JOIN_NAMES[id] ?? id, poster: TITLES.has(id) ? preview(id, 'jpg') : null, clip: TITLES.has(id) ? preview(id, 'webm') : null })),
  };
}

// ── scene stills: one small frame of each scene as it really is (the user's words, brand and settings), for the
// list in Your video. Rendered one at a time, only when a scene changed, never while a final renders. Until a
// scene has one, the list shows the library's still of its block.
const stillJobs = [];
let stillBusy = false;
function sceneStill(cwd, dir, x, stamp) {
  const d = path.join(dir, '.stills'), img = path.join(d, `${x.dir}.png`), meta = path.join(d, `${x.dir}.json`), key = `${x.mtime}-${stamp}`;
  const have = fs.existsSync(img), was = readJson(meta, {}).key;
  if (was !== key && LIVE && !stillJobs.some((j) => j.img === img)) {
    stillJobs.push({ dir, img, meta, key, url: `${LIVE}/${path.relative(cwd, path.join(dir, x.dir, 'scene.html')).split(path.sep).map(encodeURIComponent).join('/')}?render`, t: (Number(x.duration) || 4) * 0.62 });
    setTimeout(runStills, 400);
  }
  return have ? fileUrl(cwd, img) : null;
}
async function runStills() {
  if (stillBusy) return;
  stillBusy = true;
  try {
    const { renderStills } = await import('./render.mjs');
    while (stillJobs.length) {
      const j = stillJobs[0];
      if (rendering.has(j.dir) || building.has(j.dir)) { await new Promise((r) => setTimeout(r, 3000)); continue; }
      stillJobs.shift();
      const out = fs.mkdtempSync(path.join(os.tmpdir(), 'pm-still-'));
      try {
        const r = await renderStills({ url: j.url, times: [j.t], outDir: out, dpr: 0.35, sheet: false });
        fs.mkdirSync(path.dirname(j.img), { recursive: true });
        fs.copyFileSync(r.files[0], j.img);
        fs.writeFileSync(j.meta, JSON.stringify({ key: j.key }));
      } catch { /* the list keeps the library's still */ } finally { fs.rmSync(out, { recursive: true, force: true }); }
    }
  } finally { stillBusy = false; }
}

// ── How it looks ────────────────────────────────────────────────────────────────────────────────────────────
const b64url = (o) => Buffer.from(JSON.stringify(o), 'utf8').toString('base64url');
const hexOf = (v) => (typeof v === 'string' ? v : v?.hex ?? null);
/** The sentence the look is judged with: the first one the user must show, else the first they kept, else the brief. */
function headline(cwd, dir) {
  try { const items = normalize(loadRaw(dir), { cwd }).items.filter((i) => i.kind === 'line'); return (items.find((i) => i.must) ?? items[0])?.text ?? readPiece(dir)?.brief?.what ?? ''; } catch { return readPiece(dir)?.brief?.what ?? ''; }
}
/** The brand's look as it is, and every option How it looks offers, as the page shows them (stills, no shaders). */
function lookView(cwd, dir) {
  const t = readJson(path.join(cwd, 'brand/tokens.json'), {}), m = readJson(path.join(cwd, 'brand/motion.json'), {});
  const set = readJson(path.join(cwd, 'brand/shader-set/set.json'), {}), entries = (set.entries ?? []).filter((e) => e.shader && !e.image);
  const colors = { ground: hexOf(t.colors?.ground), figure: hexOf(t.colors?.figure), accent: hexOf(t.colors?.accent) };
  const same = (a, b) => String(a ?? '').toLowerCase() === String(b ?? '').toLowerCase();
  const palette = LOOK.palettes.find((x) => ['ground', 'figure', 'accent'].every((k) => same(x.colors[k], colors[k])))?.id ?? (colors.ground ? 'custom' : null);
  const font = LOOK.fonts.find((f) => same(f.fonts.display.family, t.fonts?.display?.family) && same(f.fonts.text?.family, t.fonts?.text?.family))?.id ?? null;
  const mine = new Set(entries.map((e) => e.id));
  return {
    current: { colors, palette, font, display: t.fonts?.display?.family ?? null, text: t.fonts?.text?.family ?? null, background: entries[0]?.id ?? null, pace: m.pace ?? 'medium', entrance: m.entrance ?? null },
    headline: headline(cwd, dir), live: !!LIVE,
    palettes: LOOK.palettes.map((x) => ({ id: x.id, title: x.title, colors: x.colors })),
    fonts: LOOK.fonts.map((f) => ({ id: f.id, title: f.title, display: f.fonts.display.family, text: f.fonts.text?.family ?? null, css: [f.fonts.display.css, f.fonts.text?.css].filter(Boolean) })),
    backgrounds: [
      ...entries.map((e) => ({ id: e.id, title: TITLES.get(e.id) ?? e.id, mine: true, poster: fs.existsSync(path.join(LOCAL_PREVIEWS, `${e.id}.jpg`)) || TITLES.has(e.id) ? preview(e.id, 'jpg') : null, colors: (e.props?.colors ?? [e.props?.colorBack, e.props?.colorFront]).filter(Boolean).slice(0, 4) })),
      ...BACKGROUNDS.filter((b) => !mine.has(b.id)).map((b) => ({ id: b.id, title: b.title, mine: false, poster: preview(b.id, 'jpg'), colors: b.colors ?? [] })),
    ],
    entrances: LOOK.entrances, paces: ['calm', 'medium', 'fast'],
  };
}
/**
 * The look preview: the user's sentence in `line-in`, playing live from .try/look/, with a look laid over the brand
 * for this preview only (`?embed&look=…`, read by runtime/brand.js). `o` changes any of palette, colors, font,
 * background, pace, entrance; what it leaves out is the brand's own. One preview plays at a time.
 */
async function lookPreview(cwd, piece, o = {}) {
  if (!LIVE) throw new Error('the live preview is not ready yet');
  const dir = pieceDir(piece, cwd), sub = path.join('.try', 'look'), file = path.join(dir, sub, 'scene.html');
  if (!fs.existsSync(file)) { const { add } = await import('./registry.mjs'); await add(['line-in'], { cwd, force: true, name: path.join(path.relative(path.join(cwd, 'pieces'), dir), sub) }); }
  const text = headline(cwd, dir), html = fs.readFileSync(file, 'utf8'), want = fillConfig(html, { text, mark: '', entrance: null, background: null });
  if (want !== html) fs.writeFileSync(file, want);
  const t = readJson(path.join(cwd, 'brand/tokens.json'), {}), set = readJson(path.join(cwd, 'brand/shader-set/set.json'), {});
  const pal = o.palette ? LOOK.palettes.find((x) => x.id === o.palette)?.colors : null;
  const colors = { ...Object.fromEntries(Object.entries(t.colors ?? {}).map(([k, v]) => [k, hexOf(v)])), ...(pal ?? {}), ...(o.colors ?? {}) };
  const look = {};
  if (pal || o.colors) look.colors = colors;
  if (o.font) { const f = LOOK.fonts.find((x) => x.id === o.font); if (f) look.fonts = f.fonts; }
  // the background: the one asked for, else the brand's first; recoloured whenever the colours are not the brand's own
  const entries = (set.entries ?? []).filter((e) => e.shader && !e.image), bgId = o.background ?? entries[0]?.id;
  const item = LOOK.bgItems.get(bgId), own = entries.find((e) => e.id === bgId);
  if (item && (o.background || look.colors)) {
    const { recolor } = await import('./customize.mjs');
    const e = item.install?.entry ?? {};
    look.background = { ...e, id: bgId, props: { ...(e.props ?? {}), ...recolor(item, colors) } };
  } else if (own && o.background) look.background = own;
  if (o.pace) look.pace = o.pace;
  if (o.entrance) look.entrance = o.entrance;
  return { url: `${LIVE}/${path.relative(cwd, file).split(path.sep).map(encodeURIComponent).join('/')}?embed&look=${b64url(look)}&v=${Date.now()}` };
}

// ── choices from the agent (ADR 0005): what each option's card needs, and what the studio applies on a pick ──────
const COLOR_ROLES = ['ground', 'figure', 'muted', 'surface', 'accent'];
function itemFace(o) {
  const it = LOOK.items.get(o.id), type = it?.type ?? null, face = { id: o.id, type, title: `${it?.title ?? o.id}${Object.keys(o.values ?? {}).length ? ', tuned' : ''}` };
  if (type === 'palette') face.colors = { ...(LOOK.palettes.find((x) => x.id === o.id)?.colors ?? {}), ...Object.fromEntries(Object.entries(o.values ?? {}).filter(([k]) => COLOR_ROLES.includes(k))) };
  else if (type === 'font-pair') { const f = LOOK.fonts.find((x) => x.id === o.id); if (f) Object.assign(face, { display: f.fonts.display.family, text: f.fonts.text?.family ?? null, css: [f.fonts.display.css, f.fonts.text?.css].filter(Boolean) }); }
  else Object.assign(face, { poster: preview(o.id, 'jpg'), clip: type === 'background' ? null : preview(o.id, 'webm') });
  return face;
}
function choiceView(c) {
  const opt = (o) => {
    const base = { label: o.label, note: o.note ?? null };
    if (o.structure) return { ...base, title: o.structure.title, seconds: o.structure.duration, beats: o.structure.beats.map((b) => ({ name: b.name, what: b.what, id: b.id ?? null, from: b.from, to: b.to })) };
    if (c.board.kind === 'kit') return { ...base, title: `Look ${o.label}`, items: o.items.map(itemFace) };
    return { ...base, ...itemFace(o) };
  };
  return { id: c.id, title: c.board.title, ask: c.board.ask ?? null, where: c.where, status: c.status, line: c.line ?? null, options: c.board.options.map(opt) };
}
/** After a pick: what the studio itself applies to brand/ (palette, font pair, background); the rest is the agent's. */
async function applyChoice(cwd, dir, c, label) {
  const o = c.board.options.find((x) => x.label === label); if (!o) return;
  for (const x of c.board.kind === 'kit' ? o.items : [o]) {
    const type = LOOK.items.get(x.id)?.type;
    if (type === 'palette') {
      await editStyle(cwd, dir, { type: 'palette', value: x.id });
      for (const k of ['ground', 'figure', 'accent']) if (x.values?.[k]) await editStyle(cwd, dir, { type: 'color', key: k, value: x.values[k] });
    } else if (type === 'font-pair') await editStyle(cwd, dir, { type: 'font', value: x.id });
    else if (type === 'background') await editStyle(cwd, dir, { type: 'background', value: x.id });
  }
}

/** What the page shows for one piece. */
export function view(cwd, piece) {
  const dir = pieceDir(piece, cwd), p = readPiece(dir);
  if (!p) return null;
  const chain = readJson(path.join(dir, 'chain.json'), { parts: [] });
  const tokens = readJson(path.join(cwd, 'brand/tokens.json'), {}), set = readJson(path.join(cwd, 'brand/shader-set/set.json'), {});
  const movesDir = path.join(cwd, 'moves');
  const parts = (chain.parts ?? []).map((c) => {
    const html = c.dir ? (() => { try { return fs.readFileSync(path.join(dir, c.dir, 'scene.html'), 'utf8'); } catch { return ''; } })() : '';
    return {
      dir: c.dir, id: c.id, name: c.name ?? c.id, what: c.what ?? '', seconds: c.seconds ?? null, join: c.join ?? chain.join ?? 'whip',
      texts: sceneTexts(html), clip: c.id ? `${SITE}/previews/${c.id}.webm` : null,
      draft: c.dir ? fileUrl(cwd, path.join(dir, 'drafts', `${c.dir}.mp4`)) : null,
      ...(p.parts?.[c.dir] ?? { status: 'queued' }),
    };
  });
  const renders = path.join(dir, 'renders'), name = path.basename(dir), film = filmState(cwd, dir);
  const outputs = fs.existsSync(renders) ? fs.readdirSync(renders).filter((f) => !f.startsWith('.') && !f.includes('-draft')).map((f) => ({ file: f, url: fileUrl(cwd, path.join(renders, f)), bytes: fs.statSync(path.join(renders, f)).size })) : [];
  return {
    ...p, boards: p.boards ?? [], dir: path.relative(cwd, dir), format: chain.format ?? null, join: chain.join ?? 'whip', joins: Object.keys(JOINS),
    parts,
    inventory: inventoryView(cwd, dir),
    // Your video: the parts as the editor shows them, each playing live from the project, and what can be added
    video: (() => {
      const v = videoView(cwd, dir, SCENES); if (!v) return null;
      const rel = path.relative(cwd, dir).split(path.sep).map(encodeURIComponent).join('/');
      const stamp = styleView(cwd).stamp;
      for (const x of v.parts) { x.still = sceneStill(cwd, dir, x, stamp); x.live = LIVE ? `${LIVE}/${rel}/${encodeURIComponent(x.dir)}/scene.html?embed&rate=${x.rate}&v=${x.mtime}-${styleView(cwd).stamp}` : null; x.poster = preview(x.id, 'jpg'); x.clip = preview(x.id, 'webm');
        if (x.motion) x.motion.demos = x.motion.options.map((o) => ({ value: o, title: TITLES.get(x.motion.previews[o]) ?? o, poster: x.motion.previews[o] ? preview(x.motion.previews[o], 'jpg') : null, clip: x.motion.previews[o] ? preview(x.motion.previews[o], 'webm') : null })); }
      return v;
    })(),
    building: building.has(dir), rendering: rendering.get(dir) ?? null, undo: canUndo(dir),
    library: libraryView(),
    style: { ...styleView(cwd), palettes: PALETTES, fontpairs: FONTPAIRS },
    lookOptions: lookView(cwd, dir),   // How it looks: the brand's look now and every option, as stills
    choices: (p.choices ?? []).map(choiceView),   // what the agent put into the studio for the user to decide
    look: {
      colors: Object.entries(tokens.colors ?? {}).map(([k, v]) => [k, v?.hex ?? v]),
      fonts: Object.entries(tokens.fonts ?? {}).map(([k, v]) => [k, v?.family ?? v, v?.css ?? null]),
      backgrounds: (set.entries ?? []).map((e) => e.id),
      moves: fs.existsSync(movesDir) ? fs.readdirSync(movesDir).filter((f) => f.endsWith('.js')).map((f) => f.replace(/\.js$/, '')) : [],
    },
    media: { assembly: fileUrl(cwd, path.join(renders, `${name}-draft.mp4`)), final: fileUrl(cwd, path.join(renders, `${name}.mp4`)), outputs,
      assemblyStale: film.assemblyStale, finalStale: film.finalStale, error: joinErrors.get(dir) ?? null },
    job: film.job,
    ask: p.ask ?? null,
    // is a command of the agent waiting on this piece, how many of the user's moves it hasn't read, and the way back to it
    // only what can be checked: a question open, a command waiting on the piece now, or what it said it is doing (20 min)
    agent: { ...agentState(dir, p), app: p.agent?.app ?? null, focus: process.platform === 'darwin' && !!p.agent?.path, url: p.agent?.url ?? null },
    // the conversation in the studio: what the user sent (and when the agent read it) and the agent's replies
    thread: [
      ...p.events.filter((e) => (e.kind === 'changes' && !e.part) || e.kind === 'answer').map((e) => ({ who: 'you', text: e.kind === 'answer' ? `${e.q ? `“${e.q}” ` : ''}${e.text}` : e.text, at: e.at, read: e.readAt ?? (e.n <= (p.seen ?? 0) ? e.at : null) })),
      ...(p.notes ?? []).map((x) => ({ who: 'agent', text: x.text, at: x.at })),
    ].sort((x, y) => x.at.localeCompare(y.at)),
    unread: p.events.filter((e) => e.n > (p.seen ?? 0)).length,
  };
}

// boards still waiting: ask the site (at most every 4 s per board) whether the user chose, so the studio shows it
const asked = new Map();
async function refreshBoards(cwd, piece) {
  const dir = pieceDir(piece, cwd), p = readPiece(dir);
  for (const b of p?.boards ?? []) {
    if (b.status !== 'waiting' || !b.id || Date.now() - (asked.get(b.id) ?? 0) < 4000) continue;
    asked.set(b.id, Date.now());
    try {
      const res = await fetch(`${SITE}/api/boards/${b.id}/choice`, { signal: AbortSignal.timeout(2500) });
      if (res.status === 200) { const { line } = await res.json(); updatePiece(dir, (q) => { const x = q.boards.find((y) => y.id === b.id); if (x) { x.status = 'chosen'; x.line = line; } }); }
    } catch { /* offline: the agent's own wait still gets it */ }
  }
}

// ── actions from the page ───────────────────────────────────────────────────────────────────
function act(cwd, piece, a, queue) {
  const dir = pieceDir(piece, cwd), chainFile = path.join(dir, 'chain.json');
  const chain = () => readJson(chainFile, { parts: [] }), saveChain = (c) => fs.writeFileSync(chainFile, JSON.stringify(c, null, 2) + '\n');
  const text = (v) => String(v ?? '').trim();
  const film = filmState(cwd, dir), past = (p, stage) => STAGES.indexOf(p.stage) > STAGES.indexOf(stage);
  let rerender = null, keep = false;
  // an edit by hand re-renders a part; one that was approved, in a piece already past Parts, stays approved
  const redo = (p, part) => { keep = p.parts[part]?.status === 'approved' && past(p, 'parts'); p.parts[part] = { ...(p.parts[part] ?? {}), status: 'queued' }; rerender = part; };
  updatePiece(dir, (p) => {
    switch (a.type) {
      case 'approve': {   // a stage
        if (!STAGES.includes(a.stage)) throw new Error('bad stage');
        if (a.stage === 'parts' && Object.values(p.parts).some((x) => x.status !== 'approved')) throw new Error('approve every part first');
        if (a.stage === 'inventory') {
          const inv = loadRaw(dir);
          if (inv.some((i) => i.status === 'proposed')) throw new Error('keep or remove every proposal first');
          if (!inv.some((i) => !i.status || i.status === 'kept')) throw new Error('there is nothing to show yet');
          const short = normalize(inv, { cwd }).items.filter((i) => i.missing.length);
          if (short.length) throw new Error(`${short[0].id} still needs ${short[0].missing.join(', ')}: fill it in or remove it`);
        }
        // never approve a film that no longer shows the piece as it is
        if (a.stage === 'video' && !fs.existsSync(path.join(dir, 'chain.json'))) throw new Error('there is no video yet');
        if (['assembly', 'final'].includes(a.stage)) {
          if (film.job?.kind === a.stage || film[`${a.stage}Stale`]) throw new Error('this video is being updated: wait for the new one');
          if (Object.values(p.parts).some((x) => ['changes', 'queued', 'rendering'].includes(x.status))) throw new Error('a part is still changing: wait for the new video');
        }
        p.stages[a.stage] = { status: 'approved', at: new Date().toISOString() };
        const next = STAGES[STAGES.indexOf(a.stage) + 1];
        // How it looks is the user's step: it opens ready to choose (or done, when the brand already settles it)
        if (next === 'look') { if (STAGES.indexOf(p.stage) < STAGES.indexOf('look')) p.stage = next; if (p.stages.look.status !== 'approved') p.stages.look = { status: 'review', since: new Date().toISOString() }; }
        else if (next && !(a.stage === 'look' && STAGES.indexOf(p.stage) > STAGES.indexOf('look'))) { p.stage = next; if (p.stages[next].status === 'pending') p.stages[next] = { status: 'working', since: new Date().toISOString() }; }
        addEvent(p, { kind: 'approve', stage: a.stage });
        break;
      }
      case 'changes': {   // a stage, or a part when a.part
        const t = text(a.text); if (!t) throw new Error('say what to change');
        if (a.part) { p.parts[a.part] = { ...(p.parts[a.part] ?? {}), status: 'changes', note: t }; addEvent(p, { kind: 'changes', stage: 'parts', part: a.part, text: t }); }
        else { p.stages[a.stage] = { status: 'changes', note: t, since: new Date().toISOString() }; p.stage = a.stage; addEvent(p, { kind: 'changes', stage: a.stage, text: t }); }
        break;
      }
      case 'reopen': { p.stages[a.stage] = { status: 'review' }; addEvent(p, { kind: 'reopen', stage: a.stage }); break; }
      case 'message': {   // Ask your agent: a request, read as a changes line, that leaves the stage where it is
        const t = text(a.text); if (!t) throw new Error('say what you need');
        addEvent(p, { kind: 'changes', stage: p.stage, text: t, msg: true });
        break;
      }
      case 'answer': {   // the agent's open question, answered here
        const t = text(a.text); if (!t) throw new Error('write your answer');
        addEvent(p, { kind: 'answer', text: t, q: p.ask?.text ?? null });
        delete p.ask;
        break;
      }
      case 'ask-close': { delete p.ask; break; }   // answered in the chat instead
      case 'choose': {   // a pick on a choice the agent put here, or none of them with what they'd rather see
        const c = (p.choices ?? []).find((x) => x.id === a.choice); if (!c) throw new Error('no such choice');
        let line;
        if (a.none) line = replyLine(c.board, { none: true, text: text(a.text) });
        else {
          const o = c.board.options.find((x) => x.label === a.label); if (!o) throw new Error('no such option');
          const it = o.id ? LOOK.items.get(o.id) : null;
          line = replyLine(c.board, { label: o.label, setArgs: it && o.values && Object.keys(o.values).length ? setArgs(it, o.values) : [] });
        }
        settleChoice(p, c.id, line);
        break;
      }
      case 'approve-part': { p.parts[a.part] = { ...(p.parts[a.part] ?? {}), status: 'approved', note: undefined }; addEvent(p, { kind: 'approve', stage: 'parts', part: a.part }); break; }
      case 'brief': {
        if (!BRIEF_KEYS.includes(a.key)) throw new Error('bad brief key');
        const t = text(a.value); if (t === p.brief[a.key]) break;
        p.brief[a.key] = t;
        // an approved brief that changes comes back for the user to confirm
        if (p.stages.brief.status === 'approved') p.stages.brief = { status: 'review', note: 'edited by hand' };
        addEvent(p, { kind: 'edit', stage: 'brief', key: a.key, text: t });
        break;
      }
      case 'inv-show': case 'inv-tune': {   // how an item is shown: the block, its settings, its background
        const it = normalize(loadRaw(dir), { cwd }).all.find((i) => i.id === a.id); if (!it) throw new Error('no such item');
        const c = ways(it);
        if (a.type === 'inv-show') { const b = c.find((x) => x.id === a.value); if (a.value && !b) throw new Error('that block cannot show this'); a.title = b?.title; }
        else {
          const b = c.find((x) => x.id === (a.block ?? it.show)) ?? c[0]; if (!b) throw new Error('nothing shows this item yet');
          if (a.key === 'background') { if (a.value && !brandBackgrounds(cwd).some((m) => m.id === a.value)) throw new Error('that background is not in your brand yet: add it first'); a.label = 'background'; }
          else {
            const t = tunables(b, filledBy(b)).find((x) => x.name === a.key); if (!t) throw new Error(`"${a.key}" is not a setting of ${b.title ?? b.id}`);
            if (a.value !== '' && a.value != null) { if (t.kind === 'number') { const n = Number(a.value); if (!Number.isFinite(n)) throw new Error('a number, please'); a.value = Math.min(t.max, Math.max(t.min, n)); } else if (!t.options.includes(a.value)) throw new Error('not one of the choices'); }
            a.label = t.label;
            // tuning a block means wanting that block: it stays the one that shows this item
            if (it.show !== b.id) applyEdit(dir, { type: 'inv-show', id: it.id, value: b.id, title: b.title });
          }
        }
        const said = applyEdit(dir, a);
        if (p.stages.inventory.status === 'approved') p.stages.inventory = { status: 'review', note: 'edited by hand' };
        addEvent(p, { kind: 'edit', stage: 'inventory', key: said.key, text: said.text, say: said.human });
        break;
      }
      case 'inv-status': case 'inv-rest': case 'inv-must': case 'inv-field': case 'inv-add': {   // the inventory, by hand
        const said = applyEdit(dir, a);
        // an approved inventory that changes comes back for the user to confirm (and the plan made from it is old)
        if (p.stages.inventory.status === 'approved') p.stages.inventory = { status: 'review', note: 'edited by hand' };
        addEvent(p, { kind: 'edit', stage: 'inventory', key: said.key, text: said.text, say: said.human });   // `say`: the same, in the user's words, for the page
        break;
      }
      case 'what': {   // a part's description: a note for the agent, kept in chain.json
        const c = chain(), part = c.parts.find((x) => x.dir === a.part); if (!part) throw new Error('no such part');
        part.what = text(a.value); saveChain(c);
        addEvent(p, { kind: 'edit', stage: 'parts', part: a.part, key: 'what', text: part.what });
        break;
      }
      case 'text': {   // a word on screen: straight into the scene's CONFIG, then a fresh draft
        const f = path.join(dir, a.part, 'scene.html');
        fs.writeFileSync(f, setSceneText(fs.readFileSync(f, 'utf8'), a.key, text(a.value)));
        redo(p, a.part);
        addEvent(p, { kind: 'edit', stage: 'parts', part: a.part, key: a.key, text: text(a.value), rerendered: true });
        break;
      }
      case 'seconds':
      case 'join': {
        const c = chain(), part = c.parts.find((x) => x.dir === a.part); if (!part) throw new Error('no such part');
        if (a.type === 'seconds') {
          const n = Number(a.value);
          if (!String(a.value ?? '').trim() || !Number.isFinite(n)) throw new Error('give a length in seconds');
          part.seconds = Math.max(0.5, Math.min(30, n)); redo(p, a.part);
        }
        else { if (!(a.value in JOINS)) throw new Error('bad join'); part.join = a.value; }
        saveChain(c);
        addEvent(p, { kind: 'edit', stage: 'parts', part: a.part, key: a.type, text: String(a.type === 'seconds' ? part.seconds : part.join), rerendered: a.type === 'seconds' });
        break;
      }
      case 'order': {
        const c = chain(), by = new Map(c.parts.map((x) => [x.dir, x]));
        if (a.order.length !== c.parts.length || a.order.some((d) => !by.has(d))) throw new Error('bad order');
        c.parts = a.order.map((d) => by.get(d)); saveChain(c);
        addEvent(p, { kind: 'order', stage: 'parts', text: a.order.join(',') });
        break;
      }
      default: throw new Error(`unknown action ${a.type}`);
    }
  });
  // An edit by hand changes what the joined video shows. A draft that exists is joined again here, by the studio
  // (no judgment needed, so no waiting for the agent). The full-quality final is the agent's: it goes back to it.
  if (['text', 'order', 'seconds', 'join'].includes(a.type)) {
    updatePiece(dir, (p) => {
      const ev = p.events.at(-1);
      if (film.draft) ev.rejoined = true;
      if (p.stages.final.status !== 'pending') {   // the final was reached: it no longer shows the piece
        p.stages.final = { status: 'changes', note: 'You edited the piece by hand, so the final needs a new render.', since: new Date().toISOString() };
        ev.refinal = true;
      }
    });
    joinErrors.delete(dir);
  }
  if (rerender) queue.part(piece, rerender, keep);
  if (film.draft && ['text', 'order', 'seconds', 'join'].includes(a.type)) queue.join(piece);
  const p = readPiece(dir);
  return { ok: true, line: eventLine(p, p.events.at(-1)) };
}

// ── Your video: edits that need no judgment, made here; each reaches the agent as one line ──────────────────────
async function actVideo(cwd, piece, a, log) {
  const dir = pieceDir(piece, cwd), p = readPiece(dir); if (!p) throw new Error('no such piece');
  let said;
  if (a.type === 'undo') said = { say: `Undid ${undo(cwd, dir)}` };
  else if (a.type === 'render') { renderFinal(cwd, piece, log); said = { say: 'Rendering the final' }; }
  else if (a.type.startsWith('style-')) said = await editStyle(cwd, dir, { ...a, type: a.type.slice(6) });
  else said = await editVideo(cwd, dir, { ...a, type: a.type.slice(2) }, SCENES, { ...p.brief, title: p.title });
  updatePiece(dir, (q) => {
    // an edit to a video already approved sends it back to the user, and a final made before it is out of date
    if (a.type !== 'render') {
      if (q.stages.video?.status === 'approved') q.stages.video = { status: 'review', note: 'edited by hand' };
      if (q.stages.final?.status && q.stages.final.status !== 'pending') q.stages.final = { status: 'changes', note: 'You changed the video, so the final needs a new render.', since: new Date().toISOString() };
    }
    addEvent(q, { kind: 'edit', stage: 'video', key: a.type, text: said.say, say: said.say });
  });
  return { ok: true, ...said };
}
function buildFirst(cwd, piece, log) {
  const dir = pieceDir(piece, cwd);
  if (fs.existsSync(path.join(dir, 'chain.json')) || building.has(dir)) return;
  building.add(dir);
  const p = readPiece(dir);
  editVideo(cwd, dir, { type: 'build' }, SCENES, { ...p.brief, title: p.title })
    .then((r) => updatePiece(dir, (q) => { q.stage = 'video'; q.stages.video = { status: 'review', since: new Date().toISOString() }; addEvent(q, { kind: 'edit', stage: 'video', key: 'build', text: r.say, say: r.say }); }))
    .catch((e) => { log(`✗ building ${piece}: ${e.message}`); joinErrors.set(dir, e.message.split('\n')[0]); })
    .finally(() => building.delete(dir));
}
function renderFinal(cwd, piece, log) {
  const dir = pieceDir(piece, cwd); if (rendering.has(dir)) return;
  rendering.set(dir, { started: Date.now() });
  import('./chain.mjs').then((c) => c.renderChain({ cwd, piece, motionBlur: 5, onStep: (e) => { if (e.part) rendering.set(dir, { started: rendering.get(dir)?.started, part: e.part, of: e.of }); else if (e.joining) rendering.set(dir, { started: rendering.get(dir)?.started, joining: true }); } }))
    .then((r) => updatePiece(dir, (q) => { q.stage = 'final'; q.stages.final = { status: 'review', since: new Date().toISOString() }; addEvent(q, { kind: 'edit', stage: 'final', key: 'render', text: `rendered ${path.basename(r.out)}`, say: 'The final is ready' }); }))
    .catch((e) => { log(`✗ final ${piece}: ${e.message}`); joinErrors.set(dir, e.message.split('\n')[0]); })
    .finally(() => rendering.delete(dir));
}

/**
 * The studio's own renders after an edit by hand, one at a time: parts first (each as a draft), then, once no part
 * is left, the joined draft again with the sound it was made with. The engine needs no agent for either.
 */
function renderQueue(cwd, log) {
  const parts = [], joins = new Set();
  let busy = false;
  const next = async () => {
    if (busy || (!parts.length && !joins.size)) return;
    busy = true;
    const chainLib = await import('./chain.mjs');
    if (parts.length) {
      const [piece, part, keep] = parts.shift(), dir = pieceDir(piece, cwd);
      try {
        await chainLib.renderDrafts({ cwd, piece, only: [part] });
        if (keep) updatePiece(dir, (p) => { if (p.parts[part]?.status === 'review' && !p.parts[part].error) p.parts[part].status = 'approved'; });
        log(`re-rendered ${piece}/${part}`);
      } catch (e) { log(`✗ ${piece}/${part}: ${e.message}`); }
    } else {
      const piece = joins.values().next().value, dir = pieceDir(piece, cwd);
      joins.delete(piece);
      try {
        // a join the agent already started covers this edit only if it began after it: wait for it, then look again
        while (chainLib.readJob(dir)?.kind === 'assembly') await new Promise((r) => setTimeout(r, 1000));
        const film = filmState(cwd, dir);
        if (film.assemblyStale || !film.opts.sig) {
          await chainLib.renderChain({ cwd, piece, draft: true, sfx: film.opts.sfx ?? true, audio: film.opts.audio });
          log(`joined ${piece} again`);
        }
        joinErrors.delete(dir);
      } catch (e) {
        // the studio could not: say so on the page and hand the join to the agent
        const why = String(e.message ?? e).split('\n')[0].slice(0, 240);
        log(`✗ join ${piece}: ${why}`);
        joinErrors.set(dir, why);
        try { updatePiece(dir, (p) => { addEvent(p, { kind: 'failed', stage: 'assembly', text: why, rejoin: true }); }); } catch { /* the piece is gone */ }
      }
    }
    busy = false; next();
  };
  return {
    part: (piece, part, keep = false) => { if (!parts.some(([a, b]) => a === piece && b === part)) parts.push([piece, part, keep]); next(); },
    join: (piece) => { joins.add(piece); next(); },
  };
}

function sendFile(req, res, f) {
  const st = fs.statSync(f), type = TYPES[path.extname(f).toLowerCase()] ?? 'application/octet-stream';
  const range = req.headers.range?.match(/bytes=(\d*)-(\d*)/);
  if (range) {
    const start = range[1] ? Number(range[1]) : 0, end = range[2] ? Number(range[2]) : st.size - 1;
    res.writeHead(206, { 'Content-Type': type, 'Content-Range': `bytes ${start}-${end}/${st.size}`, 'Accept-Ranges': 'bytes', 'Content-Length': end - start + 1, 'Cache-Control': 'no-cache' });
    fs.createReadStream(f, { start, end }).pipe(res);
  } else {
    res.writeHead(200, { 'Content-Type': type, 'Content-Length': st.size, 'Accept-Ranges': 'bytes', 'Cache-Control': 'no-cache' });
    fs.createReadStream(f).pipe(res);
  }
}

export function startStudio({ cwd = process.cwd(), port = 4317, log = console.log } = {}) {
  const queue = renderQueue(cwd, log);
  import('./registry.mjs').then(async (r) => {
    const i = await r.getIndex();
    // the site's index is light (params by name only, no install data): the studio needs the full resource of every
    // palette, font pair and background (How it looks) and of every block and shot (their settings and entrances),
    // fetched a few at a time when the index lacks it (a local registry already has it)
    const light = (i.items ?? []).filter((x) => ['palette', 'font-pair', 'background', 'block', 'shot'].includes(x.type) && (!x.install || (x.params ?? []).some((q) => typeof q === 'string')));
    for (let k = 0; k < light.length; k += 8) {
      const full = await Promise.all(light.slice(k, k + 8).map((x) => r.getItem(x.id).catch(() => null)));
      for (const f of full) if (f) { const at = i.items.findIndex((x) => x.id === f.id); if (at >= 0) i.items[at] = { ...i.items[at], ...f }; }
    }
    return i;
  }).then((i) => {   // offline: items show without their blocks
    SCENES = scenesOf(i); TITLES = new Map((i.items ?? []).map((x) => [x.id, x.title]));
    PALETTES = (i.items ?? []).filter((x) => x.type === 'palette').map((x) => ({ id: x.id, title: x.title, colors: x.colors ?? [] }));
    FONTPAIRS = (i.items ?? []).filter((x) => x.type === 'font-pair').map((x) => ({ id: x.id, title: x.title }));
    const def = (x, k) => x.params?.find((q) => q.name === k)?.default;
    LOOK.palettes = (i.items ?? []).filter((x) => x.type === 'palette').map((x) => ({ id: x.id, title: x.title, colors: Object.fromEntries(['ground', 'figure', 'muted', 'surface', 'accent'].map((k) => [k, def(x, k)]).filter(([, v]) => v)) }));
    LOOK.fonts = (i.items ?? []).filter((x) => x.type === 'font-pair' && x.install?.entry?.fonts?.display).map((x) => ({ id: x.id, title: x.title, fonts: x.install.entry.fonts, type: x.install.entry.type ?? null }));
    LOOK.bgItems = new Map((i.items ?? []).filter((x) => x.type === 'background').map((x) => [x.id, x]));
    LOOK.items = new Map((i.items ?? []).map((x) => [x.id, x]));
    const li = (i.items ?? []).find((x) => x.id === 'line-in');
    LOOK.entrances = (li?.params?.find((q) => q.name === 'entrance')?.options ?? []).map((o) => { const r = li.repeat?.previews?.[o]; return { value: o, title: TITLES.get(r) ?? o, poster: r ? preview(r, 'jpg') : null, clip: r ? preview(r, 'webm') : null }; });
    BACKGROUNDS = (i.items ?? []).filter((x) => x.type === 'background' && x.install?.entry?.shader && !x.install.entry.image).map((x) => ({ id: x.id, title: x.title, colors: x.colors ?? [], entry: { shader: x.install.entry.shader, props: x.install.entry.props, background: x.install.entry.background } }));
  }).catch(() => {});
  // the page's live previews (a block with the user's content, a background) play from a scene server on this project
  import('./server.mjs').then((m) => m.startServer({ root: cwd })).then((sv) => { LIVE = `http://127.0.0.1:${sv.port}`; }).catch((e) => log(`live previews are off: ${e.message}`));
  const json = (res, code, body) => { res.writeHead(code, { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' }); res.end(JSON.stringify(body)); };
  const server = http.createServer(async (req, res) => {
    const u = new URL(req.url, 'http://x');
    try {
      if (u.pathname === '/' || u.pathname === '/index.html') { res.writeHead(200, { 'Content-Type': TYPES['.html'], 'Cache-Control': 'no-store' }); return res.end(fs.readFileSync(PAGE)); }
      if (u.pathname.startsWith('/fonts/')) {   // the studio's own typefaces, served locally so it works offline
        const f = path.join(path.dirname(PAGE), 'fonts', path.basename(u.pathname));
        if (!fs.existsSync(f)) { res.writeHead(404); return res.end(); }
        res.writeHead(200, { 'Content-Type': TYPES[path.extname(f)] ?? 'application/octet-stream', 'Cache-Control': 'max-age=86400' });
        return res.end(fs.readFileSync(f));
      }
      if (u.pathname === '/api/pieces') return json(res, 200, listPieces(cwd));
      if (u.pathname === '/api/info') return json(res, 200, { app: 'paper-motion-studio', cwd: path.resolve(cwd), pid: process.pid });
      if (u.pathname === '/api/piece') {
        const piece = u.searchParams.get('p');
        if (req.method === 'POST') {
          let body = ''; for await (const c of req) body += c;
          try {
            const a = JSON.parse(body || '{}');
            if (/^(v-|style-)|^undo$|^render$/.test(a.type)) return json(res, 200, await actVideo(cwd, piece, a, log));
            const r = act(cwd, piece, a, queue);
            // a pick on the agent's palette, font pair or background is applied at once, like any card here
            if (a.type === 'choose' && !a.none) { const dir = pieceDir(piece, cwd), c = (readPiece(dir).choices ?? []).find((x) => x.id === a.choice); if (c) await applyChoice(cwd, dir, c, a.label); }
            // choosing how it looks builds the first version of the video, by itself: the user lands on something to edit
            if (a.type === 'approve' && a.stage === 'look') buildFirst(cwd, piece, log);
            return json(res, 200, r);
          } catch (e) { return json(res, 400, { error: e.message.split('\n')[0] }); }
        }
        await refreshBoards(cwd, piece);
        const v = view(cwd, piece);
        return v ? json(res, 200, v) : json(res, 404, { error: `no piece "${piece}"` });
      }
      if (u.pathname.startsWith('/previews/')) {   // the repo's own samples (see preview())
        const f = path.join(LOCAL_PREVIEWS, path.basename(u.pathname));
        if (!fs.existsSync(f)) { res.writeHead(404); return res.end(); }
        return sendFile(req, res, f);
      }
      if (u.pathname === '/api/look' && req.method === 'POST') {   // How it looks: the user's sentence with a look laid over
        let body = ''; for await (const c of req) body += c;
        try { return json(res, 200, await lookPreview(cwd, u.searchParams.get('p'), JSON.parse(body || '{}'))); } catch (e) { return json(res, 400, { error: e.message.split('\n')[0] }); }
      }
      if (u.pathname === '/api/try' && req.method === 'POST') {   // a block playing live with one item's content
        let body = ''; for await (const c of req) body += c;
        try { const a = JSON.parse(body || '{}'); return json(res, 200, await tryScene(cwd, u.searchParams.get('p'), a.id, a.block)); } catch (e) { return json(res, 400, { error: e.message.split('\n')[0] }); }
      }
      if (u.pathname === '/api/background' && req.method === 'POST') {   // a library background into the brand, in its colours
        let body = ''; for await (const c of req) body += c;
        try {
          const a = JSON.parse(body || '{}'), b = BACKGROUNDS.find((x) => x.id === a.id); if (!b) throw new Error('no such background');
          const { add } = await import('./registry.mjs');
          await add([b.id], { cwd, palette: 'brand' });
          const dir = pieceDir(u.searchParams.get('p'), cwd);
          updatePiece(dir, (p) => { addEvent(p, { kind: 'edit', stage: 'inventory', key: 'brand background', text: b.id, say: `Added a background to your brand: ${b.title}` }); });
          return json(res, 200, { ok: true });
        } catch (e) { return json(res, 400, { error: e.message.split('\n')[0] }); }
      }
      if (u.pathname === '/api/focus' && req.method === 'POST') {
        // back to the agent: the app its CLI runs in, as recorded in piece.json by that CLI
        const app = readPiece(pieceDir(u.searchParams.get('p') ?? '', cwd))?.agent?.path;
        if (process.platform !== 'darwin' || !app || !app.endsWith('.app') || !fs.existsSync(app)) return json(res, 400, { error: 'no app to open' });
        const { spawn } = await import('node:child_process');
        spawn('open', ['-a', app], { detached: true, stdio: 'ignore' }).on('error', () => {}).unref();
        return json(res, 200, { ok: true });
      }
      if (u.pathname.startsWith('/files/')) {
        const f = path.resolve(cwd, decodeURIComponent(u.pathname.slice(7)));
        if (!f.startsWith(path.resolve(cwd) + path.sep) || !fs.existsSync(f) || fs.statSync(f).isDirectory()) { res.writeHead(404); return res.end(); }
        return sendFile(req, res, f);
      }
      res.writeHead(404); res.end();
    } catch (e) { json(res, 500, { error: e.message }); }
  });
  return new Promise((resolve, reject) => {
    server.on('error', reject);
    server.listen(port, '127.0.0.1', () => resolve({ server, port: server.address().port, close: () => new Promise((r) => server.close(r)) }));
  });
}

// ── one studio per project, in the background ─────────────────────────────────────────────────
const FIRST_PORT = 4317, LAST_PORT = 4336;
async function probe(port) {
  try {
    const r = await fetch(`http://127.0.0.1:${port}/api/info`, { signal: AbortSignal.timeout(800) });
    return r.ok ? await r.json() : { busy: true };
  } catch (e) { return e?.cause?.code === 'ECONNREFUSED' ? null : { busy: true }; }
}

/** The studio serving this project, if one is running: { port, url }. */
export async function findStudio(cwd = process.cwd()) {
  for (let port = FIRST_PORT; port <= LAST_PORT; port++) {
    const info = await probe(port);
    if (info?.app === 'paper-motion-studio' && info.cwd === path.resolve(cwd)) return { port, url: `http://127.0.0.1:${port}/`, pid: info.pid };
  }
  return null;
}

/**
 * Makes sure this project has a studio running: reuses it, or starts one detached (it outlives the command, so the
 * user's page keeps working between the agent's steps) on the first free port. `pamo studio --stop` ends it.
 */
export async function ensureStudio(cwd = process.cwd(), { bin } = {}) {
  const found = await findStudio(cwd);
  if (found) return { ...found, started: false };
  let port = FIRST_PORT;
  while (port <= LAST_PORT && (await probe(port))) port++;
  if (port > LAST_PORT) throw new Error(`no free port between ${FIRST_PORT} and ${LAST_PORT} for the studio`);
  const { spawn } = await import('node:child_process');
  const child = spawn(process.execPath, [bin, 'studio', '--port', String(port)], { cwd, detached: true, stdio: 'ignore' });
  child.unref();
  for (let i = 0; i < 40; i++) {
    await new Promise((res) => setTimeout(res, 150));
    const info = await probe(port);
    if (info?.app === 'paper-motion-studio') return { port, url: `http://127.0.0.1:${port}/`, pid: info.pid, started: true };
  }
  throw new Error(`the studio didn't start on port ${port} (run: npx paper-motion studio --port ${port})`);
}

/** Opens a URL in the user's browser (macOS, Windows, Linux); quietly does nothing where it can't. */
export async function openInBrowser(url) {
  if (process.env.CI || process.env.PAPER_MOTION_NO_OPEN) return false;
  const { spawn } = await import('node:child_process');
  const [cmd, args] = process.platform === 'darwin' ? ['open', [url]] : process.platform === 'win32' ? ['cmd', ['/c', 'start', '', url]] : ['xdg-open', [url]];
  try { spawn(cmd, args, { detached: true, stdio: 'ignore' }).on('error', () => {}).unref(); return true; } catch { return false; }
}
