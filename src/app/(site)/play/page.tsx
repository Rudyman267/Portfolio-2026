import type { Metadata } from "next";
import type { CSSProperties } from "react";
import { sanityFetch } from "@/sanity/live";
import { SITE_SETTINGS_QUERY } from "@/sanity/queries";
import { ContactCTA } from "@/components/sections/ContactCTA";
import { PageHeading } from "@/components/sections/PageHeading";
import { PlayWall } from "@/components/play/PlayWall";
// client boundary — `ssr:false` dynamic imports can't live in a Server Component
import { PageGlowMount } from "@/components/hero3d/PageGlowMount";

export const metadata: Metadata = {
  title: "Play",
  description:
    "AI explorations and playful builds — including The Other Hand, a digital meditation you can play in the browser.",
};

export default async function PlayPage() {
  const { data: settings } = await sanityFetch({
    query: SITE_SETTINGS_QUERY,
    tags: ["siteSettings"],
  });

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

      <div className="relative z-[1]">
        <ContactCTA email={settings?.email} resumeUrl={settings?.resumeUrl} />
      </div>
    </div>
  );
}
