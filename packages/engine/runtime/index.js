// paper-motion runtime
// A scene is a pure function of time t (seconds). The engine seeks t frame by
// frame and captures the page, so everything visible must be derived from t.

import { ShaderMount } from '@paper-design/shaders';
import * as PaperReact from '@paper-design/shaders-react';
import { mountPlayer } from './player.js';

const params = new URLSearchParams(location.search);
export const RENDER = params.has('render');

/* ------------------------------------------------------------------ */
/* Scene                                                               */
/* ------------------------------------------------------------------ */

let current = null;

export function scene(config = {}) {
  if (current) throw new Error('paper-motion: only one scene per page');
  current = new Scene(config);
  return current;
}

class Scene {
  constructor({ width = 1920, height = 1080, fps = 30, duration = 10, background = '#000', stage } = {}) {
    this.width = width;
    this.height = height;
    this.fps = fps;
    this.duration = duration;
    this.frames = Math.round(duration * fps);
    this.background = background;
    this.layers = [];
    this.updaters = [];
    this.pending = [];
    this.cues = [];
    this.audio = {};
    this.t = 0;
    this.stage = typeof stage === 'string' ? document.querySelector(stage) : stage
      ?? document.querySelector('[data-stage], #stage') ?? document.body;
    this.#layout();
  }

  #layout() {
    const s = this.stage.style;
    s.position = 'relative';
    s.width = `${this.width}px`;
    s.height = `${this.height}px`;
    s.overflow = 'hidden';
    s.background = this.background;
    s.transformOrigin = '0 0';
    document.documentElement.style.background = RENDER ? this.background : '#111';
    document.body.style.margin = '0';
    if (RENDER) document.body.style.overflow = 'hidden';
  }

  /** Register a function called every frame with (t, info). */
  update(fn) { this.updaters.push(fn); return this; }

  /** Mount a Paper shader into an element. Returns a layer (see ShaderLayer). */
  shader(el, name, shaderParams = {}, options = {}) {
    const layer = new ShaderLayer(resolveEl(el), name, shaderParams, options, this);
    this.layers.push(layer);
    this.pending.push(layer.ready);
    return layer;
  }

  /** Add any custom layer: an object with seek(t). */
  add(layer) { this.layers.push(layer); if (layer.ready) this.pending.push(layer.ready); return layer; }

  /**
   * Schedule a synthesized sound effect at time t (seconds). Declare cues at setup
   * time (not inside update). Types: drone, swell, pen, paper, thud, knock, tick, sweep.
   * Common opts: gain, pan (-1..1), seed; see references/sound.md for each voice.
   */
  sfx(t, type, opts = {}) { this.cues.push({ t, type, ...opts }); return this; }

  /** Master sound options: { lowpass: 2000 (Hz, caps brightness), gain: 1 }. */
  sound(opts) { Object.assign(this.audio, opts); return this; }

  /**
   * Live film grain over the whole stage (a new grain pattern every frame, like
   * AE's Add Grain). { opacity: 0.07, size: 0.9 (baseFrequency), blend: 'multiply' }
   */
  grain({ opacity = 0.07, size = 0.9, blend = 'multiply' } = {}) {
    const NS = 'http://www.w3.org/2000/svg';
    const svg = document.createElementNS(NS, 'svg');
    svg.setAttribute('width', this.width); svg.setAttribute('height', this.height);
    svg.style.cssText = `position:absolute;left:0;top:0;pointer-events:none;z-index:9999;opacity:${opacity};mix-blend-mode:${blend}`;
    svg.innerHTML = `<filter id="pm-grain" x="0" y="0" width="100%" height="100%"><feTurbulence type="fractalNoise" baseFrequency="${size}" numOctaves="2" seed="1" stitchTiles="stitch"/><feColorMatrix type="saturate" values="0"/><feComponentTransfer><feFuncR type="linear" slope="1.6" intercept="-0.3"/><feFuncG type="linear" slope="1.6" intercept="-0.3"/><feFuncB type="linear" slope="1.6" intercept="-0.3"/></feComponentTransfer></filter><rect width="100%" height="100%" filter="url(#pm-grain)"/>`;
    this.stage.appendChild(svg);
    const turb = svg.querySelector('feTurbulence');
    const fps = this.fps;
    return this.add({ seek: (t) => turb.setAttribute('seed', String(1 + Math.floor(t * fps))) });
  }

  /** Await something before the first frame (images, data, fonts...). */
  wait(promise) { this.pending.push(promise); return promise; }

  /** Render the frame for time t (seconds). */
  async seek(t) {
    this.t = t;
    const info = { t, frame: Math.round(t * this.fps), progress: this.duration ? t / this.duration : 0, duration: this.duration, fps: this.fps };
    for (const l of this.layers) l.beginFrame?.(t);
    for (const fn of this.updaters) fn(t, info);
    const waits = [];
    for (const l of this.layers) { const r = l.seek?.(t); if (r?.then) waits.push(r); }
    syncAnimations(t);
    waits.push(...syncMedia(t));
    if (waits.length) await Promise.all(waits);
  }

  /** Call once everything is defined. Resolves when the first frame is ready. */
  async start() {
    if (document.fonts?.ready) await document.fonts.ready;
    await Promise.all(this.pending);
    await nextFrame(); await nextFrame();
    let saved = null;
    if (!RENDER) { try { saved = sessionStorage.getItem(`pm:t:${location.pathname}`); } catch { /* storage blocked */ } }
    const startT = params.has('t') ? Number(params.get('t')) : saved !== null ? Number(saved) : 0;
    await this.seek(startT);
    await nextFrame();
    window.__pm = {
      config: { width: this.width, height: this.height, fps: this.fps, duration: this.duration, frames: this.frames, background: this.background },
      seek: async (t) => { await this.seek(t); await nextFrame(); await nextFrame(); return true; },
      cues: this.cues,
      audio: this.audio,
    };
    document.documentElement.dataset.pmReady = '1';
    if (!RENDER) mountPlayer(this, startT);
    return this;
  }
}

