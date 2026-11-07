#!/usr/bin/env node
// paper-motion CLI — scaffold, preview, stills and frame-exact renders of Paper Shader scenes.
import fs from 'node:fs';
import path from 'node:path';
import { spawnSync, spawn } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const ENGINE = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
// The repo's production skill, when the engine runs from a paper-motion checkout (for `shaders --md`).
const REPO_SKILL = path.resolve(ENGINE, '..', '..', 'skills', 'make-video');

const HELP = `paper-motion — minimal, creative-directed video from code + Paper Shaders

Usage: pamo <command> [options]   (pamo = npx @paper-motion/engine, or node packages/engine/bin/pamo.mjs in the repo)

  setup                              install engine deps, check ffmpeg + browser
  doctor                             only check the environment
  new <name> [--dir works] [--format 16:9|9:16|1:1 | --size 1920x1080] [--fps 30] [--duration 10]
             [--from <example> | --piece (wired to brand/) | --still |
             --move <wipe|push|…> [--pace calm|medium|fast] [--text typing|rise|blur|track|plain] [--camera still|drift|travel]
             [--sound none|soft|crisp|airy|ambient]]
                                     create works/<name>/scene.html (+ brief.md)
  examples                           list bundled example scenes
  preview <scene.html> [--port 4317] [--no-open]
                                     live-reloading preview with a scrubber
  still <scene.html> [--t 0,2.5,5 | --count 6] [--out dir | --out file.png] [--dpr 1] [--motion-blur 8]
                                     PNG stills + contact-sheet.jpg (for critique);
                                     with one --t and --out file.png, writes just that file
  render <scene.html> [--out file] [--format mp4|hevc|prores|webm|gif|png]
         [--from s] [--to s] [--fps n] [--crf n] [--dpr 1|2] [--workers n] [--audio file]
         [--gif-width 720] [--gif-fps 24] [--no-sfx] [--motion-blur 8] [--shutter 180] [--loudness -16]
                                     frame-exact render via headless Chromium + ffmpeg
                                     (sound effects declared with s.sfx() are mixed in)
  sfx <scene.html> [--out file.wav] [--from s] [--to s]
                                     export only the synthesized sound effects
  board <a.html> <b.html> [...] [--t 2 | --clip 5] [--labels "A · calm|B · loud"] [--cols n] [--out board.png]
                                     option board for interviews: 2–6 options side by side,
                                     lettered A, B, C…; a still (.png) or short clips (.mp4).
                                     Labels split on | (or on commas when there is no |).
                                     --cols 1 stacks options full width (judge type at real size)
                                     --sequence plays the clips one after another, with their sound
                                     (for choices you hear: sound palettes, typing)
  wordmark <text> --family <name> [--css <url> | --file <font>] [--weight 400] [--tracking -0.02em]
         [--color #fff] [--size 400] [--pad 0] [--out wordmark.png]
                                     the name set in its typeface, as a transparent PNG
                                     cropped to the ink (--pad adds margin, × size)
  sheet [--brand brand] [--fresh] [--serve [--port 4317]] [--width 1440] [--no-pdf]
                                     the brand sheet: copies the template to brand/sheet/ (once;
                                     --fresh replaces it), then exports sheet.png and sheet.pdf,
                                     or serves it live with --serve
  keys <recording> [--out brand/sound/keys] [--min-gap 0.055] [--sensitivity 1]
                                     split a recording of real typing into single keystrokes;
                                     then s.sfx(t, 'key', { bank: 'brand/sound/keys' })
  sound-samples [--brand brand]       renders each cue of brand/sound.json (and a typing sample) to
                                     brand/sound/*.wav + sounds.json, for the brand sheet
  shader-set <build|boards|render> [--brand brand] [--only 3,7 | ids] [--t 2] [--motion-blur 4]
                                     the brand's shader set from brand/shader-set/set.json:
                                     build writes one scene per entry and review boards;
                                     boards renders them to PNG (12 per board, numbered);
                                     render writes each loop to renders/ and records it in set.json
  status [--brand brand]              what the brand folder has, and the next step on the main flow
  shaders [--json | --md [--out f]] [name]
                                     catalog of every Paper shader, params and presets
`;

