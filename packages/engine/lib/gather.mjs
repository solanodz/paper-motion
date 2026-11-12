// Gathering an inventory: reads what the user already has (their site, a README, the brand's Facts, a folder of
// assets) and proposes items for pieces/<piece>/inventory.json. Everything it finds is a proposal: it carries its
// source and waits for the user, who keeps or removes each one in the studio. Nothing here guesses a claim; it only
// copies what is written or shown, and says what a proposal still lacks (a command's real output, for one).

import fs from 'node:fs';
import path from 'node:path';

const clean = (s) => String(s ?? '').replace(/\s+/g, ' ').trim();
const slug = (s, n = 4) => clean(s).toLowerCase().replace(/[^a-z0-9 ]+/g, ' ').trim().split(/\s+/).filter(Boolean).slice(0, n).join('-') || 'item';
const CLI = /^(npx|npm|pnpm|yarn|bun|bunx|pip|pipx|uv|brew|curl|wget|git|docker|cargo|go|deno|gem|apt|composer|make)\b/;
const NUM = /^([~≈<>+]?\$?)(\d[\d.,]*)\s?(%|[kKmMbB]|x|×|ms|s|min|h|hrs?|\+)?(\+?)$/;
const IMG = /\.(jpe?g|png|webp)$/i, VID = /\.(mp4|mov|webm)$/i, AUD = /\.(wav|mp3|m4a|aac|flac)$/i;

/** A number as written ("1,284", "2 min", "87%") into a figure or a share. */
function figureFrom(raw, label, source) {
  const m = clean(raw).match(NUM); if (!m || !clean(label)) return null;
  const n = Number(m[2].replace(/,/g, '')); if (!Number.isFinite(n)) return null;
  if (m[3] === '%' && n >= 0 && n <= 100) return { kind: 'share', value: n, label: clean(label), source };
  const unit = `${m[3] ? (/^[a-z]/i.test(m[3]) && m[3].length > 1 ? ` ${m[3]}` : m[3]) : ''}${m[4] ?? ''}`;
  return { kind: 'figure', value: n, ...(unit ? { unit } : {}), label: clean(label), source };
}
const commandFrom = (line, source) => ({ kind: 'command', command: clean(line.replace(/^\$\s*/, '')), source });
// a command worth showing runs the product; cloning a repository or moving between folders shows nothing of it
const showable = (line) => { const c = line.replace(/^\$\s*/, ''); return CLI.test(c) && !/^(git\s+(clone|pull|checkout|init)|make\s*$|apt\b)/.test(c) && c.length <= 110; };
// a sentence a screen can hold; longer ones are for reading, not for showing
const LINE_MAX = 110;

// ── a web page ──────────────────────────────────────────────────────────────────────────────────────────────────

