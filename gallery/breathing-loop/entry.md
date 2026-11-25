---
title: Breathing loop
summary: One slow square shot of a single object seen from above that breathes, with three quiet lines, built to loop with no seam.
format: "1:1"
duration: 15
techniques: [seamless loop, GLSL shaders, rack focus, grain, minimal type]
bring:
  - Nothing.
  - Headless Chrome and ffmpeg on the machine.
variables:
  - key: object
    label: The object, seen from above
    default: a hand-thrown ceramic bowl, its unglazed clay rim (#B59E86) around a glazed inside
  - key: surface
    label: What moves inside it, and its colours
    default: "a celadon glaze that drifts like slow water: deep #5E7A6B, mid #7F9A8A, pale #C5D3C9"
  - key: ground
    label: The ground colour
    default: "linen #E8E2D6"
  - key: lines
    label: Two lines (split by |)
    default: "Made slowly. | Fired once. Kept for years."
  - key: name
    label: Name
    default: Kiln
  - key: address
    label: Address under the name
    default: kiln.studio
runs:
  tried: 1
  passed: 1
  model: claude-opus-5-5
  agent: Claude Code, a fresh subagent given only this prompt
  date: 2026-11-15
  minutes: 39
  note: 'Two director''s passes with fresh blind critics, both "needs rework"; a slower glaze, throwing rings, crackle and specks, an out-of-round rim, a linen weave with a fold. The last frame loops into frame 0 pixel for pixel.'
credits: []
---

## Prompt

```text
Make a 15 s square loop, 1080×1080, 60 fps, rendered from code (a WebGL
page where every frame is a pure function of time, captured with headless
Chrome and encoded with ffmpeg). It must loop with no seam: frame 900
equals frame 0.

THE SHOT (one shot, one breath, no cuts)
- {{object}}, seen straight from above, centred, filling ~62% of the
  frame, on {{ground}} with a faint paper grain and a soft contact shadow.
- Inside it, {{surface}}: a slow GLSL shader (domain-warped noise with fine
  grain, colours only from that ramp), lit from the upper left so it has a
  little depth and a soft specular sheen.
- Everything outside the object is the ground and dark ink type (#2B2724);
  the only colour lives inside the object.
- The camera pushes in 4% and back on one 15 s cosine (the breath) and
  rolls 0.3° with it. The shader's own time runs forward on the inhale and
  back on the exhale, so the loop closes exactly.

TIMING (exact)
1. 0–3 s, the inhale: the object alone; the surface brightens from its
   centre while the camera eases in.
2. 3–7 s: the first line of {{lines}} (split on "|") focuses in under the
   object (12 px blur → sharp, +2% scale, opacity), holds, blurs out.
3. 7–11 s: the second line, the same way.
4. 11–14.3 s: "{{name}}" letter-spaced under the object, "{{address}}"
   small in a light grey beneath it.
5. 14.3–15 s: the text is gone, the surface settles; the frame returns to
   frame 0.
- Type: a refined serif for the lines and the name (Instrument Serif,
  New York or similar), 4.2% of the frame height; a small sans for the
  address.
- Nothing appears or cuts; everything eases. Motion blur is on even though
  nothing is fast.

CHECKS (required)
- A contact sheet: 0, 1.5, 5, 9, 12.5, 14.9. Look at it.
- Compare frame 0 and frame 899 side by side, and play the mp4 looped
  three times: is there any jump? Is the colour only inside the object? Is
  every line in focus at its hold?
- Deliver the mp4 and the contact sheet.
```

## Failure modes

- **A seam at the loop.** Time that only runs forward never closes. Ask for the shader's time to run forward and back on the breath, and for frame 0 and the last frame to be compared.
- **Too much going on.** Ask for one shot, one object and one colour, inside the object only.
- **Text that pops.** Ask for every line to enter and leave by rack focus.

## Notes

What the run built, which is what to copy: one WebGL2 page with the type drawn to a texture so it can blur per frame; 8 motion-blur samples over a 180° shutter; the encode uses a single keyframe and no B-frames, so there is no soft frame at a keyframe and no step at the loop.

What the agent had to decide for itself:
- The breath is one cosine over all 15 s; "the inhale" names only the opening scene.
- Every highlight and speck is a colour from the ramp, so the brightest point is the pale glaze, not white.
- The address grey was darkened to a warm mid-grey so it reads on the linen.
- Both critics asked for a bigger push-in, larger type and a glaze that never stops; it kept the prompt's 4%, 4.2% and forward-then-back time.

Based on one of our own earlier pieces, a contemplative loop for an invented ceramics studio. The studio and the copy are invented.