function parse(argv) {
  const out = { _: [] };
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a.startsWith('--')) {
      const eq = a.indexOf('=');
      const k = eq < 0 ? a.slice(2) : a.slice(2, eq), v = eq < 0 ? undefined : a.slice(eq + 1);
      if (v !== undefined) out[k] = v;
      else if (argv[i + 1] && !argv[i + 1].startsWith('--')) out[k] = argv[++i];
      else out[k] = true;
    } else out._.push(a);
  }
  return out;
}

const args = parse(process.argv.slice(2));
const cmd = args._[0];

async function depsReady() {
  return fs.existsSync(path.join(ENGINE, 'node_modules/@paper-design/shaders-react')) && fs.existsSync(path.join(ENGINE, 'node_modules/playwright-core'));
}

async function ensureDeps() {
  if (await depsReady()) return;
  console.log('Installing engine dependencies (first run)…');
  const r = spawnSync('npm', ['install', '--no-audit', '--no-fund', '--legacy-peer-deps'], { cwd: ENGINE, stdio: 'inherit', shell: process.platform === 'win32' });
  if (r.status !== 0) { console.error('npm install failed in', ENGINE); process.exit(1); }
}

async function doctor() {
  let ok = true;
  const v = Number(process.versions.node.split('.')[0]);
  console.log(`${v >= 18 ? '✓' : '✗'} node ${process.versions.node}${v >= 18 ? '' : ' (need >= 18.17)'}`); ok &&= v >= 18;
  const ff = spawnSync(process.env.PAPER_MOTION_FFMPEG || 'ffmpeg', ['-version'], { encoding: 'utf8' });
  if (ff.status === 0) {
    const line = ff.stdout.split('\n')[0];
    const hasX265 = /--enable-libx265/.test(ff.stdout);
    console.log(`✓ ${line}${hasX265 ? '' : '  (no libx265: --format hevc unavailable)'}`);
  } else { ok = false; console.log('✗ ffmpeg not found — macOS: brew install ffmpeg · Ubuntu: sudo apt install ffmpeg · Windows: winget install ffmpeg'); }
  const deps = await depsReady();
  console.log(`${deps ? '✓' : '✗'} engine dependencies${deps ? '' : ' — run: setup'}`); ok &&= deps;
  if (deps) {
    const { findBrowser } = await import('../lib/browser.mjs');
    const b = findBrowser();
    console.log(`${b ? '✓' : '✗'} browser ${b ?? '— install Google Chrome or run: npx playwright-core install chromium'}`); ok &&= !!b;
  }
  return ok;
}

function sceneUrl(file, server) {
  const abs = path.resolve(file);
  if (!fs.existsSync(abs)) { console.error(`Scene not found: ${file}`); process.exit(1); }
  const root = rootFor(abs);
  const rel = path.relative(root, abs).split(path.sep).map(encodeURIComponent).join('/');
  return { root, url: (q = '') => `http://127.0.0.1:${server.port}/${rel}${q}` };
}
// Serve from the cwd when the scene lives inside it (so ../assets work), else from the scene folder.
function rootFor(abs) {
  const cwd = process.cwd();
  return abs.startsWith(cwd + path.sep) ? cwd : path.dirname(abs);
}

async function withServer(file, fn, { watch = false, port = 0 } = {}) {
  const { startServer } = await import('../lib/server.mjs');
  const abs = path.resolve(file);
  const server = await startServer({ root: rootFor(abs), port, watch });
  const { url } = sceneUrl(file, server);
  try { return await fn(url, server); } finally { if (!watch) await server.close(); }
}

const workDir = (file) => path.dirname(path.resolve(file));
const fmtTime = (s) => (s < 60 ? `${s.toFixed(1)}s` : `${Math.floor(s / 60)}m${Math.round(s % 60)}s`);

