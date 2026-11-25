---
title: Paper cutout
summary: Your product, modelled in 3D and cut out of paper with a rough white border that boils at 12 fps, tumbling in stop-motion over a grungy wall.
format: "9:16"
duration: 12
techniques: [paper cutout, stop-motion, 3D, photocopy texture, collage, captions]
bring:
  - Nothing. The product is modelled in code from your description. A .glb of your real product, or a cut-out PNG, works better if you have one.
  - three.js from npm, headless Chrome and ffmpeg on the machine.
variables:
  - key: subject
    label: The product, physically (shape, parts, colours)
    default: a skateboard, a popsicle deck with kicked nose and tail, black grip tape on top, a bold two-colour graphic on the underside, silver trucks and four cream urethane wheels
  - key: name
    label: The name, set in cut-out letters at the end
    default: LOWTIDE
  - key: caption
    label: The caption, a few words
    default: built for the street.
  - key: wall
    label: The wall behind
    default: a weathered brick-red concrete wall with stains, chips and old paint
runs:
  tried: 1
  passed: 1
  model: claude-opus-5-5
  agent: Claude Code, a fresh subagent given only this prompt
  date: 2026-11-15
  minutes: 26
  note: 'Two director''s passes with fresh blind critics, both "needs rework"; the logo moved clear of the trucks, a rougher photocopy finish, an end-over-end tumble, details flung off in two drawings, crooked overlapping letters. The run found two contradictions in the prompt (the drawing rate and white type on white paper), fixed here since.'
credits: []
---

## Prompt

```text
Make a 12 s vertical social piece, 1080×1920, rendered from code: a three.js
page where every frame is a pure function of time, captured with headless
Chrome and encoded with ffmpeg at 60 fps, with the animation itself as
12 fps stop-motion (a new drawing every 5 frames, held in between).

THE SUBJECT
{{subject}}. If a product.glb or a cut-out product.png is in the folder,
use it; otherwise model it in three.js at true proportions.

THE CUTOUT LOOK (the point of this video; check on your stills)
- Render the product, then treat it as a printed photo cut out with
  scissors: slightly desaturated, high contrast, a little posterized, with
  photocopy grain.
- Around its silhouette, a rough white paper border, 14–20 px wide and
  uneven (thicker in places, small jagged nicks, never a clean stroke):
  dilate the product's alpha with a noise-perturbed edge. The paper has a
  faint texture and a thin grey edge where it was cut, and it casts a soft
  drop shadow on the wall, offset down-right.
- The border boils: its noise seed changes on every new drawing, so the
  cut edge redraws 12 times a second while the product holds still.
- Behind: {{wall}}, full frame, built procedurally (layered noise, stains,
  cracks, a grime gradient), slightly out of focus, with the same
  photocopy grain. Nothing else lives on the wall.
- Type: a bold lowercase sans, small (2.6% of the frame height), white on
  a black printed strip, each word its own little paper label with the
  same rough white border around the strip.

TIMING (exact)
1. 0.0–2.0 s: the wall alone for 0.4 s, then the product cutout drops in
   from above in stop-motion, lands slightly rotated with a small
   paper flutter, and its shadow catches up.
2. 2.0–6.0 s: it tumbles slowly in stop-motion steps (about 15° per
   drawing), showing its sides; at each step it is re-cut, so the border
   shape changes. The caption "{{caption}}" builds word by word under it,
   one label per beat, each landing slightly crooked.
3. 6.0–9.0 s: three close-up cutouts of the product's details (rendered at
   other angles and crops) pop on around it like a pinned collage, each
   with its own torn border and a strip of translucent tape, staggered
   0.3 s.
4. 9.0–12.0 s, the close: the details and the caption flick off in
   stop-motion; the product settles centre; "{{name}}" appears under it in
   big cut-out letters (each letter its own paper piece, the same type,
   slightly crooked, stuck down one by one). Hold to the end; only the
   border boil keeps going.

CHECKS (required)
- A contact sheet: 1.2, 3, 5, 7.5, 8.8, 11.5. Look at it.
- Zoom a crop of the border: is it rough and uneven, not a clean outline?
  Step through 12 frames: does the edge redraw every 5 frames while the
  product holds? Does it read as paper on a wall (texture, cut edge,
  shadow)? Is the ending held?
- Deliver the mp4 and the contact sheet.
```

## Failure modes

- **A clean stroke.** A uniform white outline reads as a sticker, not paper. Ask for a noise-perturbed border with nicks and a cut edge, checked on a zoomed crop.
- **Smooth motion.** At 60 fps it looks like a tween. Ask for 12 drawings a second with the border boiling on every drawing.
- **A plastic render.** A clean 3D render pasted on a wall looks fake. Ask for the photocopy treatment: desaturated, contrasty, posterized, grainy.

## Notes

What the run built, which is what to copy: the board modelled at true size in inches (a 32 × 8 in deck with concave, 7 plies, trucks and 53 mm wheels); the border made from a distance field around the product's outline, varied along the cut; each frame a function of time rounded down to the current drawing.

What the agent had to decide for itself:
- The board's graphic (teal and yellow waves, a sun sinking into stripes, the name between the trucks).
- The three details: a truck with its wheel, the tail with the wave graphic, the nose with grip and plies.
- The caption lands on a 120 bpm beat, so the name finishes by 10.4 s and holds.

Next to the reference, the board reads more like an illustration than a photocopied photo.

Inspired by a common After Effects exercise, the paper cutout effect: a subject cut out with a rough white border, on twos, over a textured wall. The product and its name are invented.
