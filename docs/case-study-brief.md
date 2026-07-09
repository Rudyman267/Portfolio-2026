# Design Brief — Case Studies

_Planning artifact from a `/shape` session. No code yet. Confirm before build._

---

## 1. Feature Summary

The case-study pages (`/work/[slug]`) are the depth layer of the portfolio: where a
recruiter or hiring manager goes from "nice site" to "I want to hire this person."
They must convey **design judgment** and prove a **research → design → code** range,
for a builder/designer hybrid who ships fast in the AI shift. ~5 studies, **one
flagship** with a complete Problem → Approach → Build → Result → Tradeoffs arc; the
other four vary in length and lean more on visuals.

## 2. Primary User Action

The reader should **follow a narrated line of design decisions** and come away
believing: _"This person makes rigorous product calls, owns the tradeoffs, and can
research, design, AND build — fast."_ Everything serves that one belief.

## 3. Design Direction

Bookends the site's cinematic language but inverts the register: the home is
**motion and spectacle**; the case study is **editorial and calm** — the room where
the thinking happens. Dark/cream art direction available but content-forward; long-form
readable measure; GSAP masked reveals used sparingly (to pace, not to dazzle).
Per-project **accent color** (`accentColor`, already in schema) is the distinctiveness
engine — each study reads as its own object in a family, never a template.

**Chosen model (from discovery):**

- **Suggested spine, not enforced.** Freeform sections; each carries an _optional_
  **stage label** (Problem / Approach / Build / Result / Tradeoffs / — none —). The
  flagship fills the whole spine; thin projects fill 2–3 stages and lean on visuals.
  The reader always has a sense of "where am I in the arc" without content being
  templated.
- **Freeform decision moments (no dedicated Decision block).** Distinctiveness and
  compositional freedom prioritised. Rigor comes from **craft + convention**, not
  schema enforcement — see Interaction/Content below. _(Trade-off accepted: nothing
  forces the tradeoff to be named; relies on the author's discipline.)_
- **AI leverage narrated inline, freeform**, at the moment it mattered — rendered with
  an opt-in accent treatment so it feels intentional, not bolted on. Only appears in
  studies with a real AI angle.

## 4. Layout Strategy

- **Opening frame** — title, one-line summary, meta rail (role · context · year ·
  timeline · team · tags), cover. This is the "poster." Big, quiet, confident.
- **The spine body** — a vertical sequence of freeform sections. Each optionally
  headed by its **stage label** as a persistent wayfinding marker (e.g. a small fixed
  "02 · APPROACH" tag) so the arc is legible while scrolling. Generous reading measure
  (~65ch) for narrative; full-bleed / two-column / gallery blocks break the rhythm for
  visual beats.
- **Emphasis beats** — headings + `quote` block restyled so an author can _elect_ to
  make a decision or tradeoff land as a designed landmark (accent rule, larger type,
  reveal). Opt-in, so studies stay distinct.
- **Result** — metrics (existing `metricCallout`) as a punctuated outcome moment.
- **Close** — "Next project" hand-off, then the site's dark **footer finale** (NOT the
  old `ContactCTA` card, which is now removed — this is the fix for the orphaned import).

## 5. Key States

- **Flagship (full arc)** — all five stages present, decision/tradeoff emphasis beats,
  metrics, rich media. The reference implementation.
- **Thin study (2–3 stages)** — fewer sections, more visual; must feel intentional and
  complete, not broken. No empty stage markers.
- **Media-light study** — text-forward; reading layout must stand on its own without
  images carrying it.
- **No AI angle** — the AI accent treatment simply never appears; nothing looks missing.
- **Empty / not-yet-written** — Sanity is currently empty. Page must render gracefully
  with only title + summary (no cover, no body) and never crash. (Covers the
  build-before-content-exists window.)
- **Draft preview** — must work under Sanity draft mode / visual editing.

## 6. Interaction Model

- **Scroll is the narrator.** Sections reveal on entry (masked/`SplitReveal`,
  reduced-motion safe). Reveals pace reading; they never gate content.
- **Stage markers** update as you pass each section (the wayfinding "you are here").
- **Emphasis beats** (decisions/tradeoffs/AI) animate in with a touch more weight than
  body copy — the reader's eye is drawn to the judgment moments.
- **Media**: galleries/video behave per existing blocks; full-bleed media breaks the
  measure for breathing room.
- **Next project**: magnetic / accent hover, continuous into the footer.

## 7. Content Requirements

- **Convention doc for authoring** (so freeform still hits the goal): a short "how to
  write a case study here" note — lead each decision with the fork, name the option
  space, state the call, **always name the tradeoff**; attach a stage label per section;
  narrate AI leverage as "what took X now took Y, via ___" where real.
- **Microcopy**: stage labels (Problem/Approach/Build/Result/Tradeoffs); "Next project";
  meta rail labels; graceful empty-state ("Case study coming soon" or simply hide body).
- **Realistic ranges**: 2–8 sections per study; flagship longest; some studies image-heavy,
  some text-only; AI callout present in a subset only.

## 8. Schema Changes (additive — nothing torn down)

- **ADD**: optional `stage` string field (enumerated: problem/approach/build/result/
  tradeoffs) to a **section grouping** in `richContent`. Options: (a) a light
  `sectionHeading` block that carries the stage label + title, sitting inline in the
  canvas [recommended — simplest, preserves freeform], or (b) group body into an array
  of sections each with a stage. Recommend (a).
- **KEEP** every existing block (text, imageWithAlt, imageGallery, videoEmbed,
  metricCallout, quote, twoColumn, fullBleedMedia, captionedFigure, processStep).
- **RENDER-ONLY** (no schema): AI-leverage accent + decision emphasis are styling
  conventions on existing `quote`/heading blocks, not new types.
- Run `npm run typegen` after the schema touch.

## 9. Recommended References (for the build phase)

- Motion: `gsap-scrolltrigger`, `gsap-timeline` for section reveals + stage markers.
- Typography/readability for long-form measure (the site's `typeset` skill).
- The existing WorkGallery/Footer for the dark/cream art-direction vocabulary to echo.

## 10. Open Questions (resolve at build)

1. **Stage marker treatment** — fixed side-rail ("you are here") vs. inline section
   headers only? (Lean: subtle fixed rail on desktop, inline on mobile.)
2. **Dark or light case-study canvas?** Home alternates dark→white→dark. Case study
   could be light editorial (contrast to hero) or dark cinematic (consistency). Decide
   at build against the flagship.
3. **Flagship first** — build the full-arc reference implementation, then derive the
   thin-study behaviour from it. Confirm which real project is the flagship.
4. Content entry: does the user write the flagship content _before_ or _in parallel_
   with the build? (Affects whether we build against real or placeholder copy.)
