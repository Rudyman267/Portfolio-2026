import React, { useEffect, useMemo, useState } from 'react';
import { ReportTemplate } from '../../../types/report.types';
import { useReportStore } from '../../../store/report.store';
import { mockTemplates } from '../../../data/mock-templates';


/* ─── Shared styling (mirrors Identity / Sections panels) ────────────── */

const fieldLabelClass = 'text-[12px] text-white/[0.45] font-medium block mb-1.5';
const fieldInputClass =
  'bg-[#1C1C1F] border border-white/[0.08] rounded-lg text-[14px] text-white/[0.85] px-3 py-2.5 w-full focus:border-primary-200/40 focus:outline-none focus:ring-1 focus:ring-primary-200/10 transition-colors duration-150';
const fieldTextareaClass =
  'bg-[#1C1C1F] border border-white/[0.08] rounded-lg text-[14px] text-white/[0.85] px-3 py-2.5 w-full focus:border-primary-200/40 focus:outline-none focus:ring-1 focus:ring-primary-200/10 transition-colors duration-150 resize-y';
const focusRingClass = 'focus:outline-none focus-visible:ring-1 focus-visible:ring-primary-200/50';
const groupHeaderClass =
  'text-[11px] text-white/[0.45] font-semibold tracking-[0.08em] uppercase';

/* ─── Types ────────────────────────────────────────────────────────────── */

type Persona = NonNullable<ReportTemplate['persona']>;
type NarrativeStyle = NonNullable<ReportTemplate['narrativeStyle']>;
type SampleObservation = NonNullable<ReportTemplate['sampleObservations']>[number];

interface VoiceForm {
  persona: Persona;
  narrativeStyle: NarrativeStyle;
  sampleObservations: SampleObservation[];
  sampleExecutiveSummary: string;
}

const EMPTY_PERSONA: Persona = { role: '', primaryUse: '', readingTime: '', priorities: '' };
const EMPTY_STYLE: NarrativeStyle = { voice: '', structure: '', vocabulary: '' };

const buildForm = (t: ReportTemplate): VoiceForm => ({
  persona: t.persona ?? { ...EMPTY_PERSONA },
  narrativeStyle: t.narrativeStyle ?? { ...EMPTY_STYLE },
  sampleObservations: t.sampleObservations ? t.sampleObservations.map((s) => ({ ...s })) : [],
  sampleExecutiveSummary: t.sampleExecutiveSummary ?? '',
});

const personaIsComplete = (p: Persona) =>
  !!(p.role.trim() && p.primaryUse.trim() && p.readingTime.trim() && p.priorities.trim());

const styleIsComplete = (s: NarrativeStyle) =>
  !!(s.voice.trim() && s.structure.trim() && s.vocabulary.trim());

/* ─── Presets ──────────────────────────────────────────────────────────── */

interface VoicePreset {
  id: string;
  label: string;
  persona: Persona;
  narrativeStyle: NarrativeStyle;
  sampleObservations: SampleObservation[];
  sampleExecutiveSummary: string;
}

// Operational + Executive sourced from existing mock templates so chip semantics
// stay consistent with creation-picker presets.
const operationalSrc = mockTemplates.find((t) => t.id === 'tpl-verkos-standard');
const executiveSrc = mockTemplates.find((t) => t.id === 'tpl-client-branded');

const PRESETS: VoicePreset[] = [
  {
    id: 'operational',
    label: 'Operational',
    persona: operationalSrc?.persona ?? { ...EMPTY_PERSONA },
    narrativeStyle: operationalSrc?.narrativeStyle ?? { ...EMPTY_STYLE },
    sampleObservations: operationalSrc?.sampleObservations ?? [],
    sampleExecutiveSummary: operationalSrc?.sampleExecutiveSummary ?? '',
  },
  {
    id: 'executive',
    label: 'Executive',
    persona: executiveSrc?.persona ?? { ...EMPTY_PERSONA },
    narrativeStyle: executiveSrc?.narrativeStyle ?? { ...EMPTY_STYLE },
    sampleObservations: executiveSrc?.sampleObservations ?? [],
    sampleExecutiveSummary: executiveSrc?.sampleExecutiveSummary ?? '',
  },
  {
    id: 'compliance',
    label: 'Compliance',
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
  },
  {
    id: 'inspection',
    label: 'Inspection',
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
  },
];

