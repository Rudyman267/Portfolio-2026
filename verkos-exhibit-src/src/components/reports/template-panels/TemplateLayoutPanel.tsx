import React from 'react';
import { ReportTemplate } from '../../../types/report.types';
import { useReportStore } from '../../../store/report.store';

type CoverStyle = ReportTemplate['coverStyle'];
type PageSize = ReportTemplate['pageSize'];

const coverOptions: Array<{ value: CoverStyle; label: string }> = [
  { value: 'gradient', label: 'Gradient' },
  { value: 'minimal', label: 'Minimal' },
  { value: 'branded', label: 'Branded' },
];

const pageSizeOptions: Array<{ value: PageSize; label: string }> = [
  { value: 'A4', label: 'A4' },
  { value: 'letter', label: 'Letter' },
];

const pillBase =
  'rounded-lg px-4 py-2 text-[13px] cursor-pointer transition-colors';
const pillUnselected =
  'bg-[#1C1C1F] border border-white/[0.08] text-white/[0.55] hover:border-white/[0.15]';
const pillSelected =
  'bg-primary-200/10 border border-primary-200/30 text-primary-200';

const TemplateLayoutPanel: React.FC<{ template: ReportTemplate }> = ({ template }) => {
  const updateTemplate = useReportStore((s) => s.updateTemplate);

  return (
    <div>
      <h2 className="text-[20px] font-semibold text-white/[0.92] mb-1">Layout</h2>
      <p className="text-[13px] text-white/[0.45] mb-6">How the PDF renders</p>

      <div className="space-y-6">
        <div>
          <p className="text-[12px] text-white/[0.45] font-medium mb-2">Cover style</p>
          <div className="flex flex-wrap gap-2">
            {coverOptions.map((opt) => {
              const selected = template.coverStyle === opt.value;
              return (
                <button
                  key={opt.value}
                  onClick={() => updateTemplate(template.id, { coverStyle: opt.value })}
                  className={`${pillBase} ${selected ? pillSelected : pillUnselected}`}
                >
                  {opt.label}
                </button>
              );
            })}
          </div>
        </div>

        <div>
          <p className="text-[12px] text-white/[0.45] font-medium mb-2">Page size</p>
          <div className="flex flex-wrap gap-2">
            {pageSizeOptions.map((opt) => {
              const selected = template.pageSize === opt.value;
              return (
                <button
                  key={opt.value}
                  onClick={() => updateTemplate(template.id, { pageSize: opt.value })}
                  className={`${pillBase} ${selected ? pillSelected : pillUnselected}`}
                >
                  {opt.label}
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};

export default TemplateLayoutPanel;
