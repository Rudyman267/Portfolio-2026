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
  // rich paragraph: an optional bold, slightly-indented lead line, then a body
  // built from mixed-weight spans (entity names bold, rest regular).
  | { t: "richP"; lead?: string; spans: Span[] }
  | { t: "quote"; text: string; cite?: string } // pull quote (blue, large)
  | { t: "note"; text: string } // blue-outlined callout card
  // a SECOND full-viewport flash inside a chapter (grey, centered) that plays
  // then goes away as the next block appears — e.g. the "During an emergency" quote.
  | { t: "quoteFlash"; text: string }
  | { t: "media"; slot: MediaSlot; wide?: boolean; caption?: string }
  // "Here's the gap" — centered blue heading flanked by two blue bars.
  | { t: "gapHeading"; text: string }
  // the orange "gap conclusion" card (Figma SVG, copy baked in) — the CEO
  // scenario, shown as a full-width orange panel right after "Here's the gap".
  | { t: "gapConclusion"; src: string }
  // "Here's the gap" text that MORPHS full-viewport into the orange gap-
  // conclusion box — one continuous pinned scene (the text scales/fades, then
  // the box takes over the viewport).
  | { t: "gapMorph"; heading: string; src: string }
  // a 16:9 video placeholder frame (a real <video>/embed drops in here later).
  | { t: "video"; label: string }
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
};

/* ────────────────────────────────────────────────────────────────────────── */

export const LIR_DESIGN: LirDesign = {
  slug: "live-incident-response",
  backLabel: "Back to work",
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
    src: "/case-study/image-1.png",
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
          src: "/case-study/drone-diagram.png",
          alt: "A drone in flight, tracing a dashed path back to its launch point.",
          maxW: 560,
        },
        {
          t: "richP",
          lead: "“Drones are operational infrastructure now.”",
          spans: [
            { text: "Security companies", bold: true },
            { text: " use them to patrol perimeters around the clock. " },
            { text: "Railways", bold: true },
            { text: " use them to survey hundreds of kilometres of track daily. " },
            { text: "Solar farms", bold: true },
            { text: " use them to inspect thousands of panels in a single shift. " },
            { text: "Oil refineries", bold: true },
            {
              text: " use them to detect heat signatures and potential failures before they become incidents. ",
            },
            { text: "Agricultural operations", bold: true },
            {
              text: " use them to monitor crops across regions that no ground crew could cover in the same time.",
            },
          ],
        },
        // isolated dock illustration, centered + hanging below the body text
        {
          t: "figure",
          src: "/case-study/dock-diagram.png",
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
            src: "/case-study/scenario.png",
            label:
              "A warehouse fire — the command centre watching drone feeds while a firefighter on the ground gets the same live view on a tablet.",
          },
          caption:
            "A warehouse catches fire. The drone-in-a-box on the roof launches automatically and starts streaming thermal and visual feeds. The intelligence is already in the air — where the fire is hottest, whether anyone's inside, where to position the ladder truck.",
        },
        // SCENE 3 — "Here's the gap" bars, then the orange CEO gap-conclusion
        // box BELOW it, both as plain stacked blocks in normal flow (NOT a
        // pinned morph — that overlapped the image above). Simple, correct order.
        { t: "gapHeading", text: "Here’s the gap" },
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
        // SCENE break — the "before designing anything new" audit is its own beat.
        { t: "sceneBreak" },
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
      ],
    },

    /* ── 05 PROCESS ──────────────────────────────────────────────────────── */
    {
      kind: "prose",
      id: "process",
      n: "05",
      heading: "Process",
      blocks: [
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
          before: "/case-study/before-ui.png",
          after: "/case-study/image-1.png",
          caption: "fig. after and before first prompt and final shipped screen",
        },
        // Row 1 — text LEFT, design-system image RIGHT.
        {
          t: "splitRow",
          side: "right",
          img: "/case-study/design-system.png",
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
          img: "/case-study/ascii-layout.png",
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
            { imgs: ["/case-study/dd1-img-1.png", "/case-study/dd1-img-2.png"] },
            { imgs: ["/case-study/dd1-img-3.png"] },
          ],
        },
        {
          n: "02",
          heading: "Session-based with invites and open links.",
          row: ["/case-study/dd2-tempting.svg", "/case-study/dd2-gaveup.svg"],
          wide: ["/case-study/dd2-shortcut.svg", "/case-study/dd2-why.svg"],
          mediaRows: [{ imgs: ["/case-study/dd2-img-1.png"] }],
        },
        {
          n: "03",
          heading: "Mobile version is a different persona.",
          row: ["/case-study/dd3-tempting.svg", "/case-study/dd3-gaveup.svg"],
          // "Why I gave it up" (green) first, then "What it cost me" (salmon) below.
          wide: ["/case-study/dd3-why.svg", "/case-study/dd3-shortcut.svg"],
          mediaRows: [
            // the mobile section concludes with the 3 tall phone shots side by side
            {
              imgs: [
                "/case-study/dd3-img-1.png",
                "/case-study/dd3-img-2.png",
                "/case-study/dd3-img-3.png",
              ],
              cols: 3,
              caption: "Phone collaborators can share their live camera feed",
            },
            // then the operator vs. guest persona UIs
            {
              imgs: ["/case-study/dd3-img-4.png"],
              caption: "fig. UI for the operator and guests who will perform actions",
            },
            {
              imgs: ["/case-study/dd3-img-5.png"],
              caption: "fig. UI for Jean who just wants to see information",
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
            { id: "features-1", src: "/case-study/features-1.png", label: "Annotation mode — a collaborator circles a hazard on the live feed." },
            { id: "features-2", src: "/case-study/features-2.png", label: "The frozen annotated frame posted to chat as a shared reference card." },
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
            { id: "features-3", src: "/case-study/features-3.png", label: "Chat with per-reader translation — a message arrives in the reader's chosen language." },
          ],
        },
        // 3 — session creation (2-click): 2 images scroll, text NEXT TO images (right)
        {
          tagline: "Session creation with team and pre-defined collaborator invite option",
          title: "Session creation is a 2 click process for operators",
          textSide: "right",
          body: "Select the drones, name the incident — the room is created. Two clicks and the operator is live.",
          media: [
            { id: "features-5", src: "/case-study/features-5.png", label: "Step 1 — name your incident." },
            { id: "features-6", src: "/case-study/features-6.png", label: "Step 2 — pick the drones for the session." },
          ],
        },
        // 4 — mass invite: 2 images scroll, text NEXT TO images (right)
        {
          tagline: "",
          title: "Session creation also lets you mass invite",
          textSide: "right",
          body: "Pull in a pre-defined set of collaborators in one pass so the room is populated the moment it opens — no chasing people one invite at a time.",
          media: [
            { id: "features-7", src: "/case-study/features-7.png", label: "Mass-invite — pre-defined collaborators added in one step." },
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
        src: "/case-study/impact-1.png",
        label:
          "PostHog web analytics — visitors, page views, sessions, session duration and bounce rate across the app.",
      },
      dashboardCaption:
        "Ensuring a steady flow of users helped me pinpoint scaling issues and potential drop-offs by watching their in-app walkthroughs recorded via PostHog.",
      growth: {
        id: "impact-2",
        src: "/case-study/impact-2.png",
        label:
          "Growth chart — steady increase in usage as releases and updates shipped.",
      },
      growthCaption:
        "Showing steady growth of the product as releases and updates kept happening.",
      closer:
        "As a solo designer I shipped an entire web app that security teams across the globe use and find value in.",
      closerMedia: {
        id: "impact-3",
        src: "/case-study/impact-3.png",
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
