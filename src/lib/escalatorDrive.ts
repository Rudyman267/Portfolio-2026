/**
 * escalatorDrive — inside the two long pinned scrolly-telling sections (home
 * Hero, /about AboutIntro), a LAZY scroll is carried from reveal to reveal,
 * while ACTIVELY scrolling hands the page straight back to the reader.
 *
 * The brief, in the user's words: *"I want the escalator to help only when I am
 * lazy scrolling... just when I scroll freely let me do that without getting me
 * stuck at beats."*
 *
 * ── Why this replaces ScrollTrigger's `snap` on desktop ─────────────────────
 * Four versions of this were built on ScrollTrigger's snap and every one was
 * reported as "I scroll a little and it takes me back". The tuning was never
 * the problem — the ARCHITECTURE was. ScrollTrigger's snap is, by design, *wait
 * for the scroll to stop, then decide where it should have gone*: read its
 * source, the decision runs in a `gsap.delayedCall` that only fires once
 * `getVelocity() < 10`, which under Lenis (duration 1.1s) is ~1.1s of
 * free-scrubbing drift AFTER the gesture. That gives a visible gap, a bounce
 * (the reader has already drifted, so committing moves them again), and
 * inconsistency (where they drift depends on gesture strength).
 *
 * ⚠️ RULE ZERO, learned four times: **never decide direction from scroll
 * POSITION.** Every position threshold has a "below the line" branch, and that
 * branch scrolls the reader backwards against their own gesture. Direction here
 * comes from the wheel event's own `deltaY` and nothing else.
 *
 * ── PUSHES: the one idea this file turns on ─────────────────────────────────
 * A "push" is one deliberate shove of the input device. Counting them is what
 * separates lazy from active, and it is the ONLY thing that works across both
 * devices, because their event streams are nothing alike:
 *
 *   • MOUSE WHEEL — every notch is its own physical push, arriving ~80-200ms
 *     apart. One notch is a lazy scroll. Several in a row means the reader is
 *     actually scrolling.
 *   • TRACKPAD — ONE flick emits hundreds of events ~8ms apart (the fingers,
 *     then a momentum tail that runs on for over a second after they lift).
 *     All of that is a SINGLE push.
 *
 * So a push is an event separated from the last by more than `PUSH_GAP_MS`.
 * Momentum, at ~8ms spacing, can never manufacture one — which is why the
 * previous "a second gesture hands over" version fell apart on a mouse wheel:
 * it treated the ~120ms between notches as a fresh gesture and so handed over,
 * re-armed, and handed over again on every single notch. That is exactly the
 * reported *"hiccups and friction, and the delays are random for each beat."*
 *
 *   push 1  → ride to the next reveal (the escalator; lazy scrolling)
 *   push 2+ → hand the scroll back and stay out of the way (free scrolling)
 *
 * A burst ends after `BURST_END_MS` of silence, which re-arms the escalator. So
 * one notch and stop = carried. Keep spinning the wheel = free. Wait, then one
 * notch = carried again.
 *
 * ⚠️ A trackpad can't make a second push by gap alone (its momentum is still
 * streaming), so a DELTA SPIKE counts as a push too: momentum decays
 * monotonically, so a big delta right after small ones is a fresh shove. Two
 * guards stop that misfiring and BOTH are needed — a flick RAMPS UP over its
 * first ~150ms (2→8→25…), which looks exactly like a spike, so spikes are
 * ignored for the first `RAMP_MS` of a burst; and the spike must follow
 * genuinely small deltas, not a mid-ramp step up.
 *
 * ── Re-seating ──────────────────────────────────────────────────────────────
 * After free scrolling stops, the reader is glided to the next reveal in the
 * direction they were already travelling, so they are never left parked
 * mid-transition. This is the ONE place this file waits for the scroll to
 * settle — and it is safe where ST's snap was not, because the direction is the
 * reader's own last input, so it can only ever carry them ONWARD.
 *
 * ── How it stays out of Lenis' way ──────────────────────────────────────────
 * A ride is `lenis.scrollTo(..., { lock: true })`. `Animate.fromTo` calls
 * `onStart` synchronously, so the lock is set during our own call and Lenis'
 * wheel handler — which runs after ours — hits its `isLocked` early-return.
 * They cannot fight. `reset()` clears the lock before `onComplete`, so it can
 * never strand the page; a failsafe timer backs that up regardless.
 *
 * ── Scope ───────────────────────────────────────────────────────────────────
 * DESKTOP ONLY — it drives Lenis, so callers attach it only where smooth scroll
 * actually runs (fine pointer + no reduced motion). Touch and reduced-motion
 * keep ScrollTrigger's snap (escalatorSnap.ts).
 */

import type { ScrollTrigger as ScrollTriggerInstance } from "gsap/ScrollTrigger";
import { lenisRef } from "@/components/motion/lenisBridge";