// runs in the page: what is written on it, as plain data
function readPage() {
  const vis = (el) => { const r = el.getBoundingClientRect(), s = getComputedStyle(el); return r.width > 1 && r.height > 1 && s.visibility !== 'hidden' && s.display !== 'none' && Number(s.opacity) > 0.05; };
  const txt = (el) => (el.innerText ?? '').replace(/\s+/g, ' ').trim();
  const all = (q) => [...document.querySelectorAll(q)].filter(vis);
  const NUM = /^([~≈<>+]?\$?)(\d[\d.,]*)\s?(%|[kKmMbB]|x|×|ms|s|min|h|hrs?|\+)?(\+?)$/;
  // figures: a short number set large, and the words next to it
  const stats = [];
  for (const el of all('body *')) {
    if (el.children.length || stats.length >= 12) continue;
    const t = txt(el); if (!t || t.length > 12 || !NUM.test(t) || parseFloat(getComputedStyle(el).fontSize) < 20) continue;
    let label = '', up = el;
    // the label: the words around the number, without what can be clicked (a button's text is not what the figure counts)
    for (let i = 0; i < 3 && !label && up.parentElement; i++) {
      up = up.parentElement;
      let rest = txt(up);   // innerText: only what is really drawn (a hidden twin of the number is not)
      for (const b of up.querySelectorAll('button, a, [role="button"]')) rest = rest.replace(txt(b), '');
      rest = rest.replace(t, '').replace(/\s+/g, ' ').trim();
      if (rest.length >= 3 && rest.length <= 70 && /[a-z]{3}/i.test(rest)) label = rest;
    }
    // a lone word after a number is a step or a tab ("1 Brief"), not a figure
    if (label && label.split(' ').length >= 2) stats.push([t, label]);
  }
  const pres = all('pre').map((p) => p.innerText.trim()).filter((t) => t && t.length <= 900).slice(0, 8);
  const inline = all('code').filter((c) => !c.closest('pre')).map(txt).filter((t) => t.length >= 6 && t.length <= 140);
  const lists = all('ul,ol').map((l) => [...l.children].filter((c) => c.tagName === 'LI').map(txt)).filter((it) => it.length >= 3 && it.length <= 6 && it.every((x) => x.length >= 2 && x.length <= 28));
  const h1 = all('h1').map(txt).find(Boolean) ?? '';
  const lead = all('main p, header p, section p, p').map(txt).find((t) => t.length >= 40 && t.length <= 240) ?? '';
  const icon = document.querySelector('link[rel~="icon"][type="image/svg+xml"], link[rel~="icon"][href$=".svg"]')?.href ?? null;
  return {
    title: document.title, site: document.querySelector('meta[property="og:site_name"]')?.content ?? '', desc: document.querySelector('meta[name="description"]')?.content ?? '',
    h1, lead, h2: all('h2').map(txt).filter((t) => t.length >= 10 && t.length <= 90).slice(0, 5), stats, pres, inline, lists: lists.slice(0, 3), icon,
    height: Math.max(document.documentElement.scrollHeight, document.body.scrollHeight),
  };
}

/** Proposals from a live page: what it says, its figures, its commands, and screenshots of it on a desktop and a phone. */
export async function fromUrl(url, { cwd = process.cwd(), assets = 'brand/assets' } = {}) {
  const { launch } = await import('./browser.mjs');
  const u = new URL(url), where = `${u.host}${u.pathname === '/' ? '' : u.pathname}`, name = slug(where.replace(/[./]/g, ' '), 5);
  const out = [], dir = path.join(cwd, assets);
  fs.mkdirSync(dir, { recursive: true });
  const browser = await launch();
  try {
    const shot = async (file, viewport, mobile, maxH) => {
      const ctx = await browser.newContext({ viewport, deviceScaleFactor: mobile ? 2 : 1, isMobile: mobile, hasTouch: mobile });
      const page = await ctx.newPage();
      await page.goto(url, { waitUntil: 'load', timeout: 45000 });
      await page.waitForLoadState('networkidle', { timeout: 8000 }).catch(() => {});
      await page.waitForTimeout(900);
      // numbers that count up on load are read once they stop moving: a figure caught mid-count would be a false claim
      let data = await page.evaluate(readPage);
      for (let i = 0; i < 10; i++) { await page.waitForTimeout(700); const again = await page.evaluate(readPage); const same = JSON.stringify(again.stats) === JSON.stringify(data.stats) && again.h1 === data.h1; data = again; if (same) break; }
      await page.screenshot({ path: path.join(dir, file), type: 'jpeg', quality: 86, clip: { x: 0, y: 0, width: viewport.width, height: Math.min(data.height, maxH) } });
      await ctx.close();
      return data;
    };
    const d = await shot(`${name}-desktop.jpg`, { width: 1440, height: 900 }, false, 3200);
    await shot(`${name}-phone.jpg`, { width: 390, height: 844 }, true, 2200);
    const src = (part) => `${where}, ${part}`, siteName = clean(d.site) || clean(d.title).split(/\s[·|—–-]\s/)[0];
    if (d.h1 && d.h1.length <= LINE_MAX) out.push({ kind: 'line', text: clean(d.h1), source: src('the headline') });
    const about = [[clean(d.desc), 'its description'], [d.lead, 'the first paragraph']].find(([t]) => t && t !== clean(d.h1) && t.length <= LINE_MAX);
    if (about) out.push({ kind: 'line', text: about[0], source: src(about[1]) });
    for (const h of d.h2.filter((x) => x !== d.h1).slice(0, 2)) out.push({ kind: 'line', text: h, source: src('a heading') });
    for (const [n, label] of d.stats.slice(0, 6)) { const f = figureFrom(n, label, src('a number on the page')); if (f) out.push(f); }
    for (const pre of d.pres) {
      const lines = pre.split('\n').map((l) => l.trim()).filter(Boolean), cmd = lines.find(showable);
      if (cmd && lines.length <= 4) out.push(commandFrom(cmd, src('a command on the page')));
    }
    for (const c of d.inline.filter(showable).slice(0, 3)) out.push(commandFrom(c, src('a command on the page')));
    for (const l of d.lists) out.push({ kind: 'words', items: l, source: src('a list') });
    out.push({ kind: 'screen', image: `${assets}/${name}-desktop.jpg`, url: where, title: siteName, ...(d.h1 ? { caption: clean(d.h1) } : {}), device: 'desktop', source: `a screenshot of ${where}` });
    out.push({ kind: 'screen', image: `${assets}/${name}-phone.jpg`, url: where, title: siteName, device: 'phone', source: `a screenshot of ${where} on a phone` });
    if (d.icon) { try { const svg = await (await fetch(d.icon, { signal: AbortSignal.timeout(8000) })).text(); if (/<svg[\s>]/.test(svg) && svg.length < 20000) out.push({ kind: 'logo', svg: svg.trim(), name: siteName, source: src('its icon') }); } catch { /* no icon to read */ } }
  } finally { await browser.close(); }
  return out;
}

