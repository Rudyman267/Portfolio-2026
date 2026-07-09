/**
 * Placeholder work for the home "MY WORKS." gallery while Sanity is empty.
 *
 * Shaped to line up with PROJECT_CARD (queries.ts): title / slug / summary /
 * year / tags. When real content lands, WorkGallery can map the Sanity result
 * onto GalleryProject and drop this file. `size` is a layout hint the gallery
 * uses to vary thumbnail scale (Figma 101:20 alternates large/small blocks).
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
  {
    title: "Helix",
    slug: "helix",
    summary: "An AI research console that turns messy prompts into reproducible pipelines.",
    year: "2025",
    tags: ["Product", "AI", "0→1"],
    size: "lg",
  },
  {
    title: "Marrow",
    slug: "marrow",
    summary: "Design system and tokens powering a fintech super-app across web and native.",
    year: "2025",
    tags: ["Design System", "Fintech"],
    size: "sm",
  },
  {
    title: "Nightshift",
    slug: "nightshift",
    summary: "A generative editing tool where designers and models co-author in real time.",
    year: "2024",
    tags: ["Tooling", "AI", "Prototype"],
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
