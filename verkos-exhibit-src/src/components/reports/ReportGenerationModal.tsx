import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';

export interface GenerationStep {
  id: string;
  label: string;
  status: 'pending' | 'running' | 'done' | 'error' | 'skipped';
  detail?: string;
}

interface ReportGenerationModalProps {
  open: boolean;
  steps: GenerationStep[];
  currentStepIndex: number;
  error?: string | null;
  onCancel?: () => void;
}

const ReportGenerationModal: React.FC<ReportGenerationModalProps> = ({
  open,
  steps,
  error,
  onCancel,
}) => {
  const progress = steps.length > 0
    ? Math.round(
        (steps.filter((s) => s.status === 'done' || s.status === 'skipped').length /
          steps.length) *
          100
      )
    : 0;

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          className="fixed inset-0 z-[60] bg-black/70 backdrop-blur-sm flex items-center justify-center p-6"
          role="dialog"
          aria-modal="true"
          aria-label="Generating report"
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.97 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.98 }}
            transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
            className="max-w-md w-full bg-[#161618] rounded-xl border border-white/[0.10] p-6"
            style={{ boxShadow: '0 8px 32px rgba(0,0,0,0.5), inset 0 1px 0 rgba(255,255,255,0.04)' }}
          >
            {/* Header */}
            <div className="flex items-start gap-3 mb-5">
              <div className={`w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0 ${error ? 'bg-error-30/15' : 'bg-primary-200/15'}`}>
                {error ? (
                  <i className="fa-solid fa-circle-exclamation text-error-30 text-base" />
                ) : (
                  <i className="fa-solid fa-wand-magic-sparkles text-primary-200 text-base" />
                )}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-[15px] font-semibold text-white/[0.92]">
                  {error ? 'Generation failed' : 'Generating report'}
                </p>
                <p className="text-[12px] text-white/[0.42] mt-0.5">
                  {error || 'Running AI analysis on your flight data…'}
                </p>
              </div>
            </div>

            {/* Progress bar */}
            <div className="h-1 bg-white/[0.06] rounded-full overflow-hidden mb-5">
              <motion.div
                className={`h-full ${error ? 'bg-error-30' : 'bg-primary-200'}`}
                initial={{ width: 0 }}
                animate={{ width: `${progress}%` }}
                transition={{ duration: 0.4, ease: 'easeOut' }}
              />
            </div>

            {/* Steps */}
            <ul className="space-y-2.5 mb-5">
              {steps.map((step) => {
                const iconClass =
                  step.status === 'done'
                    ? 'fa-solid fa-check text-success-30'
                    : step.status === 'running'
                    ? 'fa-solid fa-circle-notch fa-spin text-primary-200'
                    : step.status === 'error'
                    ? 'fa-solid fa-xmark text-error-30'
                    : step.status === 'skipped'
                    ? 'fa-solid fa-minus text-white/[0.30]'
                    : 'fa-regular fa-circle text-white/[0.20]';

                const labelTone =
                  step.status === 'pending'
                    ? 'text-white/[0.40]'
                    : step.status === 'skipped'
                    ? 'text-white/[0.45]'
                    : 'text-white/[0.80]';

                return (
                  <li key={step.id} className="flex items-start gap-2.5">
                    <span className="w-4 h-4 mt-0.5 flex items-center justify-center flex-shrink-0 text-[11px]">
                      <i className={iconClass} />
                    </span>
                    <div className="flex-1 min-w-0">
                      <p className={`text-[13px] ${labelTone}`}>{step.label}</p>
                      {step.detail && (
                        <p className="text-[11px] text-white/[0.30] mt-0.5 truncate">
                          {step.detail}
                        </p>
                      )}
                    </div>
                  </li>
                );
              })}
            </ul>

            {(error || onCancel) && (
              <div className="flex justify-end pt-3 border-t border-white/[0.05]">
                <button
                  onClick={onCancel}
                  className="text-white/[0.55] hover:text-white/[0.85] px-4 py-2 rounded-lg text-[13px] transition-colors duration-150 cursor-pointer focus:outline-none focus-visible:ring-1 focus-visible:ring-primary-200/50"
                >
                  {error ? 'Close' : 'Cancel'}
                </button>
              </div>
            )}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default ReportGenerationModal;
