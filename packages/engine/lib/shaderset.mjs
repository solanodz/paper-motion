// A brand's shader set: entries in brand/shader-set/set.json, one format for all.
// build → one scene per entry (shots/) and review boards (boards/), from the template's shot.js.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ENGINE = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

export function readSet(dir) {
  const file = path.join(dir, 'set.json');
  if (!fs.existsSync(file)) throw new Error(`No ${file}`);
  const raw = JSON.parse(fs.readFileSync(file, 'utf8'));
  // older sets were a plain list of { id, video }
  const set = Array.isArray(raw) ? { format: { width: 1920, height: 1080, duration: 6, fps: 30 }, entries: raw } : raw;
  set.format = { width: 1920, height: 1080, duration: 6, fps: 30, ...(set.format ?? {}) };
  return set;
}

export function writeSet(dir, set) {
  fs.writeFileSync(path.join(dir, 'set.json'), JSON.stringify(set, null, 1) + '\n');
}

const page = (title, call) => `<!doctype html>
<html>
<head>
<meta charset="utf-8">
<title>${title}</title>
<style>#stage { overflow: hidden; }</style>
</head>
<body>
<main id="stage"></main>
<script type="module">
import { mount } from '../shot.js';
${call}
</script>
</body>
</html>
`;

export const shotName = (e, i) => `${String(i + 1).padStart(2, '0')}-${e.id}`;

/** Writes shot.js, shots/<nn>-<id>.html and boards/board-<k>.html (12 per board). Entries without a shader or file are skipped. */
export function buildSet(dir) {
  const set = readSet(dir);
  fs.copyFileSync(path.join(ENGINE, 'templates', 'shader-set', 'shot.js'), path.join(dir, 'shot.js'));
  for (const sub of ['shots', 'boards']) { fs.rmSync(path.join(dir, sub), { recursive: true, force: true }); fs.mkdirSync(path.join(dir, sub), { recursive: true }); }
  // shaders that only filter an image need one; say which entry instead of failing inside a render
  const NEEDS_IMAGE = ['ImageDithering', 'HalftoneDots', 'HalftoneCmyk', 'FlutedGlass', 'LensDistortion', 'LiquidMetal', 'GemSmoke', 'Heatmap'];
  const skipped = [];
  const live = set.entries.map((e, i) => ({ e, i })).filter(({ e, i }) => {
    if (!e.shader && !e.file) { skipped.push(`${i + 1} · ${e.id}: no shader or file`); return false; }
    if (NEEDS_IMAGE.includes(e.shader) && !e.image) { skipped.push(`${i + 1} · ${e.id}: ${e.shader} filters an image; give it "image" (wordmark, wordmark-dark or a path in brand/)`); return false; }
    return true;
  });
  const F = JSON.stringify(set.format);
  for (const { e, i } of live) fs.writeFileSync(path.join(dir, 'shots', `${shotName(e, i)}.html`), page(`shader set · ${e.id}`, `await mount([${JSON.stringify(e)}], ${F});`));
  const boards = [];
  for (let k = 0; k * 12 < live.length; k++) {
    const chunk = live.slice(k * 12, k * 12 + 12);
    const f = path.join(dir, 'boards', `board-${k + 1}.html`);
    fs.writeFileSync(f, page(`shader set · board ${k + 1}`, `await mount(${JSON.stringify(chunk.map((c) => c.e))}, ${F}, { board: true, numbers: ${JSON.stringify(chunk.map((c) => c.i + 1))} });`));
    boards.push(f);
  }
  return { set, skipped, shots: live.map(({ e, i }) => ({ entry: e, index: i, file: path.join(dir, 'shots', `${shotName(e, i)}.html`) })), boards };
}
