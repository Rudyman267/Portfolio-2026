import type { Metadata } from "next";
import type { CSSProperties } from "react";
import { PageHeading } from "@/components/sections/PageHeading";
import { PlayWall } from "@/components/play/PlayWall";
// client boundary — `ssr:false` dynamic imports can't live in a Server Component
import { PageGlowMount } from "@/components/hero3d/PageGlowMount";

export const metadata: Metadata = {
  title: "Play",
  description:
    "AI explorations and playful builds — including The Other Hand, a digital meditation you can play in the browser.",
};

// No Sanity fetch: the ContactCTA that consumed `siteSettings` was removed from
// this page (the footer already carries contact), which left the page fully
// static — same cleanup as /work.
export default function PlayPage() {
  return (
    // Same shell as /work: `hero-dark` rescopes the colour tokens (without it
    // `text-fg` resolves to the LIGHT theme's near-black), and the accent is
    // overridden to the signal orange so it matches the particle field.
    <div
      data-header-dark
      className="hero-dark relative isolate min-h-svh bg-[#06080c] text-fg"
      style={{ "--color-accent": "255 141 59" } as CSSProperties}
    >
      <PageGlowMount />

      <div className="relative z-[1]">
        <PageHeading title="PLAY" subtitle="Spellcrafting with AI" />

        <section className="px-[var(--gutter)] pb-[18vh]">
          <div className="mx-auto w-full max-w-[min(92vw,1600px)]">
            <PlayWall />
          </div>
        </section>
      </div>
    </div>
  );
}
