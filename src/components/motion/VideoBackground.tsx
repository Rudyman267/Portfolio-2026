"use client";

import { useEffect, useRef, useState } from "react";
import { ShaderBackground } from "@/components/motion/ShaderBackground";
import { markHeroVideoReady } from "@/components/motion/heroReady";
import { LOADER_DONE_EVENT } from "@/components/motion/Loader";

/**
 * Hero background — the 4K "light trails" VJ loop (transcoded to 1080p WebM/MP4),
 * playing muted/looped/inline behind the hero content.
 *
 * Fill (matches Figma): the video sits at 57% opacity over a solid #000000 base,
 * so the trails stay subdued and the cream headline reads cleanly.
 *
 * Layering, back to front:
 *   1. solid black base + poster JPG (instant paint / reduced-motion still)
 *   2. the looping video at 57% opacity (fades in once it can play)
 *   3. ShaderBackground fallback ONLY if the video can't decode
 *
 * Loading: the video preloads while the door loader runs and signals readiness
 * (markHeroVideoReady) once it can play through — the loader waits for this so
 * the door only unlocks when the video is buffered. On LOADER_DONE it force-plays
 * so the reveal never opens onto a paused frame.
 *
 * Reduced motion: no video, no shader — just the poster still (still signals
 * ready so the loader isn't blocked).
 * Perf: pauses when the tab is hidden or the hero scrolls out of view.
 */

const FILL_OPACITY = 0.57; // Figma: Video fill @ 57% over #000000

export function VideoBackground() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [reduced, setReduced] = useState(false);
  const [canPlay, setCanPlay] = useState(false);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    const isReduced = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches;
    setReduced(isReduced);
    // reduced-motion has no video to wait on — don't block the loader
    if (isReduced) markHeroVideoReady();
  }, []);

  useEffect(() => {
    if (reduced) return;
    const video = videoRef.current;
    if (!video) return;

    let visible = true;
    const tryPlay = () => {
      if (!visible || document.hidden) return;
      video.play().catch(() => {
        /* autoplay can reject — poster stays; not a hard failure */
      });
    };

    // canplaythrough = buffered enough to play to the end without stalling.
    const onReady = () => {
      setCanPlay(true);
      markHeroVideoReady(); // let the loader unlock the door
      tryPlay();
    };
    const onError = () => {
      setFailed(true);
      markHeroVideoReady(); // fall back to shader; never hang the loader
    };
    video.addEventListener("canplaythrough", onReady);
    video.addEventListener("canplay", onReady); // safety on browsers that delay CPT
    video.addEventListener("error", onError);

    // when the door finishes opening, force a play — the element is now visible
    // and un-occluded, so this beats any earlier throttled/rejected attempt.
    const onLoaderDone = () => tryPlay();
    window.addEventListener(LOADER_DONE_EVENT, onLoaderDone);

    const onVisibility = () => {
      if (document.hidden || !visible) video.pause();
      else tryPlay();
    };
    document.addEventListener("visibilitychange", onVisibility);

    const io = new IntersectionObserver(
      ([entry]) => {
        visible = entry.isIntersecting;
        onVisibility();
      },
      { threshold: 0.01 },
    );
    io.observe(video);

    // never block the loader indefinitely if the network stalls
    const failsafe = window.setTimeout(markHeroVideoReady, 8000);

    // kick the load explicitly (some browsers wait for interaction otherwise)
    video.load();

    return () => {
      video.removeEventListener("canplaythrough", onReady);
      video.removeEventListener("canplay", onReady);
      video.removeEventListener("error", onError);
      window.removeEventListener(LOADER_DONE_EVENT, onLoaderDone);
      document.removeEventListener("visibilitychange", onVisibility);
      io.disconnect();
      window.clearTimeout(failsafe);
    };
  }, [reduced]);

  return (
    <div
      className="pointer-events-none absolute inset-0 overflow-hidden bg-black"
      aria-hidden="true"
    >
      {/* poster still — instant paint + the reduced-motion background,
          held at the same 57% fill so it matches the video layer */}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src="/videos/hero-trails-poster.jpg"
        alt=""
        className="absolute inset-0 h-full w-full object-cover"
        style={{ opacity: FILL_OPACITY }}
      />

      {!reduced && !failed && (
        <video
          ref={videoRef}
          className="absolute inset-0 h-full w-full object-cover transition-opacity duration-700"
          style={{ opacity: canPlay ? FILL_OPACITY : 0 }}
          muted
          loop
          playsInline
          preload="auto"
          poster="/videos/hero-trails-poster.jpg"
        >
          {/* WebM first (smaller); MP4 fallback for Safari/iOS */}
          <source src="/videos/hero-trails.webm" type="video/webm" />
          <source src="/videos/hero-trails.mp4" type="video/mp4" />
        </video>
      )}

      {/* animated shader only if the video genuinely can't run */}
      {!reduced && failed && (
        <div style={{ opacity: FILL_OPACITY }} className="absolute inset-0">
          <ShaderBackground />
        </div>
      )}
    </div>
  );
}
