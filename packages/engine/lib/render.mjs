import { spawn } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { launch, openScene } from './browser.mjs';
import { synthesize, writeWav } from './sfx.mjs';

function ffmpeg(args, { stdin = false } = {}) {
  const p = spawn(process.env.PAPER_MOTION_FFMPEG || 'ffmpeg', ['-hide_banner', '-loglevel', 'error', '-y', ...args], { stdio: [stdin ? 'pipe' : 'ignore', 'inherit', 'pipe'] });
  let err = '';
  p.stderr.on('data', (d) => { err += d; });
  if (stdin) p.stdin.on('error', () => {}); // surfaced through p.done instead
  p.done = new Promise((res, rej) => {
    p.on('error', (e) => rej(e.code === 'ENOENT' ? new Error('ffmpeg not found. Install it (macOS: brew install ffmpeg · Ubuntu: apt install ffmpeg · Windows: winget install ffmpeg)') : e));
    p.on('close', (code) => (code === 0 ? res() : rej(new Error(`ffmpeg failed (${code}): ${err.trim()}`))));
  });
  return p;
}

const write = (proc, buf) => {
  if (proc.stdin.write(buf)) return Promise.resolve();
  return Promise.race([
    new Promise((res) => proc.stdin.once('drain', res)),
    proc.done.then(() => { throw new Error('ffmpeg exited early'); }),
  ]);
};

/** Render stills at given times; returns file paths. Optionally a contact sheet. */
export async function renderStills({ url, times, count, outDir, dpr = 1, sheet = true, motionBlur = 1, shutter = 180 }) {
  fs.mkdirSync(outDir, { recursive: true });
  const browser = await launch();
  try {
    const s = await openScene(browser, url, { dpr });
    const { duration, fps } = s.config;
    if (!times?.length) {
      const n = count ?? 6;
      times = Array.from({ length: n }, (_, i) => (n === 1 ? 0 : (i * duration) / n));
    }
    const files = [];
    for (const t of times) {
      const tt = Math.round(Math.min(t, duration - 1 / fps) * fps) / fps;
      const f = path.join(outDir, `t${tt.toFixed(2).padStart(6, '0')}.png`);
      const k = Math.max(1, Math.round(motionBlur));
      if (k === 1) { await s.seek(tt); fs.writeFileSync(f, await s.capture()); }
      else {
        const p = ffmpeg(['-f', 'image2pipe', '-framerate', String(k), '-c:v', 'png', '-i', '-', '-vf', `tmix=frames=${k},select='eq(n\\,${k - 1})'`, '-frames:v', '1', f], { stdin: true });
        for (const st of subframes(Math.round(tt * fps), fps, k, shutter, duration)) { await s.seek(st); await write(p, await s.capture()); }
        p.stdin.end(); await p.done;
      }
      files.push(f);
    }
    let sheetPath = null;
    if (sheet && files.length > 1) {
      sheetPath = path.join(outDir, 'contact-sheet.jpg');
      const cols = files.length <= 4 ? files.length : Math.ceil(Math.sqrt(files.length));
      const gap = 8;
      const w = Math.min(640, s.config.width);
      const h = Math.round((w * s.config.height) / s.config.width / 2) * 2;
      const inputs = files.flatMap((f) => ['-i', f]);
      const scaled = files.map((_, i) => `[${i}:v]scale=${w}:${h}:flags=lanczos[v${i}]`).join(';');
      const stack = files.map((_, i) => `[v${i}]`).join('');
      const layout = files.map((_, i) => `${(i % cols) * (w + gap)}_${Math.floor(i / cols) * (h + gap)}`).join('|');
      const filter = `${scaled};${stack}xstack=inputs=${files.length}:layout=${layout}:fill=0x111111[out]`;
      const p = ffmpeg([...inputs, '-filter_complex', filter, '-map', '[out]', '-q:v', '3', sheetPath]);
      await p.done;
    }
    await s.close();
    return { files, sheet: sheetPath, config: s.config, times };
  } finally {
    await browser.close();
  }
}

