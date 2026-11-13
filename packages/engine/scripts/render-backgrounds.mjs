#!/usr/bin/env node
// A still of every background in the registry, for the cards that show them without running a shader (the studio's
// How it looks, the library): apps/web/public/previews/<id>.jpg, 640×360. Renders only the missing ones unless --all.
//
//   node packages/engine/scripts/render-backgrounds.mjs [--all] [id …]
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { startServer } from '../lib/server.mjs';
import { launch } from '../lib/browser.mjs';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../../..');
const OUT = path.join(ROOT, 'apps/web/public/previews');
const args = process.argv.slice(2), all = args.includes('--all'), only = args.filter((a) => !a.startsWith('--'));

const items = fs.readdirSync(path.join(ROOT, 'registry/background')).map((id) => {
  try { return JSON.parse(fs.readFileSync(path.join(ROOT, 'registry/background', id, 'item.json'), 'utf8')); } catch { return null; }
}).filter((x) => x?.install?.entry?.shader && (!only.length || only.includes(x.id)) && (all || only.length || !fs.existsSync(path.join(OUT, `${x.id}.jpg`))));
if (!items.length) { console.log('every background has its still'); process.exit(0); }

const server = await startServer({ root: ROOT });
const browser = await launch();
const page = await browser.newPage({ viewport: { width: 640, height: 360 } });
let done = 0;
for (const it of items) {
  const e = it.install.entry;
  // a shader that filters an image is shown on the library's sample picture
  const entry = { ...e, props: { ...(e.props ?? {}) } };
  if (e.image) entry.props.image = `http://127.0.0.1:${server.port}/registry/_assets/materials/material-a.jpg`;
  try {
    await page.goto(`http://127.0.0.1:${server.port}/__pm/runtime/swatch.html?id=${it.id}#${encodeURIComponent(JSON.stringify(entry))}`);   // the query makes each a new page
    await page.waitForTimeout(1400);   // a moment in, so moving shaders are mid-motion rather than at frame 0
    await page.screenshot({ path: path.join(OUT, `${it.id}.jpg`), type: 'jpeg', quality: 82 });
    done++; process.stdout.write(`\r${done}/${items.length} ${it.id}                `);
  } catch (err) { console.log(`\n✗ ${it.id}: ${err.message}`); }
}
await browser.close(); await server.close();
console.log(`\n✓ ${done} stills in ${path.relative(process.cwd(), OUT)}`);
