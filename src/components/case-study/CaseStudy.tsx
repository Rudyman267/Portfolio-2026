"use client";

import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { Container } from "@/components/ui/Container";
import { SplitReveal } from "@/components/motion/SplitReveal";
import { Reveal } from "@/components/motion/Reveal";
import { StageRail } from "@/components/case-study/StageRail";
import {
  DataTable,
  DecisionCard,
  FeatureRow,
  ImpactMetric,
  Measure,
  MediaPlaceholder,
  MetricRow,
  Para,
  PullQuote,
} from "@/components/case-study/blocks";
import type {
  Block,
  CaseStudy as CaseStudyData,
  Section,
} from "@/lib/caseStudies/liveIncidentResponse";

/**
 * The flagship case-study experience — dark cinematic, editorial calm. Bookends
 * the site's dark hero/footer using the `.hero-dark` token scope, then inverts
 * the register: motion paces the reading, it never dazzles. Per-study accent is
 * the distinctiveness engine.
 *
 * Content is passed in as typed data (see lib/caseStudies/*). This whole page is
 * one "use client" island because the rail + reveals are all scroll-driven.
 */

/* Per-section media get sequential Fig. numbers across the whole page. */
function useFigCounter() {
  let n = 0;
  return () => `Fig.${String(++n).padStart(2, "0")}`;
}

