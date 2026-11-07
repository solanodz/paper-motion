---
name: interview
description: Find out what the user wants by interviewing them in rounds of numbered questions, each with a recommended answer, showing lettered option boards for visual choices. Use when a paper-motion skill needs the user's decisions (identity, visual system, motion style, sound kit, a piece's brief), or when the user asks to be asked or helped to decide.
---

# Interview

Work a **design tree**: every decision branches into the decisions that hang off it. The calling skill brings the **question bank** (what to settle, its file in `brand/`, and the depth); this skill is how you ask. The mechanics come from Matt Pocock's `grilling`, adapted to choices people make with their eyes.

`pm` below is the paper-motion engine CLI: `npx @paper-motion/engine` (inside the paper-motion repo itself: `node packages/engine/bin/pm.mjs`). Run it from the user's project root, so `brand/...` paths resolve.

## 1 · Prepare

1. Read the brand folder (`brand/`). What is already written there is **given**: build on it, never ask it again, and leave it in its own file. A short pointer is fine ("lowercase, per IDENTITY.md · Voice"); a copy is not. Givens are never logged again, even when their own file has no log entries. Files may be partial or older than the current templates: use whatever sections exist.
2. Do the legwork. Facts are yours to find: the user's website, files they mention, `brand/assets/`, anything brought on an import start. Write every decision that material settles (step 4) before the first round. When there is no material and some would help (a site, a logo, photos, a menu), make "share anything you already have" one optional question of round 1.
3. Find the calling skill's file and sections. If the caller defines none, use `brand/<TOPIC>.md` with one section per question-bank item. Open items wait there under `## Open` until settled.
4. Speak the user's language from the first line.

Done when every decision you could find is written and the open ones sit under `## Open`.

## 2 · Ask in rounds

The **frontier** is every open decision whose prerequisites are settled. Ask the whole frontier in one round, numbered, then wait. The frontier decides the order; a calling skill's list of topics is its question bank grouped by dependency, never a schedule to pad. A question whose answer depends on another question still open belongs to a later round. When a recommendation only *softly* depends on an open question, ask it now with a conditional recommendation ("C; if you pick B in Q1, I'd go with recta").

Open round 1 with what you took as given (two lines, up to four when material settled a lot) and what waits for a later round and why. Then:

```
❓ **Q1** - **<title>**: <the question, worded so "yes" accepts the recommendation>
- A · <name>: <one line>
- B · <name>: <one line>
Board: `brand/.interview/<topic>.png`

➡️ <recommended letter or answer>, <one line of why, from this brand>

---

❓ **Q2** - ...
```

Keep the option list for any multiple-choice question; add the board line only for visual choices. Several small positions on one topic (a set of sliders) form one question the user can accept as a block ("yes to all") or adjust item by item.

- A question of fact ("do you have a logo?") is asked plainly, with the likely answer as the recommendation.
- Plain words for someone who has never done motion. Define an unavoidable term once, in parentheses, at its first use in the round. Designers can answer in their own vocabulary; take it as given.
- Open-ended questions (references, words they love) still carry a recommendation: a short starting set you propose, clearly marked as a suggestion, with an invitation to swap in their own.
- After the user answers, mirror back in two to four lines what is now settled, write it (step 4), recompute the frontier, and ask the next round.

The calling skill sets the depth (identity three to four rounds, most others one or two). Depth is a ceiling, never a quota: stop as soon as the frontier is empty. An import start usually needs one or two rounds.

## 3 · Show visual choices as option boards

When a choice is about how something **looks** or **moves**, the user picks from a board, never from a description.

**Build the options.** One scene per option in `brand/.interview/<topic>/a.html`, `b.html`, …, all in the same format.
- **Form** (typefaces, palette, shape, layout): a still scene; `pm new a --dir brand/.interview/<topic> --still` starts one (1600×900, 3 s, reads `brand/tokens.json` when it exists, neutral stand-ins otherwise; `organicPath()` draws organic shapes). Board with `--t 1`; type and wordmark boards add `--cols 1` so text shows at real size.
- **Motion** (pace, camera, moves, text behavior, how color enters): a moving scene; board with `--clip 4` (writes `.mp4`).
- Load fonts with an `@font-face` or a Google Fonts `<link>`, then `await document.fonts.load('<weight> <size>px <family>')` for every face before `await s.start()`; otherwise the still renders in a fallback face.

**Hold everything else equal.** The options differ only in the dimension being asked.
- Same words, same layout, same timing in every option.
- Dimensions already settled: use the settled choice.
- Dimensions still open: use a **neutral stand-in**, a system sans and greys (`#f2f2f2`, `#8a8a8a`, `#1a1a1a`), never your own recommendation, so one board never pre-sells another question.

**Use the brand's own words.** Take copy from the brand folder and the user's material. Where none exists, write filler of the right kind and length in the brand's voice. Facts stay real: never invent hours, prices, addresses, names or claims.

**Board.** `pm board a.html b.html c.html --t 1 --labels "A · <name>: <specifics>|B · ..." --out brand/.interview/<topic>.png` (labels split on `|`). Two to four options; three sit in one row unless `--cols` says otherwise. Labels are short, in the user's language, with the defining specifics (font names, the core hex codes); anything longer goes in the question. One option is your recommendation.

**Check it before showing.** Read the board yourself and rebuild any option that fails:
- the options read as different at a glance;
- every text is legible at board scale;
- the intended font loaded, no fallback;
- nothing clipped, overlapping or broken (stray points in shapes, cut-off lines).

**Show it.** Attach or open the file if you can display files; otherwise give the path. The user answers with a letter, or a letter plus a change ("B, but warmer").

`brand/.interview/` is throwaway: keep it until the interview closes.

## 4 · Record every decision as it settles

Write each decision the moment it settles, in two places:

1. **The calling skill's file**, in its section, removing it from `## Open`. Write a partly settled section now with what is settled, and keep the rest under `## Open`. Sections not asked yet stay empty and listed under `## Open`. Provenance (`By:`) lives only in the log.
2. **The decision log**: one file per decision in `brand/decisions/`, numbered (scan for the highest number and add one, e.g. `0007-type-pairing.md`):

```md
# <the decision, in a few words>

- **Decided:** <the choice>
- **Why:** <one or two lines: what about this brand led here>
- **By:** user | agent ("decide for me") | source (<file or URL it came from>)
- **Skill:** <calling skill> · <YYYY-MM-DD>
```

Givens from other brand files are not re-logged: they already have their own entries.

**"Decide for me."** When the user hands you a question, a round, or everything ("you choose", "the one you recommend", "whatever you think"), apply your recommendations, log each with `By: agent`, and carry on. Tell them every agent decision is in `brand/decisions/` to revisit any time.

## 5 · Close

The interview is done when the frontier is empty: every branch of the question bank is settled or explicitly parked by the user ("later", left under `## Open`), and every settled decision is in the brand folder and the log. Then list this interview's decisions in one short summary (the calling skill may add a board of the whole result) and ask the user to confirm it. Confirmation releases the calling skill's final outputs (rendered files, data files); a "no" or a change reopens those branches as a new round. Then suggest adding `brand/.interview/` to `.gitignore`.
