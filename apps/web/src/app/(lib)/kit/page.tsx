import type { Metadata } from "next";
import { getIndex } from "@/lib/registry";
import { KitView } from "./kit-view";

export const metadata: Metadata = { title: "Your kit" };

export default function KitPage() {
  const { site } = getIndex();
  return (
    <>
      <div className="flex flex-wrap items-end justify-between gap-x-10 gap-y-4 pb-9 pt-12 md:pt-16">
        <h1 className="display">Your kit</h1>
        <p className="max-w-[44ch] pb-2 text-[15px] leading-relaxed text-muted">Everything your agent needs to make the video, with your settings. It stays in this browser.</p>
      </div>
      <KitView site={site} />
    </>
  );
}
