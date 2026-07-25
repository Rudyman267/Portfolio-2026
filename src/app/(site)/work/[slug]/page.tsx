import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { LirCaseStudy } from "@/components/case-study/LirCaseStudy";
import { LIR_DESIGN } from "@/lib/caseStudies/lirDesign";
import { VERKOS_DESIGN } from "@/lib/caseStudies/verkosDesign";
import type { LirDesign } from "@/lib/caseStudies/lirDesign";

/**
 * Case-study page. The flagship (Live Incidence Response) is authored as typed
 * local content and rendered by <LirCaseStudy> — the light/editorial design
 * recreated from Figma 172:56 (white canvas, blue Tanker headings). Thin studies
 * + the Sanity-driven path derive from this once content lands.
 *
 * (The earlier dark-cinematic <CaseStudy> + blocks remain on disk, unused, in
 * case that direction is revived.)
 */

// Registry of locally-authored case studies, keyed by slug.
const STUDIES: Record<string, LirDesign> = {
  [LIR_DESIGN.slug]: LIR_DESIGN,
  [VERKOS_DESIGN.slug]: VERKOS_DESIGN,
};

export function generateStaticParams() {
  return Object.keys(STUDIES).map((slug) => ({ slug }));
}

export async function generateMetadata(
  props: PageProps<"/work/[slug]">,
): Promise<Metadata> {
  const { slug } = await props.params;
  const study = STUDIES[slug];
  if (!study) return {};
  const title = study.title;
  const description = study.lede;
  return {
    title,
    description,
    openGraph: { title, description },
  };
}

export default async function CaseStudyPage(props: PageProps<"/work/[slug]">) {
  const { slug } = await props.params;
  const study = STUDIES[slug];
  if (!study) notFound();
  return <LirCaseStudy data={study} />;
}
