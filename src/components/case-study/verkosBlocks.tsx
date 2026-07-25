"use client";

import {
  AnimeReveal,
  AnimeVectorDraw,
  InlineSvg,
} from "@/components/case-study/VerkosMotion";

/* ============================================================================
   Verkos-specific block renderers — native decision cards + inline animated
   diagrams. All motion runs through anime.js (VerkosMotion), fired on enter by
   an IntersectionObserver, so nothing here touches the GSAP ScrollTrigger the
   case-study shell uses for its chapter flashes.
   ========================================================================== */

/* Decision-card fills — the EXACT Figma palette (258:2). Solid, vibrant panels
   (not dark washes): tempting amber, problem salmon, chose blue, why green.
   Heading/label + any highlight = #000; normal body copy inside = #363636. */
const CARD_WASH: Record<
  "tempting" | "problem" | "chose" | "why",
  { bg: string }
> = {
  tempting: { bg: "#FFB350" },
  problem: { bg: "#FFA09B" },
  chose: { bg: "#7AC3FF" },
  why: { bg: "#62FFC0" },
};

export type DecisionCard = {
  kind: "tempting" | "problem" | "chose" | "why";
  label: string;
  body: string | { lead?: string; text: string }[];
};

/**
 * DecisionText — a Verkos decision cluster rendered as native styled cards
 * (the copy is live text in Figma, not baked SVGs). The heading + cards rise in
 * on a stagger via anime.js as the cluster scrolls into view. Optional bare UI
 * screenshot below (no rounded container — house rule).
 */
export function DecisionText({
  n,
  heading,
  cards,
  img,
  imgAlt,
}: {
  n: string;
  heading: string;
  cards: DecisionCard[];
  img?: string;
  imgAlt?: string;
}) {
  // heading already carries its "01/02/03 …" number (from Figma); split it so
  // the number can be accented without double-printing it.
  const m = heading.match(/^(\d{2})\s+(.*)$/);
  const num = m ? m[1] : n;
  const title = m ? m[2] : heading;

  return (
    <div className="max-w-[var(--lir-measure)]">
      <AnimeReveal stagger={90}>
        <h3 className="max-w-[46ch] text-[length:var(--lir-lede)] font-bold leading-tight tracking-[-0.01em] text-fg">
          <span className="text-accent">{num}</span> {title}
        </h3>

        <div className="mt-6 grid gap-4 sm:grid-cols-2">
          {cards.map((c, i) => {
            const w = CARD_WASH[c.kind];
            // Figma layout: the FIRST TWO cards pair 2-up (tempting + its
            // counter); every card after that spans full width. Matches dd1
            // (tempting+problem 2-up, chose + why full) and dd2/dd3 (tempting +
            // chose 2-up, why full).
            const full = i >= 2;
            return (
              <div
                key={i}
                className={full ? "sm:col-span-2" : ""}
                style={{
                  background: w.bg,
                  borderRadius: "var(--radius-lg)",
                  padding: "1.4rem 1.5rem",
                }}
              >
                <p
                  className="text-[length:var(--lir-note)] font-bold"
                  style={{ color: "#000000" }}
                >
                  {c.label}
                </p>
                {(typeof c.body === "string"
                  ? [{ text: c.body }]
                  : c.body
                ).map((para, pi) => (
                  <p
                    key={pi}
                    className="mt-3 text-[length:var(--lir-note)] leading-relaxed"
                    style={{ color: "#363636" }}
                  >
                    {para.lead && (
                      // semibold lead sentence — Jakarta SemiBold, black (the
                      // mixed-weight "why" cards). Runs inline with the rest.
                      <span
                        className="font-semibold"
                        style={{ color: "#000000" }}
                      >
                        {para.lead}{" "}
                      </span>
                    )}
                    {para.text}
                  </p>
                ))}
              </div>
            );
          })}
        </div>
      </AnimeReveal>

      {img && (
        // bare UI screenshot — NO rounded container frame (house rule)
        <div className="mt-8">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={img}
            alt={imgAlt ?? ""}
            loading="eager"
            className="h-auto w-full"
          />
        </div>
      )}
    </div>
  );
}

/* ── Inline animated diagrams ─────────────────────────────────────────────── */

const NODE =
  "flex items-center justify-center rounded-[10px] border text-center text-[length:var(--lir-note)] font-semibold";
const nodeStyle = {
  borderColor: "rgba(255,255,255,0.16)",
  background: "rgba(255,255,255,0.04)",
  color: "#fff",
};

