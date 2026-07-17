"use client";

import Link from "next/link";
import type { Route } from "next";
import { ArrowUpRight } from "lucide-react";
import { gsap } from "@/lib/gsap";
import { heroScroll } from "@/components/hero3d/heroScroll";
import { pathOffset } from "@/components/hero3d/pathMath";
import { tweak } from "@/components/hero3d/tweakConfig";
import {
  PLACEHOLDER_PROJECTS,
  type GalleryProject,
} from "@/lib/placeholderProjects";

/**
 * WorksJourney — the "my work" chapter of the home journey (Figma 175/176).
 *
 * No more white horizontal gallery: the work showcase now happens INSIDE the
 * hero's dark tunnel. After the third headline phrase recedes, "HERE'S SOME OF
 * MY WORK" rises, then five project beats play out — for each one, an orange
 * energy node (a DOM twin of the background's energy boxes) flies up the SAME
 * snake path the tunnel instances bend along, companion motes converge into
 * it, and as it docks in front of the lens it morphs into the white project
 * window (Figma 176): title in Tanker above, index/summary/tags around it.
 * The window is a real link to the case study. Then it blows past the camera
 * and the next node is summoned.
 *
 * Split of responsibilities:
 *   • addWorksBeats() appends the beats to the Hero's ONE scrubbed timeline —
 *     opacity/blur/masks/morph (all fromTo + immediateRender:false, so any
 *     scroll position, both directions, is deterministic).
 *   • createWorksTicker() owns the node/mote TRANSFORMS per frame: position =
 *     the shaders' pathOffset(travel, d) projected through the same 90° camera
 *     (heroScroll.travel is written back by SceneController), plus a lateral
 *     scatter that decays as the node converges onto the path spine. Scroll
 *     moves the node along the path (beat progress p → depth d) AND the idle
 *     travel drift sways it — exactly like the real boxes behind it.
 *
 * The hero 3D canvas itself is untouched — these are DOM elements above it.
 */

/* ---------------------------------------------------------------- dials --- */

// node flight (world units — same space as the shaders)
const NODE_D_FAR = 34; // spawn depth down the tunnel
const NODE_D_NEAR = 1.3; // docked depth, just in front of the lens
const LENS = 0.9; // projection z-offset so the dock never divides by ~0

// companion motes fly deeper/wider and lead slightly per index
const MOTE_D_FAR = 44;
const MOTE_D_NEAR = 2.6;

// per-beat lateral scatter (world units) — where the node lives OFF the path
// spine before converging onto it, like the instanced boxes' scatter
const SCATTER = [
  { x: -11, y: 4.5 },
  { x: 10, y: -5 },
  { x: -8.5, y: -6 },
  { x: 12, y: 3.5 },
  { x: -12, y: 5.5 },
];
const MOTE_SCATTER = [
  { x: -17, y: 8 },
  { x: 14, y: -9 },
  { x: 19, y: 5 },
  { x: -13, y: -10 },
];

// the resting energy-node size (before it morphs into the window)
const NODE_W = 120;
const NODE_H = 92;
const NODE_R = 28;

// final window size — mirrored by the stage's CSS clamp so text never reflows
const frameW = () => {
  const w = window.innerWidth;
  return Math.round(Math.min(720, Math.max(320, w * 0.4), w * 0.86));
};
const frameH = () => Math.round(frameW() * 0.5625); // 16:9

// beat rhythm (timeline units — the Hero pins ~0.41 viewport per unit)
const SPAWN = 1.15;
const MORPH = 0.8;
const HOLD = 0.45;
const EXIT = 0.6;

// real window thumbnails, per slug (the rest stay clean white for now)
const THUMB_SRC: Record<string, string> = {
  "live-incident-response": "/case-study/image-1.webp",
};

/* ------------------------------------------------------------- markup ---- */

