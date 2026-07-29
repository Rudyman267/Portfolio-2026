import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useNavigate } from '@tanstack/react-router';
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion';
import { Agent, AgentDomain, AgentDetectionEvent, Severity } from '../../types/report.types';
import { useReportStore } from '../../store/report.store';
import { DOMAIN_INFO, defaultDetectionEventsForDomain } from '../../data/agent-defaults';
import AppSelect from '@/components/ui/app-select';

/* ─── Styling ───────────────────────────────────────────────────────────── */

const fieldLabelClass = 'text-[12px] text-white/[0.45] font-medium block mb-1.5';
const fieldInputClass =
  'bg-[#1C1C1F] border border-white/[0.08] rounded-lg text-[14px] text-white/[0.85] px-3 py-2.5 w-full focus:border-primary-200/40 focus:outline-none transition-colors duration-150 placeholder:text-white/[0.20]';
const fieldTextareaClass =
  'bg-[#1C1C1F] border border-white/[0.08] rounded-lg text-[14px] text-white/[0.85] px-3 py-2.5 w-full focus:border-primary-200/40 focus:outline-none transition-colors duration-150 resize-y min-h-[80px] placeholder:text-white/[0.20]';
const focusRingClass = 'focus:outline-none focus-visible:ring-1 focus-visible:ring-primary-200/50';

const severityColors: Record<Severity, string> = {
  critical: 'bg-error-30',
  high: 'bg-error-30/70',
  moderate: 'bg-caution-30',
  low: 'bg-success-30',
};

const modalOverlay = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { duration: 0.15 } },
  exit: { opacity: 0, transition: { duration: 0.1 } },
};

const modalPanel = {
  hidden: { opacity: 0, scale: 0.97 },
  visible: { opacity: 1, scale: 1, transition: { duration: 0.2, ease: [0.16, 1, 0.3, 1] as const } },
  exit: { opacity: 0, scale: 0.98, transition: { duration: 0.15 } },
};

/* ─── Step transition variants ──────────────────────────────────────────── */

const stepForward = {
  initial: { x: 20, opacity: 0 },
  animate: { x: 0, opacity: 1, transition: { duration: 0.2, ease: [0.25, 0.1, 0.25, 1] as const } },
  exit: { x: -20, opacity: 0, transition: { duration: 0.15 } },
};

const stepBackward = {
  initial: { x: -20, opacity: 0 },
  animate: { x: 0, opacity: 1, transition: { duration: 0.2, ease: [0.25, 0.1, 0.25, 1] as const } },
  exit: { x: 20, opacity: 0, transition: { duration: 0.15 } },
};

/* ─── Detection Event Card ──────────────────────────────────────────────── */

