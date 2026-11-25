import Link from "next/link";
import { Collapsible, CollapsiblePanel, CollapsibleTrigger } from "@ui-sdk/react/collapsible";
import { AutoVideo } from "@/components/auto-video";
import { IconArrow, IconChevron } from "@/components/icons";
import { getEntries } from "@/lib/gallery";
import { CASES, FAQ, INCLUDES, MEDIA, PRICE } from "@/lib/pedir";

// gallery pieces that show the range of what a client can get (all made by an agent, from a prompt)
const SHOWCASE = ["product-reveal", "kinetic-type", "data-chart", "phone-promo"];

export default function Pedir() {
  const entries = getEntries();
  const more = SHOWCASE.map((s) => entries.find((e) => e.slug === s)).filter((e) => e && e.media.video);

  return (
    <>
      {/* hero: the promise on the left, a finished piece on the right */}
      <section className="grid border-b border-line md:grid-cols-[minmax(0,1fr)_minmax(0,1.15fr)]">
        <div className="flex flex-col justify-between gap-10 px-5 pb-10 pt-14 md:px-8 md:pb-12 md:pt-20">
          <div>
            <h1 className="display max-w-[14ch] !text-[clamp(48px,6.6vw,100px)]">Tu landing, convertida en un video.</h1>
            <p className="mt-6 max-w-[46ch] text-[17px] leading-relaxed text-muted">
              Pegá la URL de tu sitio. En 24 horas te mostramos dos direcciones creativas; elegís una y en 48 horas
              tenés tu video de 30 segundos, listo para web y redes. Sin grabar nada.
            </p>
            <div className="mt-8 flex flex-wrap gap-2">
              <Link href="/pedir/nuevo" className="btn btn-primary h-11 px-5 text-[14px]">
                Quiero mi video · {PRICE}
                <IconArrow size={14} />
              </Link>
              <a href="#ejemplo" className="btn h-11 px-5 text-[14px]">Ver un ejemplo</a>
            </div>
          </div>
          <ol className="grid border border-line text-[13px] sm:grid-cols-3">
            {["Pegá tu URL", "Elegí una dirección · 24 h", "Recibí tu video · 48 h"].map((s, i) => (
              <li key={s} className="flex h-11 items-center gap-3 border-line px-4 text-figure [&:not(:first-child)]:border-t sm:[&:not(:first-child)]:border-l sm:[&:not(:first-child)]:border-t-0">
                <span className="num text-[15px]">{i + 1}</span>
                {s}
              </li>
            ))}
          </ol>
        </div>
        <div className="relative border-t border-line bg-black md:border-l md:border-t-0">
          <div className="relative aspect-video md:absolute md:inset-0 md:aspect-auto">
            <AutoVideo src={MEDIA.video169} poster={MEDIA.poster169} label="Video de ejemplo para Cuadrantec" className="absolute inset-0 h-full w-full object-contain" />
          </div>
          <span className="tag tag-paper absolute left-4 top-4">Ejemplo · Cuadrantec</span>
        </div>
      </section>

      {/* the example, end to end: their landing, the two directions, the video they got */}
      <section id="ejemplo" className="scroll-mt-[52px] border-b border-line">
        <div className="flex flex-wrap items-end justify-between gap-4 px-5 pb-6 pt-12 md:px-8">
          <h2 className="title max-w-[18ch]">De la landing al video.</h2>
          <p className="max-w-[44ch] text-[14px] leading-relaxed text-muted">
            Dos pedidos de punta a punta, con el mismo proceso.
          </p>
        </div>
        {CASES.map((c, i) => (
          <div key={c.brand} className="border-t border-line">
            <div className="flex flex-wrap items-baseline justify-between gap-2 px-5 py-3 md:px-8">
              <p className="text-[14px]">
                <span className="font-mono text-faint">0{i + 1} · </span>
                {c.brand}
              </p>
              <p className="text-[13px] text-muted">{c.note}</p>
            </div>
            <ol className="grid grid-cols-1 gap-px border-t border-line bg-line md:grid-cols-[1fr_1.3fr_1fr]">
              <li className="flex flex-col bg-ground">
                <Step n={1} label="Tu landing" note={`${c.url}, tal como está`} />
                <div className="relative aspect-video border-t border-line bg-black">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={c.landing} alt={`La landing de ${c.brand}`} className="absolute inset-0 h-full w-full object-cover object-top" />
                </div>
              </li>
              <li className="flex flex-col bg-ground">
                <Step n={2} label="Dos direcciones" note={`En 24 h. Se eligió la ${c.chosen.toUpperCase()}.`} />
                <div className="grid flex-1 grid-cols-2 gap-px border-t border-line bg-line">
                  {c.directions.map((d) => (
                    <div key={d.key} className="relative bg-black">
                      <div className="relative aspect-video">
                        <AutoVideo src={d.video} poster={d.poster} label={`Dirección ${d.key.toUpperCase()}: ${d.name}`} className="absolute inset-0 h-full w-full object-contain" />
                      </div>
                      <div className="flex items-center justify-between gap-2 border-t border-line bg-ground p-3">
                        <p className="truncate text-[13px]">
                          <span className="font-mono text-faint">{d.key.toUpperCase()} · </span>
                          {d.name}
                        </p>
                        {d.key === c.chosen ? <span className="tag tag-paper">Elegida</span> : null}
                      </div>
                    </div>
                  ))}
                </div>
              </li>
              <li className="flex flex-col bg-ground">
                <Step n={3} label="Tu video" note="En 48 h: 16:9, 9:16, miniatura y portada" />
                <div className="relative aspect-video border-t border-line bg-line">
                  <div className="absolute inset-0 flex gap-px">
                    <div className="relative flex-1 bg-black">
                      <AutoVideo src={c.video169} poster={c.poster169} label={`El video de ${c.brand}, 16:9`} className="absolute inset-0 h-full w-full object-contain" />
                    </div>
                    <div className="relative h-full aspect-[9/16] bg-black">
                      <AutoVideo src={c.video916} poster={c.poster916} label={`El video de ${c.brand}, 9:16`} className="absolute inset-0 h-full w-full object-contain" />
                    </div>
                  </div>
                </div>
              </li>
            </ol>
          </div>
        ))}
      </section>

      {/* what you get, as rows */}
      <section className="grid border-b border-line md:grid-cols-[minmax(0,1fr)_minmax(0,1.6fr)]">
        <div className="px-5 pb-6 pt-12 md:border-r md:border-line md:px-8 md:pb-12">
          <h2 className="title">Qué incluye.</h2>
          <div className="mt-8 border border-line p-6">
            <p className="font-pixel text-[56px] leading-none tracking-[-0.02em]">{PRICE}</p>
            <p className="mt-3 text-[14px] text-muted">Pago único. Piloto con cupos limitados por día.</p>
            <Link href="/pedir/nuevo" className="btn btn-primary mt-6 h-11 w-full text-[14px]">
              Quiero mi video
              <IconArrow size={14} />
            </Link>
          </div>
        </div>
        <div className="px-5 pb-12 md:px-8 md:pt-12">
          <div className="rows">
            {INCLUDES.map(([k, v]) => (
              <div key={k} className="row">
                <span className="text-[14px]">{k}</span>
                <span className="text-[15px] leading-relaxed">{v}</span>
              </div>
            ))}
            <div className="row">
              <span className="text-[14px]">No incluye</span>
              <span className="text-[15px] leading-relaxed text-muted">Voz en off, música, ni editar tus grabaciones.</span>
            </div>
          </div>
        </div>
      </section>

      {/* the range: pieces from the gallery */}
      {more.length ? (
        <section className="border-b border-line">
          <div className="flex flex-wrap items-end justify-between gap-4 px-5 pb-6 pt-12 md:px-8">
            <h2 className="title max-w-[20ch]">Otras piezas que hacemos.</h2>
            <Link href="/" className="btn">
              Ver la galería
              <IconArrow size={14} />
            </Link>
          </div>
          <ul className="grid grid-cols-2 gap-px border-t border-line bg-line md:grid-cols-4">
            {more.map((e) => (
              <li key={e!.slug} className="bg-ground">
                <Link href={`/v/${e!.slug}`} className="card group block">
                  <div className="relative aspect-video overflow-hidden bg-black">
                    <AutoVideo src={e!.media.video!} poster={e!.media.poster} label={e!.title} className="absolute inset-0 h-full w-full object-contain" />
                  </div>
                  <p className="border-t border-line p-4 font-serif text-[22px] leading-none tracking-[-0.02em]">{e!.title}</p>
                </Link>
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      {/* questions */}
      <section className="border-b border-line">
        <h2 className="title px-5 pb-6 pt-12 md:px-8">Preguntas.</h2>
        <div className="border-t border-line">
          {FAQ.map(([q, a], i) => (
            <Collapsible key={q} defaultOpen={i === 0} className="border-b border-line last:border-b-0">
              <CollapsibleTrigger className="collapsible-trigger">
                <span className="font-serif text-[24px] leading-tight tracking-[-0.02em]">{q}</span>
                <IconChevron size={16} className="chev shrink-0" />
              </CollapsibleTrigger>
              <CollapsiblePanel className="collapsible-panel">
                <p className="max-w-[64ch] px-5 pb-6 text-[15px] leading-relaxed text-muted md:px-8">{a}</p>
              </CollapsiblePanel>
            </Collapsible>
          ))}
        </div>
      </section>
    </>
  );
}

function Step({ n, label, note }: { n: number; label: string; note: string }) {
  return (
    <div className="flex items-baseline gap-3 p-4 md:p-5">
      <span className="num text-[18px]">{n}</span>
      <div>
        <p className="font-serif text-[24px] leading-none tracking-[-0.02em]">{label}</p>
        <p className="mt-1.5 text-[13px] text-muted">{note}</p>
      </div>
    </div>
  );
}
