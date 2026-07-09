"use client";

import { useRef, useState } from "react";
import { gsap, useGSAP, ScrollTrigger } from "@/lib/gsap";
import { whenHeroVideoReady } from "@/components/motion/heroReady";

/** Fired on window when the intro finishes so the hero can begin its reveal. */
export const LOADER_DONE_EVENT = "loader:done";

/**
 * Frying-pan intro — this IS the loader (Figma 124:80).
 *
 * A white line-art frying pan sits centred on a black void, tossing a pancake
 * in a loop while the page loads. "cooking" (EB Garamond italic) sits beneath
 * it and a huge bold counter runs in the bottom-left corner. The counter
 * reflects REAL loading (eases to 90, holds for the hero, then 90→100); when
 * it lands the label swaps to "click to enter" and the counter fades.
 *
 * On click the pan gives one final flick — the pancake sails off the top of
 * the screen — and the black overlay opens a circular hole from the pan's
 * position that expands until the hero underneath fills the viewport.
 * NO white flash anywhere: the hero is revealed directly through the shape.
 *
 * Runs once per full page load. Emits `LOADER_DONE_EVENT` partway through the
 * reveal so the hero headline rises while it's being unveiled. Reduced-motion
 * users skip it entirely and see the site immediately.
 */

/** Figma line-art pan (Group 9, viewBox 284.897 × 113.313), inlined so GSAP
 *  can drive it directly and the strokes stay crisp at any size. */
