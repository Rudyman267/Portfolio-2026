import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from '@tanstack/react-router';
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion';
import {
  Agent,
  AgentStatus,
  AgentDetectionEvent,
  Severity,
} from '../../types/report.types';
import { useReportStore } from '../../store/report.store';
import AppSelect from '@/components/ui/app-select';
import PageTransition from './PageTransition';

/* ─── Props ─────────────────────────────────────────────────────────────── */

interface AgentDetailProps {
  agent: Agent;
}

/* ─── Constants ─────────────────────────────────────────────────────────── */

const statusLabel: Record<AgentStatus, string> = {
  active: 'Available',
  inactive: 'Unavailable',
};

const severityLabels: Record<Severity, string> = {
  low: 'Low',
  moderate: 'Moderate',
  high: 'High',
  critical: 'Critical',
};

/* ─── Animation ─────────────────────────────────────────────────────────── */

const sectionContainer = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.08, delayChildren: 0.1 } },
};

const sectionBlock = {
  hidden: { opacity: 0, y: 10 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.25, ease: [0.25, 0.1, 0.25, 1] as const } },
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

/* ─── Shared styling ────────────────────────────────────────────────────── */

const cardInset = 'inset 0 1px 0 rgba(255,255,255,0.04)';
const fieldLabelClass = 'text-[12px] text-white/[0.45] font-medium block mb-1';
const fieldInputClass =
  'bg-[#1C1C1F] border border-white/[0.08] rounded-lg text-[14px] text-white/[0.85] px-3 py-2.5 w-full focus:border-primary-200/40 focus:outline-none focus:ring-1 focus:ring-primary-200/10 transition-colors duration-150';
const fieldTextareaClass =
  'bg-[#1C1C1F] border border-white/[0.08] rounded-lg text-[14px] text-white/[0.85] px-3 py-2.5 w-full focus:border-primary-200/40 focus:outline-none focus:ring-1 focus:ring-primary-200/10 transition-colors duration-150 resize-y min-h-[100px]';
const focusRingClass = 'focus:outline-none focus-visible:ring-1 focus-visible:ring-primary-200/50';

/* ─── Toggle switch ─────────────────────────────────────────────────────── */

const ToggleSwitch: React.FC<{ enabled: boolean; onToggle: () => void; label: string }> = ({
  enabled,
  onToggle,
  label,
}) => (
  <button
    onClick={onToggle}
    className={`relative w-7 h-4 rounded-full transition-colors duration-150 ${focusRingClass} flex-shrink-0 cursor-pointer ${
      enabled ? 'bg-success-30' : 'bg-white/[0.10]'
    }`}
    aria-label={`Toggle ${label}`}
    role="switch"
    aria-checked={enabled}
  >
    <span
      className={`absolute top-[2px] w-3 h-3 rounded-full bg-white transition-transform duration-150 ${
        enabled ? 'left-[14px]' : 'left-[2px]'
      }`}
    />
  </button>
);

/* ─── Modal wrapper ─────────────────────────────────────────────────────── */

