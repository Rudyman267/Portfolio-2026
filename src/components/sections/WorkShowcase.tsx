"use client";

import { useRef } from "react";
import Link from "next/link";
import type { Route } from "next";
import { gsap, useGSAP } from "@/lib/gsap";
import type { GalleryProject } from "@/lib/placeholderProjects";

/**
 * WorkShowcase — the project cards on /work.
 *
 * ── THE INTERACTION (user's Figma section 322:130, frames "1" → "2" → "3") ──
 *
 * At REST (frame 1) the card is a clean cover plate with the study title beside
 * it, the title's centre line matching the plate's centre line. On HOVER the
 * plate becomes a stage:
 *
 *   1. the cover DARKENS (it becomes a backdrop, not the subject)
 *   2. an inner screenshot RISES from below the plate's bottom edge and settles
 *      centred but SMALLER than the frame, so the darkened cover still reads
 *      around it as a border
 *   3. the TITLE lifts slightly, opening the space that the kicker / eyebrow /
 *      build-note / meta stack rises into from below it
 *
 * Everything is mapped to hover and fully reversible — leaving the card returns
 * it to frame 1. Frame 2 in the Figma is the mid-point of that same transition
 * (inner image half-travelled, title half-lifted), which is why this is ONE
 * timeline scrubbed by play/reverse rather than three discrete states.
 *
 * ── WHY A PAUSED TIMELINE, NOT CSS `group-hover:` ──
 *
 * The previous build did this in Tailwind hover variants. Two things forced the
 * move to GSAP: the reveal is a SEQUENCE (the copy stack staggers in behind the
 * title's lift, and the inner image's travel overlaps it), and a hover that is
 * interrupted mid-flight has to reverse from wherever it actually is. A paused
 * timeline played/reversed on enter/leave gives both for free, and because the
 * timeline owns every animated property there is no CSS transition racing it.
 *
 * ── MOBILE IS A DIFFERENT LAYOUT, NOT A SCALED-DOWN ONE ──
 *
 * Per the user's `mobile` frame (322:93) and their explicit instruction: on
 * touch there is NO interaction. The card renders the FINAL state permanently —
 * darkened cover, smaller inner image seated inside it, title above, copy and
 * the FlytBase/duration meta below — as a single static stack. Handled by a
 * `matchMedia` split (see `useGSAP` below) plus the `lg:` layout classes, so the
 * desktop timeline is never even built on a phone.
 *
 * Scroll entrance stays ScrollTrigger-driven, per the house rule that
 * ScrollTrigger owns scroll-position values while hover owns its own timeline.
 * The two never write the same property: the entrance animates the OUTER
 * wrapper, the hover timeline only ever touches elements inside it.
 */

/**
 * Cover art — the background plate, darkened on hover.
 *
 * NOTE for LIR: this is `lir-plate.webp` (the drone-through-trees shot from the
 * Figma, rotated to landscape and cropped 16:9), NOT `image-1.webp`. Despite the
 * generic name, `image-1.webp` is the LIVE SESSION UI SCREENSHOT — using it here
 * put the same picture in the plate AND the reveal, so the rest state already
 * showed the thing the hover was supposed to bring in.
 *
 * NOTE for Verkos: `verkos-plate.webp` is the LIGHTER grade of the CCTV/skyline
 * shot (source: `Verkos reports thumbnail background lighter.png`). The darker
 * `verkos-cover-bg.webp` used before was already near-black, so the hover scrim
 * had nothing to darken and the state change read as nothing happening. A plate
 * that starts light is what makes the dim legible.
 */
const COVER: Record<string, string> = {
  "live-incident-response": "/case-study/cover/lir-plate.webp",
  "verkos-reports": "/case-study/cover/verkos-plate.webp",
  // the storefront thumbnail the user supplied ("Project cover thumbnail.png")
  "oro-connect": "/case-study/cover/oro-plate.webp",
};

