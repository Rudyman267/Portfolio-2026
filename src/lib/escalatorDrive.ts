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
 * ── The two ideas this file turns on ────────────────────────────────────────
 * The devices' event streams are nothing alike, and everything here exists to
 * paper over that:
 *   • MOUSE WHEEL — one event per notch. A flick is a fast spin, ~20-80ms
 *     apart; deliberate single notches are 120ms+.
 *   • TRACKPAD — ONE flick emits hundreds of events ~8ms apart: the fingers,
 *     then a momentum tail running over a second after they lift.
 *
 * 1. A **PUSH** — an event more than `PUSH_GAP_MS` after the last — is one
 *    request for one more reveal. The threshold is sized so a FLICK IS A SINGLE
 *    PUSH on either device, because *"when I flick just take me to the next
 *    one"*. Momentum at ~8ms can never manufacture one.
 * 2. **SUSTAIN** decides when to stop helping — see FREE_AFTER_MS /
 *    SUSTAIN_RATIO. Not a count of pushes: the one thing that truly separates a
 *    flick from real scrolling is that **momentum decays and a reader still
 *    scrolling does not.**
 *
 *   push                → ride to the next reveal (the escalator)
 *   push again mid-ride → carry one reveal further, uninterrupted
 *   sustained input     → hand the scroll back (free scrolling)
 *
 * A burst ends after `BURST_END_MS` of silence, which re-arms the escalator. So
 * one flick and stop = carried. Keep scrolling = free. Wait, then flick again =
 * carried again.
 *
 * ⚠️ A COUNT-BASED RULE IS WHY THIS IS SPELLED OUT. "A second gesture (>100ms
 * gap) hands over" is fine on a trackpad and broken on a mouse wheel, where
 * every notch is >100ms apart: it handed over, re-armed and handed over again
 * on each notch — *"a lot of hiccups and friction, and the delays are random
 * too for each beat."* Then "3 pushes hands over" made a fast 3-notch flick
 * cancel its own ride and stall — *"when I flick the gap is too long between
 * the transition."*
 *
 * ── Re-seating ──────────────────────────────────────────────────────────────
 * After free scrolling stops, the reader is glided to the next reveal in the
 * direction they were already travelling, so they are never left parked
 * mid-transition. Safe where ScrollTrigger's snap was not, because the
 * direction is the reader's own last input — it can only carry them ONWARD.
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
 * Minimum spacing for an event to count as its own PUSH — i.e. as a request for
 * one more reveal.
 *
 * ⚠️ Sized so a FLICK IS ONE PUSH. A mouse-wheel flick is a fast spin whose
 * notches land ~20-80ms apart; at the old 45ms those counted as 2-3 separate
 * pushes and a flick travelled 2-3 reveals. The brief is *"when I flick just
 * take me to the next one"* — the same single-reveal ride the reader already
 * called perfect. Deliberate individual notches (120ms+) are still pushes, and
 * a trackpad's ~8ms momentum stream still can't fake one.
 */
const PUSH_GAP_MS = 90;

/** Silence that ends a burst and re-arms the escalator. */
const BURST_END_MS = 500;

/**
 * ── WHAT SEPARATES A FLICK FROM ACTUALLY SCROLLING ──────────────────────────
 * Not the number of events, and not their spacing — **momentum DECAYS, and a
 * reader who is still scrolling does not.**
 *
 * A trackpad flick peaks the instant the fingers leave and then falls away for
 * a second or more. Sustained input — spinning a wheel, or swiping again and
 * again — keeps returning to full strength. So free scrolling is handed over
 * when a burst is still delivering near-peak deltas after FREE_AFTER_MS:
 *
 *     t - burstStart > FREE_AFTER_MS  &&  |delta| >= burstPeak * SUSTAIN_RATIO
 *
 * At 400ms a flick's tail is ~25% of its peak (well under the ratio) while a
 * wheel spin is still at 100%. The time gate also covers a flick's own RAMP-UP,
 * where delta is by definition at the running peak.
 *
 * This replaced a push-count rule plus a bolt-on "delta spike" heuristic with
 * its own ramp guard — the sustain test subsumes both, including a second
 * trackpad flick arriving while the first one's momentum is still streaming
 * (delta jumps back to peak, so it frees).
 */
const FREE_AFTER_MS = 400;
const SUSTAIN_RATIO = 0.5;

/**
 * After free scrolling stops, how long before re-seating on a reveal. Must stay
 * above the spacing between notches during sustained scrolling, or it fires
 * mid-scroll and yanks the reader.
 *
 * ⚠️ It used to ALSO poll until `lenis.isScrolling` went false, which meant
 * waiting out Lenis' own ~1.1s ease on top — up to ~1.5s of nothing, and a wait
 * whose length varied with how hard the reader had scrolled ("the delays are
 * random too for each beat"). That poll is gone: `scrollTo` with `force` simply
 * replaces Lenis' in-flight animation, so there is nothing to wait for.
 */
const RESEAT_DELAY_MS = 260;

/**
 * power2.out — moves at once, then eases into the reveal. No overshoot, ever;
 * never use a back/elastic ease here.
 *
 * ⚠️ NOT `power2.inOut`, which is what shipped first. An in-out ease is nearly
 * stationary for its first ~15%, so on a 1.7-3s ride the reader flicks and sees
 * nothing move for ~300ms — read as *"reduce the gap between the flick
 * detection and action."* The ride already starts on the very first wheel
 * event; the latency was entirely in the ease. Starting at full speed also
 * matches Lenis' own easeOutExpo, so a ride reads like the page's normal
 * scrolling rather than a separate animation.
 */
const easeOut = (t: number) => 1 - Math.pow(1 - t, 2);

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
  /** Strongest |deltaY| seen in this burst — the decay yardstick. */
  let burstPeakAbs = 0;
  /** Reader is scrolling freely; we claim nothing until the burst ends. */
  let free = false;
  let lastDir: 1 | -1 = 1;
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
      easing: easeOut,
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
   *  direction they were already going. */
  const scheduleReseat = () => {
    window.clearTimeout(reseat);
    reseat = window.setTimeout(() => {
      const st = opts.getTrigger();
      const lenis = lenisRef.current;
      if (!st || !lenis || !st.isActive) return;
      free = false;
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
      free = false;
      burstStartedAt = t;
      burstPeakAbs = 0;
    }
    burstPeakAbs = Math.max(burstPeakAbs, absDelta);

    const isPush = gap > PUSH_GAP_MS;
    lastInputAt = t;
    lastDir = d;

    if (!claim(d)) {
      // Outside the pin, or nothing left in that direction — normal scrolling.
      free = false;
      window.clearTimeout(reseat);
      return;
    }

    // Reader has the scroll. Don't claim, don't preventDefault.
    if (free) {
      scheduleReseat();
      return;
    }

    // Still delivering near-peak deltas well into the burst → this is real
    // scrolling, not a flick coasting on momentum. Get out of the way.
    if (
      t - burstStartedAt > FREE_AFTER_MS &&
      absDelta >= burstPeakAbs * SUSTAIN_RATIO
    ) {
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
    // Keys carry no delta. Feeding a constant keeps it at the burst peak, so
    // held auto-repeat correctly reads as sustained scrolling and frees.
    if (d) drive(e, d, 100);
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
