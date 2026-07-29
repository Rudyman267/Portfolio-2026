"use client";

import { Component, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import * as THREE from "three";
import { Canvas, useFrame } from "@react-three/fiber";
import { EffectComposer, Bloom } from "@react-three/postprocessing";
import { RoundedBoxGeometry } from "three/examples/jsm/geometries/RoundedBoxGeometry.js";
import { NOISE } from "@/components/hero3d/shaders";
import { gsap, ScrollTrigger } from "@/lib/gsap";
import {
  tweak,
  applyMobileProfile,
  isMobileProfile,
} from "@/components/hero3d/tweakConfig";

/**
 * PageGlow — the full-page ambient particle field behind /work and /play.
 *
 * SHARES THE FOOTER'S VISUAL DNA (same palette, same square-mote sprite, same
 * fresnel energy boxes) but is a DELIBERATELY DIFFERENT EXPERIENCE — the brief
 * was "should feel different from the footer":
 *
 *   FooterGlow                         PageGlow
 *   ─────────────────────────────      ──────────────────────────────────────
 *   sparse afterglow (310 motes)       dense field (900) — a real atmosphere
 *   rises from below the fold          fills the whole viewport, drifts in 3D
 *   time-driven only                   SCROLL-DRIVEN: the field flies toward
 *                                      the camera as you scroll (parallax by
 *                                      depth), so descending the page reads as
 *                                      travelling THROUGH the field
 *   one flat layer                     3 depth strata, each parallaxing at its
 *                                      own rate — that's what sells the depth
 *   constant intensity                 an intro "ignition" (anime.js) + a
 *                                      scroll-velocity flare (GSAP)
 *
 * Motion split, matching the house rule (PROJECT_LOG §6):
 *   - GSAP/ScrollTrigger owns scroll-POSITION-driven values (uScroll, uFlare).
 *   - anime.js owns the self-playing one-shot intro ignition (uIgnite).
 *   - the GPU owns per-frame life cycles + drift (one uTime uniform).
 * They never write the same uniform, so they can't fight.
 *
 * Gated exactly like FooterGlow: reduced-motion / no-WebGL2 → renders nothing
 * (the pages are complete without it), and the frameloop only runs on screen.
 */

/* ----------------------------------------------------------------------- */
/* shaders                                                                   */
/* ----------------------------------------------------------------------- */

/* ── THE CINEMATIC, DEFINED ────────────────────────────────────────────────
   "Cinematic" here = flying THROUGH a field, not watching one. Five rules:

   1. ALWAYS IN FLIGHT. The field travels toward the camera continuously, even
      at rest (uBaseSpeed). A field that only moves when you scroll reads as a
      widget; one that's already moving reads as a place you've arrived in.
   2. SCROLL ACCELERATES, it doesn't start. Scrolling ADDS to the base travel,
      so the reader feels like they're throttling forward rather than dragging
      a slider.
   3. DEPTH IS THE POINT. Three strata at different parallax rates. Near motes
      rip past, far ones barely move — the single strongest depth cue there is.
   4. NOTHING POPS. Motes fade in far away and dissolve before they reach the
      camera plane (travelFade below). A hard wrap boundary is the one thing
      that instantly breaks the illusion, and the naive version of this shader
      had exactly that bug.
   5. AERIAL PERSPECTIVE. Near = brighter/bigger, far = dimmer/steadier.

   Life-cycle envelope + travel are shared by both systems. `uScroll` is
   world-units of scroll-added travel; `uTime * uBaseSpeed` is the idle flight. */
const FIELD_GLSL = /* glsl */ `
  float lifePhase(float seed, float life){
    return fract(seed * 7.31 + uTime / life);
  }
  float lifeEnv(float phase){
    return smoothstep(0.0, 0.16, phase) * (1.0 - smoothstep(0.70, 1.0, phase));
  }
  /* Wrap a coordinate into [-h, h] so the field is endless as it flies.
     NOTE the param is h, NOT "half" — half is a RESERVED WORD in GLSL ES and
     using it fails compilation with only "Vertex shader is not compiled". */
  float wrapAxis(float v, float h){
    float span = h * 2.0;
    return mod(v + h, span) - h;
  }
  /* Total travel for an instance: idle flight + scroll throttle, both scaled by
     the instance's depth band so the strata separate. TOWARD the camera (+z). */
  float travelZ(float z0, float depth, float t, float baseSpeed, float scrollT){
    float rate = 0.35 + depth * 1.25;
    return wrapAxis(z0 + (t * baseSpeed + scrollT) * rate, 26.0);
  }
  /* Rule 4: dissolve before the camera plane, materialise in the far distance.
     Camera sits at z=+20, so anything past ~18 would smear through the lens. */
  float travelFade(float z){
    return smoothstep(-26.0, -18.0, z) * (1.0 - smoothstep(9.0, 17.5, z));
  }
  /* Nodes need a MUCH earlier dissolve than motes. They're real geometry (up to
     ~1.3 world units), so within ~12 units of the lens they blow up into flat
     opaque cubes instead of distant glowing boxes — which is exactly what the
     first build looked like. Gone by z=4 keeps them in the mid-field. */
  float travelFadeNode(float z){
    return smoothstep(-26.0, -18.0, z) * (1.0 - smoothstep(-4.0, 4.0, z));
  }
`;

const fieldParticleVertex = /* glsl */ `
  uniform float uTime;
  uniform float uPixelRatio;
  uniform float uDrift;
  uniform float uScroll;
  uniform float uIgnite;
  uniform float uBaseSpeed;
  ${NOISE}
  ${FIELD_GLSL}

  attribute float aSeed;
  attribute float aSize;
  attribute float aLife;
  attribute float aDepth; /* 0 = far stratum, 1 = near — drives parallax rate */

  varying float vSeed;
  varying float vEnv;
  varying float vDepth;
  varying float vFade;

  void main(){
    vSeed = aSeed;
    vDepth = aDepth;
    float phase = lifePhase(aSeed, aLife);
    float env = lifeEnv(phase);
    vEnv = env;

    vec3 p = position;

    /* FLIGHT TOWARD THE CAMERA — idle travel + scroll throttle, near strata
       ripping past faster than far ones. Wrapped so the field never runs out. */
    p.z = travelZ(p.z, aDepth, uTime, uBaseSpeed, uScroll);
    vFade = travelFade(p.z);

    /* slow ambient drift (hero feel), scaled down on the far strata so distant
       motes read as steadier — another depth cue */
    float t = uTime * 0.1;
    float dScale = 0.45 + aDepth * 0.55;
    p.x += (fbm(vec3(aSeed * 9.2, t, p.z * 0.05)) - 0.5) * uDrift * dScale;
    p.y += (fbm(vec3(aSeed * 4.6 + 3.0, t + 9.0, p.z * 0.05)) - 0.5) * uDrift * dScale;

    vec4 mv = modelViewMatrix * vec4(p, 1.0);
    gl_Position = projectionMatrix * mv;

    float twinkle = 0.75 + 0.25 * sin(uTime * (1.0 + fract(aSeed * 7.7)) + aSeed * 40.0);
    /* ignition: motes swell in from nothing on first paint */
    float ig = smoothstep(0.0, 1.0, uIgnite);
    gl_PointSize = aSize * uPixelRatio * twinkle * (0.5 + 0.5 * env) * ig
                 * (34.0 / -mv.z);
  }
`;

const fieldParticleFragment = /* glsl */ `
  precision highp float;
  uniform float uIntensity;
  uniform vec3 uColorA;
  uniform vec3 uColorB;
  uniform vec3 uColorHot;
  uniform float uAlpha;
  uniform float uFlare;
  uniform float uIgnite;

  varying float vSeed;
  varying float vEnv;
  varying float vDepth;
  varying float vFade;

  void main(){
    vec2 uv = gl_PointCoord - 0.5;
    float m = max(abs(uv.x), abs(uv.y));
    float disc = smoothstep(0.5, 0.38, m);

    vec3 col = mix(uColorA, uColorB, fract(vSeed * 11.3));
    col = mix(col, uColorHot, step(0.93, fract(vSeed * 5.1)) * 0.8);
    /* scroll-velocity flare — the field brightens as you throttle through it */
    col += uColorHot * uFlare * 0.35 * vDepth;

    /* rule 5: near strata sit brighter than far (aerial perspective) */
    float depthFade = 0.45 + vDepth * 0.55;
    /* rule 4: vFade dissolves it before the camera plane — no pop */
    float alpha = disc * 0.34 * vEnv * vFade * depthFade * uIntensity * uAlpha * uIgnite;
    gl_FragColor = vec4(col, alpha);
  }
`;

const fieldNodeVertex = /* glsl */ `
  uniform float uTime;
  uniform float uBreathe;
  uniform float uScroll;
  uniform float uIgnite;
  uniform float uBaseSpeed;
  ${NOISE}
  ${FIELD_GLSL}

  attribute vec3 aOffset;
  attribute vec4 aParams; /* scale, seed, life, depth */

  varying vec3 vNormalW;
  varying vec3 vViewW;
  varying float vEnv;
  varying float vSeed;
  varying float vFade;

  void main(){
    float scale = aParams.x;
    float seed  = aParams.y;
    float depth = aParams.w;
    vSeed = seed;

    float phase = lifePhase(seed, aParams.z);
    float env = lifeEnv(phase);
    vEnv = env;

    vec3 c = aOffset;
    c.z = travelZ(c.z, depth, uTime, uBaseSpeed, uScroll);
    vFade = travelFadeNode(c.z);
    c.x += (fbm(vec3(seed * 8.0, uTime * 0.09, 0.0)) - 0.5) * 2.2;
    c.y += (fbm(vec3(seed * 5.0 + 2.0, uTime * 0.09 + 4.0, 0.0)) - 0.5) * 2.2;

    float breathe = 1.0 + uBreathe * sin(uTime * 0.8 + seed * 6.28318);
    float ig = smoothstep(0.0, 1.0, uIgnite);
    vec3 world = c + position * scale * breathe * (0.4 + 0.6 * env) * ig;

    vNormalW = normalize(mat3(modelMatrix) * normal);
    vViewW = normalize(cameraPosition - world);
    gl_Position = projectionMatrix * modelViewMatrix * vec4(world, 1.0);
  }
`;

const fieldNodeFragment = /* glsl */ `
  precision highp float;
  uniform float uTime;
  uniform float uIntensity;
  uniform vec3 uColorB;
  uniform vec3 uColorHot;
  uniform float uAlpha;
  uniform float uFlare;
  uniform float uIgnite;

  varying vec3 vNormalW;
  varying vec3 vViewW;
  varying float vEnv;
  varying float vSeed;
  varying float vFade;

  void main(){
    float fres = pow(1.0 - abs(dot(normalize(vNormalW), normalize(vViewW))), 2.0);
    float core = 1.0 - fres;

    float pulse = 0.6 + 0.4 * sin(uTime * (0.7 + fract(vSeed * 3.1)) + vSeed * 20.0);
    vec3 col = uColorB * (fres * 1.7 + 0.2) + uColorHot * core * 1.1 * pulse;
    col += uColorHot * uFlare * 0.5;

    /* vFade: dissolve before the camera plane (rule 4) — a box clipping through
       the lens is far more jarring than a mote doing it */
    float alpha = (fres * 0.85 + core * 0.32) * vEnv * vFade * uIntensity * uAlpha * uIgnite;
    gl_FragColor = vec4(col, alpha);
  }
`;

/* ----------------------------------------------------------------------- */
/* scene                                                                     */
/* ----------------------------------------------------------------------- */

const rand = (min: number, max: number) => min + Math.random() * (max - min);

/** Denser than the footer on purpose — this is the page's atmosphere, not an
 *  accent. Mobile halves it (the profile also caps DPR). */
const DENSITY = {
  particles: 900,
  nodes: 46,
};

/** Idle flight speed, world-units/sec toward the camera (rule 1). Slow enough
 *  to read as ambient drift when the reader is still; scroll adds on top. */
const BASE_SPEED = 0.55;
/** World-units of extra travel across a full page scroll (rule 2). Tuned so a
 *  normal read-through feels like accelerating, not teleporting. */
const SCROLL_TRAVEL = 90;

function FieldSystems({ scrollRef }: { scrollRef: React.RefObject<{ v: number; flare: number }> }) {
  const uniformsRef = useRef<{
    time: THREE.IUniform[];
    scroll: THREE.IUniform[];
    flare: THREE.IUniform[];
    ignite: THREE.IUniform[];
  }>({ time: [], scroll: [], flare: [], ignite: [] });

  const mobile = isMobileProfile();
  const pCount = Math.round(DENSITY.particles * (mobile ? 0.45 : 1));
  const nCount = Math.round(DENSITY.nodes * (mobile ? 0.5 : 1));

  const particles = useMemo(() => {
    const { sizeMin, sizeMax } = tweak.particles;
    const geo = new THREE.BufferGeometry();
    const pos = new Float32Array(pCount * 3);
    const seed = new Float32Array(pCount);
    const size = new Float32Array(pCount);
    const life = new Float32Array(pCount);
    const depth = new Float32Array(pCount);
    for (let i = 0; i < pCount; i++) {
      // spread across the whole viewport volume (not a band below the fold)
      pos[i * 3 + 0] = rand(-30, 30);
      pos[i * 3 + 1] = rand(-18, 18);
      pos[i * 3 + 2] = rand(-26, 26);
      seed[i] = Math.random();
      size[i] = rand(sizeMin, sizeMax);
      life[i] = rand(14, 26);
      // 3 discrete strata so the parallax reads as layers, not mush
      depth[i] = [0.15, 0.55, 1.0][i % 3];
    }
    geo.setAttribute("position", new THREE.BufferAttribute(pos, 3));
    geo.setAttribute("aSeed", new THREE.BufferAttribute(seed, 1));
    geo.setAttribute("aSize", new THREE.BufferAttribute(size, 1));
    geo.setAttribute("aLife", new THREE.BufferAttribute(life, 1));
    geo.setAttribute("aDepth", new THREE.BufferAttribute(depth, 1));

    const mat = new THREE.ShaderMaterial({
      vertexShader: fieldParticleVertex,
      fragmentShader: fieldParticleFragment,
      uniforms: {
        uTime: { value: 0 },
        uIntensity: { value: tweak.scene.intensity },
        uColorA: { value: new THREE.Color(tweak.palette.colorA) },
        uColorB: { value: new THREE.Color(tweak.palette.colorB) },
        uColorHot: { value: new THREE.Color(tweak.palette.colorHot) },
        uAlpha: { value: tweak.particles.alpha },
        uDrift: { value: tweak.particles.drift },
        uScroll: { value: 0 },
        uFlare: { value: 0 },
        uIgnite: { value: 0 },
        uBaseSpeed: { value: BASE_SPEED },
        uPixelRatio: {
          value:
            typeof window !== "undefined"
              ? Math.min(window.devicePixelRatio, mobile ? 1.3 : 1.75)
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
  }, [pCount, mobile]);

  const nodes = useMemo(() => {
    const { scaleMin, scaleMax } = tweak.nodes;
    const base = new RoundedBoxGeometry(1.6, 1.6, 1.6, 3, 0.28);
    const geo = new THREE.InstancedBufferGeometry();
    geo.index = base.index;
    geo.attributes = base.attributes;
    geo.instanceCount = nCount;

    const offsets = new Float32Array(nCount * 3);
    const params = new Float32Array(nCount * 4);
    for (let i = 0; i < nCount; i++) {
      offsets[i * 3 + 0] = rand(-26, 26);
      offsets[i * 3 + 1] = rand(-16, 16);
      offsets[i * 3 + 2] = rand(-24, 20);
      params[i * 4 + 0] = rand(scaleMin, scaleMax);
      params[i * 4 + 1] = Math.random();
      params[i * 4 + 2] = rand(18, 34);
      params[i * 4 + 3] = [0.15, 0.55, 1.0][i % 3];
    }
    geo.setAttribute("aOffset", new THREE.InstancedBufferAttribute(offsets, 3));
    geo.setAttribute("aParams", new THREE.InstancedBufferAttribute(params, 4));

    const mat = new THREE.ShaderMaterial({
      vertexShader: fieldNodeVertex,
      fragmentShader: fieldNodeFragment,
      uniforms: {
        uTime: { value: 0 },
        uIntensity: { value: tweak.scene.intensity },
        uColorB: { value: new THREE.Color(tweak.palette.colorB) },
        uColorHot: { value: new THREE.Color(tweak.palette.colorHot) },
        uAlpha: { value: tweak.nodes.alpha },
        uBreathe: { value: tweak.nodes.breathe },
        uScroll: { value: 0 },
        uFlare: { value: 0 },
        uIgnite: { value: 0 },
        uBaseSpeed: { value: BASE_SPEED },
      },
      transparent: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
    });
    const m = new THREE.Mesh(geo, mat);
    m.frustumCulled = false;
    return m;
  }, [nCount]);

  useEffect(() => {
    const pu = (particles.material as THREE.ShaderMaterial).uniforms;
    const nu = (nodes.material as THREE.ShaderMaterial).uniforms;
    uniformsRef.current = {
      time: [pu.uTime, nu.uTime],
      scroll: [pu.uScroll, nu.uScroll],
      flare: [pu.uFlare, nu.uFlare],
      ignite: [pu.uIgnite, nu.uIgnite],
    };

    // ── INTRO IGNITION (anime.js) — a self-playing one-shot, so it belongs to
    //    anime, not ScrollTrigger (see the motion split in the file header).
    //    The field swells up from nothing instead of popping in fully formed.
    const target = { v: 0 };
    let raf = 0;
    let cancelled = false;
    // drive it with a plain rAF-eased tween rather than pulling anime in for a
    // single scalar — same one-shot semantics, zero extra bundle on this route.
    const start = performance.now();
    const DUR = 1600;
    const tick = (now: number) => {
      if (cancelled) return;
      const t = Math.min(1, (now - start) / DUR);
      // easeOutCubic
      target.v = 1 - Math.pow(1 - t, 3);
      for (const u of uniformsRef.current.ignite) u.value = target.v;
      if (t < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => {
      cancelled = true;
      cancelAnimationFrame(raf);
    };
  }, [particles, nodes]);

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
    for (const u of uniformsRef.current.time) u.value = t;
    const s = scrollRef.current;
    if (s) {
      for (const u of uniformsRef.current.scroll) u.value = s.v;
      for (const u of uniformsRef.current.flare) u.value = s.flare;
    }
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

class FieldErrorBoundary extends Component<{ children: ReactNode }, { failed: boolean }> {
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

export function PageGlow() {
  const wrap = useRef<HTMLDivElement>(null);
  const [enabled, setEnabled] = useState(false);
  const [visible, setVisible] = useState(true);
  // shared scroll state the frameloop reads (a ref, so ScrollTrigger updating
  // it never triggers a React re-render)
  const scrollRef = useRef({ v: 0, flare: 0 });

  useEffect(() => {
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (window.matchMedia("(pointer: coarse)").matches) applyMobileProfile();
    if (!reduced && supportsWebGL2()) setEnabled(true);
  }, []);

  // ── SCROLL DRIVE (GSAP/ScrollTrigger) ───────────────────────────────────
  // Owns scroll-POSITION-driven values only. Two channels:
  //   v     — total world-units travelled, scrubbed from page progress. This is
  //           what flies the field past the camera.
  //   flare — a velocity-derived brightness spike that eases back to 0, so fast
  //           scrolling visibly energises the field. Tweened (not set) so it
  //           decays smoothly instead of strobing per frame.
  useEffect(() => {
    if (!enabled) return;
    const st = ScrollTrigger.create({
      trigger: document.body,
      start: "top top",
      end: "bottom bottom",
      // The whole travel distance across the page. Large enough that the
      // parallax between strata is obvious rather than subliminal.
      onUpdate: (self) => {
        scrollRef.current.v = self.progress * SCROLL_TRAVEL;
        const vel = Math.min(1, Math.abs(self.getVelocity()) / 2600);
        // only ever raise the flare here; the tween below brings it down
        if (vel > scrollRef.current.flare) {
          gsap.killTweensOf(scrollRef.current);
          scrollRef.current.flare = vel;
          gsap.to(scrollRef.current, {
            flare: 0,
            duration: 1.1,
            ease: "power2.out",
            overwrite: true,
          });
        }
      },
    });
    return () => {
      gsap.killTweensOf(scrollRef.current);
      st.kill();
    };
  }, [enabled]);

  useEffect(() => {
    if (!enabled || !wrap.current) return;
    const io = new IntersectionObserver(
      ([entry]) => setVisible(entry.isIntersecting),
      { rootMargin: "120px" },
    );
    io.observe(wrap.current);
    return () => io.disconnect();
  }, [enabled]);

  return (
    <div
      ref={wrap}
      aria-hidden="true"
      // FIXED, not absolute: the field is the page's atmosphere for the whole
      // scroll, so it must not scroll away with the content.
      className="pointer-events-none fixed inset-0 z-0"
    >
      {enabled && (
        <FieldErrorBoundary>
          <Canvas
            camera={{ position: [0, 0, 20], fov: 50 }}
            dpr={[1, isMobileProfile() ? 1.3 : 1.75]}
            frameloop={visible ? "always" : "never"}
            gl={{ antialias: true, alpha: true, powerPreference: "low-power" }}
            style={{ background: "transparent" }}
          >
            <FieldSystems scrollRef={scrollRef} />
            <EffectComposer multisampling={0}>
              <Bloom
                intensity={2.1}
                luminanceThreshold={0.12}
                luminanceSmoothing={0.7}
                mipmapBlur
              />
            </EffectComposer>
          </Canvas>
        </FieldErrorBoundary>
      )}
    </div>
  );
}
