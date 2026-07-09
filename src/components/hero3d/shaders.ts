/**
 * GLSL library for the hero scene. Every material is additive-ish, fog-faded at
 * the far plane and faded out again just before passing the camera, so the
 * world reads as an endless luminous ecosystem with no visible seams.
 *
 * Shared chunks are plain template strings stitched into each shader.
 */

/**
 * The snake path — bends the whole world along a curving route. The path
 * constants are driven by uniforms (uPath1 = f1,a1,f2,a2 · uPath2 = fy,ay,ramp)
 * so the dev tweak panel can reshape the curve live; the JS mirror (pathPointX/Y
 * in SceneState) is what the camera rig reads and stays the source of truth for
 * the shipped values. `d` = distance in front of the camera; the bend ramps in
 * with depth so the near field stays straight and readable.
 * Requires COMMON_UNIFORMS (uTravel) above it.
 */
export const PATH_GLSL = /* glsl */ `
  uniform vec4 uPath1; /* f1, a1, f2, a2 */
  uniform vec3 uPath2; /* fy, ay, ramp */
  vec2 pathPoint(float s){
    return vec2(
      sin(s * uPath1.x) * uPath1.y + sin(s * uPath1.z + 2.0) * uPath1.w,
      cos(s * uPath2.x + 1.0) * uPath2.y
    );
  }
  vec2 pathOffset(float d){
    vec2 rel = pathPoint(uTravel + d) - pathPoint(uTravel);
    return rel * smoothstep(0.0, uPath2.z, d);
  }
`;

/** Cheap hash-based 3D value noise + 2-octave fbm — plenty for organic drift. */
export const NOISE = /* glsl */ `
  float hash31(vec3 p){
    p = fract(p * 0.3183099 + vec3(0.1, 0.2, 0.3));
    p *= 17.0;
    return fract(p.x * p.y * p.z * (p.x + p.y + p.z));
  }
  float vnoise(vec3 p){
    vec3 i = floor(p);
    vec3 f = fract(p);
    f = f * f * (3.0 - 2.0 * f);
    float n000 = hash31(i);
    float n100 = hash31(i + vec3(1,0,0));
    float n010 = hash31(i + vec3(0,1,0));
    float n110 = hash31(i + vec3(1,1,0));
    float n001 = hash31(i + vec3(0,0,1));
    float n101 = hash31(i + vec3(1,0,1));
    float n011 = hash31(i + vec3(0,1,1));
    float n111 = hash31(i + vec3(1,1,1));
    return mix(
      mix(mix(n000, n100, f.x), mix(n010, n110, f.x), f.y),
      mix(mix(n001, n101, f.x), mix(n011, n111, f.x), f.y),
      f.z);
  }
  float fbm(vec3 p){
    return vnoise(p) * 0.65 + vnoise(p * 2.13 + 7.7) * 0.35;
  }
`;

/**
 * Mouse-ray interaction: distance from a point to the pointer ray, the radial
 * push direction away from the ray, and the click-pulse wave envelope.
 */
