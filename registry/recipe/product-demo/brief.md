# Product demo

Recipe: product-demo (22 s), from paper-motion.app. The look, fonts, pace and sound come from `brand/`.

## Before building
- Agree the brief with the user: what the brand is in plain words, the three screens worth showing and what each
  proves, the one action at the end, the format.
- Get the real screenshots (PNG or JPG, the window's aspect is 1.72:1; wider or taller crops are covered from the top
  left). Put them next to this file or under `brand/assets/`, and write their paths into `CONFIG.shots[].image`.
  Set each shot's `focus` to the detail the camera should punch into (0–1 across, 0–1 down).
- Edit the rest of `CONFIG`: the captions, the background id, the chrome, the action.

## Check and render
- `npx paper-motion still pieces/product-demo/scene.html --count 8` and look at the contact sheet: is every caption
  readable, does each punch land on something worth seeing?
- `npx paper-motion render pieces/product-demo/scene.html --motion-blur 5`
