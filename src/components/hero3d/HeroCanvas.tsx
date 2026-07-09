"use client";

import dynamic from "next/dynamic";
import { Component, type ReactNode, useEffect, useRef, useState } from "react";
import { VideoBackground } from "@/components/motion/VideoBackground";
import { markHeroVideoReady } from "@/components/motion/heroReady";

/**
 * HeroCanvas — chooses the richest background the device can honor:
 *
 *   1. WebGL2-capable fine-pointer desktop → the living 3D scene (R3F)
 *   2. touch devices / no WebGL2 / runtime crash → the light-trails VIDEO
 *      (VideoBackground — which itself falls back to poster for reduced motion)
 *   3. reduced motion → VideoBackground's poster still
 *
 * The 3D scene is dynamically imported (three stays out of the initial bundle
 * and out of SSR). Whichever branch mounts signals the door loader via
 * markHeroVideoReady — with an 8s failsafe so the door can never dead-lock.
 */

const Scene = dynamic(() => import("@/components/hero3d/Scene"), {
  ssr: false,
});

class SceneErrorBoundary extends Component<
  { fallback: ReactNode; children: ReactNode },
  { failed: boolean }
> {
  state = { failed: false };
  static getDerivedStateFromError() {
    return { failed: true };
  }
  componentDidCatch() {
    markHeroVideoReady(); // never leave the door locked
  }
  render() {
    return this.state.failed ? this.props.fallback : this.props.children;
  }
}

function supportsScene(): boolean {
  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return false;
  if (window.matchMedia("(pointer: coarse)").matches) return false;
  try {
    const canvas = document.createElement("canvas");
    return !!canvas.getContext("webgl2");
  } catch {
    return false;
  }
}

export function HeroCanvas() {
  const ref = useRef<HTMLDivElement>(null);
  // null = deciding (SSR/first paint) — render nothing heavy yet
  const [mode, setMode] = useState<"scene" | "video" | null>(null);
  const [active, setActive] = useState(true);

  useEffect(() => {
    setMode(supportsScene() ? "scene" : "video");
    // failsafe: never let the door loader hang on us
    const t = window.setTimeout(markHeroVideoReady, 8000);
    return () => window.clearTimeout(t);
  }, []);

  // pause the frameloop when the hero is off-screen or the tab is hidden
  useEffect(() => {
    if (mode !== "scene") return;
    const el = ref.current;
    if (!el) return;
    let inView = true;
    const update = () => setActive(inView && !document.hidden);
    const io = new IntersectionObserver(
      ([entry]) => {
        inView = entry.isIntersecting;
        update();
      },
      { threshold: 0.01 },
    );
    io.observe(el);
    document.addEventListener("visibilitychange", update);
    return () => {
      io.disconnect();
      document.removeEventListener("visibilitychange", update);
    };
  }, [mode]);

  return (
    <div
      ref={ref}
      className="pointer-events-none absolute inset-0 overflow-hidden bg-[#04070d]"
      aria-hidden="true"
    >
      {mode === "video" && <VideoBackground />}

      {mode === "scene" && (
        <SceneErrorBoundary fallback={<VideoBackground />}>
          <Scene active={active} />
          {/* readability layer — keeps the cream headline crisp over the
              brightest moments of the scene (same intent as the Figma 57% fill) */}
          <div className="absolute inset-0 bg-[radial-gradient(90%_70%_at_50%_50%,rgba(2,5,10,0.38),rgba(2,5,10,0.62))]" />
        </SceneErrorBoundary>
      )}
    </div>
  );
}