const FORMATS = {
  mp4: { ext: 'mp4', args: (o) => ['-c:v', 'libx264', '-preset', 'slow', '-crf', String(o.crf ?? 16), '-x264-params', 'aq-mode=3', '-pix_fmt', 'yuv420p', ...bt709, '-movflags', '+faststart'], vf: yuv },
  hevc: { ext: 'mp4', args: (o) => ['-c:v', 'libx265', '-preset', 'slow', '-crf', String(o.crf ?? 18), '-pix_fmt', 'yuv420p10le', '-tag:v', 'hvc1', ...bt709, '-movflags', '+faststart'], vf: yuv },
  prores: { ext: 'mov', args: () => ['-c:v', 'prores_ks', '-profile:v', '3', '-pix_fmt', 'yuv422p10le', '-vendor', 'apl0', ...bt709], vf: yuv },
  webm: { ext: 'webm', args: (o) => ['-c:v', 'libvpx-vp9', '-crf', String(o.crf ?? 20), '-b:v', '0', '-row-mt', '1', '-pix_fmt', 'yuv420p', ...bt709], vf: yuv },
  gif: { ext: 'gif', args: () => [], gif: true },
  png: { ext: 'png', args: () => [], seq: true },
};
const bt709 = ['-colorspace', 'bt709', '-color_primaries', 'bt709', '-color_trc', 'bt709'];
function yuv() { return 'scale=out_color_matrix=bt709:out_range=tv'; }

/** Render a scene to video. */
/** Synthesize the scene's sfx cues to a WAV file. Returns the path, or null when there are none. */
export async function renderSfx({ url, out, from = 0, to }) {
  const browser = await launch();
  try {
    const s = await openScene(browser, url);
    const r = await sfxFromPage(s, { from, to, out });
    await s.close();
    return r;
  } finally { await browser.close(); }
}

async function sfxFromPage(s, { from = 0, to, out }) {
  const { cues, audio } = await s.page.evaluate(() => ({ cues: window.__pm.cues ?? [], audio: window.__pm.audio ?? {} }));
  if (!cues.length) return null;
  const end = to ?? s.config.duration;
  const shifted = cues.filter((c) => c.t < end).map((c) => ({ ...c, t: c.t - from }));
  writeWav(out, synthesize(shifted, { duration: end - from, ...audio }));
  return { out, cues: cues.length };
}

/** Subframe times for frame f: k samples spread over the shutter, centered on the frame (After Effects-style). */
function subframes(f, fps, k, shutter, duration) {
  if (k <= 1) return [f / fps];
  const open = shutter / 360;
  return Array.from({ length: k }, (_, j) => Math.min(duration - 1e-4, Math.max(0, (f + ((j + 0.5) / k - 0.5) * open) / fps)));
}

