// Finding resources in the index: free words plus the choosing metadata. Plain ESM with no Node imports, so the
// same function serves `pamo search` and the site's MCP (`search` tool); the site copies this file next to customize.mjs.

const rgb = (h) => [1, 3, 5].map((i) => parseInt(h.slice(i, i + 2), 16));
/** Distance between two hex colors (0 = same, ~441 = black to white). */
export const colorDistance = (a, b) => { const x = rgb(a), y = rgb(b); return Math.hypot(x[0] - y[0], x[1] - y[1], x[2] - y[2]); };
/** How far a resource's colors sit from a brand's: the mean nearest distance (lower is closer). */
export const colorFit = (item, brand) => {
  if (!item.colors?.length || !brand.length) return null;
  const mean = item.colors.reduce((s, c) => s + Math.min(...brand.map((b) => colorDistance(c, b))), 0) / item.colors.length;
  // a resource that declares one or two colors is thin evidence of a match: nudge it behind real palettes
  return mean + (item.colors.length < 3 ? 40 * (3 - item.colors.length) : 0);
};

/**
 * Filters index items: free words over id/title/summary/tags/when/mood, plus type, mode (light|dark), mood,
 * motion (still|gentle|lively), role, energy ("3", "2-4", "<=3", ">=2") and near (hex colors, comma-separated:
 * sorts by closeness and adds `fit`).
 */
export function find(items, query, opts = {}) {
  const words = String(query ?? '').toLowerCase().split(/\s+/).filter(Boolean);
  const hit = (i) => { const hay = [i.id, i.type, i.title, i.summary, ...(i.tags ?? []), ...(i.when ?? []), ...(i.mood ?? [])].join(' ').toLowerCase(); return words.every((w) => hay.includes(w)); };
  const en = (v) => { if (!opts.energy) return true; const e = String(opts.energy), m = e.match(/^(\d)-(\d)$/); if (m) return v >= +m[1] && v <= +m[2]; if (e.startsWith('<=')) return v <= +e.slice(2); if (e.startsWith('>=')) return v >= +e.slice(2); return v === +e; };
  const near = opts.near ? String(opts.near).split(',').map((c) => c.trim()).filter((c) => /^#[0-9a-f]{6}$/i.test(c)) : [];
  let out = items.filter((i) => (!opts.type || i.type === opts.type) && (!opts.mode || i.mode === opts.mode) && (!opts.mood || (i.mood ?? []).includes(opts.mood)) && (!opts.motion || i.motion === opts.motion) && (!opts.role || i.role === opts.role) && (i.energy === undefined || en(i.energy)) && hit(i));
  if (near.length) out = out.map((i) => ({ ...i, fit: colorFit(i, near) })).filter((i) => i.fit !== null).sort((a, b) => a.fit - b.fit);
  return out;
}
