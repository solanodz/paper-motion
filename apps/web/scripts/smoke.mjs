#!/usr/bin/env node
// Smoke test for a deployed (or local) paper-motion site: every page, every
// agent-facing file and every published preview must answer 200.
//
//   node scripts/smoke.mjs                       # https://paper-motion.vercel.app
//   node scripts/smoke.mjs http://localhost:3000
//   PAPER_MOTION_SITE=https://… node scripts/smoke.mjs
//
// Exits 1 and lists the failures when anything is missing.

const base = (process.argv[2] || process.env.PAPER_MOTION_SITE || 'https://paper-motion.vercel.app').replace(/\/$/, '');
const CONCURRENCY = 12;

const index = await fetch(`${base}/registry.json`).then((r) => {
  if (!r.ok) throw new Error(`${base}/registry.json → ${r.status}`);
  return r.json();
});

const urls = new Set(['/', '/library', '/kit', '/kit/brand', '/docs', '/b', '/llms.txt', '/llms-full.txt', '/registry.json', '/site/og.png']);
for (const t of index.types || []) urls.add(`/library?type=${encodeURIComponent(t)}`);
for (const it of index.items) {
  urls.add(`/r/${it.id}`);
  urls.add(`/r/${it.id}.json`);
  for (const [k, p] of Object.entries(it.preview || {})) if (typeof p === 'string' && k !== 'at') urls.add(p.startsWith('/') ? p : `/${p}`);
}

const list = [...urls];
const failures = [];
let done = 0;
async function worker() {
  while (list.length) {
    const path = list.shift();
    try {
      const res = await fetch(base + path, { method: path.match(/\.(webm|mp4|jpg|png)$/) ? 'HEAD' : 'GET', redirect: 'follow' });
      if (!res.ok) failures.push(`${res.status}  ${path}`);
    } catch (e) {
      failures.push(`ERR  ${path}  ${e.message}`);
    }
    done++;
  }
}
await Promise.all(Array.from({ length: CONCURRENCY }, worker));

console.log(`${base}: ${done} URLs, ${index.items.length} resources, ${failures.length} failures`);
if (failures.length) {
  console.log(failures.sort().join('\n'));
  process.exit(1);
}
