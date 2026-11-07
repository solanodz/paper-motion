// Wordmarks: a brand name set in its typeface, rendered to a transparent PNG cropped to the ink
// (for scenes, logo shaders such as LiquidMetal, and the brand folder).
import fs from 'node:fs';
import path from 'node:path';
import { launch } from './browser.mjs';

const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));

/**
 * @param {object} o
 * @param {string} o.text      the name, already cased as the brand writes it
 * @param {string} o.family    font family name
 * @param {string} [o.css]     stylesheet URL that provides the family (e.g. Google Fonts css2)
 * @param {string} [o.file]    local font file (woff2/ttf/otf), used instead of css
 * @param {number} [o.weight]  font weight (default 400)
 * @param {string} [o.tracking] letter-spacing in em, e.g. "-0.02em"
 * @param {string} [o.color]   fill color (default #ffffff)
 * @param {number} [o.size]    font size in px (default 400)
 * @param {number} [o.pad]     transparent margin around the ink, as a fraction of the size (default 0)
 * @param {string} o.out       output .png path
 */
export async function renderWordmark({ text, family, css, file, weight = 400, tracking = '0em', color = '#ffffff', size = 400, pad = 0, out }) {
  const face = file
    ? `@font-face { font-family: 'WM'; src: url(data:font/${path.extname(file).slice(1)};base64,${fs.readFileSync(file).toString('base64')}); font-weight: ${weight}; }`
    : '';
  const fam = file ? 'WM' : family;
  const html = `<!doctype html><html><head>${css ? `<link rel="stylesheet" href="${esc(css)}">` : ''}<style>${face}
    html,body{margin:0;background:transparent}</style></head><body><span style="font-family:'${esc(fam)}';font-weight:${weight}">${esc(text)}</span></body></html>`;
  const browser = await launch();
  try {
    const page = await browser.newPage();
    await page.setContent(html, { waitUntil: 'networkidle' });
    const r = await page.evaluate(async ({ fam, weight, size, text, tracking, color, pad }) => {
      const font = `${weight} ${size}px '${fam}'`;
      await document.fonts.load(font).catch(() => {});
      await document.fonts.ready;
      // fonts.check() is true when no face matches at all, so look for a loaded face of this family instead.
      if (![...document.fonts].some((f) => f.family.replace(/['"]/g, '') === fam && f.status === 'loaded')) return { error: 'font' };
      const em = parseFloat(tracking) || 0;
      // Draw generously, then crop to the exact ink so clear space is a brand rule, not a file accident.
      const big = document.createElement('canvas');
      const g = big.getContext('2d');
      g.font = font; g.letterSpacing = `${em * size}px`;
      const m = g.measureText(text);
      big.width = Math.ceil(m.width + size * 2); big.height = Math.ceil(size * 2.4);
      g.font = font; g.letterSpacing = `${em * size}px`; g.fillStyle = color; g.textBaseline = 'alphabetic';
      g.fillText(text, size, size * 1.6);
      const { data, width: W, height: H } = g.getImageData(0, 0, big.width, big.height);
      let x0 = W, y0 = H, x1 = -1, y1 = -1;
      for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) if (data[(y * W + x) * 4 + 3] > 0) { if (x < x0) x0 = x; if (x > x1) x1 = x; if (y < y0) y0 = y; if (y > y1) y1 = y; }
      if (x1 < 0) return { error: 'empty' };
      const p = Math.round(size * pad);
      const c = document.createElement('canvas');
      c.width = x1 - x0 + 1 + p * 2; c.height = y1 - y0 + 1 + p * 2;
      c.getContext('2d').drawImage(big, x0, y0, x1 - x0 + 1, y1 - y0 + 1, p, p, x1 - x0 + 1, y1 - y0 + 1);
      return { url: c.toDataURL('image/png'), width: c.width, height: c.height };
    }, { fam, weight, size, text: String(text), tracking, color, pad });
    if (r.error === 'font') throw new Error(`wordmark: font "${family}" (${weight}) did not load; check --css / --file`);
    if (r.error) throw new Error('wordmark: nothing was drawn');
    fs.mkdirSync(path.dirname(path.resolve(out)), { recursive: true });
    fs.writeFileSync(out, Buffer.from(r.url.split(',')[1], 'base64'));
    return { out, width: r.width, height: r.height };
  } finally { await browser.close(); }
}
