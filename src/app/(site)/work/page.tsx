import type { Metadata } from "next";
import { sanityFetch } from "@/sanity/live";
import { PROJECTS_QUERY, SITE_SETTINGS_QUERY } from "@/sanity/queries";
import { Container } from "@/components/ui/Container";
import { WorkGrid } from "@/components/sections/WorkGrid";
import { ContactCTA } from "@/components/sections/ContactCTA";
import { FadeIn } from "@/components/motion/FadeIn";

export const metadata: Metadata = {
  title: "Work",
  description: "Selected case studies — process, decisions, and outcomes.",
};

export default async function WorkPage() {
  const [{ data: projects }, { data: settings }] = await Promise.all([
    sanityFetch({ query: PROJECTS_QUERY, tags: ["project"] }),
    sanityFetch({ query: SITE_SETTINGS_QUERY, tags: ["siteSettings"] }),
  ]);

  return (
    <>
      <section className="py-20 sm:py-28">
        <Container>
          <FadeIn>
            <h1 className="text-[var(--step-5)] font-semibold">Work</h1>
            <p className="mt-4 max-w-xl text-[var(--step-1)] text-muted">
              Case studies showing how I think, decide, and ship — from problem
              to outcome.
            </p>
          </FadeIn>
          <div className="mt-16">
            <WorkGrid projects={projects ?? []} showFilter />
          </div>
        </Container>
      </section>
      <ContactCTA email={settings?.email} resumeUrl={settings?.resumeUrl} />
    </>
  );
}
