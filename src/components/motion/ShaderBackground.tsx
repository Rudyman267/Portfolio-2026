"use client";

import { useEffect, useRef, useState } from "react";

/**
 * Organic, noise-driven WebGL background for the hero (fromanother.love vibe,
 * cooled to match the blue neural identity in Figma 25:144).
 *
 * The fragment shader is built entirely on GPU noise:
 *  - domain-warped fractal (fBm) simplex noise drives flowing light "blobs" so
 *    the field breathes/drifts organically instead of reading as a plain gradient;
 *  - a fine animated grain/dither pass on top kills banding on the dark gradients
 *    and adds texture.
 * Colour is sampled from the noise field (deep navy base → electric blue → sparse
 * warm ember), so the light appears to move.
 *
 * Safety: capped DPR, RAF paused when the tab is hidden or the hero scrolls out of
 * view, full teardown on unmount. Reduced-motion / touch / no-WebGL fall back to a
 * static CSS gradient (never mounts the canvas), so it's cheap and calm there.
 */

const vertex = /* glsl */ `
  attribute vec2 uv;
  attribute vec2 position;
  varying vec2 vUv;
  void main() {
    vUv = uv;
    gl_Position = vec4(position, 0.0, 1.0);
  }
`;

const fragment = /* glsl */ `
  precision highp float;

  uniform float uTime;
  uniform vec2  uResolution;
  uniform vec2  uMouse;      // 0..1, eased pointer
  varying vec2  vUv;

  // --- simplex noise (Ashima / Stefan Gustavson) ---------------------------
  vec3 mod289(vec3 x){ return x - floor(x * (1.0/289.0)) * 289.0; }
  vec2 mod289(vec2 x){ return x - floor(x * (1.0/289.0)) * 289.0; }
  vec3 permute(vec3 x){ return mod289(((x*34.0)+1.0)*x); }

  float snoise(vec2 v){
    const vec4 C = vec4(0.211324865405187, 0.366025403784439,
                       -0.577350269189626, 0.024390243902439);
    vec2 i  = floor(v + dot(v, C.yy));
    vec2 x0 = v -   i + dot(i, C.xx);
    vec2 i1 = (x0.x > x0.y) ? vec2(1.0,0.0) : vec2(0.0,1.0);
    vec4 x12 = x0.xyxy + C.xxzz;
    x12.xy -= i1;
    i = mod289(i);
    vec3 p = permute( permute( i.y + vec3(0.0, i1.y, 1.0))
                             + i.x + vec3(0.0, i1.x, 1.0));
    vec3 m = max(0.5 - vec3(dot(x0,x0), dot(x12.xy,x12.xy),
                            dot(x12.zw,x12.zw)), 0.0);
    m = m*m; m = m*m;
    vec3 x  = 2.0 * fract(p * C.www) - 1.0;
    vec3 h  = abs(x) - 0.5;
    vec3 ox = floor(x + 0.5);
    vec3 a0 = x - ox;
    m *= 1.79284291400159 - 0.85373472095314 * (a0*a0 + h*h);
    vec3 g;
    g.x  = a0.x  * x0.x  + h.x  * x0.y;
    g.yz = a0.yz * x12.xz + h.yz * x12.yw;
    return 130.0 * dot(m, g);
  }

  // fractal Brownian motion — a few octaves of simplex
  float fbm(vec2 p){
    float sum = 0.0;
    float amp = 0.5;
    for (int i = 0; i < 5; i++){
      sum += amp * snoise(p);
      p   *= 2.02;
      amp *= 0.5;
    }
    return sum;
  }

  // cheap hash for the grain pass
  float hash(vec2 p){
    return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453123);
  }

  void main(){
    // aspect-correct coords centred at 0
    vec2 uv = vUv;
    vec2 p  = (uv - 0.5);
    p.x    *= uResolution.x / uResolution.y;

    float t = uTime * 0.045;

    // subtle pointer drift so the field leans toward the cursor
    vec2 mouse = (uMouse - 0.5) * 0.35;
    p += mouse;

    // --- domain warping: offset the sample coords by another fBm field -----
    vec2 q = vec2(fbm(p * 1.4 + vec2(0.0, t)),
                  fbm(p * 1.4 + vec2(3.2, t * 1.3)));
    vec2 r = vec2(fbm(p * 1.8 + 1.7 * q + vec2(1.7 - t, 9.2)),
                  fbm(p * 1.8 + 1.7 * q + vec2(8.3, 2.8 + t)));

    float f = fbm(p * 1.6 + 2.2 * r);
    f = f * 0.5 + 0.5;                 // -> 0..1

    // radial falloff — light pools toward the centre, edges sink to black
    float vign = smoothstep(1.15, 0.15, length(p));

    // --- colour ramp: deep navy -> blue -> electric cyan -------------------
    vec3 base   = vec3(0.012, 0.024, 0.045);   // near-black navy
    vec3 mid    = vec3(0.035, 0.140, 0.320);   // deep blue
    vec3 bright = vec3(0.230, 0.540, 0.900);   // electric blue
    vec3 col = mix(base, mid, smoothstep(0.34, 0.74, f));
    col = mix(col, bright, smoothstep(0.70, 0.97, f) * vign);

    // sparse warm ember where the field peaks (the faint warm streaks in Figma)
    float ember = smoothstep(0.88, 0.995, f) * smoothstep(0.35, 0.9, vign);
    col += vec3(0.55, 0.28, 0.10) * ember * 0.4;

    // lift the pooled light, keep the surrounding dark deep
    col *= 0.28 + 0.85 * vign;
    col += bright * pow(f, 3.0) * 0.10 * vign;

    // --- grain / dither: animated fine noise to kill banding ---------------
    float g = hash(gl_FragCoord.xy + fract(uTime) * 91.7);
    col += (g - 0.5) * 0.045;

    gl_FragColor = vec4(col, 1.0);
  }
`;

