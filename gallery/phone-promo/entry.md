---
title: Phone promo
summary: A real 3D phone spins in, shows your app's screens from three angles, multiplies into a grid and lands on the app's name.
format: "16:9"
duration: 12
techniques: [3D model, PBR materials, camera orbit, screen UI, instancing]
bring:
  - A phone model as phone.glb in the folder. The demo used a free iPhone 17 Pro by Ranguel on Sketchfab (CC BY).
  - three.js from npm, headless Chrome and ffmpeg on the machine.
variables:
  - key: app
    label: App name
    default: Tandem
  - key: what
    label: What the app does, in a few words
    default: a shared to-do list for couples
  - key: headline
    label: Headline
    default: Plan the week together.
  - key: accent
    label: App colour
    default: "coral #FF6B5A"
runs:
  tried: 1
  passed: 1
  model: claude-opus-5-5
  agent: Claude Code, a fresh subagent given only this prompt
  date: 2026-11-15
  minutes: 31
  note: 'Two director''s passes with fresh blind critics, both "needs rework" (a readable orbit angle, phones emerging from depth, a live moment on screen). The black Dynamic Island was asked for mid-run and is now part of the prompt.'
credits:
  - asset: iPhone 17 Pro 3D model
    by: Ranguel, Sketchfab (fan-made, not official)
    license: CC BY 4.0
---

## Prompt

```text
Make a 12 s app promo, 1920×1080, 60 fps, rendered from code: a three.js
page where every frame is a pure function of time, captured with headless
Chrome and encoded with ffmpeg. Use the phone model in ./phone.glb.

THE LOOK (a bright product studio; check these numbers on your stills)
- An off-white studio (#F3F4F6) fading to white at the top, with a soft
  contact shadow under the phone and a very faint floor reflection.
- Lighting: physically based. An environment map for reflections (three's
  RoomEnvironment), a key light from the top left, a rim light from behind
  right so the frame's metal edge catches a line of light. Tone mapping
  ACES, sRGB output.
- In hero shots the phone is about 62% of the frame height.
- The screen is ALWAYS your own UI, never the model's original texture:
  design the app "{{app}}" ({{what}}) as three screens drawn to a canvas
  and mapped onto the screen mesh as an emissive texture: a home screen
  with a list, a detail screen, and a "done" screen, in {{accent}} on
  white, with real-looking type, icons and spacing (iOS-like, but no Apple
  logos or system UI copied). Find the screen mesh by its material or its
  size; fit the texture to its rounded corners.
- The Dynamic Island (the pill at the top of the screen) is pure black,
  glossy, never grey: fix its mesh or material if the model draws it
  lighter, and check it from every angle under the reflections.

TIMING (exact)
1. 0.0–2.0 s: the phone rises from below the frame showing its back, then
   turns 180° on its long axis to face the camera, on a spring with a small
   overshoot, landing centred.
2. 2.0–4.6 s: it glides to the right third and leans back ~12°. On the left
   the headline "{{headline}}" builds word by word (bold sans, black, 6% of
   the frame height) with "{{app}}" in {{accent}} above it, smaller. On
   the screen, home scrolls and a card is tapped (a press ripple).
3. 4.6–7.2 s: the camera orbits to a three-quarter view of the phone's
   side: buttons and camera bump visible, a light sweep runs along the
   metal edge. The screen slides to the detail screen.
4. 7.2–9.6 s: the phone multiplies into a grid of 9 phones, tilted ~30°
   and laid out diagonally, each showing a different crop of the screens,
   while the camera dollies slowly across the grid.
5. 9.6–12.0 s: the close. The grid collapses back into one phone, centred,
   facing the camera, showing the "done" screen; under it the app icon,
   "{{app}}" and "Available now" fade up. Hold to the end.
- Every move eases; real motion blur on the fast ones (average 6
  sub-frames).

CHECKS (required)
- A contact sheet: 0.5, 1.2, 2.0, 3.3, 4.6, 5.9, 7.2, 8.4, 9.6, 10.5,
  11.8. Look at it.
- Does the phone read as a real metal-and-glass object (reflections, the
  rim light on the edge, a contact shadow)? Is the screen always your UI,
  sharp and legible? Is the phone ~62% of the height in hero shots? Is
  there a clear ending held on the app's name?
- Deliver the mp4 and the contact sheet.
```

## Failure modes

- **A plastic-looking phone.** No environment map or tone mapping. Ask for RoomEnvironment reflections, ACES tone mapping and a rim light on the edge.
- **The model's own wallpaper on screen.** Ask it to replace the screen texture with the app's UI on every frame.
- **A grey Dynamic Island.** Reflections and tone mapping lift its material. Ask for it pure black from every angle.
- **A tiny phone in a big empty frame.** Ask for ~62% of the frame height in hero shots.

## Notes

What the run built, which is what to copy: each sub-frame renders a floor reflection, the main scene and an unlit screen pass, then composites with ACES and sRGB; the app UI is drawn to a 1080×2344 canvas every frame and mapped onto the display mesh with UVs fitted to its corners; the island is a black pill mesh capping the hole in the display.

What the agent had to decide for itself:
- The model had an Apple logo inlay on the back; it was replaced with plain back glass, and the 78%-opaque cover glass was hidden so the screen reads.
- A side view and a readable screen pull against each other, so the orbit stops at about 54°.
- It added two small moments on screen, a "Sam checked off a task" toast and a live tick, that the prompt didn't ask for.

Inspired by After Effects app-promo templates with a 3D phone mockup. The phone model is a free fan-made iPhone 17 Pro (credited above); bring any phone .glb you like.
