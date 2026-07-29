import React, { useState, useCallback, useMemo, useRef, useEffect } from 'react';
import { useNavigate } from '@tanstack/react-router';
import { motion, useReducedMotion, AnimatePresence } from 'framer-motion';
import { Report, ReportProfile, Observation, ObservationImage, ReportSection } from '../../types/report.types';
import ExecutiveSummary from './ExecutiveSummary';
import PatrolOverview from './PatrolOverview';
import ObservationBlock from './ObservationBlock';
import RecommendationsSection from './RecommendationsSection';
import PageTransition from './PageTransition';
import ReportPrintView from './ReportPrintView';
import AiAssistButton from './AiAssistButton';
import MediaGallery, { type GalleryImage } from './MediaGallery';
import MediaViewer from './MediaViewer';
import { openReportPrintWindow, reportToPrintInput } from '../../services/report-print';
import { useReportStore } from '../../store/report.store';
import { useToast } from '@libs/shared/ui/fb-components/Toast';
import { assistSection, type AiError } from '../../services/ai-report-service';

const sectionContainerVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.1, delayChildren: 0.1 } },
};

const sectionVariants = {
  hidden: { opacity: 0, y: 10 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.3, ease: [0.25, 0.1, 0.25, 1] as const } },
};

interface ReportReviewProps {
  report: Report;
  defaultView?: 'edit' | 'preview';
}

const profileLabel: Record<ReportProfile, string> = {
  full_operational: 'Full operational',
  executive_summary: 'Executive summary',
  compliance: 'Compliance',
  incident: 'Incident',
  shift_summary: 'Shift summary',
};

const scrollbarStyle = { scrollbarWidth: 'thin' as const, scrollbarColor: 'rgba(255,255,255,0.10) transparent' };

const DEMO_SUMMARY = 'Scheduled morning patrol of the east perimeter completed. The M4TD drone completed a full sweep of all 24 waypoints in 12 minutes 45 seconds. AI analysis identified 14 detections across 187 captured images. 3 observations require follow-up. Overall perimeter status is assessed as operational with targeted attention required at the east gate and south fence section.';

const DEMO_OBS_DESCRIPTIONS: Record<number, string> = {
  1: "A white pickup truck was detected stationary approximately 12 metres from the eastern perimeter gate. The vehicle's license plate is partially obscured by the capture angle. Cross-referencing against the registered fleet database returned no match.",
  2: 'Chain-link deformation detected along the southern boundary perimeter fence. The estimated ground-level gap measures approximately 0.5 metres. The deformation pattern is consistent with progressive mechanical stress rather than deliberate forced entry.',
  3: 'Two cement mixer trucks and one forklift identified in the northern loading bay. All vehicles are stationary. Equipment configuration matches the construction crew staging pattern observed during the previous seven patrol cycles.',
};

const DEMO_RECS_SHORT = [
  "Cross-reference white pickup truck against today's site access register and CCTV footage",
  'Dispatch ground security to verify vehicle identity at east gate',
  'Schedule ground inspection of south boundary fence within 24 hours',
];

const DEMO_RECS_LONG = [
  'Install secondary sensor coverage on east gate approach',
  'Establish monthly fence integrity scoring baseline from aerial imagery',
];

interface CustomSection {
  id: string;
  name: string;
  content: string;
  order: number;
}

