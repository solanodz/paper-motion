"use client";

import { useEffect, useState } from "react";
import { Button } from "@ui-sdk/react/button";
import { Checkbox, CheckboxIndicator } from "@ui-sdk/react/checkbox";
import { Field, FieldLabel } from "@ui-sdk/react/field";
import { Textarea } from "@ui-sdk/react/textarea";
import { Toast, ToastDescription, ToastRegion, ToastTitle, createToaster } from "@ui-sdk/react/toast";
import { IconArrow, IconCheck, IconFile } from "@/components/icons";
import { MEDIA } from "@/lib/pedir";

const FILES = [
  ["Video 16:9", "web, YouTube, LinkedIn", MEDIA.video169],
  ["Video 9:16", "Reels, TikTok, Stories", MEDIA.video916],
  ["Miniatura 16:9", "para YouTube y LinkedIn", MEDIA.poster169],
  ["Portada 9:16", "para Reels y TikTok", MEDIA.poster916],
] as const;

/** The private delivery page: the video in both formats, the files, and the one decision left (accept or fix). */
export function Delivery() {
  const [toast] = useState(() => createToaster());
  useEffect(() => () => toast.dismiss(), [toast]);
  const [mode, setMode] = useState<"open" | "fix" | "fixed" | "accepted">("open");
  const [notes, setNotes] = useState("");
  const [share, setShare] = useState(false);

  return (
    <>
      {/* both formats at the same height: 16/9 + 9/16 of the height side by side is a 2.34 : 1 strip */}
      <section className="flex flex-col gap-px border-b border-line bg-line md:aspect-[2.34/1] md:flex-row">
        <div className="relative aspect-video bg-black md:aspect-auto md:h-full md:flex-1">
          <video src={MEDIA.video169} poster={MEDIA.poster169} controls playsInline preload="metadata" className="absolute inset-0 h-full w-full object-contain" aria-label="Tu video, 16:9" />
        </div>
        <div className="relative mx-auto aspect-[9/16] w-[60%] bg-black md:mx-0 md:h-full md:w-auto">
          <video src={MEDIA.video916} poster={MEDIA.poster916} controls playsInline preload="metadata" className="absolute inset-0 h-full w-full object-contain" aria-label="Tu video, 9:16" />
        </div>
      </section>

      <section className="grid border-b border-line lg:grid-cols-[minmax(0,1fr)_minmax(320px,440px)]">
        <ul className="border-b border-line lg:border-b-0 lg:border-r">
          {FILES.map(([name, use, href]) => (
            <li key={name} className="flex items-center justify-between gap-4 border-b border-line px-5 py-4 last:border-b-0 md:px-8">
              <div className="flex items-center gap-4">
                <IconFile size={18} className="text-muted" />
                <div>
                  <p className="text-[15px]">{name}</p>
                  <p className="text-[13px] text-muted">{use}</p>
                </div>
              </div>
              <a href={href} download className="btn btn-sm">Descargar</a>
            </li>
          ))}
        </ul>

        <div className="flex flex-col gap-5 bg-surface px-5 py-8 md:px-8">
          {mode === "accepted" ? (
            <>
              <span className="tag tag-ok w-fit"><IconCheck size={12} /> Aceptado</span>
              <p className="font-serif text-[30px] leading-none tracking-[-0.02em]">¡Gracias! Que lo disfrutes.</p>
              <Checkbox checked={share} onCheckedChange={(v) => { setShare(Boolean(v)); if (v) toast("¡Gracias!", { description: "Lo vamos a mostrar como ejemplo, con tu marca." }); }} className="flex cursor-pointer items-start gap-3 text-left text-[14px]">
                <span className="mt-0.5 grid h-4 w-4 shrink-0 place-items-center border border-rule">
                  <CheckboxIndicator className="grid place-items-center"><IconCheck size={12} /></CheckboxIndicator>
                </span>
                <span className="text-muted">Pueden mostrar este video como ejemplo en paper-motion.</span>
              </Checkbox>
            </>
          ) : mode === "fixed" ? (
            <>
              <span className="tag tag-paper w-fit">Correcciones recibidas</span>
              <p className="text-[15px] leading-relaxed text-muted">Te mandamos la versión corregida en 24 horas, en esta misma página.</p>
            </>
          ) : (
            <>
              <div>
                <p className="font-serif text-[30px] leading-none tracking-[-0.02em]">¿Está bien así?</p>
                <p className="mt-2 text-[14px] text-muted">Tenés una ronda de correcciones menores: textos o un ajuste de ritmo.</p>
              </div>
              {mode === "fix" ? (
                <>
                  <Field className="flex flex-col gap-2">
                    <FieldLabel className="text-[13px] text-muted">Qué cambiar, con el segundo si podés</FieldLabel>
                    <Textarea className="box min-h-[110px] text-[13px]" value={notes} onValueChange={setNotes} placeholder={"0:12 — cambiar «pymes» por «empresas»\n0:25 — que el botón quede un segundo más"} />
                  </Field>
                  <div className="flex flex-wrap gap-2">
                    <Button className="btn btn-primary h-11 px-5 text-[14px]" disabled={notes.trim().length < 4} onClick={() => setMode("fixed")}>
                      Mandar correcciones
                      <IconArrow size={14} />
                    </Button>
                    <Button className="btn h-11 px-5 text-[14px]" onClick={() => setMode("open")}>Cancelar</Button>
                  </div>
                </>
              ) : (
                <div className="flex flex-wrap gap-2">
                  <Button className="btn btn-primary h-11 px-5 text-[14px]" onClick={() => setMode("accepted")}>
                    <IconCheck size={14} />
                    Aceptar el video
                  </Button>
                  <Button className="btn h-11 px-5 text-[14px]" onClick={() => setMode("fix")}>Pedir correcciones</Button>
                </div>
              )}
            </>
          )}
        </div>
      </section>

      <ToastRegion toaster={toast} side="bottom" align="end" className="toasts">
        {() => (
          <Toast className="toast">
            <ToastTitle className="text-[14px] font-medium" />
            <ToastDescription className="mt-1 text-[13px] text-muted" />
          </Toast>
        )}
      </ToastRegion>
    </>
  );
}
