# The blind tests that ended paper-motion

Every test of 2026-11-13, as written while they ran. Each pitted a coding agent with paper-motion against the same agent
alone, on made-up brands, with a judge agent that did not know which video was which. Scores are 1–5.

The kits (briefs, answers, logos) and the videos are not in the repository. The lean 0.6 code (render any page,
`frames`, `critique`) is on the branch `lean`, unpublished.

---

## Head-to-head: results (2026-11-13)

How it was run:
- Each run was a separate agent (Opus 5.5) with no shared context, and decided on its own using `answers.md`.
- A third agent judged blind from contact sheets and frames, without seeing any run's folder or the key.
- Key: round 1 x=A y=B · round 2 x=B y=A.

### Quality, blind (1 to 5)

| | motion | type_layout | on_brand | message | finish | average | would post |
|---|---|---|---|---|---|---|---|
| A round 1 | 3 | 4 | 5 | 5 | 4 | 4.2 | yes |
| B round 1 | **4** | 3 | 3 | 4 | 4 | 3.6 | yes, borderline |
| A round 2 | **4** | 4 | 5 | 5 | 4 | 4.4 | yes |
| B round 2 | 3 | 2 | 3 | 3 | 4 | 3.0 | no |
| **A overall** | | | | | | **4.3** | 2/2 |
| **B overall** | | | | | | **3.3** | 1/2 |

**Round 2 consistency with its own round 1:** A 5/5, B 5/5. The judge paired each round 2 with its round 1 correctly.

### Effort

| | A | B |
|---|---|---|
| Total minutes | ~12 | ~16 |
| Renders | 10 | 7 |
| Tool calls | 45 | 76 |
| Tokens | 184k | 249k |

### Result under the README rule

**A wins.** It is 1.0 point higher on quality, posts 2/2 against B's 1/2, takes less time and uses fewer tool calls. Under the rule, we stop features.

### Why, per the judge

- **Where A won:** it wrote scenes made for *this* brief. These are judge descriptions of the videos, not script lines:
  - the notebook full of sums crossed out in red;
  - the clock rolling to 22:00;
  - the WhatsApp chat with the reply "bajo la persiana".
  
  It also used a "menu board" frame (rules, 01/02/03). It scored higher on brand fit, message and layout.
- **Where B won:** motion. Words rise in with motion blur, there's the highlighter, the 3D phone with a whip, and the logo is drawn from its outline. It's the only thing it did better.
- **Where B lost:** paper-motion's structure (plan → blocks) pushed it towards a generic promo shape:
  - Text cards in a row and a phone that's too small at 16:9.
  - In round 2, 3.7 s of a static title and a third of the video on the logo.
  - Its look reads as "a startup promo" rather than a neighbourhood café.

### Limits of the test

- One brief, one judge (an agent), and judging from frames rather than playback.
- Nobody used the studio, so it measures the result, not the experience of deciding.

### Friction in paper-motion that run B reported

- `add a b --set k=v k2=v2`: only the first value applies; the rest are treated as ids (404).
- Every block has a hard-coded black vignette, which looks muddy on a light ground.
- `device-frame`: with a screenshot the same size as the screen, the scroll goes the wrong way.
- `stat-row`: formats numbers as en-US, ignoring the brand's language; the mono labels are tiny.
- `svg-logo`: has no slot for the call-to-action line.
- `inventory --from brand`: turns figures into lines, and ignores images added later.
- `plan`:
  - "problem first" drops the problem;
  - it repeats the logo and the CTA;
  - for 12 s it proposes 17–19 s.
- `chain init --parts`: keeps the demo copy.
- `--no-sfx`: still writes a silent audio track.
- Studio-first without a headless path: there's no CLI command to approve stages.
- llms.txt says 3 steps, the skill says 4.
- `npx skills add`: prints "Done" but exits with code 1.

---

## Second test: paper-motion as a library (2026-11-13)

How it was run:
- The brand is Tierra, a ceramics studio, in `kit-2/`. Material matters, so the shaders had their best terrain.
- **A:** the agent alone. It could use any npm package except paper-motion.
- **C:** the agent writing its own scenes, but able to use the registry as a library: moves, backgrounds (shaders), palettes and font pairs. No piece, plan, chain, blocks or studio.
- The judge was blind. Key: round 1 x=C y=A · round 2 x=A y=C.

### Quality, blind (1 to 5)

