import React, { useState } from 'react';
import { useNavigate } from '@tanstack/react-router';
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion';
import { ReportTemplate } from '../../types/report.types';
import { useReportStore } from '../../store/report.store';
import { openReportPrintWindow } from '../../services/report-print';
import ReportPrintView from './ReportPrintView';
import PageTransition from './PageTransition';
import TemplateIdentityPanel from './template-panels/TemplateIdentityPanel';
import TemplateVoicePanel from './template-panels/TemplateVoicePanel';
import TemplateSectionsPanel from './template-panels/TemplateSectionsPanel';
import TemplateLayoutPanel from './template-panels/TemplateLayoutPanel';
import { buildTemplatePreviewInput } from './template-panels/templatePreviewBuilder';

/* ─── Shared styling ────────────────────────────────────────────────────── */

const focusRingClass = 'focus:outline-none focus-visible:ring-1 focus-visible:ring-primary-200/50';
const cardInset = 'inset 0 1px 0 rgba(255,255,255,0.04)';

/* ─── Nav items ─────────────────────────────────────────────────────────── */

type NavItem = 'identity' | 'voice' | 'sections' | 'layout';

const navItems: Array<{ id: NavItem; label: string; icon: string }> = [
  { id: 'identity', label: 'Identity', icon: 'fa-solid fa-fingerprint' },
  { id: 'voice', label: 'Voice', icon: 'fa-solid fa-comment-dots' },
  { id: 'sections', label: 'Sections', icon: 'fa-solid fa-list' },
  { id: 'layout', label: 'Layout', icon: 'fa-solid fa-pager' },
];

/* ─── Pinned preview aside ─────────────────────────────────────────────── */

const PinnedPreview: React.FC<{ template: ReportTemplate }> = ({ template }) => {
  const containerRef = React.useRef<HTMLDivElement>(null);
  const [scale, setScale] = React.useState(0.45);

  const previewInput = React.useMemo(() => buildTemplatePreviewInput(template), [template]);

  React.useEffect(() => {
    const calc = () => {
      if (containerRef.current) {
        const containerWidth = containerRef.current.clientWidth - 32;
        const targetScale = Math.min(Math.max(containerWidth / 793, 0.25), 0.6);
        setScale(targetScale);
      }
    };
    calc();
    window.addEventListener('resize', calc);
    return () => window.removeEventListener('resize', calc);
  }, []);

  const A4_WIDTH_PX = 793;

  return (
    <aside className="w-[420px] flex-shrink-0 hidden xl:block">
      <div className="sticky top-[56px]">
        <div className="flex items-center justify-between mb-2 px-1">
          <span className="text-[12px] uppercase tracking-wider text-white/[0.35] font-medium">
            Preview
          </span>
          <button
            onClick={() => openReportPrintWindow(previewInput, `${template.name} — Preview`)}
            className={`text-[12px] text-white/[0.50] hover:text-white/[0.75] transition-colors duration-150 ${focusRingClass} rounded flex items-center gap-1.5 cursor-pointer`}
          >
            <i className="fa-solid fa-expand text-[10px]" />
            Open full
          </button>
        </div>

        <div
          ref={containerRef}
          className="bg-[#161618] border border-white/[0.08] rounded-xl overflow-hidden"
          style={{ boxShadow: cardInset }}
        >
          <div className="px-4 py-2.5 border-b border-white/[0.05] flex items-center justify-between">
            <span className="text-[12px] text-white/[0.45]">Sample report</span>
            <span className="text-[11px] text-white/[0.30]">
              {template.sections.filter((s) => s.enabled).length} sections · {template.pageSize}
            </span>
          </div>

          <div
            className="overflow-y-auto bg-[#0A0A0C] p-4 flex justify-center"
            style={{
              height: 'calc(100vh - 180px)',
              maxHeight: 720,
              scrollbarWidth: 'thin',
              scrollbarColor: 'rgba(255,255,255,0.12) transparent',
            }}
          >
            <div style={{ width: A4_WIDTH_PX * scale }}>
              <div
                style={{
                  transform: `scale(${scale})`,
                  transformOrigin: 'top left',
                  width: A4_WIDTH_PX,
                }}
              >
                <ReportPrintView data={previewInput} previewMode />
              </div>
            </div>
          </div>
        </div>
      </div>
    </aside>
  );
};

/* ─── Main component ────────────────────────────────────────────────────── */

interface TemplateDetailProps {
  template: ReportTemplate;
}

