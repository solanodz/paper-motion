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

## Motion craft

How things move belongs to the brand: follow `brand/motion.json` and MOTION.md, use its repertoire from
`paper-motion/moves`, and read the `motion-style` skill's craft guide for anything the brand leaves open. Two rules
always apply: **motion blur on every final** (`render --motion-blur 8`), and **a short test shot at final quality
before the full piece**.

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

## Color, type and motion

They belong to the brand: `tokens.json` and VISUAL.md for color and type (craft in the `visual-system` skill),
`motion.json` for motion (craft in `motion-style`). Use the brand's roles: ground most, figure for type, the accent
once. If a piece has no brand folder, decide them in its intake with those skills' guides.

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
