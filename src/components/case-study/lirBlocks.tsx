"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import {
  Users,
  Monitor,
  Clock,
  Languages,
  ArrowLeft,
  Play,
  Pause,
  Volume2,
  VolumeX,
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

  // Arrow-notation stats ("45 → 5 mins", "187 → 0") aren't a single count —
  // animating them would tick the first number through nonsense. Render static.
  const isTransition = /[→]|->/.test(value);

  // Split "<30s" into ["<", "30", "s"] — leading non-digits, the number, trailing.
  const match = isTransition ? null : value.match(/^(\D*)([\d.,]+)(.*)$/);
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
        {/* NOTE: both images carry data-no-zoom. This is a DRAG SLIDER, so the
            delegated lightbox listener must not claim the click — opening a
            full-screen view mid-drag fights the interaction the component
            exists for. The comparison IS the affordance here. */}
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={before}
          alt="Before — the AI's first-pass interface"
          className="block h-auto w-full"
          draggable={false}
          data-no-zoom
        />
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
            data-no-zoom
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
/* ── ImageCycle — a feature's images swap in place every 2s.
   Replaces the horizontal scroll strip: the reader shouldn't have to drag a
   scrollbar to see the second shot. All frames stack in ONE box (no added
   frame or rounding — the screenshots carry their own chrome) and crossfade,
   so the box holds a single set of dimensions throughout. The box is sized by
   the FIRST image in normal flow; the rest are absolutely positioned over it,
   which keeps the layout from jumping between frames of differing height.
   Pauses when off-screen and respects reduced motion. ───────────────────── */
const CYCLE_MS = 2000;

