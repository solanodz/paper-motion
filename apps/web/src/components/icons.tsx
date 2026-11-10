// paper-motion icons: drawn for the brand, not from a library. A 20×20 grid, 1.5 px strokes, square caps and mitred
// corners (the brand's "hard" shape language), one accent dot where a glyph needs a focal point.
import type { SVGProps } from "react";

type P = SVGProps<SVGSVGElement> & { size?: number };
const base = ({ size = 18, ...p }: P) => ({
  width: size, height: size, viewBox: "0 0 20 20", fill: "none", stroke: "currentColor", strokeWidth: 1.5,
  strokeLinecap: "square" as const, strokeLinejoin: "miter" as const, "aria-hidden": true, ...p,
});

/** Component transition: a card and its next state, offset. */
export const IconComponent = (p: P) => (
  <svg {...base(p)}><rect x="2.75" y="5.75" width="10" height="8" /><path d="M7.25 2.75h10v8" /><path d="M5.25 9.75h5" /></svg>
);
/** Transition: one frame cut diagonally into the next. */
export const IconTransition = (p: P) => (
  <svg {...base(p)}><rect x="2.75" y="3.75" width="14.5" height="12.5" /><path d="M11.5 3.75 8.5 16.25" /><path d="M13.5 8v4" /></svg>
);
/** Text: a T on its baseline, and a block cursor. */
export const IconText = (p: P) => (
  <svg {...base(p)}><path d="M3.25 4.25h8.5M7.5 4.25v11.5" /><rect x="13.25" y="11.25" width="3.5" height="4.5" fill="currentColor" stroke="none" /></svg>
);
/** Camera: a viewfinder with its focus point. */
export const IconCamera = (p: P) => (
  <svg {...base(p)}><path d="M2.75 6.25v-3.5h3.5M13.75 2.75h3.5v3.5M17.25 13.75v3.5h-3.5M6.25 17.25h-3.5v-3.5" /><circle cx="10" cy="10" r="1.75" fill="currentColor" stroke="none" /></svg>
);
/** Background: a field of moving lines in a frame. */
export const IconBackground = (p: P) => (
  <svg {...base(p)}><rect x="2.75" y="2.75" width="14.5" height="14.5" /><path d="M2.75 12c2.4-2.4 4.8 2.4 7.25 0s4.85 2.4 7.25 0" /><path d="M2.75 7.5c2.4-2.4 4.8 2.4 7.25 0s4.85 2.4 7.25 0" opacity=".45" /></svg>
);
/** Palette: three swatches stepping from ground to accent. */
export const IconPalette = (p: P) => (
  <svg {...base(p)}><rect x="2.75" y="10.75" width="4.5" height="6.5" /><rect x="7.75" y="6.75" width="4.5" height="10.5" /><rect x="12.75" y="2.75" width="4.5" height="14.5" fill="currentColor" /></svg>
);
/** Font pair: a serif and a sans letter side by side. */
export const IconFont = (p: P) => (
  <svg {...base(p)}><path d="M2.5 16.25 6.25 3.75 10 16.25M3.9 11.75h4.7" /><path d="M13 16.25V8.75M13 8.75h4.25M13 12.25h3.5" /><path d="M1.75 16.25h2M9 16.25h2" /></svg>
);
/** Recipe: a strip of three frames, the middle one active. */
export const IconRecipe = (p: P) => (
  <svg {...base(p)}><rect x="1.75" y="5.75" width="4.5" height="8.5" /><rect x="7.75" y="4.25" width="4.5" height="11.5" fill="currentColor" /><rect x="13.75" y="5.75" width="4.5" height="8.5" /></svg>
);
/** Block: a frame holding a ready-made piece, one part lit. */
export const IconBlock = (p: P) => (
  <svg {...base(p)}><rect x="2.75" y="3.75" width="14.5" height="12.5" /><path d="M5.75 7.25h5M5.75 10h3" /><rect x="10.75" y="9.75" width="4" height="3.5" fill="currentColor" stroke="none" /></svg>
);

export const TYPE_ICONS: Record<string, (p: P) => React.ReactElement> = {
  component: IconComponent, transition: IconTransition, text: IconText, camera: IconCamera,
  background: IconBackground, palette: IconPalette, "font-pair": IconFont, recipe: IconRecipe, shot: IconCamera, block: IconBlock,
};

