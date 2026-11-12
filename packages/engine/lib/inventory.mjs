// The inventory: what a piece can really show, written down before its structure.
//
//   pieces/<piece>/inventory.json   { "items": [{ "id", "kind", …fields, "says"?, "must"?, "source"? }] }
//   pieces/<piece>/plan.json        the structures proposed from it (pamo plan), each beat with its block and its fill
//
// Blocks and shots declare the kinds they show (`needs` in the registry). So a structure is proposed from the content
// the user has, not from a mood, and `chain init --plan` installs each part with the user's own figures, screens and
// words already in its CONFIG.

import fs from 'node:fs';
import path from 'node:path';

/** Every kind of content an inventory can hold: its fields, and the part it usually plays in a piece. */
export const KINDS = {
  // figures
  figure: { needs: ['value', 'label'], opt: ['unit'], is: 'one number and what it counts', role: 'prove' },
  change: { needs: ['from', 'to', 'label'], opt: ['fromLabel', 'toLabel'], is: 'a before and an after in one figure', role: 'prove' },
  share: { needs: ['value', 'label'], is: 'a percentage (0–100) and what it is a share of', role: 'prove' },
  series: { needs: ['title', 'points'], opt: ['tag'], is: 'values in order: points [[label, value], …]', role: 'prove' },
  table: { needs: ['rows'], opt: ['main'], is: 'named values: rows [[name, value], …]; main is the row that matters', role: 'prove' },
  // the product, seen
  screen: { needs: ['image'], opt: ['url', 'title', 'caption', 'device'], files: ['image'], is: 'a screenshot of the product (device: desktop or phone)', role: 'show' },
  action: { needs: ['text', 'button'], opt: ['answer', 'image'], files: ['image'], is: 'one thing the user does: a line, the control, what it answers', role: 'show' },
  form: { needs: ['title', 'fields', 'button'], opt: ['done'], is: 'a form: fields [[label, value], …] and its button', role: 'show' },
  search: { needs: ['query', 'items'], opt: ['placeholder'], is: 'a search: the query and items [[name, type], …]', role: 'show' },
  board: { needs: ['columns', 'move'], is: 'a board: columns [[name, [cards]], …] and one move [from, card, to, at]', role: 'show' },
  toggle: { needs: ['title', 'toggle'], opt: ['rows'], is: 'a setting that flips the whole interface', role: 'show' },
  events: { needs: ['items'], is: 'things that happen one after another: items [[title, detail], …]', role: 'show' },
  // how it works
  command: { needs: ['command', 'output'], opt: ['cwd', 'working'], is: 'a real command and its output (lines)', role: 'how' },
  code: { needs: ['file', 'code'], opt: ['highlight'], is: 'real code, and the line that matters', role: 'how' },
  rewrite: { needs: ['file', 'before', 'remove', 'add'], is: 'code that gets shorter: the lines that go and what replaces them', role: 'how' },
  // words
  line: { needs: ['text'], opt: ['mark'], is: 'one sentence; mark is the words that carry it', role: 'say' },
  variants: { needs: ['before', 'words', 'after'], is: 'a sentence with one word that keeps changing', role: 'say' },
  words: { needs: ['items'], is: 'a few single words or very short phrases', role: 'say' },
  voice: { needs: ['script'], opt: ['words', 'emphasis'], is: 'what is said aloud; words [{ w, t }] are its timings', role: 'say' },
  // the brand and its sound
  logo: { needs: ['svg'], opt: ['name'], is: "the brand's own SVG logo", role: 'close' },
  music: { needs: [], opt: ['bpm', 'offset', 'beats', 'file'], files: ['file'], is: 'the track: its tempo and first beat, or its beat times', role: 'bed' },
  // real material nothing in the registry shows yet: listed so the gap is said out loud, never silently dropped
  photo: { needs: ['image'], opt: ['caption'], files: ['image'], is: 'a photograph', role: 'show' },
  clip: { needs: ['file'], opt: ['caption'], files: ['file'], is: 'a video clip', role: 'show' },
};
const ROLE_NAMES = { say: 'Line', show: 'Product', how: 'How', prove: 'Proof', close: 'Close' };
/** The fields of each kind a person can edit as plain text (lists and files are the agent's to change). */
export const EDITABLE = {
  figure: ['value', 'unit', 'label'], change: ['from', 'fromLabel', 'to', 'toLabel', 'label'], share: ['value', 'label'], series: ['title', 'tag'],
  screen: ['url', 'title', 'caption', 'device'], action: ['text', 'button', 'answer'], form: ['title', 'button', 'done'], search: ['query', 'placeholder'],
  toggle: ['title', 'toggle'], command: ['command', 'cwd', 'working'], code: ['file', 'highlight'], rewrite: ['file'], line: ['text', 'mark'],
  variants: ['before', 'after'], voice: ['script'], logo: ['name'], music: ['bpm', 'offset'], photo: ['caption'], clip: ['caption'],
};
/**
 * How the inventory reads to someone who does not code (the studio speaks this, never the names above): the parts
 * of a video it is sorted into, and for each kind its everyday name and the fields worth showing a person, with
 * their labels. What is not listed (a command's folder and output, a file name, a device) is the agent's to fill.
 */
