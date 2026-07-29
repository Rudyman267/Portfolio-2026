import React from 'react';
import type { TemplateExtractionResult } from '../../../services/ai-template-service';
import { SECTION_KIND_DEFAULTS } from '../../../data/section-kind-defaults';
import type { Severity } from '../../../types/report.types';

interface ExtractionVerificationProps {
  extraction: TemplateExtractionResult;
  sourceLabel: string;
  saving: boolean;
  onTryAgain: () => void;
  onSaveAndUse: () => void;
  onAdjust: () => void;
}

const truncate = (s: string, n = 80) => {
  if (!s) return '';
  return s.length > n ? `${s.slice(0, n).trimEnd()}…` : s;
};

const SEVERITY_STYLES: Record<Severity, string> = {
  critical: 'bg-error-30/10 text-error-30',
  high: 'bg-caution-30/10 text-caution-30',
  moderate: 'bg-white/[0.06] text-white/[0.55]',
  low: 'bg-success-30/10 text-success-30',
};

const ProvenanceTooltip: React.FC<{ text: string }> = ({ text }) => {
  if (!text) return null;
  return (
    <span
      className="relative group inline-flex items-center"
      title={text}
    >
      <i className="fa-solid fa-circle-info text-white/[0.30] text-[10px] hover:text-white/[0.60] cursor-help" />
      <span
        className="absolute bottom-full right-0 mb-1.5 w-64 px-2.5 py-1.5 rounded-lg bg-[#0A0A0C] border border-white/[0.10] text-[11px] text-white/[0.75] leading-snug opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-20 shadow-lg"
      >
        {text}
      </span>
    </span>
  );
};

const Field: React.FC<{ label: string; value: string }> = ({ label, value }) => (
  <div className="flex items-baseline gap-3">
    <span className="text-[11px] uppercase tracking-wider text-white/[0.35] w-24 shrink-0">
      {label}
    </span>
    <span className="text-[12.5px] text-white/[0.82] leading-snug" title={value}>
      {truncate(value)}
    </span>
  </div>
);

const CardHeader: React.FC<{
  icon: string;
  title: string;
  provenance?: string;
  right?: React.ReactNode;
}> = ({ icon, title, provenance, right }) => (
  <div className="flex items-center justify-between mb-3">
    <div className="flex items-center gap-2">
      <i className={`${icon} text-primary-200 text-[12px]`} />
      <h3 className="text-[11px] uppercase tracking-wider text-white/[0.55] font-semibold">
        {title}
      </h3>
      {provenance && <ProvenanceTooltip text={provenance} />}
    </div>
    {right}
  </div>
);