export const RAY = /* glsl */ `
  uniform vec3 uRayOrigin;
  uniform vec3 uRayDir;
  uniform float uPulseTime;
  uniform vec3 uPulseOrigin;
  uniform vec3 uPulseDir;
  uniform float uPushRadius;   /* base pointer push radius (per-system scaled) */
  uniform float uPushStrength; /* base pointer push strength (per-system scaled) */
  uniform float uGlowRadius;   /* base hover illumination radius */

  vec3 closestOnRay(vec3 p, vec3 ro, vec3 rd){
    return ro + rd * max(dot(p - ro, rd), 0.0);
  }
  /* radial push away from the pointer ray — gaussian falloff (smooth
     everywhere, no kink at the radius edge → no aggressive snap) */
  vec3 rayPush(vec3 p, float radius, float strength){
    vec3 c = closestOnRay(p, uRayOrigin, uRayDir);
    vec3 d = p - c;
    float dist = length(d);
    float fall = exp(-(dist * dist) / (radius * radius * 0.30));
    return (dist > 0.0001 ? d / dist : vec3(0.0)) * fall * strength;
  }
  /* proximity 0..1 to the pointer ray (for hover illumination) */
  float rayGlow(vec3 p, float radius){
    vec3 c = closestOnRay(p, uRayOrigin, uRayDir);
    return smoothstep(radius, 0.0, length(p - c));
  }
  /* expanding energy pulse from the last click, travelling along its ray */
  float pulseWave(vec3 p, float time){
    float age = time - uPulseTime;
    if (age < 0.0 || age > 2.5) return 0.0;
    vec3 c = closestOnRay(p, uPulseOrigin, uPulseDir);
    float dist = length(p - c);
    float front = age * 14.0;             /* wave speed */
    float band = 1.0 - abs(dist - front) / 2.2;
    return max(band, 0.0) * (1.0 - age / 2.5);
  }
`;

export const COMMON_UNIFORMS = /* glsl */ `
  uniform float uTime;
  uniform float uTravel;
  uniform float uSpeed;
  uniform float uIntensity;
  uniform float uRecessionFloor; /* depthAtt floor — darkness of the far tunnel */
`;

/* ============================================================================
   FIBERS — instanced open tubes flowing along Z. Wave deformation + breathing
   in the vertex shader; data pulses race along them in the fragment shader.
   ========================================================================== */

export const fiberVertex = /* glsl */ `
  ${COMMON_UNIFORMS}
  ${NOISE}
  ${RAY}
  ${PATH_GLSL}
  uniform float uDepth;
  uniform float uWave;    /* fiber wave deformation amount */
  uniform float uBreathe; /* fiber breathing amount */

  attribute vec3 aOffset;   /* base position (x, y, zSeed) */
  attribute vec4 aParams;   /* radius, length, drift speed, seed */

  varying float vAlong;     /* 0..1 along the fiber */
  varying float vSeed;
  varying float vFade;
  varying float vGlow;
  varying float vPulse;

  void main(){
    float radius = aParams.x;
    float len    = aParams.y;
    float drift  = aParams.z;
    float seed   = aParams.w;

    /* unit cylinder is authored along Y: position.y in [-0.5, 0.5] */
    float along = position.y + 0.5;
    vAlong = along;
    vSeed = seed;

    /* recycle the instance through the depth window */
    float z = -mod(aOffset.z + uTravel * drift, uDepth);

    /* organic wave — single-octave, slow: smooth undulation, no jitter
       (the 2nd fbm octave was the source of the old twitchiness) */
    vec3 spine = vec3(aOffset.xy, z + (along - 0.5) * len);
    float t = uTime * 0.14;
    vec2 wave = vec2(
      vnoise(vec3(seed * 7.1, spine.z * 0.05, t)) - 0.5,
      vnoise(vec3(seed * 3.7, spine.z * 0.05 + 5.0, t + 3.0)) - 0.5
    ) * uWave * sin(along * 3.14159);
    spine.xy += wave;

    /* bend the whole wire along the snake path */
    spine.xy += pathOffset(-spine.z);

    /* breathing */
    float breathe = 1.0 + uBreathe * sin(uTime * 0.5 + seed * 6.28);

    /* pointer: a soft bend away from the ray, anchored at the ends so the
       wire flexes in the middle instead of jumping wholesale */
    float anchor = 0.3 + 0.7 * sin(along * 3.14159);
    spine += rayPush(spine, uPushRadius, uPushStrength) * anchor;
    float pw = pulseWave(spine, uTime);
    vPulse = pw;
    spine += rayPush(spine, uPushRadius * 1.33, pw * 0.5) * anchor;

    vGlow = rayGlow(spine, uGlowRadius);

    /* tube cross-section (authored circle in XZ) */
    vec3 world = spine + vec3(position.x, position.z, 0.0) * radius * breathe;

    /* fade at far spawn and before passing the camera; also near wrap edges */
    float fadeFar  = smoothstep(uDepth * 0.98, uDepth * 0.7, -z);
    float fadeNear = smoothstep(-1.0, -6.0, world.z);
    /* progressive depth attenuation — full presence near the camera, then the
       tunnel melts into the darkness of the distance (gladeye-style recession) */
    float depthAtt = mix(uRecessionFloor, 1.0, smoothstep(uDepth * 0.65, 10.0, -z));
    vFade = fadeFar * fadeNear * depthAtt;

    gl_Position = projectionMatrix * modelViewMatrix * vec4(world, 1.0);
  }
`;

