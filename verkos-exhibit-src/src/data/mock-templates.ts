import { ReportTemplate, TemplateSection, templateSectionToKind } from '../types/report.types';
import { SECTION_KIND_DEFAULTS } from './section-kind-defaults';

type RawSection = Omit<TemplateSection, 'kind' | 'dataFeeds'>;
type RawTemplate = Omit<ReportTemplate, 'sections'> & { sections: RawSection[] };

const withKindAndFeeds = (s: RawSection): TemplateSection => {
  const kind = templateSectionToKind(s.name);
  return { ...s, kind, dataFeeds: { ...SECTION_KIND_DEFAULTS[kind].dataFeeds } };
};

const rawTemplates: RawTemplate[] = [
  {
    id: 'tpl-verkos-standard',
    name: 'Verkos standard',
    description:
      'Default report template with gradient cover page, observation blocks, and recommendations. Designed for security patrol and inspection reports.',
    status: 'active',
    previewImageUrl: null,
    isDefault: true,
    sections: [
      { id: 'sec-tpl1-1', name: 'Executive summary', description: 'AI-generated overview of key findings', promptInstruction: 'Provide a 3-4 sentence overview of key findings. Prioritize by severity.', enabled: true, order: 1, maxLength: 'standard', toneOverride: 'default' },
      { id: 'sec-tpl1-2', name: 'Patrol overview', description: 'Flight statistics and coverage data', promptInstruction: 'Summarize flight duration, waypoints, detection count, and coverage metrics.', enabled: true, order: 2, maxLength: 'brief', toneOverride: 'default' },
      { id: 'sec-tpl1-3', name: 'Observations', description: 'Detailed findings with images and context', promptInstruction: 'For each confirmed detection, write a detailed observation including what was detected, where, and AI confidence.', enabled: true, order: 3, maxLength: 'detailed', toneOverride: 'default' },
      { id: 'sec-tpl1-4', name: 'Perimeter status', description: 'Overall perimeter condition assessment', promptInstruction: 'Assess the overall perimeter condition based on all observations. Rate each sector.', enabled: true, order: 4, maxLength: 'standard', toneOverride: 'default' },
      { id: 'sec-tpl1-5', name: 'Recommendations', description: 'Immediate and long-term action items', promptInstruction: 'Generate actionable recommendations categorized as immediate, short-term, and long-term.', enabled: true, order: 5, maxLength: 'standard', toneOverride: 'default' },
    ],
    coverStyle: 'gradient',
    pageSize: 'A4',
    createdAt: '2026-03-01T00:00:00Z',
    updatedAt: '2026-04-10T00:00:00Z',
    persona: {
      role: 'Shift supervisor and security operations lead',
      primaryUse: 'End-of-shift handoff; flagging items for incoming shift and escalating to site manager',
      readingTime: '30-90 seconds to skim; 3-5 minutes if critical items flagged',
      priorities: 'Exceptions over normal ops. Specific locations and times. What needs action, by whom, by when',
    },
    narrativeStyle: {
      voice: 'Direct, declarative, operational. Treats the reader as staff who already know the site. Active voice. Avoids hedging unless genuinely uncertain.',
      structure: 'Lead with highest severity first. Connect observations into a coherent shift narrative — not disconnected paragraphs. End each section with a clear takeaway or next step.',
      vocabulary: 'Use: "contractor," "authorized," "unauthorized," "breached," "confirmed," "dispatched." Avoid: "might," "could possibly," "appears to be," passive voice.',
    },
    sampleObservations: [
      {
        title: 'White contractor vehicle at east gate — authorized',
        severity: 'low',
        aiDescription: 'Pilot confirmed the white pickup photographed at 06:14 at the east gate was authorized contractor equipment, signed in at 06:00. AI initial classification as unauthorized vehicle overridden by pilot observation. No action required.',
      },
      {
        title: 'Fence damage at Sector 3 — escalated',
        severity: 'critical',
        aiDescription: '3-meter section of perimeter fencing at Sector 3 north shows structural deformation consistent with vehicle impact. Pilot noted this was not present during the 22:00 patrol. Ground team dispatched; site manager notified. Recommend immediate physical inspection and temporary barrier placement before next shift.',
      },
      {
        title: 'Two persons near loading bay 4 outside work window',
        severity: 'high',
        aiDescription: 'AI detected two individuals near loading bay 4 at 23:47, outside scheduled operational hours (06:00–18:00). Pilot could not verify identity from aerial view. Access register shows no authorized personnel in that zone at that time. Security team dispatched for ground-level verification.',
      },
    ],
    sampleExecutiveSummary: 'Night patrol covered all five sectors. One critical finding: vehicle-impact damage to perimeter at Sector 3, escalated to site manager and ground team. One high-severity flag: unverified personnel near loading bay 4 outside work hours, ground team dispatched. Three moderate items resolved by pilot context — all confirmed authorized activity. Incoming shift should verify ground team resolution at Sector 3 before first patrol.',
  },
  {
    id: 'tpl-client-branded',
    name: 'Client branded',
    description:
      'White-label template with customizable client logo, colors, and footer. For customer-facing reports.',
    status: 'draft',
    previewImageUrl: null,
    isDefault: false,
    sections: [
      { id: 'sec-tpl2-1', name: 'Executive summary', description: 'High-level overview for stakeholders', promptInstruction: 'Write a concise executive summary suitable for client presentation.', enabled: true, order: 1, maxLength: 'brief', toneOverride: 'executive' },
      { id: 'sec-tpl2-2', name: 'Observations', description: 'Key findings only', promptInstruction: 'Include only high and critical severity observations.', enabled: true, order: 2, maxLength: 'standard', toneOverride: 'executive' },
      { id: 'sec-tpl2-3', name: 'Recommendations', description: 'Action items for the client', promptInstruction: 'Focus on actionable items the client can act on.', enabled: true, order: 3, maxLength: 'standard', toneOverride: 'executive' },
    ],
    coverStyle: 'branded',
    pageSize: 'A4',
    createdAt: '2026-04-05T00:00:00Z',
    updatedAt: '2026-04-05T00:00:00Z',
    persona: {
      role: 'Client executive — facility director, head of security, or VP of operations',
      primaryUse: 'Periodic security posture review; board-ready status; justification for continued investment',
      readingTime: '2-3 minutes for summary; rarely reads full observations unless critical',
      priorities: 'Overall risk posture, trends over time, business impact, value delivered',
    },
    narrativeStyle: {
      voice: 'Polished, executive, reassuring but honest. Writes as if briefing a board: confident, specific, outcome-focused. Avoids jargon the reader would not already know.',
      structure: 'Lead with business outcome ("Perimeter integrity maintained"). Follow with evidence. End forward-looking. Frame findings in business-risk terms, not technical severity labels.',
      vocabulary: 'Use: "perimeter integrity," "security posture," "risk exposure," "coverage," "audit trail." Avoid: operational slang like "dispatched." Translate findings into business language.',
    },
    sampleObservations: [
      {
        title: 'Perimeter integrity event — resolved same-shift',
        severity: 'high',
        aiDescription: 'AI detection flagged a structural integrity concern at the east perimeter during the patrol. On-site response team investigated within 15 minutes and confirmed the condition was consistent with routine wear rather than an active threat. Temporary mitigation applied; full repair scheduled for the next maintenance window. Audit trail available.',
      },
      {
        title: 'Access anomaly — verified authorized',
        severity: 'low',
        aiDescription: 'An unregistered vehicle was detected near the facility during off-hours. Pilot verification confirmed the vehicle was scheduled contractor equipment with valid access credentials; the registration gap was an administrative oversight since corrected. No security implication.',
      },
    ],
    sampleExecutiveSummary: 'Perimeter integrity was maintained across all sectors during this reporting period. One notable event — a structural integrity concern at the east perimeter — was identified by AI detection, verified by on-site response within 15 minutes, and mitigated the same shift. A full repair is scheduled. All access-control anomalies were verified against authorized activity with no security implication. Overall security posture: green.',
  },
];

export const mockTemplates: ReportTemplate[] = rawTemplates.map((t) => ({
  ...t,
  sections: t.sections.map(withKindAndFeeds),
}));

