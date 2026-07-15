import { tweak } from "@/components/hero3d/tweakConfig";

/**
 * JS mirror of the shaders' snake path (PATH_GLSL in shaders.ts), reading the
 * LIVE tweak constants — the same uPath1/uPath2 values the tunnel instances
 * bend along. THREE-free on purpose so DOM consumers (the works-journey
 * project nodes) can ride the exact same curve without pulling three into the
 * main bundle.
 *
 * NOTE: SceneState.ts has an older pathPointX/Y pair reading its static PATH
 * constants (used by the camera rig). The SHADERS read the tweak uniforms —
 * this mirror matches the shaders, which is what the eye sees.
 */

export function pathX(s: number) {
  const p = tweak.path;
  return Math.sin(s * p.f1) * p.a1 + Math.sin(s * p.f2 + 2.0) * p.a2;
}

export function pathY(s: number) {
  const p = tweak.path;
  return Math.cos(s * p.fy + 1.0) * p.ay;
}

export function smoothstep(a: number, b: number, x: number) {
  const t = Math.min(1, Math.max(0, (x - a) / (b - a)));
  return t * t * (3 - 2 * t);
}

/**
 * World-space lateral offset of a point `d` units in front of the camera,
 * exactly as PATH_GLSL's pathOffset(): relative bend from the camera's path
 * position, ramped in with depth so the near field stays straight.
 */
export function pathOffset(travel: number, d: number) {
  const ramp = smoothstep(0, tweak.path.ramp, d);
  return {
    x: (pathX(travel + d) - pathX(travel)) * ramp,
    y: (pathY(travel + d) - pathY(travel)) * ramp,
  };
}
