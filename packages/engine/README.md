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

## Inside a scene

```js
import { scene } from 'paper-motion';             // the timeline, shader layers, sound
import { wipe, typeOn } from 'paper-motion/moves'; // the moves library
import { loadBrand } from 'paper-motion/brand';   // the brand folder: colors, type, motion, sound, shaders
```

All 30 [Paper Shaders](https://shaders.paper.design), a library of moves (wipes, pushes, mask reveals, dives into a
frame, terminal typing), synthesized sound effects or real keystrokes split from your own recording, option boards,
wordmarks and the brand sheet.

## License

MIT. Paper Shaders are © Paper Design (Apache-2.0). The default keystrokes come from
[Keyboard Soundpack #1](https://opengameart.org/content/keyboard-soundpack-1-typing-and-single-keystrokes) by
unicaegames, CC0.
