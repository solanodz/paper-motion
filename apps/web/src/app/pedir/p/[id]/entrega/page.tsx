import { Delivery } from "@/components/pedir/delivery";
import { ORDER } from "@/lib/pedir";

export default async function Entrega({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return (
    <>
      <section className="border-b border-line px-5 pb-8 pt-12 md:px-8">
        <p className="font-mono text-[12px] text-faint">Pedido {id} · {ORDER.url} · Dirección B, «Un mundo propio»</p>
        <h1 className="title mt-4">Tu video está listo.</h1>
      </section>
      <Delivery />
    </>
  );
}
