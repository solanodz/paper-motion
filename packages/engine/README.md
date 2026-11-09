# paper-motion

The render engine behind the [paper-motion](https://github.com/solanodz/paper-motion) agent skills: creative-directed
videos for people who use coding agents.

It renders an HTML scene, a pure function of time, frame by frame in headless Chrome, and encodes it with ffmpeg:
MP4, 10-bit HEVC, ProRes, WebM or GIF. The same input always gives the same pixels.

Most people never call it directly: the skills do. Install the skills with:

```bash
npx skills add solanodz/paper-motion
```

## Requirements

Node ≥ 18.17, ffmpeg, and Google Chrome (or `npx playwright-core install chromium`).

## Commands

```bash
npx paper-motion setup                                          # check ffmpeg and Chrome, fetch what is missing
npx paper-motion status                                         # what your brand folder has, and the next step
npx paper-motion new launch --dir brand/pieces --format 9:16 --piece
npx paper-motion preview brand/pieces/launch/scene.html         # live, scrub with ←/→
npx paper-motion render brand/pieces/launch/scene.html --motion-blur 8 --loudness -14
npx paper-motion                                                # every command
```

Installed globally (`npm i -g paper-motion`), the same commands run as `paper-motion` or the short `pamo`.

### Resources from paper-motion.app

The registry at [paper-motion.app](https://paper-motion.vercel.app) holds named moves, backgrounds, palettes, font pairs and recipes. Agents pick them for a brand, propose options as a board link, and install what the user chooses as code the user owns.

```bash
npx paper-motion search --type background --mode dark --near "#0a0f1f,#eef1f8,#3d6bff"   # find resources by mood, mode, color fit
npx paper-motion add magic-move mesh-sage --set mesh-sage:speed=0.8                     # install, with your values written in
npx paper-motion board --url --title "Backgrounds" --look cobalt,geist \
  --option mesh-graphite --option neuro-slate --option grain-slate                         # a live board link for the user to choose on
npx paper-motion list background                                                          # every resource of a type
```

`https://paper-motion.vercel.app/llms.txt` explains the flow to an agent.

## Inside a scene

```js
import { scene } from 'paper-motion';             // the timeline, shader layers, sound
import { wipe, typeOn } from 'paper-motion/moves'; // the moves library
import { loadBrand } from 'paper-motion/brand';   // the brand folder: colors, type, motion, sound, shaders
```

All 30 [Paper Shaders](https://shaders.paper.design), a library of moves (wipes, pushes, mask reveals, dives into a
frame, terminal typing), synthesized sound effects or real keystrokes split from your own recording, option boards,
wordmarks and the brand sheet.

## Changes

[CHANGELOG.md](./CHANGELOG.md) lists what each npm release changed.

## License

MIT. Paper Shaders are © Paper Design (Apache-2.0).
