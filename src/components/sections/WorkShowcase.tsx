"use client";

import { useRef } from "react";
import Link from "next/link";
import type { Route } from "next";
import { gsap, useGSAP, ScrollTrigger, ease } from "@/lib/gsap";
import type { GalleryProject } from "@/lib/placeholderProjects";

/**
 * WorkShowcase — the alternating project cards on /work.
 *
 * Layout (from the user's Figma slide): cards alternate LEFT / RIGHT down the
 * page with generous vertical gap, each offset from centre so the pair reads as
 * one centred column of staggered plates rather than two rigid columns. On
 * phones the alternation collapses to a single centred stack.
 *
 * Hover: the thumbnail darkens under a solid #000 @ 20% scrim (the user's own
 * Figma treatment) and the title block lifts in. Deliberately NOT the case
 * study's zoom affordance — these are navigation targets, not inspectable
 * screenshots.
 *
 * Motion is GSAP/ScrollTrigger (scroll-position-driven, per the house rule):
 * each card rises + settles as it enters, with the image drifting at a slightly
 * different rate than its frame so the plate feels parallaxed against the
 * particle field behind it.
 */

/** Per-slug cover art. Slugs without one render the gradient placeholder. */
const COVER: Record<string, string> = {
  "live-incident-response": "/case-study/image-1.webp",
  "verkos-reports": "/case-study/verkos-cover.webp",
};

/** The study's headline — revealed ON the darkened image on hover. */
const KICKER: Record<string, string> = {
  "live-incident-response": "A situation room that assembles itself in 30s.",
  "verkos-reports": "AI powered automated security report generation",
};

/** The study's eyebrow — the accent-coloured discipline line under the kicker. */
const EYEBROW: Record<string, string> = {
  "live-incident-response":
    "corporate drone ops · emergency response · real-time collaboration",
  "verkos-reports":
    "drone operations · AI report generation · enterprise security",
};

function ProjectPlate({
  project,
  index,
}: {
  project: GalleryProject;
  index: number;
}) {
  const cover = COVER[project.slug];
  const kicker = KICKER[project.slug] ?? project.summary;
  const eyebrow = EYEBROW[project.slug] ?? project.tags.join(" · ");
  // even → left, odd → right (matches the Figma slide's zig-zag)
  const left = index % 2 === 0;

  return (
    <div
      data-plate
      className={`flex w-full ${
        left ? "justify-start lg:pr-[16%]" : "justify-end lg:pl-[16%]"
      }`}
    >
      <Link
        href={`/work/${project.slug}` as Route}
        data-card
        aria-label={`${project.title} — open case study`}
        // Scales with the viewport instead of a hard 580px cap. On a wide
        // monitor (2300px+) a fixed-width plate left the page reading as an
        // almost-empty dark field with a small card adrift in it — which is
        // what "the content disappears as I scroll" actually looked like.
        className="group block w-full max-w-[min(46vw,760px)] focus-visible:outline-none"
      >
        {/* THE PLATE. At rest it's a CLEAN image — no type over it. Putting the
            title on the art at rest made it illegible over bright photography
            (the gate shot is mostly sky and white truck). The reveal is the
            hover state below, which is how the Figma slide reads. */}
        <div className="relative overflow-hidden rounded-[4px] border border-white/25 bg-[#0b0d12]">
          <div className="relative aspect-[16/10] w-full overflow-hidden">
            {cover ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                data-cover
                src={cover}
                alt=""
                className="absolute inset-0 h-full w-full scale-[1.06] object-cover"
                loading="lazy"
              />
            ) : (
              <div className="absolute inset-0 bg-[radial-gradient(120%_120%_at_30%_22%,#3a2a1c_0%,#1a1410_60%,#0b0d12_100%)]" />
            )}

            {/* HOVER SCRIM — solid #000 at 20%, the user's own Figma treatment.
                Deepened slightly beyond 20% ONLY behind the type via the
                gradient below, so the copy stays readable on bright covers
                without changing the flat-scrim look they specified. */}
            <div
              aria-hidden
              className="absolute inset-0 bg-black opacity-0 transition-opacity duration-500 ease-out group-hover:opacity-20 group-focus-visible:opacity-20"
            />

            {/* HOVER COPY — kicker + eyebrow centred on the plate, year pinned
                bottom-right (Figma slide 35 detail). Hidden at rest. */}
            <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center px-6 text-center opacity-0 transition-opacity duration-400 ease-out group-hover:opacity-100 group-focus-visible:opacity-100">
              <p className="max-w-[26ch] translate-y-2 text-[clamp(0.95rem,0.8rem+0.6vw,1.35rem)] font-medium leading-snug text-white transition-transform duration-500 ease-out [text-shadow:0_2px_18px_rgba(0,0,0,0.85)] group-hover:translate-y-0">
                {kicker}
              </p>
              <p className="mt-3 max-w-[34ch] translate-y-2 text-[clamp(0.7rem,0.65rem+0.2vw,0.85rem)] font-medium leading-snug text-accent transition-transform delay-[60ms] duration-500 ease-out [text-shadow:0_2px_14px_rgba(0,0,0,0.9)] group-hover:translate-y-0">
                {eyebrow}
              </p>
            </div>
            <span className="pointer-events-none absolute bottom-3 right-4 text-[13px] font-medium text-white/90 opacity-0 transition-opacity duration-400 ease-out [text-shadow:0_2px_12px_rgba(0,0,0,0.9)] group-hover:opacity-100">
              {project.year}
            </span>
          </div>
        </div>

        {/* TITLE — big Tanker, BELOW the plate (Figma slide 35). This is the
            permanent label; the plate stays clean. */}
        <h3
          className="mt-6 text-center text-[clamp(1.5rem,1rem+1.9vw,2.6rem)] uppercase leading-[0.95] tracking-[0.01em] text-fg transition-colors duration-300 group-hover:text-accent"
          style={{ fontFamily: "var(--font-display-tanker)" }}
        >
          {project.title}
        </h3>
      </Link>
    </div>
  );
}