export async function renderVideo({ url, out, format = 'mp4', workers, dpr = 1, from, to, fps: fpsOverride, crf, audio, sfx = true, motionBlur = 1, shutter = 180, gifWidth = 720, gifFps = 24, onProgress }) {
  const fmt = FORMATS[format];
  if (!fmt) throw new Error(`Unknown format "${format}". Use one of: ${Object.keys(FORMATS).join(', ')}`);
  const browser = await launch();
  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'paper-motion-'));
  const t0 = Date.now();
  try {
    const first = await openScene(browser, url, { dpr });
    const cfg = first.config;
    const fps = fpsOverride ?? cfg.fps;
    const f0 = Math.round((from ?? 0) * fps);
    const f1 = Math.round((to ?? cfg.duration) * fps);
    const total = f1 - f0;
    if (total <= 0) throw new Error('Nothing to render (check --from/--to).');
    const n = Math.max(1, Math.min(workers ?? Math.min(4, Math.max(1, Math.floor(os.cpus().length / 2))), Math.ceil(total / 15)));
    const chunk = Math.ceil(total / n);
    let done = 0;
    const tick = () => onProgress?.({ done, total, elapsed: (Date.now() - t0) / 1000 });

    let sfxWav = null;
    if (sfx && !fmt.gif && !fmt.seq) {
      const r = await sfxFromPage(first, { from: f0 / fps, to: f1 / fps, out: path.join(tmp, 'sfx.wav') });
      sfxWav = r?.out ?? null;
    }

    const sessions = [first];
    for (let i = 1; i < n; i++) sessions.push(await openScene(browser, url, { dpr }));

    const segments = await Promise.all(sessions.map(async (s, i) => {
      const a = f0 + i * chunk, b = Math.min(f1, a + chunk);
      if (a >= b) return null;
      const seg = path.join(tmp, `seg${String(i).padStart(3, '0')}.mkv`);
      // Lossless RGB intermediate; the final encode happens once, after concat.
      const k = Math.max(1, Math.round(motionBlur));
      // Motion blur: k subframes per frame are averaged (tmix) and one frame is kept per group.
      const blur = k > 1 ? ['-vf', `tmix=frames=${k},select='eq(mod(n\\,${k})\\,${k - 1})',setpts=N/(${fps}*TB)`, '-r', String(fps)] : [];
      const p = ffmpeg(['-f', 'image2pipe', '-framerate', String(fps * k), '-c:v', 'png', '-i', '-', ...blur, '-c:v', 'libx264rgb', '-preset', 'ultrafast', '-crf', '0', seg], { stdin: true });
      for (let f = a; f < b; f++) {
        for (const tt of subframes(f, fps, k, shutter, cfg.duration)) {
          await s.seek(tt);
          await write(p, await s.capture());
        }
        done++; tick();
      }
      p.stdin.end();
      await p.done;
      await s.close();
      return seg;
    }));

    const list = path.join(tmp, 'list.txt');
    fs.writeFileSync(list, segments.filter(Boolean).map((s) => `file '${s.replace(/'/g, "'\\''")}'`).join('\n'));
    const W = cfg.width, H = cfg.height;
    const scale = dpr !== 1 ? `scale=${W}:${H}:flags=lanczos` : null;
    out = out ?? `render.${fmt.ext}`;
    fs.mkdirSync(path.dirname(path.resolve(out)), { recursive: true });
    const input = ['-f', 'concat', '-safe', '0', '-i', list];

    if (fmt.seq) {
      const dir = out.replace(/\.png$/, '');
      fs.mkdirSync(dir, { recursive: true });
      await ffmpeg([...input, ...(scale ? ['-vf', scale] : []), path.join(dir, 'frame_%05d.png')]).done;
      out = dir;
    } else if (fmt.gif) {
      const vf = `fps=${gifFps},scale=${gifWidth}:-2:flags=lanczos,split[a][b];[a]palettegen=max_colors=256:stats_mode=diff[p];[b][p]paletteuse=dither=sierra2_4a`;
      await ffmpeg([...input, '-vf', vf, '-loop', '0', out]).done;
    } else {
      const vf = [scale, fmt.vf?.()].filter(Boolean).join(',');
      const codec = ['-c:a', format === 'webm' ? 'libopus' : 'aac', '-b:a', '320k'];
      const audios = [audio, sfxWav].filter(Boolean);
      const audioArgs = audios.length === 0 ? []
        : audios.length === 1 ? ['-i', audios[0], '-map', '0:v', '-map', '1:a', ...codec, '-shortest']
        : ['-i', audios[0], '-i', audios[1], '-filter_complex', '[1:a][2:a]amix=inputs=2:normalize=0[a]', '-map', '0:v', '-map', '[a]', ...codec, '-shortest'];
      await ffmpeg([...input, ...audioArgs, ...(vf ? ['-vf', vf] : []), '-r', String(fps), ...fmt.args({ crf }), out]).done;
    }
    return { out, frames: total, fps, seconds: (Date.now() - t0) / 1000, workers: n, config: cfg };
  } finally {
    await browser.close();
    fs.rmSync(tmp, { recursive: true, force: true });
  }
}
