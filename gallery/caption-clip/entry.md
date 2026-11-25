---
title: Clip with captions
summary: A vertical clip for a podcast or voice note, with big captions that light up word by word in sync with the voice, a waveform driven by the real audio and a closing card.
format: "9:16"
duration: 24
techniques: [captions, word timing, audio-reactive waveform, kinetic type, voice, end card]
bring:
  - Your audio clip (clip.mp3 or clip.wav) and a word-level transcript (words.json, a list of word, start and end). Any transcription tool with word timestamps gives one.
  - Headless Chrome and ffmpeg on the machine.
variables:
  - key: show
    label: The show's name
    default: Small Rooms
  - key: episode
    label: The episode line
    default: "Ep. 41 · Saying no"
  - key: speaker
    label: Who's speaking
    default: Ines Varga, studio founder
  - key: palette
    label: Background and accent
    default: "a warm charcoal #1E1B19 background with a marigold #F2B233 accent"
  - key: site
    label: Where to listen
    default: smallrooms.fm
runs:
  tried: 1
  passed: 1
  model: claude-opus-5-5
  agent: Claude Code, a fresh subagent given only this prompt
  date: 2026-11-15
  minutes: 23
  note: 'Two directors passes with fresh blind critics, both "needs rework"; phrases that no longer overlap at the swap, fewer accent words, captions on a fixed top line, a smaller waveform rising from a baseline, a cleaner close. The voice was raised to -14.5 LUFS for social playback.'
credits: []
---

## Prompt

```text
Make a vertical clip, 1080×1920, 60 fps, with sound, rendered from code
(an HTML canvas or DOM page where every frame is a pure function of time,
captured with headless Chrome and encoded with ffmpeg, the audio muxed in).

THE INPUT
clip.mp3 (or clip.wav) and words.json (a list of {word, start, end} in
seconds) are in the folder. The video lasts the clip plus 2.5 s for the
close. The show: "{{show}}", {{episode}}. The speaker: {{speaker}}.
Palette: {{palette}}.

THE CAPTIONS (the point of this video)
- Big, centred in the middle third: a heavy sans, 6.5% of the frame
  height, white, at most two lines of 2–4 words. Break lines at natural
  phrase boundaries (punctuation, pauses over 0.25 s), never mid-phrase.
- Each word lights up at its exact start time: it turns from 45% white
  to full white and the accent underline (or accent fill) moves onto it,
  with a quick spring (scale 1.06 → 1, 120 ms). Words that carry the
  meaning (numbers, the key noun or verb of each sentence, questions)
  take the accent colour and sit slightly bigger.
- A new phrase replaces the old one with a short move (up 24 px and fade,
  150 ms), on the start of its first word, never early.
- Sync is the test: a word may light up no more than one frame before or
  after its start time.

THE REST OF THE FRAME
- The top third: a speaker card, a circle with the speaker's initials in
  the accent (no photo), their name and role, and the show name small
  above.
- Under the captions: a waveform of 48 rounded bars driven by the real
  audio. Compute the loudness per frame from the file with ffmpeg
  beforehand, smooth it (fast attack, slow release) and map it to the
  bars, louder in the middle bars. The bars rest low in silences.
- A thin progress line along the bottom edge in the accent.
- Background: the palette's base colour with a very soft radial glow
  behind the captions and a fine film grain. Nothing else moves.

THE CLOSE (the last 2.5 s)
- The captions and waveform clear; "{{show}}" large, "{{episode}}"
  under it, "Listen at {{site}}" smaller. Hold to the end, silent after
  the clip.

CHECKS (required)
- A contact sheet of six evenly spaced frames and one from the close.
  Look at it.
- Pick three words and check the frame at each start time: is that word
  the one lit? Are line breaks on phrases? Does the waveform move with
  the voice and rest in pauses? Is the audio in the mp4 and in sync from
  first word to last? Is the ending held?
- Deliver the mp4 and the contact sheet.
```

## Failure modes

- **Captions that drift.** Timing by estimate slips by the end of the clip. Ask for word-level timestamps from a file, checked on frames at three word starts.
- **A fake waveform.** Bars driven by noise don't stop when the voice stops. Ask for the loudness computed from the real audio.
- **Broken phrases.** Fixed word counts split phrases mid-thought. Ask for line breaks at punctuation and pauses.

## Notes

What the run built, which is what to copy: one canvas page that reads words.json and lights each word on the frame nearest its start (checked at four words: at most half a frame off); loudness per frame from ffmpeg astats, smoothed with a fast attack and slow release; the audio muxed back in, within 1 ms of the source from the first word to the last.

What the agent had to decide for itself:
- "Honestly," stands alone as a one-word phrase, because the pause after it is a phrase break.
- The font is a condensed heavy sans, so lines like "cheapest decision" fit at 6.5% of the frame height.
- The accent words: studio?, no, promise, six, one, half?, walk, cheapest.
- The close keeps only the speaker's initials circle as a mark.

The initials "IV" can read as the Roman numeral 4; choose a speaker whose initials don't.

The demo voice was generated for this entry; bring your own clip and its word timings. The show, the speaker and the address are invented.
