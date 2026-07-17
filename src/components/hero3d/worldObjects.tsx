"use client";

import { useEffect, useMemo, useSyncExternalStore } from "react";
import * as THREE from "three";
import { RoundedBoxGeometry } from "three/examples/jsm/geometries/RoundedBoxGeometry.js";
import {
  WORLD_DEPTH,
  PALETTE,
  type SceneState,
} from "@/components/hero3d/SceneState";
import {
  fiberVertex,
  fiberFragment,
  particleVertex,
  particleFragment,
  nodeVertex,
  nodeFragment,
  fragmentVertex,
  fragmentFragment,
} from "@/components/hero3d/shaders";
import {
  tweak,
  subscribeTweak,
  getGeneration,
  isMobileProfile,
} from "@/components/hero3d/tweakConfig";

/**
 * The living world: four GPU-instanced systems (fibers, particles, energy
 * nodes, floating fragments). All motion — travel recycling, wave deformation,
 * breathing, pointer repulsion, click pulses — happens in the vertex shaders;
 * the CPU only bumps shared uniforms. frustumCulled=false everywhere because
 * instances wrap through the depth window in the shader.
 *
 * DEV: geometry (counts + scatter ranges) is read from `tweak` and re-created
 * whenever the tweak `generation` bumps (rebuild-class changes). The cheap live
 * dials (alpha / wave / breathe / drift / tumble) live in per-material uniforms
 * updated via a tweak subscription — no per-frame cost.
 */

const rand = (min: number, max: number) => min + Math.random() * (max - min);

/** Subscribe to the tweak generation so a mesh re-creates on rebuild-class edits. */
function useGeneration() {
  return useSyncExternalStore(subscribeTweak, getGeneration, getGeneration);
}

/** Material factory — every material references the SAME shared uniform objects. */
function makeMaterial(
  state: SceneState,
  vertexShader: string,
  fragmentShader: string,
  extra: Record<string, THREE.IUniform> = {},
) {
  return new THREE.ShaderMaterial({
    vertexShader,
    fragmentShader,
    uniforms: {
      ...state.uniforms,
      uDepth: { value: WORLD_DEPTH },
      uColorA: { value: PALETTE.midnight.clone() },
      uColorB: { value: PALETTE.cyan.clone() },
      uColorHot: { value: PALETTE.white.clone() },
      uAlpha: { value: 1 },
      ...extra,
    },
    transparent: true,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
  });
}

/**
 * Keep a material's live tweak uniforms (palette + per-system dials) in sync
 * with the config, updating only when the config actually changes.
 */
