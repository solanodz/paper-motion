---
title: Particle logo
summary: A wordmark blows apart into thousands of its own coloured particles, swirls, and re-forms with its tagline.
format: "16:9"
duration: 9
techniques: [particles, curl noise, logo reveal, glow, motion blur]
bring:
  - Nothing. Optional - your logo as an SVG to use instead of the word.
  - Headless Chrome and ffmpeg on the machine.
variables:
  - key: word
    label: Your word (the logo)
    default: lumen
  - key: colors
    label: Its letter colours
    default: "cyan #22C3FF, magenta #FF3EA5, lime #A8EB3A, orange #FF8A1F"
  - key: tagline
    label: Tagline
    default: light, rearranged.
runs:
  tried: 1
  passed: 1
  model: claude-opus-5-5
  agent: Claude Code, a fresh subagent given only this prompt
  date: 2026-11-15
  minutes: 21
  note: 'Two director''s passes with fresh blind critics, both "needs rework"; brighter swirl, letters landing as distinct beats, a sharper snap. The run used a blue, red, yellow and green palette, which read as another company''s logo; only the colours were changed afterwards, to four vivid hues of our own, and re-rendered from the same page.'
credits: []
---

## Prompt

```text
Make a 9 s logo animation, 1920×1080, 60 fps, rendered from code (a WebGL
or canvas page where every frame is a pure function of time, captured with
headless Chrome and encoded with ffmpeg).

THE LOOK
- Pure black background with a barely visible vignette.
- The logo: the word "{{word}}" in a bold, round, friendly sans (SF Pro
  Rounded Bold, Nunito or Arial Rounded MT Bold), lowercase, 34% of the
  frame width, centred; each letter in turn takes one of {{colors}}. If
  there is a logo.svg in the folder, use it instead.
- Particles: sample the logo's filled pixels into 40,000–60,000 particles,
  1–2 px, each keeping the colour of the pixel it came from, additive
  blending with a soft glow. They must be dense enough that, when they sit
  in place, they read as the solid logo.

TIMING (exact)
1. 0.0–0.8 s: the solid logo holds, very still.
2. 0.8–2.8 s: it blows apart from left to right: a soft edge sweeps across
   the word, and each particle leaves as the edge passes, carried by wind
   to the right and up, with curl-noise turbulence, streaking (motion blur)
   and dimming as it spreads. By 2.8 s the word is a drifting coloured
   cloud filling the right half of the frame.
3. 2.8–4.2 s: the cloud swirls back around the centre in a slow vortex,
   one loose orbit, colours mixing.
4. 4.2–6.4 s: the particles fly home, each on its own curved path, the
   leftmost letters first (arrival delayed by x), easing in with a tiny
   overshoot and a sparkle when they land.
5. 6.4–6.8 s: the particles resolve into the crisp solid logo (crossfade
   particles → solid in 0.2 s) with a single soft glow pulse.
6. 6.8–9.0 s: the tagline "{{tagline}}" fades and rises 12 px into place
   under the logo (light weight, 2.6% of the frame height, white at 70%),
   and everything holds to the end with a faint shimmer on 2% of the edge
   particles.

CHECKS (required)
- A contact sheet: 0.5, 1.4, 2.0, 2.8, 3.5, 4.2, 5.0, 5.8, 6.4, 6.9, 8.5.
  Look at it.
- Do the particles keep their letters' colours? Is the logo readable as
  it re-forms (letters arriving left to right), and crisp at the end? Does
  the dissolve read as wind, not as random noise?
- Deliver the mp4 and the contact sheet.
```

## Failure modes

- **Too few particles.** The logo looks like a dotted outline. Ask for 40,000+ particles sampled from the filled pixels.
- **Random scatter.** Particles fly in straight lines. Ask for wind plus curl-noise turbulence and a sweep from left to right.
- **Mushy ending.** Particles never settle. Ask for the crossfade into the crisp solid logo at 6.4 s.

## Notes

What the run built, which is what to copy: 52,000 particles sampled from the filled pixels, each keeping its pixel's colour; a left-to-right wind sweep with curl noise; the swirl sorting into one coloured arc per letter; each letter flying home as one ribbon on a shared curve, landing as its own beat with a flash.

What the agent had to decide for itself:
- "2.6% of the frame height" for the tagline was read as cap height (about 39 px type), after the critics found 28 px unreadable.
- A vignette can't show on pure black, so the corners stay at 0 and the particles darken towards the edges instead.
- The sweep crosses the word in about 1.1 s, so the right-hand letters have time to blow away before 2.8 s.

Inspired by a common After Effects exercise, particle logo dissolves and reveals, made without plugins.
