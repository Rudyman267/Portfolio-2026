"use client";

import { useRef, type ReactNode } from "react";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { gsap, useGSAP, ScrollTrigger, ease } from "@/lib/gsap";
import { Reveal } from "@/components/motion/Reveal";
import { Chapter, FlashPanel, Spawn } from "@/components/case-study/Chapter";
import {
  CountUp,
  Figure,
  OutlineNote,
  PullQuote,
  MattersList,
  GapCards,
  DecisionCluster,
  DroneMark,
  PersonaSplitDiagram,
  OnboardingFlowDiagram,
  StakeholderActionsDiagram,
} from "@/components/case-study/lirBlocks";

/** Chapters wired to the full-viewport flash transition (built one at a time). */
const CHAPTER_IDS = new Set<string>(["context", "problem", "reframe"]);
import type {
  Block,
  LirDesign,
  Section,
} from "@/lib/caseStudies/lirDesign";

/* ============================================================================
   LIVE INCIDENCE RESPONSE — the light, editorial case study recreated from
   Figma 172:56. A 1920-wide reading column with a fixed left "Contents" rail
   and TANKER blue section headings. Everything is scoped by `.lir` so the
   page's white/blue palette never touches the site's global theme.

   Layout mirrors the Figma: content sits in a centered measure (~640px) with
   the sticky nav + overview meta pinned to the left gutter on wide screens.
   ========================================================================== */

const flytbaseLogo = (
  // eslint-disable-next-line @next/next/no-img-element
  <img
    src="/case-study/flytbase-logo.svg"
    alt="FlytBase"
    className="inline-block h-2.5 w-auto align-middle"
  />
);

