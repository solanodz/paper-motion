// paper-motion moves: named, reusable pieces of motion. Each is a pure function of time or progress
// that sets styles on elements, so it can be called from s.update() and stays frame-exact.
//   import { wipe, typeOn, PACE } from 'paper-motion/moves';
// Transitions take progress p (0 → 1); text and camera moves take scene time t.
// Each move lives in its own file under moves/ (the registry copies them into projects with `pamo add`);
// shared helpers are in kit.js (paper-motion/kit).

/** Timing per pace: transition length, hold between beats, stagger between items (seconds). */
export const PACE = {
  calm: { enter: 1.0, hold: 2.6, stagger: 0.12 },
  medium: { enter: 0.5, hold: 1.6, stagger: 0.08 },
  fast: { enter: 0.25, hold: 0.8, stagger: 0.05 },
};

/** Every move by name, with what it does, so skills can list and demo them. */
export const MOVES = {
  cut: 'hard cut from A to B, on the beat',
  crossfade: 'A dissolves into B',
  wipe: 'a soft diagonal edge uncovers B',
  push: 'B pushes A out of frame',
  maskReveal: 'B is revealed from one edge, behind a hard mask line',
  scanReveal: 'B draws in under a moving scan line',
  zoomThrough: 'the camera dives through A and lands on B',
  typeOn: 'text types itself, terminal style, with a block cursor',
  wordRise: 'words rise one by one from behind a mask line',
  blurIn: 'text comes into focus from a blur',
  trackIn: 'letters settle from wide spacing to their tracking',
  drift: 'a slow, constant push-in that keeps a still frame alive',
  scramble: 'letters cycle through random glyphs and lock into place, left to right',
  popIn: 'letters pop up one by one on a spring, with a little overshoot',
  flipIn: 'letters flip up into place in 3D, one after another',
  roll: 'the last word rolls like a slot machine through a list of words',
  odometer: 'a number counts up with rolling digit wheels, like an odometer',
  barReveal: 'a solid bar sweeps across and leaves the line behind it',
  whip: 'a fast push with horizontal motion blur',
  cells: 'B appears through a grid of squares that grow in a diagonal wave',
  slices: 'B comes in as horizontal strips from alternating sides',
  iris: 'B opens from a circle that grows out of a point',
  glitch: 'a few frames of torn bands and RGB split, then B',
  flip3D: 'the frame flips over like a card and shows B on the back',
  shake: 'a camera shake on each hit that dies out fast',
  punch: 'the frame punches in on each hit and springs back',
  orbit: 'a 3D camera moves around layers set at different depths',
  rgbSplit: 'red and cyan fringes burst out on each hit and fade',
  flash: 'an overexposed white flash hides the cut from A to B',
  drawOn: 'lines and shapes draw themselves stroke by stroke',
  magicMove: 'each part of A flies on its own spring into the matching part of B; text cross-blurs; the box reshapes',
  whipPan: 'A winds up, whips out tilted and smeared under a light streak; B whips in, overshoots, its content trails',
  diveIn: 'the camera dives into a detail of A; B opens inside it, a ring breaks outward, B\'s parts rise into focus',
  flipLift: 'A lifts toward the camera, flips with a wobble and a sheen, lands as B with an echo; B\'s parts pop in',
  squashDrop: 'A squashes, launches up stretched; B falls in, squashes on impact, wobbles; its content follows through',
  snapScroll: 'a vertical reel of cards scrolls past in 3D and snaps onto B; neighbours dim and tilt away',
  unfold: 'A\'s items leave, A folds into a glowing line, B unfolds out of the line with overshoot, items rise from it',
  tileSwirl: 'A breaks into tiles that lift and swirl in a wave, flipping over in flight to land as B',
};

export { cut } from './moves/cut.js';
export { crossfade } from './moves/crossfade.js';
export { wipe } from './moves/wipe.js';
export { push } from './moves/push.js';
export { maskReveal } from './moves/mask-reveal.js';
export { scanReveal } from './moves/scan-reveal.js';
export { zoomThrough } from './moves/zoom-through.js';
export { typingTimes, keySounds, typeOn } from './moves/type-on.js';
export { wordRise } from './moves/word-rise.js';
export { blurIn } from './moves/blur-in.js';
export { trackIn } from './moves/track-in.js';
export { drift } from './moves/drift.js';
export { scramble } from './moves/scramble.js';
export { popIn } from './moves/pop-in.js';
export { flipIn } from './moves/flip-in.js';
export { roll } from './moves/roll.js';
export { odometer } from './moves/odometer.js';
export { barReveal } from './moves/bar-reveal.js';
export { whip } from './moves/whip.js';
export { cells } from './moves/cells.js';
export { slices } from './moves/slices.js';
export { iris } from './moves/iris.js';
export { glitch } from './moves/glitch.js';
export { flip3D } from './moves/flip-3d.js';
export { flash } from './moves/flash.js';
export { shake } from './moves/shake.js';
export { punch } from './moves/punch.js';
export { orbit } from './moves/orbit.js';
export { rgbSplit } from './moves/rgb-split.js';
export { drawOn } from './moves/draw-on.js';
export { magicMove } from './moves/magic-move.js';
export { whipPan } from './moves/whip-pan.js';
export { diveIn } from './moves/dive-in.js';
export { flipLift } from './moves/flip-lift.js';
export { squashDrop } from './moves/squash-drop.js';
export { snapScroll } from './moves/snap-scroll.js';
export { unfold } from './moves/unfold.js';
export { tileSwirl } from './moves/tile-swirl.js';
