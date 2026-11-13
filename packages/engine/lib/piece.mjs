// A piece's progress: pieces/<piece>/piece.json, shared by the agent (CLI) and the user (pamo studio).
//
//   stage      the stage the piece is at: brief → inventory → look → video → final. The user sees four steps (What
//              you want to say: the brief and the inventory; How it looks; Your video; Export).
//   stages     each stage's status: pending · working (the agent's turn) · review (the user's turn) · changes · approved
//   brief      what, who, format, tone, action: written by the agent, editable by the user
//   parts      per part (by its folder in chain.json): status (queued · rendering · review · changes · approved), note
//   events     what the user did in the studio, in order; `seen` is the last one the agent has read, and each
//              event the agent read carries `readAt`
//   ask        a question the agent asked and is waiting on; the user answers it in the studio (an `answer` event)
//   working    what the agent said it is doing (`piece working --on`) and since when; it lapses after 20 minutes
//   notes      the agent's short replies to the user, shown in the studio's thread (`piece say`)
//   choices    options the agent put into the studio (`pamo board` while a piece is open), where they show, and
//              the reply line once the user chose (ADR 0005)
//   agent      the app or page the agent runs in, so the studio can take the user back to it
//
// chain.json stays the source of what plays (order, seconds, joins); piece.json only tracks decisions.
import fs from 'node:fs';
import path from 'node:path';
import { pieceDir } from './chain.mjs';

export const STAGES = ['brief', 'inventory', 'look', 'video', 'final'];
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

/** A project whose brand already settles colours, type and a background: How it looks starts done. */
export function brandSettled(cwd) {
  const read = (f) => { try { return JSON.parse(fs.readFileSync(path.join(cwd, f), 'utf8')); } catch { return {}; } };
  const t = read('brand/tokens.json'), set = read('brand/shader-set/set.json');
  return !!(t.colors?.ground && t.colors?.figure && t.fonts?.display && (Array.isArray(set) ? set : set.entries ?? []).some((e) => e.shader && !e.image));
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
    stages: Object.fromEntries(STAGES.map((s, i) => [s, s === 'look' && brandSettled(cwd) ? { status: 'approved', brand: true } : { status: i ? 'pending' : 'working' }])),
    brief: Object.fromEntries(BRIEF_KEYS.map((k) => [k, brief[k] ?? ''])),
    parts: {}, events: [], seen: 0, created: now(), updated: now(),
  });
}

/** The line the agent reads for an event (same family as the board reply). */
export function eventLine(p, e) {
  const who = e.part ? `part ${e.part}` : e.stage ?? '';
  const what = e.kind === 'approve' ? 'approved'
    : e.kind === 'changes' ? `changes: "${e.text}"`
    : e.kind === 'order' ? `order ${e.text}`
    : e.kind === 'reopen' ? 'reopened'
    : e.kind === 'failed' ? `could not join the parts: "${e.text}"`
    : e.kind === 'answer' ? `answered${e.q ? ` "${e.q}"` : ''}: "${e.text}"`
    : e.kind === 'choice' ? `chose${e.title ? ` on "${e.title}"` : ''}: ${e.text}`
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
    delete p.working;
    p.stage = stage;
    p.stages[stage] = { status: 'review', since: now() };
  });
}

/** The stages before `stage` that the user has not approved. */
export const earlierOpen = (p, stage) => STAGES.slice(0, STAGES.indexOf(stage)).filter((s) => p.stages[s].status !== 'approved');

/** Events the agent hasn't read; marks them read when `mark`. */
export function unseen(dir, { mark = true } = {}) {
  let out = [];
  const p = updatePiece(dir, (q) => {
    out = q.events.filter((e) => e.n > (q.seen ?? 0));
    if (mark && out.length) { const at = now(); for (const e of out) e.readAt = at; q.seen = out.at(-1).n; }
  });
  return { piece: p, events: out };
}

// what the user does that needs the agent: something asked, answered, approved, reopened, chosen, or a join that failed
const needsAgent = (e) => ['changes', 'answer', 'reopen', 'choice', 'failed'].includes(e.kind) || (e.kind === 'approve' && !e.part) || e.rejoin || e.refinal;

/**
 * Listens on the piece between the agent's turns (`pamo piece listen`): returns as soon as the user does something
 * that needs the agent, with every unread event as lines (and marks them read), or after `timeout` with nothing.
 * While it listens the studio says so; it is the agent's way to hear the studio without the user going to the chat.
 */
export async function listenFor(dir, { timeout = 9 * 60 * 1000, every = 1000, signal } = {}) {
  const t0 = Date.now();
  let last = 0;
  updatePiece(dir, (p) => { delete p.working; });   // listening means it is not doing anything else
  // interrupted (the agent cancels it, Ctrl+C): stop saying it listens right away
  const stop = () => { unbeat(dir); process.exit(130); };
  process.once('SIGINT', stop); process.once('SIGTERM', stop);
  try {
    for (;;) {
      if (Date.now() - last > 3000) { beat(dir, { waiting: 'listen' }); last = Date.now(); }
      const p = readPiece(dir);
      const fresh = p.events.filter((e) => e.n > (p.seen ?? 0));
      if (fresh.some(needsAgent)) { const r = unseen(dir); return { done: true, piece: r.piece, events: r.events, lines: r.events.map((e) => eventLine(r.piece, e)) }; }
      if (Date.now() - t0 > timeout || signal?.aborted) return { done: false, piece: p, events: [], lines: [] };
      await new Promise((res) => setTimeout(res, every));
    }
  } finally { unbeat(dir); process.off('SIGINT', stop); process.off('SIGTERM', stop); }
}

