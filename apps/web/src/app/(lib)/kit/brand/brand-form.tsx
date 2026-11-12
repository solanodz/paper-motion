"use client";

import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { kit, kitTheme } from "@/lib/kit";
import { ColorField, FontPicker } from "@/components/playground/controls";
import { MovePlayer } from "@/components/playground/move-player";
import { IconArrow } from "@/components/icons";

const gf = (family: string) => `https://fonts.googleapis.com/css2?family=${family.replace(/ /g, "+")}&display=swap`;
const lum = (h: string) => { const n = parseInt(h.slice(1, 7), 16); return ((n >> 16 & 255) * 0.299 + (n >> 8 & 255) * 0.587 + (n & 255) * 0.114) / 255; };
const mixHex = (a: string, b: string, t: number) => {
  const p = (h: string) => [1, 3, 5].map((i) => parseInt(h.slice(i, i + 2), 16));
  const x = p(a), y = p(b);
  return `#${x.map((v, i) => Math.round(v + (y[i] - v) * t).toString(16).padStart(2, "0")).join("")}`;
};

// a row of the form: a narrow label and its control
const ROW = "row sm:grid-cols-[132px_minmax(0,1fr)] 2xl:grid-cols-[180px_minmax(0,1fr)]";
// the shared color field, with a square swatch as tall as its inputs
const SQUARE = "max-w-[420px] [&_input]:h-9 [&_input[type=color]]:w-9 [&_input[type=color]]:p-0";

