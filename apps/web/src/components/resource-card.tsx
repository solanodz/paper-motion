import Link from "next/link";
import { getResource, typeTitle, type IndexItem } from "@/lib/registry";
import { TYPE_ICONS } from "./icons";
import { KitButton } from "./kit-button";
import { ResourcePreview } from "./resource-preview";

/** A resource as a cell of a contact sheet (put it in a `.sheet`): its preview, then a caption that inverts on hover. */
export function ResourceCard({ item }: { item: IndexItem }) {
  const full = ["background", "palette", "font-pair"].includes(item.type) ? getResource(item.id) : null;
  const Icon = TYPE_ICONS[item.type];
  return (
    <Link href={`/r/${item.id}`} className="group flex h-full flex-col bg-ground">
      <div className="relative aspect-video overflow-hidden border-b border-line bg-surface">
        <ResourcePreview item={item} full={full} />
        <div className="absolute right-2 top-2"><KitButton id={item.id} type={item.type} title={item.title} /></div>
      </div>
      <div className="flex flex-1 flex-col gap-1.5 px-4 pb-4 pt-3 group-hover:bg-figure group-hover:text-ground">
        <div className="flex items-baseline justify-between gap-3">
          <h3 className="truncate text-[15px] font-medium">{item.title}</h3>
          <code className="shrink-0 font-mono text-[11px] text-muted group-hover:text-ground/60">{item.id}</code>
        </div>
        <p className="line-clamp-2 text-[13px] leading-snug text-muted group-hover:text-ground/70">{item.summary}</p>
        <div className="mt-auto flex items-center gap-1.5 pt-1.5 text-[12px] text-faint group-hover:text-ground/60"><Icon size={13} />{typeTitle(item.type)}</div>
      </div>
    </Link>
  );
}
