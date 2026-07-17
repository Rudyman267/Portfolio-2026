"use client";

import { Component, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import * as THREE from "three";
import { Canvas, useFrame } from "@react-three/fiber";
import { EffectComposer, Bloom } from "@react-three/postprocessing";
import { RoundedBoxGeometry } from "three/examples/jsm/geometries/RoundedBoxGeometry.js";
import { NOISE } from "@/components/hero3d/shaders";
import {
  tweak,
  getGeneration,
  subscribeTweak,
  applyMobileProfile,
  isMobileProfile,
} from "@/components/hero3d/tweakConfig";
import { useSyncExternalStore } from "react";

/**
 * FooterGlow — a whisper of the hero ecosystem behind the footer.
 *
 * ONLY the particles (square pixel motes) and energy nodes (fresnel rounded
 * cubes) from the hero — no fibers/lines, no fragments. Identical visual DNA:
 * same locked palette, same sprite/fresnel fragment shaders, same twinkle,
 * drift and breathe values from the shipped preset (read live from `tweak`).
 *
 * Motion is NEW and footer-specific: every instance lives on its own looping
 * life cycle — it emerges from BELOW the fold, rises gently into the lower
 * third of the viewport, then dissolves; seeds randomise the order so the
 * field feels continuous, never synchronized. Deliberately sparse — an
 * ambient afterglow, not a second hero.
 *
 * Fully GPU-driven (one uTime uniform per frame). The canvas renders only
 * while the footer is on screen (IntersectionObserver → frameloop) and skips
 * entirely for reduced-motion / no-WebGL2 — the footer is complete without it.
 */

/* ----------------------------------------------------------------------- */
/* shaders                                                                   */
/* ----------------------------------------------------------------------- */

/** Shared life-cycle envelope: emerge (fade+grow in) → live → dissolve. */
const LIFE_GLSL = /* glsl */ `
  float lifePhase(float seed, float life){
    return fract(seed * 7.31 + uTime / life);
  }
  float lifeEnv(float phase){
    return smoothstep(0.0, 0.18, phase) * (1.0 - smoothstep(0.68, 1.0, phase));
  }
`;

const glowParticleVertex = /* glsl */ `
  uniform float uTime;
  uniform float uPixelRatio;
  uniform float uDrift;
  ${NOISE}
  ${LIFE_GLSL}

  attribute float aSeed;
  attribute float aSize;
  attribute float aLife; /* seconds per cycle */
  attribute float aRise; /* world units risen over a full life */

  varying float vSeed;
  varying float vEnv;

  void main(){
    vSeed = aSeed;
    float phase = lifePhase(aSeed, aLife);
    float env = lifeEnv(phase);
    vEnv = env;

    vec3 p = position;
    /* rise out of the depths below the fold */
    p.y += phase * aRise;

    /* the hero's ambient drift, verbatim feel */
    float t = uTime * 0.12;
    p.x += (fbm(vec3(aSeed * 9.2, t, p.y * 0.05)) - 0.5) * uDrift;
    p.y += (fbm(vec3(aSeed * 4.6 + 3.0, t + 9.0, p.x * 0.05)) - 0.5) * uDrift * 0.45;

    vec4 mv = modelViewMatrix * vec4(p, 1.0);
    gl_Position = projectionMatrix * mv;

    /* hero twinkle + a size swell on emergence so they "pop" from below */
    float twinkle = 0.75 + 0.25 * sin(uTime * (1.0 + fract(aSeed * 7.7)) + aSeed * 40.0);
    gl_PointSize = aSize * uPixelRatio * twinkle * (0.55 + 0.45 * env) * (34.0 / -mv.z);
  }
`;

/** Identical look to the hero particle sprite — square pixel, seeded A→B mix,
 *  rare hot motes — with the life envelope standing in for the travel fade. */
const glowParticleFragment = /* glsl */ `
  precision highp float;
  uniform float uTime;
  uniform float uIntensity;
  uniform vec3 uColorA;
  uniform vec3 uColorB;
  uniform vec3 uColorHot;
  uniform float uAlpha;

  varying float vSeed;
  varying float vEnv;

  void main(){
    vec2 uv = gl_PointCoord - 0.5;
    float m = max(abs(uv.x), abs(uv.y));
    float disc = smoothstep(0.5, 0.38, m);

    vec3 col = mix(uColorA, uColorB, fract(vSeed * 11.3));
    col = mix(col, uColorHot, step(0.93, fract(vSeed * 5.1)) * 0.8);

    float alpha = disc * 0.34 * vEnv * uIntensity * uAlpha;
    gl_FragColor = vec4(col, alpha);
  }
`;

const glowNodeVertex = /* glsl */ `
  uniform float uTime;
  uniform float uBreathe;
  ${NOISE}
  ${LIFE_GLSL}

  attribute vec3 aOffset;
  attribute vec4 aParams; /* scale, seed, life, rise */

  varying vec3 vNormalW;
  varying vec3 vViewW;
  varying float vEnv;
  varying float vSeed;

  void main(){
    float scale = aParams.x;
    float seed  = aParams.y;
    vSeed = seed;

    float phase = lifePhase(seed, aParams.z);
    float env = lifeEnv(phase);
    vEnv = env;

    vec3 c = aOffset;
    c.y += phase * aParams.w;
    /* the hero node's wander, verbatim */
    c.x += (fbm(vec3(seed * 8.0, uTime * 0.1, 0.0)) - 0.5) * 2.0;
    c.y += (fbm(vec3(seed * 5.0 + 2.0, uTime * 0.1 + 4.0, 0.0)) - 0.5) * 2.0;

    float breathe = 1.0 + uBreathe * sin(uTime * 0.8 + seed * 6.28318);
    /* grow out of nothing as it emerges */
    vec3 world = c + position * scale * breathe * (0.4 + 0.6 * env);

    vNormalW = normalize(mat3(modelMatrix) * normal);
    vViewW = normalize(cameraPosition - world);
    gl_Position = projectionMatrix * modelViewMatrix * vec4(world, 1.0);
  }
`;

/** Identical to the hero node fragment (fresnel halo + hot core pulse). */
const glowNodeFragment = /* glsl */ `
  precision highp float;
  uniform float uTime;
  uniform float uIntensity;
  uniform vec3 uColorB;
  uniform vec3 uColorHot;
  uniform float uAlpha;

  varying vec3 vNormalW;
  varying vec3 vViewW;
  varying float vEnv;
  varying float vSeed;

  void main(){
    float fres = pow(1.0 - abs(dot(normalize(vNormalW), normalize(vViewW))), 2.0);
    float core = 1.0 - fres;

    float pulse = 0.6 + 0.4 * sin(uTime * (0.7 + fract(vSeed * 3.1)) + vSeed * 20.0);
    // brighter emissive so the boxes read as glowing light sources that Bloom
    // (footer post pass) can bleed into a soft halo — hot core pushed past 1.0.
    vec3 col = uColorB * (fres * 1.7 + 0.2) + uColorHot * core * 1.1 * pulse;

    float alpha = (fres * 0.85 + core * 0.32) * vEnv * uIntensity * uAlpha;
    gl_FragColor = vec4(col, alpha);
  }
`;

/* ----------------------------------------------------------------------- */
/* scene                                                                     */
/* ----------------------------------------------------------------------- */

const rand = (min: number, max: number) => min + Math.random() * (max - min);

/* Density + spawn/rise/life are now live-tunable via the dev panel's "Footer
 * Glow" group (tweak.footer). Defaults live in tweakConfig DEFAULT_TWEAK.footer:
 * a tasteful ambient afterglow — spawn below the fold (camera z=20, fov 50 →
 * viewport bottom ≈ -9.3), rise into the lower ~40% so text stays clear. */

function sharedUniforms() {
  return {
    uTime: { value: 0 },
    uIntensity: { value: tweak.scene.intensity },
    uColorA: { value: new THREE.Color(tweak.palette.colorA) },
    uColorB: { value: new THREE.Color(tweak.palette.colorB) },
    uColorHot: { value: new THREE.Color(tweak.palette.colorHot) },
  };
}

function GlowSystems() {
  const timeRefs = useRef<THREE.IUniform[]>([]);
  // rebuild the meshes whenever a rebuild-class dial changes (footer counts /
  // spawn / rise / life, or the shared particle/node ranges) — mirrors the hero.
  const generation = useSyncExternalStore(subscribeTweak, getGeneration, getGeneration);

  const particles = useMemo(() => {
    const { sizeMin, sizeMax } = tweak.particles;
    const f = tweak.footer;
    const COUNT = f.particleCount;
    const geo = new THREE.BufferGeometry();
    const pos = new Float32Array(COUNT * 3);
    const seed = new Float32Array(COUNT);
    const size = new Float32Array(COUNT);
    const life = new Float32Array(COUNT);
    const rise = new Float32Array(COUNT);
    for (let i = 0; i < COUNT; i++) {
      pos[i * 3 + 0] = rand(-20, 20);
      pos[i * 3 + 1] = rand(f.spawnMin, f.spawnMax);
      pos[i * 3 + 2] = rand(-6, 4);
      seed[i] = Math.random();
      size[i] = rand(sizeMin, sizeMax);
      life[i] = rand(f.lifeMin, f.lifeMax);
      rise[i] = rand(f.riseMin, f.riseMax);
    }
    geo.setAttribute("position", new THREE.BufferAttribute(pos, 3));
    geo.setAttribute("aSeed", new THREE.BufferAttribute(seed, 1));
    geo.setAttribute("aSize", new THREE.BufferAttribute(size, 1));
    geo.setAttribute("aLife", new THREE.BufferAttribute(life, 1));
    geo.setAttribute("aRise", new THREE.BufferAttribute(rise, 1));

    const mat = new THREE.ShaderMaterial({
      vertexShader: glowParticleVertex,
      fragmentShader: glowParticleFragment,
      uniforms: {
        ...sharedUniforms(),
        uAlpha: { value: tweak.particles.alpha },
        uDrift: { value: tweak.particles.drift },
        uPixelRatio: {
          // must match the Canvas dpr cap (1.3 on the mobile profile) or the
          // point sprites render at the wrong size relative to the buffer
          value:
            typeof window !== "undefined"
              ? Math.min(window.devicePixelRatio, isMobileProfile() ? 1.3 : 1.75)
              : 1,
        },
      },
      transparent: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
    });
    const p = new THREE.Points(geo, mat);
    p.frustumCulled = false;
    return p;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [generation]);

  const nodes = useMemo(() => {
    const { scaleMin, scaleMax } = tweak.nodes;
    const f = tweak.footer;
    const COUNT = f.nodeCount;
    const base = new RoundedBoxGeometry(1.6, 1.6, 1.6, 3, 0.28);
    const geo = new THREE.InstancedBufferGeometry();
    geo.index = base.index;
    geo.attributes = base.attributes;
    geo.instanceCount = COUNT;

    const offsets = new Float32Array(COUNT * 3);
    const params = new Float32Array(COUNT * 4);
    for (let i = 0; i < COUNT; i++) {
      offsets[i * 3 + 0] = rand(-17, 17);
      offsets[i * 3 + 1] = rand(f.spawnMin, f.spawnMax);
      offsets[i * 3 + 2] = rand(-5, 2);
      params[i * 4 + 0] = rand(scaleMin, scaleMax); // scale — hero preset range
      params[i * 4 + 1] = Math.random(); // seed
      params[i * 4 + 2] = rand(f.lifeMin * 1.2, f.lifeMax * 1.3); // nodes cycle slower
      params[i * 4 + 3] = rand(f.riseMin, f.riseMax * 0.85);
    }
    geo.setAttribute("aOffset", new THREE.InstancedBufferAttribute(offsets, 3));
    geo.setAttribute("aParams", new THREE.InstancedBufferAttribute(params, 4));

    const mat = new THREE.ShaderMaterial({
      vertexShader: glowNodeVertex,
      fragmentShader: glowNodeFragment,
      uniforms: {
        ...sharedUniforms(),
        uAlpha: { value: tweak.nodes.alpha },
        uBreathe: { value: tweak.nodes.breathe },
      },
      transparent: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
    });
    const m = new THREE.Mesh(geo, mat);
    m.frustumCulled = false;
    return m;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [generation]);

  // collect each material's uTime so one loop drives both
  useEffect(() => {
    timeRefs.current = [
      (particles.material as THREE.ShaderMaterial).uniforms.uTime,
      (nodes.material as THREE.ShaderMaterial).uniforms.uTime,
    ];
  }, [particles, nodes]);

  // dispose geometry/material of the outgoing objects when a rebuild swaps them
  // (and on unmount) so live count tuning doesn't leak GPU buffers.
  useEffect(() => {
    return () => {
      particles.geometry.dispose();
      (particles.material as THREE.Material).dispose();
      nodes.geometry.dispose();
      (nodes.material as THREE.Material).dispose();
    };
  }, [particles, nodes]);

  useFrame((state) => {
    const t = state.clock.elapsedTime;
    for (const u of timeRefs.current) u.value = t;
  });

  return (
    <>
      <primitive object={particles} />
      <primitive object={nodes} />
    </>
  );
}

/* ----------------------------------------------------------------------- */
/* mount                                                                     */
/* ----------------------------------------------------------------------- */

class GlowErrorBoundary extends Component<{ children: ReactNode }, { failed: boolean }> {
  state = { failed: false };
  static getDerivedStateFromError() {
    return { failed: true };
  }
  render() {
    return this.state.failed ? null : this.props.children;
  }
}

function supportsWebGL2() {
  try {
    const canvas = document.createElement("canvas");
    return !!canvas.getContext("webgl2");
  } catch {
    return false;
  }
}

export function FooterGlow() {
  const wrap = useRef<HTMLDivElement>(null);
  const [enabled, setEnabled] = useState(false);
  const [visible, setVisible] = useState(false);

  // gate: capable device + motion OK. The footer is complete without it.
  // Touch devices run it too (matching the hero) — on the mobile quality
  // profile, so the counts drop before the meshes first build. This page may
  // not have a hero (e.g. a case study), so the profile is applied here as
  // well; applyMobileProfile is idempotent.
  useEffect(() => {
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (window.matchMedia("(pointer: coarse)").matches) applyMobileProfile();
    if (!reduced && supportsWebGL2()) setEnabled(true);
  }, []);

  // render only while the footer is on screen
  useEffect(() => {
    if (!enabled || !wrap.current) return;
    const io = new IntersectionObserver(
      ([entry]) => setVisible(entry.isIntersecting),
      { rootMargin: "80px" },
    );
    io.observe(wrap.current);
    return () => io.disconnect();
  }, [enabled]);

  return (
    <div
      ref={wrap}
      aria-hidden="true"
      className="pointer-events-none absolute inset-0 z-0"
    >
      {enabled && (
        <GlowErrorBoundary>
          <Canvas
            camera={{ position: [0, 0, 20], fov: 50 }}
            dpr={[1, isMobileProfile() ? 1.3 : 1.75]}
            frameloop={visible ? "always" : "never"}
            gl={{ antialias: true, alpha: true, powerPreference: "low-power" }}
            style={{ background: "transparent" }}
          >
            <GlowSystems />
            {/* Bloom-only post pass — bleeds the bright fresnel/core of the
                energy boxes into a soft halo so they read as glowing. Low
                threshold catches the emissive edges; mipmapBlur keeps it cheap.
                Only Bloom (no DoF/CA/vignette) — this is a light ambient layer,
                and it only runs while the footer is on-screen (frameloop gate). */}
            <EffectComposer multisampling={0}>
              <Bloom
                intensity={2.4}
                luminanceThreshold={0.12}
                luminanceSmoothing={0.7}
                mipmapBlur
              />
            </EffectComposer>
          </Canvas>
        </GlowErrorBoundary>
      )}
    </div>
  );
}
