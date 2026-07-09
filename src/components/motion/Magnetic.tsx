"use client";

import { useRef } from "react";
import type { ReactNode } from "react";
import { gsap, useGSAP } from "@/lib/gsap";

type MagneticProps = {
  children: ReactNode;
  className?: string;
  /** How strongly the element follows the cursor (0–1). */
  strength?: number;
};

/**
 * Magnetic hover — the wrapped element eases toward the cursor while hovered
 * and springs back on leave. A staple micro-interaction of high-craft sites.
 *
 * Event handlers are wrapped in contextSafe so the tweens they create are
 * tracked by the GSAP context and cleaned up on unmount. Skipped for
 * reduced-motion users and on coarse pointers (touch), where there's no cursor.
 */
export function Magnetic({
  children,
  className,
  strength = 0.4,
}: MagneticProps) {
  const ref = useRef<HTMLSpanElement>(null);

  useGSAP(
    (_context, contextSafe) => {
      const el = ref.current;
      if (!el || !contextSafe) return;

      const prefersReduced = window.matchMedia(
        "(prefers-reduced-motion: reduce)",
      ).matches;
      const isTouch = window.matchMedia("(pointer: coarse)").matches;
      if (prefersReduced || isTouch) return;

      const onMove = contextSafe((e: PointerEvent) => {
        const rect = el.getBoundingClientRect();
        const x = e.clientX - (rect.left + rect.width / 2);
        const y = e.clientY - (rect.top + rect.height / 2);
        gsap.to(el, {
          x: x * strength,
          y: y * strength,
          duration: 0.5,
          ease: "power3.out",
        });
      });

      const onLeave = contextSafe(() => {
        gsap.to(el, { x: 0, y: 0, duration: 0.6, ease: "elastic.out(1, 0.4)" });
      });

      el.addEventListener("pointermove", onMove);
      el.addEventListener("pointerleave", onLeave);

      return () => {
        el.removeEventListener("pointermove", onMove);
        el.removeEventListener("pointerleave", onLeave);
      };
    },
    { scope: ref, dependencies: [strength] },
  );

  return (
    <span ref={ref} className={className} style={{ display: "inline-block" }}>
      {children}
    </span>
  );
}