function PanArt() {
  return (
    <svg
      className="pan__svg block w-full overflow-visible will-change-transform"
      viewBox="0 0 284.897 113.313"
      fill="none"
      aria-hidden="true"
      // Pivot at the HANDLE end (far-right of the viewBox, where a hand would
      // grip it) so the toss rotates/lifts around the handle, not the bowl.
      style={{ transformOrigin: "90% 10%" }}
    >
      <path
        d="M267.66 0.230469V0.231445C270.614 0.282435 273.541 0.379531 276.521 0.634766V0.635742H276.535C278.356 0.682981 280.483 1.67559 282.111 3.16504C283.741 4.65579 284.825 6.59928 284.649 8.51855C284.507 10.0861 283.661 11.3455 282.367 12.375C281.07 13.4072 279.334 14.1988 277.445 14.8223C273.661 16.0715 269.355 16.622 266.869 17.1318C255.016 19.5636 243.302 21.5637 232.064 26.3047C222.95 30.1508 215.759 35.9156 208.452 42.3232L208.39 42.3779L208.377 42.4609C205.376 62.7347 198.109 78.6875 186.521 90.1865C174.934 101.685 159.005 108.751 138.644 111.214C108.653 114.84 76.662 113.586 47.7891 103.969C39.2811 101.133 30.7636 95.7951 23.6455 90.4766H23.6445C22.921 89.9215 20.5599 88.0835 18.2988 86.248C17.1665 85.3289 16.0606 84.4111 15.1992 83.6563C14.7684 83.2787 14.4 82.9434 14.1211 82.6699C13.8351 82.3895 13.6626 82.192 13.6006 82.0859C8.45967 73.342 5.12215 63.3719 1.95703 53.7891C-0.0555058 47.6959 -0.211146 42.6435 0.977539 38.4131C2.16611 34.1831 4.70523 30.7519 8.12012 27.9121C14.96 22.2242 25.2839 18.9297 35.1934 16.3643L35.1943 16.3652C49.415 12.8326 63.9456 10.6937 78.5791 9.98047L79.9961 9.91602C104.564 8.81361 129.792 11.3299 153.949 15.7979C163.924 17.6425 174.383 20.0339 183.883 23.5342C188.609 25.2752 192.343 27.3156 196.675 29.8633L196.796 29.9346L196.914 29.8594C218.449 16.0793 238.785 2.03093 264.933 0.317383H264.935C265.842 0.248163 266.753 0.218519 267.66 0.230469Z"
        stroke="white"
        strokeWidth="0.457294"
      />
      <path
        d="M80.7509 10.6253C110.794 9.37656 142.751 13.368 171.992 20.5853C173.256 20.8971 174.522 21.4312 175.801 21.9945C177.073 22.5548 178.36 23.1446 179.639 23.5511V23.5521C189.799 26.856 201.122 32.3243 203.879 43.5472C204.684 46.8264 203.94 50.8011 201.963 53.5491C197.622 59.4394 189.508 63.9119 180.778 67.221C172.602 70.3204 163.92 72.3862 157.379 73.6448L156.1 73.8861C144.3 75.9644 132.355 77.1166 120.375 77.3333H120.373C107.338 77.6905 86.5401 77.2273 66.2802 74.806C56.1503 73.5953 46.1586 71.8952 37.3417 69.5657C28.5217 67.2355 20.8922 64.2791 15.4745 60.5618C11.2507 57.6644 7.66072 53.7734 6.7411 48.6312C5.8089 43.4192 7.69836 38.1481 10.7011 33.8792C17.225 24.6054 29.084 19.0304 40.0634 17.2044C41.8094 16.914 44.0599 16.6083 46.2421 16.6439C48.4311 16.6796 50.5125 17.0593 51.952 18.1048C52.743 18.6791 53.2374 19.4024 53.4003 20.3607C53.6133 21.6152 53.2845 23.202 52.5936 24.9632C51.9051 26.7183 50.8689 28.6178 49.703 30.4866C47.371 34.2247 44.5369 37.8122 42.9725 39.8362C39.7631 43.9885 36.3899 47.9686 33.1337 52.0989L32.7938 52.5286L33.3388 52.4671C56.6639 49.8381 79.4126 45.2939 102.991 43.845C126.443 42.4039 151.055 42.409 170.662 57.1458L171.592 57.8587C172.559 58.6146 173.483 59.4506 174.415 60.2884C175.344 61.124 176.282 61.9612 177.267 62.7073L177.348 62.7679L177.446 62.7503L177.769 62.6907L178.017 62.6458L177.948 62.4027C177.849 62.0582 177.593 61.6649 177.247 61.2474C176.896 60.8246 176.435 60.3568 175.897 59.8636C174.822 58.8768 173.429 57.7735 171.98 56.7025C169.084 54.5612 165.942 52.5319 164.623 51.7952C151.051 44.2131 135.06 41.8907 118.786 41.8997C102.514 41.9088 85.9317 44.25 71.1796 46.013C60.5214 47.2868 45.9509 49.1846 35.4813 51.0277C39.0521 46.7541 47.5444 37.2133 51.8036 29.1273C52.9115 27.0239 53.7399 25.0062 54.119 23.1966C54.4976 21.3892 54.4327 19.7618 53.7196 18.4622C53.0024 17.1553 51.6544 16.2251 49.5653 15.765C47.5053 15.3113 44.7062 15.3096 41.0243 15.8577L40.9198 15.7249C54.0308 12.9141 67.355 11.2076 80.7518 10.6263L80.7509 10.6253Z"
        stroke="white"
        strokeWidth="0.457294"
      />
      <path
        d="M270.645 1.30251C272.398 1.09002 276.346 1.02766 276.524 3.37912C276.168 4.2175 275.628 4.41249 274.842 4.85547C273.254 4.79754 269.215 3.53762 268.665 1.9321C269.198 1.30893 269.625 1.45264 270.645 1.30251Z"
        fill="white"
      />
      <path
        d="M30.8214 18.1032C32.5131 17.3321 38.6394 15.9829 40.5124 15.5779L40.9268 16.1032C37.1277 16.7962 34.7759 17.3407 31.1296 18.5863L30.8214 18.1032Z"
        fill="#B9BCBF"
      />
    </svg>
  );
}

