"use client";

import { createElement, useRef } from "react";
import type { ElementType, ReactNode } from "react";
import { gsap, useGSAP, SplitText, ease } from "@/lib/gsap";

type SplitRevealProps = {
  children: ReactNode;
  className?: string;
  /** Render as h1/h2/p etc. Defaults to a div. */
  as?: ElementType;
  /** Delay before the reveal starts, in seconds. */
  delay?: number;
  /** Reveal on scroll into view instead of immediately on mount. */
  onScroll?: boolean;
  /** Per-line stagger, in seconds. */
  stagger?: number;
};

/**
 * Reveals text line-by-line from behind a mask — the signature heading motion
 * of the reference sites. Each line clips up into place with a slight stagger.
 *
 * Uses SplitText with mask + autoSplit so line breaks re-measure correctly when
 * fonts load or the element reflows. Reduced-motion users see plain text.
 * `aria: "auto"` keeps it readable to screen readers (label on parent, split
 * spans hidden).
 */
export function SplitReveal({
  children,
  className,
  as: Tag = "div",
  delay = 0,
  onScroll = false,
  stagger = 0.08,
}: SplitRevealProps) {
  const ref = useRef<HTMLElement>(null);

  useGSAP(
    () => {
      const mm = gsap.matchMedia();

      mm.add("(prefers-reduced-motion: no-preference)", () => {
        if (!ref.current) return;

        const split = SplitText.create(ref.current, {
          type: "lines",
          mask: "lines",
          linesClass: "split-line",
          autoSplit: true,
          aria: "auto",
          onSplit(self) {
            return gsap.from(self.lines, {
              yPercent: 120,
              duration: 0.9,
              delay,
              ease: ease.expo,
              stagger,
              scrollTrigger: onScroll
                ? {
                    trigger: ref.current,
                    start: "top 85%",
                    once: true,
                  }
                : undefined,
            });
          },
        });

        return () => split.revert();
      });
    },
    { scope: ref },
  );

  // createElement instead of <Tag> JSX: R3F's global JSX augmentation makes a
  // generic ElementType tag collapse its props to `never` (TS2745).
  return createElement(Tag, { ref, "data-split": "", className }, children);
}
