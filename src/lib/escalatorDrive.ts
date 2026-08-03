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
 * ── THE SPEED KNOB ──────────────────────────────────────────────────────────
 * How fast a ride travels, in scroll pixels per second. This is the ONLY thing
 * that sets how fast the scrolly-telling sections read, so tune here and
 * nowhere else: lower = slower.
 *
 * It is a SPEED, not a duration, on purpose. A flat duration (it was 0.85s)
 * makes the perceived pace depend on how much timeline a step happens to
 * cover — the gap between two phrase holds and the gap between two works beats
 * are very different distances, so the same 0.85s made the long ones fly and
 * the short ones crawl. Deriving duration from distance keeps the pace even
 * across the whole journey, and makes it independent of pin length, so
 * retuning a section's scroll length can no longer change how fast it feels.
 *
 * 430 px/s sits a little under a comfortable sustained wheel scroll, which is
 * the point: a step should read as unhurried. With power2.inOut the peak is
 * about twice this.
 */
const RIDE_PX_PER_S = 430;

/**
 * Floor and ceiling for a ride.
 *
 * ⚠️ THE CEILING MUST STAY ABOVE THE LONGEST GAP IN ANY SECTION, or it silently
 * turns the speed above back into a duration for exactly the longest rides —
 * i.e. it makes the biggest transitions the FASTEST ones. That shipped at 1.8s
 * and was reported as "HERE'S SOME OF MY WORK just gets insta scrolled... it
 * feels like I'm scrolling age of intelligence and here's my work at the same
 * time as one thing". Measured on the live hero (pin 7745px, 12 rests):
 *
 *   gap 718px   phrase → phrase                 1.67s   430 px/s   ← correct
 *   gap 1058px  phrase 3 → works heading        1.8s    588 px/s   ← capped
 *   gap 1249px  works heading → first project   1.8s    694 px/s   ← capped, +61%
 *
 * The works heading sits between the two LONGEST gaps in the journey, so it was
 * the one scene ridden into and out of well above everything else's pace. At
 * 3.0s nothing in either section clamps and the whole journey runs at a true
 * 430 px/s. If a section ever gains a bigger gap than ~1290px, raise this again
 * rather than accepting the speed-up.
 */
const RIDE_MIN_S = 0.9;
const RIDE_MAX_S = 3.0;

const rideSeconds = (distancePx: number) =>
  Math.min(
    RIDE_MAX_S,
    Math.max(RIDE_MIN_S, Math.abs(distancePx) / RIDE_PX_PER_S),
  );

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

/**
 * Dead time after a ride lands, before any input can start another one.
 *
 * ⚠️ THIS IS THE FIX FOR THE "TWO REVEALS FROM ONE FLICK" BUG — reported as
 * phrase 3 and "HERE'S SOME OF MY WORK" behaving like one fused scene: a nudge
 * into "DESIGNING THE AGE OF INTELLIGENCE" carried straight on to the works
 * heading, and coming back up showed phrase 3 for a beat before continuing to
 * phrase 2. That is one gesture producing TWO rides.
 *
 * Why it surfaced there and nowhere else: the p2→p3 gap is the SHORTEST in the
 * journey (~1.1 timeline units, so a ~0.9s ride at the RIDE_MIN_S floor), while
 * a macOS momentum tail runs well over a second. So that ride — and only that
 * ride — lands while the tail is still delivering events, and the tail is
 * ragged enough at the end to look like a fresh gesture.
 *
 * Two changes killed it: this quiet window, and dropping the old `queued`
 * mechanism that deferred a mid-ride gesture to fire the instant the ride
 * landed (which is precisely how one flick became two steps). Input during a
 * ride is now simply ignored.
 */
const POST_RIDE_QUIET_MS = 260;

/**
 * ── SCROLL FREEDOM ─────────────────────────────────────────────────────────
 * A ride owns the scroll, and rides can now run up to 3s. That is correct for
 * the reader being carried, but it also meant *"I can't scroll forward until
 * the scene is set"* — no way to push past a transition you've already read.
 *
 * So a SECOND, DELIBERATE gesture while a ride is in flight HANDS CONTROL BACK:
 * the ride is cancelled, Lenis' lock is released, and the reader free-scrubs
 * for the rest of that gesture. The escalator re-arms by itself on the next
 * gesture — so "keep scrolling" means full manual control, and "stop, then
 * nudge" puts you back on rails and seats you on the next reveal.
 *
 * Deliberately NOT auto-resumed after the reader stops: every "move them once
 * scrolling ends" mechanism in this component's history has produced a
 * complaint, and it would fight Lenis' own settle. Asking for manual control
 * keeps it until you ask for the escalator again.
 *
 * ⚠️ Detecting the second gesture is the hard part on macOS, because the first
 * flick's momentum is still streaming — there is no 100ms hole to find. So a
 * DELTA SPIKE also counts: momentum decays monotonically, so a big delta
 * arriving right after small ones is a fresh push of the fingers. Both guards
 * matter:
 *   - `SPIKE_AFTER_MS` — a flick RAMPS UP over its first ~150ms (2→8→25…),
 *     which looks exactly like a spike. Ignoring spikes for the first 500ms of
 *     a ride skips that ramp entirely.
 *   - `lastAbs < SPIKE_MIN_DELTA / 2` — the spike must follow genuinely small
 *     deltas, i.e. a decayed tail, not a mid-ramp step up.
 */
