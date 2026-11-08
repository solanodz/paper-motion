// Where an engine dependency lives on disk. Inside the repo it is packages/engine/node_modules; installed from npm,
// npm hoists it next to the engine (…/node_modules/<dep>, or npx's cache). Walk up like Node's resolver does.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

export const ENGINE = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

const found = new Map();
/** Absolute folder of an installed package (e.g. '@paper-design/shaders'), or null. */
export function moduleDir(name) {
  if (found.has(name)) return found.get(name);
  let dir = ENGINE, hit = null;
  for (;;) {
    const d = path.join(dir, 'node_modules', name);
    if (fs.existsSync(path.join(d, 'package.json'))) { hit = d; break; }
    const up = path.dirname(dir);
    if (up === dir) break;
    dir = up;
  }
  found.set(name, hit);
  return hit;
}
