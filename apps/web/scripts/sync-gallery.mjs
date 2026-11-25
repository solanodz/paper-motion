// Copies each gallery entry's media (video, poster, contact sheet) into public/gallery/<slug>/, so the site can serve
// them. The source of truth stays at the repo root, in gallery/<slug>/.
import fs from "node:fs";
import path from "node:path";

const src = path.resolve(import.meta.dirname, "../../../gallery");
const out = path.resolve(import.meta.dirname, "../public/gallery");
fs.rmSync(out, { recursive: true, force: true });
let n = 0;
for (const d of fs.readdirSync(src, { withFileTypes: true })) {
  if (!d.isDirectory() || d.name.startsWith("_") || d.name.startsWith(".")) continue;
  const also = fs.readdirSync(path.join(src, d.name)).filter((f) => /^also-[a-z0-9-]+\.(mp4|jpg)$/.test(f));
  for (const f of ["video.mp4", "poster.jpg", "contact.jpg", ...also]) {
    const from = path.join(src, d.name, f);
    if (!fs.existsSync(from)) continue;
    fs.mkdirSync(path.join(out, d.name), { recursive: true });
    fs.copyFileSync(from, path.join(out, d.name, f));
    n++;
  }
}
console.log(`gallery: ${n} media files → public/gallery`);