/** Search: a square lens and its handle. */
export const IconSearch = (p: P) => (
  <svg {...base(p)}><rect x="3.25" y="3.25" width="9.5" height="9.5" /><path d="m12.75 12.75 4 4" /></svg>
);
export const IconCopy = (p: P) => (
  <svg {...base(p)}><rect x="6.75" y="6.75" width="10.5" height="10.5" /><path d="M3.25 13V3.25H13" /></svg>
);
export const IconCheck = (p: P) => (<svg {...base(p)}><path d="m3.75 10.5 4 4 8.5-9" /></svg>);
export const IconPlay = (p: P) => (<svg {...base(p)}><path d="M6 3.75v12.5L16 10z" fill="currentColor" /></svg>);
export const IconPause = (p: P) => (<svg {...base(p)}><path d="M6.5 4v12M13.5 4v12" strokeWidth="2.25" /></svg>);
export const IconReplay = (p: P) => (
  <svg {...base(p)}><path d="M4.25 10a5.75 5.75 0 1 0 1.7-4.1" /><path d="M3.75 2.75v3.75H7.5" /></svg>
);
export const IconExpand = (p: P) => (
  <svg {...base(p)}><path d="M3.25 7.75v-4.5h4.5M12.25 3.25h4.5v4.5M16.75 12.25v4.5h-4.5M7.75 16.75h-4.5v-4.5" /></svg>
);
export const IconCollapse = (p: P) => (
  <svg {...base(p)}><path d="M7.75 3.25v4.5h-4.5M16.75 7.75h-4.5v-4.5M12.25 16.75v-4.5h4.5M3.25 12.25h4.5v4.5" /></svg>
);
export const IconPlus = (p: P) => (<svg {...base(p)}><path d="M10 3.75v12.5M3.75 10h12.5" /></svg>);
export const IconMinus = (p: P) => (<svg {...base(p)}><path d="M3.75 10h12.5" /></svg>);
export const IconClose = (p: P) => (<svg {...base(p)}><path d="m4.5 4.5 11 11M15.5 4.5l-11 11" /></svg>);
export const IconArrow = (p: P) => (<svg {...base(p)}><path d="M3.25 10h13M11.5 5.25 16.25 10l-4.75 4.75" /></svg>);
export const IconLink = (p: P) => (
  <svg {...base(p)}><path d="M8.5 11.5 11.5 8.5" /><path d="m9.25 5.5 1.5-1.5a3.2 3.2 0 0 1 4.5 4.5l-1.5 1.5M10.75 14.5l-1.5 1.5a3.2 3.2 0 0 1-4.5-4.5l1.5-1.5" /></svg>
);
/** Kit: a case with a fold, holding what you picked. */
export const IconKit = (p: P) => (
  <svg {...base(p)}><rect x="2.75" y="6.25" width="14.5" height="10.5" /><path d="M7.25 6.25V3.25h5.5v3" /><path d="M2.75 10.75h14.5" /><rect x="8.75" y="9.5" width="2.5" height="2.5" fill="currentColor" stroke="none" /></svg>
);
/** Agent: a prompt chevron and an answer bar. */
export const IconAgent = (p: P) => (
  <svg {...base(p)}><path d="m3.75 5.75 4.25 4.25-4.25 4.25" /><path d="M10.25 14.25h6" /></svg>
);
/** Spark: a four-point star, for the guided start. */
export const IconSpark = (p: P) => (
  <svg {...base(p)}><path d="M10 2.5c.6 4.4 3.1 6.9 7.5 7.5-4.4.6-6.9 3.1-7.5 7.5-.6-4.4-3.1-6.9-7.5-7.5 4.4-.6 6.9-3.1 7.5-7.5Z" /></svg>
);
/** Brand: a drop of the brand's own color. */
export const IconBrand = (p: P) => (
  <svg {...base(p)}><path d="M10 2.75 5.25 9.5a5.4 5.4 0 1 0 9.5 0Z" /><path d="M8 12.5a2.2 2.2 0 0 0 2 2" /></svg>
);
/** Browse: a grid with one cell picked. */
export const IconGrid = (p: P) => (
  <svg {...base(p)}><rect x="2.75" y="2.75" width="6" height="6" /><rect x="11.25" y="2.75" width="6" height="6" fill="currentColor" /><rect x="2.75" y="11.25" width="6" height="6" /><rect x="11.25" y="11.25" width="6" height="6" /></svg>
);
export const IconChevron = (p: P) => (<svg {...base(p)}><path d="m7.25 4.75 5.25 5.25-5.25 5.25" /></svg>);
export const IconBook = (p: P) => (
  <svg {...base(p)}><path d="M3.25 3.75h5.5c.7 0 1.25.55 1.25 1.25v11.25c0-.7-.55-1.25-1.25-1.25h-5.5zM16.75 3.75h-5.5c-.7 0-1.25.55-1.25 1.25v11.25c0-.7.55-1.25 1.25-1.25h5.5z" /></svg>
);
export const IconFile = (p: P) => (
  <svg {...base(p)}><path d="M4.25 2.75h7.5l4 4v10.5H4.25z" /><path d="M11.75 2.75v4h4" /></svg>
);
