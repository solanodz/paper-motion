"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { kit, kitTheme } from "@/lib/kit";
import { ColorField, FontPicker } from "@/components/playground/controls";
import { MovePlayer } from "@/components/playground/move-player";
import { IconArrow, IconBrand, IconCheck } from "@/components/icons";

const gf = (family: string) => `https://fonts.googleapis.com/css2?family=${family.replace(/ /g, "+")}&display=swap`;
const lum = (h: string) => { const n = parseInt(h.slice(1, 7), 16); return ((n >> 16 & 255) * 0.299 + (n >> 8 & 255) * 0.587 + (n & 255) * 0.114) / 255; };
const mixHex = (a: string, b: string, t: number) => {
  const p = (h: string) => [1, 3, 5].map((i) => parseInt(h.slice(i, i + 2), 16));
  const x = p(a), y = p(b);
  return `#${x.map((v, i) => Math.round(v + (y[i] - v) * t).toString(16).padStart(2, "0")).join("")}`;
};

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
    router.push("/library?type=component");
  };

  return (
    <div className="mx-auto max-w-[1180px] px-5 pb-24 pt-12 md:px-8">
      <div className="mb-10 flex items-center justify-between">
        <span className="flex items-center gap-2 text-[13.5px] text-muted"><IconBrand size={16} className="text-paper" /> I have a brand</span>
        <Link href="/start" className="text-[13px] text-muted hover:text-figure">No brand yet? Take the quiz →</Link>
      </div>
      <h1 className="font-serif text-[40px] leading-[1.02] tracking-[-0.02em] md:text-[60px]">Bring your colors and fonts.</h1>
      <p className="mt-3 max-w-[62ch] text-[16px] text-muted">Every live preview in the library switches to your brand, so you choose motion that already fits. Have a brand manual or a website? Your agent can read it later; start with the basics here.</p>

      <div className="mt-10 grid gap-8 lg:grid-cols-[360px_minmax(0,1fr)]">
        <div className="flex flex-col gap-6">
          <label className="block">
            <span className="text-[13px] text-muted">Brand name</span>
            <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Kiln" className="mt-2 w-full rounded-md border border-line bg-surface px-3 py-2 text-[15px] text-figure outline-none placeholder:text-faint focus:border-faint" />
          </label>
          <fieldset className="flex flex-col gap-4">
            <legend className="mb-3 text-[14px] font-medium">Colors</legend>
            {[["Background", ground, setGround], ["Text", figure, setFigure], ["Accent", accent, setAccent]].map(([l, v, set]) => (
              <div key={l as string}><div className="mb-1.5 text-[12.5px] text-muted">{l as string}</div><ColorField value={v as string} onChange={set as (x: string) => void} /></div>
            ))}
            <div className="flex items-center gap-2 text-[12px] text-faint">
              <span>From those:</span>
              {[derived.muted, derived.surface, ...derived.ramp.slice(1, 3)].map((c, i) => <span key={i} className="h-4 w-4 rounded-sm border border-line" style={{ background: c }} title={c} />)}
              <span>muted, surface and a ramp</span>
            </div>
          </fieldset>
          <fieldset className="flex flex-col gap-4">
            <legend className="mb-3 text-[14px] font-medium">Fonts</legend>
            {[["Headlines", display, setDisplay, "display"], ["Body", text, setText, "text"], ["Labels and code", mono, setMono, "mono"]].map(([l, v, set, role]) => (
              <div key={l as string}><div className="mb-1.5 text-[12.5px] text-muted">{l as string}</div><FontPicker value={v as string} onChange={set as (x: string) => void} role={role as string} /></div>
            ))}
            <p className="text-[12px] leading-relaxed text-faint">Using a licensed font? Pick the closest one here; your agent will use your files from brand/assets/fonts/.</p>
          </fieldset>
          <button type="button" onClick={save} className="flex w-fit items-center gap-2 rounded-lg bg-paper px-5 py-3 text-[14px] font-medium text-ground hover:bg-figure">
            <IconCheck size={16} /> Use my brand <IconArrow size={15} />
          </button>
        </div>

        <div className="lg:sticky lg:top-20 lg:h-fit">
          {[display, text, mono].map((f) => (
            // eslint-disable-next-line @next/next/no-page-custom-font
            <link key={f} rel="stylesheet" href={gf(f)} />
          ))}
          <div className="overflow-hidden rounded-xl border border-line">
            <div className="aspect-video"><MovePlayer id="magic-move" values={{}} playing speed={1} remountKey={`${display}|${mono}`} theme={theme} /></div>
          </div>
          <div className="mt-4 rounded-xl border border-line p-6" style={{ background: ground }}>
            <div className="text-[clamp(32px,4vw,56px)] leading-[0.95] tracking-[-0.02em]" style={{ fontFamily: `'${display}'`, color: figure }}>{name || "Your brand"}, moving.</div>
            <p className="mt-3 text-[15px]" style={{ fontFamily: `'${text}'`, color: derived.muted }}>This is your body text on your background, with <span style={{ color: accent }}>one accent</span>.</p>
            <p className="mt-3 text-[12px]" style={{ fontFamily: `'${mono}'`, color: derived.muted }}>$ npx paper-motion add magic-move</p>
          </div>
        </div>
      </div>
    </div>
  );
}
