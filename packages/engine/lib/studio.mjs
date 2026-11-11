// pamo studio: a local page where the user follows a piece through its stages, watches each stage's renders,
// approves or asks for changes, and edits the brief, the words on screen, lengths, joins and order by hand.
//
//   GET  /                         the studio page (studio/index.html)
//   GET  /api/pieces               pieces in this project that have a piece.json
//   GET  /api/piece?p=<piece>      everything the page shows: piece.json + chain + look + media
//   POST /api/piece?p=<piece>      an action: { type, … } (see act())
//   POST /api/focus?p=<piece>      brings the agent's app to the front (the app the CLI found itself running in)
//   GET  /files/<path>             files under the project (renders, drafts), with byte ranges for video
//
// Edits that need no judgment are applied here: a text goes into the part's CONFIG and the part re-renders as a
// draft; lengths, joins and order go into chain.json; and when the piece already has a joined draft, the studio
// joins it again by itself. Everything the user does is also an event in piece.json, which `pamo piece review`
// hands to the agent.
//
// The page always says whose turn it is: /api/piece carries whether a command of the agent is waiting on the piece
// (`agent.listening`), a question it asked in the chat (`ask`), the join in progress (`job`), and whether the
// joined draft or the final were made from something that has changed since (`media.assemblyStale`, `finalStale`).
import fs from 'node:fs';
import http from 'node:http';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { pieceDir, JOINS, chainSig, readSigs, readJob } from './chain.mjs';
import { STAGES, BRIEF_KEYS, readPiece, updatePiece, addEvent, eventLine, sceneTexts, setSceneText, listening } from './piece.mjs';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const PAGE = path.join(HERE, '..', 'studio', 'index.html');
const SITE = (process.env.PAPER_MOTION_SITE ?? 'https://paper-motion.vercel.app').replace(/\/$/, '');
const TYPES = { '.mp4': 'video/mp4', '.webm': 'video/webm', '.mov': 'video/quicktime', '.gif': 'image/gif', '.png': 'image/png', '.jpg': 'image/jpeg', '.json': 'application/json', '.html': 'text/html; charset=utf-8', '.css': 'text/css', '.js': 'text/javascript', '.woff2': 'font/woff2' };
const readJson = (f, d) => { try { return JSON.parse(fs.readFileSync(f, 'utf8')); } catch { return d; } };

/** Pieces in the project that the studio can show. */
export function listPieces(cwd) {
  const root = path.join(cwd, 'pieces');
  if (!fs.existsSync(root)) return [];
  return fs.readdirSync(root).filter((d) => fs.existsSync(path.join(root, d, 'piece.json'))).map((d) => {
    const p = readJson(path.join(root, d, 'piece.json'), {});
    return { piece: d, title: p.title, stage: p.stage, status: p.stages?.[p.stage]?.status, updated: p.updated };
  }).sort((a, b) => String(b.updated).localeCompare(String(a.updated)));
}

const fileUrl = (cwd, f) => {
  if (!fs.existsSync(f)) return null;
  return `/files/${path.relative(cwd, f).split(path.sep).map(encodeURIComponent).join('/')}?v=${Math.round(fs.statSync(f).mtimeMs)}`;
};

/** Whether the piece's joined draft and final still show what the piece is now, and the join running on it. */
export function filmState(cwd, dir) {
  const name = path.basename(dir), sigs = readSigs(dir), sig = chainSig(cwd, dir), renders = path.join(dir, 'renders');
  const has = (f) => fs.existsSync(path.join(renders, f));
  const stale = (f) => has(f) && !!sigs[f]?.sig && sigs[f].sig !== sig;   // a render with no record is taken as current
  const job = readJob(dir);
  return {
    draft: has(`${name}-draft.mp4`), final: has(`${name}.mp4`), opts: sigs[`${name}-draft.mp4`] ?? {},
    assemblyStale: stale(`${name}-draft.mp4`), finalStale: stale(`${name}.mp4`),
    job: job ? { kind: job.kind, part: job.part ?? null, of: job.of ?? null, joining: !!job.joining } : null,
  };
}
const joinErrors = new Map();   // piece folder → why the studio's last join failed

