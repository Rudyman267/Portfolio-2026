/**
 * Live Incident Response — the flagship case study.
 *
 * Hand-authored, structured content for the bespoke dark-editorial case-study
 * page. This is deliberately NOT in Sanity yet: the copy is a designed artifact
 * (snapshot bar, headline metrics, decision cards, feature-decision pairs,
 * pull-quotes, comparison tables) and Sanity is empty. Mirrors the
 * `placeholderProjects.ts` pattern — Sanity-shaped enough to migrate later.
 *
 * Source of truth for the prose:
 *   case-study-assets/flytbase-project-1/LIR_case_study_copy.md
 *
 * IMAGE / DIAGRAM / GRAPH SLOTS use `MediaSlot` with a `kind` + `id` so the page
 * renders a labeled placeholder now and the real Figma export drops in later.
 * Every slot's id is listed in the asset punch-list at the bottom of this file.
 *
 * `[FILL: …]` metrics from the copy are surfaced as `pending: true` so the UI can
 * render them as visibly-provisional (dashed, muted) until real numbers land.
 */

export type MediaKind = "image" | "gallery" | "diagram" | "graph" | "video";

export type MediaSlot = {
  kind: MediaKind;
  /** Stable id — matches the asset punch-list. Drop the Figma export named this. */
  id: string;
  /** What this visual should show — shown in the placeholder + doubles as caption. */
  label: string;
  /** Optional caption rendered beneath the media once real. */
  caption?: string;
  /** Layout hint: reading-width, breaks the measure, or full-viewport-bleed. */
  width?: "content" | "wide" | "bleed";
  /** Aspect ratio for the placeholder box, e.g. "16/9", "4/3", "1/1". */
  ratio?: string;
};

export type Metric = {
  value: string;
  label: string;
  description?: string;
  /** True while the number is still a [FILL] placeholder from the copy. */
  pending?: boolean;
};

export type Decision = {
  n: string;
  title: string;
  body: string[];
  tradeoff: string;
  /** Set when the tradeoff still needs a real number. */
  tradeoffPending?: boolean;
};

export type Feature = {
  title: string;
  body: string;
  /** Optional architecture/decision note rendered as an inset rule. */
  note?: string;
};

export type Stage =
  | "problem"
  | "reframe"
  | "users"
  | "decisions"
  | "method"
  | "shipped"
  | "wrong"
  | "impact"
  | "reflection";

export type CaseStudy = {
  slug: string;
  /** Accent color — the distinctiveness engine. LIR = signal amber/orange. */
  accent: string;
  accentSoft: string;
  hero: {
    eyebrow: string;
    title: string;
    lede: string;
    snapshot: { label: string; value: string }[];
    metrics: Metric[];
  };
  /** Ordered wayfinding rail — number, stage key, short label. */
  rail: { n: string; stage: Stage; label: string }[];
  sections: Section[];
};

/* --- Section variants (a discriminated union the page renders declaratively) --- */

type Base = { stage: Stage; n: string; eyebrow: string; heading: string };

export type Section =
  | (Base & { kind: "prose"; body: Block[] })
  | (Base & { kind: "decisions"; intro: string; decisions: Decision[] })
  | (Base & { kind: "features"; intro: string; features: Feature[]; outro?: string })
  | (Base & { kind: "impact"; intro: string; metrics: Metric[]; sourceable: string[] });

/** Rich block inside a prose section — paragraph, pull-quote, media, table. */
export type Block =
  | { t: "p"; text: string }
  | { t: "quote"; text: string }
  | { t: "media"; slot: MediaSlot }
  | { t: "metric"; metric: Metric }
  | {
      t: "table";
      caption?: string;
      head: string[];
      rows: string[][];
    };

const accent = "#ff781f"; // signal orange — echoes the hero `colorHot`
const accentSoft = "#ffb27a";