export function WorkShowcase({ projects }: { projects: GalleryProject[] }) {
  const root = useRef<HTMLDivElement>(null);

  useGSAP(
    () => {
      const mm = gsap.matchMedia();
      mm.add("(prefers-reduced-motion: no-preference)", () => {
        const plates = gsap.utils.toArray<HTMLElement>(
          root.current?.querySelectorAll("[data-plate]") ?? [],
        );

        plates.forEach((plate, i) => {
          const card = plate.querySelector<HTMLElement>("[data-card]");
          const cover = plate.querySelector<HTMLElement>("[data-cover]");
          if (!card) return;

          // entrance — rise + settle, alternating the x-origin so each card
          // arrives from its own side
          gsap.fromTo(
            card,
            { y: 70, autoAlpha: 0, x: i % 2 === 0 ? -26 : 26 },
            {
              y: 0,
              x: 0,
              autoAlpha: 1,
              duration: 1.05,
              ease: ease.expo,
              scrollTrigger: {
                trigger: plate,
                start: "top 82%",
                toggleActions: "play none none reverse",
              },
            },
          );

          // image parallax against its frame — the plate feels like a window
          // onto something moving behind it, which separates it from the
          // particle field rather than sitting flat on top.
          if (cover) {
            gsap.fromTo(
              cover,
              { yPercent: -6 },
              {
                yPercent: 6,
                ease: "none",
                scrollTrigger: {
                  trigger: plate,
                  start: "top bottom",
                  end: "bottom top",
                  scrub: 0.6,
                },
              },
            );
          }
        });

        return () => ScrollTrigger.getAll().forEach((t) => t.kill());
      });
    },
    { scope: root },
  );

  return (
    <div ref={root} // Gaps are capped in px as well as vh: on a tall/wide monitor a bare
      // 18vh became ~200px of dead space between plates.
      className="flex flex-col gap-[clamp(3rem,10vh,7rem)]">
      {projects.map((p, i) => (
        <ProjectPlate key={p.slug} project={p} index={i} />
      ))}
    </div>
  );
}
