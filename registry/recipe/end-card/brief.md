# End card

Recipe: end card (6 s), from paper-motion.app. The look, fonts, pace and sound come from `brand/`.

## Before building
- Agree the brief with the user: what the brand is in plain words, the one action at the end, the format.
- Edit `CONFIG` at the top of scene.html: the copy, the background id, the format.
- Swap the moves for the ones the user picked (`npx paper-motion add <id>`) and put real material where there is some.

## Check and render
- `npx paper-motion still pieces/end-card/scene.html --count 8` and look at the contact sheet.
- `npx paper-motion render pieces/end-card/scene.html --motion-blur 5`
