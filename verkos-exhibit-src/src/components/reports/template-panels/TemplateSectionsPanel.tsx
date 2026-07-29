import React from 'react';
import { ReportTemplate } from '../../../types/report.types';
import SectionsDndList from '../SectionsDndList';

const TemplateSectionsPanel: React.FC<{ template: ReportTemplate }> = ({ template }) => {
  const sortedSections = [...template.sections].sort((a, b) => a.order - b.order);
  const activeCount = sortedSections.filter((s) => s.enabled).length;

  return (
    <div>
      <div className="flex items-start justify-between mb-1">
        <h2 className="text-[20px] font-semibold text-white/[0.92]">Sections</h2>
        <span className="text-[12px] text-white/[0.30] mt-2">
          {activeCount} of {sortedSections.length} active
        </span>
      </div>
      <p className="text-[13px] text-white/[0.45] mb-6">
        Drag to reorder · Click a card to edit · Toggle to include in reports
      </p>
      <SectionsDndList templateId={template.id} sections={sortedSections} />
    </div>
  );
};

export default TemplateSectionsPanel;
