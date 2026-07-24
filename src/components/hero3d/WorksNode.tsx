"use client";

import { useEffect, useMemo } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import * as THREE from "three";
import { RoundedBoxGeometry } from "three/examples/jsm/geometries/RoundedBoxGeometry.js";
import { heroScroll } from "@/components/hero3d/heroScroll";
import { smoothstep } from "@/components/hero3d/pathMath";
import { tweak, subscribeTweak } from "@/components/hero3d/tweakConfig";
import type { SceneState } from "@/components/hero3d/SceneState";

/**
 * WorksProjectNode — the summoned project node of the works chapter, rendered
 * as a REAL energy cuboid inside the hero scene (same rounded-box geometry +
 * fresnel/hot-core shader recipe as the instanced EnergyNodes, same additive
 * blending, and it inherits the scene's bloom/DoF/grade post-FX for free).
 *
 * It is a CHILD OF THE CAMERA: the works ticker (WorksJourney.ts) writes the
 * flight position in camera space into heroScroll.worksNode each frame, and
 * because the DOM overlay projects with the same vertical FOV, this mesh and
 * the DOM window that replaces it stay pixel-aligned by construction — the
 * dock point (0,0,-d) is exactly screen centre regardless of camera drift.
 *
 * Lifecycle per beat, driven purely by (p, m) from the scrubbed proxies:
 *   flight  p 0→1  — visible, tumbling, glow rising ("this one is chosen")
 *   morph   m 0→1  — settles face-on and fades out while the DOM white window
 *                    fades in over it (the crossfade masks the handoff)
 */

const DOCK_PX_H = 92; // must match NODE_H in WorksJourney.tsx (DOM handoff size)
const FLIGHT_H = 1.05; // world-unit height mid-tunnel (≈ a background energy box)
const GEO_H = 1.23; // geometry height at scale 1 (1.6 × 92/120 aspect)

const worksNodeVertex = /* glsl */ `
  varying vec3 vNormalW;
  varying vec3 vViewW;
  void main(){
    vec4 world = modelMatrix * vec4(position, 1.0);
    vNormalW = normalize(mat3(modelMatrix) * normal);
    vViewW = normalize(cameraPosition - world.xyz);
    gl_Position = projectionMatrix * viewMatrix * world;
  }
`;

// nodeFragment (shaders.ts) with the per-instance varyings promoted to
// uniforms — same fresnel edge, hot pulsing core, and glow lift.
const worksNodeFragment = /* glsl */ `
  precision highp float;
  uniform float uTime;
  uniform float uIntensity;
  uniform vec3 uColorB;
  uniform vec3 uColorHot;
  uniform float uAlpha;
  uniform float uGlow;

  varying vec3 vNormalW;
  varying vec3 vViewW;

  void main(){
    float fres = pow(1.0 - abs(dot(normalize(vNormalW), normalize(vViewW))), 2.0);
    float core = 1.0 - fres;

    float pulse = 0.6 + 0.4 * sin(uTime * 0.9 + 2.4);
    vec3 col = uColorB * (fres * 1.4 + 0.15) + uColorHot * core * 0.5 * pulse;
    col += uColorHot * uGlow * 1.6;

    float alpha = (fres * 0.7 + core * 0.22 + uGlow * 0.35) * uIntensity * uAlpha;
    gl_FragColor = vec4(col, alpha);
  }
`;

export function WorksProjectNode({ state }: { state: SceneState }) {
  const camera = useThree((s) => s.camera);
  const scene = useThree((s) => s.scene);
  const size = useThree((s) => s.size);

  const mesh = useMemo(() => {
    // same proportions as the DOM node (120×92) + the EnergyNodes' corner feel
    const geo = new RoundedBoxGeometry(1.6, GEO_H, 1.44, 3, 0.28);
    const mat = new THREE.ShaderMaterial({
      vertexShader: worksNodeVertex,
      fragmentShader: worksNodeFragment,
      uniforms: {
        uTime: state.uniforms.uTime,
        uIntensity: state.uniforms.uIntensity,
        uColorB: { value: new THREE.Color(tweak.palette.colorB) },
        uColorHot: { value: new THREE.Color(tweak.palette.colorHot) },
        uAlpha: { value: 0 },
        uGlow: { value: 0 },
      },
      transparent: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
    });
    const m = new THREE.Mesh(geo, mat);
    m.frustumCulled = false;
    m.renderOrder = 4; // above the instanced systems
    m.visible = false;
    return m;
  }, [state]);

  // palette stays in sync with the dev tweak panel
  useEffect(() => {
    const sync = () => {
      const u = (mesh.material as THREE.ShaderMaterial).uniforms;
      (u.uColorB.value as THREE.Color).set(tweak.palette.colorB);
      (u.uColorHot.value as THREE.Color).set(tweak.palette.colorHot);
    };
    sync();
    return subscribeTweak(sync);
  }, [mesh]);

  // ride as a camera child — the camera must join the scene graph for its
  // children to render (three renders only what hangs off the scene)
  useEffect(() => {
    scene.add(camera);
    camera.add(mesh);
    return () => {
      camera.remove(mesh);
      (mesh.material as THREE.ShaderMaterial).dispose();
      mesh.geometry.dispose();
    };
  }, [camera, scene, mesh]);

  useFrame(() => {
    const wn = heroScroll.worksNode;
    const mat = mesh.material as THREE.ShaderMaterial;

    // visible while flying; burns off as the DOM window crossfades in (m)
    const alpha = wn.on
      ? Math.min(wn.p * 5, 1) * (1 - smoothstep(0.15, 0.6, wn.m))
      : 0;
    if (alpha <= 0.002) {
      mesh.visible = false;
      return;
    }
    mesh.visible = true;
    mat.uniforms.uAlpha.value = alpha;

    const t = state.time;
    const d = Math.max(-wn.z, 0.2);
    mesh.position.set(wn.x, wn.y, wn.z);

    // "one of them glows": energy rises as the node is chosen + a live pulse
    mat.uniforms.uGlow.value =
      0.22 + 0.6 * Math.min(wn.p * 1.3, 1) + 0.08 * Math.sin(t * 2.1);

    // scale: a background-box size in the tunnel → exactly the DOM node's px
    // size at the dock (so the white window takes over seamlessly)
    const cam = camera as THREE.PerspectiveCamera;
    const tanY = Math.tan((cam.fov * Math.PI) / 360);
    const dockH = (DOCK_PX_H * 2 * d * tanY) / size.height;
    // exponent matches flightXY's arrival curve (2.2) so scale and position
    // decelerate together in one continuous glide.
    const settle = 1 - Math.pow(1 - wn.p, 2.2);
    const breathe = 1 + 0.05 * (1 - wn.m) * Math.sin(t * 0.8);
    mesh.scale.setScalar(
      ((FLIGHT_H + (dockH - FLIGHT_H) * settle) / GEO_H) * breathe,
    );

    // lazy drift-rotation in flight (half the old rates — the fast 3-axis
    // tumble read as "flipping"), settling face-on for the window handoff
    const free = (1 - settle) * (1 - wn.m);
    mesh.rotation.set(
      free * (t * 0.22 + 0.9) + 0.05 * (1 - wn.m) * Math.sin(t * 0.7),
      free * (t * 0.28 + 2.1),
      free * (t * 0.14),
    );
  });

  return null;
}