/** What the page shows for one piece. */
export function view(cwd, piece) {
  const dir = pieceDir(piece, cwd), p = readPiece(dir);
  if (!p) return null;
  const chain = readJson(path.join(dir, 'chain.json'), { parts: [] });
  const tokens = readJson(path.join(cwd, 'brand/tokens.json'), {}), set = readJson(path.join(cwd, 'brand/shader-set/set.json'), {});
  const movesDir = path.join(cwd, 'moves');
  const parts = (chain.parts ?? []).map((c) => {
    const html = c.dir ? (() => { try { return fs.readFileSync(path.join(dir, c.dir, 'scene.html'), 'utf8'); } catch { return ''; } })() : '';
    return {
      dir: c.dir, id: c.id, name: c.name ?? c.id, what: c.what ?? '', seconds: c.seconds ?? null, join: c.join ?? chain.join ?? 'whip',
      texts: sceneTexts(html), clip: c.id ? `${SITE}/previews/${c.id}.webm` : null,
      draft: c.dir ? fileUrl(cwd, path.join(dir, 'drafts', `${c.dir}.mp4`)) : null,
      ...(p.parts?.[c.dir] ?? { status: 'queued' }),
    };
  });
  const renders = path.join(dir, 'renders'), name = path.basename(dir), film = filmState(cwd, dir);
  const outputs = fs.existsSync(renders) ? fs.readdirSync(renders).filter((f) => !f.startsWith('.') && !f.includes('-draft')).map((f) => ({ file: f, url: fileUrl(cwd, path.join(renders, f)), bytes: fs.statSync(path.join(renders, f)).size })) : [];
  return {
    ...p, boards: p.boards ?? [], dir: path.relative(cwd, dir), format: chain.format ?? null, join: chain.join ?? 'whip', joins: Object.keys(JOINS),
    parts,
    look: {
      colors: Object.entries(tokens.colors ?? {}).map(([k, v]) => [k, v?.hex ?? v]),
      fonts: Object.entries(tokens.fonts ?? {}).map(([k, v]) => [k, v?.family ?? v, v?.css ?? null]),
      backgrounds: (set.entries ?? []).map((e) => e.id),
      moves: fs.existsSync(movesDir) ? fs.readdirSync(movesDir).filter((f) => f.endsWith('.js')).map((f) => f.replace(/\.js$/, '')) : [],
    },
    media: { assembly: fileUrl(cwd, path.join(renders, `${name}-draft.mp4`)), final: fileUrl(cwd, path.join(renders, `${name}.mp4`)), outputs,
      assemblyStale: film.assemblyStale, finalStale: film.finalStale, error: joinErrors.get(dir) ?? null },
    job: film.job,
    ask: p.ask ?? null,
    // is a command of the agent waiting on this piece, how many of the user's moves it hasn't read, and the way back to it
    agent: { listening: !!listening(dir), app: p.agent?.app ?? null, focus: process.platform === 'darwin' && !!p.agent?.path, url: p.agent?.url ?? null },
    unread: p.events.filter((e) => e.n > (p.seen ?? 0)).length,
  };
}

// boards still waiting: ask the site (at most every 4 s per board) whether the user chose, so the studio shows it
const asked = new Map();
async function refreshBoards(cwd, piece) {
  const dir = pieceDir(piece, cwd), p = readPiece(dir);
  for (const b of p?.boards ?? []) {
    if (b.status !== 'waiting' || !b.id || Date.now() - (asked.get(b.id) ?? 0) < 4000) continue;
    asked.set(b.id, Date.now());
    try {
      const res = await fetch(`${SITE}/api/boards/${b.id}/choice`, { signal: AbortSignal.timeout(2500) });
      if (res.status === 200) { const { line } = await res.json(); updatePiece(dir, (q) => { const x = q.boards.find((y) => y.id === b.id); if (x) { x.status = 'chosen'; x.line = line; } }); }
    } catch { /* offline: the agent's own wait still gets it */ }
  }
}