export const LIVE_INCIDENT_RESPONSE: CaseStudy = {
  slug: "live-incident-response",
  accent,
  accentSoft,

  hero: {
    eyebrow: "corporate drone ops · emergency response · real-time collaboration · FlytBase",
    title: "A situation room that assembles itself in 30 seconds.",
    lede: "Live Incident Response turns any active drone incident into a shared situation room — the same feeds, the same map, the same annotations, in real time — for people who have never seen the platform, standing in a field, on a phone, in another language. Shipped v1 and v2 to real infrastructure in four months.",
    snapshot: [
      { label: "Role", value: "Flink Builder — problem framing through deployment, end to end" },
      { label: "Duration", value: "March–April 2026 (v1.0 → v2.0)" },
      { label: "Company", value: "FlytBase" },
      { label: "Status", value: "Live, in production" },
    ],
    metrics: [
      {
        value: "—",
        label: "incidents / sessions run",
        description: "on the live product",
        pending: true,
      },
      {
        value: "—",
        label: "countries reached",
        description: "real usage across continents",
        pending: true,
      },
      {
        value: "2",
        label: "major versions in 4 months",
        description: "v1.0 (Mar) → full mobile rewrite v2.0 (Apr)",
      },
      {
        value: "< 30s",
        label: "to situational awareness",
        description: "design target for an untrained guest",
      },
    ],
  },

  rail: [
    { n: "01", stage: "problem", label: "The Problem" },
    { n: "02", stage: "reframe", label: "The Reframe" },
    { n: "03", stage: "users", label: "Who It's For" },
    { n: "04", stage: "decisions", label: "Key Decisions" },
    { n: "05", stage: "method", label: "The Method" },
    { n: "06", stage: "shipped", label: "What Shipped" },
    { n: "07", stage: "wrong", label: "What I Got Wrong" },
    { n: "08", stage: "impact", label: "Impact" },
    { n: "09", stage: "reflection", label: "Reflection" },
  ],

  sections: [
    /* 01 — THE PROBLEM */
    {
      kind: "prose",
      stage: "problem",
      n: "01",
      eyebrow: "The Problem",
      heading: "The intelligence exists. It just can't reach the person who needs it.",
      body: [
        {
          t: "p",
          text: "A warehouse catches fire. The drone-in-a-box on the roof launches automatically and starts streaming thermal and visual feeds. The intelligence is already in the air — where the fire is hottest, whether anyone's inside, where to position the ladder truck.",
        },
        {
          t: "p",
          text: "Here's the gap. The fire captain standing in the parking lot doesn't have a FlytBase account. Doesn't know what FlytBase is. Has a phone in one hand, a radio in the other, and needs answers now.",
        },
        {
          t: "quote",
          text: "The drones are flying. The cameras are streaming. The intelligence exists. It just can't reach the people who need it.",
        },
        {
          t: "p",
          text: "That distance — between data availability and data accessibility — is the entire problem Live Incident Response exists to close.",
        },
        {
          t: "media",
          slot: {
            kind: "image",
            id: "01-incident-scene",
            label: "The scene: warehouse fire, drone-in-a-box streaming overhead, responder on the ground with no account",
            width: "wide",
            ratio: "16/9",
          },
        },
        {
          t: "metric",
          metric: {
            value: "—",
            label: "avg delay, feed-live → responder sees it",
            description: "under the old account-based sharing model",
            pending: true,
          },
        },
      ],
    },

    /* 02 — THE REFRAME */
    {
      kind: "prose",
      stage: "reframe",
      n: "02",
      eyebrow: "The Reframe",
      heading: "It sounds like a video-sharing feature. It isn't.",
      body: [
        {
          t: "p",
          text: "The brief was one line: let operators share live drone feeds with external guests during an incident.",
        },
        {
          t: "p",
          text: "Read it again. It sounds like a video call. The complexity revealed itself in layers — and each layer moved this from “a feature” to “a coordinated situation room.”",
        },
        {
          t: "table",
          caption: "Four layers that redefined the brief",
          head: ["Layer", "Why it breaks the “video call” framing"],
          rows: [
            ["Roles matter", "An operator needs full control, a guest needs to see and contribute, a viewer observes only — different experiences, not permission tiers."],
            ["Context matters", "A desk with dual monitors and gigabit ethernet has nothing in common with a phone next to a fire on two bars of cellular."],
            ["Time matters", "No scheduled meeting. Someone's building is on fire. No account, no onboarding, no training — situational awareness now."],
            ["Language matters", "Multi-agency teams — police, fire, military, civilian — may not share a common language."],
          ],
        },
        {
          t: "p",
          text: "So the brief got redefined, and the ambition grew with it:",
        },
        {
          t: "quote",
          text: "Turn any active incident into a coordinated situation room where drone operators and ground teams see the same feeds, the same map, and the same annotations in real time — regardless of device, technical skill, or language.",
        },
      ],
    },

    /* 03 — WHO IT'S FOR */
    {
      kind: "prose",
      stage: "users",
      n: "03",
      eyebrow: "Who It's For",
      heading: "Three users. Three worlds.",
      body: [
        {
          t: "p",
          text: "Research with FlytBase's customer-success team and sales pipeline surfaced three roles. They don't just have different permissions — they inhabit different physical, cognitive, and emotional contexts.",
        },
        {
          t: "table",
          caption: "The three roles",
          head: ["Role", "Context", "What they do"],
          rows: [
            ["Operators (Admins)", "Connected command center · desktop · expert · controlled stress", "Create sessions, assign drones, invite participants, hold operational oversight."],
            ["Guests", "In the field · mostly mobile · first-time users · high stress", "Join instantly, understand the situation immediately, contribute — no training, any language. The largest, most diverse, most critical segment."],
            ["Guest Viewers", "Link-shared default · restricted", "Observe and chat only — no annotating or markers. A safety net that keeps the operator in control of the shared picture."],
          ],
        },
        {
          t: "quote",
          text: "The product's most important users are its least experienced ones.",
        },
        {
          t: "p",
          text: "Every decision had to pass one test:",
        },
        {
          t: "quote",
          text: "Would a person with no training, standing in a parking lot during an emergency, be able to use this in under 30 seconds?",
        },
        {
          t: "media",
          slot: {
            kind: "diagram",
            id: "03-segmentation-2x2",
            label: "2×2 segmentation — technical familiarity (x) × context of use (y). Guests land bottom-right: low familiarity, mobile/field. That quadrant is the whole design problem.",
            width: "content",
            ratio: "4/3",
          },
        },
        {
          t: "metric",
          metric: {
            value: "—",
            label: "stakeholder / customer-success interviews synthesized",
            description: "into these three roles",
            pending: true,
          },
        },
      ],
    },

    /* 04 — KEY DECISIONS */
    {
      kind: "decisions",
      stage: "decisions",
      n: "04",
      eyebrow: "Key Decisions",
      heading: "Three decisions made before I opened Figma.",
      intro: "Each decision is the choice, the reasoning, and the tradeoff — named out loud.",
      decisions: [
        {
          n: "01",
          title: "Mobile isn't responsive. It's a different persona.",
          body: [
            "The hardest-won decision. v1 was responsive — shrink the desktop, add breakpoints, make it “work” on mobile. It did work. It passed every technical test. And it failed the only test that mattered: the fire-captain test, the one-hand test, the “can I figure this out in 30 seconds while my building is on fire?” test.",
            "The v2 insight: mobile users don't need everything at once. They need one thing at a time, done well. That drove a state-machine architecture — Feed Mode, Map Mode, Annotation Mode, Chat Mode, Landscape Mode — each owning the full screen, each optimized for its single task.",
          ],
          tradeoff:
            "A complete mobile rewrite instead of a set of breakpoints. The most expensive decision in the project.",
          tradeoffPending: true,
        },
        {
          n: "02",
          title: "Session-based, not persistent.",
          body: [
            "Rather than always-on feed access, the product runs on time-bounded sessions tied to specific incidents. This matches how emergency response actually works — incidents have a start and an end — and it hands you security boundaries for free: sessions expire, links go dead.",
          ],
          tradeoff:
            "The tradeoff I avoided: the product never has to solve “who has access to what, forever?” It only solves “who has access right now?” Each incident is its own logged session.",
        },
        {
          n: "03",
          title: "Progressive disclosure by screen, not by hidden buttons.",
          body: [
            "Instead of one interface with features greyed out by permission, each role gets a purpose-built experience. Operators get the full management dashboard. Guests get the session view. Viewers get something simpler still. The interface adapts not by hiding controls but by showing entirely different screens.",
          ],
          tradeoff:
            "More screens to design and maintain, in exchange for an interface that never makes a stressed first-time user wonder why a button doesn't work.",
        },
      ],
    },

    /* 05 — THE BUILDER METHODOLOGY */
    {
      kind: "prose",
      stage: "method",
      n: "05",
      eyebrow: "The Method",
      heading: "I planned the constraints before I designed the flow.",
      body: [
        {
          t: "p",
          text: "The traditional handoff loop: Research → Define → Design → Handoff → Build → “that's not what I designed.” The designer works in the abstract, discovers the constraints during implementation, and the shipped product becomes a negotiation between intent and reality.",
        },
        {
          t: "p",
          text: "I ran a different loop: Research → Define → Plan the constraints → Design → Build → Reiterate fast.",
        },
        {
          t: "media",
          slot: {
            kind: "diagram",
            id: "05-loop-comparison",
            label: "Traditional handoff loop vs. builder loop — two flow diagrams stacked. The builder loop inserts “Plan the constraints” before Design and closes with “Reiterate fast.”",
            width: "wide",
            ratio: "16/9",
          },
        },
        {
          t: "quote",
          text: "The designer who knows the tech constraints before deciding the flow makes better products than the designer who discovers them after.",
        },
        {
          t: "p",
          text: "A concrete example. The first thing I designed was the video wall — multiple feeds tiled together. But the core platform didn't have a multi-drone subscription stream available. That was the first bottleneck of the first feature. Because I flagged the constraint before designing around it, I knew the new feed presentation would cause a boot-up load — so I designed an empty state up front: a grey feed with a loader, so the moment the app opens, the user knows the feed is coming. A handoff designer would have discovered that gap in QA. I designed for it before the first component existed.",
        },
        {
          t: "media",
          slot: {
            kind: "image",
            id: "05-empty-state",
            label: "The designed-up-front empty state — grey feed tile with loader, so the user knows the stream is coming during boot-up",
            width: "content",
            ratio: "16/9",
          },
        },
        {
          t: "p",
          text: "Teaching the AI to follow our design system. The FlytBase “F” design system lives in Figma — colors, type, spacing, icons, components. The AI build tools I was working with don't open Figma. Point Claude Code at a screen and say “build this,” and it comes back with its own interpretation: random blues, default border-radii, a font stack pulled from training data, shadows that exist nowhere in our component library. It looks like software. It doesn't look like our software.",
        },
        {
          t: "p",
          text: "So I wrote the design system into the AI's language before the first component was generated — a Design.md derived from the Figma MCP, plus ASCII layout planning so the structure was legible to both me and the model.",
        },
        {
          t: "quote",
          text: "The design system survived the build because it was written in the AI's language before the first component was generated.",
        },
        {
          t: "p",
          text: "Put Live Incident Response next to the core FlytBase dashboard and they look like they came from the same team — because they followed the same rules.",
        },
        {
          t: "media",
          slot: {
            kind: "gallery",
            id: "05-system-parity",
            label: "Side-by-side: core FlytBase dashboard and Live Incident Response — same type, color, spacing, components. Proof of design-system parity.",
            width: "wide",
            ratio: "16/9",
          },
        },
        {
          t: "metric",
          metric: {
            value: "—",
            label: "components generated to the F design system",
            description: "with zero divergence",
            pending: true,
          },
        },
      ],
    },

    /* 06 — WHAT SHIPPED */
    {
      kind: "features",
      stage: "shipped",
      n: "06",
      eyebrow: "What Shipped",
      heading: "v1.0 proved it could happen in-browser. v2.0 made it survive the field.",
      intro:
        "Not a feature dump — each one carries a decision, paired with the why.",
      features: [
        {
          title: "Multi-drone live feeds",
          body: "A responsive grid streaming multiple drones at once, each tile carrying real-time telemetry — battery, signal, altitude, speed, heading, connection. Drag to reorder, pin to focus, fullscreen any feed.",
          note: "This is where the designed-up-front empty state from §05 shows up.",
        },
        {
          title: "Collaborative satellite map",
          body: "A shared CesiumJS map with live drone positions, docks, geofences, no-fly zones. Everyone sees the same geography; everyone can pan and zoom independently.",
          note: "Architecture as a design decision: CesiumJS over Leaflet or Mapbox — emergency responders need satellite imagery and terrain awareness. Street maps are useless when the incident is in an industrial compound or a forest.",
        },
        {
          title: "Video annotations",
          body: "Draw directly on a live feed — freehand, shapes, text, five colors. On finish, a screenshot captures the frame plus the drawings and drops it into the chat timeline and alert panel for everyone.",
          note: "The bug hiding in this feature is the best story on the page — §07.",
        },
        {
          title: "Real-time chat that doubles as the audit trail",
          body: "@mentions, image paste, inline annotation cards. System events — participant joined, marker placed, annotation shared — appear inline, not in a separate panel. During the incident it's communication; after the incident it's the record.",
        },
        {
          title: "Permission system + admission queue",
          body: "Click a session link, land in a waiting room, operator approves or denies. Email-invited guests whose address matches the guest list skip the queue entirely.",
          note: "A UX-driven security decision: fast access for known participants, controlled access for strangers.",
        },
        {
          title: "v2.0 additions",
          body: "Full mobile redesign (the state machine from §01–04), touch-first interactions, live translation, PWA support, and phone collaborators sharing their own live camera feed.",
        },
      ],
      outro: undefined,
    },

    /* 07 — WHAT I GOT WRONG */
    {
      kind: "prose",
      stage: "wrong",
      n: "07",
      eyebrow: "What I Got Wrong",
      heading: "The bug a handoff designer would never have caught.",
      body: [
        {
          t: "p",
          text: "The annotation screenshot worked perfectly on desktop and silently failed on mobile.",
        },
        {
          t: "p",
          text: "The capture function searched for the HTML canvas — where the drawings render — only inside the video tile element. On desktop the canvas was a child of the tile. On mobile, the layout put the canvas as a sibling of the tile, not a child. So the function found nothing, and the screenshot came back without the annotations.",
        },
        {
          t: "media",
          slot: {
            kind: "diagram",
            id: "07-dom-canvas-bug",
            label: "DOM diagram — desktop: canvas as child of the video tile (capture works); mobile: canvas as sibling (capture finds nothing). The layout change that hid the bug.",
            width: "content",
            ratio: "4/3",
          },
        },
        {
          t: "p",
          text: "That's not a bug you catch in a Figma review. You catch it because you're the one holding both the design decision and the DOM. Fixed the same afternoon — a turnaround pace that's still rare in the industry.",
        },
        {
          t: "p",
          text: "The bigger thing I got wrong: v1's responsive-shrink approach. It passed every technical test and failed the segment that mattered most. Admitting that is what produced the v2 rewrite — and the v2 rewrite is the reason the product actually works for a guest in the field.",
        },
        {
          t: "quote",
          text: "The responsive version worked on every screen. It just didn't work for the one person it was built for.",
        },
        {
          t: "metric",
          metric: {
            value: "—",
            label: "field-reported issues resolved same-day",
            description: "during v1 testing",
            pending: true,
          },
        },
      ],
    },

    /* 08 — IMPACT */
    {
      kind: "impact",
      stage: "impact",
      n: "08",
      eyebrow: "Impact",
      heading: "A designer in Pune shipped to users across continents.",
      intro:
        "I instrumented the product with PostHog — session replays, feature adoption, drop-off, device split — so I could catch scaling issues and see the real walkthrough, not the assumed one. Every number below is framed by what it measured and what it proves.",
      metrics: [
        {
          value: "—",
          label: "mobile / desktop device split",
          description:
            "The mobile-heavy distribution confirms the emergency-in-the-field use case the whole v2 rewrite was built around. The data validated the most expensive decision in the project.",
          pending: true,
        },
        {
          value: "—",
          label: "sessions per week, v1 → v2",
          description:
            "Steady growth across releases — proof the product got more used as it got more refined, not less.",
          pending: true,
        },
        {
          value: "—",
          label: "countries / continents reached",
          description: "Real reach, pulled from PostHog geo.",
          pending: true,
        },
        {
          value: "—",
          label: "guests reaching live view unassisted",
          description:
            "The closest quantitative proxy for the 30-second fire-captain test.",
          pending: true,
        },
      ],
      sourceable: [
        "Time-to-situational-awareness — median seconds from link-click to first meaningful interaction (map pan, feed view, marker). The “30 seconds” claim, made real.",
        "Guest self-service rate — % of guests who joined and contributed with zero operator hand-holding. Directly proves “no training required.”",
        "Annotation → decision latency — how fast a placed marker gets seen by all participants (the real-time sync claim, quantified).",
        "Sessions per operator, repeat usage — retention proxy; shows operators came back.",
        "Language / translation usage — % of sessions where live translation fired, proving the multilingual bet wasn't hypothetical.",
        "Same-day fix count — from §07, quantifies the builder-speed advantage.",
      ],
    },

    /* 09 — REFLECTION */
    {
      kind: "prose",
      stage: "reflection",
      n: "09",
      eyebrow: "Reflection",
      heading: "The handoff is where intent goes to die.",
      body: [
        {
          t: "p",
          text: "Every spec is a place where meaning leaks out — the animation timing that gets approximated, the error state that gets deprioritized, the empty state nobody mocks up. When the same person makes both the design decision and the implementation decision, the leakage stops. One person holds both ends, and the product achieves internal coherence.",
        },
        {
          t: "p",
          text: "I want to be precise about the AI part, because the narrative around these tools is misleading. AI didn't make me an engineer. I can't whiteboard a sorting algorithm. What Claude Code, Cursor, and Lovable did was remove the syntax tax — the tax that said you can know exactly what this product should feel like, but you can't touch the code that determines whether it does.",
        },
        {
          t: "quote",
          text: "AI removed the language barrier between my design intent and the codebase. It didn't replace the intent.",
        },
        {
          t: "p",
          text: "The cost of shipping the thing yourself collapsed. The designers who pick up that agency get to build the thing they intended. The ones who don't will keep handing intent across a boundary and watching it arrive different on the other side.",
        },
        {
          t: "p",
          text: "I want to be in the first group. This project is my proof that I can be.",
        },
      ],
    },
  ],
};

/* ============================================================================
   ASSET PUNCH-LIST — every visual slot the page renders as a placeholder.
   Drop the Figma export with the matching `id` (see MediaSlot.id) and swap the
   placeholder for real media. Diagrams/graphs are custom; the rest are product
   screenshots.

   id                    kind      what to produce
   --------------------  --------  --------------------------------------------
   01-incident-scene     image     Hero problem visual: fire + drone + responder
   03-segmentation-2x2   diagram   2×2 familiarity × context (Guests bottom-right)
   05-loop-comparison    diagram   Traditional handoff loop vs. builder loop
   05-empty-state        image     The designed-up-front grey-feed loader state
   05-system-parity      gallery   Core dashboard ⟷ LIR, side by side
   07-dom-canvas-bug     diagram   Canvas-as-child (desktop) vs -as-sibling (mobile)

   TEXT [FILL] METRICS still needed (render as provisional until sourced):
   - incidents/sessions run (PostHog)          - avg feed→responder delay
   - countries/continents (PostHog geo)        - interviews synthesized count
   - components at zero divergence             - same-day field fixes count
   - mobile/desktop split                      - sessions/week v1→v2 trend
   - guest unassisted-to-live-view rate
   ========================================================================== */
