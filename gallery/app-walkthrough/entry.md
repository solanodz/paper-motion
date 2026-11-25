---
title: App walkthrough
summary: Your app's screens built in code, with a cursor that does three real tasks while the camera zooms in to follow each click and a short label names each feature.
format: "16:9"
duration: 20
techniques: [UI animation, cursor paths, camera zoom and follow, typing, callouts, end card]
bring:
  - Nothing. The screens are built in code from your description. Screenshots of your real app help the agent match it.
  - Headless Chrome and ffmpeg on the machine.
variables:
  - key: product
    label: Product name
    default: Quire
  - key: what
    label: What it is, in one line
    default: a writing tool where small teams draft documents together
  - key: screens
    label: The three screens (split by |)
    default: "a document list with folders on the left | a document being edited, with a comment thread on the right | a share dialog listing people and their permissions"
  - key: actions
    label: The three tasks the cursor does, one per screen (split by |)
    default: "click New document and type the title \"Q3 launch plan\" | select a sentence and leave the comment \"Can we move this to week 2?\" | click Share, type a teammate's name and set them to Can edit"
  - key: labels
    label: The three feature labels (split by |)
    default: "Start in one click | Comment in place | Share with anyone"
  - key: accent
    label: The accent colour
    default: "moss green #3F6B4E"
  - key: closing
    label: The closing line
    default: Write it together.
  - key: site
    label: Web address
    default: quire.app
runs:
  tried: 1
  passed: 1
  model: claude-opus-5-5
  agent: Claude Code, a fresh subagent given only this prompt
  date: 2026-11-15
  minutes: 28
  note: 'Two director''s passes with fresh blind critics, both "needs rework"; one document carried through all three tasks, a visible result for Share (the teammate''s avatar joins the header), one arc move between tasks 2 and 3, and a fix for a camera jump of up to 160 px that the second critic caught.'
credits: []
---

## Prompt

```text
Make a 20 s product walkthrough, 1920×1080, 60 fps, rendered from code: an
HTML/CSS page (the real app UI built in the DOM) where every frame is a
pure function of time, captured with headless Chrome and encoded with
ffmpeg.

THE APP
"{{product}}", {{what}}. Build its three screens as real UI: {{screens}}
(split on "|"). If screenshots of the app are in the folder, match them.
- Every piece of text is real, specific content that fits the product
  (document names, people's names, dates, sentences), never grey bars or
  lorem ipsum. A viewer pausing on any frame should be able to read it.
- Desktop proportions: the app window is 1600 px wide on a soft
  off-white ground (#EEEDEA), with a thin window bar that shows only the
  product name, no operating-system buttons. UI text 15–16 px at full
  frame, a clean sans (Inter or similar), real icons drawn as simple
  SVG strokes, hairline borders, light shadows. One accent, {{accent}},
  used for primary buttons, selection and the cursor's click ring.

THE CAMERA AND THE CURSOR (the point of this video)
- A virtual camera over the page: it starts wide on the whole window,
  then for each task eases in to 1.8–2.2× on the area where the cursor
  works, follows the cursor while it acts, and eases back out between
  tasks. It leads slightly: it starts moving before the cursor arrives.
  Moves take 0.6–0.9 s with an ease-in-out; never cut.
- The cursor is a crisp arrow (I-beam over text) with a soft shadow. It
  travels on gently curved paths, accelerating and slowing like a hand,
  pausing ~0.2 s before each click. A click: the cursor dips to 90% for
  80 ms and a thin accent ring expands and fades from the tip. The UI
  answers every interaction: hover states, the pressed state, the
  selection highlight, menus and dialogs that open with a short spring
  (scale 0.96→1, opacity, 180 ms).
- Typing: characters appear at a human cadence (50–90 ms apart, slightly
  irregular) behind a blinking caret.
- One label per task: "{{labels}}" (split on "|"), white text on the
  accent in a small rounded pill, 22 px, placed beside the action and
  outside the area in use; it springs in after the task's first click
  and leaves before the next task.

TIMING (exact)
1. 0.0–2.0 s: "{{product}}" and "{{what}}" centred on the ground, then
   the app window rises in under them as they fade.
2. 2.0–7.0 s: screen 1, task 1 ({{actions}}, split on "|").
3. 7.0–12.0 s: screen 2 (the app moves there through its own UI, as the
   real app would), task 2.
4. 12.0–17.0 s: screen 3, task 3.
5. 17.0–20.0 s, the close: the camera eases out; the window shrinks to
   60% and settles; "{{product}}" and "{{closing}}" above it, "{{site}}"
   under it. Hold to the end.
- Motion blur on camera moves and the cursor (average 6 sub-frames).

CHECKS (required)
- A contact sheet: 1, 3.5, 5.5, 8.5, 10.5, 13.5, 15.5, 19. Look at it.
- At every zoomed frame: is all the text real and sharp? Does the camera
  follow the cursor without losing it at the frame's edge? Does each
  click get a visible response? Does each label sit clear of the action?
  Is the ending held?
- Deliver the mp4 and the contact sheet.
```

## Failure modes

- **Placeholder UI.** Grey bars and lorem ipsum make it look like a wireframe. Ask for real, specific content that a viewer could read on any frame.
- **A robot cursor.** Straight lines at constant speed and clicks with no response read as a script. Ask for curved, eased paths, a pause before each click, and a UI that answers.
- **A static camera.** At full frame, 15 px UI text is unreadable on a phone. Ask for zooms that follow the work.

## Notes

What the run built, which is what to copy: the whole app laid out in the DOM, with a renderAt(t) that sets the UI state, camera, cursor, springs and typing; hover and pressed states found by hit-testing under the cursor; 6 sub-frame screenshots averaged only while something moves; a script that checks every frame for camera jerks and for the cursor near the frame's edge.

What the agent had to decide for itself:
- The new document opens from a template, so the same "Q3 launch plan" is commented on and shared.
- The share dialog is a popover under the Share button, so the button and the dialog fit in one zoomed frame.
- The cursor lives in the scene and grows with the zoom, like a zoomed screen recording.

At 1.8–2.2× some words are cut at the frame edges, and at full frame the labels read small.

Made for software and SaaS: the screens, tasks and labels come from your variables, so the same prompt works for any app with three things worth showing. The app, its name and its address are invented.
