"use client";

/**
 * OroFrictionMap — the "Why?" problem framing, rebuilt as an animated,
 * typography-first diagram instead of the flat light-mode slide export.
 *
 * WHAT IT ARGUES
 * Four buyer segments hit four DIFFERENT frictions, and every one of them lands
 * on the SAME business outcome for ORO: lost sales, order errors, manual
 * back-and-forth. The convergence is the whole point — four inputs, one cost.
 *
 * WHY GSAP (the house tool), not shadcn/BLKit
 * This is a sequenced timeline: title → each segment reveals label, then
 * sub-label, then draws its connector → the destination node scales in → the
 * outcomes stagger up → hold → dissolve → loop. A paused, `repeat: -1` GSAP
 * timeline gives ordered beats, stroke-dashoffset path drawing and a seamless
 * loop for free. shadcn is a component kit (no animation), and the project is
 * Tailwind-v4 CSS-first with no config to init into.
 *
 * DESIGN LANGUAGE (Apple / Linear / Stripe / Anthropic keynote register)
 *  - Typography is the diagram. No boxes, cards, icons, gradients, glows, or
 *    shadows. Large segment headings, quiet sub-labels, generous whitespace.
 *  - Connectors are thin white lines at ~18% opacity, nudged to ~34% once drawn.
 *  - Motion is calm: fade + a <=16px upward slide, power-ease outs (no bounce,
 *    no overshoot). Everything moves the same small distance in the same easing.
 *
 * IMPLEMENTATION NOTES
 *  - Connector geometry is MEASURED from the real DOM (each segment's right/
 *    bottom edge → the ORO node), so the same code works at any width and after
 *    a reflow. Re-measured on resize and after fonts settle.
 *  - The loop DISSOLVES before it restarts (a fade-out beat + repeatDelay) so
 *    there is no hard snap back to the empty state.
 *  - Pauses when off-screen (IntersectionObserver) — no background animation
 *    over a long read.
 *  - `prefers-reduced-motion: reduce` renders the finished state, no timeline.
 */

import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { gsap, useGSAP } from "@/lib/gsap";

type Segment = { title: string; friction: string };

const SEGMENTS: Segment[] = [
  { title: "Small Shops", friction: "Complex online forms" },
  { title: "Mid-sized Chains", friction: "No real-time pricing or mockups" },
  { title: "Enterprise Buyers", friction: "Fragmented procurement workflow" },
  { title: "New Prospects", friction: "No ROI visibility" },
];

const OUTCOMES = ["Lost Sales", "Order Errors", "Manual Back-and-forth"];

type Path = { d: string; len: number };

