"use client";

import { useEffect, useRef, useState } from "react";

type Entry = { shader: string; props: Record<string, unknown>; image?: string; background?: string };

/**
 * A live Paper shader for one background resource. It mounts only while on screen, so a page of
 * cards never holds more WebGL contexts than the browser allows.
 */
export function ShaderPreview({ entry, className = "", still = false }: { entry: Entry; className?: string; still?: boolean }) {
  const box = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);
  const [Comp, setComp] = useState<React.ComponentType<Record<string, unknown>> | null>(null);

  useEffect(() => {
    const el = box.current;
    if (!el) return;
    const io = new IntersectionObserver(([e]) => setVisible(e.isIntersecting), { rootMargin: "120px" });
    io.observe(el);
    return () => io.disconnect();
  }, []);

  useEffect(() => {
    if (!visible || Comp) return;
    let alive = true;
    import("@paper-design/shaders-react").then((mod) => {
      const C = (mod as unknown as Record<string, React.ComponentType<Record<string, unknown>>>)[entry.shader];
      if (alive && C) setComp(() => C);
    });
    return () => {
      alive = false;
    };
  }, [visible, Comp, entry.shader]);

  const image =
    entry.image === "wordmark" || entry.image === "wordmark-dark"
      ? "/site/wordmark.png"
      : entry.image?.startsWith("assets/")
        ? `/files/${entry.image.split("/").pop()}`
        : (entry.props.image as string | undefined);
  const props = { ...entry.props, ...(image ? { image } : {}), ...(still ? { speed: 0 } : {}) };

  return (
    <div ref={box} className={`relative overflow-hidden ${className}`} style={{ background: entry.background ?? "#000" }}>
      {visible && Comp ? <Comp {...props} style={{ position: "absolute", inset: 0, width: "100%", height: "100%" }} /> : null}
    </div>
  );
}