const ReportReview: React.FC<ReportReviewProps> = ({ report, defaultView = 'edit' }) => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const shouldReduce = useReducedMotion();
  const updateReport = useReportStore((s) => s.updateReport);
  const deleteReportAction = useReportStore((s) => s.deleteReport);
  const galleryImages = useReportStore((s) => s.galleryImages);
  const agents = useReportStore((s) => s.agents);
  const sites = useReportStore((s) => s.sites);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [showPublishConfirm, setShowPublishConfirm] = useState(false);

  // ─── Editable state ─────────────────────────────────────────────
  const [editableReport, setEditableReport] = useState<Report>(() => ({
    ...report,
    observations: report.observations.map((o) => ({ ...o })),
    sections: report.sections ? report.sections.map((s) => ({ ...s })) : [],
    customSections: report.customSections ? [...report.customSections] : [],
  }));
  const [editingTitle, setEditingTitle] = useState(false);
  const titleRef = useRef<HTMLInputElement>(null);

  const hasUnsaved = useMemo(() => JSON.stringify(editableReport) !== JSON.stringify(report), [editableReport, report]);
  const isDraft = editableReport.status === 'draft_ready';

  // ─── Gallery & viewer state ─────────────────────────────────────
  const [galleryCollapsed, setGalleryCollapsed] = useState(false);
  const [viewerIndex, setViewerIndex] = useState<number | null>(null);

  // ─── Update helpers ─────────────────────────────────────────────
  const updateSummary = useCallback((summary: string) => setEditableReport((r) => ({ ...r, executiveSummary: summary })), []);
  const updateObservation = useCallback((obsId: string, updates: Partial<Observation>) =>
    setEditableReport((r) => ({
      ...r,
      observations: r.observations.map((o) => (o.id === obsId ? { ...o, ...updates } : o)),
    })),
  []);
  const updateShortTerm = useCallback((items: string[]) => setEditableReport((r) => ({ ...r, shortTermRecommendations: items })), []);
  const updateLongTerm = useCallback((items: string[]) => setEditableReport((r) => ({ ...r, longTermRecommendations: items })), []);

  // ─── Observation CRUD ───────────────────────────────────────────
  const handleAddObservation = useCallback(() => {
    const newObs: Observation = {
      id: `obs-${Date.now()}`,
      number: editableReport.observations.length + 1,
      title: '',
      severity: 'low',
      status: 'acknowledged',
      aiDescription: '',
      pilotContext: null,
      rawImageUrl: null,
      annotatedImageUrl: null,
      imageCaption: '',
      confidence: 0,
      timestamp: new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false }),
    };
    setEditableReport((r) => ({ ...r, observations: [...r.observations, newObs] }));
  }, [editableReport.observations.length]);

  const handleDeleteObservation = useCallback((obsId: string) => {
    setEditableReport((r) => ({
      ...r,
      observations: r.observations
        .filter((o) => o.id !== obsId)
        .map((o, i) => ({ ...o, number: i + 1 })),
    }));
  }, []);

  const handleImageAttach = useCallback((obsId: string, rawUrl: string | null, annotatedUrl: string | null) => {
    updateObservation(obsId, { rawImageUrl: rawUrl, annotatedImageUrl: annotatedUrl });
  }, [updateObservation]);

  const handleImagesChange = useCallback((obsId: string, images: ObservationImage[]) => {
    updateObservation(obsId, {
      images,
      rawImageUrl: images[0]?.url ?? null,
      annotatedImageUrl: images[1]?.url ?? null,
    });
  }, [updateObservation]);

  // ─── Observation reorder ────────────────────────────────────────
  const handleMoveObservation = useCallback((obsId: string, direction: 'up' | 'down') => {
    setEditableReport((r) => {
      const obs = [...r.observations];
      const idx = obs.findIndex((o) => o.id === obsId);
      if (idx === -1) return r;
      const targetIdx = direction === 'up' ? idx - 1 : idx + 1;
      if (targetIdx < 0 || targetIdx >= obs.length) return r;
      [obs[idx], obs[targetIdx]] = [obs[targetIdx], obs[idx]];
      obs.forEach((o, i) => { o.number = i + 1; });
      return { ...r, observations: obs };
    });
  }, []);

  // ─── Attach image from viewer ───────────────────────────────────
  const handleAttachFromViewer = useCallback((imageId: string, obsId: string) => {
    const galImg = galleryImages.find((g) => g.id === imageId);
    if (!galImg) return;
    setEditableReport((r) => ({
      ...r,
      observations: r.observations.map((o) => {
        if (o.id !== obsId) return o;
        const existingImages = o.images?.length ? [...o.images] : [
          ...(o.rawImageUrl ? [{ id: 'raw', url: o.rawImageUrl, label: 'Raw capture' }] : []),
          ...(o.annotatedImageUrl ? [{ id: 'annotated', url: o.annotatedImageUrl, label: 'AI annotated', confidence: o.confidence }] : []),
        ];
        const newImg = { id: galImg.id, url: galImg.url, label: `Image ${existingImages.length + 1}`, timestamp: galImg.timestamp };
        const updated = [...existingImages, newImg];
        return { ...o, images: updated, rawImageUrl: updated[0]?.url ?? null, annotatedImageUrl: updated[1]?.url ?? null };
      }),
    }));
  }, []);

  const handleAddCustomSection = useCallback(() => {
    const newSection: CustomSection = {
      id: `cs-${Date.now()}`,
      name: '',
      content: '',
      order: (editableReport.customSections?.length ?? 0) + 1,
    };
    setEditableReport((r) => ({ ...r, customSections: [...(r.customSections || []), newSection] }));
  }, [editableReport.customSections?.length]);

  const updateCustomSection = useCallback((sectionId: string, updates: Partial<CustomSection>) => {
    setEditableReport((r) => ({
      ...r,
      customSections: (r.customSections || []).map((s) => (s.id === sectionId ? { ...s, ...updates } : s)),
    }));
  }, []);

  const deleteCustomSection = useCallback((sectionId: string) => {
    setEditableReport((r) => ({
      ...r,
      customSections: (r.customSections || []).filter((s) => s.id !== sectionId),
    }));
  }, []);

  // ─── Save, publish & download ───────────────────────────────────
  const handleSave = useCallback(() => {
    updateReport(report.id, editableReport);
    toast.success(isDraft ? 'Draft saved' : 'Report saved');
  }, [editableReport, report.id, updateReport, toast, isDraft]);

  const handlePublish = useCallback(() => {
    const updated = { ...editableReport, status: 'finalized' as const };
    setEditableReport(updated);
    updateReport(report.id, updated);
    setShowPublishConfirm(false);
    toast.success('Report published');
  }, [editableReport, report.id, updateReport, toast]);

  // ─── Section content helpers (before AI handlers that depend on them) ──
  const updateSectionContent = useCallback((sectionId: string, content: string) => {
    setEditableReport((r) => ({
      ...r,
      sections: (r.sections || []).map((s) => s.id === sectionId ? { ...s, content } : s),
    }));
  }, []);

  const updateSectionName = useCallback((sectionId: string, name: string) => {
    setEditableReport((r) => ({
      ...r,
      sections: (r.sections || []).map((s) => s.id === sectionId ? { ...s, name } : s),
    }));
  }, []);

  // ─── AI assist handlers ─────────────────────────────────────────
  const currentAgent = useMemo(() => agents.find(a => a.id === editableReport.agentId), [agents, editableReport.agentId]);
  const currentSite = useMemo(() => sites.find(s => editableReport.siteName.includes(s.name)) || sites[0], [sites, editableReport.siteName]);

  const templates = useReportStore((s) => s.templates);

  const handleAiAssistSummary = useCallback(async () => {
    if (!currentAgent || !currentSite) return;
    try {
      const tpl = templates.find(t => t.id === editableReport.templateId);
      const tplSec = tpl?.sections.find(s => /executive|summary/i.test(s.name));
      const result = await assistSection({
        target: 'executive_summary',
        currentDraft: editableReport.executiveSummary,
        promptInstruction: tplSec?.promptInstruction,
        maxLength: tplSec?.maxLength,
        toneOverride: tplSec?.toneOverride,
        agent: currentAgent,
        site: currentSite,
        report: editableReport,
        template: tpl,
      });
      if (result.content) {
        setEditableReport((r) => ({ ...r, executiveSummary: result.content! }));
      }
    } catch (err: any) {
      if (err?.type === 'credit_limit') toast.error('Credit limit reached');
      else toast.error('Generation failed');
    }
  }, [currentAgent, currentSite, editableReport, templates, toast]);

  const handleAiAssistObservation = useCallback(async (obsId: string, _obsNumber: number) => {
    if (!currentAgent || !currentSite) return;
    const obs = editableReport.observations.find(o => o.id === obsId);
    if (!obs) return;

    if (!obs.title.trim() && !obs.pilotContext?.trim()) {
      toast.error('Add a title or pilot note before generating');
      return;
    }

    const imageUrls = (obs.images || []).map(i => i.url);
    const imageNotes = (obs.images || [])
      .map(img => {
        const galImg = galleryImages.find(g => g.id === img.id);
        return galImg?.pilotNote || '';
      })
      .filter(n => n.length > 0);

    // Pull the matched detection event name off the first linked gallery image
    const matchedEvent = obs.images?.[0]
      ? galleryImages.find(g => g.id === obs.images![0].id)?.detectionLabel ?? undefined
      : undefined;

    try {
      const tpl = templates.find(t => t.id === editableReport.templateId);
      const result = await assistSection({
        target: 'observation_description',
        currentDraft: obs.aiDescription,
        agent: currentAgent,
        site: currentSite,
        report: editableReport,
        template: tpl,
        observation: {
          number: obs.number,
          title: obs.title,
          severity: obs.severity,
          imageLabels: (obs.images || []).map(i => i.label),
          imageUrls,
          detectionLabel: matchedEvent ?? null,
          pilotContext: obs.pilotContext || '',
          imageNotes,
          matchedEvent,
        },
      });
      if (result.content) {
        setEditableReport((r) => ({
          ...r,
          observations: r.observations.map((o) => (o.id === obsId ? { ...o, aiDescription: result.content! } : o)),
        }));
      }
    } catch (err: any) {
      if (err?.type === 'credit_limit') toast.error('Credit limit reached');
      else toast.error('Generation failed');
    }
  }, [currentAgent, currentSite, editableReport, galleryImages, templates, toast]);

  const handleAiAssistRecs = useCallback(async () => {
    if (!currentAgent || !currentSite) return;
    const currentDraftText = [
      editableReport.shortTermRecommendations.length > 0
        ? 'Immediate/short-term:\n' + editableReport.shortTermRecommendations.map(r => `- ${r}`).join('\n')
        : '',
      editableReport.longTermRecommendations.length > 0
        ? 'Long-term:\n' + editableReport.longTermRecommendations.map(r => `- ${r}`).join('\n')
        : '',
    ].filter(Boolean).join('\n\n');

    try {
      const tpl = templates.find(t => t.id === editableReport.templateId);
      const result = await assistSection({
        target: 'recommendations',
        currentDraft: currentDraftText,
        agent: currentAgent,
        site: currentSite,
        report: editableReport,
        template: tpl,
      });
      setEditableReport((r) => ({
        ...r,
        shortTermRecommendations: [...(result.immediate || []), ...(result.shortTerm || [])],
        longTermRecommendations: result.longTerm || [],
      }));
    } catch (err: any) {
      if (err?.type === 'credit_limit') toast.error('Credit limit reached');
      else toast.error('Generation failed');
    }
  }, [currentAgent, currentSite, editableReport, templates, toast]);

  const handleAiAssistTextSection = useCallback(async (sectionId: string, kind: string, sectionName: string) => {
    if (!currentAgent || !currentSite) return;
    const section = editableReport.sections?.find(s => s.id === sectionId);
    const template = templates.find(t => t.id === editableReport.templateId);
    const tplSection = template?.sections.find(s => s.id === section?.templateSectionId);
    try {
      const result = await assistSection({
        target: kind === 'perimeter_status' ? 'perimeter_status' : kind === 'compliance' ? 'compliance' : 'custom',
        sectionName,
        currentDraft: section?.content || '',
        promptInstruction: tplSection?.promptInstruction,
        maxLength: tplSection?.maxLength,
        toneOverride: tplSection?.toneOverride,
        agent: currentAgent,
        site: currentSite,
        report: editableReport,
        template,
      });
      if (result.content) {
        updateSectionContent(sectionId, result.content);
      }
    } catch (err: any) {
      if (err?.type === 'credit_limit') toast.error('Credit limit reached');
      else toast.error('Generation failed');
    }
  }, [currentAgent, currentSite, editableReport, templates, toast, updateSectionContent]);

  const handleDownload = useCallback(() => {
    const task = new Promise<void>((resolve) => {
      setTimeout(() => {
        openReportPrintWindow(reportToPrintInput(editableReport), `Verkos Report ${editableReport.date}`);
        resolve();
      }, 400);
    });
    toast.promise(task, { loading: 'Preparing PDF…', success: 'Opening print dialog', error: 'PDF generation failed' });
  }, [editableReport, toast]);

  // ─── Title editing ──────────────────────────────────────────────
  useEffect(() => {
    if (editingTitle) titleRef.current?.focus();
  }, [editingTitle]);

  const commitTitle = useCallback(() => {
    setEditingTitle(false);
    if (!editableReport.title.trim()) setEditableReport((r) => ({ ...r, title: report.title }));
  }, [editableReport.title, report.title]);

  // ─── PDF preview data ──────────────────────────────────────────
  const printInput = useMemo(() => reportToPrintInput(editableReport), [editableReport]);

  // ─── View mode ─────────────────────────────────────────────────
  const [viewMode, setViewMode] = useState<'edit' | 'preview'>(defaultView);

  useEffect(() => {
    if (viewMode !== 'edit') setEditingTitle(false);
  }, [viewMode]);

  // ─── Full preview scale ────────────────────────────────────────
  const fullPreviewRef = useRef<HTMLDivElement>(null);
  const [fullPreviewScale, setFullPreviewScale] = useState(0.7);

  useEffect(() => {
    if (viewMode !== 'preview') return;
    const calc = () => {
      if (fullPreviewRef.current) {
        const w = fullPreviewRef.current.clientWidth - 48;
        setFullPreviewScale(Math.max(Math.min(w / 793, 0.85), 0.4));
      }
    };
    requestAnimationFrame(calc);
    window.addEventListener('resize', calc);
    return () => window.removeEventListener('resize', calc);
  }, [viewMode]);

  // Note: handleAiAssistSummary, handleAiAssistObservation, handleAiAssistRecs,
  // and handleAiAssistTextSection are intentionally retained above for future
  // inline AI-assist features, even though the UI buttons that triggered them
  // have been removed in favor of automatic enrichment during report generation.

  // ─── Editor content ────────────────────────────────────────────

  const editorContent = (
    <motion.div
      variants={shouldReduce ? undefined : sectionContainerVariants}
      initial="hidden"
      animate="visible"
    >
      {/* EXHIBIT: the "You're viewing a complete demo shift report" guidance
          strip is removed along with the Demo chips — the whole exhibit is
          sample data, so the callout was redundant. */}

      {/* Empty-report guidance strip (non-demo only) */}
      {!(editableReport as any).isDemo && editableReport.observations.length === 0 && !editableReport.executiveSummary && (
        <div className="mb-4 bg-primary-200/[0.04] border border-primary-200/[0.15] rounded-xl px-4 py-3 flex items-start gap-3">
          <i className="fa-solid fa-info-circle text-primary-200/80 text-[13px] mt-0.5" />
          <div className="flex-1">
            <p className="text-[13px] text-white/[0.85] font-medium mb-1">This report is empty</p>
            <p className="text-[12px] text-white/[0.55] leading-relaxed">
              Reports are generated automatically from flight data and pilot context. To populate this report, go back to the flight context page, add your observations, then re-generate the report from the wizard.
            </p>
          </div>
        </div>
      )}

      {/* Render sections in template order */}
      {(editableReport.sections || []).filter((s) => s.enabled).sort((a, b) => a.order - b.order).map((section) => (
        <motion.div key={section.id} variants={shouldReduce ? undefined : sectionVariants}>
          {section.kind === 'executive_summary' && (
            <ExecutiveSummary
              summary={editableReport.executiveSummary}
              editable
              onSummaryChange={(text) => {
                updateSummary(text);
                updateSectionContent(section.id, text);
              }}
              
            />
          )}
          {section.kind === 'patrol_overview' && (
            <PatrolOverview report={editableReport} />
          )}
          {section.kind === 'observations' && (
            <div className="mt-6">
              <p className="text-[11px] uppercase tracking-wider text-white/[0.30] font-medium mb-4">
                Observations ({editableReport.observations.length})
              </p>
              {editableReport.observations.length > 0 ? (
                <AnimatePresence mode="popLayout">
                  {editableReport.observations.map((obs, idx) => (
                    <motion.div
                      key={obs.id}
                      layout
                      transition={{ duration: 0.25, ease: [0.25, 0.1, 0.25, 1] }}
                    >
                      <ObservationBlock
                        observation={obs}
                        editable
                        isLast={idx === editableReport.observations.length - 1}
                        onTitleChange={(title) => updateObservation(obs.id, { title })}
                        onSeverityChange={(severity) => updateObservation(obs.id, { severity })}
                        onStatusChange={(status) => updateObservation(obs.id, { status })}
                        onAiDescriptionChange={(aiDescription) => updateObservation(obs.id, { aiDescription })}
                        onPilotContextChange={(text) => updateObservation(obs.id, { pilotContext: text || null })}
                        onDelete={() => handleDeleteObservation(obs.id)}
                        onMoveUp={() => handleMoveObservation(obs.id, 'up')}
                        onMoveDown={() => handleMoveObservation(obs.id, 'down')}
                        onImageAttach={(raw, annotated) => handleImageAttach(obs.id, raw, annotated)}
                        onImagesChange={(images) => handleImagesChange(obs.id, images)}
                      />
                    </motion.div>
                  ))}
                </AnimatePresence>
              ) : (
                <div className="bg-[#161618] border border-white/[0.08] rounded-xl p-6 text-center mb-4">
                  <p className="text-[14px] text-white/[0.45] mb-1">No observations yet</p>
                  <p className="text-[12px] text-white/[0.25]">Observations will be populated from AI detections when available, or you can add them manually.</p>
                </div>
              )}
              <button
                onClick={handleAddObservation}
                className="w-full border border-dashed border-white/[0.08] rounded-xl p-4 text-[13px] text-white/[0.35] hover:text-white/[0.55] hover:border-white/[0.15] flex items-center justify-center gap-2 transition-all duration-150 mt-2"
              >
                <i className="fa-solid fa-plus text-xs" />
                Add observation
              </button>
            </div>
          )}
          {section.kind === 'recommendations' && (
            <RecommendationsSection
              shortTerm={editableReport.shortTermRecommendations}
              longTerm={editableReport.longTermRecommendations}
              editable
              onShortTermChange={updateShortTerm}
              onLongTermChange={updateLongTerm}
              
            />
          )}
          {(section.kind === 'perimeter_status' || section.kind === 'compliance' || section.kind === 'custom') && (
            <TextSectionBlock
              title={section.name}
              content={section.content}
              onChange={(content) => updateSectionContent(section.id, content)}
              onNameChange={section.kind === 'custom' ? (name) => updateSectionName(section.id, name) : undefined}
              editableName={section.kind === 'custom'}
              
            />
          )}
        </motion.div>
      ))}

      {/* Custom pilot-added sections */}
      {(editableReport.customSections || []).map((section) => (
        <motion.div key={section.id} variants={shouldReduce ? undefined : sectionVariants} className="mt-6">
          <CustomSectionBlock
            section={section}
            onNameChange={(name) => updateCustomSection(section.id, { name })}
            onContentChange={(content) => updateCustomSection(section.id, { content })}
            onDelete={() => deleteCustomSection(section.id)}
          />
        </motion.div>
      ))}

      {/* Add custom section */}
      <button
        onClick={handleAddCustomSection}
        className="w-full border border-dashed border-white/[0.08] rounded-xl p-4 text-[13px] text-white/[0.35] hover:text-white/[0.55] hover:border-white/[0.15] flex items-center justify-center gap-2 transition-all duration-150 mt-6"
      >
        <i className="fa-solid fa-plus text-xs" />
        Add custom section
      </button>

      {/* Delete report */}
      <div className="mt-10 pt-4 border-t border-white/[0.05]">
        {showDeleteConfirm ? (
          <div className="flex items-center justify-between bg-error-30/[0.08] border border-error-30/[0.15] rounded-lg px-4 py-2.5">
            <span className="text-[13px] text-error-30">Delete this report? This cannot be undone.</span>
            <div className="flex items-center gap-2">
              <button onClick={() => setShowDeleteConfirm(false)} className="text-[13px] text-white/[0.50] hover:text-white/[0.75] px-3 py-1 rounded-lg transition-colors duration-150 cursor-pointer">Cancel</button>
              <button onClick={() => { deleteReportAction(report.id); navigate({ to: '/' }); }} className="text-[13px] text-error-30 hover:text-error-50 font-medium px-3 py-1 rounded-lg transition-colors duration-150 cursor-pointer">Delete</button>
            </div>
          </div>
        ) : (
          <button onClick={() => setShowDeleteConfirm(true)} className="text-[13px] text-error-30 hover:text-error-50 transition-colors duration-150 flex items-center gap-1.5 focus:outline-none focus-visible:ring-1 focus-visible:ring-error-30 rounded cursor-pointer">
            <i className="fa-solid fa-trash text-xs" />
            Delete report
          </button>
        )}
      </div>
    </motion.div>
  );

  return (
    <div className="h-screen flex flex-col bg-[#0F0F11]">
      {/* ─── Top bar ──────────────────────────────────────────────── */}
      <div className="sticky top-0 z-10 bg-[#0F0F11]/80 backdrop-blur-md border-b border-white/[0.06] px-6 py-3 flex items-center gap-4 flex-shrink-0">
        <button
          onClick={() => navigate({ to: '/' })}
          className="text-[12px] text-white/[0.50] hover:text-white/[0.80] transition-colors duration-150 flex items-center gap-1.5 focus:outline-none focus-visible:ring-1 focus-visible:ring-primary-200/50 rounded px-1"
          aria-label="Back to reports"
        >
          <i className="fa-solid fa-arrow-left text-xs" />
          Reports
        </button>

        <div className="flex-1 text-center">
          <div className="flex items-center justify-center gap-2">
            {editingTitle && viewMode === 'edit' ? (
              <input
                ref={titleRef}
                value={editableReport.title}
                onChange={(e) => setEditableReport((r) => ({ ...r, title: e.target.value }))}
                onBlur={commitTitle}
                onKeyDown={(e) => e.key === 'Enter' && commitTitle()}
                className="bg-[#1C1C1F] border border-white/[0.08] rounded-lg px-3 py-1 text-[16px] font-semibold text-white/[0.92] text-center w-full max-w-md mx-auto focus:outline-none focus:border-primary-200/40"
              />
            ) : (
              <button
                onClick={() => viewMode === 'edit' && setEditingTitle(true)}
                className={`text-[15px] font-semibold text-white/[0.92] hover:text-white transition-colors duration-150 rounded px-1 focus:outline-none focus-visible:ring-1 focus-visible:ring-primary-200/50 whitespace-nowrap ${viewMode === 'edit' ? 'cursor-text' : 'cursor-default'}`}
              >
                {editableReport.title}
              </button>
            )}
            {/* EXHIBIT: "Demo" chip removed — see ReportsTable.tsx. */}
          </div>
          <div className="flex items-center justify-center gap-1.5 mt-0.5">
            <i className="fa-solid fa-robot text-white/[0.30] text-xs" />
            <span className="text-[12px] text-white/[0.45]">Generated by {editableReport.agentName}</span>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {/* ── Status indicators (always visible) ── */}
          {hasUnsaved && !isDraft && (
            <span className="text-[11px] text-caution-30 flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-caution-30" />
              Unsaved
            </span>
          )}

          {isDraft ? (
            <span className="text-[11px] font-medium bg-caution-30/15 text-caution-30 rounded-md px-2 py-0.5">Draft</span>
          ) : (
            <span className="text-[11px] font-medium bg-success-30/15 text-success-30 rounded-md px-2 py-0.5">Finalized</span>
          )}

          <span className="text-[11px] font-medium bg-white/[0.06] text-white/[0.50] rounded-md px-2 py-0.5">
            {profileLabel[editableReport.profile]}
          </span>



          {/* ── Edit / Preview toggle ── */}
          <div className="flex items-center bg-[#161618] rounded-lg p-0.5 border border-white/[0.06]">
            <button
              onClick={() => setViewMode('edit')}
              className={`px-3 py-1 rounded-md text-[13px] font-medium transition-all duration-150 focus:outline-none focus-visible:ring-1 focus-visible:ring-primary-200/50 ${
                viewMode === 'edit' ? 'bg-white/[0.08] text-white/[0.88]' : 'text-white/[0.40] hover:text-white/[0.60]'
              }`}
            >
              <i className="fa-solid fa-pen-to-square text-xs mr-1.5" />
              Edit
            </button>
            <button
              onClick={() => setViewMode('preview')}
              className={`px-3 py-1 rounded-md text-[13px] font-medium transition-all duration-150 focus:outline-none focus-visible:ring-1 focus-visible:ring-primary-200/50 ${
                viewMode === 'preview' ? 'bg-white/[0.08] text-white/[0.88]' : 'text-white/[0.40] hover:text-white/[0.60]'
              }`}
            >
              <i className="fa-solid fa-eye text-xs mr-1.5" />
              Preview
            </button>
          </div>

          {/* ── Save / Publish (depends on report status, not view mode) ── */}
          {isDraft ? (
            <>
              <button
                onClick={handleSave}
                className="text-[12px] text-white/[0.50] hover:text-white/[0.75] px-3 py-2 rounded-lg transition-colors duration-150 focus:outline-none focus-visible:ring-1 focus-visible:ring-primary-200/50 cursor-pointer whitespace-nowrap"
              >
                Save draft
              </button>
              <div className="relative">
                <button
                  onClick={() => setShowPublishConfirm((v) => !v)}
                  className="flex items-center gap-2 text-[12px] font-medium bg-success-30 text-white px-4 py-2 rounded-lg hover:bg-success-40 transition-colors duration-150 focus:outline-none focus-visible:ring-1 focus-visible:ring-success-30/50 cursor-pointer whitespace-nowrap"
                >
                  <i className="fa-solid fa-paper-plane text-xs" />
                  Publish report
                </button>
                {showPublishConfirm && (
                  <div className="absolute right-0 top-full mt-2 w-[280px] bg-[#1C1C1F] border border-white/[0.10] rounded-xl p-4 shadow-lg z-20">
                    <p className="text-[13px] text-white/[0.75] mb-3">Publish this report? It will appear in the finalized reports list.</p>
                    <div className="flex items-center justify-end gap-2">
                      <button onClick={() => setShowPublishConfirm(false)} className="text-[12px] text-white/[0.50] hover:text-white/[0.75] px-3 py-1.5 rounded-lg transition-colors duration-150 cursor-pointer">Cancel</button>
                      <button onClick={handlePublish} className="text-[12px] font-medium bg-success-30 text-white px-3 py-1.5 rounded-lg hover:bg-success-40 transition-colors duration-150 cursor-pointer">Publish</button>
                    </div>
                  </div>
                )}
              </div>
            </>
          ) : (
            <button
              onClick={handleSave}
              className={`text-[12px] font-medium px-4 py-2 rounded-lg transition-colors duration-150 focus:outline-none focus-visible:ring-1 focus-visible:ring-primary-200/50 cursor-pointer whitespace-nowrap ${
                hasUnsaved ? 'bg-primary-200 text-white hover:bg-primary-100' : 'text-white/[0.50] border border-white/[0.08] hover:text-white/[0.80]'
              }`}
            >
              Save
            </button>
          )}

          {/* ── Download PDF (always visible) ── */}
          <button
            onClick={handleDownload}
            className="flex items-center gap-1.5 text-[12px] text-white/[0.50] hover:text-white/[0.80] transition-colors duration-150 focus:outline-none focus-visible:ring-1 focus-visible:ring-primary-200/50 rounded px-2 py-1 whitespace-nowrap"
            aria-label="Download report as PDF"
          >
            <i className="fa-solid fa-download text-xs" />
            Download PDF
          </button>
        </div>
      </div>

      {/* ─── Body ─────────────────────────────────────────────────── */}
      <div className="flex-1 min-h-0">
        {viewMode === 'edit' ? (
          <div className="flex h-full overflow-hidden">
            {/* Media Gallery — left */}
            {!galleryCollapsed && (
              <div className="w-[320px] min-w-[320px] flex-shrink-0 bg-[#0C0C0E] border-r border-white/[0.06]">
                <div
                  className="h-full overflow-y-auto"
                  style={{ scrollbarWidth: 'thin', scrollbarColor: 'rgba(255,255,255,0.06) transparent' }}
                >
                  <MediaGallery
                    onImageClick={(_img, idx) => setViewerIndex(idx)}
                    selectedFlightIds={editableReport.flightIds}
                  />
                </div>
              </div>
            )}

            {/* Gallery collapse toggle */}
            <button
              onClick={() => setGalleryCollapsed(!galleryCollapsed)}
              className="w-5 flex-shrink-0 flex items-center justify-center bg-[#0C0C0E] hover:bg-white/[0.03] border-r border-white/[0.06] transition-colors duration-150"
              title={galleryCollapsed ? 'Show media' : 'Hide media'}
            >
              {galleryCollapsed ? (
                <span className="text-[10px] text-white/[0.20] [writing-mode:vertical-rl] rotate-180 whitespace-nowrap">Media (14)</span>
              ) : (
                <i className="fa-solid fa-chevron-left text-[8px] text-white/[0.20]" />
              )}
            </button>

            {/* Report Editor — right */}
            <div className="flex-1 min-w-0">
              <div className="h-full overflow-y-auto" style={scrollbarStyle}>
                <div className="p-6 max-w-[800px]">
                  <PageTransition>{editorContent}</PageTransition>
                </div>
              </div>
            </div>
          </div>
        ) : (
          /* Preview mode — full width PDF */
          <div ref={fullPreviewRef} className="h-full">
            <div className="h-full overflow-y-auto bg-[#0A0A0C]" style={scrollbarStyle}>
              <div className="py-8 px-6">
                <div style={{ transform: `scale(${fullPreviewScale})`, transformOrigin: 'top center', width: '210mm', margin: '0 auto' }}>
                  <ReportPrintView data={printInput} previewMode />
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Media Viewer */}
      {viewerIndex !== null && (
        <MediaViewer
          images={galleryImages}
          initialIndex={viewerIndex}
          onClose={() => setViewerIndex(null)}
          onAttachToObservation={handleAttachFromViewer}
          observations={editableReport.observations.map((o) => ({ id: o.id, number: o.number, title: o.title }))}
          onUpdateNote={(imageId, note) => useReportStore.getState().updateGalleryImageNote(imageId, note)}
        />
      )}
    </div>
  );
};

