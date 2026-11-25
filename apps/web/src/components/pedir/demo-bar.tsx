"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { STEPS } from "@/lib/pedir";

/** A strip under the header that only the demo has: jump to any step of the client's path. */
export function DemoBar() {
  const path = usePathname();
  return (
    <div className="flex items-stretch overflow-x-auto border-b border-line bg-surface">
      <span className="flex shrink-0 items-center px-5 md:px-8">
        <span className="tag tag-warn">Demo</span>
      </span>
      <nav className="cells text-[13px] [&>*]:h-11">
        {STEPS.map((s, i) => (
          <Link key={s.href} href={s.href} className={`cell ${path === s.href ? "cell-on" : ""}`}>
            <span className="num text-[14px] text-inherit">{i + 1}</span>
            {s.label}
          </Link>
        ))}
      </nav>
    </div>
  );
}