/** Progress slop so a value sitting a hair off a reveal isn't "past" it. */
const EPS = 0.0004;

/**
 * ── THE SPEED KNOB ──────────────────────────────────────────────────────────
 * How fast a ride travels, in scroll px/sec. The ONLY thing that sets how fast
 * these sections read — tune here and nowhere else. Lower = slower.
 *
 * A SPEED, not a duration, on purpose: the gaps are not equal (a phrase-hold
 * gap and a works-beat exit span are very different distances), so one flat
 * duration made the long steps fly and the short ones crawl. It also decouples
 * feel from geometry, so retuning a section's pin length can't silently change
 * its pace.
 */
const RIDE_PX_PER_S = 430;

/**
 * Floor and ceiling for a ride.
 *
 * ⚠️ THE CEILING MUST STAY ABOVE THE LONGEST GAP IN ANY SECTION, or it silently
 * turns the speed above back into a duration for exactly the longest rides —
 * i.e. it makes the biggest transitions the FASTEST. That shipped at 1.8s and
 * was reported as "'HERE'S SOME OF MY WORK' just gets insta scrolled... it
 * feels like I'm scrolling age of intelligence and here's my work at the same
 * time as one thing". Measured on the live hero (pin 7745px, 12 rests):
 *
 *   gap 718px   phrase → phrase                 1.67s   430 px/s   ← correct
 *   gap 1058px  phrase 3 → works heading        1.8s    588 px/s   ← capped
 *   gap 1248px  works heading → first project   1.8s    694 px/s   ← capped, +61%
 *
 * The works heading sits between the two LONGEST gaps in the site, so it was
 * the one scene ridden into and out of well above everything else's pace. At
 * 3.0s nothing clamps. If a section ever gains a gap bigger than ~1290px, raise
 * this rather than accepting the speed-up.
 */
const RIDE_MIN_S = 0.9;
const RIDE_MAX_S = 3.0;

/**
 * Minimum spacing for an event to count as its own PUSH. Above a trackpad's
 * ~8ms event stream (so momentum can never fake one), well below the ~80-200ms
 * between mouse-wheel notches (so every notch counts as one).
 */
const PUSH_GAP_MS = 45;

/** Silence that ends a burst and re-arms the escalator. */
const BURST_END_MS = 500;

/** Pushes in one burst before the reader is given the scroll back. */
const FREE_AFTER_PUSHES = 2;

/** Spike detection — see the header. RAMP_MS skips a flick's own ramp-up. */
const SPIKE_MIN_DELTA = 24;
const SPIKE_RATIO = 3;
const RAMP_MS = 220;