| | motion | material | type | brand | message | finish | average | would post |
|---|---|---|---|---|---|---|---|---|
| A round 1 | 4 | 4 | 4 | 4 | 5 | 3 | 4.0 | yes |
| C round 1 | 2 | 2 | 4 | 3 | 4 | 3 | 3.0 | no |
| A round 2 | 3 | 3 | 4 | 4 | 5 | 3 | 3.7 | yes |
| C round 2 | 3 | 2 | 4 | 3 | 4 | 4 | 3.3 | no |
| **A overall** | | | | | | | **3.8** | 2/2 |
| **C overall** | | | | | | | **3.2** | 0/2 |

**Round 2 consistency with round 1:** A 5/5, C 4/5.

### Effort

| | A | C |
|---|---|---|
| Total minutes | ~25 | ~37 (14 of them rendering with motion blur) |
| Tool calls | 61 | 69 |
| Tokens | 220k | 236k |

### Result

**A wins again, now by 0.6 and 2/2 against 0/2**, and on paper-motion's best terrain: material.

What the judge said about C:
- the `smoke-ring` reads as a "static donut vignette", "stock-looking";
- the vessels read as "aluminium", not clay;
- the motion is "opacity, blur and scale tweens on a locked frame".

C itself reported that the moves are "thin tweens". What was worth something was the runtime (deterministic render) and SmokeRing, and everything with craft it wrote itself.

### Friction reported by C

- `pamo add a b c` installs everything and then exits 1 with no message.
- The background `usage` assumes `loadBrand()` and a `brand/` folder. There's no snippet for using a shader on its own.
- That the scene has to live inside the cwd to serve `/moves` and `/assets` is only explained in a comment in the source.
- Text moves have no "out" half, and they compete for `el.style.opacity`.
- Render is slow: ~0.7 s per frame at 1080p with 5 WebGL layers and motion blur.

---

## Third test: a separate critic (2026-11-13)

How it was run:
- The brief is Tierra again (`kit-2/`).
- D0 is the agent alone, like A. A blind critic agent then gave it 12 notes (at most 6 per video). D1 is D0 after one revision (14 min).
- The judge was blind and compared three versions per round: A from the second test, D0 and D1.
- Key: round 1 p=A r=D0 q=D1 · round 2 r=A p=D0 q=D1.

| | round 1 | round 2 | average | would post |
|---|---|---|---|---|
| A (alone, second test) | 3.3 | 3.5 | 3.4 | 1.5/2 |
| D0 (alone, before the critic) | 3.8 | 3.0 | 3.4 | 1/2 |
| **D1 (after one critic pass)** | **4.2** | **4.0** | **4.1** | **2/2** |

The averages are over the 6 criteria (motion, material, type, brand, message, finish).

### Result

- **The critic improves by ~0.7**, and D1 was first in both rounds.
- The two versions without a critic (A and D0) tie, which shows that the gain comes from the critic and not from the run.
- **Cost:** ~3 min of critic plus ~14 min of revision.

### Note on the judge's noise

The same A videos scored 3.8 under the second test's judge and 3.4 under this one. The noise is around ±0.4, so the 0.7 gain is real but moderate (one brief, one pass).

---

## Fourth test: the critic on Mostrador (2026-11-13)

How it was run:
- The brief is Mostrador again (`kit/`), which is closer to real use: product, UI, message.
- D0 is the agent alone; a blind critic gave it 12 notes; D1 is D0 after one revision (10 min). The A videos come from the first test.
- Key: round 1 q=A r=D0 p=D1 · round 2 r=A q=D0 p=D1.

| | round 1 | round 2 | average | would post |
|---|---|---|---|---|
| A (alone, first test) | 4.0 | 4.0 | 4.0 | 2/2 |
| D0 (alone, before the critic) | 3.8 | 3.6 | 3.7 | 0/2 |
| **D1 (after one critic pass)** | **4.4** | 3.8 | **4.1** | **2/2** |

Each round's score is the average of the 5 criteria.

### Result

