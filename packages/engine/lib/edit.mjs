// Your video: the piece as the user edits it in the studio. Everything here needs no judgment, so the studio does it
// itself and the agent only reads what happened: the words and numbers of a part, how it arrives, its background and
// settings, its length, the transition after it, the order, adding, duplicating, swapping and removing parts, the
// brand's colours, type and pace, and building the first version from the inventory. Every change can be undone.
//
// The files stay the source of truth: chain.json (order, seconds, joins), each part's scene.html CONFIG (its content
// and settings), brand/tokens.json and brand/motion.json (the style).

import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import { fillConfig, evalFill, normalize, loadRaw, propose, writePlan, describe, lengthRange } from './inventory.mjs';

const readJson = (f, d) => { try { return JSON.parse(fs.readFileSync(f, 'utf8')); } catch { return d; } };
const writeJson = (f, v) => fs.writeFileSync(f, JSON.stringify(v, null, 2) + '\n');
const human = (k) => k.replace(/([a-z])([A-Z])/g, '$1 $2').replace(/[-_]/g, ' ').replace(/^./, (c) => c.toUpperCase());

// ── a part's CONFIG ────────────────────────────────────────────────────────────────────────────────────────────

/** The CONFIG object of a scene, read as data (it is a literal: no code of the scene runs). */
export function readConfig(html) {
  const start = html.indexOf('const CONFIG = {'), end = html.indexOf('\n};', start);
  if (start < 0 || end < 0) return {};
  try { return vm.runInNewContext(`(${html.slice(start + 15, end + 2)})`, Object.create(null), { timeout: 200 }); } catch { return {}; }
}
const partFile = (dir, part) => path.join(dir, part.dir, 'scene.html');

