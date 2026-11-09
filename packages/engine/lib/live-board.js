// A board: 2–4 labelled options the agent proposes, carried in a paper-motion.app link so the user can see them
// live in their own look, tune one and choose. Nothing reaches a server: the payload travels in the URL fragment.
//   https://paper-motion.vercel.app/b#<base64url(deflate-raw(JSON))>
// This module runs in Node (`pamo board --url`) and in the browser (the /b page), so it has no Node imports: it
// picks zlib or CompressionStream at call time. Plain ESM; the site copies it next to customize.mjs.

// (lib/board.mjs is the other kind of board: the rendered one, stills and clips composed by ffmpeg.)

export const BOARD_VERSION = 1;
export const MAX_PAYLOAD = 8 * 1024;
const LABELS = ['A', 'B', 'C', 'D'];
const TYPES = ['component', 'transition', 'text', 'camera', 'background', 'palette', 'font-pair', 'recipe'];

/**
 * @typedef {{ v: 1, kind: 'resource'|'kit', title: string, ask?: string, reply?: string,
 *   look?: { palette?: { id: string, values?: object }, font?: { id: string, values?: object } },
 *   options: Array<{ label: string, id?: string, values?: object, items?: Array<{ id: string, values?: object }>, note?: string }> }} Board
 */

/** Checks a board's shape; returns a list of problems (empty when valid). `index` (registry items by id) adds id checks. */
export function validateBoard(b, index) {
  const errs = [];
  if (!b || typeof b !== 'object') return ['not an object'];
  if (b.v !== BOARD_VERSION) errs.push(`v must be ${BOARD_VERSION}`);
  if (!['resource', 'kit'].includes(b.kind)) errs.push('kind must be "resource" or "kit"');
  if (!b.title || typeof b.title !== 'string') errs.push('title is required');
  if (!Array.isArray(b.options) || b.options.length < 2 || b.options.length > 4) errs.push('2 to 4 options');
  const seen = new Set();
  for (const [i, o] of (b.options ?? []).entries()) {
    const at = `options[${i}]`;
    if (!LABELS.includes(o.label)) errs.push(`${at}.label must be A–D`);
    if (seen.has(o.label)) errs.push(`${at}.label "${o.label}" repeats`);
    seen.add(o.label);
    if (b.kind === 'resource') {
      if (!o.id) errs.push(`${at}.id is required`);
      else if (index && !index[o.id]) errs.push(`${at}.id "${o.id}" is not in the registry`);
    } else {
      if (!Array.isArray(o.items) || !o.items.length) errs.push(`${at}.items is required for a kit board`);
      for (const it of o.items ?? []) if (index && !index[it.id]) errs.push(`${at}: "${it.id}" is not in the registry`);
    }
    if (o.values && typeof o.values !== 'object') errs.push(`${at}.values must be an object`);
  }
  if (b.kind === 'resource' && index) {
    const types = new Set(b.options.map((o) => index[o.id]?.type).filter(Boolean));
    if (types.size > 1) errs.push(`a resource board shows one type at a time (got ${[...types].join(', ')})`);
  }
  for (const k of ['palette', 'font']) { const l = b.look?.[k]; if (l && index && !index[l.id]) errs.push(`look.${k} "${l.id}" is not in the registry`); }
  return errs;
}

// ── compression, both runtimes ──────────────────────────────────

const b64url = {
  enc: (bytes) => (typeof Buffer !== 'undefined' ? Buffer.from(bytes).toString('base64url') : btoa(String.fromCharCode(...bytes)).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '')),
  dec: (s) => { const b = s.replace(/-/g, '+').replace(/_/g, '/'); if (typeof Buffer !== 'undefined') return new Uint8Array(Buffer.from(b, 'base64')); const bin = atob(b); return Uint8Array.from(bin, (c) => c.charCodeAt(0)); },
};

async function deflate(bytes) {
  if (typeof CompressionStream === 'function') {
    const stream = new Blob([bytes]).stream().pipeThrough(new CompressionStream('deflate-raw'));
    return new Uint8Array(await new Response(stream).arrayBuffer());
  }
  const { deflateRawSync } = await import('node:zlib');
  return new Uint8Array(deflateRawSync(bytes));
}
async function inflate(bytes) {
  if (typeof DecompressionStream === 'function') {
    const stream = new Blob([bytes]).stream().pipeThrough(new DecompressionStream('deflate-raw'));
    return new Uint8Array(await new Response(stream).arrayBuffer());
  }
  const { inflateRawSync } = await import('node:zlib');
  return new Uint8Array(inflateRawSync(bytes));
}

/** Board → the fragment string (no leading #). Throws when invalid or over the size budget. */
export async function encodeBoard(board, index) {
  const errs = validateBoard(board, index);
  if (errs.length) throw new Error(`board: ${errs.join('; ')}`);
  const json = JSON.stringify(board);
  if (json.length > MAX_PAYLOAD) throw new Error(`board: ${json.length} bytes of JSON, the limit is ${MAX_PAYLOAD}`);
  return b64url.enc(await deflate(new TextEncoder().encode(json)));
}