function useMaterialSync(
  material: THREE.ShaderMaterial,
  apply: (u: THREE.ShaderMaterial["uniforms"]) => void,
) {
  useEffect(() => {
    const sync = () => {
      const u = material.uniforms;
      (u.uColorA.value as THREE.Color).set(tweak.palette.colorA);
      (u.uColorB.value as THREE.Color).set(tweak.palette.colorB);
      if (u.uColorHot) (u.uColorHot.value as THREE.Color).set(tweak.palette.colorHot);
      apply(u);
    };
    sync();
    return subscribeTweak(sync);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [material]);
}

/** Instanced copy of a base geometry (shares vertex data, adds instance count). */
function instanced(base: THREE.BufferGeometry, count: number) {
  const geo = new THREE.InstancedBufferGeometry();
  geo.index = base.index;
  geo.attributes = base.attributes;
  geo.instanceCount = count;
  return geo;
}

/* ------------------------------------------------------------------------- */

export function FiberField({ state }: { state: SceneState }) {
  const gen = useGeneration();
  const mesh = useMemo(() => {
    const { count, radiusMin, radiusMax } = tweak.fibers;
    const base = new THREE.CylinderGeometry(1, 1, 1, 6, 40, true);
    const geo = instanced(base, count);

    const offsets = new Float32Array(count * 3);
    const params = new Float32Array(count * 4);
    for (let i = 0; i < count; i++) {
      // scatter around the camera path, denser toward the sides (leave a
      // reading corridor for the headline)
      const side = Math.random() < 0.5 ? -1 : 1;
      offsets[i * 3 + 0] = side * rand(2.5, 18) * (Math.random() < 0.25 ? 0.3 : 1);
      offsets[i * 3 + 1] = rand(-10, 10);
      offsets[i * 3 + 2] = rand(0, WORLD_DEPTH);
      params[i * 4 + 0] = rand(radiusMin, radiusMax); // radius — thin filaments
      params[i * 4 + 1] = rand(10, 26);      // length
      params[i * 4 + 2] = rand(0.85, 1.25);  // travel speed
      params[i * 4 + 3] = Math.random();     // seed
    }
    geo.setAttribute("aOffset", new THREE.InstancedBufferAttribute(offsets, 3));
    geo.setAttribute("aParams", new THREE.InstancedBufferAttribute(params, 4));

    const m = new THREE.Mesh(
      geo,
      makeMaterial(state, fiberVertex, fiberFragment, {
        uWave: { value: tweak.fibers.wave },
        uBreathe: { value: tweak.fibers.breathe },
      }),
    );
    m.frustumCulled = false;
    m.renderOrder = 1;
    return m;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state, gen]);

  useMaterialSync(mesh.material as THREE.ShaderMaterial, (u) => {
    u.uAlpha.value = tweak.fibers.alpha;
    u.uWave.value = tweak.fibers.wave;
    u.uBreathe.value = tweak.fibers.breathe;
  });

  return <primitive object={mesh} />;
}

/* ------------------------------------------------------------------------- */

export function Particles({ state }: { state: SceneState }) {
  const gen = useGeneration();
  const points = useMemo(() => {
    const { count, sizeMin, sizeMax } = tweak.particles;
    const geo = new THREE.BufferGeometry();
    const pos = new Float32Array(count * 3);
    const seed = new Float32Array(count);
    const size = new Float32Array(count);
    for (let i = 0; i < count; i++) {
      pos[i * 3 + 0] = rand(-22, 22);
      pos[i * 3 + 1] = rand(-13, 13);
      pos[i * 3 + 2] = rand(0, WORLD_DEPTH);
      seed[i] = Math.random();
      size[i] = rand(sizeMin, sizeMax);
    }
    geo.setAttribute("position", new THREE.BufferAttribute(pos, 3));
    geo.setAttribute("aSeed", new THREE.BufferAttribute(seed, 1));
    geo.setAttribute("aSize", new THREE.BufferAttribute(size, 1));

    const mat = makeMaterial(state, particleVertex, particleFragment, {
      uPixelRatio: {
        // matches the Canvas dpr cap (Scene.tsx: 1.3 on the mobile profile)
        value:
          typeof window !== "undefined"
            ? Math.min(window.devicePixelRatio, isMobileProfile() ? 1.3 : 1.75)
            : 1,
      },
      uDrift: { value: tweak.particles.drift },
    });
    const p = new THREE.Points(geo, mat);
    p.frustumCulled = false;
    p.renderOrder = 2;
    return p;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state, gen]);

  useMaterialSync(points.material as THREE.ShaderMaterial, (u) => {
    u.uAlpha.value = tweak.particles.alpha;
    u.uDrift.value = tweak.particles.drift;
  });

  return <primitive object={points} />;
}

/* ------------------------------------------------------------------------- */

export function EnergyNodes({ state }: { state: SceneState }) {
  const gen = useGeneration();
  const mesh = useMemo(() => {
    const { count, scaleMin, scaleMax } = tweak.nodes;
    // rounded cube — reads as a "tech voxel" while keeping smooth fresnel normals
    const base = new RoundedBoxGeometry(1.6, 1.6, 1.6, 3, 0.28);
    const geo = instanced(base, count);

    const offsets = new Float32Array(count * 3);
    const params = new Float32Array(count * 2);
    for (let i = 0; i < count; i++) {
      const side = Math.random() < 0.5 ? -1 : 1;
      offsets[i * 3 + 0] = side * rand(3, 16);
      offsets[i * 3 + 1] = rand(-9, 9);
      offsets[i * 3 + 2] = rand(0, WORLD_DEPTH);
      params[i * 2 + 0] = rand(scaleMin, scaleMax); // scale
      params[i * 2 + 1] = Math.random();   // seed
    }
    geo.setAttribute("aOffset", new THREE.InstancedBufferAttribute(offsets, 3));
    geo.setAttribute("aParams", new THREE.InstancedBufferAttribute(params, 2));

    const m = new THREE.Mesh(
      geo,
      makeMaterial(state, nodeVertex, nodeFragment, {
        uBreathe: { value: tweak.nodes.breathe },
      }),
    );
    m.frustumCulled = false;
    m.renderOrder = 3;
    return m;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state, gen]);

  useMaterialSync(mesh.material as THREE.ShaderMaterial, (u) => {
    u.uAlpha.value = tweak.nodes.alpha;
    u.uBreathe.value = tweak.nodes.breathe;
  });

  return <primitive object={mesh} />;
}

/* ------------------------------------------------------------------------- */

export function Fragments({ state }: { state: SceneState }) {
  const gen = useGeneration();
  const mesh = useMemo(() => {
    const { count } = tweak.fragments;
    const base = new THREE.BoxGeometry(1, 1, 1);
    const geo = instanced(base, count);

    const offsets = new Float32Array(count * 3);
    const params = new Float32Array(count * 4);
    for (let i = 0; i < count; i++) {
      const side = Math.random() < 0.5 ? -1 : 1;
      offsets[i * 3 + 0] = side * rand(2, 15);
      offsets[i * 3 + 1] = rand(-8, 8);
      offsets[i * 3 + 2] = rand(0, WORLD_DEPTH);
      // mostly small "pixel" cubes, a few large landmark cubes
      const size = Math.random() < 0.3 ? rand(0.8, 1.5) : rand(0.22, 0.6);
      params[i * 4 + 0] = size;                  // scale X
      params[i * 4 + 1] = size * rand(0.8, 1.25); // scale Y (near-cube variety)
      params[i * 4 + 2] = rand(0.04, 0.16);      // rot speed (slow tumble)
      params[i * 4 + 3] = Math.random();         // seed
    }
    geo.setAttribute("aOffset", new THREE.InstancedBufferAttribute(offsets, 3));
    geo.setAttribute("aParams", new THREE.InstancedBufferAttribute(params, 4));

    const mat = makeMaterial(state, fragmentVertex, fragmentFragment, {
      uTumble: { value: tweak.fragments.tumble },
    });
    mat.side = THREE.DoubleSide;
    const m = new THREE.Mesh(geo, mat);
    m.frustumCulled = false;
    m.renderOrder = 1;
    return m;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state, gen]);

  useMaterialSync(mesh.material as THREE.ShaderMaterial, (u) => {
    u.uAlpha.value = tweak.fragments.alpha;
    u.uTumble.value = tweak.fragments.tumble;
  });

  return <primitive object={mesh} />;
}
