"use client";

import dynamic from "next/dynamic";
import { Component, type ReactNode, useEffect, useRef, useState } from "react";
import { markHeroVideoReady } from "@/components/motion/heroReady";
import { applyMobileProfile } from "@/components/hero3d/tweakConfig";

/**
 * HeroCanvas — the living 3D scene (R3F), on every device that can run it.
 *
 *   1. WebGL2-capable device (desktop AND mobile) → the living 3D scene (R3F).
 *      Touch devices get the mobile quality profile (fewer instances, lower
 *      DPR cap, no DoF/CA) so the real shaders run on phones too.
 *   2. no WebGL2 / runtime crash / reduced motion → a plain dark canvas
 *      (#04070d). The old light-trails VIDEO fallback has been removed — the
 *      scene is the one background now.
 *
 * The 3D scene is dynamically imported (three stays out of the initial bundle
 * and out of SSR). Whichever branch mounts signals the door loader via
 * markHeroVideoReady — with an 8s failsafe so the door can never dead-lock.
 */

const Scene = dynamic(() => import("@/components/hero3d/Scene"), {
  ssr: false,
});

/** Plain dark fill for devices that can't run the scene. Also unblocks the
 *  loader so the door never waits on a background that will never signal. */
function DarkFallback() {
  useEffect(() => {
    markHeroVideoReady();
  }, []);
  return null;
}

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
  const [mode, setMode] = useState<"scene" | "dark" | null>(null);
  const [active, setActive] = useState(true);

  useEffect(() => {
    // coarse pointer → overlay the mobile quality profile BEFORE the scene
    // mounts, so the meshes first build at the reduced counts
    if (window.matchMedia("(pointer: coarse)").matches) applyMobileProfile();
    setMode(supportsScene() ? "scene" : "dark");
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
      {mode === "dark" && <DarkFallback />}

      {mode === "scene" && (
        <SceneErrorBoundary fallback={<DarkFallback />}>
          <Scene active={active} />
          {/* readability layer — keeps the cream headline crisp over the
              brightest moments of the scene (same intent as the Figma 57% fill) */}
          <div className="absolute inset-0 bg-[radial-gradient(90%_70%_at_50%_50%,rgba(2,5,10,0.38),rgba(2,5,10,0.62))]" />
        </SceneErrorBoundary>
      )}
    </div>
  );
}
