# Scene API

Scenes import from `'paper-motion'` (the engine injects an import map; no build
step). `@paper-design/shaders` and `@paper-design/shaders-react` are also
importable if you need low-level access.

## scene(config)

```js
const s = scene({
  width: 1920, height: 1080,   // output pixels
  fps: 30, duration: 10,       // seconds
  background: '#000',          // stage + page background
  stage: '#stage',             // optional; default [data-stage], #stage, or <body>
});
```

| Method | |
|---|---|
| `s.shader(el, name, params, options?)` | Mount a Paper shader in `el` (selector or element). Returns a layer. |
| `s.update((t, info) => {})` | Called every frame. `info = { t, frame, progress, duration, fps }`. |
| `s.add(layer)` | Custom layer: any object with `seek(t)` (may return a promise) and optional `ready` promise. |
| `s.wait(promise)` | Wait for something (image decode, data) before the first frame. |
| `s.sfx(t, type, opts)` | Schedule a synthesized sound effect (see `sound.md`). |
| `s.sound({ lowpass, gain })` | Master options for the sound effects. |
| `await s.start()` | Last line. Waits for fonts + shaders, seeks frame 0, mounts the preview player. |

Order per frame: `update` callbacks → shader layers render → CSS animations
synced to `t` → `<video data-pm-sync>` elements seeked.

## Shader layers

```js
const bg = s.shader('#bg', 'MeshGradient', { colors: [...], distortion: 0.8, speed: 0.3 }, { loop: 2 });
bg.set({ swirl: 0.4 });                // sync param change (call inside s.update)
await bg.load({ image: 'next.jpg' });  // param changes that need loading
bg.time = 3.2;                         // override shader time (s) for this frame only
```

- `name`: any Paper shader component name (`references/shaders.md`).
- `params`: exactly the React component's props — colors as hex/rgb strings,
  enums as strings (`shape: 'sphere'`), sizing (`fit`, `scale`, `rotation`,
  `offsetX/Y`, `originX/Y`, `worldWidth/Height`), `speed`, `frame`, `image`.
- Shader time = `t × speed` (seconds) + `frame` offset (ms). `speed: 0` = static.
- `options.loop` (seconds): seamless loop by crossfading the tail into frame 0.
  Good for diffuse fields; crisp shapes will ghost.
- `options.timeOffset` (s): start the shader's own clock later/earlier.
- `options.minPixelRatio` (default 2: supersampled), `options.maxPixelCount`.
- The element needs a size (`position:absolute; inset:0` or explicit w/h). The
  canvas follows the element's box, so you can place a shader in any rectangle,
  circle (`border-radius` + `overflow:hidden`), or masked shape (`mask-image`,
  `clip-path`), and blend it (`mix-blend-mode`, `opacity`, `filter`).

## Timing

```js
progress(t, start, end, easing?)        // 0..1 across [start,end], clamped, eased
stagger(t, i, { start, each, duration, easing })  // item i of a staggered group
keys(t, [[0, 0], [2, 1, ease.outExpo], [5, 0.3]]) // keyframes; easing applies to the segment arriving at that key
keys(t, [[0, '#101010'], [6, '#e8dccb']])         // colors mix in OKLab
keys(t, [[0, [0, 0]], [4, [0.2, -0.1]]])          // arrays
phase(t, period)    // 0..1 sawtooth
osc(t, period, offset?)  // sine -1..1 (period = duration/n for seamless loops)
```

After Effects-style curves: `ease.easy` (AE Easy Ease), `ease.smooth` (strong
in/out), `ease.snappy` (fast start, long soft landing), `ease.anticipate`.

```js
spring(t - releaseTime, { stiffness: 170, damping: 20 }) // 0→1 with physical overshoot
s.grain({ opacity: 0.08 })                                  // live film grain, new pattern every frame
```

`ease.*`: `linear`, `in/out/inOut` + `Sine|Quad|Cubic|Quart|Quint|Expo|Circ`,
`outBack`, `inOutBack`, and `ease.bezier(x1, y1, x2, y2)` (CSS cubic-bezier).

## Math, randomness, noise

```js
clamp(v, a=0, b=1) · lerp(a, b, p) · invlerp(a, b, v) · remap(v, a, b, c, d, clamp=true)
smoothstep(e0, e1, x) · fract(x) · TAU · mix(a, b, p)  // numbers, arrays, hex colors
const r = rng('seed or number'); r.next(); r.range(lo, hi); r.int(lo, hi); r.pick(arr); r.sign();
noise(x, y?, z?)        // smooth value noise 0..1 — e.g. noise(i * 3.1, t * 0.4)
fbm(x, y?, z?, octaves=4)
mixColor('#ff0044', '#0044ff', 0.5)  // OKLab
```

Create `rng` once at the top (outside `update`) and precompute random layouts;
inside `update` only use deterministic functions of `t`.

