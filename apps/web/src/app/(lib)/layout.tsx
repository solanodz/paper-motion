import { Sidebar } from "@/components/sidebar";
import { getIndex, TYPES } from "@/lib/registry";

/** Library, resource pages and docs share a left menu, like a component library. */
export default function LibLayout({ children }: LayoutProps<"/">) {
  const { items } = getIndex();
  const sections = TYPES.map((t) => ({
    type: t.type,
    title: t.title,
    items: items.filter((i) => i.type === t.type).map((i) => ({ id: i.id, title: i.title })),
  })).filter((s) => s.items.length);
  return (
    <div className="flex">
      <Sidebar sections={sections} />
      <div className="min-w-0 flex-1 px-5 md:px-10">{children}</div>
    </div>
  );
}
