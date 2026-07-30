"use client";

import { useEffect, useState } from "react";
import { LOADER_DONE_EVENT } from "@/components/motion/Loader";
import { NowPlaying } from "./NowPlaying";

/**
 * Pins the NowPlaying widget to the home page's bottom-right corner (matching
 * the user's reference), and holds it back until the intro has handed off.
 *
 * WHY IT WAITS: the widget would otherwise be sitting under the loader overlay
 * during the intro, and it fades in the moment the reveal starts — which reads
 * as a second thing competing for attention exactly when the hero is arriving.
 * It appears once the site is actually on screen.
 *
 * `pointer-events-none` on the wrapper with `pointer-events-auto` on the button
 * (in NowPlaying) so the fixed layer never eats clicks meant for the hero
 * behind it — the wrapper spans a whole corner but only the pill is clickable.
 */
export function NowPlayingMount() {
  const [shown, setShown] = useState(false);
  /**
   * True once the closing footer scene is on screen.
   *
   * The footer now carries its own "Now playing" control, so the floating one
   * must get out of the way — two identical toggles on screen at once is
   * confusing, and this one is pinned bottom-right where it would sit on top of
   * the footer's back-to-top button and the giant RUDYMAN wordmark.
   * Same pattern the Header already uses to collapse its nav over the footer.
   */
  const [atFooter, setAtFooter] = useState(false);

  useEffect(() => {
    const footer = document.getElementById("contact");
    if (!footer) return;
    const update = () => {
      const r = footer.getBoundingClientRect();
      setAtFooter(r.top < window.innerHeight * 0.9 && r.bottom > 0);
    };
    update();
    window.addEventListener("scroll", update, { passive: true });
    window.addEventListener("resize", update, { passive: true });
    return () => {
      window.removeEventListener("scroll", update);
      window.removeEventListener("resize", update);
    };
  }, []);

  useEffect(() => {
    // If the loader already finished before this mounted (fast nav, or a
    // reduced-motion path that dismissed instantly) `is-loading` is gone and
    // the event will never fire again — so check the class too rather than
    // waiting forever for an event that has already passed.
    if (!document.body.classList.contains("is-loading")) {
      setShown(true);
      return;
    }
    const onDone = () => setShown(true);
    window.addEventListener(LOADER_DONE_EVENT, onDone);
    // Failsafe, same reasoning as the loader's own ceiling: never let a missed
    // event permanently hide a control.
    const t = window.setTimeout(() => setShown(true), 14000);
    return () => {
      window.removeEventListener(LOADER_DONE_EVENT, onDone);
      window.clearTimeout(t);
    };
  }, []);

  // Gates BOTH opacity and hit-testing. Fading alone would leave an invisible
  // but still-clickable target sitting over the footer's back-to-top button.
  // `visibility` is transitioned alongside opacity (not switched instantly) so
  // the fade still plays: the browser applies `visible` immediately on the way in
  // and defers `hidden` to the end of the transition on the way out.
  const visible = shown && !atFooter;

  return (
    <div
      aria-hidden={!visible}
      // `hidden sm:block` — DESKTOP ONLY. On a phone the compact waveform lives
      // in the header (always on screen, next to the hamburger), so showing this
      // one too would put two identical controls on a small viewport.
      className={`pointer-events-none fixed bottom-[clamp(14px,2.5vh,28px)] right-[clamp(14px,2.5vw,36px)] z-[60] hidden sm:block ${
        visible ? "opacity-100" : "opacity-0"
      }`}
      style={{
        visibility: visible ? "visible" : "hidden",
        transition:
          "opacity 500ms ease-out, visibility 0ms linear " +
          (visible ? "0ms" : "500ms"),
      }}
    >
      <NowPlaying />
    </div>
  );
}