/* ------------------------------------------------------------------ */
/* Shader layer                                                        */
/* ------------------------------------------------------------------ */

export const SHADERS = Object.keys(PaperReact).filter(
  (k) => /^[A-Z]/.test(k) && k !== 'ShaderMount' && typeof PaperReact[k] === 'function',
);

const imageCache = new Map();
// A transparent pixel stands in for an image shader with no image (PaperTexture and Water also work standalone).
const BLANK = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=';

class ShaderLayer {
  /**
   * @param el       element the canvas fills (give it a size: e.g. position:absolute; inset:0)
   * @param name     Paper shader component name, e.g. 'MeshGradient', 'Dithering', 'GrainGradient'
   * @param params   same props as the React component (colors, distortion, speed, scale, image...)
   * @param options  { loop: seconds of crossfade for seamless loops, timeOffset, minPixelRatio, maxPixelCount }
   */
  constructor(el, name, shaderParams, options, sceneRef) {
    const Comp = PaperReact[name];
    if (!SHADERS.includes(name)) throw new Error(`paper-motion: unknown shader "${name}". Available: ${SHADERS.join(', ')}`);
    this.el = el;
    this.name = name;
    this.Comp = Comp;
    this.params = { ...shaderParams };
    this.options = options;
    this.scene = sceneRef;
    /** Override shader time (seconds) for the current frame; resets every frame. */
    this.time = null;
    this.ready = this.#init();
  }

