# Manifesto

Recipe: manifesto (18 s), from paper-motion.app. The look, fonts, pace and sound come from `brand/`.

## Before building
- Agree the brief with the user: the three statements, in the brand's voice (IDENTITY.md's words), each under eight
  words; the word that turns into the name; what the brand is in plain words; the one action.
- Edit `CONFIG`: the statements, `turnWord`, `what`, `action`, the background id, the format.
- Swap the entrances for the moves the user picked (`npx paper-motion add <id>`); keep them different from each other.

## Check and render
- `npx paper-motion still pieces/manifesto/scene.html --count 6` and read every statement at a glance.
- `npx paper-motion render pieces/manifesto/scene.html --motion-blur 5`
