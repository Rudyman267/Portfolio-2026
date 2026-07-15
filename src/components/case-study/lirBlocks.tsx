"use client";

import { useRef, useState, type ReactNode } from "react";
import {
  Users,
  Monitor,
  Clock,
  Languages,
  ArrowLeft,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { gsap, useGSAP, ScrollTrigger } from "@/lib/gsap";
import type { MattersItem, MediaRow, MediaSlot } from "@/lib/caseStudies/lirDesign";

/* ── CountUp — ticks a stat value up from 0 → target when it scrolls into view.
   Handles non-numeric decoration: "<30s" → prefix "<", number 30, suffix "s";
   "125" → 125. Reduced-motion just shows the final value. ─────────────────── */
export function CountUp({
  value,
  className,
}: {
  value: string;
  className?: string;
}) {
  const ref = useRef<HTMLSpanElement>(null);

  // Split "<30s" into ["<", "30", "s"] — leading non-digits, the number, trailing.
  const match = value.match(/^(\D*)([\d.,]+)(.*)$/);
  const prefix = match?.[1] ?? "";
  const numStr = match?.[2] ?? "";
  const suffix = match?.[3] ?? "";
  const target = Number(numStr.replace(/,/g, ""));
  const decimals = numStr.includes(".") ? numStr.split(".")[1].length : 0;

  useGSAP(
    () => {
      const el = ref.current;
      if (!el || !match || Number.isNaN(target)) return;
      const mm = gsap.matchMedia();

      mm.add("(prefers-reduced-motion: no-preference)", () => {
        const obj = { n: 0 };
        const render = () =>
          (el.textContent = `${prefix}${obj.n.toFixed(decimals)}${suffix}`);
        render();

        // A paused tween we (re)start every time the stat scrolls into frame,
        // and reset to 0 when it leaves — so it replays on each entry, slowly.
        const tween = gsap.to(obj, {
          n: target,
          duration: 2.8, // slow count-up
          ease: "power2.out",
          paused: true,
          onUpdate: render,
        });

        const reset = () => {
          obj.n = 0;
          render();
        };

        ScrollTrigger.create({
          trigger: el,
          start: "top 85%",
          end: "bottom top",
          onEnter: () => tween.restart(),
          onEnterBack: () => tween.restart(),
          onLeave: reset, // scrolled past below → reset for next time
          onLeaveBack: reset, // scrolled back above → reset for next time
        });
      });

      mm.add("(prefers-reduced-motion: reduce)", () => {
        el.textContent = value;
      });
    },
    { scope: ref },
  );

  // SSR / no-JS: render the final value; the effect swaps to 0 then ticks up.
  return (
    <span ref={ref} className={className}>
      {value}
    </span>
  );
}

/* ============================================================================
   LIR case-study visual atoms — the light/editorial building blocks recreated
   from Figma 172:56. Accent blue is the scoped --color-accent (#1291e0).
   Decision cards use fixed green / orange washes semantic to that block.
   ========================================================================== */

/* ── Figure — a real asset renders BARE (spawned as-is, no frame); a not-yet-
   exported slot (no src) renders the dashed labelled placeholder box. ─────── */
export function Figure({
  slot,
  fig,
  ratio = "16 / 9",
  className,
}: {
  slot: MediaSlot;
  fig?: string;
  ratio?: string;
  className?: string;
}) {
  // Real asset → bare image, no border/bg/aspect box. Spawned as-is.
  if (slot.src) {
    return (
      <figure className={cn("group", className)}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={slot.src}
          alt={slot.label}
          className="h-auto w-full"
          loading="eager"
        />
        {slot.caption && (
          <figcaption className="mt-3 text-[length:var(--lir-label)] italic text-faint">
            {slot.caption}
          </figcaption>
        )}
      </figure>
    );
  }

  // Placeholder (no export yet) → the dashed labelled frame.
  return (
    <figure className={cn("group", className)}>
      <div
        className="relative overflow-hidden rounded-[var(--radius-lg)] border border-white/10 bg-surface-2"
        style={{ aspectRatio: slot.ratio ?? ratio }}
      >
        <div
          aria-hidden
          className="absolute inset-0 opacity-[0.5]"
          style={{
            backgroundImage:
              "radial-gradient(rgb(var(--color-fg) / 0.10) 1px, transparent 1px)",
            backgroundSize: "22px 22px",
          }}
        />
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 p-6 text-center">
          {fig && (
            <span className="rounded-full bg-accent/10 px-2.5 py-0.5 text-[11px] font-bold uppercase tracking-widest text-accent">
              {fig}
            </span>
          )}
          <p className="max-w-[52ch] text-[13px] leading-relaxed text-muted">
            {slot.label}
          </p>
        </div>
      </div>
      {slot.caption && (
        <figcaption className="mt-3 text-[length:var(--lir-label)] italic text-faint">
          {slot.caption}
        </figcaption>
      )}
    </figure>
  );
}

/* ── BeforeAfter — a left-to-right wipe slider between two images. Drag the
   handle (or click/tap anywhere) to reveal more of "after". Both images are
   spawned as-is (no frame); the AFTER sits under a clip that the handle drives.
   Keyboard-accessible via the range input. ─────────────────────────────────── */
export function BeforeAfter({
  before,
  after,
  caption,
}: {
  before: string;
  after: string;
  caption?: string;
}) {
  const wrap = useRef<HTMLDivElement>(null);
  const [pos, setPos] = useState(50); // % revealed of the AFTER (right) image
  const dragging = useRef(false);

  const setFromClientX = (clientX: number) => {
    const el = wrap.current;
    if (!el) return;
    const r = el.getBoundingClientRect();
    const p = ((clientX - r.left) / r.width) * 100;
    setPos(Math.max(0, Math.min(100, p)));
  };

  return (
    <div>
      <div
        ref={wrap}
        className="relative w-full touch-none select-none overflow-hidden rounded-[6px]"
        onPointerDown={(e) => {
          dragging.current = true;
          (e.target as HTMLElement).setPointerCapture?.(e.pointerId);
          setFromClientX(e.clientX);
        }}
        onPointerMove={(e) => dragging.current && setFromClientX(e.clientX)}
        onPointerUp={() => (dragging.current = false)}
        onPointerCancel={() => (dragging.current = false)}
      >
        {/* BEFORE — full width underneath */}
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={before} alt="Before — the AI's first-pass interface" className="block h-auto w-full" draggable={false} />
        {/* AFTER — clipped from the left edge to `pos` */}
        <div
          className="absolute inset-0 overflow-hidden"
          style={{ clipPath: `inset(0 0 0 ${pos}%)` }}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={after}
            alt="After — the final shipped Live Incident Response screen"
            className="block h-auto w-full"
            draggable={false}
          />
        </div>
        {/* corner labels */}
        <span className="pointer-events-none absolute left-3 top-3 rounded-full bg-black/55 px-2.5 py-1 text-[11px] font-semibold uppercase tracking-widest text-white/85">
          Before
        </span>
        <span className="pointer-events-none absolute right-3 top-3 rounded-full bg-accent/85 px-2.5 py-1 text-[11px] font-semibold uppercase tracking-widest text-[#1b1204]">
          After
        </span>
        {/* the divider + handle */}
        <div
          className="pointer-events-none absolute inset-y-0 z-10 w-px bg-white/80"
          style={{ left: `${pos}%` }}
        >
          <span className="absolute top-1/2 left-1/2 flex h-11 w-11 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full border border-white/70 bg-black/60 text-white backdrop-blur">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
              <path d="M9 6 3 12l6 6M15 6l6 6-6 6" />
            </svg>
          </span>
        </div>
        {/* a11y: keyboard control */}
        <input
          type="range"
          min={0}
          max={100}
          value={pos}
          onChange={(e) => setPos(Number(e.target.value))}
          aria-label="Reveal the after screen"
          className="absolute inset-x-0 bottom-0 z-20 h-11 w-full cursor-ew-resize opacity-0"
        />
      </div>
      {caption && (
        <p className="mt-6 text-center text-[length:var(--lir-body)] leading-relaxed text-muted">
          {caption}
        </p>
      )}
    </div>
  );
}

/* ── FeatureRow — a feature block (Figma 240:42): a cream #FFE2B1 tagline pill
   (full width) above a two-column row. The text column is STICKY (holds fixed
   while the images beside it move); the image column holds the screenshots.

   With 2+ images they sit in a horizontal, scroll-snapping strip — they read
   "one after another" and can be swiped/scrolled through; the sticky text stays
   put beside them. With a single image there is no strip — it just sits there.
   No GSAP pin (that fought the chapter/column layout); pure CSS, robust. */
export function FeatureRow({
  tagline,
  title,
  body,
  body2,
  textSide = "right",
  media,
}: {
  tagline: string;
  title: string;
  body: string;
  body2?: string;
  textSide?: "left" | "right";
  media: MediaSlot[];
}) {
  const imgs = media.filter((m) => m.src);
  const multi = imgs.length > 1;

  const textCol = (
    <div className="flex flex-col gap-5 lg:sticky lg:top-32 lg:self-start">
      <h3 className="text-[length:var(--lir-title)] font-semibold leading-tight tracking-[-0.01em] text-fg">
        {title}
      </h3>
      <p className="text-[length:var(--lir-body-sm)] leading-relaxed text-[#d2d2d2]">
        {body}
      </p>
      {body2 && (
        <p className="text-[length:var(--lir-body-sm)] leading-relaxed text-[#d2d2d2]">
          {body2}
        </p>
      )}
    </div>
  );

  // image column: horizontal scroll-snap strip (2+) or a single bare image.
  const imgCol = multi ? (
    <div className="-mx-[var(--gutter)] px-[var(--gutter)]">
      <div className="flex snap-x snap-mandatory gap-5 overflow-x-auto pb-3 [scrollbar-width:thin]">
        {imgs.map((m) => (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            key={m.id}
            src={m.src}
            alt={m.label}
            className="h-auto w-[min(82vw,480px)] shrink-0 snap-start"
            loading="eager"
          />
        ))}
      </div>
    </div>
  ) : (
    // eslint-disable-next-line @next/next/no-img-element
    <img src={imgs[0]?.src} alt={imgs[0]?.label} className="h-auto w-full" loading="eager" />
  );

  const imgLeft = textSide === "right";

  return (
    <div>
      {tagline && (
        <div className="mb-12 flex justify-center">
          <p
            className="inline-block rounded-[19px] px-8 py-4 text-center text-[clamp(1.1rem,0.8rem+1vw,1.7rem)] font-semibold leading-snug text-[#363636]"
            style={{ background: "#ffe2b1" }}
          >
            {tagline}
          </p>
        </div>
      )}
      <div className="grid items-start gap-8 lg:grid-cols-2 lg:gap-14">
        {imgLeft ? (
          <>
            <div className="order-2 min-w-0 lg:order-1">{imgCol}</div>
            <div className="order-1 lg:order-2">{textCol}</div>
          </>
        ) : (
          <>
            <div className="order-1">{textCol}</div>
            <div className="order-2 min-w-0">{imgCol}</div>
          </>
        )}
      </div>
    </div>
  );
}

/* ── Blue-outlined callout / audit note ───────────────────────────────────── */
export function OutlineNote({ children }: { children: ReactNode }) {
  return (
    <div className="rounded-[var(--radius-lg)] border border-accent/45 px-6 py-5">
      <p className="text-[length:var(--lir-body-sm)] leading-relaxed text-accent">
        {children}
      </p>
    </div>
  );
}

/* ── Big blue pull-quote ──────────────────────────────────────────────────── */
export function PullQuote({ children }: { children: ReactNode }) {
  return (
    <blockquote className="mx-auto max-w-[26ch] text-balance text-center text-[length:var(--lir-headline)] font-extrabold leading-[1.15] tracking-[-0.01em] text-accent">
      {children}
    </blockquote>
  );
}

/* ── "X matters" list — blue icon + blue heading + body ───────────────────── */
const MATTERS_ICON = {
  roles: Users,
  context: Monitor,
  time: Clock,
  language: Languages,
} as const;

export function MattersList({ items }: { items: MattersItem[] }) {
  return (
    <div className="space-y-8">
      {items.map((it) => {
        const Icon = MATTERS_ICON[it.icon];
        return (
          <div key={it.title}>
            <div className="flex items-center gap-2.5">
              <Icon size={22} className="text-accent" strokeWidth={1.7} />
              <h3 className="text-[length:var(--lir-lede)] font-semibold text-accent">
                {it.title}
              </h3>
            </div>
            <p className="mt-2 text-[length:var(--lir-body)] leading-relaxed text-fg/85">
              {it.body}
            </p>
          </div>
        );
      })}
    </div>
  );
}

/* ── "Here's the gap" — two amber-washed scene cards ──────────────────────── */
export function GapCards({ scene, roles }: { scene: string; roles: string }) {
  return (
    <div>
      <p className="text-[length:var(--lir-headline)] font-extrabold tracking-[-0.01em] text-fg">
        Here&rsquo;s the gap
      </p>
      <div className="mt-7 grid gap-5 md:grid-cols-2">
        {[scene, roles].map((text, i) => (
          <div
            key={i}
            className="rounded-[var(--radius-lg)] px-6 py-6"
            style={{ background: "#f6a94a", color: "#1b1204" }}
          >
            <p className="text-[length:var(--lir-body-sm)] leading-relaxed">
              {text}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ── Design decision cluster (Figma 239:27) — a top ROW of two small cards
   (orange "tempting" + its counter), one or more WIDE reasoning cards below,
   then the supporting map screenshots in a BOUNDED grid: the small maps sit
   2-up in fixed-aspect frames (hairline border, cropped) and any wide map spans
   full width. Sizing the images down is the whole point — they must never
   render at their native full scale. ────────────────────────────────────────── */
export function DecisionCluster({
  n,
  heading,
  row,
  wide,
  mediaRows,
}: {
  n: string;
  heading: string;
  row: [string, string];
  wide: string[];
  mediaRows?: MediaRow[];
}) {
  return (
    <div>
      <h3 className="max-w-[40ch] text-[length:var(--lir-lede)] font-bold leading-tight tracking-[-0.01em] text-fg">
        <span className="text-accent">{n}</span> {heading}
      </h3>
      {/* two small cards side by side */}
      <div className="mt-6 grid gap-5 md:grid-cols-2">
        {row.map((src) => (
          // eslint-disable-next-line @next/next/no-img-element
          <img key={src} src={src} alt="" className="h-auto w-full rounded-[var(--radius-lg)]" loading="eager" />
        ))}
      </div>
      {/* wide reasoning card(s) stacked below */}
      <div className="mt-5 space-y-5">
        {wide.map((src) => (
          // eslint-disable-next-line @next/next/no-img-element
          <img key={src} src={src} alt="" className="h-auto w-full rounded-[var(--radius-lg)]" loading="eager" />
        ))}
      </div>

      {/* supporting screenshots — resized DOWN and spawned as-is: bare full
          images (no frame, no crop). Each row lays its images out side by side
          per its `cols` (e.g. the 3 phone shots 3-up). (Figma 239:27 / 240:xx) */}
      {mediaRows && mediaRows.length > 0 && (
        <div className="mt-8 space-y-6">
          {mediaRows.map((r, i) => {
            const cols = r.cols ?? r.imgs.length;
            return (
              <figure key={i}>
                <div
                  className="grid items-start gap-5"
                  style={{ gridTemplateColumns: `repeat(${cols}, minmax(0, 1fr))` }}
                >
                  {r.imgs.map((src) => (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img key={src} src={src} alt="" className="h-auto w-full" loading="eager" />
                  ))}
                </div>
                {r.caption && (
                  <figcaption className="mt-4 text-center text-[length:var(--lir-body-sm)] text-muted">
                    {r.caption}
                  </figcaption>
                )}
              </figure>
            );
          })}
        </div>
      )}
    </div>
  );
}

/* ============================================================================
   INLINE DIAGRAMS — the Figma vectors rebuilt as SVG so they scale + retheme.
   ========================================================================== */

/* The FlytBase drone mark — the blue four-point sparkle with grey rotor blades
   behind it at the diagonals. Exact vector supplied from Figma. Shared across
   the hero title, the meta-card wordmark, and the persona-split diagram. */
export function DroneMark({
  size = 44,
  className,
}: {
  size?: number;
  className?: string;
}) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 86 86"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-hidden
    >
      <path
        d="M41.6665 12.7797C41.7993 11.3503 43.8869 11.3522 44.0171 12.7819L45.3896 27.8579C45.9538 34.056 50.7978 39.0032 56.9826 39.698L76.3337 41.8719C77.714 42.027 77.7392 44.0241 76.3632 44.2139L56.6422 46.9346C50.6095 47.7668 45.9441 52.6436 45.3797 58.7073L44.0088 73.4372C43.8761 74.8628 41.796 74.8661 41.6588 73.441L40.2319 58.621C39.6493 52.5693 34.9827 47.7121 28.9592 46.8878L9.3956 44.2106C8.01849 44.0222 8.04284 42.0232 9.42413 41.8684L28.6689 39.711C34.846 39.0185 39.6879 34.0836 40.2627 27.8944L41.6665 12.7797Z"
        fill="#FF8D3B"
      />
      <rect x="40.8555" y="26.5308" width="20.0959" height="35.5205" rx="10.048" transform="rotate(134.57 40.8555 26.5308)" fill="#FFFFFF" />
      <rect x="84.4766" y="69.7586" width="20.0959" height="35.5205" rx="10.048" transform="rotate(134.57 84.4766 69.7586)" fill="#FFFFFF" />
      <rect x="70.1582" y="1.45709" width="20.0959" height="35.5205" rx="10.048" transform="rotate(45 70.1582 1.45709)" fill="#FFFFFF" />
      <rect x="26.501" y="45.108" width="20.0959" height="35.5205" rx="10.048" transform="rotate(45 26.501 45.108)" fill="#FFFFFF" />
    </svg>
  );
}

/* ── Persona split — the real Figma vector (Asset videos/Diagram users.svg):
   one session fans into Operator / Guest / Guest Viewer at different control
   levels. Shipped as a public asset so it stays pixel-exact. ────────────── */
export function PersonaSplitDiagram() {
  return (
    <div className="overflow-x-auto">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src="/case-study/diagram-users.svg"
        alt="One session fans into three roles — Operator (Command Center, moderate control), Guest (Field/Remote, can act), and Guest Viewer (Remote, observe only)."
        className="mx-auto w-full min-w-[640px] max-w-[920px]"
      />
    </div>
  );
}

/* ── Onboarding flow — operator creates session → invite paths → session view ─ */
function FlowNode({
  x,
  y,
  w,
  title,
  sub,
  variant = "default",
}: {
  x: number;
  y: number;
  w: number;
  title: string;
  sub?: string;
  variant?: "default" | "operator" | "green" | "orangeOutline" | "greenFill" | "blueFill";
}) {
  // Dark-mode flow nodes: lifted dark fills, white text, orange operator accent.
  // Semantic green/orange invite paths stay recognisable but tuned for dark.
  const styles: Record<string, { stroke: string; fill: string; text: string; subText: string }> = {
    default: { stroke: "rgb(var(--color-fg) / 0.22)", fill: "#0d1016", text: "rgb(var(--color-fg))", subText: "rgb(var(--color-fg) / 0.6)" },
    operator: { stroke: "rgb(var(--color-accent))", fill: "#0d1016", text: "rgb(var(--color-fg))", subText: "rgb(var(--color-fg) / 0.6)" },
    green: { stroke: "#3ddc8a", fill: "#0d1016", text: "#3ddc8a", subText: "#3ddc8a" },
    orangeOutline: { stroke: "#ff8d3b", fill: "#0d1016", text: "#ff8d3b", subText: "#ff8d3b" },
    greenFill: { stroke: "#1f9e5c", fill: "#12813f", text: "#ffffff", subText: "#ffffff" },
    blueFill: { stroke: "#ff8d3b", fill: "#ff8d3b", text: "#1b1204", subText: "#1b1204" },
  };
  const s = styles[variant];
  const h = sub ? 60 : 48;
  return (
    <g>
      <rect x={x} y={y} width={w} height={h} rx={10} fill={s.fill} stroke={s.stroke} strokeWidth={1.4} />
      <text x={x + w / 2} y={sub ? y + 24 : y + 29} textAnchor="middle" fontSize={15} fontWeight={600} fill={s.text}>
        {title}
      </text>
      {sub && (
        <text x={x + w / 2} y={y + 44} textAnchor="middle" fontSize={12} fill={s.subText}>
          {sub}
        </text>
      )}
    </g>
  );
}

export function OnboardingFlowDiagram() {
  const L = "rgb(var(--color-fg) / 0.5)";
  return (
    <div className="overflow-x-auto">
      <svg
        viewBox="0 0 660 540"
        className="mx-auto w-full min-w-[560px] max-w-[660px]"
        role="img"
        aria-label="Onboarding flow: operator creates a session, then two invite paths — email invite → direct join, or share link → waiting room → operator approves — both leading to the session view."
      >
        <g fill="none" stroke={L} strokeWidth={1.4}>
          <line x1={330} y1={96} x2={330} y2={122} />
          <line x1={200} y1={122} x2={460} y2={122} />
          <line x1={200} y1={122} x2={200} y2={145} />
          <line x1={460} y1={122} x2={460} y2={145} />
          <line x1={200} y1={207} x2={200} y2={456} />
          <line x1={460} y1={207} x2={460} y2={256} />
          <line x1={460} y1={305} x2={460} y2={345} />
          <line x1={460} y1={394} x2={460} y2={434} />
          <line x1={460} y1={434} x2={200} y2={434} />
          <line x1={330} y1={434} x2={330} y2={457} />
        </g>
        <FlowNode x={200} y={36} w={260} title="Operator creates session" sub="Selects drones, names incident" variant="operator" />
        <FlowNode x={110} y={145} w={180} title="Invite via email" sub="Known participants" variant="green" />
        <FlowNode x={370} y={145} w={180} title="Share via link" sub="Anyone with the URL" variant="orangeOutline" />
        <FlowNode x={110} y={256} w={180} title="Direct join" variant="greenFill" />
        <FlowNode x={370} y={256} w={180} title="Waiting room" variant="orangeOutline" />
        <FlowNode x={370} y={345} w={180} title="Operator approves" variant="default" />
        <FlowNode x={215} y={457} w={230} title="Session view" sub="Feeds · Map · Annotations · Chat" variant="blueFill" />
      </svg>
    </div>
  );
}

/* ── Stakeholder actions — 3 columns of a shared timeline ─────────────────── */
export function StakeholderActionsDiagram() {
  const cols = [
    {
      who: "Drone pilot",
      role: "Operator · Desktop",
      steps: ["Manages drone feeds", "Repositions drones", "Approves guests", "Annotates hotspots", "Generates report"],
    },
    {
      who: "VP / facility owner",
      role: "Guest viewer · Desktop",
      steps: ["Watches feeds", "Monitors map", "Reads chat updates", "Makes decisions"],
    },
    {
      who: "Firefighter",
      role: "Guest · Mobile in field",
      steps: ["Swipes drone feeds", "Checks map for layout", "Drops markers", "Annotates hazards", "Chats in Spanish"],
    },
  ];
  return (
    <div className="rounded-[var(--radius-lg)] border border-white/12 bg-surface p-6 sm:p-8">
      <div className="mb-6 rounded-[var(--radius-md)] border border-accent/40 py-2 text-center text-[13px] font-semibold text-accent">
        Live session — warehouse fire incident
      </div>
      <div className="grid gap-6 sm:grid-cols-3">
        {cols.map((c) => (
          <div key={c.who} className="text-center">
            <div className="rounded-[var(--radius-md)] border border-white/12 bg-surface-2 py-3">
              <p className="text-[14px] font-semibold text-fg">{c.who}</p>
              <p className="text-[12px] text-faint">{c.role}</p>
            </div>
            <div className="mx-auto mt-1 h-4 w-px bg-white/15" />
            <div className="space-y-1">
              {c.steps.map((s, i) => (
                <div key={s}>
                  <div className="rounded-[var(--radius-md)] border border-white/12 bg-surface-2 py-2 text-[13px] text-muted">
                    {s}
                  </div>
                  {i < c.steps.length - 1 && (
                    <div className="mx-auto h-3 w-px bg-white/15" />
                  )}
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
      <p className="mt-6 text-center text-[13px] text-muted">
        All actions sync in real time — every participant sees the same markers,
        annotations, and chat.
      </p>
    </div>
  );
}

export { ArrowLeft };