function ImageCycle({ imgs }: { imgs: MediaSlot[] }) {
  const root = useRef<HTMLDivElement>(null);
  const [active, setActive] = useState(0);

  useGSAP(
    () => {
      const el = root.current;
      if (!el) return;
      const frames = gsap.utils.toArray<HTMLElement>(el.querySelectorAll("[data-cyc]"));
      if (frames.length < 2) return;

      const mm = gsap.matchMedia();
      mm.add("(prefers-reduced-motion: no-preference)", () => {
        let i = 0;
        let timer: ReturnType<typeof setInterval> | undefined;
        const show = (next: number) => {
          gsap.to(frames[i], { autoAlpha: 0, duration: 0.5, ease: "power1.inOut" });
          gsap.to(frames[next], { autoAlpha: 1, duration: 0.5, ease: "power1.inOut" });
          i = next;
          setActive(next);
        };
        const start = () => {
          if (timer) return;
          timer = setInterval(() => show((i + 1) % frames.length), CYCLE_MS);
        };
        const stop = () => {
          clearInterval(timer);
          timer = undefined;
        };
        // only cycle while the box is actually on screen
        const st = ScrollTrigger.create({
          trigger: el,
          start: "top bottom",
          end: "bottom top",
          onToggle: (self) => (self.isActive ? start() : stop()),
        });
        return () => {
          stop();
          st.kill();
        };
      });
    },
    { scope: root },
  );

  return (
    <div ref={root} className="relative w-full">
      {imgs.map((m, i) => (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          key={m.id}
          data-cyc
          src={m.src}
          alt={m.label}
          loading="eager"
          className={cn(
            "h-auto w-full",
            // first frame holds the box open; the rest overlay it exactly
            i > 0 && "absolute inset-0",
          )}
          style={i > 0 ? { opacity: 0, visibility: "hidden" } : undefined}
          aria-hidden={i !== active}
        />
      ))}
    </div>
  );
}

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
      {/* --lir-note (14px) — feature prose reads as body copy beside the
          screenshots, not caption-scale secondary text. */}
      <p className="text-[length:var(--lir-note)] leading-relaxed text-[#d2d2d2]">
        {body}
      </p>
      {body2 && (
        <p className="text-[length:var(--lir-note)] leading-relaxed text-[#d2d2d2]">
          {body2}
        </p>
      )}
    </div>
  );

  // image column: 2+ images cycle in place every 2s; a single image sits bare.
  const imgCol = multi ? (
    <ImageCycle imgs={imgs} />
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
      <p className="text-[length:var(--lir-note)] leading-relaxed text-accent">
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
/* ── DemoVideo — the case-study demo player.
   The audio carries part of the story, so this ships real sound controls:
   click-to-play, a mute toggle and a volume slider, plus a scrub bar.
   Autoplay is deliberately NOT used — browsers only permit it when muted, and
   a muted autoplay would silently drop the narration this video depends on.
   Serves VP9/Opus first with an H.264/AAC fallback (same pair the About page
   videos ship as). ───────────────────────────────────────────────────────── */
export function DemoVideo({
  src,
  poster,
  label,
}: {
  src: string;
  poster?: string;
  label: string;
}) {
  const vid = useRef<HTMLVideoElement>(null);
  const [playing, setPlaying] = useState(false);
  const [muted, setMuted] = useState(false);
  const [volume, setVolume] = useState(1);
  const [progress, setProgress] = useState(0);
  const [dur, setDur] = useState(0);

  const toggle = () => {
    const v = vid.current;
    if (!v) return;
    if (v.paused) {
      void v.play();
    } else {
      v.pause();
    }
  };

  const setVol = (n: number) => {
    const v = vid.current;
    setVolume(n);
    if (!v) return;
    v.volume = n;
    // dragging the slider up from zero should also lift a mute
    if (n > 0 && v.muted) {
      v.muted = false;
      setMuted(false);
    }
  };

  const toggleMute = () => {
    const v = vid.current;
    if (!v) return;
    v.muted = !v.muted;
    setMuted(v.muted);
  };

  const seek = (pct: number) => {
    const v = vid.current;
    if (!v || !v.duration) return;
    v.currentTime = (pct / 100) * v.duration;
    setProgress(pct);
  };

  const fmt = (s: number) =>
    `${Math.floor(s / 60)}:${String(Math.floor(s % 60)).padStart(2, "0")}`;

  return (
    <figure className="group relative overflow-hidden rounded-[var(--radius-lg)] border border-white/12 bg-black">
      <video
        ref={vid}
        poster={poster}
        playsInline
        preload="metadata"
        className="block h-auto w-full cursor-pointer"
        style={{ aspectRatio: "16 / 9" }}
        onClick={toggle}
        onPlay={() => setPlaying(true)}
        onPause={() => setPlaying(false)}
        onVolumeChange={(e) => {
          setMuted(e.currentTarget.muted);
          setVolume(e.currentTarget.volume);
        }}
        onLoadedMetadata={(e) => setDur(e.currentTarget.duration)}
        onTimeUpdate={(e) => {
          const v = e.currentTarget;
          if (v.duration) setProgress((v.currentTime / v.duration) * 100);
        }}
      >
        <source src={`${src}.webm`} type="video/webm" />
        <source src={`${src}.mp4`} type="video/mp4" />
      </video>

      {/* big centred play affordance — only while paused */}
      {!playing && (
        <button
          type="button"
          onClick={toggle}
          aria-label="Play demo video"
          className="absolute inset-0 flex items-center justify-center bg-black/25 transition-colors hover:bg-black/15"
        >
          <span className="flex h-16 w-16 items-center justify-center rounded-full bg-accent/90 text-black">
            <Play size={26} fill="currentColor" className="ml-1" />
          </span>
        </button>
      )}

      {/* control bar — always available once playing, on hover otherwise */}
      <div
        className={cn(
          "absolute inset-x-0 bottom-0 flex items-center gap-3 bg-gradient-to-t from-black/85 to-transparent px-4 pb-3 pt-8 transition-opacity",
          // touch has no hover — keep the bar visible while playing there
          playing
            ? "opacity-0 group-hover:opacity-100 focus-within:opacity-100 [@media(pointer:coarse)]:opacity-100"
            : "opacity-100",
        )}
      >
        <button
          type="button"
          onClick={toggle}
          aria-label={playing ? "Pause" : "Play"}
          className="shrink-0 text-white/90 transition-colors hover:text-white"
        >
          {playing ? <Pause size={18} /> : <Play size={18} fill="currentColor" />}
        </button>

        {/* scrub */}
        <input
          type="range"
          min={0}
          max={100}
          step={0.1}
          value={progress}
          onChange={(e) => seek(Number(e.target.value))}
          aria-label="Seek"
          className="h-1 min-w-0 flex-1 cursor-pointer accent-[rgb(var(--color-accent))]"
        />

        <span className="shrink-0 tabular-nums text-[11px] text-white/70">
          {fmt((progress / 100) * (dur || 0))} / {fmt(dur || 0)}
        </span>

        {/* mute + volume — the audio matters here, so both are first-class */}
        <button
          type="button"
          onClick={toggleMute}
          aria-label={muted ? "Unmute" : "Mute"}
          className="shrink-0 text-white/90 transition-colors hover:text-white"
        >
          {muted || volume === 0 ? <VolumeX size={18} /> : <Volume2 size={18} />}
        </button>
        <input
          type="range"
          min={0}
          max={1}
          step={0.05}
          value={muted ? 0 : volume}
          onChange={(e) => setVol(Number(e.target.value))}
          aria-label="Volume"
          className="h-1 w-16 shrink-0 cursor-pointer accent-[rgb(var(--color-accent))]"
        />
      </div>
      <figcaption className="sr-only">{label}</figcaption>
    </figure>
  );
}

/* ── ProseReveal — the minimal text entrance used across the case study.
   Children rise a few px and fade in, staggered line by line, when the block
   scrolls into view. Deliberately understated: this page's motion budget is
   spent on the chapter flashes, so body copy just needs to arrive rather than
   perform. One-shot (not scrubbed), so it never adds scroll of its own; it
   reverses if you scroll back above it. ──────────────────────────────────── */
export function ProseReveal({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  const root = useRef<HTMLDivElement>(null);
  useGSAP(
    () => {
      const el = root.current;
      if (!el) return;
      const lines = Array.from(el.children) as HTMLElement[];
      if (!lines.length) return;

      const mm = gsap.matchMedia();
      mm.add("(prefers-reduced-motion: no-preference)", () => {
        gsap.fromTo(
          lines,
          { autoAlpha: 0, y: 14 },
          {
            autoAlpha: 1,
            y: 0,
            duration: 0.6,
            ease: "power2.out",
            stagger: 0.08,
            scrollTrigger: {
              trigger: el,
              start: "top 82%",
              toggleActions: "play none none reverse",
            },
          },
        );
      });
      mm.add("(prefers-reduced-motion: reduce)", () => {
        gsap.set(lines, { autoAlpha: 1, y: 0 });
      });
    },
    { scope: root },
  );
  return (
    <div ref={root} className={className}>
      {children}
    </div>
  );
}

/* ── ArchTimeline — the "code architecture" Q&A beats on a vertical rail.
   Each beat = a question (what needed solving) → the constraint (muted) → the
   answer we landed on (brighter). A single accent rail runs the whole column
   and DRAWS IN as you scroll it (scaleY scrub, top-anchored), with a node dot
   per beat that pops as the beat arrives. Intro/outro framing lines top & tail
   it. Motion stays in the study's understated budget — the rail draw is the
   one flourish; text just rises + fades (ProseReveal idiom). ─────────────── */
export function ArchTimeline({
  intro,
  outro,
  beats,
}: {
  intro?: string;
  outro?: string;
  beats: { question: string; problem: string; answer: string }[];
}) {
  const root = useRef<HTMLDivElement>(null);

  useGSAP(
    () => {
      const el = root.current;
      if (!el) return;
      const mm = gsap.matchMedia();

      mm.add("(prefers-reduced-motion: no-preference)", () => {
        // Rail draws top→bottom as the section scrolls through the viewport.
        const rail = el.querySelector<HTMLElement>("[data-arch-rail]");
        if (rail) {
          gsap.fromTo(
            rail,
            { scaleY: 0 },
            {
              scaleY: 1,
              ease: "none",
              scrollTrigger: {
                trigger: el,
                start: "top 70%",
                end: "bottom 75%",
                scrub: true,
              },
            },
          );
        }

        // Each beat: dot pops, then its lines rise + fade (staggered).
        gsap.utils
          .toArray<HTMLElement>(el.querySelectorAll("[data-arch-beat]"))
          .forEach((beat) => {
            const dot = beat.querySelector<HTMLElement>("[data-arch-dot]");
            const lines = Array.from(
              beat.querySelectorAll<HTMLElement>("[data-arch-line]"),
            );
            const tl = gsap.timeline({
              scrollTrigger: {
                trigger: beat,
                start: "top 78%",
                toggleActions: "play none none reverse",
              },
            });
            if (dot) {
              tl.fromTo(
                dot,
                { scale: 0, autoAlpha: 0 },
                { scale: 1, autoAlpha: 1, duration: 0.45, ease: "back.out(2)" },
                0,
              );
            }
            tl.fromTo(
              lines,
              { autoAlpha: 0, y: 16 },
              {
                autoAlpha: 1,
                y: 0,
                duration: 0.6,
                ease: "power2.out",
                stagger: 0.09,
              },
              0.1,
            );
          });

        // Framing lines (intro / outro) just rise + fade on their own.
        gsap.utils
          .toArray<HTMLElement>(el.querySelectorAll("[data-arch-frame]"))
          .forEach((line) => {
            gsap.fromTo(
              line,
              { autoAlpha: 0, y: 14 },
              {
                autoAlpha: 1,
                y: 0,
                duration: 0.6,
                ease: "power2.out",
                scrollTrigger: {
                  trigger: line,
                  start: "top 84%",
                  toggleActions: "play none none reverse",
                },
              },
            );
          });
      });

      mm.add("(prefers-reduced-motion: reduce)", () => {
        gsap.set(
          el.querySelectorAll(
            "[data-arch-rail],[data-arch-dot],[data-arch-line],[data-arch-frame]",
          ),
          { autoAlpha: 1, scale: 1, scaleY: 1, y: 0 },
        );
      });
    },
    { scope: root },
  );

  return (
    <div ref={root} className="max-w-[var(--lir-measure)]">
      {intro && (
        <p
          data-arch-frame
          className="text-[length:var(--lir-body)] leading-relaxed text-muted"
        >
          {intro}
        </p>
      )}

      {/* rail column: a thin accent line down the left, beats hang off it */}
      <div className="relative mt-10 pl-9">
        {/* the rail — origin-top so it draws downward */}
        <span
          data-arch-rail
          aria-hidden
          className="absolute left-[3px] top-2 bottom-2 w-px origin-top bg-accent/50"
        />
        <div className="space-y-16">
          {beats.map((b, i) => (
            <div key={i} data-arch-beat className="relative">
              {/* node dot sitting on the rail, aligned to the question */}
              <span
                data-arch-dot
                aria-hidden
                className="absolute -left-9 top-[0.55rem] block h-[9px] w-[9px] rounded-full bg-accent shadow-[0_0_0_4px_rgba(255,141,59,0.15)]"
              />
              <h4
                data-arch-line
                className="text-[clamp(1.35rem,1.05rem+1.1vw,1.75rem)] font-semibold leading-[1.2] tracking-[-0.01em] text-fg"
              >
                {b.question}
              </h4>
              <p
                data-arch-line
                className="mt-4 text-[length:var(--lir-note)] leading-relaxed text-muted"
              >
                {b.problem}
              </p>
              <p
                data-arch-line
                className="mt-4 text-[length:var(--lir-note)] leading-relaxed text-[#e6e6e6]"
              >
                {b.answer}
              </p>
            </div>
          ))}
        </div>
      </div>

      {outro && (
        <p
          data-arch-frame
          className="mt-12 text-[length:var(--lir-body)] leading-relaxed text-fg"
        >
          {outro}
        </p>
      )}
    </div>
  );
}

/* Width a card is exported at when it spans the full 765px content column.
   Anything narrower (368/373) is a SMALL card and belongs in a 2-up row —
   stretching it across the column is what blew its baked-in text up ~2x. */
const WIDE_CARD_DESIGN_W = 700;

/* ── CardRows — lays reasoning cards out at the scale they were drawn for.
   Full-width exports (>= WIDE_CARD_DESIGN_W) each span the column; runs of
   small exports pair up 2-per-row (the Figma 2x2 for dd2). Widths are read
   from the files themselves, so nothing is hardcoded per card. ───────────── */
function CardRows({
  srcs,
  wideMobile,
}: {
  srcs: string[];
  wideMobile?: boolean;
}) {
  const [widths, setWidths] = useState<Record<string, number>>({});
  const note = (src: string, w: number) =>
    setWidths((prev) => (prev[src] === w ? prev : { ...prev, [src]: w }));

  // Until widths are known, render each card full-width (the old behaviour) —
  // measurement lands on the first paint, before any of this is scrolled to.
  const measured = srcs.every((s) => widths[s]);
  const groups: string[][] = [];
  if (measured) {
    let pair: string[] = [];
    const flush = () => {
      if (pair.length) {
        groups.push(pair);
        pair = [];
      }
    };
    for (const src of srcs) {
      if (widths[src] >= WIDE_CARD_DESIGN_W) {
        flush();
        groups.push([src]);
      } else {
        pair.push(src);
        if (pair.length === 2) flush();
      }
    }
    flush();
  } else {
    srcs.forEach((s) => groups.push([s]));
  }

  return (
    <>
      {groups.map((g, i) => (
        <div
          key={i}
          className={cn("grid gap-5", g.length === 2 && "md:grid-cols-2")}
        >
          {g.map((src) => (
            <CardImg
              key={src}
              src={src}
              onWidth={(w) => note(src, w)}
              // only solo full-width cards break out on mobile — a 2-up pair
              // can't (the negative-margin breakout assumes a single flow item).
              wideMobile={wideMobile && g.length === 1}
            />
          ))}
        </div>
      ))}
    </>
  );
}

/** A single card SVG that reports its intrinsic width once loaded. */
function CardImg({
  src,
  onWidth,
  wideMobile,
}: {
  src: string;
  onWidth: (w: number) => void;
  wideMobile?: boolean;
}) {
  const ref = useRef<HTMLImageElement>(null);
  // naturalWidth must also be read on mount: an already-cached image never
  // fires onLoad, which would leave the layout stuck in its fallback.
  const read = () => {
    const w = ref.current?.naturalWidth;
    if (w) onWidth(w);
  };
  useEffect(read);

  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      ref={ref}
      src={src}
      alt=""
      loading="eager"
      onLoad={read}
      className={cn(
        "h-auto w-full rounded-[var(--radius-lg)]",
        wideMobile && "lir-wide-mobile",
      )}
    />
  );
}

export function DecisionCluster({
  n,
  heading,
  row,
  wide,
  wideMobile,
  note,
  mediaRows,
}: {
  n: string;
  heading: string;
  row: [string, string];
  wide: string[];
  wideMobile?: boolean;
  note?: { heading: string; body: string[] };
  mediaRows?: MediaRow[];
}) {
  return (
    <div>
      <ProseReveal>
        <h3 className="max-w-[40ch] text-[length:var(--lir-lede)] font-bold leading-tight tracking-[-0.01em] text-fg">
          <span className="text-accent">{n}</span> {heading}
        </h3>
      </ProseReveal>
      {/* two small cards side by side */}
      <div className="mt-6 grid gap-5 md:grid-cols-2">
        {row.map((src) => (
          // eslint-disable-next-line @next/next/no-img-element
          <img key={src} src={src} alt="" className="h-auto w-full rounded-[var(--radius-lg)]" loading="eager" />
        ))}
      </div>
      {/* Reasoning card(s) below the first row.

          A card exported at the full column width (765) spans it; cards
          exported at the SMALL size (368/373) are laid out 2-up instead —
          that's dd2, which is a 2x2 grid in Figma (239:27 / ref), not a stack
          of full-width cards. Forcing those into the wide slot stretched them
          ~2x and ballooned their baked-in text. Grouping is derived from each
          file's intrinsic width, so re-exporting a card at a different size
          re-flows it automatically. */}
      <div className="mt-5 space-y-5">
        <CardRows srcs={wide} wideMobile={wideMobile} />
      </div>

      {/* The cluster's thesis, stated plainly on the canvas between the cards
          and the screenshots — same register as the reading column: white
          heading, muted body, measure-capped. Scroll-revealed by ProseReveal. */}
      {note && (
        <ProseReveal className="mt-16 max-w-[var(--lir-measure)]">
          <h4 className="text-[clamp(1.4rem,1.05rem+1.2vw,1.9rem)] font-semibold leading-[1.15] tracking-[-0.01em] text-fg">
            {note.heading}
          </h4>
          {note.body.map((p, i) => (
            // --lir-note (14px), same as the outlined audit callouts — this is
            // standalone prose on the canvas, not caption-scale secondary text.
            <p
              key={i}
              className="mt-4 text-[length:var(--lir-note)] leading-relaxed text-[#d2d2d2]"
            >
              {p}
            </p>
          ))}
        </ProseReveal>
      )}

      {/* Supporting screenshots. Figma (239:27) gives every media row a FIXED
          height inside the 765 column — a 2-up row is 310 tall, the full-width
          shot 443 — so tall phone shots sit compactly side by side instead of
          rendering at their natural height and towering over the layout.
          `tight` rows (the 3-up phones) get a bigger box + a closer gutter. */}
      {mediaRows && mediaRows.length > 0 && (
        <div className="mt-8 space-y-6">
          {mediaRows.map((r, i) => {
            const cols = r.cols ?? r.imgs.length;
            // taller box for a single full-width shot; shorter for 2-3 up.
            // `tight` scales the frames up and pulls the columns together.
            // Below sm the fixed Figma row heights would letterbox a ~110px-
            // wide column inside a 300px-tall box — phones get natural aspect
            // (h-auto) instead; the clamps only bind from sm up.
            // `flush` rows size by WIDTH (h-auto): each image fills its half of
            // the column so the pair's outer edges line up with the full-width
            // row below, instead of shrinking to fit a fixed short height and
            // leaving inset margins.
            const rowH = r.flush
              ? "h-auto"
              : r.tight
                ? "h-auto sm:h-[clamp(300px,32vw,470px)]"
                : cols === 1
                  ? "h-auto sm:h-[clamp(240px,26vw,444px)]"
                  : "h-auto sm:h-[clamp(190px,20vw,310px)]";
            return (
              <figure key={i}>
                <div
                  className={cn(
                    "grid",
                    // flush = small gutter + STRETCH so both columns share the
                    // shorter image's height; the taller one crops its overflow
                    // (object-cover below) so their BOTTOMS line up. The grid
                    // also keeps the gap BETWEEN the 1fr columns, not outside,
                    // so the row's outer edges still match a full-width row.
                    // Other rows top-align (contain-fit, no crop).
                    r.flush ? "items-stretch gap-2" : r.tight ? "items-start gap-2" : "items-start gap-5",
                  )}
                  style={{ gridTemplateColumns: `repeat(${cols}, minmax(0, 1fr))` }}
                >
                  {r.imgs.map((src) => (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      key={src}
                      src={src}
                      alt=""
                      // A flush row equalizes height and CROPS the overflow
                      // (object-cover) so the two shots' bottoms align. Other
                      // rows keep contain (no crop) — cropping a tall phone shot
                      // to a short box would cut the UI being shown.
                      className={cn("w-full", r.flush ? "h-full object-cover" : cn("object-contain", rowH))}
                      loading="eager"
                    />
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
/* The ORO monogram — the interlocking 'O' ring mark. Same contract as
   DroneMark: a single path filled with currentColor, so the study's accent
   token recolors it (ORO resolves to the gold #d9a441). Exact vector from
   the brand kit. */
export function OroMark({
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
      viewBox="0 0 27 26"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-hidden
    >
      <path d="M12.7754 0C12.5728 0.353838 12.3423 0.691539 12.0858 1.00999C11.8389 1.31764 11.5665 1.60471 11.2713 1.86827C10.9783 2.13574 10.6613 2.37677 10.3241 2.58845C10.0613 2.76043 9.78709 2.91497 9.50325 3.05103C9.16796 3.20646 8.82446 3.34518 8.49295 3.50308C8.02971 3.72177 7.58355 3.97366 7.15809 4.25671C6.95855 4.38861 6.7666 4.52918 6.5759 4.67284C6.25841 4.91286 5.95661 5.17221 5.67231 5.44938C5.36662 5.74897 5.07824 6.06507 4.8085 6.39621C4.36206 6.94377 3.97501 7.53545 3.6536 8.16168C3.35732 8.73204 3.12018 9.33014 2.94576 9.94697C2.81509 10.3865 2.71841 10.8351 2.65656 11.2889C2.60731 11.6778 2.57132 12.0679 2.55932 12.4611C2.55111 12.7224 2.56879 12.9819 2.57321 13.2414C2.577 13.4792 2.61804 13.7169 2.64583 13.9547C2.68412 14.2923 2.74423 14.6272 2.82579 14.9573C2.95644 15.4911 3.13 16.014 3.34483 16.5209C3.51858 16.9357 3.72024 17.3387 3.94849 17.7272C4.12866 18.0294 4.32419 18.3227 4.53509 18.6071C4.8696 19.0599 5.2415 19.4849 5.64706 19.8778C5.98948 20.2083 6.35446 20.5156 6.73945 20.7974C7.16115 21.1061 7.60422 21.3856 8.06547 21.634C8.36729 21.7963 8.67859 21.9356 8.98926 22.0799C9.07198 22.1177 9.15975 22.1455 9.24184 22.1833C9.25541 22.1915 9.27068 22.1966 9.28653 22.1982C9.30238 22.1999 9.31841 22.198 9.33343 22.1928C9.34845 22.1876 9.36208 22.1791 9.37333 22.168C9.38458 22.157 9.39316 22.1436 9.39843 22.1288C9.56556 21.8509 9.75384 21.5857 9.96168 21.3356C10.2222 21.0031 10.5006 20.6846 10.7958 20.3813C10.9221 20.2519 11.0591 20.1286 11.1791 19.9912C11.2302 19.933 11.2189 19.9113 11.1507 19.8952C10.8084 19.808 10.4739 19.6936 10.1505 19.5534C9.68278 19.3612 9.23529 19.1247 8.81435 18.8474C8.60434 18.7119 8.40198 18.5654 8.20817 18.4084C7.84623 18.1128 7.51057 17.7875 7.20482 17.4362C6.96518 17.1487 6.74336 16.8474 6.54054 16.5339C6.39657 16.3076 6.26851 16.072 6.15726 15.8286C5.94744 15.3955 5.78183 14.9431 5.66284 14.478C5.5736 14.1187 5.50905 13.754 5.46962 13.3863C5.43358 13.096 5.42113 12.8034 5.43237 12.5113C5.45024 12.1128 5.49411 11.7159 5.56371 11.3229C5.64059 10.9102 5.75556 10.5052 5.90721 10.1129C6.0235 9.80312 6.16344 9.50234 6.32585 9.21316C6.52081 8.85907 6.74288 8.51999 6.99013 8.19884C7.24625 7.86707 7.53171 7.5581 7.8432 7.27554C8.07583 7.06262 8.31925 6.86132 8.57251 6.67239C8.78016 6.52171 8.9974 6.38417 9.22289 6.26059C9.46347 6.12683 9.70657 5.99617 9.95852 5.88595C10.1915 5.78439 10.4264 5.68655 10.6582 5.58252C10.8804 5.4822 11.092 5.3633 11.3066 5.24998C11.512 5.14193 11.7114 5.02328 11.904 4.89453C12.1925 4.70133 12.4786 4.50503 12.7507 4.28829C12.9806 4.10582 13.2029 3.91509 13.4175 3.7161C13.679 3.47281 13.9253 3.21433 14.1551 2.94205C14.3843 2.67329 14.6059 2.39834 14.808 2.10854C15.0338 1.78467 15.241 1.44872 15.4287 1.10226C15.5689 0.844653 15.697 0.580853 15.8107 0.310862C15.8347 0.253272 15.8675 0.255131 15.9193 0.2638C16.1529 0.302193 16.3796 0.369071 16.6095 0.422945C17.0376 0.528616 17.4592 0.658042 17.8723 0.810595C18.1982 0.926394 18.5164 1.05829 18.8315 1.19886C19.2634 1.39207 19.6827 1.60819 20.0944 1.84226C20.4221 2.02804 20.7391 2.23115 21.0459 2.44603C21.368 2.67143 21.6774 2.91232 21.9805 3.16497C22.2615 3.39967 22.5286 3.64737 22.7868 3.90374C23.1286 4.24527 23.4505 4.60541 23.751 4.98246C23.9815 5.26918 24.193 5.56827 24.4033 5.86861C24.5612 6.09401 24.6957 6.33614 24.834 6.57455C25.0422 6.93387 25.2306 7.30389 25.3985 7.683C25.5899 8.11445 25.7586 8.55533 25.9036 9.00386C26.0173 9.35435 26.1031 9.71042 26.1922 10.0665C26.2774 10.4058 26.3185 10.7532 26.3709 11.0994C26.4599 11.7266 26.4939 12.3601 26.4725 12.9931C26.4679 13.4235 26.4342 13.8532 26.3715 14.2792C26.3279 14.5424 26.3084 14.8112 26.2541 15.0712C26.2162 15.2465 26.1707 15.4217 26.1278 15.597C26.0131 16.0802 25.8675 16.5559 25.6921 17.0213C25.5784 17.3259 25.4496 17.6281 25.3075 17.9235C25.1019 18.3549 24.8738 18.7757 24.6243 19.1843C24.3855 19.5661 24.1271 19.9359 23.8502 20.2921C23.4977 20.7497 23.1135 21.183 22.7003 21.5888C22.3456 21.9348 21.9708 22.2602 21.5776 22.5635C21.1649 22.8859 20.7329 23.1836 20.2838 23.4552C19.8257 23.7331 19.3497 23.9813 18.8586 24.1983C18.3824 24.4109 17.8944 24.5969 17.3969 24.7557C17.0736 24.8578 16.7471 24.9414 16.4181 25.0275C15.938 25.1385 15.4525 25.2253 14.9633 25.2876C14.69 25.3261 14.4147 25.3495 14.1386 25.3576C14.0225 25.3613 13.9063 25.3768 13.7888 25.3755C13.7194 25.3755 13.7074 25.3545 13.7453 25.2944C13.9517 24.9586 14.1801 24.6364 14.4291 24.3296C14.6399 24.0732 14.8675 23.8306 15.1104 23.6032C15.5642 23.1843 16.0677 22.8205 16.6101 22.5196C16.8743 22.372 17.1467 22.2389 17.4259 22.1208C17.6785 22.0161 17.9254 21.9077 18.1685 21.7876C18.6044 21.5707 19.0245 21.3245 19.4257 21.0507C19.8487 20.7597 20.2512 20.4411 20.6305 20.0971C21.0702 19.6948 21.4731 19.2555 21.8346 18.7843C22.1023 18.4441 22.3444 18.0852 22.5589 17.7105C22.7256 17.4213 22.8746 17.1228 23.0154 16.8188C23.2082 16.4054 23.3709 15.9791 23.5022 15.5431C23.6344 15.0961 23.7361 14.641 23.8066 14.1808C23.8697 13.7677 23.8881 13.3528 23.9177 12.9373C23.9274 12.6483 23.9221 12.3589 23.9019 12.0704C23.8831 11.7523 23.8458 11.4356 23.7902 11.1217C23.703 10.555 23.5628 9.99741 23.3715 9.45591C23.1927 8.94222 22.9714 8.44372 22.7098 7.96538C22.4876 7.55373 22.2365 7.15769 21.9584 6.78014C21.6654 6.38029 21.3414 6.00328 20.9891 5.65249C20.5856 5.24917 20.1514 4.87654 19.6903 4.53785C19.3202 4.27019 18.9339 4.02493 18.5335 3.80342C18.1357 3.57708 17.7191 3.38402 17.2883 3.22628C17.126 3.16931 17.1329 3.17302 17.0407 3.31112C16.8303 3.62735 16.6042 3.93387 16.3626 4.2307C16.0328 4.63467 15.6776 5.01811 15.2992 5.37878C15.2418 5.43328 15.2468 5.46486 15.3245 5.48282C15.705 5.57971 16.0762 5.70879 16.4339 5.86861C16.7515 6.00563 17.0594 6.16306 17.3558 6.33986C17.6172 6.49343 17.861 6.67115 18.1136 6.84268C18.2107 6.91247 18.3037 6.98773 18.392 7.06809C18.7128 7.34567 19.0133 7.6451 19.2912 7.96414C19.5605 8.28489 19.8043 8.62544 20.0205 8.9828C20.204 9.29102 20.3642 9.61203 20.4998 9.94326C20.6161 10.2296 20.7154 10.5224 20.7972 10.8201C20.8953 11.1599 20.9631 11.5073 20.9999 11.8586C21.0508 12.242 21.0664 12.6292 21.0466 13.0153C21.019 13.4375 20.9618 13.8573 20.8755 14.2718C20.7866 14.6738 20.6624 15.0674 20.5042 15.4484C20.3094 15.927 20.0628 16.3837 19.7686 16.8107C19.5638 17.1017 19.3402 17.3794 19.0992 17.6424C18.7617 18.0135 18.388 18.3513 17.9835 18.6511C17.6714 18.8838 17.3395 19.0897 16.9915 19.2666C16.6808 19.4258 16.3556 19.554 16.0386 19.7001C15.5278 19.9264 15.0359 20.1916 14.5674 20.4934C14.227 20.7105 13.9006 20.9479 13.5899 21.2043C13.1628 21.5604 12.7639 21.9477 12.3965 22.3629C12.1881 22.6044 11.9823 22.8465 11.7966 23.106C11.5971 23.3828 11.4077 23.6633 11.2359 23.9618C11.0293 24.3181 10.8423 24.685 10.6758 25.0609C10.6724 25.0725 10.6665 25.0832 10.6586 25.0924C10.6508 25.1015 10.6411 25.1091 10.6301 25.1144C10.6191 25.1198 10.6072 25.1228 10.5949 25.1234C10.5827 25.124 10.5705 25.1222 10.559 25.1179C10.1399 25.0356 9.72532 24.9322 9.31698 24.8083C8.82948 24.6639 8.35143 24.4903 7.88551 24.2887C7.51548 24.1294 7.15304 23.9556 6.79817 23.7673C6.33516 23.5213 5.8881 23.2475 5.45952 22.9475C5.11602 22.7078 4.78893 22.4521 4.465 22.1852C4.24652 22.0074 4.04131 21.8173 3.8424 21.6223C3.60309 21.3869 3.36819 21.1467 3.14782 20.8946C2.89525 20.6055 2.64962 20.3088 2.42293 19.9998C2.15595 19.644 1.91255 19.2717 1.69425 18.8852C1.55786 18.6375 1.40884 18.3941 1.28634 18.1421C1.12596 17.8058 0.97062 17.4653 0.838018 17.1172C0.718676 16.8076 0.612597 16.4949 0.516618 16.1778C0.404222 15.8063 0.315821 15.4286 0.236891 15.0483C0.157961 14.6681 0.110603 14.2848 0.0664021 13.9002C0.00593012 13.3461 -0.0132765 12.7883 0.00893901 12.2314C0.0240107 11.7843 0.0710659 11.3388 0.149752 10.8981C0.176273 10.7446 0.164275 10.5829 0.204055 10.4337C0.260253 10.2225 0.301295 10.0089 0.352442 9.79711C0.447158 9.40265 0.574079 9.0181 0.698473 8.63169C0.791926 8.33941 0.908742 8.05579 1.02998 7.77589C1.22864 7.30736 1.46074 6.85315 1.72456 6.41664C1.97714 6.00732 2.24045 5.60481 2.5328 5.21964C2.82516 4.83447 3.12446 4.48583 3.44523 4.13967C3.71738 3.84677 4.01352 3.58235 4.31093 3.30988C4.66498 2.99745 5.03642 2.70451 5.42353 2.4324C5.71209 2.2231 6.0196 2.03856 6.32775 1.85588C6.63589 1.67321 6.94782 1.50849 7.26733 1.35244C7.62598 1.17781 7.99538 1.02362 8.36919 0.879332C8.67544 0.761056 8.98737 0.660117 9.2993 0.560418C9.60112 0.463816 9.91242 0.3957 10.2225 0.325725C10.6389 0.230201 11.0606 0.15784 11.4853 0.108988C11.8825 0.0644023 12.2778 0.00309533 12.6794 0.00681082L12.7754 0ZM18.4836 12.728C18.4854 12.389 18.4524 12.0506 18.3851 11.718C18.3049 11.3271 18.1777 10.9469 18.0062 10.5854C17.8044 10.16 17.5405 9.76571 17.2226 9.41504C16.9062 9.05455 16.5375 8.74158 16.1283 8.48617C15.5703 8.13273 14.9489 7.88664 14.2971 7.76103C13.9401 7.68958 13.5767 7.65245 13.2123 7.65018C12.8764 7.65042 12.5413 7.68361 12.2121 7.74926C11.6969 7.84589 11.1996 8.01856 10.7371 8.26138C10.471 8.40494 10.2162 8.56785 9.97494 8.74873C9.55298 9.07097 9.18374 9.45459 8.88002 9.88629C8.60575 10.2783 8.38974 10.7066 8.23848 11.1582C8.10253 11.5602 8.02142 11.9782 7.99727 12.4011C7.97012 12.825 8.00177 13.2506 8.09136 13.6662C8.15345 13.9474 8.2379 14.2234 8.34393 14.4916C8.49689 14.8849 8.70197 15.2568 8.9539 15.5976C9.21301 15.9501 9.51902 16.2671 9.8638 16.5401C10.3016 16.8888 10.7914 17.1695 11.3161 17.3724C11.6022 17.482 11.8982 17.565 12.2001 17.6201C12.6728 17.7137 13.1563 17.7441 13.6373 17.7105C13.9498 17.6857 14.2598 17.6364 14.5642 17.5631C15.0817 17.4402 15.5757 17.2366 16.0273 16.96C16.4597 16.7018 16.8501 16.3814 17.1853 16.0094C17.4564 15.7087 17.6927 15.3795 17.89 15.0279C18.0589 14.7267 18.1915 14.4073 18.2853 14.0761C18.4154 13.6234 18.5063 13.1584 18.4836 12.7305V12.728Z" fill="currentColor" />
    </svg>
  );
}

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
      {/* The star takes the STUDY's signal accent, not a baked-in orange —
          on Verkos (data-accent="cyan") it must read cyan like every other
          accent-driven element. `currentColor` + the accent text token means
          one rule in globals.css recolors it per study. */}
      <path
        d="M41.6665 12.7797C41.7993 11.3503 43.8869 11.3522 44.0171 12.7819L45.3896 27.8579C45.9538 34.056 50.7978 39.0032 56.9826 39.698L76.3337 41.8719C77.714 42.027 77.7392 44.0241 76.3632 44.2139L56.6422 46.9346C50.6095 47.7668 45.9441 52.6436 45.3797 58.7073L44.0088 73.4372C43.8761 74.8628 41.796 74.8661 41.6588 73.441L40.2319 58.621C39.6493 52.5693 34.9827 47.7121 28.9592 46.8878L9.3956 44.2106C8.01849 44.0222 8.04284 42.0232 9.42413 41.8684L28.6689 39.711C34.846 39.0185 39.6879 34.0836 40.2627 27.8944L41.6665 12.7797Z"
        fill="currentColor"
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
