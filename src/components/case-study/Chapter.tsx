"use client";

import { useRef } from "react";
import type { ReactNode } from "react";
import { gsap, useGSAP, ScrollTrigger } from "@/lib/gsap";

/* ============================================================================
   CHAPTER TRANSITION — a scroll-scrubbed "chapter card" for a case-study
   section. As you scroll toward the chapter, its Tanker name flashes up to
   FILL the viewport (pinned, centered), then disappears as you continue; the
   chapter's content elements then spawn in, scrubbed to scroll. Everything is
   mapped to scroll position, so scrolling back UP replays the flash in reverse.

   A chapter can contain ADDITIONAL flash panels in its content stream (e.g. a
   full-viewport pull-quote that plays then clears as the next block appears) —
   every [data-flash-runway] gets the same pinned scrub treatment.
   ============================================================================ */

/** One pinned full-viewport flash: `content` holds on an empty screen while you
 *  scroll its runway, fading + scaling in then out. Use for chapter titles and
 *  in-chapter quote flashes alike.
 *
 *  The flash sits on an OPAQUE page-colored backdrop at a high z-index, so while
 *  it holds nothing behind or after it can ghost through; the backdrop fades
 *  with the flash so the content underneath is revealed cleanly. */
export function FlashPanel({ children }: { children: ReactNode }) {
  return (
    <div
      data-flash-runway
      className="relative flex h-screen w-full items-center justify-center overflow-hidden"
    >
      {/* opaque FIXED backdrop — while the flash holds it covers the WHOLE
          viewport (not just this runway box), so neither the previous chapter's
          trailing content nor the next chapter's leading content can ever show
          through or ghost. Toggled solid only while the flash pin is active. */}
      <div
        data-flash-bg
        aria-hidden
        className="pointer-events-none fixed inset-0 z-[40] bg-bg"
        style={{ opacity: 0, visibility: "hidden" }}
      />
      <div
        data-flash
        aria-hidden
        className="pointer-events-none relative z-[41] flex items-center justify-center px-6"
      >
        {children}
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

        // ── Every flash panel (title + any in-chapter quote flash) is pinned
        // and reserves its own scroll length, so it holds centered on an empty
        // screen while scrubbing, then clears before the next block. ──
        const runways = gsap.utils.toArray<HTMLElement>(
          el.querySelectorAll("[data-flash-runway]"),
        );
        runways.forEach((runway) => {
          const flash = runway.querySelector<HTMLElement>("[data-flash]");
          const bg = runway.querySelector<HTMLElement>("[data-flash-bg]");
          if (!flash) return;
          gsap.set(flash, { autoAlpha: 0, scale: 0.9 });
          // backdrop is opaque for the WHOLE pin (set once, on enter/leave via
          // toggle) so nothing behind the pinned flash can ever ghost through;
          // only the flash text itself fades in/out.
          if (bg) gsap.set(bg, { autoAlpha: 0 });
          gsap
            .timeline({
              scrollTrigger: {
                trigger: runway,
                start: "top top",
                end: "+=110%",
                scrub: true,
                pin: runway,
                anticipatePin: 1,
                // hard on/off for the opaque backdrop at the pin edges — it is
                // fully solid the entire time the flash scene owns the viewport.
                onToggle: (self) => {
                  if (bg) gsap.set(bg, { autoAlpha: self.isActive ? 1 : 0 });
                },
              },
            })
            .to(flash, { autoAlpha: 1, scale: 1, ease: "power1.out", duration: 0.42 }, 0)
            .to(flash, { autoAlpha: 1, duration: 0.16 })
            .to(flash, {
              autoAlpha: 0,
              scale: 1.08,
              yPercent: -6,
              ease: "power1.in",
              duration: 0.42,
            });
        });

        // ── Content elements spawn in, each scrubbed as it arrives ──
        gsap.utils
          .toArray<HTMLElement>(el.querySelectorAll("[data-spawn]"))
          .forEach((node) => {
            gsap.fromTo(
              node,
              { autoAlpha: 0, y: 48 },
              {
                autoAlpha: 1,
                y: 0,
                ease: "none",
                scrollTrigger: {
                  trigger: node,
                  start: "top 92%",
                  end: "top 62%",
                  scrub: true,
                },
              },
            );
          });
      });

      // Reduced motion: everything visible, no flash panels.
      mm.add("(prefers-reduced-motion: reduce)", () => {
        const el = root.current;
        if (!el) return;
        gsap.set(el.querySelectorAll("[data-spawn]"), { autoAlpha: 1, y: 0 });
        gsap.set(el.querySelectorAll("[data-flash]"), { autoAlpha: 0 });
        // collapse the runway spacers so reduced-motion users don't scroll empty screens
        gsap.set(el.querySelectorAll("[data-flash-runway]"), { height: 0 });
      });
    },
    { scope: root },
  );

  return (
    <section ref={root} id={id} data-section className="scroll-mt-28">
      {/* lead-in — lets the previous chapter's last element scroll fully out
          before the title flash pins, so they don't share the screen */}
      <div className="h-[55vh]" aria-hidden />

      {/* chapter title flash */}
      <FlashPanel>
        <span className="display text-center text-[clamp(3.5rem,3rem+9vw,11rem)] uppercase leading-none text-accent">
          {title}
        </span>
      </FlashPanel>

      {/* gap so the title flash fully clears before content spawns — prevents
          the big title ghosting behind the first blocks */}
      <div className="h-[30vh]" aria-hidden />

      {/* chapter content — flash panels + spawned blocks */}
      <div>{children}</div>

      {/* trailing gap — the chapter's last content scrolls fully out before the
          NEXT chapter's lead-in + title flash, so sections never overlap */}
      <div className="h-[45vh]" aria-hidden />
    </section>
  );
}

/** Wrap a chapter element so it spawns in (scrubbed) as it scrolls into view. */
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
