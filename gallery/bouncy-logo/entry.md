---
title: Bouncy logo
summary: A dot falls, bounces, and unrolls into your word, letter by letter, with real weight.
format: "9:16"
duration: 7.5
techniques: [logo reveal, squash and stretch, springs, overlap, behind the scenes]
bring:
  - Your word, and a bold rounded font that is installed or that you have as a file.
  - Headless Chrome (or any canvas renderer) and ffmpeg on the machine.
variables:
  - key: word
    label: Your word
    default: pomelo
  - key: background
    label: Background
    default: "#FBF4E4"
  - key: ink
    label: Letters
    default: "#1E1612"
  - key: font
    label: Font
    default: Arial Rounded MT Bold
runs:
  tried: 1
  passed: 1
  model: claude-opus-5-5
  agent: Claude Code, a fresh subagent given only this prompt
  date: 2026-11-14
  minutes: 25
  note: Two director's passes, each with a fresh blind critic. The second still said "needs rework", mostly asking for things the script rules out (a shadow, more bounces, a shorter hold); those notes were left out on purpose.
credits:
  - asset: Typeface Arial Rounded MT Bold
    by: Monotype, bundled with macOS
    license: system font
---

## Prompt

```text
Make a 7.5 s logo reveal, 1080×1920 (9:16), 60 fps, rendered from code
(canvas or SVG where every frame is a pure function of time, encoded with
ffmpeg).

LOOK
- Warm flat background {{background}}, no texture.
- The word "{{word}}" in lowercase, in a bold geometric sans with round
  terminals ({{font}}), in {{ink}}.
- Every letter is its own object, with its pivot on the baseline.

SCRIPT (exact times)
1. 0.0–0.5 s: a dot (the size of the counter of an "o") falls from outside the
   frame with real gravity (ease-in) and hits the centre of the baseline. On
   impact: squash 130/70 for 3 frames.
2. 0.5–1.0 s: it bounces to ~40% of the height, stretching vertically on the
   way up, leaving a thin 1 px trail that fades.
3. 1.0–1.5 s: at the top of the bounce the dot becomes the first letter of
   "{{word}}", and the other letters are born from it in order, coiled in a
   spiral going up and to the right. Each letter is rotated ~40° from the
   previous one, like a ribbon unrolling.
4. 1.5–3.2 s: each letter jumps on a parabola (x linear, y with gravity) to
   its final place. Stagger 4–5 frames between letters. On landing: a light
   squash, a rotation back to 0 with overshoot (spring, damping ~12) and a
   micro-bounce. The second-to-last letter lands last, from higher up, and
   bounces twice.
5. 3.2–7.5 s: hold on "{{word}}", perfectly kerned and still, no jitter.

MOTION RULES
- No linear tweens: everything is gravity, squash and stretch, overlap and
  follow-through.
- No letter ever goes through the baseline.
- The letters never all move at once: there is always one ahead and one behind.

BEHIND THE SCENES VERSION (also deliver it)
- The same animation in the bottom half, and above it the same again with
  each letter's path drawn over it (thin dotted line), keyframes as small
  squares and pivots as crosses, in grey at 40%. Titles "Behind the scenes"
  and "Final animation" on dark bands.

CHECKS (required before you say it's done)
- Render a contact sheet with frames at 0.1, 0.4, 0.6, 0.9, 1.2, 1.5, 1.8,
  2.2, 2.7, 3.2 and 5.0 s, and look at it.
- Does the fall feel heavy? Does the chain read as one thing unrolling, or as
  loose letters? Is the hold perfectly still?
- Deliver both mp4s and the final contact sheet.
```

## Failure modes

- **Loose letters instead of a ribbon.** Step 3 came out as small letters piled up near the dot. Ask for the spiral: each letter born from the previous one's trailing edge, rotated from it, at most a little smaller.
- **The fall reads as linear.** The dot doesn't start from rest. Ask for it to start still just above the frame and accelerate.
- **The hold flickers.** Even with still pixels, default x264 settings make flat colours shimmer by a few levels. Ask for a constant-quality encode (`-x264-params qcomp=0:aq-mode=0`, no psy) and check the last second's frames are identical.
- **Letters leave the frame.** A tall letter at the top of the coil can poke out of the top. Ask it to keep the coil at least 90 px inside.

## Notes

What the agent had to decide for itself, so you know where yours may differ:
- "Bounces to ~40% of the height" was read as 40% of the drop, not of the frame, so the coil stays on screen.
- One gravity can't fit both a 0.5 s fall and a 0.5 s rise to that height, so the fall, the rise and the letters each got their own.
- With a 4–5 frame stagger, every letter is briefly in the air at once; "never all at once" was read as "always staggered".
- The behind-the-scenes version shows the top 1080×1200 of each half, where the action is, so the letters stay readable.

An earlier version of this prompt had "bouncy" written into step 3 and needed a reference video to get the unrolling right. This one takes any word, and this run used none.
