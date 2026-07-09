"use client";

import { useRef } from "react";
import type { ReactNode } from "react";
import { gsap, useGSAP, ease } from "@/lib/gsap";

/**
 * Mounts children with a fade + upward rise immediately on load (not scroll-
 * driven). Use for above-the-fold content. Reduced motion → instant, no offset.
 */
export function FadeIn({
  children,
  delay = 0,
  className,
}: {
  children: ReactNode;
  delay?: number;
  className?: string;
}) {
  const ref = useRef<HTMLDivElement>(null);

  useGSAP(
    () => {
      const mm = gsap.matchMedia();
      mm.add("(prefers-reduced-motion: no-preference)", () => {
        gsap.from(ref.current, {
          opacity: 0,
          y: 16,
          duration: 0.6,
          delay,
          ease: ease.emphasized,
        });
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

/**
 * Staggered container — animates its <FadeInItem> children in sequence on mount.
 * Children are selected by the `data-fade-item` attribute FadeInItem sets.
 */
export function FadeInStagger({
  children,
  className,
  stagger = 0.08,
  delayChildren = 0,
}: {
  children: ReactNode;
  className?: string;
  stagger?: number;
  delayChildren?: number;
}) {
  const ref = useRef<HTMLDivElement>(null);

  useGSAP(
    () => {
      const mm = gsap.matchMedia();
      mm.add("(prefers-reduced-motion: no-preference)", () => {
        const items = ref.current?.querySelectorAll("[data-fade-item]");
        if (!items?.length) return;
        gsap.from(items, {
          opacity: 0,
          y: 16,
          duration: 0.5,
          delay: delayChildren,
          stagger,
          ease: ease.emphasized,
        });
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

/** A single staggered child. Place inside <FadeInStagger>. */
export function FadeInItem({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <div data-fade-item className={className}>
      {children}
    </div>
  );
}
