/**
 * escalatorSnap — the shared "auto-scroll between reveals" model used by the two
 * long pinned scrolly-telling timelines (home Hero, /about AboutIntro).
 *
 * THE RULE, in one line: **the direction you nudge is the direction you go.**
 * A reader parked on a reveal who scrolls even slightly is carried to the NEXT
 * reveal in that direction, gliding at roughly the site's normal scroll speed.
 * They are never dragged back onto the reveal they were trying to leave.
 *
 * ── Why the previous model misbehaved (keep this, it is easy to regress) ─────
 * The old snapTo committed once travel crossed a FRACTION of the current
 * segment (`SNAP_FWD/SNAP_REV = 0.15`). Two failures fell out of that:
 *
 *  1. **Segments are wildly different lengths.** The gap between two phrase
 *     holds is not the gap between two works beats, so "15%" was a different
 *     number of real scroll pixels at every point in the journey. On the long
 *     segments a deliberate trackpad nudge landed under the fraction and got
 *     snapped BACK to the reveal it came from — the reported "I scroll a little
 *     and it takes me back to the same hero text" bug.
 *  2. **It only understood ONE segment.** If a gesture carried past the
 *     adjacent reveal, neither `below === lastRest` nor `above === lastRest`
 *     held, and it fell through to nearest-rounding — which can round
 *     *backwards*, against the direction the reader was actually travelling.
 *
 * ── The model now ────────────────────────────────────────────────────────────
 *  • The commit threshold is an ABSOLUTE PIXEL distance (`commitPx`), not a
 *    fraction. Identical everywhere in the timeline and identical on every
 *    device, because it is measured against the pin's real scroll length.
 *  • `lastRest` — the reveal the reader is leaving — is maintained from the
 *    trigger's own onUpdate via `observe()`, not only from inside snapTo. It
 *    therefore tracks reveals the playhead CROSSES mid-flight, so the sign of
 *    `value - lastRest` is always the true direction of travel. (Deriving
 *    direction only inside snapTo was the stale-anchor hazard: re-entering the
 *    pin from the far side left `lastRest` a whole journey away and reported
 *    the wrong direction.)
 *  • The target is the last reveal PASSED in the direction of travel, with a
 *    minimum of one step. So it always moves with you, never against you: a
 *    small nudge advances exactly one reveal, a hard flick lands on the last
 *    reveal it genuinely reached, and neither ever rubber-bands backwards.
 *
 * Nothing here reads scroll VELOCITY, so it behaves the same under Lenis'
 * smoothing as it does under native scroll (`inertia: false` on the snap config
 * is what feeds snapTo the settled position rather than a projected landing).
 */

import type { ScrollTrigger as ScrollTriggerInstance } from "gsap/ScrollTrigger";

/** Progress distance within which we consider the reader "parked" on a reveal. */
const SNAP_EPS = 0.0015;

/**
 * Scroll pixels of travel away from a reveal that commit to the next one.
 * Small on purpose — the brief is that ANY intentional nudge should ride. Big
 * enough that an idle jiggle, a hover-induced reflow or a rubber-band bounce
 * does not count as intent.
 */
const DEFAULT_COMMIT_PX = 22;

export type EscalatorSnapOptions = {
  /** Rest points as sorted, de-duped progress values (0..1). Re-read per call
   *  so a timeline whose duration is only known later still works. */
  getRests: () => number[];
  /** Travel from a reveal, in scroll px, that commits to the next one. */
  commitPx?: number;
};

export type EscalatorSnap = {
  /** Drop straight into `ScrollTrigger.create({ snap })`. */
  config: {
    snapTo: (value: number, self?: ScrollTriggerInstance) => number;
    inertia: false;
    delay: number;
    duration: { min: number; max: number };
    ease: string;
  };
  /**
   * Call from the trigger's `onUpdate` with `self.progress` and the pin's total
   * scroll length (`self.end - self.start`). Keeps the anchor honest, which is
   * what makes the direction test reliable.
   */
  observe: (progress: number, trackPx: number) => void;
};

