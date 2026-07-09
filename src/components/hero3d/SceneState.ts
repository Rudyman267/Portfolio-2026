import * as THREE from "three";

/**
 * Shared scene state — ONE set of uniform objects referenced by every material,
 * mutated once per frame by <SceneController>. No per-material syncing, no React
 * state in the render loop.
 *
 * World model: the camera stays near the origin looking down -Z; the WORLD
 * recycles toward it (each shader wraps instance z by DEPTH against uTravel).
 * That gives true infinite travel with zero per-frame CPU instance updates.
 */

/** How deep the recycled world extends in front of the camera (world units). */
export const WORLD_DEPTH = 90;

export type SceneUniforms = {
  uTime: THREE.IUniform<number>;
  /** Accumulated forward travel (world units) — drives the infinite recycle. */
  uTravel: THREE.IUniform<number>;
  /** Traversal speed multiplier (scroll raises it; eases back to 1). */
  uSpeed: THREE.IUniform<number>;
  /** Global scene intensity (scroll/hover energy; eases back to 1). */
  uIntensity: THREE.IUniform<number>;
  /** Mouse ray (origin ≈ camera, direction into the scene), smoothed. */
  uRayOrigin: THREE.IUniform<THREE.Vector3>;
  uRayDir: THREE.IUniform<THREE.Vector3>;
  /** Click pulse: time the pulse started + the ray it travels along. */
  uPulseTime: THREE.IUniform<number>;
  uPulseOrigin: THREE.IUniform<THREE.Vector3>;
  uPulseDir: THREE.IUniform<THREE.Vector3>;
  /** Depth-attenuation floor (dev tweak) — darkness of the far tunnel. */
  uRecessionFloor: THREE.IUniform<number>;
  /** Pointer interaction dials (dev tweak) — base radius/strength/glow. */
  uPushRadius: THREE.IUniform<number>;
  uPushStrength: THREE.IUniform<number>;
  uGlowRadius: THREE.IUniform<number>;
  /** Snake-path constants (dev tweak): uPath1 = f1,a1,f2,a2 · uPath2 = fy,ay,ramp. */
  uPath1: THREE.IUniform<THREE.Vector4>;
  uPath2: THREE.IUniform<THREE.Vector3>;
};

export type SceneState = {
  uniforms: SceneUniforms;
  /** Raw + smoothed pointer in NDC (-1..1). */
  pointer: { x: number; y: number; sx: number; sy: number };
  /** Smoothed scroll velocity (px/s) → speed/intensity targets. */
  scrollVel: number;
  time: number;
};

export function createSceneState(): SceneState {
  return {
    uniforms: {
      uTime: { value: 0 },
      uTravel: { value: 0 },
      uSpeed: { value: 1 },
      uIntensity: { value: 1 },
      uRayOrigin: { value: new THREE.Vector3(0, 0, 0) },
      uRayDir: { value: new THREE.Vector3(0, 0, -1) },
      uPulseTime: { value: -100 },
      uPulseOrigin: { value: new THREE.Vector3() },
      uPulseDir: { value: new THREE.Vector3(0, 0, -1) },
      uRecessionFloor: { value: 0.05 },
      uPushRadius: { value: 7.5 },
      uPushStrength: { value: 0.65 },
      uGlowRadius: { value: 7.0 },
      uPath1: { value: new THREE.Vector4(PATH.f1, PATH.a1, PATH.f2, PATH.a2) },
      uPath2: { value: new THREE.Vector3(PATH.fy, PATH.ay, PATH.ramp) },
    },
    pointer: { x: 0, y: 0, sx: 0, sy: 0 },
    scrollVel: 0,
    time: 0,
  };
}

/**
 * The snake path. The camera never moves — every vertex shader bends the
 * world inversely along this curve (infinite-runner trick), so travelling
 * forward reads as flying along a snaking wire. Mirrored in GLSL via
 * PATH_GLSL (shaders.ts) — the constants below are the single source of
 * truth for both. `s` = absolute travel distance in world units.
 *
 * Tuned so one full S-bend spans ~SCROLL_TRAVEL (see SceneController): each
 * phrase swap in the hero scrub lands near a bend apex.
 */
export const PATH = {
  f1: 0.085, // primary S frequency (wavelength ≈ 74 units)
  a1: 7.0,   // primary lateral amplitude
  f2: 0.031, // long secondary sweep
  a2: 4.2,
  fy: 0.05,  // gentle vertical undulation
  ay: 2.6,
  ramp: 16,  // depth over which the bend fades in (near field stays straight)
};

export function pathPointX(s: number) {
  return Math.sin(s * PATH.f1) * PATH.a1 + Math.sin(s * PATH.f2 + 2.0) * PATH.a2;
}
export function pathPointY(s: number) {
  return Math.cos(s * PATH.fy + 1.0) * PATH.ay;
}

/** Palette — deep black / midnight blue / electric cyan / white highlights. */
export const PALETTE = {
  deep: new THREE.Color("#050a14"),
  midnight: new THREE.Color("#0a2a55"),
  blue: new THREE.Color("#1256b0"),
  cyan: new THREE.Color("#3ec6ff"),
  white: new THREE.Color("#eaf6ff"),
};