/** A labelled pill node used across the diagrams. */
function Node({
  children,
  accent,
}: {
  children: React.ReactNode;
  accent?: boolean;
}) {
  return (
    <div
      data-anime-child
      className={`${NODE} h-[64px] px-5`}
      style={
        accent
          ? {
              borderColor: "rgb(var(--color-accent) / 0.5)",
              background: "rgb(var(--color-accent) / 0.1)",
              color: "#fff",
            }
          : nodeStyle
      }
    >
      {children}
    </div>
  );
}

/**
 * VerkosDiagram — three inline diagrams, each with its connective vectors drawn
 * in by anime.js (AnimeVectorDraw) and its nodes fading up on a stagger.
 *   pipeline     — Drone · Pilot · DAA → LLM → Verkos Reports
 *   assembly     — Drone footage + AI detections + HIL → Verkos Reports
 *   personaSplit — Pilot (Create/Act) vs Business stakeholders (Observe)
 */
export function VerkosDiagram({
  which,
  caption,
}: {
  which: "pipeline" | "assembly" | "personaSplit";
  caption?: string;
}) {
  // the persona split is the REAL Figma vector (Reframe diagram.svg) — inlined
  // so anime.js can draw its branching curves in. The pipeline + assembly are
  // built inline (crisp, accent-themeable).
  if (which === "personaSplit") {
    return (
      <figure className="my-4 max-w-[var(--lir-measure)]">
        <InlineSvg
          src="/case-study/flytbase-2/reframe-diagram.svg"
          className="mx-auto w-full max-w-[860px]"
        />
        {caption && (
          <figcaption className="mt-5 text-center text-[11px] italic text-muted">
            {caption}
          </figcaption>
        )}
      </figure>
    );
  }

  // pipeline + assembly are one self-contained SVG (boxes, text, and connectors
  // in the SAME coordinate space, so nothing misaligns). AnimeVectorDraw draws
  // the connectors + fades the node labels in.
  const inputs =
    which === "pipeline" ? ["Drone", "Pilot", "DAA"] : ["Drone", "AI", "HIL"];
  const midLabel = which === "pipeline" ? "LLM" : null;

  return (
    <figure className="my-4 max-w-[var(--lir-measure)]">
      <AnimeVectorDraw className="mx-auto w-full max-w-[600px]">
        <FlowSvg inputs={inputs} midLabel={midLabel} />
      </AnimeVectorDraw>
      {caption && (
        <figcaption className="mt-5 text-center text-[11px] italic text-muted">
          {caption}
        </figcaption>
      )}
    </figure>
  );
}

/* ── VerkosLogo — the real Verkos mark (4 white rounded-rect petals + the cyan
   sharp star behind them), lifted from the Figma export. Native geometry lives
   around (43,173) in a ~104-unit cluster; we translate it to origin and scale to
   `size` so it can drop into any SVG at (x,y). ─────────────────────────────── */
function VerkosLogo({ x, y, size }: { x: number; y: number; size: number }) {
  const CLUSTER = 104; // native cluster extent
  const s = size / CLUSTER;
  return (
    <g transform={`translate(${x}, ${y}) scale(${s}) translate(-8, -131.5)`}>
      {/* cyan sharp star (drawn first, sits behind the petals) */}
      <path
        d="M41.6665 142.814C41.7993 141.384 43.8869 141.386 44.0171 142.816L45.3896 157.892C45.9538 164.09 50.7978 169.037 56.9826 169.732L76.3337 171.906C77.714 172.061 77.7392 174.058 76.3632 174.248L56.6422 176.969C50.6095 177.801 45.9441 182.678 45.3797 188.741L44.0088 203.471C43.8761 204.897 41.796 204.9 41.6588 203.475L40.2319 188.655C39.6493 182.603 34.9827 177.746 28.9592 176.922L9.3956 174.245C8.01849 174.056 8.04284 172.057 9.42413 171.903L28.6689 169.745C34.846 169.053 39.6879 164.118 40.2627 157.929L41.6665 142.814Z"
        fill="rgb(var(--color-accent))"
      />
      {/* four white petals */}
      <rect x="40.8555" y="156.564" width="20.0959" height="35.5205" rx="10.048" transform="rotate(134.57 40.8555 156.564)" fill="white" />
      <rect x="84.4766" y="199.793" width="20.0959" height="35.5205" rx="10.048" transform="rotate(134.57 84.4766 199.793)" fill="white" />
      <rect x="70.1602" y="131.491" width="20.0959" height="35.5205" rx="10.048" transform="rotate(45 70.1602 131.491)" fill="white" />
      <rect x="26.5" y="175.143" width="20.0959" height="35.5205" rx="10.048" transform="rotate(45 26.5 175.143)" fill="white" />
    </g>
  );
}

