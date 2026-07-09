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
