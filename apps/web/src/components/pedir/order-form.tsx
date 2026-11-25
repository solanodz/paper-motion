"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Button } from "@ui-sdk/react/button";
import { Collapsible, CollapsiblePanel, CollapsibleTrigger } from "@ui-sdk/react/collapsible";
import { Field, FieldLabel } from "@ui-sdk/react/field";
import { Input } from "@ui-sdk/react/input";
import { Toggle, ToggleGroup } from "@ui-sdk/react/toggle";
import { IconArrow, IconChevron } from "@/components/icons";
import { ORDER, PRICE } from "@/lib/pedir";

const WHERE = ["LinkedIn", "Instagram", "TikTok", "YouTube", "Tu web", "Mail"];

type Order = { url: string; audience: string; cta: string; where: string[]; email: string; colors: string; avoid: string; say: string };

/** The order: five things we need, four we'd like. In the demo it keeps the order in the session and goes to payment. */
export function OrderForm() {
  const router = useRouter();
  const [o, setO] = useState<Order>({ url: "", audience: "", cta: "", where: [], email: "", colors: "", avoid: "", say: "" });
  const [tried, setTried] = useState(false);
  const set = (k: keyof Order) => (v: string) => setO((s) => ({ ...s, [k]: v }));

  const missing = {
    url: !/^(https?:\/\/)?[^\s.]+\.[^\s]{2,}/.test(o.url.trim()),
    audience: o.audience.trim().length < 3,
    cta: o.cta.trim().length < 3,
    where: o.where.length === 0,
    email: !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(o.email.trim()),
  };
  const ok = !Object.values(missing).some(Boolean);
  const bad = (k: keyof typeof missing) => tried && missing[k];

  return (
    <form
      noValidate
      className="grid border-b border-line lg:grid-cols-[minmax(0,1fr)_minmax(300px,380px)]"
      onSubmit={(e) => {
        e.preventDefault();
        setTried(true);
        if (!ok) return;
        try { sessionStorage.setItem("pm-order", JSON.stringify({ ...o, id: ORDER.id })); } catch {}
        router.push("/pedir/pago");
      }}
    >
      <div className="flex flex-col gap-8 px-5 py-10 md:px-8 md:py-12 lg:border-r lg:border-line">
        <Q label="La URL de tu sitio" hint="De acá sacamos los textos, los colores y lo que mostrás." bad={bad("url")} error="Necesitamos una URL que funcione.">
          <Input className="field text-[17px]" placeholder={ORDER.url} value={o.url} onValueChange={set("url")} inputMode="url" autoComplete="url" />
        </Q>
        <Q label="¿A quién le habla el video?" hint="Una frase alcanza." bad={bad("audience")} error="Contanos a quién le habla.">
          <Input className="field text-[17px]" placeholder={ORDER.audience} value={o.audience} onValueChange={set("audience")} />
        </Q>
        <Q label="¿Qué querés que hagan después de verlo?" hint="El llamado a la acción del final." bad={bad("cta")} error="Contanos qué querés que hagan.">
          <Input className="field text-[17px]" placeholder={ORDER.cta} value={o.cta} onValueChange={set("cta")} />
        </Q>
        <div className="flex flex-col gap-3">
          <p className="text-[13px] text-muted">¿Dónde lo vas a publicar?</p>
          <ToggleGroup multiple aria-label="Dónde lo vas a publicar" value={o.where} onValueChange={(v) => setO((s) => ({ ...s, where: v }))} className="flex flex-wrap border border-line [&>*:last-child]:border-r-0">
            {WHERE.map((w) => (
              <Toggle key={w} value={w} className="chip">{w}</Toggle>
            ))}
          </ToggleGroup>
          {bad("where") ? <p className="text-[13px] text-warn">Elegí al menos uno.</p> : <p className="text-[13px] text-faint">Te entregamos 16:9 y 9:16 igual; esto nos dice cuál cuidar más.</p>}
        </div>
        <Q label="Tu mail" hint="Ahí te llegan las dos direcciones y después el video." bad={bad("email")} error="Revisá el mail.">
          <Input className="field text-[17px]" placeholder="vos@tuempresa.com" value={o.email} onValueChange={set("email")} type="email" autoComplete="email" />
        </Q>

        <Collapsible className="border-y border-line">
          <CollapsibleTrigger className="collapsible-trigger !px-0">
            <span className="text-[15px]">Opcional: tu marca</span>
            <IconChevron size={16} className="chev" />
          </CollapsibleTrigger>
          <CollapsiblePanel className="collapsible-panel">
            <div className="flex flex-col gap-8 pb-8 pt-2">
              <Q label="Colores" hint="Si no, los tomamos de tu sitio.">
                <Input className="field text-[15px]" placeholder="#ff7338, negro y blanco" value={o.colors} onValueChange={set("colors")} />
              </Q>
              <Q label="Palabras que no querés que aparezcan">
                <Input className="field text-[15px]" placeholder="«barato», «startup»" value={o.avoid} onValueChange={set("avoid")} />
              </Q>
              <Q label="¿Cómo se pronuncia el nombre de tu marca?" hint="Para cuando sumemos voz en off.">
                <Input className="field text-[15px]" placeholder="Cuadrántec, con acento en la segunda a" value={o.say} onValueChange={set("say")} />
              </Q>
              <div className="flex flex-col gap-2">
                <p className="text-[13px] text-muted">Logo</p>
                <input type="file" accept="image/svg+xml,image/png" className="box text-[12px] file:mr-3 file:border-0 file:bg-figure file:px-3 file:py-1.5 file:text-black" />
              </div>
            </div>
          </CollapsiblePanel>
        </Collapsible>
      </div>

      {/* the summary, sticky beside the form */}
      <aside className="flex flex-col gap-6 border-t border-line bg-surface px-5 py-10 md:px-8 lg:sticky lg:top-[52px] lg:h-fit lg:border-t-0">
        <div>
          <p className="font-mono text-[12px] text-faint">Tu pedido</p>
          <p className="mt-3 font-serif text-[30px] leading-none tracking-[-0.02em]">Un video de 30 s</p>
        </div>
        <div className="rows text-[14px]">
          {[
            ["Sitio", o.url || "—"],
            ["Direcciones", "2, en 24 h"],
            ["Video", "48 h después de elegir"],
            ["Formatos", "16:9 · 9:16"],
          ].map(([k, v]) => (
            <div key={k} className="flex justify-between gap-4 border-b border-line py-3">
              <span className="text-muted">{k}</span>
              <span className="truncate">{v}</span>
            </div>
          ))}
        </div>
        <div className="flex items-baseline justify-between">
          <span className="text-muted">Total</span>
          <span className="font-pixel text-[36px] leading-none">{PRICE}</span>
        </div>
        <Button type="submit" className="btn btn-primary h-11 w-full text-[14px]">
          Ir a pagar
          <IconArrow size={14} />
        </Button>
        {tried && !ok ? <p className="text-[13px] text-warn">Falta completar algunos datos.</p> : null}
        <p className="text-[12px] leading-relaxed text-faint">Si no cumplimos los plazos, te devolvemos el dinero.</p>
      </aside>
    </form>
  );
}

function Q({ label, hint, bad, error, children }: { label: string; hint?: string; bad?: boolean; error?: string; children: React.ReactNode }) {
  return (
    <Field className="flex flex-col gap-2">
      <FieldLabel className="text-[13px] text-muted">{label}</FieldLabel>
      {children}
      {bad ? <p className="text-[13px] text-warn">{error}</p> : hint ? <p className="text-[13px] text-faint">{hint}</p> : null}
    </Field>
  );
}
