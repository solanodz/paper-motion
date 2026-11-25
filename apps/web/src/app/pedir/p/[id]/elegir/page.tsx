import { Choose } from "@/components/pedir/choose";
import { ORDER } from "@/lib/pedir";

export default async function Elegir({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return (
    <>
      <section className="flex flex-wrap items-end justify-between gap-6 border-b border-line px-5 pb-8 pt-12 md:px-8">
        <div>
          <p className="font-mono text-[12px] text-faint">Pedido {id} · {ORDER.url}</p>
          <h1 className="title mt-4">Elegí una dirección.</h1>
          <p className="mt-4 max-w-[56ch] text-[15px] leading-relaxed text-muted">
            Dos maneras distintas de contar tu sitio. Mirá cómo se mueve cada una y quedate con la que más se parezca a
            tu marca.
          </p>
        </div>
        <span className="tag">Producimos solo la que elijas</span>
      </section>
      <Choose id={id} />
    </>
  );
}
