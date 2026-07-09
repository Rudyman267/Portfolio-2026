"use client";

import Link from "next/link";
import type { Route } from "next";
import { useRef } from "react";
import { ArrowLeft, ArrowRight } from "lucide-react";
import { HeroCanvas } from "@/components/hero3d/HeroCanvas";
import { heroScroll } from "@/components/hero3d/heroScroll";
import { gsap, useGSAP, ease } from "@/lib/gsap";
import { LOADER_DONE_EVENT } from "@/components/motion/Loader";

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
 *
 * Reduced motion: no pin, no scrub — first phrase renders statically, curves
 * peek in via their CSS fallback, extra phrases stay display:none.
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

        // circle wipe: centered via xPercent/yPercent (NOT the CSS translate,
        // which GSAP's scale tween would clobber), hidden at scale 0.
        gsap.set("[data-circle-wipe]", { xPercent: -50, yPercent: -50, scale: 0 });

        const reveal = () => {
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

        if (document.body.classList.contains("is-loading")) {
          window.addEventListener(LOADER_DONE_EVENT, reveal, { once: true });
        } else {
          reveal();
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

        // Progress at which the curves have spawned. The scrub timeline is:
        //   p1→2 (dur 1) + waves-in ("<") ... the waves finish early in the run.
        // Total ≈ 4.4 units; the waves are present from ~0.9 → arm at 0.22 to
        // cover the sliver appearing, with margin so phrase 1 never shows them.
        const ARM_AT = 0.22;

        const scrub = gsap.timeline({
          defaults: { duration: 1, stagger: 0.08 },
          scrollTrigger: {
            trigger: root,
            start: "top top",
            // ends right as the circle finishes filling white — no dead white
            // hold before the gallery takes over (was +=320%, which left ~1
            // viewport of pinned full-white before unpin).
            end: "+=235%",
            pin: true,
            scrub: 0.8,
            anticipatePin: 1,
            // hero is first on the page → refresh before the gallery pin so
            // pin-spacing stacks in document order (higher number = first)
            refreshPriority: 1,
            // drive the 3D scene's travel along the snake path from the SAME
            // scroll progress as the phrase cycle (see hero3d/heroScroll.ts),
            // and arm the CASES/PLAYS curves only once they've spawned (~phrase
            // 1→2). Progress-driven so it's correct at any scroll position and
            // in both directions — including a scroll-back to the top.
            onUpdate: (self) => {
              heroScroll.progress = self.progress;
              armCurves(self.progress >= ARM_AT);
            },
          },
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
          // phrase 3 recedes as the circle wipe swallows the screen to white
          .fromTo(
            linesOf(2),
            { yPercent: 0 },
            { yPercent: -40, opacity: 0, ease: "power2.in", immediateRender: false },
            "circle",
          )
          .fromTo(
            "[data-circle-wipe]",
            { scale: 0, xPercent: -50, yPercent: -50 },
            {
              // fills the viewport EXACTLY at the tween's end (pin unpin) — a
              // 40vmax dot needs ~scale 4 to cover the screen; power2.in keeps
              // it accelerating into fullness so there's no early full-white
              // that then just sits there while the pin runs out.
              scale: 4.2,
              ease: "power2.in",
              duration: 2.0,
              immediateRender: false,
            },
            "circle",
          );
        // (no trailing hold — hero unpins the instant white fills, so the gallery
        //  assembly picks up immediately with no blank-white dead scroll)

        return () => {
          window.removeEventListener(LOADER_DONE_EVENT, reveal);
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
      {/* living 3D ecosystem (video/poster fallback inside) */}
      <HeroCanvas />

      {/*
        DEV-ONLY hero scene tweak panel is UNMOUNTED (preset locked). The panel +
        store (incl. the "Footer Glow" group) are kept for future tweaks — to bring
        the floating control bar back, re-add the dynamic import and mount <HeroControls/>:
          const HeroControls = process.env.NODE_ENV === "development"
            ? dynamic(() => import("@/components/hero3d/HeroControls")
                .then((m) => m.HeroControls), { ssr: false })
            : () => null;
        (also re-add `import dynamic from "next/dynamic"`).
      */}

      {/* CASES / PLAYS edge curves — spawn during the phrase 2→3 scroll */}
      {CURVES.map((c) => (
        <CurvePanel key={c.title} curve={c} />
      ))}

      {/* circle wipe — grows from center at the tail of the pin and floods the
          screen white, handing off into the (white) WORK gallery below. Starts
          as a 0-scale dot; the scrub timeline expands it. */}
      <div
        data-circle-wipe
        aria-hidden="true"
        className="pointer-events-none absolute left-1/2 top-1/2 z-30 h-[40vmax] w-[40vmax] rounded-full bg-white"
        style={{ willChange: "transform" }}
      />


      {/* content layer — centered headline block, coords/portfolio pinned */}
      <div className="relative z-10 flex flex-1 flex-col justify-center px-[var(--gutter)]">
        {/* centered headline + pill */}
        <div className="relative mx-auto w-full max-w-[var(--container-wide)]">
          {/* coordinates — tucked to the upper-right of the headline block */}
          <p
            data-hero-item
            className="mb-3 text-right text-[clamp(0.85rem,1.2vw,1.2rem)] font-medium tracking-tight text-fg/85"
          >
            18.5544° N , 73.7759°
          </p>

          {/* headline stack — phrase 0 in flow, the rest overlaid on top */}
          <div className="relative select-none text-center font-bold leading-[0.95] tracking-[-0.03em] text-fg [font-size:clamp(2.5rem,9vw,6.25rem)]">
            <h1 data-phrase>
              <PhraseLines lines={PHRASES[0]} />
            </h1>
            {PHRASES.slice(1).map((lines) => (
              <div
                key={lines[0]}
                data-phrase
                aria-hidden="true"
                className="absolute inset-0 hidden"
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
