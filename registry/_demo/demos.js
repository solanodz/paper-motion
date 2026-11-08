// Preview demos for the registry: one 5 s scene per move, in the paper-motion look (black, white, Geist).
// index.html?demo=<registry id> runs one; `pamo registry previews` renders them to apps/web/public/previews/.
import { scene, ease, progress } from 'paper-motion';
import * as F from 'paper-motion/moves';
import * as K from 'paper-motion/moves';
import * as M from 'paper-motion/moves';

const W = 1920, H = 1080, DUR = 5;
const el = (tag, css, html = '') => { const e = document.createElement(tag); e.style.cssText = css; e.innerHTML = html; return e; };
const center = (css = '') => el('div', `position:absolute;inset:0;display:flex;flex-direction:column;align-items:center;justify-content:center;${css}`);
const fadeOut = (node, t, at = 4.45, d = 0.4) => { node.style.opacity = 1 - progress(t, at, at + d, ease.inCubic); };
// the site's player sets --pm-* (colors, fonts) from the user's kit; renders keep the fallbacks
const SERIF = 'var(--pm-display, GSerif)', MONO = 'var(--pm-mono, GMono)', PIXEL = 'GPixel';

/** Live params from the site's playground; every move call merges them over the demo's own options. */
const LIVE = {};
const L = (opts = {}) => ({ ...opts, ...LIVE });
export function setParams(values) { for (const k of Object.keys(LIVE)) delete LIVE[k]; Object.assign(LIVE, values); }

const camel = (id) => ({ 'flip-3d': 'flip3D', 'rgb-split': 'rgbSplit' }[id] ?? id.replace(/-([a-z0-9])/g, (_, c) => c.toUpperCase()));

const keyOf = (name) => (DEMOS[name] ? name : DEMOS[`k-${camel(name)}`] ? `k-${camel(name)}` : camel(name));
export const has = (name) => !!DEMOS[keyOf(name)];

/** Mounts one demo on a stage element (1920×1080) with a scene-like `s` ({ update(fn) }): the site's live player. */
export function mount(name, stage, s) {
  const key = keyOf(name);
  if (!DEMOS[key]) throw new Error(`no demo for "${name}"`);
  DEMOS[key](s, stage);
}

export async function run(name) {
  const st = document.querySelector('#stage');
  const s = scene({ width: W, height: H, fps: 30, duration: DUR, background: 'var(--pm-g, #000)' });
  await Promise.all(['400 100px GSerif', '400 40px GMono', '500 40px GMono', '400 100px GPixel'].map((f) => document.fonts.load(f)));
  const key = DEMOS[name] ? name : DEMOS[`k-${camel(name)}`] ? `k-${camel(name)}` : camel(name);
  if (!DEMOS[key]) throw new Error(`no demo for "${name}"`);
  DEMOS[key](s, st);
  await s.start();
}

// ── shared sets ─────────────────────────────────────────────────

/** Two full frames, A (black) and B (paper), each with a word and corner labels so displacement reads. */
function frames(st) {
  const mk = (bg, fg, word, num) => {
    const f = el('div', `position:absolute;inset:0;background:${bg};color:${fg};overflow:hidden`);
    f.append(el('div', `position:absolute;inset:0;display:flex;align-items:center;justify-content:center;font:400 300px/1 ${SERIF};letter-spacing:-0.03em`, word));
    f.append(el('div', `position:absolute;left:64px;top:56px;font:500 26px/1 ${MONO}`, num));
    f.append(el('div', `position:absolute;right:64px;bottom:56px;font:500 26px/1 ${MONO};opacity:.6`, 'paper-motion'));
    [0.3, 0.9, 0.6].forEach((d, i) => { f.children[i].dataset.depth = d; }); // used by parallax
    st.append(f);
    return f;
  };
  return [mk('var(--pm-g, #000)', 'var(--pm-f, #fff)', 'paper', '01'), mk('var(--pm-a, #E9E4D8)', 'var(--pm-g, #000)', 'motion', '02')];
}