// What a person may edit in a part, by how it is edited: words (`text`, `lines`, `rows`, `numbers`, `image`), and the
// labels they read. The block's own content keys come from its `needs`; its other words from its main text params.
const LABEL = {
  text: 'Sentence', mark: 'Words in your accent colour', caption: 'Caption', title: 'Title', line: 'Line under it', label: 'What it counts',
  command: 'Command', output: 'What it prints', cwd: 'Folder', working: 'While it works', stats: 'Numbers', image: 'Picture', url: 'Address',
  word: 'The word', name: 'Your name', domain: 'Where to go', corner: 'In the corner', a: 'First line', b: 'Then', bLine: 'Line under it',
  before: 'Before', after: 'After', words: 'The words that change', items: 'Items', toasts: 'Notifications', bars: 'Bars', points: 'Values',
  labels: 'Labels', tag: 'Note', value: 'Number', rows: 'Rows', fields: 'Fields', button: 'The button', done: 'When it is done', answer: 'What it shows',
  query: 'What is typed', placeholder: 'Placeholder', script: 'Script', emphasis: 'Words to stress', shots: 'Words, one per beat', toggle: 'The switch',
  file: 'File name', code: 'Code', highlight: 'Line to light up', add: 'New lines', remove: 'Lines that go', svg: 'Logo (SVG)', columns: 'Columns', move: 'The move',
};
const SKIP = new Set(['background', 'format', 'entrance', 'metal']);
function asField(key, value) {
  if (Array.isArray(value)) {
    if (value.every((x) => typeof x === 'string' || typeof x === 'number')) return { key, kind: 'lines', value: value.join('\n') };
    if (value.every((x) => Array.isArray(x))) {
      // a column empty in every row (a unit nobody uses) is left out of what the person edits, and put back on save
      const shape = value[0]?.map((c) => (typeof c === 'number' ? 'n' : Array.isArray(c) ? 'list' : 's')) ?? [];
      const hide = shape.map((_, i) => value.every((r) => r[i] === '' || r[i] == null));
      return { key, kind: 'rows', value: value.map((r) => r.filter((_, i) => !hide[i]).map((c) => (Array.isArray(c) ? c.join(', ') : c)).join(' | ')).join('\n'), shape, hide, columns: shape.length - hide.filter(Boolean).length };
    }
    if (value.every((x) => x && typeof x === 'object' && 'text' in x)) return { key, kind: 'lines', value: value.map((x) => x.text).join('\n'), objects: true };
    return null;
  }
  if (value && typeof value === 'object') return Object.entries(value).filter(([, v]) => typeof v !== 'object').map(([k, v]) => ({ key: `${key}.${k}`, kind: typeof v === 'number' ? 'number' : 'text', value: String(v ?? ''), label: `${LABEL[key] ?? human(key)}: ${(LABEL[k] ?? human(k)).toLowerCase()}` }));
  if (typeof value === 'number') return { key, kind: 'number', value: String(value) };
  if (typeof value === 'string') return { key, kind: key === 'image' || /\.(jpe?g|png|webp)$/i.test(value) ? 'image' : value.includes('\n') ? 'block' : 'text', value };
  return null;
}
export function wordFields(block, cfg) {
  // the content a block always shows (an optional need, such as a track's tempo, is a setting, not words)
  const keys = new Set(block.needs?.filter((n) => !n.optional).flatMap((n) => Object.keys(n.fill ?? {})) ?? []);
  for (const p of block.params ?? []) if (p.type === 'string' && p.group === 'main' && p.control === 'text') keys.add(p.name);
  return [...keys].filter((k) => !SKIP.has(k) && k in cfg).flatMap((k) => [asField(k, cfg[k])].flat().filter(Boolean)).map((f) => ({ ...f, label: f.label ?? LABEL[f.key] ?? human(f.key) }));
}
/** A field's text back into its CONFIG value, shaped like the value it replaces. */
function fromField(key, text, cfg) {
  const [k, sub] = key.split('.'), old = cfg[k];
  if (sub) { const o = { ...(old ?? {}) }; o[sub] = typeof old?.[sub] === 'number' && Number.isFinite(Number(text)) ? Number(text) : text; return [k, o]; }
  const f = asField(k, old);
  const rows = String(text ?? '').split('\n').map((l) => l.trim()).filter(Boolean);
  if (!f || f.kind === 'text' || f.kind === 'block' || f.kind === 'image') return [k, String(text ?? '')];
  if (f.kind === 'number') { const n = Number(text); if (!Number.isFinite(n)) throw new Error('a number, please'); return [k, n]; }
  if (f.kind === 'lines' && f.objects) return [k, rows.map((t, i) => ({ check: true, text: t.replace(/^[✓✔√]\s*/, ''), ...(i === rows.length - 1 ? { result: true } : {}) }))];
  if (f.kind === 'lines') return [k, rows.map((t) => (typeof old?.[0] === 'number' && Number.isFinite(Number(t)) ? Number(t) : t))];
  return [k, rows.map((l) => {
    const typed = l.split(/\s*\|\s*/); let j = 0;
    return f.shape.map((t, i) => { if (f.hide[i]) return t === 'n' ? 0 : ''; const c = typed[j++]; return t === 'n' ? Number(String(c ?? '0').replace(/,/g, '')) || 0 : t === 'list' ? String(c ?? '').split(/\s*,\s*/).filter(Boolean) : c ?? ''; });
  })];
}

