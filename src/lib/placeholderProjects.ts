/**
 * Placeholder work for the home works journey (WorksJourney.tsx project-node
 * beats) while Sanity is empty.
 *
 * Shaped to line up with PROJECT_CARD (queries.ts): title / slug / summary /
 * year / tags. When real content lands, WorksJourney can map the Sanity result
 * onto GalleryProject and drop this file. `size` is a legacy layout hint from
 * the removed horizontal gallery (kept so the type still round-trips).
 */
export type GalleryProject = {
  title: string;
  slug: string;
  summary: string;
  year: string;
  tags: string[];
  /** relative thumbnail scale in the filmstrip */
  size: "lg" | "md" | "sm";
};

export const PLACEHOLDER_PROJECTS: GalleryProject[] = [
  // THE REAL FLAGSHIP — links to the built case study at
  // /work/live-incident-response. It and Verkos Reports (below) are the two
  // real studies; the remaining cards are placeholders whose slugs 404 until
  // their studies exist.
  {
    title: "Live Incident Response",
    slug: "live-incident-response",
    summary:
      "A single live room for drone-led emergency response — built at FlytBase.",
    // matches the study's own meta (Duration: March–April 2026)
    year: "2026",
    tags: ["Product", "0→1", "FlytBase"],
    size: "lg",
  },
  // SECOND REAL STUDY — /work/verkos-reports (built in Session 18).
  {
    title: "Verkos Reports",
    slug: "verkos-reports",
    summary:
      "AI-powered automated security report generation — designed and shipped at FlytBase.",
    // matches the study's own meta (Duration: April–June 2026)
    year: "2026",
    tags: ["Product", "AI", "FlytBase"],
    size: "sm",
  },
  // THIRD REAL STUDY — /work/oro-connect. Replaced the "Nightshift" placeholder
  // so it sits directly after the two FlytBase studies in the journey.
  {
    title: "ORO Connect",
    slug: "oro-connect",
    summary:
      "A 70,000-piece jewellery catalogue a buyer can actually shop — rebuilt for ORO Precious Metals.",
    // matches the study's own meta (Duration: 6 weeks · 2025)
    year: "2025",
    tags: ["Product", "B2B", "ORO"],
    size: "md",
  },
  {
    title: "Atlas",
    slug: "atlas",
    summary: "Reimagining onboarding for a data platform — from 12 screens down to three.",
    year: "2024",
    tags: ["Product", "Growth"],
    size: "lg",
  },
  {
    title: "Ember",
    slug: "ember",
    summary: "An experimental spatial interface for browsing large model latent spaces.",
    year: "2024",
    tags: ["R&D", "3D", "Play"],
    size: "sm",
  },
];
