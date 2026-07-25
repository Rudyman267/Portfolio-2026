"use client";

import { useEffect, useRef, type ReactNode } from "react";
import { animate, stagger, svg, utils } from "animejs";

/* ============================================================================
   anime.js motion for the Verkos case study.

   WHY anime.js AND NOT GSAP HERE: the case-study SHELL (LirCaseStudy + Chapter)
   uses GSAP ScrollTrigger, which owns the scroll timeline, the pin, and all
   scroll-position measurement. Mixing a second scroll-scrubbing engine into
   that would fight those measurements. So the division is clean:

     • GSAP / ScrollTrigger  → anything driven by SCROLL POSITION (chapter flash
                                timing, scrub, pin). Untouched.
     • anime.js (here)        → self-playing, ONE-SHOT motion fired on ENTER via
                                an IntersectionObserver — no scroll scrubbing, so
                                it never touches ScrollTrigger's world. Zero
                                conflict by construction.

   These add the extra "taste" layer on the Verkos page: staggered content
   reveals and vector/SVG path draws that play as each block arrives.
   Reduced motion: elements are shown immediately, no animation.
   ========================================================================== */

const REDUCED = () =>
  typeof window !== "undefined" &&
  window.matchMedia("(prefers-reduced-motion: reduce)").matches;

/** Fire `play` once when the element first crosses into view (12% margin). */
function useInViewOnce(
  ref: React.RefObject<HTMLElement | null>,
  play: () => void,
) {
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (REDUCED()) {
      // reveal instantly — never leave content hidden for reduced-motion users
      utils.set(el.querySelectorAll("[data-anime-child]"), {
        opacity: 1,
        translateY: 0,
      });
      return;
    }
    let done = false;
    const io = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          if (e.isIntersecting && !done) {
            done = true;
            play();
            io.disconnect();
          }
        }
      },
      { rootMargin: "0px 0px -12% 0px", threshold: 0.15 },
    );
    io.observe(el);
    return () => io.disconnect();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
}

/**
 * AnimeReveal — staggered rise + fade of its direct children as it enters view.
 * Each child that should animate gets `data-anime-child` (added automatically to
 * direct element children). Understated on purpose (matches the study's budget):
 * 18px rise, 0.55s, out-expo, 70ms stagger.
 */
export function AnimeReveal({
  children,
  className,
  y = 18,
  stagger: step = 70,
}: {
  children: ReactNode;
  className?: string;
  y?: number;
  stagger?: number;
}) {
  const ref = useRef<HTMLDivElement>(null);

  useInViewOnce(ref, () => {
    const el = ref.current;
    if (!el) return;
    const kids = el.querySelectorAll("[data-anime-child]");
    if (!kids.length) return;
    animate(kids, {
      opacity: [0, 1],
      translateY: [y, 0],
      duration: 550,
      delay: stagger(step),
      ease: "outExpo",
    });
  });

  return (
    <div ref={ref} className={className} data-anime-reveal>
      {/* tag direct children so the reveal animates them; pre-hide via inline
          style so there's no flash before anime.js takes over */}
      {Array.isArray(children)
        ? children.map((c, i) => (
            <div
              key={i}
              data-anime-child
              style={{ opacity: 0, willChange: "transform,opacity" }}
            >
              {c}
            </div>
          ))
        : (
            <div
              data-anime-child
              style={{ opacity: 0, willChange: "transform,opacity" }}
            >
              {children}
            </div>
          )}
    </div>
  );
}

/**
 * InlineSvg — fetches an external .svg file, injects it inline (so anime.js can
 * reach its geometry), and on enter draws its stroked paths in while fading up
 * its filled paths (text/arrows). Used for the real Reframe/persona diagram
 * exported from Figma (pure vector), which is too large to hand-inline.
 */
