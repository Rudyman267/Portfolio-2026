"use client";

/**
 * PersonaCarousel — the four ORO buyer personas (R1–R4) in one navigable frame
 * instead of four stacked slides.
 *
 * WHY A CAROUSEL
 * The personas are evidence, not the spine of the story — showing all four full
 * boards in a column buries the argument under a wall of persona art. One board
 * at a time, with prev/next + dots, keeps the section tight while still letting
 * a reader step through every profile.
 *
 * DESIGN
 *  - NO panel/box. The boards are flattened onto the page colour (see
 *    oro-assets.mjs), so they sit directly on the canvas; the cards read via
 *    their own hairline borders.
 *  - Slides come and go with a calm fade + a small (<=24px) directional slide —
 *    the house motion register. GSAP timeline, gated by prefers-reduced-motion.
 *  - The role label under the frame changes with the slide.
 */

import { useEffect, useRef, useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { gsap, useGSAP } from "@/lib/gsap";
import { cn } from "@/lib/utils";

export type Persona = { src: string; name: string; role: string; alt: string };

const SLIDE = 24; // px — keep movement small and calm

export function PersonaCarousel({ personas }: { personas: Persona[] }) {
  const [index, setIndex] = useState(0);
  const root = useRef<HTMLDivElement>(null);
  const prev = useRef(0);
  const dir = useRef(1);
  const reduced = useRef(false);

  useEffect(() => {
    reduced.current = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  }, []);

  const select = (next: number) => {
    if (next === index) return;
    dir.current = next > index ? 1 : -1;
    setIndex(next);
  };
  const go = (step: number) => {
    dir.current = step;
    setIndex((i) => (i + step + personas.length) % personas.length);
  };

  useGSAP(
    () => {
      const layers = gsap.utils.toArray<HTMLElement>("[data-persona]");
      const label = root.current?.querySelector<HTMLElement>("[data-persona-label]");
      const from = prev.current;
      const d = dir.current;

      layers.forEach((el, i) => {
        if (i === index) {
          if (reduced.current) {
            gsap.set(el, { autoAlpha: 1, x: 0 });
          } else {
            gsap.fromTo(
              el,
              { autoAlpha: 0, x: from === index ? 0 : d * SLIDE },
              { autoAlpha: 1, x: 0, duration: 0.5, ease: "power2.out" },
            );
          }
        } else if (i === from && from !== index && !reduced.current) {
          gsap.to(el, { autoAlpha: 0, x: -d * SLIDE, duration: 0.5, ease: "power2.out" });
        } else {
          gsap.set(el, { autoAlpha: 0 });
        }
      });

      if (label && from !== index && !reduced.current) {
        gsap.fromTo(label, { autoAlpha: 0, y: 6 }, { autoAlpha: 1, y: 0, duration: 0.45, ease: "power2.out" });
      }

      prev.current = index;
    },
    { scope: root, dependencies: [index] },
  );

  const navBtn =
    "flex h-11 w-11 items-center justify-center rounded-full border border-white/15 text-fg transition-colors hover:border-[var(--color-accent)] hover:text-[var(--color-accent)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-accent)]";

  return (
    <figure ref={root} className="w-full">
      <div className="relative aspect-[2000/760] w-full">
        {personas.map((p, i) => (
          /* eslint-disable-next-line @next/next/no-img-element */
          <img
            key={p.src}
            data-persona
            src={p.src}
            alt={p.alt}
            className="absolute inset-0 h-full w-full object-contain"
            style={{ opacity: i === 0 ? 1 : 0, visibility: i === 0 ? "visible" : "hidden" }}
            loading="eager"
            draggable={false}
          />
        ))}
      </div>

      {/* controls */}
      <div className="mt-7 flex items-center justify-center gap-5">
        <button type="button" onClick={() => go(-1)} className={navBtn} aria-label="Previous persona">
          <ChevronLeft size={18} />
        </button>

        <div className="flex items-center gap-2.5" role="tablist" aria-label="Personas">
          {personas.map((p, i) => (
            <button
              key={p.src}
              type="button"
              role="tab"
              aria-selected={i === index}
              aria-label={p.name}
              onClick={() => select(i)}
              className={cn(
                "h-2 rounded-full transition-all duration-300",
                i === index
                  ? "w-6 bg-[var(--color-accent)]"
                  : "w-2 bg-white/25 hover:bg-white/50",
              )}
            />
          ))}
        </div>

        <button type="button" onClick={() => go(1)} className={navBtn} aria-label="Next persona">
          <ChevronRight size={18} />
        </button>
      </div>

      <p
        data-persona-label
        className="mt-4 text-center text-[length:var(--lir-caption)] leading-[1.5] text-muted"
      >
        <span className="font-medium text-fg">{personas[index].name}</span>
        {" — "}
        {personas[index].role}
      </p>
    </figure>
  );
}
