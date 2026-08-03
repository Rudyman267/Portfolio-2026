/**
 * escalatorSnap — the shared "auto-scroll between reveals" model used by the two
 * long pinned scrolly-telling timelines (home Hero, /about AboutIntro).
 *
 * THE RULE, in one line: **the direction you ask for is the direction you go.**
 *
 * ── There is NO threshold here, deliberately ────────────────────────────────
 * Three shipped versions of this decided direction from the scroll POSITION —
 * how far the reader had travelled from the reveal they were parked on, against
 * some threshold (a fraction of the segment, then an absolute pixel distance).
 * Every one of them had the same defect, because every threshold has a "below
 * the line" branch, and that branch scrolls the page BACK to where the reader
 * started — i.e. it moves the page in the opposite direction to the gesture.
 * No value of the threshold fixes that; the position is the wrong input.
 *
 * It is also a laundered signal: by the time snapTo sees a position it has been
 * through Lenis' easing and ScrollTrigger's scrub lag, so a short deliberate
 * gesture can settle barely off the anchor and fall under any threshold at all.
 *
 * So direction now comes from `lib/scrollIntent.ts`, which reads the signed
 * `deltaY` off the wheel event itself (plus keys and touch). One notch down is
 * as unambiguous as ten, and nothing can turn it into "up".
 *
 * ── Where it lands ──────────────────────────────────────────────────────────
 * Always the first reveal PAST where the reader stopped, in the direction they
 * asked for. Never the one behind them — landing behind the stop point is a
 * visible bounce-back even when the net move is forward, and that bounce is the
 * exact thing being fixed.
 *
 * With no intent on record (a resize or a refresh re-firing the snap, or a
 * second fire from the snap tween's own scroll) it resolves to the NEAREST
 * reveal and therefore stays put. `takeScrollIntent()` clears on read, so one
 * gesture can only ever cause one ride.
 */

import type { ScrollTrigger as ScrollTriggerInstance } from "gsap/ScrollTrigger";
import { initScrollIntent, takeScrollIntent } from "@/lib/scrollIntent";

/**
 * Progress slop for "this reveal is the one we're already on". Only used to
 * stop `value` sitting a hair below a reveal from counting as "past" it — it is
 * NOT a commit threshold and nothing rides on its exact size.
 */
const EPS = 0.0004;

export type EscalatorSnapOptions = {
  /** Rest points as sorted, de-duped progress values (0..1). Re-read per call
   *  so a timeline whose duration is only known later still works. */
  getRests: () => number[];
};

export type EscalatorSnap = {
  /** Drop straight into `ScrollTrigger.create({ snap })`. */
  snapTo: (value: number, self?: ScrollTriggerInstance) => number;
  inertia: false;
  directional: false;
  delay: number;
  duration: { min: number; max: number };
  ease: string;
};

export function createEscalatorSnap(
  opts: EscalatorSnapOptions,
): EscalatorSnap {
  initScrollIntent();

  const nearest = (rests: number[], p: number) => {
    let best = rests[0];
    for (const r of rests) {
      if (Math.abs(r - p) < Math.abs(best - p)) best = r;
    }
    return best;
  };

  const snapTo = (value: number): number => {
    const rests = opts.getRests();
    if (!rests.length) return value;

    const intent = takeScrollIntent();
    // No current gesture → this is a resize/refresh/self-retrigger. Resolve to
    // the nearest reveal, which for a reader already parked on one is a no-op.
    if (!intent) return nearest(rests, value);

    if (intent > 0) {
      // DOWN — the first reveal past the stop point.
      for (const r of rests) if (r > value + EPS) return r;
      // Nothing left below: don't snap, let the reader scroll out of the pin
      // into whatever follows it.
      return value;
    }
    // UP — the last reveal above the stop point.
    for (let i = rests.length - 1; i >= 0; i--) {
      if (rests[i] < value - EPS) return rests[i];
    }
    return rests[0];
  };

  return {
    snapTo,
    // inertia:false → snapTo receives where the scroll actually STOPPED rather
    // than a velocity-projected landing. We only use `value` to decide which
    // reveal is "next", so a projected value would just make that fuzzy.
    inertia: false,
    // ScrollTrigger's own directional filtering is for numeric/array snap
    // targets. Off, explicitly: direction is entirely ours to decide here and
    // two systems arbitrating it is how you get a fight.
    directional: false,
    // The pause between "reader let go" and "we commit". This is NOT the glide
    // speed — that's `duration` below. (They were once conflated and the ride
    // felt instant.)
    delay: 0.2,
    // The glide should read as ONE MORE NORMAL SCROLL, not a snap. Lenis is
    // configured with duration 1.1s, so a reveal-to-reveal ride lands in the
    // same ballpark; ScrollTrigger scales within this range by how far it has
    // to travel, which keeps the perceived SPEED constant across short and long
    // segments.
    duration: { min: 0.7, max: 1.15 },
    // in-out, no overshoot — an escalator easing you on and off. Never use a
    // back/elastic ease here; the brief is explicitly "don't make it bounce".
    ease: "power2.inOut",
  };
}
