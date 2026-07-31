/**
 * Live Incidence Response — Figma-faithful case study data.
 *
 * This is the LIGHT editorial design recreated from Figma node 172:56
 * (Portfolio Website 2026 — AI Builder). White canvas, near-black text,
 * electric-blue (#1291e0) accent, TANKER display headings. It supersedes the
 * earlier dark-cinematic build — the route now renders <LirCaseStudy>.
 *
 * Copy is transcribed verbatim from the Figma frame. Raster assets (product
 * screenshots, phone mockups, dashboards) live in Figma and can't be exported
 * here, so those render as labelled `media` slots; the vector diagrams
 * (persona split, onboarding flow, stakeholder actions) are rebuilt as inline
 * SVG/HTML in the component layer and referenced here by `diagram` kind.
 *
 * Sanity-shaped enough to migrate later, but purpose-built for this layout.
 */

/* ── Primitives ──────────────────────────────────────────────────────────── */

export type MediaSlot = {
  /** Stable id — name the eventual asset export this. */
  id: string;
  /** What the image shows — placeholder body + eventual caption. */
  label: string;
  /** Real asset path under /public once available; renders instead of the
   *  labelled placeholder. */
  src?: string;
  /** Caption rendered beneath the figure. */
  caption?: string;
  ratio?: string;
};

export type StatCard = {
  value: string;
  /** bold line under the number */
  label: string;
  /** small line under the label */
  sub: string;
};

/* Blue-outlined audit / callout card (the "what already existed" trio). */
export type OutlineNote = { text: string };

/* The "X matters" list — blue icon + blue heading + body. */
export type MattersItem = {
  icon: "roles" | "context" | "time" | "language";
  title: string;
  body: string;
};

/* A design-decision cluster. The cards themselves are pre-rendered Figma SVG
   exports (copy baked in). `row` = the two small (368-wide) side-by-side cards
   (orange "tempting option" + its counter card); `wide` = the full-width
   reasoning card(s) below ("why I gave it up"). Optional supporting
   screenshots follow. */
/** A row of supporting images laid out together (bare, resized, no frame). */
export type MediaRow = {
  /** image srcs shown side by side in this row. */
  imgs: string[];
  /** columns across (defaults to imgs.length). Use to force e.g. 3-up phones. */
  cols?: number;
  /** larger frames + a tighter gutter (the 3-up phone shots — Figma ref). */
  tight?: boolean;
  /** no gutter between images — the row's OUTER edges then align with a
   *  full-width row above/below it (dd1's two maps over the marker panel). */
  flush?: boolean;
  /** optional caption beneath the row. */
  caption?: string;
};

export type DecisionCluster = {
  n: string;
  heading: string;
  /** Two small side-by-side card SVGs (tempting + counter). */
  row: [string, string];
  /** Full-width reasoning card SVG(s), stacked below the row. */
  wide: string[];
  /** Break the `wide` cards out toward the screen edge on phones so their
   *  baked-in text stays readable (used for dd3, whose cards are text-dense). */
  wideMobile?: boolean;
  /** A prose beat between the cards and the screenshots — the cluster's thesis
   *  stated plainly on the canvas (e.g. dd3's "Mobile is a different product"). */
  note?: { heading: string; body: string[] };
  /** Supporting screenshots grouped into explicit rows (exact layout control). */
  mediaRows?: MediaRow[];
};

/* ── Content blocks (the narrative stream within a section) ──────────────── */

/** An inline run of text — bold or regular — for mixed-weight paragraphs. */
export type Span = { text: string; bold?: boolean };

