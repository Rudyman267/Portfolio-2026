"use client";

import { useRef, type Key, type ReactNode } from "react";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { gsap, useGSAP, ScrollTrigger, ease } from "@/lib/gsap";
import { cn } from "@/lib/utils";
import { Reveal } from "@/components/motion/Reveal";
import { Chapter, FlashPanel, Spawn } from "@/components/case-study/Chapter";
import {
  CountUp,
  Figure,
  BeforeAfter,
  DemoVideo,
  FeatureRow,
  OutlineNote,
  ArchTimeline,
  PullQuote,
  MattersList,
  GapCards,
  DecisionCluster,
  DroneMark,
  OroMark,
  PersonaSplitDiagram,
  OnboardingFlowDiagram,
  StakeholderActionsDiagram,
} from "@/components/case-study/lirBlocks";
import { DecisionText, VerkosDiagram } from "@/components/case-study/verkosBlocks";
import { VerkosPrototype } from "@/components/case-study/VerkosPrototype";
import { OroProductCard } from "@/components/case-study/OroProductCard";
import { OroFrictionMap } from "@/components/case-study/OroFrictionMap";
import { PersonaCarousel } from "@/components/case-study/PersonaCarousel";
import { ImageLightbox } from "@/components/case-study/ImageLightbox";
import { NowPlaying } from "@/components/audio/NowPlaying";

/** Chapters wired to the full-viewport flash transition — every numbered
 *  section now opens on its Tanker title flash, then spawns its content. */
const CHAPTER_IDS = new Set<string>([
  "context",
  "problem",
  "reframe",
  "process",
  "decisions",
  "features",
  "impact",
]);
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

/* ── Company logo for the overview meta card. Keyed by slug, because a
   hardcoded logo here silently credits the wrong company the moment a study
   from a different client renders. `chip` matters: the FlytBase wordmark is
   dark/gradient and vanishes on the dark card, so it needs a light chip
   behind it; the ORO wordmark is already white and must NOT get one. Any
   slug missing from this map falls back to the plain text value. ────────── */
const COMPANY_LOGO: Record<string, { src: string; alt: string; chip: boolean }> =
  {
    "live-incident-response": {
      src: "/case-study/flytbase-logo.svg",
      alt: "FlytBase",
      chip: true,
    },
    "verkos-reports": {
      src: "/case-study/flytbase-logo.svg",
      alt: "FlytBase",
      chip: true,
    },
    "oro-connect": {
      src: "/case-study/oro-logo.svg",
      alt: "ORO Precious Metals",
      chip: false,
    },
  };

function CompanyLogo({ slug, fallback }: { slug: string; fallback: string }) {
  const logo = COMPANY_LOGO[slug];
  if (!logo) return <>{fallback}</>;
  return (
    <span
      className={
        logo.chip
          ? "inline-flex items-center rounded-[5px] bg-white px-1.5 py-0.5 align-middle"
          : "inline-flex items-center align-middle"
      }
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={logo.src}
        alt={logo.alt}
        className={logo.chip ? "inline-block h-2.5 w-auto" : "inline-block h-3 w-auto"}
      />
    </span>
  );
}

/* ── GapReveal — the orange "gap conclusion" card, revealed with a spring-in
   (scale + rise + a soft orange glow that pulses on arrival). Reduced motion:
   it simply appears. ─────────────────────────────────────────────────────── */
function GapReveal({ src }: { src: string }) {
  const ref = useRef<HTMLDivElement>(null);
  useGSAP(
    () => {
      const el = ref.current;
      if (!el) return;
      const card = el.querySelector<HTMLElement>("[data-gap-card]");
      const glow = el.querySelector<HTMLElement>("[data-gap-glow]");
      if (!card) return;

      const mm = gsap.matchMedia();
      mm.add("(prefers-reduced-motion: no-preference)", () => {
        gsap.set(card, { autoAlpha: 0, y: 60, scale: 0.94 });
        if (glow) gsap.set(glow, { autoAlpha: 0, scale: 0.6 });
        const tl = gsap.timeline({
          scrollTrigger: { trigger: el, start: "top 80%" },
        });
        tl.to(card, {
          autoAlpha: 1,
          y: 0,
          scale: 1,
          duration: 0.9,
          ease: "back.out(1.5)",
        });
        if (glow)
          tl.to(
            glow,
            { autoAlpha: 1, scale: 1.1, duration: 0.7, ease: "power2.out" },
            0.1,
          ).to(glow, {
            autoAlpha: 0.55,
            scale: 1,
            duration: 1.2,
            ease: "sine.inOut",
          });
      });
      mm.add("(prefers-reduced-motion: reduce)", () => {
        gsap.set(card, { autoAlpha: 1, y: 0, scale: 1 });
      });
    },
    { scope: ref },
  );

  return (
    <div ref={ref} className="relative py-6">
      {/* soft orange bloom behind the card */}
      <div
        data-gap-glow
        aria-hidden
        className="pointer-events-none absolute inset-0 -z-0 blur-3xl"
        style={{
          background:
            "radial-gradient(60% 60% at 50% 50%, rgb(var(--color-accent) / 0.45), transparent 70%)",
        }}
      />
      <div data-gap-card className="relative z-10 will-change-[transform,opacity]">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={src}
          alt="The CEO whose building is on fire and the fire captain in the parking lot don't have a FlytBase account, don't know what FlytBase is — a phone in one hand, a radio in the other, and they need answers now."
          className="lir-wide-mobile mx-auto h-auto w-full max-w-[var(--lir-measure)] rounded-[21px]"
        />
      </div>
    </div>
  );
}

