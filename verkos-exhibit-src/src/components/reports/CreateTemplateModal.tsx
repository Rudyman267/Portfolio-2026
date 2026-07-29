import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion';
import PresetGallery from './template-create/PresetGallery';
import UploadFlow from './template-create/UploadFlow';
import ScratchFlow from './template-create/ScratchFlow';

type PickerView = 'picker' | 'upload' | 'presets' | 'scratch';

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

interface CreateTemplateModalProps {
  onClose: () => void;
}

interface PickerCard {
  id: 'upload' | 'presets' | 'scratch';
  icon: string;
  iconColor: string;
  iconBg: string;
  title: string;
  subtitle: string;
  recommended?: boolean;
}

const CARDS: PickerCard[] = [
  {
    id: 'upload',
    icon: 'fa-solid fa-file-arrow-up',
    iconColor: 'text-primary-200',
    iconBg: 'bg-primary-200/10',
    title: 'Upload a sample report',
    subtitle: "Drop a PDF, Word doc, or paste text. We'll extract the structure, voice, and examples.",
    recommended: true,
  },
  {
    id: 'presets',
    icon: 'fa-solid fa-bolt',
    iconColor: 'text-success-30',
    iconBg: 'bg-success-30/10',
    title: 'Pick a preset',
    subtitle: 'Start from operational, executive, compliance, or inspection presets.',
  },
  {
    id: 'scratch',
    icon: 'fa-solid fa-wand-magic-sparkles',
    iconColor: 'text-caution-30',
    iconBg: 'bg-caution-30/10',
    title: 'Start from scratch',
    subtitle: "Answer a few questions and we'll build a template for you.",
  },
];

const CreateTemplateModal: React.FC<CreateTemplateModalProps> = ({ onClose }) => {
  const shouldReduce = useReducedMotion();
  const [view, setView] = useState<PickerView>('picker');

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (view !== 'picker') {
          setView('picker');
        } else {
          onClose();
        }
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [onClose, view]);

  return (
    <AnimatePresence>
      <motion.div
        variants={shouldReduce ? undefined : modalOverlay}
        initial="hidden"
        animate="visible"
        exit="exit"
        className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4"
        onClick={(e) => {
          if (e.target === e.currentTarget) onClose();
        }}
      >
        <motion.div
          variants={shouldReduce ? undefined : modalPanel}
          initial="hidden"
          animate="visible"
          exit="exit"
          className="bg-[#161618] border border-white/[0.10] rounded-xl shadow-[0_16px_48px_rgba(0,0,0,0.5)] w-full max-w-[560px] max-h-[85vh] overflow-hidden flex flex-col"
          onClick={(e) => e.stopPropagation()}
        >
          {view === 'picker' && (
            <div className="overflow-y-auto" style={{ scrollbarWidth: 'thin', scrollbarColor: 'rgba(255,255,255,0.06) transparent' }}>
              <div className="px-6 pt-6 pb-4">
                <h2 className="text-[16px] font-semibold text-white/[0.92] mb-1">Create new template</h2>
                <p className="text-[13px] text-white/[0.42]">How would you like to start?</p>
              </div>

              <div className="px-6 pb-6 space-y-2.5">
                {CARDS.map((card) => (
                  <button
                    key={card.id}
                    onClick={() => setView(card.id)}
                    className="bg-[#1C1C1F] border border-white/[0.08] rounded-xl p-4 hover:border-primary-200/30 cursor-pointer transition-colors text-left w-full flex items-start gap-3.5 group"
                  >
                    <div className={`w-10 h-10 rounded-lg ${card.iconBg} flex items-center justify-center shrink-0`}>
                      <i className={`${card.icon} ${card.iconColor} text-[15px]`} />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 mb-0.5">
                        <h3 className="text-[14px] font-semibold text-white/[0.90] leading-tight">
                          {card.title}
                        </h3>
                        {card.recommended && (
                          <span className="bg-primary-200/10 text-primary-200 text-[10px] font-medium px-1.5 py-0.5 rounded">
                            Recommended
                          </span>
                        )}
                      </div>
                      <p className="text-[12px] text-white/[0.45] leading-snug">{card.subtitle}</p>
                    </div>
                    <i className="fa-solid fa-chevron-right text-white/[0.20] text-[11px] mt-3 group-hover:text-white/[0.40] group-hover:translate-x-0.5 transition-all" />
                  </button>
                ))}
              </div>

              <div className="px-6 pb-5 pt-1 border-t border-white/[0.05] flex justify-end">
                <button
                  onClick={onClose}
                  className="text-white/[0.50] hover:text-white/[0.75] px-4 py-2 rounded-lg transition-colors duration-150 text-[13px] cursor-pointer mt-3"
                >
                  Cancel
                </button>
              </div>
            </div>
          )}

          {view === 'presets' && (
            <PresetGallery onBack={() => setView('picker')} onPicked={onClose} />
          )}

          {view === 'upload' && <UploadFlow onBack={() => setView('picker')} onPicked={onClose} />}

          {view === 'scratch' && <ScratchFlow onBack={() => setView('picker')} />}
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

export default CreateTemplateModal;
