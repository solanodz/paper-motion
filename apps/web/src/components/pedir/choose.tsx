"use client";

import Link from "next/link";
import { useState } from "react";
import { Button } from "@ui-sdk/react/button";
import { Field, FieldLabel } from "@ui-sdk/react/field";
import { Textarea } from "@ui-sdk/react/textarea";
import { AutoVideo } from "@/components/auto-video";
import { IconArrow, IconCheck } from "@/components/icons";
import { DIRECTIONS } from "@/lib/pedir";

/** The private page the client gets by mail: two directions, pick one, say why in a line. */
export function Choose({ id }: { id: string }) {
  const [pick, setPick] = useState<"a" | "b" | null>(null);
  const [why, setWhy] = useState("");
  const [sent, setSent] = useState(false);
  const chosen = DIRECTIONS.find((d) => d.key === pick);

  if (sent && chosen) {
    return (
      <section className="border-b border-line px-5 pb-14 pt-14 md:px-8">
        <span className="tag tag-ok"><IconCheck size={12} /> Dirección elegida</span>
        <h1 className="title mt-6 max-w-[18ch]">Elegiste «{chosen.name}».</h1>
        <p className="mt-4 max-w-[52ch] text-[15px] leading-relaxed text-muted">
          Ya empezamos a producirlo. En 48 horas te llega tu video con los dos formatos, la miniatura y la portada.
        </p>
        <Link href={`/pedir/p/${id}/entrega`} className="btn btn-primary mt-8 h-11 px-5 text-[14px]">
          Ver la entrega
          <IconArrow size={14} />
        </Link>
        <p className="mt-3 text-[12px] text-faint">En la demo saltamos las 48 horas.</p>
      </section>
    );
  }

  return (
    <>
      <ul className="grid grid-cols-1 gap-px border-b border-line bg-line md:grid-cols-2">
        {DIRECTIONS.map((d) => {
          const on = pick === d.key;
          return (
            <li key={d.key} className={`flex flex-col bg-ground ${on ? "outline outline-2 -outline-offset-2 outline-paper" : ""}`}>
              <div className="relative aspect-video bg-black">
                <AutoVideo src={d.video} poster={d.poster} label={`Dirección ${d.key.toUpperCase()}: ${d.name}`} className="absolute inset-0 h-full w-full object-contain" />
                <span className={`tag absolute left-3 top-3 ${on ? "tag-paper" : "bg-ground"}`}>Dirección {d.key.toUpperCase()}</span>
              </div>
              <div className="flex flex-1 flex-col gap-5 border-t border-line p-5 md:p-8">
                <div>
                  <h2 className="font-serif text-[34px] leading-none tracking-[-0.02em]">{d.name}</h2>
                  <p className="mt-2 text-[15px] text-muted">{d.idea}</p>
                </div>
                <div>
                  <p className="font-mono text-[12px] text-faint">El gancho</p>
                  <p className="mt-1.5 text-[15px] leading-relaxed">{d.hook}</p>
                </div>
                <div>
                  <p className="font-mono text-[12px] text-faint">El recorrido</p>
                  <ol className="mt-2 flex flex-col gap-2">
                    {d.script.map((s, i) => (
                      <li key={s} className="flex gap-3 text-[14px] leading-snug">
                        <span className="num pt-0.5 text-[13px]">{i + 1}</span>
                        {s}
                      </li>
                    ))}
                  </ol>
                </div>
                <Button className={`btn mt-auto h-11 w-full text-[14px] ${on ? "btn-primary" : ""}`} onClick={() => setPick(d.key)}>
                  {on ? <><IconCheck size={14} /> Elegida</> : "Elegir esta"}
                </Button>
              </div>
            </li>
          );
        })}
      </ul>
      <section className="grid items-end gap-6 border-b border-line px-5 py-10 md:grid-cols-[minmax(0,1fr)_auto] md:px-8">
        <Field className="flex flex-col gap-2">
          <FieldLabel className="text-[13px] text-muted">¿Por qué esta? Una línea alcanza (opcional)</FieldLabel>
          <Textarea className="box min-h-[52px] text-[14px]" value={why} onValueChange={setWhy} placeholder="Me gusta que se vea el desorden antes del orden" />
        </Field>
        <Button className="btn btn-primary h-11 px-6 text-[14px]" disabled={!pick} onClick={() => setSent(true)}>
          Confirmar dirección
          <IconArrow size={14} />
        </Button>
      </section>
    </>
  );
}