const DetectionEventCard: React.FC<{
  event: AgentDetectionEvent;
  isExpanded: boolean;
  onToggleExpand: (id: string | null) => void;
  onUpdate: (id: string, updates: Partial<AgentDetectionEvent>) => void;
  onDelete: (id: string) => void;
}> = ({ event, isExpanded, onToggleExpand, onUpdate, onDelete }) => {
  const [form, setForm] = useState({
    name: event.name,
    description: event.description,
    defaultSeverity: event.defaultSeverity,
    compareHistorical: event.compareHistorical,
  });

  useEffect(() => {
    setForm({
      name: event.name,
      description: event.description,
      defaultSeverity: event.defaultSeverity,
      compareHistorical: event.compareHistorical,
    });
  }, [event.name, event.description, event.defaultSeverity, event.compareHistorical]);

  const handleSave = () => {
    onUpdate(event.id, form);
    onToggleExpand(null);
  };

  const handleCancel = () => {
    setForm({
      name: event.name,
      description: event.description,
      defaultSeverity: event.defaultSeverity,
      compareHistorical: event.compareHistorical,
    });
    onToggleExpand(null);
  };

  const previewDesc = event.description.length > 120
    ? event.description.slice(0, 120) + '…'
    : event.description;

  return (
    <div className={`bg-[#1C1C1F] border border-white/[0.06] rounded-xl transition-all duration-150 ${
      !event.enabled ? 'opacity-50' : ''
    } group`}>
      {/* Header */}
      <div
        className={`flex items-start gap-3 px-4 py-3 ${!isExpanded ? 'cursor-pointer hover:bg-white/[0.02]' : ''} rounded-xl`}
        onClick={(e) => {
          if ((e.target as HTMLElement).closest('[data-no-expand]')) return;
          if (!isExpanded) onToggleExpand(event.id);
        }}
      >
        {/* Severity dot */}
        <span className={`w-2.5 h-2.5 rounded-full mt-1.5 flex-shrink-0 ${severityColors[event.defaultSeverity]}`} />

        {/* Content */}
        <div className="flex-1 min-w-0">
          <span className="text-[14px] font-medium text-white/[0.85]">{event.name}</span>
          {!isExpanded && (
            <p className="text-[12px] text-white/[0.30] leading-relaxed mt-0.5 italic">
              {previewDesc}
            </p>
          )}
        </div>

        {/* Controls */}
        <div className="flex items-center gap-1.5 flex-shrink-0" data-no-expand>
          <span className="text-[11px] text-white/[0.30] bg-white/[0.04] rounded px-1.5 py-0.5 capitalize">
            {event.defaultSeverity}
          </span>
          <button
            onClick={(e) => {
              e.stopPropagation();
              onUpdate(event.id, { enabled: !event.enabled });
            }}
            className={`text-[11px] font-medium rounded-md px-2 py-0.5 transition-colors duration-150 cursor-pointer ${
              event.enabled
                ? 'bg-success-30/15 text-success-30 hover:bg-success-30/25'
                : 'bg-white/[0.06] text-white/[0.35] hover:bg-white/[0.10]'
            }`}
          >
            {event.enabled ? 'Active' : 'Off'}
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              onDelete(event.id);
            }}
            className="opacity-0 group-hover:opacity-100 w-6 h-6 flex items-center justify-center rounded text-white/[0.25] hover:text-error-30 transition-all duration-150 cursor-pointer"
            aria-label={`Delete ${event.name}`}
          >
            <i className="fa-solid fa-trash text-[10px]" />
          </button>
        </div>
      </div>

      {/* Expanded editor */}
      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2, ease: [0.25, 0.1, 0.25, 1] }}
            className="overflow-hidden"
          >
            <div className="px-4 pb-4 pt-1 space-y-3 border-t border-white/[0.05]">
              <div>
                <label className={fieldLabelClass}>Event name</label>
                <input
                  type="text"
                  value={form.name}
                  onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                  className={fieldInputClass}
                  placeholder="e.g., Unauthorized vehicle"
                  autoFocus
                />
              </div>

              <div>
                <label className={fieldLabelClass}>Default severity</label>
                <AppSelect
                  value={form.defaultSeverity}
                  onValueChange={(v) => setForm((f) => ({ ...f, defaultSeverity: v as Severity }))}
                  options={[
                    { value: 'critical', label: 'Critical' },
                    { value: 'high', label: 'High' },
                    { value: 'moderate', label: 'Moderate' },
                    { value: 'low', label: 'Low' },
                  ]}
                />
              </div>

              <div>
                <label className={fieldLabelClass}>
                  AI instruction
                  <span className="text-white/[0.25] font-normal ml-1">— how should reports describe this?</span>
                </label>
                <textarea
                  value={form.description}
                  onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
                  className={fieldTextareaClass}
                  rows={3}
                  placeholder="Describe how the agent should document this event type in reports..."
                />
              </div>

              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id={`hist-${event.id}`}
                  checked={form.compareHistorical}
                  onChange={(e) => setForm((f) => ({ ...f, compareHistorical: e.target.checked }))}
                  className="w-3.5 h-3.5 rounded border-white/[0.15] bg-transparent accent-primary-200 cursor-pointer"
                />
                <label htmlFor={`hist-${event.id}`} className="text-[13px] text-white/[0.55] cursor-pointer">
                  Compare against historical data
                </label>
              </div>

              <div className="flex items-center justify-end gap-3 pt-2 border-t border-white/[0.05]">
                <button
                  onClick={handleCancel}
                  className={`text-white/[0.50] hover:text-white/[0.75] px-3 py-1.5 rounded-lg text-[13px] transition-colors duration-150 ${focusRingClass} cursor-pointer`}
                >
                  Cancel
                </button>
                <button
                  onClick={handleSave}
                  className={`bg-primary-200 text-white px-3 py-1.5 rounded-lg text-[13px] font-medium hover:bg-primary-100 transition-colors duration-150 ${focusRingClass} cursor-pointer`}
                >
                  Done
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

