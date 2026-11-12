// A piece's progress: pieces/<piece>/piece.json, shared by the agent (CLI) and the user (pamo studio).
//
//   stage      the stage the piece is at: brief → inventory → video → final. The user sees three steps (What it says,
//              Your video, Export); the brief is settled in the chat.
//   stages     each stage's status: pending · working (the agent's turn) · review (the user's turn) · changes · approved
//   brief      what, who, format, tone, action: written by the agent, editable by the user
//   parts      per part (by its folder in chain.json): status (queued · rendering · review · changes · approved), note
//   events     what the user did in the studio, in order; `seen` is the last one the agent has read
//   ask        a question the agent asked in the chat and is waiting on (the studio sends the user there)
//   agent      the app or page the agent runs in, so the studio can take the user back to it
//
// chain.json stays the source of what plays (order, seconds, joins); piece.json only tracks decisions.
import fs from 'node:fs';
import path from 'node:path';
import { pieceDir } from './chain.mjs';

export const STAGES = ['brief', 'inventory', 'video', 'final'];
// the stages a piece had before Your video took them over: a piece at one of them is at `video` now
const OLD_VIDEO = ['look', 'structure', 'parts', 'assembly'];
export const STAGE_STATUS = ['pending', 'working', 'review', 'changes', 'approved'];
export const BRIEF_KEYS = ['what', 'who', 'format', 'tone', 'action'];

const now = () => new Date().toISOString();
const file = (dir) => path.join(dir, 'piece.json');

export function readPiece(dir) {
  try { return upgrade(JSON.parse(fs.readFileSync(file(dir), 'utf8'))); } catch { return null; }
}
// a piece started before a stage existed: that stage counts as done when the piece is already past it
function upgrade(p) {
  if (!p.stages.video) {
    const at = OLD_VIDEO.indexOf(p.stage), last = OLD_VIDEO.findLast((s) => p.stages[s]);
    p.stages.video = at >= 0 ? { ...p.stages[p.stage] } : last && p.stages[last].status === 'approved' && STAGES.indexOf(p.stage) > 0 ? { status: 'approved' } : undefined;
    if (at >= 0) p.stage = 'video';
    for (const s of OLD_VIDEO) delete p.stages[s];
    if (!p.stages.video) delete p.stages.video;
  }
  for (const s of STAGES) p.stages[s] ??= STAGES.indexOf(p.stage) > STAGES.indexOf(s) ? { status: 'approved', skipped: true } : { status: 'pending' };
  return p;
}

/** Writes atomically (the studio and the CLI both write it). */
export function writePiece(dir, p) {
  fs.mkdirSync(dir, { recursive: true });
  const tmp = `${file(dir)}.${process.pid}.tmp`;
  fs.writeFileSync(tmp, JSON.stringify(p, null, 2) + '\n');
  fs.renameSync(tmp, file(dir));
  return p;
}

/** Read, change, write: `fn` mutates the piece (re-read right before writing, so concurrent writers rarely clash). */
export function updatePiece(dir, fn) {
  const p = readPiece(dir);
  if (!p) throw new Error(`no piece.json in ${dir} (pamo piece init first)`);
  fn(p);
  p.updated = now();
  return writePiece(dir, p);
}

export function initPiece({ cwd = process.cwd(), piece, title, brief = {}, force = false }) {
  const dir = pieceDir(piece, cwd), old = readPiece(dir);
  if (old && !force) {
    // an existing piece: fill in what was given, keep the rest
    return updatePiece(dir, (p) => { if (title) p.title = title; for (const k of BRIEF_KEYS) if (brief[k]) p.brief[k] = brief[k]; });
  }
  const tokens = (() => { try { return JSON.parse(fs.readFileSync(path.join(cwd, 'brand/tokens.json'), 'utf8')); } catch { return {}; } })();
  return writePiece(dir, {
    v: 1, piece: path.basename(dir), title: title ?? path.basename(dir), brand: tokens.brand ?? null,
    stage: 'brief',
    stages: Object.fromEntries(STAGES.map((s, i) => [s, { status: i ? 'pending' : 'working' }])),
    brief: Object.fromEntries(BRIEF_KEYS.map((k) => [k, brief[k] ?? ''])),
    parts: {}, events: [], seen: 0, created: now(), updated: now(),
  });
}

