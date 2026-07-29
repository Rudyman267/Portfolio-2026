/**
 * Verkos Reports — the 2nd FlytBase case study.
 *
 * Recreated from Figma node 258:2 ("Page of project 3"). Same dark case-study
 * shell + chapter/flash transitions as LIR (it reuses <LirCaseStudy>), but with
 * its OWN signal accent — cyan #08e6ff (`accent: "cyan"`, applied via
 * data-accent on the .lir root) — and its own content.
 *
 * COPY is transcribed verbatim from the Figma text nodes. UI screenshots render
 * as BARE figures (no rounded container frames — house rule for showcasing UI).
 * Real assets live in /public/case-study/flytbase-2 (sources + originals in the
 * gitignored case-study-assets/flytbase-project-2).
 *
 * LirDesign-shaped so it drops straight into the STUDIES registry.
 */

import type { LirDesign } from "@/lib/caseStudies/lirDesign";

const A = "/case-study/flytbase-2"; // asset base

export const VERKOS_DESIGN: LirDesign = {
  slug: "verkos-reports",
  backLabel: "Back to work",
  accent: "cyan",
  eyebrow:
    "drone operations · AI report generation · enterprise security · FlytBase",
  title: "Verkos Reports",
  headline: "AI powered automated security report generation",
  lede: "Verkos Reports turns a night's drone patrol into a stakeholder-ready PDF before the pilot finishes their coffee. The AI already detected what mattered mid-flight — my job was building the layer that knows what those detections mean. Designed and shipped as production code.",

  stats: [
    {
      value: "45 → 5 mins",
      label: "Time Taken to make new reports",
      sub: "Estimated",
    },
    {
      value: "187 → 0",
      label: "Images manually tagged",
      sub: "Avg number of images per report that had to be tagged",
    },
  ],

  // Overview cover — the annotated east-gate detection screen (bare, no frame).
  cover: {
    id: "00-cover",
    src: `${A}/east-gate.webp`,
    label:
      "A Verkos Reports detection view — the annotated east-gate frame with a labelled bounding box (Pickup truck, 98%) over the live drone capture.",
  },

  meta: [
    { label: "Company", value: "FlytBase" },
    { label: "Role", value: "AI Product Design Builder" },
    { label: "Duration", value: "April–June 2026" },
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
    "The AI already detected what mattered mid-flight — my job was building the layer that knows what those detections mean.",

  // the real product UI, embedded before 01 Context so it can be used first
  appDemo: true,

  sections: [
    /* ── 01 CONTEXT ──────────────────────────────────────────────────────── */
    {
      kind: "prose",
      id: "context",
      n: "01",
      heading: "Context",
      blocks: [
        // INTERACTIVE EXHIBIT — placed first so the reader can drive the thing
        // before reading how it was built. Visual-only prototype, invented data.
        { t: "prototype", which: "verkosReport" },
        {
          t: "statement",
          text: "Enterprise security customers don't pay for drone flights. They pay for the report.",
        },
        // give the thesis its own beat before the supporting detail arrives
        { t: "sceneBreak" },
        {
          t: "richP",
          spans: [
            { text: "Flytbase had its own proprietary AI detection agents called ", },
            { text: "Verkos Detect Anything Agents (DAA)", bold: true },
            { text: ".", },
          ],
        },
        {
          t: "p",
          text: "Before this project, every report was created manually. After landing, the pilot would spend hours working through a four-step workflow: draw an annotation, add a title, write an observation, and repeat. Sometimes across 187 images, long after the patrol itself had finished. The drone wasn't the bottleneck anymore. The pilot was.",
        },
        // confidentiality note (recreation disclaimer)
        {
          t: "note",
          text: "Note: Due to client confidentiality and security requirements, the UI shown throughout this case study is a conceptual recreation of the shipped product. The underlying product decisions, workflows, and technical implementation remain unchanged.",
        },
        // the "pilot at 2am" beat + the generated "Observation #2" report card
        // (2.png) close Context — AFTER the note. NOT a repeat of the overview
        // cover (east-gate).
        { t: "sceneBreak" },
        {
          t: "statement",
          text: "The pilot was doing by hand, at 2am, work the AI can complete in the air.",
        },
        {
          t: "figure",
          src: `${A}/report-card.webp`,
          alt: "A generated observation card — 'Observation #2: Lone individual standing in the scrubland,' Moderate priority, 86% AI confidence, with the pilot's observation and the raw capture showing the detection box.",
          maxW: 443,
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
        // bare UI — the annotated south-fence detection frame
        {
          t: "figure",
          src: `${A}/south-fence.webp`,
          alt: "south-fence detection — a labelled bounding box (Fence deformation, 87%) drawn over the drone capture of the site's south fence.",
        },
        // the problem statement lands on its own beat
        { t: "sceneBreak" },
        {
          t: "statement",
          text: "The platform could identify incidents in real time, but every finding still had to be manually reconstructed into a report after the flight.",
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
        {
          // full-viewport flash beat — white, ~2 lines, plays in and scrubs away.
          t: "quoteFlash",
          tone: "bright",
          wide: true,
          text: "A detection is not a finding. And the pilot knows most at 18:15, not at midnight.",
        },
        {
          t: "p",
          text: "Is a white van on the perimeter road a breach, or the 6pm traffic that's there every evening? The pixels cannot answer that. The answer lives in three places the camera never sees: what's normal at this site, what this patrol was dispatched to look for, and what the pilot noticed that no configured event type covers.",
        },
        {
          t: "p",
          text: "We needed to find a way to put human context + AI detections together with site context and knowledge to combine all these data points into a meaningful report.",
        },
        // persona / stakeholder split — Pilot (Create / Act) vs Manager (Observe)
        {
          t: "verkosDiagram",
          which: "personaSplit",
          caption:
            "Who a report serves — the pilot (Command Center, hectic hours) creates and acts; business stakeholders observe: daily patrol checks and monthly breach-tracking.",
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
          t: "heading",
          text: "Designing a pipeline, not a screen.",
        },
        {
          t: "p",
          text: "Most of the design work happened before an interface existed. The artifact wasn't a wireframe — it was the flow of data, and the decision about where judgment enters it.",
        },
        // pipeline diagram (Drone · Pilot · DAA → LLM → Verkos Reports)
        {
          t: "verkosDiagram",
          which: "pipeline",
          caption:
            "The report pipeline — Drone, Pilot, and DAA detections feed an LLM, which produces Verkos Reports.",
        },
        {
          t: "p",
          text: "We had to create a report making flow that let's the pilot create comprehensive reports easily without much manual effort after the flight has happened.",
        },
        // audit trio — opens the build (identical structure to LIR's audit).
        {
          t: "p",
          text: "Before designing anything new, I audited what already existed. This is basic UX hygiene, but it's also where the builder dimension starts adding value: I wasn't just auditing the interface, I was auditing the data.",
        },
        {
          t: "auditNotes",
          notes: [
            {
              text: "The FlytBase platform already had everything the raw material needed: drone flights, captured media, and Forensic Search — a VLM you query in plain text to detect anything in the footage. The intelligence existed. Nobody had turned it into a report.",
            },
            {
              text: "Report creation was fully manual: a pilot on a night shift working a wizard, drawing annotation rectangles on 187 images, typing a title and description for each. It duplicated, by hand and hours late, work the AI had already done in the air.",
            },
            {
              text: "The opportunity was clear: take the detections Forensic Search already produces, combine them with what the site is, what the patrol was looking for, and what the pilot noticed — and let a model write the report a human only has to review.",
            },
          ],
        },
        { t: "sceneBreak" },
        // "code architecture" Q&A beats on the vertical accent rail (as LIR).
        {
          t: "archTimeline",
          intro: "Then I had to start building the code architecture.",
          beats: [
            {
              question:
                "How would the report get its detections? Where do they come from?",
              problem:
                "Running my own vision model over every image at report time would re-derive what the platform already knows — 187 images per patrol, every night, every site, and cost per image forever.",
              answer:
                "After working through the options with Claude, the conclusion was to keep vision upstream: my product sends text queries to FlytBase's Forensic Search and receives structured detections back such as bounding boxes, labels, confidence. I never touch a pixel. Report generation runs on a text model over that structured data, which made the marginal cost of a report negligible.",
            },
            {
              question: "How would the report know what a detection means?",
              problem:
                "Forensic Search returns “vehicle, 82%, near perimeter.” True, and useless alone — is that a breach or the 6pm traffic that's there every evening? The image can't answer that.",
              answer:
                "The conclusion was to make each agent hold named detection policies written in plain English — one authored instruction that serves as both the query sent to Forensic Search and the writing guidance the text model follows. Site context and pilot voice notes captured mid-flight join it, all keyed to one flight ID. A site manager can express “the scrubland by the east wall isn't a transit area” without writing code, and the report cites that policy back when it writes the finding.",
            },
          ],
        },
        { t: "sceneBreak" },
        // context-assembly diagram (Drone + AI + HIL → Verkos Reports)
        {
          t: "verkosDiagram",
          which: "assembly",
          caption:
            "Context assembly — drone footage, AI detections, and Human-in-loop (HIL) context combine into Verkos Reports.",
        },
        {
          t: "p",
          text: "Verkos reports needed the drone footage + AI detections + Human in loop (HIL) context to create enriched meaningful reports.",
        },
      ],
    },

    /* ── 06 DESIGN DECISIONS ─────────────────────────────────────────────── */
    {
      kind: "prose",
      id: "decisions",
      n: "06",
      heading: "Design Decisions",
      blocks: [
        {
          t: "lede",
          text: "Each of these looked like a shortcut on paper. Each one traded the cheap, familiar option for the one that actually serves the reader who has to act on the report.",
        },
        // dd1 — detection types → named policies in plain English
        {
          t: "decisionText",
          n: "01",
          heading: "Detection events needed details for the VLM to fetch bounding boxes",
          cards: [
            {
              kind: "tempting",
              label: "The tempting option:",
              body: "A checkbox list of supported detection types. Bounded, predictable, easy to validate.",
            },
            {
              kind: "problem",
              label: "The problem:",
              body: "Presets rarely account for the variables in the real world. This is why the old report creation was so methodical and manual.",
            },
            {
              kind: "chose",
              label: "What I chose instead:",
              body: "Each Verkos Reports agent already represented a complete reporting workflow. Every agent paired a named detection policy with a human-authored instruction describing exactly what should be identified and how it should be reported. I used those instructions as the source of truth instead of exposing individual detection types.",
            },
            {
              kind: "why",
              label: "Why?:",
              body: [
                {
                  text: "That instruction is doing two jobs at once. It's the query that goes to Forensic Search, and it's the writing guidance the text model follows when it narrates the finding. One authored artifact, both ends of the pipeline.",
                },
                {
                  lead: "The instruction became the system's single source of truth.",
                  text: "It defined what to search for and how the finding should be described, ensuring the retrieval logic and generated report never drifted apart. Updating an agent meant updating one artifact, not two separate systems.",
                },
              ],
            },
          ],
          img: `${A}/dd1-detection-events.webp`,
          imgAlt:
            "The detection-event editor — event name, severity, and the plain-English report instruction the AI writes from.",
          // tall portrait capture — 80% of the measure, centred under the cards
          imgScale: 0.8,
        },
        // dd2 — fixed report format → configurable sections
        {
          t: "decisionText",
          n: "02",
          heading: "How to configure report structure and contents via editable templates",
          cards: [
            {
              kind: "tempting",
              label: "The tempting option:",
              body: "A fixed report format. Pick a template, generate, done. One structure the whole company uses — least to build, least to explain, and every report comes out consistent.",
            },
            {
              kind: "chose",
              label: "What I chose instead:",
              body: "Every section is independently configurable from its title and structure to the data it draws from, its writing style, and level of detail. Behind each section is a plain-language instruction that guides the AI, while a live preview updates instantly as changes are made.",
            },
            {
              kind: "why",
              label: "Why I gave it up?:",
              body: [
                {
                  text: "A fixed format assumes every reader wants the same thing, and they don't. An executive wants a one-paragraph summary; a compliance officer wants the structured detection data; a site manager wants the narrative.",
                },
                {
                  lead: "Configurability shifted the report from a static document to a communication tool.",
                  text: "Instead of forcing every stakeholder through the same narrative, each section could be tailored to its audience while the underlying evidence remained unchanged. One report, multiple ways of telling the same story.",
                },
              ],
            },
          ],
          img: `${A}/dd2-templates.webp`,
          imgAlt:
            "The template editor — every report section independently configurable, with a live preview beside it.",
        },
        // dd3 — multi-step wizard → one fast surface
        {
          t: "decisionText",
          n: "03",
          heading: "One screen from flight to report.",
          cards: [
            {
              kind: "tempting",
              label: "The tempting option:",
              body: "A multi-step wizard. Site, then flights, then agent, then template — one decision per screen. Guided, hard to get wrong.",
            },
            {
              kind: "chose",
              label: "What I chose instead:",
              body: "The hand-holding of a step-by-step flow, and the extra screens that make each choice feel considered.",
            },
            {
              kind: "why",
              label: "Why I gave it up?:",
              body: [
                {
                  text: "The pilot does this every shift — they don't need a tutorial, they need speed. Site, flight, agent, all on one surface, with a running summary at the bottom (1 site · 1 flight · 1 agent) so the setup is legible without paging through it.",
                },
                {
                  lead: "The wizard was safer for the first-timer.",
                  text: "This is faster for the person who lives here — and it's the same principle as everywhere else in my work: design for who's actually in the seat.",
                },
              ],
            },
          ],
          img: `${A}/dd3-one-screen.webp`,
          imgAlt:
            "The single-surface setup — site, flight, and agent on one screen with a running summary.",
          // tall portrait capture — 80% of the measure, centred under the cards
          imgScale: 0.8,
        },
      ],
    },

    /* ── 08 FEATURES ─────────────────────────────────────────────────────── */
    {
      kind: "features",
      id: "features",
      n: "08",
      heading: "Features",
      features: [
        {
          tagline:
            "Upload a sample report → extract structure & voice → template built.",
          title: "Templates by extraction",
          textSide: "right",
          body: "Creating a template offers three paths, but the recommended one is Upload a sample report. Drop in a PDF, Word doc, or pasted text, and the system extracts its structure, voice, and examples. Presets and start-from-scratch stay as fallbacks.",
          media: [
            {
              id: "feature-1",
              src: `${A}/feature-1-template.webp`,
              label:
                "The template extractor — upload a sample report and the system reads its structure and voice.",
            },
          ],
        },
        {
          tagline: "Three report types, because reports answer three different questions.",
          title: "Patrol · Shift · Incident",
          textSide: "left",
          body: "The landing screen opens on the choice: Patrol report for a single flight, Shift summary to aggregate every flight across a shift, Incident report for accidents, near-misses, and safety events. Below it, every report ever generated — filterable by site, type, drone, and status.",
          media: [
            {
              id: "feature-2",
              src: `${A}/feature-2-types.webp`,
              label:
                "The report library — the three report types and every generated report, filterable by site, type, drone, and status.",
            },
          ],
        },
        {
          tagline: "Land as draft → review each finding → edit severity → publish.",
          title: "The human stays in the loop",
          textSide: "right",
          body: "Every report lands as a Draft, never a finished document. The pilot sees each observation with an editable severity and status, the AI's analysis, and the source image — and nothing ships until they hit Publish report. The images are swappable, the narrative is editable, the call is theirs.",
          media: [
            {
              id: "feature-3",
              src: `${A}/feature-3-draft.webp`,
              label:
                "The review screen — each observation with an editable severity and status, the AI's analysis, and the source image, before Publish.",
            },
          ],
        },
      ],
    },

    /* ── IMPACT ──────────────────────────────────────────────────────────── */
    {
      kind: "prose",
      id: "impact",
      n: "09",
      heading: "Impact",
      blocks: [
        {
          t: "heading",
          text: "Built to sell — the commercial logic I designed for",
        },
        {
          t: "leadP",
          lead: "The deliverable is the thing customers pay for.",
          text: "Enterprise security buyers don't purchase flights — they purchase the compliance artifact that proves the patrol happened and says what it found. I built the layer that produces that artifact, which is the part of the workflow closest to the money.",
        },
        {
          t: "leadP",
          lead: "I designed against the enterprise adoption blocker.",
          text: "The reason a customer won't switch reporting tools is that their compliance team already accepts a specific format. Template-by-extraction turns that blocker into an on-ramp — their existing report becomes the config. That's a deliberate go-to-market decision encoded in a feature.",
        },
        {
          t: "leadP",
          lead: "It was built to be pitched.",
          text: "Verkos shipped as part of the Flink bundle FlytBase took into enterprise pitches across security, oil & gas, and solar — a net-new capability the sales motion could show, not just describe.",
        },
      ],
    },
  ],
};
