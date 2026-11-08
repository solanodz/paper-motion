// The paper-motion registry: resources (moves, backgrounds, palettes, font pairs, recipes) that agents pick by
// name and install into a project as editable code or brand files. Source: registry/<type>/<id>/item.json in the
// repo. `build` publishes it for the site (registry.json, r/<id>.json, llms.txt); `add` installs from a local
// registry folder or from the site.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { apply as applyValues, parseSet } from './customize.mjs';

const ENGINE = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const REPO = path.resolve(ENGINE, '..', '..');
export const SITE = 'https://paper-motion.app';
const TYPES = ['component', 'transition', 'text', 'camera', 'background', 'palette', 'font-pair', 'recipe'];
const TYPE_TITLES = { component: 'Component transitions', transition: 'Transitions', text: 'Text effects', camera: 'Camera and energy', background: 'Backgrounds', palette: 'Palettes', 'font-pair': 'Font pairs', recipe: 'Recipes' };

/** The registry to use: an explicit folder or URL, $PAPER_MOTION_REGISTRY, this repo's registry/ when present, else the site. */
export function resolveRegistry(given) {
  const r = given ?? process.env.PAPER_MOTION_REGISTRY;
  if (r) return /^https?:\/\//.test(r) ? { url: r.replace(/\/$/, '') } : { dir: path.resolve(r) };
  const local = path.join(REPO, 'registry');
  return fs.existsSync(path.join(local, 'schema.json')) ? { dir: local } : { url: SITE };
}

// ── reading and validating ──────────────────────────────────────

export function loadItems(dir) {
  const out = [];
  for (const type of fs.readdirSync(dir)) {
    const td = path.join(dir, type);
    if (!fs.statSync(td).isDirectory() || type.startsWith('_')) continue;
    for (const id of fs.readdirSync(td)) {
      const f = path.join(td, id, 'item.json');
      if (fs.existsSync(f)) out.push({ ...JSON.parse(fs.readFileSync(f, 'utf8')), _dir: path.join(td, id) });
    }
  }
  return out.sort((a, b) => TYPES.indexOf(a.type) - TYPES.indexOf(b.type) || a.id.localeCompare(b.id));
}

/** A small JSON Schema check (the subset registry/schema.json uses). Returns a list of problems. */
function check(value, schema, at = '') {
  const errs = [];
  const t = Array.isArray(value) ? 'array' : value === null ? 'null' : typeof value;
  if (schema.type && schema.type !== t && !(schema.type === 'number' && t === 'number')) return [`${at || '/'}: expected ${schema.type}, got ${t}`];
  if (schema.enum && !schema.enum.includes(value)) errs.push(`${at}: "${value}" is not one of ${schema.enum.join(', ')}`);
  if (t === 'string') {
    if (schema.pattern && !new RegExp(schema.pattern).test(value)) errs.push(`${at}: "${value}" does not match ${schema.pattern}`);
    if (schema.maxLength && value.length > schema.maxLength) errs.push(`${at}: longer than ${schema.maxLength} characters`);
  }
  if (t === 'array') {
    if (schema.minItems && value.length < schema.minItems) errs.push(`${at}: needs at least ${schema.minItems} items`);
    if (schema.items) value.forEach((v, i) => errs.push(...check(v, schema.items, `${at}/${i}`)));
  }
  if (t === 'object') {
    for (const k of schema.required ?? []) if (!(k in value)) errs.push(`${at}/${k}: required`);
    for (const [k, v] of Object.entries(value)) {
      if (schema.properties?.[k]) errs.push(...check(v, schema.properties[k], `${at}/${k}`));
      else if (schema.additionalProperties === false && !k.startsWith('_')) errs.push(`${at}/${k}: not allowed`);
    }
  }
  return errs;
}

export function validate(dir) {
  const schema = JSON.parse(fs.readFileSync(path.join(dir, 'schema.json'), 'utf8'));
  const items = loadItems(dir), ids = new Set(), problems = [];
  for (const it of items) {
    const where = path.relative(REPO, it._dir);
    for (const e of check(it, schema)) problems.push(`${where}: ${e}`);
    if (ids.has(it.id)) problems.push(`${where}: duplicate id "${it.id}"`);
    ids.add(it.id);
    if (path.basename(it._dir) !== it.id) problems.push(`${where}: folder name must equal id "${it.id}"`);
    if (path.basename(path.dirname(it._dir)) !== it.type) problems.push(`${where}: lives under ${path.basename(path.dirname(it._dir))}/ but type is "${it.type}"`);
    for (const f of it.files ?? []) if (!fs.existsSync(path.join(REPO, f.from))) problems.push(`${where}: missing file ${f.from}`);
  }
  for (const it of items) for (const r of [...(it.requires?.items ?? []), ...(it.related ?? [])]) if (!ids.has(r)) problems.push(`${it.id}: refers to unknown resource "${r}"`);
  return { items, problems };
}

