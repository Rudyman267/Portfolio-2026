"use client";

import { useRef } from "react";
import Link from "next/link";
import type { Route } from "next";
import { ArrowUpRight } from "lucide-react";
import { gsap, useGSAP, ease } from "@/lib/gsap";
import { GameThumb } from "@/components/about/GameThumb";

/**
 * PlayWall — the wall of AI explorations on /play.
 *
 * Built as a LIST so adding the next experiment is a one-entry change: give it
 * a title, a blurb, a status and (if it has its own page) an href. Today there
 * is exactly one real entry — The Other Hand — plus a deliberate "more coming"
 * tile so a single card doesn't read as an unfinished page.
 *
 * Deliberately different from /work's alternating plates: these are
 * experiments, not case studies, so they sit in a grid and lead with the thing
 * itself rather than with a writeup.
 */

type Experiment = {
  title: string;
  blurb: string;
  /** short tags — medium / tech / year */
  meta: string[];
  /** internal route, when the experiment has a page of its own */
  href?: Route;
  /** the live particle thumbnail (only The Other Hand has one today) */
  thumb?: "otherHand";
  cta?: string;
};

const EXPERIMENTS: Experiment[] = [
  {
    title: "The Other Hand",
    blurb:
      "A spiritual digital experience about consciousness searching for meaning and direction — the invisible guiding hand. Creation only happens when something pushes an idea, because entropy is always pulling the other way. No score, no win state. Vibe-coded, playable here in the browser.",
    meta: ["Playable", "React · Web Audio", "2026"],
    href: "/play/the-other-hand" as Route,
    thumb: "otherHand",
    cta: "Play it",
  },
];

export function PlayWall() {
  const root = useRef<HTMLDivElement>(null);

  useGSAP(
    () => {
      const mm = gsap.matchMedia();
      mm.add("(prefers-reduced-motion: no-preference)", () => {
        const cards = gsap.utils.toArray<HTMLElement>(
          root.current?.querySelectorAll("[data-xp]") ?? [],
        );
        cards.forEach((card, i) => {
          gsap.fromTo(
            card,
            { y: 60, autoAlpha: 0 },
            {
              y: 0,
              autoAlpha: 1,
              duration: 1,
              delay: i * 0.06,
              ease: ease.expo,
              scrollTrigger: {
                trigger: card,
                start: "top 85%",
                toggleActions: "play none none reverse",
              },
            },
          );
        });
      });
    },
    { scope: root },
  );

  return (
    <div ref={root} className="grid gap-8 sm:gap-10 lg:grid-cols-2">
      {EXPERIMENTS.map((xp) => (
        <ExperimentCard key={xp.title} xp={xp} />
      ))}
      <ComingSoonCard />
    </div>
  );
}

function ExperimentCard({ xp }: { xp: Experiment }) {
  const inner = (
    <>
      <div className="relative aspect-[16/10] w-full overflow-hidden rounded-[10px] border border-white/12 bg-black">
        {xp.thumb === "otherHand" ? (
          <GameThumb className="absolute inset-0 h-full w-full" />
        ) : null}
        {/* hover scrim — same 20% black treatment the work cards use */}
        <div
          aria-hidden
          className="absolute inset-0 bg-black opacity-0 transition-opacity duration-500 ease-out group-hover:opacity-20 group-focus-visible:opacity-20"
        />
        {xp.cta ? (
          <span className="pointer-events-none absolute bottom-4 left-4 inline-flex items-center gap-2 rounded-full border border-white/25 bg-black/50 px-4 py-2 text-[11px] font-bold uppercase tracking-[0.2em] text-white/90 backdrop-blur-sm transition-colors duration-300 group-hover:border-white/60">
            {xp.cta}
            <ArrowUpRight size={13} />
          </span>
        ) : null}
      </div>

      <h2
        className="mt-6 text-[clamp(1.4rem,1rem+1.5vw,2.1rem)] uppercase leading-[0.98] tracking-[0.01em] text-fg transition-colors duration-300 group-hover:text-accent"
        style={{ fontFamily: "var(--font-display-tanker)" }}
      >
        {xp.title}
      </h2>
      <p className="mt-3 max-w-[52ch] text-[14px] leading-relaxed text-fg/60">
        {xp.blurb}
      </p>
      <p className="mt-4 text-[11px] font-bold uppercase tracking-[0.22em] text-fg/35">
        {xp.meta.join(" · ")}
      </p>
    </>
  );

  return (
    <div data-xp>
      {xp.href ? (
        <Link
          href={xp.href}
          aria-label={`${xp.title} — ${xp.cta ?? "open"}`}
          className="group block focus-visible:outline-none"
        >
          {inner}
        </Link>
      ) : (
        <div className="group">{inner}</div>
      )}
    </div>
  );
}

/** Keeps the wall from reading as a one-item page while it fills up. */
function ComingSoonCard() {
  return (
    <div data-xp>
      <div className="flex aspect-[16/10] w-full items-center justify-center rounded-[10px] border border-dashed border-white/12 bg-white/[0.02]">
        <p className="text-[11px] font-bold uppercase tracking-[0.28em] text-fg/25">
          More in the works
        </p>
      </div>
      <h2
        className="mt-6 text-[clamp(1.4rem,1rem+1.5vw,2.1rem)] uppercase leading-[0.98] tracking-[0.01em] text-fg/30"
        style={{ fontFamily: "var(--font-display-tanker)" }}
      >
        Next experiment
      </h2>
      <p className="mt-3 max-w-[52ch] text-[14px] leading-relaxed text-fg/35">
        Where the next thing I build for the fun of it will land.
      </p>
    </div>
  );
}
