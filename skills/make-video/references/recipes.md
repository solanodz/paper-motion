# Recipes

A recipe is a proven structure and timing for a kind of piece. It never carries a look: the look, moves, sound and
material always come from the brand. Times below are for the brand's pace (`motion.json`): stretch them ×1.4 for a
calm brand, compress ×0.75 for a fast one. Every recipe works in 16:9, 9:16 and 1:1; the notes say what changes.

Beats name a gesture and the brand cue it carries (`B.cue(s, 'transition' | 'land' | 'text', t)`).

## Launch (20–30 s)

Something new exists; show it and make people want it.

| Beat | Time | What happens |
|---|---|---|
| Hook | 0–2 s | One striking image or line, already moving: the brand's strongest material from the shader set behind the boldest claim. No logo yet. |
| Problem | 2–6 s | The situation the product changes, in the brand's words (IDENTITY.md's Audience). |
| Reveal | 6–9 s | The product appears; a transition from the repertoire, the `land` cue. |
| Proof | 9–20 s | Three moments that show it working, each its own mechanic (not one treatment three times). Facts only from IDENTITY.md's Facts. |
| Close | 20–26 s | The ending from `motion.json` (often the wordmark), the call to action. |

9:16: one idea per screen, type ≥ 60 px for body, keep the bottom 20 % clear of UI.

## Explainer (30–45 s)

How something works, in steps.

| Beat | Time | What happens |
|---|---|---|
| Question | 0–3 s | What this answers, in one line. |
| Steps | 3–33 s | Three or four steps, each 6–9 s: a label (01, 02…), the step shown with real material (the real interface, the real product), a transition between steps. One continuous camera (`travel`) reads best when the brand allows it. |
| Recap | 33–40 s | All steps at once, small, so the whole process is seen. |
| Close | 40–45 s | The ending and the call to action. |

16:9 suits it best; on 9:16 give each step its own screen.

## Social loop (6–10 s, seamless)

A piece that plays forever in a feed.

| Beat | Time | What happens |
|---|---|---|
| Field | whole loop | A shader-set entry with `loop` crossfade (diffuse fields) or a periodic `motion`. |
| Line | 1–5 s | One line of the brand's voice enters with its text behavior, holds, leaves before the end. |
| Seam | last 0.5 s | Everything returns to the first frame's state; check frames 0 and last with `pm still`. |

1:1 and 9:16 first. No call to action on screen; it goes in the caption.

## End card (5–8 s)

The last seconds of any piece, or a sting on its own.

| Beat | Time | What happens |
|---|---|---|
| Reveal | 0–2 s | The wordmark arrives with the repertoire's move (a wipe, a mask, a logo shader like LiquidMetal), the `land` cue. |
| Line | 2–3 s | The brand's one line, small. |
| Action | 3–5 s | Where to go: a URL, a handle, an install command typed with the brand's typing. |
| Hold | to the end | Everything still, a cursor blinking if there is one, so the frame can be read. |

## README loop (6 s, seamless, 1600×900 or 16:9)

For a repository or a landing page hero; silent.

| Beat | Time | What happens |
|---|---|---|
| Field | whole loop | A calm shader-set entry behind the wordmark. |
| Command | 0.4–2 s | The install command types in; holds. |
| Erase | 5–5.5 s | It erases, so the loop closes on an empty prompt. |

Deliver an mp4 and a gif (`--format gif --gif-width 800`).