// ── publishing ──────────────────────────────────────────────────

/** Imports inside the repo point at the runtime; in a user's project they point at the package. */
export const rewriteImports = (code) => code.replace(/(['"])\.\.\/(index|core)\.js\1/g, "'paper-motion'").replace(/(['"])\.\.\/kit\.js\1/g, "'paper-motion/kit'");

const BINARY = /\.(png|jpe?g|webp|gif|avif|woff2?|ttf|otf|mp4|webm)$/i;

/**
 * The full resource as served at r/<id>.json: the item plus its files, ready to write. Text files carry their content;
 * binary files (images, fonts) carry a URL under <site>/files/ instead.
 */
export function resolveItem(it, site = SITE) {
  const { _dir, ...item } = it;
  return { ...item, files: (it.files ?? []).map((f) => (BINARY.test(f.from)
    ? { path: f.to, url: `${site}/files/${path.basename(f.from)}`, from: f.from }
    : { path: f.to, content: rewriteImports(fs.readFileSync(path.join(REPO, f.from), 'utf8')) })) };
}

const summaryLine = (it, site) => `- [${it.title}](${site}/r/${it.id}.json): ${it.summary}${it.tags?.length ? ` _(${it.tags.filter((t) => t !== it.type).join(', ')})_` : ''}`;

export function llmsTxt(items, site, { full = false } = {}) {
  const head = `# paper-motion

> A library of motion resources for AI agents: component transitions, transitions, text effects, camera moves,
> backgrounds (Paper shaders), palettes, font pairs and video recipes. Pick resources by name, install them into a
> project as editable code or brand files, adapt their parameters, and render the video with the paper-motion engine.

## How to use it (for agents)

1. **Set up.** Install the skills with \`npx skills add solanodz/paper-motion\` and the engine with
   \`npx paper-motion setup\` (needs Node 18+, ffmpeg and Chrome). The CLI is \`npx paper-motion\` (alias \`pamo\`).
2. **Pick resources by name.** The user may name them ("backgrounds mesh-sage and grain-slate, effects magic-move and
   whip-pan"). Every resource is listed below; ${site}/registry.json is the index and ${site}/r/<id>.json is one resource
   with its params, usage notes and file contents.
3. **Install them.** Run \`npx paper-motion add <id> [<id>…]\` in the project root. Code resources (moves) are copied to
   \`moves/<file>.js\`; backgrounds are added to \`brand/shader-set/set.json\`; palettes and font pairs are merged into
   \`brand/tokens.json\`; recipes write a scene to \`pieces/<id>/\`. Without the CLI, write the files and entries from
   r/<id>.json yourself; imports point at \`paper-motion\` and \`paper-motion/kit\`.
4. **Adapt them.** Each resource lists its \`params\`: change them in the call (moves), in set.json (backgrounds) or in
   tokens.json (palettes, fonts). The copied code is the user's to edit.
5. **Make the video.** Follow the \`make-video\` skill: agree a brief with the user, build \`scene.html\` (a pure
   function of time), check stills with \`npx paper-motion still\`, and render with
   \`npx paper-motion render scene.html --motion-blur 5\`. Component transitions expect A and B stacked in one slot.

Resources by type (${items.length} in all):
`;
  const sections = TYPES.filter((t) => items.some((i) => i.type === t)).map((t) => {
    const list = items.filter((i) => i.type === t);
    if (!full) return `\n## ${TYPE_TITLES[t]}\n\n${list.map((i) => summaryLine(i, site)).join('\n')}\n`;
    return `\n## ${TYPE_TITLES[t]}\n\n${list.map((i) => [
      `### ${i.title} · \`${i.id}\``, '', i.summary, '',
      i.signature ? `Signature: \`${i.signature}\`` : '',
      i.params?.length ? `Params: ${i.params.map((p) => `\`${p.name}\`${p.default !== undefined ? ` = ${JSON.stringify(p.default)}` : ''}${p.description ? ` (${p.description})` : ''}`).join('; ')}` : '',
      i.notes?.length ? i.notes.map((n) => `- ${n}`).join('\n') : '',
      `Install: \`npx paper-motion add ${i.id}\` · ${site}/r/${i.id}.json`, '',
      '```js', i.usage, '```', '',
    ].filter((x) => x !== '').join('\n')).join('\n\n')}\n`;
  });
  return head + sections.join('');
}

/**
 * The site's live player: the moves, kit and core (browser-safe), the demo harness with its imports pointed at them,
 * its stylesheet scoped to `.pm-play`, and its fonts. The site imports them at runtime from /play/.
 */
function publishPlayer(dir, out) {
  const RT = path.join(ENGINE, 'runtime'), demo = path.join(dir, '_demo');
  fs.rmSync(out, { recursive: true, force: true });
  fs.mkdirSync(path.join(out, 'engine', 'moves'), { recursive: true });
  for (const f of ['core.js', 'kit.js', 'moves.js']) fs.copyFileSync(path.join(RT, f), path.join(out, 'engine', f));
  for (const f of fs.readdirSync(path.join(RT, 'moves'))) fs.copyFileSync(path.join(RT, 'moves', f), path.join(out, 'engine', 'moves', f));
  const js = fs.readFileSync(path.join(demo, 'demos.js'), 'utf8')
    .replace(/import \{ scene, ([^}]*) \} from 'paper-motion';/, "import { $1 } from './engine/core.js';\nconst scene = () => { throw new Error('the site mounts demos with mount()'); };")
    .replace(/from 'paper-motion\/moves'/g, "from './engine/moves.js'");
  fs.writeFileSync(path.join(out, 'demos.js'), js);
  const css = fs.readFileSync(path.join(demo, 'demo.css'), 'utf8').replace(/\/\*[\s\S]*?\*\//g, '').replace(/^([^@\s{][^{]*)\{/gm, (m, sel) => `${sel.split(',').map((x) => (x.trim().startsWith('#stage') ? x.replace('#stage', '.pm-play') : `.pm-play ${x.trim()}`)).join(', ')} {`);
  fs.writeFileSync(path.join(out, 'demo.css'), css);
  fs.mkdirSync(path.join(out, 'fonts'), { recursive: true });
  for (const f of fs.readdirSync(path.join(demo, 'fonts'))) fs.copyFileSync(path.join(demo, 'fonts', f), path.join(out, 'fonts', f));
}

/** Writes registry.json, r/<id>.json, schema.json, llms.txt and llms-full.txt into `out`. */
export function build({ dir = resolveRegistry().dir, out, site = SITE } = {}) {
  const { items, problems } = validate(dir);
  if (problems.length) { const e = new Error(`registry: ${problems.length} problem(s)\n  ${problems.join('\n  ')}`); e.problems = problems; throw e; }
  fs.mkdirSync(path.join(out, 'r'), { recursive: true });
  const index = {
    name: 'paper-motion', site, schema: `${site}/schema.json`, count: items.length, types: TYPES.filter((t) => items.some((i) => i.type === t)),
    items: items.map(({ id, type, title, summary, tags, version, preview, related }) => ({ id, type, title, summary, tags, version, url: `${site}/r/${id}.json`, ...(preview ? { preview } : {}), ...(related ? { related } : {}) })),
  };
  fs.writeFileSync(path.join(out, 'registry.json'), JSON.stringify(index, null, 2));
  fs.mkdirSync(path.join(out, 'files'), { recursive: true });
  for (const it of items) {
    fs.writeFileSync(path.join(out, 'r', `${it.id}.json`), JSON.stringify(resolveItem(it, site), null, 2));
    for (const f of it.files ?? []) if (BINARY.test(f.from)) fs.copyFileSync(path.join(REPO, f.from), path.join(out, 'files', path.basename(f.from)));
  }
  fs.copyFileSync(path.join(dir, 'schema.json'), path.join(out, 'schema.json'));
  publishPlayer(dir, path.join(out, 'play'));
  fs.writeFileSync(path.join(out, 'llms.txt'), llmsTxt(items, site));
  fs.writeFileSync(path.join(out, 'llms-full.txt'), llmsTxt(items, site, { full: true }));
  return { count: items.length, out };
}

// ── installing ──────────────────────────────────────────────────

async function fetchJson(url) {
  const r = await fetch(url);
  if (!r.ok) throw new Error(`${url}: ${r.status} ${r.statusText}`);
  return r.json();
}

/** One resolved resource (with file contents) from a local folder or the site. */
export async function getItem(id, reg = resolveRegistry()) {
  if (reg.dir) {
    const it = loadItems(reg.dir).find((i) => i.id === id);
    if (!it) throw new Error(`no resource "${id}" in ${reg.dir} (try \`pamo search\`)`);
    return resolveItem(it);
  }
  return fetchJson(`${reg.url}/r/${id}.json`);
}

