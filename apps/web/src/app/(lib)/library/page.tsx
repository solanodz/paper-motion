import type { Metadata } from "next";
import { Suspense } from "react";
import { LibraryControls } from "@/components/library-controls";
import { ResourceCard } from "@/components/resource-card";
import { getIndex, TYPES } from "@/lib/registry";
import { TYPE_ICONS } from "@/components/icons";

export const metadata: Metadata = { title: "Library" };

export default function LibraryPage() {
  const { items } = getIndex();
  const meta = items.map((i) => ({ id: i.id, type: i.type, text: [i.id, i.title, i.summary, ...i.tags].join(" ").toLowerCase() }));
  const tabs = TYPES.map((t) => ({ type: t.type, short: t.short, count: items.filter((i) => i.type === t.type).length })).filter((t) => t.count);

  return (
    <div className="pb-24">
      <div className="pb-8 pt-14">
        <h1 className="font-serif text-[52px] leading-none tracking-[-0.03em] md:text-[80px]">Library</h1>
        <p className="mt-4 max-w-[60ch] text-[16px] text-muted">
          Every resource has a name. Copy the ones you want into your prompt, or run{" "}
          <code className="font-mono text-[14px] text-figure">npx paper-motion add &lt;name&gt;</code>.
        </p>
      </div>
      <Suspense>
        <LibraryControls items={meta} tabs={tabs} />
      </Suspense>
      {TYPES.filter((t) => items.some((i) => i.type === t.type)).map((t) => (
        <section key={t.type} data-section={t.type} className="pt-12">
          <div className="flex items-baseline justify-between gap-4 border-b border-line pb-3">
            <h2 className="flex items-center gap-2.5 text-[20px] font-medium">{(() => { const I = TYPE_ICONS[t.type]; return <I size={18} className="text-paper" />; })()}{t.title}</h2>
            <p className="hidden text-[13px] text-muted md:block">{t.blurb}</p>
          </div>
          <div className="mt-6 grid gap-x-6 gap-y-10 sm:grid-cols-2 xl:grid-cols-3">
            {items
              .filter((i) => i.type === t.type)
              .map((item) => (
                <div key={item.id} data-card={item.id}>
                  <ResourceCard item={item} />
                </div>
              ))}
          </div>
        </section>
      ))}
    </div>
  );
}
