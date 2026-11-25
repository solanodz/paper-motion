"use client";

import Link from "next/link";
import { useState, useSyncExternalStore } from "react";
import { Button } from "@ui-sdk/react/button";
import { IconArrow, IconCheck } from "@/components/icons";
import { ORDER, PRICE } from "@/lib/pedir";

const noop = () => () => {};
function readUrl() {
  try {
    const o = JSON.parse(sessionStorage.getItem("pm-order") ?? "null");
    return o?.url ? String(o.url).replace(/^https?:\/\//, "") : ORDER.url;
  } catch {
    return ORDER.url;
  }
}

/** Payment is not chosen yet (spec D2: Mercado Pago, Stripe or both). The demo stands in for it with one button. */
export default function Pago() {
  // the site the client typed on the order page (kept in the session by the demo); the example's on the server
  const url = useSyncExternalStore(noop, readUrl, () => ORDER.url);
  const [paid, setPaid] = useState(false);

  if (paid) {
    const steps = [
      ["Hoy", "Recibimos tu pedido y leemos tu sitio."],
      ["En 24 h", "Te llega un mail con las dos direcciones para elegir."],
      ["48 h después de elegir", "Te llega tu video: 16:9, 9:16, miniatura y portada."],
    ];
    return (
      <section className="grid border-b border-line md:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
        <div className="px-5 pb-12 pt-14 md:px-8">
          <span className="tag tag-ok"><IconCheck size={12} /> Pago aprobado</span>
          <h1 className="title mt-6 max-w-[14ch]">Listo, ya estamos en eso.</h1>
          <p className="mt-4 text-[15px] text-muted">
            Pedido <span className="font-mono text-figure">{ORDER.id}</span> · {url}
          </p>
          <Link href={`/pedir/p/${ORDER.id}/elegir`} className="btn btn-primary mt-8 h-11 px-5 text-[14px]">
            Ver el mail de las direcciones
            <IconArrow size={14} />
          </Link>
          <p className="mt-3 text-[12px] text-faint">En la demo saltamos las 24 horas.</p>
        </div>
        <ol className="border-t border-line md:border-l md:border-t-0">
          {steps.map(([when, what], i) => (
            <li key={when} className="flex gap-5 border-b border-line px-5 py-7 last:border-b-0 md:px-8">
              <span className="num pt-1 text-[18px]">{i + 1}</span>
              <div>
                <p className="font-serif text-[26px] leading-none tracking-[-0.02em]">{when}</p>
                <p className="mt-2 text-[15px] text-muted">{what}</p>
              </div>
            </li>
          ))}
        </ol>
      </section>
    );
  }

  return (
    <section className="grid border-b border-line md:grid-cols-[minmax(0,1fr)_minmax(320px,420px)]">
      <div className="px-5 pb-12 pt-14 md:px-8">
        <h1 className="title">Pagá tu pedido.</h1>
        <div className="grid-bg mt-8 grid min-h-[240px] place-items-center border border-dashed border-rule p-8 text-center">
          <div>
            <p className="font-mono text-[12px] text-faint">Acá va el cobro</p>
            <p className="mt-2 max-w-[36ch] text-[14px] text-muted">Mercado Pago, Stripe o los dos: todavía no está decidido (D2 de la spec).</p>
          </div>
        </div>
      </div>
      <aside className="flex flex-col gap-6 border-t border-line bg-surface px-5 py-12 md:border-l md:border-t-0 md:px-8">
        <div className="rows text-[14px]">
          {[
            ["Pedido", ORDER.id],
            ["Sitio", url],
            ["Qué recibís", "Video de 30 s, 16:9 y 9:16"],
          ].map(([k, v]) => (
            <div key={k} className="flex justify-between gap-4 border-b border-line py-3">
              <span className="text-muted">{k}</span>
              <span className="truncate font-mono text-[13px]">{v}</span>
            </div>
          ))}
        </div>
        <div className="flex items-baseline justify-between">
          <span className="text-muted">Total</span>
          <span className="font-pixel text-[36px] leading-none">{PRICE}</span>
        </div>
        <Button className="btn btn-primary h-11 w-full text-[14px]" onClick={() => setPaid(true)}>
          Simular pago aprobado
        </Button>
        <Link href="/pedir/nuevo" className="text-[13px] text-muted underline underline-offset-4 hover:text-figure">Volver al pedido</Link>
      </aside>
    </section>
  );
}
