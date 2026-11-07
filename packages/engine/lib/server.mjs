// Static server for scenes. Injects an import map so scenes can
// `import { scene } from 'paper-motion'` with no bundler, and live-reloads
// previews when files change.
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ENGINE = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

const MIME = {
  '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.mjs': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8', '.json': 'application/json', '.svg': 'image/svg+xml', '.png': 'image/png',
  '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.webp': 'image/webp', '.gif': 'image/gif', '.avif': 'image/avif',
  '.woff': 'font/woff', '.woff2': 'font/woff2', '.ttf': 'font/ttf', '.otf': 'font/otf',
  '.mp4': 'video/mp4', '.webm': 'video/webm', '.mov': 'video/quicktime', '.mp3': 'audio/mpeg', '.wav': 'audio/wav', '.map': 'application/json',
};

const IMPORT_MAP = {
  imports: {
    'paper-motion': '/__pm/runtime/index.js',
    '@paper-design/shaders': '/__pm/node_modules/@paper-design/shaders/dist/index.js',
    '@paper-design/shaders-react': '/__pm/node_modules/@paper-design/shaders-react/dist/index.js',
    react: '/__pm/runtime/react-shim.js',
    'react/jsx-runtime': '/__pm/runtime/jsx-shim.js',
  },
};

const RELOAD_CLIENT = `<script>(()=>{if(location.search.includes('render'))return;
const es=new EventSource('/__pm/events');es.onmessage=()=>location.reload();})();</script>`;

export function startServer({ root, port = 0, watch = false }) {
  const clients = new Set();
  const server = http.createServer((req, res) => {
    const url = new URL(req.url, 'http://x');
    let p = decodeURIComponent(url.pathname);
    if (p === '/__pm/events') {
      res.writeHead(200, { 'content-type': 'text/event-stream', 'cache-control': 'no-cache', connection: 'keep-alive' });
      res.write(': ok\n\n');
      clients.add(res);
      req.on('close', () => clients.delete(res));
      return;
    }
    if (p === '/favicon.ico') { res.writeHead(204).end(); return; }
    let file;
    if (p.startsWith('/__pm/runtime/')) file = path.join(ENGINE, 'runtime', p.slice('/__pm/runtime/'.length));
    else if (p.startsWith('/__pm/node_modules/')) file = path.join(ENGINE, 'node_modules', p.slice('/__pm/node_modules/'.length));
    else file = path.join(root, p);
    const base = p.startsWith('/__pm/') ? ENGINE : root;
    if (!path.resolve(file).startsWith(path.resolve(base))) { res.writeHead(403).end(); return; }
    fs.stat(file, (err, st) => {
      if (!err && st.isDirectory()) { file = path.join(file, 'index.html'); }
      fs.readFile(file, (e, buf) => {
        if (e) { res.writeHead(404, { 'content-type': 'text/plain' }).end(`not found: ${p}`); return; }
        const ext = path.extname(file).toLowerCase();
        const headers = { 'content-type': MIME[ext] ?? 'application/octet-stream', 'cache-control': 'no-store', 'access-control-allow-origin': '*' };
        if (ext === '.html') {
          let html = buf.toString('utf8');
          const inject = `<script type="importmap">${JSON.stringify(IMPORT_MAP)}</script>${watch ? RELOAD_CLIENT : ''}`;
          html = /<head[^>]*>/i.test(html) ? html.replace(/<head[^>]*>/i, (m) => m + inject) : inject + html;
          res.writeHead(200, headers).end(html);
        } else res.writeHead(200, headers).end(buf);
      });
    });
  });

  if (watch) {
    let timer;
    try {
      fs.watch(root, { recursive: true }, (_e, f) => {
        if (!f || /(^|[\\/])(node_modules|renders|stills|\.git)([\\/]|$)/.test(f) || /\.(mp4|mov|webm|gif)$/.test(f)) return;
        clearTimeout(timer);
        timer = setTimeout(() => { for (const c of clients) c.write('data: reload\n\n'); }, 120);
      });
    } catch { /* recursive watch unsupported: no live reload */ }
  }

  return new Promise((resolve) => {
    server.listen(port, '127.0.0.1', () => resolve({ server, port: server.address().port, close: () => new Promise((r) => { for (const c of clients) c.end(); server.close(r); }) }));
  });
}