/** The line the agent reads for an event (same family as the board reply). */
export function eventLine(p, e) {
  const who = e.part ? `part ${e.part}` : e.stage;
  const what = e.kind === 'approve' ? 'approved'
    : e.kind === 'changes' ? `changes: "${e.text}"`
    : e.kind === 'order' ? `order ${e.text}`
    : e.kind === 'reopen' ? 'reopened'
    : e.kind === 'failed' ? `could not join the parts: "${e.text}"`
    : e.say ? e.say : `${e.key}="${e.text}"${e.rerendered ? ' (re-rendered)' : ''}`;
  // the studio joins the draft again by itself after an edit by hand; the full-quality render stays the agent's
  const tail = `${e.rejoined ? ' (the studio is joining the draft again)' : ''}${e.rejoin ? ' · join again: pamo chain --draft' : ''}${e.refinal ? ` · the final is out of date: render it again (pamo chain ${p.piece} --motion-blur 5), then review final` : ''}`;
  return `paper-motion: piece ${p.piece} · ${e.kind === 'order' ? '' : `${who} `}${what}${tail}`.replace(/ {2,}/g, ' ');
}

/** Appends a user event (from the studio). */
export function addEvent(p, e) {
  const n = (p.events.at(-1)?.n ?? 0) + 1;
  const ev = { n, at: now(), ...e };
  p.events.push(ev);
  return ev;
}

/** The agent hands a stage to the user: it becomes the current stage, in review. */
export function toReview(dir, stage, { skip = false } = {}) {
  if (!STAGES.includes(stage)) throw new Error(`stage "${stage}": use ${STAGES.join(', ')}`);
  return updatePiece(dir, (p) => {
    // nothing moves on until the user approves: an earlier stage they have not approved stops the hand-over,
    // unless the agent says outright that it is skipping it (`skip`), which marks it approved
    const open = earlierOpen(p, stage);
    if (open.length && !skip) throw new Error(`${open.join(', ')} not approved yet: review ${open.length > 1 ? 'them' : 'it'} first (piece review ${p.piece} ${open[0]}), or pass --skip when the user agreed to move on without ${open.length > 1 ? 'them' : 'it'}`);
    for (const s of open) p.stages[s] = { ...p.stages[s], status: 'approved' };
    delete p.ask;   // handing a stage over means the question in the chat is settled
    p.stage = stage;
    p.stages[stage] = { status: 'review', since: now() };
  });
}

/** The stages before `stage` that the user has not approved. */
export const earlierOpen = (p, stage) => STAGES.slice(0, STAGES.indexOf(stage)).filter((s) => p.stages[s].status !== 'approved');

/** Events the agent hasn't read; marks them read when `mark`. */
export function unseen(dir, { mark = true } = {}) {
  let out = [];
  const p = updatePiece(dir, (q) => { out = q.events.filter((e) => e.n > (q.seen ?? 0)); if (mark && out.length) q.seen = out.at(-1).n; });
  return { piece: p, events: out };
}

// an event that ends the agent's wait: a decision on the stage under review, or a change asked anywhere
const decisive = (e, stage) => (e.kind === 'approve' && e.stage === stage && !e.part) || e.kind === 'changes' || e.kind === 'reopen' || e.rejoin || e.refinal;

/**
 * Waits until the user decides on `stage` in the studio (approves it, or asks for changes), then returns every
 * event since the agent last looked, as lines. Edits the studio already applied (texts, seconds, order) come along.
 */
export async function awaitDecision(dir, stage, { timeout = 30 * 60 * 1000, every = 1000, signal } = {}) {
  const t0 = Date.now();
  let last = 0;
  try {
    for (;;) {
      if (Date.now() - last > 3000) { beat(dir, { waiting: stage }); last = Date.now(); }   // the studio shows "your agent is listening"
      const p = readPiece(dir);
      const fresh = p.events.filter((e) => e.n > (p.seen ?? 0));
      if (fresh.some((e) => decisive(e, stage))) {
        const r = unseen(dir);
        return { done: true, piece: r.piece, events: r.events, lines: r.events.map((e) => eventLine(r.piece, e)) };
      }
      if (Date.now() - t0 > timeout || signal?.aborted) return { done: false, piece: p, events: fresh, lines: fresh.map((e) => eventLine(p, e)) };
      await new Promise((res) => setTimeout(res, every));
    }
  } finally { unbeat(dir); }
}

