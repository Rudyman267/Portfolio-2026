import { lenisRef } from "@/components/motion/lenisBridge";

/**
 * The works chapter lives INSIDE the hero's pinned scrub (no `#work` element
 * exists on the motion path), so `/#work` can't be a native hash jump. The
 * Hero's ScrollTrigger writes the chapter's absolute scroll offset here on
 * every refresh; nav/footer links glide to it via scrollToWorks().
 *
 * Reduced motion (no pin): `y` stays 0 and we fall back to the static
 * `#work` fallback section, which IS in normal document flow there.
 */
export const worksAnchor = { y: 0 };

export function scrollToWorks() {
  if (worksAnchor.y > 0) {
    if (lenisRef.current) {
      lenisRef.current.scrollTo(worksAnchor.y, { duration: 1.6 });
    } else {
      window.scrollTo({ top: worksAnchor.y, behavior: "smooth" });
    }
    return;
  }
  document.getElementById("work")?.scrollIntoView({ behavior: "smooth" });
}