export function LirCaseStudy({ data }: { data: LirDesign }) {
  const root = useRef<HTMLElement>(null);
  let figN = 0;
  const nextFig = () => `Fig.${String(++figN).padStart(2, "0")}`;

  /* Section-scroll wiring: light each Contents entry as its section arrives. */
  useGSAP(
    () => {
      const mm = gsap.matchMedia();

      // ── Thumbnail intro: the cover is fixed BEHIND the page (z-0) and never
      //    fades. The page content (z-10, opaque bg) rises over it as you scroll
      //    the 100vh spacer, covering the thumbnail from the bottom up. We only
      //    fade the "scroll to enter" hint and add a whisper of parallax so the
      //    thumbnail drifts slightly instead of sitting dead-still.
      mm.add("(prefers-reduced-motion: no-preference)", () => {
        const intro = root.current?.querySelector<HTMLElement>("[data-intro]");
        const wrap = root.current?.querySelector<HTMLElement>("[data-intro-wrap]");
        const hint = root.current?.querySelector<HTMLElement>("[data-intro-hint]");
        if (!intro || !wrap) return;

        const img = intro.querySelector("img");
        gsap.timeline({
          scrollTrigger: {
            trigger: wrap,
            start: "top top",
            end: "bottom top",
            scrub: 0.4,
          },
        })
          // subtle parallax on the thumbnail as the page slides over it
          .to(img, { scale: 1.06, yPercent: -6, ease: "none" }, 0)
          .to(hint ?? {}, { autoAlpha: 0, ease: "none", duration: 0.35 }, 0);
      });

      mm.add("(prefers-reduced-motion: reduce)", () => {
        // No parallax; the page still covers the fixed thumbnail on scroll.
        const hint = root.current?.querySelector<HTMLElement>("[data-intro-hint]");
        if (hint) gsap.set(hint, { autoAlpha: 1 });
      });

      mm.add("(prefers-reduced-motion: no-preference)", () => {
        const links = gsap.utils.toArray<HTMLAnchorElement>("[data-toc-link]");
        const sections = gsap.utils.toArray<HTMLElement>("[data-section]");

        // Light the TOC link(s) whose target matches the given section id.
        // Blue is a moving highlight — only ONE section is current at a time.
        const setActive = (id: string) =>
          links.forEach((l) =>
            l.toggleAttribute(
              "data-active",
              l.getAttribute("data-target") === id,
            ),
          );

        // Standard scroll-spy: the current section is the last one whose top
        // crossed the 40% line. Each section's band runs from its own top to
        // the NEXT section's top, so exactly one is current at any scroll pos.
        // onEnter (down) + onEnterBack (up) both re-assert the owner.
        sections.forEach((sec, i) => {
          const id = sec.id;
          const next = sections[i + 1];
          ScrollTrigger.create({
            trigger: sec,
            start: "top 40%",
            endTrigger: next ?? sec,
            end: next ? "top 40%" : "bottom bottom",
            onEnter: () => setActive(id),
            onEnterBack: () => setActive(id),
          });
        });
        // Start with Overview lit.
        setActive("overview");

        // Big Tanker section headings sweep up as they enter.
        gsap.utils.toArray<HTMLElement>("[data-heading]").forEach((h) => {
          gsap.from(h, {
            yPercent: 18,
            opacity: 0,
            duration: 0.8,
            ease: ease.expo,
            scrollTrigger: { trigger: h, start: "top 88%" },
          });
        });
      });
    },
    { scope: root },
  );

  return (
    <article
      ref={root}
      className="lir relative bg-bg text-fg"
      data-header-dark={undefined}
    >
      {/* ── THUMBNAIL INTRO — a fixed, fully-OPAQUE cover pinned BEHIND the page
             (z-0, never fades). The page content sits above it (z-10, opaque
             bg) and simply scrolls up and over it, covering the thumbnail from
             below as it rises to fill the viewport. No opacity crossfade, so the
             two never ghost through each other. ─────────────────────────── */}
      <div
        data-intro
        data-header-dark
        aria-hidden
        className="pointer-events-none fixed inset-0 z-0 flex items-center justify-center overflow-hidden bg-black"
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/case-study/thumbnail-1.svg"
          alt="Live Incidence Response — case study cover"
          className="h-full w-full object-cover"
        />
        <div
          data-intro-hint
          className="absolute bottom-8 left-1/2 -translate-x-1/2 text-[13px] font-medium uppercase tracking-[0.25em] text-white/70"
        >
          scroll to enter
        </div>
      </div>

      {/* 100vh spacer so the thumbnail shows first, before the page rises over it */}
      <div data-intro-wrap className="h-screen" aria-hidden />

      {/* ── ONE PERSISTENT TWO-COLUMN GRID (rail persists the whole page).
             The container is wide so the rail sits out near the left edge; the
             reading content is capped + centered within its own track so it
             floats in the middle rather than hugging the rail.
             z-10 + opaque bg so it paints OVER the fixed thumbnail as it rises. */}
      <div className="relative z-10 mx-auto max-w-[1680px] bg-bg px-6 pt-28 pb-24 sm:pt-32 lg:px-12">
        <div className="grid gap-[var(--lir-col-gap)] lg:grid-cols-[var(--lir-rail-w)_1fr]">
          {/* ── LEFT RAIL — back link + meta + Contents, sticky the whole way ── */}
          <aside className="lg:sticky lg:top-24 lg:h-fit lg:self-start">
            <Link
              href="/work"
              className="inline-flex items-center gap-2 text-[var(--lir-body-sm)] font-medium text-muted transition-colors hover:text-fg"
            >
              <ArrowLeft size={16} /> {data.backLabel}
            </Link>

            {/* overview meta card — white fill, hairline border (Figma), ~2/3 scale */}
            <div className="mt-8 rounded-[10px] border border-[#dcdcdc] bg-white p-3.5">
              <dl className="space-y-1.5">
                {data.meta.map((m) => (
                  <div
                    key={m.label}
                    className="flex items-center justify-between gap-3"
                  >
                    <dt className="text-[length:var(--lir-rail-meta)] text-muted">
                      {m.label}
                    </dt>
                    <dd className="text-right text-[length:var(--lir-rail-meta)] font-medium text-fg">
                      {m.label === "Company" ? flytbaseLogo : m.value}
                    </dd>
                  </div>
                ))}
              </dl>
            </div>

            {/* contents nav — white fill, hairline border (Figma), ~2/3 scale */}
            <nav
              aria-label="Contents"
              className="mt-3 rounded-[10px] border border-[#dcdcdc] bg-white px-3.5 py-4"
            >
              <p className="text-[length:var(--lir-rail-nav)] font-semibold uppercase tracking-wide text-fg">
                Contents
              </p>
              <ul className="mt-3 space-y-[0.6rem]">
                {data.contents.map((c, i) => (
                  <li key={i}>
                    <a
                      href={`#${c.id ?? "overview"}`}
                      data-toc-link
                      data-target={c.id ?? "overview"}
                      className="group flex items-baseline gap-2 text-[length:var(--lir-rail-nav)] text-[#636363] transition-colors data-[active]:text-accent hover:text-fg"
                    >
                      {c.n && (
                        <span className="w-3.5 tabular-nums text-[#636363] group-data-[active]:text-accent">
                          {c.n}
                        </span>
                      )}
                      <span className={c.n ? "" : "font-medium"}>{c.label}</span>
                    </a>
                  </li>
                ))}
              </ul>
            </nav>
          </aside>

          {/* ── RIGHT COLUMN — hero + the whole reading spine. Vertical rhythm
                 mirrors the Figma (title→eyebrow ~8px, eyebrow→headline 60px,
                 headline→lede ~50px, lede→stats ~90px, stats→cover ~100px). ── */}
          <div className="min-w-0 lg:mx-auto lg:max-w-[860px]">
            {/* overview spans the hero; its data-section is capped just before
               the first spine section so the "Overview" TOC link only lights
               at the top. */}
            <div id="overview" data-section data-overview className="scroll-mt-28" />
            {/* title (32px ExtraBold) + eyebrow (24px Medium, blue) */}
            <p className="text-[length:var(--lir-title)] font-extrabold leading-[0.86] tracking-[-0.01em] text-fg">
              {data.title}
            </p>
            <Reveal>
              <p className="mt-2.5 text-[length:var(--lir-eyebrow)] font-medium text-accent">
                {data.eyebrow}
              </p>
            </Reveal>

            {/* headline (46px ExtraBold, LH 80%) with the drone mark to its left */}
            <Reveal delay={0.06}>
              <div className="mt-[3.75rem] flex items-center gap-[35px]">
                <DroneMark
                  size={86}
                  className="w-[52px] shrink-0 sm:w-[86px]"
                />
                <h1 className="max-w-[16ch] text-[length:var(--lir-headline)] font-extrabold leading-[0.86] tracking-[-0.01em] text-fg">
                  {data.headline}
                </h1>
              </div>
            </Reveal>

            <Reveal delay={0.12}>
              <p className="mt-[3.25rem] max-w-[var(--lir-measure)] text-[length:var(--lir-lede)] leading-[1.5] text-fg">
                {data.lede}
              </p>
            </Reveal>

            {/* stats row (36px Bold number, 16px label + sub) */}
            <Reveal delay={0.18}>
              <div className="mt-[5.5rem] grid grid-cols-2 gap-x-8 gap-y-8 sm:grid-cols-4">
                {data.stats.map((s) => (
                  <div key={s.label}>
                    <CountUp
                      value={s.value}
                      className="block text-[length:var(--lir-stat)] font-bold leading-none tracking-[-0.01em] tabular-nums text-accent"
                    />
                    <div className="mt-2.5 text-[length:var(--lir-stat-label)] font-semibold text-fg">
                      {s.label}
                    </div>
                    <div className="mt-1 text-[length:var(--lir-stat-label)] leading-snug text-muted">
                      {s.sub}
                    </div>
                  </div>
                ))}
              </div>
            </Reveal>

            {/* cover (Figma 1017×572 ≈ 16:9) */}
            <Reveal delay={0.24} className="mt-[6rem] max-w-[var(--lir-measure)]">
              <Figure slot={data.cover} ratio="1017 / 572" />
            </Reveal>

            {/* build statement */}
            <Reveal className="mt-16">
              <p className="max-w-[var(--lir-measure)] text-[length:var(--lir-lede)] font-medium leading-[1.5] text-fg">
                {data.buildStatement}
              </p>
            </Reveal>

            {/* Features shipped — closes the Overview (label + capability note) */}
            <Reveal className="mt-20">
              <p className="text-[length:var(--lir-eyebrow)] font-medium text-accent">
                Features shipped
              </p>
              <div className="mt-6 max-w-[var(--lir-measure)]">
                <OutlineNote>
                  Live drone feeds, a shared map, and real-time annotation for
                  emergency responders who&rsquo;ve never seen the platform — no
                  account, no install, no training.
                </OutlineNote>
              </div>
            </Reveal>

            {/* the spine */}
            <div className="mt-2">
              {data.sections.map((section) => (
                <SectionRenderer
                  key={section.id + section.n}
                  section={section}
                  nextFig={nextFig}
                />
              ))}
            </div>

            {/* close */}
            <Reveal className="mt-20 border-t border-border pt-10">
              <p className="text-[var(--lir-label)] font-bold uppercase tracking-widest text-faint">
                End of case study
              </p>
              <p className="mt-3 max-w-[var(--lir-measure)] text-[var(--lir-body-sm)] text-muted">
                The contact + next-project handoff continues in the footer below.
              </p>
            </Reveal>
          </div>
        </div>
      </div>
    </article>
  );
}


