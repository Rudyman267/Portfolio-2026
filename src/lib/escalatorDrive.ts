/**
 * escalatorDrive — the reader's scroll gesture IS the step, inside the two long
 * pinned scrolly-telling sections (home Hero, /about AboutIntro).
 *
 * ── Why this replaces ScrollTrigger's `snap` on desktop ─────────────────────
 * Four versions of this were built on ScrollTrigger's snap, and every one of
 * them was reported as "I scroll a little and it takes me back". The tuning was
 * never the problem — the ARCHITECTURE was:
 *
 *   ScrollTrigger's snap is, by design, *wait for the scroll to stop, then
 *   decide where it should have gone*. Read its source: the decision runs in a
 *   `gsap.delayedCall` that only fires once `getVelocity() < 10`. Under Lenis
 *   (duration 1.1s) that is ~1.1s of free-scrubbing drift AFTER the reader's
 *   gesture, plus the snap's own delay, before anything is decided.
 *
 * That produces exactly the three complaints:
 *   • the *gap* — a visible pause where nothing has committed yet;
 *   • the *bounce* — whatever the decision is, the reader has already drifted
 *     somewhere else, so committing means moving them again;
 *   • the *inconsistency* — where they drift to depends on gesture strength, so
 *     "scroll manually" and "let it go midway" land differently.
 *
 * There is no threshold anywhere in this file, and there is no waiting. The
 * wheel event itself starts the ride, in the direction of its own `deltaY`, on
 * the same frame. Take the scroll manually or flick and let go: the outcome is
 * the same, because the outcome is decided by the DIRECTION of the gesture and
 * nothing else.
 *
 * ── How it stays out of Lenis' way ──────────────────────────────────────────
 * The ride is `lenis.scrollTo(..., { lock: true })`. Lenis' `onVirtualScroll`
 * early-returns while `isLocked`, so the reader's own wheel input cannot fight
 * the ride, and `reset()` clears the lock before `onComplete` runs — so the
 * lock can never strand the page. (We still keep our own failsafe below; a
 * frozen scroll is the worst possible failure here.)
 *
 * ── Scope ───────────────────────────────────────────────────────────────────
 * DESKTOP ONLY — it requires Lenis, so callers attach it only when smooth
 * scroll is actually running (fine pointer + no reduced motion). Touch and
 * reduced-motion keep ScrollTrigger's snap (see escalatorSnap.ts), where native
 * momentum owns the scroll and there is no Lenis instance to drive.
 */

import type { ScrollTrigger as ScrollTriggerInstance } from "gsap/ScrollTrigger";
import { lenisRef } from "@/components/motion/lenisBridge";

/** Progress slop so a value sitting a hair off a rest isn't "past" it. */
const EPS = 0.0004;

/**
 * How long one reveal-to-reveal ride takes. Long enough to read as a scroll
 * rather than a jump, short enough that it never feels like being held.
 */
const RIDE_S = 0.85;

/**
 * A gap this long with no wheel events means a NEW gesture. One gesture moves
 * exactly one reveal — that is the entire pacing model, and it is why this is
 * device-independent.
 *
 * ⚠️ THIS IS WHAT STOPS macOS RUNNING AWAY. A Mac trackpad flick does not end
 * when the fingers lift: the OS keeps streaming momentum wheel events at ~120Hz
 * for another second or more. Anything that treats "events are still arriving"
 * as "the reader is still asking" will take three or four steps from one flick
 * there and exactly one on a Windows wheel — which is precisely the platform
 * split being fixed. Momentum never leaves a 100ms hole, so it reads as the
 * same gesture and moves one reveal. A human cannot flick twice inside 100ms,
 * so deliberate repeats are never swallowed.
 */
const GESTURE_GAP_MS = 100;

/** power2.inOut — matches the site's motion tokens. No overshoot, ever. */
const easeInOut = (t: number) =>
  t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2;

const KEYS: Record<string, 1 | -1> = {
  ArrowDown: 1,
  PageDown: 1,
  " ": 1,
  ArrowUp: -1,
  PageUp: -1,
};

export type EscalatorDriveOptions = {
  /** Rest points as sorted progress values (0..1). Re-read per call. */
  getRests: () => number[];
  /** The pin's ScrollTrigger. May be null before it exists. */
  getTrigger: () => ScrollTriggerInstance | null | undefined;
};

