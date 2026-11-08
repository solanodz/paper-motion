// Snapshots the Google Fonts family list (public metadata, no API key) into src/data/google-fonts.json, trimmed to
// what the font-pair playground needs: [family, category, weights, variable]. Run with `npm run fonts` to refresh.
import fs from 'node:fs';

const res = await fetch('https://fonts.google.com/metadata/fonts', { headers: { 'user-agent': 'Mozilla/5.0 paper-motion' } });
if (!res.ok) throw new Error(`fonts.google.com/metadata/fonts: ${res.status}`);
const text = (await res.text()).replace(/^\)\]\}'\s*/, '');
const { familyMetadataList } = JSON.parse(text);
const rows = familyMetadataList
  .sort((a, b) => (a.popularity ?? 1e9) - (b.popularity ?? 1e9))
  .map((f) => {
    const weights = [...new Set(Object.keys(f.fonts ?? {}).filter((k) => !k.endsWith('i')).map(Number))].sort((a, b) => a - b);
    const variable = (f.axes ?? []).some((a) => a.tag === 'wght');
    return [f.family, (f.category ?? '').toLowerCase().replace(/\s+/g, '-'), weights, variable ? 1 : 0];
  });
fs.writeFileSync(new URL('../src/data/google-fonts.json', import.meta.url), JSON.stringify(rows));
console.log(`✓ ${rows.length} families → src/data/google-fonts.json`);