/* ── FlowSvg — the Figma pipeline/assembly diagram as ONE self-contained SVG.
   Three input boxes at top, curved connectors converging into an optional mid
   box (LLM), then a stem into the Verkos Reports box (with the star logo).
   Boxes stroked in accent-tinted white; connectors in accent, drawn in by
   anime.js. Coordinates in a 600×W viewBox so DOM/SVG never drift apart. ── */
function FlowSvg({
  inputs,
  midLabel,
}: {
  inputs: string[];
  midLabel: string | null;
}) {
  const W = 600;
  // rows
  const boxH = 76;
  const inTop = 8;
  const inBottom = inTop + boxH; // 84
  const midTop = midLabel ? 150 : 168;
  const midBottom = midTop + boxH;
  const repTop = midLabel ? 270 : 220;
  const repH = 92;
  const H = repTop + repH + 8;

  // three input boxes
  const gap = 20;
  const inW = (W - gap * 2) / 3;
  const cx = [inW / 2, W / 2, W - inW / 2]; // centers
  const midW = 300;
  const midX = (W - midW) / 2;
  const repW = 460;
  const repX = (W - repW) / 2;
  const stroke = "rgb(var(--color-accent))";

  // connector target: converge to the mid box top (LLM) or straight to report
  const targetY = midLabel ? midTop : repTop;
  const targetX = W / 2;

  return (
    <svg
      viewBox={`0 0 ${W} ${H}`}
      className="block h-auto w-full"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      {/* connectors — drawn in by anime (they carry a stroke, so AnimeVectorDraw
          treats them as draw targets) */}
      <g stroke={stroke} strokeWidth="1.6" strokeOpacity="0.75" fill="none">
        {cx.map((x, i) => (
          <path
            key={i}
            d={`M ${x} ${inBottom} C ${x} ${(inBottom + targetY) / 2}, ${targetX} ${(inBottom + targetY) / 2}, ${targetX} ${targetY}`}
          />
        ))}
        {/* mid → report stem (only when there's a mid box) */}
        {midLabel && (
          <line x1={W / 2} y1={midBottom} x2={W / 2} y2={repTop} />
        )}
      </g>

      {/* input boxes */}
      {inputs.map((label, i) => {
        const x = i * (inW + gap);
        return (
          <g key={label} data-anime-child>
            <rect
              x={x}
              y={inTop}
              width={inW}
              height={boxH}
              rx={14}
              fill="rgba(255,255,255,0.03)"
              stroke="rgba(255,255,255,0.18)"
              strokeWidth="1.2"
            />
            <text
              x={x + inW / 2}
              y={inTop + boxH / 2}
              textAnchor="middle"
              dominantBaseline="central"
              fill="#fff"
              fontWeight="600"
              fontSize="17"
            >
              {label}
            </text>
          </g>
        );
      })}

      {/* mid box (LLM) */}
      {midLabel && (
        <g data-anime-child>
          <rect
            x={midX}
            y={midTop}
            width={midW}
            height={boxH}
            rx={14}
            fill="rgba(255,255,255,0.03)"
            stroke="rgba(255,255,255,0.18)"
            strokeWidth="1.2"
          />
          <text
            x={W / 2}
            y={midTop + boxH / 2}
            textAnchor="middle"
            dominantBaseline="central"
            fill="#fff"
            fontWeight="600"
            fontSize="17"
          >
            {midLabel}
          </text>
        </g>
      )}

      {/* Verkos Reports box — accent-tinted, with the star logo */}
      <g data-anime-child>
        <rect
          x={repX}
          y={repTop}
          width={repW}
          height={repH}
          rx={16}
          fill="rgb(var(--color-accent) / 0.08)"
          stroke="rgb(var(--color-accent) / 0.5)"
          strokeWidth="1.4"
        />
        {/* logo + wordmark centred AS A GROUP in the box. Group width ≈ logo(38)
            + gap(16) + text(~146). Left edge = center − half that; logo sits at
            the left, the wordmark starts just after it (left-anchored). */}
        {(() => {
          const logoW = 38;
          const gap = 16;
          const textW = 146; // approx "Verkos Reports" at 19px/700
          const groupLeft = W / 2 - (logoW + gap + textW) / 2;
          return (
            <>
              <VerkosLogo
                x={groupLeft}
                y={repTop + repH / 2 - logoW / 2}
                size={logoW}
              />
              <text
                x={groupLeft + logoW + gap}
                y={repTop + repH / 2}
                textAnchor="start"
                dominantBaseline="central"
                fill="#fff"
                fontWeight="700"
                fontSize="19"
              >
                Verkos Reports
              </text>
            </>
          );
        })()}
      </g>
    </svg>
  );
}

