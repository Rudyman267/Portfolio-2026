import type { Metadata } from "next";
import { sanityFetch } from "@/sanity/live";
import { PROFILE_QUERY, SITE_SETTINGS_QUERY } from "@/sanity/queries";
import { Container } from "@/components/ui/Container";
import { Tag } from "@/components/ui/Tag";
import { SanityImage } from "@/components/SanityImage";
import { PortableTextRenderer } from "@/components/portable-text/PortableTextRenderer";
import { ContactCTA } from "@/components/sections/ContactCTA";
import { FadeIn } from "@/components/motion/FadeIn";
import { Reveal } from "@/components/motion/Reveal";

export async function generateMetadata(): Promise<Metadata> {
  const { data: profile } = await sanityFetch({
    query: PROFILE_QUERY,
    tags: ["profile"],
    stega: false,
  });
  return {
    title: profile?.seo?.metaTitle ?? "About",
    description:
      profile?.seo?.metaDescription ??
      profile?.headline ??
      "About — AI-native Product Designer who ships code and design.",
  };
}

export default async function AboutPage() {
  const [{ data: profile }, { data: settings }] = await Promise.all([
    sanityFetch({ query: PROFILE_QUERY, tags: ["profile"] }),
    sanityFetch({ query: SITE_SETTINGS_QUERY, tags: ["siteSettings"] }),
  ]);

  return (
    <>
      <section className="py-20 sm:py-28">
        <Container>
          <div className="grid gap-12 lg:grid-cols-[1fr_360px] lg:items-start">
            <FadeIn>
              <h1 className="text-[var(--step-5)] font-semibold">
                {profile?.name ?? "About"}
              </h1>
              {profile?.headline && (
                <p className="mt-4 max-w-xl text-[var(--step-1)] text-muted">
                  {profile.headline}
                </p>
              )}
              {profile?.bio && (
                <div className="mt-8 max-w-2xl">
                  <PortableTextRenderer value={profile.bio} />
                </div>
              )}
            </FadeIn>

            {profile?.portrait && (
              <FadeIn delay={0.08}>
                <div className="overflow-hidden rounded-[var(--radius-xl)] border border-border">
                  <SanityImage
                    image={profile.portrait}
                    sizes="(min-width: 1024px) 360px, 100vw"
                  />
                </div>
              </FadeIn>
            )}
          </div>

          {/* Tools */}
          {profile?.tools && profile.tools.length > 0 && (
            <Reveal className="mt-20">
              <h2 className="text-[var(--step-2)] font-semibold">Tools & stack</h2>
              <div className="mt-5 flex flex-wrap gap-2">
                {profile.tools.map((t) => (
                  <Tag key={t}>{t}</Tag>
                ))}
              </div>
            </Reveal>
          )}

          {/* Skills */}
          {profile?.skills && profile.skills.length > 0 && (
            <Reveal className="mt-16">
              <h2 className="text-[var(--step-2)] font-semibold">Skills</h2>
              <div className="mt-6 grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
                {profile.skills.map((group, i) => (
                  <div key={i}>
                    <h3 className="font-medium">{group.category}</h3>
                    <ul className="mt-2 space-y-1 text-muted">
                      {group.items?.map((it) => <li key={it}>{it}</li>)}
                    </ul>
                  </div>
                ))}
              </div>
            </Reveal>
          )}

          {/* Experience */}
          {profile?.experience && profile.experience.length > 0 && (
            <Reveal className="mt-16">
              <h2 className="text-[var(--step-2)] font-semibold">Experience</h2>
              <div className="mt-6 divide-y divide-border border-t border-border">
                {profile.experience.map((exp, i) => (
                  <div
                    key={i}
                    className="grid gap-2 py-6 sm:grid-cols-[160px_1fr]"
                  >
                    <div className="text-faint">{exp.period}</div>
                    <div>
                      <div className="font-medium">
                        {exp.role}
                        {exp.company && (
                          <span className="text-muted"> · {exp.company}</span>
                        )}
                      </div>
                      {exp.summary && (
                        <p className="mt-1 text-muted">{exp.summary}</p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </Reveal>
          )}
        </Container>
      </section>

      <ContactCTA email={settings?.email} resumeUrl={settings?.resumeUrl} />
    </>
  );
}
