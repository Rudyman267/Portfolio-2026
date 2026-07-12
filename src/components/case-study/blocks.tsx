"use client";

import { ArrowUpRight } from "lucide-react";
import { Reveal } from "@/components/motion/Reveal";
import type {
  Decision,
  Feature,
  MediaSlot,
  Metric,
} from "@/lib/caseStudies/liveIncidentResponse";

/* ---------------------------------------------------------------------------
   Small presentational building blocks for the dark-editorial case study.
   All colors come from the .hero-dark token scope; accent is passed in per
   study (the distinctiveness engine). Motion is via <Reveal> (reduced-motion
   safe). Nothing here reaches for Sanity — content is passed as props.
   ------------------------------------------------------------------------- */

/** Reading-measure wrapper — ~65ch narrative column, centered in the section. */
export function Measure({ children }: { children: React.ReactNode }) {
  return <div className="mx-auto max-w-[42rem]">{children}</div>;
}

export function Para({ children }: { children: React.ReactNode }) {
  return (
    <p className="text-[var(--step-0)] leading-[1.75] text-fg/70 [&+&]:mt-6">
      {children}
    </p>
  );
}

/** A designed pull-quote — the seniority signal on a fast scroll. */
export function PullQuote({
  children,
  accent,
}: {
  children: React.ReactNode;
  accent: string;
}) {
  return (
    <Reveal className="mx-auto my-14 max-w-[52rem]">
      <figure className="relative pl-6 sm:pl-8">
        <span
          aria-hidden
          className="absolute left-0 top-1 h-[calc(100%-0.5rem)] w-[3px] rounded-full"
          style={{ background: accent }}
        />
        <blockquote className="text-[var(--step-2)] font-semibold leading-[1.3] tracking-[-0.01em] text-fg">
          {children}
        </blockquote>
      </figure>
    </Reveal>
  );
}

/**
 * Labeled media placeholder. Renders now as a Fig.NN slot describing what the
 * real export should show; drop the Figma asset with the matching id later and
 * swap this for <SanityImage>/<img>. `ratio`/`width` come from the slot.
 */
export function MediaPlaceholder({
  slot,
  fig,
  accent,
}: {
  slot: MediaSlot;
  fig: string;
  accent: string;
}) {
  const kindLabel: Record<MediaSlot["kind"], string> = {
    image: "Screenshot",
    gallery: "Image set",
    diagram: "Diagram",
    graph: "Graph",
    video: "Video",
  };

  return (
    <Reveal className="my-12">
      <figure>
        <div
          className="relative flex flex-col items-center justify-center overflow-hidden rounded-[var(--radius-lg)] border border-dashed border-fg/20 bg-fg/[0.03] px-6 py-10 text-center"
          style={{ aspectRatio: slot.ratio ?? "16/9" }}
        >
          {/* faint grid texture so an empty slot still reads as "media coming" */}
          <div
            aria-hidden
            className="pointer-events-none absolute inset-0 opacity-[0.15]"
            style={{
              backgroundImage:
                "linear-gradient(rgb(255 255 255 / 0.4) 1px, transparent 1px), linear-gradient(90deg, rgb(255 255 255 / 0.4) 1px, transparent 1px)",
              backgroundSize: "32px 32px",
            }}
          />
          <span
            className="relative mb-3 inline-flex items-center gap-2 rounded-full border px-3 py-1 text-[11px] font-semibold uppercase tracking-widest"
            style={{ borderColor: accent, color: accent }}
          >
            {fig} · {kindLabel[slot.kind]}
          </span>
          <p className="relative max-w-[38ch] text-[13px] font-medium leading-relaxed text-fg/55">
            {slot.label}
          </p>
        </div>
        <figcaption className="mt-3 text-center text-[12px] font-medium text-fg/40">
          {fig} — {slot.caption ?? slot.label}
        </figcaption>
      </figure>
    </Reveal>
  );
}

/** A single big metric — value + label + optional context line. */
export function MetricRow({
  metric,
  accent,
}: {
  metric: Metric;
  accent: string;
}) {
  return (
    <Reveal className="my-10">
      <div
        className="mx-auto max-w-[42rem] rounded-[var(--radius-lg)] border p-6"
        style={{
          borderColor: metric.pending ? "rgb(255 255 255 / 0.14)" : accent,
          borderStyle: metric.pending ? "dashed" : "solid",
        }}
      >
        <div className="flex items-baseline gap-3">
          <span
            className="text-[var(--step-4)] font-bold tracking-[-0.02em]"
            style={{ color: metric.pending ? "rgb(255 255 255 / 0.35)" : accent }}
          >
            {metric.value}
          </span>
          <span className="text-[var(--step-0)] font-semibold text-fg/85">
            {metric.label}
          </span>
        </div>
        {metric.description && (
          <p className="mt-2 text-[14px] leading-relaxed text-fg/50">
            {metric.description}
          </p>
        )}
        {metric.pending && (
          <p className="mt-2 text-[11px] font-medium uppercase tracking-widest text-fg/30">
            Awaiting data
          </p>
        )}
      </div>
    </Reveal>
  );
}