// What of a block a person may tune: its numbers and its either/or choices. The setting a repeating block varies
// (a sentence's entrance) is its Motion, chosen by watching each; the rest are Tune.
const NOT_TUNED = new Set(['format', 'background', 'fps', 'codec', 'winner', 'mark', 'detail', 'highlight']);
export function tunables(block, cfg = {}) {
  const content = new Set(block.needs?.filter((n) => !n.optional).flatMap((n) => Object.keys(n.fill ?? {})) ?? []);
  return (block.params ?? []).filter((p) => !content.has(p.name) && !NOT_TUNED.has(p.name) && p.name !== block.repeat?.param && (p.type === 'enum' || p.type === 'number')).map((p) => {
    const d = p.default, num = p.type === 'number', min = num ? p.min ?? +(d * 0.4).toFixed(2) : null, max = num ? p.max ?? +(d * 1.8).toFixed(2) : null;
    return { name: p.name, label: (p.description ?? p.name).replace(/^./, (c) => c.toUpperCase()), kind: num ? 'number' : 'enum', options: p.options ?? null, min, max, step: num ? +Math.max((max - min) / 40, 0.01).toFixed(2) : null, default: d, value: cfg[p.name] ?? d };
  });
}

// ── undo ───────────────────────────────────────────────────────────────────────────────────────────────────────
// Before a change, the files it will touch are kept; undo puts the last set back. Forty steps.
const histFile = (dir) => path.join(dir, '.history.json');
export function snapshot(cwd, dir, files, label) {
  const h = readJson(histFile(dir), []);
  h.push({ label, at: new Date().toISOString(), files: Object.fromEntries(files.map((f) => [path.relative(cwd, f), fs.existsSync(f) ? fs.readFileSync(f, 'utf8') : null])) });
  writeJson(histFile(dir), h.slice(-40));
}
export function undo(cwd, dir) {
  const h = readJson(histFile(dir), []), last = h.pop();
  if (!last) throw new Error('nothing to undo');
  for (const [rel, content] of Object.entries(last.files)) { const f = path.join(cwd, rel); if (content === null) fs.rmSync(f, { force: true }); else { fs.mkdirSync(path.dirname(f), { recursive: true }); fs.writeFileSync(f, content); } }
  writeJson(histFile(dir), h);
  return last.label;
}
export const canUndo = (dir) => readJson(histFile(dir), []).at(-1)?.label ?? null;

// ── reading the video ──────────────────────────────────────────────────────────────────────────────────────────

/**
 * A part's length within what its scene allows: it always plays the whole scene, so a length is a speed. Returns the
 * length (held inside the range), the scene's own length, the range and the speed (above 1 is faster).
 */
export function timing(seconds, natural) {
  const range = lengthRange(natural), s = Math.min(range.max, Math.max(range.min, seconds ?? natural));
  return { seconds: s, duration: natural, range: { min: range.min, max: range.max }, rate: +(natural / s).toFixed(3) };
}

/** The parts as the editor shows them: each with its block, its words, motion, background, settings and join. */
export function videoView(cwd, dir, scenes) {
  const chain = readJson(path.join(dir, 'chain.json'), null);
  if (!chain) return null;
  const byId = new Map(scenes.map((b) => [b.id, b]));
  // what each scene really lasts, read by the last join (a scene's length can depend on its content); stale once edited
  const lengths = readJson(path.join(dir, '.lengths.json'), {});
  const real = (p) => { const l = lengths[p.dir]; try { return l && l.mtime === Math.round(fs.statSync(partFile(dir, p)).mtimeMs) ? l.duration : null; } catch { return null; } };
  const parts = (chain.parts ?? []).filter((p) => p.dir && fs.existsSync(partFile(dir, p))).map((p, i, all) => {
    const html = fs.readFileSync(partFile(dir, p), 'utf8'), cfg = readConfig(html), b = byId.get(p.id) ?? { id: p.id, params: [], needs: [] };
    const D = real(p);
    const motion = b.repeat ? { param: b.repeat.param, value: cfg[b.repeat.param] ?? null, options: (b.params ?? []).find((x) => x.name === b.repeat.param)?.options ?? [], previews: b.repeat.previews ?? {} } : null;
    return {
      dir: p.dir, id: p.id, title: b.title ?? p.id, kind: b.needs?.[0]?.kind ?? null, summary: b.summary ?? '', ...timing(p.seconds, D ?? b.duration ?? 4), exact: D !== null,
      join: i < all.length - 1 ? p.join ?? chain.join ?? 'whip' : null, shows: p.shows ?? [], what: p.what ?? '',
      words: wordFields(b, cfg), motion, background: cfg.background ?? null, takesBackground: (b.params ?? []).some((x) => x.name === 'background'), tune: tunables(b, cfg),
      mtime: Math.round(fs.statSync(partFile(dir, p)).mtimeMs),
    };
  });
  return { title: chain.title, format: chain.format, parts, total: +parts.reduce((t, p) => t + Number(p.seconds || 0), 0).toFixed(1) };
}

