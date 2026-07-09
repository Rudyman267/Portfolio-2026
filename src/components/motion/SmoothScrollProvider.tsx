"use client";

import { useEffect } from "react";
import type { ReactNode } from "react";
import Lenis from "lenis";
import { gsap, ScrollTrigger } from "@/lib/gsap";
import { lenisRef } from "@/components/motion/lenisBridge";

/**
 * Inertial smooth scroll (Lenis) synced to GSAP's ticker and ScrollTrigger.
 * This is the "premium glide" the reference sites share. Driving Lenis from the
 * GSAP ticker (instead of its own rAF) keeps scroll-linked animations perfectly
 * in step with the scroll position.
 *
 * Respects prefers-reduced-motion: users who opt out get native scroll and no
 * inertia. Also disabled on touch devices where native momentum already feels
 * right and Lenis can fight the browser.
 */
export function SmoothScrollProvider({ children }: { children: ReactNode }) {
  useEffect(() => {
    // Always start at the top of the hero on (re)load. Browsers restore the
    // previous scroll position by default, which lands mid-page and desyncs the
    // pinned ScrollTriggers (the "loads from the middle" bug). Opt out and
    // force the top before anything measures.
    if ("scrollRestoration" in history) {
      history.scrollRestoration = "manual";
    }
    window.scrollTo(0, 0);

    const prefersReduced = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches;
    const isTouch = window.matchMedia("(pointer: coarse)").matches;

    if (prefersReduced || isTouch) {
      // No smooth scroll — but ScrollTrigger still needs a refresh once fonts/
      // images settle so reveal triggers land in the right spot.
      ScrollTrigger.refresh();
      return;
    }

    const lenis = new Lenis({
      duration: 1.1,
      // easeOutExpo — matches the long, settling glide of the references.
      easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
      smoothWheel: true,
    });
    lenisRef.current = lenis;

    // Keep ScrollTrigger in sync on every Lenis frame.
    lenis.on("scroll", ScrollTrigger.update);

    // Drive Lenis from GSAP's ticker (single rAF loop for the whole app).
    const raf = (time: number) => lenis.raf(time * 1000);
    gsap.ticker.add(raf);
    gsap.ticker.lagSmoothing(0);

    ScrollTrigger.refresh();

    return () => {
      gsap.ticker.remove(raf);
      lenisRef.current = null;
      lenis.destroy();
    };
  }, []);

  return <>{children}</>;
}
