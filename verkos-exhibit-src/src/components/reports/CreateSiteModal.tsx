import React, { useState, useEffect } from 'react';
import { useNavigate } from '@tanstack/react-router';
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion';
import { Site } from '../../types/report.types';
import { useReportStore } from '../../store/report.store';
import AppSelect from '@/components/ui/app-select';

const fieldLabelClass = 'text-[12px] text-white/[0.45] font-medium block mb-1.5';
const fieldInputClass =
  'bg-[#1C1C1F] border border-white/[0.08] rounded-lg text-[14px] text-white/[0.85] px-3 py-2.5 w-full focus:border-primary-200/40 focus:outline-none transition-colors duration-150 placeholder:text-white/[0.20]';
const fieldTextareaClass =
  'bg-[#1C1C1F] border border-white/[0.08] rounded-lg text-[14px] text-white/[0.85] px-3 py-2.5 w-full focus:border-primary-200/40 focus:outline-none transition-colors duration-150 resize-y min-h-[70px] placeholder:text-white/[0.20]';
const focusRingClass = 'focus:outline-none focus-visible:ring-1 focus-visible:ring-primary-200/50';

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

const TIMEZONES = [
  'UTC',
  'Asia/Kolkata (IST)',
  'America/New_York (EST)',
  'America/Los_Angeles (PST)',
  'Europe/London (GMT)',
  'Europe/Paris (CET)',
  'Asia/Tokyo (JST)',
  'Asia/Dubai (GST)',
  'Australia/Sydney (AEST)',
];

const SITE_TYPES = [
  'Industrial facility',
  'Storage facility',
  'Power plant',
  'Solar farm',
  'Warehouse',
  'Data center',
  'Construction site',
  'Oil & gas facility',
  'Agricultural site',
  'Port / terminal',
  'Transportation hub',
  'Other',
];

const OPERATING_HOURS_PRESETS = [
  '24/7',
  'Day operations only: 08:00-18:00',
  'Two shifts: 06:00-22:00',
  'Three shifts: 06:00-14:00, 14:00-22:00, 22:00-06:00',
  'Custom',
];

interface CreateSiteModalProps {
  onClose: () => void;
}

