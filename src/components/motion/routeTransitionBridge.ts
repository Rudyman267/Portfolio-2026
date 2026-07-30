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
 * Was THIS page load caused by an in-app navigation?
 *
 * ⚠️ WHY THIS IS NOT JUST `sessionStorage.getItem(NAV_FLAG)`.
 * The flag is one-shot: the first reader consumes it so a later manual refresh
 * counts as a cold visit again. But the Loader can be MOUNTED MORE THAN ONCE in
 * a single page load (React StrictMode in dev, and any remount in prod), and a
 * `useRef` guard cannot survive a remount — it is recreated with it. The second
 * mount therefore read `null` and concluded "cold visit", which put the SOUND
 * GATE over the home page when the reader clicked "Rudyman" from inside the
 * site. Traced directly:
 *     GET rt:nav -> 1 ... REMOVE rt:nav ... GET rt:nav -> null
 *
 * So the answer is latched on `window` — one decision per document, survives any
 * number of remounts, and dies with the page exactly as a one-shot should.
 */
const NAV_LATCH = "__rtNavLoad";

export function isNavLoad(): boolean {
  if (typeof window === "undefined") return false;
  const w = window as unknown as Record<string, unknown>;
  if (typeof w[NAV_LATCH] === "boolean") return w[NAV_LATCH] as boolean;
  let flagged = false;
  try {
    flagged = sessionStorage.getItem(NAV_FLAG) === "1";
    if (flagged) sessionStorage.removeItem(NAV_FLAG);
  } catch {
    flagged = false;
  }
  w[NAV_LATCH] = flagged;
  return flagged;
}

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
  // Carry debug flags across the navigation. Every page change here is a REAL
  // page load, so a `?herodebug` on the current URL would otherwise be dropped
  // the moment you click a link — which makes the readout useless for
  // diagnosing anything that only happens when ARRIVING at a page.
  let target = href;
  try {
    const here = new URLSearchParams(window.location.search);
    const keep = ["herodebug"].filter((k) => here.has(k));
    if (keep.length) {
      const u = new URL(href, window.location.origin);
      keep.forEach((k) => u.searchParams.set(k, here.get(k) ?? ""));
      target = u.pathname + u.search + u.hash;
    }
  } catch {
    /* malformed href — fall through with the original */
  }
  window.location.assign(target);
}
