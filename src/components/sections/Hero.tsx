"use client";

import Link from "next/link";
import dynamic from "next/dynamic";
import type { Route } from "next";
import { useRef } from "react";
import { ArrowLeft, ArrowRight } from "lucide-react";
import { HeroCanvas } from "@/components/hero3d/HeroCanvas";
import { heroScroll } from "@/components/hero3d/heroScroll";
import { gsap, useGSAP, ScrollTrigger, ease } from "@/lib/gsap";
import { LOADER_DONE_EVENT } from "@/components/motion/Loader";
import {
  WorksOverlay,
  addWorksBeats,
  createWorksTicker,
} from "@/components/sections/WorksJourney";
import { worksAnchor, scrollToWorks } from "@/components/sections/worksAnchor";
import { HeroDebug } from "@/components/sections/HeroDebug";

// Hero scene tweak panel (🎛 FAB, incl. the Footer Glow group). PERMANENTLY
// mounted but dev-gated: in `next dev` NODE_ENV==="development" so the panel
// loads; in production builds (Vercel) this resolves to a no-op and the dynamic
// import is tree-shaken out — so it's ALWAYS in local, NEVER shipped. No manual
// mount/unmount needed. To bake a tuned preset: Copy config → paste into
// DEFAULT_TWEAK in tweakConfig.ts.
const HeroControls =
  process.env.NODE_ENV === "development"
    ? dynamic(
        () => import("@/components/hero3d/HeroControls").then((m) => m.HeroControls),
        { ssr: false },
      )
    : () => null;

/**
 * Hero — the dark, cinematic landing (Figma 25:144 + the Reference 1 scroll
 * storyboard). Cream typography over a single organic background, with the
 * CASES / PLAYS curves woven into the same pinned scroll flow.
 *
 * ONE background instance for the whole home hero (no duplicate shader/section).
 *
 * Motion systems, all on one pinned timeline:
 *  1. Intro reveal — kicked off by LOADER_DONE_EVENT so the door opening and the
 *     first headline rising read as one continuous motion.
 *  2. Phrase cycle — headline swaps through three phrases
 *     (25:144 → 35:159 → 43:14), each line masking out/in, scrubbed to scroll.
 *  3. Curves — blank white S-wave curves spawn organically from the L/R edges as
 *     phrase 2 ("I TURN IDEAS—INTO CODE") scrolls in and stay through phrase 3
 *     ("DESIGNING THE AGE OF INTELLIGENCE"). Blank at rest (no labels); the
 *     CASES/PLAYS panel content appears on hover only.
 *  4. Works chapter (WorksJourney.tsx) — after phrase 3 recedes the SAME pin
 *     keeps going: "HERE'S SOME OF MY WORK", then five project-node beats play
 *     over the untouched tunnel (an orange energy node rides the snake path to
 *     the lens and morphs into the white case-study window). The old white
 *     horizontal gallery + circle wipe are gone; the pin hands off straight
 *     into the dark footer.
 *
 * Reduced motion: no pin, no scrub — first phrase renders statically, curves
 * peek in via their CSS fallback, extra phrases stay display:none, and the
 * works chapter is served by WorksIndexStatic (page.tsx) instead.
 */

const PHRASES: readonly (readonly string[])[] = [
  ["I AM A", "PRODUCT—DESIGN", "BUILDER"],
  ["I TURN", "IDEAS—INTO", "CODE"],
  ["DESIGNING", "THE AGE OF", "INTELLIGENCE"],
];

// Exact Figma "Vector 3" S-wave (viewBox 0 0 370.647 878.156): straight left
// edge, right edge sweeping out in two S-curves meeting at ~49% height.
const WAVE_VIEWBOX = "0 0 370.647 878.156";
const WAVE_D =
  "M370.647 432.875C370.647 184.049 0 218.92 0 0V878.156C0 641.295 370.647 671.079 370.647 432.875Z";

type Curve = {
  side: "left" | "right";
  title: string;
  href: Route;
  desc: string;
  years: string;
};

