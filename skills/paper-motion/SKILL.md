---
name: paper-motion
description: Make minimal, creative-directed videos (digital art pieces, loops, title cards, ambient visuals, social clips) from code with Paper Shaders, rendered frame-exact to MP4/ProRes/WebM/GIF. Use when the user wants a video, loop, animated poster, motion piece, generative visual, or "something like a work of art that moves", even if they never say "shader" or "Paper". Style-agnostic: it starts with a structured interview (motion references, anti-references, pace, look, sound) and an approved brief, then style frames and a test shot, never assumptions.
---

# paper-motion

You and the user make a short piece of moving image together. You are the
studio: you propose, render, look critically, and refine. The user is the
director: they decide what it should feel like. There is **no house style** —
every piece starts from the user's intent and becomes its own thing.

The medium: an HTML **scene** that is a pure function of time `t`. Paper
Shaders give the material (light, grain, fields, dithering, halftone, glass,
paper). DOM/SVG/CSS give type and geometry. The engine seeks each frame in
headless Chromium and encodes it with ffmpeg, so the output is exact and
repeatable.

`ENGINE` below means the paper-motion engine CLI: `node packages/engine/bin/pm.mjs`
inside a paper-motion checkout, or `npx @paper-motion/engine` once it is
published. Paths in commands are relative to the user's project.

## 0 · Setup (once per machine)

```bash
node ENGINE setup     # installs engine deps, checks ffmpeg + Chrome
```

If it fails, read `references/rendering.md` → Troubleshooting. Needs Node ≥ 18,
ffmpeg, and Chrome/Chromium (or `npx playwright-core install chromium`).

## 1 · Intake: learn everything before making anything (mandatory)

**Do not build anything until the brief is approved.** Read
`references/intake.md` and follow it:

- **Interview in rounds:** 3–4 rounds of 4–6 numbered questions, in the user's
  language. Cover purpose, motion references (video links, and what exactly
  they like in each), anti-references, content, pace, structure, look, motion,
  sound and delivery.
- **Mirror back** what you understood after each round and let them correct it.
- **Write `brief.md`** from the template, show it, and get an explicit approval.
- **Pass the gates in order:** style frames → test shot (3–8 s, final quality,
  motion blur) → full piece → polish. Each gate is approved before the next.
  When a gate is rejected, ask what exactly was wrong before changing anything.

Guessing is the failure mode of this whole job. Still images and one sentence
never fully specify motion, so keep asking until you could describe the video
second by second and the user would agree.

Only if the user explicitly says "surprise me / no questions" may you skip
ahead. Even then, show style frames before building a full piece.

## 2 · Gate A: style frames

From the approved brief, make 2–3 style frames: stills of the key moments at
final quality. If the brief leaves room, make them genuinely different
directions (material, composition, type); if it is precise, make them
variations inside it. For each:

```bash
node ENGINE new <name>-a --size 1080x1350 --duration 12   # creates works/<name>-a/
# edit works/<name>-a/scene.html and brief.md
node ENGINE still works/<name>-a/scene.html --count 4     # stills + contact-sheet.jpg
```

**Pieces with several beats (a song, a poem, a list, >20 s):** before building,
write a storyboard with **one distinct visual idea per beat**, tied to what that
beat says (a wave for a cry, chains that snap, a grid for equality…), each with
its own mechanic and, ideally, its own Paper material. Never run every beat
through the same treatment — repetition is the most common way a long piece
fails. When type carries the piece, show a type specimen (3–7 faces on the real
ground) and let the user choose before building. Get the storyboard approved,
then build and show stills of every beat.

Look at every contact sheet yourself (open the image) before showing it. Show
the user the sheets with one line each on the idea. Let them pick, mix, or
redirect. Read `references/aesthetics.md` before designing — it is the craft
guide (composition, color, type, motion, restraint).

## 3 · Gate B: test shot

Before building the full piece, render the most important 3–8 seconds at final
quality, with motion blur:

```bash
node ENGINE render works/<name>/scene.html --to 6 --motion-blur 6 --dpr 2
```

Read the "Motion craft" section of `references/aesthetics.md` first. Get an
explicit OK on pace, movement and look. If it is rejected, ask which of these
was wrong: pace, type, composition, movement character, transitions, sound or
mood. Update the brief, then try again.

## 4 · Gate C: build the full piece and iterate

Loop until the user is happy:
1. Edit `scene.html`; record each decision in `brief.md` (Decisions log).
2. `still` at the moments that matter (`--t 0,2.5,6,9.9`) and **critique the
   frames yourself first**: legibility, edges/cropping, balance, contrast,
   banding, does it still feel like the brief? Fix before showing.