// ── a markdown file (a README, a doc) ───────────────────────────────────────────────────────────────────────────

const EXT = { js: 'js', javascript: 'js', ts: 'ts', typescript: 'ts', tsx: 'tsx', jsx: 'jsx', py: 'py', python: 'py', rb: 'rb', go: 'go', rust: 'rs', rs: 'rs', json: 'json', yaml: 'yml', yml: 'yml', html: 'html', css: 'css' };
const bare = (s) => clean(s.replace(/!\[[^\]]*\]\([^)]*\)/g, '').replace(/\[([^\]]+)\]\([^)]*\)/g, '$1').replace(/<[^>]+>/g, '').replace(/[*_`]/g, ''));

export function fromMarkdown(file, { cwd = process.cwd() } = {}) {
  const rel = path.relative(cwd, path.resolve(cwd, file)), md = fs.readFileSync(path.resolve(cwd, file), 'utf8'), out = [], src = (p) => `${rel}, ${p}`;
  const lines = md.split('\n');
  let lead = false, cmds = 0, codes = 0, figs = 0;
  for (let i = 0; i < lines.length; i++) {
    const l = lines[i];
    const fence = l.match(/^```+\s*([\w+-]*)/);
    if (fence) {
      const body = []; i++;
      while (i < lines.length && !/^```+\s*$/.test(lines[i])) body.push(lines[i++]);
      const lang = fence[1].toLowerCase(), real = body.map((x) => x.trim()).filter((x) => x && !x.startsWith('#'));
      const shell = ['sh', 'bash', 'shell', 'zsh', 'console', 'terminal'].includes(lang) || real.some((x) => x.startsWith('$ ')) || (lang === '' && real.every((x) => CLI.test(x)));
      if (shell) { for (const c of real.filter(showable).slice(0, 2)) if (cmds++ < 4) out.push(commandFrom(c, src('a command'))); }
      else if (EXT[lang] && real.length >= 3 && real.length <= 18 && codes++ < 2) out.push({ kind: 'code', file: `example${EXT[lang] ? `.${EXT[lang]}` : ''}`, code: body.join('\n').trim(), source: src('a code example') });
      continue;
    }
    if (/^\s*\|.+\|\s*$/.test(l) && /^\s*\|[\s:|-]+\|\s*$/.test(lines[i + 1] ?? '')) {
      const rows = []; i += 2;
      const cells = [];
      while (i < lines.length && /^\s*\|.+\|\s*$/.test(lines[i])) { cells.push(lines[i].split('|').slice(1, -1).map(bare)); i++; }
      // a first column that only counts the rows (1, 2, 3…) is not a name: the pair starts after it
      const skip = cells.length && cells.every((c) => /^\d+\.?$/.test(c[0] ?? '')) ? 1 : 0;
      for (const c of cells) if (c[skip] && c[skip + 1]) rows.push([c[skip], c[skip + 1]]);
      i--; if (rows.length >= 2 && rows.length <= 8 && rows.every((r) => r[0].length <= 32 && r[1].length <= 32)) out.push({ kind: 'table', rows, source: src('a table') });
      continue;
    }
    if (/^\s*[-*+]\s+/.test(l)) {
      const items = [];
      while (i < lines.length && /^\s*[-*+]\s+/.test(lines[i])) items.push(bare(lines[i++].replace(/^\s*[-*+]\s+/, '')));
      i--;
      if (items.length >= 3 && items.length <= 6 && items.every((x) => x.length >= 2 && x.length <= 28)) out.push({ kind: 'words', items, source: src('a list') });
      for (const it of items) { const m = it.match(/^([~≈<>+]?\$?\d[\d.,]*\s?(?:%|[kKmMbB]|x|×|ms|s|min|h|hrs?|\+)?\+?)\s+(.{3,60})$/); const f = m && figs < 6 ? figureFrom(m[1], m[2].replace(/[.;,]$/, ''), src('a list')) : null; if (f) { figs++; out.push(f); } }
      continue;
    }
    const t = bare(l);
    if (!lead && t.length >= 30 && t.length <= LINE_MAX && !/^#/.test(l) && !/^\s*[>|]/.test(l)) { lead = true; out.push({ kind: 'line', text: t, source: src('the first paragraph') }); }
  }
  return out;
}

/** The brand's Facts (IDENTITY.md): its true claims, as lines, figures and commands. */
export function fromFacts(file, { cwd = process.cwd() } = {}) {
  const abs = path.resolve(cwd, file); if (!fs.existsSync(abs)) return [];
  const md = fs.readFileSync(abs, 'utf8'), m = md.match(/^##\s+Facts\s*\n([\s\S]*?)(?=^##\s|(?![\s\S]))/m);
  if (!m) return [];
  const out = [], source = "your brand's facts";
  for (const raw of m[1].split('\n').filter((l) => /^\s*[-*+]\s+/.test(l))) {
    const l = raw.replace(/^\s*[-*+]\s+/, '');
    for (const c of [...l.matchAll(/`([^`]+)`/g)].map((x) => x[1]).filter(showable)) out.push(commandFrom(c, source));
    const t = bare(l).replace(/\.$/, ''), n = t.match(/^([~≈<>+]?\$?\d[\d.,]*\s?(?:%|[kKmMbB]|x|×|ms|s|min|h|hrs?|\+)?\+?)\s+(.{3,60})$/);
    const f = n ? figureFrom(n[1], n[2], source) : null;
    if (f) out.push(f); else if (t.length >= 12 && t.length <= LINE_MAX) out.push({ kind: 'line', text: t, source });
  }
  return out;
}

