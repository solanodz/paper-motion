# Paper Shaders catalog

Generated from @paper-design/shaders-react 0.0.82. Regenerate with `paper-motion shaders --md`.

Every shader also accepts the sizing params: `fit` (none|contain|cover), `scale`, `rotation` (deg), `originX`, `originY`, `offsetX`, `offsetY`, `worldWidth`, `worldHeight`.
Motion params: `speed` (multiplier on scene time; 0 = still) and `frame` (start offset, ms).

| Shader | Animated | Image input | What it is |
|---|---|---|---|
| [ColorPanels](#colorpanels) | yes | — | Pseudo-3D semi-transparent panels rotating around a central axis |
| [Dithering](#dithering) | yes | — | Animated 2-color dithering over multiple pattern sources (noise, warp, dots, waves, ripple, swirl, sphere) |
| [DotGrid](#dotgrid) | — | — | Static grid pattern made of circles, diamonds, squares or triangles. |
| [DotOrbit](#dotorbit) | yes | — | Animated multi-color dots pattern with each dot orbiting around its cell center |
| [FlutedGlass](#flutedglass) | — | yes | Fluted glass image filter that transforms an image into streaked, ribbed distortions, giving a mix of clarity and obscurity. |
| [GemSmoke](#gemsmoke) | yes | yes | Animated color fields placed over uploaded logo shape; gives the illusion of smoky noise behind the glassy shape. |
| [GodRays](#godrays) | yes | — | Animated rays of light radiating from the center, blended with up to 5 colors. |
| [GrainGradient](#graingradient) | yes | — | Multi-color gradients with grainy, noise-textured distortion available in 7 animated abstract forms |
| [HalftoneCmyk](#halftonecmyk) | — | yes | CMYK halftone printing effect applied to images with customizable dot patterns and ink colors for each channel (Cyan, Magenta, Yellow, Black). |
| [HalftoneDots](#halftonedots) | — | yes | A halftone-dot image filter featuring customizable grids, color palettes, and dot styles. |
| [Heatmap](#heatmap) | yes | yes | A glowing gradient of colors flowing through an input shape |
| [ImageDithering](#imagedithering) | — | yes | A dithering image filter with support for 4 dithering modes and multiple color palettes (2-color, 3-color, and multicolor options, using either predefined colors or colors sampled from the original image) |
| [LensDistortion](#lensdistortion) | — | yes | Lens Distortion image filter separates an image into shifting color layers (recreating the chromatic aberration of a lens) and warps the image geometry, curving it outward or inward like barrel and pincushion distortion. |
| [LiquidMetal](#liquidmetal) | yes | yes | Futuristic liquid metal material applied to uploaded logo or abstract shape |
| [MeshGradient](#meshgradient) | yes | — | A flowing composition of color spots, moving along distinct trajectories and transformed by organic distortion. |
| [Metaballs](#metaballs) | yes | — | Up to 20 colored gooey balls moving around the center and merging into smooth organic shapes. |
| [NeuroNoise](#neuronoise) | yes | — | A glowing, web-like structure of fluid lines and soft intersections |
| [PaperTexture](#papertexture) | — | yes | Static paper-like texture built from a combination of grain, noise and multiple fold patterns |
| [PerlinNoise](#perlinnoise) | yes | — | Classic animated 3D Perlin noise with exposed controls |
| [PulsingBorder](#pulsingborder) | yes | — | Luminous trails of color merging into a glowing gradient contour. |
| [SimplexNoise](#simplexnoise) | yes | — | A multi-color gradient mapped into smooth, animated curves built as a combination of 2 Simplex noises. |
| [SmokeRing](#smokering) | yes | — | Radial multi-colored gradient shaped with layered noise for a natural, smoky aesthetic. |
| [Spiral](#spiral) | yes | — | A single-colored animated spiral that morphs across a wide range of shapes - from crisp, thin-lined geometry to flowing whirlpool forms and wavy, abstract rings. |
| [StaticMeshGradient](#staticmeshgradient) | — | — | Multi-point mesh gradient with up to 10 color spots, enhanced by two-direction warping, adjustable blend sharpness, and grain controls. |
| [StaticRadialGradient](#staticradialgradient) | — | — | Radial gradient with up to 10 blended colors, featuring advanced mixing modes, focal point controls, shape distortion, and grain effects. |
| [Swirl](#swirl) | yes | — | Animated bands of color twisting and bending, producing spirals, arcs, and flowing circular patterns. |
| [Voronoi](#voronoi) | yes | — | Anti-aliased animated Voronoi pattern with smooth and customizable edges |
| [Warp](#warp) | yes | — | Animated color fields warped by noise and swirls, applied over base patterns (checks, stripes, or split edge) |
| [Water](#water) | yes | yes | Water-like surface distortion with natural caustic realism |
| [Waves](#waves) | — | — | Static line pattern configurable into textures ranging from sharp zigzags to smooth flowing waves. |

## ColorPanels

Pseudo-3D semi-transparent panels rotating around a central axis

Defaults:
```js
{"speed":0.5, "frame":0, "colors":["#ff9d00", "#fd4f30", "#809bff", "#6d2eff", "#333aff", "#f15cff", "#ffd557"], "colorBack":"#000000", "angle1":0, "angle2":0, "length":1.1, "edges":false, "blur":0, "fadeIn":1, "fadeOut":0.3, "gradient":0, "density":3}
```
Sizing defaults that differ from neutral: `{"scale":0.8}` — pass them explicitly (e.g. `offsetY: 0`) to re-center.

Presets:
- **Glass**: `{"scale":1, "rotation":112, "speed":1, "frame":0, "colors":["#00cfff", "#ff2d55", "#34c759", "#af52de"], "colorBack":"#ffffff00", "angle1":0.3, "angle2":0.3, "length":1, "edges":true, "blur":0.25, "fadeIn":0.85, "fadeOut":0.3, "gradient":0, "density":1.6}`
- **Gradient**: `{"scale":1.72, "rotation":270, "offsetX":0.18, "speed":0.5, "frame":0, "colors":["#f2ff00", "#00000000", "#00000000", "#5a0283", "#005eff"], "colorBack":"#8ffff2", "angle1":0.4, "angle2":0.4, "length":3, "edges":false, "blur":0.5, "fadeIn":1, "fadeOut":0.39, "gradient":0.78, "density":1.65}`
- **Opening**: `{"scale":2.32, "rotation":360, "offsetX":-0.3, "offsetY":0.6, "speed":2, "frame":0, "colors":["#00ffff"], "colorBack":"#570044", "angle1":-1, "angle2":-1, "length":0.52, "edges":false, "blur":0, "fadeIn":0, "fadeOut":1, "gradient":0, "density":2.21}`

## Dithering

Animated 2-color dithering over multiple pattern sources (noise, warp, dots, waves, ripple, swirl, sphere). SIZING NOTE: This shader performs sizing in the fragment shader (not vertex shader) to keep u_pxSize in consistent actual pixels. The pixel grid is computed from gl_FragCoord before any transforms, so scaling/rotating only affects the underlying pattern shape. No vertex shader outputs (v_objectUV, v_patternUV, etc.) are used.

Defaults:
```js
{"speed":1, "frame":0, "colorBack":"#000000", "colorFront":"#00b2ff", "shape":"sphere", "type":"4x4", "size":2}
```
Sizing defaults that differ from neutral: `{"scale":0.6}` — pass them explicitly (e.g. `offsetY: 0`) to re-center.
- `DitheringShapes`: `simplex`, `warp`, `dots`, `wave`, `ripple`, `swirl`, `sphere`
- `DitheringTypes`: `random`, `2x2`, `4x4`, `8x8`

Presets:
- **Warp**: `{"fit":"contain", "scale":1, "speed":1, "frame":0, "colorBack":"#301c2a", "colorFront":"#56ae6c", "shape":"warp", "type":"4x4", "size":2.5}`
- **Sine Wave**: `{"scale":1.2, "speed":1, "frame":0, "colorBack":"#730d54", "colorFront":"#00becc", "shape":"wave", "type":"4x4", "size":11}`
- **Ripple**: `{"fit":"contain", "scale":1, "speed":1, "frame":0, "colorBack":"#603520", "colorFront":"#c67953", "shape":"ripple", "type":"2x2", "size":3}`
- **Bugs**: `{"scale":1, "speed":1, "frame":0, "colorBack":"#000000", "colorFront":"#008000", "shape":"dots", "type":"random", "size":9}`
- **Swirl**: `{"fit":"contain", "scale":1, "speed":1, "frame":0, "colorBack":"#00000000", "colorFront":"#47a8e1", "shape":"swirl", "type":"8x8", "size":2}`

## DotGrid

Static grid pattern made of circles, diamonds, squares or triangles.

Defaults:
```js
{"colorBack":"#000000", "colorFill":"#ffffff", "colorStroke":"#ffaa00", "size":2, "gapX":32, "gapY":32, "strokeWidth":0, "sizeRange":0, "opacityRange":0, "shape":"circle"}
```
- `DotGridShapes`: `circle`, `diamond`, `square`, `triangle`

Presets:
- **Triangles**: `{"colorBack":"#ffffff", "colorFill":"#ffffff", "colorStroke":"#808080", "size":5, "gapX":32, "gapY":32, "strokeWidth":1, "sizeRange":0, "opacityRange":0, "shape":"triangle"}`
- **Tree line**: `{"colorBack":"#f4fce7", "colorFill":"#052e19", "colorStroke":"#000000", "size":8, "gapX":20, "gapY":90, "strokeWidth":0, "sizeRange":1, "opacityRange":0.6, "shape":"circle"}`
- **Wallpaper**: `{"colorBack":"#204030", "colorFill":"#000000", "colorStroke":"#bd955b", "size":9, "gapX":32, "gapY":32, "strokeWidth":1, "sizeRange":0, "opacityRange":0, "shape":"diamond"}`

## DotOrbit

Animated multi-color dots pattern with each dot orbiting around its cell center. Supports up to 10 colors and various shape and motion controls.

Defaults:
```js
{"speed":1.5, "frame":0, "colorBack":"#000000", "colors":["#ffc96b", "#ff6200", "#ff2f00", "#421100", "#1a0000"], "size":1, "sizeRange":0, "spreading":1, "stepsPerColor":4}
```

Presets:
- **Bubbles**: `{"scale":1.64, "speed":0.4, "frame":0, "colors":["#D0D2D5"], "colorBack":"#989CA4", "stepsPerColor":2, "size":0.9, "sizeRange":0.7, "spreading":1}`
- **Shine**: `{"scale":0.4, "speed":0.1, "frame":0, "colors":["#ffffff", "#006aff", "#fff675"], "colorBack":"#000000", "stepsPerColor":4, "size":0.3, "sizeRange":0.2, "spreading":1}`
- **Hallucinatory**: `{"scale":0.5, "speed":5, "frame":0, "colors":["#000000"], "colorBack":"#ffe500", "stepsPerColor":2, "size":0.65, "sizeRange":0, "spreading":0.3}`

## FlutedGlass

Fluted glass image filter that transforms an image into streaked, ribbed distortions, giving a mix of clarity and obscurity.

Defaults:
```js
{"speed":0, "frame":0, "colorBack":"#00000000", "colorShadow":"#000000", "colorHighlight":"#ffffff", "shadows":0.25, "size":0.5, "angle":0, "distortionShape":"prism", "highlights":0.1, "shape":"lines", "distortion":0.5, "shift":0, "blur":0, "edges":0.25, "stretch":0, "margin":0, "marginLeft":0, "marginRight":0, "marginTop":0, "marginBottom":0, "grainMixer":0, "grainOverlay":0}
```
Sizing defaults that differ from neutral: `{"fit":"cover"}` — pass them explicitly (e.g. `offsetY: 0`) to re-center.

Presets:
- **Abstract**: `{"scale":4, "speed":0, "frame":0, "colorBack":"#00000000", "colorShadow":"#000000", "colorHighlight":"#ffffff", "shadows":0, "size":0.7, "angle":30, "distortionShape":"flat", "highlights":0, "shape":"linesIrregular", "distortion":1, "shift":0, "blur":1, "edges":0.5, "stretch":1, "margin":0, "marginLeft":0, "marginRight":0, "marginTop":0, "marginBottom":0, "grainMixer":0.1, "grainOverlay":0.1}`
- **Waves**: `{"scale":1.2, "speed":0, "frame":0, "colorBack":"#00000000", "colorShadow":"#000000", "colorHighlight":"#ffffff", "shadows":0, "size":0.9, "angle":0, "distortionShape":"contour", "highlights":0, "shape":"wave", "distortion":0.5, "shift":0, "blur":0.1, "edges":0.5, "stretch":1, "margin":0, "marginLeft":0, "marginRight":0, "marginTop":0, "marginBottom":0, "grainMixer":0, "grainOverlay":0.05}`
- **Folds**: `{"speed":0, "frame":0, "colorBack":"#00000000", "colorShadow":"#000000", "colorHighlight":"#ffffff", "shadows":0.4, "size":0.4, "angle":0, "distortionShape":"cascade", "highlights":0, "shape":"lines", "distortion":0.75, "shift":0, "blur":0.25, "edges":0.5, "stretch":0, "margin":0.1, "marginLeft":0.1, "marginRight":0.1, "marginTop":0.1, "marginBottom":0.1, "grainMixer":0, "grainOverlay":0}`

## GemSmoke

Animated color fields placed over uploaded logo shape; gives the illusion of smoky noise behind the glassy shape.

Defaults:
```js
{"speed":1, "frame":0, "colorBack":"#f0efea", "colorInner":"#fafaf5", "colors":["#333333", "#e7e6df"], "outerGlow":0.55, "innerGlow":1, "innerDistortion":0.8, "outerDistortion":0.6, "offset":0, "angle":0, "size":0.8, "shape":"diamond"}
```
Sizing defaults that differ from neutral: `{"scale":0.6}` — pass them explicitly (e.g. `offsetY: 0`) to re-center.
- `GemSmokeShapes`: `none`, `circle`, `daisy`, `diamond`, `metaballs`

Presets:
- **Fire**: `{"speed":1, "frame":0, "colorBack":"#000000", "colorInner":"#000000", "colors":["#fe5b16", "#f7ff61", "#ffffff"], "outerGlow":1, "innerGlow":0.65, "innerDistortion":0.6, "outerDistortion":0.8, "offset":0, "angle":0, "size":0.8, "shape":"diamond"}`
- **Fluorescent**: `{"speed":1, "frame":0, "colorBack":"#000000", "colorInner":"#000000", "colors":["#2fb64c", "#cdff61", "#ffffff"], "outerGlow":0, "innerGlow":1, "innerDistortion":1, "outerDistortion":0.8, "offset":0, "angle":0, "size":0.8, "shape":"diamond"}`
- **Infrared**: `{"speed":0.5, "frame":0, "colorBack":"#cd28dc", "colorInner":"#00000000", "colors":["#ff9900", "#fff67a", "#dcff52", "#00ffbb", "#0077ff"], "outerGlow":1, "innerGlow":1, "innerDistortion":1, "outerDistortion":1, "offset":0.2, "angle":0, "size":1, "shape":"diamond"}`

## GodRays

Animated rays of light radiating from the center, blended with up to 5 colors.

Defaults:
```js
{"colorBack":"#000000", "colorBloom":"#0000ff", "colors":["#a600ff6e", "#6200fff0", "#ffffff", "#33fff5"], "density":0.3, "spotty":0.3, "midIntensity":0.4, "midSize":0.2, "intensity":0.8, "bloom":0.4, "speed":0.75, "frame":0}
```
Sizing defaults that differ from neutral: `{"offsetY":-0.55}` — pass them explicitly (e.g. `offsetY: 0`) to re-center.

Presets:
- **Warp**: `{"offsetY":0, "colorBack":"#000000", "colorBloom":"#222288", "colors":["#ff47d4", "#ff8c00", "#ffffff"], "density":0.45, "spotty":0.15, "midIntensity":0.4, "midSize":0.33, "intensity":0.79, "bloom":0.4, "speed":2, "frame":0}`
- **Linear**: `{"offsetX":0.2, "offsetY":-0.8, "colorBack":"#000000", "colorBloom":"#eeeeee", "colors":["#ffffff1f", "#ffffff3d", "#ffffff29"], "density":0.41, "spotty":0.25, "midSize":0.1, "midIntensity":0.75, "intensity":0.79, "bloom":1, "speed":0.5, "frame":0}`
- **Ether**: `{"offsetX":-0.6, "offsetY":0, "colorBack":"#090f1d", "colorBloom":"#ffffff", "colors":["#148effa6", "#c4dffebe", "#232a47"], "density":0.03, "spotty":0.77, "midSize":0.1, "midIntensity":0.6, "intensity":0.6, "bloom":0.6, "speed":1, "frame":0}`

## GrainGradient

Multi-color gradients with grainy, noise-textured distortion available in 7 animated abstract forms. Note: grains are calculated using gl_FragCoord & u_resolution, meaning grains don't react to scaling and fit

Defaults:
```js
{"speed":1, "frame":0, "colorBack":"#000000", "colors":["#7300ff", "#eba8ff", "#00bfff", "#2a00ff"], "softness":0.5, "intensity":0.5, "noise":0.25, "shape":"corners"}
```
- `GrainGradientShapes`: `wave`, `dots`, `truchet`, `corners`, `ripple`, `blob`, `sphere`

Presets:
- **Wave**: `{"fit":"none", "speed":1, "frame":0, "colorBack":"#000a0f", "colors":["#c4730b", "#bdad5f", "#d8ccc7"], "softness":0.7, "intensity":0.15, "noise":0.5, "shape":"wave"}`
- **Dots**: `{"fit":"none", "scale":0.6, "speed":1, "frame":0, "colorBack":"#0a0000", "colors":["#6f0000", "#0080ff", "#f2ebc9", "#33cc33"], "softness":1, "intensity":1, "noise":0.7, "shape":"dots"}`
- **Truchet**: `{"fit":"none", "speed":1, "frame":0, "colorBack":"#0a0000", "colors":["#6f2200", "#eabb7c", "#39b523"], "softness":0, "intensity":0.2, "noise":1, "shape":"truchet"}`
- **Ripple**: `{"scale":0.5, "speed":1, "frame":0, "colorBack":"#140a00", "colors":["#6f2d00", "#88ddae", "#2c0b1d"], "softness":0.5, "intensity":0.5, "noise":0.5, "shape":"ripple"}`
- **Blob**: `{"scale":1.3, "speed":1, "frame":0, "colorBack":"#0f0e18", "colors":["#3e6172", "#a49b74", "#568c50"], "softness":0, "intensity":0.15, "noise":0.5, "shape":"blob"}`

## HalftoneCmyk

CMYK halftone printing effect applied to images with customizable dot patterns and ink colors for each channel (Cyan, Magenta, Yellow, Black).

Defaults:
```js
{"speed":0, "frame":0, "colorBack":"#fbfaf5", "colorC":"#00b4ff", "colorM":"#fc519f", "colorY":"#ffd800", "colorK":"#231f20", "size":0.2, "contrast":1, "softness":1, "grainSize":0.5, "grainMixer":0, "grainOverlay":0, "gridNoise":0.2, "floodC":0.15, "floodM":0, "floodY":0, "floodK":0, "gainC":0.3, "gainM":0, "gainY":0.2, "gainK":0, "type":"ink"}
```
Sizing defaults that differ from neutral: `{"fit":"cover"}` — pass them explicitly (e.g. `offsetY: 0`) to re-center.
- `HalftoneCmykTypes`: `dots`, `ink`, `sharp`

Presets:
- **Drops**: `{"speed":0, "frame":0, "colorBack":"#eeefd7", "colorC":"#00b2ff", "colorM":"#fc4f4f", "colorY":"#ffd900", "colorK":"#231f20", "size":0.88, "contrast":1.15, "softness":0, "grainSize":0.01, "grainMixer":0.05, "grainOverlay":0.25, "gridNoise":0.5, "floodC":0.15, "floodM":0, "floodY":0, "floodK":0, "gainC":1, "gainM":0.44, "gainY":-1, "gainK":0, "type":"ink"}`
- **Newspaper**: `{"speed":0, "frame":0, "colorBack":"#f2f1e8", "colorC":"#7a7a75", "colorM":"#7a7a75", "colorY":"#7a7a75", "colorK":"#231f20", "size":0.01, "contrast":2, "softness":0.2, "grainSize":0, "grainMixer":0, "grainOverlay":0.2, "gridNoise":0.6, "floodC":0, "floodM":0, "floodY":0, "floodK":0.1, "gainC":-0.17, "gainM":-0.45, "gainY":-0.45, "gainK":0, "type":"dots"}`
- **Vintage**: `{"speed":0, "frame":0, "colorBack":"#fffaf0", "colorC":"#59afc5", "colorM":"#d8697c", "colorY":"#fad85c", "colorK":"#2d2824", "size":0.2, "contrast":1.25, "softness":0.4, "grainSize":0.5, "grainMixer":0.15, "grainOverlay":0.1, "gridNoise":0.45, "floodC":0.15, "floodM":0, "floodY":0, "floodK":0, "gainC":0.3, "gainM":0, "gainY":0.2, "gainK":0, "type":"sharp"}`

## HalftoneDots

A halftone-dot image filter featuring customizable grids, color palettes, and dot styles.

Defaults:
```js
{"speed":0, "frame":0, "colorBack":"#f2f1e8", "colorFront":"#2b2b2b", "size":0.5, "radius":1.25, "contrast":0.4, "originalColors":false, "inverted":false, "grainMixer":0.2, "grainOverlay":0.2, "grainSize":0.5, "grid":"hex", "type":"gooey"}
```
Sizing defaults that differ from neutral: `{"fit":"cover"}` — pass them explicitly (e.g. `offsetY: 0`) to re-center.
- `HalftoneDotsGrids`: `square`, `hex`
- `HalftoneDotsTypes`: `classic`, `gooey`, `holes`, `soft`

Presets:
- **LED screen**: `{"speed":0, "frame":0, "colorBack":"#000000", "colorFront":"#29ff7b", "size":0.5, "radius":1.5, "contrast":0.3, "originalColors":false, "inverted":false, "grainMixer":0, "grainOverlay":0, "grainSize":0.5, "grid":"square", "type":"soft"}`
- **Mosaic**: `{"speed":0, "frame":0, "colorBack":"#000000", "colorFront":"#b2aeae", "size":0.6, "radius":2, "contrast":0.01, "originalColors":true, "inverted":false, "grainMixer":0, "grainOverlay":0, "grainSize":0.5, "grid":"hex", "type":"classic"}`
- **Round and square**: `{"speed":0, "frame":0, "colorBack":"#141414", "colorFront":"#ff8000", "size":0.8, "radius":1, "contrast":1, "originalColors":false, "inverted":true, "grainMixer":0.05, "grainOverlay":0.3, "grainSize":0.5, "grid":"square", "type":"holes"}`

## Heatmap

A glowing gradient of colors flowing through an input shape. The effect creates a smoothly animated wave of intensity across the image.

Defaults:
```js
{"speed":1, "frame":0, "contour":0.5, "angle":0, "noise":0, "innerGlow":0.5, "outerGlow":0.5, "colorBack":"#000000", "colors":["#11206a", "#1f3ba2", "#2f63e7", "#6bd7ff", "#ffe679", "#ff991e", "#ff4c00"]}
```
Sizing defaults that differ from neutral: `{"scale":0.75}` — pass them explicitly (e.g. `offsetY: 0`) to re-center.

Presets:
- **Sepia**: `{"speed":0.5, "frame":0, "contour":0.5, "angle":0, "noise":0.75, "innerGlow":0.5, "outerGlow":0.5, "colorBack":"#000000", "colors":["#997F45", "#ffffff"]}`

## ImageDithering

A dithering image filter with support for 4 dithering modes and multiple color palettes (2-color, 3-color, and multicolor options, using either predefined colors or colors sampled from the original image). SIZING NOTE: This shader performs sizing in the fragment shader (not vertex shader) to keep u_pxSize in consistent actual pixels. The pixel grid is computed from gl_FragCoord before any transforms, so scaling/rotating only affects the underlying image. No vertex shader outputs (v_imageUV, v_objectUV, etc.) are used.

Defaults:
```js
{"speed":0, "frame":0, "colorFront":"#94ffaf", "colorBack":"#000c38", "colorHighlight":"#eaff94", "type":"8x8", "size":2, "colorSteps":2, "originalColors":false, "inverted":false}
```
Sizing defaults that differ from neutral: `{"fit":"cover"}` — pass them explicitly (e.g. `offsetY: 0`) to re-center.

Presets:
- **Noise**: `{"speed":0, "frame":0, "colorFront":"#a2997c", "colorBack":"#000000", "colorHighlight":"#ededed", "type":"random", "size":1, "colorSteps":1, "originalColors":false, "inverted":false}`
- **Retro**: `{"speed":0, "frame":0, "colorFront":"#eeeeee", "colorBack":"#5452ff", "colorHighlight":"#eeeeee", "type":"2x2", "size":3, "colorSteps":1, "originalColors":true, "inverted":false}`
- **Natural**: `{"speed":0, "frame":0, "colorFront":"#ffffff", "colorBack":"#000000", "colorHighlight":"#ffffff", "type":"8x8", "size":2, "colorSteps":5, "originalColors":true, "inverted":false}`

## LensDistortion

Lens Distortion image filter separates an image into shifting color layers (recreating the chromatic aberration of a lens) and warps the image geometry, curving it outward or inward like barrel and pincushion distortion.

Defaults:
```js
{"speed":0, "frame":0, "spread":0.6, "bias":1, "angle":0, "perspective":0.1, "count":35, "dispersion":1, "dispersionShift":0, "dispersionColor":0.6, "focusCenter":0.8, "focusEdges":1, "swirl":0.35, "noise":0, "noiseFrequency":0.25, "noiseOffset":0, "lensBulge":0, "lensCircle":0, "grainMixer":0, "grainOverlay":0, "imageX":0, "imageY":0}
```

Presets:
- **Fisheye**: `{"speed":0, "frame":0, "spread":0.7, "bias":1, "angle":0, "perspective":0.75, "count":15, "dispersion":1, "dispersionShift":0, "dispersionColor":0.7, "focusCenter":0.9, "focusEdges":1, "swirl":1, "noise":0, "noiseFrequency":0.25, "noiseOffset":0, "lensBulge":0.95, "lensCircle":1, "grainMixer":0.5, "grainOverlay":0, "imageX":0, "imageY":0}`
- **Duotone**: `{"speed":0, "frame":0, "spread":0.1, "bias":0, "angle":0, "perspective":0, "count":2, "dispersion":1, "dispersionShift":0, "dispersionColor":0.1, "focusCenter":0, "focusEdges":0, "swirl":0, "noise":0, "noiseFrequency":0.25, "noiseOffset":0, "lensBulge":0, "lensCircle":0, "grainMixer":0.1, "grainOverlay":0.3, "imageX":0, "imageY":0}`
- **Smoke**: `{"speed":0, "frame":0, "spread":0.65, "bias":-1, "angle":0, "perspective":0.4, "count":50, "dispersion":0, "dispersionShift":0, "dispersionColor":0.31, "focusCenter":0, "focusEdges":0.6, "swirl":0, "noise":1, "noiseFrequency":0.35, "noiseOffset":0.3, "lensBulge":0, "lensCircle":0, "grainMixer":0, "grainOverlay":0, "imageX":0, "imageY":0}`

## LiquidMetal

Futuristic liquid metal material applied to uploaded logo or abstract shape. Fluid motion imitation applied over user image with animated stripe pattern getting distorted along shape edges.

Defaults:
```js
{"speed":1, "frame":0, "colorBack":"#AAAAAC", "colorTint":"#ffffff", "distortion":0.07, "repetition":2, "shiftRed":0.3, "shiftBlue":0.3, "contour":0.4, "softness":0.1, "angle":70, "shape":"diamond"}
```
Sizing defaults that differ from neutral: `{"scale":0.6}` — pass them explicitly (e.g. `offsetY: 0`) to re-center.
- `LiquidMetalShapes`: `none`, `circle`, `daisy`, `diamond`, `metaballs`

Presets:
- **Noir**: `{"speed":1, "frame":0, "colorBack":"#000000", "colorTint":"#606060", "softness":0.45, "repetition":1.5, "shiftRed":0, "shiftBlue":0, "distortion":0, "contour":0, "angle":90, "shape":"diamond"}`
- **Backdrop**: `{"scale":1, "speed":1, "frame":0, "colorBack":"#AAAAAC", "colorTint":"#ffffff", "softness":0.05, "repetition":1.5, "shiftRed":0.3, "shiftBlue":0.3, "distortion":0.1, "contour":0.4, "shape":"none", "angle":90}`
- **Stripes**: `{"speed":1, "frame":0, "colorBack":"#000000", "colorTint":"#2c5d72", "softness":0.8, "repetition":6, "shiftRed":1, "shiftBlue":-1, "distortion":0.4, "contour":0.4, "shape":"circle", "angle":0}`

## MeshGradient

A flowing composition of color spots, moving along distinct trajectories and transformed by organic distortion.

Defaults:
```js
{"speed":1, "frame":0, "colors":["#e0eaff", "#241d9a", "#f75092", "#9f50d3"], "distortion":0.8, "swirl":0.1, "grainMixer":0, "grainOverlay":0}
```

Presets:
- **Ink**: `{"rotation":90, "speed":1, "frame":0, "colors":["#ffffff", "#000000"], "distortion":1, "swirl":0.2, "grainMixer":0, "grainOverlay":0}`
- **Purple**: `{"speed":0.6, "frame":0, "colors":["#aaa7d7", "#3c2b8e"], "distortion":1, "swirl":1, "grainMixer":0, "grainOverlay":0}`
- **Beach**: `{"speed":0.1, "frame":0, "colors":["#bcecf6", "#00aaff", "#00f7ff", "#ffd447"], "distortion":0.8, "swirl":0.35, "grainMixer":0, "grainOverlay":0}`

## Metaballs

Up to 20 colored gooey balls moving around the center and merging into smooth organic shapes.

Defaults:
```js
{"speed":1, "frame":0, "colorBack":"#000000", "colors":["#6e33cc", "#ff5500", "#ffc105", "#ffc800", "#f585ff"], "count":10, "size":0.83}
```

Presets:
- **Ink Drops**: `{"speed":2, "frame":0, "colorBack":"#ffffff00", "colors":["#000000"], "count":18, "size":0.1}`
- **Solar**: `{"speed":1, "frame":0, "colors":["#ffc800", "#ff5500", "#ffc105"], "colorBack":"#102f84", "count":7, "size":0.75}`
- **Background**: `{"scale":4, "offsetX":-0.3, "speed":0.5, "frame":0, "colors":["#ae00ff", "#00ff95", "#ffc105"], "colorBack":"#2a273f", "count":13, "size":0.81}`

## NeuroNoise

A glowing, web-like structure of fluid lines and soft intersections. Great for creating atmospheric, organic-yet-futuristic visuals.

Defaults:
```js
{"speed":1, "frame":0, "colorFront":"#ffffff", "colorMid":"#47a6ff", "colorBack":"#000000", "brightness":0.05, "contrast":0.3}
```

Presets:
- **Sensation**: `{"scale":3, "speed":1, "frame":0, "colorFront":"#00c8ff", "colorMid":"#fbff00", "colorBack":"#8b42ff", "brightness":0.19, "contrast":0.12}`
- **Bloodstream**: `{"scale":0.7, "speed":1, "frame":0, "colorFront":"#ff0000", "colorMid":"#ff0000", "colorBack":"#ffffff", "brightness":0.24, "contrast":0.17}`
- **Ghost**: `{"scale":0.55, "speed":1, "frame":0, "colorFront":"#ffffff", "colorMid":"#000000", "colorBack":"#ffffff", "brightness":0, "contrast":1}`

## PaperTexture

Static paper-like texture built from a combination of grain, noise and multiple fold patterns. Works as an image filter or as a standalone texture.

Defaults:
```js
{"speed":0, "frame":0, "colorBack":"#d3d2ab", "colorPaper":"#ffffff", "colorShadow":"#cccccc", "blending":1, "distortion":0.75, "clip":false, "angle":300, "seed":4, "roughness":0.4, "roughnessSize":0.5, "roughnessRows":0, "fiber":0.4, "fiberSize":0.5, "folds":0.5, "foldSizeX":1, "foldSizeY":1, "foldOffsetX":0, "foldOffsetY":0, "wrinkles":1, "wrinkleSize":0.65, "crumples":0, "crumpleCount":6, "drops":0.4}
```
Sizing defaults that differ from neutral: `{"scale":0.9}` — pass them explicitly (e.g. `offsetY: 0`) to re-center.

Presets:
- **Spread**: `{"speed":0, "frame":0, "colorBack":"#ffffff00", "colorPaper":"#ffffffb5", "colorShadow":"#b3b3b3", "blending":1, "distortion":-0.3, "clip":true, "angle":236, "seed":613, "roughness":0.15, "roughnessSize":0.25, "roughnessRows":0, "fiber":0.5, "fiberSize":0.5, "folds":1, "foldSizeX":0.4, "foldSizeY":0.89, "foldOffsetX":0, "foldOffsetY":0, "wrinkles":0, "wrinkleSize":0.65, "crumples":0, "crumpleCount":9, "drops":0}`
- **Creased**: `{"speed":0, "frame":0, "colorBack":"#d3d2ab", "colorPaper":"#ffffff", "colorShadow":"#b3b3b3", "blending":1, "distortion":-0.5, "clip":false, "angle":60, "seed":49, "roughness":0.4, "roughnessSize":0.25, "roughnessRows":0, "fiber":0.4, "fiberSize":0.5, "folds":0, "foldSizeX":0.6, "foldSizeY":0.89, "foldOffsetX":0.59, "foldOffsetY":1, "wrinkles":0, "wrinkleSize":0.65, "crumples":1, "crumpleCount":4, "drops":0}`
- **Flat**: `{"speed":0, "frame":0, "colorBack":"#d4cdab", "colorPaper":"#ffffffa8", "colorShadow":"#b3b3b3", "blending":1, "distortion":0, "clip":false, "angle":0, "seed":455, "roughness":1, "roughnessSize":0.5, "roughnessRows":0.6, "fiber":0.7, "fiberSize":1, "folds":0, "foldSizeX":0, "foldSizeY":0.44, "foldOffsetX":0, "foldOffsetY":0, "wrinkles":0, "wrinkleSize":0, "crumples":0, "crumpleCount":6, "drops":0.2}`

## PerlinNoise

Classic animated 3D Perlin noise with exposed controls. Original algorithm: https://www.shadertoy.com/view/NlSGDz

Defaults:
```js
{"speed":0.5, "frame":0, "colorBack":"#632ad5", "colorFront":"#fccff7", "proportion":0.35, "softness":0.1, "octaveCount":1, "persistence":1, "lacunarity":1.5}
```

Presets:
- **Nintendo Water**: `{"scale":5, "speed":0.4, "frame":0, "colorBack":"#2d69d4", "colorFront":"#d1eefc", "proportion":0.42, "softness":0, "octaveCount":2, "persistence":0.55, "lacunarity":1.8}`
- **Moss**: `{"scale":6.666666666666667, "speed":0.02, "frame":0, "colorBack":"#05ff4a", "colorFront":"#262626", "proportion":0.65, "softness":0.35, "octaveCount":6, "persistence":1, "lacunarity":2.55}`
- **Worms**: `{"scale":0.9, "speed":0, "frame":0, "colorBack":"#ffffff00", "colorFront":"#595959", "proportion":0.5, "softness":0, "octaveCount":1, "persistence":1, "lacunarity":1.5}`

## PulsingBorder

Luminous trails of color merging into a glowing gradient contour.

Defaults:
```js
{"speed":1, "frame":0, "colorBack":"#000000", "colors":["#0dc1fd", "#d915ef", "#ff3f2ecc"], "roundness":0.25, "thickness":0.1, "margin":0, "marginLeft":0, "marginRight":0, "marginTop":0, "marginBottom":0, "aspectRatio":"auto", "softness":0.75, "intensity":0.2, "bloom":0.25, "spots":4, "spotSize":0.5, "pulse":0.25, "smoke":0.3, "smokeSize":0.6}
```
Sizing defaults that differ from neutral: `{"scale":0.6}` — pass them explicitly (e.g. `offsetY: 0`) to re-center.
- `PulsingBorderAspectRatios`: `auto`, `square`

Presets:
- **Circle**: `{"aspectRatio":"square", "speed":1, "frame":0, "colorBack":"#000000", "colors":["#0dc1fd", "#d915ef", "#ff3f2ecc"], "roundness":1, "margin":0, "marginLeft":0, "marginRight":0, "marginTop":0, "marginBottom":0, "thickness":0, "softness":0.75, "intensity":0.2, "bloom":0.45, "spots":3, "spotSize":0.4, "pulse":0.5, "smoke":1, "smokeSize":0}`
- **Northern lights**: `{"scale":1.1, "speed":0.18, "frame":0, "colors":["#4c4794", "#774a7d", "#12694a", "#0aff78", "#4733cc"], "colorBack":"#0c182c", "roundness":0, "thickness":1, "softness":1, "margin":0, "marginLeft":0, "marginRight":0, "marginTop":0, "marginBottom":0, "aspectRatio":"auto", "intensity":0.1, "bloom":0.2, "spots":4, "spotSize":0.25, "pulse":0, "smoke":0.32, "smokeSize":0.5}`
- **Solid line**: `{"scale":1, "speed":1, "frame":0, "colors":["#81ADEC"], "colorBack":"#00000000", "roundness":0, "thickness":0.05, "margin":0, "marginLeft":0, "marginRight":0, "marginTop":0, "marginBottom":0, "aspectRatio":"auto", "softness":0, "intensity":0, "bloom":0.15, "spots":4, "spotSize":1, "pulse":0, "smoke":0, "smokeSize":0}`

## SimplexNoise

A multi-color gradient mapped into smooth, animated curves built as a combination of 2 Simplex noises.

Defaults:
```js
{"speed":0.5, "frame":0, "colors":["#4449CF", "#FFD1E0", "#F94446", "#FFD36B", "#FFFFFF"], "stepsPerColor":2, "softness":0}
```
Sizing defaults that differ from neutral: `{"scale":0.6}` — pass them explicitly (e.g. `offsetY: 0`) to re-center.

Presets:
- **Spots**: `{"scale":1, "speed":0.6, "frame":0, "colors":["#ff7b00", "#f9ffeb", "#320d82"], "stepsPerColor":1, "softness":0}`
- **First contact**: `{"scale":0.2, "speed":2, "frame":0, "colors":["#e8cce6", "#120d22", "#442c44", "#e6baba", "#fff5f5"], "stepsPerColor":2, "softness":0}`
- **Bubblegum**: `{"scale":1.6, "speed":2, "frame":0, "colors":["#ffffff", "#ff9e9e", "#5f57ff", "#00f7ff"], "stepsPerColor":1, "softness":1}`

## SmokeRing

Radial multi-colored gradient shaped with layered noise for a natural, smoky aesthetic.

Defaults:
```js
{"speed":0.5, "frame":0, "colorBack":"#000000", "colors":["#ffffff"], "noiseScale":3, "noiseIterations":8, "radius":0.25, "thickness":0.65, "innerShape":0.7}
```
Sizing defaults that differ from neutral: `{"scale":0.8}` — pass them explicitly (e.g. `offsetY: 0`) to re-center.

Presets:
- **Line**: `{"scale":1, "frame":0, "colorBack":"#000000", "colors":["#4540a4", "#1fe8ff"], "noiseScale":1.1, "noiseIterations":2, "radius":0.38, "thickness":0.01, "innerShape":0.88, "speed":4}`
- **Solar**: `{"scale":2, "offsetY":1, "speed":1, "frame":0, "colorBack":"#000000", "colors":["#ffffff", "#ffca0a", "#fc6203", "#fc620366"], "noiseScale":2, "noiseIterations":3, "radius":0.4, "thickness":0.8, "innerShape":4}`
- **Cloud**: `{"scale":2.5, "frame":0, "colorBack":"#81ADEC", "colors":["#ffffff"], "noiseScale":3, "noiseIterations":10, "radius":0.5, "thickness":0.65, "innerShape":0.85, "speed":0.5}`

## Spiral

A single-colored animated spiral that morphs across a wide range of shapes - from crisp, thin-lined geometry to flowing whirlpool forms and wavy, abstract rings.

Defaults:
```js
{"colorBack":"#001429", "colorFront":"#79D1FF", "density":1, "distortion":0, "strokeWidth":0.5, "strokeTaper":0, "strokeCap":0, "noise":0, "noiseFrequency":0, "softness":0, "speed":1, "frame":0}
```

Presets:
- **Jungle**: `{"scale":1.3, "density":0.5, "colorBack":"#a0ef2a", "colorFront":"#288b18", "distortion":0, "strokeWidth":0.5, "strokeTaper":0, "strokeCap":0, "noise":1, "noiseFrequency":0.25, "softness":0, "speed":0.75, "frame":0}`
- **Droplet**: `{"colorBack":"#effafe", "colorFront":"#bf40a0", "density":0.9, "distortion":0, "strokeWidth":0.75, "strokeTaper":0.18, "strokeCap":1, "noise":0.74, "noiseFrequency":0.33, "softness":0.02, "speed":1, "frame":0}`
- **Swirl**: `{"scale":0.45, "colorBack":"#b3e6d9", "colorFront":"#1a2b4d", "density":0.2, "distortion":0, "strokeWidth":0.5, "strokeTaper":0, "strokeCap":0, "noise":0, "noiseFrequency":0.3, "softness":0.5, "speed":1, "frame":0}`

## StaticMeshGradient

Multi-point mesh gradient with up to 10 color spots, enhanced by two-direction warping, adjustable blend sharpness, and grain controls.

Defaults:
```js
{"speed":0, "frame":0, "colors":["#ffad0a", "#6200ff", "#e2a3ff", "#ff99fd"], "positions":2, "waveX":1, "waveXShift":0.6, "waveY":1, "waveYShift":0.21, "mixing":0.93, "grainMixer":0, "grainOverlay":0}
```
Sizing defaults that differ from neutral: `{"rotation":270}` — pass them explicitly (e.g. `offsetY: 0`) to re-center.

Presets:
- **1960s**: `{"rotation":0, "speed":0, "frame":0, "colors":["#000000", "#082400", "#b1aa91", "#8e8c15"], "positions":42, "waveX":0.45, "waveXShift":0, "waveY":1, "waveYShift":0, "mixing":0, "grainMixer":0.37, "grainOverlay":0.78}`
- **Sunset**: `{"rotation":0, "speed":0, "frame":0, "colors":["#264653", "#9c2b2b", "#f4a261", "#ffffff"], "positions":0, "waveX":0.6, "waveXShift":0.7, "waveY":0.7, "waveYShift":0.7, "mixing":0.5, "grainMixer":0, "grainOverlay":0}`
- **Sea**: `{"rotation":0, "speed":0, "frame":0, "colors":["#013b65", "#03738c", "#a3d3ff", "#f2faef"], "positions":0, "waveX":0.53, "waveXShift":0, "waveY":0.95, "waveYShift":0.64, "mixing":0.5, "grainMixer":0, "grainOverlay":0}`

## StaticRadialGradient

Radial gradient with up to 10 blended colors, featuring advanced mixing modes, focal point controls, shape distortion, and grain effects.

Defaults:
```js
{"speed":0, "frame":0, "colorBack":"#000000", "colors":["#00bbff", "#00ffe1", "#ffffff"], "radius":0.8, "focalDistance":0.99, "focalAngle":0, "falloff":0.24, "mixing":0.5, "distortion":0, "distortionShift":0, "distortionFreq":12, "grainMixer":0, "grainOverlay":0}
```

Presets:
- **Lo-Fi**: `{"speed":0, "frame":0, "colorBack":"#2e1f27", "colors":["#d72638", "#3f88c5", "#f49d37"], "radius":1, "focalDistance":0, "focalAngle":0, "falloff":0.9, "mixing":0.7, "distortion":0, "distortionShift":0, "distortionFreq":12, "grainMixer":1, "grainOverlay":0.5}`
- **Cross Section**: `{"speed":0, "frame":0, "colorBack":"#3d348b", "colors":["#7678ed", "#f7b801", "#f18701", "#37a066"], "radius":1, "focalDistance":0, "focalAngle":0, "falloff":0, "mixing":0, "distortion":1, "distortionShift":0, "distortionFreq":12, "grainMixer":0, "grainOverlay":0}`
- **Radial**: `{"speed":0, "frame":0, "colorBack":"#264653", "colors":["#9c2b2b", "#f4a261", "#ffffff"], "radius":1, "focalDistance":0, "focalAngle":0, "falloff":0, "mixing":1, "distortion":0, "distortionShift":0, "distortionFreq":12, "grainMixer":0, "grainOverlay":0}`

## Swirl

Animated bands of color twisting and bending, producing spirals, arcs, and flowing circular patterns.

Defaults:
```js
{"speed":0.32, "frame":0, "colorBack":"#330000", "colors":["#ffd1d1", "#ff8a8a", "#660000"], "bandCount":4, "twist":0.1, "center":0.2, "proportion":0.5, "softness":0, "noiseFrequency":0.4, "noise":0.2}
```

Presets:
- **007**: `{"speed":1, "frame":0, "colorBack":"#E9E7DA", "colors":["#000000"], "bandCount":5, "twist":0.3, "center":0, "proportion":0, "softness":0, "noiseFrequency":0.5, "noise":0}`
- **Opening**: `{"offsetX":-0.4, "offsetY":1, "speed":0.5, "frame":0, "colorBack":"#ff8b61", "colors":["#fefff0", "#ffd8bd", "#ff8b61"], "bandCount":2, "twist":0.3, "center":0.2, "proportion":0.5, "softness":0, "noiseFrequency":0, "noise":0}`
- **Candy**: `{"speed":1, "frame":0, "colorBack":"#ffcd66", "colors":["#6bbceb", "#d7b3ff", "#ff9fff"], "bandCount":2, "twist":0.15, "center":0.2, "proportion":0.5, "softness":1, "noiseFrequency":0.5, "noise":0}`

## Voronoi

Anti-aliased animated Voronoi pattern with smooth and customizable edges. Double-pass Voronoi pattern cell edges. Original algorithm: https://www.shadertoy.com/view/ldl3W8 Note: gaps can't be removed completely due to natural artifacts of Voronoi cells borders

Defaults:
```js
{"speed":0.5, "frame":0, "colors":["#ff8247", "#ffe53d"], "stepsPerColor":3, "colorGlow":"#ffffff", "colorGap":"#2e0000", "distortion":0.4, "gap":0.04, "glow":0}
```
Sizing defaults that differ from neutral: `{"scale":0.5}` — pass them explicitly (e.g. `offsetY: 0`) to re-center.

Presets:
- **Lights**: `{"scale":3.3, "speed":0.5, "frame":0, "colors":["#fffffffc", "#bbff00", "#00ffff"], "colorGlow":"#ff00d0", "colorGap":"#ff00d0", "stepsPerColor":2, "distortion":0.38, "gap":0, "glow":1}`
- **Cells**: `{"speed":0.5, "frame":0, "colors":["#ffffff"], "stepsPerColor":1, "colorGlow":"#ffffff", "colorGap":"#000000", "distortion":0.5, "gap":0.03, "glow":0.8}`
- **Bubbles**: `{"scale":0.75, "speed":0.5, "frame":0, "colors":["#83c9fb"], "stepsPerColor":1, "colorGlow":"#ffffff", "colorGap":"#ffffff", "distortion":0.4, "gap":0, "glow":1}`

## Warp

Animated color fields warped by noise and swirls, applied over base patterns (checks, stripes, or split edge). Blends up to 10 colors with adjustable distribution, softness, distortion, and swirl. Great for fluid, smoky, or marbled effects.

Defaults:
```js
{"speed":1, "frame":0, "colors":["#121212", "#9470ff", "#121212", "#8838ff"], "proportion":0.45, "softness":1, "distortion":0.25, "swirl":0.8, "swirlIterations":10, "shapeScale":0.1, "shape":"checks"}
```
- `WarpPatterns`: `checks`, `stripes`, `edge`

Presets:
- **Cauldron Pot**: `{"scale":0.9, "rotation":160, "speed":10, "frame":0, "colors":["#a7e58b", "#324472", "#0a180d"], "proportion":0.64, "softness":1.5, "distortion":0.2, "swirl":0.86, "swirlIterations":7, "shapeScale":0.6, "shape":"edge"}`
- **Live Ink**: `{"scale":1.2, "rotation":44, "offsetY":-0.3, "speed":2.5, "frame":0, "colors":["#111314", "#9faeab", "#f3fee7", "#f3fee7"], "proportion":0.05, "softness":0, "distortion":0.25, "swirl":0.8, "swirlIterations":10, "shapeScale":0.28, "shape":"checks"}`
- **Kelp**: `{"scale":0.8, "rotation":50, "speed":20, "frame":0, "colors":["#dbff8f", "#404f3e", "#091316"], "proportion":0.67, "softness":0, "distortion":0, "swirl":0.2, "swirlIterations":3, "shapeScale":1, "shape":"stripes"}`
- **Nectar**: `{"scale":2, "offsetY":0.6, "speed":4.2, "frame":0, "colors":["#151310", "#d3a86b", "#f0edea"], "proportion":0.24, "softness":1, "distortion":0.21, "swirl":0.57, "swirlIterations":10, "shapeScale":0.75, "shape":"edge"}`
- **Passion**: `{"scale":2.5, "rotation":1.35, "speed":3, "frame":0, "colors":["#3b1515", "#954751", "#ffc085"], "proportion":0.5, "softness":1, "distortion":0.09, "swirl":0.9, "swirlIterations":6, "shapeScale":0.25, "shape":"checks"}`

## Water

Water-like surface distortion with natural caustic realism. Works as an image filter or standalone animated texture.

Defaults:
```js
{"speed":1, "frame":0, "colorBack":"#909090", "colorHighlight":"#ffffff", "highlights":0.07, "layering":0.5, "edges":0.8, "waves":0.3, "caustic":0.1, "size":1}
```
Sizing defaults that differ from neutral: `{"scale":0.8}` — pass them explicitly (e.g. `offsetY: 0`) to re-center.

Presets:
- **Slow-mo**: `{"fit":"cover", "scale":1, "speed":0.1, "frame":0, "colorBack":"#909090", "colorHighlight":"#ffffff", "highlights":0.4, "layering":0, "edges":0, "waves":0, "caustic":0.2, "size":0.7}`
- **Abstract**: `{"fit":"cover", "scale":3, "speed":1, "frame":0, "colorBack":"#909090", "colorHighlight":"#ffffff", "highlights":0, "layering":0, "edges":1, "waves":1, "caustic":0.4, "size":0.15}`
- **Streaming**: `{"scale":0.4, "speed":2, "frame":0, "colorBack":"#909090", "colorHighlight":"#ffffff", "highlights":0, "layering":0, "edges":0, "waves":0.5, "caustic":0, "size":0.5}`

## Waves

Static line pattern configurable into textures ranging from sharp zigzags to smooth flowing waves.

Defaults:
```js
{"colorFront":"#ffbb00", "colorBack":"#000000", "shape":0, "frequency":0.5, "amplitude":0.5, "spacing":1.2, "proportion":0.1, "softness":0}
```
Sizing defaults that differ from neutral: `{"scale":0.6}` — pass them explicitly (e.g. `offsetY: 0`) to re-center.

Presets:
- **Groovy**: `{"scale":5, "rotation":90, "colorFront":"#fcfcee", "colorBack":"#ff896b", "shape":3, "frequency":0.2, "amplitude":0.25, "spacing":1.17, "proportion":0.57, "softness":0}`
- **Tangled up**: `{"scale":0.5, "colorFront":"#133a41", "colorBack":"#c2d8b6", "shape":2.07, "frequency":0.44, "amplitude":0.57, "spacing":1.05, "proportion":0.75, "softness":0}`
- **Ride the wave**: `{"scale":1.7, "colorFront":"#fdffe6", "colorBack":"#1f1f1f", "shape":2.25, "frequency":0.2, "amplitude":1, "spacing":1.25, "proportion":1, "softness":0}`
