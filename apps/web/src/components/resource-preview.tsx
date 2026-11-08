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
        <div className={`flex flex-1 flex-col justify-center ${hero ? "px-12" : "px-6"}`}>
          <div className={`font-serif tracking-[-0.03em] ${hero ? "text-[96px] leading-none" : "text-[44px] leading-none"}`} style={{ color: c.figure.hex }}>
            {item.title}
          </div>
          <div className={`mt-3 font-mono ${hero ? "text-[15px]" : "text-[11px]"}`} style={{ color: c.muted.hex }}>
            ground · figure · muted · surface · <span style={{ color: c.accent.hex }}>accent</span>
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
        {[...new Set(links)].map((href) => (
          // eslint-disable-next-line @next/next/no-page-custom-font
          <link key={href} rel="stylesheet" href={href} />
        ))}
        <div className={`truncate leading-none tracking-[-0.02em] ${hero ? "text-[110px]" : "text-[52px]"}`} style={{ fontFamily: `'${f.display.family}'`, fontWeight: 600 }}>
          Aa Motion
        </div>
        <div className={`mt-3 text-muted ${hero ? "text-[22px]" : "text-[14px]"}`} style={{ fontFamily: `'${f.text.family}'` }}>
          Videos for people who use coding agents.
        </div>
        <div className={`mt-2 text-faint ${hero ? "text-[14px]" : "text-[11px]"}`} style={{ fontFamily: `'${f.mono.family}'` }}>
          {f.display.family} / {f.text.family} / {f.mono.family}
        </div>
      </div>
    );
  }
  return (
    <div className="grid-bg flex h-full w-full items-center justify-center bg-surface">
      <div className="text-center">
        <div className={`font-pixel text-paper ${hero ? "text-[64px]" : "text-[30px]"}`}>{item.title}</div>
        <div className="mt-2 font-mono text-[11px] text-faint">preview rendering soon</div>
      </div>
    </div>
  );
}
