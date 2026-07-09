"use client";

import Link from "next/link";
import type { Route } from "next";
import { useRef } from "react";
import { ArrowUpRight } from "lucide-react";
import { gsap, useGSAP, ScrollTrigger } from "@/lib/gsap";
import {
  PLACEHOLDER_PROJECTS,
  type GalleryProject,
} from "@/lib/placeholderProjects";

/**
 * MY WORKS. — the horizontal work gallery (Figma 101:20 + noth.in motion ref).
 *
 * A white, pinned section: vertical scroll is converted to HORIZONTAL travel of
 * a filmstrip via a containerAnimation (ease:"none", per GSAP). The strip opens
 * on a split "MY  WORKS." title, then ~5 project panels with dark thumbnails,
 * staggered vertical offsets and varied sizes. As each project reaches centre it
 * reveals — thumbnail clip-wipes up, title + meta line-slide in — and reverses
 * out as it leaves, so scrolling reads as an editorial reel, not a slideshow.
 *
 * Pinning for the full travel is what GATES the footer: you cannot reach the
 * contact/footer until the last project has passed.
 *
 * Reduced motion / touch: no pin, no horizontal hijack — the panels stack and
 * fall back to normal vertical scrolling with static reveals.
 *
 * The circle wipe at the tail of <Hero> floods the screen white and hands off
 * directly into this section's white background — one continuous transition.
 */

const SIZE_CLASS: Record<GalleryProject["size"], string> = {
  lg: "h-[clamp(260px,42vh,520px)] w-[clamp(360px,44vw,760px)]",
  md: "h-[clamp(220px,34vh,420px)] w-[clamp(300px,32vw,560px)]",
  sm: "h-[clamp(180px,26vh,320px)] w-[clamp(240px,24vw,420px)]",
};

// vertical offset within the track lane, per project (editorial stagger)
const OFFSET_CLASS = [
  "-translate-y-[8vh]",
  "translate-y-[14vh]",
  "-translate-y-[2vh]",
  "translate-y-[10vh]",
  "-translate-y-[12vh]",
];

function ProjectPanel({
  project,
  index,
}: {
  project: GalleryProject;
  index: number;
}) {
  const href = `/work/${project.slug}` as Route;
  return (
    <Link
      href={href}
      data-panel
      className={`group relative flex shrink-0 items-center gap-8 px-[6vw] ${OFFSET_CLASS[index % OFFSET_CLASS.length]}`}
    >
      {/* index marker */}
      <span
        data-panel-index
        className="absolute -top-10 left-[6vw] text-[13px] font-bold tabular-nums tracking-widest text-black/40"
      >
        {String(index + 1).padStart(2, "0")} / {String(PLACEHOLDER_PROJECTS.length).padStart(2, "0")}
      </span>

      {/* thumbnail — dark block, clip-revealed on enter */}
      <div className={`relative overflow-hidden ${SIZE_CLASS[project.size]}`}>
        <div
          data-thumb
          className="absolute inset-0 bg-[#2b2b2b] transition-transform duration-700 ease-out group-hover:scale-[1.04]"
        />
        {/* year, tucked into the thumbnail corner */}
        <span className="absolute bottom-3 left-3 text-[12px] font-bold tracking-widest text-white/70">
          {project.year}
        </span>
        <span className="absolute right-3 top-3 flex h-9 w-9 items-center justify-center rounded-full bg-white/0 text-white opacity-0 transition-all duration-500 group-hover:bg-white/15 group-hover:opacity-100">
          <ArrowUpRight size={18} />
        </span>
      </div>

      {/* meta — title + short description + tags, line-masked in */}
      <div className="flex w-[clamp(180px,18vw,260px)] shrink-0 flex-col gap-3">
        <span className="block overflow-hidden">
          <span data-meta className="block text-[clamp(28px,3vw,48px)] font-bold leading-[0.95] tracking-[-0.02em] text-[#171717]">
            {project.title}
          </span>
        </span>
        <span className="block overflow-hidden">
          <span data-meta className="block max-w-[240px] text-[15px] font-medium leading-snug text-black/60">
            {project.summary}
          </span>
        </span>
        <span className="block overflow-hidden">
          <span data-meta className="mt-1 block text-[12px] font-bold uppercase tracking-widest text-black/40">
            {project.tags.join(" · ")}
          </span>
        </span>
      </div>
    </Link>
  );
}