const ExtractionVerification: React.FC<ExtractionVerificationProps> = ({
  extraction,
  sourceLabel,
  saving,
  onTryAgain,
  onSaveAndUse,
  onAdjust,
}) => {
  const obsCount = extraction.sampleObservations.length;

  return (
    <div className="flex flex-col max-h-[85vh]">
      {/* Header */}
      <div className="px-6 pt-6 pb-4 shrink-0">
        <button
          onClick={onTryAgain}
          className="text-[12px] text-white/[0.45] hover:text-white/[0.75] mb-3 flex items-center gap-1.5 transition-colors cursor-pointer"
        >
          <i className="fa-solid fa-arrow-left text-[10px]" />
          Upload a different sample
        </button>
        <h2 className="text-[16px] font-semibold text-white/[0.92] mb-1">
          Here's what we understood
        </h2>
        <p className="text-[13px] text-white/[0.42]">From {sourceLabel}</p>
      </div>

      {/* Scroll area */}
      <div
        className="px-6 pb-2 space-y-3 overflow-y-auto"
        style={{ scrollbarWidth: 'thin', scrollbarColor: 'rgba(255,255,255,0.06) transparent' }}
      >
        {/* Relevance banner */}
        {extraction.sampleRelevance !== 'high' && (
          <div className="bg-caution-30/10 border border-caution-30/20 rounded-lg p-3 flex items-start gap-2.5">
            <i className="fa-solid fa-triangle-exclamation text-caution-30 text-[12px] mt-0.5" />
            <div className="text-[12px] text-caution-30 leading-snug">
              <span className="font-medium">
                {extraction.sampleRelevance === 'low'
                  ? 'This sample may not be a patrol report.'
                  : 'This sample is only loosely related to patrol reports.'}
              </span>
              {extraction.sampleRelevanceNote && (
                <span className="block text-caution-30/80 mt-0.5">
                  {extraction.sampleRelevanceNote}
                </span>
              )}
              <span className="block text-white/[0.45] mt-0.5">
                You can still proceed with what we extracted.
              </span>
            </div>
          </div>
        )}

        {/* Card 1: READER */}
        <div className="bg-[#1C1C1F] border border-white/[0.06] rounded-xl p-4">
          <CardHeader icon="fa-solid fa-user" title="Reader" provenance={extraction.persona.provenance} />
          <div className="space-y-1.5">
            <Field label="Role" value={extraction.persona.role} />
            <Field label="Primary use" value={extraction.persona.primaryUse} />
            <Field label="Reading time" value={extraction.persona.readingTime} />
            <Field label="Priorities" value={extraction.persona.priorities} />
          </div>
        </div>

        {/* Card 2: VOICE */}
        <div className="bg-[#1C1C1F] border border-white/[0.06] rounded-xl p-4">
          <CardHeader
            icon="fa-solid fa-comment-dots"
            title="Voice"
            provenance={extraction.narrativeStyle.provenance}
          />
          <div className="space-y-1.5">
            <Field label="Voice" value={extraction.narrativeStyle.voice} />
            <Field label="Structure" value={extraction.narrativeStyle.structure} />
            <Field label="Vocabulary" value={extraction.narrativeStyle.vocabulary} />
          </div>
        </div>

        {/* Card 3: SECTIONS */}
        <div className="bg-[#1C1C1F] border border-white/[0.06] rounded-xl p-4">
          <CardHeader
            icon="fa-solid fa-list"
            title="Sections"
            right={
              <span className="text-[11px] text-white/[0.45]">
                {extraction.sections.length} section{extraction.sections.length === 1 ? '' : 's'}
              </span>
            }
          />
          <div className="space-y-1.5">
            {extraction.sections.map((s, i) => {
              const kindLabel = SECTION_KIND_DEFAULTS[s.kind]?.label ?? 'Custom';
              return (
                <div
                  key={i}
                  className="flex items-center gap-2.5 py-1.5 border-b border-white/[0.04] last:border-b-0"
                >
                  <span className="text-[10px] font-mono text-white/[0.30] w-5 shrink-0">
                    {String(i + 1).padStart(2, '0')}
                  </span>
                  <span className="text-[13px] text-white/[0.85] flex-1 truncate" title={s.name}>
                    {s.name}
                  </span>
                  <span className="bg-primary-200/10 text-primary-200 text-[10px] rounded px-1.5 py-0.5 shrink-0">
                    {kindLabel}
                  </span>
                  <div className="flex items-center gap-1.5 w-14 justify-end shrink-0">
                    {s.dataFeeds.images && (
                      <i
                        className="fa-solid fa-image text-white/[0.30] text-[10px]"
                        title="Images from media gallery"
                      />
                    )}
                    {s.dataFeeds.structuredData && (
                      <i
                        className="fa-solid fa-table-cells text-white/[0.30] text-[10px]"
                        title="Structured data"
                      />
                    )}
                    {s.dataFeeds.narrativeContext && (
                      <i
                        className="fa-solid fa-comment text-white/[0.30] text-[10px]"
                        title="Pilot narrative context"
                      />
                    )}
                  </div>
                  <ProvenanceTooltip text={s.provenance} />
                </div>
              );
            })}
          </div>
        </div>

        {/* Card 4: EXAMPLES */}
        <div className="bg-[#1C1C1F] border border-white/[0.06] rounded-xl p-4">
          <CardHeader icon="fa-solid fa-quote-right" title="Examples" />

          {/* Executive summary */}
          <div className="mb-4">
            <div className="text-[11px] uppercase tracking-wider text-white/[0.35] mb-1.5">
              Executive summary
            </div>
            {extraction.sampleExecutiveSummary ? (
              <blockquote
                className="text-[12.5px] text-white/[0.78] italic leading-snug border-l-2 border-white/[0.10] pl-3 line-clamp-3"
                title={extraction.sampleExecutiveSummary}
              >
                {extraction.sampleExecutiveSummary}
              </blockquote>
            ) : (
              <p className="text-[12px] text-white/[0.35] italic">No summary extracted</p>
            )}
          </div>

          {/* Observations */}
          <div>
            <div className="text-[11px] uppercase tracking-wider text-white/[0.35] mb-1.5">
              Observations ({obsCount})
            </div>
            {obsCount === 0 ? (
              <p className="text-[12px] text-white/[0.35] italic">
                No observations extracted — add them later in the editor
              </p>
            ) : (
              <div className="space-y-2">
                {extraction.sampleObservations.map((o, i) => (
                  <div
                    key={i}
                    className="flex items-start gap-2 py-1.5 border-b border-white/[0.04] last:border-b-0"
                  >
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 mb-0.5">
                        <span
                          className="text-[12.5px] text-white/[0.85] font-medium truncate"
                          title={o.title}
                        >
                          {o.title}
                        </span>
                        <span
                          className={`text-[10px] rounded px-1.5 py-0.5 shrink-0 capitalize ${SEVERITY_STYLES[o.severity]}`}
                        >
                          {o.severity}
                        </span>
                      </div>
                      <p
                        className="text-[12px] text-white/[0.55] italic leading-snug"
                        title={o.aiDescription}
                      >
                        {truncate(o.aiDescription)}
                      </p>
                    </div>
                    <div className="pt-0.5 shrink-0">
                      <ProvenanceTooltip text={o.provenance} />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Action bar */}
      <div className="px-6 py-4 border-t border-white/[0.05] flex justify-between items-center shrink-0">
        <button
          onClick={onTryAgain}
          disabled={saving}
          className="text-white/[0.50] hover:text-white/[0.75] disabled:opacity-40 disabled:cursor-not-allowed px-3 py-2 rounded-lg transition-colors duration-150 text-[13px] cursor-pointer flex items-center gap-1.5"
        >
          <i className="fa-solid fa-arrow-left text-[10px]" />
          Try a different sample
        </button>
        <div className="flex items-center gap-2">
          <button
            onClick={onAdjust}
            disabled={saving}
            className="text-primary-200 border border-primary-200/30 hover:border-primary-200/60 disabled:opacity-40 disabled:cursor-not-allowed px-3.5 py-2 rounded-lg transition-colors duration-150 text-[13px] cursor-pointer"
          >
            Adjust in editor
          </button>
          <button
            onClick={onSaveAndUse}
            disabled={saving}
            className="bg-primary-200 hover:bg-primary-200/90 disabled:bg-white/[0.05] disabled:text-white/[0.25] disabled:cursor-not-allowed text-black font-medium px-4 py-2 rounded-lg transition-colors duration-150 text-[13px] cursor-pointer flex items-center gap-2"
          >
            {saving ? (
              <>
                <i className="fa-solid fa-spinner fa-spin text-[12px]" />
                Creating...
              </>
            ) : (
              <>
                Save and use
                <i className="fa-solid fa-arrow-right text-[11px]" />
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ExtractionVerification;
