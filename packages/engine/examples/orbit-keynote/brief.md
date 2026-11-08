# Orbit · "Meetings find their own time"

A product keynote for an invented app (Orbit, a calendar for teams that schedules meetings by itself), in the smooth After Effects style: one unbroken chain where each element becomes the next, real depth, an inertial camera, kinetic words. 16:9 · 39 s · 60 fps · a voice-over.

## The brand

`brand/` holds Orbit's brand folder: black and white, Space Grotesk + Space Mono, and one slate blue that lives only inside two Paper shaders (Warp, and Dithering in warp shape), so wherever there is blue, something is moving.

## The chain (voice script in `audio/script.txt`; word timings in `audio/words.json`)

| t | said | what happens |
|---|---|---|
| 0–5 s | "Finding a time for six people takes eleven emails." | A chat thread piles up in depth, the camera climbing with it. The pile squashes into one white line; "Eleven emails." rises out of it. |
| 6–9 s | "Orbit is a calendar that schedules meetings for you." | The line rises and widens into Orbit's text field. "Orbit" rises from it and shrinks into the window's title as the window unfolds; the dithered warp leaks out behind. |
| 9–14 s | "Tell it who, and how long." | The prompt types itself; the chips spawn from the typed words; a line from the last chip draws the button; its fill spills out as a band. |
| 14–19 s | "It reads everyone's calendar, finds the gap, and books it." | The band lifts; the chips rise to be the column headers; six calendars draw up from the band in depth. The band becomes a scan line, stops at the free row; the lit cells merge into the booked card. |
| 20–24 s | "Someone drops out? It moves the meeting, and tells the rest." | One chip falls; the card lifts, the scan resumes, the card lands lower; pings reach the others. |
| 25–30 s | "No back and forth. No 'does Tuesday work?'." | The window folds back into the field, into the line. "No back and forth." rises from it; the first bubble returns and is squashed. |
| 32–39 s | "Orbit. Meetings find their own time." | The line curls into a ring filled with the smooth warp; the name and the line land; a "TRY ORBIT" pill. |

## Make it yours

`pamo new my-video --from orbit-keynote` copies the whole folder (scene, brand and timings).

To give it a voice: record `audio/script.txt`, keep or re-align `audio/words.json`, render with `--audio voice.wav`. Without a voice, the piece plays on its crisp sound cues alone.
