import React, { useState, useEffect } from 'react';
import { ReportTemplate, TemplateStatus } from '../../../types/report.types';
import { useReportStore } from '../../../store/report.store';
import AppSelect from '@/components/ui/app-select';

const fieldLabelClass = 'text-[12px] text-white/[0.45] font-medium block mb-1';
const fieldInputClass =
  'bg-[#1C1C1F] border border-white/[0.08] rounded-lg text-[14px] text-white/[0.85] px-3 py-2.5 w-full focus:border-primary-200/40 focus:outline-none focus:ring-1 focus:ring-primary-200/10 transition-colors duration-150';
const fieldTextareaClass =
  'bg-[#1C1C1F] border border-white/[0.08] rounded-lg text-[14px] text-white/[0.85] px-3 py-2.5 w-full focus:border-primary-200/40 focus:outline-none focus:ring-1 focus:ring-primary-200/10 transition-colors duration-150 resize-y min-h-[80px]';
const focusRingClass = 'focus:outline-none focus-visible:ring-1 focus-visible:ring-primary-200/50';

const TemplateIdentityPanel: React.FC<{ template: ReportTemplate }> = ({ template }) => {
  const updateTemplate = useReportStore((s) => s.updateTemplate);
  const templates = useReportStore((s) => s.templates);
  const reportCount = useReportStore((s) => s.reports).filter((r) => r.templateId === template.id).length;

  const [form, setForm] = useState({
    name: template.name,
    description: template.description,
    status: template.status,
  });

  useEffect(() => {
    setForm({
      name: template.name,
      description: template.description,
      status: template.status,
    });
  }, [template.name, template.description, template.status]);

  const isDirty =
    form.name !== template.name ||
    form.description !== template.description ||
    form.status !== template.status;

  const handleSave = () => {
    updateTemplate(template.id, form);
  };

  const handleReset = () => {
    setForm({
      name: template.name,
      description: template.description,
      status: template.status,
    });
  };

  const handleMakeDefault = () => {
    const previousDefault = templates.find((t) => t.isDefault && t.id !== template.id);
    if (previousDefault) {
      updateTemplate(previousDefault.id, { isDefault: false });
    }
    updateTemplate(template.id, { isDefault: true });
  };

  return (
    <div>
      <h2 className="text-[20px] font-semibold text-white/[0.92] mb-1">Identity</h2>
      <p className="text-[13px] text-white/[0.45] mb-6">Basic info about this template</p>

      <div className="space-y-4">
        <div>
          <label className={fieldLabelClass}>Template name</label>
          <input
            type="text"
            value={form.name}
            onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
            className={fieldInputClass}
          />
        </div>

        <div>
          <label className={fieldLabelClass}>Description</label>
          <textarea
            value={form.description}
            onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
            className={fieldTextareaClass}
            rows={3}
          />
        </div>

        <div>
          <label className={fieldLabelClass}>Status</label>
          <AppSelect
            value={form.status}
            onValueChange={(v) => setForm((f) => ({ ...f, status: v as TemplateStatus }))}
            options={[
              { value: 'active', label: 'Active' },
              { value: 'draft', label: 'Draft' },
            ]}
          />
        </div>

        <div className="flex items-center justify-between bg-[#1C1C1F] border border-white/[0.08] rounded-lg px-3 py-2.5">
          <span className="text-[13px] text-white/[0.55]">
            {template.isDefault ? (
              <span className="flex items-center gap-2">
                <i className="fa-solid fa-star text-primary-200 text-[11px]" />
                <span className="text-white/[0.85]">Default template</span>
              </span>
            ) : (
              'Not the default template'
            )}
          </span>
          {!template.isDefault && (
            <button
              onClick={handleMakeDefault}
              className={`text-[12px] text-primary-200 hover:text-primary-100 transition-colors duration-150 ${focusRingClass} rounded cursor-pointer`}
            >
              Make default
            </button>
          )}
        </div>

        <p className="text-[12px] text-white/[0.35]">
          {reportCount} {reportCount === 1 ? 'report uses' : 'reports use'} this template
        </p>
      </div>

      {isDirty && (
        <div className="mt-6 pt-4 border-t border-white/[0.05] flex items-center justify-end gap-3">
          <button
            onClick={handleReset}
            className={`text-white/[0.50] hover:text-white/[0.75] px-4 py-2 rounded-lg transition-colors duration-150 ${focusRingClass} cursor-pointer`}
          >
            Reset
          </button>
          <button
            onClick={handleSave}
            className={`bg-primary-200 text-white px-4 py-2 rounded-lg font-medium hover:bg-primary-100 transition-colors duration-150 ${focusRingClass} cursor-pointer`}
          >
            Save changes
          </button>
        </div>
      )}
    </div>
  );
};

export default TemplateIdentityPanel;
