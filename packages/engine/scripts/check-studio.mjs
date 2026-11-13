#!/usr/bin/env node
// The studio, end to end: a fresh project in a temp folder, the real `pamo` commands playing the agent's side, and the
// studio page driven in headless Chrome playing the user's. Prints one ✓ or ✗ per check of docs/spec-studio-v2.md's
// acceptance that is built so far; exits 1 when any fails. Never touches a real project.
//
//   node packages/engine/scripts/check-studio.mjs [--keep]      (PAMO_BIN=…/node_modules/paper-motion/bin/pamo.mjs to test an install)
//     --keep    leave the temp project (and its studio) running, and print where it is
import { spawn } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const BIN = process.env.PAMO_BIN ?? path.join(HERE, '../bin/pamo.mjs');   // PAMO_BIN: an installed package's, to test what npm ships
const flags = new Set(process.argv.slice(2));
const PIECE = 'kiln';

const results = [];
const check = (name, ok, detail = '') => { results.push({ name, ok }); console.log(`${ok ? '✓' : '✗'} ${name}${detail ? `  (${detail})` : ''}`); };
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

/** Runs pamo in the project; resolves with { code, out } when it exits. `bg` returns the child at once. */
function pamo(cwd, args, { bg = false } = {}) {
  const child = spawn(process.execPath, [BIN, ...args], { cwd, env: { ...process.env, PAMO_NO_OPEN: '1' } });
  let out = '';
  child.stdout.on('data', (d) => { out += d; });
  child.stderr.on('data', (d) => { out += d; });
  const done = new Promise((res) => child.on('exit', (code) => res({ code, out })));
  if (bg) return { child, done, out: () => out, alive: () => child.exitCode === null };
  return done;
}
async function until(fn, ms = 10000, every = 250) {
  const t0 = Date.now();
  for (;;) { try { const v = await fn(); if (v) return v; } catch { /* not yet */ } if (Date.now() - t0 > ms) return null; await sleep(every); }
}

const proj = fs.mkdtempSync(path.join(os.tmpdir(), 'pm-check-studio-'));
fs.writeFileSync(path.join(proj, 'README.md'), `# Kiln

Kiln turns your notes into a weekly report your team actually reads.

- 12,000 teams use Kiln every week
- 98% of reports are opened
`);