export function WorkGallery({
  projects = PLACEHOLDER_PROJECTS,
}: {
  projects?: GalleryProject[];
}) {
  const root = useRef<HTMLElement>(null);
  const track = useRef<HTMLDivElement>(null);

  useGSAP(
    () => {
      const mm = gsap.matchMedia();

      // ---- desktop: pinned horizontal reel ---------------------------------
      mm.add(
        "(prefers-reduced-motion: no-preference) and (min-width: 1024px)",
        () => {
          const section = root.current;
          const strip = track.current;
          if (!section || !strip) return;

          const scrollDistance = () =>
            Math.max(0, strip.scrollWidth - window.innerWidth);
          // Pinned hold: only the Y/ORKS. fly-in + title exit happen here now
          // (M/W materialise earlier, on approach), so this can be short.
          const HOLD = () => Math.round(window.innerHeight * 0.6);

          // The strip HOLDS at x:0 while the title assembles (that fills the
          // white space the circle leaves), THEN travels horizontally. Both
          // phases live on one timeline so the whole gallery is one pinned scrub;
          // project panels + the assembly ride its `containerAnimation`.
          const travel = gsap.timeline({
            scrollTrigger: {
              trigger: section,
              start: "top top",
              end: () => "+=" + (HOLD() + scrollDistance()),
              pin: true,
              scrub: 0.3, // tight coupling so the title tracks scroll closely
              anticipatePin: 1,
              invalidateOnRefresh: true,
              // gallery is second on the page → refresh after the hero pin
              refreshPriority: 0,
            },
          });
          travel
            // phase 1: hold (assembly plays here; strip stays put)
            .to(strip, { x: 0, duration: HOLD(), ease: "none" })
            // phase 2: horizontal travel through the reel
            .to(strip, { x: () => -scrollDistance(), ease: "none", duration: () => scrollDistance() });

          // per-panel reveal, tied to the horizontal container animation
          const panels = gsap.utils.toArray<HTMLElement>(
            strip.querySelectorAll("[data-panel]"),
          );
          panels.forEach((panel) => {
            const thumb = panel.querySelector<HTMLElement>("[data-thumb]");
            const metas = panel.querySelectorAll<HTMLElement>("[data-meta]");
            const idx = panel.querySelector<HTMLElement>("[data-panel-index]");

            // SCRUBBED to the panel's horizontal position (not toggleActions) —
            // so the reveal is a pure function of scroll: it plays forward as
            // the panel enters and reverses IDENTICALLY as you scroll back. The
            // old play/reverse toggle desynced on backward scroll and left
            // panels stuck hidden.
            const tl = gsap.timeline({
              scrollTrigger: {
                trigger: panel,
                containerAnimation: travel,
                start: "left 88%",
                end: "left 42%",
                scrub: 0.5,
              },
            });
            if (thumb) {
              tl.fromTo(
                thumb,
                { clipPath: "inset(100% 0% 0% 0%)", scale: 1.15 },
                {
                  clipPath: "inset(0% 0% 0% 0%)",
                  scale: 1,
                  duration: 1,
                  ease: "power3.out",
                },
                0,
              );
            }
            tl.fromTo(
              metas,
              { yPercent: 120 },
              { yPercent: 0, duration: 0.8, stagger: 0.1, ease: "power3.out" },
              0.15,
            );
            if (idx) {
              tl.fromTo(
                idx,
                { opacity: 0, y: 10 },
                { opacity: 1, y: 0, duration: 0.6, ease: "power2.out" },
                0.1,
              );
            }
          });

          // --- title assembly: M/W pop up from below on the left margin, then
          //     Y/ORKS. fly in from the right to connect into "MY WORKS." (Figma
          //     101:20). Nested into `travel` at the START (the hold phase) so it
          //     plays — scrubbed + reversible — while the strip is stationary,
          //     filling the white space the circle leaves. The first project
          //     panel then travels in normally as the reel starts (beat 3: the
          //     scene keeps forming as you keep scrolling). ---
          const titlePanel =
            strip.querySelector<HTMLElement>("[data-title-panel]");
          if (titlePanel) {
            const m = titlePanel.querySelector("[data-title-m]");
            const w = titlePanel.querySelector("[data-title-w]");
            const y = titlePanel.querySelector("[data-title-y]");
            const orks = titlePanel.querySelector("[data-title-orks]");
            // the horizontally-flying inners (masked by their parent)
            const yInner = titlePanel.querySelector("[data-title-y-inner]");
            const orksInner = titlePanel.querySelector("[data-title-orks-inner]");
            const support = titlePanel.querySelector("[data-title-support]");

            // initial (pre-assembly) state:
            //  • M/W MATERIALISE in place — tiny rise + blur + fade, NO mask, so
            //    you never see a half-cut letter clipping through an edge.
            //  • Y/ORKS. slide their inner glyphs in from the right (masked).
            gsap.set([m, w], {
              opacity: 0,
              yPercent: 14,
              filter: "blur(12px)",
            });
            gsap.set([yInner, orksInner], { xPercent: 130 });
            gsap.set([y, orks], { opacity: 0 });
            gsap.set(support, { opacity: 0, y: 20, filter: "blur(6px)" });

            const titleGroup =
              titlePanel.querySelector<HTMLElement>("[data-title-group]");

            // ASSEMBLY (all on ONE approach scrub, tied to the section rising
            // into view) — so "MY WORKS." forms as a single connected gesture,
            // not two events split across the pin boundary:
            //   • M/W blur+rise into place first
            //   • Y/ORKS. trace in from the right while M/W are STILL resolving
            //     (overlap at ~0.35) so you see them coming as the blur clears
            //   • support text last
            // The whole thing completes within ~1 scroll of M/W appearing.
            gsap
              .timeline({
                scrollTrigger: {
                  trigger: section,
                  start: "top 62%",
                  end: "top 8%",
                  scrub: 0.4,
                },
              })
              .to(
                [m, w],
                {
                  opacity: 1,
                  yPercent: 0,
                  filter: "blur(0px)",
                  duration: 1,
                  stagger: 0.12,
                  ease: "power2.out",
                },
                0,
              )
              // Y/ORKS. start tracing in while M/W are still un-blurring —
              // faint at first (fade), sliding from the right to connect.
              .to([y, orks], { opacity: 1, duration: 0.9, ease: "power1.out" }, 0.35)
              .to(
                [yInner, orksInner],
                {
                  xPercent: 0,
                  duration: 1.15,
                  stagger: 0.14,
                  ease: "power3.out",
                },
                0.35,
              )
              .to(
                support,
                {
                  opacity: 1,
                  y: 0,
                  filter: "blur(0px)",
                  duration: 0.7,
                  ease: "power2.out",
                },
                0.6,
              );

            // EXIT — the whole title leaves as ONE unit (animate the group, not
            // the glyphs → no split). It PERSISTS through the hold and the first
            // stretch of reel travel, only leaving once project 1 is ~70% of its
            // width in frame. The first panel width ≈ 44vw + gaps; project 1 is
            // ~70% in after travelling roughly that far, so fire the exit a
            // little way into phase 2 (not at the hold boundary).
            const panelW =
              strip.querySelector<HTMLElement>("[data-panel]")?.offsetWidth ??
              window.innerWidth * 0.6;
            const exitStart = HOLD() + panelW * 0.62; // ~project 1 is 70% in
            if (titleGroup) {
              travel.fromTo(
                titleGroup,
                { yPercent: 0, opacity: 1 },
                {
                  yPercent: -55,
                  opacity: 0,
                  ease: "power2.in",
                  duration: panelW * 0.32,
                  immediateRender: false,
                },
                exitStart,
              );
            }
          }

          ScrollTrigger.refresh();
        },
      );

      // ---- reduced motion / small screens: static, vertical fallback -----
      mm.add(
        "(prefers-reduced-motion: reduce), (max-width: 1023px)",
        () => {
          const section = root.current;
          if (!section) return;
          // reveal thumbnails immediately (no clip) + meta upright
          gsap.set(section.querySelectorAll("[data-thumb]"), {
            clipPath: "inset(0% 0% 0% 0%)",
          });
          gsap.set(section.querySelectorAll("[data-meta]"), { yPercent: 0 });
          gsap.set(section.querySelectorAll("[data-panel-index]"), { opacity: 1 });
        },
      );
    },
    { scope: root },
  );

  return (
    <section
      ref={root}
      id="work"
      className="relative min-h-dvh overflow-hidden bg-white text-[#171717]"
    >
      {/* horizontal track: title panel + project panels.
          On fallback (flex-wrap) it stacks vertically and scrolls normally. */}
      <div
        ref={track}
        className="flex h-dvh max-lg:h-auto max-lg:flex-col max-lg:gap-24 max-lg:py-24 lg:w-max lg:flex-nowrap lg:items-center"
      >
        {/* title panel — "MY WORKS." assembles as you scroll: M & W pop up from
            below on the left margin; Y & ORKS. fly in from the right to connect
            (Figma 101:20 layout). Each glyph group is its own animation target. */}
        <div
          data-title-panel
          className="relative flex h-full shrink-0 flex-col justify-center px-[10vw] lg:w-[86vw] max-lg:h-auto max-lg:px-[var(--gutter)]"
        >
          {/* group wrapper — the whole title exits as ONE unit (animated here,
              not per-glyph) so "MY WORKS." leaves together, never split. */}
          <div data-title-group className="will-change-[transform,opacity]">
          <h2 className="font-bold uppercase leading-[0.82] tracking-[-0.03em] [font-size:clamp(3.25rem,11vw,9.5rem)]">
            {/* line 1: M (left margin) + Y (flies in from right).
                No overflow clip — M settles in place with opacity/blur so you
                never see a half-cut letter travelling through a mask edge. */}
            <span className="flex items-baseline">
              <span data-title-m className="block will-change-[transform,opacity,filter]">M</span>
              <span data-title-y className="block overflow-hidden will-change-transform"><span data-title-y-inner className="block">Y</span></span>
            </span>
            {/* line 2: W (left margin) + ORKS. (flies in from right) */}
            <span className="flex items-baseline">
              <span data-title-w className="block will-change-[transform,opacity,filter]">W</span>
              <span data-title-orks className="block overflow-hidden will-change-transform"><span data-title-orks-inner className="block">ORKS.</span></span>
            </span>
          </h2>
          <p
            data-title-support
            className="mt-10 max-w-md text-[clamp(15px,1.3vw,20px)] font-medium text-black/50 will-change-transform max-lg:mt-4"
          >
            Selected works · Scroll to travel the reel
          </p>
          </div>
        </div>

        {projects.map((project, i) => (
          <ProjectPanel key={project.slug} project={project} index={i} />
        ))}

        {/* tail spacer so the last panel can settle fully in view before unpin */}
        <div aria-hidden className="h-full w-[20vw] shrink-0 max-lg:hidden" />
      </div>
    </section>
  );
}