  async #init() {
    const props = await resolveProps(this.Comp, this.params);
    const uniforms = await loadUniforms(props.uniforms);
    this.speed = props.speed ?? 0;
    this.frame0 = props.frame ?? 0;
    const cs = getComputedStyle(this.el);
    if (cs.position === 'static') this.el.style.position = 'relative';
    const make = (host) => new ShaderMount(
      host, props.fragmentShader, uniforms,
      { preserveDrawingBuffer: true, ...(props.webGlContextAttributes ?? {}) },
      0, this.frame0,
      this.options.minPixelRatio ?? 2,
      this.options.maxPixelCount ?? 3840 * 2160 * 2,
      props.mipmaps,
    );
    if (this.options.loop) {
      // Two stacked mounts crossfaded over the last `loop` seconds -> seamless loop.
      this.hostA = child(this.el); this.hostB = child(this.el);
      this.a = make(this.hostA); this.b = make(this.hostB);
      this.hostB.style.opacity = '0';
    } else {
      this.a = make(this.el);
    }
    this.lastUniforms = uniforms;
  }

  /** Change params (sync). For a new image use `await layer.load({ image })`. */
  set(partial) {
    Object.assign(this.params, partial);
    const props = resolvePropsSync(this.Comp, this.params);
    const u = {};
    for (const [k, v] of Object.entries(props.uniforms)) {
      if (typeof v === 'string') {
        const img = imageCache.get(v) ?? (v === '' ? imageCache.get(BLANK) : undefined);
        if (!img) throw new Error(`paper-motion: image "${v}" not loaded yet; use await layer.load({...})`);
        u[k] = img;
      } else u[k] = v;
    }
    this.speed = props.speed ?? this.speed;
    this.a?.setUniforms(u); this.b?.setUniforms(u);
    return this;
  }

  /** Change params that need loading (images). */
  async load(partial) {
    Object.assign(this.params, partial);
    const props = await resolveProps(this.Comp, this.params);
    const u = await loadUniforms(props.uniforms);
    this.a?.setUniforms(u); this.b?.setUniforms(u);
  }

  beginFrame() { this.time = null; }

  seek(t) {
    if (!this.a) return;
    const time = this.time ?? (t + (this.options.timeOffset ?? 0));
    const ms = (s) => this.frame0 + s * 1000 * this.speed;
    const L = this.options.loop;
    if (!L) { this.a.setFrame(ms(time)); return; }
    const D = this.scene.duration;
    // A plays time+L, B plays time+L-D; at t=D, B shows exactly what A showed at t=0.
    this.a.setFrame(ms(time + L));
    const fade = clamp((t - (D - L)) / L, 0, 1);
    this.hostB.style.opacity = String(fade);
    if (fade > 0) this.b.setFrame(ms(time + L - D));
  }
}

async function resolveProps(Comp, p) {
  for (let i = 0; i < 20; i++) {
    try { return Comp({ ...p, suspendWhenProcessingImage: true }).props; }
    catch (e) { if (e && typeof e.then === 'function') { await e.catch(() => {}); continue; } throw e; }
  }
  throw new Error('paper-motion: could not resolve shader props');
}
function resolvePropsSync(Comp, p) {
  try { return Comp({ ...p, suspendWhenProcessingImage: true }).props; }
  catch (e) { if (e && typeof e.then === 'function') throw new Error('paper-motion: this change needs `await layer.load(...)`'); throw e; }
}

async function loadUniforms(uniforms) {
  const out = {};
  await Promise.all(Object.entries(uniforms).map(async ([k, v]) => {
    if (typeof v === 'string') out[k] = await loadImage(v || BLANK);
    else if (v instanceof HTMLImageElement) { await v.decode(); minSize(v); out[k] = v; }
    else out[k] = v;
  }));
  return out;
}

