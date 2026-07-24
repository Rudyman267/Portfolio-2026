"use client";

import { useEffect } from "react";

/**
 * Paints the document root/body the dark hero canvas while the home page is
 * mounted, then restores it on unmount.
 *
 * Why not just a `bg-[#06080c]` wrapper div (page.tsx has one)? Once the hero
 * section is PINNED, ScrollTrigger lifts it out of normal flow (fixed on touch)
 * and wraps it in a `.pin-spacer` that lives outside that wrapper — so the
 * wrapper's paint no longer sits under the hero. On Android the body's default
 * warm near-white (`--color-bg: 250 250 249`) then flashes through for a frame
 * at scroll-start (the transient white gap), and can show in the dvh/URL-bar
 * gap at the bottom. Painting the <html> element itself dark means there is no
 * white surface anywhere behind the pinned hero, whatever the spacer does.
 *
 * Scoped to the home route (this component only mounts here), so the light
 * /work index and every other route keep the default page background.
 */
export function HomeDarkBody() {
  useEffect(() => {
    const html = document.documentElement;
    const prevHtml = html.style.backgroundColor;
    const prevBody = document.body.style.backgroundColor;
    html.style.backgroundColor = "#06080c";
    document.body.style.backgroundColor = "#06080c";
    return () => {
      html.style.backgroundColor = prevHtml;
      document.body.style.backgroundColor = prevBody;
    };
  }, []);
  return null;
}