/* ─── Progress Indicator ────────────────────────────────────────────────── */

const StepIndicator: React.FC<{
  currentStep: number;
  onGoToStep: (step: number) => void;
}> = ({ currentStep, onGoToStep }) => {
  const steps = [
    { num: 1, label: 'Identity' },
    { num: 2, label: 'Detections' },
  ];

  return (
    <div className="flex items-center justify-center gap-0 mb-6">
      {steps.map((step, idx) => {
        const isActive = currentStep === step.num;
        const isCompleted = currentStep > step.num;
        const canClick = isCompleted;

        return (
          <React.Fragment key={step.num}>
            {idx > 0 && (
              <div className={`w-10 h-px mx-1 ${isCompleted ? 'bg-primary-200/50' : 'bg-white/[0.08]'}`} />
            )}
            <button
              onClick={() => canClick && onGoToStep(step.num)}
              disabled={!canClick}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[12px] font-medium transition-all duration-150 ${
                isActive
                  ? 'bg-primary-200/15 text-primary-200 border border-primary-200/30'
                  : isCompleted
                  ? 'bg-white/[0.04] text-white/[0.55] border border-white/[0.08] cursor-pointer hover:border-white/[0.15]'
                  : 'bg-transparent text-white/[0.25] border border-transparent cursor-default'
              }`}
            >
              {isCompleted ? (
                <i className="fa-solid fa-check text-[9px] text-success-30" />
              ) : (
                <span className="text-[11px]">{step.num}</span>
              )}
              <span>{step.label}</span>
            </button>
          </React.Fragment>
        );
      })}
    </div>
  );
};

/* ─── Main Wizard ───────────────────────────────────────────────────────── */

interface CreateAgentWizardProps {
  onClose: () => void;
}

const CreateAgentWizard: React.FC<CreateAgentWizardProps> = ({ onClose }) => {
  const navigate = useNavigate();
  const shouldReduce = useReducedMotion();
  const addAgent = useReportStore((s) => s.addAgent);
  const templates = useReportStore((s) => s.templates);

  // Step state
  const [step, setStep] = useState(1);
  const [direction, setDirection] = useState<'forward' | 'backward'>('forward');

  // Step 1 — Identity
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [domain, setDomain] = useState<AgentDomain>('security');
  const [tone, setTone] = useState<Agent['config']['tone']>('operational');
  const [depth, setDepth] = useState<Agent['config']['analysisDepth']>('standard');
  const [advancedOpen, setAdvancedOpen] = useState(false);

  // Step 2 — Detections
  const [events, setEvents] = useState<AgentDetectionEvent[]>([]);
  const [expandedEventId, setExpandedEventId] = useState<string | null>(null);
  const [hasSeededEvents, setHasSeededEvents] = useState(false);

  // Escape to close
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [onClose]);

  // Seed events when entering step 2 for the first time
  useEffect(() => {
    if (step === 2 && !hasSeededEvents) {
      const defaults = defaultDetectionEventsForDomain(domain);
      setEvents(defaults);
      setHasSeededEvents(true);
    }
  }, [step, hasSeededEvents, domain]);

  const canNext = name.trim().length > 0;

  const goForward = () => {
    setDirection('forward');
    setStep(2);
  };
  const goBack = () => {
    setDirection('backward');
    setStep(1);
  };

  const domainInfo = DOMAIN_INFO.find((d) => d.value === domain) ?? DOMAIN_INFO[0];
  const exampleDescriptions = domainInfo.exampleDescriptions;

  // Event handlers
  const handleUpdateEvent = useCallback((id: string, updates: Partial<AgentDetectionEvent>) => {
    setEvents((prev) => prev.map((e) => (e.id === id ? { ...e, ...updates } : e)));
  }, []);

  const handleDeleteEvent = useCallback((id: string) => {
    setEvents((prev) => prev.filter((e) => e.id !== id));
    setExpandedEventId(null);
  }, []);

  const handleAddEvent = () => {
    const newEvt: AgentDetectionEvent = {
      id: `evt-new-${Date.now()}`,
      name: '',
      description: '',
      enabled: true,
      defaultSeverity: 'moderate',
      compareHistorical: false,
    };
    setEvents((prev) => [...prev, newEvt]);
    setExpandedEventId(newEvt.id);
  };

  const handleCreate = () => {
    const ts = Date.now();
    const domainIcons: Record<string, string> = {
      security: 'fa-solid fa-shield-halved',
      inspection: 'fa-solid fa-magnifying-glass',
      surveillance: 'fa-solid fa-eye',
      custom: 'fa-solid fa-robot',
    };

    // Filter out events with empty names
    const validEvents = events.filter((e) => e.name.trim().length > 0);

    const newAgent: Agent = {
      id: `agent-${ts}`,
      name: name.trim(),
      description: description.trim(),
      domain,
      status: 'inactive',
      icon: domainIcons[domain] || domainIcons.custom,
      reportCount: 0,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      config: {
        detectionEvents: validEvents,
        analysisDepth: depth,
        tone,
        autoGenerate: false,
        defaultTemplateId: templates.find((t) => t.isDefault)?.id ?? templates[0]?.id ?? 'tpl-verkos-standard',
      },
    };
    addAgent(newAgent);
    onClose();
    navigate({ to: '/agent/$agentId', params: { agentId: newAgent.id } as never });
  };

  const variants = shouldReduce ? undefined : (direction === 'forward' ? stepForward : stepBackward);

  return (
    <AnimatePresence>
      <motion.div
        variants={shouldReduce ? undefined : modalOverlay}
        initial="hidden"
        animate="visible"
        exit="exit"
        className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-6"
        onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
      >
        <motion.div
          variants={shouldReduce ? undefined : modalPanel}
          initial="hidden"
          animate="visible"
          exit="exit"
          className="max-w-3xl w-full bg-[#161618] border border-white/[0.10] rounded-xl max-h-[90vh] overflow-hidden flex flex-col"
          style={{ boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.04), 0 8px 32px rgba(0,0,0,0.5)' }}
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="px-6 pt-6 pb-0 flex-shrink-0">
            <p className="text-[18px] font-semibold text-white/[0.92]">Create new agent</p>
            <p className="text-[13px] text-white/[0.42] mt-1 mb-4">
              {step === 1 ? 'Who is this agent?' : 'What does it watch for?'}
            </p>
            <StepIndicator currentStep={step} onGoToStep={(s) => { setDirection(s < step ? 'backward' : 'forward'); setStep(s); }} />
          </div>

          {/* Scrollable content */}
          <div className="flex-1 overflow-y-auto px-6 pb-6" style={{ scrollbarWidth: 'thin', scrollbarColor: 'rgba(255,255,255,0.12) transparent' }}>
            <AnimatePresence mode="wait" initial={false}>
              {step === 1 && (
                <motion.div
                  key="step1"
                  variants={variants}
                  initial="initial"
                  animate="animate"
                  exit="exit"
                >
                  {/* Agent name */}
                  <div className="mb-5">
                    <label className={fieldLabelClass}>Agent name</label>
                    <input
                      type="text"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="e.g., Security patrol agent"
                      className={fieldInputClass}
                      autoFocus
                    />
                  </div>

                  {/* Domain tiles */}
                  <div className="mb-5">
                    <label className={fieldLabelClass}>Domain</label>
                    <div className="grid grid-cols-2 gap-2">
                      {DOMAIN_INFO.map((d) => (
                        <button
                          key={d.value}
                          onClick={() => setDomain(d.value)}
                          className={`text-left p-3.5 rounded-xl border transition-all duration-150 cursor-pointer ${
                            domain === d.value
                              ? 'border-primary-200/40 bg-primary-200/[0.06] ring-1 ring-primary-200/20'
                              : 'border-white/[0.06] bg-[#1C1C1F] hover:border-white/[0.12]'
                          }`}
                        >
                          <div className="flex items-center gap-2.5 mb-1.5">
                            <i className={`${d.icon} text-[14px] ${domain === d.value ? 'text-primary-200' : 'text-white/[0.35]'}`} />
                            <span className={`text-[14px] font-medium ${domain === d.value ? 'text-white/[0.92]' : 'text-white/[0.65]'}`}>
                              {d.label}
                            </span>
                          </div>
                          <p className="text-[12px] text-white/[0.35] leading-relaxed">
                            {d.description}
                          </p>
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Description */}
                  <div className="mb-4">
                    <label className={fieldLabelClass}>Description</label>
                    <textarea
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      placeholder="Describe what this agent monitors and how it generates reports"
                      className={fieldTextareaClass}
                      rows={5}
                    />
                    {/* Example descriptions */}
                    <div className="mt-2 space-y-1">
                      {exampleDescriptions.slice(0, 3).map((ex, idx) => (
                        <button
                          key={idx}
                          onClick={() => setDescription(ex)}
                          className="block text-[12px] text-white/[0.22] hover:text-white/[0.45] transition-colors duration-150 cursor-pointer text-left leading-relaxed"
                        >
                          <i className="fa-solid fa-arrow-turn-down-right text-[9px] mr-1.5 opacity-50 rotate-180" />
                          {ex}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Advanced preferences */}
                  <div className="mb-2">
                    <button
                      onClick={() => setAdvancedOpen((v) => !v)}
                      className="flex items-center gap-1.5 text-[12px] text-white/[0.35] hover:text-white/[0.55] transition-colors duration-150 cursor-pointer"
                    >
                      <i className={`fa-solid fa-chevron-right text-[9px] transition-transform duration-150 ${advancedOpen ? 'rotate-90' : ''}`} />
                      Advanced preferences
                    </button>
                    <AnimatePresence>
                      {advancedOpen && (
                        <motion.div
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: 'auto', opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          transition={{ duration: 0.2 }}
                          className="overflow-hidden"
                        >
                          <div className="flex gap-3 mt-3">
                            <div className="flex-1">
                              <label className={fieldLabelClass}>Tone</label>
                              <AppSelect
                                value={tone}
                                onValueChange={(v) => setTone(v as Agent['config']['tone'])}
                                options={[
                                  { value: 'operational', label: 'Operational' },
                                  { value: 'executive', label: 'Executive' },
                                  { value: 'compliance', label: 'Compliance' },
                                  { value: 'forensic', label: 'Forensic' },
                                ]}
                              />
                            </div>
                            <div className="flex-1">
                              <label className={fieldLabelClass}>Analysis depth</label>
                              <AppSelect
                                value={depth}
                                onValueChange={(v) => setDepth(v as Agent['config']['analysisDepth'])}
                                options={[
                                  { value: 'basic', label: 'Basic (quick summaries)' },
                                  { value: 'standard', label: 'Standard (balanced)' },
                                  { value: 'detailed', label: 'Detailed (comprehensive)' },
                                ]}
                              />
                            </div>
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                </motion.div>
              )}

              {step === 2 && (
                <motion.div
                  key="step2"
                  variants={variants}
                  initial="initial"
                  animate="animate"
                  exit="exit"
                >
                  <div className="mb-4">
                    <p className="text-[15px] font-medium text-white/[0.85]">What should this agent watch for?</p>
                    <p className="text-[13px] text-white/[0.35] mt-1">
                      The detection events below shape how reports describe findings. Most agents need 3–6 events.
                    </p>
                  </div>

                  {events.length === 0 ? (
                    <div className="text-center py-10 border border-dashed border-white/[0.08] rounded-xl mb-3">
                      <i className="fa-solid fa-radar text-white/[0.15] text-2xl mb-3" />
                      <p className="text-[14px] text-white/[0.35]">No detection events yet</p>
                      <p className="text-[12px] text-white/[0.22] mt-1">Add your first detection to tell the agent what to look for</p>
                      <button
                        onClick={handleAddEvent}
                        className={`mt-4 bg-primary-200/10 text-primary-200 px-4 py-2 rounded-lg text-[13px] font-medium hover:bg-primary-200/20 transition-colors duration-150 ${focusRingClass} cursor-pointer`}
                      >
                        <i className="fa-solid fa-plus text-xs mr-1.5" />
                        Add first detection
                      </button>
                    </div>
                  ) : (
                    <div className="space-y-2 mb-3">
                      {events.map((event) => (
                        <DetectionEventCard
                          key={event.id}
                          event={event}
                          isExpanded={expandedEventId === event.id}
                          onToggleExpand={setExpandedEventId}
                          onUpdate={handleUpdateEvent}
                          onDelete={handleDeleteEvent}
                        />
                      ))}
                    </div>
                  )}

                  {events.length > 0 && (
                    <button
                      onClick={handleAddEvent}
                      className="w-full border border-dashed border-white/[0.08] rounded-xl p-3 text-[13px] text-white/[0.35] hover:text-white/[0.55] hover:border-white/[0.15] flex items-center justify-center gap-2 transition-all duration-150 cursor-pointer"
                    >
                      <i className="fa-solid fa-plus text-xs" />
                      Add detection event
                    </button>
                  )}

                  <p className="text-[11px] text-white/[0.22] mt-3 text-center">
                    You can add or edit these later from the agent's detail page
                  </p>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Footer */}
          <div className="px-6 py-4 border-t border-white/[0.05] flex-shrink-0">
            {step === 1 ? (
              <div className="flex justify-between items-center">
                <button
                  onClick={onClose}
                  className={`text-white/[0.50] hover:text-white/[0.75] px-4 py-2 rounded-lg transition-colors duration-150 ${focusRingClass} cursor-pointer text-[13px]`}
                >
                  Cancel
                </button>
                <button
                  onClick={goForward}
                  disabled={!canNext}
                  className={`bg-primary-200 text-white px-5 py-2 rounded-lg font-medium hover:bg-primary-100 transition-colors duration-150 ${focusRingClass} cursor-pointer text-[13px] flex items-center gap-1.5 ${
                    !canNext ? 'opacity-40 cursor-not-allowed' : ''
                  }`}
                >
                  Next
                  <i className="fa-solid fa-arrow-right text-[10px]" />
                </button>
              </div>
            ) : (
              <div className="flex justify-between items-center">
                <div className="flex items-center gap-4">
                  <button
                    onClick={goBack}
                    className={`text-white/[0.50] hover:text-white/[0.75] px-4 py-2 rounded-lg transition-colors duration-150 ${focusRingClass} cursor-pointer text-[13px] flex items-center gap-1.5`}
                  >
                    <i className="fa-solid fa-arrow-left text-[10px]" />
                    Back
                  </button>
                  {events.length === 0 && (
                    <button
                      onClick={handleCreate}
                      className="text-white/[0.30] hover:text-white/[0.50] text-[12px] transition-colors duration-150 cursor-pointer group/skip relative"
                      title="Reports from this agent may lack detail until detection events are configured"
                    >
                      Skip for now — add later
                    </button>
                  )}
                </div>
                <button
                  onClick={handleCreate}
                  className={`bg-primary-200 text-white px-5 py-2 rounded-lg font-medium hover:bg-primary-100 transition-colors duration-150 ${focusRingClass} cursor-pointer text-[13px]`}
                >
                  Create agent
                </button>
              </div>
            )}
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

export default CreateAgentWizard;
