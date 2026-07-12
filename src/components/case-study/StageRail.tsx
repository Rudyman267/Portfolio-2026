"use client";

import { useEffect, useRef, useState } from "react";
import { gsap, ScrollTrigger, useGSAP } from "@/lib/gsap";

export type RailItem = { n: string; stage: string; label: string };

/**
 * Fixed "you are here" wayfinding rail (desktop only). Sits on the left edge,
 * lists every numbered stage, and highlights the one currently in view as you
 * scroll. Mobile gets inline section numbers instead (rendered in the sections),
 * so this is hidden below lg.
 *
 * Tracks scroll via one ScrollTrigger per section (`data-stage` anchors in the
 * page). Reduced-motion users still get the highlight (it's information, not
 * decoration) — only the entrance fade is gated.
 */
export function StageRail({
  items,
  accent,
}: {
  items: RailItem[];
  accent: string;
}) {
  const [active, setActive] = useState<string>(items[0]?.stage ?? "");
  const root = useRef<HTMLElement>(null);

  useEffect(() => {
    const triggers = items.map((item) =>
      ScrollTrigger.create({
        trigger: `[data-stage="${item.stage}"]`,
        start: "top 45%",
        end: "bottom 45%",
        onToggle: (self) => {
          if (self.isActive) setActive(item.stage);
        },
      }),
    );
    return () => triggers.forEach((t) => t.kill());
  }, [items]);

  useGSAP(
    () => {
      const mm = gsap.matchMedia();
      mm.add("(prefers-reduced-motion: no-preference)", () => {
        gsap.from(root.current, {
          opacity: 0,
          x: -12,
          duration: 0.8,
          delay: 0.3,
          ease: "power2.out",
        });
      });
    },
    { scope: root },
  );

  return (
    <nav
      ref={root}
      aria-label="Case study sections"
      className="pointer-events-none fixed left-[max(1.25rem,calc((100vw-var(--container-content))/2-8.5rem))] top-1/2 z-40 hidden -translate-y-1/2 lg:block"
    >
      <ol className="flex flex-col gap-1">
        {items.map((item) => {
          const on = item.stage === active;
          return (
            <li key={item.stage} className="pointer-events-auto">
              <a
                href={`#${item.stage}`}
                className="group flex items-center gap-3 py-1 text-[11px] font-medium tracking-wide transition-colors"
                style={{ color: on ? accent : "rgb(255 255 255 / 0.32)" }}
              >
                {/* tick — grows and lights on active */}
                <span
                  aria-hidden
                  className="h-px transition-all duration-300"
                  style={{
                    width: on ? 28 : 14,
                    background: on ? accent : "rgb(255 255 255 / 0.32)",
                  }}
                />
                <span className="tabular-nums">{item.n}</span>
                <span
                  className="overflow-hidden whitespace-nowrap opacity-0 -translate-x-1 transition-all duration-300 group-hover:opacity-100 group-hover:translate-x-0"
                  style={{
                    opacity: on ? 1 : undefined,
                    transform: on ? "translateX(0)" : undefined,
                  }}
                >
                  {item.label}
                </span>
              </a>
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