export function ShaderBackground({ className }: { className?: string }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  // Start assuming the static fallback; flip to canvas only once we've confirmed
  // (client-side) that animation is wanted and WebGL is available.
  const [animated, setAnimated] = useState(false);

  useEffect(() => {
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const coarse = window.matchMedia("(pointer: coarse)").matches;
    if (reduce || coarse) return; // keep the static fallback

    const canvas = canvasRef.current;
    if (!canvas) return;

    let raf = 0;
    let disposed = false;
    let visible = true;
    let running = false;
    let cleanup = () => {};

    // easing state for the pointer so parallax feels liquid, not twitchy
    const mouse = { x: 0.5, y: 0.5 };
    const target = { x: 0.5, y: 0.5 };

    (async () => {
      // client-only dynamic import keeps ogl out of the SSR/RSC graph
      const { Renderer, Program, Mesh, Triangle, Vec2 } = await import("ogl");
      if (disposed) return;

      let r: InstanceType<typeof Renderer>;
      try {
        r = new Renderer({
          canvas,
          alpha: false,
          antialias: false,
          dpr: Math.min(window.devicePixelRatio || 1, 1.5),
          powerPreference: "high-performance",
        });
      } catch {
        return; // WebGL unavailable — the static fallback stays
      }
      const gl = r.gl;
      gl.clearColor(0.016, 0.031, 0.055, 1);

      const geometry = new Triangle(gl);
      const program = new Program(gl, {
        vertex,
        fragment,
        uniforms: {
          uTime: { value: 0 },
          uResolution: { value: new Vec2(1, 1) },
          uMouse: { value: new Vec2(0.5, 0.5) },
        },
      });
      const mesh = new Mesh(gl, { geometry, program });

      const resize = () => {
        const parent = canvas.parentElement;
        const w = parent?.clientWidth || window.innerWidth;
        const h = parent?.clientHeight || window.innerHeight;
        if (w === 0 || h === 0) return; // not laid out yet — wait for the observer
        r.setSize(w, h);
        program.uniforms.uResolution.value.set(
          gl.drawingBufferWidth,
          gl.drawingBufferHeight,
        );
      };
      resize();
      window.addEventListener("resize", resize);

      // A one-shot resize() can fire before the container has its final box
      // (the hero grows when ScrollTrigger pins it and when the loader unlocks
      // scroll), leaving a strip the canvas never covers. Observe the parent so
      // the canvas always re-fits to the real box.
      const ro = new ResizeObserver(resize);
      if (canvas.parentElement) ro.observe(canvas.parentElement);

      const onPointer = (e: PointerEvent) => {
        target.x = e.clientX / window.innerWidth;
        target.y = 1 - e.clientY / window.innerHeight;
      };
      window.addEventListener("pointermove", onPointer, { passive: true });

      // reveal only once the first frame is on screen (no flash of black canvas)
      setAnimated(true);

      const loop = (time: number) => {
        if (disposed) return;
        raf = requestAnimationFrame(loop);
        mouse.x += (target.x - mouse.x) * 0.04;
        mouse.y += (target.y - mouse.y) * 0.04;
        program.uniforms.uTime.value = time * 0.001;
        program.uniforms.uMouse.value.set(mouse.x, mouse.y);
        r.render({ scene: mesh });
      };

      const start = () => {
        if (running || disposed) return;
        running = true;
        raf = requestAnimationFrame(loop);
      };
      const stop = () => {
        running = false;
        cancelAnimationFrame(raf);
      };

      const onVisibility = () => {
        if (document.hidden || !visible) stop();
        else start();
      };
      document.addEventListener("visibilitychange", onVisibility);

      // pause when the hero scrolls out of view
      const io = new IntersectionObserver(
        ([entry]) => {
          visible = entry.isIntersecting;
          onVisibility();
        },
        { threshold: 0.01 },
      );
      io.observe(canvas);

      start();

      // teardown
      cleanup = () => {
        stop();
        window.removeEventListener("resize", resize);
        window.removeEventListener("pointermove", onPointer);
        document.removeEventListener("visibilitychange", onVisibility);
        ro.disconnect();
        io.disconnect();
        const ext = gl.getExtension("WEBGL_lose_context");
        ext?.loseContext();
      };
    })();

    return () => {
      disposed = true;
      cancelAnimationFrame(raf);
      cleanup();
    };
  }, []);

  return (
    <div
      className={className}
      aria-hidden="true"
      style={{
        position: "absolute",
        inset: 0,
        overflow: "hidden",
        pointerEvents: "none",
        // static fallback — a calm cool-blue radial that the canvas paints over
        background:
          "radial-gradient(120% 90% at 30% 40%, rgb(20 54 102) 0%, rgb(8 20 38) 45%, rgb(4 6 10) 100%)",
      }}
    >
      <canvas
        ref={canvasRef}
        style={{
          position: "absolute",
          inset: 0,
          width: "100%",
          height: "100%",
          opacity: animated ? 1 : 0,
          transition: "opacity 800ms ease",
        }}
      />
    </div>
  );
}