export type Block =
  | { t: "label"; text: string } // small blue eyebrow label (e.g. "Features shipped")
  | { t: "lede"; text: string } // large intro paragraph
  | { t: "p"; text: string } // body paragraph
  // big bold statement beat — the segmented thesis lines that get their own
  // viewport moment (Figma 258:2: Plus Jakarta Sans Bold, 36px). Larger + bolder
  // than `lede`, which stays 16px medium for LIR reading copy.
  /** Big display thesis beat. `full` gives it its OWN full-viewport stage
   *  (vertically centred, min-h-svh) so it lands as a standalone pause between
   *  scenes instead of sitting tight under whatever preceded it. */
  | { t: "statement"; text: string; full?: boolean }
  // lead paragraph: a bold WHITE lead sentence followed INLINE by a light-grey
  // remainder (the mixed-weight Impact copy — Figma 258:2). No indent.
  | { t: "leadP"; lead: string; text: string }
  // rich paragraph: an optional bold, slightly-indented lead line, then a body
  // built from mixed-weight spans (entity names bold, rest regular).
  | { t: "richP"; lead?: string; spans: Span[] }
  | { t: "quote"; text: string; cite?: string } // pull quote (blue, large)
  | { t: "note"; text: string } // blue-outlined callout card
  // a SECOND full-viewport flash inside a chapter (centered) that plays in then
  // scrubs away as the next block appears — e.g. LIR's "During an emergency"
  // quote. `tone` "bright" = white + bolder (Verkos's reframe thesis); default
  // grey. `wide` widens the measure so it breaks to ~2 lines instead of 3.
  | { t: "quoteFlash"; text: string; tone?: "grey" | "bright"; wide?: boolean }
  | { t: "media"; slot: MediaSlot; wide?: boolean; caption?: string; scale?: number }
  // the orange "gap conclusion" card (Figma SVG, copy baked in) — the CEO
  // scenario, shown as a full-width orange panel right after the warehouse
  // scenario. Pops in via GapReveal's spring-in.
  | { t: "gapConclusion"; src: string }
  // a 16:9 video. With `src` it renders the real player (audio matters here —
  // it ships with mute/volume controls); without, the labelled placeholder.
  | {
      t: "video";
      label: string;
      /** basename under /case-study/video (both .webm + .mp4 are served). */
      src?: string;
      poster?: string;
    }
  // full-viewport scene break — the following block group scrubs into an
  // otherwise-empty viewport (gives a beat its own scene inside a chapter).
  | { t: "sceneBreak" }
  // centered paragraph block (e.g. the CEO scenario under "Here's the gap").
  | { t: "centerP"; text: string }
  // isolated/hanging illustration — no container box, transparent, centered.
  | { t: "figure"; src: string; alt: string; maxW?: number }
  | { t: "diagram"; which: "personaSplit" | "onboardingFlow" | "stakeholderActions" | "loopReframe"; caption?: string }
  | { t: "matters"; items: MattersItem[] }
  | { t: "gapCards"; scene: string; roles: string } // the two amber "here's the gap" cards
  | { t: "auditNotes"; notes: OutlineNote[] }
  // the "code architecture" Q&A beats on a vertical accent rail: each beat is a
  // question about a moving piece → the constraint → the answer landed on.
  | {
      t: "archTimeline";
      intro?: string;
      outro?: string;
      beats: { question: string; problem: string; answer: string }[];
    }
  | { t: "designMd"; body: string; images: MediaSlot[] } // the design.md subsection
  // a bold white heading — a subsection title in the reading column.
  | { t: "heading"; text: string }
  // a smaller white subhead (e.g. "Confused?", "What This Achieved").
  | { t: "subhead"; text: string }
  // before/after comparison — a draggable left-to-right wipe slider between two
  // images, spawned as-is. Optional caption below.
  | { t: "beforeAfter"; before: string; after: string; caption?: string }
  // asymmetric editorial row: prose on one side, a bare image on the other.
  // `side` = which side the IMAGE sits on. `body` is a stream of mini-blocks
  // (heading / subhead / rich paragraph) so the text column matches the design.
  | {
      t: "splitRow";
      side: "left" | "right";
      img: string;
      imgAlt: string;
      body: (
        | { k: "heading"; text: string }
        | { k: "subhead"; text: string }
        | { k: "p"; text: string }
        | { k: "richP"; spans: Span[] }
      )[];
    }
  // NATIVE decision cluster (Verkos) — the tempting/problem/chose/why copy is
  // live text (not baked Figma SVGs like LIR's), rendered as styled cards with
  // semantic washes and animated in with anime.js. `n` + `heading` label the
  // decision; each `card` is one labelled beat.
  | {
      t: "decisionText";
      n: string;
      heading: string;
      cards: {
        kind: "tempting" | "problem" | "chose" | "why";
        label: string; // "The tempting option:", "Why?:", …
        // body = one or more paragraphs. A paragraph may carry a semibold LEAD
        // sentence (Jakarta SemiBold) before its regular remainder — the mixed
        // weight in the Figma "why" cards. `body: string` shorthand = one
        // all-regular paragraph.
        body: string | { lead?: string; text: string }[];
      }[];
      /** optional supporting UI screenshot below the cards (bare, no frame). */
      img?: string;
      imgAlt?: string;
      /** Fraction of the content measure the screenshot fills (0-1), centred.
       *  Tall portrait captures need pulling in; wide ones stay full width. */
      imgScale?: number;
    }
  // inline ANIMATED SVG diagram, drawn in via anime.js as it enters view. Built
  // as code components (crisp, accent-themeable) — not a raster export.
  | {
      t: "verkosDiagram";
      which: "pipeline" | "assembly" | "personaSplit";
      caption?: string;
    }
  // INTERACTIVE exhibit — a visual-only prototype of the product's core flow the
  // reader can actually drive (fullscreen-able). No network, no real data; the
  // fixtures live inside the component. Full-bleed out of the reading column.
  /** Interactive exhibit. `full` stages it on its own full viewport (centred,
   *  min-h-svh) so it reads as a self-contained artifact rather than an inline
   *  figure butted up against the next block. */
  | { t: "prototype"; which: "verkosReport"; full?: boolean }
  // A single UI component replayed as a looping micro-interaction, for cases
  // where the ARGUMENT is the interaction itself and a still frame cannot carry
  // it. `oroProductCard`: the catalogue → macro-detail hover swap that makes an
  // individual SKU identifiable on a 70,000-piece scroll wall.
  | { t: "microInteraction"; which: "oroProductCard"; caption?: string }
  // An animated, self-looping narrative DIAGRAM (not a UI micro-interaction):
  // `oroFrictionMap` is the "Why?" problem framing — four buyer segments, each
  // with its own friction, converging by drawn SVG connectors onto one ORO
  // outcome node. Owns its own GSAP timeline, visibility gating and
  // reduced-motion fallback.
  | { t: "animatedDiagram"; which: "oroFrictionMap"; caption?: string }
  // A navigable carousel of persona boards (ORO R1–R4). One board at a time with
  // prev/next + dots and a calm fade/slide between them, on no panel background.
  | {
      t: "personaCarousel";
      personas: { src: string; name: string; role: string; alt: string }[];
    }
  | {
      t: "figjamEmbed";
      url: string;
      caption?: string;
    }
  | {
      t: "imageRow";
      imgs: { src: string; alt: string }[];
      caption?: string;
      scale?: number;
    };

