// The app the agent runs in, so the studio can send the user back to it ("your agent asked you something").
// On macOS the CLI walks up its own process tree to the first .app bundle (Claude, Cursor, a terminal…); the studio
// brings that app to the front with `open -a`. Anywhere, PAPER_MOTION_RETURN (or --return) gives a link instead:
// the page of a browser-based agent.
import path from 'node:path';
import { execFileSync } from 'node:child_process';

export function hostApp({ url } = {}) {
  const link = url ?? process.env.PAPER_MOTION_RETURN;
  if (link && /^https?:\/\//i.test(link)) return { url: link };
  if (process.platform !== 'darwin') return null;
  // the topmost .app above this process is the window the user sees (Claude, Cursor, a terminal); bundles further
  // down are helpers and command-line tools packed as apps
  let pid = process.ppid, found = null;
  for (let i = 0; i < 30 && pid > 1; i++) {
    let out;
    try { out = execFileSync('ps', ['-o', 'ppid=,comm=', '-p', String(pid)], { encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] }).trim(); } catch { break; }
    const m = out.match(/^(\d+)\s+(.*)$/);
    if (!m) break;
    const app = m[2].match(/^(.*?\.app)\//);
    if (app) found = { app: path.basename(app[1], '.app'), path: app[1] };
    pid = Number(m[1]);
  }
  return found;
}