function ProjectBeat({
  project,
  index,
  total,
}: {
  project: GalleryProject;
  index: number;
  total: number;
}) {
  const href = `/work/${project.slug}` as Route;
  const thumb = THUMB_SRC[project.slug];
  return (
    // hidden inline until its beat scrubs in (autoAlpha) — FOUC/reduced-motion safe
    <div
      data-beat
      className="absolute inset-0 flex items-center justify-center"
      style={{ opacity: 0, visibility: "hidden" }}
    >
      <div
        data-beat-inner
        className="flex w-full flex-col items-center will-change-[transform,filter,opacity]"
      >
        <p
          data-pindex
          className="mb-4 text-[12px] font-bold tabular-nums tracking-[0.3em] text-fg/50"
        >
          {String(index + 1).padStart(2, "0")} / {String(total).padStart(2, "0")}
        </p>

        {/* title — masked rise once the window has formed */}
        <span className="block overflow-hidden px-[var(--gutter)]">
          <h3
            data-ptitle
            className="text-center uppercase leading-none tracking-[0.01em] text-fg [font-size:clamp(1.75rem,3.2vw,3.25rem)]"
            style={{ fontFamily: "var(--font-display-tanker)" }}
          >
            {project.title}
          </h3>
        </span>

        {/* stage — fixed at the FINAL window height (mirrors frameW/H) so the
            layout never reflows while the node grows inside it */}
        <div className="relative mt-[3.5vh] flex h-[clamp(180px,22.5vw,405px)] w-full items-center justify-center">
          {/* companion motes — smaller energy sparks that ride the path in and
              dissolve into the main node (transforms owned by the ticker) */}
          {MOTE_SCATTER.map((_, mi) => (
            <span
              key={mi}
              data-mote
              aria-hidden="true"
              className="absolute left-1/2 top-1/2 -ml-2 -mt-1.5 h-3 w-4 rounded-[35%]"
              style={{
                opacity: 0,
                background:
                  "radial-gradient(120% 120% at 32% 25%, #ffd9a8 0%, #ff8a2a 55%, #b3480a 100%)",
                boxShadow: "0 0 18px 4px rgba(255,120,31,0.5)",
              }}
            />
          ))}

          {/* the node itself — ticker drives x/y/scale/rotation along the path */}
          <div data-node-wrap className="relative will-change-[transform,filter,opacity]">
            {/* bloom halo — echoes the post-FX bloom the real boxes get */}
            <span
              data-node-glow
              aria-hidden="true"
              className="pointer-events-none absolute -inset-12 rounded-full"
              style={{
                opacity: 0,
                background:
                  "radial-gradient(50% 50% at 50% 50%, rgba(255,138,42,0.5), rgba(255,120,31,0.16) 55%, transparent 78%)",
                filter: "blur(14px)",
              }}
            />
            <Link
              data-frame
              href={href}
              aria-label={`${project.title} — open case study`}
              className="group relative block overflow-hidden bg-white"
              style={{
                width: NODE_W,
                height: NODE_H,
                borderRadius: NODE_R,
                // hidden + inert until the morph — the flight is the 3D cuboid
                // in the canvas (or, on the video fallback, the ticker raises
                // this during the flight instead). The ticker owns both.
                opacity: 0,
                pointerEvents: "none",
              }}
            >
              {/* window content — revealed as the energy skin burns off */}
              {thumb ? (
                <img
                  src={thumb}
                  alt=""
                  className="absolute inset-0 h-full w-full object-cover transition-transform duration-700 ease-out group-hover:scale-[1.04]"
                />
              ) : null}
              <span
                className={`absolute right-4 top-4 flex h-9 w-9 items-center justify-center rounded-full opacity-0 transition-opacity duration-300 group-hover:opacity-100 ${
                  thumb ? "bg-black/35 text-white" : "bg-black/8 text-black/70"
                }`}
              >
                <ArrowUpRight size={18} />
              </span>
              {/* orange energy skin — the node's surface; fades away in the morph */}
              <span
                data-skin
                aria-hidden="true"
                className="pointer-events-none absolute inset-0 rounded-[inherit]"
                style={{
                  background:
                    "radial-gradient(120% 120% at 30% 22%, #ffd9a8 0%, #ff8a2a 42%, #c2540e 78%, #8a3506 100%)",
                }}
              />
            </Link>
          </div>
        </div>

        <p
          data-pdesc
          className="mt-[3vh] max-w-md px-[var(--gutter)] text-center text-[15px] font-medium leading-snug text-fg/65"
        >
          {project.summary}
        </p>
        <p
          data-ptags
          className="mt-2 text-[11px] font-bold uppercase tracking-[0.25em] text-fg/40"
        >
          {project.year} · {project.tags.join(" · ")}
        </p>
      </div>
    </div>
  );
}

