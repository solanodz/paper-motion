"use client";

import { useRef } from "react";

/** A poster that plays its clip while the pointer is over the card (or always, on the resource page). */
export function HoverVideo({ src, poster, autoPlay = false }: { src: string; poster?: string; autoPlay?: boolean }) {
  const ref = useRef<HTMLVideoElement>(null);
  const play = () => {
    const v = ref.current;
    if (v) v.play().catch(() => {});
  };
  const stop = () => {
    const v = ref.current;
    if (v) {
      v.pause();
      v.currentTime = 0;
    }
  };
  return (
    <video
      ref={ref}
      src={src}
      poster={poster}
      muted
      loop
      playsInline
      autoPlay={autoPlay}
      preload={autoPlay ? "auto" : "none"}
      onPointerEnter={autoPlay ? undefined : play}
      onPointerLeave={autoPlay ? undefined : stop}
      className="block h-full w-full bg-black object-cover"
    />
  );
}
