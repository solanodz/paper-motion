// A temporary lab: logo proposals for paper-motion, each as a mark, a lockup, favicon sizes and on paper.
// Not linked from anywhere; delete the route (and public/site/logo-lab) once one is chosen.
import type { Metadata } from "next";
import type { CSSProperties, ReactNode } from "react";
import { ShaderPreview } from "@/components/shader-preview";

export const metadata: Metadata = { title: "Logo lab", robots: { index: false } };

// currentColor is the figure; --mk2 the folded back of the paper; --mk3 the faint layer
const ON_BLACK = { color: "#fff", "--mk2": "#8a8a8a", "--mk3": "#2e2e2e" } as CSSProperties;
const ON_PAPER = { color: "#000", "--mk2": "#8a8a8a", "--mk3": "#cfc9bb" } as CSSProperties;
const M2 = "var(--mk2)", M3 = "var(--mk3)";

const PIXEL_P = [[0, 1, 2, 3], [0, 2, 3, 4], [0, 3, 4], [0, 2, 3, 4], [0, 1, 2, 3], [0], [0], [0]];

type Mark = { id: string; name: string; idea: string; draw: ReactNode };
const MARKS: Mark[] = [
  {
    id: "pliego", name: "Pliego",
    idea: "Un play hecho de papel: la punta está doblada hacia atrás. Papel y video en una sola forma, que se lee bien hasta en 16 px.",
    draw: <><path d="M16 8L48 25.45L48 38.55L16 56Z" fill="currentColor" /><path d="M48 25.45L48 38.55L36 32Z" fill={M2} /></>,
  },
  {
    id: "encuadre", name: "Encuadre",
    idea: "Las cuatro marcas de un visor apaisado y un cuadro en el centro: el frame, sin línea de tiempo alrededor.",
    draw: <><path d="M8 27V15H20M44 15H56V27M56 37V49H44M20 49H8V37" fill="none" stroke="currentColor" strokeWidth="5" strokeLinecap="square" /><rect x="25" y="25" width="14" height="14" fill={M2} /></>,
  },
  {
    id: "cursor", name: "Cursor",
    idea: "El cursor de bloque de la terminal con una esquina de papel doblada: se edita escribiendo, no arrastrando clips. Puede parpadear.",
    draw: <><path d="M18 8H36L46 18V56H18Z" fill="currentColor" /><path d="M36 8L46 18H36Z" fill={M2} /></>,
  },
  {
    id: "capas", name: "Capas",
    idea: "Tres hojas desplazadas, como el papel cebolla de la animación: el movimiento entendido como cuadros sucesivos.",
    draw: <><rect x="6" y="6" width="30" height="30" fill={M3} /><rect x="17" y="17" width="30" height="30" fill={M2} /><rect x="28" y="28" width="30" height="30" fill="currentColor" /></>,
  },
  {
    id: "corte", name: "Corte",
    idea: "Un cuadrado partido en diagonal, con las mitades corridas. El corte es el gesto mínimo de la edición.",
    draw: <><path d="M9 9H45L9 45Z" fill="currentColor" /><path d="M51 15V51H15Z" fill="currentColor" /></>,
  },
  {
    id: "etapas", name: "Etapas",
    idea: "Las seis etapas de una pieza en una grilla de celdas, con la actual encendida. Usa la firma visual que ya comparten el estudio y el sitio.",
    draw: <>{Array.from({ length: 6 }, (_, i) => <rect key={i} x={4 + (i % 3) * 20} y={14 + Math.floor(i / 3) * 20} width="16" height="16" fill={i === 2 ? "currentColor" : M3} />)}</>,
  },
  {
    id: "pixel-p", name: "p pixel",
    idea: "Una p minúscula en la grilla de Geist Pixel, con el hueco de la panza en forma de play.",
    draw: <>{PIXEL_P.flatMap((row, r) => row.map((c) => <rect key={`${r}-${c}`} x={17 + c * 6} y={8 + r * 6} width="6.02" height="6.02" fill="currentColor" />))}</>,
  },
];

const Svg = ({ m, size, className = "" }: { m: Mark; size: number | string; className?: string }) => (
  <svg viewBox="0 0 64 64" width={size} height={size} className={className} shapeRendering={m.id === "pixel-p" ? "crispEdges" : undefined} aria-hidden>{m.draw}</svg>
);

const Lockup = ({ m }: { m: Mark }) => (
  <span className="flex items-center gap-2 font-serif text-[21px] tracking-[-0.02em]"><Svg m={m} size={22} />paper-motion</span>
);

// the material versions: live shaders from the library, fed a white silhouette of the mark
const metal = (image: string, extra: Record<string, unknown> = {}) => ({
  shader: "LiquidMetal",
  props: { fit: "contain", scale: 0.62, shape: "none", colorBack: "#000000", colorTint: "#ffffff", softness: 0.12, repetition: 5, shiftRed: 0.3, shiftBlue: 0.3, distortion: 0.14, contour: 0.6, angle: 20, speed: 1, image, ...extra },
});
const MATERIAL = [
  { label: "Pliego en liquid metal", entry: metal("/site/logo-lab/pliego.svg") },
  { label: "Cursor en liquid metal", entry: metal("/site/logo-lab/cursor.svg") },
  { label: "Capas en liquid metal, tinte papel", entry: metal("/site/logo-lab/capas.svg", { colorTint: "#e9e4d8", repetition: 3 }) },
  {
    label: "Pliego tramado (image dithering)",
    entry: { shader: "ImageDithering", props: { image: "/site/logo-lab/pliego.svg", fit: "contain", scale: 0.62, colorBack: "#000000", colorFront: "#e9e4d8", colorHighlight: "#ffffff", type: "8x8", size: 3, colorSteps: 2, originalColors: false } },
  },
];

