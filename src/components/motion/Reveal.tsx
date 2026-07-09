"use client";

import { useRef } from "react";
import type { ReactNode } from "react";
import { gsap, useGSAP, ease } from "@/lib/gsap";

type RevealProps = {
  children: ReactNode;
  /** Delay before the reveal starts, in seconds. */
  delay?: number;
  className?: string;
  /** Replay each time it re-enters the viewport (default: once). */
  once?: boolean;
  /** Vertical offset the element rises from, in px. */
  y?: number;
};

/**
 * Fades + rises children when scrolled into view (ScrollTrigger).
 * Reduced-motion users get the content with no transform, via matchMedia.
 */
export function Reveal({
  children,
  delay = 0,
  className,
  once = true,
  y = 24,
}: RevealProps) {
  const ref = useRef<HTMLDivElement>(null);

  useGSAP(
    () => {
      const mm = gsap.matchMedia();

      mm.add("(prefers-reduced-motion: no-preference)", () => {
        gsap.set(ref.current, { opacity: 0, y });
        gsap.to(ref.current, {
          opacity: 1,
          y: 0,
          duration: 0.7,
          delay,
          ease: ease.expo,
          scrollTrigger: {
            trigger: ref.current,
            start: "top 85%",
            toggleActions: once
              ? "play none none none"
              : "play none none reverse",
          },
        });
      });

      // Reduced motion: ensure fully visible (no set() means it stays as-is).
      mm.add("(prefers-reduced-motion: reduce)", () => {
        gsap.set(ref.current, { opacity: 1, y: 0 });
      });
    },
    { scope: ref },
  );

  return (
    <div ref={ref} className={className}>
      {children}
    </div>
  );
}