const presetEquals = (form: VoiceForm, p: VoicePreset) =>
  JSON.stringify(form.persona) === JSON.stringify(p.persona) &&
  JSON.stringify(form.narrativeStyle) === JSON.stringify(p.narrativeStyle) &&
  JSON.stringify(form.sampleObservations) === JSON.stringify(p.sampleObservations) &&
  form.sampleExecutiveSummary === p.sampleExecutiveSummary;

const formIsEmpty = (f: VoiceForm) =>
  !personaIsComplete(f.persona) &&
  f.persona.role === '' && f.persona.primaryUse === '' && f.persona.readingTime === '' && f.persona.priorities === '' &&
  !styleIsComplete(f.narrativeStyle) &&
  f.narrativeStyle.voice === '' && f.narrativeStyle.structure === '' && f.narrativeStyle.vocabulary === '' &&
  f.sampleObservations.length === 0 &&
  f.sampleExecutiveSummary === '';

/* ─── Group header (collapsible) ───────────────────────────────────────── */

const GroupHeader: React.FC<{
  label: string;
  expanded: boolean;
  preview?: string | null;
  onToggle: () => void;
}> = ({ label, expanded, preview, onToggle }) => (
  <button
    type="button"
    onClick={onToggle}
    className={`w-full flex items-center gap-2 text-left py-1.5 -mx-1 px-1 rounded hover:bg-white/[0.02] transition-colors duration-150 ${focusRingClass}`}
  >
    <span className={groupHeaderClass}>{label}</span>
    {!expanded && preview && (
      <span className="text-[12px] text-white/[0.40] truncate flex-1 min-w-0">· {preview}</span>
    )}
    <i
      className={`fa-solid fa-chevron-down text-[10px] text-white/[0.30] ml-auto transition-transform duration-150 ${
        expanded ? 'rotate-180' : ''
      }`}
    />
  </button>
);

/* ─── Main panel ───────────────────────────────────────────────────────── */