/** A sentence made ready for any block that shows one: the words to mark (its last few, when none were chosen) and
 *  the text around them, worked out again from the sentence as it is now. */
function complete(i) {
  if (i.kind !== 'line' || !i.text) return i;
  let mark = i.mark && i.text.includes(i.mark) ? i.mark : null;
  if (!mark) { const w = i.text.trim().split(/\s+/); mark = w.slice(-Math.max(1, Math.ceil(w.length / 3))).join(' '); }
  const at = i.text.lastIndexOf(mark);
  return { ...i, mark, before: i.text.slice(0, at).trimEnd(), after: i.text.slice(at + mark.length).trimStart() };
}

/** The reverse of a fill: which item fields a part's CONFIG holds, for the plain "$field" entries of its template. */
function unfill(tpl, cfg) {
  const out = {};
  for (const [k, v] of Object.entries(tpl ?? {})) if (typeof v === 'string' && v.startsWith('$') && !v.startsWith('$brief.') && cfg[k] !== undefined && typeof cfg[k] !== 'object') out[v.slice(1)] = cfg[k];
  return out;
}

// ── changing it ────────────────────────────────────────────────────────────────────────────────────────────────

const pad = (n) => String(n).padStart(2, '0');
async function install(cwd, dir, blockId, format) {
  const { add, getItem } = await import('./registry.mjs');
  const it = await getItem(blockId);
  const nums = fs.readdirSync(dir).map((d) => Number(d.match(/^(\d+)-/)?.[1] ?? 0)), sub = `${pad(Math.max(0, ...nums) + 1)}-${blockId}`;
  const hasFormat = (it.params ?? []).some((x) => x.name === 'format');
  await add([blockId], { cwd, force: true, name: path.join(path.relative(path.join(cwd, 'pieces'), dir), sub), set: hasFormat && format ? [`format=${format}`] : [] });
  return { sub, item: it };
}

/**
 * One edit to the video, from the studio. Returns { say } (what happened, in the user's words) and what to redraw.
 * a: { type, part?, key?, value?, at?, block?, to? }
 */