export function WorksOverlay({
  projects = PLACEHOLDER_PROJECTS.slice(0, 5),
}: {
  projects?: GalleryProject[];
}) {
  return (
    <div
      data-works-layer
      className="pointer-events-none absolute inset-0 z-20"
      aria-label="Selected work"
    >
      {/* chapter intro (Figma 175) */}
      <div
        data-works-intro
        className="absolute inset-0 flex items-center justify-center"
        style={{ opacity: 0, visibility: "hidden" }}
      >
        <h2
          className="overflow-hidden px-[var(--gutter)] text-center uppercase leading-none tracking-[0.01em] text-fg [font-size:clamp(2.25rem,4.2vw,4.5rem)]"
          style={{ fontFamily: "var(--font-display-tanker)" }}
        >
          <span data-works-intro-line className="block will-change-transform">
            Here&rsquo;s some of my work
          </span>
        </h2>
      </div>

      {projects.map((p, i) => (
        <ProjectBeat key={p.slug} project={p} index={i} total={projects.length} />
      ))}
    </div>
  );
}

/* ------------------------------------------------- scrubbed beat builder -- */

export type BeatDriver = {
  /** p: flight progress 0→1 (spawn→dock) · m: morph progress 0→1 (node→window) */
  proxy: { p: number; m: number };
  wrap: HTMLElement;
  frame: HTMLElement;
  motes: HTMLElement[];
  scatter: { x: number; y: number };
};

/**
 * Appends the works chapter to the Hero's scrub timeline. Returns the chapter
 * start time (for the /#work anchor) and the per-beat drivers the ticker
 * animates. Everything visual here is opacity/filter/size — TRANSFORMS of the
 * node/motes belong exclusively to createWorksTicker().
 */