export function loadImage(url) {
  if (imageCache.has(url)) return Promise.resolve(imageCache.get(url));
  return new Promise((res, rej) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => { minSize(img); imageCache.set(url, img); res(img); };
    img.onerror = () => rej(new Error(`paper-motion: failed to load image ${url}`));
    img.src = url;
  });
}
function minSize(img) {
  if (img.naturalWidth < 1024 && img.naturalHeight < 1024 && img.naturalWidth > 0) {
    const a = img.naturalWidth / img.naturalHeight;
    img.width = Math.round(a > 1 ? 1024 * a : 1024);
    img.height = Math.round(a > 1 ? 1024 : 1024 / a);
  }
}

/* ------------------------------------------------------------------ */
/* Determinism helpers                                                 */
/* ------------------------------------------------------------------ */

// CSS animations / transitions / WAAPI are paused and driven by t.
function syncAnimations(t) {
  if (!document.getAnimations) return;
  for (const a of document.getAnimations()) { a.pause(); a.currentTime = t * 1000; }
}

// <video data-pm-sync data-pm-offset="0"> elements follow scene time.
function syncMedia(t) {
  const out = [];
  for (const v of document.querySelectorAll('video[data-pm-sync]')) {
    v.pause();
    const target = t + Number(v.dataset.pmOffset ?? 0);
    const d = v.duration || Infinity;
    const tt = v.loop && Number.isFinite(d) ? target % d : Math.min(target, d);
    if (Math.abs(v.currentTime - tt) > 1e-4) {
      out.push(new Promise((r) => { v.addEventListener('seeked', r, { once: true }); v.currentTime = tt; }));
    }
  }
  return out;
}

// rAF is paused in hidden/occluded windows (even when document.hidden is false);
// race it with a timer so a background preview still boots.
const nextFrame = () => new Promise((r) => { requestAnimationFrame(() => r()); setTimeout(r, 100); });
const resolveEl = (el) => (typeof el === 'string' ? document.querySelector(el) : el);
function child(parent) {
  const d = document.createElement('div');
  d.style.cssText = 'position:absolute;inset:0;';
  parent.appendChild(d);
  return d;
}

/* ------------------------------------------------------------------ */
/* Math, timing, easing                                                */
/* ------------------------------------------------------------------ */

export const clamp = (v, a = 0, b = 1) => Math.min(b, Math.max(a, v));
export const lerp = (a, b, p) => a + (b - a) * p;
export const invlerp = (a, b, v) => (b === a ? 0 : (v - a) / (b - a));
export const remap = (v, a, b, c, d, doClamp = true) => lerp(c, d, doClamp ? clamp(invlerp(a, b, v)) : invlerp(a, b, v));
export const smoothstep = (e0, e1, x) => { const p = clamp((x - e0) / (e1 - e0)); return p * p * (3 - 2 * p); };
export const fract = (x) => x - Math.floor(x);
export const TAU = Math.PI * 2;

/** 0..1 progress of t through [start, end], eased. */
export const progress = (t, start, end, easing = ease.linear) => easing(clamp(invlerp(start, end, t)));

/** Progress for item i of a staggered group. */
export const stagger = (t, i, { start = 0, each = 0.08, duration = 0.8, easing } = {}) =>
  progress(t, start + i * each, start + i * each + duration, easing);

/** 0..1 phase of t in a cycle of `period` seconds. */
export const phase = (t, period) => fract(t / period);
/** Sine oscillator in -1..1. Use period = duration / n for perfect loops. */
export const osc = (t, period, offset = 0) => Math.sin(TAU * (t / period + offset));

/**
 * Keyframes: keys(t, [[0, 0], [2, 1, ease.outExpo], [5, '#ff0044']])
 * Values: numbers, arrays of numbers, or hex colors (mixed in OKLab).
 * The easing on a key applies to the segment arriving at that key.
 */
export function keys(t, frames) {
  if (t <= frames[0][0]) return frames[0][1];
  for (let i = 1; i < frames.length; i++) {
    const [t1, v1, e = ease.inOutCubic] = frames[i];
    const [t0, v0] = frames[i - 1];
    if (t <= t1) return mix(v0, v1, e(invlerp(t0, t1, t)));
  }
  return frames[frames.length - 1][1];
}