const RESET = ['transform', 'clipPath', 'webkitClipPath', 'filter', 'opacity', 'zIndex', 'transformOrigin', 'borderRadius', 'boxShadow', 'backfaceVisibility'];
/** A → B at 1.0 s, B → A at 3.0 s, so the board shows the move twice. */
function transitionDemo(s, st, fx, D, opts = {}, pair = null) {
  const [a, b] = pair ?? frames(st);
  s.update((t) => {
    const o = L(opts), d = Math.min(1.9, LIVE.duration ?? D); // a live duration also stretches the window it plays in
    // close the other direction first (hides its copies), so a frame reached by a jump is clean too
    if (t < 3.0) fx(b, a, 1, o); else fx(a, b, 1, o);
    for (const n of [a, b, ...a.children, ...b.children]) for (const k of RESET) n.style[k] = '';
    if (t < 3.0) { a.style.zIndex = 1; b.style.zIndex = 2; fx(a, b, progress(t, 1.0, 1.0 + d), o); }
    else { b.style.zIndex = 1; a.style.zIndex = 2; fx(b, a, progress(t, 3.0, 3.0 + d), o); }
  });
}

/** The page around a component: a faint grid, a headline on the left, corner marks around the slot. */
const SLOT = { x: 1010, y: 290, w: 760, h: 500 };
function page(st, headline, caption = 'component transitions') {
  const lines = [];
  for (let x = 0; x <= W; x += 120) lines.push(`<line x1="${x}" y1="0" x2="${x}" y2="${H}"/>`);
  for (let y = 0; y <= H; y += 120) lines.push(`<line x1="0" y1="${y}" x2="${W}" y2="${y}"/>`);
  st.append(el('div', 'position:absolute;inset:0', `<svg width="${W}" height="${H}" style="stroke:var(--pm-l, var(--pm-l, #161616))" stroke-width="1">${lines.join('')}</svg>`));
  st.append(el('div', `position:absolute;left:140px;top:330px;font:400 116px/1.02 ${SERIF};color:var(--pm-f, #fff);letter-spacing:-0.03em`, headline));
  st.append(el('div', `position:absolute;left:144px;top:620px;font:500 26px/1 ${MONO};color:var(--pm-m, #8a8a8a)`, caption));
  st.append(el('div', `position:absolute;left:144px;top:96px;font:500 24px/1 ${MONO};color:var(--pm-f, #fff)`, 'paper-motion'));
  const { x, y, w, h } = SLOT, m = 26, g = 18, c = 'var(--pm-l, #4a4a4a)';
  const marks = [[x - g, y - g, 'border-left', 'border-top'], [x + w + g - m, y - g, 'border-right', 'border-top'], [x - g, y + h + g - m, 'border-left', 'border-bottom'], [x + w + g - m, y + h + g - m, 'border-right', 'border-bottom']];
  for (const [l, t, b1, b2] of marks) st.append(el('div', `position:absolute;left:${l}px;top:${t}px;width:${m}px;height:${m}px;${b1}:1.5px solid ${c};${b2}:1.5px solid ${c}`));
}
const cardA = () => el('div', '', '<div class="lbl">01 · brief</div><div class="ttl">Brief</div><div class="bar" style="width:82%"></div><div class="bar" style="width:64%"></div><div class="bar" style="width:74%"></div>');
const cardB = () => el('div', '', '<div class="lbl">02 · render</div><div class="ttl">Render</div><div class="track"><i></i></div><div class="meta">108 / 150 frames</div>');
/** Two cards stacked in one slot of a still page. `clip` keeps travel inside the slot. */
function componentPair(st, { clip = false } = {}) {
  page(st, 'one card,<br>two states.');
  const slot = el('div', `position:absolute;left:${SLOT.x}px;top:${SLOT.y}px;width:${SLOT.w}px;height:${SLOT.h}px;${clip ? 'overflow:hidden;border-radius:14px;' : ''}`);
  st.append(slot);
  const a = cardA(), b = cardB();
  a.className = 'card card-a'; b.className = 'card card-b';
  slot.append(a, b);
  return [a, b];
}

