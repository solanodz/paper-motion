# Craft guide

This is not a style. It is how to make *any* style land with the quality of a
finished piece rather than a demo. The user's intent always wins over these
defaults — when they want loud, make it loud with the same care.

## The one idea

A piece is **one idea, executed with conviction**. Before writing code, finish
this sentence in `brief.md`: *"It's a ___ that ___."* ("a field of warm dust
that breathes once"; "a sphere approaching under an instrument's gaze").
If you can't, you're not ready to design.

Then subtract. Every element must serve the idea. A second idea is a second piece.

## Motion craft (what makes it look like After Effects, not like code)

- **Motion blur on every final** (`render --motion-blur 8`). Crisp frames of
  moving things look generated.
- **Curves, not tweens:** `ease.smooth`/`ease.snappy` for moves, `spring()` for
  things that land (overshoot, settle). Stagger by 60–120 ms. Add anticipation
  to big moves.
- **One continuous camera:** prefer a single world the camera travels through
  (pan, push, tilt into 3D, orbit) over sections that fade in and out like
  slides. Always keep a slow drift; a dead-still camera looks rendered.
- **Text from masks:** words slide up from behind a mask line, or wipe; avoid
  typewriter cursors.
- **Big type, few elements:** on 9:16, body type is ≥ 60 px and labels ≥ 18 px.
  Drop the HUD (rulers, status pills, frame counters) unless it *is* the idea.
- **Texture that lives:** `s.grain()` and a subtle vignette over everything; the
  paper or ground has depth (shadow, perspective).
- **Make a short test shot first** (6–10 s, final quality) and get it approved
  before building a long piece.

## Structure over time (long pieces)

- A long piece is a sequence of ideas, not one idea repeated. Give each beat
  its own mechanic: typing, stamping, a wave passing, things breaking, a grid
  snapping into order, a page opening, particles converging, echoes, a camera
  turning around a model, a ring, dissolving to dust.
- Tie each mechanic to the meaning of that beat — the motion *is* the reading.
- Vary scale and density between beats (tiny → frame-filling; empty page →
  dense field). Contrast between beats is the rhythm.
- Keep a quiet constant frame (header, ruler, pill labels, the paper) so the
  variety reads as one piece.
- Use several Paper shaders as matter, each where it means something (Dithering
  ripple for a sound wave, HalftoneDots for print, GodRays for light, Water for
  reflection, ImageDithering for dissolving), not one as wallpaper.
- Build a storyboard and get it approved before building; then show stills of
  every beat, not just three.

## Restraint

- **Fewer elements, more decisions.** One material (shader), at most one
  accent, at most one typographic voice. Most great minimal pieces are 1 shader
  + 0–2 lines of type + 1 geometric gesture, or less.
- **Hold.** Let things sit still. Stillness is what makes motion legible.
  Give the eye 1–2 s at the start before anything happens, and let the end rest.
- **One gesture per beat.** If two things move, one leads and one follows.
- **Defaults are the enemy.** Shader defaults and presets are starting points;
  a piece that looks like the preset gallery isn't finished. Tune palette,
  scale, speed, grain until it's specific.

## Composition

- Decide the frame: full-bleed field, a *plate* inside margins (print feel),
  a centered object on a void, or an edge-anchored asymmetric layout.
- Margins are generous and consistent (e.g. 6–7 % of the short side). Type
  aligns to them. Small type pinned to corners reads as "instrument/edition".
- Respect safe areas for the destination (feeds crop; UI overlays bottom on 9:16).
- Check **every** still for: things touching or leaving the edge unintentionally,
  tangents (shapes kissing other shapes or the frame), dead centers that feel
  accidental, text colliding with busy texture.
- Scale contrast is drama: something very large next to something very small.

## Color

- 2–4 colors with **roles**: ground, figure, accent. The accent appears once.
- Pick a value structure first (dark ground + light figure, or the inverse),
  then hue. If it works in grayscale it will work in color.
- Muted, slightly impure colors (`#e9dccb` not `#ffffff`, `#0e0e0e` not
  `#000000`) feel material; pure primaries feel digital — use them on purpose.
- Gradients: add grain (`grainOverlay`, `grainMixer`, or PaperTexture) to fight
  banding and give them tooth. Render `--format hevc` (10-bit) if banding persists.
- Interpolate colors with `mix()` / `keys()` (OKLab) — never through gray mud.

## Type

- Type is optional. If it's there, it's said once and quietly.
- One family, ≤ 2 weights, ≤ 3 sizes. Tracking: wide for small caps/mono labels
  (0.15–0.4 em), tight or default for large display.
- Legibility over texture: `mix-blend-mode: difference` keeps light type legible
  across light and dark fields; or place type in a margin, not over the busy part.
- Prefer system or local fonts for reliable renders (Helvetica Neue, Iowan Old
  Style, SF Mono, Georgia…). For web fonts, put files in the work folder.
- Animate type with intention: blur→focus, letter stagger, tracking change,
  mask reveal. Not bounce. Never more than one type animation at a time.

## Motion

- **Tempo** is the first motion decision: contemplative (8–20 s gestures),
  measured (2–4 s), or punctual (< 1 s cuts). Keep one tempo per piece.
- **Easing vocabulary**: pick 1–2 curves and reuse them. `inOutSine/inOutCubic`
  for breathing and drift; `outExpo/outQuart` for arrivals that settle;
  `inCubic` for exits. Linear only for continuous drift (rotation, scroll).
- Shader `speed` is usually too fast at default for contemplative work —
  0.1–0.4 is typical. Drive *params* over time (scale, distortion, colors,
  offsets) for the dramaturgy; let `speed` provide the life underneath.
- Loops: use periodic functions with period = duration / n (`osc(t, D)`), and
  `{ loop: seconds }` for diffuse fields. Verify first vs last frame stills.
- Structure the timeline in beats in `brief.md` (0 s …, 3 s …) and stick to it.

## Material notes (Paper shaders)

- **Fields** (MeshGradient, GrainGradient, SimplexNoise, Warp, Swirl, SmokeRing,
  GodRays, NeuroNoise): atmosphere, light, emotion. Big, slow, grainy.
- **Patterns** (Waves, DotGrid, DotOrbit, Voronoi, Spiral, Metaballs):
  graphic/print. Treat like ink on paper: few colors, crisp.
- **1-bit / print** (Dithering, ImageDithering, HalftoneDots, HalftoneCmyk):
  technical, editorial, nostalgic. Pixel size is a design decision — keep it
  integer-looking (2–4 px at 1080p).
- **Optical** (FlutedGlass, Water, LensDistortion, LiquidMetal, GemSmoke):
  transform a user image/logo; restraint matters most here.
- Layering: shaders are just elements — stack them with CSS opacity and
  `mix-blend-mode` (multiply for paper/ink, screen for light, difference for type).

## Critique checklist (run on every contact sheet)

1. Does each frame read as the one idea? Would it work as a poster?
2. Is there a clear focal point / hierarchy in every still?
3. Edges: nothing cropped or tangent by accident; margins consistent.
4. Type legible over every part of the background it crosses?
5. Value contrast enough on a phone at 30 % brightness?
6. Banding, aliasing, moiré (fine patterns at small scale), flicker between frames?
7. Is there anything that could be removed? Remove it.
8. Does the motion have beginning, development, rest — or a seamless loop?
9. Is it specific to *this* user's brief, or could it be anyone's? Push specificity.