// TODO(content): PLAYS points at /work until a playground route exists.
const CURVES: Curve[] = [
  {
    side: "left",
    title: "CASES",
    href: "/work",
    desc: "Collection of my recent professional product design case studies",
    years: "2025–Today",
  },
  {
    side: "right",
    title: "PLAYS",
    href: "/work",
    desc: "Experiments, prototypes and playful builds from the edge of AI",
    years: "2025–Today",
  },
];

/**
 * A single edge curve (CASES or PLAYS). Blank white S-wave at rest; on hover the
 * wave stretches full-width and the panel content fades in. The whole shape is
 * mirrored for the right side; content is laid out per-side (not mirrored).
 */
function CurvePanel({ curve }: { curve: Curve }) {
  const left = curve.side === "left";
  return (
    <Link
      href={curve.href}
      data-curve
      data-side={curve.side}
      aria-label={`${curve.title} — ${curve.desc}`}
      className={`absolute inset-y-0 z-20 block w-[clamp(300px,24vw,440px)] ${
        left ? "left-0" : "right-0"
      }`}
      style={{ pointerEvents: "none" }}
    >
      {/* the S-wave — mirrored wholesale for the right panel */}
      <span
        aria-hidden="true"
        className={`absolute inset-0 block ${left ? "" : "[transform:scaleX(-1)]"}`}
      >
        {/* CSS fallback shows the resting tip for reduced-motion users (the
            GSAP scrub replaces this on capable devices). */}
        <svg
          data-wave
          viewBox={WAVE_VIEWBOX}
          preserveAspectRatio="none"
          className="absolute bottom-0 left-0 block h-[88%] w-full drop-shadow-[0_0_40px_rgba(255,255,255,0.14)]"
          style={{ transform: "scaleX(0.14)", transformOrigin: "left center" }}
        >
          <path d={WAVE_D} fill="#ffffff" />
        </svg>
      </span>

      {/* content — NOT mirrored; laid out per side (Figma 43:97) */}
      <span
        data-content
        aria-hidden="true"
        className={`absolute bottom-0 flex h-[88%] w-full items-center opacity-0 ${
          left ? "left-0 justify-start pl-[8%]" : "right-0 justify-end pr-[8%]"
        }`}
        style={{ pointerEvents: "none" }}
      >
        <span className={`flex items-center gap-5 ${left ? "" : "flex-row-reverse"}`}>
          <span
            className={`block text-[clamp(13px,1.15vw,20px)] font-bold text-black [writing-mode:vertical-rl] ${
              left ? "rotate-180" : ""
            }`}
          >
            {curve.years}
          </span>
          <span className={`flex max-w-[220px] flex-col gap-2 ${left ? "" : "items-end text-right"}`}>
            <span className="text-[clamp(24px,2.1vw,36px)] font-bold text-black">
              {curve.title}
            </span>
            <span className="text-[clamp(13px,0.95vw,16px)] font-medium leading-snug text-black">
              {curve.desc}
            </span>
            <span className="mt-5 inline-flex items-center gap-2 text-[clamp(13px,0.95vw,16px)] font-medium text-[#8d8d8d]">
              {left ? (
                <>
                  <ArrowLeft size={15} /> Click to view
                </>
              ) : (
                <>
                  Click to view <ArrowRight size={15} />
                </>
              )}
            </span>
          </span>
        </span>
      </span>

      {/* hover/tap trigger — the edge zone */}
      <span
        data-trigger
        className={`absolute top-1/2 block h-[45vh] w-[120px] -translate-y-1/2 ${
          left ? "left-0" : "right-0"
        }`}
        style={{ pointerEvents: "auto" }}
      />
    </Link>
  );
}

function PhraseLines({ lines }: { lines: readonly string[] }) {
  // Two nested animation layers per line, so the intro reveal and the scroll
  // scrub never write to the same element (they fight over yPercent otherwise):
  //   [data-intro] — owned by the door-synced intro reveal (phrase 0 only)
  //   [data-line]  — owned exclusively by the scroll-scrub timeline
  return (
    <>
      {lines.map((line) => (
        <span key={line} className="block overflow-hidden [font-kerning:none]">
          <span data-intro className="block will-change-transform">
            <span data-line className="block will-change-transform">
              {line}
            </span>
          </span>
        </span>
      ))}
    </>
  );
}

