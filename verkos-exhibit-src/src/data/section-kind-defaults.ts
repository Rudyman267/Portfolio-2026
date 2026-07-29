import { ReportSectionKind, SectionMaxLength, TemplateSectionDataFeeds } from '../types/report.types';

export interface SectionKindDefault {
  label: string;
  description: string;
  dataFeeds: TemplateSectionDataFeeds;
  defaultPromptInstruction: string;
  defaultMaxLength: SectionMaxLength;
}

export const SECTION_KIND_DEFAULTS: Record<ReportSectionKind, SectionKindDefault> = {
  executive_summary: {
    label: 'Executive summary',
    description: 'High-level overview for the reader',
    dataFeeds: { images: false, structuredData: true, narrativeContext: true },
    defaultPromptInstruction:
      'Provide a 3-4 sentence overview of key findings. Prioritize by severity. Lead with what matters most.',
    defaultMaxLength: 'standard',
  },
  patrol_overview: {
    label: 'Patrol overview',
    description: 'Flight statistics and coverage data',
    dataFeeds: { images: false, structuredData: true, narrativeContext: false },
    defaultPromptInstruction:
      'Summarize flight duration, waypoints, detection count, and coverage metrics.',
    defaultMaxLength: 'brief',
  },
  observations: {
    label: 'Observations',
    description: 'Detailed findings with images and pilot context',
    dataFeeds: { images: true, structuredData: true, narrativeContext: true },
    defaultPromptInstruction:
      'For each confirmed detection, write what was detected, where, when, and confidence. Incorporate pilot notes where present.',
    defaultMaxLength: 'detailed',
  },
  perimeter_status: {
    label: 'Perimeter / status assessment',
    description: 'Overall condition assessment by sector',
    dataFeeds: { images: false, structuredData: true, narrativeContext: true },
    defaultPromptInstruction:
      'Assess overall condition based on all observations. Reference sectors and pilot context.',
    defaultMaxLength: 'standard',
  },
  compliance: {
    label: 'Compliance',
    description: 'Findings against applicable standards',
    dataFeeds: { images: false, structuredData: true, narrativeContext: true },
    defaultPromptInstruction:
      'Assess findings against applicable standards. Cite standards explicitly.',
    defaultMaxLength: 'standard',
  },
  recommendations: {
    label: 'Recommendations',
    description: 'Actionable next steps grouped by urgency',
    dataFeeds: { images: false, structuredData: true, narrativeContext: true },
    defaultPromptInstruction:
      'Generate actionable recommendations categorized as immediate (24h), short-term (this week), long-term (this month+).',
    defaultMaxLength: 'standard',
  },
  custom: {
    label: 'Custom',
    description: 'Freeform section — you describe what it should contain',
    dataFeeds: { images: false, structuredData: false, narrativeContext: true },
    defaultPromptInstruction:
      'Write content for this section based on the instruction below.',
    defaultMaxLength: 'standard',
  },
};
