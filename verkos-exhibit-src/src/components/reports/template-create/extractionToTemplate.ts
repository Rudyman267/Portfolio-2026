import { ReportTemplate, TemplateSection } from '../../../types/report.types';
import { SECTION_KIND_DEFAULTS } from '../../../data/section-kind-defaults';
import type { TemplateExtractionResult } from '../../../services/ai-template-service';

export function buildTemplateFromExtraction(
  extraction: TemplateExtractionResult,
  sourceLabel: string,
): ReportTemplate {
  const ts = Date.now();
  const nowIso = new Date().toISOString();

  const sections: TemplateSection[] = extraction.sections.map((s, i) => {
    const kindDefaults = SECTION_KIND_DEFAULTS[s.kind] ?? SECTION_KIND_DEFAULTS.custom;
    return {
      id: `sec-${ts}-${i + 1}`,
      kind: s.kind,
      name: s.name,
      description: kindDefaults.description ?? '',
      promptInstruction: s.promptInstruction,
      enabled: true,
      order: i + 1,
      maxLength: s.maxLength,
      toneOverride: 'default',
      dataFeeds: { ...s.dataFeeds },
    };
  });

  return {
    id: `tpl-${ts}`,
    name: `Extracted from ${sourceLabel}`,
    description: `Template extracted from ${sourceLabel}. Review and adjust in the editor.`,
    status: 'draft',
    previewImageUrl: null,
    isDefault: false,
    sections,
    coverStyle: 'gradient',
    pageSize: 'A4',
    createdAt: nowIso,
    updatedAt: nowIso,
    persona: {
      role: extraction.persona.role,
      primaryUse: extraction.persona.primaryUse,
      readingTime: extraction.persona.readingTime,
      priorities: extraction.persona.priorities,
    },
    narrativeStyle: {
      voice: extraction.narrativeStyle.voice,
      structure: extraction.narrativeStyle.structure,
      vocabulary: extraction.narrativeStyle.vocabulary,
    },
    sampleObservations: extraction.sampleObservations.map((o) => ({
      title: o.title,
      severity: o.severity,
      aiDescription: o.aiDescription,
    })),
    sampleExecutiveSummary: extraction.sampleExecutiveSummary,
  };
}
