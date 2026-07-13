/**
 * Cross-route navigation = a real (hard) page load.
 *
 * Client-side (SPA) navigation between the pinned pages was unfixably racy: the
 * persistent Lenis + ScrollTrigger carry the previous route's scroll/pin state,
 * and no ordering of reset/refresh reliably reproduced a clean load on every
 * machine (headless looked fine; real GPUs still auto-scrubbed the hero). A hard
 * load sidesteps all of it — fresh Lenis, fresh ScrollTrigger, the Loader runs —
 * so every page loads EXACTLY like a refresh, because it IS one.
 *
 * To keep the pan-flip feel without a "click to enter" gate on every nav, we set
 * a one-shot sessionStorage flag the Loader reads on the next load: when present,
 * the Loader auto-plays the pan and lifts itself (no counter hold, no click).
 * The very first cold visit (no flag) keeps the full click-to-enter experience.
 */

/** sessionStorage key: "this load was triggered by an in-app nav click". */
export const NAV_FLAG = "rt:nav";

/**
 * Navigate to `href` with a full page load (keeps the pan-flip feel via the
 * Loader's auto-play path). Call from a nav link's onClick and preventDefault
 * the default SPA <Link> navigation. No-ops server-side.
 */
export function hardNavigate(href: string) {
  if (typeof window === "undefined") return;
  try {
    sessionStorage.setItem(NAV_FLAG, "1");
  } catch {
    // sessionStorage can throw in private modes — the Loader just falls back to
    // its normal (click-to-enter) path, which is still correct.
  }
  window.location.assign(href);
}
