import Link from "next/link";
import { getResource, typeTitle, type IndexItem } from "@/lib/registry";
import { TYPE_ICONS } from "./icons";
import { KitButton } from "./kit-button";
import { ResourcePreview } from "./resource-preview";

export function ResourceCard({ item }: { item: IndexItem }) {
  const full = ["background", "palette", "font-pair"].includes(item.type) ? getResource(item.id) : null;
  const Icon = TYPE_ICONS[item.type];
  return (
    <Link href={`/r/${item.id}`} className="group block">
      <div className="relative aspect-video overflow-hidden rounded-lg border border-line bg-surface transition-colors group-hover:border-faint">
        <ResourcePreview item={item} full={full} />
        <div className="absolute right-2.5 top-2.5"><KitButton id={item.id} type={item.type} title={item.title} /></div>
      </div>
      <div className="mt-3 flex items-baseline justify-between gap-3">
        <h3 className="truncate text-[15px] font-medium">{item.title}</h3>
        <code className="shrink-0 font-mono text-[11px] text-faint">{item.id}</code>
      </div>
      <p className="mt-1 line-clamp-2 text-[13px] leading-snug text-muted">{item.summary}</p>
      <div className="mt-2 flex items-center gap-1.5 text-[12px] text-faint"><Icon size={13} />{typeTitle(item.type)}</div>
    </Link>
  );
}
