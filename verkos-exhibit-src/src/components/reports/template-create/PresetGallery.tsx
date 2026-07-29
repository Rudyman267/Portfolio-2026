import React from 'react';
import { useNavigate } from '@tanstack/react-router';
import { ReportTemplate, TemplateSection, templateSectionToKind } from '../../../types/report.types';
import { useReportStore } from '../../../store/report.store';
import { SECTION_KIND_DEFAULTS } from '../../../data/section-kind-defaults';

type PresetSection = Omit<TemplateSection, 'id' | 'kind' | 'dataFeeds'>;

interface Preset {
  id: string;
  name: string;
  description: string;
  icon: string;
  iconColor: string;
  iconBg: string;
  sampleExcerpt: string;
  config: {
    persona: NonNullable<ReportTemplate['persona']>;
    narrativeStyle: NonNullable<ReportTemplate['narrativeStyle']>;
    sampleObservations: NonNullable<ReportTemplate['sampleObservations']>;
    sampleExecutiveSummary: string;
    sections: PresetSection[];
    coverStyle: ReportTemplate['coverStyle'];
    toneLabel: string;
  };
}

const PRESETS: Preset[] = [
  {
    id: 'operational-security',
    name: 'Operational security',
    description: 'For shift supervisors managing day-to-day patrols',
    icon: 'fa-solid fa-shield-halved',
    iconColor: 'text-success-30',
    iconBg: 'bg-success-30/10',
    sampleExcerpt:
      'Night patrol covered all five sectors. One critical finding: vehicle-impact damage to perimeter at Sector 3, escalated to site manager and ground team.',
    config: {
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
          aiDescription:
            'Pilot confirmed the white pickup photographed at 06:14 at the east gate was authorized contractor equipment, signed in at 06:00. AI initial classification as unauthorized vehicle overridden by pilot observation. No action required.',
        },
        {
          title: 'Fence damage at Sector 3 — escalated',
          severity: 'critical',
          aiDescription:
            '3-meter section of perimeter fencing at Sector 3 north shows structural deformation consistent with vehicle impact. Pilot noted this was not present during the 22:00 patrol. Ground team dispatched; site manager notified. Recommend immediate physical inspection and temporary barrier placement before next shift.',
        },
        {
          title: 'Two persons near loading bay 4 outside work window',
          severity: 'high',
          aiDescription:
            'AI detected two individuals near loading bay 4 at 23:47, outside scheduled operational hours (06:00–18:00). Pilot could not verify identity from aerial view. Access register shows no authorized personnel in that zone at that time. Security team dispatched for ground-level verification.',
        },
      ],
      sampleExecutiveSummary:
        'Night patrol covered all five sectors. One critical finding: vehicle-impact damage to perimeter at Sector 3, escalated to site manager and ground team. One high-severity flag: unverified personnel near loading bay 4 outside work hours, ground team dispatched. Three moderate items resolved by pilot context — all confirmed authorized activity. Incoming shift should verify ground team resolution at Sector 3 before first patrol.',
      sections: [
        { name: 'Executive summary', description: 'AI-generated overview of key findings', promptInstruction: 'Provide a 3-4 sentence overview of key findings. Prioritize by severity.', enabled: true, order: 1, maxLength: 'standard', toneOverride: 'operational' },
        { name: 'Patrol overview', description: 'Flight statistics and coverage data', promptInstruction: 'Summarize flight duration, waypoints, detection count, and coverage metrics.', enabled: true, order: 2, maxLength: 'brief', toneOverride: 'operational' },
        { name: 'Observations', description: 'Detailed findings with images and context', promptInstruction: 'For each confirmed detection, write a detailed observation including what was detected, where, and AI confidence.', enabled: true, order: 3, maxLength: 'detailed', toneOverride: 'operational' },
        { name: 'Perimeter status', description: 'Overall perimeter condition assessment', promptInstruction: 'Assess the overall perimeter condition based on all observations. Rate each sector.', enabled: true, order: 4, maxLength: 'standard', toneOverride: 'operational' },
        { name: 'Recommendations', description: 'Immediate and long-term action items', promptInstruction: 'Generate actionable recommendations categorized as immediate, short-term, and long-term.', enabled: true, order: 5, maxLength: 'standard', toneOverride: 'operational' },
      ],
      coverStyle: 'gradient',
      toneLabel: 'Operational',
    },
  },
  {
    id: 'executive-briefing',
    name: 'Executive briefing',
    description: 'For C-suite and client-facing periodic reviews',
    icon: 'fa-solid fa-briefcase',
    iconColor: 'text-primary-200',
    iconBg: 'bg-primary-200/10',
    sampleExcerpt:
      'Perimeter integrity was maintained across all sectors during this reporting period. One notable event was identified, verified, and mitigated the same shift.',
    config: {
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
          aiDescription:
            'AI detection flagged a structural integrity concern at the east perimeter during the patrol. On-site response team investigated within 15 minutes and confirmed the condition was consistent with routine wear rather than an active threat. Temporary mitigation applied; full repair scheduled for the next maintenance window. Audit trail available.',
        },
        {
          title: 'Access anomaly — verified authorized',
          severity: 'low',
          aiDescription:
            'An unregistered vehicle was detected near the facility during off-hours. Pilot verification confirmed the vehicle was scheduled contractor equipment with valid access credentials; the registration gap was an administrative oversight since corrected. No security implication.',
        },
      ],
      sampleExecutiveSummary:
        'Perimeter integrity was maintained across all sectors during this reporting period. One notable event — a structural integrity concern at the east perimeter — was identified by AI detection, verified by on-site response within 15 minutes, and mitigated the same shift. A full repair is scheduled. All access-control anomalies were verified against authorized activity with no security implication. Overall security posture: green.',
      sections: [
        { name: 'Executive summary', description: 'High-level overview for stakeholders', promptInstruction: 'Write a concise executive summary suitable for client presentation.', enabled: true, order: 1, maxLength: 'brief', toneOverride: 'executive' },
        { name: 'Observations', description: 'Key findings only', promptInstruction: 'Include only high and critical severity observations.', enabled: true, order: 2, maxLength: 'standard', toneOverride: 'executive' },
        { name: 'Recommendations', description: 'Action items for the client', promptInstruction: 'Focus on actionable items the client can act on.', enabled: true, order: 3, maxLength: 'standard', toneOverride: 'executive' },
      ],
      coverStyle: 'branded',
      toneLabel: 'Executive',
    },
  },
  {
    id: 'regulatory-compliance',
    name: 'Regulatory compliance',
    description: 'For auditors and formal compliance review',
    icon: 'fa-solid fa-scale-balanced',
    iconColor: 'text-caution-30',
    iconBg: 'bg-caution-30/10',
    sampleExcerpt:
      'A patrol was conducted on the date indicated in accordance with the established perimeter inspection protocol. Two findings were recorded; one non-conformance was identified pursuant to Section 4.2.',
    config: {
      persona: {
        role: 'Regulatory auditor or compliance officer',
        primaryUse: 'Formal compliance review; evidentiary record; basis for regulatory filing',
        readingTime: '10-20 minutes; reads fully',
        priorities: 'Completeness, traceability, adherence to standards, audit trail',
      },
      narrativeStyle: {
        voice: 'Formal, neutral, evidentiary. Cites standards explicitly. Uses past-perfect for actions taken.',
        structure: 'Each finding self-contained: what was observed, when, where, against which standard. No narrative flow between findings.',
        vocabulary: 'Use "was observed," "in accordance with," "pursuant to," "finding," "non-conformance." Avoid "I," "we," urgency language.',
      },
      sampleObservations: [
        {
          title: 'Finding 1 — Perimeter fence non-conformance, Sector 3',
          severity: 'high',
          aiDescription:
            'It was observed at 23:14 local time that a 3-meter section of perimeter fencing at Sector 3 (north face) exhibited structural deformation. The condition is a non-conformance with Section 4.2 of the Site Security Protocol, which requires continuous perimeter integrity. Photographic evidence is appended. The condition had been mitigated by temporary barrier placement prior to the conclusion of the patrol period, in accordance with Procedure 7.1.',
        },
        {
          title: 'Finding 2 — Personnel access record, Loading Bay 4',
          severity: 'moderate',
          aiDescription:
            'Two individuals were observed in the vicinity of Loading Bay 4 at 23:47 local time. Cross-reference with the access register maintained pursuant to Section 3.5 indicated no authorized personnel were assigned to that zone during the observed interval. The individuals had departed the area prior to the arrival of the on-site response team. No identification was obtained. The event has been logged for audit purposes.',
        },
      ],
      sampleExecutiveSummary:
        'A patrol was conducted on the date indicated in accordance with the established perimeter inspection protocol. Two findings were recorded during the patrol period. One non-conformance was identified pursuant to Section 4.2 of the Site Security Protocol and mitigated within the patrol window. One additional event was logged for audit purposes. All evidence has been preserved in accordance with the records retention policy.',
      sections: [
        { name: 'Executive summary', description: 'Formal overview for regulatory record', promptInstruction: 'Write a compliance-focused executive summary suitable for regulatory review. Cite protocols and standards where applicable.', enabled: true, order: 1, maxLength: 'brief', toneOverride: 'compliance' },
        { name: 'Patrol overview', description: 'Patrol parameters and coverage data', promptInstruction: 'Document patrol parameters: date, time, coverage area, personnel, equipment used. Use formal record language.', enabled: true, order: 2, maxLength: 'brief', toneOverride: 'compliance' },
        { name: 'Observations', description: 'Self-contained findings with evidentiary detail', promptInstruction: 'Each finding self-contained: what was observed, when, where, against which standard. Cite applicable protocols. Avoid narrative connection between findings.', enabled: true, order: 3, maxLength: 'detailed', toneOverride: 'compliance' },
        { name: 'Compliance', description: 'Assessment against applicable standards', promptInstruction: 'Assess each finding against applicable standards and protocols. Identify non-conformances explicitly.', enabled: true, order: 4, maxLength: 'standard', toneOverride: 'compliance' },
        { name: 'Recommendations', description: 'Required corrective actions', promptInstruction: 'Specify required corrective actions with timelines and responsible parties. Reference applicable protocols.', enabled: true, order: 5, maxLength: 'standard', toneOverride: 'compliance' },
      ],
      coverStyle: 'minimal',
      toneLabel: 'Compliance',
    },
  },
  {
    id: 'infrastructure-inspection',
    name: 'Infrastructure inspection',
    description: 'For site engineers tracking asset condition over time',
    icon: 'fa-solid fa-magnifying-glass',
    iconColor: 'text-orange-400',
    iconBg: 'bg-orange-400/10',
    sampleExcerpt:
      'Inspection covered 12 assets across the north substation. Asset TX-04 shows progression of corrosion since the prior inspection interval; condition rating downgraded from B to C.',
    config: {
      persona: {
        role: 'Site engineer or asset inspector',
        primaryUse: 'Condition assessment; input to maintenance scheduling; trend tracking per asset',
        readingTime: '5-10 minutes; skips to asset-specific findings',
        priorities: 'Asset identifiers, condition ratings, comparison to previous inspections, actions with priorities',
      },
      narrativeStyle: {
        voice: 'Technical, precise, asset-focused. Each finding is a data point about a specific asset.',
        structure: 'Group findings by asset. Each asset: current state, changes since last inspection, recommended actions.',
        vocabulary: 'Use "condition rating," "deterioration," "as-built," "maintenance interval," asset IDs. Avoid unquantified descriptors like "serious" or "minor."',
      },
      sampleObservations: [
        {
          title: 'Asset TX-04 — corrosion progression, condition C',
          severity: 'moderate',
          aiDescription:
            'Asset TX-04 (transformer enclosure, north substation) shows continued surface corrosion on the east-facing panel, with a measurable extension of approximately 40 mm since the prior inspection at maintenance interval M-12. Condition rating downgraded from B to C per the site asset rubric. Corrosion has not yet penetrated the protective coating. Recommended action: scheduled re-coating within the next maintenance interval (M-13) to prevent advancement to condition D.',
        },
        {
          title: 'Asset FN-22 — fastener loss, no change',
          severity: 'low',
          aiDescription:
            'Asset FN-22 (perimeter fence section, west span) shows two missing fasteners on the upper rail, consistent with the as-built tolerance and matching the prior inspection record. No measurable deterioration since the previous interval. Condition rating B (unchanged). No corrective action required at this interval; continue monitoring at standard inspection cadence.',
        },
      ],
      sampleExecutiveSummary:
        'Inspection covered 12 assets across the north substation. Two assets show condition changes since the prior inspection interval. Asset TX-04 downgraded from condition B to C due to corrosion progression; recommended re-coating within the next maintenance interval. Asset GR-07 upgraded to condition A following completion of scheduled repair. Remaining 10 assets unchanged from prior inspection. No assets at condition D or E.',
      sections: [
        { name: 'Executive summary', description: 'Inspection scope and condition summary', promptInstruction: 'Summarize inspection scope, assets covered, and condition rating changes since prior inspection.', enabled: true, order: 1, maxLength: 'brief', toneOverride: 'forensic' },
        { name: 'Patrol overview', description: 'Inspection parameters and asset coverage', promptInstruction: 'Document inspection date, area covered, number of assets inspected, equipment used.', enabled: true, order: 2, maxLength: 'brief', toneOverride: 'forensic' },
        { name: 'Observations', description: 'Asset-grouped findings with condition data', promptInstruction: 'Group findings by asset ID. For each asset: current condition rating, changes since last inspection, measurable observations, recommended actions.', enabled: true, order: 3, maxLength: 'detailed', toneOverride: 'forensic' },
        { name: 'Asset condition summary', description: 'Overall asset portfolio status', promptInstruction: 'Summarize the condition rating distribution across all inspected assets. Note assets requiring action vs stable assets.', enabled: true, order: 4, maxLength: 'standard', toneOverride: 'forensic' },
        { name: 'Recommendations', description: 'Maintenance actions with priorities', promptInstruction: 'Specify maintenance actions per asset, with priority based on condition rating and trend.', enabled: true, order: 5, maxLength: 'standard', toneOverride: 'forensic' },
      ],
      coverStyle: 'minimal',
      toneLabel: 'Inspection',
    },
  },
];