// ── actions from the page ───────────────────────────────────────────────────────────────────
function act(cwd, piece, a, queue) {
  const dir = pieceDir(piece, cwd), chainFile = path.join(dir, 'chain.json');
  const chain = () => readJson(chainFile, { parts: [] }), saveChain = (c) => fs.writeFileSync(chainFile, JSON.stringify(c, null, 2) + '\n');
  const text = (v) => String(v ?? '').trim();
  const film = filmState(cwd, dir), past = (p, stage) => STAGES.indexOf(p.stage) > STAGES.indexOf(stage);
  let rerender = null, keep = false;
  // an edit by hand re-renders a part; one that was approved, in a piece already past Parts, stays approved
  const redo = (p, part) => { keep = p.parts[part]?.status === 'approved' && past(p, 'parts'); p.parts[part] = { ...(p.parts[part] ?? {}), status: 'queued' }; rerender = part; };
  updatePiece(dir, (p) => {
    switch (a.type) {
      case 'approve': {   // a stage
        if (!STAGES.includes(a.stage)) throw new Error('bad stage');
        if (a.stage === 'parts' && Object.values(p.parts).some((x) => x.status !== 'approved')) throw new Error('approve every part first');
        // never approve a film that no longer shows the piece as it is
        if (['assembly', 'final'].includes(a.stage)) {
          if (film.job?.kind === a.stage || film[`${a.stage}Stale`]) throw new Error('this video is being updated: wait for the new one');
          if (Object.values(p.parts).some((x) => ['changes', 'queued', 'rendering'].includes(x.status))) throw new Error('a part is still changing: wait for the new video');
        }
        p.stages[a.stage] = { status: 'approved', at: new Date().toISOString() };
        const next = STAGES[STAGES.indexOf(a.stage) + 1];
        if (next) { p.stage = next; if (p.stages[next].status === 'pending') p.stages[next] = { status: 'working', since: new Date().toISOString() }; }
        addEvent(p, { kind: 'approve', stage: a.stage });
        break;
      }
      case 'changes': {   // a stage, or a part when a.part
        const t = text(a.text); if (!t) throw new Error('say what to change');
        if (a.part) { p.parts[a.part] = { ...(p.parts[a.part] ?? {}), status: 'changes', note: t }; addEvent(p, { kind: 'changes', stage: 'parts', part: a.part, text: t }); }
        else { p.stages[a.stage] = { status: 'changes', note: t, since: new Date().toISOString() }; p.stage = a.stage; addEvent(p, { kind: 'changes', stage: a.stage, text: t }); }
        break;
      }
      case 'reopen': { p.stages[a.stage] = { status: 'review' }; addEvent(p, { kind: 'reopen', stage: a.stage }); break; }
      case 'approve-part': { p.parts[a.part] = { ...(p.parts[a.part] ?? {}), status: 'approved', note: undefined }; addEvent(p, { kind: 'approve', stage: 'parts', part: a.part }); break; }
      case 'brief': {
        if (!BRIEF_KEYS.includes(a.key)) throw new Error('bad brief key');
        const t = text(a.value); if (t === p.brief[a.key]) break;
        p.brief[a.key] = t;
        // an approved brief that changes comes back for the user to confirm
        if (p.stages.brief.status === 'approved') p.stages.brief = { status: 'review', note: 'edited by hand' };
        addEvent(p, { kind: 'edit', stage: 'brief', key: a.key, text: t });
        break;
      }
      case 'what': {   // a part's description: a note for the agent, kept in chain.json
        const c = chain(), part = c.parts.find((x) => x.dir === a.part); if (!part) throw new Error('no such part');
        part.what = text(a.value); saveChain(c);
        addEvent(p, { kind: 'edit', stage: 'parts', part: a.part, key: 'what', text: part.what });
        break;
      }
      case 'text': {   // a word on screen: straight into the scene's CONFIG, then a fresh draft
        const f = path.join(dir, a.part, 'scene.html');
        fs.writeFileSync(f, setSceneText(fs.readFileSync(f, 'utf8'), a.key, text(a.value)));
        redo(p, a.part);
        addEvent(p, { kind: 'edit', stage: 'parts', part: a.part, key: a.key, text: text(a.value), rerendered: true });
        break;
      }
      case 'seconds':
      case 'join': {
        const c = chain(), part = c.parts.find((x) => x.dir === a.part); if (!part) throw new Error('no such part');
        if (a.type === 'seconds') {
          const n = Number(a.value);
          if (!String(a.value ?? '').trim() || !Number.isFinite(n)) throw new Error('give a length in seconds');
          part.seconds = Math.max(0.5, Math.min(30, n)); redo(p, a.part);
        }
        else { if (!(a.value in JOINS)) throw new Error('bad join'); part.join = a.value; }
        saveChain(c);
        addEvent(p, { kind: 'edit', stage: 'parts', part: a.part, key: a.type, text: String(a.type === 'seconds' ? part.seconds : part.join), rerendered: a.type === 'seconds' });
        break;
      }
      case 'order': {
        const c = chain(), by = new Map(c.parts.map((x) => [x.dir, x]));
        if (a.order.length !== c.parts.length || a.order.some((d) => !by.has(d))) throw new Error('bad order');
        c.parts = a.order.map((d) => by.get(d)); saveChain(c);
        addEvent(p, { kind: 'order', stage: 'parts', text: a.order.join(',') });
        break;
      }
      default: throw new Error(`unknown action ${a.type}`);
    }
  });
  // An edit by hand changes what the joined video shows. A draft that exists is joined again here, by the studio
  // (no judgment needed, so no waiting for the agent). The full-quality final is the agent's: it goes back to it.
  if (['text', 'order', 'seconds', 'join'].includes(a.type)) {
    updatePiece(dir, (p) => {
      const ev = p.events.at(-1);
      if (film.draft) ev.rejoined = true;
      if (p.stages.final.status !== 'pending') {   // the final was reached: it no longer shows the piece
        p.stages.final = { status: 'changes', note: 'You edited the piece by hand, so the final needs a new render.', since: new Date().toISOString() };
        ev.refinal = true;
      }
    });
    joinErrors.delete(dir);
  }
  if (rerender) queue.part(piece, rerender, keep);
  if (film.draft && ['text', 'order', 'seconds', 'join'].includes(a.type)) queue.join(piece);
  const p = readPiece(dir);
  return { ok: true, line: eventLine(p, p.events.at(-1)) };
}