/* ── Section ─────────────────────────────────────────────────────────────── */

export type Section =
  | {
      kind: "prose";
      id: string;
      n: string;
      heading: string;
      blocks: Block[];
    }
  | {
      kind: "decisions";
      id: string;
      n: string;
      heading: string;
      intro?: string;
      clusters: DecisionCluster[];
    }
  | {
      kind: "features";
      id: string;
      n: string;
      heading: string;
      features: {
        /** cream #FFE2B1 tagline pill above the row (full width). */
        tagline: string;
        title: string;
        constraintLabel?: string;
        constraint?: string;
        /** body paragraphs — sit in the FIXED text column beside the images. */
        body: string;
        body2?: string;
        /** which side the fixed text column sits on (images take the other). */
        textSide?: "left" | "right";
        /** images: 2+ scroll horizontally past the fixed text; 1 = static. */
        media: MediaSlot[];
      }[];
    }
  | {
      kind: "impact";
      id: string;
      n: string;
      heading: string;
      lede: string;
      dashboard: MediaSlot;
      dashboardCaption: string;
      growthCaption: string;
      growth: MediaSlot;
      closer: string;
      closerMedia: MediaSlot;
    };

export type LirDesign = {
  slug: string;
  backLabel: string;
  eyebrow: string; // "corporate drone ops · emergency response · real-time collaboration"
  title: string; // "Live Incidence Response"
  headline: string; // "A situation room that assembles itself in 30s."
  lede: string;
  stats: StatCard[];
  cover: MediaSlot;
  meta: { label: string; value: string }[];
  contents: { n: string; label: string; id?: string }[];
  buildStatement: string; // "I didn't hand a spec to engineers…"
  sections: Section[];
  /** Per-study signal color. Defaults to LIR orange; "cyan" = Verkos (#08e6ff);
   *  "gold" = ORO Connect (#d9a441 — the metal the business actually sells).
   *  Applied as data-accent on the .lir root; overrides --color-accent, which
   *  cascades to the eyebrow, stats, chapter flash, decision washes and the
   *  contents rail — so a new study only needs the token, never per-component
   *  colour work. */
  accent?: "orange" | "cyan" | "gold";
  /** Optional demo video that closes the Overview. Omit for studies with no
   *  video (e.g. Verkos). `src` = basename under /case-study/video (.webm+.mp4). */
  demoVideo?: { src: string; poster: string; label: string };
  /** Embed the interactive product demo (the real app, static + auth-free)
   *  right after the build statement, before the first chapter. Desktop only. */
  appDemo?: boolean;
  /** The full-bleed cover plate the study opens on (the fixed plate the page
   *  scrolls up over). Split into a raster BACKGROUND and a vector OVERLAY on
   *  purpose: the background can be cropped/re-focused per breakpoint while the
   *  title stays a crisp SVG that scales independently, so the type is never
   *  shrunk to illegibility along with the photo on a phone. `title` is the
   *  per-study lockup; `role` is the shared company/role strip. */
  intro?: {
    /** raster background (webp), full-bleed + object-cover */
    bg: string;
    /** Per-study title lockup SVG (logo + name + timeline/tools/team).
     *  Optional: omit it and the cover sets `title` in the display face
     *  instead, so a study is never blocked on a vector export. */
    title?: string;
    /** Per-study company/role strip SVG. Optional for the same reason — with
     *  no asset the cover renders "<Company> — <Role>" from `meta` as text.
     *  ⚠️ This used to be a hardcoded FlytBase file shared by every study,
     *  which credited the wrong company as soon as a non-FlytBase study
     *  existed. */
    role?: string;
    /** optional focal point for the background crop, e.g. "50% 40%" */
    bgPosition?: string;
  };
};

