// Mounts entries of a brand's shader set (brand/shader-set/set.json). Copied here by `pm shader-set build`.
// One entry → a loop in the set's format; several → a review board (4 columns, numbered).
import { scene } from 'paper-motion';

const BRAND = '/brand';

/** Periodic over the loop: a param travels from → to and back, `cycles` times per loop. */
const wave = (t, D, from, to, cycles = 1) => from + (to - from) * (0.5 - 0.5 * Math.cos((2 * Math.PI * cycles * t) / D));

export async function mount(entries, format, { board = false, numbers = [] } = {}) {
  const tokens = await fetch(`${BRAND}/tokens.json`).then((r) => (r.ok ? r.json() : null)).catch(() => null);
  const W = format.width ?? 1920, H = format.height ?? 1080, D = format.duration ?? 6;
  const s = scene({ width: board ? 1920 : W, height: board ? Math.round(1920 / 4 / (W / H)) * Math.ceil(entries.length / 4) : H, fps: format.fps ?? 30, duration: D, background: tokens?.colors?.ground?.hex ?? '#000' });
  const stage = document.querySelector('#stage');
  const cols = board ? 4 : 1, cw = board ? 1920 / 4 : W, ch = board ? Math.round(cw / (W / H)) : H;
  const wm = tokens?.wordmark?.files ?? {};
  const image = (img) => {
    if (!img) return undefined;
    if (img === 'wordmark') return `${BRAND}/${wm.onDark ?? wm.onLight}`;           // light ink on transparent (LiquidMetal, GemSmoke)
    if (img === 'wordmark-dark') return `${BRAND}/${wm.onLight ?? wm.onDark}`;      // dark ink on transparent (Heatmap)
    return img.startsWith('/') || img.startsWith('http') ? img : `${BRAND}/${img}`;
  };
  for (const [i, e] of entries.entries()) {
    const el = document.createElement('div');
    Object.assign(el.style, { position: 'absolute', left: `${(i % cols) * cw}px`, top: `${Math.floor(i / cols) * ch}px`, width: `${cw}px`, height: `${ch}px`, overflow: 'hidden', background: e.background ?? 'transparent' });
    stage.append(el);
    if (e.source === 'user' && e.file) {
      // the user's own loop: played in sync with the scene, covering the frame
      const v = Object.assign(document.createElement('video'), { src: `${BRAND}/${e.file}`, muted: true, loop: true, playsInline: true });
      v.setAttribute('data-pm-sync', ''); v.setAttribute('loop', '');
      Object.assign(v.style, { width: '100%', height: '100%', objectFit: 'cover' });
      el.append(v);
    } else {
      const props = { ...e.props };
      if (e.image) props.image = image(e.image);
      const layer = s.shader(el, e.shader, props, board || !e.loop ? {} : { loop: e.loop });
      if (e.motion) s.update((t) => layer.set({ [e.motion.param]: wave(t, D, e.motion.from, e.motion.to, e.motion.cycles) }));
    }
    if (board) {
      const lab = document.createElement('div');
      Object.assign(lab.style, { position: 'absolute', left: `${(i % cols) * cw + 12}px`, top: `${Math.floor(i / cols) * ch + 10}px`, font: '500 15px ui-monospace, Menlo, monospace', color: '#fff', textShadow: '0 0 5px #000, 0 0 2px #000', zIndex: 2 });
      lab.textContent = `${numbers[i] ?? i + 1} · ${e.id}`;
      stage.append(lab);
    }
  }
  await s.start();
}
