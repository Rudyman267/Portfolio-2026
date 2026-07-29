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