export function mix(a, b, p) {
  if (typeof a === 'number') return lerp(a, b, p);
  if (Array.isArray(a)) return a.map((v, i) => mix(v, b[i], p));
  if (typeof a === 'string') return mixColor(a, b, p);
  return p < 0.5 ? a : b;
}

const c1 = 1.70158, c3 = c1 + 1;
export const ease = {
  linear: (x) => x,
  inSine: (x) => 1 - Math.cos((x * Math.PI) / 2),
  outSine: (x) => Math.sin((x * Math.PI) / 2),
  inOutSine: (x) => -(Math.cos(Math.PI * x) - 1) / 2,
  inQuad: (x) => x * x,
  outQuad: (x) => 1 - (1 - x) ** 2,
  inOutQuad: (x) => (x < 0.5 ? 2 * x * x : 1 - (-2 * x + 2) ** 2 / 2),
  inCubic: (x) => x ** 3,
  outCubic: (x) => 1 - (1 - x) ** 3,
  inOutCubic: (x) => (x < 0.5 ? 4 * x ** 3 : 1 - (-2 * x + 2) ** 3 / 2),
  inQuart: (x) => x ** 4,
  outQuart: (x) => 1 - (1 - x) ** 4,
  inOutQuart: (x) => (x < 0.5 ? 8 * x ** 4 : 1 - (-2 * x + 2) ** 4 / 2),
  inQuint: (x) => x ** 5,
  outQuint: (x) => 1 - (1 - x) ** 5,
  inOutQuint: (x) => (x < 0.5 ? 16 * x ** 5 : 1 - (-2 * x + 2) ** 5 / 2),
  inExpo: (x) => (x === 0 ? 0 : 2 ** (10 * x - 10)),
  outExpo: (x) => (x === 1 ? 1 : 1 - 2 ** (-10 * x)),
  inOutExpo: (x) => (x === 0 ? 0 : x === 1 ? 1 : x < 0.5 ? 2 ** (20 * x - 10) / 2 : (2 - 2 ** (-20 * x + 10)) / 2),
  inCirc: (x) => 1 - Math.sqrt(1 - x * x),
  outCirc: (x) => Math.sqrt(1 - (x - 1) ** 2),
  inOutCirc: (x) => (x < 0.5 ? (1 - Math.sqrt(1 - (2 * x) ** 2)) / 2 : (Math.sqrt(1 - (-2 * x + 2) ** 2) + 1) / 2),
  outBack: (x) => 1 + c3 * (x - 1) ** 3 + c1 * (x - 1) ** 2,
  inOutBack: (x) => { const c2 = c1 * 1.525; return x < 0.5 ? ((2 * x) ** 2 * ((c2 + 1) * 2 * x - c2)) / 2 : ((2 * x - 2) ** 2 * ((c2 + 1) * (x * 2 - 2) + c2) + 2) / 2; },
  /** CSS-style cubic-bezier(x1, y1, x2, y2). */
  bezier(x1, y1, x2, y2) {
    const A = (a, b) => 1 - 3 * b + 3 * a, B = (a, b) => 3 * b - 6 * a, C = (a) => 3 * a;
    const calc = (t, a, b) => ((A(a, b) * t + B(a, b)) * t + C(a)) * t;
    const slope = (t, a, b) => 3 * A(a, b) * t * t + 2 * B(a, b) * t + C(a);
    return (x) => {
      if (x <= 0 || x >= 1) return x;
      let t = x;
      for (let i = 0; i < 8; i++) { const s = slope(t, x1, x2); if (Math.abs(s) < 1e-6) break; t -= (calc(t, x1, x2) - x) / s; }
      return calc(clamp(t), y1, y2);
    };
  },
};