export function InlineSvg({
  src,
  className,
  drawDuration = 1400,
}: {
  src: string;
  className?: string;
  drawDuration?: number;
}) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const host = ref.current;
    if (!host) return;
    let cancelled = false;

    fetch(src)
      .then((r) => r.text())
      .then((markup) => {
        if (cancelled || !host) return;
        host.innerHTML = markup;
        const el = host.querySelector("svg");
        if (!el) return;
        el.removeAttribute("width");
        el.removeAttribute("height");
        el.style.width = "100%";
        el.style.height = "auto";
        el.style.display = "block";

        if (REDUCED()) return; // leave fully visible, no animation

        // split geometry: STROKED paths draw in; FILLED paths (text/arrows/icon,
        // the star logo) FADE in place. Critically we only touch OPACITY on the
        // fills — never translate/transform them: many carry their own transform
        // (the star's rotated petals), and adding a translate would fight it and
        // scatter the shape. Fade-only guarantees the final state is the exact
        // SVG, whatever the animation.
        const all = Array.from(el.querySelectorAll<SVGElement>("path, line, polyline"));
        const strokes = all.filter((n) => {
          const s = n.getAttribute("stroke");
          return s && s !== "none";
        });
        const fills = Array.from(
          el.querySelectorAll<SVGElement>('[fill]:not([fill="none"])'),
        );
        // pre-hide (opacity only — no transform written)
        utils.set(fills, { opacity: 0 });

        let played = false;
        const play = () => {
          if (played) return;
          played = true;
          if (strokes.length) {
            const drawables = svg.createDrawable(strokes);
            animate(drawables, {
              draw: ["0 0", "0 1"],
              duration: drawDuration,
              delay: stagger(120),
              ease: "inOutQuad",
              // guarantee the strokes end fully drawn even if interrupted
              onComplete: () => utils.set(drawables, { draw: "0 1" }),
            });
          }
          animate(fills, {
            opacity: [0, 1],
            duration: 650,
            delay: stagger(5, { start: drawDuration * 0.3 }),
            ease: "outQuad",
            // hard-guarantee the final look: every fill fully opaque, in place
            onComplete: () => utils.set(fills, { opacity: 1 }),
          });
        };

        const io = new IntersectionObserver(
          (entries) => {
            for (const e of entries) {
              if (e.isIntersecting) {
                play();
                io.disconnect();
              }
            }
          },
          { rootMargin: "0px 0px -12% 0px", threshold: 0.12 },
        );
        io.observe(host);
      })
      .catch(() => {
        /* leave empty host; caption still shows */
      });

    return () => {
      cancelled = true;
    };
  }, [src, drawDuration]);

  return <div ref={ref} className={className} data-inline-svg />;
}

/**
 * AnimeVectorDraw — draws the strokes of an inline SVG in as it enters view
 * (line-drawing effect), then optionally fades in any non-stroke children. Pass
 * the SVG as children; every <path>/<line>/<polyline> inside is drawn. Used for
 * the pipeline + persona diagrams so their connective vectors trace themselves.
 */
export function AnimeVectorDraw({
  children,
  className,
  duration = 1100,
}: {
  children: ReactNode;
  className?: string;
  duration?: number;
}) {
  const ref = useRef<HTMLDivElement>(null);

  useInViewOnce(ref, () => {
    const el = ref.current;
    if (!el) return;
    const strokes = el.querySelectorAll<SVGElement>(
      "path, line, polyline, polygon",
    );
    if (strokes.length) {
      // createDrawable turns each geometry into a drawable (dash offset 0→1)
      const drawables = svg.createDrawable(Array.from(strokes));
      animate(drawables, {
        draw: ["0 0", "0 1"],
        duration,
        delay: stagger(90),
        ease: "inOutQuad",
      });
    }
    // fade any labels/nodes that aren't strokes
    const labels = el.querySelectorAll("[data-anime-child]");
    if (labels.length) {
      animate(labels, {
        opacity: [0, 1],
        translateY: [10, 0],
        duration: 600,
        delay: stagger(80, { start: duration * 0.4 }),
        ease: "outExpo",
      });
    }
  });

  return (
    <div ref={ref} className={className} data-anime-vector>
      {children}
    </div>
  );
}
