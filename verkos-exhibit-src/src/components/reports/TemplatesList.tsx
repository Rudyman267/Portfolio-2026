import React, { useState } from 'react';
import { useNavigate } from '@tanstack/react-router';
import { motion, useReducedMotion } from 'framer-motion';
import { useReportStore } from '../../store/report.store';
import { ReportTemplate, TemplateStatus } from '../../types/report.types';
import PageTransition from './PageTransition';
import CreateTemplateModal from './CreateTemplateModal';

const statusBadgeClass: Record<TemplateStatus, string> = {
  active: 'bg-success-30/10 text-success-30',
  draft: 'bg-caution-30/10 text-caution-30',
};

const statusLabel: Record<TemplateStatus, string> = {
  active: 'Active',
  draft: 'Draft',
};

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.05, delayChildren: 0.1 },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 12 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.25, ease: [0.25, 0.1, 0.25, 1] as const },
  },
};

const TemplateCard: React.FC<{ template: ReportTemplate; onClick: () => void }> = ({ template, onClick }) => {
  const shouldReduce = useReducedMotion();
  const hover = shouldReduce ? undefined : { y: -2 };
  const enabledSections = template.sections.filter((s) => s.enabled);

  return (
    <motion.button
      variants={itemVariants}
      whileHover={hover}
      transition={{ duration: 0.2, ease: 'easeOut' }}
      onClick={onClick}
      className="bg-[#161618] border border-white/[0.08] rounded-xl overflow-hidden hover:border-white/[0.15] hover:shadow-[0_2px_12px_rgba(0,0,0,0.3)] transition-all duration-200 flex flex-col text-left cursor-pointer w-full"
      style={{ boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.04)' }}
    >
      {/* Top zone */}
      <div className="h-[80px] bg-[#1C1C1F] p-4 flex flex-col justify-between">
        <div className="flex items-start justify-between gap-2">
          <span className="text-[16px] font-semibold text-white/[0.92] truncate">{template.name}</span>
          <div className="flex items-center gap-1.5 flex-shrink-0">
            {template.isDefault && (
              <span className="text-[11px] font-medium bg-primary-200/10 text-primary-200 rounded-md px-1.5 py-0.5">
                Default
              </span>
            )}
            <span className={`text-[11px] font-medium rounded-md px-1.5 py-0.5 ${statusBadgeClass[template.status]}`}>
              {statusLabel[template.status]}
            </span>
          </div>
        </div>
      </div>

      {/* Content zone */}
      <div className="p-5 flex-1 flex flex-col">
        <p className="text-[13px] text-white/[0.42] leading-relaxed mb-3 line-clamp-2">{template.description}</p>

        {/* Section pills */}
        <div className="flex flex-wrap gap-1.5 mb-3">
          {enabledSections.map((section) => (
            <span
              key={section.id}
              className="bg-[#1C1C1F] rounded-md px-2 py-0.5 text-[11px] text-white/[0.50]"
            >
              {section.name}
            </span>
          ))}
        </div>

        {/* Footer */}
        <div className="flex items-center gap-3 mt-auto text-[12px] text-white/[0.35]">
          <span>{enabledSections.length} sections</span>
          <span>·</span>
          <span className="capitalize">{template.coverStyle} cover</span>
          <span>·</span>
          <span>{template.pageSize}</span>
        </div>
      </div>
    </motion.button>
  );
};

const TemplatesList: React.FC = () => {
  const navigate = useNavigate();
  const templates = useReportStore((s) => s.templates);
  const [showCreateModal, setShowCreateModal] = useState(false);

  return (
    <PageTransition>
      <div className="max-w-4xl mx-auto px-6 py-6">
        <div className="mb-6">
          <h1 className="text-[20px] font-semibold tracking-tight text-white/[0.92]">Templates</h1>
          <p className="text-[13px] text-white/[0.42] mt-1">PDF report templates and layouts</p>
        </div>

        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          className="grid grid-cols-1 md:grid-cols-2 gap-5"
        >
          {templates.map((template) => (
            <TemplateCard
              key={template.id}
              template={template}
              onClick={() => navigate({ to: '/template/$templateId', params: { templateId: template.id } as never })}
            />
          ))}

          {/* Add new template */}
          <motion.button
            variants={itemVariants}
            onClick={() => setShowCreateModal(true)}
            className="rounded-xl border border-dashed border-white/[0.10] flex flex-col items-center justify-center gap-2 hover:border-white/[0.20] hover:bg-white/[0.02] transition-all duration-150 cursor-pointer min-h-[200px]"
          >
            <i className="fa-solid fa-plus text-white/[0.30] text-lg" />
            <span className="text-[14px] text-white/[0.40]">New template</span>
          </motion.button>
        </motion.div>
      </div>

      {showCreateModal && <CreateTemplateModal onClose={() => setShowCreateModal(false)} />}
    </PageTransition>
  );
};

export default TemplatesList;