export const fiberFragment = /* glsl */ `
  precision highp float;
  ${COMMON_UNIFORMS}
  uniform vec3 uColorA;   /* midnight blue */
  uniform vec3 uColorB;   /* electric cyan */
  uniform vec3 uColorHot; /* white highlight */
  uniform float uAlpha;   /* per-system alpha multiplier */

  varying float vAlong;
  varying float vSeed;
  varying float vFade;
  varying float vGlow;
  varying float vPulse;

  void main(){
    /* soft ends so fibers never show hard cuts */
    float ends = smoothstep(0.0, 0.12, vAlong) * smoothstep(1.0, 0.88, vAlong);

    vec3 col = mix(uColorA, uColorB, 0.35 + 0.65 * fract(vSeed * 13.7));

    /* data pulse racing along the fiber */
    float stream = fract(vAlong * 2.0 - uTime * (0.35 + fract(vSeed * 5.3) * 0.5) - vSeed * 8.0);
    float packet = smoothstep(0.12, 0.0, stream) * smoothstep(0.0, 0.02, stream + 0.02);
    col += uColorHot * packet * 1.6;

    /* hover illumination + click pulse */
    col += uColorB * vGlow * 0.8;
    col += uColorHot * vPulse * 1.2;

    float alpha = (0.15 + packet * 0.4 + vGlow * 0.18) * ends * vFade * uIntensity * uAlpha;
    gl_FragColor = vec4(col, alpha);
  }
`;

/* ============================================================================
   PARTICLES — a drifting point field; repelled by the pointer ray, springing
   back through the smoothed uniforms. Soft round sprites, additive.
   ========================================================================== */

export const particleVertex = /* glsl */ `
  ${COMMON_UNIFORMS}
  ${NOISE}
  ${RAY}
  ${PATH_GLSL}
  uniform float uDepth;
  uniform float uPixelRatio;
  uniform float uDrift; /* ambient drift amount */

  attribute float aSeed;
  attribute float aSize;

  varying float vSeed;
  varying float vFade;
  varying float vGlow;

  void main(){
    vSeed = aSeed;

    vec3 p = position;
    p.z = -mod(position.z + uTravel * (0.9 + fract(aSeed * 3.3) * 0.4), uDepth);

    /* slow ambient drift */
    float t = uTime * 0.12;
    p.x += (fbm(vec3(aSeed * 9.2, t, p.z * 0.05)) - 0.5) * uDrift;
    p.y += (fbm(vec3(aSeed * 4.6 + 3.0, t + 9.0, p.z * 0.05)) - 0.5) * uDrift;

    /* bend along the snake path */
    p.xy += pathOffset(-p.z);

    /* pointer repulsion — gentle, returns smoothly via the smoothed ray */
    p += rayPush(p, uPushRadius * 0.8, uPushStrength * 1.7);
    float pw = pulseWave(p, uTime);
    p += rayPush(p, uPushRadius * 1.6, pw * 0.9);

    vGlow = rayGlow(p, uGlowRadius * 0.86) + pw * 0.8;

    float fadeFar  = smoothstep(uDepth * 0.98, uDepth * 0.6, -p.z);
    float fadeNear = smoothstep(-0.5, -4.0, p.z);
    float depthAtt = mix(uRecessionFloor, 1.0, smoothstep(uDepth * 0.65, 10.0, -p.z));
    vFade = fadeFar * fadeNear * depthAtt;

    vec4 mv = modelViewMatrix * vec4(p, 1.0);
    gl_Position = projectionMatrix * mv;
    float twinkle = 0.75 + 0.25 * sin(uTime * (1.0 + fract(aSeed * 7.7)) + aSeed * 40.0);
    gl_PointSize = aSize * uPixelRatio * twinkle * (34.0 / -mv.z);
  }
`;