/** After free scrolling, how long to wait before re-seating on a reveal. */
const RESEAT_DELAY_MS = 420;
/** …and how often to re-check while Lenis is still settling. */
const RESEAT_POLL_MS = 120;

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
  /** Progress we're riding TO, so a re-read counts from the destination. */
  let target: number | null = null;
  let failsafe = 0;

  // ── burst state ───────────────────────────────────────────────────────────
  let lastInputAt = 0;
  let burstStartedAt = 0;
  let pushes = 0;
  /** Reader is scrolling freely; we claim nothing until the burst ends. */
  let free = false;
  let lastDir: 1 | -1 = 1;
  /** |deltaY| of the previous event, for the spike test. */
  let lastAbs = 0;
  let reseat = 0;

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

  /** Already sitting on a reveal? Then there is nothing to re-seat. */
  const onARest = (p: number) =>
    opts.getRests().some((r) => Math.abs(r - p) < EPS * 3);

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

    const toPx = Math.round(st.start + to * (st.end - st.start));
    const seconds = Math.min(
      RIDE_MAX_S,
      Math.max(RIDE_MIN_S, Math.abs(toPx - window.scrollY) / RIDE_PX_PER_S),
    );

    target = to;
    riding = true;
    // Failsafe: if onComplete never arrives, release anyway. A stuck `riding`
    // flag swallows every wheel event inside the pin, and a page you cannot
    // scroll is far worse than a missed step.
    window.clearTimeout(failsafe);
    failsafe = window.setTimeout(land, seconds * 1000 + 600);

    lenis.scrollTo(toPx, {
      duration: seconds,
      easing: easeInOut,
      // Lenis ignores user input while locked, so the ride can't be fought
      // half-way and left stranded. Self-clears on completion.
      lock: true,
      // ...and `force` lets us retarget while that lock is still up.
      force: true,
      onComplete: land,
    });
  };

  /** Cancel any ride and give the scroll back. Lenis' stop()/start() pair runs
   *  its internal `reset()`, which clears the lock, halts the ride tween and
   *  re-seats Lenis on the real scroll position — so the handover is seamless
   *  and Lenis picks up the very event that triggered it. */
  const handBack = () => {
    const lenis = lenisRef.current;
    if (lenis && riding) {
      lenis.stop();
      lenis.start();
    }
    // reset() kills the tween, so onComplete will never fire — land by hand.
    land();
    free = true;
  };

  /** After free scrolling stops, carry the reader onto the next reveal in the
   *  direction they were already going. Waits for Lenis to finish its own
   *  settle first, otherwise the two animations fight over the same scroll. */
  const scheduleReseat = () => {
    window.clearTimeout(reseat);
    reseat = window.setTimeout(function check() {
      const st = opts.getTrigger();
      const lenis = lenisRef.current;
      if (!st || !lenis || !st.isActive) return;
      if (lenis.isScrolling) {
        reseat = window.setTimeout(check, RESEAT_POLL_MS);
        return;
      }
      free = false;
      pushes = 0;
      if (riding) return;
      if (onARest(progressOf(st))) return;
      step(lastDir);
    }, RESEAT_DELAY_MS);
  };

  /** Is the pin the right place for this input, and is there anywhere to go? */
  const claim = (d: 1 | -1): boolean => {
    if (!lenisRef.current) return false;
    // The intro overlay owns the scroll lock while it's up.
    if (document.body.classList.contains("is-loading")) return false;
    const st = opts.getTrigger();
    if (!st || !st.isActive) return false;
    const base = riding && target !== null ? target : progressOf(st);
    return nextRest(base, d) !== null;
  };

  /** Shared by wheel and keys. We only ever call preventDefault when we are
   *  actually taking the input — while `free`, every event goes to Lenis. */
  const drive = (e: Event, d: 1 | -1, absDelta: number) => {
    const t = now();
    const gap = t - lastInputAt;

    // A new burst re-arms the escalator.
    if (gap > BURST_END_MS) {
      pushes = 0;
      free = false;
      burstStartedAt = t;
      lastAbs = 0;
    }

    // A fresh shove: separated in time, or — for a trackpad, whose momentum
    // leaves no gaps — a delta spike after the tail has decayed.
    const spike =
      absDelta >= SPIKE_MIN_DELTA &&
      lastAbs < SPIKE_MIN_DELTA / 2 &&
      absDelta >= lastAbs * SPIKE_RATIO;
    const isPush =
      gap > PUSH_GAP_MS || (spike && t - burstStartedAt > RAMP_MS);

    lastInputAt = t;
    lastAbs = absDelta;
    lastDir = d;

    if (!claim(d)) {
      // Outside the pin, or nothing left in that direction — normal scrolling.
      free = false;
      window.clearTimeout(reseat);
      return;
    }

    if (isPush) pushes++;

    // Reader has the scroll. Don't claim, don't preventDefault.
    if (free) {
      scheduleReseat();
      return;
    }

    // Second deliberate push in this burst → they're actively scrolling, not
    // lazily nudging. Get out of the way for the rest of the burst.
    if (isPush && pushes >= FREE_AFTER_PUSHES) {
      handBack();
      scheduleReseat();
      return; // NOT preventDefault'd — this event begins their free scroll
    }

    e.preventDefault();
    // Everything else in this burst is the tail of the push we already served.
    if (!isPush) return;
    // Not "after the scroll settles" — NOW, on this event.
    //
    // ⚠️ This runs EVEN IF a ride is already in flight, and `step` counts from
    // `target` rather than the live position, so a push mid-ride EXTENDS the
    // journey onward by one more reveal instead of being swallowed. Without
    // that, a reader who nudges again during a long ride (they run up to 3s)
    // gets nothing at all — the "it waits for the scene to set before going
    // next" complaint. Repeated pushes inside ONE burst never reach here; they
    // hand the scroll back above.
    step(d);
  };

  const onWheel = (e: WheelEvent) => {
    const d: 1 | -1 | 0 = e.deltaY > 0 ? 1 : e.deltaY < 0 ? -1 : 0;
    if (d) drive(e, d, Math.abs(e.deltaY));
  };

  const onKey = (e: KeyboardEvent) => {
    const d = e.key === " " && e.shiftKey ? -1 : KEYS[e.key];
    // Keys carry no delta; auto-repeat is caught by the gap test alone.
    if (d) drive(e, d, SPIKE_MIN_DELTA);
  };

  // passive:false — preventDefault is the whole point: while the escalator is
  // carrying the reader WE own the scroll, so the free-scrub drift that every
  // snap-based version had to correct for afterwards never happens at all.
  window.addEventListener("wheel", onWheel, { passive: false });
  window.addEventListener("keydown", onKey);

  return () => {
    window.removeEventListener("wheel", onWheel);
    window.removeEventListener("keydown", onKey);
    window.clearTimeout(failsafe);
    window.clearTimeout(reseat);
  };
}