/**
 * The studio's own renders after an edit by hand, one at a time: parts first (each as a draft), then, once no part
 * is left, the joined draft again with the sound it was made with. The engine needs no agent for either.
 */
function renderQueue(cwd, log) {
  const parts = [], joins = new Set();
  let busy = false;
  const next = async () => {
    if (busy || (!parts.length && !joins.size)) return;
    busy = true;
    const chainLib = await import('./chain.mjs');
    if (parts.length) {
      const [piece, part, keep] = parts.shift(), dir = pieceDir(piece, cwd);
      try {
        await chainLib.renderDrafts({ cwd, piece, only: [part] });
        if (keep) updatePiece(dir, (p) => { if (p.parts[part]?.status === 'review' && !p.parts[part].error) p.parts[part].status = 'approved'; });
        log(`re-rendered ${piece}/${part}`);
      } catch (e) { log(`✗ ${piece}/${part}: ${e.message}`); }
    } else {
      const piece = joins.values().next().value, dir = pieceDir(piece, cwd);
      joins.delete(piece);
      try {
        // a join the agent already started covers this edit only if it began after it: wait for it, then look again
        while (chainLib.readJob(dir)?.kind === 'assembly') await new Promise((r) => setTimeout(r, 1000));
        const film = filmState(cwd, dir);
        if (film.assemblyStale || !film.opts.sig) {
          await chainLib.renderChain({ cwd, piece, draft: true, sfx: film.opts.sfx ?? true, audio: film.opts.audio });
          log(`joined ${piece} again`);
        }
        joinErrors.delete(dir);
      } catch (e) {
        // the studio could not: say so on the page and hand the join to the agent
        const why = String(e.message ?? e).split('\n')[0].slice(0, 240);
        log(`✗ join ${piece}: ${why}`);
        joinErrors.set(dir, why);
        try { updatePiece(dir, (p) => { addEvent(p, { kind: 'failed', stage: 'assembly', text: why, rejoin: true }); }); } catch { /* the piece is gone */ }
      }
    }
    busy = false; next();
  };
  return {
    part: (piece, part, keep = false) => { if (!parts.some(([a, b]) => a === piece && b === part)) parts.push([piece, part, keep]); next(); },
    join: (piece) => { joins.add(piece); next(); },
  };
}

