/**
 * DEV-ONLY live tweak store for the hero scene.
 *
 * A single plain module-level object holding every dial the on-site control
 * panel exposes. It is:
 *   - read every frame by SceneController → written into the shared uniforms
 *     (colors, speed, pointer push, recession, path, per-system alphas, …),
 *     so most changes are instant with no rebuild;
 *   - read by Scene.tsx post-processing (bloom / DoF / vignette / …) via a
 *     React subscription (post effects are declarative, not per-frame uniforms);
 *   - read by worldObjects for instance counts / scatter — these need a mesh
 *     rebuild, gated by `generation` which bumps when a rebuild-class value
 *     changes.
 *
 * Defaults below MIRROR the values currently baked into shaders.ts /
 * worldObjects.tsx / Scene.tsx / SceneState.ts / SceneController.tsx. When the
 * user is happy with a preset we paste it back into those files and delete this
 * store + the panel.
 *
 * NOTE: shader UNIFORM-driven values are applied live. Shader values that are
 * currently GLSL literals (e.g. fiber depthAtt floor, pulse constants) are NOT
 * live-tweakable here unless they were promoted to uniforms — the panel only
 * exposes what the plumbing can actually drive. We promote the high-value ones
 * (recession floor, wave amount, breathe, per-system alpha, pointer push).
 */

export type HeroTweakConfig = {
  scene: {
    idleTravelSpeed: number; // world units/sec of always-on drift
    scrollTravel: number; // world units across the full hero pin
    worldDepth: number; // recycle depth window (rebuild-class)
    intensity: number; // global intensity multiplier (baseline)
    recessionFloor: number; // depthAtt floor — how dark the far tunnel gets (0..1)
    fovBase: number; // camera base FOV
    cameraDrift: number; // pointer-follow drift amount
  };
  bloom: {
    intensity: number;
    threshold: number;
    smoothing: number;
  };
  dof: {
    focusDistance: number;
    focalLength: number;
    bokehScale: number;
  };
  grade: {
    vignetteOffset: number;
    vignetteDarkness: number;
    noiseOpacity: number;
    chromaticAberration: number; // scalar; x = value, y = value * 0.66
  };
  palette: {
    colorA: string; // midnight (hex)
    colorB: string; // cyan
    colorHot: string; // white highlight
  };
  path: {
    f1: number;
    a1: number;
    f2: number;
    a2: number;
    fy: number;
    ay: number;
    ramp: number;
  };
  pointer: {
    pushRadius: number; // shared base push radius
    pushStrength: number; // shared base push strength
    glowRadius: number; // hover illumination radius
  };
  fibers: {
    count: number; // rebuild-class
    alpha: number; // alpha multiplier
    radiusMin: number; // rebuild-class
    radiusMax: number; // rebuild-class
    wave: number; // wave deformation amount (live uniform)
    breathe: number; // breathing amount (live uniform)
  };
  particles: {
    count: number; // rebuild-class
    alpha: number;
    sizeMin: number; // rebuild-class
    sizeMax: number; // rebuild-class
    drift: number; // ambient drift amount (live uniform)
  };
  nodes: {
    count: number; // rebuild-class
    alpha: number;
    scaleMin: number; // rebuild-class
    scaleMax: number; // rebuild-class
    breathe: number; // live uniform
  };
  fragments: {
    count: number; // rebuild-class
    alpha: number;
    tumble: number; // rotation speed multiplier (live uniform)
  };
  footer: {
    particleCount: number; // footer-glow mote count (rebuild-class)
    nodeCount: number; // footer-glow energy-node count (rebuild-class)
    spawnMin: number; // spawn band bottom Y (rebuild-class)
    spawnMax: number; // spawn band top Y (rebuild-class)
    riseMin: number; // min rise height (rebuild-class)
    riseMax: number; // max rise height (rebuild-class)
    lifeMin: number; // min per-instance lifetime, s (rebuild-class)
    lifeMax: number; // max per-instance lifetime, s (rebuild-class)
  };
};

