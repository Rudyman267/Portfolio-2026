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

  return (
    <div
      className={`pointer-events-none fixed bottom-[clamp(14px,2.5vh,28px)] right-[clamp(14px,2.5vw,36px)] z-[60] transition-opacity duration-700 ease-out ${
        shown ? "opacity-100" : "opacity-0"
      }`}
    >
      <NowPlaying />
    </div>
  );
}