const kA = (extra = '') => { const c = el('div', '', '<div data-part="media"><i></i></div><div data-part="label">01 · brief</div><div data-part="title">Brief</div><div data-part="body"><b style="width:100%"></b><b style="width:78%"></b><b style="width:88%"></b></div><div data-part="meta">● 3 notes</div>'); c.className = `kc kc-a ${extra}`; return c; };
const kB = () => { const c = el('div', '', '<div data-part="media"><i></i><i></i><i></i><i></i></div><div data-part="label">02 · render</div><div data-part="title">Render</div><div data-part="body"><i></i></div><div data-part="meta">108 / 150 frames</div>'); c.className = 'kc kc-b'; return c; };
/** Round 3 cards with matching parts, stacked in one slot of a still page. */
function kPair(st, { headline = 'one card,<br>two states.', compact = false, clip = false } = {}) {
  page(st, headline);
  const slot = el('div', `position:absolute;left:${SLOT.x}px;top:${SLOT.y}px;width:${SLOT.w}px;height:${SLOT.h}px;${clip ? 'overflow:hidden;border-radius:14px;' : ''}`);
  st.append(slot);
  const a = kA(compact ? 'compact' : ''), b = kB();
  slot.append(a, b);
  return [a, b];
}

const HITS = [0.8, 1.8, 2.3, 3.4];
/** A poster with a grid, a title and four beat squares that light on each hit, inside a movable world. */
function poster(st, title = 'on the beat.') {
  const world = el('div', 'position:absolute;inset:-80px;');
  const lines = [];
  for (let x = 80; x <= W + 80; x += 120) lines.push(`<line x1="${x}" y1="0" x2="${x}" y2="${H + 160}"/>`);
  for (let y = 80; y <= H + 80; y += 120) lines.push(`<line x1="0" y1="${y}" x2="${W + 160}" y2="${y}"/>`);
  world.append(el('div', 'position:absolute;inset:0', `<svg width="${W + 160}" height="${H + 160}" style="stroke:var(--pm-l, var(--pm-l, #262626))" stroke-width="1">${lines.join('')}</svg>`));
  const inner = center();
  inner.append(el('div', `font:400 220px/1 ${SERIF};color:var(--pm-f, #fff);letter-spacing:-0.03em;white-space:nowrap`, title));
  const beats = el('div', 'display:flex;gap:18px;margin-top:70px');
  const sq = HITS.map(() => { const b = el('div', 'width:22px;height:22px;border:1.5px solid var(--pm-f, #fff)'); beats.append(b); return b; });
  inner.append(beats);
  world.append(inner);
  world.append(el('div', `position:absolute;left:144px;top:136px;font:500 26px/1 ${MONO};color:var(--pm-f, #fff)`, '120 BPM'));
  world.append(el('div', `position:absolute;right:144px;bottom:136px;font:500 26px/1 ${MONO};color:var(--pm-m, #8a8a8a)`, 'paper-motion'));
  st.append(world);
  const light = (t) => sq.forEach((b, i) => { const dt = t - HITS[i]; b.style.background = dt >= 0 ? `rgba(255,255,255,${Math.max(0.25, Math.exp(-dt * 5))})` : 'transparent'; });
  return { world, light };
}

// ── the demos ───────────────────────────────────────────────────

