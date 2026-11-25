---
title: Cut on the curve
summary: An editorial vertical where every transition is a match cut at the peak of a whip move, with the speed curve that explains the trick.
format: "9:16"
duration: 15
techniques: [match cuts, speed curves, whip pans, motion blur, editorial collage, captions]
bring:
  - Nothing.
  - Headless Chrome and ffmpeg on the machine.
variables:
  - key: title
    label: The title word
    default: CUTS
  - key: subjects
    label: Four subjects, one per shot (split by |)
    default: "a container ship | a paper plane | a bullet train | a rocket"
  - key: caption
    label: The caption, said over the montage
    default: Cut at the fastest moment and nobody sees the cut.
  - key: accent
    label: The accent colour
    default: "signal blue #2B59FF"
runs:
  tried: 2
  passed: 1
  model: claude-opus-5-5
  agent: Claude Code, a fresh subagent given only this prompt
  date: 2026-11-15
  minutes: 34
  note: 'The first run failed our side-by-side check: its prompt had the subjects move instead of the camera, so they stayed sharp and every cut showed. The prompt now asks for a camera whip with nothing readable at the peak; the second run passed, after two director''s passes (full-bleed colour, a smooth shutter, subjects leaning into each whip, one caption pill that flips on each cut). The run added issue numbers and figure captions above and below every shot; we removed them after review and re-rendered the same code.'
credits: []
---

## Prompt

```text
Make a 15 s vertical editorial piece, 1080×1920, 60 fps, rendered from
code (a canvas or WebGL page where every frame is a pure function of time,
captured with headless Chrome and encoded with ffmpeg).

THE TRICK (the point of this video)
A cut hidden inside a whip pan. The camera, not the subject, does the
move: it holds on shot A, then whips away on a heavily eased move (slow,
very fast, slow). Around the peak the whole frame, subject and background
together, smears into a streak of colour where nothing can be read. Cut
on the exact peak frame to shot B, already moving at the same speed in
the same direction, and let its camera decelerate onto its subject.
Done right, nobody sees the cut. Build every whip from one speed curve
(an exponential ease-in-out whose peak is ~12× its start speed, fast
enough that the peak moves at least 1.5 frame widths per frame) and cut
on the peak frame.
- On the frames either side of a cut, no subject may be readable: if a
  sharp shape or a clean colour edge survives the peak, the whip is too
  slow or the blur too short.
- Both shots share the streak's colours at the cut: shot A's last frames
  and shot B's first frames are blended streaks, so the colour change
  happens inside the blur, not as a hard swap.

THE LOOK (editorial; check on your stills)
- Newsprint: off-white paper (#F2EEE6) with a faint halftone and fibre
  texture, black ink (#111). One accent, {{accent}}, used only for the
  curve and the cut marks.
- Subjects are cut-out collage illustrations drawn in code: flat shapes
  with a halftone fill, a thin white paper border and a soft drop shadow,
  like pieces of a printed photo cut with scissors. Each shot has its own
  flat background colour block (muted: brick, sage, ochre, slate).
- Type: a heavy condensed grotesk in capitals. Captions sit in black pills
  with white text, two or three words at a time, centred in the lower
  third.
- No other text: no issue numbers, headers, footers or figure captions.
  The only words are the title, the diagram's axis and clip labels, the
  caption and the close.

TIMING (exact)
1. 0.0–2.5 s: the title "{{title}}" huge (70% of the width), its letters
   half outline, half solid, the split sliding across as a thin vertical
   accent line cuts through the word.
2. 2.5–6.0 s, the diagram: on dark ink ground, the speed curve draws
   itself (accent line, white axes); a dot rides the curve; above it a
   circle shape moves in sync with the dot's speed; at the peak a dashed
   vertical line marks the cut and the circle becomes a square while still
   moving; two clip bars under the curve ("CLIP 1", "CLIP 2") overlap at the
   peak.
3. 6.0–13.0 s, the montage: {{subjects}} (split on "|"), one per shot,
   each 1.75 s: the camera settles on the subject (a small drift while it
   holds, ~1 s readable), then whips. Each transition is the trick: a
   camera whip (alternate directions: left, up, right), cut on the peak
   frame into the next shot's whip, landing on the next subject. The caption "{{caption}}"
   plays in its pills across the montage.
4. 13.0–15.0 s, the close: the last whip lands on the title
   "{{title}}", now fully solid, with the speed curve small under it.
   Hold.
- Motion blur: average enough sub-frames on every whip (16 or more at the
  peak) that the streak is smooth, never stepped copies.

CHECKS (required)
- A contact sheet: 1.2, 4.2, the frame before and after every cut, and
  14.5. Look at it.
- Step through each cut frame by frame: is it on the speed peak, is
  nothing readable on the frames either side, and does the streak keep
  its speed and direction across it? Do the subjects read as cut-out paper? Is the ending held?
- Deliver the mp4 and the contact sheet.
```

## Failure modes

- **The cut is visible.** Our first run moved the subjects instead of the camera, so they stayed sharp at the cut and the frame swapped. Ask for a camera whip fast enough that nothing is readable at the peak, and a cut on that frame.
- **No motion blur.** Without it the whip reads as a teleport. Ask for real sub-frame blur on every whip.
- **Clip-art subjects.** Ask for halftone fills, a white paper border and a drop shadow, so they read as cut from print.

## Notes

What the run built, which is what to copy: a canvas page for the scenes and a WebGL pass that averages 24 to 256 samples along the camera path for each frame (256 at the peak); the peak moves 1,750 px per frame; the cut sits mid-exposure on the peak frame, so half of it is each shot.

What the agent had to decide for itself:
- The title, diagram and close are joined by whips too, so all six scene changes are hidden cuts.
- The film opens on the tail of a whip landing on the title, and the end card asks "This film has 6 cuts. Did you see one?".
- It framed every shot with magazine-style labels (issue numbers, figure captions); they were removed after review, and the prompt now asks for no other text.
- The caption pill stays sharp through the cuts; "nothing readable" was read as applying to the subjects.

Inspired by a common editing exercise, hiding a cut at the peak of a heavily eased move, as taught in short After Effects tutorials.
