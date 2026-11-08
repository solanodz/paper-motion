import type { Metadata } from "next";
import { getIndex } from "@/lib/registry";
import { KitView } from "./kit-view";

export const metadata: Metadata = { title: "Your kit" };

export default function KitPage() {
  const { site } = getIndex();
  return (
    <div className="pb-24">
      <div className="pt-12">
        <h1 className="font-serif text-[48px] leading-none tracking-[-0.03em] md:text-[72px]">Your kit</h1>
        <p className="mt-4 max-w-[60ch] text-[16px] leading-relaxed text-muted">Everything your agent needs to make the video, with your settings. It stays in this browser.</p>
      </div>
      <KitView site={site} />
    </div>
  );
}