export default function LogoLab() {
  return (
    <div>
      <section className="border-b border-line px-5 py-14 md:px-8">
        <p className="font-mono text-[12px] text-muted">/logo-lab · temporal</p>
        <h1 className="display mt-4">Logo lab</h1>
        <p className="mt-5 max-w-[62ch] text-[16px] leading-[1.55] text-figure/75">
          Siete marcas para paper-motion, cada una con su idea, el lockup del header, tamaños de favicon y su versión sobre papel. Abajo, las más fuertes en material vivo y cuatro tratamientos del wordmark solo con tipografía.
        </p>
      </section>

      <section className="grid gap-px bg-line md:grid-cols-2">
        {MARKS.map((m, i) => (
          <article key={m.id} className="flex flex-col bg-ground" style={ON_BLACK}>
            <div className="flex items-baseline gap-3 border-b border-line px-5 py-4 md:px-6">
              <span className="num text-[22px]">{String(i + 1).padStart(2, "0")}</span>
              <h2 className="font-serif text-[28px] leading-none tracking-[-0.02em]">{m.name}</h2>
            </div>
            <div className="grid grid-cols-[1.4fr_1fr] border-b border-line">
              <div className="flex aspect-square items-center justify-center border-r border-line"><Svg m={m} size="62%" /></div>
              <div className="flex flex-col items-center justify-center gap-6 bg-paper" style={ON_PAPER}><Svg m={m} size="52%" /></div>
            </div>
            <div className="flex flex-wrap items-end gap-5 border-b border-line px-5 py-4 md:px-6">
              {[16, 24, 32, 48].map((s) => (
                <span key={s} className="flex flex-col items-center gap-1.5"><Svg m={m} size={s} /><span className="font-mono text-[10.5px] text-muted">{s}</span></span>
              ))}
              <span className="ml-auto flex items-center gap-2 bg-paper px-2 py-1.5" style={ON_PAPER}><Svg m={m} size={16} /><span className="font-mono text-[11px]">paper-motion.app</span></span>
            </div>
            <div className="grid sm:grid-cols-2">
              <div className="flex h-[52px] items-center border-b border-line px-5 sm:border-r md:px-6"><Lockup m={m} /></div>
              <div className="flex h-[52px] items-center border-b border-line bg-paper px-5 md:px-6" style={ON_PAPER}><Lockup m={m} /></div>
            </div>
            <p className="px-5 py-5 text-[14.5px] leading-[1.55] text-figure/75 md:px-6">{m.idea}</p>
          </article>
        ))}
        {MARKS.length % 2 ? <div className="hidden bg-ground md:block" /> : null}
      </section>

      <section className="border-t border-line">
        <h2 className="title px-5 py-10 md:px-8">En material</h2>
        <div className="grid gap-px border-t border-line bg-line sm:grid-cols-2 lg:grid-cols-4">
          {MATERIAL.map((x) => (
            <figure key={x.label} className="bg-ground">
              <ShaderPreview entry={x.entry} className="aspect-square w-full" />
              <figcaption className="border-t border-line px-4 py-3 text-[13px] text-muted">{x.label}</figcaption>
            </figure>
          ))}
        </div>
      </section>

      <section className="border-t border-line">
        <h2 className="title px-5 py-10 md:px-8">Solo tipografía</h2>
        <div className="grid gap-px border-t border-line bg-line md:grid-cols-2">
          <Word n="A" label="Actual: Geist Serif, minúscula, con el guion">
            <span>paper-motion</span>
          </Word>
          <Word n="B" label="El guion como barra de papel que se estira, como si avanzara">
            <span>paper<span className="logo-lab-bar mx-[0.06em] inline-block h-[0.085em] translate-y-[0.02em] bg-paper align-middle" />motion</span>
          </Word>
          <Word n="C" label="Papel quieto en serif, movimiento en pixel: lo analógico y lo digital">
            <span>paper-<span className="font-pixel text-[0.86em] tracking-[0.02em]">motion</span></span>
          </Word>
          <Word n="D" label="La palabra motion deja una estela, como un cuadro con desenfoque de movimiento">
            <span>paper-<span style={{ textShadow: "-0.08em 0 0 rgba(255,255,255,.28), -0.16em 0 0 rgba(255,255,255,.14), -0.24em 0 0 rgba(255,255,255,.06)" }}>motion</span></span>
          </Word>
        </div>
        <style>{`@keyframes logo-lab-bar{0%,100%{width:.18em}50%{width:.62em}} .logo-lab-bar{animation:logo-lab-bar 2.4s cubic-bezier(.7,0,.3,1) infinite} @media (prefers-reduced-motion:reduce){.logo-lab-bar{animation:none;width:.3em}}`}</style>
      </section>
    </div>
  );
}

function Word({ n, label, children }: { n: string; label: string; children: ReactNode }) {
  return (
    <figure className="flex flex-col bg-ground">
      <div className="flex min-h-[220px] flex-1 items-center justify-center px-6 py-12 font-serif text-[clamp(44px,6vw,84px)] leading-none tracking-[-0.02em]">{children}</div>
      <figcaption className="flex gap-3 border-t border-line px-5 py-3 text-[13px] text-muted md:px-6"><span className="num">{n}</span>{label}</figcaption>
    </figure>
  );
}
