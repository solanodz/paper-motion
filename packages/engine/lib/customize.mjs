// Customizing a resource: the code for a set of param values. One module for both sides, so what the site shows
// (its code tabs, "Copy for your agent") and what `pamo add <id> --set k=v` installs are always the same.
// Plain ESM with no Node imports: the site copies this file and runs it in the browser.

export const MOVE_TYPES = ['component', 'transition', 'text', 'camera'];

/**
 * A resource's params. A background whose entry paints a CSS `background` behind the shader gets it as a virtual
 * color param, so recoloring, `--set background=#…` and the reply line can carry it like any other value.
 */
export const paramsOf = (item) => {
  const ps = item.params ?? [];
  const bg = item.type === 'background' ? item.install?.entry?.background : undefined;
  return typeof bg === 'string' && !ps.some((p) => p.name === 'background') ? [...ps, { name: 'background', type: 'color', default: bg, description: 'the color behind the shader', group: 'main' }] : ps;
};

/** Param defaults by name. */
export const defaults = (item) => Object.fromEntries(paramsOf(item).map((p) => [p.name, p.default]));

const same = (a, b) => JSON.stringify(a) === JSON.stringify(b);
/** Params whose value differs from the default. */
export const changed = (item, values) => paramsOf(item).filter((p) => p.name in values && !same(values[p.name], p.default));

// ── color families: a background in a palette ──────────────────

const HEX = /^#([0-9a-f]{6})([0-9a-f]{2})?$/i;
const srgb = (h) => [1, 3, 5].map((i) => parseInt(h.slice(i, i + 2), 16) / 255);
const lin = (c) => (c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4);
const unlin = (c) => (c <= 0.0031308 ? c * 12.92 : 1.055 * c ** (1 / 2.4) - 0.055);
const lum = (h) => { const [r, g, b] = srgb(h).map(lin); return 0.2126 * r + 0.7152 * g + 0.0722 * b; };
const hex = (rgbLin) => `#${rgbLin.map((c) => Math.round(Math.min(1, Math.max(0, unlin(c))) * 255).toString(16).padStart(2, '0')).join('')}`;
/** `color` moved toward black or white until its luminance is `y`: the hue stays, the tone changes. */
function atLuminance(color, y) {
  const c = srgb(color).map(lin), yc = lum(color);
  if (Math.abs(yc - y) < 1e-4) return color.slice(0, 7);
  if (y > yc) { const t = yc >= 1 ? 0 : (y - yc) / (1 - yc); return hex(c.map((v) => v + t * (1 - v))); }
  const t = yc <= 0 ? 0 : 1 - y / yc;
  return hex(c.map((v) => v * (1 - t)));
}

/** The hexes of a palette (the values of a palette resource, or `brand/tokens.json`'s colors with hexes). */
export function paletteColors(pal) {
  const out = [];
  for (const k of ['ground', 'figure', 'muted', 'surface', 'accent']) { const v = pal?.[k]; const h = typeof v === 'string' ? v : v?.hex; if (HEX.test(h ?? '')) out.push(h); }
  for (const h of pal?.ramp ?? []) if (HEX.test(h)) out.push(h);
  return [...new Set(out.map((h) => h.slice(0, 7).toLowerCase()))];
}

/**
 * A background's color values in a palette: every color the resource uses keeps its own tone (a dark background
 * stays dark, a bright highlight stays bright, transparency stays) and takes the hue of the palette color nearest in
 * tone, so each background becomes a family: the same material in any brand's colors. Returns the values to apply.
 */
export function recolor(item, pal) {
  const ladder = paletteColors(pal).map((h) => ({ h, y: lum(h) }));
  if (item.type !== 'background' || !ladder.length) return {};
  const one = (v) => {
    const m = typeof v === 'string' && v.match(HEX);
    if (!m) return v;
    if (m[2] && parseInt(m[2], 16) === 0) return v; // fully transparent: nothing to color
    const y = lum(v);
    const near = ladder.reduce((a, b) => (Math.abs(b.y - y) < Math.abs(a.y - y) ? b : a));
    return atLuminance(near.h, y) + (m[2] ? m[2] : '');
  };
  const out = {};
  for (const p of paramsOf(item)) {
    if (p.type === 'color') out[p.name] = one(p.default);
    else if (p.type === 'colors' && Array.isArray(p.default)) out[p.name] = p.default.map(one);
  }
  return out;
}