// After Effects-style curves (graph editor feel)
ease.easy = ease.bezier(0.33, 0, 0.67, 1);        // AE "Easy Ease" (33% influence)
ease.smooth = ease.bezier(0.65, 0, 0.35, 1);      // stronger in/out, motion-design default
ease.snappy = ease.bezier(0.16, 1, 0.3, 1);       // fast start, long soft landing (≈ expo out)
ease.anticipate = ease.bezier(0.36, -0.35, 0.3, 1); // tiny pull-back before moving

/**
 * Physical spring, analytic (deterministic). Returns 0→1 with overshoot for
 * seconds `dt` since the spring was released (negative dt → 0).
 * Lower damping = more bounce. stiffness 170 / damping 26 is a crisp UI spring.
 */
export function spring(dt, { stiffness = 170, damping = 20, mass = 1 } = {}) {
  if (dt <= 0) return 0;
  const w0 = Math.sqrt(stiffness / mass), zeta = damping / (2 * Math.sqrt(stiffness * mass));
  if (zeta < 1) {
    const wd = w0 * Math.sqrt(1 - zeta * zeta);
    return 1 - Math.exp(-zeta * w0 * dt) * (Math.cos(wd * dt) + ((zeta * w0) / wd) * Math.sin(wd * dt));
  }
  return 1 - Math.exp(-w0 * dt) * (1 + w0 * dt);
}

/* ------------------------------------------------------------------ */
/* Randomness and noise (seeded, deterministic)                        */
/* ------------------------------------------------------------------ */

export function rng(seed = 1) {
  let a = typeof seed === 'string' ? [...seed].reduce((h, c) => Math.imul(h ^ c.charCodeAt(0), 16777619), 2166136261) : seed >>> 0;
  const next = () => {
    a |= 0; a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
  return {
    next,
    range: (lo, hi) => lo + (hi - lo) * next(),
    int: (lo, hi) => Math.floor(lo + (hi - lo + 1) * next()),
    pick: (arr) => arr[Math.floor(next() * arr.length)],
    sign: () => (next() < 0.5 ? -1 : 1),
  };
}

const hash3 = (x, y, z) => {
  let h = Math.imul(x, 374761393) ^ Math.imul(y, 668265263) ^ Math.imul(z, 2147483647);
  h = Math.imul(h ^ (h >>> 13), 1274126177);
  return ((h ^ (h >>> 16)) >>> 0) / 4294967295;
};
/** Smooth 3D value noise in 0..1. noise(x), noise(x, y), noise(x, y, z). */
export function noise(x, y = 0, z = 0) {
  const xi = Math.floor(x), yi = Math.floor(y), zi = Math.floor(z);
  const xf = x - xi, yf = y - yi, zf = z - zi;
  const u = xf * xf * (3 - 2 * xf), v = yf * yf * (3 - 2 * yf), w = zf * zf * (3 - 2 * zf);
  const n = (a, b, c) => hash3(xi + a, yi + b, zi + c);
  const x00 = lerp(n(0, 0, 0), n(1, 0, 0), u), x10 = lerp(n(0, 1, 0), n(1, 1, 0), u);
  const x01 = lerp(n(0, 0, 1), n(1, 0, 1), u), x11 = lerp(n(0, 1, 1), n(1, 1, 1), u);
  return lerp(lerp(x00, x10, v), lerp(x01, x11, v), w);
}
/** Fractal noise (octaves of value noise), 0..1. */
export function fbm(x, y = 0, z = 0, octaves = 4) {
  let s = 0, amp = 0.5, f = 1, norm = 0;
  for (let i = 0; i < octaves; i++) { s += amp * noise(x * f, y * f, z * f); norm += amp; amp *= 0.5; f *= 2; }
  return s / norm;
}

/* ------------------------------------------------------------------ */
/* Color (OKLab mixing)                                                */
/* ------------------------------------------------------------------ */

function hexToRgb(hex) {
  let h = hex.replace('#', '');
  if (h.length <= 4) h = [...h].map((c) => c + c).join('');
  const n = parseInt(h.slice(0, 6), 16);
  const a = h.length === 8 ? parseInt(h.slice(6, 8), 16) / 255 : 1;
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255, a];
}
const toLin = (c) => { c /= 255; return c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4; };
const toSrgb = (c) => Math.round(255 * clamp(c <= 0.0031308 ? 12.92 * c : 1.055 * c ** (1 / 2.4) - 0.055));
function rgbToOklab([r, g, b]) {
  r = toLin(r); g = toLin(g); b = toLin(b);
  const l = Math.cbrt(0.4122214708 * r + 0.5363325363 * g + 0.0514459929 * b);
  const m = Math.cbrt(0.2119034982 * r + 0.6806995451 * g + 0.1073969566 * b);
  const s = Math.cbrt(0.0883024619 * r + 0.2817188376 * g + 0.6299787005 * b);
  return [0.2104542553 * l + 0.793617785 * m - 0.0040720468 * s, 1.9779984951 * l - 2.428592205 * m + 0.4505937099 * s, 0.0259040371 * l + 0.7827717662 * m - 0.808675766 * s];
}
function oklabToRgb([L, A, B]) {
  const l = (L + 0.3963377774 * A + 0.2158037573 * B) ** 3;
  const m = (L - 0.1055613458 * A - 0.0638541728 * B) ** 3;
  const s = (L - 0.0894841775 * A - 1.291485548 * B) ** 3;
  return [toSrgb(4.0767416621 * l - 3.3077115913 * m + 0.2309699292 * s), toSrgb(-1.2684380046 * l + 2.6097574011 * m - 0.3413193965 * s), toSrgb(-0.0041960863 * l - 0.7034186147 * m + 1.707614701 * s)];
}
/** Perceptual color mix of two hex colors -> hex. */
export function mixColor(a, b, p) {
  const A = hexToRgb(a), B = hexToRgb(b);
  const [r, g, bl] = oklabToRgb(mix(rgbToOklab(A), rgbToOklab(B), p));
  const al = lerp(A[3], B[3], p);
  const hx = (n) => n.toString(16).padStart(2, '0');
  return `#${hx(r)}${hx(g)}${hx(bl)}${al < 1 ? hx(Math.round(al * 255)) : ''}`;
}

