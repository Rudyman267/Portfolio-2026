"use client";

import { useRef, type ReactNode } from "react";
import {
  Users,
  Monitor,
  Clock,
  Languages,
  ArrowLeft,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { gsap, useGSAP, ScrollTrigger } from "@/lib/gsap";
import type { MattersItem, MediaSlot } from "@/lib/caseStudies/lirDesign";

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

/* ── Figure — labelled placeholder for a not-yet-exported raster asset ────── */
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
  return (
    <figure className={cn("group", className)}>
      <div
        className="relative overflow-hidden rounded-[var(--radius-lg)] border border-border bg-surface-2"
        style={{ aspectRatio: slot.ratio ?? ratio }}
      >
        {slot.src ? (
          // Real asset.
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={slot.src}
            alt={slot.label}
            className="h-full w-full object-cover"
            loading="lazy"
          />
        ) : (
          <>
            {/* dotted grid texture so an empty slot still reads as a frame */}
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
          </>
        )}
      </div>
      {slot.caption && (
        <figcaption className="mt-3 text-[length:var(--lir-label)] italic text-faint">
          {slot.caption}
        </figcaption>
      )}
    </figure>
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

/* ── Design decision cluster — orange "tempting" + green "chose" cards ────── */
export function DecisionCluster({
  n,
  heading,
  tempting,
  chose,
}: {
  n: string;
  heading: string;
  tempting: { label: string; body: string };
  chose: { label: string; body: string };
}) {
  return (
    <div>
      <h3 className="max-w-[26ch] text-[length:var(--lir-lede)] font-bold leading-tight tracking-[-0.01em] text-fg">
        <span className="text-accent">{n}</span> {heading}
      </h3>
      <div className="mt-6 grid gap-5 md:grid-cols-2">
        {/* orange — the seductive shortcut */}
        <div
          className="rounded-[var(--radius-lg)] px-6 py-6"
          style={{ background: "#f6a94a", color: "#1b1204" }}
        >
          <p className="text-[length:var(--lir-body-sm)] font-semibold">
            {tempting.label}
          </p>
          <p className="mt-3 text-[length:var(--lir-body-sm)] leading-relaxed opacity-90">
            {tempting.body}
          </p>
        </div>
        {/* green — the reasoning / trade */}
        <div
          className="rounded-[var(--radius-lg)] px-6 py-6"
          style={{ background: "#6ef2b0", color: "#04160c" }}
        >
          <p className="text-[length:var(--lir-body-sm)] font-semibold">
            {chose.label}
          </p>
          <p className="mt-3 text-[length:var(--lir-body-sm)] leading-relaxed opacity-90">
            {chose.body}
          </p>
        </div>
      </div>
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
        fill="#1291E0"
      />
      <rect x="40.8555" y="26.5308" width="20.0959" height="35.5205" rx="10.048" transform="rotate(134.57 40.8555 26.5308)" fill="#CDCDCD" />
      <rect x="84.4766" y="69.7586" width="20.0959" height="35.5205" rx="10.048" transform="rotate(134.57 84.4766 69.7586)" fill="#CDCDCD" />
      <rect x="70.1582" y="1.45709" width="20.0959" height="35.5205" rx="10.048" transform="rotate(45 70.1582 1.45709)" fill="#CDCDCD" />
      <rect x="26.501" y="45.108" width="20.0959" height="35.5205" rx="10.048" transform="rotate(45 26.501 45.108)" fill="#CDCDCD" />
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
  const styles: Record<string, { stroke: string; fill: string; text: string; subText: string }> = {
    default: { stroke: "rgb(var(--color-border))", fill: "#ffffff", text: "rgb(var(--color-fg))", subText: "rgb(var(--color-fg) / 0.55)" },
    operator: { stroke: "rgb(var(--color-accent))", fill: "#ffffff", text: "rgb(var(--color-fg))", subText: "rgb(var(--color-fg) / 0.55)" },
    green: { stroke: "#1a9e5f", fill: "#ffffff", text: "#1a9e5f", subText: "#1a9e5f" },
    orangeOutline: { stroke: "#e0622a", fill: "#ffffff", text: "#e0622a", subText: "#e0622a" },
    greenFill: { stroke: "#12813f", fill: "#12813f", text: "#ffffff", subText: "#ffffff" },
    blueFill: { stroke: "#a9c8ef", fill: "#a9c8ef", text: "#12325a", subText: "#12325a" },
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
    <div className="rounded-[var(--radius-lg)] border border-border p-6 sm:p-8">
      <div className="mb-6 rounded-[var(--radius-md)] border border-accent/40 py-2 text-center text-[13px] font-semibold text-accent">
        Live session — warehouse fire incident
      </div>
      <div className="grid gap-6 sm:grid-cols-3">
        {cols.map((c) => (
          <div key={c.who} className="text-center">
            <div className="rounded-[var(--radius-md)] border border-border py-3">
              <p className="text-[14px] font-semibold text-fg">{c.who}</p>
              <p className="text-[12px] text-faint">{c.role}</p>
            </div>
            <div className="mx-auto mt-1 h-4 w-px bg-border" />
            <div className="space-y-1">
              {c.steps.map((s, i) => (
                <div key={s}>
                  <div className="rounded-[var(--radius-md)] border border-border py-2 text-[13px] text-fg/80">
                    {s}
                  </div>
                  {i < c.steps.length - 1 && (
                    <div className="mx-auto h-3 w-px bg-border" />
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