/** A JS literal: strings in single quotes, `ease.*` left as code, arrays and objects inline. */
export function literal(v) {
  if (typeof v === 'string') return /^ease\.\w+$/.test(v) ? v : `'${v.replace(/\\/g, '\\\\').replace(/'/g, "\\'")}'`;
  if (Array.isArray(v)) return `[${v.map(literal).join(', ')}]`;
  if (v && typeof v === 'object') return `{ ${Object.entries(v).map(([k, x]) => `${k}: ${literal(x)}`).join(', ')} }`;
  return String(v);
}

/** `--set key=value` arguments, shell-safe. */
export function setArgs(item, values) {
  return changed(item, values).map((p) => {
    const v = values[p.name], raw = typeof v === 'string' ? v : JSON.stringify(v);
    const arg = `${p.name}=${raw}`;
    return /^[\w.=#,:/@+-]+$/.test(arg) ? `--set ${arg}` : `--set '${arg.replace(/'/g, "'\\''")}'`;
  });
}

/** Parses `key=value` pairs (from the CLI) into values, JSON where it parses, strings otherwise. */
export function parseSet(item, pairs) {
  const out = defaults(item);
  for (const pair of pairs) {
    const i = pair.indexOf('=');
    if (i < 0) throw new Error(`--set needs key=value, got "${pair}"`);
    const k = pair.slice(0, i), raw = pair.slice(i + 1);
    if (!paramsOf(item).some((p) => p.name === k)) throw new Error(`"${item.id}" has no param "${k}" (params: ${paramsOf(item).map((p) => p.name).join(', ')})`);
    try { out[k] = JSON.parse(raw); } catch { out[k] = raw; }
  }
  return out;
}

// ── per type ────────────────────────────────────────────────────

const gf = (family, weights) => `https://fonts.googleapis.com/css2?family=${family.replace(/ /g, '+')}${weights?.length ? `:wght@${[...new Set(weights)].sort((a, b) => a - b).join(';')}` : ''}&display=swap`;

/** A move file with the values written in as its defaults (only inside the exported function's options). */
function moveFile(item, content, values) {
  const name = item.export, start = content.indexOf(`export function ${name}(`);
  if (start < 0) return content;
  const end = content.indexOf(') {', start);
  let sig = content.slice(start, end);
  for (const p of changed(item, values)) sig = sig.replace(new RegExp(`(\\b${p.name}\\s*=\\s*)(\\[[^\\]]*\\]|'[^']*'|"[^"]*"|[^,}]+?)(\\s*)(?=[,}])`), `$1${literal(values[p.name])}$3`);
  return content.slice(0, start) + sig + content.slice(end);
}

function backgroundEntry(item, values) {
  const e = item.install.entry ?? {};
  const props = { ...e.props, ...Object.fromEntries((item.params ?? []).map((p) => [p.name, values[p.name] ?? p.default])) };
  const bg = typeof e.background === 'string' && typeof values.background === 'string' ? values.background : e.background;
  return { ...e, props, ...(bg !== undefined ? { background: bg } : {}) };
}

function paletteTokens(item, values) {
  const e = item.install.entry ?? {};
  const colors = Object.fromEntries(Object.entries(e.colors ?? {}).map(([role, c]) => [role, { ...c, hex: values[role] ?? c.hex }]));
  return { ...e, colors, ramp: values.ramp ?? e.ramp };
}

function fontTokens(item, values) {
  const e = item.install.entry ?? {};
  const f = e.fonts ?? {}, w = values.displayWeight ?? e.type?.display?.weight ?? 400, tr = `${values.tracking ?? parseFloat(e.type?.display?.tracking ?? '0')}em`;
  // a pair's own css (self-hosted families such as Geist Serif) stays while its family is unchanged; a new family loads from Google Fonts
  const pick = (role, weights) => { const family = values[role] ?? f[role]?.family; const own = f[role]?.css && family === f[role]?.family && !/fonts\.googleapis\.com/.test(f[role].css); return { ...f[role], family, weights, css: own ? f[role].css : gf(family, weights) }; };
  const fonts = { display: pick('display', [w]), text: pick('text', f.text?.weights ?? [400, 500]), mono: pick('mono', f.mono?.weights ?? [400]) };
  const type = { ...e.type, display: { ...e.type?.display, weight: w, tracking: tr }, title: { ...e.type?.title, weight: w, tracking: tr } };
  return { fonts, type };
}

/** A recipe's CONFIG object from flat values (proof1Title… → proof[0].title, "1920x1080" → [1920, 1080]). */
function recipeConfig(values) {
  const cfg = {}, groups = {};
  for (const [k, v] of Object.entries(values)) {
    const m = k.match(/^(proof|step|shot|thing)(\d)(Label|Title|Body|Image|Caption)$/);
    if (m) { const g = { proof: 'proof', step: 'steps', shot: 'shots', thing: 'things' }[m[1]]; (groups[g] ??= [])[m[2] - 1] ??= {}; groups[g][m[2] - 1][m[3].toLowerCase()] = v; continue; }
    const ba = k.match(/^(before|after)(Tag|Line|Image)$/);
    if (ba) { (cfg[ba[1]] ??= {})[ba[2].toLowerCase()] = v; continue; }
    const st = k.match(/^statement(\d)$/);
    if (st) { (cfg.statements ??= [])[st[1] - 1] = v; continue; }
    if (k === 'format') cfg.format = String(v).split('x').map(Number);
    else cfg[k] = v === '' ? null : v;
  }
  return { ...cfg, ...groups };
}

function recipeScene(content, values) {
  const cfg = recipeConfig(values);
  const start = content.indexOf('const CONFIG = {');
  if (start < 0) return content;
  const end = content.indexOf('\n};', start) + 3;
  // the original entries, by key (an entry runs until the next top-level key), so settings that are not params
  // (backgroundOpacity, turnWord, a card's label…) survive a --set
  const original = content.slice(start + 'const CONFIG = {\n'.length, end - 3).split(/\n(?=  \w+: )/);
  const kept = new Map(original.map((e) => [e.match(/^  (\w+):/)?.[1], e]).filter(([k]) => k));
  const render = (k, v) => (Array.isArray(v) && v.length && typeof v[0] === 'object'
    ? `  ${k}: [\n${v.map((o) => `    ${literal(o)},`).join('\n')}\n  ],`
    : `  ${k}: ${v === null ? 'null' : literal(v)},`);
  const lines = [];
  for (const [k, e] of kept) lines.push(k in cfg ? render(k, cfg[k]) : e);
  for (const [k, v] of Object.entries(cfg)) if (!kept.has(k)) lines.push(render(k, v));
  return `${content.slice(0, start)}const CONFIG = {\n${lines.join('\n')}\n};${content.slice(end)}`;
}

// ── the public API ──────────────────────────────────────────────

/**
 * Applies values to a resolved resource (files with content): returns the files and install entry that
 * `pamo add --set` writes, the same ones the site's File / entry tabs show.
 */
export function apply(item, values) {
  const v = { ...defaults(item), ...values };
  const files = (item.files ?? []).map((f) => {
    if (f.content === undefined) return f;
    if (MOVE_TYPES.includes(item.type)) return { ...f, content: moveFile(item, f.content, v) };
    if ((item.type === 'recipe' || item.type === 'shot') && /scene\.html$/.test(f.path)) return { ...f, content: recipeScene(f.content, v) };
    return f;
  });
  let entry = item.install?.entry;
  if (item.type === 'background') entry = backgroundEntry(item, v);
  if (item.type === 'palette') entry = paletteTokens(item, v);
  if (item.type === 'font-pair') entry = fontTokens(item, v);
  return { files, install: { ...item.install, ...(entry ? { entry } : {}) } };
}

/** The code tabs, the change count and the agent prompt for a resource at these values. */
export function code(item, values, { showAll = false, site = 'https://paper-motion.vercel.app' } = {}) {
  const v = { ...defaults(item), ...values }, diff = changed(item, v), out = apply(item, v);
  const args = setArgs(item, v);
  const agent = `Use the paper-motion resource "${item.id}" (${site}/r/${item.id}.json) in my video. Install it with: npx paper-motion add ${item.id}${args.length ? ` ${args.join(' ')}` : ''}`;
  let tabs = [];
  if (MOVE_TYPES.includes(item.type)) {
    const listed = showAll ? (item.params ?? []).filter((p) => !p.hidden) : diff;
    const head = ((item.signature ?? '').match(/\(([^{)]*)/)?.[1] ?? 'a, b, p').replace(/,\s*$/, '').trim();
    const file = out.files.find((f) => f.content !== undefined);
    const opts = listed.length ? `, { ${listed.map((p) => `${p.name}: ${literal(v[p.name])}`).join(', ')} }` : '';
    tabs = [
      { key: 'usage', label: 'Usage', lang: 'js', code: `import { ${item.export} } from './${file?.path ?? `moves/${item.id}.js`}';\n\n// in s.update(t)\n${item.export}(${head}${opts});` },
      { key: 'file', label: 'File', lang: 'js', code: file?.content ?? '' },
    ];
  } else if (item.type === 'background') {
    const e = out.install.entry, shader = e.shader;
    tabs = [
      { key: 'entry', label: 'set.json entry', lang: 'json', code: JSON.stringify({ id: item.id, ...e }, null, 2) },
      { key: 'usage', label: 'Usage', lang: 'js', code: `import { loadBrand } from 'paper-motion/brand';\n\nconst B = await loadBrand();\nB.shader(s, '#bg', '${item.id}');` },
      { key: 'react', label: 'Paper React', lang: 'jsx', code: `import { ${shader} } from '@paper-design/shaders-react';\n\n<${shader}\n${Object.entries(e.props).map(([k, x]) => `  ${k}={${typeof x === 'string' ? JSON.stringify(x) : JSON.stringify(x)}}`).join('\n')}\n  style={{ width: '100%', height: '100%' }}\n/>` },
    ];
  } else if (item.type === 'palette') {
    const e = out.install.entry;
    tabs = [
      { key: 'tokens', label: 'tokens.json', lang: 'json', code: JSON.stringify({ colors: e.colors, ramp: e.ramp, mode: e.mode }, null, 2) },
      { key: 'css', label: 'CSS variables', lang: 'css', code: `:root {\n${Object.entries(e.colors).map(([r, c]) => `  --${r}: ${c.hex};`).join('\n')}\n${(e.ramp ?? []).map((h, i) => `  --ramp-${i + 1}: ${h};`).join('\n')}\n}` },
    ];
  } else if (item.type === 'font-pair') {
    const e = out.install.entry, f = e.fonts;
    const cat = (fam) => (/mono|code/i.test(fam) ? 'monospace' : /serif|playfair|fraunces|garamond|newsreader|instrument/i.test(fam) && !/sans/i.test(fam) ? 'serif' : 'sans-serif');
    tabs = [
      { key: 'tokens', label: 'tokens.json', lang: 'json', code: JSON.stringify(e, null, 2) },
      { key: 'css', label: 'CSS variables', lang: 'css', code: `${Object.values(f).map((x) => `@import url('${x.css}');`).filter((x, i, a) => a.indexOf(x) === i).join('\n')}\n\n:root {\n${Object.entries(f).map(([r, x]) => `  --font-${r}: '${x.family}', ${cat(x.family)};`).join('\n')}\n  --display-weight: ${e.type.display.weight};\n  --display-tracking: ${e.type.display.tracking};\n}` },
    ];
  } else if (item.type === 'recipe' || item.type === 'shot') {
    const scene = out.files.find((f) => /scene\.html$/.test(f.path));
    tabs = [{ key: 'scene', label: 'scene.html', lang: 'html', code: scene?.content ?? '' }];
  }
  return { tabs, changed: diff.length, agent, setArgs: args };
}
