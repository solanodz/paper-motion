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
    <div className="pb-28">
      <div className="flex flex-wrap items-end justify-between gap-x-10 gap-y-4 pb-9 pt-12 md:pt-16">
        <h1 className="display">Library</h1>
        <p className="max-w-[44ch] pb-2 text-[15px] text-muted">
          Every resource has a name. Say the ones you want to your agent, or install one with{" "}
          <code className="font-mono text-[13px] text-figure">npx paper-motion add &lt;name&gt;</code>.
        </p>
      </div>
      <Suspense>
        <LibraryControls items={meta} tabs={tabs} />
      </Suspense>
      {TYPES.filter((t) => items.some((i) => i.type === t.type)).map((t) => {
        const Icon = TYPE_ICONS[t.type];
        return (
          <section key={t.type} data-section={t.type} className="pt-14">
            <div className="flex flex-wrap items-end justify-between gap-x-8 gap-y-2 pb-5">
              <h2 className="flex items-center gap-3 font-serif text-[30px] leading-none tracking-[-0.02em] md:text-[36px]"><Icon size={20} className="text-paper" />{t.title}</h2>
              <p className="max-w-[60ch] text-[13px] text-muted">{t.blurb}</p>
            </div>
            <div className="sheet sm:grid-cols-2 xl:grid-cols-3 min-[1800px]:grid-cols-4">
              {items
                .filter((i) => i.type === t.type)
                .map((item) => (
                  <div key={item.id} data-card={item.id}>
                    <ResourceCard item={item} />
                  </div>
                ))}
            </div>
          </section>
        );
      })}
    </div>
  );
}
