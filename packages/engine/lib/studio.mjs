// pamo studio: a local page where the user follows a piece through its stages, watches each stage's renders,
// approves or asks for changes, and edits the brief, the words on screen, lengths, joins and order by hand.
//
//   GET  /                         the studio page (studio/index.html)
//   GET  /api/pieces               pieces in this project that have a piece.json
//   GET  /api/piece?p=<piece>      everything the page shows: piece.json + chain + look + media
//   POST /api/piece?p=<piece>      an action: { type, … } (see act())
//   GET  /files/<path>             files under the project (renders, drafts), with byte ranges for video
//
// Edits that need no judgment are applied here: a text goes into the part's CONFIG and the part re-renders as a
// draft; lengths, joins and order go into chain.json. Everything the user does is also an event in piece.json,
// which `pamo piece review` hands to the agent.
import fs from 'node:fs';
import http from 'node:http';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { pieceDir, JOINS } from './chain.mjs';
import { STAGES, BRIEF_KEYS, readPiece, updatePiece, addEvent, eventLine, sceneTexts, setSceneText } from './piece.mjs';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const PAGE = path.join(HERE, '..', 'studio', 'index.html');
const SITE = (process.env.PAPER_MOTION_SITE ?? 'https://paper-motion.vercel.app').replace(/\/$/, '');
const TYPES = { '.mp4': 'video/mp4', '.webm': 'video/webm', '.mov': 'video/quicktime', '.gif': 'image/gif', '.png': 'image/png', '.jpg': 'image/jpeg', '.json': 'application/json', '.html': 'text/html; charset=utf-8', '.css': 'text/css', '.js': 'text/javascript' };
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
  const renders = path.join(dir, 'renders'), name = path.basename(dir);
  const outputs = fs.existsSync(renders) ? fs.readdirSync(renders).filter((f) => !f.startsWith('.') && !f.includes('-draft')).map((f) => ({ file: f, url: fileUrl(cwd, path.join(renders, f)), bytes: fs.statSync(path.join(renders, f)).size })) : [];
  return {
    ...p, dir: path.relative(cwd, dir), format: chain.format ?? null, join: chain.join ?? 'whip', joins: Object.keys(JOINS),
    parts,
    look: {
      colors: Object.entries(tokens.colors ?? {}).map(([k, v]) => [k, v?.hex ?? v]),
      fonts: Object.entries(tokens.fonts ?? {}).map(([k, v]) => [k, v?.family ?? v]),
      backgrounds: (set.entries ?? []).map((e) => e.id),
      moves: fs.existsSync(movesDir) ? fs.readdirSync(movesDir).filter((f) => f.endsWith('.js')).map((f) => f.replace(/\.js$/, '')) : [],
    },
    media: { assembly: fileUrl(cwd, path.join(renders, `${name}-draft.mp4`)), final: fileUrl(cwd, path.join(renders, `${name}.mp4`)), outputs },
  };
}

// ── actions from the page ───────────────────────────────────────────────────────────────────
function act(cwd, piece, a, queue) {
  const dir = pieceDir(piece, cwd), chainFile = path.join(dir, 'chain.json');
  const chain = () => readJson(chainFile, { parts: [] }), saveChain = (c) => fs.writeFileSync(chainFile, JSON.stringify(c, null, 2) + '\n');
  const text = (v) => String(v ?? '').trim();
  let rerender = null;
  updatePiece(dir, (p) => {
    switch (a.type) {
      case 'approve': {   // a stage
        if (!STAGES.includes(a.stage)) throw new Error('bad stage');
        if (a.stage === 'parts' && Object.values(p.parts).some((x) => x.status !== 'approved')) throw new Error('approve every part first');
        p.stages[a.stage] = { status: 'approved', at: new Date().toISOString() };
        const next = STAGES[STAGES.indexOf(a.stage) + 1];
        if (next) { p.stage = next; if (p.stages[next].status === 'pending') p.stages[next] = { status: 'working' }; }
        addEvent(p, { kind: 'approve', stage: a.stage });
        break;
      }
      case 'changes': {   // a stage, or a part when a.part
        const t = text(a.text); if (!t) throw new Error('say what to change');
        if (a.part) { p.parts[a.part] = { ...(p.parts[a.part] ?? {}), status: 'changes', note: t }; addEvent(p, { kind: 'changes', stage: 'parts', part: a.part, text: t }); }
        else { p.stages[a.stage] = { status: 'changes', note: t }; p.stage = a.stage; addEvent(p, { kind: 'changes', stage: a.stage, text: t }); }
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
        p.parts[a.part] = { ...(p.parts[a.part] ?? {}), status: 'queued' };
        addEvent(p, { kind: 'edit', stage: 'parts', part: a.part, key: a.key, text: text(a.value), rerendered: true });
        rerender = a.part;
        break;
      }
      case 'seconds':
      case 'join': {
        const c = chain(), part = c.parts.find((x) => x.dir === a.part); if (!part) throw new Error('no such part');
        if (a.type === 'seconds') { part.seconds = Math.max(0.5, Math.min(30, Number(a.value))); rerender = a.part; p.parts[a.part] = { ...(p.parts[a.part] ?? {}), status: 'queued' }; }
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
  // in Assembly, a new order, length or join means the joined version is stale: hand it back to the agent
  if (['order', 'seconds', 'join'].includes(a.type)) updatePiece(dir, (p) => {
    if (p.stage !== 'assembly') return;
    p.stages.assembly = { status: 'changes', note: 'edited by hand: join the parts again' };
    p.events.at(-1).rejoin = true;
  });
  if (rerender) queue(piece, rerender);
  const p = readPiece(dir);
  return { ok: true, line: eventLine(p, p.events.at(-1)) };
}

/** One part at a time re-renders as a draft after an edit (the engine needs no agent for that). */
function renderQueue(cwd, log) {
  const q = [];
  let busy = false;
  const next = async () => {
    if (busy || !q.length) return;
    busy = true;
    const [piece, part] = q.shift();
    try {
      const { renderDrafts } = await import('./chain.mjs');
      await renderDrafts({ cwd, piece, only: [part] });
      log(`re-rendered ${piece}/${part}`);
    } catch (e) { log(`✗ ${piece}/${part}: ${e.message}`); }
    busy = false; next();
  };
  return (piece, part) => { if (!q.some(([a, b]) => a === piece && b === part)) q.push([piece, part]); next(); };
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
      if (u.pathname === '/api/pieces') return json(res, 200, listPieces(cwd));
      if (u.pathname === '/api/piece') {
        const piece = u.searchParams.get('p');
        if (req.method === 'POST') {
          let body = ''; for await (const c of req) body += c;
          try { return json(res, 200, act(cwd, piece, JSON.parse(body || '{}'), queue)); } catch (e) { return json(res, 400, { error: e.message }); }
        }
        const v = view(cwd, piece);
        return v ? json(res, 200, v) : json(res, 404, { error: `no piece "${piece}"` });
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
