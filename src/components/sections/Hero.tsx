"use client";

import Link from "next/link";
import dynamic from "next/dynamic";
import type { Route } from "next";
import { useRef } from "react";
import { ArrowLeft, ArrowRight } from "lucide-react";
import { HeroCanvas } from "@/components/hero3d/HeroCanvas";
import { heroScroll } from "@/components/hero3d/heroScroll";
import { gsap, useGSAP, ScrollTrigger, ease } from "@/lib/gsap";
import { createEscalatorSnap } from "@/lib/escalatorSnap";
import { createEscalatorDrive } from "@/lib/escalatorDrive";
import { LOADER_DONE_EVENT, loaderAlreadyDone } from "@/components/motion/Loader";
import {
  WorksOverlay,
  addWorksBeats,
  createWorksTicker,
} from "@/components/sections/WorksJourney";
import { worksAnchor, scrollToWorks } from "@/components/sections/worksAnchor";

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
    // now a real route — this used to fall back to /work because no playground
    // page existed yet.
    href: "/play",
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
      // ── ?herodebug — ON-SCREEN READOUT ───────────────────────────────────
      // Rebuilt because this bug class (hero paints, text does not) has never
      // once been solved from local repro: the headline is CLIPPED, not faded,
      // so every DOM-level check reports it healthy while the screen is empty.
      // Add `?herodebug` to the URL to get a live panel showing exactly which
      // reveal path ran and where the text actually is.
      let dbg: HTMLElement | null = null;
      let dbgTimer = 0;
      if (typeof window !== "undefined" && /[?&]herodebug/.test(location.search)) {
        dbg = document.createElement("div");
        dbg.style.cssText =
          "position:fixed;left:8px;bottom:8px;z-index:99999;font:11px/1.45 ui-monospace,monospace;" +
          "background:rgba(0,0,0,.88);color:#0f0;padding:8px 10px;border:1px solid #0f0;" +
          "border-radius:6px;white-space:pre;pointer-events:none;max-width:92vw";
        document.body.appendChild(dbg);
        const paint = () => {
          const root = ref.current;
          const h1 = document.querySelector("h1");
          const intro = h1?.querySelector("[data-intro]") as HTMLElement | null;
          const readY = (el: HTMLElement | null) => {
            if (!el) return "n/a";
            const m = getComputedStyle(el).transform.match(/matrix\(([^)]+)\)/);
            return m ? parseFloat(m[1].split(",")[5]).toFixed(0) : "0";
          };
          const r = intro?.getBoundingClientRect();
          const par = intro?.parentElement?.getBoundingClientRect();
          dbg!.textContent =
            "HERO DEBUG\n" +
            "reduced-motion : " + window.matchMedia("(prefers-reduced-motion: reduce)").matches + "\n" +
            "mm block ran   : " + (root?.getAttribute("data-mm") ?? "NO") + "\n" +
            "revealed       : " + (root?.getAttribute("data-revealed") ?? "NO") + "\n" +
            "loaderDone     : " + loaderAlreadyDone() + "\n" +
            "is-loading     : " + document.body.classList.contains("is-loading") + "\n" +
            "loader in DOM  : " + !!document.querySelector('[aria-label="Site intro"]') + "\n" +
            "intro translateY: " + readY(intro) + "px  (0 = visible, ~126 = CLIPPED)\n" +
            "intro top/par top: " + (r ? r.top.toFixed(0) : "?") + " / " + (par ? par.top.toFixed(0) : "?") + "\n" +
            "h1 opacity     : " + (h1 ? getComputedStyle(h1).opacity : "?") + "\n" +
            "phrase display : " + [...document.querySelectorAll("[data-phrase]")]
              .map((p) => getComputedStyle(p as HTMLElement).display).join(",") + "\n" +
            // WHO IS ON TOP? Everything above can read perfectly healthy while
            // another layer paints over the text — hit-test the headline itself.
            (() => {
              if (!r) return "hitTest        : (no rect)";
              const cx = Math.round(r.left + r.width / 2);
              const cy = Math.round(r.top + r.height / 2);
              const stack = (document.elementsFromPoint(cx, cy) || []).slice(0, 4)
                .map((el) => {
                  const c = getComputedStyle(el as HTMLElement);
                  return el.tagName.toLowerCase() +
                    (el.className ? "." + String(el.className).trim().split(/\s+/)[0] : "") +
                    "[z" + c.zIndex + " op" + c.opacity + "]";
                });
              return "hitTest@" + cx + "," + cy + " : " + stack.join("\n                 < ");
            })() + "\n" +
            "scrollY        : " + Math.round(window.scrollY) +
            "   pinned: " + (document.querySelector(".pin-spacer") ? "yes" : "no");
        };
        paint();
        dbgTimer = window.setInterval(paint, 250);
      }

      const mm = gsap.matchMedia();
      mm.add("(prefers-reduced-motion: no-preference)", () => {
        const root = ref.current;
        if (!root) return;
        // proves THIS callback actually ran (vs being skipped by the query)
        // COUNT the runs, don't just flag one — this callback re-running is the
        // root of the "only the first text appears" bug (see the yPercent note
        // in the scroll-flow section below).
        root.setAttribute(
          "data-mm",
          String((Number(root.getAttribute("data-mm")) || 0) + 1),
        );

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
        // ⚠️ ONLY HIDE THE HEADLINE IF AN INTRO IS ACTUALLY STILL COMING.
        //
        // `yPercent: 120` pushes the text out of its `overflow-hidden` parent —
        // it is CLIPPED, not faded, so while parked it is completely invisible
        // while `<h1>` still reports `opacity: 1; visibility: visible`. (That is
        // why DOM-level checks kept "passing" on a hero that rendered no text.)
        // Only `reveal()` brings it back, so hiding it when no reveal is going
        // to run leaves the shader painting over an empty stage.
        //
        // The hand-off can ALREADY have happened by the time this effect runs —
        // routine in nav mode, where the curtain is a brief pan flip rather than
        // a counter hold. In that case there is nothing left to sync to, so
        // start in the FINAL state instead of hiding and hoping something
        // un-hides us. Measured before this guard, arriving home from the nav:
        // `h1IntroYs: [126,126,126]` with `revealed: null` for ~3s.
        const introPending = !loaderAlreadyDone();
        if (introPending) {
          // clearProps first — same idempotency rule as the phrase park below:
          // yPercent compounds on a re-run, and a double-parked headline can
          // never be pulled back to 0 by the reveal.
          gsap.set(introsOf(0), { clearProps: "transform" });
          gsap.set(introsOf(0), { yPercent: 120 });
          if (items.length) gsap.set(items, { opacity: 0, y: 18 });
        } else {
          gsap.set(introsOf(0), { yPercent: 0 });
          if (items.length) gsap.set(items, { opacity: 1, y: 0 });
          root.setAttribute("data-revealed", "1");
        }

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
        // Already in the final state (see `introPending` above) → the entrance
        // has nothing to play, so mark it spent rather than re-animating text
        // that is already on screen.
        let revealed = !introPending;
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

        // (2) poll: reveal as soon as the intro has handed off.
        // ⚠️ TEST THE LATCH FIRST, not just `is-loading`. The Loader re-adds
        // `is-loading` DURING RENDER when it mounts late, so this poll used to
        // watch it go false -> true -> false and could latch the wrong edge. The
        // latch is monotonic (never un-sets) so it cannot do that. Measured
        // failure without it, on a nav-home load: the headline sat at
        // `yPercent: 120` — clipped, invisible — with `revealed: null` for ~3s.
        const revealPoll = window.setInterval(() => {
          if (loaderAlreadyDone() || !document.body.classList.contains("is-loading")) {
            revealOnce();
          }
        }, 120);
        // (3) hard ceiling: reveal no matter what within 2.5s of mount.
        const revealCeiling = window.setTimeout(revealOnce, 2500);

        // ⚠️ `loaderAlreadyDone()` closes the RACE THIS COMPONENT CANNOT WIN.
        // LOADER_DONE_EVENT is one-shot and we subscribe from inside useGSAP —
        // if the loader handed off before this effect ran (routine in nav mode,
        // where the curtain is a brief pan flip) the event is already gone and
        // the headline would stay parked off-screen forever.
        if (loaderAlreadyDone() || !document.body.classList.contains("is-loading")) {
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
        // ⚠️⚠️ THIS PARK MUST BE IDEMPOTENT — IT IS THE "ONLY THE FIRST TEXT
        // APPEARS" BUG.
        //
        // `gsap.set(el, { yPercent: 120 })` is NOT absolute in practice here:
        // GSAP resolves yPercent against the element's own height and ADDS it to
        // whatever transform the element already carries. This callback re-runs
        // (matchMedia re-evaluates on resize, and the Loader remounting on a nav
        // load triggers it too — PROJECT_LOG §6), so a second run parked the
        // lines at 228px instead of 114px. The scrub only ever animates them
        // back to yPercent 0, which now lands 114px SHORT — so phrases 2 and 3
        // stayed masked below their `overflow-hidden` line boxes at every scroll
        // position, while phrase 1 (parked by a different, guarded block) was
        // fine. Measured on a nav load: lineY 0/228/228 at rest, and 0/76 at the
        // end of the journey instead of -114/-38.
        //
        // `clearProps` first makes the park absolute: whatever a previous run
        // left behind is wiped, so N runs land in exactly the same place as one.
        phrases.slice(1).forEach((p) => {
          gsap.set(p, { display: "block" });
          const lines = p.querySelectorAll("[data-line]");
          gsap.set(lines, { clearProps: "transform" });
          gsap.set(lines, { yPercent: 120 });
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
          // p1hold — phrase 1 fully shown at t=0. An escalator rest point (see
          // the pin's directional snap): the reader can never settle in a blank
          // mid-crossfade; a drag rides to the next/previous full reveal.
          .addLabel("p1hold")
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
          .addLabel("p2hold") // phrase 2 fully risen — escalator rest point
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
          .addLabel("p3hold") // phrase 3 fully risen — escalator rest point
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
        const { worksStart, drivers, snapSpans, introGuards } =
          addWorksBeats(scrub, root);

        // the nodes ride the SAME snake path as the tunnel instances, per
        // frame (scroll flies them in; idle travel keeps them swaying)
        // Defensive: if a previous run of this matchMedia callback left its
        // ticker registered (iOS Safari re-evaluates the query when the
        // browser toolbar collapses during scroll), drop it before adding
        // ours. Two tickers driving two generations of DOM nodes is how the
        // project window ended up stuck at its initial opacity on iPhone.
        const prev = (window as unknown as Record<string, unknown>)
          .__worksTick as gsap.TickerCallback | undefined;
        if (prev) gsap.ticker.remove(prev);

        const tick = createWorksTicker(drivers, introGuards);
        (window as unknown as Record<string, unknown>).__worksTick = tick;
        gsap.ticker.add(tick);

        // Pin length: preserve the original scroll-per-timeline-unit (the old
        // hero was 235% of viewport across 5.75 units), so the phrase pacing —
        // and, via the progress scale in onUpdate, the tunnel's world-units-
        // per-scroll — are IDENTICAL to the pre-works build ON DESKTOP.
        const OLD_UNITS = 5.75;
        const OLD_END_VH = 2.35;
        // Touch scroll length. This number is scroll-px-per-timeline-unit, so
        // BIGGER = SLOWER: each beat takes more thumb travel.
        // History, because it has moved in both directions:
        //   1.25 — a hard trim, reported as hair-trigger (a small flick jumped
        //          several beats);
        //   2.12 — ~10% under the desktop 2.35, still reported as too fast on
        //          Android;
        //   2.90 — now. ~23% MORE travel per beat than desktop, because a thumb
        //          swipe covers far more screen than a wheel notch and phones
        //          have short viewports, so a viewport-multiple is less scroll
        //          than it sounds. Desktop (fine pointer) is untouched.
        const isCoarse =
          typeof window !== "undefined" &&
          window.matchMedia("(pointer: coarse)").matches;
        const endVh = isCoarse ? 2.9 : OLD_END_VH;
        // ── Short-viewport floor (the OTHER half of "it's fast on a Mac") ────
        // The pin's length is a multiple of innerHeight, so the shorter the
        // viewport the FEWER scroll pixels the same beats get. A 13" MacBook
        // browser is ~750-800 CSS px once the menu bar, notch inset and browser
        // chrome are gone; a maximised 1080p Windows window is ~940-950. That
        // alone compresses the whole hero journey by ~20% on the Mac — and it
        // compounds with the wheel-delta difference handled in
        // SmoothScrollProvider. Floor the height the pin maths uses so a short
        // screen still gets a full-length ride.
        // TWO deliberate limits:
        //  • FLOOR ONLY — taller viewports are untouched, so Windows and
        //    large-display pacing is byte-identical to before.
        //  • FINE POINTERS ONLY — phone viewports are short by nature, and the
        //    touch travel above was tuned by hand on a real device (2.35→2.12
        //    after a harder trim went hair-trigger). Applying a desktop-sized
        //    floor there would silently undo that tuning.
        const PIN_VH_FLOOR = 900;
        const pinVh = () =>
          isCoarse ? window.innerHeight : Math.max(window.innerHeight, PIN_VH_FLOOR);
        const unitPx = () => (pinVh() * endVh) / OLD_UNITS;

        // ── Escalator snap: every "full reveal" the pinned timeline holds on —
        // each phrase fully risen (p1/p2/p3hold labels) plus every works-beat
        // rest (formed window / clean tunnel, from addWorksBeats' snapSpans),
        // as sorted, de-duped progress (0..1) values. The pin's directional
        // snap below rides these like an escalator: settle in a blank
        // mid-transition and it glides to the next rest in the direction you
        // were dragging — both ways. Because the tunnel AND the phrases read
        // from this same scroll position, they move together, as if the reader
        // dragged the scrollbar by hand.
        const dur = scrub.duration();
        const L = scrub.labels as Record<string, number>;
        const rests = Array.from(
          new Set(
            [L.p1hold ?? 0, L.p2hold, L.p3hold, ...snapSpans.map((s) => s.rest)]
              .filter((t): t is number => typeof t === "number")
              .map((t) => t / dur),
          ),
        ).sort((a, b) => a - b);
        // The model lives in lib/escalatorSnap.ts — shared with /about's pin so
        // both scrolly-telling rides feel identical. Summary: direction comes
        // from the WHEEL/KEY/TOUCH EVENT, not from how far the scroll position
        // travelled, and there is no threshold anywhere in the decision. Read
        // that file's header before changing this — position-based direction
        // was tried three times and always had a branch that scrolled the
        // reader backwards against their own gesture.
        const escalator = createEscalatorSnap({ getRests: () => rests });

        // Desktop (Lenis running) gets the DRIVE — the wheel event itself
        // starts the ride, on the same frame, with no waiting and no drift to
        // correct afterwards. Touch keeps ScrollTrigger's snap: there is no
        // Lenis instance there to drive, and native momentum owns the scroll.
        // This whole block is already inside the no-preference matchMedia, so
        // "not coarse" is the same as "smooth scroll is running".
        const smooth = !isCoarse;
        let pinST: ScrollTrigger | null = null;

        pinST = ScrollTrigger.create({
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
          // ESCALATOR — the reader can never settle in a blank mid-transition.
          // Wherever a drag stops, glide to a full reveal (phrase risen, or a
          // works beat formed / clean tunnel — every rest in `rests`), in the
          // direction they ASKED for. TOUCH ONLY — on desktop the drive below
          // owns this, and two systems moving the scroll would fight.
          snap: smooth ? undefined : escalator,
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

        const stopDrive = smooth
          ? createEscalatorDrive({
              getRests: () => rests,
              getTrigger: () => pinST,
            })
          : null;

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
          stopDrive?.();
          window.removeEventListener(LOADER_DONE_EVENT, revealOnce);
          window.removeEventListener(LOADER_DONE_EVENT, goWorks);
          window.clearInterval(revealPoll);
          window.clearTimeout(revealCeiling);
          cancelAnimationFrame(revealRaf1);
          cancelAnimationFrame(revealRaf2);
          // ⚠️ ALWAYS force-show on teardown — do NOT gate this on `revealed`.
          // `revealed` is now pre-set to true when the loader had already handed
          // off (see `introPending`), so gating here meant a matchMedia re-run
          // could tear down WITHOUT restoring, and the fresh run would re-hide
          // the text. `matchMedia` callbacks re-run whenever the query
          // re-evaluates (PROJECT_LOG §6) — a resize is enough. forceShow() is
          // an idempotent snap to the visible state, so running it
          // unconditionally is always safe and never leaves text stranded.
          forceShow();
          gsap.ticker.remove(tick);
          curveCleanups.forEach((fn) => fn());
        };
      });

      // tear down the ?herodebug panel with the effect
      return () => {
        if (dbgTimer) window.clearInterval(dbgTimer);
        dbg?.remove();
      };
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
