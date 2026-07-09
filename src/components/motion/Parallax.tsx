"use client";

import { useRef } from "react";
import type { ReactNode } from "react";
import { gsap, useGSAP } from "@/lib/gsap";

type ParallaxProps = {
  children: ReactNode;
  className?: string;
  /**
   * How far the element drifts across its scroll pass, as a fraction of its own
   * height. Positive = moves up (foreground feel); negative = moves down.
   * Keep subtle (0.1–0.3) for elegance.
   */
  speed?: number;
};

/**
 * Scroll-linked parallax drift. Ties a small y-translation to scroll progress
 * with scrub, so media/blocks glide relative to the page. Disabled for
 * reduced-motion users (renders static).
 */
export function Parallax({ children, className, speed = 0.15 }: ParallaxProps) {
  const ref = useRef<HTMLDivElement>(null);

  useGSAP(
    () => {
      const mm = gsap.matchMedia();
      mm.add("(prefers-reduced-motion: no-preference)", () => {
        gsap.fromTo(
          ref.current,
          { yPercent: speed * 50 },
          {
            yPercent: -speed * 50,
            ease: "none",
            scrollTrigger: {
              trigger: ref.current,
              start: "top bottom",
              end: "bottom top",
              scrub: true,
            },
          },
        );
      });
    },
    { scope: ref, dependencies: [speed] },
  );

  return (
    <div ref={ref} className={className}>
      {children}
    </div>
  );
}