export async function editVideo(cwd, dir, a, scenes, brief = {}) {
  const chainFile = path.join(dir, 'chain.json'), chain = readJson(chainFile, null);
  if (!chain && !['build'].includes(a.type)) throw new Error('there is no video yet');
  const find = () => { const p = chain.parts.find((x) => x.dir === a.part); if (!p) throw new Error('no such part'); return p; };
  const byId = new Map(scenes.map((b) => [b.id, b]));
  const keep = (files, label) => snapshot(cwd, dir, files, label);
  const setCfg = (p, values) => { const f = partFile(dir, p); fs.writeFileSync(f, fillConfig(fs.readFileSync(f, 'utf8'), values)); };
  const cfgOf = (p) => readConfig(fs.readFileSync(partFile(dir, p), 'utf8'));
  const title = (p) => byId.get(p.id)?.title ?? p.id;
  switch (a.type) {
    case 'word': {
      const p = find(); keep([partFile(dir, p)], `the words of ${title(p)}`);
      const [k, v] = fromField(a.key, a.value, cfgOf(p)); setCfg(p, { [k]: v });
      return { say: `Changed the words of ${title(p)}`, part: p.dir };
    }
    case 'motion': case 'tune': {
      const p = find(), b = byId.get(p.id); keep([partFile(dir, p)], `${a.type === 'motion' ? 'how' : 'a setting of'} ${title(p)}`);
      const t = a.type === 'motion' ? { name: b?.repeat?.param, kind: 'enum', options: (b?.params ?? []).find((x) => x.name === b?.repeat?.param)?.options } : tunables(b ?? {}, cfgOf(p)).find((x) => x.name === a.key);
      if (!t?.name) throw new Error('that is not a setting of this part');
      let v = a.value;
      if (v === '' || v == null) v = (b.params ?? []).find((x) => x.name === t.name)?.default;
      else if (t.kind === 'number') { v = Math.min(t.max, Math.max(t.min, Number(v))); if (!Number.isFinite(v)) throw new Error('a number, please'); }
      else if (!t.options.includes(v)) throw new Error('not one of the choices');
      setCfg(p, { [t.name]: v });
      return { say: `${title(p)}: ${a.type === 'motion' ? 'arrives' : (t.label ?? t.name).toLowerCase()} ${v}`, part: p.dir };
    }
    case 'background': {
      const takes = (p) => (byId.get(p.id)?.params ?? []).some((x) => x.name === 'background');
      const targets = (a.all ? chain.parts.filter((x) => x.dir) : [find()]).filter(takes);
      if (!targets.length) throw new Error('this part draws its own background');
      keep(targets.map((p) => partFile(dir, p)), a.all ? 'the background of every part' : `the background of ${title(targets[0])}`);
      for (const p of targets) setCfg(p, { background: a.value || null });
      return { say: a.all ? `Background on every part: ${a.value || "the brand's first"}` : `${title(targets[0])}: background ${a.value || "the brand's first"}`, part: a.all ? null : targets[0].dir };
    }
    case 'seconds': {
      const p = find(), n = Number(a.value); if (!Number.isFinite(n)) throw new Error('give a length in seconds');
      const b = byId.get(p.id) ?? {}, natural = readJson(path.join(dir, '.lengths.json'), {})[p.dir]?.duration ?? b.duration ?? 4;
      const t = timing(+n.toFixed(1), natural);
      keep([chainFile], `the length of ${title(p)}`); p.seconds = t.seconds; writeJson(chainFile, chain);
      const pace = t.rate > 1.005 ? `, ${Math.round((t.rate - 1) * 100)}% faster` : t.rate < 0.995 ? `, ${Math.round((1 - t.rate) * 100)}% slower` : '';
      return { say: `${title(p)}: ${p.seconds} s${pace}`, part: p.dir };
    }
    case 'join': {
      const { JOINS } = await import('./chain.mjs'); if (!(a.value in JOINS)) throw new Error('bad transition');
      keep([chainFile], 'a transition');
      if (a.all) { for (const p of chain.parts) p.join = a.value; chain.join = a.value; } else find().join = a.value;
      writeJson(chainFile, chain);
      return { say: a.all ? `Every transition: ${a.value}` : `Transition after ${title(find())}: ${a.value}` };
    }
    case 'order': {
      const by = new Map(chain.parts.map((x) => [x.dir, x]));
      if (a.value.length !== chain.parts.length || a.value.some((d) => !by.has(d))) throw new Error('bad order');
      keep([chainFile], 'the order'); chain.parts = a.value.map((d) => by.get(d)); writeJson(chainFile, chain);
      return { say: 'New order' };
    }
    case 'remove': {
      if (chain.parts.length < 2) throw new Error('a video needs one part at least');
      const p = find(); keep([chainFile], `removing ${title(p)}`);
      chain.parts = chain.parts.filter((x) => x !== p); writeJson(chainFile, chain);
      return { say: `Removed ${title(p)}` };
    }
    case 'duplicate': {
      const p = find(); keep([chainFile], `duplicating ${title(p)}`);
      const nums = fs.readdirSync(dir).map((d) => Number(d.match(/^(\d+)-/)?.[1] ?? 0)), sub = `${pad(Math.max(0, ...nums) + 1)}-${p.id}`;
      fs.mkdirSync(path.join(dir, sub), { recursive: true });
      for (const f of fs.readdirSync(path.join(dir, p.dir))) if (fs.statSync(path.join(dir, p.dir, f)).isFile()) fs.copyFileSync(path.join(dir, p.dir, f), path.join(dir, sub, f));
      chain.parts.splice(chain.parts.indexOf(p) + 1, 0, { ...p, dir: sub }); writeJson(chainFile, chain);
      return { say: `Duplicated ${title(p)}`, part: sub };
    }
    case 'add': case 'swap': {
      // a new block, filled with something true: the content of the part it replaces, else a kept inventory item it
      // can show that is not in the video yet, else the block's own sample words for the user to replace
      const b = byId.get(a.block); if (!b) throw new Error('no such block');
      const old = a.type === 'swap' ? find() : null;
      keep([chainFile], a.type === 'swap' ? `showing ${title(old)} another way` : `adding ${b.title}`);
      const { sub } = await install(cwd, dir, b.id, chain.format);
      const items = normalize(loadRaw(dir), { cwd }).items, shown = new Set(chain.parts.flatMap((x) => x.shows ?? []));
      const need = b.needs?.[0], fits = (i) => need && i.kind === need.kind && (need.has ?? []).every((f) => i[f] !== undefined && i[f] !== '') && Object.entries(need.where ?? {}).every(([k, v]) => i[k] === v);
      // what the old part says now (the user may have changed its words since): read back through its own fill
      const back = old ? unfill(byId.get(old.id)?.needs?.[0]?.fill, cfgOf(old)) : {};
      if (back.mark !== undefined && back.before !== undefined) back.text = [back.before, back.mark, back.after].filter(Boolean).join(' ');   // a marked sentence, whole again
      if (typeof back.text === 'string') back.text = back.text.replace(/\s+/g, ' ').trim();
      const from = (old?.shows ?? []).map((id) => items.find((i) => i.id === id)).filter(Boolean).map((i, k) => (k === 0 ? complete({ ...i, ...back }) : i));
      // showing the same thing another way keeps its content, even when the new way wants a little more of it
      const same = from.length && from.every((i) => i.kind === need?.kind);
      const pool = same ? from : [...items.filter((i) => fits(i) && !shown.has(i.id))];
      const group = need ? pool.slice(0, need.count ?? 1) : [];
      const part = { id: b.id, dir: sub, name: b.title, seconds: b.duration ?? 4, ...(group.length ? { shows: group.map((i) => i.id), what: group.map(describe).join(' · ') } : {}) };
      if (group.length >= (need?.count ?? 1)) {
        const fill = evalFill(need.fill, group, brief);
        for (const n of b.needs.slice(1)) if (n.kind === 'name') Object.assign(fill, evalFill(n.fill, [], brief));
        setCfg(part, fill);
      } else if (old && byId.get(old.id)?.needs?.[0]?.kind === need?.kind) {
        // the same kind of content: carry the words over field by field where the names match
        const prev = cfgOf(old), next = cfgOf(part), carry = Object.fromEntries(Object.keys(next).filter((k) => k in prev && !['format'].includes(k)).map((k) => [k, prev[k]]));
        setCfg(part, carry);
      }
      if (old) { const bg = cfgOf(old).background; if (bg) setCfg(part, { background: bg }); part.join = old.join; part.seconds = old.seconds; chain.parts.splice(chain.parts.indexOf(old), 1, part); }
      else chain.parts.splice(Math.max(0, Math.min(chain.parts.length, Number(a.at ?? chain.parts.length))), 0, part);
      writeJson(chainFile, chain);
      return { say: old ? `${title(old)} is now ${b.title}` : `Added ${b.title}${group.length ? `, showing ${part.what}` : ': write its words'}`, part: sub };
    }
    case 'build': {
      // the first version, from what the user kept: the planner's structure, installed with its content
      const items = normalize(loadRaw(dir), { cwd }).items;
      if (!items.length) throw new Error('keep something to show first');
      const secs = Number(String(brief.format ?? '').match(/(\d+(?:\.\d+)?)\s*(?:s\b|sec|seconds?)/i)?.[1]) || 25;
      const options = propose(items, scenes, { seconds: secs, brief });
      if (!options.length) throw new Error('nothing kept can be shown by a ready-made part yet');
      writePlan(dir, options, { seconds: secs });
      const o = options.find((x) => x.letter === (a.value ?? 'A')) ?? options[0];
      if (chain) keep([chainFile], 'building it again');
      const f = String(brief.format ?? ''), format = /9\s*:\s*16/.test(f) ? '1080x1920' : /1\s*:\s*1/.test(f) ? '1080x1080' : chain?.format ?? '1920x1080';
      const look = await ensureLook(cwd, brief.title ?? chain?.title);
      const { initChain } = await import('./chain.mjs');
      const parts = o.beats.map((bt) => ({ id: bt.id, name: bt.name, seconds: +(bt.to - bt.from).toFixed(1), what: bt.what, ...(bt.items.length ? { shows: bt.items } : {}) }));
      const r = await initChain({ cwd, piece: path.relative(path.join(cwd, 'pieces'), dir), title: brief.title ?? chain?.title, parts, format, force: true });
      r.chain.parts.forEach((p, i) => { if (p.dir && o.beats[i]?.fill && Object.keys(o.beats[i].fill).length) setCfg(p, o.beats[i].fill); });
      return { say: `Built your video: ${o.title.toLowerCase()}, ${o.beats.length} parts${look ? ` (no look yet: ${look.join(', ')}; change it in Style)` : ''}`, options: options.map((x) => ({ letter: x.letter, title: x.title, why: x.why })) };
    }
    default: throw new Error(`unknown edit ${a.type}`);
  }
}