/** "I have a brand": paste your colors, pick your fonts, see motion in them; it becomes your kit's palette and font pair. */
export function BrandForm() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [ground, setGround] = useState("#0E0E0E");
  const [figure, setFigure] = useState("#F5F2EA");
  const [accent, setAccent] = useState("#FF5B2E");
  const [display, setDisplay] = useState("Instrument Serif");
  const [text, setText] = useState("Inter");
  const [mono, setMono] = useState("JetBrains Mono");
  // start from what the kit already has (after hydration: the kit lives in this browser)
  useEffect(() => {
    const k = kit.get(), { palette, font } = kitTheme(k);
    if (k.name) setName(k.name);
    const pv = palette?.values as Record<string, string> | undefined, fv = font?.values as Record<string, string> | undefined;
    if (pv?.ground) setGround(pv.ground); if (pv?.figure) setFigure(pv.figure); if (pv?.accent) setAccent(pv.accent);
    if (fv?.display) setDisplay(fv.display); if (fv?.text) setText(fv.text); if (fv?.mono) setMono(fv.mono);
  }, []);

  const derived = useMemo(() => {
    const muted = mixHex(figure.slice(0, 7), ground.slice(0, 7), 0.45), surface = mixHex(ground.slice(0, 7), figure.slice(0, 7), 0.06);
    const ramp = [ground, mixHex(ground.slice(0, 7), accent.slice(0, 7), 0.33), mixHex(ground.slice(0, 7), accent.slice(0, 7), 0.66), accent];
    return { muted, surface, ramp, dark: lum(ground) < 0.5 };
  }, [ground, figure, accent]);
  const theme = { "--pm-g": ground, "--pm-f": figure, "--pm-m": derived.muted, "--pm-s": derived.surface, "--pm-a": accent, "--pm-l": `color-mix(in oklab, ${figure} 16%, ${ground})`, "--pm-display": `'${display}'`, "--pm-mono": `'${mono}'` };

  const save = () => {
    const k = kit.get();
    const items = k.items.filter((i) => i.type !== "palette" && i.type !== "font-pair");
    items.unshift(
      { id: derived.dark ? "graphite" : "mono-light", type: "palette", title: `${name || "My brand"} colors`, values: { ground, figure, muted: derived.muted, surface: derived.surface, accent, ramp: derived.ramp } },
      { id: "inter-tight", type: "font-pair", title: `${name || "My brand"} type`, values: { display, text, mono } },
    );
    kit.set({ name, items });
    router.push("/kit");
  };

  return (
    <div className="-mx-5 border-t border-line md:-mx-10 xl:grid xl:grid-cols-[minmax(0,1fr)_minmax(0,46%)]">
      <div className="px-5 pb-16 md:px-10 xl:pb-28">
        <div className="rows border-t-0">
          <label className={ROW}>
            <span className="text-[14px] sm:pt-3">Brand name</span>
            <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Kiln" className="field font-serif text-[28px] leading-tight tracking-[-0.01em]" />
          </label>
        </div>

        <h2 id="brand-colors" className="pb-4 pt-10 font-serif text-[30px] leading-none tracking-[-0.02em]">Colors</h2>
        <div role="group" aria-labelledby="brand-colors" className="rows">
          {[["Background", ground, setGround], ["Text", figure, setFigure], ["Accent", accent, setAccent]].map(([l, v, set]) => (
            <div key={l as string} className={`${ROW} items-center`}>
              <div className="text-[14px]">{l as string}</div>
              <div className={SQUARE}><ColorField value={v as string} onChange={set as (x: string) => void} /></div>
            </div>
          ))}
          <div className={`${ROW} items-center`}>
            <div className="text-[14px]">From those</div>
            <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
              <span className="flex">
                {[derived.muted, derived.surface, ...derived.ramp.slice(1, 3)].map((c, i) => <span key={i} className="-ml-px h-9 w-9 border border-rule first:ml-0" style={{ background: c }} title={c} />)}
              </span>
              <span className="text-[13px] text-muted">Muted, surface and a ramp.</span>
            </div>
          </div>
        </div>

        <h2 id="brand-fonts" className="pb-4 pt-12 font-serif text-[30px] leading-none tracking-[-0.02em]">Fonts</h2>
        <div role="group" aria-labelledby="brand-fonts" className="rows">
          {[["Headlines", display, setDisplay, "display"], ["Body", text, setText, "text"], ["Labels and code", mono, setMono, "mono"]].map(([l, v, set, role]) => (
            <div key={l as string} className={`${ROW} items-center`}>
              <div className="text-[14px]">{l as string}</div>
              <div className="max-w-[420px] [&>div>button]:min-h-9"><FontPicker value={v as string} onChange={set as (x: string) => void} role={role as string} /></div>
            </div>
          ))}
        </div>
        <p className="mt-4 max-w-[60ch] text-[13px] leading-relaxed text-muted">Using a licensed font? Pick the closest one here; your agent will use your files from brand/assets/fonts/.</p>

        <button type="button" onClick={save} className="btn btn-primary mt-10 h-[54px] w-full max-w-[420px] justify-between px-[18px] text-[15px]">
          Use my brand <IconArrow size={16} />
        </button>
      </div>

      <div className="border-t border-line px-5 pb-24 pt-8 md:px-10 xl:sticky xl:top-[52px] xl:h-[calc(100vh-52px)] xl:self-start xl:overflow-y-auto xl:border-l xl:border-t-0 xl:px-6 xl:pb-10">
        {[display, text, mono].map((f) => (
          // eslint-disable-next-line @next/next/no-page-custom-font
          <link key={f} rel="stylesheet" href={gf(f)} />
        ))}
        <div className="corner-marks border border-line">
          <div className="aspect-video overflow-hidden"><MovePlayer id="magic-move" values={{}} playing speed={1} remountKey={`${display}|${mono}`} theme={theme} /></div>
        </div>
        <div className="mt-6 border border-line p-6" style={{ background: ground }}>
          <div className="text-[clamp(32px,4vw,56px)] leading-[0.95] tracking-[-0.02em]" style={{ fontFamily: `'${display}'`, color: figure }}>{name || "Your brand"}, moving.</div>
          <p className="mt-3 text-[15px]" style={{ fontFamily: `'${text}'`, color: derived.muted }}>This is your body text on your background, with <span style={{ color: accent }}>one accent</span>.</p>
          <p className="mt-3 break-words text-[12px]" style={{ fontFamily: `'${mono}'`, color: derived.muted }}>$ npx paper-motion add magic-move</p>
        </div>
      </div>
    </div>
  );
}