const TemplateDetail: React.FC<TemplateDetailProps> = ({ template }) => {
  const navigate = useNavigate();
  const shouldReduce = useReducedMotion();
  const deleteTemplate = useReportStore((s) => s.deleteTemplate);

  const [activeItem, setActiveItem] = useState<NavItem>('identity');
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const handleDelete = () => {
    deleteTemplate(template.id);
    navigate({ to: '/templates' });
  };

  return (
    <div className="min-h-screen bg-[#0F0F11]">
      {/* ─── Sticky top bar ─── */}
      <div className="sticky top-0 z-20 bg-[#0F0F11]/80 backdrop-blur-md border-b border-white/[0.06] px-6 py-3 flex items-center gap-4">
        <button
          onClick={() => navigate({ to: '/templates' })}
          className={`text-[12px] text-white/[0.50] hover:text-white/[0.80] transition-colors duration-150 flex items-center gap-1.5 ${focusRingClass} rounded px-1 cursor-pointer`}
          aria-label="Back to templates"
        >
          <i className="fa-solid fa-arrow-left text-xs" />
          Templates
        </button>

        <div className="flex-1 text-center flex items-center justify-center gap-2">
          <i className="fa-solid fa-file-lines text-white/[0.45] text-xs" />
          <span className="text-[16px] font-semibold text-white/[0.92]">{template.name}</span>
        </div>

        <div className="w-[60px]" />
      </div>

      <PageTransition>
        <div className="max-w-[1400px] mx-auto px-6 py-6 flex gap-8 items-start">
          {/* ─── Left nav ─── */}
          <nav className="w-[220px] flex-shrink-0 sticky top-[56px]">
            <div className="space-y-0.5">
              {navItems.map((item) => {
                const isActive = activeItem === item.id;
                return (
                  <button
                    key={item.id}
                    onClick={() => setActiveItem(item.id)}
                    className={`w-full text-left px-3 py-2 rounded-lg text-[13px] flex items-center gap-2.5 cursor-pointer transition-colors ${
                      isActive
                        ? 'bg-primary-200/10 text-primary-200'
                        : 'text-white/[0.55] hover:text-white/[0.85] hover:bg-white/[0.03]'
                    } ${focusRingClass}`}
                  >
                    <i className={`${item.icon} text-[12px] w-4 text-center`} />
                    {item.label}
                  </button>
                );
              })}
            </div>

            {/* Delete zone */}
            <div className="mt-8 pt-4 border-t border-white/[0.05]">
              <button
                onClick={() => setShowDeleteConfirm(true)}
                className={`text-[12px] text-error-30 hover:text-error-20 transition-colors duration-150 ${focusRingClass} rounded flex items-center gap-1.5 cursor-pointer px-3 py-2`}
              >
                <i className="fa-solid fa-trash text-[10px]" />
                Delete template
              </button>
              <AnimatePresence>
                {showDeleteConfirm && (
                  <motion.div
                    initial={shouldReduce ? undefined : { opacity: 0, height: 0 }}
                    animate={shouldReduce ? undefined : { opacity: 1, height: 'auto' }}
                    exit={shouldReduce ? undefined : { opacity: 0, height: 0 }}
                    className="overflow-hidden"
                  >
                    <div className="mt-2 px-3 pt-2">
                      <p className="text-[12px] text-white/[0.50] mb-2 leading-relaxed">
                        Permanently delete "{template.name}"?
                      </p>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => setShowDeleteConfirm(false)}
                          className={`text-[12px] text-white/[0.50] hover:text-white/[0.75] px-2.5 py-1 rounded-md transition-colors duration-150 ${focusRingClass} cursor-pointer`}
                        >
                          Cancel
                        </button>
                        <button
                          onClick={handleDelete}
                          className={`bg-error-30 text-white text-[12px] font-medium rounded-md px-2.5 py-1 hover:opacity-90 transition-colors duration-150 ${focusRingClass} cursor-pointer`}
                        >
                          Delete
                        </button>
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </nav>

          {/* ─── Main content ─── */}
          <main className="flex-1 min-w-0">
            <AnimatePresence mode="wait">
              <motion.div
                key={activeItem}
                initial={shouldReduce ? undefined : { opacity: 0, y: 6 }}
                animate={shouldReduce ? undefined : { opacity: 1, y: 0 }}
                exit={shouldReduce ? undefined : { opacity: 0, y: -4 }}
                transition={{ duration: 0.18, ease: [0.25, 0.1, 0.25, 1] }}
                className="max-w-[640px]"
              >
                {activeItem === 'identity' && <TemplateIdentityPanel template={template} />}
                {activeItem === 'voice' && <TemplateVoicePanel template={template} />}
                {activeItem === 'sections' && <TemplateSectionsPanel template={template} />}
                {activeItem === 'layout' && <TemplateLayoutPanel template={template} />}
              </motion.div>
            </AnimatePresence>
          </main>

          {/* ─── Pinned preview ─── */}
          <PinnedPreview template={template} />
        </div>
      </PageTransition>
    </div>
  );
};

export default TemplateDetail;