interface PresetGalleryProps {
  onBack: () => void;
  onPicked: () => void;
}

const PresetGallery: React.FC<PresetGalleryProps> = ({ onBack, onPicked }) => {
  const navigate = useNavigate();
  const addTemplate = useReportStore((s) => s.addTemplate);

  const handlePick = (preset: Preset) => {
    const ts = Date.now();
    const sections: TemplateSection[] = preset.config.sections.map((s, idx) => {
      const kind = templateSectionToKind(s.name);
      return {
        ...s,
        id: `sec-${ts}-${idx + 1}`,
        kind,
        dataFeeds: { ...SECTION_KIND_DEFAULTS[kind].dataFeeds },
      };
    });

    const newTemplate: ReportTemplate = {
      id: `tpl-${ts}`,
      name: preset.name,
      description: preset.description,
      status: 'draft',
      previewImageUrl: null,
      isDefault: false,
      sections,
      coverStyle: preset.config.coverStyle,
      pageSize: 'A4',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      persona: preset.config.persona,
      narrativeStyle: preset.config.narrativeStyle,
      sampleObservations: preset.config.sampleObservations,
      sampleExecutiveSummary: preset.config.sampleExecutiveSummary,
    };

    addTemplate(newTemplate);
    onPicked();
    navigate({ to: '/template/$templateId', params: { templateId: newTemplate.id } as never });
  };

  return (
    <div>
      <div className="px-6 pt-6 pb-4">
        <button
          onClick={onBack}
          className="text-[12px] text-white/[0.45] hover:text-white/[0.75] mb-3 flex items-center gap-1.5 transition-colors cursor-pointer"
        >
          <i className="fa-solid fa-arrow-left text-[10px]" />
          Back to options
        </button>
        <h2 className="text-[16px] font-semibold text-white/[0.92] mb-1">Pick a preset</h2>
        <p className="text-[13px] text-white/[0.42]">
          Each preset is fully configured with persona, voice, and sample observations
        </p>
      </div>

      <div
        className="px-6 pb-6 max-h-[calc(85vh-140px)] overflow-y-auto"
        style={{ scrollbarWidth: 'thin', scrollbarColor: 'rgba(255,255,255,0.06) transparent' }}
      >
        <div className="grid grid-cols-2 gap-3">
          {PRESETS.map((preset) => (
            <button
              key={preset.id}
              onClick={() => handlePick(preset)}
              className="bg-[#1C1C1F] border border-white/[0.08] rounded-xl p-4 hover:border-primary-200/30 cursor-pointer transition-colors text-left flex flex-col gap-3 group"
            >
              <div className="flex items-start gap-3">
                <div className={`w-9 h-9 rounded-lg ${preset.iconBg} flex items-center justify-center shrink-0`}>
                  <i className={`${preset.icon} ${preset.iconColor} text-[14px]`} />
                </div>
                <div className="min-w-0 flex-1">
                  <h3 className="text-[14px] font-semibold text-white/[0.90] mb-0.5 leading-tight">
                    {preset.name}
                  </h3>
                  <p className="text-[12px] text-white/[0.45] leading-snug">{preset.description}</p>
                </div>
              </div>

              <div className="bg-[#161618] border border-white/[0.05] rounded-lg p-3 flex gap-2">
                <i className="fa-solid fa-quote-left text-white/[0.18] text-[10px] mt-0.5 shrink-0" />
                <p className="text-[11px] text-white/[0.55] italic leading-snug line-clamp-3">
                  {preset.sampleExcerpt}
                </p>
              </div>

              <div className="flex items-center justify-between mt-auto pt-1">
                <div className="flex items-center gap-2">
                  <span className="text-[11px] text-white/[0.40]">
                    {preset.config.sections.length} sections
                  </span>
                  <span className="text-white/[0.15]">·</span>
                  <span className="bg-white/[0.04] border border-white/[0.06] rounded px-1.5 py-0.5 text-[10px] text-white/[0.55]">
                    {preset.config.toneLabel}
                  </span>
                </div>
                <span className="text-[12px] text-primary-200 font-medium group-hover:translate-x-0.5 transition-transform">
                  Use →
                </span>
              </div>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};

export default PresetGallery;