export const particleFragment = /* glsl */ `
  precision highp float;
  ${COMMON_UNIFORMS}
  uniform vec3 uColorA;
  uniform vec3 uColorB;
  uniform vec3 uColorHot;
  uniform float uAlpha;

  varying float vSeed;
  varying float vFade;
  varying float vGlow;

  void main(){
    /* square "pixel" sprite with a hint of AA */
    vec2 uv = gl_PointCoord - 0.5;
    float m = max(abs(uv.x), abs(uv.y));
    float disc = smoothstep(0.5, 0.38, m);

    vec3 col = mix(uColorA, uColorB, fract(vSeed * 11.3));
    col = mix(col, uColorHot, step(0.93, fract(vSeed * 5.1)) * 0.8); /* rare white motes */
    col += uColorB * vGlow;

    float alpha = disc * (0.34 + vGlow * 0.4) * vFade * uIntensity * uAlpha;
    gl_FragColor = vec4(col, alpha);
  }
`;

/* ============================================================================
   ENERGY NODES — sparse glowing cores with a fresnel halo; they breathe, and
   illuminate when the pointer ray passes near (hover interaction).
   ========================================================================== */

export const nodeVertex = /* glsl */ `
  ${COMMON_UNIFORMS}
  ${NOISE}
  ${RAY}
  ${PATH_GLSL}
  uniform float uDepth;
  uniform float uBreathe; /* node breathing amount */

  attribute vec3 aOffset;
  attribute vec2 aParams; /* scale, seed */

  varying vec3 vNormalW;
  varying vec3 vViewW;
  varying float vFade;
  varying float vGlow;
  varying float vSeed;

  void main(){
    float scale = aParams.x;
    float seed  = aParams.y;
    vSeed = seed;

    vec3 c = vec3(aOffset.xy, -mod(aOffset.z + uTravel * 1.0, uDepth));
    c.x += (fbm(vec3(seed * 8.0, uTime * 0.1, 0.0)) - 0.5) * 2.0;
    c.y += (fbm(vec3(seed * 5.0 + 2.0, uTime * 0.1 + 4.0, 0.0)) - 0.5) * 2.0;
    c.xy += pathOffset(-c.z);

    float breathe = 1.0 + uBreathe * sin(uTime * 0.8 + seed * 6.28318);
    float pw = pulseWave(c, uTime);
    vGlow = rayGlow(c, uGlowRadius * 0.71) + pw;

    vec3 world = c + position * scale * breathe * (1.0 + vGlow * 0.25);

    float fadeFar  = smoothstep(uDepth * 0.98, uDepth * 0.65, -c.z);
    float fadeNear = smoothstep(-1.0, -7.0, c.z);
    float depthAtt = mix(uRecessionFloor, 1.0, smoothstep(uDepth * 0.65, 10.0, -c.z));
    vFade = fadeFar * fadeNear * depthAtt;

    vNormalW = normalize(mat3(modelMatrix) * normal);
    vViewW = normalize(cameraPosition - world);
    gl_Position = projectionMatrix * modelViewMatrix * vec4(world, 1.0);
  }
`;

