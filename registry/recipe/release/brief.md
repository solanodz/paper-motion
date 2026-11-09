# Release

Recipe: release (15 s, square by default), from paper-motion.app. The look, fonts, pace and sound come from `brand/`.

## Before building
- Agree the brief with the user: who it is and what this is in plain words ("the debut EP of an ambient producer",
  "episode 12 of a design podcast"), the date, where to listen, the format.
- Get the cover art (a square PNG or JPG) and the track or an excerpt. Put the cover next to this file or under
  `brand/assets/` and write its path into `CONFIG.cover`; write the track's BPM into `CONFIG.bpm` so the cover and
  the bars move on its beat.
- Edit the rest of `CONFIG`: title, artist, what, action, the background id.

## Check and render
- `npx paper-motion still pieces/release/scene.html --count 6` and look at the contact sheet: cover, words, date.
- `npx paper-motion render pieces/release/scene.html --audio track.wav --loudness -14 --motion-blur 4`
  (the music is the user's; the brand's cues sit under it.)
