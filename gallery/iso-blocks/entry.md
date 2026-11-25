---
title: Iso blocks
summary: A dark grid of glowing blocks rises in waves under a rolling light, rearranges into new forms and settles on a title.
format: "16:9"
duration: 12
techniques: [isometric 3D, instancing, waves, glow, titles]
bring:
  - Nothing.
  - three.js from npm, headless Chrome and ffmpeg on the machine.
variables:
  - key: lines
    label: Three title lines (split by |)
    default: "Motion design | A new dimension | Breaking boundaries"
  - key: accent
    label: Glow colour
    default: "electric violet #8A5BFF"
runs:
  tried: 1
  passed: 1
  model: claude-opus-5-5
  agent: Claude Code, a fresh subagent given only this prompt
  date: 2026-11-15
  minutes: 31
  note: 'Two director''s passes with fresh blind critics, both "needs rework"; a softer orb that keeps rolling, flights that build the cube bottom-up without crossing, calmer rows, the orb staying as the key light at the end.'
credits: []
---

## Prompt

```text
Make a 12 s tech title sequence, 1920×1080, 60 fps, rendered from code: a
three.js page where every frame is a pure function of time, captured
with headless Chrome and encoded with ffmpeg.

THE LOOK (check on your stills)
- Near-black violet ground (#07050D) with a faint radial lift in the
  centre. An isometric camera (orthographic, the classic 35.26° / 45°
  angle), slowly drifting.
- A grid of 16×16 rounded blocks (gap 8% of a block), dark glossy violet
  (#1A1230), lit by a soft ambient light and one moving point light: a
  glowing orb in {{accent}} with bloom, rolling across the grid. Blocks
  near the orb rise and light up from inside in {{accent}}; far ones stay
  dark. Use instancing.
- Titles: a clean sans (SF Pro Display or Inter), white, 3.6% of the
  frame height, with one word in {{accent}}; they fade and rise 10 px in,
  and leave the same way.

TIMING (exact)
1. 0.0–3.6 s: the orb rolls in from the left; the blocks rise in a wave
   under it and settle behind it. Title 1 ({{lines}}, split on "|").
2. 3.6–7.2 s: the grid breaks up: blocks lift and fly, staggered, into a
   floating cube of cubes (5×5×5) that slowly turns, the orb orbiting it.
   Title 2.
3. 7.2–10.0 s: the cube unravels into two long rows of mixed shapes
   (cubes, spheres, pyramids, rings) flowing past in perspective, the
   brightest near the centre. Title 3.
4. 10.0–12.0 s, the close: the shapes gather into one glowing block in the
   centre, which lands with a pulse of light across a faint floor grid;
   the last title line sits under it, held to the end.
- Every move eases; real motion blur on fast moves (average 6
  sub-frames); bloom on the lit blocks and the orb.

CHECKS (required)
- A contact sheet: 1, 2.5, 4, 5.5, 7, 8.5, 9.8, 11, 11.8. Look at it.
- Is the camera truly isometric? Do the blocks light up near the orb and
  stay dark away from it? Do the formations read clearly? Is there a
  clear ending?
- Deliver the mp4 and the contact sheet.
```

## Failure modes

- **Everything lit the same.** Ask for blocks to light only near the orb, with bloom.
- **A perspective camera.** Ask for an orthographic isometric camera.
- **Mushy formations.** Ask for clean, staggered flights into the cube of cubes and the rows.

## Notes

What the agent had to decide for itself:
- An orthographic camera can't show perspective, so the rows scene blends into a perspective view and back to exact isometric for the close.
- The camera drifts by panning and zooming only, never rotating, so the angle stays truly isometric.
- The close reuses the last title line, since the prompt gives no other text.

Inspired by a common After Effects exercise, isometric 3D motion design for tech.
