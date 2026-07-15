"use client";

import { useEffect, useRef } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import * as THREE from "three";
import {
  pathPointX,
  pathPointY,
  type SceneState,
} from "@/components/hero3d/SceneState";
import { heroScroll } from "@/components/hero3d/heroScroll";
import { tweak } from "@/components/hero3d/tweakConfig";

/**
 * SceneController — the single per-frame heartbeat. Mutates the shared uniform
 * objects (time, travel, speed, intensity, pointer ray, click pulses); every
 * material reads the same objects, so nothing else runs per frame on the CPU.
 *
 * Travel = scroll-scrubbed journey + a gentle idle drift. The Hero's pinned
 * scrub timeline writes its progress into `heroScroll` (same source of truth
 * as the headline phrases), and travel eases toward progress × SCROLL_TRAVEL —
 * so scrolling flies you along the snake path in perfect sync with the text,
 * in both directions, while the world never fully stands still.
 *
 * CameraRig — cinematic drift: the camera breathes, leans toward the pointer
 * with heavy inertia, and banks its gaze into the upcoming path bend.
 */

// Defaults live in tweakConfig (scene.idleTravelSpeed / scene.scrollTravel); the
// dev panel drives them live. When a preset is locked, these become the baked
// values again.

export function SceneController({ state }: { state: SceneState }) {
  const { camera } = useThree();
  const raycaster = useRef(new THREE.Raycaster());
  const scroll = useRef({ lastY: 0, vel: 0, init: false });
  const travel = useRef({ idle: 0, scroll: 0 });
  const ndc = useRef(new THREE.Vector2());

  // pointer + click pulse listeners
  useEffect(() => {
    const onMove = (e: PointerEvent) => {
      state.pointer.x = (e.clientX / window.innerWidth) * 2 - 1;
      state.pointer.y = -(e.clientY / window.innerHeight) * 2 + 1;
    };
    const onDown = () => {
      // energy pulse propagates from the current (smoothed) pointer ray
      state.uniforms.uPulseTime.value = state.time;
      state.uniforms.uPulseOrigin.value.copy(state.uniforms.uRayOrigin.value);
      state.uniforms.uPulseDir.value.copy(state.uniforms.uRayDir.value);
    };
    window.addEventListener("pointermove", onMove, { passive: true });
    window.addEventListener("pointerdown", onDown, { passive: true });
    return () => {
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerdown", onDown);
    };
  }, [state]);

  useFrame((_, rawDt) => {
    const dt = Math.min(rawDt, 0.05); // clamp tab-switch spikes
    state.time += dt;
    const u = state.uniforms;
    u.uTime.value = state.time;

    // --- live dev-tweak values → shared uniforms (no-op cost when unchanged) --
    const tw = tweak;
    u.uRecessionFloor.value = tw.scene.recessionFloor;
    u.uPushRadius.value = tw.pointer.pushRadius;
    u.uPushStrength.value = tw.pointer.pushStrength;
    u.uGlowRadius.value = tw.pointer.glowRadius;
    u.uPath1.value.set(tw.path.f1, tw.path.a1, tw.path.f2, tw.path.a2);
    u.uPath2.value.set(tw.path.fy, tw.path.ay, tw.path.ramp);

    // --- scroll velocity → traversal speed + scene intensity ---------------
    const s = scroll.current;
    const y = window.scrollY;
    if (!s.init) {
      s.lastY = y;
      s.init = true;
    }
    const instVel = dt > 0 ? (y - s.lastY) / dt : 0;
    s.lastY = y;
    s.vel += (instVel - s.vel) * Math.min(1, dt * 6);

    // speed/intensity still swell with scroll velocity (FOV + glow energy)
    const speedTarget = 1 + THREE.MathUtils.clamp(Math.abs(s.vel) / 900, 0, 2.4);
    u.uSpeed.value += (speedTarget - u.uSpeed.value) * Math.min(1, dt * 2.2);

    // travel = idle drift + scrubbed journey (eased, reversible)
    const trav = travel.current;
    trav.idle += dt * tw.scene.idleTravelSpeed;
    const target = heroScroll.progress * tw.scene.scrollTravel;
    trav.scroll += (target - trav.scroll) * Math.min(1, dt * 3.0);
    u.uTravel.value = trav.idle + trav.scroll;
    // publish the eased travel for THREE-free DOM riders (works project nodes)
    heroScroll.travel = u.uTravel.value;
    heroScroll.sceneLive = true;

    const intensityTarget =
      tw.scene.intensity + THREE.MathUtils.clamp(Math.abs(s.vel) / 2600, 0, 0.45);
    u.uIntensity.value +=
      (intensityTarget - u.uIntensity.value) * Math.min(1, dt * 2);

    // --- smoothed pointer → world-space interaction ray ---------------------
    const p = state.pointer;
    const ease = Math.min(1, dt * 2.4); // heavier inertia = softer, organic return
    p.sx += (p.x - p.sx) * ease;
    p.sy += (p.y - p.sy) * ease;

    ndc.current.set(p.sx, p.sy);
    raycaster.current.setFromCamera(ndc.current, camera);
    u.uRayOrigin.value.copy(raycaster.current.ray.origin);
    u.uRayDir.value.copy(raycaster.current.ray.direction);
  });

  return null;
}

export function CameraRig({ state }: { state: SceneState }) {
  const { camera } = useThree();
  const look = useRef(new THREE.Vector3(0, 0, -12));

  useFrame((_, rawDt) => {
    const dt = Math.min(rawDt, 0.05);
    const p = state.pointer;
    const t = state.time;

    // drift toward the pointer with inertia + a slow breathing float
    const drift = tweak.scene.cameraDrift;
    const tx = p.sx * drift + Math.sin(t * 0.23) * 0.35;
    const ty = p.sy * (drift * 0.62) + Math.cos(t * 0.17) * 0.28;
    const ease = Math.min(1, dt * 2.0);
    camera.position.x += (tx - camera.position.x) * ease;
    camera.position.y += (ty - camera.position.y) * ease;
    camera.position.z = 0.1;

    // gaze leads into the upcoming path bend (banking into the turn) + pointer
    const travel = state.uniforms.uTravel.value;
    const bendX = pathPointX(travel + 16) - pathPointX(travel);
    const bendY = pathPointY(travel + 16) - pathPointY(travel);
    look.current.set(p.sx * 3.2 + bendX * 0.5, p.sy * 2.0 + bendY * 0.35, -14);
    camera.lookAt(look.current);

    // a whisper of roll: pointer lean + banking into the curve
    // (applied after lookAt, which resets rotation)
    camera.rotation.z += -p.sx * 0.035 - bendX * 0.012;
    // gentle FOV swell with traversal speed
    const cam = camera as THREE.PerspectiveCamera;
    const fovTarget = tweak.scene.fovBase + (state.uniforms.uSpeed.value - 1) * 4.5;
    if (Math.abs(cam.fov - fovTarget) > 0.01) {
      cam.fov += (fovTarget - cam.fov) * Math.min(1, dt * 2.5);
      cam.updateProjectionMatrix();
    }
  });

  return null;
}