export function addWorksBeats(tl: gsap.core.Timeline, root: HTMLElement) {
  const drivers: BeatDriver[] = [];
  const layer = root.querySelector<HTMLElement>("[data-works-layer]");
  if (!layer) return { worksStart: tl.duration(), drivers };

  const worksStart = tl.duration();

  // --- chapter intro: HERE'S SOME OF MY WORK ------------------------------
  const intro = layer.querySelector<HTMLElement>("[data-works-intro]");
  const introLine = layer.querySelector<HTMLElement>("[data-works-intro-line]");
  if (intro && introLine) {
    tl.fromTo(
      intro,
      { autoAlpha: 0 },
      { autoAlpha: 1, duration: 0.25, immediateRender: false },
    )
      .fromTo(
        introLine,
        { yPercent: 120 },
        { yPercent: 0, duration: 0.9, ease: "power2.out", immediateRender: false },
        "<",
      )
      .to({}, { duration: 0.5 }) // hold
      .fromTo(
        introLine,
        { yPercent: 0 },
        { yPercent: -120, duration: 0.7, ease: "power2.in", immediateRender: false },
      )
      .to(intro, { autoAlpha: 0, duration: 0.2 }, "-=0.2");
  }

  // --- five project beats ---------------------------------------------------
  const beats = gsap.utils.toArray<HTMLElement>(
    layer.querySelectorAll("[data-beat]"),
  );
  beats.forEach((beat, i) => {
    const wrap = beat.querySelector<HTMLElement>("[data-node-wrap]");
    const frame = beat.querySelector<HTMLElement>("[data-frame]");
    const skin = beat.querySelector<HTMLElement>("[data-skin]");
    const glow = beat.querySelector<HTMLElement>("[data-node-glow]");
    const inner = beat.querySelector<HTMLElement>("[data-beat-inner]");
    const title = beat.querySelector<HTMLElement>("[data-ptitle]");
    const pindex = beat.querySelector<HTMLElement>("[data-pindex]");
    const desc = beat.querySelector<HTMLElement>("[data-pdesc]");
    const tags = beat.querySelector<HTMLElement>("[data-ptags]");
    const motes = gsap.utils.toArray<HTMLElement>(
      beat.querySelectorAll("[data-mote]"),
    );
    if (!wrap || !frame || !skin || !glow || !inner || !title) return;

    // pre-park the text (the beat container is inline-hidden, but it fades in
    // BEFORE these animate — they must not flash during the node's flight)
    gsap.set(title, { yPercent: 120 });
    gsap.set([pindex, desc, tags], { opacity: 0 });

    const driver: BeatDriver = {
      proxy: { p: 0, m: 0 },
      wrap,
      frame,
      motes,
      scatter: SCATTER[i % SCATTER.length],
    };
    drivers.push(driver);

    const T = tl.duration() + (i === 0 ? 0.1 : 0.25); // breath between beats
    const M = T + SPAWN - 0.1; // morph begins right as the node docks
    const E = M + MORPH + HOLD; // exit

    tl
      // summon: beat becomes visible, node fades/deblurs in while the ticker
      // flies it up the snake path (proxy.p is the ONLY flight input)
      .fromTo(
        beat,
        { autoAlpha: 0 },
        { autoAlpha: 1, duration: 0.2, immediateRender: false },
        T,
      )
      .fromTo(
        driver.proxy,
        { p: 0 },
        { p: 1, duration: SPAWN, ease: "none", immediateRender: false },
        T,
      )
      // (no wrap fade here — during flight the node is the REAL 3D cuboid in
      //  the canvas; the DOM frame's opacity is ticker-driven and only rises
      //  with the morph. The halo below still accompanies the flight.)
      .fromTo(
        glow,
        { opacity: 0, scale: 0.75 },
        { opacity: 1, scale: 1.1, duration: 0.6, ease: "power2.out", immediateRender: false },
        T + 0.3,
      );

    // companion motes: opacity here, flight in the ticker
    motes.forEach((mote, mi) => {
      const dly = 0.1 * mi;
      tl.fromTo(
        mote,
        { opacity: 0 },
        { opacity: 0.95, duration: 0.35, ease: "power1.out", immediateRender: false },
        T + 0.15 + dly,
      ).to(
        mote,
        { opacity: 0, duration: 0.35, ease: "power2.in" },
        T + 0.62 + dly,
      );
    });

    tl
      // morph: energy node → white project window
      .fromTo(
        driver.proxy,
        { m: 0 },
        { m: 1, duration: MORPH, ease: "power3.inOut", immediateRender: false },
        M,
      )
      .fromTo(
        frame,
        { width: NODE_W, height: NODE_H, borderRadius: NODE_R },
        {
          width: frameW,
          height: frameH,
          borderRadius: 10,
          duration: MORPH,
          ease: "power3.inOut",
          immediateRender: false,
        },
        M,
      )
      .fromTo(
        skin,
        { opacity: 1 },
        { opacity: 0, duration: MORPH * 0.7, ease: "power2.in", immediateRender: false },
        M + MORPH * 0.25,
      )
      .fromTo(
        glow,
        { opacity: 1, scale: 1.1 },
        { opacity: 0, scale: 1.4, duration: 0.6, ease: "power2.out", immediateRender: false },
        M + 0.2,
      )
      // window dressing: index, title, summary, tags
      .fromTo(
        pindex,
        { opacity: 0, y: 12 },
        { opacity: 1, y: 0, duration: 0.4, ease: "power2.out", immediateRender: false },
        M + 0.3,
      )
      .fromTo(
        title,
        { yPercent: 120 },
        { yPercent: 0, duration: 0.65, ease: "power3.out", immediateRender: false },
        M + 0.35,
      )
      .fromTo(
        [desc, tags],
        { opacity: 0, y: 16 },
        { opacity: 1, y: 0, duration: 0.5, stagger: 0.1, ease: "power2.out", immediateRender: false },
        M + 0.5,
      )
      // exit: the whole composition blows past the camera
      .fromTo(
        inner,
        { scale: 1, opacity: 1, filter: "blur(0px)" },
        {
          scale: 1.17,
          opacity: 0,
          filter: "blur(10px)",
          duration: EXIT,
          ease: "power2.in",
          immediateRender: false,
        },
        E,
      )
      .to(beat, { autoAlpha: 0, duration: 0.1 }, E + EXIT - 0.1);
  });

  return { worksStart, drivers };
}