/* ────────────────────────────────────────────────────────────────────────── */

export const LIR_DESIGN: LirDesign = {
  slug: "live-incident-response",
  backLabel: "Back to work",
  // opening cover plate — raster background + vector title lockup (see the
  // `intro` docs on LirDesign for why they're separate files)
  intro: {
    bg: "/case-study/cover/lir-cover.webp",
    title: "/case-study/cover/lir-title.svg",
    role: "/case-study/cover/company-role.svg",
  },
  eyebrow: "corporate drone ops · emergency response · real-time collaboration",
  title: "Live Incidence Response",
  headline: "A situation room that assembles itself in 30s.",
  lede: "When every second matters, information can't stay with the drone operator. It has to reach the people making decisions inside offices and on the ground. I designed Live Incident Response to bridge that gap—then built and shipped it, end to end, with AI.",

  stats: [
    {
      value: "125",
      label: "Sessions completed",
      sub: "During my tenure at the company",
    },
    {
      value: "5",
      label: "Countries reached",
      sub: "Across security teams in NA and EU",
    },
    {
      value: "2",
      label: "Major Versions released",
      sub: "Over a span of 4 weeks",
    },
    {
      value: "<30s",
      label: "to situational awareness",
      sub: "Design target for an untrained guest",
    },
  ],

  cover: {
    id: "00-cover",
    src: "/case-study/image-1.webp",
    label:
      "The Live Incident Response session view — operator console: participant rail, multi-drone live feed grid, and a shared map with drone markers.",
  },

  meta: [
    { label: "Company", value: "FlytBase" },
    { label: "Role", value: "AI Product Design Builder" },
    { label: "Duration", value: "March–April 2026" },
    { label: "Status", value: "Live in production" },
    { label: "Team", value: "Solo Builder" },
  ],

  contents: [
    { n: "", label: "Overview", id: "overview" },
    { n: "01", label: "context", id: "context" },
    { n: "02", label: "problem", id: "problem" },
    { n: "03", label: "reframe", id: "reframe" },
    { n: "04", label: "the shift", id: "process" },
    { n: "05", label: "process", id: "process" },
    { n: "06", label: "solution", id: "decisions" },
    { n: "07", label: "trade-offs", id: "decisions" },
    { n: "08", label: "Impact", id: "impact" },
    { n: "09", label: "reflection", id: "impact" },
  ],

  buildStatement:
    "I didn't hand a spec to engineers. I planned the constraints, designed the flows, wrote the React, and shipped it. The gap between intent and product was zero because there was no handoff.",

  // LIR ships a real demo video that closes the Overview (Verkos has none).
  demoVideo: {
    src: "/case-study/video/lir-demo",
    poster: "/case-study/video/lir-demo-poster.jpg",
    label:
      "Demo video — a walkthrough of Live Incident Response in a real session.",
  },

  sections: [
    /* ── 01 CONTEXT ──────────────────────────────────────────────────────── */
    {
      kind: "prose",
      id: "context",
      n: "01",
      heading: "Context",
      blocks: [
        // isolated drone illustration, centered + hanging above the body text
        {
          t: "figure",
          src: "/case-study/drone-diagram.webp",
          alt: "A drone in flight, tracing a dashed path back to its launch point.",
          maxW: 560,
        },
        {
          t: "richP",
          lead: "“Drones are operational infrastructure now.”",
          spans: [
            { text: "FlytBase", bold: true },
            {
              text: " is an enterprise platform that enables organizations to deploy, manage, and automate fleets of autonomous drones at scale. From remote inspections to emergency response, it acts as the software layer that connects drones, docks, operators, and the people making decisions on the ground.",
            },
          ],
        },
        // isolated dock illustration, centered + hanging below the body text
        {
          t: "figure",
          src: "/case-study/dock-diagram.webp",
          alt: "The autonomous drone-in-a-box dock, with a dashed flight path returning to it.",
          maxW: 620,
        },
      ],
    },

    /* ── 02 PROBLEM ──────────────────────────────────────────────────────── */
    {
      kind: "prose",
      id: "problem",
      n: "02",
      heading: "Problem",
      blocks: [
        // SCENE 1 — full-viewport quote flash (all grey), its own pinned beat.
        {
          t: "quoteFlash",
          text: "“During an emergency, intelligence exists, it just can't reach the person who needs it.”",
        },
        // spacer so the quote flash's pin fully releases before the next scene
        { t: "sceneBreak" },
        // SCENE 2 — the scenario photo, shown as-is, with its caption beneath.
        {
          t: "media",
          wide: true,
          slot: {
            id: "02-warehouse-fire",
            src: "/case-study/scenario.webp",
            label:
              "A warehouse fire — the command centre watching drone feeds while a firefighter on the ground gets the same live view on a tablet.",
          },
          caption:
            "A warehouse catches fire. The drone-in-a-box on the roof launches automatically and starts streaming thermal and visual feeds. The intelligence is already in the air — where the fire is hottest, whether anyone's inside, where to position the ladder truck.",
        },
        // SCENE 3 — the orange CEO gap-conclusion box pops in right after the
        // warehouse scenario. (The "Here's the gap" heading + its morph into
        // this box were removed — the morph never read cleanly; the box lands
        // on its own via GapReveal's spring-in.)
        { t: "gapConclusion", src: "/case-study/gap-conclusion.svg" },
      ],
    },

    /* ── 03 REFRAME ──────────────────────────────────────────────────────── */
    {
      kind: "prose",
      id: "reframe",
      n: "03",
      heading: "Reframe",
      blocks: [
        // moved from Problem — the layered reframe of the one-line brief.
        {
          t: "p",
          text: "If it sounds like just a video-sharing feature, it isn't.",
        },
        {
          t: "p",
          text: "The brief was one line: let operators share live drone feeds with external guests during an incident.",
        },
        {
          t: "p",
          text: 'Read it again. It sounds like a video call. The complexity revealed itself in layers — and each layer moved this from "a feature" to "a coordinated situation room."',
        },
        // SCENE break — the "…matters" list comes up on its own beat.
        { t: "sceneBreak" },
        {
          t: "matters",
          items: [
            {
              icon: "roles",
              title: "Roles matter",
              body: "An operator needs full control. A guest needs to see and contribute. A viewer needs to observe only. These aren't permission tiers — they're fundamentally different experiences that deserve different screens.",
            },
            {
              icon: "context",
              title: "Context matters",
              body: "A person at a desk with dual monitors and gigabit ethernet has nothing in common with a person next to a fire, holding a phone with two bars of cellular.",
            },
            {
              icon: "time",
              title: "Time matters",
              body: "This isn't a scheduled meeting. Someone's building is on fire. No account creation, no onboarding, no training. Situational awareness now.",
            },
            {
              icon: "language",
              title: "Language matters",
              body: "Multi-agency teams — police, fire, military, civilian — may not share a common language. Especially since our security clients were pan-Europe. (This was requested by them.)",
            },
          ],
        },
        {
          t: "lede",
          text: "The vision for the final product had to be a single room per incident — sharing the same map, same feed and same annotations, synced across users.",
        },
      ],
    },

    /* ── 05 PROCESS ──────────────────────────────────────────────────────── */
    {
      kind: "prose",
      id: "process",
      n: "05",
      heading: "Process",
      blocks: [
        // The "before designing anything new" audit opens Process — it's the
        // hand-off from reframing the problem into building against the data.
        {
          t: "p",
          text: "Before designing anything new, I audited what already existed. This is basic UX hygiene, but it's also where the builder dimension starts adding value: I wasn't just auditing the interface, I was auditing the data.",
        },
        {
          t: "auditNotes",
          notes: [
            {
              text: "The FlytBase dashboard already had drone fleet management, mission planning, and live video streaming. But these were designed for authenticated platform users, not ad-hoc external stakeholders.",
            },
            {
              text: "The sharing model was account-based (you need a FlytBase account to see anything), the interface assumed domain expertise, and there was no concept of a temporary, role-restricted session.",
            },
            {
              text: "The opportunity was clear: take the raw capabilities (video streaming, telemetry, fleet data) and wrap them in an experience designed for people who don't know what any of those things are.",
            },
          ],
        },
        { t: "sceneBreak" },
        {
          t: "archTimeline",
          intro: "Then I had to start building the code architecture.",
          beats: [
            {
              question: "How would the drone feed work? Where does it come from?",
              problem:
                "The current Agora Stream (3rd party streaming service) API of flytbase only allows RTSP stream links to come for 1 drone, the API would not give one sharing link for multiple drone streams and even on ground cameras.",
              answer:
                "After discussing options with Claude the conclusion was to use a Supabase edge function that bundles each individual drone video feed's links into one container link that could be shared to my product's endpoint and we have multi-drone feed share figured out.",
            },
            {
              question: "How would a live chat box work? With 7 to 11 language support?",
              problem:
                "Company denied purchasing a translation model API for this as the whole point of building this is to test if the market would pay for this product. So I had to figure out a free alternative that would work.",
              answer:
                "After exploring a few approaches with Claude, we landed on a Supabase Edge Function that handles translation server-side. Messages are stored once in the language they're written in and translated at read time, meaning every participant sees the conversation in their own language without creating duplicate copies.",
            },
          ],
          outro:
            "And similarly every other moving piece in this product needed a plan.",
        },
        { t: "sceneBreak" },
        {
          t: "p",
          text: "Once the API specs, tech architecture and data points were fixed, I started crafting the user flow of the webapp.",
        },
        {
          t: "figure",
          src: "/case-study/user-flow.svg",
          alt: "Onboarding user flow — operator creates a session, invite paths (email → direct join, or link → waiting room → approve), into the session view.",
          maxW: 760,
        },
        {
          t: "figure",
          src: "/case-study/stakeholder-actions.svg",
          alt: "User flows during incident response — drone pilot, VP/facility owner, and firefighter acting on one shared live session.",
          maxW: 620,
        },
        // ── "How I Got AI to Follow Our Design System" subsection (Figma
        //    229:3 composition). Intro copy → before/after slider → two
        //    asymmetric editorial rows. ──────────────────────────────────────
        { t: "sceneBreak" },
        { t: "heading", text: "How I Got AI to Follow Our Design System" },
        {
          t: "p",
          text: "When you use AI build tools to write code, the AI is eager to please. Too eager. Ask it to build a dashboard and it will produce something that looks fine generic Tailwind defaults, reasonable spacing, acceptable typography. It looks like software. It doesn't look like your software.",
        },
        {
          t: "p",
          text: "The first time I pointed Claude Code at a Live Incident Response screen and said \"build this,\" it came back with its own interpretation of a drone operations interface. Random blues, default border-radius values, spacing that felt approximately right but matched nothing in the FlytBase design system. The telemetry overlay used a font stack the AI picked from its training data. The buttons had shadows that don't exist anywhere in FlytBase's component library.",
        },
        // before/after slider (spawned as-is, not embedded in a frame)
        {
          t: "beforeAfter",
          before: "/case-study/before-ui.webp",
          after: "/case-study/image-1.webp",
          caption: "fig. after and before first prompt and final shipped screen",
        },
        // Row 1 — text LEFT, design-system image RIGHT.
        {
          t: "splitRow",
          side: "right",
          img: "/case-study/design-system.webp",
          imgAlt:
            "Design.md — the FlytBase F design system in Figma, translated into a machine-readable spec for the AI build tools.",
          body: [
            { k: "heading", text: "Design.md from the figma MCP" },
            {
              k: "richP",
              spans: [
                { text: "The FlytBase F design system", bold: true },
                {
                  text: " lives in Figma colors, typography, spacing, icons, component patterns.",
                },
              ],
            },
            {
              k: "p",
              text: "The AI tools I was building with don't open Figma files. They write Tailwind classes and React components. The design system needed to cross that gap without losing fidelity.",
            },
          ],
        },
        // Row 2 — ASCII image LEFT, text RIGHT.
        {
          t: "splitRow",
          side: "left",
          img: "/case-study/ascii-layout.webp",
          imgAlt:
            "ASCII layout planning with Claude — blocking out screen structure in a language both a human and an LLM can read before generating any component.",
          body: [
            { k: "heading", text: "ASCII layout planning with claude" },
            { k: "subhead", text: "Confused?" },
            {
              k: "p",
              text: "I was too, but while planning with an AI tool its important to understand structure in a language both you and the LLM understands.",
            },
            { k: "subhead", text: "What This Achieved" },
            {
              k: "p",
              text: "Every AI-generated component on Live Incident Response follows the F design system. The colors match. The typography matches. The icons are the same library. Put LIR next to the core FlytBase dashboard and they look like they came from the same team because they follow the same rules. The design system survived the build because it was written in the AI's language before the first component was generated.",
            },
          ],
        },
      ],
    },

    /* ── 06/07 DESIGN DECISIONS ──────────────────────────────────────────── */
    {
      kind: "decisions",
      id: "decisions",
      n: "06",
      heading: "Design Decisions",
      intro:
        "Each of these looked like a shortcut on paper. Each one traded the cheap, familiar option for the one a panicked first-timer could actually use.",
      clusters: [
        {
          n: "01",
          heading:
            "Every map action is on the surface. Nothing hides behind a right-click.",
          row: ["/case-study/dd1-tempting.svg", "/case-study/dd1-gaveup.svg"],
          wide: ["/case-study/dd1-why.svg"],
          mediaRows: [
            // the two maps sit flush so their outer edges line up with the
            // full-width marker panel below.
            {
              imgs: ["/case-study/dd1-img-1.webp", "/case-study/dd1-img-2.webp"],
              flush: true,
            },
            { imgs: ["/case-study/dd1-img-3.webp"] },
          ],
        },
        {
          n: "02",
          heading: "Session-based with invites and open links.",
          row: ["/case-study/dd2-tempting.svg", "/case-study/dd2-gaveup.svg"],
          wide: ["/case-study/dd2-shortcut.svg", "/case-study/dd2-why.svg"],
          mediaRows: [{ imgs: ["/case-study/dd2-img-1.webp"] }],
        },
        {
          n: "03",
          heading: "Mobile version is a different persona.",
          row: ["/case-study/dd3-tempting.svg", "/case-study/dd3-gaveup.svg"],
          // "Why I gave it up" (green) first, then "What it cost me" (salmon) below.
          wide: ["/case-study/dd3-why.svg", "/case-study/dd3-shortcut.svg"],
          // these two cards are text-dense — widen them on phones for readability.
          wideMobile: true,
          // the mobile thesis — sits between "What it cost me" and the phone shots.
          note: {
            heading: "Mobile is a different product, not a smaller one.",
            body: [
              "Mobile is going to be used by people on ground during the emergency.",
              "They don’t need everything simultaneously. They need one thing at a time, done well. This led to a state-machine architecture: Feed Mode, Map Mode, Annotation Mode, Chat Mode, Landscape Mode. Each mode owns the full screen and is optimized for its specific task.",
            ],
          },
          mediaRows: [
            // the mobile section concludes with the 3 tall phone shots side by
            // side — larger and tighter than a default row (Figma ref).
            {
              imgs: [
                "/case-study/dd3-img-1.webp",
                "/case-study/dd3-img-2.webp",
                "/case-study/dd3-img-3.webp",
              ],
              cols: 3,
              tight: true,
              caption: "Phone collaborators can share their live camera feed",
            },
          ],
        },
      ],
    },

    /* ── FEATURES ────────────────────────────────────────────────────────── */
    {
      kind: "features",
      id: "features",
      n: "08",
      heading: "Features",
      features: [
        // 1 — annotation: cream pill, 2 images scroll left, text fixed right (Figma 240:42)
        {
          tagline: "Annotate on the live feed → freeze the frame → drop it in chat.",
          title: "Live video feed collaboration",
          textSide: "right",
          body: "A collaborator draws directly on a moving video feed — circles the crane, marks the hazard. The instant they finish, the system captures that exact frame with the drawing burned in and posts it to the chat as a card: the annotated still, which feed it came from, and two actions — Focus Feed, Track on Map.",
          body2:
            "The feed is live, so the thing you're pointing at is gone a second later. A raw annotation on moving video points at nothing. Freezing the frame at the moment of annotation turns a fleeting gesture into a shared, permanent reference — everyone sees the same still, tied to the same feed, and can jump to it. The annotation stops being “look, over there, now” and becomes a record anyone can act on ten seconds or ten minutes later.",
          media: [
            { id: "features-1", src: "/case-study/features-1.webp", label: "Annotation mode — a collaborator circles a hazard on the live feed." },
            { id: "features-2", src: "/case-study/features-2.webp", label: "The frozen annotated frame posted to chat as a shared reference card." },
          ],
        },
        // 2 — translation: 1 image, so no scroll; text fixed right
        {
          tagline: "Translation on read, not on send — everyone talks in their own language.",
          title: "Constraint",
          textSide: "right",
          body: "No budget for a paid translation API or per-message LLM inference — either would meter every message in a session, and incidents are chatty. So I wrote a Supabase Edge Function that translates server-side through a free endpoint, and built the production logic a raw API call doesn't give you.",
          body2:
            "Names are tokenized out so \"Rudy\" survives intact, ops abbreviations (ETA, GPS, SITREP) are preserved instead of mangled, @mentions are excluded, and every result is cached per message:language so scrolling never re-translates. Select French, and every message in the session arrives in French — no matter what language it was typed in. The sender writes in theirs, you read in yours, and neither of you does anything.",
          media: [
            { id: "features-3", src: "/case-study/features-3.webp", label: "Chat with per-reader translation — a message arrives in the reader's chosen language." },
          ],
        },
        // 3 — session creation (2-click): 2 images scroll, text NEXT TO images (right)
        {
          tagline: "Session creation with team and pre-defined collaborator invite option",
          title: "Session creation is a 2 click process for operators",
          textSide: "right",
          body: "Select the drones, name the incident — the room is created. Two clicks and the operator is live.",
          media: [
            { id: "features-5", src: "/case-study/features-5.webp", label: "Step 1 — name your incident." },
            { id: "features-6", src: "/case-study/features-6.webp", label: "Step 2 — pick the drones for the session." },
          ],
        },
        // 4 — mass invite: 2 images scroll, text NEXT TO images (right)
        {
          tagline: "",
          title: "Session creation also lets you mass invite",
          textSide: "right",
          body: "Pull in a pre-defined set of collaborators in one pass so the room is populated the moment it opens — no chasing people one invite at a time.",
          media: [
            { id: "features-7", src: "/case-study/features-7.webp", label: "Mass-invite — pre-defined collaborators added in one step." },
          ],
        },
      ],
    },

    /* ── IMPACT ──────────────────────────────────────────────────────────── */
    {
      kind: "impact",
      id: "impact",
      n: "09",
      heading: "IMPACT",
      lede: "I used PostHog to track usage and user data across my webapp.",
      dashboard: {
        id: "impact-1",
        src: "/case-study/impact-1.webp",
        label:
          "PostHog web analytics — visitors, page views, sessions, session duration and bounce rate across the app.",
      },
      dashboardCaption:
        "Ensuring a steady flow of users helped me pinpoint scaling issues and potential drop-offs by watching their in-app walkthroughs recorded via PostHog.",
      growth: {
        id: "impact-2",
        src: "/case-study/impact-2.webp",
        label:
          "Growth chart — steady increase in usage as releases and updates shipped.",
      },
      growthCaption:
        "Showing steady growth of the product as releases and updates kept happening.",
      closer:
        "As a solo designer I shipped an entire web app that security teams across the globe use and find value in.",
      closerMedia: {
        id: "impact-3",
        src: "/case-study/impact-3.webp",
        label: "The live product in the field — the situation room in real use.",
      },
    },
  ],
};

/* ─────────────────────────────────────────────────────────────────────────
   ASSET PUNCH-LIST — drop the Figma export named by `id` into
   case-study-assets/flytbase-project-1/ then swap the <Figure> placeholder
   for a real <img>/SanityImage. Vector diagrams (personaSplit, onboardingFlow,
   stakeholderActions) are rebuilt inline and need no export.

     00-cover              session view (operator console hero)
     01-drone-dock         drone-in-a-box illustration
     02-warehouse-fire     warehouse fire from above
     05-designmd           design.md machine-readable spec
     05-ascii-planning     ASCII layout planning with Claude
     06-map-actions        permanent annotation rail on the map
     06-mobile-modes       mobile full-screen mode set
     07-annotate-feed      annotate → freeze → drop-in-chat
     07-translation        per-reader chat translation
     07-session-create     2-click session creation
     07-mass-invite        mass-invite collaborators
     08-posthog-overview   PostHog analytics overview
     08-growth             growth chart
     08-closer             product in the field
   ───────────────────────────────────────────────────────────────────────── */