export const nodeFragment = /* glsl */ `
  precision highp float;
  ${COMMON_UNIFORMS}
  uniform vec3 uColorB;
  uniform vec3 uColorHot;
  uniform float uAlpha;

  varying vec3 vNormalW;
  varying vec3 vViewW;
  varying float vFade;
  varying float vGlow;
  varying float vSeed;

  void main(){
    float fres = pow(1.0 - abs(dot(normalize(vNormalW), normalize(vViewW))), 2.0);
    float core = 1.0 - fres;

    float pulse = 0.6 + 0.4 * sin(uTime * (0.7 + fract(vSeed * 3.1)) + vSeed * 20.0);
    vec3 col = uColorB * (fres * 1.4 + 0.15) + uColorHot * core * 0.5 * pulse;
    col += uColorHot * vGlow * 1.6;

    float alpha = (fres * 0.7 + core * 0.22 + vGlow * 0.35) * vFade * uIntensity * uAlpha;
    gl_FragColor = vec4(col, alpha);
  }
`;

/* ============================================================================
   FRAGMENTS — floating pixel-cubes (voxels of the technology world). Mostly
   small "pixels" with a few larger cubes; near-transparent fills with luminous
   edges per face; slow procedural tumbling.
   ========================================================================== */

export const fragmentVertex = /* glsl */ `
  ${COMMON_UNIFORMS}
  ${NOISE}
  ${RAY}
  ${PATH_GLSL}
  uniform float uDepth;
  uniform float uTumble; /* fragment rotation speed multiplier */

  attribute vec3 aOffset;
  attribute vec4 aParams; /* scaleX, scaleY, rotSpeed, seed */

  varying vec2 vUv;
  varying float vFade;
  varying float vGlow;
  varying float vSeed;

  void main(){
    vUv = uv;
    float seed = aParams.w;
    vSeed = seed;

    vec3 c = vec3(aOffset.xy, -mod(aOffset.z + uTravel * 0.8, uDepth));
    c.xy += pathOffset(-c.z);

    /* pixel-cube: near-uniform box scale, slow two-axis tumble */
    vec3 local = position * vec3(aParams.x, aParams.y, (aParams.x + aParams.y) * 0.5);
    float a = uTime * aParams.z * uTumble + seed * 6.28318;
    float ca = cos(a), sa = sin(a);
    local.xz = mat2(ca, -sa, sa, ca) * local.xz;
    float b = a * 0.7 + seed * 3.0;
    float cb = cos(b), sb = sin(b);
    local.yz = mat2(cb, -sb, sb, cb) * local.yz;

    c += rayPush(c, uPushRadius * 0.8, uPushStrength * 0.62);
    vGlow = rayGlow(c, uGlowRadius * 0.86) + pulseWave(c, uTime) * 0.7;

    vec3 world = c + local;

    float fadeFar  = smoothstep(uDepth * 0.98, uDepth * 0.6, -c.z);
    float fadeNear = smoothstep(-1.0, -6.0, c.z);
    float depthAtt = mix(uRecessionFloor, 1.0, smoothstep(uDepth * 0.65, 10.0, -c.z));
    vFade = fadeFar * fadeNear * depthAtt;

    gl_Position = projectionMatrix * modelViewMatrix * vec4(world, 1.0);
  }
`;

export const fragmentFragment = /* glsl */ `
  precision highp float;
  ${COMMON_UNIFORMS}
  uniform vec3 uColorA;
  uniform vec3 uColorB;
  uniform float uAlpha;

  varying vec2 vUv;
  varying float vFade;
  varying float vGlow;
  varying float vSeed;

  void main(){
    /* luminous border, near-transparent fill */
    vec2 e = min(vUv, 1.0 - vUv);
    float border = 1.0 - smoothstep(0.0, 0.08, min(e.x, e.y));

    vec3 col = uColorA * 0.5 + uColorB * border * (0.8 + vGlow);
    float alpha = (0.05 + border * 0.28 + vGlow * 0.12) * vFade * uIntensity * uAlpha;
    gl_FragColor = vec4(col, alpha);
  }
`;
