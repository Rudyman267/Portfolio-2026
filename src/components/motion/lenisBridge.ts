import type Lenis from "lenis";

/**
 * Module-level handle to the live Lenis instance (set by SmoothScrollProvider).
 * Lets distant components (e.g. the footer's back-to-top) drive a proper
 * smooth glide instead of fighting Lenis with native scrollTo. Null when
 * smooth scroll is disabled (reduced motion / touch) — callers must fall back.
 */
export const lenisRef: { current: Lenis | null } = { current: null };

/** Smooth-scroll to the top via Lenis, falling back to native scroll. */
export function scrollToTop() {
  if (lenisRef.current) {
    lenisRef.current.scrollTo(0, { duration: 1.4 });
  } else {
    window.scrollTo({ top: 0, behavior: "smooth" });
  }
}
