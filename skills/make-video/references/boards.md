# Boards

A board is how you show the user options and let them decide one thing: a palette, a font pair, a background, a move, a recipe, or whole kits. It has two forms. Prefer the live one whenever the user can open a browser.

## Live boards (paper-motion.app)

A live board is a link. The user opens it, sees 2–4 options playing in their own look, can tune one, and chooses. The page gives them one line to paste back in the chat.

### Build one

```bash
pamo board --url --title "Backgrounds for Kiln" --ask "Which one feels like the product?" --reply bg-1 \
  --look cobalt,geist \
  --option mesh-graphite --note "quiet, graphite" \
  --option neuro-slate --note "a technical web" \
  --option "dither-slate:colorFront=#3d6bff" --note "pixels in your accent" \
  --option grain-slate
```

- `--title` and `--ask`: what the user is deciding, in their words.
- `--reply <name>`: your name for this decision (`bg-1`, `type-2`). It comes back in the user's reply, so you can match it.
- `--look palette,font`: the user's palette and font pair, with values when tuned (`cobalt:accent=#ff5b2e,geist`). Every option plays in that look: moves in its colors and type, and **backgrounds recolored into its palette** (each color keeps its tone and takes the nearest palette hue), so a board of backgrounds is a board of textures and motion, not of colors. The reply line carries the recolored values. Without a look, options play in paper-motion's own.
- `--option id[:key=value,…]`: 2 to 4, one resource type per board. Values are your adjustments (hex colors, numbers, JSON for lists).
- `--note "…"`: one line per option saying why you propose it. Users read these.
- On a recipe board, one option may be a **structure of your own** for this brief: `--option "@Title | 18 | Hook 0-2 one line; Proof 2-12 three shots; Close 12-18 the action"`. The board draws its beats next to the recipes'; if the user chooses it, you build the scene from scratch with those beats. Recipes show their beats on the board too, so the user chooses a rhythm, not a name.
- `--kit`: each option is a whole kit, a space-separated list of ids (`--option "cobalt geist mesh-graphite magic-move launch"`), for "show me three directions".
- The command prints the link and **keeps running until the user chooses** in the browser, then prints the reply line (10 minutes; `--wait 3` changes it, exit code 3 on timeout, `--no-wait` returns at once). Tell the user you are waiting; never ask them to paste the line while you are.
- `--choose 3` or `--choose 1-3`: the user may pick several options; the line lists them (`A+C · type-on · scramble`). Use it for text effects and transitions, where a piece needs more than one.
- The link is short (`/b/<id>`, stored on the site for 90 days) when the site answers and long (the board in the fragment) otherwise; `--long` forces the long one. `pamo board --forget <id>` deletes a stored board early.
- The command validates ids and params against the registry and prints the URL. Share it as is. Without the CLI, build the payload by hand: the format is in `https://paper-motion.vercel.app/llms.txt`.

### Read the reply

The user pastes one line that starts with `paper-motion:`:

| Line | Meaning |
|---|---|
| `paper-motion: A · mesh-graphite (bg-1)` | chose A as proposed |
| `paper-motion: C · dither-slate --set colorFront=#3d6bff (bg-1)` | chose C and tuned it; install with exactly those `--set` arguments |
| `paper-motion: none of bg-1, show me calmer ones` | none; the text after the comma is what they want instead |
| `paper-motion: kit B · cobalt geist mesh-graphite whip-pan launch` | chose kit B |

Install a choice with `pamo add <id> [--set …]`. The choice is also in the user's kit on the site, so the final prompt from there carries everything.

### Choose the options well

Pick with the registry's metadata, not by name. `pamo search` filters by it; `registry.json` carries it.

- **Backgrounds for a brand:** same `mode` as the palette (light or dark), closest `colors` (`--near "#ground,#accent"`), and a `motion` that fits the pace (`still` or `gentle` for calm brands, `lively` for energetic ones). Offer range: one quiet, one textured, one bold.
- **Moves for a feel:** `mood` matching the brand's words, `energy` within the pace (calm 1–2, medium 2–3, fast 4–5), and the `role` the beat needs (`swap` between frames, `enter` for a title, `emphasis` on a hit). Never four variations of the same idea: vary the mechanic.
- **Palettes and font pairs:** `mood` and `mode`; for fonts, `voice` (serif, sans, display, mono) matching the identity.
- **Recipes:** `purpose` and `formats`.
- Tune an option when a default doesn't fit (a background's colors toward the brand, a move's `duration` to the pace): the user sees your version, and the reply carries it.
- Every `when` field is a hint about use; read them.

### When in the flow

- Intake and the style gate (Gate A): palette, type, backgrounds, the repertoire of moves, the recipe. One decision per board; two or three boards in a row are fine.
- Not for the test shot or the full piece: those are real renders from the engine.

## Rendered boards (the fallback)

When the user can't open a browser, or wants to see it in the chat: `pamo board a.html b.html … --t 2` (a still) or `--clip 5` (short clips), lettered A, B, C… Same decision, same reply ("B"), rendered by the engine. See `make-video` for the option scenes (`pamo new --still`, `pamo new --move`).