export const GROUPS = [['say', 'What we say'], ['show', 'What we show'], ['prove', 'What proves it'], ['how', 'How it works'], ['brand', 'Your brand']];
export const PLAIN = {
  line: { name: 'A sentence', group: 'say', fields: { text: 'Sentence', mark: 'Words to highlight' } },
  variants: { name: 'A sentence with a word that changes', group: 'say', fields: { before: 'Starts with', words: 'The words that change', after: 'Ends with' } },
  words: { name: 'A few words', group: 'say', fields: { items: 'Words' } },
  voice: { name: 'What is said aloud', group: 'say', fields: { script: 'Script', emphasis: 'Words to stress' } },
  screen: { name: 'A screenshot', group: 'show', fields: { title: 'Name', caption: 'Caption', url: 'Address' } },
  photo: { name: 'A photo', group: 'show', fields: { caption: 'Caption' } },
  clip: { name: 'A video clip', group: 'show', fields: { caption: 'Caption' } },
  action: { name: 'Something people do in it', group: 'show', fields: { text: 'What they do', button: 'The button', answer: 'What happens' } },
  form: { name: 'A form', group: 'show', fields: { title: 'Title', fields: 'Fields', button: 'The button', done: 'When it is done' } },
  search: { name: 'A search', group: 'show', fields: { query: 'What is typed', items: 'Results' } },
  board: { name: 'A board', group: 'show', fields: {} },
  toggle: { name: 'A setting', group: 'show', fields: { title: 'Title', toggle: 'The switch' } },
  events: { name: 'Notifications', group: 'show', fields: { items: 'Notifications' } },
  figure: { name: 'A number', group: 'prove', fields: { value: 'Number', unit: 'Unit', label: 'What it counts' } },
  change: { name: 'A before and after', group: 'prove', fields: { from: 'Before', fromLabel: 'Before, in words', to: 'After', toLabel: 'After, in words', label: 'What it measures' } },
  share: { name: 'A percentage', group: 'prove', fields: { value: 'Percent', label: 'Of what' } },
  series: { name: 'Numbers over time', group: 'prove', fields: { title: 'Title', points: 'Points', tag: 'Note' } },
  table: { name: 'A list of values', group: 'prove', fields: { rows: 'Rows' } },
  command: { name: 'A command people run', group: 'how', fields: { command: 'Command' } },
  code: { name: 'A piece of code', group: 'how', fields: {} },
  rewrite: { name: 'Code that gets shorter', group: 'how', fields: {} },
  logo: { name: 'Your logo', group: 'brand', fields: { name: 'Name beside it' } },
  music: { name: 'Your music', group: 'brand', fields: {} },
};
/** The kinds a person can add by hand in the studio: the ones made of plain text and numbers. */
export const ADDABLE = ['line', 'figure', 'change', 'share'];
const NUMERIC = new Set(['share.value', 'music.bpm', 'music.offset', 'code.highlight', 'table.main']);
/** Fields edited as several lines: `lines` one entry each, `pairs` "name | value" each (`pairn`: the value a number), `block` text as it is. */
export const MULTI = {
  words: { items: 'lines' }, variants: { words: 'lines' }, voice: { emphasis: 'lines' }, command: { output: 'lines' },
  table: { rows: 'pairs' }, events: { items: 'pairs' }, search: { items: 'pairs' }, form: { fields: 'pairs' }, series: { points: 'pairn' },
  code: { code: 'block' }, rewrite: { before: 'block' },
};
/** A list as the text a person edits, and back. */
export const listText = (v, type) => (type === 'block' ? String(v ?? '') : (Array.isArray(v) ? v : []).map((x) => (Array.isArray(x) ? x.join(' | ') : typeof x === 'object' && x ? String(x.text ?? '') : String(x))).join('\n'));
function listValue(textValue, type) {
  if (type === 'block') return String(textValue ?? '').replace(/\s+$/, '');
  const rows = String(textValue ?? '').split('\n').map((l) => l.trim()).filter(Boolean);
  if (type === 'lines') return rows;
  return rows.map((l) => {
    const [a, ...rest] = l.split(/\s*\|\s*|\t+/), b = rest.join(' | ').trim();
    if (!a || !b) throw new Error(`"${l}": write each row as  name | value`);
    if (type === 'pairn') { const n = Number(b.replace(/,/g, '')); if (!Number.isFinite(n)) throw new Error(`"${l}": the value after the | is a number`); return [a.trim(), n]; }
    return [a.trim(), b];
  });
}
/** What a command printed, made fit to show: no colour codes, no blank edges, a few lines at most. */
export function tidyOutput(textValue, max = 7) {
  const lines = String(textValue ?? '').replace(/\x1b\[[0-9;?]*[A-Za-z]/g, '').replace(/\r/g, '').split('\n').map((l) => l.replace(/\s+$/, ''));
  while (lines.length && !lines[0].trim()) lines.shift();
  while (lines.length && !lines.at(-1).trim()) lines.pop();
  // the block draws its own checks: a ✓ the command printed would show twice
  const kept = lines.filter((l, i) => l.trim() || (lines[i - 1] ?? '').trim()).map((l) => l.replace(/^\s*[✓✔√]\s*/, '')).map((l) => (l.length > 78 ? `${l.slice(0, 77)}…` : l));
  return kept.length <= max ? kept : [...kept.slice(0, max - 2), '…', kept.at(-1)];
}

const readJson = (f, d) => { try { return JSON.parse(fs.readFileSync(f, 'utf8')); } catch { return d; } };
export const inventoryFile = (dir) => path.join(dir, 'inventory.json');
export const planFile = (dir) => path.join(dir, 'plan.json');

/**
 * The inventory as it is on disk, every item with an id. An item's `status` says where it stands with the user:
 * none (or "kept") is in, "proposed" was gathered and waits for them, "removed" is out for good (and is kept on
 * file so nothing proposes it again).
 */
export function loadRaw(dir) {
  const file = inventoryFile(dir);
  if (!fs.existsSync(file)) return [];
  const raw = JSON.parse(fs.readFileSync(file, 'utf8'));
  return (Array.isArray(raw) ? raw : raw.items ?? []).map((it, i) => ({ ...it, id: String(it.id ?? `${it.kind ?? 'item'}-${i + 1}`) }));
}
export function saveRaw(dir, items) {
  fs.mkdirSync(dir, { recursive: true });
  // one item per line: a person reads this file, and a diff of it should show one change as one line
  fs.writeFileSync(inventoryFile(dir), `{\n  "items": [\n${items.map((it) => `    ${JSON.stringify(it)}`).join(',\n')}\n  ]\n}\n`);
}
/** Read, change, write. `fn` gets the raw items and may return a new list. */
export function editInventory(dir, fn) { const items = loadRaw(dir), out = fn(items) ?? items; saveRaw(dir, out); return out; }

/**
 * Reads and checks an inventory. `items` are the ones that are in (what a plan is made of), `waiting` the
 * proposals the user has not decided on, `all` both plus the removed; `problems` (in what is in) stop a plan.
 */
export function readInventory(dir, { cwd = process.cwd() } = {}) {
  const file = inventoryFile(dir);
  if (!fs.existsSync(file)) throw new Error(`no ${path.relative(cwd, file)} yet: gather it (\`pamo inventory <piece> --from <url|README.md|brand>\`) or write it (\`pamo inventory kinds\` lists what it can hold)`);
  let raw;
  try { raw = loadRaw(dir); } catch (e) { throw new Error(`${path.relative(cwd, file)}: ${e.message}`); }
  return normalize(raw, { cwd });
}

export function normalize(list, { cwd = process.cwd() } = {}) {
  const all = [], ids = new Set(), stray = [];
  list.forEach((src, i) => {
    const it = { ...src }, K = KINDS[it.kind], problems = [];
    it.id = String(it.id ?? `${it.kind ?? 'item'}-${i + 1}`);
    it.status = ['proposed', 'removed'].includes(it.status) ? it.status : 'kept';
    it.problems = problems;
    if (!K) { stray.push(`${it.id}: kind "${it.kind}" is not one of ${Object.keys(KINDS).join(', ')}`); return; }
    if (ids.has(it.id)) problems.push(`${it.id}: used twice`);
    ids.add(it.id);
    // what it still lacks; a proposal may lack things (a command found in a README has no output until someone runs it)
    it.missing = K.needs.filter((f) => it[f] === undefined || it[f] === '' || (Array.isArray(it[f]) && !it[f].length));
    for (const f of it.missing) problems.push(`${it.id}: a ${it.kind} needs "${f}" (${K.is})`);
    for (const f of K.files ?? []) {
      if (!it[f]) continue;
      const rel = String(it[f]).replace(/^\//, '');
      if (!fs.existsSync(path.join(cwd, rel))) problems.push(`${it.id}: ${rel} is not in the project`);
      it[f] = `/${rel.split(path.sep).join('/')}`;   // scenes are served from the project root
    }
    if (it.kind === 'figure') {
      // "2 min" → 2 and " min", so it can count up; a figure that is not a number ("A+") is shown as written
      const m = typeof it.value === 'string' && it.unit === undefined ? it.value.replace(/,/g, '').match(/^(-?\d+(?:\.\d+)?)(.*)$/) : null;
      if (m) { it.value = Number(m[1]); it.unit = m[2]; }
      it.unit ??= '';
      it.numeric = typeof it.value === 'number';
      it.display = `${typeof it.value === 'number' ? it.value.toLocaleString('en-US') : it.value}${it.unit}`;
    }
    if (it.kind === 'share' && !(it.value >= 0 && it.value <= 100)) problems.push(`${it.id}: a share is a number from 0 to 100`);
    if (it.kind === 'series' && !(Array.isArray(it.points) && it.points.length >= 3 && it.points.every((p) => Array.isArray(p) && typeof p[1] === 'number'))) problems.push(`${it.id}: points are [[label, number], …], three or more`);
    if (it.kind === 'table') it.main ??= 0;
    if (it.kind === 'line' && it.mark) {
      const at = it.text.indexOf(it.mark);
      if (at < 0) problems.push(`${it.id}: mark "${it.mark}" is not in the text`);
      else { it.before = it.text.slice(0, at).trimEnd(); it.after = it.text.slice(at + it.mark.length).trimStart(); }
    }
    if (it.kind === 'command' && Array.isArray(it.output)) {
      it.output = it.output.map((o) => (typeof o === 'string' ? (o ? { check: true, text: o } : { text: '' }) : o));
      if (!it.output.some((o) => o.result)) { const last = [...it.output].reverse().find((o) => o.text); if (last) last.result = true; }
    }
    all.push(it);
  });
  const items = all.filter((i) => i.status === 'kept'), waiting = all.filter((i) => i.status === 'proposed');
  return { items, waiting, all, problems: [...stray, ...items.flatMap((i) => i.problems)] };
}

/** One line that says what an item is, for a beat's "what" and for reports. */
export function describe(it) {
  const cut = (s, n = 60) => { s = String(s ?? '').replace(/\s+/g, ' ').trim(); return s.length > n ? `${s.slice(0, n - 1)}…` : s; };
  switch (it.kind) {
    case 'figure': return `${it.display} ${cut(it.label)}`;
    case 'change': return `${it.from} → ${it.to} ${cut(it.label)}`;
    case 'share': return `${it.value}% ${cut(it.label)}`;
    case 'series': return `${cut(it.title)} (${it.points?.length ?? 0} points)`;
    case 'table': return `${it.rows?.[it.main ?? 0]?.join(' ') ?? ''} among ${it.rows?.length ?? 0} values`;
    case 'screen': return `the product${it.url ? ` at ${it.url}` : it.title ? `: ${it.title}` : ''}${it.device === 'phone' ? ', on a phone' : ''}`;
    case 'action': return `${cut(it.text)} [${it.button}]`;
    case 'form': return `the "${it.title}" form`;
    case 'search': return `searching "${it.query}"`;
    case 'board': return `a card moves on the board`;
    case 'toggle': return `"${it.toggle}" flips the interface`;
    case 'events': return `${it.items?.length ?? 0} notifications, ending on "${cut(it.items?.at(-1)?.[0], 30)}"`;
    case 'command': return `${cut(it.command, 50)}, and its output`;
    case 'code': return `${it.file}, written line by line`;
    case 'rewrite': return `${it.file} gets shorter`;
    case 'line': return cut(it.text);
    case 'variants': return `${it.before}[${(it.words ?? []).join(' / ')}]${it.after}`;
    case 'words': return (it.items ?? []).join(' ');
    case 'voice': return cut(it.script);
    case 'logo': return `the logo${it.name ? ` and ${it.name}` : ''}`;
    case 'music': return it.bpm ? `the track, ${it.bpm} BPM` : 'the track';
    default: return cut(it.caption ?? it.image ?? it.file ?? it.kind);
  }
}

/**
 * One edit to the inventory, by hand (the studio) or by the agent: keep, remove or restore an item, mark it a must,
 * change a plain field, add an item, or settle every proposal at once. Returns what to tell the agent it was.
 */
export function applyEdit(dir, a) {
  const text = (v) => String(v ?? '').trim();
  const plainly = (it) => { try { return describe(normalize([it]).all[0] ?? it); } catch { return it.id; } };
  let said;
  editInventory(dir, (items) => {
    const find = () => { const it = items.find((i) => i.id === a.id); if (!it) throw new Error(`no item "${a.id}"`); return it; };
    const set = (it, v) => { if (v === 'kept') delete it.status; else if (['proposed', 'removed'].includes(v)) it.status = v; else throw new Error('bad status'); };
    switch (a.type) {
      case 'inv-status': { const it = find(); set(it, a.value); said = { key: it.id, text: a.value, human: `${a.value === 'removed' ? 'Removed' : 'Kept'}: ${plainly(it)}` }; break; }
      case 'inv-rest': { const n = items.filter((i) => i.status === 'proposed'); n.forEach((i) => set(i, a.value)); said = { key: 'every proposal left', text: `${a.value} (${n.map((i) => i.id).join(', ')})`, human: `${a.value === 'removed' ? 'Removed' : 'Kept'} everything still to decide (${n.length})` }; break; }
      case 'inv-show': {   // which block shows it: the user's pick, or none again (the plan picks)
        const it = find(); if (a.value) it.show = String(a.value); else delete it.show;
        if (it.tune) { const bg = it.tune.background; it.tune = bg ? { background: bg } : undefined; if (!it.tune) delete it.tune; }   // the old block's settings do not carry over; the background does
        said = { key: `${it.id}.show`, text: a.value || 'any', human: `${a.value ? `Shown as ${a.title ?? a.value}` : 'Your agent picks how it is shown'}: ${plainly(it)}` }; break;
      }
      case 'inv-tune': {   // a setting of the block that shows it (the studio checks it is one of the block's)
        const it = find(), k = String(a.key); it.tune ??= {};
        if (a.value === '' || a.value === null || a.value === undefined) delete it.tune[k]; else it.tune[k] = a.value;
        if (!Object.keys(it.tune).length) delete it.tune;
        said = { key: `${it.id}.tune.${k}`, text: String(a.value ?? ''), human: `Tuned (${a.label ?? k}${a.value === '' || a.value == null ? ' back to default' : `: ${a.value}`}): ${plainly(it)}` }; break;
      }
      case 'inv-must': { const it = find(); if (a.value) it.must = true; else delete it.must; said = { key: `${it.id}.must`, text: a.value ? 'yes' : 'no', human: `${a.value ? 'Must appear' : 'No longer a must'}: ${plainly(it)}` }; break; }
      case 'inv-field': {
        const it = find(), k = String(a.key), multi = MULTI[it.kind]?.[k];
        if (multi) { const v = listValue(a.value, multi); if (multi === 'block' ? !v : !v.length) delete it[k]; else it[k] = v; said = { key: `${it.id}.${k}`, text: multi === 'block' ? `${String(v).split('\n').length} lines` : v.map((x) => (Array.isArray(x) ? x.join(' | ') : x)).join(' / '), human: `Corrected: ${plainly(it)}` }; break; }
        if (!(EDITABLE[it.kind] ?? []).includes(k)) throw new Error(`"${k}" is not a field to edit by hand`);
        const v = text(a.value), n = Number(v.replace(/,/g, ''));
        if (!v) delete it[k]; else it[k] = (NUMERIC.has(`${it.kind}.${k}`) || (it.kind === 'figure' && k === 'value')) && Number.isFinite(n) && /^-?[\d.,]+$/.test(v) ? n : v;
        if (it.kind === 'line' && it.mark && !String(it.text ?? '').includes(it.mark)) delete it.mark;   // the marked words must still be in the sentence
        said = { key: `${it.id}.${k}`, text: v, human: `Corrected: ${plainly(it)}` }; break;
      }
      case 'inv-add': {
        if (!ADDABLE.includes(a.kind)) throw new Error(`add a ${ADDABLE.join(', a ')}; anything else, ask your agent`);
        const K = KINDS[a.kind], it = { id: '', kind: a.kind };
        for (const f of EDITABLE[a.kind]) { const v = text(a.fields?.[f]), n = Number(v.replace(/,/g, '')); if (v) it[f] = (a.kind === 'share' && f === 'value') || (a.kind === 'figure' && f === 'value' && /^-?[\d.,]+$/.test(v)) ? n : v; }
        for (const f of K.needs) if (it[f] === undefined) throw new Error(`a ${a.kind} needs "${f}"`);
        const base = String(it.text ?? it.label ?? a.kind).toLowerCase().replace(/[^a-z0-9 ]+/g, ' ').trim().split(/\s+/).slice(0, 3).join('-') || a.kind;
        let id = base, n = 2; while (items.some((i) => i.id === id)) id = `${base}-${n++}`;
        it.id = id; it.source = 'you, in the studio';
        items.push(it); said = { key: `added ${id}`, text: plainly(it), human: `Added: ${plainly(it)}` }; break;
      }
      default: throw new Error(`unknown inventory edit ${a.type}`);
    }
  });
  return said;
}

// ── matching content to scenes ──────────────────────────────────────────────────────────────────────────────────

/** Blocks and shots that show content, from a registry index. */
export const scenesOf = (index) => (index.items ?? index).filter((i) => (i.type === 'block' || i.type === 'shot') && Array.isArray(i.needs));
const lead = (b) => b.needs[0];
// the shortest a scene can run in a chain: its land (where its last beat, the hold, begins) plus the time for the
// hit to read; a scene that ends on something else keeps most of its length
const LAND_HOLD = 0.6;
/**
 * A part always plays its whole scene: a different length plays it faster or slower, never cut short and never
 * looped. These are how far it may go, so motion still reads (too fast) and still moves (too slow).
 */
export const SPEED = { fast: 1.6, slow: 0.6 };
/** The lengths a part may take, from its scene's own length: { natural, min, max } in seconds. */
export const lengthRange = (natural) => ({ natural, min: Math.ceil((natural / SPEED.fast) * 10) / 10, max: Math.floor((natural / SPEED.slow) * 10) / 10 });
const floorOf = (b) => lengthRange(b.duration ?? 5).min;   // as fast as it may play
const fits = (need, it) => it.kind === need.kind && (need.has ?? []).every((f) => it[f] !== undefined && it[f] !== '') && Object.entries(need.where ?? {}).every(([k, v]) => it[k] === v);
// an item that says otherwise ("device: phone" for a block that prefers desktop) goes to this block last
const offKey = (need, it) => Object.entries(need.prefer ?? {}).some(([k, v]) => it[k] !== undefined && it[k] !== v);

/** The scenes that can show each item, best first. */
export function candidates(it, scenes) {
  return scenes.filter((b) => b.needs.length && lead(b).kind !== 'name' && fits(lead(b), it))
    .sort((a, b) => offKey(lead(a), it) - offKey(lead(b), it) || (lead(b).count ?? 1) - (lead(a).count ?? 1));
}

/** What the inventory holds, what can show it, and what is missing for a piece to work. */
export function report(items, scenes) {
  const rows = items.map((it) => ({ it, blocks: candidates(it, scenes).map((b) => b.id) }));
  const notes = [], has = (role) => items.some((i) => KINDS[i.kind].role === role && candidates(i, scenes).length);
  for (const { it, blocks } of rows) {
    if (blocks.length || it.kind === 'music' || it.kind === 'logo') continue;
    notes.push(`${it.id}: nothing in the registry shows a ${it.kind} yet${it.must ? ' (and it is a must: build that part by hand)' : ''}`);
  }
  const lone = (b) => { const n = lead(b), pool = items.filter((i) => fits(n, i)); return (n.count ?? 1) > 1 && pool.length > 0 && pool.length < n.count ? `${b.id} takes ${n.count} ${n.kind}s and there ${pool.length === 1 ? 'is 1' : `are ${pool.length}`}` : null; };
  for (const b of scenes) { const l = b.needs.length ? lone(b) : null; if (l) notes.push(l); }
  if (!has('show')) notes.push('nothing shows the product: add a screen (a screenshot) or an action, or the piece only talks about it');
  if (!has('prove')) notes.push('nothing proves it: add a figure, a change or a share that is true');
  if (!has('say')) notes.push('no line: the piece opens without saying what this is');
  return { rows, notes };
}

// ── proposing structures ────────────────────────────────────────────────────────────────────────────────────────

// Three ways to argue the same content. A slot is a role; `kind` narrows it, `or` is the role to fall back on.
const ARGUMENTS = [
  { title: 'Show first', why: 'opens on the product itself, then proves it', slots: [{ role: 'say' }, { role: 'show' }, { role: 'show' }, { role: 'prove' }, { role: 'how' }, { role: 'prove' }] },
  { title: 'Problem first', why: 'starts from what changes, then shows how', slots: [{ role: 'prove', kind: 'change', or: 'say' }, { role: 'show' }, { role: 'how' }, { role: 'prove' }, { role: 'show' }, { role: 'say' }] },
  { title: 'Proof first', why: 'leads with the strongest figure, then earns it', slots: [{ role: 'prove' }, { role: 'say' }, { role: 'show' }, { role: 'how' }, { role: 'show' }, { role: 'prove' }] },
];

/**
 * Structures for a piece, from its inventory: each a chain of blocks and shots that shows the content in a
 * different order. No item is shown twice in one structure, no block plays twice, and every must is in.
 * @returns [{ letter, title, why, seconds, beats: [{ name, id, from, to, what, items, fill }], left: [ids] }]
 */
export function propose(items, scenes, { seconds, brief = {} } = {}) {
  const order = new Map(items.map((it, i) => [it.id, i]));
  // a must first, then what the user took the time to shape (chose how it is shown, tuned it), then the order found
  const cared = (i) => (i.show || (i.tune && Object.keys(i.tune).length) ? 1 : 0);
  const rank = (a, b) => (b.must ? 1 : 0) - (a.must ? 1 : 0) || cared(b) - cared(a) || order.get(a.id) - order.get(b.id);
  const closers = scenes.filter((b) => b.needs.length && lead(b).kind === 'name');
  const logo = items.find((i) => i.kind === 'logo'), logoBlock = logo && scenes.find((b) => b.needs.length && fits(lead(b), logo));
  const options = [], seen = new Set();

  ARGUMENTS.forEach((arg, n) => {
    const usedItems = new Set(), usedBlocks = new Map(), beats = [];
    const free = (it) => !usedItems.has(it.id);
    // a block plays once in a structure, unless it repeats (a setting such as its entrance makes each use different)
    const uses = (b) => usedBlocks.get(b.id)?.length ?? 0;
    const variants = (b) => (b.repeat ? (b.params ?? []).find((x) => x.name === b.repeat.param)?.options ?? [] : []);
    const open = (b) => !uses(b) || (b.repeat && uses(b) < variants(b).length);
    // the best free item for a role, and the block that shows it; each argument leans on a different block
    const place = (role, kind) => {
      const pool = items.filter((it) => free(it) && KINDS[it.kind].role === role && (!kind || it.kind === kind)).sort(rank);
      for (const it of pool) {
        // a block not used yet comes before one that would repeat: variety first
        const blocks = candidates(it, scenes).filter((b) => open(b) && items.filter((x) => free(x) && fits(lead(b), x)).length >= (lead(b).count ?? 1)).sort((a, b) => uses(a) - uses(b));
        if (!blocks.length) continue;
        // among the blocks that fit it equally well (and take as many items), each argument picks a different one
        const tier = blocks.filter((b) => uses(b) === uses(blocks[0]) && offKey(lead(b), it) === offKey(lead(blocks[0]), it) && (lead(b).count ?? 1) === (lead(blocks[0]).count ?? 1));
        const b = blocks.find((x) => x.id === it.show) ?? tier[n % tier.length], count = lead(b).count ?? 1;   // the user's pick wins
        const group = count > 1 ? [it, ...items.filter((x) => x !== it && free(x) && fits(lead(b), x)).sort(rank).slice(0, count - 1)].sort((x, y) => order.get(x.id) - order.get(y.id)) : [it];
        return take(b, group, role);
      }
      return false;
    };
    const take = (b, group, role) => {
      group.forEach((g) => usedItems.add(g.id));
      // a repeating block: the user's own setting for this item, else the next one this structure has not used yet
      let variant = null;
      if (b.repeat) {
        const taken = usedBlocks.get(b.id) ?? [], mine = group[0].tune?.[b.repeat.param];
        variant = mine ?? variants(b).slice(n * 3 % Math.max(1, variants(b).length)).concat(variants(b)).find((v) => !taken.includes(v)) ?? variants(b)[0];
      }
      usedBlocks.set(b.id, [...(usedBlocks.get(b.id) ?? []), variant]);
      // what else the block takes: a required extra must be free, an optional one is used when it is
      const extras = [];
      for (const need of b.needs.slice(1)) {
        if (need.kind === 'name') { extras.push([need, null]); continue; }
        const x = items.filter((i) => free(i) && fits(need, i)).sort(rank)[0];
        if (x && (!need.optional || KINDS[x.kind].role === 'bed')) { usedItems.add(x.id); extras.push([need, x]); }
      }
      const fill = { ...evalFill(lead(b).fill, group, brief) };
      for (const [need, x] of extras) Object.assign(fill, evalFill(need.fill, x ? [x] : [], brief));
      // how the user tuned this block for this item (its own settings, its background) goes into the part as well
      for (const g of group) if (g.show === b.id || !g.show) Object.assign(fill, g.tune ?? {});
      if (variant !== null) fill[b.repeat.param] = variant;
      beats.push({ role, id: b.id, ...(variant !== null ? { variant } : {}), duration: b.duration ?? 5, min: floorOf(b), what: group.map(describe).join(' · '), items: [...group, ...extras.map(([, x]) => x).filter(Boolean)].map((g) => g.id), must: group.some((g) => g.must), fill });
      return true;
    };
    for (const s of arg.slots) place(s.role, s.kind) || (s.or && place(s.or)) || (s.kind && place(s.role));
    // a must that no slot took still goes in, with whatever shows it
    for (const it of items.filter((i) => i.must && free(i)).sort(rank)) place(KINDS[it.kind].role, it.kind);
    // while the length asked leaves room, what the user kept and no slot took goes in too, spread out: as far as it
    // can sit from the beats of its own kind, so five sentences never play one after another
    if (seconds) {
      const room = () => seconds - beats.reduce((t, b) => t + b.min, 0) - 3.9;   // 3.9: about what the close needs
      for (const it of items.filter((i) => free(i) && i !== logo && KINDS[i.kind].role !== 'bed').sort(rank)) {
        const c = candidates(it, scenes).find(open); if (!c || room() < floorOf(c)) continue;
        const before = beats.length; if (!place(KINDS[it.kind].role, it.kind)) continue;
        const [added] = beats.splice(before, 1);
        let best = beats.length, score = -1;
        for (let at = 1; at <= beats.length; at++) {
          const gap = Math.min(...beats.map((x, i) => (x.role === added.role ? (i < at ? at - i : i - at + 1) : Infinity)));
          if (gap >= score) { score = gap; best = at; }
        }
        beats.splice(best, 0, added);
      }
    }
    if (!beats.length) return;
    // the close: the brand's logo when the inventory brings it, else its name, a different way in each structure
    const closer = logoBlock ?? (closers.length ? closers[n % closers.length] : null);
    if (closer) {
      const fill = logoBlock ? evalFill(lead(closer).fill, [logo], brief) : Object.assign({}, ...closer.needs.filter((x) => x.kind === 'name').map((x) => evalFill(x.fill, [], brief)));
      beats.push({ role: 'close', id: closer.id, duration: closer.duration ?? 5, min: floorOf(closer), what: brief.action ? `the name and the action: ${brief.action}` : 'the name and the action', items: logoBlock ? [logo.id] : [], must: true, fill });
    }
    const key = beats.map((b) => `${b.id}:${b.items.join('+')}`).join('|');
    if (seen.has(key)) return;
    seen.add(key);
    options.push({ title: arg.title, why: arg.why, ...timed(beats, seconds), left: items.filter((i) => free(i) && i !== logo && KINDS[i.kind].role !== 'bed').map((i) => i.id) });
  });
  return options.map((o, i) => ({ letter: String.fromCharCode(65 + i), ...o }));
}

// Fits the beats to the length asked for. Every beat plays its whole scene, faster or slower: none faster than its
// floor (SPEED.fast), so a piece that is too long loses its last beat that is not a must instead. A short piece plays
// a little slower (up to a quarter), never more: padding it further would be a lie about the content.
function timed(beats, target) {
  let list = beats.map((b) => ({ ...b })), notes = [];
  const sum = (k) => list.reduce((s, b) => s + b[k], 0);
  if (target) {
    // too long even at every floor: the last beat that is not a must goes, unless keeping it lands closer to the length asked
    while (sum('min') > target && list.some((b) => !b.must)) {
      const i = list.findLastIndex((b) => !b.must), over = sum('min') - target, under = target - (sum('duration') - list[i].duration);
      if (over <= under) break;
      notes.push(`dropped "${list[i].what}" to fit ${target} s`); list.splice(i, 1);
    }
    // share out what is left over the floors; a scene never runs past its own length, so a short piece stays short
    const total = sum('duration'), room = total - sum('min');
    if (target >= total) { const g = Math.min(1.25, target / (total || 1)); list.forEach((b) => { b.duration = +(b.duration * g).toFixed(1); }); }
    else { const k = Math.max(0, (target - sum('min')) / (room || 1)); list.forEach((b) => { b.duration = +(b.min + (b.duration - b.min) * k).toFixed(1); }); }
    if (sum('duration') > target * 1.05) notes.push(`runs ${sum('duration').toFixed(1)} s, over the ${target} s asked: every beat left is a must and none can run shorter`);
    if (sum('duration') < target * 0.9) notes.push(`runs ${sum('duration').toFixed(1)} s of the ${target} s asked: there is no more material to show`);
  }
  let t = 0; const count = {};
  const out = list.map((b, i) => {
    const base = i === 0 && b.role === 'say' ? 'Hook' : ROLE_NAMES[b.role], k = (count[base] = (count[base] ?? 0) + 1);
    const from = +t.toFixed(1); t += b.duration;
    return { name: k > 1 ? `${base} ${k}` : base, id: b.id, ...(b.variant ? { variant: b.variant } : {}), from, to: +t.toFixed(1), what: b.what, items: b.items, fill: b.fill };
  });
  return { seconds: +t.toFixed(1), beats: out, notes };
}

/** A structure as the board's `--option "@Title | seconds | Beat a-b [block] what; …"`. */
export function boardOption(o) {
  const clean = (s) => String(s).replace(/[;|\[\]]/g, ',').replace(/[`$]/g, '').replace(/\s+/g, ' ').trim();
  return `@${clean(o.title)} | ${o.seconds} | ${o.beats.map((b) => `${clean(b.name)} ${b.from}-${b.to} [${b.id}] ${clean(b.what)}${b.variant ? `, ${b.variant}` : ''}`).join('; ')}`;
}

// ── filling a scene's CONFIG ────────────────────────────────────────────────────────────────────────────────────

/** A `fill` template evaluated against the items a need took. Keys whose value is missing are left out. */
export function evalFill(tpl, group, brief = {}) {
  const item = group[0] ?? {};
  const get = (it, ref) => { let v = ref.startsWith('brief.') ? brief : it; for (const k of (ref.startsWith('brief.') ? ref.slice(6) : ref).split('.')) v = v?.[k]; return v; };
  const ev = (t, it) => {
    if (typeof t === 'string') return t.startsWith('$') ? get(it, t.slice(1)) : t;
    if (Array.isArray(t)) return t.map((x) => ev(x, it) ?? '');
    if (t && typeof t === 'object') {
      if ('$each' in t) return group.map((g) => ev(t.$each, g));
      if ('$col' in t) return (it[t.$col[0]] ?? []).map((r) => r[t.$col[1]]);
      if ('$argmax' in t) { const rows = it[t.$argmax] ?? []; return rows.reduce((best, r, i) => (r[1] > rows[best][1] ? i : best), 0); }
      const o = {}; for (const [k, v] of Object.entries(t)) { const x = ev(v, it); if (x !== undefined) o[k] = x; } return o;
    }
    return t;
  };
  return ev(tpl ?? {}, item);
}

// a JS literal a person can still edit: one line when short, one entry per line when long, backticks for many lines
function lit(v, pad = '  ') {
  if (typeof v === 'string') return v.includes('\n') ? `\`${v.replace(/\\/g, '\\\\').replace(/`/g, '\\`').replace(/\$\{/g, '\\${')}\`` : `'${v.replace(/\\/g, '\\\\').replace(/'/g, "\\'")}'`;
  if (v === null || typeof v !== 'object') return String(v);
  const key = (k) => (/^[A-Za-z_$][\w$]*$/.test(k) ? k : `'${k}'`);
  const flat = Array.isArray(v) ? `[${v.map((x) => lit(x, pad)).join(', ')}]` : `{ ${Object.entries(v).map(([k, x]) => `${key(k)}: ${lit(x, pad)}`).join(', ')} }`;
  if (!Array.isArray(v) || flat.length <= 96) return flat;
  return `[\n${v.map((x) => `${pad}  ${lit(x, `${pad}  `)},`).join('\n')}\n${pad}]`;
}

// the top-level entries of `const CONFIG = { … };`, found by reading the code (a value may hold lines that look like keys)
function configEntries(body) {
  const starts = [];
  let depth = 0, quote = null, lineStart = true;
  for (let i = 0; i < body.length; i++) {
    const c = body[i], two = body.slice(i, i + 2);
    if (lineStart && !quote && depth === 0) { const m = body.slice(i).match(/^ {2}(\w+): /); if (m) starts.push({ at: i, key: m[1] }); }
    lineStart = c === '\n';
    if (quote) { if (c === '\\') i++; else if (c === quote) quote = null; continue; }
    if (two === '//') { const nl = body.indexOf('\n', i); i = (nl < 0 ? body.length : nl) - 1; continue; }
    if (c === "'" || c === '"' || c === '`') quote = c;
    else if ('([{'.includes(c)) depth++;
    else if (')]}'.includes(c)) depth--;
  }
  return starts.map((s, k) => ({ key: s.key, from: s.at, to: k + 1 < starts.length ? starts[k + 1].at : body.length }));
}

/** Writes values into a scene's CONFIG, key by key; everything else in the scene stays as it was. */
export function fillConfig(html, values) {
  const open = 'const CONFIG = {\n', start = html.indexOf(open), end = html.indexOf('\n};', start);
  if (start < 0 || end < 0) throw new Error('this scene has no CONFIG');
  const body = html.slice(start + open.length, end + 1), entries = configEntries(body), done = new Set();
  let out = body.slice(0, entries[0]?.from ?? 0);
  for (const e of entries) {
    if (e.key in values) { done.add(e.key); out += `  ${e.key}: ${lit(values[e.key])},\n`; }
    else out += body.slice(e.from, e.to);
  }
  const fresh = Object.entries(values).filter(([k]) => !done.has(k)).map(([k, v]) => `  ${k}: ${lit(v)},\n`).join('');
  return `${html.slice(0, start)}${open}${out}${fresh}${html.slice(end + 1)}`;
}

// ── a plan on disk ──────────────────────────────────────────────────────────────────────────────────────────────

export function writePlan(dir, options, { seconds } = {}) {
  fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(planFile(dir), JSON.stringify({ seconds: seconds ?? null, options }, null, 2) + '\n');
}

/** One structure of a plan, by its letter or title, as parts for `initChain` and the fill of each. */
export function planParts(dir, pick) {
  const plan = readJson(planFile(dir), null);
  if (!plan) throw new Error('no plan.json yet: run `pamo plan <piece>` first');
  const o = plan.options.find((x) => x.letter === String(pick).toUpperCase() || x.title === pick);
  if (!o) throw new Error(`plan has no option "${pick}" (it has ${plan.options.map((x) => x.letter).join(', ')})`);
  return { title: o.title, parts: o.beats.map((b) => ({ id: b.id, name: b.name, seconds: +(b.to - b.from).toFixed(1), what: b.what, ...(b.items.length ? { shows: b.items } : {}) })), fills: o.beats.map((b) => b.fill) };
}
