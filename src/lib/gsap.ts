/**
 * Central GSAP setup — the single place plugins are registered and where the
 * animation tokens live. Mirrors the CSS custom properties in globals.css so
 * GSAP tweens use the exact same easings/durations as CSS transitions.
 * Retheme by editing globals.css :root and keeping these values in sync.
 *
 * Import `gsap` and `ScrollTrigger` from here (not directly from "gsap") so the
 * plugins are guaranteed registered. All GSAP calls must run on the client
 * (inside useGSAP / useEffect) — never during SSR.
 */
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { SplitText } from "gsap/SplitText";
import { useGSAP } from "@gsap/react";

// Register once. Safe to call repeatedly; GSAP de-dupes.
gsap.registerPlugin(ScrollTrigger, SplitText, useGSAP);

// Mobile browsers collapse/expand the address bar while scrolling, firing
// resize events mid-scroll. Re-measuring the pinned hero/chapter triggers on
// every one of those causes visible jumps — only refresh on orientation-class
// resizes instead (ScrollTrigger's documented mobile guidance).
ScrollTrigger.config({ ignoreMobileResize: true });

// DEV ONLY: expose the configured instances for debugging from the console or a
// CDP probe (e.g. checking whether a `gsap.set` park is idempotent, or dumping
// ScrollTrigger.getAll() when a pin misbehaves). Never ships to production.
if (process.env.NODE_ENV !== "production" && typeof window !== "undefined") {
  const w = window as unknown as Record<string, unknown>;
  w.gsap = gsap;
  w.ScrollTrigger = ScrollTrigger;
}

// Durations in seconds (CSS tokens are in ms).
export const duration = {
  fast: 0.18,
  base: 0.32,
  slow: 0.6,
} as const;

// GSAP ease strings. `power2.out` ≈ the emphasized cubic-bezier; `power1.out`
// ≈ the standard one. GSAP's named eases are cheaper than CustomEase and read
// well, so we use them as the token layer.
export const ease = {
  standard: "power1.out",
  emphasized: "power2.out",
  emphasizedInOut: "power2.inOut",
  /** For long scroll-linked reveals. */
  expo: "expo.out",
} as const;

// Project-wide GSAP defaults so every tween inherits the token ease/duration.
gsap.defaults({ ease: ease.emphasized, duration: duration.base });

export { gsap, ScrollTrigger, SplitText, useGSAP };
