import { OrderForm } from "@/components/pedir/order-form";

export default function Nuevo() {
  return (
    <>
      <section className="border-b border-line px-5 pb-8 pt-12 md:px-8">
        <h1 className="title">Tu pedido.</h1>
        <p className="mt-4 max-w-[52ch] text-[15px] leading-relaxed text-muted">
          Cinco datos y listo. Con tu sitio y esto armamos dos direcciones para que elijas antes de producir.
        </p>
      </section>
      <OrderForm />
    </>
  );
}