/** Fragment string → board. Throws on a bad or oversized payload. */
export async function decodeBoard(fragment) {
  const s = fragment.replace(/^#/, '');
  if (!s) throw new Error('empty board');
  if (s.length > MAX_PAYLOAD * 2) throw new Error('board link too long');
  const json = new TextDecoder().decode(await inflate(b64url.dec(s)));
  const board = JSON.parse(json);
  const errs = validateBoard(board);
  if (errs.length) throw new Error(`board: ${errs.join('; ')}`);
  return board;
}

export const boardUrl = (site, fragment) => `${site.replace(/\/$/, '')}/b#${fragment}`;

/**
 * Stores a board on the site and returns its short link `{ id, url, expires }` (`POST /api/boards`). Throws when
 * the site refuses or is unreachable; callers fall back to the fragment link.
 */
export async function shortenBoard(site, board) {
  const r = await fetch(`${site.replace(/\/$/, '')}/api/boards`, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ board }) });
  if (!r.ok) { let msg = `${r.status}`; try { msg = (await r.json()).error ?? msg; } catch { /* keep the status */ } throw new Error(`the site did not store the board (${msg})`); }
  return r.json();
}

/**
 * Waits for the choice made on a stored board: polls `GET /api/boards/<id>/choice` every `every` ms until one
 * exists or `timeout` ms pass. Resolves `{ line, label?, none?, text?, at }`, or null on timeout.
 */
export async function awaitChoice(site, id, { timeout = 10 * 60 * 1000, every = 2000, signal } = {}) {
  const base = `${site.replace(/\/$/, '')}/api/boards/${id}/choice`, until = Date.now() + timeout;
  while (Date.now() < until && !signal?.aborted) {
    const r = await fetch(base, { cache: 'no-store' });
    if (r.status === 200) return r.json();
    if (r.status !== 204) throw new Error(`the site answered ${r.status} while waiting for the choice`);
    await new Promise((res) => setTimeout(res, every));
  }
  return null;
}

/** Forgets a stored board and its choice (`DELETE /api/boards/<id>`). */
export async function forgetBoard(site, id) {
  const r = await fetch(`${site.replace(/\/$/, '')}/api/boards/${id}`, { method: 'DELETE' });
  if (!r.ok && r.status !== 404) throw new Error(`the site answered ${r.status}`);
}

// ── the reply line ──────────────────────────────────────────────
// What the user pastes back in the chat. One line, starts with "paper-motion:", so an agent can spot and parse it.
//   paper-motion: A · mesh-sage                                   chose A as proposed
//   paper-motion: B · mesh-sage --set speed=0.8 --set colors=[…]  chose B, tuned
//   paper-motion: none of bg-1, show me calmer ones               none; free text after the comma
//   paper-motion: kit B · cobalt geist mesh-graphite whip-pan      a kit board choice
// `reply` (the agent's name for the decision) is appended as "(bg-1)" when present.

export function replyLine(board, choice) {
  const tag = board.reply ? ` (${board.reply})` : '';
  if (choice.none) return `paper-motion: none of ${board.reply ?? `"${board.title}"`}${choice.text ? `, ${choice.text}` : ''}`;
  const o = board.options.find((x) => x.label === choice.label);
  if (!o) throw new Error(`no option ${choice.label}`);
  if (board.kind === 'kit') return `paper-motion: kit ${o.label} · ${o.items.map((i) => i.id).join(' ')}${tag}`;
  const sets = (choice.setArgs ?? []).join(' ');
  return `paper-motion: ${o.label} · ${o.id}${sets ? ` ${sets}` : ''}${tag}`;
}

/** Parses a reply line the user pasted. Returns null when the text is not one. */
export function parseReply(text) {
  const m = String(text).match(/paper-motion:\s*(.+)$/m);
  if (!m) return null;
  const body = m[1].trim(), tag = body.match(/\(([^()]+)\)\s*$/)?.[1] ?? null, core = body.replace(/\s*\([^()]+\)\s*$/, '');
  if (core.startsWith('none of ')) { const rest = core.slice(8); const i = rest.indexOf(','); return { none: true, reply: tag ?? rest.slice(0, i < 0 ? undefined : i).trim(), text: i < 0 ? '' : rest.slice(i + 1).trim() }; }
  const kit = core.match(/^kit ([A-D]) · (.+)$/);
  if (kit) return { kind: 'kit', label: kit[1], ids: kit[2].split(/\s+/), reply: tag };
  const one = core.match(/^([A-D]) · (\S+)(.*)$/);
  if (!one) return null;
  const sets = [...one[3].matchAll(/--set\s+('([^']*)'|(\S+))/g)].map((x) => x[2] ?? x[3]);
  return { kind: 'resource', label: one[1], id: one[2], set: sets, reply: tag };
}
