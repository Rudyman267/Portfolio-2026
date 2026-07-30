import type { Metadata } from "next";
import type { CSSProperties } from "react";
import { sanityFetch } from "@/sanity/live";
import { SITE_SETTINGS_QUERY } from "@/sanity/queries";
import { ContactCTA } from "@/components/sections/ContactCTA";
import { WorkShowcase } from "@/components/sections/WorkShowcase";
import { PageHeading } from "@/components/sections/PageHeading";
// client boundary — `ssr:false` dynamic imports can't live in a Server Component
import { PageGlowMount } from "@/components/hero3d/PageGlowMount";
import { PLACEHOLDER_PROJECTS } from "@/lib/placeholderProjects";

export const metadata: Metadata = {
  title: "Work",
  description: "Selected case studies — process, decisions, and outcomes.",
};

export default async function WorkPage() {
  const { data: settings } = await sanityFetch({
    query: SITE_SETTINGS_QUERY,
    tags: ["siteSettings"],
  });

  // Only the studies that actually exist get a card. The placeholder slugs
  // (nightshift/atlas/ember) 404, so they're filtered out rather than shown as
  // dead links on the page whose whole job is to send people INTO the work.
  const projects = PLACEHOLDER_PROJECTS.filter((p) =>
    ["live-incident-response", "verkos-reports"].includes(p.slug),
  );

  return (
    // `work-dark` marks this as a dark route for the header (see Header.tsx);
    // isolate + a solid base so the fixed particle canvas can't bleed onto the
    // footer's own glow.
    // `hero-dark` rescopes the colour tokens to the dark palette (white fg) —
    // without it `text-fg` resolves to the LIGHT theme's near-black and the
    // whole page renders dark-on-dark.
    <div
      data-header-dark
      className="hero-dark relative isolate min-h-svh bg-[#06080c] text-fg"
      // `.hero-dark` sets the accent to electric blue, but this page's whole
      // atmosphere is the orange particle field — so the accent is overridden
      // to the signal orange here. Token-driven, so anything using text-accent
      // (the card eyebrow, title hover) follows automatically.
      style={{ "--color-accent": "255 141 59" } as CSSProperties}
    >
      <PageGlowMount />

      {/* content sits above the fixed field */}
      <div className="relative z-[1]">
        <PageHeading
          title="WORK"
          subtitle="A collection of some of my finest"
        />

        <section className="px-[var(--gutter)] pb-[18vh]">
          <div className="mx-auto w-full max-w-[min(92vw,1600px)]">
            <WorkShowcase projects={projects} />
          </div>
        </section>
      </div>

      <div className="relative z-[1]">
        <ContactCTA email={settings?.email} resumeUrl={settings?.resumeUrl} />
      </div>
    </div>
  );
}
