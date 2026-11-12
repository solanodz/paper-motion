// The paper-motion registry: resources (moves, backgrounds, palettes, font pairs, recipes) that agents pick by
// name and install into a project as editable code or brand files. Source: registry/<type>/<id>/item.json in the
// repo. `build` publishes it for the site (registry.json, r/<id>.json, llms.txt); `add` installs from a local
// registry folder or from the site.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { apply as applyValues, defaults, paletteColors, parseSet, recolor } from './customize.mjs';
import { find } from './find.mjs';

const ENGINE = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const REPO = path.resolve(ENGINE, '..', '..');
// until the paper-motion.app domain is connected, the live site is the vercel URL
export const SITE = (process.env.PAPER_MOTION_SITE ?? 'https://paper-motion.vercel.app').replace(/\/$/, '');
const TYPES = ['component', 'transition', 'text', 'camera', 'background', 'palette', 'font-pair', 'recipe', 'shot', 'block'];
const TYPE_TITLES = { component: 'Component transitions', transition: 'Transitions', text: 'Text effects', camera: 'Camera and energy', background: 'Backgrounds', palette: 'Palettes', 'font-pair': 'Font pairs', recipe: 'Recipes', shot: 'Shots', block: 'Blocks' };

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
  if (schema.type && schema.type !== t && !(schema.type === 'integer' && t === 'number' && Number.isInteger(value))) return [`${at || '/'}: expected ${schema.type}, got ${t}`];
  if (schema.type === 'integer') { if (schema.minimum !== undefined && value < schema.minimum) errs.push(`${at}: below ${schema.minimum}`); if (schema.maximum !== undefined && value > schema.maximum) errs.push(`${at}: above ${schema.maximum}`); }
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

> Motion resources for AI agents: component transitions, transitions, text effects, camera moves, backgrounds
> (Paper shaders), palettes, font pairs and video recipes, each with a name. You pick them for the user's brand,
> propose options as a **board** link they open in a browser, install what they choose as code they own, and render
> the video with the paper-motion engine. Nothing here renders on a server: every preview plays in the user's browser.

## The flow (for agents)

