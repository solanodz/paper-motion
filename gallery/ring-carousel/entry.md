---
title: Ring carousel
summary: A row of big tiles folds into a leaning 3D ring, turns, then collapses into one hero tile and a closing line.
format: "9:16"
duration: 9
techniques: [3D ring, perspective, depth of field, kinetic type, generated artwork]
bring:
  - Nothing, or 8 square images of your own in a tiles/ folder. Without them, the agent designs the tiles.
  - Headless Chrome and ffmpeg on the machine.
variables:
  - key: captions
    label: The caption, phrase by phrase (four)
    default: "Here is how | you turn | eight tiles | into a ring"
  - key: closing
    label: The closing line
    default: Made from code.
  - key: palette
    label: Colours for the tiles
    default: "black, white, electric blue #2D5BFF, warm orange #FF6A2B"
runs:
  tried: 1
  passed: 1
  model: claude-opus-5-5
  agent: Claude Code, a fresh subagent given only this prompt
  date: 2026-11-14
  minutes: 28
  note: 'Two director''s passes with fresh blind critics, both "needs rework"; their notes on the fold, the stop and depth were applied, the ones that broke the timing or the measured look were not. Measured on the final stills: front tile 29% of the width, ring 90–92% of the width, at least 43 px from every edge.'
credits:
  - asset: Typefaces Helvetica Neue and New York
    by: bundled with macOS
    license: system fonts
---

## Prompt

```text
Make a 9 s vertical video, 1080×1920, 60 fps, rendered from code (a canvas
or WebGL page where every frame is a pure function of time, captured with
headless Chrome and encoded with ffmpeg).

THE LOOK (measured against the frame; check these numbers on your stills)
- A light warm grey background (#E6E5E1) with a very soft vignette.
- Eight square tiles. They are BIG: the tile in front is about 30% of the
  frame width (~320 px), the ones at the back about 22%. Corner radius
  4% of the tile, a soft shadow under each.
- The ring is seen nearly face-on, like a wheel standing up: its plane is
  tilted only ~35° away from the camera and leans ~22° clockwise. The whole
  ring, outer tile edges included, fits inside the frame on every frame,
  with at least 40 px to spare on each side: about 92% of the width and
  ~50% of the height, centred at ~55% of the height. (So the ellipse
  through the tile centres is only ~62% of the width.) Tiles always face
  the camera (billboards), so none is ever edge-on; neighbours may overlap
  by up to 25%, like a loose stack.
- If there is a tiles/ folder, use its images. Otherwise design eight tiles
  as finished small posters in {{palette}}: a big glyph, a two-word type
  poster, a halftone blob, a gradient orb, a bold number, an arrow, a
  checker, one word in a serif italic. No logos, no real people, nothing
  downloaded.
- Captions sit at ~18% of the height, 100 px, bold sans with one word per
  phrase in a serif italic.

TIMING (exact)
1. 0.0–0.6 s: the tiles slide in from the right as a straight row across
   the middle, staggered 2 frames, each landing with a small overshoot.
2. 0.6–1.6 s: the row bends into the ring, every tile on a smooth arc, the
   ring easing into its spin.
3. 1.6–6.6 s: the ring turns at a steady speed, front moving left, about
   0.8 of a turn in all.
4. 6.6–7.6 s, the close: the ring slows to a stop with one hero tile in
   front, then the other seven fold in behind it into a neat stack, while
   the hero tile grows to 62% of the frame width at the centre.
5. 7.6–9.0 s: hold on the hero tile; the closing line "{{closing}}" lands
   under it (same style as the captions) and holds to the end.
- Captions: {{captions}}, split on "|", one phrase per 1.6 s from 0.0 to
  6.4 s. Words rise 20 px into place with a blur that clears (8 frames,
  3-frame stagger) and leave by rising out the same way.

DEPTH
- A real perspective camera (field of view ~35°). Draw back to front by
  depth, every frame. Back tiles are smaller, slightly darker and a little
  blurred; the front 120° of the ring stays sharp.
- Real motion blur on the slide, the fold and the close: average 6
  sub-frames.

CHECKS (required)
- A contact sheet: 0.3, 0.8, 1.2, 1.6, 2.6, 3.6, 4.6, 5.6, 6.6, 7.1, 7.6,
  8.5. Look at it, and measure the front tile and the ring on one still
  against the numbers above. No tile may touch the frame edge.
- Do the tiles read big, the ring nearly face-on, fully inside the frame? Any
  tile popping in front in the wrong order? Is there a real ending, with
  the hero tile and the closing line held?
- Deliver the mp4 and the contact sheet.
```

## Failure modes

- **A thin band of small tiles.** The ring is seen from above. Ask for it nearly face-on (tilted ~35°), with the front tile ~30% of the width.
- **Tiles cut off at the edges.** The ring is too wide. Ask for the whole ring, tile edges included, to fit with 40 px to spare.
- **Tiles pop through each other.** The depth sort runs once. Ask for back-to-front drawing every frame.
- **No ending.** The ring just keeps turning. Ask for the close: stop on a hero tile, stack the rest behind it, land the closing line.
- **Clip-art tiles.** Ask for each tile to be a finished small poster with its own idea.

## Notes

What the agent had to decide for itself:
- The field of view (~35°) was taken as horizontal; vertical can't give the size ratio between front and back tiles.
- The ring's numbers don't all fit at once; it kept the ring width and tile sizes, which made the ring a little shorter (47% of the height) than asked.
- Tiles at equal depth swap order as they pass; each swap crossfades over a few frames so nothing pops.
- The close is a deck: the hero tile settles first and the other seven land behind it, 3–4 frames apart.


Inspired by a common After Effects exercise, a carousel of cards on a 3D null. A first version of this prompt (ring seen from above, small tiles, no ending) was run and rejected; this version fixes the framing with numbers and adds the close.