// ── a folder of the user's own material ─────────────────────────────────────────────────────────────────────────

// width and height of a JPEG or PNG, read from its header (no image library needed)
function imageSize(file) {
  try {
    const b = fs.readFileSync(file);
    if (b.readUInt32BE(0) === 0x89504e47) return [b.readUInt32BE(16), b.readUInt32BE(20)];
    if (b.readUInt16BE(0) === 0xffd8) { let i = 2; while (i < b.length) { const marker = b.readUInt16BE(i), len = b.readUInt16BE(i + 2); if (marker >= 0xffc0 && marker <= 0xffcf && ![0xffc4, 0xffc8, 0xffcc].includes(marker)) return [b.readUInt16BE(i + 7), b.readUInt16BE(i + 5)]; i += 2 + len; } }
  } catch { /* not readable */ }
  return null;
}

export function fromFolder(folder, { cwd = process.cwd() } = {}) {
  const abs = path.resolve(cwd, folder); if (!fs.existsSync(abs) || !fs.statSync(abs).isDirectory()) return [];
  const out = [];
  for (const f of fs.readdirSync(abs).sort()) {
    const full = path.join(abs, f), rel = path.relative(cwd, full).split(path.sep).join('/');
    if (f.startsWith('.') || fs.statSync(full).isDirectory()) continue;
    const source = `your file ${f}`, base = f.replace(/\.\w+$/, '');
    if (IMG.test(f)) {
      const size = imageSize(full), tall = size && size[1] / size[0] > 1.5;
      // a picture named like a capture, or shaped like a page, is the product; anything else is a photograph
      if (/screen|shot|capture|site|page|app|ui|dashboard|desktop|phone|mobile/i.test(f) || (size && size[1] / size[0] > 1.9)) out.push({ kind: 'screen', image: rel, title: clean(base.replace(/[-_]+/g, ' ')), device: tall && size[0] < 900 ? 'phone' : 'desktop', source });
      else if (!/wordmark|logo|favicon|icon/i.test(f)) out.push({ kind: 'photo', image: rel, source });   // the brand's own marks are not photographs
    } else if (/\.svg$/i.test(f) && /logo|mark|icon|brand/i.test(f)) { const svg = fs.readFileSync(full, 'utf8').trim(); if (svg.length < 30000) out.push({ kind: 'logo', svg, source }); }
    else if (VID.test(f)) out.push({ kind: 'clip', file: rel, source });
    else if (AUD.test(f)) out.push({ kind: 'music', file: rel, source });
  }
  return out;
}