## Text

```js
const letters = split('#title', 'chars');   // or 'words'; returns the spans
letters.forEach((el, i) => { el.style.opacity = stagger(t, i, { start: 1, each: 0.06, duration: 0.8 }); });
```

## Other layers

- **SVG**: set attributes in `update` (`r`, `cx`, `stroke-dashoffset` for line drawing).
- **Canvas 2D**: draw the whole frame from `t` inside `update` (clear first).
- **CSS animations**: allowed; their `currentTime` is set to `t` each frame.
- **Video**: `<video src="clip.mp4" data-pm-sync data-pm-offset="0" muted>` follows `t`.
- **Images** for shaders: `loadImage(url)` returns a cached `HTMLImageElement`.

## Brand

`import { loadBrand } from 'paper-motion/brand'` → `const B = await loadBrand()` reads `/brand/*` (serve from the
project root) and loads its fonts. Then: `B.color('ground')`, `B.ramp`, `B.font('display')`,
`B.type('title', short)`, `B.style(el, 'display', { short, color })`, `B.wordmark.onDark`, `B.pace` (`{ enter, hold,
stagger }`), `B.shader(s, el, '<set entry id>')`, `B.cue(s, 'transition' | 'land' | 'text', t)`, `B.keys` (for
`keySounds`), `B.sound(s)` (low-pass and bed), `B.loudness`, `B.identity` (IDENTITY.md sections), `B.name`.
`pm new <name> --dir brand/pieces --format 9:16 --piece` starts a scene already wired to it.

## Moves

`import { wipe, push, maskReveal, scanReveal, zoomThrough, crossfade, cut, typeOn, wordRise, blurIn, trackIn, drift, PACE, MOVES } from 'paper-motion/moves'`

Named, reusable motion. Transitions take two layers and progress `p` (0 → 1): `wipe(a, b, p)`. Text and camera moves
take scene time `t`: `typeOn(el, text, t, { start, cps, cursor })`, `wordRise(el, t, { start, each })`,
`drift(world, t)`. `PACE.calm|medium|fast` gives `{ enter, hold, stagger }` in seconds. When the brand has a
`brand/motion.json`, use its pace, text behavior and repertoire. `pm new <name> --move <move> --pace … --text …
--camera …` writes a 5 s demo of one combination in the brand's look.

## Shapes and stills

- `organicPath(w, h, { radius, wobble, seed })` returns an SVG path `d` for a hand-cut rounded rectangle (the
  "organic" shape language). Deterministic per seed; keep `wobble` low.
- `pm new <name> --still` starts a still scene (1600×900, 3 s) that reads `brand/tokens.json` when it exists.
- `pm still scene.html --t 1 --out frame.png` writes a single frame to a file.

## 3D camera (CSS)

For After Effects-style 3D layers, give a container `perspective` and a child
`transform-style: preserve-3d`, then animate the child's transform as the
camera (`scale() rotateX() rotateZ()`). Paper shaders, text and SVG all work
inside it, stay vector-crisp, and are depth-sorted by the browser. Never set
`opacity < 1` on a `preserve-3d` element: it flattens its children.

To extrude a block of footprint `w × d` to height `h`, put the top face at
`translateZ(h)` and hinge four walls on the footprint edges so they rise toward +z:

```js
Object.assign(front.style, { top: `${d - h}px`, height: `${h}px`, transformOrigin: '0 100%', transform: 'rotateX(-90deg)' });
Object.assign(back.style,  { top: '0px',        height: `${h}px`, transformOrigin: '0 0',    transform: 'rotateX(90deg)' });
Object.assign(right.style, { left: `${w - h}px`, width: `${h}px`, transformOrigin: '100% 0', transform: 'rotateY(90deg)' });
Object.assign(left.style,  { left: '0px',        width: `${h}px`, transformOrigin: '0 0',    transform: 'rotateY(-90deg)' });
```

## Preview player

`preview` opens the scene with a scrubber: space play/pause · ←/→ one frame ·
shift+←/→ one second · Home · L loop · H hide UI. `?t=4.5` in the URL opens at
4.5 s. `?render` shows exactly what the renderer sees (no UI, no scaling).

## Limits

- **About 16 shaders per scene.** Each `s.shader` is its own WebGL context, and
  Chrome keeps roughly 16 alive. Past that it silently drops the oldest ones,
  which then render empty. To show more (for example a board of swatches), split
  them across several scenes and stack the stills afterwards.
- **Dithering needs a time offset to show its pattern.** Animated noise shapes
  (`simplex`, `warp`) can look almost empty at some times. If a swatch reads
  sparse, try another `frame` value (a time offset in ms) or another `scale`.
- **Logo shaders read different masks.** LiquidMetal and GemSmoke take a light
  shape on transparency; Heatmap draws the image on white and reads luminance,
  so give it a dark shape (`wordmark({ color: '#000' })`).
