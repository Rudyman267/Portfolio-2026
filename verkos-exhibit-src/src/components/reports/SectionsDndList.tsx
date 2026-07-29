import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  DndContext,
  closestCenter,
  PointerSensor,
  KeyboardSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from '@dnd-kit/core';
import {
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { TemplateSection, SectionMaxLength, ReportSectionKind } from '../../types/report.types';
import { useReportStore } from '../../store/report.store';
import { SECTION_KIND_DEFAULTS } from '../../data/section-kind-defaults';
import AppSelect from '@/components/ui/app-select';

/* ─── Constants ─────────────────────────────────────────────────────────── */

const maxLengthLabels: Record<SectionMaxLength, string> = {
  brief: 'Brief (1 paragraph)',
  standard: 'Standard (2-3 paragraphs)',
  detailed: 'Detailed (no limit)',
};

const toneOverrideLabels: Record<string, string> = {
  default: 'Use template default',
  operational: 'Operational',
  executive: 'Executive',
  compliance: 'Compliance',
  forensic: 'Forensic',
};

/* ─── Shared styling ────────────────────────────────────────────────────── */

const fieldLabelClass = 'text-[12px] text-white/[0.45] font-medium block mb-1';
const fieldInputClass =
  'bg-[#1C1C1F] border border-white/[0.08] rounded-lg text-[14px] text-white/[0.85] px-3 py-2.5 w-full focus:border-primary-200/40 focus:outline-none focus:ring-1 focus:ring-primary-200/10 transition-colors duration-150';
const fieldTextareaClass =
  'bg-[#1C1C1F] border border-white/[0.08] rounded-lg text-[14px] text-white/[0.85] px-3 py-2.5 w-full focus:border-primary-200/40 focus:outline-none focus:ring-1 focus:ring-primary-200/10 transition-colors duration-150 resize-y min-h-[100px]';
const focusRingClass = 'focus:outline-none focus-visible:ring-1 focus-visible:ring-primary-200/50';

/* ─── Sortable Section Card ────────────────────────────────────────────── */

const SortableSectionCard: React.FC<{
  templateId: string;
  section: TemplateSection;
  index: number;
  isExpanded: boolean;
  onToggleExpand: (id: string | null) => void;
}> = ({ templateId, section, index, isExpanded, onToggleExpand }) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({
    id: section.id,
    disabled: isExpanded,
  });

  const { toggleTemplateSection, deleteTemplateSection, updateTemplateSection } = useReportStore();

  const [form, setForm] = useState({
    kind: section.kind,
    name: section.name,
    description: section.description,
    promptInstruction: section.promptInstruction,
    maxLength: section.maxLength,
    toneOverride: section.toneOverride,
    dataFeeds: { ...section.dataFeeds },
  });

  useEffect(() => {
    setForm({
      kind: section.kind,
      name: section.name,
      description: section.description,
      promptInstruction: section.promptInstruction,
      maxLength: section.maxLength,
      toneOverride: section.toneOverride,
      dataFeeds: { ...section.dataFeeds },
    });
  }, [
    section.kind,
    section.name,
    section.description,
    section.promptInstruction,
    section.maxLength,
    section.toneOverride,
    section.dataFeeds,
  ]);

  const handleSave = () => {
    updateTemplateSection(templateId, section.id, form);
    onToggleExpand(null);
  };

  const handleCancel = () => {
    setForm({
      kind: section.kind,
      name: section.name,
      description: section.description,
      promptInstruction: section.promptInstruction,
      maxLength: section.maxLength,
      toneOverride: section.toneOverride,
      dataFeeds: { ...section.dataFeeds },
    });
    onToggleExpand(null);
  };

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    zIndex: isDragging ? 10 : 'auto',
    opacity: isDragging ? 0.6 : 1,
  } as React.CSSProperties;

  const previewInstruction = section.promptInstruction && section.promptInstruction.length > 0
    ? section.promptInstruction.length > 160
      ? section.promptInstruction.slice(0, 160) + '…'
      : section.promptInstruction
    : null;

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`bg-[#161618] border rounded-xl transition-all duration-150 ${
        isDragging ? 'border-primary-200/30 shadow-lg shadow-primary-200/5' : 'border-white/[0.06]'
      } ${!section.enabled ? 'opacity-50' : ''} group`}
    >
      {/* Collapsed / header row */}
      <div
        className={`flex items-start gap-3 px-4 py-3.5 ${!isExpanded ? 'cursor-pointer hover:bg-white/[0.02]' : ''} rounded-xl`}
        onClick={(e) => {
          if ((e.target as HTMLElement).closest('[data-no-expand]')) return;
          if (!isExpanded) onToggleExpand(section.id);
        }}
      >
        {/* Drag handle */}
        <button
          {...attributes}
          {...listeners}
          data-no-expand
          className={`mt-0.5 w-5 h-5 flex items-center justify-center rounded text-white/[0.20] transition-all duration-150 flex-shrink-0 ${
            isExpanded
              ? 'opacity-30 cursor-not-allowed'
              : 'hover:text-white/[0.50] hover:bg-white/[0.05] cursor-grab active:cursor-grabbing'
          }`}
          aria-label="Drag to reorder"
          tabIndex={isExpanded ? -1 : 0}
        >
          <i className="fa-solid fa-grip-vertical text-[10px]" />
        </button>

        {/* Order number */}
        <span className="text-[12px] text-white/[0.20] tabular-nums font-medium mt-0.5 flex-shrink-0 w-5 text-center">
          {String(index + 1).padStart(2, '0')}
        </span>

        {/* Main content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            {/* Code-block styled name */}
            <span className="text-[14px] font-medium text-white/[0.88] flex items-center gap-1">
              <span className="text-primary-200/50 text-[12px] font-mono">{'</'}</span>
              {section.name}
              <span className="text-primary-200/50 text-[12px] font-mono">{'>'}</span>
            </span>
            {/* Meta pills */}
            <span className="text-[11px] text-primary-200 bg-primary-200/10 rounded px-1.5 py-0.5">
              {SECTION_KIND_DEFAULTS[section.kind]?.label ?? 'Custom'}
            </span>
            <span className="text-[11px] text-white/[0.30] bg-white/[0.04] rounded px-1.5 py-0.5">
              {section.maxLength}
            </span>
            {section.toneOverride !== 'default' && (
              <span className="text-[11px] text-white/[0.30] bg-white/[0.04] rounded px-1.5 py-0.5">
                {section.toneOverride} tone
              </span>
            )}
          </div>

          {/* Description */}
          {section.description && (
            <p className="text-[12px] text-white/[0.35] leading-relaxed mt-1">
              {section.description}
            </p>
          )}

          {/* Prompt preview */}
          {!isExpanded && previewInstruction && (
            <div className="mt-2 pl-3 border-l-2 border-white/[0.06]">
              <span className="text-[11px] text-white/[0.25] uppercase tracking-wider font-medium">
                AI Prompt
              </span>
              <p className="text-[12px] text-white/[0.30] leading-relaxed mt-0.5 italic">
                {previewInstruction}
              </p>
            </div>
          )}
        </div>

        {/* Right-side controls */}
        <div className="flex items-center gap-1.5 flex-shrink-0 mt-0.5" data-no-expand>
          <button
            onClick={(e) => {
              e.stopPropagation();
              toggleTemplateSection(templateId, section.id);
            }}
            className={`text-[11px] font-medium rounded-md px-2 py-0.5 transition-colors duration-150 cursor-pointer ${
              section.enabled
                ? 'bg-success-30/15 text-success-30 hover:bg-success-30/25'
                : 'bg-white/[0.06] text-white/[0.35] hover:bg-white/[0.10]'
            }`}
          >
            {section.enabled ? 'Active' : 'Off'}
          </button>
          {!isExpanded && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onToggleExpand(section.id);
              }}
              className="w-6 h-6 flex items-center justify-center rounded text-white/[0.35] hover:text-white/[0.75] hover:bg-white/[0.05] transition-all duration-150 cursor-pointer"
              aria-label="Edit section"
            >
              <i className="fa-solid fa-pen text-[10px]" />
            </button>
          )}
          <button
            onClick={(e) => {
              e.stopPropagation();
              if (confirm(`Delete section "${section.name}"?`)) {
                deleteTemplateSection(templateId, section.id);
              }
            }}
            className="opacity-0 group-hover:opacity-100 w-6 h-6 flex items-center justify-center rounded text-white/[0.25] hover:text-error-30 transition-all duration-150 cursor-pointer"
            aria-label={`Delete ${section.name}`}
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
            <div className="px-4 pb-4 pt-1 space-y-4 border-t border-white/[0.05]">
              <div>
                <label className={fieldLabelClass}>Section type</label>
                <AppSelect
                  value={form.kind}
                  onValueChange={(v) => {
                    const newKind = v as ReportSectionKind;
                    const prevDefaults = SECTION_KIND_DEFAULTS[form.kind];
                    const newDefaults = SECTION_KIND_DEFAULTS[newKind];
                    const feedsStillAtDefault =
                      form.dataFeeds.images === prevDefaults.dataFeeds.images &&
                      form.dataFeeds.structuredData === prevDefaults.dataFeeds.structuredData &&
                      form.dataFeeds.narrativeContext === prevDefaults.dataFeeds.narrativeContext;
                    setForm((f) => ({
                      ...f,
                      kind: newKind,
                      dataFeeds: feedsStillAtDefault ? { ...newDefaults.dataFeeds } : f.dataFeeds,
                    }));
                  }}
                  options={Object.entries(SECTION_KIND_DEFAULTS).map(([v, d]) => ({ value: v, label: d.label }))}
                />
                <p className="text-[11px] text-white/[0.35] mt-1">
                  {SECTION_KIND_DEFAULTS[form.kind].description}
                </p>
              </div>

              <div>
                <label className={fieldLabelClass}>Section name</label>
                <input
                  type="text"
                  value={form.name}
                  onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                  className={fieldInputClass}
                  placeholder="e.g., Executive summary"
                />
              </div>

              <div>
                <label className={fieldLabelClass}>Short description</label>
                <input
                  type="text"
                  value={form.description}
                  onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
                  className="bg-[#1C1C1F] border border-white/[0.08] rounded-lg text-[13px] text-white/[0.70] px-3 py-2 w-full focus:border-primary-200/40 focus:outline-none transition-colors duration-150"
                  placeholder="What does this section cover?"
                />
              </div>

              <div>
                <label className={fieldLabelClass}>
                  AI prompt instruction
                  <span className="text-white/[0.25] font-normal ml-1">— tells the agent what to write</span>
                </label>
                <textarea
                  value={form.promptInstruction}
                  onChange={(e) => setForm((f) => ({ ...f, promptInstruction: e.target.value }))}
                  className={`${fieldTextareaClass} font-mono text-[13px]`}
                  rows={5}
                  placeholder="Write a 2-3 paragraph overview of..."
                />
              </div>

              <div>
                <label className={fieldLabelClass}>What this section includes</label>
                <div className="bg-[#1C1C1F] border border-white/[0.06] rounded-lg p-3 space-y-2.5">
                  {([
                    { key: 'images' as const, label: 'Images from media gallery', hint: 'Attaches forensic + pilot-noted images to the section' },
                    { key: 'structuredData' as const, label: 'Structured data', hint: 'Observations, detections, flight statistics' },
                    { key: 'narrativeContext' as const, label: 'Narrative context', hint: 'Pilot flight context and site information' },
                  ]).map(({ key, label: lbl, hint }) => {
                    const checked = form.dataFeeds[key];
                    return (
                      <label
                        key={key}
                        className="flex items-start gap-2.5 cursor-pointer group rounded-md -mx-1 px-1 py-0.5 hover:bg-white/[0.02] transition-colors duration-150"
                      >
                        <input
                          type="checkbox"
                          className="peer sr-only"
                          checked={checked}
                          onChange={(e) =>
                            setForm((f) => ({ ...f, dataFeeds: { ...f.dataFeeds, [key]: e.target.checked } }))
                          }
                        />
                        <span
                          aria-hidden
                          className={`mt-0.5 w-4 h-4 rounded-[4px] flex items-center justify-center flex-shrink-0 transition-all duration-150 ${
                            checked
                              ? 'bg-primary-200/90 border border-primary-200/90'
                              : 'bg-[#161618] border border-white/[0.12] group-hover:border-white/[0.22]'
                          } peer-focus-visible:ring-1 peer-focus-visible:ring-primary-200/50 peer-focus-visible:ring-offset-1 peer-focus-visible:ring-offset-[#1C1C1F]`}
                        >
                          {checked && (
                            <i className="fa-solid fa-check text-white text-[9px] leading-none" />
                          )}
                        </span>
                        <div>
                          <div className={`text-[13px] transition-colors duration-150 ${checked ? 'text-white/[0.92]' : 'text-white/[0.70] group-hover:text-white/[0.85]'}`}>{lbl}</div>
                          <div className="text-[11px] text-white/[0.35]">{hint}</div>
                        </div>
                      </label>
                    );
                  })}
                </div>
              </div>

              <div className="flex gap-3">
                <div className="flex-1">
                  <label className={fieldLabelClass}>Max length</label>
                  <AppSelect
                    value={form.maxLength}
                    onValueChange={(v) => setForm((f) => ({ ...f, maxLength: v as SectionMaxLength }))}
                    options={Object.entries(maxLengthLabels).map(([v, l]) => ({ value: v, label: l }))}
                  />
                </div>
                <div className="flex-1">
                  <label className={fieldLabelClass}>Tone override</label>
                  <AppSelect
                    value={form.toneOverride}
                    onValueChange={(v) => setForm((f) => ({ ...f, toneOverride: v as TemplateSection['toneOverride'] }))}
                    options={Object.entries(toneOverrideLabels).map(([v, l]) => ({ value: v, label: l }))}
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-white/[0.05]">
                <button
                  onClick={handleCancel}
                  className={`text-white/[0.50] hover:text-white/[0.75] px-4 py-2 rounded-lg transition-colors duration-150 ${focusRingClass} cursor-pointer`}
                >
                  Cancel
                </button>
                <button
                  onClick={handleSave}
                  className={`bg-primary-200 text-white px-4 py-2 rounded-lg font-medium hover:bg-primary-100 transition-colors duration-150 ${focusRingClass} cursor-pointer`}
                >
                  Save changes
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

