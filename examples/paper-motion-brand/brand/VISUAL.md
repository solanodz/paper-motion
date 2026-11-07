# paper-motion · visual system

## Typefaces
- **Geist Serif** (display): titles, the wordmark, scene names. Quiet, editorial, 96–280 px at −0.02em.
- **Geist Mono** (text): the terminal, UI, captions and code. 18–32 px, weights 400 and 500.
- **Geist Pixel** (extra): counters, frame numbers and data only.

## Palette
Black first. Color is an event: type and interface stay black and white; color only arrives through a shader.
- **Ground** `#000000`: every frame.
- **Figure** `#FFFFFF`: primary type and the cursor (21:1).
- **Muted** `#8A8A8A`: taglines and secondary text (6.4:1).
- **Surface** `#0A0A0A`: panels and terminal windows; borders in `#2E2E2E`.
- **Accent** `#E9E4D8`: paper, a warm white for one moment.
- Shader tints (inside shaders only): sage `#8FA67A`, clay `#B07D73`, slate `#8EA3AD`, ochre `#C9A65A`, ash `#7E7594`.

## Ramp
`#000000` → `#2E2E2E` → `#5F7A86` → `#8EA3AD`

## Type scale
display Geist Serif 220 px · title Geist Serif 96 px · body Geist Mono 26 px · caption Geist Mono 20 px (short side 1080).

## Shape
Hard: right angles and thin 1 px borders; terminal panels round to 12 px.

## Wordmark
`paper-motion` in Geist Serif, −0.02em, lowercase with the hyphen always in. Flat white everywhere; chrome (LiquidMetal) only on end cards and the README.

## Rules
- Never chrome and flat in one frame.
- Color never touches type or interface.
- One type animation at a time.

## Open