/**
 * The inner image that rises into the frame on hover.
 *
 * LIR is the live session room (cropped out of the user's Figma slide asset).
 * Verkos is the annotated CAR DETECTION frame — the east-gate pickup with its
 * red bbox + "Pickup truck (98%)" label — NOT a UI screenshot: the user picked
 * the detection deliberately, it's the more legible image at this size and it
 * says what the product does in one glance.
 *
 * ORO's reveal is the branded landing UI (headline + logo + collections
 * panel), cropped 16:9 from `case-study-assets/oro-project/UI hero.png` — a
 * deliberate later swap away from the earlier products-grid screenshot. It
 * shares its source photo with the plate below (`oro-plate.webp`, the bare
 * storefront background), but the two read differently: the plate is dim,
 * uncropped set-dressing, the reveal is the bright, composited UI shot with
 * copy — so the hover still shows something new, not a repeat of the plate.
 */
const INNER: Record<string, string> = {
  "live-incident-response": "/case-study/cover/lir-ui.webp",
  "verkos-reports": "/case-study/verkos-cover.webp",
  "oro-connect": "/case-study/cover/oro-ui.webp",
};

/** The study's one-line headline, revealed under the title. */
const KICKER: Record<string, string> = {
  "live-incident-response": "A situation room that assembles itself in 30s.",
  "verkos-reports": "AI powered automated security report generation",
  "oro-connect": "A 70,000-piece catalogue a buyer can actually shop",
};

/** Accent-coloured discipline line under the kicker. */
const EYEBROW: Record<string, string> = {
  "live-incident-response":
    "corporate drone ops · emergency response · real-time collaboration",
  "verkos-reports":
    "drone operations · AI report generation · enterprise security",
  "oro-connect": "B2B jewellery · bulk ordering · catalogue at scale",
};

/** How the thing was built — the positioning line, from the Figma. */
const BUILD_NOTE: Record<string, string> = {
  "live-incident-response":
    "Designed and built to production as a solo design builder using claude code",
  "verkos-reports":
    "Designed and built to production as a solo design builder using claude code",
  // ORO predates the design-builder work — it was a design handoff, and saying
  // otherwise here would misrepresent it.
  "oro-connect":
    "Designed solo end to end, from platform audit through to engineering handoff",
};

/** Duration shown beside the company mark. */
const DURATION: Record<string, string> = {
  "live-incident-response": "6 Weeks",
  "verkos-reports": "9 Weeks",
  "oro-connect": "3 Months",
};

/**
 * The company mark shown in the card's meta line.
 *
 * ⚠️ This used to be a hardcoded FlytBase logo, which was fine while every
 * study was a FlytBase study — ORO Connect is not, and would have shipped a
 * card crediting the wrong company. Studies without a logo asset fall back to
 * `name` rendered as text, so adding a study never requires producing an SVG
 * first.
 */
const COMPANY: Record<string, { name: string; logo?: string; width?: number }> = {
  "live-incident-response": {
    name: "FlytBase",
    // the committed `flytbase-logo.svg` has a `fill="black"` wordmark, which is
    // invisible on this dark page — hence the light variant
    logo: "/case-study/flytbase-logo-light.svg",
    width: 94,
  },
  "verkos-reports": {
    name: "FlytBase",
    logo: "/case-study/flytbase-logo-light.svg",
    width: 94,
  },
  "oro-connect": { name: "ORO Precious Metals" },
};