const TemplateVoicePanel: React.FC<{ template: ReportTemplate }> = ({ template }) => {
  const updateTemplate = useReportStore((s) => s.updateTemplate);

  const [form, setForm] = useState<VoiceForm>(() => buildForm(template));

  // UI state
  const [presetPickerOpen, setPresetPickerOpen] = useState(false);
  const [confirmingPreset, setConfirmingPreset] = useState<VoicePreset | null>(null);
  const [readerExpanded, setReaderExpanded] = useState<boolean>(() => !personaIsComplete(buildForm(template).persona));
  const [styleExpanded, setStyleExpanded] = useState<boolean>(() => !styleIsComplete(buildForm(template).narrativeStyle));
  

  // Reset form when template id changes
  useEffect(() => {
    const next = buildForm(template);
    setForm(next);
    setReaderExpanded(!personaIsComplete(next.persona));
    setStyleExpanded(!styleIsComplete(next.narrativeStyle));
    setPresetPickerOpen(false);
    setConfirmingPreset(null);
  }, [template.id]);

  const templateForm = useMemo(() => buildForm(template), [template]);
  const hasChanges = useMemo(
    () => JSON.stringify(form) !== JSON.stringify(templateForm),
    [form, templateForm],
  );

  const personaComplete = personaIsComplete(form.persona);
  const styleComplete = styleIsComplete(form.narrativeStyle);
  const personaApplied = personaComplete && styleComplete;

  /* ─── Preset handling ────────────────────────────────────────────── */

  const applyPreset = (p: VoicePreset) => {
    setForm({
      persona: { ...p.persona },
      narrativeStyle: { ...p.narrativeStyle },
      sampleObservations: p.sampleObservations.map((s) => ({ ...s })),
      sampleExecutiveSummary: p.sampleExecutiveSummary,
    });
    setReaderExpanded(false);
    setStyleExpanded(false);
    setPresetPickerOpen(false);
    setConfirmingPreset(null);
  };

  const handlePresetClick = (p: VoicePreset) => {
    const matchesAny = PRESETS.some((preset) => presetEquals(form, preset));
    const empty = formIsEmpty(form);
    if (matchesAny || empty) {
      applyPreset(p);
    } else {
      setConfirmingPreset(p);
    }
  };

  /* ─── Save / reset ────────────────────────────────────────────────── */

  const handleSave = () => {
    updateTemplate(template.id, {
      persona: form.persona,
      narrativeStyle: form.narrativeStyle,
      sampleObservations: form.sampleObservations,
      sampleExecutiveSummary: form.sampleExecutiveSummary,
    });
  };

  const handleReset = () => {
    setForm(buildForm(template));
  };

  /* ─── Previews ─────────────────────────────────────────────────────── */

  const readerPreview = useMemo(() => {
    if (!form.persona.role && !form.persona.primaryUse) return null;
    const role = form.persona.role || '—';
    const use = form.persona.primaryUse
      ? form.persona.primaryUse.length > 30
        ? form.persona.primaryUse.slice(0, 30) + '…'
        : form.persona.primaryUse
      : '';
    return use ? `${role} · ${use}` : role;
  }, [form.persona]);

  const stylePreview = useMemo(() => {
    if (!form.narrativeStyle.voice) return null;
    return form.narrativeStyle.voice.length > 60
      ? form.narrativeStyle.voice.slice(0, 60) + '…'
      : form.narrativeStyle.voice;
  }, [form.narrativeStyle]);

  

  return (
    <div className="pb-20">
      {/* Zone A — Header + status */}
      <h2 className="text-[20px] font-semibold text-white/[0.92] mb-1">Voice</h2>
      <p className="text-[13px] text-white/[0.45] mb-4">
        Reader persona and narrative style
      </p>

      <div className="flex items-center justify-between gap-3 mb-6">
        <div className="flex items-center gap-2">
          <span
            aria-hidden
            className={`w-2 h-2 rounded-full ${personaApplied ? 'bg-success-30' : 'bg-caution-30'}`}
          />
          <span className="text-[13px] text-white/[0.65]">
            {personaApplied ? 'Persona applied' : 'Persona not fully set'}
          </span>
        </div>
        <button
          type="button"
          onClick={() => setPresetPickerOpen((o) => !o)}
          className={`flex items-center gap-1.5 text-[12px] text-primary-200 hover:text-primary-100 px-2 py-1 rounded-md hover:bg-primary-200/5 transition-colors duration-150 ${focusRingClass} cursor-pointer`}
        >
          <i className="fa-solid fa-palette text-[11px]" />
          Apply preset
        </button>
      </div>

      {/* Zone B — Inline preset picker */}
      {presetPickerOpen && (
        <div className="bg-[#1C1C1F] border border-white/[0.06] rounded-lg p-3 mb-6 space-y-2.5">
          <div className="flex items-center justify-between">
            <span className="text-[12px] text-white/[0.55]">Pick a starting point:</span>
            <button
              type="button"
              onClick={() => {
                setPresetPickerOpen(false);
                setConfirmingPreset(null);
              }}
              className={`text-[12px] text-white/[0.45] hover:text-white/[0.75] transition-colors duration-150 ${focusRingClass} rounded cursor-pointer`}
            >
              Cancel
            </button>
          </div>
          <div className="flex flex-wrap gap-2">
            {PRESETS.map((p) => {
              const selected = presetEquals(form, p);
              return (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => handlePresetClick(p)}
                  className={`rounded-lg px-3 py-1.5 text-[12px] cursor-pointer transition-colors duration-150 ${
                    selected
                      ? 'bg-primary-200/10 border border-primary-200/30 text-primary-200'
                      : 'bg-[#161618] border border-white/[0.08] text-white/[0.65] hover:border-white/[0.18] hover:text-white/[0.85]'
                  }`}
                >
                  {p.label}
                </button>
              );
            })}
          </div>

          {confirmingPreset && (
            <div className="mt-2 bg-[#161618] border border-caution-30/30 rounded-lg p-3 space-y-2">
              <p className="text-[13px] text-white/[0.85] font-medium">Replace current values?</p>
              <p className="text-[12px] text-white/[0.45]">
                Your current persona, narrative style, and samples will be lost.
              </p>
              <div className="flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setConfirmingPreset(null)}
                  className={`text-white/[0.55] hover:text-white/[0.85] px-3 py-1.5 rounded-lg text-[12px] transition-colors duration-150 ${focusRingClass} cursor-pointer`}
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={() => applyPreset(confirmingPreset)}
                  className={`bg-caution-30 text-[#0F0F11] px-3 py-1.5 rounded-lg text-[12px] font-medium hover:opacity-90 transition-opacity duration-150 ${focusRingClass} cursor-pointer`}
                >
                  Replace
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Zone C — Reader */}
      <section className="mb-6">
        <GroupHeader
          label="Reader"
          expanded={readerExpanded}
          preview={readerPreview}
          onToggle={() => setReaderExpanded((v) => !v)}
        />
        {readerExpanded && (
          <div className="mt-3 space-y-3">
            <div>
              <label className={fieldLabelClass}>Role</label>
              <input
                type="text"
                value={form.persona.role}
                onChange={(e) => setForm((f) => ({ ...f, persona: { ...f.persona, role: e.target.value } }))}
                className={fieldInputClass}
                placeholder="e.g., Shift supervisor and security operations lead"
              />
            </div>
            <div>
              <label className={fieldLabelClass}>Primary use</label>
              <textarea
                value={form.persona.primaryUse}
                onChange={(e) => setForm((f) => ({ ...f, persona: { ...f.persona, primaryUse: e.target.value } }))}
                className={`${fieldTextareaClass} min-h-[60px]`}
                rows={2}
                placeholder="When and why does this reader pick up the report?"
              />
            </div>
            <div>
              <label className={fieldLabelClass}>Reading time</label>
              <input
                type="text"
                value={form.persona.readingTime}
                onChange={(e) => setForm((f) => ({ ...f, persona: { ...f.persona, readingTime: e.target.value } }))}
                className={fieldInputClass}
                placeholder="e.g., 30-90 seconds to skim"
              />
            </div>
            <div>
              <label className={fieldLabelClass}>Priorities</label>
              <textarea
                value={form.persona.priorities}
                onChange={(e) => setForm((f) => ({ ...f, persona: { ...f.persona, priorities: e.target.value } }))}
                className={`${fieldTextareaClass} min-h-[60px]`}
                rows={2}
                placeholder="What does this reader most need to know?"
              />
            </div>
          </div>
        )}
      </section>

      {/* Zone D — Style */}
      <section className="mb-6">
        <GroupHeader
          label="Style"
          expanded={styleExpanded}
          preview={stylePreview}
          onToggle={() => setStyleExpanded((v) => !v)}
        />
        {styleExpanded && (
          <div className="mt-3 space-y-3">
            <div>
              <label className={fieldLabelClass}>Voice</label>
              <textarea
                value={form.narrativeStyle.voice}
                onChange={(e) => setForm((f) => ({ ...f, narrativeStyle: { ...f.narrativeStyle, voice: e.target.value } }))}
                className={`${fieldTextareaClass} min-h-[80px]`}
                rows={3}
                placeholder="Tone, perspective, formality."
              />
            </div>
            <div>
              <label className={fieldLabelClass}>Structure</label>
              <textarea
                value={form.narrativeStyle.structure}
                onChange={(e) => setForm((f) => ({ ...f, narrativeStyle: { ...f.narrativeStyle, structure: e.target.value } }))}
                className={`${fieldTextareaClass} min-h-[80px]`}
                rows={3}
                placeholder="How findings are organized and connected."
              />
            </div>
            <div>
              <label className={fieldLabelClass}>Vocabulary</label>
              <textarea
                value={form.narrativeStyle.vocabulary}
                onChange={(e) => setForm((f) => ({ ...f, narrativeStyle: { ...f.narrativeStyle, vocabulary: e.target.value } }))}
                className={`${fieldTextareaClass} min-h-[80px]`}
                rows={3}
                placeholder="Words to use; words to avoid."
              />
            </div>
          </div>
        )}
      </section>

      {/* Zone F — Sticky save bar */}
      {hasChanges && (
        <div className="sticky bottom-0 bg-[#0F0F11]/95 backdrop-blur-sm border-t border-white/[0.06] -mx-8 px-8 py-3 flex justify-end gap-3">
          <button
            type="button"
            onClick={handleReset}
            className={`text-white/[0.50] hover:text-white/[0.75] px-4 py-2 rounded-lg transition-colors duration-150 ${focusRingClass} cursor-pointer`}
          >
            Reset
          </button>
          <button
            type="button"
            onClick={handleSave}
            className={`bg-primary-200 text-white px-4 py-2 rounded-lg font-medium hover:bg-primary-100 transition-colors duration-150 ${focusRingClass} cursor-pointer`}
          >
            Save changes
          </button>
        </div>
      )}
    </div>
  );
};

export default TemplateVoicePanel;