/* ---------------------------------------------------- per-frame flight ---- */

/**
 * The flight itself: depth d eases toward the lens as p→1; lateral position =
 * the shaders' pathOffset at that depth (idle travel sway included) plus a
 * scatter offset that decays to 0 on arrival — projected through the same
 * vertical-FOV camera as the scene. Returns CSS px from the viewport center
 * PLUS the raw camera-space point (wx, wy, d) so the in-canvas 3D cuboid
 * (WorksNode.tsx) can be placed at the identical spot.
 */
function flightXY(
  travel: number,
  p: number,
  scatter: { x: number; y: number },
  dFar: number,
  dNear: number,
  vw: number,
  vh: number,
  tanX: number,
  tanY: number,
) {
  const d = dNear + (dFar - dNear) * Math.pow(1 - p, 1.6);
  const off = pathOffset(travel, d);
  const decay = Math.pow(Math.max(d - dNear, 0) / (dFar - dNear), 0.7);
  const wx = off.x + scatter.x * decay;
  const wy = off.y + scatter.y * decay;
  const z = d + LENS;
  return {
    x: (wx / (z * tanX)) * (vw / 2),
    y: (-wy / (z * tanY)) * (vh / 2),
    wx,
    wy,
    d,
  };
}

/**
 * Builds the gsap.ticker callback that drives node + mote transforms every
 * frame. Runs off (p, m) from the scrubbed proxies + heroScroll.travel from
 * the scene — a pure function of both, so it's deterministic under scrubbing
 * in either direction AND keeps swaying with the idle drift between scrolls.
 */
