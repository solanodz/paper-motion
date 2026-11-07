// Option boards: N rendered options (stills or short clips) composed into one labelled grid,
// so an interview can show choices side by side and the user answers with a letter.
import fs from 'node:fs';
import path from 'node:path';
import { spawn } from 'node:child_process';
import { launch } from './browser.mjs';

const BOARD_W = 1920, GAP = 16, PAD = 40, LABEL_H = 64;

/** Grid for n options: 2–3 in a row, 4 as 2×2, 5–6 as 3×2 (never an empty cell for 3). */
export function layout(n, aspect) {
  const cols = n <= 3 ? n : n === 4 ? 2 : 3;
  const rows = Math.ceil(n / cols);
  const cw = Math.floor((BOARD_W - PAD * 2 - GAP * (cols - 1)) / cols / 2) * 2;
  const ch = Math.floor(cw / aspect / 2) * 2;
  const cells = Array.from({ length: n }, (_, i) => ({
    x: PAD + (i % cols) * (cw + GAP),
    y: PAD + Math.floor(i / cols) * (ch + LABEL_H + GAP) + LABEL_H,
  }));
  const H = Math.ceil((PAD * 2 + rows * (ch + LABEL_H) + (rows - 1) * GAP) / 2) * 2;
  return { cols, rows, cw, ch, W: BOARD_W, H, cells };
}

/** Transparent PNG with each option's letter and caption above its cell. */
async function labelsPng(L, labels, file) {
  const browser = await launch();
  try {
    const page = await browser.newPage({ viewport: { width: L.W, height: L.H } });
    const items = L.cells.map((c, i) => {
      const [letter, ...rest] = labels[i].split(' · ');
      return `<div style="position:absolute;left:${c.x}px;top:${c.y - LABEL_H}px;height:${LABEL_H}px;display:flex;align-items:center;gap:14px;font:500 26px ui-monospace,Menlo,monospace;color:#fff">
        <span style="display:inline-flex;align-items:center;justify-content:center;width:40px;height:40px;border:1.5px solid #fff;border-radius:6px">${letter}</span>
        <span style="color:#9a9a9a">${rest.join(' · ')}</span></div>`;
    }).join('');
    await page.setContent(`<html><body style="margin:0;background:transparent">${items}</body></html>`);
    await page.screenshot({ path: file, omitBackground: true });
  } finally { await browser.close(); }
}

function ffmpeg(args) {
  return new Promise((res, rej) => {
    const p = spawn('ffmpeg', ['-y', '-loglevel', 'error', ...args], { stdio: ['ignore', 'inherit', 'inherit'] });
    p.on('close', (code) => (code === 0 ? res() : rej(new Error(`ffmpeg exited ${code}`))));
  });
}

/**
 * Compose rendered option files (all PNG or all MP4) into one board.
 * @param {string[]} inputs  rendered options, in label order
 * @param {string[]} labels  "A · caption" per option
 * @param {number} aspect    cell aspect ratio (width / height)
 * @param {string} out       .png for stills, .mp4 for clips
 * @param {number} duration  clip length in seconds (bounds the looped label layer)
 */
export async function composeBoard({ inputs, labels, aspect, out, tmp, duration }) {
  const L = layout(inputs.length, aspect);
  const lab = path.join(tmp, 'labels.png');
  await labelsPng(L, labels, lab);
  const clip = out.endsWith('.mp4');
  const ins = inputs.flatMap((f) => ['-i', f]);
  const scaled = inputs.map((_, i) => `[${i}:v]scale=${L.cw}:${L.ch}:force_original_aspect_ratio=decrease,pad=${L.cw}:${L.ch}:(ow-iw)/2:(oh-ih)/2:color=black,setsar=1[v${i}]`);
  let chain = `color=c=0x0a0a0a:s=${L.W}x${L.H}${clip ? ':r=30' : ''}[bg0]`;
  inputs.forEach((_, i) => { chain += `;[bg${i}][v${i}]overlay=${L.cells[i].x}:${L.cells[i].y}${clip ? ':shortest=1' : ''}[bg${i + 1}]`; });
  chain += `;[bg${inputs.length}][${inputs.length}:v]overlay=0:0${clip ? ':format=auto' : ''}[out]`;
  const filter = [...scaled, chain].join(';');
  fs.mkdirSync(path.dirname(out), { recursive: true });
  if (clip) await ffmpeg([...ins, '-loop', '1', '-i', lab, '-filter_complex', filter, '-map', '[out]', ...(duration ? ['-t', String(duration)] : []), '-c:v', 'libx264', '-pix_fmt', 'yuv420p', '-crf', '20', '-an', out]);
  else await ffmpeg([...ins, '-i', lab, '-filter_complex', filter, '-map', '[out]', '-frames:v', '1', out]);
  return { out, ...L };
}
