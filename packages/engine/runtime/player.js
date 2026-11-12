// Preview player: real-time playback, scrubbing and frame stepping.
// Only mounted in preview (never in renders). With ?embed in the address it plays and loops with no controls,
// for a scene shown inside another page (the studio's live previews).
//   space play/pause · ←/→ one frame · shift+←/→ one second · home start · L loop · H hide UI

export function mountPlayer(scene, startT = 0) {
  const { stage, duration, fps } = scene;
  const embed = new URLSearchParams(location.search).has('embed');
  let t = startT, playing = true, loop = true, last = performance.now(), busy = false;

  const bar = document.createElement('div');
  bar.innerHTML = `
    <button data-a="play" title="space">❚❚</button>
    <input type="range" min="0" max="${duration}" step="${1 / fps}" value="${t}">
    <span class="pm-time"></span>
    <button data-a="loop" title="L">loop</button>`;
  bar.style.cssText = `position:fixed;left:0;right:0;bottom:0;height:44px;display:flex;gap:12px;align-items:center;
    padding:0 16px;background:#0d0d0dee;color:#ddd;font:12px/1 ui-monospace,Menlo,monospace;z-index:99999;
    border-top:1px solid #222;box-sizing:border-box`;
  const css = document.createElement('style');
  css.textContent = `.pm-bar button{background:#1c1c1c;color:#ddd;border:1px solid #333;border-radius:6px;padding:6px 10px;font:inherit;cursor:pointer}
    .pm-bar button.on{background:#ddd;color:#111}.pm-bar input{flex:1;accent-color:#ddd}.pm-time{min-width:150px;text-align:right}`;
  bar.className = 'pm-bar';
  document.head.appendChild(css);
  document.body.appendChild(bar);
  const [playBtn, , loopBtn] = bar.querySelectorAll('button, input');
  const range = bar.querySelector('input');
  const label = bar.querySelector('.pm-time');
  loopBtn.classList.toggle('on', loop);
  if (embed) bar.style.display = 'none';

  function fit() {
    const avail = { w: innerWidth, h: innerHeight - (bar.style.display === 'none' ? 0 : 44) };
    const s = Math.min(avail.w / scene.width, avail.h / scene.height, embed ? Infinity : 1);
    stage.style.transform = `translate(${(avail.w - scene.width * s) / 2}px, ${(avail.h - scene.height * s) / 2}px) scale(${s})`;
  }
  addEventListener('resize', fit); fit();

  async function show(nt) {
    t = Math.max(0, Math.min(duration, nt));
    range.value = t;
    label.textContent = `${t.toFixed(2)}s · f${String(Math.round(t * fps)).padStart(4, '0')} / ${Math.round(duration * fps)}`;
    if (!embed) { try { sessionStorage.setItem(`pm:t:${location.pathname}`, String(t)); } catch { /* storage blocked */ } }
    busy = true; await scene.seek(t); busy = false;
  }
  function setPlaying(p) { playing = p; playBtn.textContent = p ? '❚❚' : '▶'; last = performance.now(); }

  function tick(now) {
    if (playing && !busy) {
      let nt = t + (now - last) / 1000;
      if (nt >= duration) { if (loop) nt %= duration; else { nt = duration; setPlaying(false); } }
      show(nt);
    }
    last = now;
    requestAnimationFrame(tick);
  }
  requestAnimationFrame(tick);

  playBtn.onclick = () => setPlaying(!playing);
  loopBtn.onclick = () => { loop = !loop; loopBtn.classList.toggle('on', loop); };
  range.oninput = () => { setPlaying(false); show(Number(range.value)); };
  addEventListener('keydown', (e) => {
    const step = e.shiftKey ? 1 : 1 / fps;
    if (e.code === 'Space') { e.preventDefault(); setPlaying(!playing); }
    else if (e.key === 'ArrowRight') { setPlaying(false); show(t + step); }
    else if (e.key === 'ArrowLeft') { setPlaying(false); show(t - step); }
    else if (e.key === 'Home') { show(0); }
    else if (e.key.toLowerCase() === 'l') loopBtn.click();
    else if (e.key.toLowerCase() === 'h') { bar.style.display = bar.style.display === 'none' ? 'flex' : 'none'; fit(); }
  });
  show(t);
}
