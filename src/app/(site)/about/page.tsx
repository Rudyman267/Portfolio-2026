import type { Metadata } from "next";
import { AboutIntro } from "@/components/about/AboutIntro";

export const metadata: Metadata = {
  title: "Me",
  description:
    "Riddhiman Deb — AI-native product designer who ships design and code.",
};

/**
 * The Me page — dark cinematic register, built section by section like the
 * home flow. Opens with the "HEY! THAT'S MY NAME" pinned storyboard intro;
 * further sections (positioning, process, personal) land in later passes.
 * The site footer (dark finale) closes the page, so the whole route stays
 * seamless black.
 */
export default function AboutPage() {
  // The dark backdrop wraps the pinned intro so ScrollTrigger's pin-spacer
  // (and any sub-pixel rounding gap at the section/footer seam) shows the
  // site dark instead of the body's white — kills the hairline artifact.
  // #06080c = .hero-dark's canvas, identical to the section and footer.
  return (
    <div className="bg-[#06080c]">
      <AboutIntro />
    </div>
  );
}
