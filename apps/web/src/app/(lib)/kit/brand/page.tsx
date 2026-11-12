import type { Metadata } from "next";
import Link from "next/link";
import { IconArrow } from "@/components/icons";
import { BrandForm } from "./brand-form";

export const metadata: Metadata = { title: "Bring your brand" };

export default function BrandPage() {
  return (
    <>
      <div className="pt-6">
        <Link href="/kit" className="btn btn-sm"><IconArrow size={14} className="rotate-180" />Back to your kit</Link>
      </div>
      <div className="flex flex-wrap items-end justify-between gap-x-10 gap-y-4 pb-9 pt-8 md:pt-10">
        <h1 className="display">Bring your brand</h1>
        <p className="max-w-[46ch] pb-2 text-[15px] leading-relaxed text-muted">
          Your colors and fonts. Every live preview switches to them, the boards your agent sends included. Your agent can also set
          this from your brand folder; here you can see it and adjust it.
        </p>
      </div>
      <BrandForm />
    </>
  );
}