function ProjectPlate({ project }: { project: GalleryProject }) {
  const cover = COVER[project.slug];
  const inner = INNER[project.slug];
  const kicker = KICKER[project.slug] ?? project.summary;
  const eyebrow = EYEBROW[project.slug] ?? project.tags.join(" · ");
  const buildNote = BUILD_NOTE[project.slug];
  const duration = DURATION[project.slug];
  const company = COMPANY[project.slug];

  return (
    <article
      data-plate
      // MOBILE: one column, three rows — title / plate / copy (user's mobile
      // frame 322:93).
      // DESKTOP: two columns, ONE row. The text column is a single cell that
      // `items-center` centres against the plate, and the title + copy live
      // together inside it as one unit — see the wrapper below for why they
      // can't be two separate grid rows.
      className="grid grid-cols-1 items-center gap-x-[clamp(2rem,4vw,4.5rem)] gap-y-5 lg:grid-cols-[minmax(0,1.05fr)_minmax(0,1fr)] lg:gap-y-0"
    >
      <Link
        href={`/work/${project.slug}` as Route}
        data-card
        aria-label={`${project.title} — open case study`}
        // `lg:row-start-1` and NO row-span: the desktop grid is a single row, so
        // the plate and the text column share it and the parent's
        // `items-center` centres the text on the plate's own centreline. An
        // earlier `lg:row-span-2` left over from a two-row layout made the plate
        // span rows 1-2 while the text sat in row 1 only — so the text centred
        // against half the card and hung ~180px above the thumbnail's centre.
        className="group/card relative row-start-2 block w-full self-center focus-visible:outline-none lg:col-start-1 lg:row-start-1"
      >
        {/* THE PLATE — the frame the inner image rises into. `overflow-hidden`
            is load-bearing: it's what hides the inner image below the bottom
            edge at rest, so the reveal reads as something entering the frame
            rather than fading in on top of it. */}
        <div
          data-frame
          className="relative aspect-[16/9] w-full overflow-hidden rounded-[4px] border border-white/15 bg-black"
        >
          {cover ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              data-cover
              src={cover}
              alt=""
              className="absolute inset-0 h-full w-full scale-[1.06] object-cover"
              loading="lazy"
            />
          ) : (
            <div className="absolute inset-0 bg-[radial-gradient(120%_120%_at_30%_22%,#3a2a1c_0%,#1a1410_60%,#0b0d12_100%)]" />
          )}

          {/* DARKENING SCRIM. Sits between the cover and the inner image so it
              darkens ONLY the backdrop — the screenshot on top keeps its full
              contrast, which is what makes it read as lit from within.
              Pre-darkened on mobile (see the `lg:opacity-0` split): the phone
              layout has no hover, so it ships in the end state. */}
          <div
            data-scrim
            aria-hidden
            className="absolute inset-0 bg-black/55 lg:opacity-0"
          />

          {/* THE INNER IMAGE. Width is 75.8% of the frame — the Figma's
              476.8/628.7 — and it's centred horizontally with a slight upward
              bias vertically, matching `image 609`'s seat in frame 3.
              At rest (desktop) the timeline parks it fully below the frame.
              On mobile it renders in its landed position with no JS at all. */}
          {inner ? (
            <div
              data-inner
              className="absolute left-1/2 top-[12%] w-[75.8%] -translate-x-1/2 overflow-hidden rounded-[3px] shadow-[0_18px_50px_-12px_rgba(0,0,0,0.9)] ring-1 ring-white/10"
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={inner}
                alt={`${project.title} — interface`}
                className="block h-auto w-full"
                loading="lazy"
              />
            </div>
          ) : null}
        </div>
      </Link>

      {/* ── THE TITLE ──
          Mobile: ABOVE the plate, centred (grid row 1, plate in row 2).
          Desktop: it is pulled OUT of the mobile grid flow and rendered inside
          the text-column wrapper below instead, so the title and the copy can be
          centred against the plate as one unit. */}
      <h3
        className="row-start-1 text-center text-[clamp(1.6rem,1rem+2vw,2.55rem)] uppercase leading-[1.05] tracking-[0.01em] text-fg lg:hidden"
        style={{ fontFamily: "var(--font-display-tanker)" }}
      >
        {project.title}
      </h3>

      {/* ── THE TEXT COLUMN ──
          Mobile: row 3, below the plate (the mobile title above is its own
          element; this holds only the copy).
          Desktop: ONE grid cell that `items-center` on the parent centres
          against the plate. The title lives INSIDE it here, and the reveal stack
          is `absolute` at rest — so at rest the wrapper's only in-flow child is
          the title, which therefore lands exactly on the plate's centre line,
          and on hover the stack takes up flow beneath it while the whole
          wrapper stays centred. Two separate grid rows could not do this: equal
          rows put the title on the row BOUNDARY rather than the true centre,
          and reserved space for the copy dragged the pair low. */}
      <div
        data-text-col
        // `lg:self-center` is what puts the title on the thumbnail's horizontal
        // centreline. Without it the cell STRETCHES to the plate's full height
        // and the title renders at the top of that stretched box, which reads as
        // the title floating well above the plate's centre.
        className="relative row-start-3 flex flex-col lg:col-start-2 lg:row-start-1 lg:items-start lg:self-center"
      >
        {/* Desktop title — the hover lift's target, and the ONLY [data-title]
            in the card so the timeline's querySelector can't grab the wrong one.
            The mobile heading above and this one are never both displayed, so
            neither needs aria-hiding; a screen reader reads exactly one, and the
            Link's own aria-label already names the study for the card itself. */}
        <h3
          data-title
          className="hidden text-[clamp(1.6rem,1rem+2vw,2.55rem)] uppercase leading-[1.05] tracking-[0.01em] text-fg lg:block lg:text-left"
          style={{ fontFamily: "var(--font-display-tanker)" }}
        >
          {project.title}
        </h3>

        {/* THE REVEAL STACK — hidden at rest on desktop, always visible on
            mobile. Each child is a separate timeline target so they stagger up
            from behind the title rather than arriving as one slab.
            `lg:absolute` + `lg:top-full` parks it directly under the title
            WITHOUT reserving layout height, which is what keeps the title
            centred at rest; the hover timeline fades/rises it into that spot. */}
        <div
          data-reveal
          className="mt-3 flex flex-col items-center text-center lg:absolute lg:top-full lg:mt-4 lg:w-full lg:items-start lg:text-left"
        >
          <p
            data-reveal-item
            className="max-w-[34ch] text-[clamp(0.95rem,0.85rem+0.4vw,1.25rem)] leading-snug text-white"
          >
            {kicker}
          </p>
          <p
            data-reveal-item
            className="mt-2 max-w-[46ch] text-[clamp(0.72rem,0.66rem+0.25vw,0.875rem)] leading-snug text-accent"
          >
            {eyebrow}
          </p>
          {buildNote ? (
            <p
              data-reveal-item
              className="mt-4 max-w-[34ch] text-[clamp(0.9rem,0.8rem+0.35vw,1.15rem)] leading-snug text-white/85"
            >
              {buildNote}
            </p>
          ) : null}

          {/* META — the company mark, a dot, and the duration. Per-slug (see
              COMPANY): studies with a logo asset render it, the rest render the
              company name as text, so a new study is never blocked on an SVG. */}
          <div
            data-reveal-item
            className="mt-4 flex items-center gap-[9px]"
          >
            {company?.logo ? (
              /* eslint-disable-next-line @next/next/no-img-element */
              <img
                src={company.logo}
                alt={company.name}
                width={company.width ?? 94}
                height={16}
                className="h-4 w-auto"
                loading="lazy"
              />
            ) : company ? (
              <span className="text-[13px] font-medium leading-none text-white/85">
                {company.name}
              </span>
            ) : null}
            <span
              aria-hidden
              className="size-[5.9px] rounded-full bg-white/70"
            />
            <span className="text-[13px] text-white/90">{duration}</span>
          </div>
        </div>
      </div>
    </article>
  );
}

