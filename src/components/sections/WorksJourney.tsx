"use client";

import type { CSSProperties } from "react";
import Link from "next/link";
import type { Route } from "next";
import { ArrowUpRight } from "lucide-react";
import { gsap } from "@/lib/gsap";
import { heroScroll, sceneIsLive } from "@/components/hero3d/heroScroll";
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
// spine before converging onto it, like the instanced boxes' scatter.
// Kept moderate: big offsets made the approach swing wildly across the frame
// ("overwhelming"); these read as a drift in from the side, not a slingshot.
const SCATTER = [
  { x: -7, y: 3 },
  { x: 6.5, y: -3.2 },
  { x: -5.5, y: -3.8 },
  { x: 7.5, y: 2.2 },
  { x: -7.5, y: 3.5 },
];
const MOTE_SCATTER = [
  { x: -12, y: 5.5 },
  { x: 10, y: -6.3 },
  { x: 13, y: 3.5 },
  { x: -9, y: -7 },
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

// beat rhythm (timeline units — the Hero pins ~0.41 viewport per unit).
// The flight breathes a little longer; the morph is QUICK and starts while
// the node is still gliding in (see MORPH_LEAD) so the cuboid never parks as
// a bare orange rectangle waiting to become the window — shape → project is
// one continuous gesture.
const SPAWN = 1.3;
const MORPH = 0.5;
const MORPH_LEAD = 0.35; // how far before dock the morph begins
const HOLD = 0.6;
const EXIT = 0.6;

// Per-slug window art. Each formed beat is now a TWO-LAYER card that mirrors the
// /work index card (WorkShowcase.tsx): a resting COVER plate with the interface
// screenshot (INNER) that rises into it on hover. The two maps here MUST stay in
// sync with WorkShowcase's COVER/INNER — same files, so /work and home present
// the identical card on an equivalent device.
//
// ⚠️ Load-bearing beyond the picture: a beat is rendered as a clickable,
// hover-revealing <Link> ONLY when its slug has a COVER entry (see the ternary
// below). A published study missing here silently degrades to the non-clickable
// "in progress" plate — which is exactly how ORO first shipped. Adding a study
// to the route registry is not enough; it must land here too.
const COVER: Record<string, string> = {
  "live-incident-response": "/case-study/cover/lir-plate.webp",
  "verkos-reports": "/case-study/cover/verkos-plate.webp",
  "oro-connect": "/case-study/cover/oro-plate.webp",
  // external project (links out to oroedit.com) — gets the same layered card
  "oro-edit": "/case-study/cover/oro-edit-plate.webp",
};
// The interface shot that rises on hover (desktop) / sits seated (mobile).
const INNER: Record<string, string> = {
  "live-incident-response": "/case-study/cover/lir-ui.webp",
  "verkos-reports": "/case-study/verkos-cover.webp",
  "oro-connect": "/case-study/cover/oro-ui.webp",
  "oro-edit": "/case-study/cover/oro-edit-ui.webp",
};

/**
 * Warm the beat covers as soon as the module loads, so they are decoded long
 * before their beat scrubs into view. The windows live inside a pinned,
 * scroll-scrubbed timeline: an image that only starts decoding when its beat
 * appears can miss the handful of frames it is actually on stage, which reads
 * as "that project has no thumbnail". This bit beat 2 specifically — its cover
 * is the heaviest in the set — while the lighter beat 1 always made it.
 * Fire-and-forget; failures are irrelevant since the <img> still requests it.
 */
if (typeof window !== "undefined") {
  for (const src of [...Object.values(COVER), ...Object.values(INNER)]) {
    const im = new Image();
    im.decoding = "async";
    im.src = src;
    void im.decode?.().catch(() => {});
  }
}

/* ------------------------------------------------------------- markup ---- */

/** The orange energy skin — the node's surface, which burns off across the
 *  morph. Shared by both window variants (real study / in-progress plate), and
 *  it MUST carry `data-skin`: the works ticker drives its opacity. */
function PlateSkin() {
  return (
    <span
      data-skin
      aria-hidden="true"
      className="pointer-events-none absolute inset-0 rounded-[inherit]"
      style={{
        background:
          "radial-gradient(120% 120% at 30% 22%, #ffd9a8 0%, #ff8a2a 42%, #c2540e 78%, #8a3506 100%)",
      }}
    />
  );
}

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
  const cover = COVER[project.slug];
  const inner = INNER[project.slug];
  // A project with `externalUrl` is not a case study — its beat links straight
  // out to the live site in a new tab instead of to `/work/slug`.
  const external = project.externalUrl;

  // Shared frame style — IDENTICAL across the external <a>, internal <Link>, and
  // in-progress <div> so the ticker's morph (which drives width/height/opacity/
  // pointerEvents on [data-frame]) behaves the same whichever wrapper renders.
  // pointerEvents stays "none"; the ticker flips it to "auto" only once the
  // window is ~formed (frameAlpha > 0.5), so nothing here is clickable — and no
  // hover fires — while the beat is still a flying cube.
  const frameStyle: CSSProperties = {
    width: NODE_W,
    height: NODE_H,
    borderRadius: NODE_R,
    opacity: 0,
    pointerEvents: "none",
  };

  // The formed two-layer card (plate + hover-revealed interface shot), shared by
  // internal studies and any external project that has a cover. See the note at
  // the render site — it mirrors /work's WorkShowcase card exactly.
  const cardBody = cover ? (
    <>
      <img
        data-cover
        src={cover}
        alt=""
        decoding="sync"
        fetchPriority="high"
        className="absolute inset-0 h-full w-full scale-[1.06] object-cover"
      />
      <div
        aria-hidden
        className="absolute inset-0 bg-black/55 transition-opacity duration-500 lg:opacity-0 lg:group-hover:opacity-100"
      />
      {inner ? (
        <div className="absolute left-1/2 top-[12%] w-[75.8%] -translate-x-1/2 overflow-hidden rounded-[3px] shadow-[0_18px_50px_-12px_rgba(0,0,0,0.9)] ring-1 ring-white/10 transition-transform duration-500 ease-out lg:translate-y-[130%] lg:group-hover:translate-y-0">
          <img src={inner} alt="" decoding="sync" className="block h-auto w-full" />
        </div>
      ) : null}
      <span className="absolute right-4 top-4 flex h-9 w-9 items-center justify-center rounded-full bg-black/35 text-white opacity-0 transition-opacity duration-300 lg:group-hover:opacity-100">
        <ArrowUpRight size={18} />
      </span>
    </>
  ) : null;

  // Placeholder shown INSIDE the external card until its real thumbnail lands —
  // reads "view live site" rather than the "coming soon" of an unpublished study,
  // because the destination is already live.
  const livePlaceholder = (
    <span
      className="absolute inset-0 flex flex-col items-center justify-center gap-2 text-center"
      style={{
        background: "linear-gradient(160deg,#141821 0%,#0d1016 60%,#0a0c11 100%)",
        borderRadius: NODE_R,
        boxShadow: "inset 0 0 0 1px rgba(255,255,255,0.14)",
      }}
    >
      <span className="flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-[0.28em] text-white/70">
        View live site <ArrowUpRight size={13} />
      </span>
      <span className="text-[12px] font-medium text-white/35">Opens in a new tab</span>
    </span>
  );

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
            {/* Three window kinds, all sharing the SAME data-frame + PlateSkin so
                the morph is identical whichever renders:
                  · EXTERNAL (has externalUrl) → <a target=_blank> to the live
                    site. Shows the formed card if it has a cover, else the
                    "view live site" placeholder until its thumbnail lands.
                  · INTERNAL study (has cover) → <Link> to /work/slug, the
                    plate + hover-reveal card mirroring /work's WorkShowcase.
                  · UNPUBLISHED (neither) → non-clickable "in progress" plate,
                    so a 404 slug never ships a blank/broken-looking box. */}
            {external ? (
              <a
                data-frame
                href={external}
                target="_blank"
                rel="noopener noreferrer"
                aria-label={`${project.title} — open the live site in a new tab`}
                className="group relative block overflow-hidden bg-black"
                style={frameStyle}
              >
                {cardBody ?? livePlaceholder}
                <PlateSkin />
              </a>
            ) : cover ? (
              <Link
                data-frame
                href={href}
                aria-label={`${project.title} — open case study`}
                className="group relative block overflow-hidden bg-black"
                style={frameStyle}
              >
                {cardBody}
                <PlateSkin />
              </Link>
            ) : (
              <div
                data-frame
                aria-hidden="true"
                className="relative block overflow-hidden"
                style={{
                  ...frameStyle,
                  // deliberately NOT white — a dark plate with a hairline reads
                  // as "not published yet", where an empty white rectangle just
                  // reads as a failed image load.
                  background:
                    "linear-gradient(160deg,#141821 0%,#0d1016 60%,#0a0c11 100%)",
                  border: "1px solid rgba(255,255,255,0.14)",
                }}
              >
                <span className="absolute inset-0 flex flex-col items-center justify-center gap-2 text-center">
                  <span className="text-[11px] font-bold uppercase tracking-[0.28em] text-white/40">
                    In progress
                  </span>
                  <span className="text-[12px] font-medium text-white/25">
                    Case study coming soon
                  </span>
                </span>
                <PlateSkin />
              </div>
            )}
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
      {/* ⚠️ pointer-events-none is LOAD-BEARING.
          This is a FULL-VIEWPORT (`absolute inset-0`) layer that sits over
          every project beat. Its hide is a GSAP `autoAlpha: 0` at the end of
          the intro sequence, and all of those tweens use
          `immediateRender: false` — so a ScrollTrigger.refresh()/invalidate
          (the loader's handOff calls one) can drop that end-state and leave
          this layer interactive and hit-testable on top of the beats. On the
          device that showed up as `frame onTop=false hit=SPAN.block
          will-change-` while the project window sat right underneath.
          It is pure decoration, so it must never take hits. */}
      <div
        data-works-intro
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 flex items-center justify-center"
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
  /** the beat container. Its own visibility is the authority on whether the
   *  beat is on stage — the ticker needs it because `proxy.p` can be reset to 0
   *  by ScrollTrigger's invalidateOnRefresh while the beat is still showing. */
  beat: HTMLElement;
  wrap: HTMLElement;
  frame: HTMLElement;
  /** the orange energy surface — ticker-owned (hidden on the live 3D path). */
  skin: HTMLElement;
  motes: HTMLElement[];
  scatter: { x: number; y: number };
};

