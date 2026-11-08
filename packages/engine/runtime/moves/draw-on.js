import { ease, progress } from '../core.js';

/** Every stroke in `svg` (paths, lines, circles, rects, polylines) draws itself, one after another. */
export function drawOn(svg, t, { start = 0, each = 0.12, duration = 1.2, curve = ease.inOutCubic } = {}) {
  svg._labStrokes ??= [...svg.querySelectorAll('path, line, circle, rect, polyline, polygon')].map((el) => ({ el, len: el.getTotalLength() }));
  svg._labStrokes.forEach(({ el, len }, i) => {
    const q = curve(progress(t, start + i * each, start + i * each + duration));
    el.style.strokeDasharray = `${len} ${len}`;
    el.style.strokeDashoffset = `${len * (1 - q)}`;
    el.style.opacity = q > 0 ? 1 : 0;
  });
}