export function OroFrictionMap({ caption }: { caption?: string }) {
  const root = useRef<HTMLDivElement>(null);
  const stage = useRef<HTMLDivElement>(null);
  const segRefs = useRef<(HTMLDivElement | null)[]>([]);
  const oroRef = useRef<HTMLDivElement>(null);
  const svgRef = useRef<SVGSVGElement>(null);

  const [box, setBox] = useState({ w: 0, h: 0 });
  const [paths, setPaths] = useState<Path[]>([]);
  const [reduced, setReduced] = useState(false);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    const sync = () => setReduced(mq.matches);
    sync();
    mq.addEventListener("change", sync);
    return () => mq.removeEventListener("change", sync);
  }, []);

  // Measure connector geometry from the laid-out DOM. Each line runs from a
  // segment's edge nearest the ORO node to the ORO node's near edge; the control
  // points bend along whichever axis dominates (side-by-side on desktop,
  // stacked on mobile) so the curve reads naturally in both layouts.
  const measure = () => {
    const st = stage.current;
    const oro = oroRef.current;
    if (!st || !oro) return;
    const base = st.getBoundingClientRect();
    const o = oro.getBoundingClientRect();
    const horizontal = base.width >= 640;

    const next: Path[] = [];
    for (const seg of segRefs.current) {
      if (!seg) continue;
      const s = seg.getBoundingClientRect();

      let x1: number, y1: number, x2: number, y2: number;
      if (horizontal) {
        x1 = s.right - base.left;
        y1 = s.top + s.height / 2 - base.top;
        x2 = o.left - base.left;
        y2 = o.top + o.height / 2 - base.top;
      } else {
        x1 = s.left + s.width / 2 - base.left;
        y1 = s.bottom - base.top;
        x2 = o.left + o.width / 2 - base.left;
        y2 = o.top - base.top;
      }

      const d = horizontal
        ? `M ${x1} ${y1} C ${x1 + (x2 - x1) * 0.5} ${y1}, ${x1 + (x2 - x1) * 0.5} ${y2}, ${x2} ${y2}`
        : `M ${x1} ${y1} C ${x1} ${y1 + (y2 - y1) * 0.5}, ${x2} ${y1 + (y2 - y1) * 0.5}, ${x2} ${y2}`;

      // path length for the stroke-dashoffset draw
      const tmp = document.createElementNS("http://www.w3.org/2000/svg", "path");
      tmp.setAttribute("d", d);
      const len = tmp.getTotalLength();
      next.push({ d, len });
    }
    setBox({ w: base.width, h: base.height });
    setPaths(next);
  };

  useLayoutEffect(() => {
    measure();
    const ro = new ResizeObserver(() => measure());
    if (stage.current) ro.observe(stage.current);
    // fonts change metrics → re-measure once they've settled
    if (document.fonts?.ready) document.fonts.ready.then(measure).catch(() => {});
    return () => ro.disconnect();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const el = root.current;
    if (!el) return;
    const io = new IntersectionObserver(
      ([e]) => setVisible(e.isIntersecting),
      { rootMargin: "0px 0px -15% 0px" },
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  useGSAP(
    () => {
      if (reduced || paths.length === 0) return;

      const q = gsap.utils.selector(root);
      const title = q("[data-fm-title]");
      const lines = q<SVGPathElement>("[data-fm-line]");
      const oroWord = q("[data-fm-oro]");
      const outcomes = q("[data-fm-outcome]");
      const segEls = SEGMENTS.map((_, i) => ({
        label: q(`[data-fm-label='${i}']`),
        sub: q(`[data-fm-sub='${i}']`),
      }));

      const OUT = "power3.out";
      const RISE = 16;

      // initial state — everything hidden, lines undrawn
      gsap.set([title, ...segEls.flatMap((s) => [s.label, s.sub]), oroWord, ...outcomes], {
        opacity: 0,
        y: RISE,
      });
      gsap.set(oroWord, { scale: 0.96, transformOrigin: "50% 50%" });
      lines.forEach((ln, i) => {
        const len = paths[i]?.len ?? ln.getTotalLength();
        gsap.set(ln, { strokeDasharray: len, strokeDashoffset: len, opacity: 0 });
      });

      const tl = gsap.timeline({
        repeat: -1,
        repeatDelay: 0.35,
        paused: true,
        defaults: { ease: OUT },
      });

      // Beat 1 — title
      tl.to(title, { opacity: 1, y: 0, duration: 0.7 }, 0.1);

      // Beats 2–5 — each segment: label, sub-label, then its connector draws
      segEls.forEach((s, i) => {
        const at = 0.9 + i * 1.05;
        tl.to(s.label, { opacity: 1, y: 0, duration: 0.55 }, at)
          .to(s.sub, { opacity: 1, y: 0, duration: 0.5 }, at + 0.18)
          .to(
            lines[i],
            { strokeDashoffset: 0, opacity: 0.18, duration: 0.8, ease: "power2.inOut" },
            at + 0.28,
          );
      });

      const converge = 0.9 + SEGMENTS.length * 1.05 + 0.15;

      // Beat 6 — lines converge (settle to full opacity) + ORO scales in
      tl.to(lines, { opacity: 0.34, duration: 0.6 }, converge)
        .to(oroWord, { opacity: 1, y: 0, scale: 1, duration: 0.7 }, converge);

      // Beat 7 — outcomes fade upward, staggered
      tl.to(
        outcomes,
        { opacity: 1, y: 0, duration: 0.55, stagger: 0.14 },
        converge + 0.5,
      );

      // Beat 8 — hold, then dissolve so the loop restarts without a hard reset
      const holdEnd = converge + 0.5 + 0.55 + OUTCOMES.length * 0.14 + 2;
      tl.to(
        [title, ...segEls.flatMap((s) => [s.label, s.sub]), oroWord, ...outcomes],
        { opacity: 0, duration: 0.7, ease: "power2.inOut" },
        holdEnd,
      ).to(lines, { opacity: 0, duration: 0.7, ease: "power2.inOut" }, holdEnd);

      // gate on visibility
      if (visible) tl.play();
      else tl.pause(0);

      return () => {
        tl.kill();
      };
    },
    { scope: root, dependencies: [paths, reduced, visible] },
  );

  const showFinal = reduced; // reduced motion → static finished state

  return (
    <figure ref={root} className="w-full">
      {/* No panel/background — it sits directly on the page canvas so it reads as
          part of the study, not an embedded slide. Slightly smaller type + tighter
          padding for the same reason. */}
      <div
        ref={stage}
        className="relative mx-auto max-w-[760px] px-[2%] py-[clamp(1.25rem,3.5vw,2.75rem)]"
      >
        {/* Title — "Why?" */}
        <div
          data-fm-title
          style={showFinal ? undefined : { opacity: 0 }}
          className="mb-[clamp(1.75rem,4.5vw,3rem)] text-[clamp(1.75rem,1.1rem+2.4vw,2.75rem)] font-bold leading-none tracking-[-0.02em] text-white"
        >
          Why?
        </div>

        <div className="grid items-center gap-x-[8%] gap-y-[clamp(2rem,5vw,3.25rem)] sm:grid-cols-[minmax(0,1fr)_auto]">
          {/* LEFT — the four segments, left-aligned, stacked */}
          <div className="flex flex-col gap-[clamp(1.4rem,3.2vw,2.4rem)]">
            {SEGMENTS.map((seg, i) => (
              <div
                key={seg.title}
                ref={(el) => {
                  segRefs.current[i] = el;
                }}
                className="max-w-[24ch]"
              >
                <div
                  data-fm-label={i}
                  style={showFinal ? undefined : { opacity: 0 }}
                  className="text-[clamp(1.05rem,0.85rem+0.85vw,1.4rem)] font-semibold leading-[1.15] tracking-[-0.01em] text-white"
                >
                  {seg.title}
                </div>
                <div
                  data-fm-sub={i}
                  style={showFinal ? undefined : { opacity: 0 }}
                  className="mt-1.5 text-[clamp(0.8rem,0.72rem+0.3vw,0.95rem)] font-normal leading-snug text-white/45"
                >
                  {seg.friction}
                </div>
              </div>
            ))}
          </div>

          {/* RIGHT — the single destination node */}
          <div ref={oroRef} className="justify-self-start sm:justify-self-end sm:text-right">
            <div
              data-fm-oro
              style={showFinal ? undefined : { opacity: 0 }}
              className="text-[clamp(2.25rem,1.7rem+2.4vw,3.75rem)] font-bold leading-none tracking-[-0.02em] text-white"
            >
              ORO
            </div>
            <div className="mt-[clamp(1rem,2vw,1.5rem)] space-y-2">
              {OUTCOMES.map((o) => (
                <div
                  key={o}
                  data-fm-outcome
                  style={showFinal ? undefined : { opacity: 0 }}
                  className="text-[clamp(0.85rem,0.78rem+0.35vw,1rem)] font-normal leading-tight text-white/55"
                >
                  {o}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Connectors — measured from the DOM, drawn via stroke-dashoffset */}
        <svg
          ref={svgRef}
          className="pointer-events-none absolute inset-0 h-full w-full"
          width={box.w || undefined}
          height={box.h || undefined}
          viewBox={box.w ? `0 0 ${box.w} ${box.h}` : undefined}
          fill="none"
          aria-hidden
        >
          {paths.map((p, i) => (
            <path
              key={i}
              data-fm-line
              d={p.d}
              stroke="#ffffff"
              strokeWidth={1}
              strokeLinecap="round"
              style={
                showFinal
                  ? { opacity: 0.34 }
                  : { opacity: 0, strokeDasharray: p.len, strokeDashoffset: p.len }
              }
            />
          ))}
        </svg>
      </div>

      {caption ? (
        <figcaption className="mx-auto mt-5 max-w-[var(--lir-measure)] text-center text-[length:var(--lir-caption)] leading-[1.5] text-muted">
          {caption}
        </figcaption>
      ) : null}
    </figure>
  );
}