export async function getIndex(reg = resolveRegistry()) {
  if (reg.dir) return { items: loadItems(reg.dir).map(({ _dir, ...i }) => i) };
  return fetchJson(`${reg.url}/registry.json`);
}

const readJson = (f, fallback) => (fs.existsSync(f) ? JSON.parse(fs.readFileSync(f, 'utf8')) : fallback);
const writeJson = (f, v) => { fs.mkdirSync(path.dirname(f), { recursive: true }); fs.writeFileSync(f, JSON.stringify(v, null, 2) + '\n'); };

/** Deep-merges `frag` into `base`; keys that already hold a different value are reported, and replaced only with force. */
function mergeInto(base, frag, force, at = '', conflicts = []) {
  for (const [k, v] of Object.entries(frag)) {
    const key = at ? `${at}.${k}` : k;
    if (v && typeof v === 'object' && !Array.isArray(v) && base[k] && typeof base[k] === 'object' && !Array.isArray(base[k])) mergeInto(base[k], v, force, key, conflicts);
    else if (base[k] !== undefined && JSON.stringify(base[k]) !== JSON.stringify(v)) { conflicts.push(key); if (force) base[k] = v; }
    else base[k] = v;
  }
  return conflicts;
}

/**
 * Installs resources into the project at `cwd`, resolving `requires.items` first. Returns a report per resource.
 * Never overwrites a changed file or a different brand value unless `force`.
 */
