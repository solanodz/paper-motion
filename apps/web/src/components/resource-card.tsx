import Link from "next/link";
import { getResource, typeTitle, type IndexItem } from "@/lib/registry";
import { ResourcePreview } from "./resource-preview";

export function ResourceCard({ item }: { item: IndexItem }) {
  const full = ["background", "palette", "font-pair"].includes(item.type) ? getResource(item.id) : null;
  return (
    <Link href={`/r/${item.id}`} className="group block">
      <div className="aspect-video overflow-hidden rounded-lg border border-line bg-surface transition-colors group-hover:border-faint">
        <ResourcePreview item={item} full={full} />
      </div>
      <div className="mt-3 flex items-baseline justify-between gap-3">
        <h3 className="truncate text-[15px] font-medium">{item.title}</h3>
        <code className="shrink-0 font-mono text-[11px] text-faint">{item.id}</code>
      </div>
      <p className="mt-1 line-clamp-2 text-[13px] leading-snug text-muted">{item.summary}</p>
      <div className="mt-2 font-mono text-[10.5px] uppercase tracking-[0.08em] text-faint">{typeTitle(item.type)}</div>
    </Link>
  );
}