const CreateSiteModal: React.FC<CreateSiteModalProps> = ({ onClose }) => {
  const navigate = useNavigate();
  const shouldReduce = useReducedMotion();
  const addSite = useReportStore((s) => s.addSite);

  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [location, setLocation] = useState('');
  const [timezone, setTimezone] = useState('UTC');
  const [siteType, setSiteType] = useState('Industrial facility');
  const [operatingHoursPreset, setOperatingHoursPreset] = useState('24/7');
  const [customHours, setCustomHours] = useState('');
  const [context, setContext] = useState('');

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [onClose]);

  const canCreate = name.trim().length > 0;

  const handleCreate = () => {
    if (!canCreate) return;

    const operatingHours =
      operatingHoursPreset === 'Custom' ? customHours.trim() || 'Not specified' : operatingHoursPreset;

    const newSite: Site = {
      id: `site-${Date.now()}`,
      name: name.trim(),
      description: description.trim() || 'No description provided',
      location: location.trim(),
      timezone,
      operatingHours,
      siteType,
      assets: [],
      context: context.trim(),
      imageUrl: null,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    addSite(newSite);
    onClose();
    navigate({ to: '/site/$siteId', params: { siteId: newSite.id } as never });
  };

  return (
    <AnimatePresence>
      <motion.div
        variants={modalOverlay}
        initial="hidden"
        animate="visible"
        exit="exit"
        className="fixed inset-0 z-50 flex items-center justify-center"
        style={{ background: 'rgba(0, 0, 0, 0.65)', backdropFilter: 'blur(4px)' }}
        onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
      >
        <motion.div
          variants={shouldReduce ? undefined : modalPanel}
          initial="hidden"
          animate="visible"
          exit="exit"
          className="w-full max-w-[520px] max-h-[85vh] overflow-y-auto mx-4"
          style={{
            background: '#161618',
            border: '1px solid rgba(255, 255, 255, 0.08)',
            borderRadius: '16px',
            boxShadow: '0 24px 80px rgba(0, 0, 0, 0.6)',
          }}
          onClick={(e) => e.stopPropagation()}
        >
          <div className="px-6 pt-6 pb-0">
            <h2 className="text-[18px] font-semibold text-white/[0.92] tracking-tight">
              Create new site
            </h2>
            <p className="text-[13px] text-white/[0.40] mt-1">
              Set up a site with context to improve AI-generated reports
            </p>
          </div>

          <div className="px-6 pt-5 pb-6">
            {/* Site name */}
            <div className="mb-5">
              <label className={fieldLabelClass}>Site name</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g., Skybase Alpha"
                className={fieldInputClass}
                autoFocus
              />
            </div>

            {/* Description */}
            <div className="mb-5">
              <label className={fieldLabelClass}>Description</label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Brief description of the site and its operations"
                className={fieldTextareaClass}
                rows={2}
              />
            </div>

            {/* Location */}
            <div className="mb-5">
              <label className={fieldLabelClass}>Location</label>
              <input
                type="text"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                placeholder="e.g., 18.5623°N, 73.6959°E · Pune, Maharashtra"
                className={fieldInputClass}
              />
            </div>

            {/* Site type + Timezone */}
            <div className="flex gap-3 mb-5">
              <div className="flex-1">
                <label className={fieldLabelClass}>Site type</label>
                <AppSelect
                  value={siteType}
                  onValueChange={setSiteType}
                  options={SITE_TYPES.map((t) => ({ value: t, label: t }))}
                />
              </div>
              <div className="flex-1">
                <label className={fieldLabelClass}>Timezone</label>
                <AppSelect
                  value={timezone}
                  onValueChange={setTimezone}
                  options={TIMEZONES.map((t) => ({ value: t, label: t }))}
                />
              </div>
            </div>

            {/* Operating hours */}
            <div className="mb-5">
              <label className={fieldLabelClass}>Operating hours</label>
              <AppSelect
                value={operatingHoursPreset}
                onValueChange={setOperatingHoursPreset}
                options={OPERATING_HOURS_PRESETS.map((h) => ({ value: h, label: h }))}
              />
              {operatingHoursPreset === 'Custom' && (
                <input
                  type="text"
                  value={customHours}
                  onChange={(e) => setCustomHours(e.target.value)}
                  placeholder="e.g., Mon-Fri 08:00-17:00"
                  className={`${fieldInputClass} mt-2`}
                />
              )}
            </div>

            {/* AI context */}
            <div className="mb-5">
              <label className={fieldLabelClass}>
                AI context <span className="text-white/[0.25] font-normal">(optional)</span>
              </label>
              <textarea
                value={context}
                onChange={(e) => setContext(e.target.value)}
                placeholder="Describe what the AI should know about this site when generating reports. Include history, known issues, authorized vehicles, sensitive areas, etc."
                className={fieldTextareaClass}
                rows={4}
              />
              <p className="text-[12px] text-white/[0.30] mt-1.5">
                The more specific this context, the more accurate AI-generated reports will be. You can edit this later.
              </p>
            </div>

            {/* Footer */}
            <div className="mt-6 pt-4 border-t border-white/[0.05] flex justify-end gap-3">
              <button
                onClick={onClose}
                className={`text-white/[0.50] hover:text-white/[0.75] px-4 py-2 rounded-lg transition-colors duration-150 ${focusRingClass} cursor-pointer`}
              >
                Cancel
              </button>
              <button
                onClick={handleCreate}
                disabled={!canCreate}
                className={`bg-primary-200 text-white px-5 py-2 rounded-lg font-medium hover:bg-primary-100 transition-colors duration-150 ${focusRingClass} cursor-pointer ${
                  !canCreate ? 'opacity-40 cursor-not-allowed' : ''
                }`}
              >
                Create site
              </button>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

export default CreateSiteModal;
