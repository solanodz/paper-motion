---
title: Product keynote
summary: A messy chat squashes into one line that becomes your app, which solves the problem on screen and closes on your name.
format: "16:9"
duration: 22
techniques: [UI animation, 3D panels, liquid background, match cut, product story]
bring:
  - Nothing. The agent designs the app's UI from your description.
  - Headless Chrome and ffmpeg on the machine.
variables:
  - key: product
    label: Product name
    default: Orbit
  - key: what
    label: What it does
    default: a calendar that finds meeting times by itself
  - key: chat
    label: The messy conversation it replaces (lines split by |)
    default: "Does Tuesday work for everyone? | Not for me, sorry | Thursday then? | Can we make it 30 min? | Wait, Friday's a holiday"
  - key: request
    label: What you type into the app
    default: 30 min with the design team
  - key: tagline
    label: Closing line
    default: Meetings find their own time.
runs:
  tried: 1
  passed: 1
  model: claude-opus-5-5
  agent: Claude Code, a fresh subagent given only this prompt
  date: 2026-11-15
  minutes: 35
  note: 'Two director''s passes with fresh blind critics, both "needs rework"; a quieter swirl, brighter UI, bigger chat, push-ins on the input and the result. The run paused once on a network error and resumed. The background was then made quieter (a black-and-dark-grey swirl instead of lavender chrome) and re-rendered from the same page.'
credits: []
---

## Prompt

```text
Make a 22 s product keynote, 1920×1080, 60 fps, rendered from code (an
HTML/canvas or WebGL page where every frame is a pure function of time,
captured with headless Chrome and encoded with ffmpeg).

THE PRODUCT
"{{product}}": {{what}}. Design its UI yourself: dark, precise, calm,
like a well-made pro app. Thin 1 px hairlines, rounded 14 px panels, one
sans (Inter or SF Pro), small mono labels, a single cool accent (lavender
#AFB4FF). No real company's UI copied.

THE LOOK
- Pure black ground. Behind the app, from 6 s on, a quiet liquid-metal
  swirl: the shapes of flowing chrome bands (slow domain-warped noise
  with soft contours), but neutral and almost black: black mixed with a
  dark grey (about #050505 to #1E1E20), no colour tint, no bright
  highlights. You should feel it move, never notice it: it must not stand
  out behind the panels, and it is never behind text.
- The app window floats in real 3D perspective (tilted ~12°, slowly
  drifting), with a soft shadow on the background.

THE STORY (exact times)
1. 0.0–4.5 s, the problem: chat bubbles pop in one by one, alternating
   left and right, small and grey: {{chat}} (split on "|"). Each new one
   pushes the others up. A typing indicator between them.
2. 4.5–5.5 s, the match cut: all the bubbles squash vertically into one
   thin horizontal line, which stretches across the frame.
3. 5.5–7.5 s: that line becomes the app's input field: the window unfolds
   from it in 3D (top and bottom panels rotating open from the line),
   while the background fades up behind.
4. 7.5–10 s: "{{request}}" types into the field; people chips pop in under
   it one by one (six names, initials in circles), springy.
5. 10–14 s: a week grid slides up; a bright scan line sweeps across the
   columns, busy blocks appear in grey, and the free slot lights up in
   lavender; a booking card flies into it and lands with a small bounce.
6. 14–16.5 s: one person drops out (their chip greys out and lifts away);
   the card slides to a new slot by itself, with a little "moved" label.
7. 16.5–18.5 s: the window pulls back and fades; a centred line, "No back
   and forth.", writes in, white, large.
8. 18.5–22 s, the close: a round mark (a lavender swirl inside a
   circle) and "{{product}}." with "{{tagline}}" under it, left-aligned
   beside the mark. Hold to the end.
- Every move eases; springs on pops; real motion blur on fast moves
  (average 6 sub-frames).

CHECKS (required)
- A contact sheet: 1, 3, 4.8, 5.3, 6.5, 8.5, 10.5, 12.5, 14.5, 15.5,
  17.5, 20, 21.8. Look at it.
- Does the chat-to-line-to-app cut read as one continuous idea? Is the UI
  legible and believable? Does the background stay quiet, never under text?
  Is there a clear ending held on the name?
- Deliver the mp4 and the contact sheet.
```

## Failure modes

- **The match cut breaks.** The app just fades in. Ask for the bubbles to squash into one line and for the window to unfold from that same line.
- **A generic dashboard.** Ask for the UI to show this product's one job: the request, the people, the scan, the slot.
- **The background stands out.** Ask for tones close to each other, soft edges and no highlights, so it only reads as slow movement.

## Notes

What the run built, which is what to copy: the bubbles squash to one line that then shrinks exactly onto the input field's rectangle, and the window's top and bottom panels are separate 3D parts hinged on it, so they really rotate open; the swirl is gone before the headline, so no text ever sits on it.

What the agent had to decide for itself:
- It invented the names, the week's meetings and the reason the card moves (the person who drops out frees an earlier slot), shown with a "declined, re-finding" tag.
- It added push-ins on the typing and on the booked result so the UI reads; even so, the UI is small on a phone.

Based on one of our own earlier pieces, a keynote for an invented calendar app. The product, its UI and the copy are all invented.