async function main() {
  switch (cmd) {
    case 'setup': {
      await ensureDeps();
      const ok = await doctor();
      if (!ok) process.exit(1);
      console.log('\nReady.');
      break;
    }
    case 'doctor': { process.exit((await doctor()) ? 0 : 1); break; }

    case 'examples': {
      const dir = path.join(ENGINE, 'examples');
      for (const d of fs.readdirSync(dir)) {
        const brief = path.join(dir, d, 'brief.md');
        const first = fs.existsSync(brief) ? fs.readFileSync(brief, 'utf8').split('\n').find((l) => l.trim() && !l.startsWith('#')) : '';
        console.log(`${d.padEnd(22)} ${first ?? ''}`);
      }
      break;
    }

    case 'new': {
      const name = args._[1];
      if (!name) { console.error('Usage: new <name>'); process.exit(1); }
      const dest = path.resolve(args.dir ?? 'works', name);
      if (fs.existsSync(dest)) { console.error(`Already exists: ${dest}`); process.exit(1); }
      const src = args.from ? path.join(ENGINE, 'examples', args.from) : path.join(ENGINE, 'templates', args.still ? 'still' : args.move ? 'move-demo' : args.piece ? 'piece' : 'blank');
      if (!fs.existsSync(src)) { console.error(`No example "${args.from}". Run: examples`); process.exit(1); }
      fs.cpSync(src, dest, { recursive: true });
      if (args.still || args.move) fs.rmSync(path.join(dest, 'brief.md'), { force: true }); // options for a board need no brief
      const scene = path.join(dest, 'scene.html');
      let html = fs.readFileSync(scene, 'utf8');
      const FORMATS = { '16:9': '1920x1080', '9:16': '1080x1920', '1:1': '1080x1080', '4:5': '1080x1350' };
      const size = args.size ?? (args.format ? FORMATS[String(args.format)] : null);
      if (args.format && !FORMATS[String(args.format)]) { console.error(`Unknown --format ${args.format}: use ${Object.keys(FORMATS).join(', ')}`); process.exit(1); }
      if (size) { const [w, h] = String(size).split('x').map(Number); html = html.replace(/const W = \d+, H = \d+/, `const W = ${w}, H = ${h}`).replace(/width:\s*\d+/, `width: ${w}`).replace(/height:\s*\d+/, `height: ${h}`); }
      if (args.fps) html = html.replace(/fps:\s*\d+/, `fps: ${Number(args.fps)}`);
      if (args.duration) html = html.replace(/duration:\s*[\d.]+/, `duration: ${Number(args.duration)}`);
      html = html.replace(/<title>[^<]*<\/title>/, `<title>${name}</title>`);
      if (args.move) for (const [k, v] of [['MOVE', args.move], ['PACE', args.pace], ['TEXT', args.text], ['CAMERA', args.camera], ['SOUND', args.sound]]) if (typeof v === 'string') html = html.replace(new RegExp(`const ${k} = '[^']*'`), `const ${k} = '${v}'`);
      fs.writeFileSync(scene, html);
      console.log(`Created ${path.relative(process.cwd(), dest)}/\n  scene.html  ← the piece (pure function of time)\n  brief.md    ← the creative direction, kept in sync with the user`);
      break;
    }

    case 'preview': {
      await ensureDeps();
      const file = args._[1];
      if (!file) { console.error('Usage: preview <scene.html>'); process.exit(1); }
      const port = Number(args.port ?? 4317);
      const { startServer } = await import('../lib/server.mjs');
      const abs = path.resolve(file);
      let server;
      try { server = await startServer({ root: rootFor(abs), port, watch: true }); }
      catch { server = await startServer({ root: rootFor(abs), port: 0, watch: true }); }
      const { url } = sceneUrl(file, server);
      console.log(`Preview: ${url()}\n(space play/pause · ←/→ frame · shift+←/→ 1s · L loop · H hide UI) — live-reloads on save. Ctrl+C to stop.`);
      if (!args['no-open']) {
        const opener = process.platform === 'darwin' ? 'open' : process.platform === 'win32' ? 'start' : 'xdg-open';
        spawn(opener, [url()], { stdio: 'ignore', detached: true, shell: process.platform === 'win32' }).unref();
      }
      break;
    }

    case 'still':
    case 'stills': {
      await ensureDeps();
      const file = args._[1];
      if (!file) { console.error('Usage: still <scene.html> [--t 0,1.5] [--count 6]'); process.exit(1); }
      const { renderStills } = await import('../lib/render.mjs');
      const times = args.t !== undefined ? String(args.t).split(',').map(Number) : null;
      const toFile = typeof args.out === 'string' && /\.png$/i.test(args.out);
      if (toFile && times?.length !== 1) { console.error('still: --out file.png needs exactly one --t'); process.exit(1); }
      const os = await import('node:os');
      const outDir = toFile ? fs.mkdtempSync(path.join(os.tmpdir(), 'pm-still-')) : path.resolve(args.out ?? path.join(workDir(file), 'stills'));
      const r = await withServer(file, (url) => renderStills({ url: url('?render'), times, count: args.count ? Number(args.count) : undefined, outDir, dpr: Number(args.dpr ?? 1), sheet: !args['no-sheet'], motionBlur: args['motion-blur'] ? Number(args['motion-blur'] === true ? 8 : args['motion-blur']) : 1, shutter: args.shutter ? Number(args.shutter) : 180 }));
      if (toFile) { const dest = path.resolve(args.out); fs.mkdirSync(path.dirname(dest), { recursive: true }); fs.copyFileSync(r.files[0], dest); fs.rmSync(outDir, { recursive: true, force: true }); r.files = [dest]; }
      for (const f of r.files) console.log(path.relative(process.cwd(), f));
      if (r.sheet) console.log(`contact sheet: ${path.relative(process.cwd(), r.sheet)}`);
      break;
    }

    case 'render': {
      await ensureDeps();
      const file = args._[1];
      if (!file) { console.error('Usage: render <scene.html> [--out file] [--format mp4]'); process.exit(1); }
      const { renderVideo } = await import('../lib/render.mjs');
      const format = args.format ?? (args.out ? path.extname(args.out).slice(1).replace('mov', 'prores') || 'mp4' : 'mp4');
      const ext = { mp4: 'mp4', hevc: 'mp4', prores: 'mov', webm: 'webm', gif: 'gif', png: 'png' }[format] ?? 'mp4';
      const base = path.basename(path.dirname(path.resolve(file)));
      const out = path.resolve(args.out ?? path.join(workDir(file), 'renders', `${base}${format === 'hevc' ? '-hevc' : ''}.${ext}`));
      let lastPrint = 0;
      const r = await withServer(file, (url) => renderVideo({
        url: url('?render'), out, format,
        workers: args.workers ? Number(args.workers) : undefined,
        dpr: Number(args.dpr ?? 1),
        from: args.from !== undefined ? Number(args.from) : undefined,
        to: args.to !== undefined ? Number(args.to) : undefined,
        fps: args.fps ? Number(args.fps) : undefined,
        crf: args.crf ? Number(args.crf) : undefined,
        audio: args.audio ? path.resolve(args.audio) : undefined,
        sfx: !args['no-sfx'],
        motionBlur: args['motion-blur'] ? Number(args['motion-blur'] === true ? 8 : args['motion-blur']) : 1,
        shutter: args.shutter ? Number(args.shutter) : 180,
        gifWidth: args['gif-width'] ? Number(args['gif-width']) : undefined,
        gifFps: args['gif-fps'] ? Number(args['gif-fps']) : undefined,
        onProgress: ({ done, total, elapsed }) => {
          const now = Date.now();
          if (now - lastPrint < 500 && done < total) return;
          lastPrint = now;
          const eta = done ? (elapsed / done) * (total - done) : 0;
          process.stdout.write(`\rrendering ${done}/${total} frames · ${fmtTime(elapsed)} · eta ${fmtTime(eta)}   `);
        },
      }));
      process.stdout.write('\n');
      console.log(`✓ ${path.relative(process.cwd(), r.out)} — ${r.frames} frames @ ${r.fps}fps, ${r.config.width}×${r.config.height}, ${fmtTime(r.seconds)} (${r.workers} workers)`);
      if (args.loudness !== undefined && ['mp4', 'hevc', 'prores', 'webm'].includes(format)) {
        // one pass of EBU R128 loudness on the audio, video copied untouched
        const lufs = Number(args.loudness === true ? -16 : args.loudness);
        const has = spawnSync('ffprobe', ['-v', 'error', '-select_streams', 'a', '-show_entries', 'stream=index', '-of', 'csv=p=0', out], { encoding: 'utf8' }).stdout.trim();
        if (!has) console.log('  (no audio to normalize)');
        else {
          const tmp = out.replace(/(\.[a-z0-9]+)$/i, '.norm$1');
          const codec = format === 'webm' ? ['-c:a', 'libopus', '-b:a', '192k'] : format === 'prores' ? ['-c:a', 'pcm_s16le'] : ['-c:a', 'aac', '-b:a', '320k'];
          // EBU R128 loudnorm with a little extra peak headroom (AAC encoding of sharp transients can overshoot),
          // then the file is measured and reported as it really is. Sparse sound design with no music or bed often
          // lands a few LU under the target: that is the honest result, not something to crush.
          const measure = (f) => { const e = spawnSync('ffmpeg', ['-hide_banner', '-nostats', '-i', f, '-vn', '-af', 'loudnorm=print_format=json', '-f', 'null', '-'], { encoding: 'utf8', maxBuffer: 1 << 26 }).stderr; const j = JSON.parse(e.slice(e.lastIndexOf('{'), e.lastIndexOf('}') + 1) || '{}'); return { I: Number(j.input_i), TP: Number(j.input_tp) }; };
          const chain = `loudnorm=I=${lufs}:TP=-2:LRA=11`;
          const n = spawnSync('ffmpeg', ['-y', '-v', 'error', '-i', out, '-c:v', 'copy', '-af', chain, ...codec, '-ar', '48000', tmp]);
          if (n.status === 0) {
            fs.renameSync(tmp, out);
            const { I, TP: P } = measure(out);
            console.log(`  loudness: ${I} LUFS integrated (target ${lufs}), true peak ${P} dBTP${Number(I) < lufs - 1 ? `\n  (sparse sound design stays under the target rather than being crushed; music or a bed brings it up)` : ''}`);
          } else console.error(`  loudness pass failed: ${n.stderr}`);
        }
      }
      break;
    }

    case 'sfx': {
      await ensureDeps();
      const file = args._[1];
      if (!file) { console.error('Usage: sfx <scene.html> [--out file.wav]'); process.exit(1); }
      const { renderSfx } = await import('../lib/render.mjs');
      const base = path.basename(path.dirname(path.resolve(file)));
      const out = path.resolve(args.out ?? path.join(workDir(file), 'renders', `${base}-sfx.wav`));
      fs.mkdirSync(path.dirname(out), { recursive: true });
      const r = await withServer(file, (url) => renderSfx({ url: url('?render'), out, from: args.from !== undefined ? Number(args.from) : 0, to: args.to !== undefined ? Number(args.to) : undefined }));
      console.log(r ? `✓ ${path.relative(process.cwd(), r.out)} — ${r.cues} cues` : 'This scene declares no sound effects (s.sfx).');
      break;
    }

    case 'board': {
      await ensureDeps();
      const files = args._.slice(1);
      if (files.length < 2 || files.length > 6) { console.error('Usage: board <a.html> <b.html> [... up to 6] [--t 2 | --clip 5] [--labels "A · x,B · y"] [--out board.png]'); process.exit(1); }
      const { renderStills, renderVideo } = await import('../lib/render.mjs');
      const { composeBoard } = await import('../lib/board.mjs');
      const os = await import('node:os');
      const clip = args.clip !== undefined ? Number(args.clip === true ? 5 : args.clip) : null;
      const sequence = !!args.sequence;
      if (sequence && !clip) { console.error('board: --sequence needs --clip <seconds>'); process.exit(1); }
      const t = Number(args.t ?? 2);
      const out = path.resolve(args.out ?? (clip ? 'board.mp4' : 'board.png'));
      const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'pm-board-'));
      const raw = args.labels ? String(args.labels) : '';
      const given = raw ? raw.split(raw.includes('|') ? '|' : ',').map((x) => x.trim()) : [];
      const labels = files.map((_, i) => given[i] ?? String.fromCharCode(65 + i));
      const inputs = [];
      try {
        for (const [i, file] of files.entries()) {
          process.stdout.write(`\roption ${labels[i].split(' · ')[0]} · ${i + 1}/${files.length}   `);
          if (clip) {
            const o = path.join(tmp, `${i}.mp4`);
            await withServer(file, (url) => renderVideo({ url: url('?render'), out: o, from: 0, to: clip, sfx: sequence, dpr: Number(args.dpr ?? 1) }));
            inputs.push(o);
          } else {
            const r = await withServer(file, (url) => renderStills({ url: url('?render'), times: [t], outDir: path.join(tmp, String(i)), sheet: false, dpr: Number(args.dpr ?? 1) }));
            inputs.push(r.files[0]);
          }
        }
        const probe = spawnSync('ffprobe', ['-v', 'error', '-select_streams', 'v:0', '-show_entries', 'stream=width,height', '-of', 'csv=p=0', inputs[0]], { encoding: 'utf8' });
        const [w, h] = probe.stdout.trim().split(',').map(Number);
        const r = sequence
          ? await (await import('../lib/board.mjs')).composeSequence({ inputs, labels, out, tmp, duration: clip })
          : await composeBoard({ inputs, labels, aspect: w / h, out, tmp, duration: clip ?? undefined, cols: args.cols ? Number(args.cols) : undefined });
        console.log(`\r✓ ${path.relative(process.cwd(), r.out)} — ${files.length} options${sequence ? `, played in turn, ${clip * files.length} s` : `, ${r.W}×${r.H}`}`);
      } finally { fs.rmSync(tmp, { recursive: true, force: true }); }
      break;
    }

    case 'wordmark': {
      await ensureDeps();
      const text = args._[1];
      if (!text || !args.family) { console.error('Usage: wordmark <text> --family <name> [--css <url> | --file <font>] [--weight 400] [--tracking 0em] [--color #fff] [--out wordmark.png]'); process.exit(1); }
      const { renderWordmark } = await import('../lib/wordmark.mjs');
      const r = await renderWordmark({
        text: String(text), family: String(args.family), css: args.css, file: args.file ? path.resolve(args.file) : undefined,
        weight: Number(args.weight ?? 400), tracking: args.tracking ?? '0em', color: args.color ?? '#ffffff',
        size: Number(args.size ?? 400), pad: Number(args.pad ?? 0), out: path.resolve(args.out ?? 'wordmark.png'),
      });
      console.log(`✓ ${path.relative(process.cwd(), r.out)} — ${r.width}×${r.height}`);
      break;
    }

    case 'sheet': {
      await ensureDeps();
      const brandDir = path.resolve(args.brand ?? 'brand');
      if (!fs.existsSync(brandDir)) { console.error(`No brand folder at ${path.relative(process.cwd(), brandDir) || '.'} (run from the project root, or pass --brand)`); process.exit(1); }
      const sheetDir = path.join(brandDir, 'sheet');
      const page = path.join(sheetDir, 'index.html');
      if (args.fresh || !fs.existsSync(page)) {
        fs.mkdirSync(sheetDir, { recursive: true });
        fs.copyFileSync(path.join(ENGINE, 'templates', 'brand-sheet', 'index.html'), page);
        console.log(`${args.fresh ? 'replaced' : 'created'} ${path.relative(process.cwd(), page)}`);
      }
      if (args.serve) {
        await withServer(page, async (url) => { console.log(`brand sheet: ${url()}  (live reload on; Ctrl+C to stop)`); await new Promise(() => {}); }, { watch: true, port: Number(args.port ?? 4317) });
        break;
      }
      const { launch } = await import('../lib/browser.mjs');
      const width = Number(args.width ?? 1440);
      await withServer(page, async (url) => {
        const browser = await launch();
        try {
          const pg = await browser.newPage({ viewport: { width, height: 900 }, deviceScaleFactor: 1 });
          const errs = [];
          pg.on('pageerror', (e) => errs.push(e.message));
          await pg.addInitScript(() => { window.__export = true; }); // live samples show their finished state in exports
          await pg.goto(url());
          await pg.waitForFunction(() => window.__sheetReady === true, null, { timeout: 60000 }).catch(() => { throw new Error(`sheet did not finish loading${errs.length ? `: ${errs[0]}` : ''}`); });
          // show every clip at a telling moment (60 % in), not its first second
          await pg.evaluate(async () => { await Promise.all([...document.querySelectorAll('video')].map((v) => new Promise((res) => {
            const go = () => { v.pause(); v.currentTime = (v.duration || 1) * 0.6; v.onseeked = res; setTimeout(res, 3000); };
            v.readyState >= 1 ? go() : (v.onloadedmetadata = go, setTimeout(res, 5000));
          }))); });
          await pg.waitForTimeout(800); // let the live shader draw
          const png = path.join(sheetDir, 'sheet.png');
          await pg.screenshot({ path: png, fullPage: true });
          console.log(`✓ ${path.relative(process.cwd(), png)}`);
          if (!args['no-pdf']) {
            const h = await pg.evaluate(() => document.documentElement.scrollHeight);
            const pdf = path.join(sheetDir, 'sheet.pdf');
            await pg.pdf({ path: pdf, width: `${width}px`, height: `${h}px`, printBackground: true, pageRanges: '1' });
            console.log(`✓ ${path.relative(process.cwd(), pdf)}`);
          }
          if (errs.length) console.error(`page errors:\n  ${errs.join('\n  ')}`);
        } finally { await browser.close(); }
      });
      break;
    }

    case 'keys': {
      const input = args._[1];
      if (!input) { console.error('Usage: keys <recording> [--out brand/sound/keys]'); process.exit(1); }
      const { extractKeys } = await import('../lib/keys.mjs');
      const out = path.resolve(args.out ?? 'brand/sound/keys');
      const { hits } = extractKeys(path.resolve(input), out, { minGap: Number(args['min-gap'] ?? 0.055), sensitivity: Number(args.sensitivity ?? 1) });
      const heavy = hits.filter((h) => h.kind === 'heavy').length;
      console.log(`✓ ${hits.length} keystrokes (${hits.length - heavy} letters, ${heavy} heavy) → ${path.relative(process.cwd(), out)}/keys.json`);
      break;
    }

    case 'sound-samples': {
      const brandDir = path.resolve(args.brand ?? 'brand');
      const cfgFile = path.join(brandDir, 'sound.json');
      if (!fs.existsSync(cfgFile)) { console.error(`No ${path.relative(process.cwd(), cfgFile)} (run the sound-kit skill first)`); process.exit(1); }
      const cfg = JSON.parse(fs.readFileSync(cfgFile, 'utf8'));
      const { synthesize, writeWav } = await import('../lib/sfx.mjs');
      const outDir = path.join(brandDir, 'sound');
      fs.mkdirSync(outDir, { recursive: true });
      const list = [];
      const lowpass = cfg.lowpass ?? 2000;
      for (const [name, cue] of Object.entries(cfg.cues ?? {})) {
        if (!cue) continue;
        const dur = (cue.dur ?? 0.8) + 0.6;
        writeWav(path.join(outDir, `${name}.wav`), synthesize([{ t: 0.05, ...cue, ...(name === 'bed' ? { dur: Math.min(cue.dur ?? 6, 6) } : {}) }], { duration: name === 'bed' ? 6.2 : dur, lowpass, peak: 0.7 }));
        list.push({ name, file: `${name}.wav` });
      }
      // a typing sample: one short line with human timing
      const k = cfg.keys ?? {};
      const line = 'make a video';
      let t = 0.1; const cues = [];
      [...line].forEach((ch, i) => { cues.push({ t, type: 'key', kind: ch === ' ' ? 'space' : 'letter', gain: k.gain ?? 0.16, seed: i + 1, ...(k.bank ? { bank: k.bank } : {}), ...(k.style ? { style: k.style } : {}) }); t += ch === ' ' ? 0.16 : 0.07 + ((i * 37) % 5) / 100; });
      cues.push({ t: t + 0.3, type: 'key', kind: 'enter', gain: (k.gain ?? 0.16) * 1.1, seed: 99, ...(k.bank ? { bank: k.bank } : {}), ...(k.style ? { style: k.style } : {}) });
      writeWav(path.join(outDir, 'typing.wav'), synthesize(cues, { duration: t + 0.8, lowpass, peak: 0.7 }));
      list.push({ name: 'typing', file: 'typing.wav' });
      fs.writeFileSync(path.join(outDir, 'sounds.json'), JSON.stringify(list, null, 1) + '\n');
      console.log(`✓ ${list.length} samples → ${path.relative(process.cwd(), outDir)}/sounds.json`);
      break;
    }

    case 'shader-set': {
      await ensureDeps();
      const sub = args._[1];
      const dir = path.join(path.resolve(args.brand ?? 'brand'), 'shader-set');
      const { buildSet, writeSet, shotName } = await import('../lib/shaderset.mjs');
      const built = buildSet(dir);
      for (const m of built.skipped) console.warn(`  skipped ${m}`);
      if (sub === 'build') { console.log(`✓ ${built.shots.length} shots, ${built.boards.length} boards in ${path.relative(process.cwd(), dir)}`); break; }
      if (sub === 'boards') {
        const { renderStills } = await import('../lib/render.mjs');
        const os = await import('node:os');
        for (const b of built.boards) {
          const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'pm-set-'));
          const r = await withServer(b, (url) => renderStills({ url: url('?render'), times: [Number(args.t ?? 2)], outDir: tmp, sheet: false }));
          const png = b.replace(/\.html$/, '.png');
          fs.copyFileSync(r.files[0], png); fs.rmSync(tmp, { recursive: true, force: true });
          console.log(`✓ ${path.relative(process.cwd(), png)}`);
        }
        break;
      }
      if (sub === 'render') {
        const { renderVideo } = await import('../lib/render.mjs');
        const only = args.only ? String(args.only).split(',').map((x) => x.trim()) : null;
        const pick = built.shots.filter(({ entry, index }) => !only || only.includes(String(index + 1)) || only.includes(entry.id));
        fs.mkdirSync(path.join(dir, 'renders'), { recursive: true });
        for (const { entry, index, file } of pick) {
          const out = path.join(dir, 'renders', `${shotName(entry, index)}.mp4`);
          await withServer(file, (url) => renderVideo({ url: url('?render'), out, sfx: false, crf: 16, motionBlur: Number(args['motion-blur'] ?? 4) }));
          built.set.entries[index].video = `renders/${shotName(entry, index)}.mp4`;
          writeSet(dir, built.set);
          console.log(`✓ ${path.relative(process.cwd(), out)}`);
        }
        break;
      }
      console.error('Usage: shader-set <build|boards|render> [--brand brand] [--only 3,7]'); process.exit(1);
    }

    case 'status': {
      const B = path.resolve(args.brand ?? 'brand');
      const has = (f) => fs.existsSync(path.join(B, f));
      const filled = (f) => has(f) && fs.readFileSync(path.join(B, f), 'utf8').replace(/^#.*$/gm, '').replace(/^## Open[\s\S]*$/m, '').trim().length > 40;
      const n = (dir, re) => (has(dir) ? fs.readdirSync(path.join(B, dir)).filter((f) => re.test(f)).length : 0);
      let setN = 0, setR = 0;
      if (has('shader-set/set.json')) { const j = JSON.parse(fs.readFileSync(path.join(B, 'shader-set/set.json'), 'utf8')); const e = Array.isArray(j) ? j : j.entries ?? []; setN = e.length; setR = e.filter((x) => x.video).length; }
      const steps = [
        ['identity', filled('IDENTITY.md'), 'IDENTITY.md'],
        ['visual-system', has('tokens.json') && filled('VISUAL.md'), 'VISUAL.md + tokens.json' + (has('assets/wordmark-on-light.png') || has('assets/wordmark-on-dark.png') ? ' + wordmark' : '')],
        ['brand-sheet', has('sheet/sheet.png'), 'sheet/sheet.png'],
        ['motion-style', has('motion.json'), 'MOTION.md + motion.json' + (n('motion', /\.mp4$/) ? ` + ${n('motion', /\.mp4$/)} move clips` : '')],
        ['sound-kit', has('sound.json'), 'SOUND.md + sound.json' + (has('sound/keys/keys.json') ? ' + keystroke bank' : '')],
        ['shader-set', setN > 0, `shader-set: ${setN} entries, ${setR} rendered`],
        ['make-video', n('pieces', /^[^.]/) > 0, `pieces: ${n('pieces', /^[^.]/)}`],
      ];
      if (!fs.existsSync(B)) { console.log(`No brand folder at ${path.relative(process.cwd(), B) || '.'} yet. Start with: identity`); break; }
      for (const [skill, done, what] of steps) console.log(`${done ? '✓' : '·'} ${skill.padEnd(14)} ${done ? what : ''}`);
      console.log(`  decisions      ${n('decisions', /\.md$/)}`);
      const next = steps.find(([, done]) => !done);
      console.log(next ? `\nnext: ${next[0]}` : '\nThe brand is complete: make another piece with make-video, or revisit any part.');
      break;
    }

    case 'shaders': {
      await ensureDeps();
      const { buildCatalog, catalogMarkdown } = await import('../lib/catalog.mjs');
      const cat = await buildCatalog();
      const version = JSON.parse(fs.readFileSync(path.join(ENGINE, 'node_modules/@paper-design/shaders-react/package.json'), 'utf8')).version;
      const name = args._[1];
      const list = name ? cat.filter((s) => s.name.toLowerCase() === name.toLowerCase()) : cat;
      if (args.md) {
        const md = catalogMarkdown(cat, version);
        const dest = path.resolve(args.out ?? (fs.existsSync(REPO_SKILL) ? path.join(REPO_SKILL, 'references', 'shaders.md') : 'shaders.md'));
        fs.writeFileSync(dest, md);
        console.log(`wrote ${dest}`);
      } else if (args.json || name) console.log(JSON.stringify(list, null, 2));
      else for (const s of cat) console.log(`${s.name.padEnd(22)} ${s.animated ? 'anim ' : 'still'} ${s.usesImage ? 'img' : '   '}  ${s.description.split('. ')[0]}`);
      break;
    }

    default:
      console.log(HELP);
      if (cmd && cmd !== 'help' && cmd !== '--help') process.exit(1);
  }
}

main().catch((e) => { console.error(`\n✗ ${e.message}`); process.exit(1); });
