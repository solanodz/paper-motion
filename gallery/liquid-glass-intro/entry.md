---
title: Liquid glass intro
summary: A voice-over spelled out word by word inside glass UI components, with fast camera moves between them.
format: "16:9"
duration: 28
techniques: [kinetic type, glass material, camera moves, voice-over sync, motion blur]
bring:
  - A voice-over (vo.wav), or a text-to-speech service your agent can call. Without either, it writes the script and asks.
  - Headless Chrome and ffmpeg on the machine.
variables:
  - key: topic
    label: What the voice-over is about
    default: how to animate interfaces that feel alive
  - key: accents
    label: Highlight colours
    default: "pink #FF2D55, yellow #FFD60A, blue #0A84FF"
runs:
  tried: 1
  passed: 1
  model: claude-opus-5-5
  agent: Claude Code
  date: 2026-11-14
  minutes: 30
  note: The run asked two questions, where to get the voice-over and the photos. Their answers are now part of the prompt.
credits:
  - asset: Coast photo
    by: Dietmar Rabich, Wikimedia Commons
    license: CC BY-SA 4.0
  - asset: Rocks photo
    by: Wikimedia Commons
    license: CC BY-SA 4.0
  - asset: Desert photo
    by: Giles Laurent, Wikimedia Commons
    license: CC BY-SA 4.0
  - asset: Voice-over
    by: ElevenLabs text-to-speech, voice "Chris"
    license: generated for this video
---

## Prompt

```text
Make a ~28 s intro, 1920×1080, 60 fps, rendered from code (an HTML/canvas
page where every frame is a pure function of time, captured with headless
Chrome and encoded with ffmpeg).

CONCEPT
Kinetic typography inside interfaces. The voice-over is written out word by
word, and each phrase lives in a different UI component made of "liquid
glass". The viewer never sees loose text: it is always inside a notification,
a search bar, a menu, a tab bar, a widget, a call, a player or a chat bubble.

VOICE-OVER AND SYNC (do this first)
- If there is a vo.wav, use it. If not, write a ~28 s script about
  {{topic}}, in 9–10 short phrases, and generate the voice with whatever
  text-to-speech you can call (for example ElevenLabs). Ask only if you have
  neither.
- Transcribe it with per-word timestamps into words.json, and build the scene
  table from it: one phrase per scene, with its start and end.
- Each word appears on the exact frame it is spoken: fade + blur 6px→0 + a
  4px rise, over 6 frames. No letter-by-letter typewriter.

MATERIAL: LIQUID GLASS (the hard part, make it a shader)
- Every component is a rounded shape (large radius or pill) that shows the
  background through it with: background blur (~20px), a slight saturation
  boost, refraction at the edges (the background bends outwards in the last
  ~12px, like a lens), subtle chromatic aberration on that edge, a thin
  specular highlight at the top left and a soft, diffuse shadow below.
- "Lens": a smaller glass pill that slides over a tab bar on a spring and
  magnifies (~1.15×) what is under it, refracted. Use it on two tab bars and
  on a camera mode selector.
- Build it in WebGL: the background as a texture, displaced by the distance to
  the edge of a rounded-rectangle SDF. Don't settle for backdrop-filter: it
  doesn't refract.

SCENES (in order, one per phrase)
Notification → search bar with a dropdown → context menu → tab bar with the
lens → a second tab bar → lock-screen widgets entering staggered → incoming
call → now playing → camera mode selector → chat bubble with a typing
indicator. Adapt the order to the script, keep one component per phrase.

CAMERA AND TRANSITIONS
- 2.5D camera: the components sit on a plane the camera sees at a 10–25° tilt,
  straightening while the phrase is written.
- Between scenes: a fast camera move (zoom in, pan or tilt) of 8–12 frames,
  with real motion blur (8–16 sub-frames per frame), never a crossfade.
- Components transform on springs (damping ~18): a panel rises from the
  search bar, widgets enter staggered.
- Backgrounds: very soft grey and lavender gradients, a fluid blue background,
  and landscape photos (coast, rocks, desert) for the scenes over a photo.
  Download freely licensed photos (CC0 or CC BY) at ≥2400 px and write their
  credits to CREDITS.txt. Never use system wallpapers or anything you can't
  redistribute.

TYPE
- System sans (SF Pro if installed, otherwise Inter), black at 90% on light
  glass and white on dark glass; highlights in {{accents}}, one per scene.

CHECKS (required)
- A contact sheet with 2 frames per scene (mid-phrase and in the transition),
  and look at it.
- Look closely at one glass component: can you see the refraction at the
  edge, or does it read as a semi-transparent white rectangle? If it looks
  flat, it isn't done.
- Check every word lands on its frame (cross-check with words.json).
- Deliver the mp4 with the audio and the contact sheet.
```

## Failure modes

- **The glass looks flat.** The agent used `backdrop-filter: blur()`. Point it back at the SDF refraction and ask for a close-up of one edge.
- **Words drift off the voice.** It timed them by hand instead of from words.json. Ask it to cross-check every word's frame.
- **A slideshow of cards.** Crossfades between scenes instead of camera moves. Ask for the 8–12 frame moves with motion blur.
- **The render times out.** Long WebGL frames in headless Chrome. Ask it to disable the protocol timeout and render in the background.

## Notes

The run took about 30 minutes, most of it rendering (about 8 minutes per full pass at 60 fps with motion blur).

One change after the run: the incoming-call scene first sat on a macOS wallpaper the agent found on the machine, which
we can't redistribute. It now uses the rocks photo, cropped closer and darker, and that scene was re-rendered. That
mistake is why the prompt now says to download freely licensed photos and never use system wallpapers.
