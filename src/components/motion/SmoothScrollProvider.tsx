"use client";

import { useEffect, useRef } from "react";
import type { ReactNode } from "react";
import { usePathname } from "next/navigation";
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
  const pathname = usePathname();
  const firstNav = useRef(true);

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

    // ── macOS wheel normalisation — why the site felt FAST on a Mac ──────────
    // Lenis runs in duration mode: every wheel event does `target += deltaY`
    // and it eases toward that target. So the distance a gesture covers is
    // exactly the total deltaY the OS hands us — and the two platforms hand us
    // very different amounts for the same physical gesture:
    //   • Windows — a mouse-wheel notch is a fixed ~100px, and a precision
    //     trackpad reports the raw finger travel. A comfortable gesture is a
    //     few hundred px, delivered as a handful of events.
    //   • macOS — the OS applies its OWN acceleration curve to trackpad and
    //     Magic Mouse input AND appends a momentum tail after the fingers
    //     lift, streamed at 120Hz. The same gesture arrives as roughly 2-3x
    //     the deltaY.
    // Nothing in the app compensated, so every scroll-linked pin (the home
    // hero, /about) raced on a Mac while feeling right on Windows. Scaling the
    // wheel down there brings a gesture back to comparable travel on both.
    // This is the ONE knob for it — raise toward 1 if a Mac starts to feel
    // sluggish, lower if it still runs away. Trackpad AND wheel go through the
    // same multiplier because macOS accelerates both.
    const MAC_WHEEL_MULTIPLIER = 0.55;
    const platform =
      (navigator as Navigator & { userAgentData?: { platform?: string } })
        .userAgentData?.platform ??
      navigator.platform ??
      "";
    // Note: iPadOS reports a Mac platform string, but touch devices never reach
    // here (the isTouch early-return above owns them), so this only ever
    // matches a real desktop Mac.
    const isApple = /mac/i.test(platform) || /Mac OS X/.test(navigator.userAgent);

    const lenis = new Lenis({
      duration: 1.1,
      // easeOutExpo — matches the long, settling glide of the references.
      easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
      smoothWheel: true,
      wheelMultiplier: isApple ? MAC_WHEEL_MULTIPLIER : 1,
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

  // Reset to the top of the page on EVERY client-side navigation. The provider
  // lives in the persistent (site) layout, so its setup effect above runs only
  // once — without this, a route change keeps the previous page's scroll offset,
  // which lands the new page's pinned ScrollTriggers mid-timeline (the "loads a
  // garbled mid-way frame" bug when clicking a nav link from deep in /about).
  // Skip the very first render (setup already forced the top) so we don't fight
  // the loader's own frame-zero handoff. Every nav link therefore opens its
  // target fresh, from the start. Jump both the Lenis virtual position and the
  // native scroll, then let the new page's triggers re-measure.
  useEffect(() => {
    if (typeof window === "undefined") return;
    // skip the very first render — the setup effect + loader already own the
    // initial frame-zero handoff; only re-fire on ACTUAL navigations.
    if (firstNav.current) {
      firstNav.current = false;
      return;
    }
    // If the pan-flip curtain is up (is-loading set by beginRouteTransition),
    // IT owns the ordered clean-slate reset (stop Lenis → rewind → refresh →
    // reveal → resume). Doing our own reset/refresh here would race it and
    // re-introduce the auto-scrub. Only handle curtain-LESS navs (e.g. a gallery
    // card → case study) as the safety net.
    if (document.body.classList.contains("is-loading")) return;
    // instant jump — Lenis owns scroll when active; fall back to native scroll
    if (lenisRef.current) {
      lenisRef.current.scrollTo(0, { immediate: true, force: true });
    }
    window.scrollTo(0, 0);
    // let layout settle (pin spacers, fonts) before triggers re-measure
    requestAnimationFrame(() => ScrollTrigger.refresh());
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pathname]);

  return <>{children}</>;
}