/* ── Section renderer ─────────────────────────────────────────────────────── */
function SectionRenderer({
  section,
  nextFig,
}: {
  section: Section;
  nextFig: () => string;
}) {
  // Chapters wired to the flash transition: the Tanker title fills the viewport
  // (scrubbed) then disappears, and the prose blocks spawn in scrubbed.
  if (section.kind === "prose" && CHAPTER_IDS.has(section.id)) {
    return (
      <Chapter id={section.id} title={section.heading}>
        <ProseBody blocks={section.blocks} nextFig={nextFig} spawn />
      </Chapter>
    );
  }

  return (
    <section
      id={section.id}
      data-section
      className="scroll-mt-28 pt-24"
    >
      {/* big Tanker blue heading */}
      <h2
        data-heading
        className="display text-[length:var(--lir-h-section)] uppercase text-accent"
      >
        {section.heading}
      </h2>

      <div className="mt-7">
        {section.kind === "prose" && (
          <ProseBody blocks={section.blocks} nextFig={nextFig} />
        )}

        {section.kind === "decisions" && (
          <>
            {section.intro && (
              <Reveal>
                <p className="max-w-[var(--lir-measure)] text-[length:var(--lir-body)] leading-relaxed text-muted">
                  {section.intro}
                </p>
              </Reveal>
            )}
            <div className="mt-12 space-y-16">
              {section.clusters.map((c) => (
                <Reveal key={c.n}>
                  <DecisionCluster {...c} />
                  {c.media?.map((slot) => (
                    <div key={slot.id} className="mt-6">
                      <Figure slot={slot} fig={nextFig()} />
                    </div>
                  ))}
                </Reveal>
              ))}
            </div>
          </>
        )}

        {section.kind === "features" && (
          <div className="space-y-24">
            {section.features.map((f) => (
              <Reveal key={f.title}>
                <h3 className="max-w-[24ch] text-[length:var(--lir-lede)] font-bold leading-tight tracking-[-0.01em] text-fg">
                  {f.title}
                </h3>
                {f.constraint && (
                  <div className="mt-5 max-w-[var(--lir-measure)]">
                    <p className="text-[var(--lir-label)] font-bold uppercase tracking-widest text-accent">
                      {f.constraintLabel}
                    </p>
                    <p className="mt-1.5 text-[var(--lir-body-sm)] leading-relaxed text-muted">
                      {f.constraint}
                    </p>
                  </div>
                )}
                <p className="mt-5 max-w-[var(--lir-measure)] text-[length:var(--lir-body)] leading-relaxed text-fg/80">
                  {f.body}
                </p>
                <div className="mt-8 grid gap-6 sm:grid-cols-2">
                  {f.media.map((slot) => (
                    <Figure key={slot.id} slot={slot} fig={nextFig()} ratio="16 / 10" />
                  ))}
                </div>
              </Reveal>
            ))}
          </div>
        )}

        {section.kind === "impact" && (
          <>
            <Reveal>
              <p className="max-w-[var(--lir-measure)] text-[length:var(--lir-lede)] font-medium text-fg">
                {section.lede}
              </p>
            </Reveal>
            <Reveal className="mt-10">
              <Figure slot={section.dashboard} fig={nextFig()} ratio="16 / 8" />
              <p className="mt-4 max-w-[var(--lir-measure)] text-[var(--lir-body-sm)] leading-relaxed text-muted">
                {section.dashboardCaption}
              </p>
            </Reveal>
            <Reveal className="mt-14">
              <Figure slot={section.growth} fig={nextFig()} ratio="16 / 7" />
              <p className="mt-4 max-w-[var(--lir-measure)] text-[var(--lir-body-sm)] leading-relaxed text-muted">
                {section.growthCaption}
              </p>
            </Reveal>
            <Reveal className="mt-16">
              <p className="max-w-[28ch] text-[length:var(--lir-headline)] font-extrabold leading-[1.05] tracking-[-0.01em] text-fg">
                {section.closer}
              </p>
              <div className="mt-8">
                <Figure slot={section.closerMedia} fig={nextFig()} ratio="16 / 9" />
              </div>
            </Reveal>
          </>
        )}
      </div>
    </section>
  );
}