- **The critic improves its own run: +0.4, and from 0/2 to 2/2 posted.** In Tierra it was +0.7, from 1/2 to 2/2.
- **Against a good run without a critic (A), it ties** (4.1 vs 4.0, inside the judge's noise).
- So the critic **raises the floor** (it turns an unpostable run into a postable one) more than it raises the ceiling.
- What the judge still found in D1:
  - the summary inside the phone in round 2 is ~18 px, unreadable;
  - the bottom third of round 2 is empty.
  
  A second critic pass would probably catch these.

### The four tests together

1. paper-motion as a pipeline: it loses (3.3 vs 4.3).
2. paper-motion as a library: it loses (3.2 vs 3.8).
3. The critic on Tierra: it wins (4.1 vs 3.4 / 3.4).
4. The critic on Mostrador: it improves its own run (3.7 → 4.1) and ties with the best run without a critic (4.0).

---

## Phase 5: lean 0.6 vs the agent alone (2026-11-13)

How it was run:
- **Arms:** two briefs, Mostrador (`kit/`) and Pila (`kit-3/`, an invoicing app, new).
  - **A:** the agent alone.
  - **L:** the agent with paper-motion 0.6 (local tarball, the `make-video` skill in the project). L's critic was a fresh subagent launched by the person running the test, with `.critique/<n>/PROMPT.md`, as a main agent would.
- **Judging:** one blind judge per brief.
- **Keys:** Mostrador round 1 x=L y=A, round 2 x=A y=L · Pila round 1 x=A y=L, round 2 x=A y=L.

| Brief | A (alone) | L (lean) | Difference | Would post A / L |
|---|---|---|---|---|
| Mostrador | 3.8 (3.8 · 3.8) | 3.8 (3.8 · 3.8) | 0.0 | 2/2 · 2/2 |
| Pila | 3.6 (3.8 · 3.4) | 4.1 (4.0 · 4.2) | +0.5 | 2/2 · 2/2 |
| **Average** | **3.7** | **3.95** | **+0.25** | 4/4 · 4/4 |

Each round's score is the average of the 5 criteria. Consistency was 5/5 for both arms on both briefs.

**What the judges said:**
- **Mostrador:** "x is the more alive" (L: camera, depth), but with crops in the push-ins; A is cleaner and flatter. A slight L win in round 1, a slight A win in round 2.
- **Pila:** L won both rounds clearly: "the stronger director's hand", Factura E correct, and the numbers add up. A shipped "Factura C" to an overseas client.

**Effort:**
- A took 7–9 min per brief.
- L took ~21–37 min, including ~3 min of waiting per critic.

### Result under the rule (≥ 0.3 and posts at least as many)

**+0.25: it doesn't reach the threshold. Under the rule, it isn't published.**

L never lost a round (2 ties, 2 wins), but the margin falls within the judge's noise (±0.4 per run, ~±0.3 averaging two briefs).

### Friction in 0.6 seen in the test (to fix before any retest)

1. The skill doesn't say that the render serves the **current folder** (the agents read `bin/pamo.mjs` to find out).
2. **Logos with SVG text in system fonts:** the critic sees them in another font and raises a false alarm.
3. **Logos with artwork off-centre in their own box:** "place it whole" leaves it misaligned. The skill should say to centre it by its visual box.
4. `pamo new` comes with a palette and font that have nothing to do with the brief.
5. The progress lines from `render` are noisy when the output is piped.

---

## Retest after the fixes: Turnito (2026-11-13)

How it was run:
- **Brief:** a new one, Turnito (`kit-4/`, appointments for barbershops).
- **Arms and judging:** the same protocol as phase 5, with 0.6 including the friction fixes (commit `9eced1c`).
- **Key:** round 1 x=L y=A · round 2 x=A y=L.

| Arm | Round 1 | Round 2 | Average | Would post |
|---|---|---|---|---|
| A (alone) | 4.4 | 3.4 | 3.9 | 1/2 |
| L (lean) | 3.8 | 3.8 | 3.8 | 2/2 |

Each round's score is the average of the 5 criteria.

**What the judge said:**
- **A won round 1 clearly:** "Cortala." with the scissor slice, cheeky copy, numbered chapters.
- **L won round 2 clearly:** the full cause and effect, a camera that moves, the safe zones. Its title, though, is cut off at the right edge.
- **A's round 2 doesn't post:** it puts text under the Instagram bars, has bugs in the waiting list and a dead beat.

### Decision rule over the three briefs (≥ 0.3 and posts at least as many)

| Brief | A | L | L − A |
|---|---|---|---|
| Mostrador | 3.8 | 3.8 | 0.0 |
| Pila | 3.6 | 4.1 | +0.5 |
| Turnito | 3.9 | 3.8 | −0.1 |
| **Average** | **3.77** | **3.90** | **+0.13** |

**Would post:** L 6/6, A 5/6.

**Result: +0.13, under the 0.3. Under the rule, 0.6 isn't published.**

### What the six runs show

- **What the critic loop does reliably:** it raises the floor. L never delivered an unpostable video (6/6); A did once.
- **What it doesn't do:** beat a good run of the agent alone on quality. Across briefs it comes out level: one win, one tie, one loss.
- **The cost:** L takes ~3× longer.
