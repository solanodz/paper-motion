# Three things

Recipe: three-things (22 s), from paper-motion.app. The look, fonts, pace and sound come from `brand/`.

## Before building
- Agree the brief with the user: the three things (traits, features, reasons), one line each, and what is real to
  show beside them (a screenshot, a photo). What the brand is goes in the intro line when the brand is new.
- Edit `CONFIG`: `intro`, the three `things` (title, body, image), `action`, the background id, the format.
- Three mechanics for three things: swap rise / push / flip for the moves the user picked (`npx paper-motion add <id>`).

## Check and render
- `npx paper-motion still pieces/three-things/scene.html --count 8` and look at the contact sheet.
- `npx paper-motion render pieces/three-things/scene.html --motion-blur 5`
