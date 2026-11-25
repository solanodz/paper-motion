---
title: Map route
summary: A ship sails a dotted route across a tilted parchment map, the camera following it from stop to stop.
format: "16:9"
duration: 12
techniques: [maps, route draw, 3D tilt, camera follow, vintage texture]
bring:
  - Nothing. World coastlines come from Natural Earth (public domain) through the npm package world-atlas.
  - Headless Chrome and ffmpeg on the machine.
variables:
  - key: stops
    label: The stops, in order (split by →)
    default: "Lisbon → Canary Islands → Dakar → Cape Town → Zanzibar"
  - key: vehicle
    label: What travels
    default: a small sailing ship
  - key: title
    label: Title
    default: The long way round
runs:
  tried: 1
  passed: 1
  model: claude-opus-5-5
  agent: Claude Code, a fresh subagent given only this prompt
  date: 2026-11-15
  minutes: 41
  note: 'Two director''s passes with fresh blind critics, both "needs rework"; brass tacks instead of map-app pins, hand-inked stop marks, bigger labels, stops that read as stops. The run paused once on a network error and resumed.'
credits:
  - asset: Coastlines
    by: Natural Earth, via world-atlas
    license: public domain
---

## Prompt

```text
Make a 12 s travel-map animation, 1920×1080, 60 fps, rendered from code (a
canvas or WebGL page where every frame is a pure function of time,
captured with headless Chrome and encoded with ffmpeg). Install
world-atlas and topojson-client (and d3-geo if you want it) from npm for
the coastlines; nothing else.

THE LOOK (a vintage chart; check these on your stills)
- The world map on parchment: warm paper (#E8DCC4) with soft stains and
  fibre texture, land a shade darker with a thin brown coastline and a
  faint inner shading along the coasts, sea lighter with very faint
  engraved wave lines. No modern UI.
- The map lies in 3D, tilted back ~35° with real perspective, so the far
  edge is smaller and a little hazier.
- The route: a dotted line (dots 6 px, gaps 10 px, dark brown) through
  {{stops}}, staying at sea: add offshore waypoints so it never crosses
  land, and smooth it into gentle curves.
- {{vehicle}}, drawn as a small detailed side-view icon, travels along the
  route, rocking gently and turning to follow the curve.
- Each stop: a pin that drops in with a bounce and a label in a serif
  (small caps, dark brown) with a thin leader line.

TIMING (exact)
1. 0.0–1.5 s: the camera starts high over the whole region; the title
   "{{title}}" is set huge across the middle (white, heavy sans, soft
   shadow), then lifts and fades as the camera descends.
2. 1.5–10.0 s: the route draws behind the vehicle as it travels from stop
   to stop, the dotted line growing from its stern. The camera follows
   the vehicle closely (it stays a little ahead of centre), easing in at
   each stop (a 0.3 s pause while the pin drops) and out again.
3. 10.0–12.0 s, the close: the camera pulls back to show the whole route;
   all pins visible; a small cartouche in a corner shows the total
   distance (computed from the route) and the number of stops. Hold.

CHECKS (required)
- A contact sheet: 0.5, 1.5, 3, 4.5, 6, 7.5, 9, 10.5, 11.8. Look at it.
- Is the coastline real and recognisable? Does the route stay at sea? Does
  the camera follow smoothly? Is the distance right, and the ending held?
- Deliver the mp4 and the contact sheet.
```

## Failure modes

- **The route crosses land.** Ask for offshore waypoints and a check that no segment intersects a land polygon.
- **A flat, top-down map.** Ask for the 35° perspective tilt with haze on the far edge.
- **A clean vector map.** Ask for the parchment texture, stains and engraved sea lines.

## Notes

What the run built, which is what to copy: the map is a WebGL plane in true perspective with the route, ship, pins and labels on a canvas above it; the route was checked against the 10m coastline (0 of 4,001 samples on land); the dots keep fixed map positions so they never crawl, spaced by direction so north–south stretches aren't squashed.

What the agent had to decide for itself:
- Pins sit on the real cities while the ship anchors at offshore harbour points, so the route never touches land.
- "Canary Islands" has no single point; its pin is on Las Palmas.
- The cartouche counts all five places, including the start.

Inspired by a common After Effects exercise, a travel map with an animated route. Coastlines are Natural Earth's, in the public domain.