/* ------------------------------------------------------------------ */
/* Typography                                                          */
/* ------------------------------------------------------------------ */

/** Wrap each word or char of an element in spans for staggered motion. Returns the spans. */
export function split(el, by = 'chars') {
  el = resolveEl(el);
  const text = el.textContent;
  el.textContent = '';
  el.setAttribute('aria-label', text);
  const out = [];
  const words = text.split(/(\s+)/);
  for (const w of words) {
    if (/^\s+$/.test(w)) { el.appendChild(document.createTextNode(w)); continue; }
    const ws = document.createElement('span');
    ws.style.display = 'inline-block';
    ws.style.whiteSpace = 'pre';
    if (by === 'words') { ws.textContent = w; out.push(ws); }
    else for (const ch of w) { const c = document.createElement('span'); c.style.display = 'inline-block'; c.textContent = ch; ws.appendChild(c); out.push(c); }
    el.appendChild(ws);
  }
  return out;
}

/* ------------------------------------------------------------------ */
/* Shapes                                                              */
/* ------------------------------------------------------------------ */

/**
 * SVG path `d` for a hand-cut rounded rectangle: the "organic" shape language.
 * Deterministic for a given seed, so a shape keeps its edges across frames and renders.
 * @param {number} w,h          size in px
 * @param {object} [o]
 * @param {number} [o.radius]   corner radius in px (default 24)
 * @param {number} [o.wobble]   edge irregularity in px (default 0.6% of the short side; keep it low)
 * @param {number} [o.seed]     changes the irregularity, not its amount
 */