// ── the style: the brand's colours, type and pace ──────────────────────────────────────────────────────────────

export function styleView(cwd) {
  const t = readJson(path.join(cwd, 'brand/tokens.json'), {}), m = readJson(path.join(cwd, 'brand/motion.json'), {});
  const c = (k) => t.colors?.[k]?.hex ?? null;
  const stamp = ['brand/tokens.json', 'brand/motion.json', 'brand/shader-set/set.json'].map((f) => { try { return Math.round(fs.statSync(path.join(cwd, f)).mtimeMs); } catch { return 0; } }).join('-');
  // the brand's own pictures, for a part that shows one
  const dir = path.join(cwd, 'brand/assets'), images = fs.existsSync(dir) ? fs.readdirSync(dir).filter((f) => /\.(jpe?g|png|webp)$/i.test(f) && !/wordmark|logo/i.test(f)).map((f) => `/brand/assets/${f}`) : [];
  return { colors: { ground: c('ground'), figure: c('figure'), accent: c('accent') }, fonts: { display: t.fonts?.display?.family ?? null, text: t.fonts?.text?.family ?? null }, pace: m.pace ?? 'medium', stamp, images };
}
/**
 * A project with no look yet (no colours in brand/tokens.json) renders grey on grey and calls itself "brand".
 * Before a video is built, give it a quiet default named after the piece, which the user changes in Style:
 * a palette, a font pair and one background. Returns what was installed, or null when it already had a look.
 */
