import { hasPreview, type IndexItem, type Resource } from "@/lib/registry";
import { HoverVideo } from "./hover-video";
import { ShaderPreview } from "./shader-preview";

type Colors = Record<string, { hex: string }>;
type Fonts = Record<string, { family: string; css?: string }>;

/**
 * What a resource looks like: its rendered clip when there is one, otherwise a live view built from its data
 * (a Paper shader, palette swatches, a type specimen) or a quiet placeholder for moves.
 */
export function ResourcePreview({ item, full, size = "card" }: { item: IndexItem; full?: Resource | null; size?: "card" | "hero" }) {
  const hero = size === "hero";
  if (hasPreview(item.preview?.video)) {
    return <HoverVideo src={`/${item.preview!.video}`} poster={hasPreview(item.preview?.poster) ? `/${item.preview!.poster}` : undefined} autoPlay={hero} />;
  }
  const entry = full?.install?.entry as Record<string, unknown> | undefined;
  if (item.type === "background" && entry) {
    return <ShaderPreview entry={entry as { shader: string; props: Record<string, unknown> }} className="h-full w-full" />;
  }
  if (item.type === "palette" && entry) {
    const c = entry.colors as Colors;
    const ramp = (entry.ramp as string[]) ?? [];
    return (
      <div className="flex h-full w-full flex-col" style={{ background: c.ground.hex }}>
        <div className={`flex min-h-0 flex-1 flex-col justify-center ${hero ? "px-12" : "px-6"}`}>
          <div className={`font-serif leading-none tracking-[-0.03em] ${hero ? "text-[96px]" : "text-[44px]"}`} style={{ color: c.figure.hex }}>
            {item.title}
          </div>
          {/* the roles, each a word of its own; the accent in its color */}
          <div className={`mt-3 flex flex-wrap gap-y-1 font-mono ${hero ? "gap-x-5 text-[15px]" : "gap-x-3 text-[11px]"}`} style={{ color: c.muted.hex }}>
            <span>ground</span><span>figure</span><span>muted</span><span>surface</span><span style={{ color: c.accent.hex }}>accent</span>
          </div>
        </div>
        <div className="flex h-[22%]">
          {[c.surface.hex, ...ramp.slice(1), c.accent.hex].map((hex, i) => (
            <div key={i} className="flex-1" style={{ background: hex }} />
          ))}
        </div>
      </div>
    );
  }
  if (item.type === "font-pair" && entry) {
    const f = entry.fonts as Fonts;
    const links = Object.values(f).map((x) => x.css).filter(Boolean) as string[];
    return (
      <div className={`flex h-full w-full flex-col justify-center bg-raised ${hero ? "px-12" : "px-6"}`}>
        {[...new Set(links)].map((href) => <link key={href} rel="stylesheet" href={href} />)}
        <div className={`truncate leading-none tracking-[-0.02em] ${hero ? "text-[110px]" : "text-[52px]"}`} style={{ fontFamily: `'${f.display.family}'`, fontWeight: 600 }}>
          Aa Motion
        </div>
        <div className={`mt-3 text-muted ${hero ? "text-[22px]" : "text-[14px]"}`} style={{ fontFamily: `'${f.text.family}'` }}>
          Videos for people who use coding agents.
        </div>
        {/* the three families, each on its own */}
        <div className={`mt-2.5 flex flex-wrap gap-y-0.5 text-muted ${hero ? "gap-x-5 text-[14px]" : "gap-x-3 text-[11px]"}`} style={{ fontFamily: `'${f.mono.family}'` }}>
          <span>{f.display.family}</span><span>{f.text.family}</span><span>{f.mono.family}</span>
        </div>
      </div>
    );
  }
  return (
    <div className="grid-bg flex h-full w-full items-center justify-center bg-surface px-5">
      <div className="min-w-0 text-center">
        <div className={`truncate font-serif leading-none tracking-[-0.02em] text-figure ${hero ? "text-[64px]" : "text-[30px]"}`}>{item.title}</div>
        <div className="mt-3 font-mono text-[11px] text-muted">Preview rendering soon</div>
      </div>
    </div>
  );
}
