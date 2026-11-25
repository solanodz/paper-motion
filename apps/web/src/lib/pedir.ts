/**
 * "Pedí tu video": the concierge test (docs/spec-concierge.md). A demo for now: the order, the payment and the
 * private pages are mocked with one example order; the media are the Cuadrantec piece we already made.
 */

export const PRICE = "USD 99";

/** The steps of the demo, in the order a client lives them. */
export const STEPS = [
  { href: "/pedir", label: "Landing" },
  { href: "/pedir/nuevo", label: "Pedido" },
  { href: "/pedir/pago", label: "Pago" },
  { href: "/pedir/p/PM-0142/elegir", label: "Elegir" },
  { href: "/pedir/p/PM-0142/entrega", label: "Entrega" },
] as const;

/** The example order every demo page shows. Cuadrantec is our consultancy, used as the example brand. */
export const ORDER = {
  id: "PM-0142",
  brand: "Cuadrantec",
  url: "cuadrantec.com",
  audience: "Dueños de pymes que todavía trabajan con planillas y WhatsApp",
  cta: "Pedir una charla gratis",
};

export const MEDIA = {
  landing: "/pedir/cuadrantec-landing.jpg",
  video169: "/pedir/cuadrantec-16x9.mp4",
  poster169: "/pedir/cuadrantec-16x9.jpg",
  video916: "/pedir/cuadrantec-9x16.mp4",
  poster916: "/pedir/cuadrantec-9x16.jpg",
};

export type Direction = {
  key: "a" | "b";
  name: string;
  idea: string;
  hook: string;
  script: string[];
  video: string;
  poster: string;
};

/** Two genuinely different ways to tell the same landing. B is the one the example client chose. */
export const DIRECTIONS: Direction[] = [
  {
    key: "a",
    name: "Sobre tu web",
    idea: "Tu sitio tal como es, con la cámara guiando la mirada.",
    hook: "¿Seguís trabajando con papeles y Excel? — resaltado sobre tu propio hero.",
    script: [
      "Abre en la pregunta de tu hero y el resaltador marca «papeles y Excel».",
      "Corte a «Un pedido, una fila»: la respuesta, con el resto en segundo plano.",
      "La cámara entra a Automatización y se ve el click.",
      "Cierra en tu página, con «Pedí una charla gratis».",
    ],
    video: "/pedir/direccion-a.mp4",
    poster: "/pedir/direccion-a.jpg",
  },
  {
    key: "b",
    name: "Un mundo propio",
    idea: "Los papelitos de tu hero se ordenan solos en un sistema.",
    hook: "¿Seguís trabajando con papeles y Excel? — entre WhatsApps, mails, post-its y una planilla con #¡REF!.",
    script: [
      "El desorden: WhatsApps, un audio, un mail «RE: RE: RE:» y la planilla con #¡REF!.",
      "Los papelitos vuelan y se vuelven una tabla: un pedido, una fila.",
      "El sistema hace solo lo que hoy se copia y pega: «Aviso enviado ✓».",
      "Cierra con tu logo y «Pedí una charla gratis».",
    ],
    video: "/pedir/direccion-b.mp4",
    poster: "/pedir/direccion-b.jpg",
  },
];

/** A finished example for the landing's showcase: their landing, the two directions, the video. */
export type Case = {
  brand: string;
  url: string;
  note: string;
  landing: string;
  directions: { key: "a" | "b"; name: string; video: string; poster: string }[];
  chosen: "a" | "b";
  video169: string;
  poster169: string;
  video916: string;
  poster916: string;
};

export const CASES: Case[] = [
  {
    brand: "Cuadrantec",
    url: "cuadrantec.com",
    note: "La consultora con la que probamos el proceso.",
    directions: DIRECTIONS.map(({ key, name, video, poster }) => ({ key, name, video, poster })),
    chosen: "b",
    ...MEDIA,
  },
  {
    brand: "Apple",
    url: "apple.com/la",
    note: "Una marca que no conocemos, de punta a punta con el mismo proceso.",
    landing: "/pedir/apple-landing.jpg",
    directions: [
      { key: "a", name: "La página, viva", video: "/pedir/apple-direccion-a.mp4", poster: "/pedir/apple-direccion-a.jpg" },
      { key: "b", name: "Una luz", video: "/pedir/apple-direccion-b.mp4", poster: "/pedir/apple-direccion-b.jpg" },
    ],
    chosen: "b",
    video169: "/pedir/apple-16x9.mp4",
    poster169: "/pedir/apple-16x9.jpg",
    video916: "/pedir/apple-9x16.mp4",
    poster916: "/pedir/apple-9x16.jpg",
  },
];

export const INCLUDES: [string, string][] = [
  ["El video", "Hasta 30 segundos, hecho a medida de tu marca a partir de tu sitio. No tenés que grabar nada."],
  ["Antes de producir", "Dos direcciones distintas para elegir, cada una con su idea, un guion corto y cómo se va a ver."],
  ["Formatos", "16:9 para web, YouTube y LinkedIn; 9:16 para Reels y TikTok; miniatura y portada."],
  ["Sonido", "Efectos de sonido con licencia comercial. La voz en off no va por ahora."],
  ["Cambios", "Una ronda de correcciones menores: textos o un ajuste de ritmo."],
  ["Plazos", "Las direcciones en 24 horas; el video, 48 horas después de que elegís. Si no cumplimos, te devolvemos el dinero."],
];

export const FAQ: [string, string][] = [
  ["¿Tengo que grabar algo?", "No. Partimos de tu sitio: los textos, los colores, las tipografías y lo que muestra tu página."],
  ["¿Quién hace el video?", "Un agente de IA lo produce a medida y otro lo revisa sin saber cómo se hizo. Una persona lo mira y lo escucha completo antes de mandártelo."],
  ["¿Y si no me gusta ninguna de las dos direcciones?", "Contestá el mail y te proponemos un ajuste sobre la que más te acerque. Si igual no te sirve, te devolvemos el dinero."],
  ["¿Puedo cambiar cosas después?", "Sí, una ronda de correcciones menores: textos o un ajuste de ritmo. Cambiar de dirección después de elegir no entra."],
  ["¿Por qué tan barato?", "Es un piloto: cupos limitados por día mientras ajustamos el proceso."],
];