export function WorkShowcase({ projects }: { projects: GalleryProject[] }) {
  const root = useRef<HTMLDivElement>(null);

  useGSAP(
    () => {
      const mm = gsap.matchMedia();

      /* ── SCROLL ENTRANCE (all pointer types, motion permitting) ──
         Animates the OUTER card wrapper only, so it can never collide with the
         hover timeline's targets inside it. */
      mm.add("(prefers-reduced-motion: no-preference)", () => {
        const plates = gsap.utils.toArray<HTMLElement>(
          root.current?.querySelectorAll("[data-plate]") ?? [],
        );

        plates.forEach((plate) => {
          gsap.fromTo(
            plate,
            { y: 64, autoAlpha: 0 },
            {
              y: 0,
              autoAlpha: 1,
              duration: 1,
              ease: "expo.out",
              scrollTrigger: {
                trigger: plate,
                start: "top 85%",
                toggleActions: "play none none reverse",
              },
            },
          );
        });
      });

      /* ── THE HOVER TRANSITION — desktop, fine pointer, motion permitting ──
         Gated on `(hover: hover) and (pointer: fine)` so it is never built for
         touch: the mobile layout ships in the end state and must stay there.
         A media-query gate (not a JS width check) also means an attached mouse
         gets the real interaction regardless of viewport size. */
      mm.add(
        "(hover: hover) and (pointer: fine) and (prefers-reduced-motion: no-preference)",
        () => {
          const plates = gsap.utils.toArray<HTMLElement>(
            root.current?.querySelectorAll("[data-plate]") ?? [],
          );

          plates.forEach((plate) => {
            const card = plate.querySelector<HTMLElement>("[data-card]");
            const frame = plate.querySelector<HTMLElement>("[data-frame]");
            const scrim = plate.querySelector<HTMLElement>("[data-scrim]");
            const innerImg = plate.querySelector<HTMLElement>("[data-inner]");
            const textCol = plate.querySelector<HTMLElement>("[data-text-col]");
            const reveal = plate.querySelector<HTMLElement>("[data-reveal]");
            const title = plate.querySelector<HTMLElement>("[data-title]");
            const items = gsap.utils.toArray<HTMLElement>(
              plate.querySelectorAll("[data-reveal-item]"),
            );
            if (!card) return;

            // REST STATE. Set explicitly rather than relying on markup
            // defaults, because the mobile layout's markup IS the end state —
            // the desktop rest state is a thing this timeline has to establish.
            //
            // The park distance is MEASURED, not guessed. `yPercent` resolves
            // against the IMAGE's height, but the distance we actually need is
            // "from your landed position down to the frame's bottom edge" — a
            // frame-relative quantity. A hard-coded `yPercent: 100` overshot by
            // ~260px on a 405px-tall frame (the image is shorter than the frame
            // AND already inset 12% from its top), which left a long dead run
            // at the head of the travel where the reveal looked like it had
            // simply stalled.
            //
            // It's a FUNCTION, not a number, so every tween start/end
            // re-measures on invalidate. Card width is `vw`-driven, so a resize
            // changes the frame height without changing the media query — which
            // means `matchMedia` does NOT re-run and a value captured once here
            // would silently go stale (the same class of staleness that bit the
            // works-journey ticker, PROJECT_LOG §6).
            const parkPct = () => {
              if (!innerImg || !frame) return 100;
              const fh = frame.getBoundingClientRect().height;
              const ih = innerImg.getBoundingClientRect().height;
              // Lazy-loaded image may not have laid out yet — 100 is a safe
              // over-park (off-stage either way) rather than a divide-by-zero.
              if (!ih) return 100;
              return ((fh - innerImg.offsetTop) / ih) * 100;
            };

            if (innerImg)
              gsap.set(innerImg, { yPercent: parkPct, autoAlpha: 0 });
            if (scrim) gsap.set(scrim, { autoAlpha: 0 });
            gsap.set(items, { autoAlpha: 0, y: 26 });

            const tl = gsap.timeline({
              paused: true,
              defaults: { ease: "power3.out", duration: 0.62 },
            });

            // 1. the backdrop darkens first — the stage dims before the subject
            //    walks on, which is what stops the two reading as simultaneous
            if (scrim) tl.to(scrim, { autoAlpha: 1, duration: 0.42 }, 0);

            // 2. the inner image travels up from the frame's bottom edge.
            //    Slightly longer than the scrim so it's still arriving as the
            //    dim completes — that overlap is Figma frame 2.
            //
            //    fromTo (not a bare `to`) so the start is explicit and the
            //    reverse is deterministic: a `to()` would capture whatever
            //    yPercent happened to be mid-flight if the pointer left and
            //    re-entered before the tween settled.
            if (innerImg) {
              tl.fromTo(
                innerImg,
                { yPercent: parkPct, autoAlpha: 0 },
                { yPercent: 0, autoAlpha: 1, duration: 0.78, ease: "expo.out" },
                0.04,
              );
            }

            // 3. the whole text block re-centres against the plate.
            //
            //    At rest the reveal stack is `position: absolute`, so the title
            //    is the wrapper's only in-flow child and sits exactly on the
            //    plate's centre line. Once the stack is visible the block is
            //    taller, and centring the PAIR means lifting the wrapper by half
            //    the stack's height. Measured, not a fixed em: the stack's height
            //    depends on how many lines the kicker and build note wrap to,
            //    which changes per project and per viewport width. A hard-coded
            //    lift left the block hanging low (the Figma's 101px only holds at
            //    its own 1920x1080 artboard).
            //
            //    A function so it re-measures on invalidate, for the same reason
            //    `parkPct` is one.
            //    The `+ titleExtra / 2` term compensates for step 3b: the title's
            //    own extra lift raises the top of the group's bounding box, which
            //    would otherwise leave the GROUP sitting half that lift above the
            //    thumbnail's centreline (measured -6px before this term).
            const centreLift = () => {
              if (!reveal) return 0;
              // offsetHeight, not a rect: the stack is mid-tween when this is
              // read on a re-entry, and offsetHeight ignores the transform.
              const stackH = reveal.offsetHeight;
              const gap = parseFloat(getComputedStyle(reveal).marginTop) || 0;
              const titleExtra = title
                ? 0.3 * parseFloat(getComputedStyle(title).fontSize)
                : 0;
              return -((stackH + gap) / 2) + titleExtra / 2;
            };
            if (textCol)
              tl.fromTo(
                textCol,
                { y: 0 },
                { y: centreLift, duration: 0.55 },
                0,
              );

            // 3b. the TITLE lifts a little further than the group does. The
            //     wrapper tween above re-centres the block as a whole; this adds
            //     the extra travel on top of it, so the title visibly rises to
            //     make room while the copy comes up more gently underneath —
            //     which is the differential the Figma storyboard shows (the title
            //     moves further than the supporting text).
            if (title)
              tl.fromTo(
                title,
                { y: 0 },
                { y: "-0.3em", duration: 0.55 },
                0,
              );

            // 4. the copy stack rises into the space the title just opened
            tl.to(
              items,
              { autoAlpha: 1, y: 0, duration: 0.6, stagger: 0.055 },
              0.12,
            );

            const play = () => tl.play();
            const back = () => tl.reverse();

            // Re-measure the park distance after a resize. `invalidate()` makes
            // the function-based values above run again on the next play; doing
            // it only while the card is AT REST means we never yank an
            // in-flight reveal out from under the pointer.
            const onResize = () => {
              if (tl.progress() === 0 && !tl.isActive()) {
                tl.invalidate();
                if (innerImg)
                  gsap.set(innerImg, { yPercent: parkPct, autoAlpha: 0 });
              }
            };
            window.addEventListener("resize", onResize);

            card.addEventListener("mouseenter", play);
            card.addEventListener("mouseleave", back);
            // Keyboard parity — the reveal carries the study's description, so
            // it can't be mouse-only.
            card.addEventListener("focus", play);
            card.addEventListener("blur", back);

            return () => {
              window.removeEventListener("resize", onResize);
              card.removeEventListener("mouseenter", play);
              card.removeEventListener("mouseleave", back);
              card.removeEventListener("focus", play);
              card.removeEventListener("blur", back);
              tl.kill();
            };
          });
        },
      );

      // NOTE: no manual `ScrollTrigger.getAll().forEach(kill)` cleanup here.
      // `useGSAP` auto-reverts everything created in this context, including
      // its ScrollTriggers. A global kill reaches outside this component and
      // froze PageHeading's scrubbed fade mid-flight (see PROJECT_LOG §5).
    },
    { scope: root },
  );

  return (
    <div
      ref={root}
      className="flex flex-col gap-[clamp(4rem,12vh,9rem)]"
    >
      {projects.map((p) => (
        <ProjectPlate key={p.slug} project={p} />
      ))}
    </div>
  );
}
