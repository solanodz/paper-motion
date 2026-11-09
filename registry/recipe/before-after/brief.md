# Before / after

Recipe: before-after (16 s), from paper-motion.app. The look, fonts, pace and sound come from `brand/`.

## Before building
- Agree the brief with the user: the two states in one line each (a real contrast, not a slogan), and a real
  picture of each when there is one. The claim in the after line must be true (IDENTITY.md's Facts).
- Edit `CONFIG`: `before` and `after` (tag, line, image), `action`, the background id, the format.
- Swap the wipe for the transition the user picked (`npx paper-motion add <id>`).

## Check and render
- `npx paper-motion still pieces/before-after/scene.html --t 3,6.7,10,15` and compare the two states side by side.
- `npx paper-motion render pieces/before-after/scene.html --motion-blur 5`