// ─── Custom Section Block ─────────────────────────────────────────────────

const CustomSectionBlock: React.FC<{
  section: CustomSection;
  onNameChange: (name: string) => void;
  onContentChange: (content: string) => void;
  onDelete: () => void;
}> = ({ section, onNameChange, onContentChange, onDelete }) => {
  const [isHovered, setIsHovered] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = textareaRef.current.scrollHeight + 'px';
    }
  }, [section.content]);

  return (
    <div
      className="relative bg-[#161618] border border-white/[0.08] rounded-xl p-5"
      style={{ boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.04)' }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {isHovered && (
        <button
          onClick={onDelete}
          className="absolute top-3 right-3 text-white/[0.20] hover:text-error-30 transition-colors duration-150"
          title="Delete section"
        >
          <i className="fa-solid fa-trash text-xs" />
        </button>
      )}
      <input
        type="text"
        value={section.name}
        onChange={(e) => onNameChange(e.target.value)}
        placeholder="Section name..."
        className="w-full bg-transparent border-0 p-0 text-[15px] font-semibold text-white/[0.85] focus:outline-none placeholder:text-white/[0.20] mb-3"
      />
      <textarea
        ref={textareaRef}
        value={section.content}
        onChange={(e) => {
          e.target.style.height = 'auto';
          e.target.style.height = e.target.scrollHeight + 'px';
          onContentChange(e.target.value);
        }}
        placeholder="Write section content..."
        className="w-full resize-none bg-transparent border-0 p-0 text-[14px] text-white/[0.80] leading-[1.7] focus:outline-none placeholder:text-white/[0.20]"
        rows={3}
      />
    </div>
  );
};

