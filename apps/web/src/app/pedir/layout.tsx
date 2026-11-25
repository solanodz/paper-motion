import type { Metadata } from "next";
import { DemoBar } from "@/components/pedir/demo-bar";

export const metadata: Metadata = {
  title: "Pedí tu video",
  description: "Pegá la URL de tu sitio y recibí un video de 30 segundos hecho a medida de tu marca.",
};

export default function PedirLayout({ children }: { children: React.ReactNode }) {
  return (
    <div lang="es">
      <DemoBar />
      {children}
    </div>
  );
}