export async function add(ids, { cwd = process.cwd(), registry, force = false, name, set = [] } = {}) {
  const reg = resolveRegistry(registry), done = new Map(), report = [];
  const lockFile = path.join(cwd, 'paper-motion.json'), lock = readJson(lockFile, { registry: reg.url ?? 'local', items: {} });
  async function one(id) {
    if (done.has(id)) return;
    done.set(id, true);
    let it = await getItem(id, reg);
    for (const dep of it.requires?.items ?? []) await one(dep);
    // --set key=value (or --set id:key=value with several ids): the same output the site's code tabs show
    const pairs = set.filter((x) => (x.includes(':') && x.indexOf(':') < x.indexOf('=') ? x.startsWith(`${id}:`) : ids.length === 1 && ids[0] === id)).map((x) => (x.startsWith(`${id}:`) ? x.slice(id.length + 1) : x));
    if (pairs.length) it = { ...it, ...applyValues(it, parseSet(it, pairs)) };
    const r = { id, type: it.type, wrote: [], skipped: [], conflicts: [], usage: it.usage, notes: it.notes ?? [] };
    const kind = it.install?.kind ?? 'code';
    const base = kind === 'scene' ? path.join('pieces', name ?? it.id) : '';
    for (const f of it.files ?? []) {
      const rel = kind === 'scene' ? path.join(base, path.basename(f.path)) : f.path, dest = path.join(cwd, rel);
      if (f.content === undefined) {
        // a binary asset: kept if present, else copied from the local registry or downloaded from the site
        if (fs.existsSync(dest) && !force) continue;
        fs.mkdirSync(path.dirname(dest), { recursive: true });
        if (reg.dir && f.from && fs.existsSync(path.join(REPO, f.from))) fs.copyFileSync(path.join(REPO, f.from), dest);
        else { const res = await fetch(f.url); if (!res.ok) throw new Error(`${f.url}: ${res.status}`); fs.writeFileSync(dest, Buffer.from(await res.arrayBuffer())); }
        r.wrote.push(rel); continue;
      }
      if (fs.existsSync(dest) && fs.readFileSync(dest, 'utf8') !== f.content && !force) { r.skipped.push(rel); continue; }
      fs.mkdirSync(path.dirname(dest), { recursive: true });
      fs.writeFileSync(dest, f.content);
      r.wrote.push(rel);
    }
    if (kind === 'shader-set') {
      const f = path.join(cwd, 'brand/shader-set/set.json'), set = readJson(f, { format: { width: 1920, height: 1080, duration: 6, fps: 30 }, entries: [] });
      set.entries ??= [];
      const entry = { id: it.id, source: 'paper-motion.app', ...it.install.entry }, at = set.entries.findIndex((e) => e.id === it.id);
      if (at < 0) set.entries.push(entry);
      else if (JSON.stringify(set.entries[at]) !== JSON.stringify(entry)) { if (force) set.entries[at] = entry; else r.conflicts.push(`shader-set entry "${it.id}" already exists`); }
      writeJson(f, set); r.wrote.push('brand/shader-set/set.json');
    }
    if (kind === 'tokens') {
      const f = path.join(cwd, 'brand/tokens.json'), tokens = readJson(f, {});
      r.conflicts.push(...mergeInto(tokens, it.install.entry ?? {}, force).map((k) => `brand/tokens.json ${k}`));
      writeJson(f, tokens); r.wrote.push('brand/tokens.json');
    }
    lock.items[it.id] = it.version;
    report.push(r);
  }
  for (const id of ids) await one(id);
  writeJson(lockFile, lock);
  return report;
}

export async function search(query, opts = {}) {
  const { items } = await getIndex(resolveRegistry(opts.registry));
  const words = String(query ?? '').toLowerCase().split(/\s+/).filter(Boolean);
  const hit = (i) => { const hay = [i.id, i.type, i.title, i.summary, ...(i.tags ?? [])].join(' ').toLowerCase(); return words.every((w) => hay.includes(w)); };
  return items.filter((i) => (!opts.type || i.type === opts.type) && hit(i));
}