/** A structured table — snapshot layers, role breakdowns, etc. */
export function DataTable({
  head,
  rows,
  caption,
}: {
  head: string[];
  rows: string[][];
  caption?: string;
}) {
  return (
    <Reveal className="my-12">
      <figure className="mx-auto max-w-[52rem]">
        <div className="overflow-x-auto rounded-[var(--radius-lg)] border border-fg/12">
          <table className="w-full border-collapse text-left align-top">
            <thead>
              <tr>
                {head.map((h) => (
                  <th
                    key={h}
                    className="border-b border-fg/12 bg-fg/[0.03] px-5 py-3 text-[11px] font-bold uppercase tracking-widest text-fg/45"
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.map((row, ri) => (
                <tr key={ri} className="align-top">
                  {row.map((cell, ci) => (
                    <td
                      key={ci}
                      className={`px-5 py-4 text-[14px] leading-relaxed ${
                        ci === 0
                          ? "font-semibold text-fg/85"
                          : "text-fg/60"
                      } ${ri > 0 ? "border-t border-fg/10" : ""}`}
                    >
                      {cell}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {caption && (
          <figcaption className="mt-3 text-center text-[12px] font-medium text-fg/40">
            {caption}
          </figcaption>
        )}
      </figure>
    </Reveal>
  );
}

/** A key-decision card — the centerpiece of §04. Number, choice, reasoning,
 *  and the tradeoff named out loud in an accented footer. */
export function DecisionCard({
  decision,
  accent,
}: {
  decision: Decision;
  accent: string;
}) {
  return (
    <Reveal className="mx-auto max-w-[46rem]">
      <article className="rounded-[var(--radius-lg)] border border-fg/12 bg-fg/[0.02] p-7 sm:p-9">
        <div className="flex items-baseline gap-4">
          <span
            className="text-[var(--step-2)] font-bold tabular-nums"
            style={{ color: accent }}
          >
            {decision.n}
          </span>
          <h3 className="text-[var(--step-2)] font-bold leading-[1.15] tracking-[-0.01em] text-fg">
            {decision.title}
          </h3>
        </div>
        <div className="mt-5 space-y-4">
          {decision.body.map((p, i) => (
            <p key={i} className="text-[15px] leading-[1.7] text-fg/65">
              {p}
            </p>
          ))}
        </div>
        <div
          className="mt-6 rounded-[var(--radius-md)] px-5 py-4"
          style={{ background: `${accent}14` }}
        >
          <p className="text-[11px] font-bold uppercase tracking-widest" style={{ color: accent }}>
            The tradeoff
          </p>
          <p className="mt-1.5 text-[14px] leading-relaxed text-fg/75">
            {decision.tradeoff}
            {decision.tradeoffPending && (
              <span className="ml-1.5 rounded-full border border-dashed border-fg/25 px-2 py-0.5 text-[10px] font-medium uppercase tracking-wider text-fg/40">
                quantify
              </span>
            )}
          </p>
        </div>
      </article>
    </Reveal>
  );
}

/** A shipped-feature row — the feature paired with the decision behind it. */
export function FeatureRow({
  feature,
  index,
  accent,
}: {
  feature: Feature;
  index: number;
  accent: string;
}) {
  return (
    <Reveal className="border-t border-fg/12 py-8">
      <div className="mx-auto grid max-w-[52rem] gap-x-10 gap-y-3 md:grid-cols-[1fr_1.4fr]">
        <div className="flex items-start gap-3">
          <span
            className="mt-1 text-[12px] font-bold tabular-nums"
            style={{ color: accent }}
          >
            {String(index + 1).padStart(2, "0")}
          </span>
          <h3 className="text-[var(--step-1)] font-bold leading-tight tracking-[-0.01em] text-fg">
            {feature.title}
          </h3>
        </div>
        <div>
          <p className="text-[15px] leading-[1.7] text-fg/65">{feature.body}</p>
          {feature.note && (
            <p
              className="mt-3 border-l-2 pl-4 text-[13px] leading-relaxed text-fg/55"
              style={{ borderColor: accent }}
            >
              {feature.note}
            </p>
          )}
        </div>
      </div>
    </Reveal>
  );
}

/** An impact metric — big directional number + what it measured + what it proves.
 *  Renders an ↑ arrow accent (gauravi-style) when not pending. */
export function ImpactMetric({
  metric,
  accent,
}: {
  metric: Metric;
  accent: string;
}) {
  return (
    <Reveal>
      <div className="border-t border-fg/12 py-8">
        <div className="flex items-baseline gap-2">
          <span
            className="text-[var(--step-5)] font-bold leading-none tracking-[-0.03em]"
            style={{ color: metric.pending ? "rgb(255 255 255 / 0.3)" : accent }}
          >
            {metric.value}
          </span>
          {!metric.pending && (
            <ArrowUpRight
              size={28}
              strokeWidth={2.5}
              style={{ color: accent }}
            />
          )}
        </div>
        <p className="mt-3 text-[var(--step-0)] font-semibold text-fg/85">
          {metric.label}
        </p>
        {metric.description && (
          <p className="mt-2 max-w-[42ch] text-[14px] leading-relaxed text-fg/50">
            {metric.description}
          </p>
        )}
        {metric.pending && (
          <p className="mt-2 text-[11px] font-medium uppercase tracking-widest text-fg/30">
            Awaiting data
          </p>
        )}
      </div>
    </Reveal>
  );
}
