# Rendering

```
node ENGINE render <scene.html> [--out file] [--format mp4|hevc|prores|webm|gif|png]
       [--from s] [--to s] [--fps n] [--crf n] [--dpr 1|2] [--workers n] [--audio file]
       [--gif-width 720] [--gif-fps 24]
```

How it works: a local server serves the scene with `?render`; N headless
Chromium pages each take a contiguous chunk of frames, call `window.__pm.seek(t)`,
capture a PNG, and pipe it to ffmpeg as a lossless RGB segment. Segments are
concatenated and encoded once to the final format, with correct BT.709 color
conversion and tags.

## Formats

| `--format` | Output | Use for |
|---|---|---|
| `mp4` (default) | H.264, yuv420p, crf 16, aq-mode 3, faststart | Sharing anywhere |
| `hevc` | H.265 10-bit, crf 18, `hvc1` tag | Smooth gradients (least banding), Apple devices |
| `prores` | ProRes 422 HQ 10-bit `.mov` | Master for editing / color grading |
| `webm` | VP9, crf 20 | Web embeds |
| `gif` | Palette-optimized GIF (720 px, 24 fps by default) | Previews, READMEs |
| `png` | PNG sequence folder | Compositing, print stills |

Sound effects declared with `s.sfx()` are synthesized and mixed in
automatically (`--no-sfx` to skip; `sfx <scene>` exports only the WAV).

`--crf` lowers = better/bigger (mp4 12–20 sensible). `--audio` muxes AAC 320k
(Opus for webm), trimmed to the video.

## Motion blur

`--motion-blur 8` renders 8 subframes per frame across the shutter (default
`--shutter 180`, like a film camera or After Effects) and averages them. It is
the single biggest step from "rendered by code" to "motion design". Cost scales
with the sample count (6–8 for finals, 1 for drafts). `still --motion-blur 8`
previews a blurred frame.

## Quality

- Shaders already render at 2× pixel ratio (supersampled). `--dpr 2` also
  supersamples DOM text/SVG, then downsamples with Lanczos. Slower; use for
  finals with fine type or thin lines.
- Banding on dark gradients: add grain in the shader, use `hevc`, or lower crf.
- Fine line patterns (Waves, DotGrid, halftones) can moiré after scaling for
  social platforms — keep line spacing ≥ 4–6 px at output size.

## Speed

Roughly 15–30 fps of output per second at 1080p on a laptop GPU with 4 workers.
`--workers` defaults to min(4, cores/2). Drafts: `--to 3`, `--fps 15`, smaller
scene size, or stills only.

## Stills

```
node ENGINE still <scene.html> [--t 0,2.5,5 | --count 6] [--out dir] [--dpr 2] [--no-sheet]
```
PNG per time + `contact-sheet.jpg`. Default output: `<work>/stills/`.

## Troubleshooting

- **"No Chromium-based browser found"** — install Google Chrome, or
  `npx playwright-core install chromium`, or `PAPER_MOTION_BROWSER=/path/to/chrome`.
- **"ffmpeg not found"** — macOS `brew install ffmpeg`; Ubuntu `sudo apt install ffmpeg`;
  Windows `winget install ffmpeg`. Or `PAPER_MOTION_FFMPEG=/path/to/ffmpeg`.
- **"Scene never became ready"** — a JS error or missing `await s.start()`.
  Open the preview and look at the browser console.
- **"Scene error: 404 …"** — a missing asset path; paths are relative to the scene.
- **Frames differ between renders / flicker** — something isn't a function of
  `t` (random, Date, timers, an rAF loop). See the hard rules in SKILL.md.
- **Black/empty shader on Linux servers** — WebGL falls back to SwiftShader
  (CPU): works but slow. Use a GPU machine for long renders.
- **hevc unavailable** — your ffmpeg lacks libx265; use `mp4` or `prores`.