/** Build the Contents rail from the chapters that actually exist.
 *
 *  The hand-authored `data.contents` had drifted out of sync with the study:
 *  it listed ten entries for seven chapters, pointed several of them at the
 *  SAME section id ("the shift"/"process" both → `process`, "solution"/
 *  "trade-offs" both → `decisions`, "Impact"/"reflection" both → `impact`),
 *  and omitted `features` entirely. Duplicated targets also broke the
 *  scroll-spy, since two links lit at once.
 *
 *  Deriving from the sections means the rail always mirrors the full-viewport
 *  Tanker flash titles a reader actually sees, and cannot drift again.
 *  `heading` is normalised to lower case so LIR's "IMPACT" matches the rail's
 *  styling (Verkos writes "Impact"); `.lir` handles display casing.
 */
function deriveContents(data: LirDesign) {
  const chapters = data.sections.filter((s) => CHAPTER_IDS.has(s.id));
  return [
    { n: "", label: "Overview", id: "overview" },
    ...chapters.map((s, i) => ({
      n: String(i + 1).padStart(2, "0"),
      label: (s.heading ?? s.id).toLowerCase(),
      id: s.id,
    })),
  ];
}

export function LirCaseStudy({ data }: { data: LirDesign }) {
  const root = useRef<HTMLElement>(null);
  let figN = 0;
  const nextFig = () => `Fig.${String(++figN).padStart(2, "0")}`;
  const contents = deriveContents(data);

  /* Section-scroll wiring: light each Contents entry as its section arrives. */
  useGSAP(
    () => {
      const mm = gsap.matchMedia();

      // ── CRITICAL: lazy-loaded images change layout height AFTER ScrollTrigger
      //    computes all pin/flash/spawn/section positions. Without a refresh the
      //    chapters collapse to their imageless height and later flashes (e.g.
      //    FEATURES) land on top of earlier content (e.g. decisions 2/3 vanish).
      //    Refresh once every image in the article has loaded, once fonts are
      //    ready (Tanker changes heading widths), and after the load event.
      const imgs = Array.from(
        root.current?.querySelectorAll<HTMLImageElement>("img") ?? [],
      );
      let pending = imgs.filter((im) => !im.complete).length;
      const onOne = () => {
        pending -= 1;
        if (pending <= 0) ScrollTrigger.refresh();
      };
      imgs.forEach((im) => {
        if (im.complete) return;
        im.addEventListener("load", onOne, { once: true });
        im.addEventListener("error", onOne, { once: true });
      });
      if (typeof document !== "undefined" && document.fonts?.ready) {
        document.fonts.ready.then(() => ScrollTrigger.refresh());
      }
      if (typeof window !== "undefined") {
        if (document.readyState === "complete") {
          requestAnimationFrame(() => ScrollTrigger.refresh());
        } else {
          window.addEventListener("load", () => ScrollTrigger.refresh(), { once: true });
        }
      }

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

        // Target the BACKGROUND explicitly. The plate now also contains the
        // title/role SVGs, and a bare querySelector("img") would parallax
        // whichever happened to come first in the DOM.
        const img =
          intro.querySelector<HTMLElement>("[data-intro-bg]") ??
          intro.querySelector("img");
        const type = intro.querySelectorAll<HTMLElement>(
          "[data-intro-title], [data-intro-role]",
        );
        const tl = gsap.timeline({
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
        // the type drifts UP slightly faster than the photo and fades as the
        // page rises over it — so it reads as a layer, not a baked-in caption
        if (type.length) {
          tl.to(type, { yPercent: -22, autoAlpha: 0, ease: "none" }, 0);
        }
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

  // "<Company> — <Role>" for the cover's role strip: the alt text when a strip
  // SVG exists, and the rendered text when it doesn't. Read from `meta` so it
  // can never disagree with the study's own stated company/role.
  const introRoleAlt = [
    data.meta.find((m) => m.label === "Company")?.value,
    data.meta.find((m) => m.label === "Role")?.value,
  ]
    .filter(Boolean)
    .join(" — ");

  // The headline mark, chosen by company rather than baked in — see the note at
  // its render site. FlytBase studies keep the drone star; ORO gets its own
  // monogram. Both fill from currentColor so the accent token drives the colour.
  const Mark = data.slug === "oro-connect" ? OroMark : DroneMark;

  return (
    // `data-accent` passes the study's accent THROUGH rather than testing for
    // one known value: it used to read `=== "cyan" ? "cyan" : undefined`, which
    // silently dropped any new study colour. "orange" is the default already
    // baked into `.lir`, so it needs no attribute; any other value selects its
    // own token block in globals.css.
    <article
      ref={root}
      className="lir relative bg-bg text-fg"
      data-accent={data.accent && data.accent !== "orange" ? data.accent : undefined}
      data-header-dark={undefined}
    >
      {/* ── THUMBNAIL INTRO — a fixed, fully-OPAQUE cover pinned BEHIND the page
             (z-0, never fades). The page content sits above it (z-10, opaque
             bg) and simply scrolls up and over it, covering the thumbnail from
             below as it rises to fill the viewport. No opacity crossfade, so the
             two never ghost through each other. ─────────────────────────── */}
      {/* NOTE: deliberately NOT data-header-dark. This cover is `fixed
          inset-0`, so its rect overlaps the header strip at EVERY scroll
          position — marking it dark pinned the header transparent for the
          whole page, leaving the nav as bare text colliding with the case
          study copy. The page is a dark route (see Header's darkPage), so the
          bar is solid dark over the intro anyway. */}
      {/* The plate is LAYERED, not a single baked image: a raster background
          (object-cover, so it re-crops per viewport) with the title lockup +
          company/role strip as VECTOR overlays on top. That's the whole point
          of the split — on a phone the photo crops down hard, but the SVG type
          is laid out independently and stays legible at its own scale instead
          of being shrunk along with the background. Both `intro` and the role
          strip are per-study; the strip reads its company/role from `meta`. */}
      <div
        data-intro
        aria-hidden
        className="pointer-events-none fixed inset-0 z-0 overflow-hidden bg-black"
      >
        {data.intro ? (
          <>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              data-intro-bg
              src={data.intro.bg}
              alt=""
              className="absolute inset-0 h-full w-full object-cover"
              style={{ objectPosition: data.intro.bgPosition ?? "50% 50%" }}
              // decorative full-bleed intro plate — nothing to inspect up close
              data-no-zoom
            />
            {/* legibility scrim — the backgrounds are busy at the bottom edge
                where the type sits (city lights / tree canopy) */}
            <div className="absolute inset-0 bg-[linear-gradient(to_top,rgba(4,7,13,0.82)_0%,rgba(4,7,13,0.35)_38%,rgba(4,7,13,0.08)_65%,transparent_100%)]" />

            {/* type block — bottom-left title, bottom-right role strip on wide
                screens; stacked left-aligned on phones. Widths are in cqw-ish
                clamps so each SVG scales on its OWN curve, independent of how
                far the background has been cropped. */}
            <div className="absolute inset-x-0 bottom-0 flex flex-col gap-6 px-[6vw] pb-[8vh] sm:px-[5vw] lg:flex-row lg:items-end lg:justify-between lg:gap-10 lg:px-[4vw] lg:pb-[7vh]">
              {/* Title: a per-study SVG lockup when one exists, otherwise the
                  study's own title set in the display face. The fallback means a
                  new study is never blocked on someone exporting a vector. */}
              {data.intro.title ? (
                /* eslint-disable-next-line @next/next/no-img-element */
                <img
                  data-intro-title
                  src={data.intro.title}
                  alt={`${data.title} — case study cover`}
                  className="block h-auto w-[min(88vw,320px)] sm:w-[min(72vw,480px)] lg:w-[clamp(480px,42vw,803px)]"
                  data-no-zoom
                />
              ) : (
                <h1
                  data-intro-title
                  className="display max-w-[14ch] text-[clamp(2.75rem,9vw,7rem)] uppercase leading-[0.92] text-white"
                >
                  {data.title}
                </h1>
              )}
              {/* ⚠️ Role strip is PER-STUDY. It was a hardcoded FlytBase SVG,
                  which silently credited the wrong company the moment a study
                  from anywhere else was added. Studies without a strip asset
                  render their company + role as text from `meta`. */}
              {data.intro.role ? (
                /* eslint-disable-next-line @next/next/no-img-element */
                <img
                  data-intro-role
                  src={data.intro.role}
                  alt={introRoleAlt}
                  className="block h-auto w-[min(64vw,240px)] shrink-0 lg:mb-2 lg:w-[clamp(280px,24vw,552px)]"
                  data-no-zoom
                />
              ) : introRoleAlt ? (
                <p
                  data-intro-role
                  className="shrink-0 text-[clamp(0.8rem,1.4vw,1.05rem)] uppercase tracking-[0.14em] text-white/70 lg:mb-3"
                >
                  {introRoleAlt}
                </p>
              ) : null}
            </div>
          </>
        ) : null}
        {/* Hint sits TOP-centre when there's a layered cover — the bottom of
            the plate is now occupied by the title + role lockup, and the old
            bottom-centre position sat right on top of them. */}
        <div
          data-intro-hint
          className={cn(
            "absolute left-1/2 -translate-x-1/2 text-[13px] font-medium uppercase tracking-[0.25em] text-white/70",
            data.intro ? "top-24 sm:top-28" : "bottom-8",
          )}
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
      <div className="relative z-10 bg-bg px-6 pt-28 pb-24 sm:pt-32 lg:px-12">
        <div className="mx-auto grid max-w-[1680px] gap-[var(--lir-col-gap)] lg:grid-cols-[var(--lir-rail-w)_1fr]">
          {/* ── LEFT RAIL — back link + meta + Contents, sticky the whole way ── */}
          <aside className="lg:sticky lg:top-24 lg:h-fit lg:self-start">
            <Link
              href="/work"
              className="inline-flex items-center gap-2 text-[var(--lir-body-sm)] font-medium text-muted transition-colors hover:text-fg"
            >
              <ArrowLeft size={16} /> {data.backLabel}
            </Link>

            {/* overview meta card — lifted dark surface, faint white hairline */}
            <div className="mt-8 rounded-[10px] border border-white/12 bg-surface p-3.5">
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
                      {m.label === "Company" ? (
                        <CompanyLogo slug={data.slug} fallback={m.value} />
                      ) : (
                        m.value
                      )}
                    </dd>
                  </div>
                ))}
              </dl>
            </div>

            {/* contents nav — lifted dark surface, faint white hairline.
                Hidden below lg: without the sticky rail it's just a wall of
                links pushing the study down a full screen, and the scroll-spy
                highlight is never visible mid-read on a phone. */}
            <nav
              aria-label="Contents"
              className="mt-3 hidden rounded-[10px] border border-white/12 bg-surface px-3.5 py-4 lg:block"
            >
              <p className="text-[length:var(--lir-rail-nav)] font-semibold uppercase tracking-wide text-fg">
                Contents
              </p>
              <ul className="mt-3 space-y-[0.6rem]">
                {contents.map((c, i) => (
                  <li key={i}>
                    <a
                      href={`#${c.id ?? "overview"}`}
                      data-toc-link
                      data-target={c.id ?? "overview"}
                      className="group flex items-baseline gap-2 text-[length:var(--lir-rail-nav)] text-muted transition-colors data-[active]:text-accent hover:text-fg"
                    >
                      {c.n && (
                        <span className="w-3.5 tabular-nums text-muted group-data-[active]:text-accent">
                          {c.n}
                        </span>
                      )}
                      <span className={c.n ? "" : "font-medium"}>{c.label}</span>
                    </a>
                  </li>
                ))}
              </ul>
            </nav>

            {/* ── MUSIC TOGGLE ──
                Under the Contents block, inside the rail — so it inherits the
                rail's `lg:sticky` and stays reachable through the whole read
                (per the user's reference screenshot).
                `lg:block` to match the Contents nav above it: below lg the rail
                is not sticky, so a control here would scroll away — on phones
                the header carries the compact waveform instead. */}
            <div className="mt-5 hidden lg:block">
              <NowPlaying />
            </div>
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
              <div className="mt-[3.75rem] flex items-center gap-5 sm:gap-[35px]">
                {/* The mark is PER-COMPANY: the FlytBase star would credit the
                    wrong brand on a non-FlytBase study. Both marks fill from
                    currentColor, so text-accent recolors either one — LIR
                    #ff8d3b, Verkos cyan #08e6ff, ORO gold #d9a441. */}
                <Mark
                  size={86}
                  className="w-[52px] shrink-0 text-accent sm:w-[86px]"
                />
                {/* max-w tuned so both LIR + Verkos headlines break to 2 lines
                    (was 16ch → 3 lines). balance keeps the two lines even. */}
                <h1 className="max-w-[24ch] text-balance text-[length:var(--lir-headline)] font-extrabold leading-[0.9] tracking-[-0.01em] text-fg">
                  {data.headline}
                </h1>
              </div>
            </Reveal>

            <Reveal delay={0.12}>
              <p className="mt-[3.25rem] max-w-[var(--lir-measure)] text-[length:var(--lir-lede)] leading-[1.5] text-fg">
                {data.lede}
              </p>
            </Reveal>

            {/* stats row (36px Bold number, 16px label + sub). Columns adapt to
                the stat COUNT — LIR has 4, Verkos has 2 — so a 2-stat study
                doesn't get squeezed into quarter-width cells (which wrapped
                "45 → 5 mins"). Arrow-notation values stay on one line. */}
            <Reveal delay={0.18}>
              <div
                className={cn(
                  "mt-[5.5rem] grid gap-x-10 gap-y-8",
                  data.stats.length <= 2
                    ? "grid-cols-1 sm:grid-cols-2"
                    : "grid-cols-2 sm:grid-cols-4",
                )}
              >
                {data.stats.map((s) => (
                  <div key={s.label}>
                    <CountUp
                      value={s.value}
                      className="block whitespace-nowrap text-[length:var(--lir-stat)] font-bold leading-none tracking-[-0.01em] tabular-nums text-accent"
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

            {/* Demo video — closes the Overview, but only for studies that
                ship one (data.demoVideo). Audio is part of the story, so the
                player ships mute + volume controls and never autoplays.
                Verkos has no video, so it opts out by omitting the field. */}
            {data.demoVideo && (
              <Reveal className="mt-16 max-w-[var(--lir-measure)]">
                <DemoVideo
                  src={data.demoVideo.src}
                  poster={data.demoVideo.poster}
                  label={data.demoVideo.label}
                />
              </Reveal>
            )}

            {/* INTERACTIVE PRODUCT DEMO — the real app, embedded. Sits after
                the build statement and BEFORE the first chapter flash, so the
                reader can use the thing before any of the story starts.
                Opt-in per study via data.appDemo. */}
            {data.appDemo && (
              <div className="mt-10 w-full max-w-[1080px]">
                <VerkosPrototype variant="app" />
              </div>
            )}

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

          </div>
        </div>
      </div>

      {/* Click-to-expand for every screenshot in the study. Mounted here (the
          shared shell) so LIR and Verkos both get it. */}
      <ImageLightbox containerRef={root} />
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
  const isChapter = CHAPTER_IDS.has(section.id);

  // Chapter: the Tanker title fills the viewport (scrubbed) then disappears,
  // and each content block spawns in scrubbed as it arrives.
  if (isChapter) {
    return (
      <Chapter id={section.id} title={section.heading}>
        <SectionBody section={section} nextFig={nextFig} spawn />
      </Chapter>
    );
  }

  return (
    <section id={section.id} data-section className="scroll-mt-28 pt-24">
      <h2
        data-heading
        className="display text-[length:var(--lir-h-section)] uppercase text-accent"
      >
        {section.heading}
      </h2>
      <div className="mt-7">
        <SectionBody section={section} nextFig={nextFig} />
      </div>
    </section>
  );
}

/* ── Section body — the content of a section, revealed either play-once
   (<Reveal>) or scrubbed inside a chapter (<Spawn>). ─────────────────────── */
function SectionBody({
  section,
  nextFig,
  spawn = false,
}: {
  section: Section;
  nextFig: () => string;
  spawn?: boolean;
}) {
  // wrap a block: scrubbed <Spawn> inside a chapter, else play-once <Reveal>.
  // A helper CALL (not a component) so it isn't re-created every render.
  const w = (children: ReactNode, className?: string, key?: Key) =>
    spawn ? (
      <Spawn key={key} className={className}>
        {children}
      </Spawn>
    ) : (
      <Reveal key={key} className={className}>
        {children}
      </Reveal>
    );

  if (section.kind === "prose") {
    return <ProseBody blocks={section.blocks} nextFig={nextFig} spawn={spawn} />;
  }

  if (section.kind === "decisions") {
    return (
      <>
        {section.intro &&
          w(
            <p className="max-w-[var(--lir-measure)] text-[length:var(--lir-body)] leading-relaxed text-muted">
              {section.intro}
            </p>,
          )}
        <div className="mt-12 space-y-16">
          {/* DecisionCluster owns its own bounded map grid (Figma 239:27) — do
              NOT also render c.media here or the images render twice/full-scale. */}
          {section.clusters.map((c) => w(<DecisionCluster {...c} />, undefined, c.n))}
        </div>
      </>
    );
  }

  if (section.kind === "features") {
    return (
      <div className="space-y-28">
        {section.features.map((f) =>
          w(
            <FeatureRow
              tagline={f.tagline}
              title={f.title}
              body={f.body}
              body2={f.body2}
              textSide={f.textSide}
              media={f.media}
            />,
            undefined,
            f.title,
          ),
        )}
      </div>
    );
  }

  // impact
  return (
    <>
      {w(
        <p className="max-w-[var(--lir-measure)] text-[length:var(--lir-lede)] font-medium text-fg">
          {section.lede}
        </p>,
      )}
      {w(
        <>
          <Figure slot={section.dashboard} fig={nextFig()} ratio="16 / 8" />
          <p className="mt-4 max-w-[var(--lir-measure)] text-[var(--lir-body-sm)] leading-relaxed text-muted">
            {section.dashboardCaption}
          </p>
        </>,
        "mt-10",
      )}
      {w(
        <>
          <Figure slot={section.growth} fig={nextFig()} ratio="16 / 7" />
          <p className="mt-4 max-w-[var(--lir-measure)] text-[var(--lir-body-sm)] leading-relaxed text-muted">
            {section.growthCaption}
          </p>
        </>,
        "mt-14",
      )}
      {w(
        <>
          <p className="max-w-[28ch] text-[length:var(--lir-headline)] font-extrabold leading-[1.05] tracking-[-0.01em] text-fg">
            {section.closer}
          </p>
          <div className="mt-8">
            <Figure slot={section.closerMedia} fig={nextFig()} ratio="16 / 9" />
          </div>
        </>,
        "mt-16",
      )}
    </>
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
                  loading="eager"
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
          case "statement":
            // big bold statement beat — large Figma display statement. Spans the
            // full content measure so a ~95-char thesis breaks to ~3 lines (not 5
            // a tight measure forced); text-balance evens them. Bigger than a
            // lede, indented onto the content column (not the far-left gutter).
            return (
              // Display beat — a fixed px measure (not ch, which scales with the
              // huge font). ~820px lands a 95-char thesis in 3 lines, 82-char in
              // 3, 65-char in 2. text-pretty fills lines greedily (balance would
              // add lines). Indented onto the content column.
              // `full` stages it on its OWN viewport (see the block type): the
              // thesis gets clear air above and below instead of crowding
              // whatever block precedes it.
              <W
                key={i}
                className={cn(
                  "mx-auto max-w-[940px]",
                  b.full && "flex min-h-svh flex-col justify-center py-[12vh]",
                )}
              >
                {/* Centred: these land as standalone thesis beats between
                    scene breaks, so a centred block reads as a pause rather
                    than another left-aligned paragraph. `text-balance` evens
                    the line lengths, which matters far more once centred —
                    a short last line looks accidental on a centred block. */}
                <p className="text-balance text-center text-[clamp(1.9rem,1.2rem+2.3vw,2.6rem)] font-bold leading-[1.16] tracking-[-0.015em] text-fg">
                  {b.text}
                </p>
              </W>
            );
          case "p":
            return (
              <W key={i}>
                <p className="max-w-[var(--lir-measure)] text-[length:var(--lir-body)] leading-relaxed text-muted">
                  {b.text}
                </p>
              </W>
            );
          case "leadP":
            // bold WHITE lead sentence, then light-grey remainder, inline.
            return (
              <W key={i}>
                <p className="max-w-[var(--lir-measure)] text-[length:var(--lir-body)] leading-relaxed text-muted">
                  <span className="font-semibold text-fg">{b.lead} </span>
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
            // full-viewport quote flash — plays in then scrubs away as the next
            // block appears (the Chapter's GSAP owns the come-and-go). `bright` =
            // white + heavier (Verkos reframe thesis); default grey. `wide`
            // widens the measure so a ~65-char line breaks to ~2 lines.
            return (
              <FlashPanel key={i}>
                <span
                  className={cn(
                    "text-center text-balance tracking-[-0.01em]",
                    b.wide
                      ? "max-w-[22ch] text-[clamp(2rem,1.2rem+3vw,3.25rem)] leading-[1.15]"
                      : "max-w-[60ch] text-[clamp(1.4rem,0.9rem+1.9vw,2.3rem)] leading-[1.2]",
                    b.tone === "bright"
                      ? "font-bold text-fg"
                      : "font-extrabold text-muted",
                  )}
                >
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
                  loading="eager"
                />
                <p className="mt-6 text-center text-[length:var(--lir-body)] leading-relaxed text-muted">
                  {b.caption}
                </p>
              </W>
            ) : (
              <W key={i} className={b.wide ? "" : "max-w-[var(--lir-measure)]"}>
                <div style={b.scale ? { maxWidth: `${b.scale * 100}%`, marginInline: "auto" } : undefined}>
                  <Figure slot={b.slot} fig={nextFig()} />
                </div>
              </W>
            );
          case "gapConclusion":
            // the orange gap-conclusion card (copy baked into the SVG) — pops
            // in after the warehouse scenario via GapReveal's spring-in.
            return (
              <GapReveal key={i} src={b.src} />
            );
          case "video":
            // real player when a src is set; labelled placeholder otherwise.
            if (b.src)
              return (
                <W key={i} className="max-w-[var(--lir-measure)]">
                  <DemoVideo src={b.src} poster={b.poster} label={b.label} />
                </W>
              );
            return (
              <W key={i} className="max-w-[var(--lir-measure)]">
                <div
                  className="relative flex items-center justify-center overflow-hidden rounded-[var(--radius-lg)] border border-white/12 bg-surface-2"
                  style={{ aspectRatio: "16 / 9" }}
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
                  <div className="relative flex flex-col items-center gap-3 text-center">
                    <span className="flex h-14 w-14 items-center justify-center rounded-full bg-accent/15 text-accent">
                      <svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
                        <path d="M8 5v14l11-7z" />
                      </svg>
                    </span>
                    <p className="max-w-[40ch] text-[13px] text-muted">{b.label}</p>
                  </div>
                </div>
              </W>
            );
          case "sceneBreak":
            // a breathing beat so the NEXT block group arrives into a clear
            // frame. Kept short: blocks now self-play on threshold rather than
            // being scrubbed, so this no longer has to be a full empty
            // viewport of scrolling to let a scene finish.
            return <div key={i} aria-hidden className="h-[30vh]" />;
          case "centerP":
            return (
              <W key={i}>
                <p className="text-center text-[length:var(--lir-body)] leading-relaxed text-muted">
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
          case "archTimeline":
            // manages its own rail-draw + per-beat reveals, so it isn't wrapped
            // in the generic spawn/reveal <W>.
            return (
              <ArchTimeline
                key={i}
                intro={b.intro}
                outro={b.outro}
                beats={b.beats}
              />
            );
          case "decisionText":
            // Verkos native decision cluster — anime.js drives its own reveal.
            return (
              <DecisionText
                key={i}
                n={b.n}
                heading={b.heading}
                cards={b.cards}
                img={b.img}
                imgAlt={b.imgAlt}
                imgScale={b.imgScale}
              />
            );
          case "verkosDiagram":
            // Verkos inline animated SVG diagram — anime.js vector draw.
            return (
              <VerkosDiagram key={i} which={b.which} caption={b.caption} />
            );
          case "prototype":
            // Interactive exhibit. Wider than the reading measure (it's a UI,
            // not prose) and DESKTOP-ONLY — see VerkosPrototype for the mobile
            // notice that replaces it.
            // `full` gives it its own viewport so the exhibit is a stage, not a
            // figure crammed against the next beat.
            return (
              <div
                key={i}
                className={cn(
                  "w-full max-w-[1080px]",
                  b.full && "flex min-h-svh flex-col justify-center py-[10vh]",
                )}
              >
                <VerkosPrototype />
              </div>
            );
          case "microInteraction":
            // A looping component demo. Sits INSIDE the reading measure — it is
            // one card, not a full UI, so staging it full-bleed would oversell
            // it. The component owns its own loop, visibility gating and
            // reduced-motion fallback.
            return (
              <W key={i} className="mt-10">
                <OroProductCard caption={b.caption} />
              </W>
            );
          case "animatedDiagram":
            // A self-looping narrative diagram. Spans the WIDE column (like the
            // slide it replaces) — it is a full figure, not an inline card, so
            // it gets the full measure rather than the reading column.
            return (
              <W key={i} className="mt-8">
                {b.which === "oroFrictionMap" && (
                  <OroFrictionMap caption={b.caption} />
                )}
              </W>
            );
          case "personaCarousel":
            return (
              <W key={i} className="mt-16">
                <PersonaCarousel personas={b.personas} />
              </W>
            );
          case "figjamEmbed":
            return (
              <W key={i} className="mt-8">
                <figure className="w-full">
                  <div
                    className="relative w-full overflow-hidden rounded-lg border border-white/10"
                    style={{ aspectRatio: "16/9" }}
                  >
                    <iframe
                      src={b.url}
                      className="absolute inset-0 h-full w-full"
                      allowFullScreen
                      loading="lazy"
                      title="FigJam board"
                    />
                  </div>
                  {b.caption && (
                    <figcaption className="mx-auto mt-4 max-w-[var(--lir-measure)] text-center text-[length:var(--lir-caption)] leading-[1.5] text-muted">
                      {b.caption}
                    </figcaption>
                  )}
                </figure>
              </W>
            );
          case "imageRow":
            return (
              <W key={i}>
                <figure className="w-full">
                  <div
                    className="mx-auto flex items-start justify-center gap-[clamp(0.75rem,2vw,1.5rem)]"
                    style={b.scale ? { maxWidth: `${b.scale * 100}%` } : undefined}
                  >
                    {b.imgs.map((img, j) => (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        key={j}
                        src={img.src}
                        alt={img.alt}
                        className="h-auto flex-1 rounded-[6px]"
                        style={{ minWidth: 0 }}
                        loading="lazy"
                      />
                    ))}
                  </div>
                  {b.caption && (
                    <figcaption className="mx-auto mt-4 max-w-[var(--lir-measure)] text-center text-[length:var(--lir-caption)] leading-[1.5] text-muted">
                      {b.caption}
                    </figcaption>
                  )}
                </figure>
              </W>
            );
          case "heading":
            // bold white subsection title (2-line, tight) — Figma 229:3.
            return (
              <W key={i} className="mt-4">
                <h3 className="max-w-[22ch] text-[clamp(1.5rem,1.1rem+1.4vw,2rem)] font-bold leading-[1.1] tracking-[-0.01em] text-fg">
                  {b.text}
                </h3>
              </W>
            );
          case "subhead":
            // smaller white subhead (e.g. "Confused?", "What This Achieved").
            return (
              <W key={i}>
                <h4 className="text-[length:var(--lir-lede)] font-semibold text-fg">
                  {b.text}
                </h4>
              </W>
            );
          case "beforeAfter":
            return (
              <W key={i} className="max-w-[var(--lir-measure)]">
                <BeforeAfter before={b.before} after={b.after} caption={b.caption} />
              </W>
            );
          case "splitRow": {
            // asymmetric editorial row: prose on one side, a bare image on the
            // other. On mobile it stacks (image always second). Vertical
            // centering so the image sits against the text block (Figma 229:3).
            const imgFirst = b.side === "left";
            const textCol = (
              <div className="flex flex-col gap-5">
                {b.body.map((mb, j) => {
                  switch (mb.k) {
                    case "heading":
                      return (
                        <h3
                          key={j}
                          className="max-w-[22ch] text-[clamp(1.4rem,1.05rem+1.2vw,1.9rem)] font-bold leading-[1.12] tracking-[-0.01em] text-fg"
                        >
                          {mb.text}
                        </h3>
                      );
                    case "subhead":
                      return (
                        <h4
                          key={j}
                          className="mt-3 text-[length:var(--lir-lede)] font-semibold text-fg"
                        >
                          {mb.text}
                        </h4>
                      );
                    case "richP":
                      return (
                        <p
                          key={j}
                          className="text-[length:var(--lir-body)] leading-relaxed text-muted"
                        >
                          {mb.spans.map((s, k) => (
                            <span key={k} className={s.bold ? "font-semibold text-fg" : ""}>
                              {s.text}
                            </span>
                          ))}
                        </p>
                      );
                    default:
                      return (
                        <p
                          key={j}
                          className="text-[length:var(--lir-body)] leading-relaxed text-muted"
                        >
                          {mb.text}
                        </p>
                      );
                  }
                })}
              </div>
            );
            const imgCol = (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={b.img}
                alt={b.imgAlt}
                className="h-auto w-full"
                loading="eager"
              />
            );
            return (
              <W key={i} className="mt-[2.125rem]">
                <div className="grid items-center gap-8 lg:grid-cols-[minmax(0,0.85fr)_minmax(0,1.15fr)] lg:gap-14">
                  {imgFirst ? (
                    <>
                      <div className="order-2 lg:order-1">{imgCol}</div>
                      <div className="order-1 lg:order-2">{textCol}</div>
                    </>
                  ) : (
                    <>
                      <div className="order-1">{textCol}</div>
                      <div className="order-2">{imgCol}</div>
                    </>
                  )}
                </div>
              </W>
            );
          }
          case "designMd":
            return (
              <Reveal key={i}>
                <h3 className="text-[length:var(--lir-lede)] font-bold text-fg">
                  How I Got AI to Follow Our Design System
                </h3>
                <p className="mt-4 max-w-[var(--lir-measure)] text-[length:var(--lir-body)] leading-relaxed text-muted">
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