/** Attaches the drive. Returns a cleanup that detaches it. */
export function createEscalatorDrive(opts: EscalatorDriveOptions): () => void {
  let riding = false;
  /** Progress we're riding TO, so a chained step counts from the destination. */
  let target: number | null = null;
  let lastInputAt = 0;
  /** A step asked for while a ride was in flight, taken as soon as it lands. */
  let queued: 1 | -1 | null = null;
  let failsafe = 0;

  const now = () =>
    typeof performance !== "undefined" ? performance.now() : Date.now();

  const nextRest = (from: number, d: 1 | -1): number | null => {
    const rests = opts.getRests();
    if (!rests.length) return null;
    if (d > 0) {
      for (const r of rests) if (r > from + EPS) return r;
      return null; // nothing below — the reader must be able to leave the pin
    }
    for (let i = rests.length - 1; i >= 0; i--) {
      if (rests[i] < from - EPS) return rests[i];
    }
    return null; // nothing above — ditto, upwards
  };

  const progressOf = (st: ScrollTriggerInstance) => {
    const span = st.end - st.start;
    return span > 0 ? (window.scrollY - st.start) / span : 0;
  };

  const land = () => {
    riding = false;
    target = null;
    window.clearTimeout(failsafe);
  };

  const step = (d: 1 | -1): void => {
    const st = opts.getTrigger();
    const lenis = lenisRef.current;
    if (!st || !lenis) return;
    const base = target ?? progressOf(st);
    const to = nextRest(base, d);
    if (to === null) return;

    target = to;
    riding = true;
    // Failsafe: if onComplete somehow never arrives, release anyway. A stuck
    // `riding` flag would swallow every wheel event inside the pin, and a page
    // you cannot scroll is far worse than a missed step.
    window.clearTimeout(failsafe);
    failsafe = window.setTimeout(land, RIDE_S * 1000 + 600);

    lenis.scrollTo(Math.round(st.start + to * (st.end - st.start)), {
      duration: RIDE_S,
      easing: easeInOut,
      // Lenis ignores user input while locked, so the ride cannot be fought
      // half-way and left stranded mid-transition. Self-clears on completion.
      lock: true,
      // ...and `force` lets a chained step start while that lock is still up.
      force: true,
      onComplete: () => {
        land();
        // A second flick that arrived mid-ride is honoured now, so rapid
        // repeats never get swallowed.
        const q = queued;
        queued = null;
        if (q) step(q);
      },
    });
  };

  /** Shared by wheel and keys: should this input drive a step, or fall through
   *  to normal scrolling (so the reader can leave the pin at either end)? */
  const claim = (d: 1 | -1): boolean => {
    if (!lenisRef.current) return false;
    // The intro overlay owns the scroll lock while it's up.
    if (document.body.classList.contains("is-loading")) return false;
    const st = opts.getTrigger();
    if (!st || !st.isActive) return false;
    const base = riding && target !== null ? target : progressOf(st);
    return nextRest(base, d) !== null;
  };

  /** Shared by wheel and keys. `e` is preventDefault'd whenever we take the
   *  input, including for the tail of a gesture we've already acted on — the
   *  reader must not free-scroll underneath a ride. */
  const drive = (e: Event, d: 1 | -1) => {
    const t = now();
    const newGesture = t - lastInputAt > GESTURE_GAP_MS;
    lastInputAt = t;
    if (!claim(d)) return; // nowhere to go that way — let them leave the pin
    e.preventDefault();
    // Same gesture (a Mac momentum tail, or key auto-repeat) — already acted on.
    if (!newGesture) return;
    if (riding) {
      queued = d; // taken the moment this ride lands
      return;
    }
    // Not "after the scroll settles" — NOW, on this event.
    step(d);
  };

  const onWheel = (e: WheelEvent) => {
    const d: 1 | -1 | 0 = e.deltaY > 0 ? 1 : e.deltaY < 0 ? -1 : 0;
    if (d) drive(e, d);
  };

  const onKey = (e: KeyboardEvent) => {
    const d = e.key === " " && e.shiftKey ? -1 : KEYS[e.key];
    if (d) drive(e, d);
  };

  // passive:false — preventDefault is the whole point: inside the pin WE own
  // the scroll, so the free-scrub drift that every snap-based version had to
  // correct for afterwards never happens in the first place.
  window.addEventListener("wheel", onWheel, { passive: false });
  window.addEventListener("keydown", onKey);

  return () => {
    window.removeEventListener("wheel", onWheel);
    window.removeEventListener("keydown", onKey);
    window.clearTimeout(failsafe);
  };
}