// ── putting it together ─────────────────────────────────────────────────────────────────────────────────────────

/** What makes two items the same thing, however they were found. */
export function keyOf(it) {
  const k = { line: it.text, figure: `${it.value}|${it.label}`, share: `${it.value}|${it.label}`, change: `${it.from}|${it.to}`, command: it.command, code: it.code, screen: it.image, photo: it.image, clip: it.file, music: it.file ?? it.bpm, logo: (it.svg ?? '').slice(0, 200), words: (it.items ?? []).join('|'), table: JSON.stringify(it.rows ?? []) }[it.kind];
  return `${it.kind}|${clean(k ?? JSON.stringify(it)).toLowerCase()}`;
}
const idFor = (it) => ({ line: slug(it.text ?? '', 3), figure: slug(it.label ?? '', 3), share: slug(it.label ?? '', 3), command: `run-${slug((it.command ?? '').replace(CLI, ''), 2)}`, screen: `${it.device ?? 'screen'}-${slug(it.url ?? it.title ?? it.image ?? '', 3)}`, photo: slug(path.basename(it.image ?? 'photo').replace(/\.\w+$/, ''), 3), clip: slug(path.basename(it.file ?? 'clip').replace(/\.\w+$/, ''), 3), words: slug((it.items ?? []).join(' '), 3), code: slug(it.file ?? 'code', 2), table: 'table', logo: 'logo', music: 'music' }[it.kind] ?? it.kind);

/**
 * Gathers proposals from every source: a URL, a .md file, a folder, or "brand" (the brand's Facts and its assets).
 * Returns what is new against `existing` (anything already there, kept or removed, is not proposed again).
 * `plain` leaves commands and code out, for a brand whose audience does not code.
 */
export async function gather(sources, { cwd = process.cwd(), existing = [], plain = false, log = () => {} } = {}) {
  const found = [], notes = [];
  for (const s of sources) {
    try {
      let got;
      if (/^https?:\/\//i.test(s)) { log(`reading ${s} …`); got = await fromUrl(s, { cwd }); }
      else if (s === 'brand') got = [...fromFacts('brand/IDENTITY.md', { cwd }), ...fromFolder('brand/assets', { cwd })];
      else if (!fs.existsSync(path.resolve(cwd, s))) { notes.push(`${s}: not found`); continue; }
      else if (fs.statSync(path.resolve(cwd, s)).isDirectory()) got = fromFolder(s, { cwd });
      else if (/IDENTITY\.md$/i.test(s)) got = fromFacts(s, { cwd });
      else got = fromMarkdown(s, { cwd });
      // a brand whose audience does not code: commands and code are left out, however many its files hold
      if (plain) got = got.filter((i) => !['command', 'code', 'rewrite'].includes(i.kind));
      notes.push(`${s}: ${got.length} found`);
      found.push(...got);
    } catch (e) { notes.push(`${s}: ${e.message.split('\n')[0]}`); }
  }
  const have = new Set(existing.map(keyOf)), ids = new Set(existing.map((i) => i.id)), fresh = [];
  for (const it of found) {
    const k = keyOf(it); if (have.has(k)) continue;
    have.add(k);
    let id = idFor(it), n = 2; while (ids.has(id)) id = `${idFor(it)}-${n++}`;
    ids.add(id);
    fresh.push({ id, ...it, status: 'proposed' });
  }
  return { fresh, notes };
}
