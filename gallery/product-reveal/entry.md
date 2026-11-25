---
title: Product reveal
summary: A product emerges from a black void, edges first under a raking light, turns through smoke to face you, shows one detail up close and lands on its name.
format: "16:9"
duration: 17
techniques: [3D, procedural materials, rim light, smoke, depth of field, end card]
bring:
  - Nothing. The product is modelled and textured in code from your description. A .glb of your real product works better if you have one.
  - three.js from npm, headless Chrome and ffmpeg on the machine.
variables:
  - key: product
    label: Product name
    default: Mora Folio
  - key: object
    label: What it physically is (shape, size, parts)
    default: a slim A5 tech folio, closed, with rounded corners, a spine on the left and a pen loop on the right edge
  - key: material
    label: Its material and finish
    default: tan full-grain leather with fine pebbled grain and cream contrast stitching 4 mm from every edge
  - key: detail
    label: The one detail shown up close
    default: a small embossed wireless-charging mark on the front cover that glows faintly when it turns to face you
  - key: tagline
    label: Tagline
    default: Carry less. Charge everything.
  - key: site
    label: Web address
    default: mora.studio
runs:
  tried: 1
  passed: 1
  model: claude-opus-5-5
  agent: Claude Code, a fresh subagent given only this prompt
  date: 2026-11-15
  minutes: 37
  note: 'Two director''s passes with fresh blind critics, both "needs rework"; smoke that takes the warm key light, finer grain visible on the hero, a darker embossed mark with a glow, a wider opening light held on the edge, the hero pulled back with headroom.'
credits: []
---

## Prompt

```text
Make a 17 s luxury product reveal, 1920×1080, 60 fps, rendered from code:
a three.js page where every frame is a pure function of time, captured
with headless Chrome and encoded with ffmpeg.

THE PRODUCT
"{{product}}": {{object}}. Material: {{material}}. The detail: {{detail}}.
If a product.glb is in the folder, use it; otherwise model it in code
(rounded boxes, extrusions, bevels) at true proportions, and make the
material procedurally: a normal map and roughness map from noise that
match the material up close, real stitching or seams as geometry, edges
slightly worn.

THE LOOK (check on your stills)
- A pure black void, no floor, no horizon. Most of every frame is black.
- Light from one hard key that rakes across the product at a grazing
  angle, plus one thin rim light behind it, so you see edges, grain and
  stitching catching light before you see the whole object. No fill until
  the turn. Physically based materials, ACES tone mapping, a little bloom
  on the brightest highlights only.
- Shallow depth of field on the close-ups (real bokeh, not a blur of the
  whole frame), film grain, a soft vignette.
- Type: a thin serif or a light sans in wide-spaced capitals, white at 85%,
  small (2.2% of the frame height). Never more than one line on screen.

TIMING (exact)
1. 0.0–2.0 s: black; a thin line of light travels along one top edge of
   the product and fades.
2. 2.0–6.0 s: two slow close-ups in the dark: the light rakes along an edge
   with its stitching or seam (the camera dollies along it), then a corner
   turning into the light. Each close-up holds the grain in focus and the
   rest falling off into bokeh.
3. 6.0–9.0 s: a soft burst of smoke and dust on black (particles with
   volume and drift, lit by the rim light); the product emerges from it
   edge-on, spinning slowly on its vertical axis.
4. 9.0–12.0 s: it turns from edge-on to face-on and settles; a soft fill
   comes up so the whole face reads; the detail activates ({{detail}}).
5. 12.0–14.0 s: a macro of the detail with the material around it, very
   shallow focus, a slow push in.
6. 14.0–17.0 s, the close: cut to black; "{{product}}" in the spaced
   capitals, "{{tagline}}" under it smaller, "{{site}}" at the bottom,
   smallest. Each fades up 0.4 s apart. Hold to the end.
- Every move eases (no linear camera moves); real motion blur on the spin
  (average 6 sub-frames).

CHECKS (required)
- A contact sheet: 1, 3, 5, 7.5, 10.5, 13, 16.5. Look at it.
- Is the void truly black, and do you see edges and texture before the
  whole object? Does the material read up close (grain, stitching), not as
  flat plastic? Is the smoke soft and volumetric, not sprites? Is the turn
  smooth and the ending held?
- Deliver the mp4 and the contact sheet.
```

## Failure modes

- **Plastic.** A procedural material with no normal or roughness detail reads as a toy. Ask for noise-driven normals, stitching as geometry and worn edges, checked on a close-up still.
- **Everything lit at once.** A well-lit object on black is a catalogue shot, not a reveal. Ask for grazing key and rim only until the turn.
- **Sprite smoke.** Flat puffs look cheap. Ask for particles with volume, drift and rim lighting.

## Notes

What the run built, which is what to copy: the folio modelled in three.js (170 × 230 × 18 mm, a capsule spine, a hinge crease, a pen-loop tube); stitches as real geometry sunk in a stitch channel; the smoke as a ray-marched volume lit from behind and shadowed by the product, with dust motes; 6 sub-frames of motion blur on every frame.

What the agent had to decide for itself:
- "Never more than one line on screen" clashes with the three-line close; it read the rule as no wrapping and the close as the exception.
- The product emerges about 24° off edge-on and turns to exactly edge-on at 9 s before facing you, settling 11° off square.
- The mark glows as the face turns to the camera, with one glow breath in the macro.

Next to the reference, the close-ups are brighter: more lit leather and less black in the frame.

Inspired by a common After Effects and Cinema 4D exercise, the dark luxury product reveal. The product, its name and its address are invented.
