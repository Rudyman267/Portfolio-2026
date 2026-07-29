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
        const word = root.current?.querySelector("[data-word]");
        const sub = root.current?.querySelector("[data-sub]");
        if (!word) return;

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
            { autoAlpha: 1, y: 0, duration: 0.7, ease: "power2.out" },
            "-=0.55",
          );
        }

        // departure — lifts + fades as the reader scrolls into the cards, so
        // the title never fights the first plate for attention
        gsap.to([word, sub].filter(Boolean), {
          yPercent: -38,
          autoAlpha: 0,
          ease: "none",
          scrollTrigger: {
            trigger: root.current,
            start: "top top",
            end: "bottom top",
            scrub: 0.5,
          },
        });
      });
    },
    { scope: root },
  );

  return (
    <section
      ref={root}
      className="relative flex min-h-svh flex-col items-center justify-center px-[var(--gutter)] text-center"
    >
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
    </section>
  );
}
