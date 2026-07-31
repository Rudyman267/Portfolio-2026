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
  /** When set, this project is NOT a case-study page — its card links straight
   *  out to a live external site (opened in a new tab) instead of `/work/slug`.
   *  Used for the ORO Edit luxury web experience, which lives as a real site to
   *  click into rather than a written study. */
  externalUrl?: string;
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
  // FOURTH PROJECT — NOT a case study. It's a live luxury-brand web experience
  // (the ORO Edit landing site) that speaks for itself, so the card links
  // straight out to the real thing in a new tab rather than to a written study.
  // Thumbnail asset lands separately; until then the beat shows a "view live
  // site" placeholder (see WorksJourney's ProjectBeat).
  {
    title: "ORO Edit",
    slug: "oro-edit",
    summary:
      "A live luxury-brand jewellery web experience — click through to the real site.",
    year: "2025",
    tags: ["Web", "Luxury", "Live"],
    size: "lg",
    externalUrl: "https://oroedit.com/landing",
  },
];
