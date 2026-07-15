"use client";

import { useEffect, useMemo, useState, useSyncExternalStore } from "react";
import { Canvas } from "@react-three/fiber";
import { PerformanceMonitor } from "@react-three/drei";
import {
  EffectComposer,
  Bloom,
  DepthOfField,
  ChromaticAberration,
  Vignette,
  Noise,
} from "@react-three/postprocessing";
import { createSceneState } from "@/components/hero3d/SceneState";
import { SceneController, CameraRig } from "@/components/hero3d/SceneController";
import {
  FiberField,
  Particles,
  EnergyNodes,
  Fragments,
} from "@/components/hero3d/worldObjects";
import { WorksProjectNode } from "@/components/hero3d/WorksNode";
import { markHeroVideoReady } from "@/components/motion/heroReady";
import { tweak, subscribeTweak, getRevision } from "@/components/hero3d/tweakConfig";

/**
 * The hero scene — an infinite luminous ecosystem (fibers / particles / energy
 * nodes / latent fragments) with cinematic post. Mounted client-only via
 * next/dynamic in HeroCanvas.
 *
 * `active` pauses the frameloop when the hero is off-screen or the tab hidden.
 * Signals the door loader (markHeroVideoReady) after the first painted frame.
 */
export default function Scene({ active }: { active: boolean }) {
  const state = useMemo(() => createSceneState(), []);
  const [dpr, setDpr] = useState<number>(1.5);

  // release the door once the first frame has actually painted
  useEffect(() => {
    let raf2 = 0;
    const raf1 = requestAnimationFrame(() => {
      raf2 = requestAnimationFrame(() => markHeroVideoReady());
    });
    return () => {
      cancelAnimationFrame(raf1);
      cancelAnimationFrame(raf2);
    };
  }, []);

  return (
    <Canvas
      frameloop={active ? "always" : "never"}
      dpr={dpr}
      gl={{
        antialias: false,
        alpha: false,
        powerPreference: "high-performance",
        stencil: false,
        depth: true,
      }}
      camera={{ fov: 58, near: 0.1, far: 160, position: [0, 0, 0.1] }}
      style={{ position: "absolute", inset: 0 }}
    >
      <color attach="background" args={["#04070d"]} />

      {/* degrade gracefully on weaker GPUs, recover on strong ones */}
      <PerformanceMonitor
        onDecline={() => setDpr(1)}
        onIncline={() => setDpr(Math.min(window.devicePixelRatio, 1.75))}
      />

      <SceneController state={state} />
      <CameraRig state={state} />

      <FiberField state={state} />
      <Particles state={state} />
      <EnergyNodes state={state} />
      <Fragments state={state} />

      {/* the works chapter's summoned project node — a real energy cuboid
          driven by the DOM works ticker via heroScroll.worksNode */}
      <WorksProjectNode state={state} />

      <PostFX />
    </Canvas>
  );
}

/**
 * Post-processing stack. Split out and subscribed to the tweak store so the dev
 * panel can retune bloom / DoF / grade live (these are declarative props, not
 * per-frame uniforms). When a preset is locked, these become baked prop values.
 */
function PostFX() {
  useSyncExternalStore(subscribeTweak, getRevision, getRevision);
  const { bloom, dof, grade } = tweak;
  const ca = grade.chromaticAberration;
  return (
    <EffectComposer multisampling={0}>
      <Bloom
        intensity={bloom.intensity}
        luminanceThreshold={bloom.threshold}
        luminanceSmoothing={bloom.smoothing}
        mipmapBlur
      />
      <DepthOfField
        focusDistance={dof.focusDistance}
        focalLength={dof.focalLength}
        bokehScale={dof.bokehScale}
      />
      <ChromaticAberration offset={[ca, ca * 0.66]} />
      <Vignette offset={grade.vignetteOffset} darkness={grade.vignetteDarkness} />
      <Noise premultiply opacity={grade.noiseOpacity} />
    </EffectComposer>
  );
}
