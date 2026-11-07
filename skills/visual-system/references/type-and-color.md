# Type and color for moving brands

What makes a visual system hold up in video, where frames are seen for seconds, on phones, over moving material.
Use it to build options, to write recommendations, and to check boards.

## Typefaces

- **Two roles, two faces at most.** A display face carries the character (titles, wordmark); a text face carries
  reading. A third face (a mono) earns its place only with a job: a terminal, data, labels.
- **Pair by contrast, keep one shared trait.** Serif display + sans text, or a heavy grotesk + a light mono. Share
  something (x-height, warmth, era) so they read as one family. Two faces that are nearly alike look like a mistake.
- **The display face is the personality.** Read IDENTITY.md's pairs: crafted/warm leans to serifs with soft
  terminals or humanist sans; technical/cool to grotesks and monos; classic to old-style serifs; new to geometric or
  variable faces. Options should span the space, never three cousins.
- **Free and reliable.** Propose only openly licensed families (Google Fonts, Fontsource, Geist, Inter, IBM Plex,
  Fraunces...). Variable fonts are welcome (one file, any weight). User-licensed fonts come in as files.
- **Video legibility at 1920×1080:** body 28–36 px, captions ≥ 20 px, nothing under 18 px. Thin weights (100–300)
  only above 72 px. On 9:16 keep the same pixel sizes on the 1080 width; they read larger on a phone.
- **Tracking:** tight (−0.01 to −0.03 em) for large display, default for body, wide (0.1–0.3 em) only for small caps
  or mono labels. The heavier the weight, the less negative tracking it takes before letters collide.
- **Casing comes from the voice.** If IDENTITY.md's voice is lowercase, the wordmark and titles are too.

## Palette

- **Roles, not swatches.** Ground (what most frames sit on), figure (type and main shapes), accent (one moment per
  frame). Add muted and surface only if layouts need them. Three to five colors total.
- **Value first, hue second.** Decide light ground or dark ground, then hue. A palette that works in grayscale works
  in color. Check every text color on its ground: figure ≥ 7:1, anything else used for text (muted, accent) ≥ 4.5:1.
- **Material, not digital.** Slightly impure colors (`#EEE7DB` not `#FFFFFF`, `#141210` not `#000000`) feel like
  paper, ink, clay. Pure primaries feel like software; use them only when the identity is software.
- **The accent appears once.** If it is everywhere it is the ground.
- **Built for shaders too.** Gradients and fields need a ramp: three to five tones from the ground toward the
  accent family, so the shader set can grow from the palette. It goes in `tokens.json` (`ramp`) and VISUAL.md, and
  every tone in it is shown on the system board before the user confirms.
- **Respect the anti-references.** If IDENTITY.md rejects "techy gradients" or neon, the options exclude them.

## Shape

- **soft** (rounded corners, pills, circles): friendly, approachable.
- **hard** (right angles, thin rules): precise, editorial, technical.
- **organic** (slightly irregular, cut by hand): crafted, natural, warm. Keep the irregularity low or it turns cute.
- One language per brand; radius and stroke weight are part of it.

## Wordmark

- The name, cased as the brand writes it, in the display face. Adjust only weight and tracking (lighter weights take
  more negative tracking, heavy weights little or none) and check spacing pairs by eye (`rn`, `va`, `ff`). Never distort, outline or add effects in the mark itself; effects
  are treatments applied in a piece.
- Render both versions with `pamo wordmark` (cropped to the ink): `wordmark-on-light.png` in the figure color,
  `wordmark-on-dark.png` in the ground color, or the reverse for a dark brand. Clear space is a rule in VISUAL.md.
- If the user has a logo, it leads; the wordmark supports it in type that matches.

## Checking a board

- Type and wordmark boards stack the options (`pamo board --cols 1`) so type shows at its real size; set sizes from
  the type scale, never inflated to survive a small board.
- Squint: do the options differ at a glance?
- Every size legible at board scale; the intended face loaded, no fallback.
- Palette options shown on the same layout, with the chosen type, each color in its role and in proportion (ground
  most, accent least).
