/**
 * scrollIntent — which way the reader ASKED to go, read straight off the input
 * device (wheel / trackpad / keys / touch), before any smoothing touches it.
 *
 * ── Why this exists ─────────────────────────────────────────────────────────
 * The pinned scrolly-telling sections (home Hero, /about) auto-glide the reader
 * from one composed reveal to the next. Deciding WHICH WAY to glide from the
 * scroll POSITION — "how far did they travel, and past what threshold" — is
 * wrong, and every variant of it we shipped had the same failure:
 *
 *   • fraction-of-segment threshold → a small nudge fell short and snapped
 *     BACK to the reveal you were leaving;
 *   • absolute-pixel threshold → same thing, just at a different distance;
 *   • sign of (position - anchor) → correct in principle, but the position it
 *     reads has been through Lenis' easing AND ScrollTrigger's scrub lag, so a
 *     short gesture can settle barely off the anchor and land under whatever
 *     threshold guards it.
 *
 * ANY threshold has a "below the line" branch, and that branch moves the page
 * in the opposite direction to the reader's gesture. That is the bug, not the
 * tuning of the number.
 *
 * The input event has no such ambiguity: `wheel` carries a signed `deltaY` the
 * instant the reader asks. One notch down is as unambiguous as ten. So the
 * escalator asks THIS module which way the reader wanted to go, and there is no
 * threshold anywhere in the decision.
 *
 * ── Consumption ─────────────────────────────────────────────────────────────
 * `take()` reads the intent AND clears it, so one gesture can only ever cause
 * one ride. This matters: ScrollTrigger's own snap tween moves the scroll
 * position, which Lenis reports as a scroll, which can re-fire the snap — and a
 * still-live "down" intent would ride again, and again. Clearing on read makes
 * that impossible by construction.
 */

/**
 * Intent older than this is treated as a previous gesture, not the current one.
 *
 * ⚠️ MUST comfortably exceed the delay between the reader's last wheel event and
 * ScrollTrigger actually calling snapTo, or a real gesture gets discarded and
 * the reader is left parked — which is the very bug this module exists to kill.
 * That delay is: Lenis' settle (`duration: 1.1s`) + the snap's own `delay`
 * (0.2s) ≈ 1.3s for a single Windows wheel notch, where there is no momentum
 * tail to keep refreshing the timestamp. 1.5s left only 200ms of margin; 4s is
 * generous slack while still far too short for a gesture from a minute ago to
 * drive a resize-triggered snap.
 *
 * This is a safety net rather than load-bearing logic: `take()` clears the
 * intent on read, so a consumed gesture can never fire twice regardless.
 */
const MAX_AGE_MS = 4000;

type Dir = 1 | -1;

let dir: Dir | null = null;
let at = 0;
let started = false;
let touchY = 0;

const now = () => (typeof performance !== "undefined" ? performance.now() : Date.now());

const set = (d: Dir) => {
  dir = d;
  at = now();
};

const KEYS: Record<string, Dir> = {
  ArrowDown: 1,
  PageDown: 1,
  End: 1,
  " ": 1,
  Spacebar: 1,
  ArrowUp: -1,
  PageUp: -1,
  Home: -1,
};

/**
 * Start listening. Idempotent and safe to call from any component — the first
 * caller wins and the listeners live for the page's lifetime (they are three
 * passive handlers doing a sign comparison; tearing them down per-component
 * would just risk a section losing its input signal).
 */
export function initScrollIntent(): void {
  if (started || typeof window === "undefined") return;
  started = true;

  window.addEventListener(
    "wheel",
    (e: WheelEvent) => {
      if (e.deltaY) set(e.deltaY > 0 ? 1 : -1);
    },
    { passive: true },
  );

  window.addEventListener("keydown", (e: KeyboardEvent) => {
    // Shift+Space pages UP, which is the one key whose direction flips.
    const d = e.key === " " && e.shiftKey ? -1 : KEYS[e.key];
    if (d) set(d);
  });

  // Touch: Lenis is disabled on coarse pointers, but the pins and their snap
  // still run there, so the escalator needs the same signal. Dragging the
  // content UP scrolls DOWN, hence the inverted comparison.
  window.addEventListener(
    "touchstart",
    (e: TouchEvent) => {
      if (e.touches[0]) touchY = e.touches[0].clientY;
    },
    { passive: true },
  );
  window.addEventListener(
    "touchmove",
    (e: TouchEvent) => {
      const y = e.touches[0]?.clientY;
      if (y === undefined) return;
      const dy = touchY - y;
      // ignore sub-pixel noise from a finger resting on the glass
      if (Math.abs(dy) > 1) {
        set(dy > 0 ? 1 : -1);
        touchY = y;
      }
    },
    { passive: true },
  );
}

/**
 * The direction the reader last asked for, or `null` if there is no current
 * gesture. READING CLEARS IT — see the consumption note in the file header.
 */
export function takeScrollIntent(): Dir | null {
  if (dir === null) return null;
  const fresh = now() - at <= MAX_AGE_MS;
  const d = dir;
  dir = null;
  return fresh ? d : null;
}