/* ── Prose body — dispatches the mixed Block[] stream ─────────────────────── */
function ProseBody({
  blocks,
  nextFig,
  spawn = false,
}: {
  blocks: Block[];
  nextFig: () => string;
  /** In a Chapter: wrap each block in <Spawn> (scrubbed) instead of <Reveal>. */
  spawn?: boolean;
}) {
  // One wrapper for both modes: play-once <Reveal> normally, scrubbed <Spawn>
  // inside a Chapter. Same className API.
  const W = ({
    children,
    className,
  }: {
    children: ReactNode;
    className?: string;
  }) =>
    spawn ? (
      <Spawn className={className}>{children}</Spawn>
    ) : (
      <Reveal className={className}>{children}</Reveal>
    );

  return (
    <div className="space-y-8">
      {blocks.map((b, i) => {
        switch (b.t) {
          case "label":
            return (
              <W key={i}>
                <p className="text-[length:var(--lir-eyebrow)] font-medium text-accent">
                  {b.text}
                </p>
              </W>
            );
          case "figure":
            // isolated / hanging illustration — no box, transparent, centered.
            return (
              <W key={i} className="py-6">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={b.src}
                  alt={b.alt}
                  className="mx-auto h-auto w-full"
                  style={{ maxWidth: b.maxW ? `${b.maxW}px` : "100%" }}
                  loading="lazy"
                />
              </W>
            );
          case "lede":
            return (
              <W key={i}>
                <p className="max-w-[var(--lir-measure)] text-[length:var(--lir-lede)] font-medium leading-[1.4] text-fg">
                  {b.text}
                </p>
              </W>
            );
          case "p":
            return (
              <W key={i}>
                <p className="max-w-[var(--lir-measure)] text-[length:var(--lir-body)] leading-relaxed text-fg/80">
                  {b.text}
                </p>
              </W>
            );
          case "richP":
            return (
              <W key={i}>
                <div className="max-w-[var(--lir-measure)] text-[length:var(--lir-body)] leading-relaxed text-fg">
                  {b.lead && (
                    <p className="pl-6 font-bold">{b.lead}</p>
                  )}
                  <p className={b.lead ? "mt-5 pl-6" : ""}>
                    {b.spans.map((s, j) => (
                      <span key={j} className={s.bold ? "font-semibold" : ""}>
                        {s.text}
                      </span>
                    ))}
                  </p>
                </div>
              </W>
            );
          case "quote":
            return (
              <W key={i} className="py-8">
                <PullQuote>{b.text}</PullQuote>
              </W>
            );
          case "quoteFlash":
            // full-viewport grey quote flash — plays then clears as the next
            // block appears. (Only inside a Chapter; FlashPanel is a no-op box
            // that the Chapter's GSAP pins + scrubs.) Wide → ~2 lines.
            return (
              <FlashPanel key={i}>
                <span className="max-w-[60ch] text-center text-[clamp(1.4rem,0.9rem+1.9vw,2.3rem)] font-extrabold leading-[1.2] tracking-[-0.01em] text-balance text-[#636363]">
                  {b.text}
                </span>
              </FlashPanel>
            );
          case "note":
            return (
              <W key={i} className="max-w-[var(--lir-measure)]">
                <OutlineNote>{b.text}</OutlineNote>
              </W>
            );
          case "media":
            // With a caption → bare image + centered caption (scenario style).
            // Otherwise → the boxed Figure.
            return b.caption ? (
              <W key={i}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={b.slot.src}
                  alt={b.slot.label}
                  className="mx-auto h-auto w-full rounded-[6px]"
                  loading="lazy"
                />
                <p className="mt-6 text-center text-[length:var(--lir-body)] leading-relaxed text-fg/80">
                  {b.caption}
                </p>
              </W>
            ) : (
              <W key={i} className={b.wide ? "" : "max-w-[var(--lir-measure)]"}>
                <Figure slot={b.slot} fig={nextFig()} />
              </W>
            );
          case "gapHeading":
            // the "Here's the gap" composition (blue bars + text) as the Figma
            // SVG, scaled to the reading measure.
            return (
              <W key={i} className="py-6">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src="/case-study/heres-the-gap.svg"
                  alt={b.text}
                  className="mx-auto h-auto w-full max-w-[620px]"
                />
              </W>
            );
          case "centerP":
            return (
              <W key={i}>
                <p className="text-center text-[length:var(--lir-body)] leading-relaxed text-fg/80">
                  {b.text}
                </p>
              </W>
            );
          case "diagram":
            return (
              <W key={i} className="py-6">
                {b.which === "personaSplit" && <PersonaSplitDiagram />}
                {b.which === "onboardingFlow" && <OnboardingFlowDiagram />}
                {b.which === "stakeholderActions" && <StakeholderActionsDiagram />}
                {b.caption && (
                  <p className="mt-4 text-center text-[var(--lir-label)] italic text-faint">
                    {b.caption}
                  </p>
                )}
              </W>
            );
          case "matters":
            return (
              <W key={i} className="max-w-[var(--lir-measure)] pt-2">
                <MattersList items={b.items} />
              </W>
            );
          case "gapCards":
            return (
              <W key={i} className="py-4">
                <GapCards scene={b.scene} roles={b.roles} />
              </W>
            );
          case "auditNotes":
            return (
              <div key={i} className="max-w-[var(--lir-measure)] space-y-4">
                {b.notes.map((n, j) => (
                  <W key={j}>
                    <OutlineNote>{n.text}</OutlineNote>
                  </W>
                ))}
              </div>
            );
          case "designMd":
            return (
              <Reveal key={i}>
                <h3 className="text-[length:var(--lir-lede)] font-bold text-fg">
                  How I Got AI to Follow Our Design System
                </h3>
                <p className="mt-4 max-w-[var(--lir-measure)] text-[length:var(--lir-body)] leading-relaxed text-fg/80">
                  {b.body}
                </p>
                <div className="mt-8 grid gap-6 sm:grid-cols-2">
                  {b.images.map((slot) => (
                    <Figure key={slot.id} slot={slot} fig={nextFig()} ratio="4 / 3" />
                  ))}
                </div>
              </Reveal>
            );
          default:
            return null;
        }
      })}
    </div>
  );
}
