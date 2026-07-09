import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, ArrowRight } from "lucide-react";
import { sanityFetch } from "@/sanity/live";
import { client } from "@/sanity/client";
import {
  PROJECT_BY_SLUG_QUERY,
  PROJECT_SLUGS_QUERY,
  SITE_SETTINGS_QUERY,
} from "@/sanity/queries";
import { Container } from "@/components/ui/Container";
import { Tag } from "@/components/ui/Tag";
import { SanityImage } from "@/components/SanityImage";
import { PortableTextRenderer } from "@/components/portable-text/PortableTextRenderer";
import { ContactCTA } from "@/components/sections/ContactCTA";
import { FadeIn } from "@/components/motion/FadeIn";

export async function generateStaticParams() {
  const slugs = await client.fetch(PROJECT_SLUGS_QUERY);
  return slugs.filter((s) => s.slug).map((s) => ({ slug: s.slug as string }));
}

export async function generateMetadata(
  props: PageProps<"/work/[slug]">,
): Promise<Metadata> {
  const { slug } = await props.params;
  const { data: project } = await sanityFetch({
    query: PROJECT_BY_SLUG_QUERY,
    params: { slug },
    tags: ["project"],
    stega: false,
  });
  if (!project) return {};
  const title = project.seo?.metaTitle ?? project.title ?? undefined;
  const description =
    project.seo?.metaDescription ?? project.summary ?? undefined;
  return {
    title,
    description,
    openGraph: { title: title ?? undefined, description },
  };
}

function MetaRow({ label, value }: { label: string; value?: string | null }) {
  if (!value) return null;
  return (
    <div>
      <dt className="text-[var(--step--1)] text-faint">{label}</dt>
      <dd className="mt-1 text-fg">{value}</dd>
    </div>
  );
}

export default async function CaseStudyPage(
  props: PageProps<"/work/[slug]">,
) {
  const { slug } = await props.params;
  const [{ data: project }, { data: settings }] = await Promise.all([
    sanityFetch({
      query: PROJECT_BY_SLUG_QUERY,
      params: { slug },
      tags: ["project"],
    }),
    sanityFetch({ query: SITE_SETTINGS_QUERY, tags: ["siteSettings"] }),
  ]);

  if (!project) notFound();

  const roles = project.role?.length ? project.role.join(", ") : null;

  return (
    <article>
      {/* Header */}
      <header className="border-b border-border/60 py-16 sm:py-24">
        <Container>
          <FadeIn>
            <Link
              href="/work"
              className="inline-flex items-center gap-1 text-muted hover:text-fg"
            >
              <ArrowLeft size={16} /> Work
            </Link>
            <h1 className="mt-6 max-w-4xl text-[var(--step-5)] font-semibold">
              {project.title}
            </h1>
            {project.summary && (
              <p className="mt-5 max-w-2xl text-[var(--step-1)] text-muted">
                {project.summary}
              </p>
            )}
          </FadeIn>

          <FadeIn delay={0.08}>
            <dl className="mt-10 grid grid-cols-2 gap-6 sm:grid-cols-4">
              <MetaRow label="Role" value={roles} />
              <MetaRow label="Context" value={project.context} />
              <MetaRow label="Year" value={project.year} />
              <MetaRow label="Timeline" value={project.timeline} />
            </dl>
            {project.tags && project.tags.length > 0 && (
              <div className="mt-6 flex flex-wrap gap-2">
                {project.tags.map((t) => (
                  <Tag key={t}>{t}</Tag>
                ))}
              </div>
            )}
          </FadeIn>
        </Container>
      </header>

      {/* Cover */}
      {project.coverImage && (
        <div className="full-bleed bg-surface-2">
          <SanityImage
            image={project.coverImage}
            priority
            sizes="100vw"
            className="max-h-[80vh] object-cover"
          />
        </div>
      )}

      {/* Metrics */}
      {project.metrics && project.metrics.length > 0 && (
        <Container className="py-16">
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-3">
            {project.metrics.map((mtr, i) => (
              <div
                key={i}
                className="rounded-[var(--radius-lg)] border border-border p-8"
              >
                <div className="text-[var(--step-4)] font-semibold text-accent">
                  {mtr.value}
                </div>
                <div className="mt-1 font-medium">{mtr.label}</div>
                {mtr.description && (
                  <p className="mt-2 text-muted">{mtr.description}</p>
                )}
              </div>
            ))}
          </div>
        </Container>
      )}

      {/* Body */}
      {project.body && (
        <Container className="py-8 pb-24">
          <div className="mx-auto max-w-2xl">
            <PortableTextRenderer value={project.body} />
          </div>
        </Container>
      )}

      {/* Next project */}
      {project.next?.slug && (
        <div className="border-t border-border/60">
          <Container className="py-16">
            <p className="text-[var(--step--1)] text-faint">Next project</p>
            <Link
              href={`/work/${project.next.slug}`}
              className="group mt-2 inline-flex items-center gap-3 text-[var(--step-3)] font-semibold hover:text-accent"
            >
              {project.next.title}
              <ArrowRight
                size={26}
                className="transition-transform group-hover:translate-x-1"
              />
            </Link>
          </Container>
        </div>
      )}

      <ContactCTA email={settings?.email} resumeUrl={settings?.resumeUrl} />
    </article>
  );
}