function sendFile(req, res, f) {
  const st = fs.statSync(f), type = TYPES[path.extname(f).toLowerCase()] ?? 'application/octet-stream';
  const range = req.headers.range?.match(/bytes=(\d*)-(\d*)/);
  if (range) {
    const start = range[1] ? Number(range[1]) : 0, end = range[2] ? Number(range[2]) : st.size - 1;
    res.writeHead(206, { 'Content-Type': type, 'Content-Range': `bytes ${start}-${end}/${st.size}`, 'Accept-Ranges': 'bytes', 'Content-Length': end - start + 1, 'Cache-Control': 'no-cache' });
    fs.createReadStream(f, { start, end }).pipe(res);
  } else {
    res.writeHead(200, { 'Content-Type': type, 'Content-Length': st.size, 'Accept-Ranges': 'bytes', 'Cache-Control': 'no-cache' });
    fs.createReadStream(f).pipe(res);
  }
}

export function startStudio({ cwd = process.cwd(), port = 4317, log = console.log } = {}) {
  const queue = renderQueue(cwd, log);
  const json = (res, code, body) => { res.writeHead(code, { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' }); res.end(JSON.stringify(body)); };
  const server = http.createServer(async (req, res) => {
    const u = new URL(req.url, 'http://x');
    try {
      if (u.pathname === '/' || u.pathname === '/index.html') { res.writeHead(200, { 'Content-Type': TYPES['.html'], 'Cache-Control': 'no-store' }); return res.end(fs.readFileSync(PAGE)); }
      if (u.pathname.startsWith('/fonts/')) {   // the studio's own typefaces, served locally so it works offline
        const f = path.join(path.dirname(PAGE), 'fonts', path.basename(u.pathname));
        if (!fs.existsSync(f)) { res.writeHead(404); return res.end(); }
        res.writeHead(200, { 'Content-Type': TYPES[path.extname(f)] ?? 'application/octet-stream', 'Cache-Control': 'max-age=86400' });
        return res.end(fs.readFileSync(f));
      }
      if (u.pathname === '/api/pieces') return json(res, 200, listPieces(cwd));
      if (u.pathname === '/api/info') return json(res, 200, { app: 'paper-motion-studio', cwd: path.resolve(cwd), pid: process.pid });
      if (u.pathname === '/api/piece') {
        const piece = u.searchParams.get('p');
        if (req.method === 'POST') {
          let body = ''; for await (const c of req) body += c;
          try { return json(res, 200, act(cwd, piece, JSON.parse(body || '{}'), queue)); } catch (e) { return json(res, 400, { error: e.message }); }
        }
        await refreshBoards(cwd, piece);
        const v = view(cwd, piece);
        return v ? json(res, 200, v) : json(res, 404, { error: `no piece "${piece}"` });
      }
      if (u.pathname === '/api/focus' && req.method === 'POST') {
        // back to the agent: the app its CLI runs in, as recorded in piece.json by that CLI
        const app = readPiece(pieceDir(u.searchParams.get('p') ?? '', cwd))?.agent?.path;
        if (process.platform !== 'darwin' || !app || !app.endsWith('.app') || !fs.existsSync(app)) return json(res, 400, { error: 'no app to open' });
        const { spawn } = await import('node:child_process');
        spawn('open', ['-a', app], { detached: true, stdio: 'ignore' }).on('error', () => {}).unref();
        return json(res, 200, { ok: true });
      }
      if (u.pathname.startsWith('/files/')) {
        const f = path.resolve(cwd, decodeURIComponent(u.pathname.slice(7)));
        if (!f.startsWith(path.resolve(cwd) + path.sep) || !fs.existsSync(f) || fs.statSync(f).isDirectory()) { res.writeHead(404); return res.end(); }
        return sendFile(req, res, f);
      }
      res.writeHead(404); res.end();
    } catch (e) { json(res, 500, { error: e.message }); }
  });
  return new Promise((resolve, reject) => {
    server.on('error', reject);
    server.listen(port, '127.0.0.1', () => resolve({ server, port: server.address().port, close: () => new Promise((r) => server.close(r)) }));
  });
}

// ── one studio per project, in the background ─────────────────────────────────────────────────
const FIRST_PORT = 4317, LAST_PORT = 4336;
async function probe(port) {
  try {
    const r = await fetch(`http://127.0.0.1:${port}/api/info`, { signal: AbortSignal.timeout(800) });
    return r.ok ? await r.json() : { busy: true };
  } catch (e) { return e?.cause?.code === 'ECONNREFUSED' ? null : { busy: true }; }
}

/** The studio serving this project, if one is running: { port, url }. */
export async function findStudio(cwd = process.cwd()) {
  for (let port = FIRST_PORT; port <= LAST_PORT; port++) {
    const info = await probe(port);
    if (info?.app === 'paper-motion-studio' && info.cwd === path.resolve(cwd)) return { port, url: `http://127.0.0.1:${port}/`, pid: info.pid };
  }
  return null;
}

/**
 * Makes sure this project has a studio running: reuses it, or starts one detached (it outlives the command, so the
 * user's page keeps working between the agent's steps) on the first free port. `pamo studio --stop` ends it.
 */
export async function ensureStudio(cwd = process.cwd(), { bin } = {}) {
  const found = await findStudio(cwd);
  if (found) return { ...found, started: false };
  let port = FIRST_PORT;
  while (port <= LAST_PORT && (await probe(port))) port++;
  if (port > LAST_PORT) throw new Error(`no free port between ${FIRST_PORT} and ${LAST_PORT} for the studio`);
  const { spawn } = await import('node:child_process');
  const child = spawn(process.execPath, [bin, 'studio', '--port', String(port)], { cwd, detached: true, stdio: 'ignore' });
  child.unref();
  for (let i = 0; i < 40; i++) {
    await new Promise((res) => setTimeout(res, 150));
    const info = await probe(port);
    if (info?.app === 'paper-motion-studio') return { port, url: `http://127.0.0.1:${port}/`, pid: info.pid, started: true };
  }
  throw new Error(`the studio didn't start on port ${port} (run: npx paper-motion studio --port ${port})`);
}

/** Opens a URL in the user's browser (macOS, Windows, Linux); quietly does nothing where it can't. */
export async function openInBrowser(url) {
  if (process.env.CI || process.env.PAPER_MOTION_NO_OPEN) return false;
  const { spawn } = await import('node:child_process');
  const [cmd, args] = process.platform === 'darwin' ? ['open', [url]] : process.platform === 'win32' ? ['cmd', ['/c', 'start', '', url]] : ['xdg-open', [url]];
  try { spawn(cmd, args, { detached: true, stdio: 'ignore' }).on('error', () => {}).unref(); return true; } catch { return false; }
}