/**
 * Locked preset — tuned on the user's real GPU via the (now-removed) dev tweak
 * panel. Baked 2026-07-09, re-tuned 2026-07-10 (red/black/white palette). The
 * scene reads `tweak` (a clone of these defaults) every frame, so these ARE the
 * shipped values.
 */
export const DEFAULT_TWEAK: HeroTweakConfig = {
  scene: {
    idleTravelSpeed: 6,
    scrollTravel: 159,
    worldDepth: 40,
    intensity: 1.68,
    recessionFloor: 0,
    fovBase: 90,
    cameraDrift: 2.15,
  },
  bloom: {
    intensity: 2.23,
    threshold: 0,
    smoothing: 0.71,
  },
  dof: {
    focusDistance: 0.06,
    focalLength: 0.09,
    bokehScale: 2.2,
  },
  grade: {
    vignetteOffset: 0,
    vignetteDarkness: 1.27,
    noiseOpacity: 0.59,
    chromaticAberration: 0.006,
  },
  palette: {
    colorA: "#0011ff", // blue
    colorB: "#575260", // gray-mauve
    colorHot: "#ff57ca", // pink highlight
  },
  path: {
    f1: 0.155,
    a1: 5.3,
    f2: 0.098,
    a2: 4.2,
    fy: 0.031,
    ay: 2.6,
    ramp: 15,
  },
  pointer: {
    pushRadius: 1,
    pushStrength: 0.47,
    glowRadius: 20,
  },
  fibers: {
    count: 100,
    alpha: 1.72,
    radiusMin: 0.045,
    radiusMax: 0.063,
    wave: 1.8,
    breathe: 0.12,
  },
  particles: {
    count: 700,
    alpha: 1,
    sizeMin: 1.2,
    sizeMax: 4.2,
    drift: 3,
  },
  nodes: {
    count: 136,
    alpha: 1.68,
    scaleMin: 0.22,
    scaleMax: 0.81,
    breathe: 0.8,
  },
  fragments: {
    count: 152,
    alpha: 1,
    tumble: 1,
  },
  footer: {
    particleCount: 310,
    nodeCount: 22,
    spawnMin: -11,
    spawnMax: -10,
    riseMin: 8,
    riseMax: 19.5,
    lifeMin: 12.5,
    lifeMax: 22,
  },
};

/** Deep clone so live edits never mutate the frozen defaults. */
function clone(c: HeroTweakConfig): HeroTweakConfig {
  return JSON.parse(JSON.stringify(c));
}

/** The single live config the whole scene reads from. */
export const tweak: HeroTweakConfig = clone(DEFAULT_TWEAK);

/**
 * `generation` bumps whenever a rebuild-class value changes (counts, scatter
 * ranges, world depth). worldObjects key their meshes on it so React re-creates
 * the affected geometry. Non-rebuild values never bump it (they're read live).
 */
let generation = 0;
/** Bumps on EVERY change — React-side consumers (post effects, panel) read it. */
let revision = 0;
const listeners = new Set<() => void>();

export function getGeneration() {
  return generation;
}

export function getRevision() {
  return revision;
}

/** Subscribe to config changes (used by the panel + React-side consumers). */
export function subscribeTweak(fn: () => void): () => void {
  listeners.add(fn);
  return () => listeners.delete(fn);
}

function emit() {
  revision++;
  for (const fn of listeners) fn();
}

/** Update a leaf value. `rebuild` bumps the generation (mesh re-create). */
export function setTweak<G extends keyof HeroTweakConfig, K extends keyof HeroTweakConfig[G]>(
  group: G,
  key: K,
  value: HeroTweakConfig[G][K],
  rebuild = false,
) {
  tweak[group][key] = value;
  if (rebuild) generation++;
  emit();
}

/** Reset everything to shipped defaults. */
export function resetTweak() {
  const d = clone(DEFAULT_TWEAK);
  (Object.keys(d) as (keyof HeroTweakConfig)[]).forEach((g) => {
    Object.assign(tweak[g], d[g]);
  });
  generation++;
  emit();
}

/** Serialize current config for pasting back into source. */
export function serializeTweak(): string {
  return JSON.stringify(tweak, null, 2);
}
