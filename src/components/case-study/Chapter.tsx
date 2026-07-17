"use client";

import { useRef } from "react";
import type { ReactNode } from "react";
import { gsap, useGSAP, ScrollTrigger } from "@/lib/gsap";

/* ============================================================================
   CHAPTER TRANSITION — viewport-driven, zero dead scroll.

   Each chapter head (and any in-chapter quote flash) is a REAL full-viewport
   panel in normal document flow: the title owns one screen of the canvas and
   scrolls with it like any other content. When the panel enters the viewport,
   its reveal plays itself (a one-shot animation, not scrubbed and not pinned);
   scrolling on simply carries the panel away with the canvas.

   Why no pins/fixed layers: pinning inserts spacer scroll the reader must
   cross after the scene has already peaked, and fixed overlays fight the
   natural canvas (clipped titles, black holes between scenes). In-flow panels
   make dead scrolling structurally impossible — every pixel of travel moves
   real content — while the enter-triggered timeline keeps the cinematic
   reveal. Scrolling back up above a panel reverses it, so the reveal replays
   on the way back down.
   ============================================================================ */

/* ── PACING DIALS ─────────────────────────────────────────────────────────── */
// Where in the viewport a panel's reveal fires: when the panel's top crosses
// this line, the title plays. Lower % = fires later (panel more fully on
// screen); higher % = earlier.
const FLASH_START = "top 55%";
// Small breathing gaps between a chapter's pieces. The flash panel itself is
// the separator between chapters now, so these stay minimal.
const POST_FLASH = "h-[8vh]"; // after the title panel, before content
const TRAILING = "h-[10vh]"; // after the chapter's content

/** One full-viewport flash panel: a real in-flow screen of canvas holding the
 *  chapter title (or an in-chapter quote) centered. Its reveal self-plays when
 *  the panel scrolls into view; it scrolls off naturally with the page. */
export function FlashPanel({ children }: { children: ReactNode }) {
  return (
    <div
      data-flash-panel
      className="relative flex h-svh w-full items-center justify-center overflow-hidden px-6"
    >
      {/* two wrappers so the two animations never fight over one element:
          [data-flash-exit] carries the scrubbed departure (outer), [data-flash]
          carries the one-shot entrance (inner). Opacities multiply cleanly. */}
      <div data-flash-exit className="flex items-center justify-center">
        <div data-flash className="flex items-center justify-center text-center">
          {children}
        </div>
      </div>
    </div>
  );
}

export function Chapter({
  id,
  title,
  children,
}: {
  id: string;
  title: string;
  children: ReactNode;
}) {
  const root = useRef<HTMLElement>(null);

  useGSAP(
    () => {
      const mm = gsap.matchMedia();

      mm.add("(prefers-reduced-motion: no-preference)", () => {
        const el = root.current;
        if (!el) return;

        // ── Flash panels: the reveal plays itself once the panel enters the
        // viewport. No pin, no scrub — the panel is ordinary content, so the
        // canvas keeps moving with the scroll while the title animates. ──
        gsap.utils
          .toArray<HTMLElement>(el.querySelectorAll("[data-flash-panel]"))
          .forEach((panel) => {
            const flash = panel.querySelector<HTMLElement>("[data-flash]");
            const exit = panel.querySelector<HTMLElement>("[data-flash-exit]");
            if (!flash) return;
            // ENTRANCE — one-shot, plays itself when the panel comes into view.
            gsap.fromTo(
              flash,
              { autoAlpha: 0, scale: 0.9, yPercent: 10 },
              {
                autoAlpha: 1,
                scale: 1,
                yPercent: 0,
                duration: 0.8,
                ease: "power3.out",
                scrollTrigger: {
                  trigger: panel,
                  start: FLASH_START,
                  // onEnter / onLeave / onEnterBack / onLeaveBack — reverse
                  // only when leaving backwards, so re-entering replays it.
                  toggleActions: "play none none reverse",
                },
              },
            );
            // DEPARTURE — scrubbed to the panel scrolling out the top: the
            // title lifts, scales and dissolves in lockstep with the canvas.
            // Scrub here costs no dead scroll — it rides travel the reader is
            // already making — and it auto-reverses when scrolling back down.
            if (exit) {
              gsap.fromTo(
                exit,
                { autoAlpha: 1, yPercent: 0, scale: 1 },
                {
                  autoAlpha: 0,
                  yPercent: -30,
                  scale: 1.08,
                  ease: "none",
                  scrollTrigger: {
                    trigger: panel,
                    start: "top top",
                    end: "center top",
                    scrub: true,
                  },
                },
              );
            }
          });

        // ── Content elements spawn in — each plays itself once it crosses the
        // threshold, so a block completes its entrance without the reader
        // having to keep scrolling to drive it. ──
        gsap.utils
          .toArray<HTMLElement>(el.querySelectorAll("[data-spawn]"))
          .forEach((node) => {
            gsap.fromTo(
              node,
              { autoAlpha: 0, y: 48 },
              {
                autoAlpha: 1,
                y: 0,
                ease: "power2.out",
                duration: 0.7,
                scrollTrigger: {
                  trigger: node,
                  start: "top 85%",
                  toggleActions: "play none none reverse",
                },
              },
            );
          });
      });

      // Reduced motion: the title panel is real content now (not an overlay),
      // so it must stay VISIBLE — hiding it would leave a blank screen.
      mm.add("(prefers-reduced-motion: reduce)", () => {
        const el = root.current;
        if (!el) return;
        gsap.set(el.querySelectorAll("[data-spawn]"), { autoAlpha: 1, y: 0 });
        gsap.set(el.querySelectorAll("[data-flash]"), { autoAlpha: 1 });
      });
    },
    { scope: root },
  );

  return (
    <section ref={root} id={id} data-section className="scroll-mt-28">
      {/* chapter title panel — a full viewport of real canvas; doubles as the
          breathing room between this chapter and the previous one */}
      <FlashPanel>
        {/* phone floor lowered (2.75rem) + a steeper vw ramp so long titles
            ("DESIGN DECISIONS") fit a 390px viewport — desktop size unchanged */}
        <span className="display text-center text-[clamp(2.75rem,1rem+11vw,11rem)] uppercase leading-none text-accent">
          {title}
        </span>
      </FlashPanel>

      {/* small gap so the title isn't kissing the first content block */}
      <div className={POST_FLASH} aria-hidden />

      {/* chapter content — flash panels + spawned blocks */}
      <div>{children}</div>

      {/* trailing gap before the next chapter's title panel */}
      <div className={TRAILING} aria-hidden />
    </section>
  );
}

/** Wrap a chapter element so it spawns in (self-playing) as it enters view. */
export function Spawn({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <div data-spawn className={className}>
      {children}
    </div>
  );
}

export { ScrollTrigger };
