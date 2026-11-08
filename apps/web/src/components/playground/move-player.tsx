"use client";

import { forwardRef, useEffect, useImperativeHandle, useRef } from "react";

type Demos = {
  mount: (name: string, stage: HTMLElement, s: { update: (fn: (t: number) => void) => void }) => void;
  setParams: (v: Record<string, unknown>) => void;
  has: (name: string) => boolean;
};
export type PlayerHandle = { seek: (t: number) => void };

const W = 1920, H = 1080, D = 5;
let demos: Promise<Demos> | null = null;
const loadDemos = () => {
  if (!document.querySelector('link[data-pm-play]')) {
    const link = Object.assign(document.createElement("link"), { rel: "stylesheet", href: "/play/demo.css" });
    link.setAttribute("data-pm-play", "");
    document.head.append(link);
  }
  demos ??= import(/* webpackIgnore: true */ /* turbopackIgnore: true */ "/play/demos.js" as string) as Promise<Demos>;
  return demos;
};

/**
 * A move's demo, live: mounted on a 1920×1080 stage scaled to fit, driven by its own clock (never a render scene).
 * Params apply on the next frame; `remountKey` changes (seed, text…) mount it fresh.
 */
export const MovePlayer = forwardRef<PlayerHandle, {
  id: string;
  values: Record<string, unknown>;
  playing: boolean;
  speed: number;
  remountKey: string;
  theme?: Record<string, string> | null;
  onTime?: (t: number) => void;
}>(function MovePlayer({ id, values, playing, speed, remountKey, theme, onTime }, ref) {
  const host = useRef<HTMLDivElement>(null);
  const state = useRef({ t: 0, updaters: [] as ((t: number) => void)[], mod: null as Demos | null, playing, speed, values, onTime });
  state.current.playing = playing;
  state.current.speed = speed;
  state.current.values = values;
  state.current.onTime = onTime;

  const draw = () => {
    const st = state.current;
    st.mod?.setParams(st.values);
    for (const fn of st.updaters) fn(st.t);
  };

  useImperativeHandle(ref, () => ({ seek: (t: number) => { state.current.t = Math.max(0, Math.min(D - 0.001, t)); draw(); state.current.onTime?.(state.current.t); } }), []);

  // mount (again when structural params change)
  useEffect(() => {
    const el = host.current;
    if (!el) return;
    let alive = true, raf = 0, last = performance.now();
    const stage = document.createElement("div");
    stage.className = "pm-play";
    Object.assign(stage.style, { position: "absolute", left: "0", top: "0", width: `${W}px`, height: `${H}px`, transformOrigin: "0 0" });
    for (const [k, v] of Object.entries(theme ?? {})) stage.style.setProperty(k, v);
    el.replaceChildren(stage);
    const st = state.current;
    st.updaters = [];
    const fit = () => { stage.style.transform = `scale(${el.clientWidth / W})`; };
    const ro = new ResizeObserver(fit);
    loadDemos().then(async (mod) => {
      if (!alive) return;
      st.mod = mod;
      mod.setParams(st.values);
      const themed = [theme?.["--pm-display"], theme?.["--pm-mono"]].filter(Boolean).map((f) => `400 100px ${f}`);
      // wait a little for a kit font to arrive (its stylesheet loads in parallel), so text moves measure the real letters
      await Promise.race([Promise.all(["400 100px GSerif", "400 40px GMono", "500 40px GMono", "400 100px GPixel", ...themed].map((f) => document.fonts.load(f).catch(() => {}))), new Promise((r) => setTimeout(r, 1500))]);
      if (!alive) return;
      mod.mount(id, stage, { update: (fn) => st.updaters.push(fn) });
      draw(); // first frame at full size: some text moves measure their letters here
      fit();
      ro.observe(el);
      const tick = (now: number) => {
        const dt = Math.min(0.1, (now - last) / 1000);
        last = now;
        if (st.playing) { st.t = (st.t + dt * st.speed) % D; draw(); st.onTime?.(st.t); }
        raf = requestAnimationFrame(tick);
      };
      raf = requestAnimationFrame(tick);
    });
    return () => { alive = false; cancelAnimationFrame(raf); ro.disconnect(); el.replaceChildren(); };
  }, [id, remountKey, JSON.stringify(theme ?? null)]);

  // live params: redraw the current frame when paused
  useEffect(() => { if (!state.current.playing) draw(); }, [values]);

  return <div ref={host} className="relative h-full w-full overflow-hidden bg-black" />;
});

export const DURATION = D;