1. **Set up.** \`npx skills add solanodz/paper-motion\` (the skills) and \`npx paper-motion setup\` (the engine: Node 18+,
   ffmpeg, Chrome). The CLI is \`npx paper-motion\`; where these docs write \`pamo\`, type \`npx paper-motion\` (the npm package named \`pamo\` is unrelated). \`npx paper-motion --version\` prints the version. Every command answers \`--help\`. Agents load
   skills and MCP servers when a session starts, so after installing the skills **read
   \`.claude/skills/make-video/SKILL.md\` now** (or \`.agents/skills/make-video/SKILL.md\`) and follow it in this
   session; tell the user that the MCP at ${site}/mcp, if they want it, is added before opening a session.
2. **Open the studio: it is where the user decides.** A video is made in stages the user watches and approves in
   a local page in three steps (What it says: brief and inventory; Your video; Export). Start the piece right after setup:
   \`npx paper-motion piece init <piece> --title "…"\` (it starts the project's studio in the background). Then,
   at the end of each stage, \`npx paper-motion piece review <piece> <stage>\`: the first time it opens the studio in
   the user's browser; it waits for their decision and prints what they did, one \`paper-motion: piece …\` line each
   (an approval, a change to make, or an edit they already made by hand: the brief, words on screen, lengths, joins,
   order; build on those, never undo them). Quick renders for review: \`chain <piece> --drafts\` (each part on its
   own) and \`chain <piece> --draft\` (joined). Only when the user can't open a browser, run the same stages in the
   chat.
3. **Interview.** Follow the \`make-video\` skill. Without the skills, ask at least: what the brand is in one plain
   line; what this video is for and where it plays (format: 16:9, 9:16, 1:1); its ground, text and accent colors or
   "no brand yet"; three words for the feel and one thing it must never look like; the one action at the end.
   Mirror it back, write it into the brief (\`piece init --what … --who … --format … --tone … --action …\`) and
   \`piece review <piece> brief\`. **You never choose a look for the user.** These decisions always go
   through a board, in this order, one board each: palette · font pair · background(s) · moves by role (how things
   enter, how one thing becomes the next, how text arrives; let them pick several with \`choose\`) · recipe or shots
   (shots are 3–6 s camera gestures: a close-up, a pass over a component, a cursor that clicks; they chain before a
   recipe or stand alone) · blocks for the moments inside it (ready-made 4–8 s pieces: annotations on a screen, a
   form, a terminal, code typing, a chart, captions, a logo sting; each recomposes for 16:9, 9:16 and 1:1). Skip a
   board only when the brand folder already settles that decision, and say so.
4. **Propose with boards.** For each visual decision (palette, type, background, moves, recipe) pick 2–4 options from
   this registry and share a board link: \`pamo board --url --title … --option id … --look palette,font\` prints it
   (format below): a short link (\`${site}/b/<id>\`, stored for 90 days) when the site answers, the long form
   with the board in the URL fragment otherwise. The user opens it, sees the options live in their look, may tune one,
   and chooses. The command keeps running and prints the choice the moment they choose (10 min by default;
   \`--no-wait\` returns at once and they paste the line instead). It is one line: \`paper-motion: B · mesh-sage --set
   speed=0.8 (bg-1)\`, \`paper-motion: A+C · type-on · scramble (text-1)\` when the board let them pick several
   (\`--choose 1-3\`: use it for text effects and transitions), or \`paper-motion: none of bg-1, calmer ones\`. The
   reply carries every value that differs from the defaults, your pre-tuning included, so installing it reproduces what
   they saw. Never ask the user to paste anything while a command or the MCP is waiting: the choice arrives on its own.
5. **Install the choices.** \`npx paper-motion add <id> [--set key=value …]\` in the project root, with exactly the
   \`--set\` arguments from the reply. Moves go to \`moves/\`, backgrounds to \`brand/shader-set/set.json\`, palettes and
   fonts to \`brand/tokens.json\`, recipes to \`pieces/<id>/\`. Their choices also accumulate in a kit at ${site}/kit,
   whose prompt carries the whole \`pamo add\` command. \`add\` never overwrites a value already in the project: when
   the user re-chooses or re-tunes something you installed before, pass \`--force\`. A recipe also reads
   \`brand/motion.json\` (pace) and \`brand/sound.json\` (cues; without it the piece is silent) and the brand's name
   from \`tokens.json\` \`brand\`: write those from the interview before rendering.
6. **Make the video.** Every move the user chose appears in the piece, and the brief says where each one plays
   (a chosen transition may be the join between two parts of a chain: \`"join": "wipe"\` in chain.json takes its id);
   a recipe's own moves are placeholders to swap for theirs. Build \`scene.html\` (a pure function of time), check stills with \`pamo still\`, render with
   \`pamo render scene.html --motion-blur 5\`. The test shot and the final piece are real renders, not boards.
   When the user chose a structure whose beats name blocks or shots (or several blocks in order), chain them instead:
   \`npx paper-motion chain init <piece> --board <id> --option D\` installs each beat's block under
   \`pieces/<piece>/<nn>-<id>/\` and writes \`chain.json\` (seconds per part; \`join\`: whip, cut, dissolve or dip);
   write each part's \`CONFIG\` from its beat, then \`npx paper-motion chain <piece> --motion-blur 5\` renders every
   part in the brand's look and joins them into one video. It warns when a part is cut before its land.
   In the studio the stages are brief, inventory, video and final. When the user approves the inventory the studio
   builds the video itself from what they kept, and then they edit it there, live (words, how each part arrives,
   backgrounds, settings, lengths, transitions, order, adding and swapping parts, colours, type, pace); every edit
   reaches you as a line. Review \`video\` to wait for their approval; they can render the final from the studio. \`chain --check\` warns when the total drifts from the brief's
   length. Boards you share while a piece is open also appear in its studio (Look or Structure), so the user finds them
   there; if your shell caps how long a command may run, share with \`--no-wait\` and then
   \`npx paper-motion board --await <id> --wait 2\` until it prints the line (exit code 3 = not yet).

## Choosing well: the metadata

${site}/registry.json is the index; every item carries, beside id, type, title, summary, tags and the names of its
\`params\` (ranges and defaults are in ${site}/r/<id>.json, fetch it before writing a \`--set\`):
- \`when\`: 2–3 "use it when…" phrases.
- \`mood\`: calm, bold, playful, technical, editorial, warm, minimal, luxury, raw.
- Moves: \`energy\` 1 (still) to 5 (violent) and \`role\` (enter, exit, swap, emphasis, camera, text).
- Blocks and shots: \`needs\`, the content each one shows by kind (a \`figure\`, a \`change\`, a \`screen\`, a \`command\`, a
  \`line\`…). Choose them by what the user has to show, not by mood. Gather \`pieces/<piece>/inventory.json\` with
  \`npx paper-motion inventory <piece> --from <their site> --from README.md --from brand\` (it reads the page and
  screenshots it, a markdown file, a folder, or the brand's Facts and assets, and writes proposals, each with its
  source; \`npx paper-motion inventory kinds\` lists the kinds and their fields). Complete what a proposal still
  needs (a command's real output), add what gathering cannot see, and hand it over:
  \`npx paper-motion piece review <piece> inventory\`. The user keeps or removes each proposal in the studio; only
  what they kept is used. Then let \`npx paper-motion plan <piece> --seconds <n>\` propose
  the structures: it prints the structure board to share, and \`chain init <piece> --plan <letter>\` installs the
  chosen one with the content already in every part's CONFIG.
- Backgrounds and palettes: \`colors\` (dominant hex) and \`mode\` (light, dark); backgrounds also \`motion\` (still, gentle, lively).
  **Every background is a color family**: a board with a \`look.palette\` shows each background recolored into that
  palette (each of its colors keeps its tone and takes the nearest palette hue, so a dark one stays dark), and the
  reply line carries the resulting values. Without a board, \`pamo add <background> --palette <palette-id|brand>\`
  installs it that way (\`brand\` reads \`brand/tokens.json\`). So choose backgrounds by \`motion\`, \`mood\` and
  texture first; the color comes from the palette.
- Font pairs: \`voice\` (serif, sans, display, mono). Recipes, shots and blocks: \`duration\`, \`formats\` and \`beats\` (the structure as a
  timeline: name, from, to, what). A recipe board plays each structure as a sketch, so the user chooses a rhythm, not a
  name; you may add one option that is a **structure of your own** for this brief (\`structure\` instead of \`id\`,
  format below), which you then build from scratch. Give each of its beats the \`id\` of the block or shot that shows
  it: the board then plays those clips in order, so the user watches the structure instead of reading it. Give the recipe board \`choose: [1, 3]\`: picking several recipes in
  order means **one piece made of those blocks in that order**, each block's closing beat dropped except the last; the
  reply reads \`A+C · manifesto · three-things\`, and you build that sequence from scratch, using each recipe's scene as
  the reference for its block.

\`pamo search\` filters by them: \`pamo search --type background --mode dark --near "#0a0f1f,#eef1f8,#3d6bff"\`
sorts backgrounds by color fit (the mean distance from each of theirs to the nearest of yours; lower is closer; pass
ground, figure and accent so resources with white type are not punished); \`pamo search --type component --mood calm
--energy "<=3" --role swap\`.

Worked example, four backgrounds for a dark cobalt brand: filter \`type=background\`, \`mode=dark\`; rank by nearest
\`colors\` to the brand's ground, figure and accent; spread the \`motion\` as far as the catalog allows (a quiet one,
a lively one); prefer
\`mood\` overlapping the brand's words; tune one toward the accent (\`dither-slate:colorFront=#3d6bff\`); write a
one-line \`--note\` for each; share the link.

## The MCP server

The same registry as tools, with no install: add \`${site}/mcp\` (streamable HTTP, no auth) to your agent. Tools:
\`search\` (the filters above), \`resource\` (one record in full), \`recolor\` (a background's values in a palette),
\`board\` (creates a short link and waits for the user's choice, which it returns as \`choices\`) and \`board_choice\`. Installing is
still \`npx paper-motion add\` in the user's project, or your own file tools from the record.

## The board link format

\`${site}/b#<payload>\` where payload = base64url(deflate-raw(JSON)). The JSON:

\`\`\`json
{ "v": 1, "kind": "resource", "title": "Backgrounds for Kiln", "ask": "Which one feels like the product?",
  "reply": "bg-1", "choose": 1,
  "look": { "palette": { "id": "cobalt", "values": {} }, "font": { "id": "geist", "values": {} } },
  "options": [
    { "label": "A", "id": "mesh-graphite", "values": {}, "note": "quiet, graphite" },
    { "label": "B", "id": "neuro-slate", "values": {}, "note": "a technical web" },
    { "label": "C", "id": "dither-slate", "values": { "colorFront": "#3d6bff" }, "note": "pixels in your accent" },
    { "label": "D", "id": "grain-slate", "values": {} } ] }
\`\`\`

A recipe board may hold one option that is a structure of your own for this brief; if chosen, you build it from scratch:

\`\`\`json
{ "label": "D", "structure": { "title": "Three cuts", "duration": 18, "beats": [
    { "name": "Hook", "from": 0, "to": 2, "what": "one line over the field", "id": "word-swap" },
    { "name": "Proof", "from": 2, "to": 12, "what": "three shots of the product", "id": "browser-frame" },
    { "name": "Close", "from": 12, "to": 18, "what": "the wordmark and the action", "id": "svg-logo" } ] } }
\`\`\`

Short links: \`POST ${site}/api/boards\` with \`{ "board": … }\` returns \`{ id, url }\`; \`GET /api/boards/<id>/choice\`
answers 204 until the user chooses, then \`{ line, label }\`. Boards expire after 90 days; \`DELETE /api/boards/<id>\` forgets one.

Rules: 2–4 options, labels A–D, \`choose\` 1 (default), a count or \`[min, max]\`, one resource type per \`resource\` board; \`kind: "kit"\` makes each option
\`{ "label", "items": [{ "id", "values" }], "note" }\` (a whole kit); \`values\` hold only what differs from the
defaults; the JSON stays under 8 KB. \`pamo board --url\` builds and validates it for you.

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
  // publish only the preview files that were rendered: a background plays live and may have none
  for (const it of items) if (it.preview) { const have = Object.fromEntries(Object.entries(it.preview).filter(([, p]) => typeof p !== 'string' || fs.existsSync(path.join(out, p)))); it.preview = Object.values(have).some((p) => typeof p === 'string') ? have : undefined; }
  const index = {
    name: 'paper-motion', site, schema: `${site}/schema.json`, count: items.length, types: TYPES.filter((t) => items.some((i) => i.type === t)),
    items: items.map(({ id, type, title, summary, tags, version, preview, related, when, mood, energy, role, colors, mode, motion, voice, duration, formats, beats, needs, repeat, params }) => ({ id, type, title, summary, tags, version, url: `${site}/r/${id}.json`, ...Object.fromEntries(Object.entries({ when, mood, energy, role, colors, mode, motion, voice, duration, formats, beats, needs, repeat, preview, related, params: params?.filter((p) => !p.hidden).map((p) => p.name) }).filter(([, v]) => v !== undefined)) })),
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
// what a recipe reads beside the tokens and the shader set; written once, when the project has none
const MOTION_DEFAULT = { pace: 'medium', camera: 'still', text: 'rise', color: 'constant', ending: 'wordmark', timing: null, moves: [] };
const SOUND_DEFAULT = { palette: 'soft', lowpass: 2400, cues: { transition: { type: 'sweep', dur: 0.7, gain: 0.07 }, land: { type: 'thud', gain: 0.09 }, text: { type: 'tick', freq: 900, gain: 0.04 }, bed: null }, keys: { bank: null, style: 'creamy', gain: 0.12 }, music: null, loudness: -14 };

export async function add(ids, { cwd = process.cwd(), registry, force = false, name, brand, set = [], palette } = {}) {
  const reg = resolveRegistry(registry), done = new Map(), report = [];
  // --palette <id|brand>: backgrounds install recolored into that palette (the registry's, or brand/tokens.json)
  let pal = null;
  if (palette === 'brand') {
    const tokens = readJson(path.join(cwd, 'brand/tokens.json'), {});
    pal = { ...(tokens.colors ?? {}), ramp: tokens.ramp };
    if (!paletteColors(pal).length) throw new Error('--palette brand: brand/tokens.json has no colors yet (pamo add <palette> first)');
  } else if (palette) {
    const p = await getItem(palette, reg);
    if (p.type !== 'palette') throw new Error(`--palette takes a palette id (or "brand"), not "${palette}" (${p.type})`);
    pal = defaults(p);
  }
  const scaffold = (r) => {
    // a brand folder a recipe can run on: its name, a pace and sound cues (silent pieces are the usual surprise)
    const tokensFile = path.join(cwd, 'brand/tokens.json'), tokens = readJson(tokensFile, {});
    if (brand && (force || !tokens.brand)) { tokens.brand = brand; writeJson(tokensFile, tokens); r.wrote.push('brand/tokens.json brand'); }
    for (const [file, def] of [['brand/motion.json', MOTION_DEFAULT], ['brand/sound.json', SOUND_DEFAULT]]) {
      const f = path.join(cwd, file);
      if (!fs.existsSync(f)) { writeJson(f, def); r.wrote.push(`${file} (defaults)`); }
    }
    if (!tokens.brand && !brand) r.notes.push('the brand has no name yet: pamo add --brand "Name" (recipes show it as the wordmark)');
  };
  const lockFile = path.join(cwd, 'paper-motion.json'), lock = readJson(lockFile, { registry: reg.url ?? 'local', items: {} });
  async function one(id) {
    if (done.has(id)) return;
    done.set(id, true);
    let it = await getItem(id, reg);
    for (const dep of it.requires?.items ?? []) await one(dep);
    // --set key=value (or --set id:key=value with several ids): the same output the site's code tabs show
    const pairs = set.filter((x) => (x.includes(':') && x.indexOf(':') < x.indexOf('=') ? x.startsWith(`${id}:`) : ids.length === 1 && ids[0] === id)).map((x) => (x.startsWith(`${id}:`) ? x.slice(id.length + 1) : x));
    if (pairs.length || (pal && it.type === 'background')) {
      const parsed = parseSet(it, pairs), explicit = Object.fromEntries(pairs.map((x) => x.slice(0, x.indexOf('='))).map((k) => [k, parsed[k]]));
      it = { ...it, ...applyValues(it, { ...parsed, ...(pal ? recolor(it, pal) : {}), ...explicit }) };
    }
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
    if (kind === 'tokens' || kind === 'scene') scaffold(r);
    lock.items[it.id] = it.version;
    report.push(r);
  }
  for (const id of ids) await one(id);
  writeJson(lockFile, lock);
  return report;
}

export { colorDistance, colorFit } from './find.mjs';

/**
 * Finds resources: free words over id/title/summary/tags/when, plus filters: type, mode (light|dark), mood,
 * motion (still|gentle|lively), role, energy ("3", "2-4", "<=3"), near (hex colors: sorts by closeness).
 */
export async function search(query, opts = {}) {
  const { items } = await getIndex(resolveRegistry(opts.registry));
  return find(items, query, opts);
}
