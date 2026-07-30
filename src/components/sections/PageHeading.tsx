"use client";

import { useRef } from "react";
import { gsap, useGSAP, ease } from "@/lib/gsap";

/**
 * PageHeading — the full-viewport title lockup that opens /work and /play
 * (the user's Figma slides 34 + 36): a huge Tanker word centred in the particle
 * field with a thin subtitle beneath it.
 *
 * It owns a whole viewport on purpose. The field is flying toward the camera
 * behind it, so this first screen is the "you are inside something" beat before
 * any content arrives — the same pause the case studies use between chapters.
 *
 * Motion: letters rise out of a mask on load, then the whole lockup drifts up
 * and dissolves as you scroll past it, handing the stage to the cards.
 */
export function PageHeading({
  title,
  subtitle,
}: {
  title: string;
  subtitle?: string;
}) {
  const root = useRef<HTMLDivElement>(null);

  useGSAP(
    () => {
      const mm = gsap.matchMedia();
      mm.add("(prefers-reduced-motion: no-preference)", () => {
        const lockup = root.current?.querySelector("[data-lockup]");
        const word = root.current?.querySelector("[data-word]");
        const sub = root.current?.querySelector("[data-sub]");
        if (!word || !lockup) return;

        // entrance — rises out of its mask as the field ignites behind it
        const tl = gsap.timeline({ delay: 0.15 });
        tl.fromTo(
          word,
          { yPercent: 118 },
          { yPercent: 0, duration: 1.15, ease: ease.expo },
        );
        if (sub) {
          tl.fromTo(
            sub,
            { autoAlpha: 0, y: 14 },
            {
              autoAlpha: 1,
              y: 0,
              duration: 0.7,
              ease: "power2.out",
              // Hand the subtitle back to the stylesheet once it has arrived.
              // The departure fades the WRAPPER, so any leftover inline
              // opacity/visibility here would be a second, independent layer:
              // an entrance interrupted mid-flight could strand `sub` at
              // visibility:hidden, and no amount of parent fading brings a
              // hidden child back. Clearing means the wrapper's opacity is the
              // only thing controlling visibility from here on.
              clearProps: "opacity,visibility,transform",
            },
            "-=0.55",
          );
        }

        // departure — the lockup lifts + fades as the reader scrolls into the
        // cards, so the title never fights the first plate for attention.
        //
        // ONE target (the wrapper), not [word, sub]. Tweening the two children
        // as an array moved them independently: `yPercent` resolves against
        // each element's OWN height, and the word (14vw) is many times taller
        // than the subtitle, so -38% pushed them different pixel distances and
        // the lockup visibly came apart mid-scrub. Animating the wrapper moves
        // both under a single transform, so they travel as one unit.
        //
        // fromTo + immediateRender:false (not a bare `.to()`): a `.to()` scrub
        // captures "whatever the value is right now" as its start state, and
        // the entrance is still mid-flight (delay 0.15 + overlap) when this
        // runs — so the captured start was nondeterministic. Explicit start
        // values make the scrub reversible and identical every pass, which is
        // what lets it come back cleanly on scroll-up.
        gsap.fromTo(
          lockup,
          { yPercent: 0, autoAlpha: 1 },
          {
            yPercent: -38,
            autoAlpha: 0,
            ease: "none",
            immediateRender: false,
            scrollTrigger: {
              trigger: root.current,
              start: "top top",
              end: "bottom top",
              scrub: 0.5,
            },
          },
        );
      });
    },
    { scope: root },
  );

  return (
    <section
      ref={root}
      className="relative flex min-h-svh flex-col items-center justify-center px-[var(--gutter)] text-center"
    >
      {/* The scroll departure animates THIS wrapper, so the word and the
          subtitle leave and return as one locked unit. The entrance still
          animates the children individually (staggered reveal), which is fine
          — that's a one-shot, and it finishes before the wrapper is touched. */}
      <div data-lockup className="flex flex-col items-center">
        {/* overflow-hidden is the entrance mask the word rises out of. It has
            to stay INSIDE the wrapper: if the wrapper were the masked element,
            it would clip the lockup during the departure lift. */}
        <h1 className="overflow-hidden leading-[0.9]">
          <span
            data-word
            className="block text-[clamp(3.5rem,14vw,11rem)] uppercase tracking-[0.005em] text-fg"
            style={{ fontFamily: "var(--font-display-tanker)" }}
          >
            {title}
          </span>
        </h1>
        {subtitle ? (
          <p
            data-sub
            className="mt-5 max-w-[46ch] text-[clamp(0.85rem,0.75rem+0.35vw,1.05rem)] font-medium text-fg/60"
          >
            {subtitle}
          </p>
        ) : null}
      </div>
    </section>
  );
}