export function createWorksTicker(drivers: BeatDriver[]) {
  const setters = drivers.map((d) => ({
    x: gsap.quickSetter(d.wrap, "x", "px") as (v: number) => void,
    y: gsap.quickSetter(d.wrap, "y", "px") as (v: number) => void,
    s: gsap.quickSetter(d.wrap, "scale") as (v: number) => void,
    r: gsap.quickSetter(d.wrap, "rotation", "deg") as (v: number) => void,
    f: gsap.quickSetter(d.frame, "opacity") as (v: number) => void,
    motes: d.motes.map((m) => ({
      x: gsap.quickSetter(m, "x", "px") as (v: number) => void,
      y: gsap.quickSetter(m, "y", "px") as (v: number) => void,
      s: gsap.quickSetter(m, "scale") as (v: number) => void,
    })),
  }));

  return () => {
    const vw = window.innerWidth;
    const vh = window.innerHeight;
    const tanY = Math.tan((tweak.scene.fovBase * Math.PI) / 360);
    const tanX = tanY * (vw / vh);
    const travel = heroScroll.travel;
    const live = heroScroll.sceneLive;
    const wn = heroScroll.worksNode;

    // the active beat = the furthest one that has started (finished beats keep
    // p=1 but their 3D node has burned off with m=1; scrubbing back rewinds p)
    let activeIdx = -1;

    drivers.forEach((b, i) => {
      const { p, m } = b.proxy;
      if (p <= 0) return; // parked (beat not summoned / scrubbed back out)
      activeIdx = i;
      const st = setters[i];

      // the formed window barely sways; mid-flight it rides the bend fully
      const damp = 1 - 0.82 * m;
      const pos = flightXY(
        travel, p, b.scatter, NODE_D_FAR, NODE_D_NEAR, vw, vh, tanX, tanY,
      );
      st.x(pos.x * damp);
      st.y(pos.y * damp);
      st.s(0.14 + 0.86 * (1 - Math.pow(1 - p, 2)));
      st.r((pos.x / vw) * 16 * (1 - m)); // a whisper of bank into the turn

      // While the 3D scene renders the cuboid, the DOM frame exists only for
      // the morph — it crossfades in over the fading mesh. On the video
      // fallback (no scene) the DOM orange skin flies the whole way instead.
      const frameAlpha = live
        ? Math.min(1, Math.max(0, m / 0.35))
        : Math.min(1, Math.max(0, p / 0.3));
      st.f(frameAlpha);
      // never leave an invisible link hovering over the tunnel
      b.frame.style.pointerEvents = frameAlpha > 0.5 ? "auto" : "none";

      // hand the active beat's flight to the in-canvas cuboid (camera space)
      if (i === activeIdx) {
        wn.x = pos.wx * damp;
        wn.y = pos.wy * damp;
        wn.z = -pos.d;
        wn.p = p;
        wn.m = m;
      }

      b.motes.forEach((_, mi) => {
        const pm = Math.min(1, Math.max(0, p * 1.25 - mi * 0.08));
        const mpos = flightXY(
          travel,
          pm,
          MOTE_SCATTER[mi % MOTE_SCATTER.length],
          MOTE_D_FAR,
          MOTE_D_NEAR,
          vw,
          vh,
          tanX,
          tanY,
        );
        st.motes[mi].x(mpos.x);
        st.motes[mi].y(mpos.y);
        st.motes[mi].s(0.4 + 2.2 * pm * (1 - pm)); // swells mid-flight
      });
    });

    wn.on = activeIdx >= 0;
  };
}

/* -------------------------------------------------- reduced-motion path --- */

/**
 * Static fallback so the case studies stay reachable without the scrub.
 * Hidden unless prefers-reduced-motion (the scrubbed journey never builds
 * there — Hero's matchMedia is no-preference only). Also carries the real
 * `#work` element for native hash navigation on that path.
 */
export function WorksIndexStatic({
  projects = PLACEHOLDER_PROJECTS.slice(0, 5),
}: {
  projects?: GalleryProject[];
}) {
  return (
    <section
      id="work"
      data-header-dark
      className="hero-dark hidden bg-[#06080c] px-[var(--gutter)] py-24 motion-reduce:block"
    >
      <h2
        className="uppercase leading-none tracking-[0.01em] text-fg [font-size:clamp(2rem,5vw,3.5rem)]"
        style={{ fontFamily: "var(--font-display-tanker)" }}
      >
        Here&rsquo;s some of my work
      </h2>
      <ul className="mt-12 flex flex-col gap-10">
        {projects.map((p, i) => (
          <li key={p.slug}>
            <Link
              href={`/work/${p.slug}` as Route}
              className="group block max-w-2xl"
            >
              <p className="text-[12px] font-bold tabular-nums tracking-[0.3em] text-fg/50">
                {String(i + 1).padStart(2, "0")}
              </p>
              <p className="mt-1 text-[clamp(1.4rem,2.5vw,2rem)] font-bold text-fg group-hover:underline">
                {p.title}
              </p>
              <p className="mt-2 text-[15px] font-medium leading-snug text-fg/65">
                {p.summary}
              </p>
              <p className="mt-2 text-[11px] font-bold uppercase tracking-[0.25em] text-fg/40">
                {p.year} · {p.tags.join(" · ")}
              </p>
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}
