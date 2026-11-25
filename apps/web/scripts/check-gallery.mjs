// The gallery's acceptance check (docs/spec-gallery.md). Usage:
//   npm run check                          the content and the repo
//   npm run check -- http://localhost:3000 also the routes of a running site
import { execFileSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { fullPrompt, getDirector, getEntries, GALLERY_DIR } from "../src/lib/gallery.ts";

const base = process.argv[2]?.replace(/\/$/, "");
const repo = path.resolve(import.meta.dirname, "../../..");
let failed = 0;
let passed = 0;
const ok = (cond, what) => {
  if (cond) passed++;
  else failed++;
  console.log(`${cond ? "  ok  " : "  FAIL"} ${what}`);
};

console.log("content");
process.env.PAPER_MOTION_DRAFTS = "1";
const all = getEntries(); // throws on a broken entry: schema, undeclared or unused {{slots}}
ok(all.length > 0, `${all.length} entries load and validate`);
const director = getDirector();
ok(/DIRECTOR'S PASS/.test(director), "the director's pass is there");
const published = all.filter((e) => !e.draft);
ok(published.length > 0, `${published.length} published, ${all.length - published.length} draft`);

const hasFfprobe = (() => {
  try {
    execFileSync("ffprobe", ["-version"], { stdio: "ignore" });
    return true;
  } catch {
    return false;
  }
})();

for (const e of all) {
  const dir = path.join(GALLERY_DIR, e.slug);
  const p = fullPrompt(e, director);
  ok(!/\{\{/.test(p) && p.includes("DIRECTOR'S PASS"), `${e.slug}: the served prompt has no empty slots and ends with the director's pass`);
  ok(e.runs.passed <= e.runs.tried, `${e.slug}: runs passed ≤ tried`);
  if (e.draft) continue;
  ok(e.runs.tried >= 1 && e.runs.passed >= 1, `${e.slug}: published only after a cold run passed (${e.runs.passed}/${e.runs.tried})`);
  for (const f of ["video.mp4", "poster.jpg", "contact.jpg"]) ok(fs.existsSync(path.join(dir, f)), `${e.slug}: has ${f}`);
  checkVideo(e.slug, "video", path.join(dir, "video.mp4"));
  for (const a of e.alsoMade) {
    for (const f of [`also-${a.name}.mp4`, `also-${a.name}.jpg`]) ok(fs.existsSync(path.join(dir, f)), `${e.slug}: has ${f}`);
    checkVideo(e.slug, `also "${a.name}"`, path.join(dir, `also-${a.name}.mp4`));
  }
  if (e.alsoMade.length) ok(e.runs.passed >= 1 + e.alsoMade.length, `${e.slug}: each "also" video counts as a passed cold run`);
}

function checkVideo(slug, label, video) {
  if (!fs.existsSync(video)) return;
  const mb = fs.statSync(video).size / 1e6;
  ok(mb <= 8, `${slug}: ${label} is ${mb.toFixed(1)} MB (≤ 8)`);
  if (!hasFfprobe) return;
  const codec = execFileSync("ffprobe", ["-v", "error", "-select_streams", "v:0", "-show_entries", "stream=codec_name,pix_fmt", "-of", "csv=p=0", video]).toString().trim().replace(/,+$/, "");
  ok(codec === "h264,yuv420p", `${slug}: ${label} is H.264 yuv420p (${codec})`);
  const head = fs.readFileSync(video).subarray(0, 4096).toString("latin1");
  ok(head.indexOf("moov") !== -1 && (head.indexOf("mdat") === -1 || head.indexOf("moov") < head.indexOf("mdat")), `${slug}: ${label} is faststart`);
}

console.log("repo");
const tracked = execFileSync("git", ["ls-files"], { cwd: repo }).toString().split("\n");
for (const gone of ["packages/", "skills/", "registry/", "library/", "examples/"])
  ok(!tracked.some((f) => f.startsWith(gone)), `nothing tracked under ${gone}`);
for (const route of ["(lib)", "api", "b", "mcp"])
  ok(!fs.existsSync(path.join(repo, "apps/web/src/app", route)), `no ${route} route in the site`);
ok(!tracked.some((f) => /horizon\.jpg$/.test(f)), "no macOS wallpaper anywhere in the repo");

if (base) {
  console.log(`site · ${base}`);
  const get = async (u) => {
    const r = await fetch(base + u);
    return { status: r.status, text: await r.text(), type: r.headers.get("content-type") ?? "" };
  };
  const home = await get("/");
  ok(home.status === 200, "/ answers 200");
  for (const e of published) {
    const page = await get(`/v/${e.slug}`);
    ok(page.status === 200 && page.text.includes(e.title), `/v/${e.slug} answers with its title`);
    ok(home.text.includes(`/v/${e.slug}`), `/ links to ${e.slug}`);
    const pr = await get(`/v/${e.slug}/prompt.md`);
    ok(pr.status === 200 && pr.text.includes("DIRECTOR'S PASS") && !/\{\{/.test(pr.text), `/v/${e.slug}/prompt.md is the filled prompt`);
    ok(pr.type.startsWith("text/"), `/v/${e.slug}/prompt.md is plain text (${pr.type})`);
  }
  const llms = await get("/llms.txt");
  ok(llms.status === 200, "/llms.txt answers 200");
  for (const e of published) ok(llms.text.includes(`/v/${e.slug}/prompt.md`), `/llms.txt lists ${e.slug}`);
  for (const e of all.filter((x) => x.draft)) ok(!llms.text.includes(`/v/${e.slug}/`), `/llms.txt leaves out the draft ${e.slug}`);
  ok((await get("/v/not-a-video/prompt.md")).status === 404, "an unknown prompt is a 404");
}

console.log(`\n${passed} passed, ${failed} failed`);
process.exit(failed ? 1 : 0);