const WORKING_FOR = 20 * 60 * 1000;
/** The agent says what it is doing; the studio shows it, with how long, until it listens, reviews or 20 minutes pass. */
export function setWorking(dir, on) { return updatePiece(dir, (p) => { delete p.ask; p.working = { on: String(on ?? '').trim() || null, at: now() }; }); }
/** A short reply from the agent to the user, shown in the studio's thread. */
export function addNote(dir, text) { return updatePiece(dir, (p) => { (p.notes ??= []).push({ at: now(), text: String(text).trim() }); }); }

/**
 * What the studio may say about the agent, only from facts: `ask` (a question is open), `listen` (a command of the
 * agent is waiting on this piece right now), `work` (it said what it is doing, less than 20 minutes ago) or `off`.
 */
export function agentState(dir, p = readPiece(dir)) {
  const l = listening(dir), w = p?.working && Date.now() - Date.parse(p.working.at) < WORKING_FOR ? p.working : null;
  return { state: p?.ask ? 'ask' : l ? 'listen' : w ? 'work' : 'off', listening: !!l, working: w };
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
export function listening(dir, within = 9000) {
  try {
    const a = JSON.parse(fs.readFileSync(beatFile(dir), 'utf8'));
    if (Date.now() - a.at >= within) return null;
    // a command that was killed leaves its last beat behind: it only counts while its process is alive
    if (a.pid) { try { process.kill(a.pid, 0); } catch (e) { if (e.code === 'ESRCH') return null; } }
    return a;
  } catch { return null; }
}

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

// ── choices: a board shown inside the studio instead of a link (ADR 0005) ─────────────────────────────────────
/** Puts a board into the piece, on the step and section it decides. Returns its id (`c1`, `c2`…). */
export function addChoice(dir, { board, where }) {
  let id;
  updatePiece(dir, (p) => {
    p.choices ??= [];
    id = `c${p.choices.length + 1}`;
    p.choices.push({ id, board, where, status: 'waiting', at: now() });
  });
  return id;
}
/** The user's pick on a choice: records the reply line and an event the agent reads. */
export function settleChoice(p, id, line) {
  const c = (p.choices ?? []).find((x) => x.id === id);
  if (!c) throw new Error('no such choice');
  if (c.status !== 'waiting') throw new Error('already chosen');
  c.status = 'chosen'; c.line = line; c.chosenAt = now();
  addEvent(p, { kind: 'choice', stage: c.where?.step ?? p.stage, text: line, title: c.board.title, choice: id });
  return c;
}
/** Waits for the user's pick on a studio choice, beating as listening; returns the reply line, or null on timeout. */
export async function awaitChoiceIn(dir, id, { timeout = 10 * 60 * 1000, every = 1000 } = {}) {
  const t0 = Date.now(); let last = 0;
  const stop = () => { unbeat(dir); process.exit(130); };
  process.once('SIGINT', stop); process.once('SIGTERM', stop);
  try {
    for (;;) {
      if (Date.now() - last > 3000) { beat(dir, { waiting: 'board' }); last = Date.now(); }
      const c = (readPiece(dir)?.choices ?? []).find((x) => x.id === id);
      if (!c) return null;
      if (c.status === 'chosen') {
        // the agent has the pick from here: the event that carries it counts as read
        updatePiece(dir, (p) => { const at = now(); for (const e of p.events) if (e.kind === 'choice' && e.choice === id && !e.readAt) { e.readAt = at; if (e.n === (p.seen ?? 0) + 1) p.seen = e.n; } });
        return c.line;
      }
      if (Date.now() - t0 > timeout) return null;
      await new Promise((res) => setTimeout(res, every));
    }
  } finally { unbeat(dir); process.off('SIGINT', stop); process.off('SIGTERM', stop); }
}
/** Takes a choice back out of the studio. */
export function forgetChoice(dir, id) { return updatePiece(dir, (p) => { p.choices = (p.choices ?? []).filter((x) => x.id !== id); }); }

// ── boards: the decisions taken on paper-motion.app, listed in the studio so the user finds them there too ──────
const BOARD_STAGE = () => 'video';

/** The piece a board belongs to: the one named, else the only one in progress before Parts. */
export function activePiece(cwd, name) {
  if (name) { const dir = pieceDir(name, cwd); return readPiece(dir) ? dir : null; }
  const root = path.join(cwd, 'pieces');
  if (!fs.existsSync(root)) return null;
  const live = fs.readdirSync(root).map((d) => path.join(root, d)).filter((d) => { const p = readPiece(d); return p && ['brief', 'inventory', 'look', 'video'].includes(p.stage); });
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