let browser, failed = false;
try {
  // ── the agent sets the piece up ───────────────────────────────────────────────────────────────────────────
  const init = await pamo(proj, ['piece', 'init', PIECE, '--title', 'Kiln', '--what', 'Kiln turns notes into a weekly report people read', '--who', 'team leads', '--format', '16:9, 20 s', '--tone', 'calm', '--action', 'kiln.app']);
  const url = init.out.match(/studio: (http:\/\/127\.0\.0\.1:\d+\/)/)?.[1];
  check('piece init starts the project’s studio', init.code === 0 && !!url, url ?? init.out.trim().split('\n').at(-1));
  if (!url) throw new Error('no studio');
  await pamo(proj, ['inventory', PIECE, '--from', 'README.md']);
  const inv = JSON.parse(fs.readFileSync(path.join(proj, 'pieces', PIECE, 'inventory.json'), 'utf8'));
  await pamo(proj, ['inventory', PIECE, '--keep', inv.items.map((i) => i.id).join(',')]);
  const rv = await pamo(proj, ['piece', 'review', PIECE, 'brief', '--no-wait', '--no-open']);
  check('the brief is handed to the studio', rv.code === 0);

  // ── the user opens the one address ────────────────────────────────────────────────────────────────────────
  const { launch } = await import('../lib/browser.mjs');
  browser = await launch();
  const page = await browser.newPage({ viewport: { width: 1360, height: 860 } });
  const errors = [];
  page.on('pageerror', (e) => errors.push(e.message));
  await page.goto(`${url}?p=${PIECE}`);
  const turn = () => page.evaluate(() => document.querySelector('.turn')?.innerText ?? '');
  const thread = () => page.evaluate(() => document.querySelector('#thread')?.innerText ?? '');

  // acceptance 8: the studio never says the agent listens while no command of the agent runs. Sampled all along.
  // The page asks the studio every 1.5 s, so it may lag a command's end by that much: a sample counts as a lie only
  // when no command has run for over 2 s.
  let listener = null, lies = 0, samples = 0, endedAt = 0;
  const track = (l) => { l.done.then(() => { endedAt = Date.now(); }); return l; };
  const sampler = setInterval(async () => {
    try { const t = await turn(); samples++; if (/is listening/i.test(t) && !(listener && listener.alive()) && Date.now() - endedAt > 2000) lies++; } catch { /* page busy */ }
  }, 400);

  // ── 6 · not connected → a message is Sent → the agent listens → Read ─────────────────────────────────────
  check('with no agent command running, the studio says it isn’t connected', !!(await until(async () => /isn’t connected/.test(await turn()), 6000)));
  await page.click('[data-ask]');
  await page.fill('#askText', 'Make the ending warmer');
  await page.click('[data-ask-send]');
  check('a message sent then shows Sent, kept for later', !!(await until(async () => /Make the ending warmer[\s\S]*Sent · your agent reads it when it’s back/i.test(await thread()), 5000)));
  listener = track(pamo(proj, ['piece', 'listen', PIECE, '--wait', '1'], { bg: true }));
  const heard = await listener.done;
  check('piece listen returns at once with the waiting message', heard.code === 0 && /changes: "Make the ending warmer"/.test(heard.out), heard.out.trim().split('\n')[0]);
  check('the message turns Read, with the time', !!(await until(async () => /Make the ending warmer[\s\S]*Read \d\d:\d\d/i.test(await thread()), 5000)));

  // listening, honestly: on while the command runs, off within 9 s of it ending
  listener = track(pamo(proj, ['piece', 'listen', PIECE, '--wait', '1'], { bg: true }));
  check('while piece listen runs, the studio says the agent is listening', !!(await until(async () => /is listening/i.test(await turn()), 9000)));

  // ── 7 · a question, answered in the studio, wakes the agent ──────────────────────────────────────────────
  await pamo(proj, ['piece', 'ask', PIECE, 'For the ending: the address, or a button?']);
  check('the agent’s question shows with an answer box', !!(await until(async () => (await page.$('#ansText')) && /the address, or a button/.test(await turn()), 6000)));
  await page.fill('#ansText', 'The address');
  await page.click('[data-ans-send]');
  const woke = await Promise.race([listener.done, sleep(8000).then(() => null)]);
  check('answering wakes piece listen with the answer', !!woke && /answered "For the ending: the address, or a button\?": "The address"/.test(woke.out), woke ? woke.out.trim().split('\n')[0] : 'timed out');
  check('the question is gone once answered', !!(await until(async () => !(await page.$('#ansText')), 5000)));
  check('after the command ends, the studio stops saying it listens', !!(await until(async () => !/is listening/i.test(await turn()), 11000)));

  // a question answered in the chat instead: the user closes it
  await pamo(proj, ['piece', 'ask', PIECE, 'Warmer how?']);
  await until(async () => page.$('[data-ans-chat]'), 6000);
  await page.click('[data-ans-chat]');
  check('“Answered in the chat” closes a question', !!(await until(async () => !(await page.$('#ansText')), 5000)));

  // ── replies and work in progress ─────────────────────────────────────────────────────────────────────────
  await pamo(proj, ['piece', 'say', PIECE, 'Done: the ending is warmer now.']);
  check('the agent’s reply shows in the thread', !!(await until(async () => /Done: the ending is warmer now\.[\s\S]*Your agent · \d\d:\d\d/i.test(await thread()), 5000)));
  await pamo(proj, ['piece', 'working', PIECE, 'inventory', '--on', 'new words for the ending']);
  check('piece working --on shows what the agent is doing', !!(await until(async () => /working[\s\S]*new words for the ending/i.test(await turn()), 6000)));
  listener = track(pamo(proj, ['piece', 'listen', PIECE, '--wait', '1'], { bg: true }));
  check('listening replaces working', !!(await until(async () => /is listening/i.test(await turn()), 9000)));
  listener.child.kill();
  await listener.done;
  check('a killed piece listen stops showing as listening within 2 s', !!(await until(async () => !/is listening/i.test(await turn()), 2600)));

  clearInterval(sampler);
  check('the studio never said “listening” with no command running', lies === 0, `${samples} samples`);

  // ── 1, 2, 4 · one page: content, then How it looks, chosen by watching, written to brand/ ────────────────
  const api = (body) => fetch(`${url}api/piece?p=${PIECE}`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) }).then((r) => r.json());
  const brand = (f) => { try { return JSON.parse(fs.readFileSync(path.join(proj, 'brand', f), 'utf8')); } catch { return {}; } };
  await api({ type: 'approve', stage: 'brief' });
  const ri = await pamo(proj, ['piece', 'review', PIECE, 'inventory', '--no-wait', '--no-open']);
  check('the content is handed to the studio', ri.code === 0, ri.code ? ri.out.trim().split('\n').at(-1) : '');
  await page.reload();
  const steps = await until(async () => { const t = await page.evaluate(() => document.querySelector('.steps')?.innerText ?? ''); return /What you want to say[\s\S]*How it looks[\s\S]*Your video[\s\S]*Export/.test(t) ? t : null; }, 6000);
  check('the stepper shows the four steps', !!steps);
  check('steps ahead are locked', await page.evaluate(() => document.querySelector('.steps [data-view="video"]')?.disabled === true));
  await until(async () => page.$('[data-make]'), 6000);
  await page.click('[data-make]');
  check('Next goes to How it looks, on the same page', !!(await until(async () => page.$('#lookOpts'), 6000)));
  const frameSrc = await until(async () => page.evaluate(() => document.querySelector('#lookPlayer iframe')?.src ?? ''), 12000);
  check('the look preview plays the user’s sentence live', !!frameSrc && /look\/scene\.html\?embed&look=/.test(frameSrc));
  const pal = await page.evaluate(() => [...document.querySelectorAll('[data-lpal]')].map((b) => b.dataset.lpal).find((x) => x !== 'graphite'));
  await page.hover(`[data-lpal="${pal}"]`);
  check('pointing at a palette shows it in the preview', !!(await until(async () => { const src = await page.evaluate(() => document.querySelector('#lookPlayer iframe')?.src ?? ''); return src !== frameSrc && src.includes('look='); }, 5000)));
  await page.click(`[data-lpal="${pal}"]`);
  check('choosing a palette writes brand/tokens.json', !!(await until(() => brand('tokens.json').colors?.ground, 15000)));
  const font = await page.evaluate(() => document.querySelectorAll('[data-lfont]')[2]?.dataset.lfont);
  await page.click(`[data-lfont="${font}"]`);
  check('choosing a font pair writes brand/tokens.json', !!(await until(() => brand('tokens.json').fonts?.display?.family, 15000)));
  const bg = await page.evaluate(() => document.querySelectorAll('[data-lbg]')[3]?.dataset.lbg);
  await page.click(`[data-lbg="${bg}"]`);
  check('choosing a background makes it the brand’s first', !!(await until(() => brand('shader-set/set.json').entries?.[0]?.id === bg, 20000)), bg);
  await page.click('[data-lpace="calm"]');
  await until(async () => page.$('[data-lenter="scramble"]'), 4000);
  await page.click('[data-lenter="scramble"]');
  check('pace and entrance write brand/motion.json', !!(await until(() => brand('motion.json').pace === 'calm' && brand('motion.json').entrance === 'scramble', 8000)));
  await page.click('[data-build]');
  check('Next: make my video builds the video', !!(await until(() => fs.existsSync(path.join(proj, 'pieces', PIECE, 'chain.json')), 60000)));
  check('and opens Your video', !!(await until(async () => page.evaluate(() => document.querySelector('.steps .on')?.innerText.includes('Your video')), 8000)));
  const piece = JSON.parse(fs.readFileSync(path.join(proj, 'pieces', PIECE, 'piece.json'), 'utf8'));
  check('the look stage is approved and the video is in review', piece.stages.look?.status === 'approved' && (await until(() => JSON.parse(fs.readFileSync(path.join(proj, 'pieces', PIECE, 'piece.json'), 'utf8')).stages.video?.status === 'review', 20000)));

  // ── 3 · the agent's choices come into the studio, not as links ───────────────────────────────────────────
  const board = pamo(proj, ['board', '--url', '--title', 'Colours for Kiln', '--ask', 'Which colours feel like Kiln?', '--option', 'graphite', '--note', 'as it is', '--option', 'slate-sea', '--note', 'calmer', '--option', 'clay-desert', '--wait', '1'], { bg: true });
  check('board puts the options in the studio, with no link', !!(await until(() => /in the studio, on How it looks · Colours/.test(board.out()) && !/https?:\/\/[^ ]*\/b[/#]/.test(board.out()), 8000)), board.out().trim().split('\n')[0]);
  check('the step it belongs to shows a dot', !!(await until(async () => page.$('.steps [data-view="look"] .sdot'), 6000)));
  await page.click('.steps [data-view="look"]');
  check('How it looks shows them first, as suggested by the agent', !!(await until(async () => (await page.$$('.agentsug [data-choose]')).length === 3, 6000)));
  check('while board waits, the studio says the agent is listening', /is listening/i.test(await turn()));
  await page.click('.agentsug [data-choose][data-label="B"]');
  const picked = await Promise.race([board.done, sleep(10000).then(() => null)]);
  check('picking one prints the reply line in the agent’s command', !!picked && /paper-motion: B · slate-sea/.test(picked.out), picked ? picked.out.trim().split('\n').at(-1) : 'timed out');
  check('and applies it to brand/', !!(await until(() => String(brand('tokens.json').colors?.ground?.hex ?? '').toLowerCase() === '#1c2226', 15000)));
  check('the suggestion leaves the page once chosen', !!(await until(async () => !(await page.$('.agentsug')), 6000)));

  const fonts = pamo(proj, ['board', '--url', '--title', 'Type for Kiln', '--option', 'fraunces', '--option', 'instrument', '--wait', '1'], { bg: true });
  await until(async () => page.$('.agentsug [data-none]'), 8000);
  await page.fill('.agentsug input[data-nonetext]', 'something rounder');
  await page.click('.agentsug [data-none]');
  const none = await Promise.race([fonts.done, sleep(10000).then(() => null)]);
  check('“None of these” sends what they’d rather see', !!none && /none of "Type for Kiln", something rounder/.test(none.out), none ? none.out.trim().split('\n').at(-1) : 'timed out');

  const jr = await pamo(proj, ['board', '--url', '--title', 'Between scenes', '--option', 'whip', '--option', 'crossfade', '--no-wait']);
  check('a transition goes to Your video', /on Your video/.test(jr.out) && /choice c\d+/.test(jr.out));
  const cid = jr.out.match(/choice (c\d+)/)?.[1];
  const awaiting = pamo(proj, ['board', '--await', cid, '--wait', '1'], { bg: true });
  await page.click('.steps [data-view="video"]');
  check('Your video shows the suggestion above the player', !!(await until(async () => (await page.$$('.center .agentsug [data-choose]')).length === 2, 8000)));
  await page.click('.center .agentsug [data-choose][data-label="A"]');
  const aw = await Promise.race([awaiting.done, sleep(10000).then(() => null)]);
  check('board --await prints the pick', !!aw && /paper-motion: A · whip/.test(aw.out), aw ? aw.out.trim().split('\n').at(-1) : 'timed out');

  // ── 5 · Your video as scenes: a list, real stills, the five tabs, reorder, add, undo ─────────────────────
  const chainOf = () => JSON.parse(fs.readFileSync(path.join(proj, 'pieces', PIECE, 'chain.json'), 'utf8'));
  const n0 = chainOf().parts.length;
  check('the scenes are a list, with no strip of arrows', (await page.$$('.scenes .part')).length === n0 && !(await page.$('.track .join')), `${n0} scenes`);
  check('each scene gets a still of itself', !!(await until(async () => page.evaluate(() => [...document.querySelectorAll('.scenes .part .th')].every((t) => t.style.backgroundImage.includes('.stills'))), 90000)));
  const tabs = await page.evaluate(() => [...document.querySelectorAll('.insp .tabs button')].map((b) => b.innerText.trim()).join(' · '));
  check('the panel has Text, Animation, Background, Speed, Next scene', tabs === 'Text · Animation · Background · Speed · Next scene', tabs);
  await page.click('.insp [data-tab="next"]');
  await until(async () => page.$('.insp [data-joinp="crossfade"]'), 4000);
  await page.click('.insp [data-joinp="crossfade"]');
  check('Next scene sets the transition', !!(await until(() => chainOf().parts[0].join === 'crossfade', 8000)));
  const order0 = chainOf().parts.map((x) => x.dir);
  await page.dragAndDrop('.scenes .part:nth-of-type(2)', '.scenes .part:nth-of-type(1)');
  check('dragging a scene reorders it', !!(await until(() => chainOf().parts[0].dir === order0[1], 8000)));
  await page.click('.addscn');
  await until(async () => page.$('[data-addblock]'), 5000);
  await page.click('[data-addblock]');
  check('Add a scene adds one', !!(await until(() => chainOf().parts.length === n0 + 1, 15000)));
  await page.click('[data-undo]');
  check('Undo takes it back out', !!(await until(() => chainOf().parts.length === n0, 10000)));
  // the scene plays from another origin (the scene server): mark its frame from outside, then make the page redraw
  const sceneFrame = () => page.frames().find((f) => /scene\.html\?embed/.test(f.url()));
  await until(async () => sceneFrame(), 8000);
  await sleep(2500);   // let the undo's own redraw (and any scene change it makes) settle first
  const before = sceneFrame().url();
  await sceneFrame().evaluate(() => { window.__kept = 1; });
  await pamo(proj, ['piece', 'say', PIECE, 'Still here.']);
  await until(async () => /Still here/.test(await thread()), 6000);
  await sleep(800);
  const kept = await sceneFrame()?.evaluate(() => window.__kept === 1).catch(() => false);
  check('a redraw does not reload the playing scene', kept && sceneFrame().url() === before);
  // ── 10 · light on the machine: one live preview at a time, and nothing drawn once a scene has ended ─────────
  await page.click('.scenes .part:nth-of-type(1)');
  await sleep(1500);
  check('at most one live preview on the page', (await page.$$('iframe')).filter(Boolean).length <= 1, `${(await page.$$('iframe')).length} iframe(s)`);
  const longest = Math.max(...chainOf().parts.map((x) => x.seconds ?? 6));
  await sleep(Math.min(12, longest + 2) * 1000);   // the selected scene has played once and holds its last frame
  const idle = await sceneFrame()?.evaluate(() => new Promise((res) => {
    let draws = 0, frames = 0;
    for (const C of [globalThis.WebGL2RenderingContext, globalThis.WebGLRenderingContext].filter(Boolean)) for (const m of ['drawArrays', 'drawElements']) { const o = C.prototype[m]; C.prototype[m] = function (...a) { draws++; return o.apply(this, a); }; }
    const raf = window.requestAnimationFrame; window.requestAnimationFrame = (f) => { frames++; return raf(f); };
    setTimeout(() => res({ draws, frames }), 5000);
  })).catch((e) => ({ error: e.message }));
  check('an ended scene draws nothing and runs no frame loop for 5 s', idle && idle.draws === 0 && idle.frames === 0, JSON.stringify(idle));
  await api({ type: 'inv-add', kind: 'line', fields: { text: 'Reports people actually read.' } });
  await page.click('.steps [data-view="what"]');
  check('new content offers “Add it to the video”, and nothing rebuilds by itself', !!(await until(async () => page.$('[data-addto]'), 6000)) && chainOf().parts.length === n0);

  check('no errors on the page', errors.length === 0, errors[0] ?? '');
} catch (e) {
  failed = true; console.log(`✗ the check stopped: ${e.message}`);
} finally {
  await browser?.close().catch(() => {});
  if (flags.has('--keep')) console.log(`\nkept: ${proj}`);
  else { await pamo(proj, ['studio', '--stop']); fs.rmSync(proj, { recursive: true, force: true }); }
}
const bad = results.filter((r) => !r.ok).length;
console.log(`\n${results.length - bad} of ${results.length} passed${failed ? ', then the check stopped' : ''}`);
process.exit(bad || failed ? 1 : 0);