export function createEscalatorSnap(
  opts: EscalatorSnapOptions,
): EscalatorSnap {
  const commitPx = opts.commitPx ?? DEFAULT_COMMIT_PX;

  // The reveal the reader is currently leaving. Seeded lazily from the first
  // rest, then kept current by observe().
  let lastRest: number | null = null;
  // Previous observed progress, so observe() can tell which reveals the
  // playhead crossed between two frames (with scrub, a fast scroll can jump
  // clean over one).
  let prevProgress: number | null = null;
  // Last known pin length in px, so snapTo can convert progress → pixels even
  // if it is somehow called before an onUpdate.
  let trackPx = 0;

  const nearestIndex = (rests: number[], p: number) => {
    let best = 0;
    for (let i = 1; i < rests.length; i++) {
      if (Math.abs(rests[i] - p) < Math.abs(rests[best] - p)) best = i;
    }
    return best;
  };

  const observe = (progress: number, px: number) => {
    if (px > 0) trackPx = px;
    const rests = opts.getRests();
    if (!rests.length) return;
    if (lastRest === null) lastRest = rests[0];
    if (prevProgress === null) {
      prevProgress = progress;
      return;
    }
    const lo = Math.min(prevProgress, progress);
    const hi = Math.max(prevProgress, progress);
    // Every reveal the playhead sat on or swept through since the last frame.
    const crossed = rests.filter((r) => r >= lo && r <= hi);
    if (crossed.length) {
      // Going down, the anchor is the LAST reveal passed; going up, the first
      // (i.e. the highest-numbered one behind you either way).
      lastRest =
        progress >= prevProgress ? crossed[crossed.length - 1] : crossed[0];
    }
    prevProgress = progress;
  };

  const snapTo = (value: number, self?: ScrollTriggerInstance): number => {
    const rests = opts.getRests();
    if (!rests.length) return value;
    if (self && self.end > self.start) trackPx = self.end - self.start;
    if (lastRest === null) lastRest = rests[0];

    // Parked on a reveal already → stay put. Guards against an idle jiggle,
    // a hover reflow or a resize re-triggering a glide.
    for (const r of rests) {
      if (Math.abs(r - value) < SNAP_EPS) {
        lastRest = r;
        return r;
      }
    }

    // Off the end of the journey → don't snap; let the reader scroll out of the
    // pin into whatever follows it.
    if (value > rests[rests.length - 1]) return value;
    // Before the first reveal (only reachable if rest 0 isn't at progress 0).
    if (value < rests[0]) {
      lastRest = rests[0];
      return rests[0];
    }

    const travelPx = Math.abs(value - lastRest) * Math.max(1, trackPx);
    // Below the commit distance this was not a deliberate move — ease back to
    // the reveal being read rather than jumping on a twitch.
    if (travelPx < commitPx) return lastRest;

    const li = nearestIndex(rests, lastRest);
    let idx: number;
    if (value > lastRest) {
      // DOWN — the last reveal we actually reached, but never fewer than one
      // step, so a small nudge still advances instead of falling back.
      idx = li + 1;
      if (idx >= rests.length) return value; // nothing left below → exit the pin
      while (idx + 1 < rests.length && rests[idx + 1] <= value) idx++;
    } else {
      // UP — mirror image: the reveal at or just above where we stopped, and at
      // least one step back.
      idx = li - 1;
      if (idx < 0) idx = 0;
      while (idx - 1 >= 0 && rests[idx - 1] >= value) idx--;
    }

    lastRest = rests[idx];
    return lastRest;
  };

  return {
    config: {
      snapTo,
      // inertia:false → snapTo receives where the scroll actually STOPPED, not
      // a velocity-projected landing. The direction test above is positional,
      // so a projected value would fight it.
      inertia: false,
      // The pause between "reader let go" and "we commit to a direction". This
      // is NOT the glide speed — that's `duration` below. (They were once
      // conflated and the ride felt instant.)
      delay: 0.2,
      // The glide should read as ONE MORE NORMAL SCROLL, not a snap. Lenis is
      // configured with duration 1.1s, so a rest-to-rest ride lands in the same
      // ballpark; ScrollTrigger scales within this range by how far it has to
      // travel, which keeps the perceived SPEED constant across short and long
      // segments. The old 0.45–0.8 range was visibly faster than the reader's
      // own scrolling, which is what read as "it yanks me to the next text".
      duration: { min: 0.7, max: 1.15 },
      // in-out, no overshoot — an escalator easing you on and off. Never use a
      // back/elastic ease here; the brief is explicitly "don't make it bounce".
      ease: "power2.inOut",
    },
    observe,
  };
}
