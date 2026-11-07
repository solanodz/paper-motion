import fs from 'node:fs';
import os from 'node:os';
import { chromium } from 'playwright-core';

const CANDIDATES = {
  darwin: [
    '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
    '/Applications/Chromium.app/Contents/MacOS/Chromium',
    '/Applications/Microsoft Edge.app/Contents/MacOS/Microsoft Edge',
    '/Applications/Brave Browser.app/Contents/MacOS/Brave Browser',
  ],
  linux: ['/usr/bin/google-chrome', '/usr/bin/google-chrome-stable', '/usr/bin/chromium', '/usr/bin/chromium-browser', '/snap/bin/chromium'],
  win32: [
    'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
    'C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe',
    'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe',
  ],
};

export function findBrowser() {
  const env = process.env.PAPER_MOTION_BROWSER;
  if (env && fs.existsSync(env)) return env;
  try { const p = chromium.executablePath(); if (p && fs.existsSync(p)) return p; } catch { /* not installed */ }
  for (const p of CANDIDATES[os.platform()] ?? []) if (fs.existsSync(p)) return p;
  return null;
}

export async function launch() {
  const executablePath = findBrowser();
  if (!executablePath) {
    throw new Error('No Chromium-based browser found. Install Google Chrome, or run:\n  npx playwright-core install chromium\nor set PAPER_MOTION_BROWSER=/path/to/chrome');
  }
  return chromium.launch({
    executablePath,
    headless: true,
    args: [
      '--ignore-gpu-blocklist',
      '--enable-gpu-rasterization',
      '--enable-unsafe-swiftshader', // WebGL fallback on machines without a GPU (CI, servers)
      '--hide-scrollbars',
      '--mute-audio',
      '--force-color-profile=srgb',
      '--disable-background-timer-throttling',
      '--disable-renderer-backgrounding',
      '--disable-backgrounding-occluded-windows',
    ],
  });
}

/** Open a scene in render mode and wait until it is ready. */
export async function openScene(browser, url, { dpr = 1 } = {}) {
  // Probe size with a throwaway page first, so the real viewport matches the scene.
  const probe = await browser.newPage();
  const errors = [];
  probe.on('pageerror', (e) => errors.push(e));
  probe.on('console', (m) => { if (m.type() === 'error' && !m.text().startsWith('Failed to load resource')) errors.push(new Error(m.text())); });
  probe.on('response', (r) => { if (r.status() >= 400) errors.push(new Error(`${r.status()} ${r.url()}`)); });
  await probe.goto(url);
  const config = await waitReady(probe, errors);
  await probe.close();

  const context = await browser.newContext({ viewport: { width: config.width, height: config.height }, deviceScaleFactor: dpr });
  const page = await context.newPage();
  const errs = [];
  page.on('pageerror', (e) => errs.push(e));
  page.on('console', (m) => { if ((m.type() === 'error' || m.type() === 'warning') && !m.text().startsWith('Failed to load resource')) process.stderr.write(`[scene ${m.type()}] ${m.text()}\n`); });
  await page.goto(url);
  await waitReady(page, errs);
  const cdp = await context.newCDPSession(page);
  const capture = async () => {
    const { data } = await cdp.send('Page.captureScreenshot', { format: 'png', optimizeForSpeed: true, captureBeyondViewport: false, fromSurface: true });
    return Buffer.from(data, 'base64');
  };
  const seek = (t) => page.evaluate((tt) => window.__pm.seek(tt), t);
  return { page, context, config, capture, seek, close: () => context.close() };
}

async function waitReady(page, errors, timeout = 60000) {
  const start = Date.now();
  while (Date.now() - start < timeout) {
    if (errors.length) throw new Error(`Scene error: ${errors[0].message}`);
    const cfg = await page.evaluate(() => (window.__pm ? window.__pm.config : null)).catch(() => null);
    if (cfg) return cfg;
    await new Promise((r) => setTimeout(r, 50));
  }
  throw new Error('Scene never became ready. Did you call `await s.start()`? Check the browser console in preview.');
}