// ─── Text Section Block ───────────────────────────────────────────────────

const TextSectionBlock: React.FC<{
  title: string;
  content: string;
  onChange: (content: string) => void;
  onNameChange?: (name: string) => void;
  editableName?: boolean;
  onAiAssist?: () => Promise<void> | void;
}> = ({ title, content, onChange, onNameChange, editableName = false, onAiAssist }) => {
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = textareaRef.current.scrollHeight + 'px';
    }
  }, [content]);

  return (
    <div className="bg-[#161618] border border-white/[0.08] rounded-xl p-5 mb-4 mt-6" style={{ boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.04)' }}>
      <div className="mb-3">
        {editableName && onNameChange ? (
          <input
            type="text"
            value={title}
            onChange={(e) => onNameChange(e.target.value)}
            className="bg-transparent border-0 p-0 text-[11px] uppercase tracking-wider text-white/[0.30] font-medium focus:outline-none placeholder:text-white/[0.20]"
          />
        ) : (
          <p className="text-[11px] uppercase tracking-wider text-white/[0.30] font-medium">{title}</p>
        )}
      </div>
      <textarea
        ref={textareaRef}
        value={content}
        onChange={(e) => {
          e.target.style.height = 'auto';
          e.target.style.height = e.target.scrollHeight + 'px';
          onChange(e.target.value);
        }}
        placeholder="Write section content, or click AI assist to generate..."
        className="w-full resize-none bg-transparent border-0 p-0 text-[14px] text-white/[0.80] leading-[1.7] focus:outline-none placeholder:text-white/[0.20]"
      />
    </div>
  );
};

export default ReportReview;