/** A snap span (timeline units): if the scroll settles with the playhead
 *  inside [from, to), the Hero's ScrollTrigger snap glides it to `rest` —
 *  so a beat can never sit half-morphed (see Hero's snap config). */
export type SnapSpan = { from: number; to: number; rest: number };

/**
 * Appends the works chapter to the Hero's scrub timeline. Returns the chapter
 * start time (for the /#work anchor) and the per-beat drivers the ticker
 * animates. Everything visual here is opacity/filter/size — TRANSFORMS of the
 * node/motes belong exclusively to createWorksTicker().
 */
export function addWorksBeats(tl: gsap.core.Timeline, root: HTMLElement) {
  const drivers: BeatDriver[] = [];
  const snapSpans: SnapSpan[] = [];
  /** per-frame guards that re-assert states an invalidate can drop */
  const introGuards: (() => void)[] = [];
  const layer = root.querySelector<HTMLElement>("[data-works-layer]");
  if (!layer)
    return { worksStart: tl.duration(), drivers, snapSpans, introGuards };

  // On TOUCH the ScrollTrigger snap (which is meant to glide a thumb-flick that
  // lands mid-flight to the fully-formed window) is unreliable — native
  // momentum scrolling rarely fires the clean scroll-end snap needs. That left
  // readers parked on a bare centered node with the morph not yet started
  // (m≈0 → the white window opacity, driven by m, never rose): "the 3D rect
  // comes to center and nothing happens." So on coarse pointer we OVERLAP the
  // morph with the flight much more (bigger MORPH_LEAD): by the time the node is
  // anywhere near center the window is already forming, so there is no reachable
  // "docked but bare" resting state to get stuck on. Desktop timing unchanged.
  const isCoarse =
    typeof window !== "undefined" &&
    window.matchMedia("(pointer: coarse)").matches;
  // desktop keeps the module constants; touch starts the morph ~1.0 units before
  // dock (vs 0.35) so it runs across most of the arrival glide.
  const morphLead = isCoarse ? 1.0 : MORPH_LEAD;
  const morphDur = isCoarse ? 0.7 : MORPH;

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
    // The intro layer covers the whole viewport, so it MUST be hidden whenever
    // the playhead is past it — not merely "hidden by the last tween that ran".
    // These tweens are immediateRender:false, so an invalidate can drop that
    // end-state and strand the layer visible over the project windows. A
    // ticker-independent guard keeps it correct at any playhead position.
    introGuards.push(() => {
      const t = tl.time();
      // visible only for the intro's own span; hidden everywhere else
      const inSpan = t >= worksStart && t <= worksStart + 2.1;
      const cs = getComputedStyle(intro);
      if (!inSpan && (cs.visibility !== "hidden" || +cs.opacity > 0.01)) {
        gsap.set(intro, { autoAlpha: 0 });
      }
    });
    // resting mid-intro settles on the fully-risen line (hold runs 0.9→1.4).
    snapSpans.push({
      from: worksStart + 0.15,
      to: worksStart + 1.35,
      rest: worksStart + 1.1,
    });
    // NO blank-tunnel rest after the heading exits. There used to be a rest at
    // worksStart + 2.1 (heading gone, first node not yet in flight) — so leaving
    // "HERE'S SOME OF MY WORK" parked the escalator on an empty tunnel instead of
    // carrying the reader onto the first case study. Dropping it means the next
    // rest above the heading is the first beat's fully-formed window, so a nudge
    // off the heading glides the line out AND the first project in as ONE ride —
    // the same content-to-content escalator the phrases have. The introGuard
    // (t > worksStart + 2.1 → hide) still clears the heading as the glide passes
    // through, so nothing is stranded.
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
    //
    // ⚠️ `clearProps` FIRST — THIS PARK MUST BE IDEMPOTENT.
    // `yPercent` resolves against the element's own height and ADDS to whatever
    // transform is already on the node, so running this twice parks the title at
    // 240% instead of 120%. The reveal only ever animates back to yPercent 0,
    // which then lands a full title-height short and the title stays masked —
    // while `pindex`/`desc`/`tags` (parked with `opacity`, which is absolute and
    // therefore safe to re-apply) all appear normally. That is the reported
    // "everything on the card shows except the project title".
    //
    // This block re-runs whenever the hero's matchMedia callback re-runs — a
    // resize, or the Loader remounting on a nav load (PROJECT_LOG §6). Same bug
    // class as the phrase park in Hero.tsx; fixed the same way.
    gsap.set(title, { clearProps: "transform" });
    gsap.set(title, { yPercent: 120 });
    gsap.set([pindex, desc, tags], { opacity: 0 });

    const driver: BeatDriver = {
      proxy: { p: 0, m: 0 },
      beat,
      wrap,
      frame,
      skin,
      motes,
      scatter: SCATTER[i % SCATTER.length],
    };
    drivers.push(driver);

    const T = tl.duration() + (i === 0 ? 0.1 : 0.25); // breath between beats
    const M = T + SPAWN - morphLead; // morph begins during the arrival glide
    const E = M + morphDur + HOLD; // exit

    // Handhold spans: settle anywhere in the flight/morph → auto-glide to the
    // fully-dressed window (just before the exit tween); settle mid-exit →
    // carry the departure through to the clean tunnel. A beat can never be
    // left half-morphed on screen (the mobile half-scroll complaint).
    snapSpans.push({ from: T + 0.05, to: E, rest: E - 0.07 });
    snapSpans.push({ from: E, to: E + EXIT, rest: E + EXIT });

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
        { m: 1, duration: morphDur, ease: "power3.inOut", immediateRender: false },
        M,
      )
      .fromTo(
        frame,
        { width: NODE_W, height: NODE_H, borderRadius: NODE_R },
        {
          width: frameW,
          height: frameH,
          borderRadius: 10,
          duration: morphDur,
          ease: "power3.inOut",
          immediateRender: false,
        },
        M,
      )
      // NOTE: no skin tween here — the orange energy skin belongs to the NODE,
      // not the window. The ticker owns it exclusively: hidden on the live 3D
      // path (the cuboid carries the orange), a fading stand-in on the video
      // fallback. A timeline tween would fight those per-frame writes.
      .fromTo(
        glow,
        { opacity: 1, scale: 1.1 },
        { opacity: 0, scale: 1.4, duration: 0.5, ease: "power2.out", immediateRender: false },
        M + 0.1,
      )
      // window dressing: index, title, summary, tags — compressed to the
      // quicker morph so the window is fully dressed well before the exit
      .fromTo(
        pindex,
        { opacity: 0, y: 12 },
        { opacity: 1, y: 0, duration: 0.35, ease: "power2.out", immediateRender: false },
        M + 0.15,
      )
      .fromTo(
        title,
        { yPercent: 120 },
        { yPercent: 0, duration: 0.55, ease: "power3.out", immediateRender: false },
        M + 0.2,
      )
      .fromTo(
        [desc, tags],
        { opacity: 0, y: 16 },
        { opacity: 1, y: 0, duration: 0.45, stagger: 0.08, ease: "power2.out", immediateRender: false },
        M + 0.3,
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

    // ⚠️ A BEAT MUST NEVER BE LEFT PART-WAY THROUGH ITS EXIT.
    // The exit fades `inner` (which holds the title, the window and the copy)
    // to opacity 0 and then hides the whole beat. Every tween here is
    // immediateRender:false, so if the playhead lands inside the exit and the
    // scrub stops updating — which is what happens on iOS, where the beat is
    // still marked visible while `inner` sits at a partial opacity — the
    // reader is stranded looking at a ghost: `inner` at ~0.7 with the project
    // window inside it invisible. The device readout showed exactly that:
    //     ANCESTORS HIDING IT: !DIV.flex w-full flex-c op=0.70
    // with drv 0:p=1,m=1 1:p=1,m=1 (two beats finished) and active=1.
    //
    // This guard runs every frame from the ticker and forces `inner` to a
    // clean state based purely on the playhead: fully opaque while the beat
    // owns the stage, fully hidden once the exit is done. It never fights the
    // tween mid-exit — it only corrects states the tween should have reached.
    introGuards.push(() => {
      const t = tl.time();
      const cs = getComputedStyle(inner);
      const op = parseFloat(cs.opacity);
      // On stage (docked, before the exit begins) → must be fully visible.
      if (t >= M && t < E && op < 0.99) {
        gsap.set(inner, { opacity: 1, scale: 1, filter: "blur(0px)" });
      }
      // Past the exit → the beat must be gone, not a lingering ghost.
      else if (t > E + EXIT) {
        const bcs = getComputedStyle(beat);
        if (bcs.visibility !== "hidden" || parseFloat(bcs.opacity) > 0.01) {
          gsap.set(beat, { autoAlpha: 0 });
        }
      }

      // ⚠️ THE WINDOW'S VISIBILITY IS DECIDED FROM THE PLAYHEAD, NOT THE TICKER.
      // The ticker computes frame/skin opacity from its own driver proxies, and
      // on iOS those writes have repeatedly failed to reach the rendered node
      // (stale references after a matchMedia re-run, replaced elements, etc).
      // The symptom is always the same and was captured twice on device: one
      // beat correct and its neighbour showing the exact INVERSE of what the
      // ticker computed — frame 0 / skin 1, i.e. untouched markup defaults —
      // in the SAME tick, with p/m values that both resolve to frame=1.
      //
      // The playhead is the one source of truth that cannot go stale, so drive
      // the window from it directly. Once the morph is underway the window is
      // up and the energy skin is gone; before that, the reverse. This makes
      // the card's appearance independent of whether the ticker's element
      // references are still valid.
      const liveFrame = beat.querySelector<HTMLElement>("[data-frame]");
      const liveSkin = beat.querySelector<HTMLElement>("[data-skin]");
      if (liveFrame && liveSkin) {
        const onStage = t >= M && t <= E + EXIT;
        if (onStage) {
          // morph progress straight off the playhead
          const mm2 = Math.min(1, Math.max(0, (t - M) / morphDur));
          const want = Math.min(1, mm2 / 0.35);
          if (Math.abs(parseFloat(liveFrame.style.opacity || "0") - want) > 0.01) {
            liveFrame.style.opacity = String(want);
          }
          if (parseFloat(liveSkin.style.opacity || "1") > 0.01) {
            liveSkin.style.opacity = "0";
          }
        }
      }
    });
  });

  return { worksStart, drivers, snapSpans, introGuards };
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
  // exponent 2.2 (was 1.6): the node covers most of the distance early and
  // spends the tail of the flight in a long decelerating glide — a calm,
  // organic arrival instead of a rush that stops dead at the lens.
  const d = dNear + (dFar - dNear) * Math.pow(1 - p, 2.2);
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
export function createWorksTicker(
  drivers: BeatDriver[],
  introGuards: (() => void)[] = [],
) {
  // Transforms are batched per beat and applied to the CURRENT wrap node (see
  // the note on f/k below — any of these can be replaced by React or by a
  // matchMedia re-run). Writing one composite transform string is also cheaper
  // than four separate quickSetters.
  const applyWrap = (d: BeatDriver, x: number, y: number, s: number, r: number) => {
    const el =
      (d.beat.querySelector("[data-node-wrap]") as HTMLElement | null) ?? d.wrap;
    el.style.transform = `translate(${x}px, ${y}px) rotate(${r}deg) scale(${s})`;
  };

  const setters = drivers.map((d) => ({
    // ⚠️ RE-RESOLVE THE NODE ON EVERY WRITE — never cache it.
    // gsap.quickSetter (and any held reference) binds to one element. React can
    // replace these nodes — the window is a <Link> for published studies and a
    // <div> for unpublished ones — and gsap.matchMedia() re-runs its callback
    // whenever the query re-evaluates, which iOS Safari does when the browser
    // toolbar collapses during scroll. Either way the driver ends up pointing
    // at a detached element, the writes vanish, and the on-screen node keeps
    // its markup defaults: frame 0 / skin 1 — the exact INVERSE of what the
    // ticker computed. That is what the device kept reporting. Android's
    // browser chrome doesn't trigger the re-evaluation, which is why it only
    // ever broke on iPhone.
    f: (v: number) => {
      const el =
        (d.beat.querySelector("[data-frame]") as HTMLElement | null) ?? d.frame;
      el.style.opacity = String(v);
    },
    k: (v: number) => {
      const el =
        (d.beat.querySelector("[data-skin]") as HTMLElement | null) ?? d.skin;
      el.style.opacity = String(v);
    },
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
    // NOT `heroScroll.sceneLive` — that's a latch that never goes false. This
    // also requires a recently-rendered frame, so a lost WebGL context or a
    // stalled frameloop (iOS Safari, memory pressure / Low Power Mode) drops us
    // onto the DOM path instead of waiting on a mesh that will never draw.
    const live = sceneIsLive();
    const wn = heroScroll.worksNode;

    // the active beat = the furthest one that has started (finished beats keep
    // p=1 but their 3D node has burned off with m=1; scrubbing back rewinds p)
    let activeIdx = -1;

    // Re-assert states that a ScrollTrigger invalidate can drop (notably the
    // full-viewport works-intro layer, which otherwise strands visible on top
    // of the project windows).
    for (const g of introGuards) g();

    drivers.forEach((b, i) => {
      const { m } = b.proxy;
      let { p } = b.proxy;

      // ⚠️ `p` CAN BE 0 WHILE THE BEAT IS ON STAGE — do not trust it alone.
      // The hero's ScrollTrigger uses `invalidateOnRefresh: true`, and
      // ScrollTrigger.refresh() (called by the loader's handOff, among others)
      // invalidates the timeline, resetting every fromTo — including this
      // proxy — back to its START value. On desktop the scrub immediately
      // re-drives it so nothing is visible; on iOS the post-refresh scroll
      // position does not always re-fire the tween, so `p` stays 0 forever.
      // The old `if (p <= 0) return` then skipped this beat every frame and the
      // window kept its initial inline opacity:0 — the reported "only title and
      // subtext, no project card", with `frame op=0.00` + `skin op=1.00`
      // captured on device.
      //
      // So: if the BEAT ITSELF is visible (its autoAlpha tween did run) but p
      // never advanced, treat the beat as docked and dress the window anyway.
      // The beat's own visibility is the authority on whether it is on stage.
      if (p <= 0) {
        const bcs = getComputedStyle(b.beat);
        const onStage =
          bcs.visibility !== "hidden" && parseFloat(bcs.opacity) > 0.05;
        if (!onStage) return; // genuinely parked — skip, as before
        p = 1; // on stage but un-driven → show the finished window
      }

      activeIdx = i;
      const st = setters[i];

      // the formed window barely sways; mid-flight it rides the bend fully
      const damp = 1 - 0.82 * m;
      const pos = flightXY(
        travel, p, b.scatter, NODE_D_FAR, NODE_D_NEAR, vw, vh, tanX, tanY,
      );
      applyWrap(
        b,
        pos.x * damp,
        pos.y * damp,
        0.14 + 0.86 * (1 - Math.pow(1 - p, 2.2)),
        (pos.x / vw) * 8 * (1 - m), // a whisper of bank into the turn
      );

      // While the 3D scene renders the cuboid, the DOM frame exists only for
      // the morph — it crossfades in over the fading mesh. On the video
      // fallback (no scene) the DOM orange skin flies the whole way instead.
      //
      // ⚠️ THE `live` BRANCH MUST NEVER BE THE ONLY THING THAT CAN SHOW THE
      // WINDOW. It keys off `m` (the morph), so if the 3D scene dies mid-beat
      // the window would wait forever on a morph that never advances — the
      // reader gets the title, the description and the orange node, but no
      // project card. That is exactly the iPhone bug. `sceneIsLive()` already
      // falls back when the frameloop stalls; this max() is the second net:
      // once the node has essentially docked (p high), the window comes up
      // regardless of which branch we're on.
      const dockedAlpha = Math.min(1, Math.max(0, (p - 0.82) / 0.12));
      const frameAlpha = Math.max(
        live
          ? Math.min(1, Math.max(0, m / 0.35))
          : Math.min(1, Math.max(0, p / 0.3)),
        dockedAlpha,
      );
      st.f(frameAlpha);
      // the orange skin never tints the 2D window on the live path — the
      // cuboid carries all the orange and burns off behind the white window.
      // Fallback (no 3D node): the skin IS the node through the flight, then
      // burns off across the morph. Once docked it must be GONE either way,
      // or a dead scene leaves an orange blob sitting on the project image.
      const skinAlpha = live ? 0 : 1 - Math.min(1, Math.max(0, (m - 0.05) / 0.4));
      st.k(Math.min(skinAlpha, 1 - dockedAlpha));
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
        {projects.map((p, i) => {
          // external projects link out in a new tab; studies go to /work/slug
          const inner = (
            <>
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
            </>
          );
          return (
            <li key={p.slug}>
              {p.externalUrl ? (
                <a
                  href={p.externalUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="group block max-w-2xl"
                >
                  {inner}
                </a>
              ) : (
                <Link
                  href={`/work/${p.slug}` as Route}
                  className="group block max-w-2xl"
                >
                  {inner}
                </Link>
              )}
            </li>
          );
        })}
      </ul>
    </section>
  );
}