export function Loader() {
  const root = useRef<HTMLDivElement>(null);
  const countRef = useRef<HTMLSpanElement>(null);
  const tossRef = useRef<gsap.core.Timeline | null>(null);
  const [done, setDone] = useState(false);
  const [ready, setReady] = useState(false); // load hit 100 → pan unlocks
  const openedRef = useRef(false);

  const finish = () => {
    window.dispatchEvent(new Event(LOADER_DONE_EVENT));
    document.body.classList.remove("is-loading");
    ScrollTrigger.refresh();
    setDone(true);
  };

  useGSAP(
    () => {
      const prefersReduced = window.matchMedia(
        "(prefers-reduced-motion: reduce)",
      ).matches;

      if (prefersReduced) {
        finish();
        return;
      }

      document.body.classList.add("is-loading");

      // Entrance — pan settles in, label + counter rise after it.
      gsap.set(".pan__group", { scale: 0.82, opacity: 0, y: 12 });
      gsap.set(".pan__label", { opacity: 0, y: 8 });
      gsap.set(".pan__count", { opacity: 0, y: 14 });
      gsap
        .timeline({ defaults: { ease: "expo.out" } })
        .to(".pan__group", { scale: 1, opacity: 1, y: 0, duration: 1.0 })
        .to(".pan__label", { opacity: 1, y: 0, duration: 0.6 }, "-=0.5")
        .to(".pan__count", { opacity: 1, y: 0, duration: 0.6 }, "<");

      // The tossing loop, built so the pancake's flight reads as REAL physics
      // driven by the pan — every phase of the pancake is causally tied to what
      // the pan is doing at that instant:
      //
      //   t=0.00  WINDUP  — pan dips back & down, loading the throw. Pancake
      //                     rides with the pan (glued to the bowl).
      //   t=0.24  FLICK   — pan snaps UP fast; at the top of the flick the
      //                     pancake LAUNCHES with the pan's upward velocity.
      //   ~AIR    FLIGHT  — pancake is a projectile: a single symmetric
      //                     parabola (decelerate up, accelerate down under
      //                     "gravity") while it spins one full flip. The pan is
      //                     NOT touching it, so the pan recovers to rest and
      //                     waits underneath.
      //   IMPACT  CATCH   — the instant the pancake returns to bowl level, the
      //                     pan dips to ABSORB it (give with the momentum), then
      //                     springs back — a visible catch, not a hard stop.
      //
      // A real pancake flip is powered by a DIP-DOWN then a fast WHIP-UP: the
      // pan drops to load, then swings back up hard, and the pancake — riding
      // the pan all the way down and back up — gets flung off as the pan whips
      // up THROUGH and past its rest level. So the launch comes from BELOW, on
      // the up-stroke, not from a flick starting at rest.
      //
      // Timing (the pan drives everything; pancake is glued until DIP→launch):
      const DIP_DEPTH = 20; // how far the pan drops on the windup
      const DIP_AT = 0.42; // pan reaches the BOTTOM of the dip here
      const LAUNCH_AT = 0.6; // pan whips back UP through rest → pancake flies
      const WHIP_TOP = -16; // small overshoot above rest as the pan tops its whip
      const AIR = 0.86; // pancake airborne time (a touch longer = smoother flip)
      const APEX = -116; // peak height of the pancake above the bowl
      const IMPACT = LAUNCH_AT + AIR;

      const toss = gsap.timeline({ repeat: -1, repeatDelay: 0.7, delay: 1.05 });

      toss
        // WINDUP / DIP — pan sinks DOWN and tips the bowl DOWN to scoop (the
        // front lip drops, like loading a throw). Pivot is at the handle, so a
        // NEGATIVE rotation drops the bowl end; positive would lift it (which
        // read backwards — as if the pancake was pulling the pan up). Pancake
        // glued in the bowl, riding smoothly down with it.
        .to(".pan__svg", { y: DIP_DEPTH, rotation: -6, duration: DIP_AT, ease: "sine.inOut" }, 0)
        .to(".pan__cake", { y: DIP_DEPTH, duration: DIP_AT, ease: "sine.inOut" }, 0)

        // WHIP-UP — from the bottom the pan swings back up FAST and un-tilts.
        // The pancake stays glued through the up-stroke until the pan reaches
        // rest level (y:0) — that's the launch instant (LAUNCH_AT): the pan's
        // upward speed is highest here, so this is what flings the pancake.
        .to(".pan__svg", { y: 0, rotation: 0, duration: LAUNCH_AT - DIP_AT, ease: "power3.in" }, DIP_AT)
        .to(".pan__cake", { y: 0, duration: LAUNCH_AT - DIP_AT, ease: "power3.in" }, DIP_AT)

        // LAUNCH — pancake leaves the pan at rest level with the pan's upward
        // momentum and arcs freely: rise decelerating, fall accelerating (real
        // gravity), a gentle sideways drift, and ONE smooth flip across the arc.
        .to(".pan__cake", { y: APEX, duration: AIR / 2, ease: "power2.out" }, LAUNCH_AT)
        .to(".pan__cake", { y: 0, duration: AIR / 2, ease: "power2.in" }, LAUNCH_AT + AIR / 2)
        .to(".pan__cake", { x: 10, duration: AIR / 2, ease: "sine.out" }, LAUNCH_AT)
        .to(".pan__cake", { x: 0, duration: AIR / 2, ease: "sine.in" }, LAUNCH_AT + AIR / 2)
        .to(
          ".pan__cake",
          { rotation: 360, duration: AIR, ease: "none" }, // one steady flip
          LAUNCH_AT,
        )

        // pan CONTINUES its whip a touch past rest (natural follow-through of the
        // up-swing that threw the pancake), tops out at WHIP_TOP, then eases back
        // to rest and waits, level, under the airborne pancake.
        .to(".pan__svg", { y: WHIP_TOP, duration: 0.12, ease: "power1.out" }, LAUNCH_AT)
        .to(".pan__svg", { y: 0, duration: 0.34, ease: "sine.inOut" }, LAUNCH_AT + 0.12)

        // CATCH — timed to IMPACT: the pan gives downward to absorb the pancake's
        // momentum, then springs back with a soft elastic settle. The pancake
        // lands with it — no hard mechanical stop.
        .to(".pan__svg", { y: 9, rotation: -2, duration: 0.11, ease: "power2.out" }, IMPACT)
        .to(".pan__cake", { y: 9, duration: 0.11, ease: "power2.out" }, IMPACT)
        .to(".pan__svg", { y: 0, rotation: 0, duration: 0.5, ease: "elastic.out(1, 0.5)" }, IMPACT + 0.11)
        .to(".pan__cake", { y: 0, duration: 0.5, ease: "elastic.out(1, 0.55)" }, IMPACT + 0.11)
        // reset drift for the next cycle (rotation already landed at 360 = flat).
        .set(".pan__cake", { rotation: 0, x: 0 });
      tossRef.current = toss;

      // Counter reflects REAL loading: eases to 90 over ~1.7s, holds until the
      // hero has buffered (whenHeroVideoReady), then 90→100 and unlocks.
      const counter = { value: 0 };
      const paint = () => {
        if (countRef.current) {
          countRef.current.textContent = String(Math.round(counter.value));
        }
      };

      gsap.to(counter, {
        value: 90,
        duration: 1.7,
        ease: "power2.out",
        delay: 0.35,
        onUpdate: paint,
        onComplete: () => {
          whenHeroVideoReady().then(() => {
            gsap.to(counter, {
              value: 100,
              duration: 0.4,
              ease: "power2.inOut",
              onUpdate: paint,
              onComplete: () => {
                // dish served — counter bows out, prompt swaps in
                gsap.to(".pan__count", {
                  opacity: 0,
                  y: 10,
                  duration: 0.45,
                  ease: "power2.in",
                });
                setReady(true);
              },
            });
          });
        },
      });
    },
    { scope: root },
  );

  const openPan = () => {
    if (!ready || openedRef.current) return;
    openedRef.current = true;

    // Hand off to the hero partway through — while the hole is opening — so
    // the headline rises as the scene is being unveiled.
    let handedOff = false;
    const handOff = () => {
      if (handedOff) return;
      handedOff = true;
      window.dispatchEvent(new Event(LOADER_DONE_EVENT));
      document.body.classList.remove("is-loading");
      ScrollTrigger.refresh();
    };

    // Take over from the loop wherever it is — snap pan & pancake back to rest
    // (level, y:0) so the final throw starts from a clean, known state instead
    // of mid-arc.
    tossRef.current?.pause();
    gsap.to([".pan__svg", ".pan__cake"], {
      y: 0,
      x: 0,
      rotation: 0,
      duration: 0.18,
      ease: "power2.out",
      overwrite: true,
    });

    const tl = gsap.timeline({
      delay: 0.18, // let the settle above finish first
      onComplete: () => {
        handOff();
        setDone(true);
      },
    });

    // Same causal chain as the loop, but the throw is HARDER and the pancake
    // never returns — it clears the top of the screen. WINDUP → FLICK launches
    // the pancake at the flick's peak → it flies off decelerating under gravity.
    // Same dip-down → whip-up mechanic as the loop, but HARDER — the pancake
    // sails clean off the top of the screen and never returns.
    const OUT_DIP = 0.24; // pan reaches the bottom of the dip
    const OUT_LAUNCH = 0.4; // pan whips up through rest → pancake flies off
    const OUT_REVEAL = OUT_LAUNCH + 0.15; // hole opens just after launch
    tl
      .to(".pan__label", { opacity: 0, duration: 0.25 }, 0)
      // dip — pan (and pancake) sink down to load, tilting back to scoop.
      .to(".pan__svg", { y: 20, rotation: 8, duration: OUT_DIP, ease: "sine.inOut" }, 0)
      .to(".pan__cake", { y: 20, duration: OUT_DIP, ease: "sine.inOut" }, 0)
      // whip-up — pan swings up fast; pancake glued until it passes rest level.
      .to(".pan__svg", { y: 0, rotation: 0, duration: OUT_LAUNCH - OUT_DIP, ease: "power3.in" }, OUT_DIP)
      .to(".pan__cake", { y: 0, duration: OUT_LAUNCH - OUT_DIP, ease: "power3.in" }, OUT_DIP)
      // launch — pancake flies off-screen decelerating (gravity), many flips.
      .to(
        ".pan__cake",
        { y: "-85vh", rotation: 1000, duration: 1.0, ease: "power1.out" },
        OUT_LAUNCH,
      )
      // pan follows through a touch past rest, then eases back down, now empty.
      .to(".pan__svg", { y: -16, duration: 0.12, ease: "power1.out" }, OUT_LAUNCH)
      .to(".pan__svg", { y: 0, duration: 0.4, ease: "sine.inOut" }, OUT_LAUNCH + 0.12)
      // 2. the reveal — a circular hole opens from the pan's spot and expands
      //    until the hero fills the screen. The overlay (pan included) is
      //    eaten by the mask as it grows: the site emerges from behind the pan.
      //    NO white — the hero is revealed directly.
      .add(handOff, OUT_REVEAL)
      .fromTo(
        root.current,
        { "--hole": 0 },
        { "--hole": 165, duration: 1.15, ease: "power2.inOut" },
        OUT_REVEAL,
      );
  };

  const onKey = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      openPan();
    }
  };

  if (done) return null;

  return (
    <div
      ref={root}
      className="fixed inset-0 z-[100] overflow-hidden bg-black"
      role="dialog"
      aria-label="Site intro"
      aria-modal="true"
      style={
        {
          // the exit reveal: a transparent circle punched through the black,
          // radius driven by --hole (in vmax) from the pan's position.
          "--hole": 0,
          maskImage:
            "radial-gradient(circle calc(var(--hole) * 1vmax) at 50% 46%, transparent 99%, black 100%)",
          WebkitMaskImage:
            "radial-gradient(circle calc(var(--hole) * 1vmax) at 50% 46%, transparent 99%, black 100%)",
        } as React.CSSProperties
      }
    >
      {/* centered pan group */}
      <button
        type="button"
        onClick={openPan}
        onKeyDown={onKey}
        disabled={!ready}
        aria-label={ready ? "Click to enter the site" : "Loading"}
        className={`pan__group absolute left-1/2 top-1/2 flex -translate-x-1/2 -translate-y-1/2 flex-col items-center bg-transparent ${
          ready ? "cursor-pointer" : "cursor-progress"
        }`}
      >
        {/* the pan + its pancake (Figma 124:82). Nudged RIGHT: the handle
            trails off to the right so the bowl (the visual mass) sits left of
            the geometric centre — this offset re-centres it VISUALLY. */}
        <span className="relative block w-[clamp(200px,22vw,300px)] translate-x-[13%]">
          <PanArt />
          {/* pancake — line-art ellipse resting DOWN IN the bowl (not on the
              rim): sits on the interior floor so it reads as inside the pan.
              Black fill occludes the rim/floor lines behind it. */}
          <svg
            className="pan__cake absolute will-change-transform"
            viewBox="0 0 64 18"
            aria-hidden="true"
            style={{ left: "27%", top: "40%", width: "26%", overflow: "visible" }}
          >
            <ellipse
              cx="32"
              cy="9"
              rx="30"
              ry="7.5"
              fill="black"
              stroke="white"
              strokeWidth="1.1"
            />
          </svg>
        </span>

        {/* label beneath the pan — EB Garamond Medium Italic (Figma 124:89).
            Nudged with the pan so it sits under the bowl, not the whole box. */}
        <span className="pan__label mt-6 translate-x-[13%] text-[clamp(24px,2.6vw,40px)] italic leading-none text-white [font-family:var(--font-eb-garamond)]">
          {ready ? "click to enter" : "cooking"}
        </span>
      </button>

      {/* loading counter — huge, bold, bottom-left (Figma 124:87) */}
      <span
        className="pan__count absolute bottom-[clamp(12px,3vh,40px)] left-[clamp(20px,4vw,64px)] text-[clamp(56px,7.5vw,96px)] font-bold leading-none text-white tabular-nums"
        aria-hidden="true"
      >
        <span ref={countRef}>0</span>
      </span>
    </div>
  );
}
