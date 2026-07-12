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

/* A design-decision cluster: heading + the green ("gave up / why") card and
   the orange ("tempting option / what I gave up") card, plus optional figure. */
export type DecisionCluster = {
  n: string;
  heading: string;
  /** Orange card — the seductive shortcut. */
  tempting: { label: string; body: string };
  /** Green card — the reasoning / what was traded. */
  chose: { label: string; body: string };
  /** Optional supporting figure(s). */
  media?: MediaSlot[];
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
  // centered paragraph block (e.g. the CEO scenario under "Here's the gap").
  | { t: "centerP"; text: string }
  // isolated/hanging illustration — no container box, transparent, centered.
  | { t: "figure"; src: string; alt: string; maxW?: number }
  | { t: "diagram"; which: "personaSplit" | "onboardingFlow" | "stakeholderActions" | "loopReframe"; caption?: string }
  | { t: "matters"; items: MattersItem[] }
  | { t: "gapCards"; scene: string; roles: string } // the two amber "here's the gap" cards
  | { t: "auditNotes"; notes: OutlineNote[] }
  | { t: "designMd"; body: string; images: MediaSlot[] }; // the design.md subsection

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
        title: string;
        constraintLabel?: string;
        constraint?: string;
        body: string;
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
        // full-viewport quote flash (all grey) — plays after the PROBLEM flash,
        // then goes away as the scenario image appears.
        {
          t: "quoteFlash",
          text: "“During an emergency, intelligence exists, it just can't reach the person who needs it.”",
        },
        // the scenario photo, shown as-is, with its caption centered beneath.
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
        // "Here's the gap" — blue heading flanked by two bars.
        { t: "gapHeading", text: "Here’s the gap" },
        // the CEO scenario, centered.
        {
          t: "centerP",
          text: "The CEO of the company whose building is on fire and the fire captain standing in the parking lot doesn't have a FlytBase account. Doesn't know what FlytBase is. Has a phone in one hand, a radio in the other, and needs answers now.",
        },
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
        {
          t: "diagram",
          which: "personaSplit",
          caption:
            "One session, three fundamentally different experiences — Operator, Guest, and Guest Viewer, each at a different level of control.",
        },
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
          t: "diagram",
          which: "onboardingFlow",
          caption: "fig. User flow — onboarding",
        },
        {
          t: "diagram",
          which: "stakeholderActions",
          caption: "fig. User flows during incident response",
        },
        {
          t: "designMd",
          body: "The FlytBase F design system lives in Figma — colors, typography, spacing, icons, component patterns. The AI tools I was building with don't open Figma files. They write Tailwind classes and React components. The design system needed to cross that gap without losing fidelity.",
          images: [
            {
              id: "05-designmd",
              label:
                "Design.md — the FlytBase design system translated into a machine-readable spec for the AI build tools (tokens, type scale, spacing, component rules).",
            },
            {
              id: "05-ascii-planning",
              label:
                "ASCII layout planning with Claude — blocking out structure in a language both a human and an LLM can read before generating any component.",
            },
          ],
        },
        {
          t: "p",
          text: "The first time I pointed Claude Code at a Live Incident Response screen and said \"build this,\" it came back with its own interpretation of a drone operations interface. Random blues, default border-radius values, spacing that felt approximately right but matched nothing in the FlytBase design system. The telemetry overlay used a font stack the AI picked from its training data. The buttons had shadows that don't exist anywhere in FlytBase's component library.",
        },
        {
          t: "note",
          text: "Every AI-generated component on Live Incident Response follows the F design system. The colors match. The typography matches. The icons are the same library. Put LIR next to the core FlytBase dashboard and they look like they came from the same team — because they follow the same rules. The design system survived the build because it was written in the AI's language before the first component was generated.",
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
          heading: "Every map action is on the surface. Nothing hides behind a right-click.",
          tempting: {
            label: "The tempting option:",
            body: "A right-click context menu. It's the standard map-tool pattern — clean canvas, actions tucked into a menu that appears where you click. Less visual clutter, more map visible, familiar to anyone who's used Google Maps or a design tool.",
          },
          chose: {
            label: "Why I gave it up?:",
            body: "A right-click menu assumes two things a panicked first-timer doesn't have — the knowledge that the menu exists, and the calm to remember it's a right-click and not a tap-hold or a double-tap. Hidden interactions are a memory tax. In an emergency, anything that isn't visible effectively doesn't exist. So the actions — Danger, Go Here, On My Way, Look Here, Custom — live on a permanent rail, pre-labeled, one tap to arm, then drop on the map. The trade was screen space for zero discovery cost. The guest never has to find the action; it's already looking at them.",
          },
          media: [
            {
              id: "06-map-actions",
              label:
                "The permanent annotation rail on the map — pre-labeled action buttons (Danger, Go Here, On My Way, Look Here, Custom).",
            },
          ],
        },
        {
          n: "02",
          heading: "Session-based with invites and open links.",
          tempting: {
            label: "The tempting option:",
            body: "Persistent, account-based access — the model the rest of the platform already used. Consistent with the existing auth, no new concepts, guests get a lasting login they can reuse.",
          },
          chose: {
            label: "Why I gave it up?:",
            body: "Because a firefighter who got looped in during the fire does not have the time to set up auth for getting the critical information that drones can provide. Email invites don't need permission to join — as soon as an email invite goes out, a single click gets the user in with their configured role. Only random link invites need permission, so that some level of moderation is maintained.",
          },
        },
        {
          n: "03",
          heading: "Mobile version is a different persona.",
          tempting: {
            label: "The tempting option:",
            body: "Responsive. Shrink the desktop, add breakpoints, ship one codebase. It's faster, it's less to maintain, and it worked — v1 responsive passed every device test.",
          },
          chose: {
            label: "Why I gave it up?:",
            body: "A shrunk command center is still a command center. It asks you to scan, compare, and choose between things — the exact cognitive load a person in crisis can't carry. The trade wasn't \"responsive vs. native,\" it was \"cheap to build vs. usable under panic.\" I paid the expensive side because the user who matters most is the one least able to absorb a bad layout.",
          },
          media: [
            {
              id: "06-mobile-modes",
              label:
                "Mobile is a different product, not a smaller one — a state-machine of full-screen modes: Feed, Map, Annotation, Chat, Landscape.",
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
        {
          title: "Live video feed collaboration",
          body: "A collaborator draws directly on a moving video feed — circles the crane, marks the hazard. The instant they finish, the system captures that exact frame with the drawing burned in and posts it to the chat as a card: the annotated still, which feed it came from, and two actions — Focus Feed, Track on Map. The feed is live, so the thing you're pointing at is gone a second later. Freezing the frame at the moment of annotation turns a fleeting gesture into a shared, permanent reference.",
          media: [
            {
              id: "07-annotate-feed",
              label:
                "Annotation mode — a collaborator circles a hazard on the live feed; the frame freezes and posts to chat as a reference card.",
            },
          ],
        },
        {
          title: "Translation on read, not on send — everyone talks in their own language.",
          constraintLabel: "Constraint",
          constraint:
            "No budget for a paid translation API or per-message LLM inference — either would meter every message in a session, and incidents are chatty.",
          body: "Select French, and every message in the session arrives in French — no matter what language it was typed in. The sender writes in theirs, you read in yours, and neither of you does anything. I wrote a Supabase Edge Function that translates server-side through a free endpoint, and built the production logic a raw API call doesn't give you: names are tokenized out so \"Rudy\" survives intact, ops abbreviations (ETA, GPS, SITREP) are preserved instead of mangled, @mentions are excluded, and every result is cached per message:language so scrolling never re-translates. The edge function is the seam that let a zero-cost translation path behave like a paid one.",
          media: [
            {
              id: "07-translation",
              label:
                "Chat with per-reader translation — a message typed in Spanish arrives in the reader's chosen language.",
            },
          ],
        },
        {
          title: "Session creation with team and pre-defined collaborator invite option.",
          body: "Session creation is a 2-click process for operators — and it also lets you mass-invite team members. Select the drones, name the incident, and pull in a pre-defined set of collaborators in one pass so the room is populated the moment it opens.",
          media: [
            {
              id: "07-session-create",
              label:
                "Session creation — the operator's 2-click flow: pick drones, name the incident, mass-invite the team.",
            },
            {
              id: "07-mass-invite",
              label: "Mass-invite — pre-defined collaborators added in one step.",
            },
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
        id: "08-posthog-overview",
        label:
          "PostHog web analytics — visitors, page views, sessions, session duration and bounce rate across the app.",
      },
      dashboardCaption:
        "Ensuring a steady flow of users helped me pinpoint scaling issues and potential drop-offs by watching their in-app walkthroughs recorded via PostHog.",
      growth: {
        id: "08-growth",
        label:
          "Growth chart — steady increase in usage as releases and updates shipped.",
      },
      growthCaption:
        "Showing steady growth of the product as releases and updates kept happening.",
      closer:
        "As a solo designer I shipped an entire web app that security teams across the globe use and find value in.",
      closerMedia: {
        id: "08-closer",
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
