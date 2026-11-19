"use client";

import { useEffect, useRef } from "react";
import { prefersReducedMotion } from "@/components/site/hooks";

/**
 * A short silent loop from public/videos. It downloads and plays only while it is on screen, stops with the
 * Pause motion button, and stays on its poster with reduced motion.
 */
export function LoopVideo({ name, className = "" }: { name: string; className?: string }) {
  const ref = useRef<HTMLVideoElement>(null);
  useEffect(() => {
    const v = ref.current;
    if (!v) return;
    const paused = () => document.documentElement.dataset.motion === "paused" || (!document.documentElement.dataset.motion && prefersReducedMotion());
    const io = new IntersectionObserver(([e]) => {
      v.dataset.visible = String(e.isIntersecting);
      if (e.isIntersecting && !paused()) v.play().catch(() => {});
      else v.pause();
    }, { threshold: 0.2 });
    io.observe(v);
    return () => io.disconnect();
  }, []);
  return (
    <video
      ref={ref}
      data-motion=""
      className={className}
      src={`/videos/${name}.mp4`}
      poster={`/videos/${name}-poster.webp`}
      muted
      loop
      playsInline
      preload="none"
      aria-hidden
      tabIndex={-1}
      width={960}
      height={540}
    />
  );
}