/* ─── Sections DnD List ────────────────────────────────────────────────── */

const SectionsDndList: React.FC<{
  templateId: string;
  sections: TemplateSection[];
}> = ({ templateId, sections }) => {
  const { moveTemplateSection, addTemplateSection } = useReportStore();
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: 6 },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    const oldIndex = sections.findIndex((s) => s.id === active.id);
    const newIndex = sections.findIndex((s) => s.id === over.id);
    if (oldIndex === -1 || newIndex === -1) return;
    moveTemplateSection(templateId, String(active.id), newIndex);
  };

  const handleAddSection = () => {
    const maxOrder = Math.max(0, ...sections.map((s) => s.order));
    const defaults = SECTION_KIND_DEFAULTS.custom;
    const newSec: TemplateSection = {
      id: `sec-${Date.now()}`,
      kind: 'custom',
      name: 'New section',
      description: defaults.description,
      promptInstruction: defaults.defaultPromptInstruction,
      enabled: true,
      order: maxOrder + 1,
      maxLength: defaults.defaultMaxLength,
      toneOverride: 'default',
      dataFeeds: { ...defaults.dataFeeds },
    };
    addTemplateSection(templateId, newSec);
    setExpandedId(newSec.id);
  };

  return (
    <div className="space-y-2">
      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragEnd={handleDragEnd}
      >
        <SortableContext items={sections.map((s) => s.id)} strategy={verticalListSortingStrategy}>
          {sections.map((section, idx) => (
            <SortableSectionCard
              key={section.id}
              templateId={templateId}
              section={section}
              index={idx}
              isExpanded={expandedId === section.id}
              onToggleExpand={setExpandedId}
            />
          ))}
        </SortableContext>
      </DndContext>

      <button
        onClick={handleAddSection}
        className="w-full border border-dashed border-white/[0.08] rounded-xl p-3.5 text-[13px] text-white/[0.35] hover:text-white/[0.55] hover:border-white/[0.15] flex items-center justify-center gap-2 transition-all duration-150 cursor-pointer"
      >
        <i className="fa-solid fa-plus text-xs" />
        Add section
      </button>
    </div>
  );
};

export default SectionsDndList;
