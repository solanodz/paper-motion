# Sound craft

What makes a brand's sound feel designed: quiet, natural, tied to the picture. Use it to build options, write
recommendations, set `SOUND.md`'s rules, and check every mix.

## Palette

- **One cue family per gesture.** A transition has its sound, a landing has its sound, text has its sound. The same
  gesture always sounds the same across a brand's pieces; that is what makes it recognizable.
- **soft** (low whooshes, deep thuds, paper): warm, calm, crafted brands.
- **crisp** (flicks, ticks, small knocks, keys): precise, technical, editorial brands.
- **airy** (subtle swells on transitions, a little paper): atmospheric, slow, contemplative brands.
- **ambient** (airy over a low drone bed): only when the brand wants a constant atmosphere, because a bed fills
  the silences most brands should keep.
- Read IDENTITY.md's personality and `motion.json`'s pace: calm brands get fewer, softer cues; fast brands get
  short ones that land on the cut.

## Brightness and level

- **Nothing harsh.** The master low-pass sits at 1.8–2.4 kHz for soft and airy palettes, up to about 4 kHz for crisp.
  Keystrokes run on their own open bus, so typing keeps its click while everything else stays dark.
- **Quiet repetitive cues.** Keys, ticks and paper sit 6–10 dB under the main gestures; vary every repeat (seed, pan,
  a few percent of pitch).
- **Silence is part of it.** Leave gaps between gestures; a constant bed only in the ambient palette.

## Typing

- Real keystrokes over synthesized ones: a typing recording the user made or one with a clear license (CC0),
  split with `pamo keys`; without one, the engine's bundled CC0 bank (`"bank": "default"`). Synthesis (`style` creamy, thock, clack) is the last resort.
- Human rhythm, shared with the picture (`typingTimes` → `typeOn` and `keySounds`): bursts in words, a beat between
  them, more after punctuation.

## Music

- The pack never downloads music. The user brings their own file (it goes to `brand/assets/music/`) or the brand
  uses sound design only. Sound design always plays, under the music when there is music.

## Loudness

- **−14 LUFS** for pieces that live in social feeds (Instagram, TikTok, X), **−16 LUFS** for web, README and
  presentations; peaks at −1.5 dBFS. `pamo render … --loudness -14` applies it and reports what the file really
  measures. Sparse sound design with no music or bed usually lands a few LU under the target (−20 to −24 LUFS):
  that is honest, and better than crushing the transients; music or a quiet bed brings it up.

## Checking a mix

An agent can't listen, so it measures; the user listens.

- Every cue lands on its gesture (within a frame); nothing plays where nothing moves. Check the cue times against the beats.
- Nothing pierces: `pamo sfx scene.html --out mix.wav`, then `ffmpeg -i mix.wav -af "highpass=f=3000,astats" -f null -` (energy above 3 kHz stays low, keys aside) and `-af ebur128=peak=true` (true peak ≤ −1.5 dBFS after `--loudness`).
- Repeated cues sit 6–10 dB under the main gestures and never repeat identically (different seeds).
- Then ask the user to listen with headphones; their ear has the last word.