export function Hero() {
  const ref = useRef<HTMLElement>(null);

  useGSAP(
    () => {
      const mm = gsap.matchMedia();
      mm.add("(prefers-reduced-motion: no-preference)", () => {
        const root = ref.current;
        if (!root) return;

        const phrases = gsap.utils.toArray<HTMLElement>(
          root.querySelectorAll("[data-phrase]"),
        );
        const linesOf = (i: number) =>
          phrases[i]?.querySelectorAll<HTMLElement>("[data-line]") ?? [];
        const introsOf = (i: number) =>
          phrases[i]?.querySelectorAll<HTMLElement>("[data-intro]") ?? [];
        const items = root.querySelectorAll<HTMLElement>("[data-hero-item]");

        // --- 1. intro reveal (first phrase only), synced to the door -------
        // Animates the [data-intro] layer ONLY — [data-line] belongs to the
        // scroll scrub below. Keeping the owners separate is what prevents the
        // "both phrases overlapped" bug.
        gsap.set(introsOf(0), { yPercent: 120 });
        if (items.length) gsap.set(items, { opacity: 0, y: 18 });

        const reveal = () => {
          // marker for the ?herodebug probe: proves reveal() actually ran.
          root.setAttribute("data-revealed", "1");
          const tl = gsap.timeline();
          tl.to(introsOf(0), {
            yPercent: 0,
            duration: 1.0,
            stagger: 0.1,
            ease: ease.expo,
          });
          if (items.length) {
            tl.to(
              items,
              { opacity: 1, y: 0, duration: 0.8, stagger: 0.08, ease: ease.expo },
              "-=0.6",
            );
          }
        };

        // rAF ids for the deferred client-nav reveal (cancelled in cleanup).
        let revealRaf1 = 0;
        let revealRaf2 = 0;
        // ── REVEAL ROBUSTNESS (iOS "only the shader, no text" bug) ───────────
        // The headline + Portfolio mark are hidden by the gsap.set above and
        // brought back by reveal(). On iOS the previous approach (wait for the
        // one-shot LOADER_DONE_EVENT, with a timer failsafe) still stranded them
        // hidden: the loader's hand-off can fire BEFORE this effect subscribes,
        // so the event is missed, and any effect re-run / early cleanup cancels
        // the timer. Result: hidden forever. Fixes:
        //   1. `instantReveal` — if the loader is ALREADY done when we mount
        //      (is-loading absent), reveal without waiting for an event.
        //   2. A POLL (not a single timeout) that watches is-loading clear, so a
        //      missed event still triggers the reveal on the next tick.
        //   3. A hard timeout ceiling as the last resort.
        //   4. Cleanup FORCE-SHOWS the elements — if we tear down before the
        //      reveal ran, they must never be left invisible.
        let revealed = false;
        const forceShow = () => {
          // snap to the visible state without animating (last-resort recovery)
          gsap.set(introsOf(0), { yPercent: 0, clearProps: "opacity,visibility" });
          if (items.length) gsap.set(items, { opacity: 1, y: 0 });
        };
        const revealOnce = () => {
          if (revealed) return;
          revealed = true;
          window.clearInterval(revealPoll);
          window.clearTimeout(revealCeiling);
          reveal();
        };

        // (2) poll: the moment the loader clears is-loading, reveal.
        const revealPoll = window.setInterval(() => {
          if (!document.body.classList.contains("is-loading")) revealOnce();
        }, 120);
        // (3) hard ceiling: reveal no matter what within 2.5s of mount.
        const revealCeiling = window.setTimeout(revealOnce, 2500);

        if (!document.body.classList.contains("is-loading")) {
          // (1) loader already finished (event long gone) OR client-side nav —
          // reveal on a deferred frame so it doesn't collide with the
          // SmoothScrollProvider's queued ScrollTrigger.refresh (that refresh's
          // pin re-layout would interrupt the tween and strand the headline).
          // Double rAF: frame 1 = provider's refresh, frame 2 = us.
          revealRaf1 = requestAnimationFrame(() => {
            revealRaf2 = requestAnimationFrame(revealOnce);
          });
        } else {
          // fresh full load, loader still running → the event is the happy path;
          // the poll/ceiling above are the safety nets if it's missed.
          window.addEventListener(LOADER_DONE_EVENT, revealOnce, { once: true });
        }

        // --- curve hover open/close (blank wave → full panel + content) -----
        const REST_TIP = 0.14; // resting sliver width (Figma 43:87)
        const curveCleanups: (() => void)[] = [];
        const waves: HTMLElement[] = [];
        const triggers: HTMLElement[] = [];
        const openTls: gsap.core.Timeline[] = [];

        // The curves only exist in scenes 2 & 3 (they spawn during the phrase
        // 1→2 scrub). `armed` gates hover so they can never open — nor be
        // hovered — while phrase 1 is on screen. Driven from the scrub's
        // progress (see ARM_AT below), which is reliable in both directions
        // (a .call() at the timeline start does NOT fire dependably on scrub).
        const armState = { armed: false };

        root.querySelectorAll<HTMLElement>("[data-curve]").forEach((panel) => {
          const wave = panel.querySelector<HTMLElement>("[data-wave]");
          const content = panel.querySelector<HTMLElement>("[data-content]");
          const trigger = panel.querySelector<HTMLElement>("[data-trigger]");
          if (!wave || !content || !trigger) return;

          gsap.set(wave, { scaleX: 0, transformOrigin: "left center" });
          // edge hotspot is inert until the curves are armed
          gsap.set(trigger, { pointerEvents: "none" });
          waves.push(wave);
          triggers.push(trigger);

          const open = gsap
            .timeline({
              paused: true,
              onStart: () => {
                panel.style.pointerEvents = "auto";
              },
              onReverseComplete: () => {
                panel.style.pointerEvents = "none";
              },
            })
            .to(wave, { scaleX: 1, duration: 0.85, ease: "power4.out" }, 0)
            .fromTo(
              content,
              { opacity: 0, x: panel.dataset.side === "left" ? -24 : 24 },
              { opacity: 1, x: 0, duration: 0.45, ease: "power2.out" },
              0.35,
            );

          openTls.push(open);

          const play = () => {
            if (armState.armed) open.play();
          };
          const reverse = () => open.reverse();
          trigger.addEventListener("mouseenter", play);
          panel.addEventListener("mouseleave", reverse);
          panel.addEventListener("focusin", play);
          panel.addEventListener("focusout", reverse);
          curveCleanups.push(() => {
            trigger.removeEventListener("mouseenter", play);
            panel.removeEventListener("mouseleave", reverse);
            panel.removeEventListener("focusin", play);
            panel.removeEventListener("focusout", reverse);
          });
        });

        // arm/disarm the curves. Disarming force-closes any open panel (in case
        // the pointer was on it while scrolling back), snaps the wave sliver
        // fully shut, and makes the edge hotspots inert — so phrase 1 shows no
        // trace of the curves. Idempotent + only touches the DOM on transitions.
        const armCurves = (on: boolean) => {
          if (armState.armed === on) return;
          armState.armed = on;
          gsap.set(triggers, { pointerEvents: on ? "auto" : "none" });
          if (!on) {
            openTls.forEach((tl) => tl.pause(0)); // snap closed, no reverse anim
            root
              .querySelectorAll<HTMLElement>("[data-curve]")
              .forEach((panel) => {
                panel.style.pointerEvents = "none";
              });
            gsap.set(waves, { scaleX: 0 });
          }
        };

        // --- 2. scroll flow: pin + cycle the phrases ------------------------
        // Overlay phrases start hidden (display:none for reduced-motion safety);
        // reveal them for the scrub and park their lines below the mask.
        phrases.slice(1).forEach((p) => {
          gsap.set(p, { display: "block" });
          gsap.set(p.querySelectorAll("[data-line]"), { yPercent: 120 });
        });

        // The timeline is built FIRST (phrases + works chapter), THEN pinned —
        // ScrollTrigger.create below sizes the pin from the finished duration,
        // keeping the original scroll-per-beat pacing however many beats exist.
        const scrub = gsap.timeline({
          defaults: { duration: 1, stagger: 0.08 },
        });

        // Every segment is an explicit fromTo (immediateRender off) so the
        // timeline is fully deterministic at any scroll position.
        scrub
          // phrase 1 → 2, and the curves spawn organically from the edges here.
          // Each line slides on yPercent AND crossfades opacity so the outgoing
          // and incoming phrases never sit legibly on top of each other over the
          // busy 3D background: the outgoing lines fade out fast/early (ends by
          // ~60% of their slide), the incoming lines fade in fast on arrival.
          .fromTo(
            linesOf(0),
            { yPercent: 0, opacity: 1 },
            { yPercent: -120, immediateRender: false, ease: "power2.in" },
          )
          .to(
            linesOf(0),
            { opacity: 0, duration: 0.6, ease: "power2.in", immediateRender: false },
            "<", // fade begins with the slide-out, finishes well before it's gone
          )
          .addLabel("p2in")
          .fromTo(
            linesOf(1),
            { yPercent: 120, opacity: 0 },
            { yPercent: 0, ease: "power2.out", immediateRender: false },
            "p2in-=0.55",
          )
          .to(
            linesOf(1),
            { opacity: 1, duration: 0.5, ease: "power2.out", immediateRender: false },
            "<0.35", // hold the incoming lines faint until they've nearly arrived
          )
          .fromTo(
            waves,
            { scaleX: 0 },
            {
              scaleX: REST_TIP,
              ease: "power3.out",
              stagger: 0.12,
              immediateRender: false,
            },
            "p2in-=0.55", // together with phrase 2 rising in (same start as slide)
          )
          .to({}, { duration: 0.5 }) // hold — curves stay out through phrase 3
          // phrase 2 → 3 — same yPercent + opacity crossfade as p1→2
          .fromTo(
            linesOf(1),
            { yPercent: 0, opacity: 1 },
            { yPercent: -120, immediateRender: false, ease: "power2.in" },
          )
          .to(
            linesOf(1),
            { opacity: 0, duration: 0.6, ease: "power2.in", immediateRender: false },
            "<",
          )
          .fromTo(
            linesOf(2),
            { yPercent: 120, opacity: 0 },
            { yPercent: 0, ease: "power2.out", immediateRender: false },
            "-=0.55",
          )
          .to(
            linesOf(2),
            { opacity: 1, duration: 0.5, ease: "power2.out", immediateRender: false },
            "<0.35",
          )
          .to({}, { duration: 0.35 }) // brief hold on phrase 3
          .addLabel("outro")
          // phrase 3 recedes into the tunnel — the dark scene STAYS (no white
          // wipe anymore); the works chapter takes the stage next
          .fromTo(
            linesOf(2),
            { yPercent: 0 },
            { yPercent: -40, opacity: 0, ease: "power2.in", immediateRender: false },
            "outro",
          )
          // the CASES/PLAYS slivers withdraw so the project beats own the frame
          .fromTo(
            waves,
            { scaleX: REST_TIP },
            { scaleX: 0, duration: 0.6, ease: "power2.in", immediateRender: false },
            "outro",
          );

        // curves are hoverable only while their scene is on stage: from the
        // phrase-1→2 spawn until the works chapter takes over.
        const ARM_T = 1.27; // ≈ the old ARM_AT (0.22 × 5.75 timeline units)
        const DISARM_T = scrub.labels["outro"] + 0.6;

        // --- 3. works chapter — project nodes summoned over the tunnel ------
        const { worksStart, drivers, snapSpans } = addWorksBeats(scrub, root);

        // the nodes ride the SAME snake path as the tunnel instances, per
        // frame (scroll flies them in; idle travel keeps them swaying)
        const tick = createWorksTicker(drivers);
        gsap.ticker.add(tick);

        // Pin length: preserve the original scroll-per-timeline-unit (the old
        // hero was 235% of viewport across 5.75 units), so the phrase pacing —
        // and, via the progress scale in onUpdate, the tunnel's world-units-
        // per-scroll — are IDENTICAL to the pre-works build ON DESKTOP.
        const OLD_UNITS = 5.75;
        const OLD_END_VH = 2.35;
        // On touch, only a GENTLE trim of the scroll length. An earlier ~half
        // reduction (1.25) made the whole journey feel hair-trigger sensitive —
        // a small thumb flick jumped several beats. Back to ~10% off the desktop
        // travel (2.35 → 2.12): a touch shorter than desktop, but the tunnel and
        // node beats keep almost the same world-units-per-swipe, so scrubbing
        // feels controlled again. Desktop (fine pointer) is unchanged.
        const isCoarse =
          typeof window !== "undefined" &&
          window.matchMedia("(pointer: coarse)").matches;
        const endVh = isCoarse ? 2.12 : OLD_END_VH;
        const unitPx = () => (window.innerHeight * endVh) / OLD_UNITS;

        ScrollTrigger.create({
          animation: scrub,
          trigger: root,
          start: "top top",
          end: () => "+=" + Math.round(scrub.duration() * unitPx()),
          pin: true,
          // Force FIXED pinning on touch. Left to auto-detect, ScrollTrigger
          // uses transform-based pinning on mobile, which — together with
          // anticipatePin — briefly exposes the pin-spacer for a frame at scroll
          // start (the "white gap that spawns then snaps to full-viewport
          // shader" on Android). Fixed pinning + no anticipation removes that
          // flash. Desktop keeps the default (transform) pin + anticipatePin.
          pinType: isCoarse ? "fixed" : undefined,
          anticipatePin: isCoarse ? 0 : 1,
          scrub: 0.8,
          invalidateOnRefresh: true,
          // HANDHOLD — when the scroll settles inside a works-beat span, glide
          // to that beat's resting state (window fully formed, or the exit
          // carried through) so the reader never sits on a half-morphed frame.
          // A key mobile affordance: thumb-flick scrolling always lands short
          // or long, and every beat stage is scrubbed. Outside the spans the
          // value is returned untouched, so the phrases/tunnel scroll freely.
          snap: {
            snapTo: (value: number) => {
              const t = value * scrub.duration();
              for (const s of snapSpans) {
                if (t >= s.from && t < s.to) return s.rest / scrub.duration();
              }
              return value;
            },
            // inertia:false = snapTo receives the CURRENT progress, not a
            // velocity-projected landing. With projection, a fast flick (or a
            // programmatic jump) reports a position far past the real one and
            // the "no snap here" return value still tweens the page there —
            // teleporting the reader. Positional-only is the safe behavior.
            inertia: false,
            duration: { min: 0.35, max: 1.1 },
            delay: 0.12,
            ease: "power2.inOut",
          },
          // hero is first on the page → refresh before any later pins so
          // pin-spacing stacks in document order (higher number = first)
          refreshPriority: 1,
          // drive the 3D scene's travel along the snake path from the SAME
          // scroll progress as the beats (see hero3d/heroScroll.ts). The
          // duration/OLD_UNITS scale keeps world-units-per-scroll constant, so
          // the tunnel feels exactly as before while the journey lasts longer.
          // Progress-driven so it's correct at any scroll position and in both
          // directions — including a scroll-back to the top.
          onUpdate: (self) => {
            heroScroll.progress = self.progress * (scrub.duration() / OLD_UNITS);
            const t = self.progress * scrub.duration();
            armCurves(t >= ARM_T && t < DISARM_T);
          },
          // /#work glides INTO the pin (no #work element exists on this path) —
          // publish where the chapter intro finishes rising, refreshed with the
          // pin geometry.
          onRefresh: (self) => {
            worksAnchor.y =
              self.start +
              ((worksStart + 0.9) / scrub.duration()) * (self.end - self.start);
          },
        });

        // deep-link /#work: the browser can't hash-jump to a pinned beat, so
        // glide there once the page is interactive (post-loader on cold loads).
        const goWorks = () => requestAnimationFrame(() => scrollToWorks());
        if (window.location.hash === "#work") {
          if (document.body.classList.contains("is-loading")) {
            window.addEventListener(LOADER_DONE_EVENT, goWorks, { once: true });
          } else {
            goWorks();
          }
        }

        return () => {
          window.removeEventListener(LOADER_DONE_EVENT, revealOnce);
          window.removeEventListener(LOADER_DONE_EVENT, goWorks);
          window.clearInterval(revealPoll);
          window.clearTimeout(revealCeiling);
          cancelAnimationFrame(revealRaf1);
          cancelAnimationFrame(revealRaf2);
          // if we tear down before the reveal ran, DON'T leave the headline +
          // Portfolio mark stranded invisible (the iOS failure mode) — snap them
          // visible. A fresh mount will re-hide + re-reveal cleanly.
          if (!revealed) forceShow();
          gsap.ticker.remove(tick);
          curveCleanups.forEach((fn) => fn());
        };
      });
    },
    { scope: ref },
  );

  return (
    <section
      ref={ref}
      data-header-dark
      className="hero-dark relative flex min-h-dvh flex-col overflow-hidden"
    >
      {/* TEMP on-device diagnostics — only renders with ?herodebug in the URL */}
      <HeroDebug />

      {/* living 3D ecosystem (video/poster fallback inside) */}
      <HeroCanvas />

      {/* Hero scene tweak panel — dev-gated above, so this renders the 🎛 FAB in
          local dev and NOTHING in production. Safe to leave mounted permanently. */}
      <HeroControls />

      {/* CASES / PLAYS edge curves — spawn during the phrase 2→3 scroll */}
      {CURVES.map((c) => (
        <CurvePanel key={c.title} curve={c} />
      ))}

      {/* works chapter — "HERE'S SOME OF MY WORK" + the five project-node
          beats, summoned OVER the tunnel after the phrases (WorksJourney.tsx).
          Placed after the curves in DOM so its windows paint above them. */}
      <WorksOverlay />

      {/* content layer — centered headline block, coords/portfolio pinned */}
      <div className="relative z-10 flex flex-1 flex-col justify-center px-[var(--gutter)]">
        {/* centered headline + pill */}
        <div className="relative mx-auto w-full max-w-[var(--container-wide)]">
          {/* headline stack — phrase 0 in flow, the rest overlaid on top.
              Tanker (the site display face) — single weight, so no font-bold,
              and its natural tracking instead of the old tight Jakarta set. */}
          <div
            className="relative select-none text-center leading-[0.95] tracking-[0.01em] text-fg [font-size:clamp(2.5rem,9vw,6.25rem)]"
            style={{ fontFamily: "var(--font-display-tanker)" }}
          >
            {/* fontFamily inline on the h1 too — the globals base rule
                (h1..h4 { font-family: var(--font-display) }) would otherwise
                override the inherited Tanker with Jakarta on phrase 1 */}
            <h1
              data-phrase
              style={{ fontFamily: "var(--font-display-tanker)" }}
            >
              <PhraseLines lines={PHRASES[0]} />
            </h1>
            {PHRASES.slice(1).map((lines) => (
              <div
                key={lines[0]}
                data-phrase
                aria-hidden="true"
                className="absolute inset-0 hidden"
                style={{ fontFamily: "var(--font-display-tanker)" }}
              >
                <PhraseLines lines={lines} />
              </div>
            ))}
          </div>

        </div>

        {/* "Portfolio" mark — bottom-left of the section */}
        <p
          data-hero-item
          className="absolute bottom-8 left-[var(--gutter)] text-[clamp(0.85rem,1.2vw,1.2rem)] font-medium tracking-tight text-fg/85"
        >
          Portfolio
        </p>
      </div>
    </section>
  );
}
