---
title: Icon morph
summary: A system-quality app icon squashes, leaps, flips in 3D and lands as the next one, on springs, in a seamless loop.
format: "1:1"
duration: 7.5
techniques: [3D flip, springs, overlapping action, realistic materials, loop]
bring:
  - Nothing. The agent draws the icons.
  - Headless Chrome and ffmpeg on the machine.
variables:
  - key: icons
    label: Three round objects, in order
    default: a stopwatch, a compass, a camera lens
  - key: palette
    label: A background for each
    default: "lilac #B9B4F2, deep navy #1D2744, slate blue #8FA3C9"
runs:
  tried: 1
  passed: 1
  model: claude-opus-5-5
  agent: Claude Code, a fresh subagent given only this prompt
  date: 2026-11-15
  minutes: 105
  note: 'Two director''s passes with fresh blind critics, both "needs rework"; smoother side wall, a sheen sweeping the face as it turns, cleaner motion blur on the hands, richer lens reflections. Four full renders of 7–8 minutes each. The run was interrupted twice by API errors and resumed.'
credits: []
---

## Prompt

```text
Make a 7.5 s seamless loop, 1080×1080, 60 fps, rendered from code (an HTML
page where every frame is a pure function of time, captured with headless
Chrome and encoded with ffmpeg).

THE QUALITY BAR (read this first; it decides everything else)
The icon must hold up next to a macOS system icon at full size. Not flat,
not clip art: real materials. Draw each icon as layered SVG (or canvas) with
at least 15 layers: gradients, conic gradients for brushed metal, inner
shadows, bevels with a light edge and a dark edge, fine detail (60 tick
marks on a dial, engraved numerals, knurling on a crown), and glass with
two or three reflections. If a 400×400 crop of it looks like an emoji, it
isn't done.

THE OBJECT
- One app icon, big: a squircle plate (superellipse, n ≈ 5) 700 px wide,
  centred, with a soft contact shadow under it and a long, faint shadow
  falling away from the light.
- The plates are neutral materials, never saturated colour: white enamel,
  matte black, brushed steel. The colour lives in the background behind:
  {{palette}}, one per icon.
- The icon becomes, in turn: {{icons}}. The plate is a real two-sided
  slab: the current icon on its front face, the next one on its back.
- The light comes from the top left and never moves.

TIMING (exact)
- Three cycles of 2.5 s: a 1.4 s hold, then a 1.1 s morph. The last morph
  lands back on the first icon, so the last frame flows into frame 0.
- Nothing is ever completely still. Through the whole loop the plate
  floats: ±1.5° of 3D tilt on two axes and ±4 px of lift, on slow sines
  whose periods divide 7.5 s. On top of that, each icon has one small
  motion of its own in its hold (the seconds hand ticks, the needle hunts
  ±1.4° around north, the lens glints).

THE MORPH, 1.1 s (lively and fluid: every curve continuous, speeds match
at every phase boundary, no linear segments, no hard stops)
1. Anticipation, 0–0.12 s: the plate squashes to ~0.94 and its shadow
   tightens and darkens; the key part reacts first (the crown presses and
   snaps the hand back to 12, the needle twitches, the lens glints).
2. Leap and flip, 0.12–0.65 s: the plate pops up to ~1.08 (its shadow
   drops away, grows and softens, as if lifted ~60 px) and turns one full
   180° in real 3D perspective (CSS perspective ~1400 px, or WebGL) around
   a slightly diagonal axis, mostly vertical with ~15° of tilt. Its 24 px
   side wall shows, shaded, as it passes edge-on. Spread a ~30° in-plane
   twist across the flip so it lands upright. Front face until 90°, back
   face after: no swap trick.
   At the moment it is edge-on, the next background spreads from behind
   the icon as a circle with a soft 260 px edge, complete by 0.75 s.
3. Land, 0.65–1.1 s: it drops back flat on a decaying swing: about 8° past
   flat, 2° back, a fraction of a degree, rest, leaving with the same speed
   the flip arrived with. Scale 1.08 → 0.97 → 1.01 → 1. The shadow
   tightens as it lands. The new icon's parts arrive on their own springs,
   2–4 frames apart (overlapping action): buttons and crowns pop up from
   the case, hands sweep in from ~-150° and settle with a small overshoot
   (under 10°), a needle swings in from ~-120° and oscillates to its mark,
   an iris opens from closed.
- Real motion blur while it moves fast: average 8 sub-frames from 0.1 to
  0.97 s of each morph; holds are sharp.

CHECKS (required)
- A contact sheet: the middle of every hold and 4 frames across every
  morph. Look at it, and at one 400×400 crop of each icon at full size.
- Is each icon at system-icon quality (the bar above)? Is the flip real
  3D, with a visible side wall? Does any moment pop, snap or stall (scan
  the difference between neighbouring frames for spikes and zeros)? Do
  the parts arrive one after another, not all at once? Does the light
  stay top-left?
- Is the loop seamless: compare the last frame with frame 0.
- Deliver the mp4 and the contact sheet.
```

## Failure modes

- **Clip-art icons.** Few layers, no fine detail. Ask for the 15-layer bar: tick marks, bevels, brushed metal, glass reflections, and a 400×400 crop to check.
- **A flat spin instead of a flip.** The plate rotates in 2D. Ask for real perspective, with the side wall visible edge-on.
- **A mechanical change.** One quick swing and dead-still holds. Ask for the squash, the leap with the shadow dropping away, the spring landing, the staggered parts and the float in the holds.
- **It lands crooked.** A 180° flip around a tilted axis leaves the plate rotated. Ask for the in-plane twist spread across the flip.
- **Saturated plates.** Colour on the plate fights the detail. Keep plates neutral and put the colour in the background.
- **Two icons crossfading.** Ask for a two-sided slab: old icon on the front face, new on the back.

## Notes

What the run built, which is what to copy: a real CSS 3D slab (perspective 1400 px) with a front face, a back face mounted at 180° and a 24 px side wall of shaded strips; a 180° flip around an axis tilted 15°, with a 30° twist that lands it upright; hands and needles smeared across their own sub-frame interval before the 8 sub-frames are averaged, so fast parts don't leave ghost combs.

What the agent had to decide for itself:
- It paired plates and backgrounds as stopwatch on white enamel and lilac, compass on brushed steel and navy, lens on matte black and slate.
- "Lifted ~60 px" became a shadow offset plus a small upward shift, not movement towards the camera.
- It started the parts arriving a little before the landing (0.56 s), so the stopwatch lands nearly complete.

Inspired by a common After Effects exercise, morphing system-style app icons. These icons are drawn by the agent, not taken from any real app.

How this prompt got here: a first version (flat icons, 2D spin, coloured plates) was rejected for looking nothing like the bar. A second one reached the icon quality, but its quick tilt-and-swap read as mechanical. The flip, the springs and the float were then tuned on that run's code, and this prompt describes that result.