export async function ensureLook(cwd, name) {
  const t = readJson(path.join(cwd, 'brand/tokens.json'), {});
  if (Object.keys(t.colors ?? {}).length) return null;
  const { add } = await import('./registry.mjs');
  await add(['graphite', 'geist-serif'], { cwd, ...(name ? { brand: name } : {}) });
  const set = readJson(path.join(cwd, 'brand/shader-set/set.json'), {});
  const installed = ['graphite', 'geist-serif'];
  if (!(Array.isArray(set) ? set : set.entries ?? []).length) { await add(['mesh-graphite'], { cwd, palette: 'brand' }); installed.push('mesh-graphite'); }
  return installed;
}

// the brand's backgrounds that come from the library take its colours again (after the palette or a colour changed)
async function recolorBackgrounds(cwd) {
  const setFile = path.join(cwd, 'brand/shader-set/set.json'), set = readJson(setFile, {});
  const { add, getIndex } = await import('./registry.mjs');
  const index = new Set(((await getIndex().catch(() => ({ items: [] }))).items ?? []).filter((x) => x.type === 'background').map((x) => x.id));
  const ids = (set.entries ?? []).filter((e) => e.shader && !e.image && index.has(e.id)).map((e) => e.id);
  if (!ids.length) return;
  const order = (set.entries ?? []).map((e) => e.id);
  await add(ids, { cwd, palette: 'brand', force: true });
  const after = readJson(setFile, {});   // keep the order the user had: the first is the brand's background
  after.entries = [...(after.entries ?? [])].sort((x, y) => (order.indexOf(x.id) + 1 || 1e9) - (order.indexOf(y.id) + 1 || 1e9));
  writeJson(setFile, after);
}

