// paper-motion/brand: the brand folder inside a scene, so a piece takes its look, motion, sound and
// material from brand/ instead of re-deciding them.
//   import { loadBrand } from 'paper-motion/brand';
//   const B = await loadBrand();                       // reads /brand/* (serve from the project root)
//   const s = scene({ ..., background: B.color('ground') });
//   B.style(title, 'display'); B.shader(s, '#bg', 'mesh-ground'); B.cue(s, 'transition', 2.4); B.sound(s);
import { PACE } from './moves.js';

const get = (p, json) => fetch(p).then((r) => (r.ok ? (json ? r.json() : r.text()) : null)).catch(() => null);
const sections = (md) => Object.fromEntries((md ?? '').split(/^## /m).slice(1).map((b) => { const i = b.indexOf('\n'); return [b.slice(0, i).trim(), b.slice(i + 1).trim()]; }));

export async function loadBrand(root = '/brand') {
  const [tokens, identityMd, motion, sound, setRaw] = await Promise.all([
    get(`${root}/tokens.json`, true), get(`${root}/IDENTITY.md`), get(`${root}/motion.json`, true), get(`${root}/sound.json`, true), get(`${root}/shader-set/set.json`, true),
  ]);
  const identity = sections(identityMd);
  const set = Array.isArray(setRaw) ? { entries: setRaw } : setRaw ?? { entries: [] };

  // fonts: stylesheets and files, all loaded before the first frame
  const fonts = Object.values(tokens?.fonts ?? {}).filter(Boolean);
  await Promise.all(fonts.filter((f) => f.css).map((f) => new Promise((res) => document.head.append(Object.assign(document.createElement('link'), { rel: 'stylesheet', href: f.css, onload: res, onerror: res })))));
  for (const f of fonts) if (f.file) document.head.append(Object.assign(document.createElement('style'), { textContent: `@font-face { font-family: '${f.family}'; src: url('${root}/${f.file}'); font-weight: 100 900; }` }));
  await Promise.all(fonts.flatMap((f) => (f.weights ?? [400]).map((w) => document.fonts.load(`${w} 40px '${f.family}'`).catch(() => {}))));

  const C = tokens?.colors ?? {};
  const T = tokens?.type ?? {};
  const fam = (key) => (tokens?.fonts?.[key]?.family ? `'${tokens.fonts[key].family}', system-ui, sans-serif` : 'system-ui, sans-serif');
  const wm = tokens?.wordmark ?? {};
  const pal = sound?.cues ?? {};

  const B = {
    tokens, identity, motion, sound, set,
    name: wm.text ?? tokens?.brand ?? 'brand',
    /** A color by role (ground, figure, muted, surface, accent…), with a fallback. */
    color: (role, fallback = '#888888') => C[role]?.hex ?? fallback,
    ramp: tokens?.ramp ?? [C.ground?.hex, C.surface?.hex, C.accent?.hex].filter(Boolean),
    /** CSS font-family for a font key (display, text, mono). */
    font: fam,
    /** The type role's numbers (display, title, body, caption), scaled for a short side of `short` px. */
    type: (role, short = 1080) => { const r = T[role] ?? {}; const k = short / (T.reference ?? 1080); return { family: fam(r.font ?? 'text'), weight: r.weight ?? 400, size: (r.size ?? 32) * k, lineHeight: r.lineHeight ?? 1.2, tracking: r.tracking ?? '0em' }; },
    /** Apply a type role to an element. */
    style: (el, role, { short = 1080, color = 'figure' } = {}) => {
      const t = B.type(role, short);
      Object.assign(el.style, { fontFamily: t.family, fontWeight: t.weight, fontSize: `${t.size}px`, lineHeight: t.lineHeight, letterSpacing: t.tracking, color: B.color(color) });
      return el;
    },
    wordmark: { text: wm.text ?? tokens?.brand, onLight: wm.files?.onLight && `${root}/${wm.files.onLight}`, onDark: wm.files?.onDark && `${root}/${wm.files.onDark}` },
    /** Timing for the brand's pace: { enter, hold, stagger } in seconds. */
    pace: { ...PACE[motion?.pace ?? 'medium'], ...(motion?.timing ?? {}) },
    /** Mount a shader-set entry by id on an element (or selector). Returns the layer. */
    shader: (s, el, id, options = {}) => {
      const e = set.entries.find((x) => x.id === id);
      if (!e?.shader) throw new Error(`paper-motion/brand: no shader entry "${id}" in brand/shader-set/set.json`);
      const props = { ...e.props };
      if (e.image) props.image = e.image === 'wordmark' ? B.wordmark.onDark ?? B.wordmark.onLight : e.image === 'wordmark-dark' ? B.wordmark.onLight ?? B.wordmark.onDark : `${root}/${e.image}`;
      // the color behind the shader (entries with a transparent colorBack rely on it)
      if (e.background) { const node = typeof el === 'string' ? document.querySelector(el) : el; if (node && !node.style.background) node.style.background = e.background; }
      const layer = s.shader(el, e.shader, props, { ...(e.loop ? { loop: e.loop } : {}), ...options });
      // the entry's periodic motion, as in its rendered loop (static shaders stay alive)
      if (e.motion) { const D = set.format?.duration ?? s.duration, { param, from, to, cycles = 1 } = e.motion; s.update((t) => layer.set({ [param]: from + (to - from) * (0.5 - 0.5 * Math.cos((2 * Math.PI * cycles * t) / D)) })); }
      return layer;
    },
    /** Schedule the brand's sound for a gesture (transition, land, text) at time t. */
    cue: (s, gesture, t, extra = {}) => { const c = pal[gesture]; if (c) s.sfx(t, c.type, { ...c, ...extra }); },
    /** The brand's keystroke options for keySounds(): { bank, style, gain }. */
    keys: { ...(sound?.keys?.bank ? { bank: sound.keys.bank } : {}), ...(sound?.keys?.style ? { style: sound.keys.style } : {}), gain: sound?.keys?.gain ?? 0.16 },
    /** Apply the brand's master sound settings (and its bed, if any) to a scene. */
    sound: (s) => { if (pal.bed) s.sfx(0, pal.bed.type, { dur: s.duration, ...pal.bed }); s.sound({ lowpass: sound?.lowpass ?? 2000, gain: 1 }); },
    /** The loudness to render at (LUFS). */
    loudness: sound?.loudness ?? -16,
  };
  return B;
}
