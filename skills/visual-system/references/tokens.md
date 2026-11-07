# `brand/tokens.json`

The visual system as data: what scenes, the brand sheet and other skills read to set type and color without
re-deciding anything. `brand/VISUAL.md` says the same in words, with the reasons. Write both together; when they
disagree, the user's last decision wins and both are corrected.

The example is a fictional musician, "Ondas"; it shows the shape, not a recommendation.

```json
{
  "brand": "Ondas",
  "fonts": {
    "display": { "family": "Space Grotesk", "weights": [500], "css": "https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@500&display=block", "license": "OFL" },
    "text":    { "family": "Inter", "weights": [400, 500], "css": "https://fonts.googleapis.com/css2?family=Inter:wght@400;500&display=block", "license": "OFL" },
    "mono":    { "family": "JetBrains Mono", "weights": [400], "css": "https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400&display=block", "license": "OFL" }
  },
  "colors": {
    "ground":  { "hex": "#0F1114", "role": "background of most frames" },
    "figure":  { "hex": "#E8ECEF", "role": "type and main shapes" },
    "muted":   { "hex": "#8E98A3", "role": "secondary type, rules" },
    "surface": { "hex": "#1A1E23", "role": "panels" },
    "accent":  { "hex": "#7FD1C1", "role": "one moment per frame: a word, a line, a pulse" }
  },
  "ramp": ["#0F1114", "#1E3A44", "#3F7F86", "#7FD1C1"],
  "mode": "dark",
  "type": {
    "reference": 1080,
    "display": { "font": "display", "weight": 500, "size": 200, "lineHeight": 0.95, "tracking": "-0.03em" },
    "title":   { "font": "display", "weight": 500, "size": 88,  "lineHeight": 1.05, "tracking": "-0.02em" },
    "body":    { "font": "text",    "weight": 400, "size": 32,  "lineHeight": 1.4,  "tracking": "0em" },
    "caption": { "font": "mono",    "weight": 400, "size": 22,  "lineHeight": 1.3,  "tracking": "0.04em" }
  },
  "shape": { "language": "hard", "radius": 0, "stroke": 1 },
  "wordmark": {
    "text": "ONDAS", "font": "display", "weight": 500, "tracking": "0.06em",
    "files": { "onLight": "assets/wordmark-on-light.png", "onDark": "assets/wordmark-on-dark.png" },
    "logo": null
  }
}
```

## Fields

- **fonts**: `display` (titles, wordmark) and `text` (everything read) are required; `mono` is optional (terminal,
  data, labels). Each has a `family`, the `weights` in use, and either `css` (a Google Fonts css2 URL with
  `display=block`) or `file` (a path under `brand/assets/fonts/`). `license` is `OFL`, `Apache`, or `user` for files
  the user brought.
- **colors**: keyed by role. `ground`, `figure` and `accent` are required; add `muted`, `surface`, or more only when
  the system uses them. Each has `hex` and a one-line `role`. Names are roles, never hues ("accent", not "orange").
  Every color used for text reaches at least 4.5:1 on `ground` (figure aims for 7:1).
- **ramp**: three to five tones from the ground toward the accent family, in order. Shaders and gradients (the
  shader set) build from it.
- **mode**: `light` or `dark`, the ground most frames sit on.
- **type**: sizes in px for a frame whose short side is 1080 px (`reference`). The three pack formats (1920×1080,
  1080×1920, 1080×1080) all have that short side, so they use the sizes as they are; any other size scales by
  short side ÷ 1080. Each role names a font key.
- **shape**: `language` is `soft`, `hard` or `organic`; `radius` and `stroke` in px at the reference size. Organic
  shapes are drawn with the engine's `organicPath()`.
- **wordmark**: the name as the brand writes it, the font role, weight and tracking it is set in, and the rendered
  files (`pm wordmark`, cropped to the ink): `onLight` is dark ink for light grounds, `onDark` light ink for dark
  grounds. `logo` is the path of a logo the user brought, or `null`. When a logo exists, it leads and the wordmark
  supports it.
