import type { ReportTemplate, ReportSectionKind } from '../../../types/report.types';
import type { ReportPrintInput } from '../ReportPrintView';

const CONTENT_HINTS: Record<ReportSectionKind, string> = {
  executive_summary: 'AI will write a 3-4 sentence overview of key findings here.',
  patrol_overview: 'Flight statistics and coverage metrics will render here.',
  observations: 'Each detection and pilot-noted finding will render as an observation with images and context.',
  perimeter_status: 'AI will assess overall condition based on observations here.',
  compliance: 'AI will assess findings against applicable standards here.',
  recommendations: 'AI will generate prioritized action items here.',
  custom: 'AI will write content based on the prompt instruction configured for this section.',
};

export function buildTemplatePreviewInput(template: ReportTemplate): ReportPrintInput {
  const sections = template.sections
    .filter((s) => s.enabled)
    .sort((a, b) => a.order - b.order)
    .map((tplSec, idx): NonNullable<ReportPrintInput['sections']>[number] => ({
      id: `preview-${idx}-${tplSec.id}`,
      kind: tplSec.kind,
      name: tplSec.name,
      content: '',
      order: tplSec.order,
      enabled: true,
      structural: {
        maxLength: tplSec.maxLength,
        showsImages: tplSec.dataFeeds.images,
        showsStructuredData: tplSec.dataFeeds.structuredData,
        contentHint: CONTENT_HINTS[tplSec.kind] ?? CONTENT_HINTS.custom,
      },
    }));

  return {
    cover: {
      title: 'PATROL REPORT',
      site: 'Sample site',
      date: 'Date',
      author: 'Author',
    },
    // These remain for old reports without a sections array (fallback rendering path).
    // For template preview they are unused because sections[].structural takes over in Part B.
    executiveSummary: '',
    observations: [],
    recommendations: { immediate: [], shortTerm: [], longTerm: [] },
    sections,
  };
}