const ModalWrapper: React.FC<{
  open: boolean;
  onClose: () => void;
  children: React.ReactNode;
}> = ({ open, onClose, children }) => {
  const shouldReduce = useReducedMotion();

  useEffect(() => {
    if (!open) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [open, onClose]);

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          variants={shouldReduce ? undefined : modalOverlay}
          initial="hidden"
          animate="visible"
          exit="exit"
          className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-6"
          onClick={(e) => {
            if (e.target === e.currentTarget) onClose();
          }}
        >
          <motion.div
            variants={shouldReduce ? undefined : modalPanel}
            initial="hidden"
            animate="visible"
            exit="exit"
            className="max-w-lg w-full bg-[#161618] border border-white/[0.10] rounded-xl p-6 max-h-[90vh] overflow-y-auto"
            style={{ boxShadow: `${cardInset}, 0 8px 32px rgba(0,0,0,0.5)` }}
            onClick={(e) => e.stopPropagation()}
          >
            {children}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

/* ─── Modal: Detection Event ────────────────────────────────────────────── */

const DetectionEventModal: React.FC<{
  agentId: string;
  event: AgentDetectionEvent | null;
  onClose: () => void;
}> = ({ agentId, event, onClose }) => {
  const { addDetectionEvent, updateDetectionEvent, deleteDetectionEvent } = useReportStore();
  const isNew = event === null;

  const [form, setForm] = useState<AgentDetectionEvent>(() =>
    event ?? {
      id: `evt-${Date.now()}`,
      name: 'New detection event',
      description: '',
      enabled: true,
      defaultSeverity: 'moderate' as Severity,
      compareHistorical: false,
    }
  );

  const patch = (updates: Partial<AgentDetectionEvent>) => setForm((f) => ({ ...f, ...updates }));

  const handleSave = () => {
    if (isNew) addDetectionEvent(agentId, form);
    else updateDetectionEvent(agentId, form.id, form);
    onClose();
  };

  const handleDelete = () => {
    if (!isNew) deleteDetectionEvent(agentId, form.id);
    onClose();
  };

  return (
    <>
      <p className="text-[16px] font-semibold text-white/[0.92] mb-0.5">{isNew ? 'New detection event' : form.name}</p>
      <p className="text-[13px] text-white/[0.42] mb-5">
        Configure how this detection type is written about in reports
      </p>

      <div className="mb-4">
        <label className={fieldLabelClass}>Event name</label>
        <input type="text" value={form.name} onChange={(e) => patch({ name: e.target.value })} className={fieldInputClass} />
      </div>

      <div className="flex gap-3 mb-4">
        <div className="flex-1">
          <label className={fieldLabelClass}>Include in report</label>
          <AppSelect value={form.enabled ? 'enabled' : 'disabled'} onValueChange={(v) => patch({ enabled: v === 'enabled' })} options={[{ value: 'enabled', label: 'Enabled' }, { value: 'disabled', label: 'Disabled' }]} />
        </div>
        <div className="flex-1">
          <label className={fieldLabelClass}>Default severity</label>
          <AppSelect value={form.defaultSeverity} onValueChange={(v) => patch({ defaultSeverity: v as Severity })} options={[{ value: 'low', label: 'Low' }, { value: 'moderate', label: 'Moderate' }, { value: 'high', label: 'High' }, { value: 'critical', label: 'Critical' }]} />
        </div>
      </div>

      <div className="mb-4">
        <label className={fieldLabelClass}>Report instruction</label>
        <p className="text-[11px] text-white/[0.35] mb-1.5">Tell the AI how to write about this detection type in reports</p>
        <textarea value={form.description} onChange={(e) => patch({ description: e.target.value })} className={fieldTextareaClass} rows={3} />
      </div>

      <div className="mb-6">
        <label className="flex items-start gap-2.5 cursor-pointer group">
          <input
            type="checkbox"
            checked={form.compareHistorical}
            onChange={(e) => patch({ compareHistorical: e.target.checked })}
            className="mt-0.5 w-4 h-4 rounded border-white/[0.15] bg-[#1C1C1F] accent-primary-200 cursor-pointer"
          />
          <div>
            <span className="text-[13px] text-white/[0.85] group-hover:text-white/[0.92] transition-colors duration-150">Include historical comparison</span>
            <p className="text-[11px] text-white/[0.35] mt-0.5">Mention trends from previous patrols when this detection type appears</p>
          </div>
        </label>
      </div>

      <div className="flex items-center justify-between mt-6 pt-4 border-t border-white/[0.05]">
        <div>
          {!isNew && (
            <button onClick={handleDelete} className={`text-[13px] text-error-30 hover:text-error-20 transition-colors duration-150 ${focusRingClass} rounded px-2 py-1 cursor-pointer`}>
              <i className="fa-solid fa-trash text-xs mr-1.5" />Delete
            </button>
          )}
        </div>
        <div className="flex items-center gap-3">
          <button onClick={onClose} className={`text-white/[0.50] hover:text-white/[0.75] px-4 py-2 rounded-lg transition-colors duration-150 ${focusRingClass} cursor-pointer`}>Cancel</button>
          <button onClick={handleSave} className={`bg-primary-200 text-white px-4 py-2 rounded-lg font-medium hover:bg-primary-100 transition-colors duration-150 ${focusRingClass} cursor-pointer`}>Save changes</button>
        </div>
      </div>
    </>
  );
};

/* ─── Modal: Profile Edit ───────────────────────────────────────────────── */

const ProfileEditModal: React.FC<{
  agent: Agent;
  onClose: () => void;
}> = ({ agent, onClose }) => {
  const { updateAgent, updateAgentConfig } = useReportStore();

  const [form, setForm] = useState({
    name: agent.name,
    description: agent.description,
    domain: agent.domain,
    analysisDepth: agent.config.analysisDepth,
    tone: agent.config.tone,
  });

  const patch = (u: Partial<typeof form>) => setForm((f) => ({ ...f, ...u }));

  const handleSave = () => {
    updateAgent(agent.id, { name: form.name, description: form.description, domain: form.domain });
    updateAgentConfig(agent.id, { analysisDepth: form.analysisDepth, tone: form.tone });
    onClose();
  };

  return (
    <>
      <p className="text-[16px] font-semibold text-white/[0.92] mb-5">Edit profile</p>

      <div className="mb-4">
        <label className={fieldLabelClass}>Name</label>
        <input type="text" value={form.name} onChange={(e) => patch({ name: e.target.value })} className={fieldInputClass} />
      </div>

      <div className="mb-4">
        <label className={fieldLabelClass}>Description</label>
        <textarea value={form.description} onChange={(e) => patch({ description: e.target.value })} className={fieldTextareaClass} rows={3} />
      </div>

      <div className="flex gap-3 mb-4">
        <div className="flex-1">
          <label className={fieldLabelClass}>Domain</label>
          <AppSelect value={form.domain} onValueChange={(v) => patch({ domain: v as Agent['domain'] })} options={[{ value: 'security', label: 'Security' }, { value: 'inspection', label: 'Inspection' }, { value: 'surveillance', label: 'Surveillance' }, { value: 'custom', label: 'Custom' }]} />
        </div>
      </div>

      <div className="flex gap-3 mb-6">
        <div className="flex-1">
          <label className={fieldLabelClass}>Analysis depth</label>
          <AppSelect value={form.analysisDepth} onValueChange={(v) => patch({ analysisDepth: v as Agent['config']['analysisDepth'] })} options={[{ value: 'basic', label: 'Basic' }, { value: 'standard', label: 'Standard' }, { value: 'detailed', label: 'Detailed' }]} />
        </div>
        <div className="flex-1">
          <label className={fieldLabelClass}>Tone</label>
          <AppSelect value={form.tone} onValueChange={(v) => patch({ tone: v as Agent['config']['tone'] })} options={[{ value: 'operational', label: 'Operational' }, { value: 'executive', label: 'Executive' }, { value: 'compliance', label: 'Compliance' }, { value: 'forensic', label: 'Forensic' }]} />
        </div>
      </div>

      <div className="flex items-center justify-end gap-3 mt-6 pt-4 border-t border-white/[0.05]">
        <button onClick={onClose} className={`text-white/[0.50] hover:text-white/[0.75] px-4 py-2 rounded-lg transition-colors duration-150 ${focusRingClass} cursor-pointer`}>Cancel</button>
        <button onClick={handleSave} className={`bg-primary-200 text-white px-4 py-2 rounded-lg font-medium hover:bg-primary-100 transition-colors duration-150 ${focusRingClass} cursor-pointer`}>Save changes</button>
      </div>
    </>
  );
};

/* ─── Main component ────────────────────────────────────────────────────── */

const AgentDetail: React.FC<AgentDetailProps> = ({ agent }) => {
  const navigate = useNavigate();
  const shouldReduce = useReducedMotion();
  const {
    templates,
    updateAgentStatus,
    updateAgentConfig,
    deleteAgent,
  } = useReportStore();

  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [detectionModal, setDetectionModal] = useState<{ event: AgentDetectionEvent | null } | null>(null);
  const [profileEditOpen, setProfileEditOpen] = useState(false);

  const defaultTemplate = templates.find((t) => t.id === agent.config.defaultTemplateId);

  const handleDeleteAgent = () => {
    deleteAgent(agent.id);
    navigate({ to: '/agents' });
  };

  const handleAddEvent = () => {
    setDetectionModal({ event: null });
  };

  return (
    <div className="min-h-screen bg-[#0F0F11]">
      {/* ─── Sticky top bar ─── */}
      <div className="sticky top-0 z-10 bg-[#0F0F11]/80 backdrop-blur-md border-b border-white/[0.06] px-6 py-3 flex items-center gap-4">
        <button
          onClick={() => navigate({ to: '/agents' })}
          className={`text-[12px] text-white/[0.50] hover:text-white/[0.80] transition-colors duration-150 flex items-center gap-1.5 ${focusRingClass} rounded px-1 cursor-pointer`}
          aria-label="Back to agents"
        >
          <i className="fa-solid fa-arrow-left text-xs" />
          Agents
        </button>

        <div className="flex-1 text-center flex items-center justify-center gap-2">
          <i className={`${agent.icon} text-white/[0.45] text-xs`} />
          <span className="text-[16px] font-semibold text-white/[0.92]">{agent.name}</span>
        </div>

        <div className="w-[60px]" />
      </div>

      {/* ─── Content ─── */}
      <PageTransition>
        <motion.div
          variants={shouldReduce ? undefined : sectionContainer}
          initial="hidden"
          animate="visible"
          className="max-w-3xl mx-auto px-6 py-6"
        >
          {/* ─── PROFILE ─── */}
          <motion.section variants={shouldReduce ? undefined : sectionBlock} className="mb-10">
            <p className="text-[12px] uppercase tracking-wider text-white/[0.35] font-medium mb-3">Profile</p>
            <div className="flex items-center gap-3 mb-2">
              <h2 className="text-[22px] font-semibold text-white/[0.92] tracking-tight">{agent.name}</h2>
              <button
                onClick={() => updateAgentStatus(agent.id, agent.status === 'active' ? 'inactive' : 'active')}
                className={`text-[12px] font-medium px-2.5 py-1 rounded-lg cursor-pointer transition-all duration-150 ${focusRingClass} ${
                  agent.status === 'active'
                    ? 'bg-success-30/15 text-success-30 hover:bg-success-30/25'
                    : 'bg-white/[0.06] text-white/[0.40] hover:bg-white/[0.10]'
                }`}
                aria-label={`Toggle availability`}
              >
                {statusLabel[agent.status]}
              </button>
            </div>
            <p className="text-[14px] text-white/[0.55] leading-relaxed max-w-[65ch]">{agent.description}</p>
            <div className="flex items-center gap-1.5 mt-3 flex-wrap">
              <span className="text-[12px] font-medium bg-[#1C1C1F] text-white/[0.45] rounded-lg px-2.5 py-1 capitalize">{agent.domain}</span>
              <span className="text-[12px] font-medium bg-[#1C1C1F] text-white/[0.45] rounded-lg px-2.5 py-1">{agent.config.analysisDepth} analysis</span>
              <span className="text-[12px] font-medium bg-[#1C1C1F] text-white/[0.45] rounded-lg px-2.5 py-1 capitalize">{agent.config.tone} tone</span>
            </div>
            <button
              onClick={() => setProfileEditOpen(true)}
              className={`text-[13px] text-white/[0.50] hover:text-white/[0.75] transition-colors duration-150 ${focusRingClass} rounded mt-3 flex items-center gap-1.5 cursor-pointer`}
            >
              <i className="fa-solid fa-pen text-xs" />Edit profile
            </button>
          </motion.section>

          {/* ─── WHAT TO DETECT ─── */}
          <motion.section variants={shouldReduce ? undefined : sectionBlock} className="mb-10">
            <div className="mb-3">
              <p className="text-[12px] uppercase tracking-wider text-white/[0.35] font-medium">What to detect</p>
            </div>

            <div className="grid gap-3" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))' }}>
              {agent.config.detectionEvents.map((event) => (
                <button
                  key={event.id}
                  onClick={() => setDetectionModal({ event })}
                  className={`text-left rounded-xl p-4 transition-all duration-150 ${focusRingClass} cursor-pointer ${
                    event.enabled
                      ? 'bg-[#161618] border border-white/[0.08] hover:border-white/[0.15]'
                      : 'border border-dashed border-white/[0.08] opacity-40'
                  }`}
                  style={event.enabled ? { boxShadow: cardInset } : undefined}
                >
                  <div className="flex items-center gap-2 mb-1">
                    <span className={`inline-block w-1.5 h-1.5 rounded-full flex-shrink-0 ${event.enabled ? 'bg-success-30' : 'bg-white/[0.30]'}`} />
                    <span className={`text-[14px] font-medium truncate ${event.enabled ? 'text-white/[0.85]' : 'text-white/[0.30]'}`}>{event.name}</span>
                  </div>
                  {event.enabled ? (
                    <>
                      <p className="text-[12px] text-white/[0.40] capitalize">{severityLabels[event.defaultSeverity]} severity</p>
                      {event.compareHistorical && <p className="text-[12px] text-white/[0.40]">Compares history</p>}
                    </>
                  ) : (
                    <p className="text-[12px] text-white/[0.30]">Disabled</p>
                  )}
                </button>
              ))}

              <button
                onClick={handleAddEvent}
                className={`rounded-xl border border-dashed border-white/[0.10] p-4 flex flex-col items-center justify-center gap-1.5 hover:border-white/[0.20] hover:bg-white/[0.02] transition-all duration-150 ${focusRingClass} cursor-pointer min-h-[80px]`}
              >
                <i className="fa-solid fa-plus text-xs text-white/[0.40]" />
                <span className="text-[13px] text-white/[0.40]">Add detection</span>
              </button>
            </div>
          </motion.section>

          {/* ─── SETTINGS ─── */}
          <motion.section variants={shouldReduce ? undefined : sectionBlock} className="mb-10">
            <p className="text-[12px] uppercase tracking-wider text-white/[0.35] font-medium mb-3">Settings</p>
            <div
              className="bg-[#161618] border border-white/[0.08] rounded-xl overflow-hidden"
              style={{ boxShadow: cardInset }}
            >
              <div className="flex items-center justify-between px-5 py-3.5">
                <span className="text-[14px] text-white/[0.50]">Auto-generate reports</span>
                <ToggleSwitch enabled={agent.config.autoGenerate} onToggle={() => updateAgentConfig(agent.id, { autoGenerate: !agent.config.autoGenerate })} label="Auto-generate reports" />
              </div>
              <div className="border-t border-white/[0.05]" />
              <div className="flex items-center justify-between px-5 py-3.5">
                <span className="text-[14px] text-white/[0.50]">Default template</span>
                <AppSelect
                  value={agent.config.defaultTemplateId}
                  onValueChange={(v) => updateAgentConfig(agent.id, { defaultTemplateId: v })}
                  options={templates.map((t) => ({ value: t.id, label: `${t.name} (${t.sections.length} sections)` }))}
                  triggerClassName="h-auto py-1.5 px-3 text-[14px] min-w-[200px]"
                />
              </div>
            </div>
          </motion.section>

          {/* ─── DELETE ZONE ─── */}
          <div className="mt-10 pt-4 border-t border-white/[0.05]">
            <button
              onClick={() => setShowDeleteConfirm(true)}
              className={`text-[13px] text-error-30 hover:text-error-20 transition-colors duration-150 ${focusRingClass} rounded flex items-center gap-1.5 cursor-pointer`}
            >
              <i className="fa-solid fa-trash text-xs" />Delete agent
            </button>
            <AnimatePresence>
              {showDeleteConfirm && (
                <motion.div
                  initial={shouldReduce ? undefined : { opacity: 0, height: 0 }}
                  animate={shouldReduce ? undefined : { opacity: 1, height: 'auto' }}
                  exit={shouldReduce ? undefined : { opacity: 0, height: 0 }}
                  className="mt-3 overflow-hidden"
                >
                  <p className="text-[13px] text-white/[0.50] mb-2">This will permanently delete "{agent.name}" and cannot be undone.</p>
                  <div className="flex items-center gap-3">
                    <button onClick={() => setShowDeleteConfirm(false)} className={`text-white/[0.50] hover:text-white/[0.75] px-4 py-2 rounded-lg transition-colors duration-150 ${focusRingClass} cursor-pointer`}>Cancel</button>
                    <button onClick={handleDeleteAgent} className={`bg-error-30 text-white text-[13px] font-medium rounded-lg px-4 py-2 hover:opacity-90 transition-colors duration-150 ${focusRingClass} cursor-pointer`}>Delete</button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </motion.div>
      </PageTransition>

      {/* ─── Modals ─── */}
      <ModalWrapper open={detectionModal !== null} onClose={() => setDetectionModal(null)}>
        {detectionModal && <DetectionEventModal agentId={agent.id} event={detectionModal.event} onClose={() => setDetectionModal(null)} />}
      </ModalWrapper>

      <ModalWrapper open={profileEditOpen} onClose={() => setProfileEditOpen(false)}>
        <ProfileEditModal agent={agent} onClose={() => setProfileEditOpen(false)} />
      </ModalWrapper>
    </div>
  );
};

export default AgentDetail;