const SPIKE_MIN_DELTA = 24;
const SPIKE_RATIO = 3;
const SPIKE_AFTER_MS = 500;

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
  /** When the last ride landed — see POST_RIDE_QUIET_MS. */
  let landedAt = 0;
  /** When the ride in flight began — arms the delta-spike takeover test. */
  let rideStartedAt = 0;
  /** |deltaY| of the previous wheel event, for that same spike test. */
  let lastAbs = 0;
  /** Reader has taken the wheel for the rest of this gesture — see SCROLL FREEDOM. */
  let free = false;
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
    landedAt = now();
    // Treat anything still arriving as the TAIL of the gesture we just served,
    // not the start of a new one. Without this, a momentum event landing a
    // fraction later reads as a fresh ask and steps again.
    lastInputAt = landedAt;
    window.clearTimeout(failsafe);
  };

  const step = (d: 1 | -1): void => {
    const st = opts.getTrigger();
    const lenis = lenisRef.current;
    if (!st || !lenis) return;
    const base = target ?? progressOf(st);
    const to = nextRest(base, d);
    if (to === null) return;

    const toPx = Math.round(st.start + to * (st.end - st.start));
    // Pace the ride by how far it actually travels — see RIDE_PX_PER_S.
    const seconds = rideSeconds(toPx - window.scrollY);

    target = to;
    riding = true;
    rideStartedAt = now();
    // Failsafe: if onComplete somehow never arrives, release anyway. A stuck
    // `riding` flag would swallow every wheel event inside the pin, and a page
    // you cannot scroll is far worse than a missed step.
    window.clearTimeout(failsafe);
    failsafe = window.setTimeout(land, seconds * 1000 + 600);

    lenis.scrollTo(toPx, {
      duration: seconds,
      easing: easeInOut,
      // Lenis ignores user input while locked, so the ride cannot be fought
      // half-way and left stranded mid-transition. Self-clears on completion.
      lock: true,
      // ...and `force` lets a chained step start while that lock is still up.
      force: true,
      onComplete: land,
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

  /** Cancel the ride in flight and give the scroll back to the reader. Lenis'
   *  stop()/start() pair runs its `reset()`, which clears the lock, halts the
   *  ride tween and re-seats its internal scroll on the real one — so the
   *  handover is seamless and Lenis picks up this very event. */
  const handOver = () => {
    const lenis = lenisRef.current;
    if (lenis) {
      lenis.stop();
      lenis.start();
    }
    // reset() kills the tween, so onComplete will never fire — land by hand.
    land();
    free = true;
  };

  /** Shared by wheel and keys. `e` is preventDefault'd whenever we take the
   *  input, including for the tail of a gesture we've already acted on — the
   *  reader must not free-scroll underneath a ride. While `free`, we never
   *  preventDefault, so Lenis scrolls normally. */
  const drive = (e: Event, d: 1 | -1, absDelta: number) => {
    const t = now();
    const gapGesture = t - lastInputAt > GESTURE_GAP_MS;
    // A fresh push of the fingers while the previous gesture's momentum is
    // still decaying — the only way to spot a second gesture on macOS.
    const spike =
      absDelta >= SPIKE_MIN_DELTA &&
      lastAbs < SPIKE_MIN_DELTA / 2 &&
      absDelta >= lastAbs * SPIKE_RATIO;
    lastInputAt = t;
    lastAbs = absDelta;

    // Any genuinely new gesture re-arms the escalator.
    if (gapGesture) free = false;
    // The reader has the wheel for the rest of this gesture: don't claim, don't
    // preventDefault — Lenis scrolls it.
    if (free) return;

    if (!claim(d)) return; // nowhere to go that way — let them leave the pin

    if (riding) {
      // Deliberate second gesture mid-ride → hand the scroll back.
      if (gapGesture || (spike && t - rideStartedAt > SPIKE_AFTER_MS)) {
        handOver();
        return; // NOT preventDefault'd — this event starts their free scroll
      }
      // Otherwise it's the momentum tail of the gesture we're already serving.
      e.preventDefault();
      return;
    }

    e.preventDefault();
    // Momentum still coming in just after a landing is the tail of the gesture
    // we already served.
    if (t - landedAt < POST_RIDE_QUIET_MS) return;
    // Same gesture (a Mac momentum tail, or key auto-repeat) — already acted on.
    if (!gapGesture) return;
    // Not "after the scroll settles" — NOW, on this event.
    step(d);
  };

  const onWheel = (e: WheelEvent) => {
    const d: 1 | -1 | 0 = e.deltaY > 0 ? 1 : e.deltaY < 0 ? -1 : 0;
    if (d) drive(e, d, Math.abs(e.deltaY));
  };

  const onKey = (e: KeyboardEvent) => {
    const d = e.key === " " && e.shiftKey ? -1 : KEYS[e.key];
    // Keys have no delta; a repeat is caught by the gap test alone.
    if (d) drive(e, d, SPIKE_MIN_DELTA);
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