// ── the agent's side of the conversation: is it listening, what did it ask, where does it live ────────────────
// While a command waits for the user (piece review, board), it says so every few seconds in a small file beside
// piece.json (piece.json itself stays quiet). No fresh beat means nobody reads what the user does in the studio.
const beatFile = (dir) => path.join(dir, '.agent.json');
export function beat(dir, info = {}) { try { fs.writeFileSync(beatFile(dir), JSON.stringify({ at: Date.now(), pid: process.pid, ...info })); } catch { /* a read-only project: the studio just won't know */ } }
export function unbeat(dir) { try { if (JSON.parse(fs.readFileSync(beatFile(dir), 'utf8')).pid === process.pid) fs.rmSync(beatFile(dir)); } catch { /* already gone */ } }
/** The command waiting on this piece right now, if any. */
export function listening(dir, within = 9000) { try { const a = JSON.parse(fs.readFileSync(beatFile(dir), 'utf8')); return Date.now() - a.at < within ? a : null; } catch { return null; } }

/** The agent asked the user something in the chat: the studio says so until the agent moves on. */
export function setAsk(dir, text) { return updatePiece(dir, (p) => { p.ask = { text: String(text ?? '').trim(), at: now() }; }); }
export function clearAsk(dir) { const p = readPiece(dir); return p?.ask ? updatePiece(dir, (q) => { delete q.ask; }) : p; }
/** Where the agent runs (see host.mjs), kept so the studio can take the user back there. */
export function setHost(dir, host) {
  const p = readPiece(dir);
  if (!p || !host || JSON.stringify(p.agent ?? null) === JSON.stringify(host)) return p;
  return updatePiece(dir, (q) => { q.agent = host; });
}

// ── the words on screen: a scene's top-level string CONFIG entries ──────────────────────────
const CONFIG_STRING = /^ {2}(\w+): '((?:[^'\\]|\\.)*)',?\s*(\/\/.*)?$/;
const SKIP = new Set(['background', 'image', 'svg', 'font', 'fontFamily']);

/** The editable texts of a scene: top-level CONFIG strings (not ids or file paths). */
export function sceneTexts(html) {
  const start = html.indexOf('const CONFIG = {'), end = html.indexOf('\n};', start);
  if (start < 0 || end < 0) return {};
  const out = {};
  for (const line of html.slice(start, end).split('\n')) {
    const m = line.match(CONFIG_STRING);
    if (m && !SKIP.has(m[1]) && !/\.(png|jpe?g|webp|svg|mp4|webm)$/.test(m[2])) out[m[1]] = m[2].replace(/\\(.)/g, '$1');
  }
  return out;
}

/** Rewrites one top-level CONFIG string in a scene. */
export function setSceneText(html, key, value) {
  const start = html.indexOf('const CONFIG = {'), end = html.indexOf('\n};', start);
  const head = html.slice(0, start), body = html.slice(start, end), tail = html.slice(end);
  const lit = `'${String(value).replace(/\\/g, '\\\\').replace(/'/g, "\\'")}'`;
  let hit = false;
  const next = body.split('\n').map((line) => {
    const m = line.match(CONFIG_STRING);
    if (!m || m[1] !== key) return line;
    hit = true;
    return `  ${key}: ${lit},${m[3] ? ` ${m[3]}` : ''}`;
  }).join('\n');
  if (!hit) throw new Error(`CONFIG has no text "${key}"`);
  return head + next + tail;
}

// ── boards: the decisions taken on paper-motion.app, listed in the studio so the user finds them there too ──────
const BOARD_STAGE = () => 'video';

/** The piece a board belongs to: the one named, else the only one in progress before Parts. */
export function activePiece(cwd, name) {
  if (name) { const dir = pieceDir(name, cwd); return readPiece(dir) ? dir : null; }
  const root = path.join(cwd, 'pieces');
  if (!fs.existsSync(root)) return null;
  const live = fs.readdirSync(root).map((d) => path.join(root, d)).filter((d) => { const p = readPiece(d); return p && ['brief', 'inventory', 'video'].includes(p.stage); });
  return live.length === 1 ? live[0] : null;
}

/** Records a board shared for this piece (shown in the studio's Look or Structure stage until chosen). */
export function attachBoard(dir, { url, id, title, kind }) {
  return updatePiece(dir, (p) => {
    p.boards ??= [];
    if (id && p.boards.some((b) => b.id === id)) return;
    p.boards.push({ url, id: id ?? null, title, kind, stage: BOARD_STAGE(p.stage), at: now(), status: 'waiting' });
  });
}

/** Marks a board chosen with the reply line. */
export function markBoard(dir, id, line) {
  return updatePiece(dir, (p) => { const b = (p.boards ?? []).find((x) => x.id === id); if (b) { b.status = 'chosen'; b.line = line; } });
}