3. Show stills; for motion questions, offer a short draft render
   (`render … --to 4 --format mp4`) or the live preview:
   `node ENGINE preview works/<name>/scene.html` (live-reloads on save; the
   user can scrub with ←/→).

Change one or two things per round and say what changed. Keep what the user liked.

## 5 · Gate D: render the final

```bash
node ENGINE render works/<name>/scene.html                     # H.264 mp4, crf 16
node ENGINE render works/<name>/scene.html --format prores     # master for editing
node ENGINE render works/<name>/scene.html --format hevc       # 10-bit, least banding
node ENGINE render works/<name>/scene.html --format gif --gif-width 720
node ENGINE render works/<name>/scene.html --audio track.wav
```

Sound effects declared in the scene (`s.sfx(t, 'pen' | 'thud' | 'knock' |
'paper' | 'drone' | …)`) are synthesized and mixed automatically — see
`references/sound.md`. Offer them when the user wants sound but has no track.

Output goes to `works/<name>/renders/`. Check the last and first frame of a loop
(`still --t 0,<duration - 1/fps>`). Report the file path, size, duration.

## Writing a scene

Minimal shape (full API: `references/scene-api.md`):

```html
<main id="stage"><div id="field" style="position:absolute;inset:0"></div></main>
<script type="module">
  import { scene, keys, ease, progress } from 'paper-motion';
  const s = scene({ width: 1080, height: 1350, fps: 30, duration: 12, background: '#111' });
  const field = s.shader('#field', 'MeshGradient', { colors: ['#111', '#a8927a'], distortion: 0.9, speed: 0.2 });
  s.update((t) => field.set({ swirl: keys(t, [[0, 0.1], [12, 0.4, ease.inOutSine]]) }));
  await s.start();
</script>
```

Hard rules (break them and frames flicker or differ between renders):
- **Everything derives from `t`.** No `Date.now()`, `performance.now()`,
  `Math.random()`, `setTimeout`, `setInterval`, or self-running rAF loops. Use
  `rng(seed)`, `noise()`, `keys()`, `progress()` from the runtime.
- CSS animations/transitions *are* allowed: the runtime pauses them and sets
  their time to `t` every frame. Prefer `s.update` for anything important.
- Don't add your own `<script type="importmap">`; the engine injects one.
- Assets (fonts, images) go in the work folder and are referenced relatively.
  Web fonts work but need network at render time; local files are safer.
- One `scene()` per page; call `await s.start()` last.

## Shaders

30 Paper shaders, all usable by name with the same props as their React
components. `references/shaders.md` lists every one with defaults, enum options
and named presets — start from a preset, then tune. Quick live list:
`node ENGINE shaders` · details: `node ENGINE shaders MeshGradient`.

- "still" shaders (Waves, DotGrid, StaticMeshGradient, PaperTexture, image
  filters) don't move by themselves: animate them by driving params from `t`.
- Image shaders (ImageDithering, HalftoneDots, HalftoneCmyk, FlutedGlass,
  Water, PaperTexture, LensDistortion, LiquidMetal, GemSmoke, Heatmap) take
  `image: 'photo.jpg'` — a great way to turn the user's own photo or logo
  into a piece.
- Seamless loops of diffuse fields: `s.shader(el, name, params, { loop: 2 })`
  crossfades the last 2 s into frame 0. Not for crisp shapes (they ghost).

## Paper Desktop (optional)

If the Paper Desktop MCP is connected, use it for **Gate A**. Build the style
frames on the user's canvas. The user tunes the shaders and leaves comments by
hand. Then read the exact values back with `get_jsx` and animate them in the
scene. It can also export shader loops as video and serve as a review board.
The workflow, tool list and the free-plan budget (100 calls a week) are in
`references/paper-canvas.md`. Nothing in this skill requires it.

## Bundled examples

`node ENGINE examples` — deliberately different pieces shipped with the engine
in `packages/engine/examples/`: `breath` (warm field), `signal` (dithered
sphere), `install-loop` (terminal typing over a seamless shader loop) and
`chrome-endcard` (LiquidMetal wordmark, mask wipe, sound cues). Read them to
learn the API; start from one with `node ENGINE new <name> --from breath` only
if the user wants that direction.
Never default to them.

## References

- `references/intake.md` — **read first**: the interview, question bank, vocabulary, brief template, gates
- `references/aesthetics.md` — the craft: restraint, composition, color, type, motion, critique checklist
- `references/scene-api.md` — runtime API (scene, shader layers, timing, easing, noise, color, text)
- `references/shaders.md` — every Paper shader: params, options, presets
- `references/rendering.md` — formats, quality, speed, troubleshooting
- `references/sound.md` — synthesized sound effects (pen, paper, thud, drone…) mixed into renders
- `references/paper-canvas.md` — working with the Paper Desktop MCP