const DEMOS = {
  scramble(s, st) {
    const wrap = center(); st.append(wrap);
    const a = el('div', `font:400 168px/1 ${PIXEL};color:var(--pm-f, #fff);white-space:nowrap`, 'FRAME-EXACT');
    const b = el('div', `margin-top:56px;font:400 30px/1 ${MONO};color:var(--pm-m, #8a8a8a);white-space:nowrap`, 'render · 1920×1080 · 30 fps · 150 frames');
    wrap.append(a, b);
    s.update((t) => { F.scramble(a, t, L({ start: 0.3, duration: 1.5 })); F.scramble(b, t, L({ start: 1.0, duration: 1.3, seed: 3 })); fadeOut(wrap, t); });
  },
  popIn(s, st) {
    const wrap = center(); st.append(wrap);
    const a = el('div', `font:400 230px/1.1 ${SERIF};color:var(--pm-f, #fff);letter-spacing:-0.03em;white-space:nowrap`, 'make it move.');
    wrap.append(a);
    s.update((t) => { F.popIn(a, t, L({ start: 0.4 })); fadeOut(wrap, t); });
  },
  flipIn(s, st) {
    const wrap = center(); st.append(wrap);
    const a = el('div', `font:400 220px/1.1 ${SERIF};color:var(--pm-f, #fff);letter-spacing:-0.03em;white-space:nowrap`, 'frame by frame');
    const b = el('div', `margin-top:40px;font:500 30px/1 ${MONO};color:var(--pm-m, #8a8a8a);white-space:nowrap`, 'a pure function of time');
    wrap.append(a, b);
    s.update((t) => { F.flipIn(a, t, L({ start: 0.4 })); F.flipIn(b, t, L({ start: 1.3, each: 0.02, duration: 0.6 })); fadeOut(wrap, t); });
  },
  roll(s, st) {
    const wrap = center(); st.append(wrap);
    const line = el('div', `font:400 210px/1.3 ${SERIF};color:var(--pm-f, #fff);letter-spacing:-0.03em;white-space:nowrap;display:flex;align-items:flex-end`);
    const pre = el('span', 'color:var(--pm-m, #8a8a8a)', 'make it&nbsp;'), r = el('span', '');
    line.append(pre, r); wrap.append(line);
    s.update((t) => { F.roll(r, ['move.', 'faster.', 'louder.', 'yours.', 'move.'], t, L({ start: 0.5, every: 0.85 })); fadeOut(wrap, t); });
  },
  odometer(s, st) {
    const wrap = center(); st.append(wrap);
    const n = el('div', `font:400 300px/1 ${SERIF};color:var(--pm-f, #fff);letter-spacing:-0.02em;white-space:nowrap`);
    const cap = el('div', `margin-top:56px;font:500 30px/1 ${MONO};color:var(--pm-m, #8a8a8a)`, 'frames in one hour at 24 fps');
    wrap.append(n, cap);
    s.update((t) => { F.odometer(n, t, L({ from: 0, to: 86400, start: 0.4, duration: 3.0 })); fadeOut(wrap, t); });
  },
  barReveal(s, st) {
    const wrap = el('div', 'position:absolute;left:260px;top:0;bottom:0;display:flex;flex-direction:column;justify-content:center;gap:18px'); st.append(wrap);
    const ls = ['one brief.', 'one scene.', 'one render.'].map((w) => { const row = el('div', ''); const x = el('span', `font:400 170px/1.05 ${SERIF};color:var(--pm-f, #fff);letter-spacing:-0.03em;white-space:nowrap`, w); row.append(x); wrap.append(row); return x; });
    s.update((t) => { ls.forEach((x, i) => F.barReveal(x, t, L({ start: 0.4 + i * 0.3, duration: 0.85 }))); fadeOut(wrap, t); });
  },

  whip: (s, st) => transitionDemo(s, st, F.whip, 0.45),
  cells: (s, st) => transitionDemo(s, st, F.cells, 1.0),
  slices: (s, st) => transitionDemo(s, st, F.slices, 0.9),
  iris: (s, st) => transitionDemo(s, st, F.iris, 0.9, { x: '50%', y: '52%' }),
  glitch: (s, st) => transitionDemo(s, st, F.glitch, 0.6),
  flip3D(s, st) { st.style.background = 'var(--pm-s, #1a1a1a)'; transitionDemo(s, st, F.flip3D, 1.0); },
  flash: (s, st) => transitionDemo(s, st, F.flash, 0.55),

  // round 3: choreographed component transitions
  'k-magicMove': (s, st) => transitionDemo(s, st, K.magicMove, 1.1, { duration: 1.1 }, kPair(st, { headline: 'small card,<br>full panel.', compact: true })),
  'k-whipPan': (s, st) => transitionDemo(s, st, K.whipPan, 0.9, { duration: 0.9 }, kPair(st, {})),
  'k-diveIn': (s, st) => transitionDemo(s, st, K.diveIn, 1.1, { duration: 1.1 }, kPair(st, { headline: 'dive into<br>the detail.', clip: true })),
  'k-flipLift': (s, st) => transitionDemo(s, st, K.flipLift, 1.2, { duration: 1.2 }, kPair(st, {})),
  'k-squashDrop': (s, st) => transitionDemo(s, st, K.squashDrop, 1.1, { duration: 1.1 }, kPair(st, {})),
  'k-snapScroll': (s, st) => transitionDemo(s, st, K.snapScroll, 1.2, { duration: 1.2 }, kPair(st, {})),
  'k-unfold': (s, st) => transitionDemo(s, st, K.unfold, 1.2, { duration: 1.2 }, kPair(st, {})),
  'k-tileSwirl': (s, st) => transitionDemo(s, st, K.tileSwirl, 1.3, { duration: 1.3 }, kPair(st, {})),

  // the original moves
  cut: (s, st) => transitionDemo(s, st, F.cut, 0.05),
  crossfade: (s, st) => transitionDemo(s, st, F.crossfade, 0.9),
  wipe: (s, st) => transitionDemo(s, st, F.wipe, 0.9),
  push: (s, st) => transitionDemo(s, st, F.push, 0.8),
  maskReveal: (s, st) => transitionDemo(s, st, F.maskReveal, 0.8),
  scanReveal: (s, st) => transitionDemo(s, st, F.scanReveal, 1.0),
  zoomThrough: (s, st) => transitionDemo(s, st, F.zoomThrough, 1.1),
  typeOn(s, st) {
    const wrap = center(); st.append(wrap);
    const row = el('div', `font:400 64px/1 ${MONO};color:var(--pm-f, #fff);white-space:nowrap`);
    const txt = el('span', ''), cur = el('span', 'display:inline-block;width:0.55em;height:0.95em;background:var(--pm-f, #fff);vertical-align:-0.12em;margin-left:4px');
    row.append(el('span', 'color:var(--pm-m, #8a8a8a)', '$&nbsp;'), txt, cur); wrap.append(row);
    const TEXT = 'npx paper-motion add magic-move', times = F.typingTimes(TEXT, { start: 0.5, cps: 16, seed: 2 });
    s.update((t) => { F.typeOn(txt, TEXT, t, L({ times, cursor: cur })); fadeOut(wrap, t); });
  },
  wordRise(s, st) {
    const wrap = center(); st.append(wrap);
    const a = el('div', `font:400 150px/1.1 ${SERIF};color:var(--pm-f, #fff);letter-spacing:-0.03em;text-align:center`, 'every frame<br>on purpose.');
    wrap.append(a);
    s.update((t) => { F.wordRise(a, t, L({ start: 0.4, each: 0.1 })); fadeOut(wrap, t); });
  },
  blurIn(s, st) {
    const wrap = center(); st.append(wrap);
    const a = el('div', `font:400 190px/1 ${SERIF};color:var(--pm-f, #fff);letter-spacing:-0.03em;white-space:nowrap`, 'in focus.');
    wrap.append(a);
    s.update((t) => { F.blurIn(a, t, L({ start: 0.4, duration: 1.2 })); fadeOut(wrap, t); });
  },
  trackIn(s, st) {
    const wrap = center(); st.append(wrap);
    const a = el('div', `font:400 170px/1 ${SERIF};color:var(--pm-f, #fff);white-space:nowrap`, 'quietly.');
    wrap.append(a);
    s.update((t) => { F.trackIn(a, t, L({ start: 0.4, duration: 1.6, from: 0.5, to: -0.03 })); fadeOut(wrap, t); });
  },
  drift(s, st) { const p = poster(st, 'still, but alive.'); s.update((t) => { F.drift(p.world, t, L({ amount: 0.1, duration: 5 })); p.light(-1); }); },

  shake(s, st) { const p = poster(st); s.update((t) => { F.shake(p.world, t, L({ hits: HITS })); p.light(t); }); },
  punch(s, st) { const p = poster(st); s.update((t) => { F.punch(p.world, t, L({ hits: HITS })); p.light(t); }); },
  rgbSplit(s, st) { const p = poster(st); s.update((t) => { F.rgbSplit(p.world, t, L({ hits: HITS })); p.light(t); }); },
  orbit(s, st) {
    st.style.perspective = '1500px';
    const world = el('div', 'position:absolute;inset:0;transform-style:preserve-3d'); st.append(world);
    const floor = [];
    for (let x = -1600; x <= 1600; x += 160) floor.push(`<line x1="${x + 1600}" y1="0" x2="${x + 1600}" y2="3200"/>`);
    for (let y = 0; y <= 3200; y += 160) floor.push(`<line x1="0" y1="${y}" x2="3200" y2="${y}"/>`);
    world.append(el('div', `position:absolute;left:${W / 2 - 1600}px;top:${H / 2 + 260}px;width:3200px;height:3200px;transform:translateZ(500px) rotateX(-90deg);transform-origin:50% 0`, `<svg width="3200" height="3200" style="stroke:var(--pm-l, var(--pm-l, #3a3a3a))" stroke-width="3">${floor.join('')}</svg>`));
    const back = center(`transform:translateZ(-1100px) scale(1.75);font:400 520px/1 ${SERIF};color:var(--pm-l, #1d1d1d);letter-spacing:-0.04em`); back.textContent = 'paper'; world.append(back);
    const mid = center(`font:400 260px/1 ${SERIF};color:var(--pm-f, #fff);letter-spacing:-0.03em`); mid.textContent = 'depth'; world.append(mid);
    const tags = [['near · z 420', 330, 250], ['camera', 1390, 300], ['far · z −1100', 300, 800], ['paper-motion', 1380, 790]];
    for (const [txt, x, y] of tags) world.append(el('div', `position:absolute;left:${x}px;top:${y}px;transform:translateZ(420px);font:500 26px/1 ${MONO};color:var(--pm-f, #fff);padding:14px 18px;border:1.5px solid var(--pm-f, #fff);white-space:nowrap`, txt));
    s.update((t) => F.orbit(world, t, L({ duration: 5, yaw: [-24, 24], pitch: [12, -4], dolly: [-250, 150] })));
  },
  drawOn(s, st) {
    const wrap = el('div', 'position:absolute;inset:0'); st.append(wrap);
    const sine = Array.from({ length: 121 }, (_, i) => `${i ? 'L' : 'M'}${260 + i * 11.67} ${540 + Math.sin(i / 120 * Math.PI * 4) * 150}`).join('');
    wrap.innerHTML = `<svg width="${W}" height="${H}" fill="none" style="stroke:var(--pm-f, var(--pm-f, #fff))" stroke-width="2.5">
      <line x1="160" y1="540" x2="1760" y2="540"/>
      <line x1="960" y1="120" x2="960" y2="960"/>
      <circle cx="960" cy="540" r="320"/>
      <rect x="560" y="315" width="800" height="450"/>
      <path d="${sine}" style="stroke:var(--pm-m, var(--pm-m, #8a8a8a))"/>
      <circle cx="960" cy="540" r="10"/>
      <path d="M1520 300 L1700 300 L1700 420"/>
      <path d="M400 780 L220 780 L220 660"/>
    </svg>`;
    const svg = wrap.querySelector('svg');
    const labels = [['t = 0', 230, 820], ['1920 × 1080', 1530, 262], ['frame', 576, 285]].map(([txt, x, y]) => { const l = el('div', `position:absolute;left:${x}px;top:${y}px;font:500 24px/1 ${MONO};color:var(--pm-f, #fff)`, txt); wrap.append(l); return l; });
    s.update((t) => { F.drawOn(svg, t, L({ start: 0.3, each: 0.18, duration: 1.3 })); labels.forEach((l, i) => { l.style.opacity = progress(t, 1.6 + i * 0.2, 2.0 + i * 0.2); }); fadeOut(wrap, t); });
  },
};

export const NAMES = Object.keys(DEMOS);
