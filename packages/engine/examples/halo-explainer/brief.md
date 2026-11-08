# Halo · "Keep the sun after dark"

An explainer for an invented brand (Halo, a home battery), in the smooth After Effects style: 3D depth, an inertial camera, morphs, kinetic words. 16:9 · 36 s · 60 fps · a voice-over.

## The brand

`brand/` holds Halo's brand folder:
- the identity, light tokens (linen, ink, a soft sun) and Inter Tight + Inter;
- a shader set of real Paper shaders: the sun is a Dithering sphere over a StaticRadialGradient; the energy is Dithering warp and ripple;
- motion and sound.

## The story (voice script in `audio/script.txt`; word timings in `audio/words.json`)

| t | beat | what moves |
|---|---|---|
| 0–6 s | problem | The sun is born with rings, travels its day and draws the production curve. At noon it pulses and bursts rays, and the energy spreads from it. The night curve rises and stars come out. |
| 6–10 s | Halo | The energy peels off as particles and pours into Halo while its outline draws. Halo fills to 100 % and pulses. |
| 10 s | dive | The camera dives into Halo's charge and comes out through the sun on a color flash. |
| 11–14 s | step 1 | The panel flips into place, its cells popping in a wave. The beam fires photons and the cells light up. |
| 14–20 s | step 2 | A particle stream arcs to Halo with the camera following. Halo flips in and fills to 62 %, and grows a suitcase handle. |
| 21–26 s | step 3 | Night falls and the camera looks up at the moon. The home builds itself and its windows light from Halo. |
| 27–31 s | result | "Lower bills." The camera pulls back to the street; in the blackout the neighbors go dark and the Halo home stays lit. |
| 31–36 s | end | Day returns and the camera flies back to the sun. "Halo" slides out of it, then "Keep the sun after dark." |

## Make it yours

`pamo new my-video --from halo-explainer` copies the whole folder (scene, brand and timings).

To give it a voice:
1. Record `audio/script.txt` with any TTS or your own voice.
2. Re-align `audio/words.json`, or keep the timings.
3. Render with `--audio voice.wav`.

Without a voice, the piece plays on its soft sound cues alone.