export function organicPath(w, h, { radius = 24, wobble, seed = 1 } = {}) {
  const r = Math.min(radius, w / 2, h / 2);
  const amp = wobble ?? Math.min(w, h) * 0.006;
  const per = 2 * (w + h - 4 * r) + 2 * Math.PI * r;
  const n = Math.max(16, Math.round(per / 40));
  const pt = (d) => {
    // walk the rounded-rect perimeter clockwise from the top-left corner's end
    const segs = [[w - 2 * r, 'top'], [Math.PI * r / 2, 'tr'], [h - 2 * r, 'right'], [Math.PI * r / 2, 'br'], [w - 2 * r, 'bottom'], [Math.PI * r / 2, 'bl'], [h - 2 * r, 'left'], [Math.PI * r / 2, 'tl']];
    for (const [len, k] of segs) {
      if (d > len) { d -= len; continue; }
      const a = r ? d / r : 0;
      switch (k) {
        case 'top': return [r + d, 0, 0, -1];
        case 'tr': return [w - r + r * Math.sin(a), r - r * Math.cos(a), Math.sin(a), -Math.cos(a)];
        case 'right': return [w, r + d, 1, 0];
        case 'br': return [w - r + r * Math.cos(a), h - r + r * Math.sin(a), Math.cos(a), Math.sin(a)];
        case 'bottom': return [w - r - d, h, 0, 1];
        case 'bl': return [r - r * Math.sin(a), h - r + r * Math.cos(a), -Math.sin(a), Math.cos(a)];
        case 'left': return [0, h - r - d, -1, 0];
        default: return [r - r * Math.cos(a), r - r * Math.sin(a), -Math.cos(a), -Math.sin(a)];
      }
    }
    return [r, 0, 0, -1];
  };
  const P = Array.from({ length: n }, (_, i) => {
    const [x, y, nx, ny] = pt((i / n) * per);
    const o = amp * (noise(i * 0.55, seed * 7.13) * 2 - 1);
    return [x + nx * o, y + ny * o];
  });
  // closed Catmull-Rom through the points, as cubic Béziers
  let d = `M${P[0][0].toFixed(2)},${P[0][1].toFixed(2)}`;
  for (let i = 0; i < n; i++) {
    const p0 = P[(i - 1 + n) % n], p1 = P[i], p2 = P[(i + 1) % n], p3 = P[(i + 2) % n];
    const c1 = [p1[0] + (p2[0] - p0[0]) / 6, p1[1] + (p2[1] - p0[1]) / 6];
    const c2 = [p2[0] - (p3[0] - p1[0]) / 6, p2[1] - (p3[1] - p1[1]) / 6];
    d += `C${c1[0].toFixed(2)},${c1[1].toFixed(2)} ${c2[0].toFixed(2)},${c2[1].toFixed(2)} ${p2[0].toFixed(2)},${p2[1].toFixed(2)}`;
  }
  return d + 'Z';
}

/* ------------------------------------------------------------------ */
/* Live shaders (web pages, not scenes)                                */
/* ------------------------------------------------------------------ */

/**
 * Mount a Paper shader that plays in real time inside any web page (the brand sheet, a preview).
 * Scenes use s.shader() instead, which is seeked frame by frame.
 * @returns {Promise<ShaderMount>}
 */
export async function live(el, name, params = {}) {
  const Comp = PaperReact[name];
  if (!SHADERS.includes(name)) throw new Error(`paper-motion: unknown shader "${name}"`);
  const props = await resolveProps(Comp, params);
  const uniforms = await loadUniforms(props.uniforms);
  if (getComputedStyle(el).position === 'static') el.style.position = 'relative';
  return new ShaderMount(el, props.fragmentShader, uniforms, props.webGlContextAttributes ?? {}, props.speed ?? 1, props.frame ?? 0, 1.5, 1920 * 1080 * 2, props.mipmaps);
}