export async function editStyle(cwd, dir, a) {
  const tokens = path.join(cwd, 'brand/tokens.json'), motion = path.join(cwd, 'brand/motion.json'), setFile = path.join(cwd, 'brand/shader-set/set.json');
  snapshot(cwd, dir, [tokens, motion, path.join(cwd, 'brand/fonts.css'), setFile], 'the style');
  if (a.type === 'palette' || a.type === 'font') {
    const { add } = await import('./registry.mjs');
    await add([a.value], { cwd, force: true });
    if (a.type === 'palette') await recolorBackgrounds(cwd);
    return { say: `${a.type === 'palette' ? 'Colours' : 'Type'}: ${a.value}` };
  }
  if (a.type === 'color') {
    if (!/^#[0-9a-f]{6}$/i.test(a.value) || !['ground', 'figure', 'accent'].includes(a.key)) throw new Error('bad colour');
    const t = readJson(tokens, {}); t.colors ??= {}; t.colors[a.key] = { ...(t.colors[a.key] ?? {}), hex: a.value.toUpperCase() }; delete t.ramp; writeJson(tokens, t);
    await recolorBackgrounds(cwd);
    return { say: `${{ ground: 'Background', figure: 'Text', accent: 'Accent' }[a.key]} colour ${a.value}` };
  }
  if (a.type === 'background') {   // the brand's background: the first entry of its set, added from the library in its colours
    let set = readJson(setFile, { entries: [] });
    if (!(set.entries ?? []).some((e) => e.id === a.value)) { const { add } = await import('./registry.mjs'); await add([a.value], { cwd, palette: 'brand' }); set = readJson(setFile, { entries: [] }); }
    const i = set.entries.findIndex((e) => e.id === a.value); if (i < 0) throw new Error('no such background');
    set.entries.unshift(...set.entries.splice(i, 1)); writeJson(setFile, set);
    return { say: `Background: ${a.value}` };
  }
  if (a.type === 'entrance') {   // how words arrive, unless a part says otherwise
    if (!/^[a-z-]+$/.test(a.value)) throw new Error('bad entrance');
    const m = readJson(motion, {}); m.entrance = a.value; writeJson(motion, m);
    return { say: `Words arrive: ${a.value}` };
  }
  if (a.type === 'pace') {
    if (!['calm', 'medium', 'fast'].includes(a.value)) throw new Error('bad pace');
    const m = readJson(motion, {}); m.pace = a.value; writeJson(motion, m);
    return { say: `Pace: ${a.value}` };
  }
  throw new Error(`unknown style edit ${a.type}`);
}
