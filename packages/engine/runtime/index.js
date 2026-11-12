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
      marks: this.marks ?? [],   // gestures a scene declared (B.cue): where its hits land, for cutting it short
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

// A scene shown inside another page (?embed: the studio's live previews) draws its shaders at the size it is shown,
// not at the frame's full size times the screen's density (8 million pixels a frame on a Retina screen for a box
// 700 px wide). Renders never pass ?embed, so they keep every pixel.
const EMBED_PIXELS = typeof location !== 'undefined' && /[?&]embed(?:[=&]|$)/.test(location.search)
  ? Math.max(480 * 270, Math.round(innerWidth * innerHeight * Math.max(1, globalThis.devicePixelRatio ?? 1) ** 2))
  : null;

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
      this.options.maxPixelCount ?? EMBED_PIXELS ?? 3840 * 2160 * 2,
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
    // embedded, a layer no one can see (a later shot waiting at opacity 0, display none) is not drawn this frame
    if (EMBED_PIXELS && this.el.checkVisibility && !this.el.checkVisibility({ opacityProperty: true, visibilityProperty: true })) return;
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
  const W = window.innerWidth, H = window.innerHeight;
  for (const v of document.querySelectorAll('video[data-pm-sync]')) {
    v.pause();
    // only what the camera sees: an off-screen clip is seeked when it comes into view. A wall of dozens of
    // clips otherwise exhausts the hardware decoders and their seeks stop reporting back.
    const r = v.getBoundingClientRect();
    if (r.width < 1 || r.height < 1 || r.right < 0 || r.bottom < 0 || r.left > W || r.top > H) continue;
    const target = t + Number(v.dataset.pmOffset ?? 0);
    const d = v.duration || Infinity;
    // wrap negative offsets too (a looping clip that starts mid-way), and never ask for a time outside [0, d]
    const tt = v.loop && Number.isFinite(d) ? ((target % d) + d) % d : Math.max(0, Math.min(target, d));
    if (Math.abs(v.currentTime - tt) > 1e-4) {
      // a seek that never reports back (decoder stall, error) must not hang the render: nudge it twice, then give up
      out.push(new Promise((r) => {
        const done = () => { clearTimeout(timer); v.removeEventListener('seeked', done); v.removeEventListener('error', done); r(); };
        let tries = 0;
        const retry = () => { if (++tries < 3) { v.currentTime = tt + tries * 1e-3; timer = setTimeout(retry, 1500); } else { console.warn(`paper-motion: seek timed out on ${v.currentSrc || v.src} at ${tt.toFixed(3)}s`); done(); } };
        let timer = setTimeout(retry, 1500);
        v.addEventListener('seeked', done); v.addEventListener('error', done);
        v.currentTime = tt;
      }));
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
/* ------------------------------------------------------------------ */
/* Helpers (core.js: math, easing, springs, noise, color, text, shapes) */
/* ------------------------------------------------------------------ */

export * from './core.js';
import { clamp, lerp, invlerp, progress, ease, keys, mix, mixColor, spring, rng, noise, split } from './core.js';

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