export function CaseStudy({ data }: { data: CaseStudyData }) {
  const nextFig = useFigCounter();

  return (
    <article className="hero-dark relative" data-header-dark>
      <StageRail items={data.rail} accent={data.accent} />

      {/* ── OPENING POSTER ─────────────────────────────────────────────── */}
      <header className="relative overflow-hidden pt-32 pb-20 sm:pt-40 sm:pb-28">
        {/* soft accent wash behind the title */}
        <div
          aria-hidden
          className="pointer-events-none absolute -top-40 left-1/2 h-[38rem] w-[38rem] -translate-x-1/2 rounded-full opacity-[0.16] blur-[120px]"
          style={{ background: data.accent }}
        />
        <Container className="relative">
          <Reveal>
            <Link
              href="/work"
              className="inline-flex items-center gap-1.5 text-[13px] font-medium text-fg/50 transition-colors hover:text-fg"
            >
              <ArrowLeft size={15} /> Work
            </Link>
          </Reveal>

          <p
            className="mt-8 text-[12px] font-semibold uppercase tracking-[0.2em]"
            style={{ color: data.accentSoft }}
          >
            {data.hero.eyebrow}
          </p>

          <SplitReveal
            as="h1"
            onScroll={false}
            className="mt-5 max-w-[16ch] text-[var(--step-5)] font-bold leading-[1.02] tracking-[-0.02em] text-fg"
          >
            {data.hero.title}
          </SplitReveal>

          <Reveal delay={0.1}>
            <p className="mt-7 max-w-[46rem] text-[var(--step-1)] leading-[1.6] text-fg/60">
              {data.hero.lede}
            </p>
          </Reveal>

          {/* snapshot bar */}
          <Reveal delay={0.16}>
            <dl className="mt-12 grid grid-cols-2 gap-x-8 gap-y-6 border-t border-fg/12 pt-8 sm:grid-cols-4">
              {data.hero.snapshot.map((s) => (
                <div key={s.label}>
                  <dt className="text-[11px] font-bold uppercase tracking-widest text-fg/40">
                    {s.label}
                  </dt>
                  <dd className="mt-1.5 text-[14px] font-medium leading-snug text-fg/85">
                    {s.value}
                  </dd>
                </div>
              ))}
            </dl>
          </Reveal>

          {/* headline metrics */}
          <Reveal delay={0.22}>
            <div className="mt-10 grid grid-cols-2 gap-x-8 gap-y-8 lg:grid-cols-4">
              {data.hero.metrics.map((m, i) => (
                <div key={i}>
                  <div
                    className="text-[var(--step-4)] font-bold leading-none tracking-[-0.02em]"
                    style={{
                      color: m.pending
                        ? "rgb(255 255 255 / 0.3)"
                        : data.accent,
                    }}
                  >
                    {m.value}
                  </div>
                  <div className="mt-2 text-[13px] font-semibold text-fg/80">
                    {m.label}
                  </div>
                  {m.description && (
                    <div className="mt-1 text-[12px] leading-snug text-fg/45">
                      {m.description}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </Reveal>
        </Container>
      </header>

      {/* cover slot — the poster image, full measure */}
      <Container width="wide">
        <MediaPlaceholder
          slot={{
            kind: "image",
            id: "00-cover",
            label:
              "Cover — the Live Incident Response situation room in action (hero screenshot: multi-drone feeds + shared map + live annotations)",
            width: "wide",
            ratio: "16/9",
          }}
          fig={nextFig()}
          accent={data.accent}
        />
      </Container>

      {/* ── THE SPINE ──────────────────────────────────────────────────── */}
      {data.sections.map((section) => (
        <SectionRenderer
          key={section.stage}
          section={section}
          accent={data.accent}
          accentSoft={data.accentSoft}
          nextFig={nextFig}
        />
      ))}

      {/* ── CLOSE ──────────────────────────────────────────────────────── */}
      <Container className="pb-28 pt-8">
        <Reveal className="mx-auto max-w-[42rem] border-t border-fg/12 pt-10 text-center">
          <p className="text-[12px] font-bold uppercase tracking-widest text-fg/40">
            End of case study
          </p>
          <p className="mt-3 text-[15px] text-fg/55">
            The contact + next-project handoff continues in the footer below.
          </p>
        </Reveal>
      </Container>
    </article>
  );
}

/* ── Section renderer — one component per section variant ────────────────── */

function SectionRenderer({
  section,
  accent,
  accentSoft,
  nextFig,
}: {
  section: Section;
  accent: string;
  accentSoft: string;
  nextFig: () => string;
}) {
  return (
    <section
      id={section.stage}
      data-stage={section.stage}
      className="scroll-mt-28 py-16 sm:py-24"
    >
      <Container>
        {/* section header — big number + stage label + heading */}
        <div className="mx-auto max-w-[46rem]">
          <div className="flex items-center gap-4">
            <span
              className="text-[var(--step-2)] font-bold tabular-nums"
              style={{ color: accent }}
            >
              {section.n}
            </span>
            <span className="text-[11px] font-bold uppercase tracking-[0.22em] text-fg/45">
              {section.eyebrow}
            </span>
          </div>
          <SplitReveal
            as="h2"
            onScroll
            className="mt-5 text-[var(--step-3)] font-bold leading-[1.1] tracking-[-0.02em] text-fg"
          >
            {section.heading}
          </SplitReveal>
        </div>

        {/* body — dispatched by variant */}
        <div className="mt-10">
          {section.kind === "prose" && (
            <ProseBody blocks={section.body} accent={accent} nextFig={nextFig} />
          )}

          {section.kind === "decisions" && (
            <>
              <Measure>
                <Para>{section.intro}</Para>
              </Measure>
              <div className="mt-12 space-y-8">
                {section.decisions.map((d) => (
                  <DecisionCard key={d.n} decision={d} accent={accent} />
                ))}
              </div>
            </>
          )}

          {section.kind === "features" && (
            <>
              <Measure>
                <Para>{section.intro}</Para>
              </Measure>
              <div className="mt-10 border-b border-fg/12">
                {section.features.map((f, i) => (
                  <FeatureRow
                    key={f.title}
                    feature={f}
                    index={i}
                    accent={accent}
                  />
                ))}
              </div>
            </>
          )}

          {section.kind === "impact" && (
            <>
              <Measure>
                <Para>{section.intro}</Para>
              </Measure>
              <div className="mx-auto mt-8 grid max-w-[52rem] gap-x-12 sm:grid-cols-2">
                {section.metrics.map((m, i) => (
                  <ImpactMetric key={i} metric={m} accent={accent} />
                ))}
              </div>
              <Reveal className="mx-auto mt-14 max-w-[46rem] rounded-[var(--radius-lg)] border border-fg/12 bg-fg/[0.02] p-7">
                <p
                  className="text-[11px] font-bold uppercase tracking-widest"
                  style={{ color: accentSoft }}
                >
                  Metrics worth adding if the data can be sourced
                </p>
                <ol className="mt-4 space-y-3">
                  {section.sourceable.map((s, i) => (
                    <li
                      key={i}
                      className="flex gap-3 text-[14px] leading-relaxed text-fg/60"
                    >
                      <span
                        className="mt-0.5 text-[12px] font-bold tabular-nums"
                        style={{ color: accent }}
                      >
                        {String(i + 1).padStart(2, "0")}
                      </span>
                      <span>{s}</span>
                    </li>
                  ))}
                </ol>
              </Reveal>
            </>
          )}
        </div>
      </Container>
    </section>
  );
}

/* ── Prose body — renders the mixed Block[] stream ───────────────────────── */

function ProseBody({
  blocks,
  accent,
  nextFig,
}: {
  blocks: Block[];
  accent: string;
  nextFig: () => string;
}) {
  // Group consecutive paragraphs into a single reading-measure column so the
  // narrative flows, while media/quotes/tables break the measure full-width.
  const out: React.ReactNode[] = [];
  let paraRun: React.ReactNode[] = [];
  let key = 0;

  const flush = () => {
    if (paraRun.length) {
      out.push(
        <Reveal key={`m${key++}`}>
          <Measure>{paraRun}</Measure>
        </Reveal>,
      );
      paraRun = [];
    }
  };

  for (const block of blocks) {
    if (block.t === "p") {
      paraRun.push(<Para key={key++}>{block.text}</Para>);
      continue;
    }
    flush();
    if (block.t === "quote") {
      out.push(
        <PullQuote key={key++} accent={accent}>
          {block.text}
        </PullQuote>,
      );
    } else if (block.t === "media") {
      out.push(
        <MediaPlaceholder
          key={key++}
          slot={block.slot}
          fig={nextFig()}
          accent={accent}
        />,
      );
    } else if (block.t === "metric") {
      out.push(<MetricRow key={key++} metric={block.metric} accent={accent} />);
    } else if (block.t === "table") {
      out.push(
        <DataTable
          key={key++}
          head={block.head}
          rows={block.rows}
          caption={block.caption}
        />,
      );
    }
  }
  flush();

  return <>{out}</>;
}
