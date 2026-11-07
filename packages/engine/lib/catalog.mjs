// Builds a catalog of every Paper shader: description, params with defaults, presets.
import { register } from 'node:module';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

register('./react-hooks.mjs', import.meta.url);
const ENGINE = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const SIZING = ['fit', 'scale', 'rotation', 'originX', 'originY', 'offsetX', 'offsetY', 'worldWidth', 'worldHeight'];

const kebab = (s) => s.replace(/([a-z0-9])([A-Z])/g, '$1-$2').toLowerCase();

function describe(name) {
  const f = path.join(ENGINE, 'node_modules/@paper-design/shaders/dist/shaders', `${kebab(name)}.d.ts`);
  if (!fs.existsSync(f)) return '';
  const src = fs.readFileSync(f, 'utf8');
  const m = src.match(/\/\*\*([\s\S]*?)\*\//);
  if (!m) return '';
  const lines = m[1].split('\n').map((l) => l.replace(/^\s*\*\s?/, '').trim());
  const out = [];
  for (const l of lines) { if (/uniforms:|^Fragment shader|^Vertex shader/i.test(l)) break; if (l) out.push(l); }
  return out.join(' ');
}

function enums(name, mod) {
  // Expose string options for enum-like params (shape, type, ...)
  const out = {};
  for (const [k, v] of Object.entries(mod)) {
    if (k.startsWith(name.replace(/^Static/, '')) && /(Shapes|Types|Patterns|Grids|AspectRatios)$/.test(k) && v && typeof v === 'object') out[k] = Object.keys(v);
  }
  return out;
}

export async function buildCatalog() {
  const R = await import('@paper-design/shaders-react');
  const V = await import('@paper-design/shaders');
  const names = Object.keys(R).filter((k) => /^[A-Z]/.test(k) && k !== 'ShaderMount' && typeof R[k] === 'function');
  return names.map((name) => {
    const presets = R[`${name[0].toLowerCase()}${name.slice(1)}Presets`] ?? [];
    const def = presets[0]?.params ?? {};
    const own = Object.fromEntries(Object.entries(def).filter(([k]) => !SIZING.includes(k)));
    const GENERIC = { fit: ['none', 'contain'], scale: [1], rotation: [0], offsetX: [0], offsetY: [0], originX: [0.5], originY: [0.5], worldWidth: [0], worldHeight: [0] };
    const sizing = Object.fromEntries(Object.entries(def).filter(([k, v]) => SIZING.includes(k) && !GENERIC[k].includes(v)));
    const isImage = 'image' in own || /\bimage\s*=/.test(R[name].toString());
    return {
      name,
      description: describe(name),
      animated: (def.speed ?? 0) !== 0,
      usesImage: isImage,
      params: own,
      sizing, // non-obvious sizing defaults, e.g. GodRays sits high (offsetY -0.55)
      options: enums(name, V),
      presets: presets.map((p) => ({ name: p.name, params: Object.fromEntries(Object.entries(p.params).filter(([k]) => !SIZING.includes(k) || p.params[k] !== def[k])) })),
    };
  });
}

export function catalogMarkdown(cat, version) {
  const lines = [`# Paper Shaders catalog`, '', `Generated from @paper-design/shaders-react ${version}. Regenerate with \`paper-motion shaders --md\`.`, '',
    'Every shader also accepts the sizing params: `fit` (none|contain|cover), `scale`, `rotation` (deg), `originX`, `originY`, `offsetX`, `offsetY`, `worldWidth`, `worldHeight`.',
    'Motion params: `speed` (multiplier on scene time; 0 = still) and `frame` (start offset, ms).', '',
    '| Shader | Animated | Image input | What it is |', '|---|---|---|---|',
    ...cat.map((s) => `| [${s.name}](#${s.name.toLowerCase()}) | ${s.animated ? 'yes' : '—'} | ${s.usesImage ? 'yes' : '—'} | ${s.description.split('. ')[0].replace(/\|/g, '/')} |`), ''];
  for (const s of cat) {
    lines.push(`## ${s.name}`, '', s.description, '');
    lines.push('Defaults:', '```js', JSON.stringify(s.params, null, 0).replace(/,"/g, ', "'), '```');
    if (Object.keys(s.sizing).length) lines.push(`Sizing defaults that differ from neutral: \`${JSON.stringify(s.sizing)}\` — pass them explicitly (e.g. \`offsetY: 0\`) to re-center.`);
    for (const [k, v] of Object.entries(s.options)) lines.push(`- \`${k}\`: ${v.map((x) => `\`${x}\``).join(', ')}`);
    if (s.presets.length > 1) {
      lines.push('', 'Presets:');
      for (const p of s.presets.slice(1)) lines.push(`- **${p.name}**: \`${JSON.stringify(p.params).replace(/,"/g, ', "')}\``);
    }
    lines.push('');
  }
  return lines.join('\n');
}
