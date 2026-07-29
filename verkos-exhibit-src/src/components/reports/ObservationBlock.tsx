import React, { useRef, useEffect, useState } from 'react';
import { Observation, ObservationStatus, Severity, ObservationImage } from '../../types/report.types';
import AppSelect from '@/components/ui/app-select';
import SeverityDot from './SeverityDot';
import ImagePickerPopover from './ImagePickerPopover';

interface ObservationBlockProps {
  observation: Observation;
  editable?: boolean;
  isLast?: boolean;
  onTitleChange?: (title: string) => void;
  onSeverityChange?: (severity: Severity) => void;
  onStatusChange?: (status: ObservationStatus) => void;
  onAiDescriptionChange?: (text: string) => void;
  onPilotContextChange?: (text: string) => void;
  onDelete?: () => void;
  onMoveUp?: () => void;
  onMoveDown?: () => void;
  onImagesChange?: (images: ObservationImage[]) => void;
  onImageAttach?: (rawUrl: string | null, annotatedUrl: string | null) => void;
}

function capitalize(s: string): string {
  return s.charAt(0).toUpperCase() + s.slice(1);
}

const severityTextClass: Record<Severity, string> = {
  critical: 'text-error-30',
  high: 'text-warning-30',
  moderate: 'text-caution-30',
  low: 'text-white/[0.45]',
};

const severityAccent: Record<Severity, string> = {
  critical: 'border-l-error-30',
  high: 'border-l-warning-30',
  moderate: 'border-l-caution-30',
  low: 'border-l-transparent',
};

function useAutoGrow(value: string | null | undefined) {
  const ref = useRef<HTMLTextAreaElement>(null);
  useEffect(() => {
    if (ref.current) {
      ref.current.style.height = 'auto';
      ref.current.style.height = ref.current.scrollHeight + 'px';
    }
  }, [value]);
  const handleInput = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    e.target.style.height = 'auto';
    e.target.style.height = e.target.scrollHeight + 'px';
  };
  return { ref, handleInput };
}

const ObservationBlock: React.FC<ObservationBlockProps> = ({
  observation,
  editable = false,
  isLast = false,
  onTitleChange,
  onSeverityChange,
  onStatusChange,
  onAiDescriptionChange,
  onPilotContextChange,
  onDelete,
  onMoveUp,
  onMoveDown,
  onImagesChange,
  onImageAttach,
}) => {
  const aiRef = useAutoGrow(observation.aiDescription);
  const pilotRef = useAutoGrow(observation.pilotContext);
  const [showImagePicker, setShowImagePicker] = useState(false);
  const [isHovered, setIsHovered] = useState(false);

  const allImages: ObservationImage[] = observation.images?.length
    ? observation.images
    : [
        ...(observation.rawImageUrl ? [{ id: 'raw', url: observation.rawImageUrl, label: 'Raw capture' }] : []),
        ...(observation.annotatedImageUrl ? [{ id: 'annotated', url: observation.annotatedImageUrl, label: 'AI annotated', confidence: observation.confidence }] : []),
      ];

  const handleRemoveImage = (imgId: string) => {
    if (observation.images?.length) {
      onImagesChange?.(observation.images.filter((i) => i.id !== imgId));
    } else {
      if (imgId === 'raw') onImageAttach?.(null, observation.annotatedImageUrl);
      if (imgId === 'annotated') onImageAttach?.(observation.rawImageUrl, null);
    }
  };

  const handlePickerSelect = (images: ObservationImage[]) => {
    if (onImagesChange) {
      onImagesChange(images);
    } else if (onImageAttach) {
      onImageAttach(images[0]?.url ?? null, images[1]?.url ?? null);
    }
  };

  return (
    <div
      className={`relative bg-[#161618] border border-white/[0.08] rounded-xl p-5 mb-4 border-l-2 ${severityAccent[observation.severity]} group`}
      style={{ boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.04)' }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Action buttons — reorder + delete */}
      {editable && isHovered && (
        <div className="absolute top-3 right-3 flex items-center gap-1 z-10">
          <button
            onClick={() => onMoveUp?.()}
            disabled={observation.number === 1}
            className="w-6 h-6 rounded text-white/[0.20] hover:text-white/[0.50] hover:bg-white/[0.05] disabled:opacity-20 flex items-center justify-center transition-all duration-150"
            title="Move up"
          >
            <i className="fa-solid fa-chevron-up text-[10px]" />
          </button>
          <button
            onClick={() => onMoveDown?.()}
            disabled={isLast}
            className="w-6 h-6 rounded text-white/[0.20] hover:text-white/[0.50] hover:bg-white/[0.05] disabled:opacity-20 flex items-center justify-center transition-all duration-150"
            title="Move down"
          >
            <i className="fa-solid fa-chevron-down text-[10px]" />
          </button>
          {onDelete && (
            <button
              onClick={onDelete}
              className="w-6 h-6 rounded text-white/[0.20] hover:text-error-30 flex items-center justify-center transition-all duration-150"
              title="Delete observation"
            >
              <i className="fa-solid fa-trash text-[10px]" />
            </button>
          )}
        </div>
      )}

      {/* Title line */}
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-1 flex-1 min-w-0">
          <span className="text-[14px] text-white/[0.50] flex-shrink-0">#{observation.number} ·</span>
          {editable ? (
            <input
              type="text"
              value={observation.title}
              onChange={(e) => onTitleChange?.(e.target.value)}
              placeholder="Observation title..."
              className="flex-1 min-w-0 bg-transparent border-0 p-0 text-[14px] font-medium text-white/[0.85] focus:outline-none placeholder:text-white/[0.20]"
            />
          ) : (
            <span className="fb-body-1 text-white/[0.92]">{observation.title}</span>
          )}
        </div>
        <span className="text-[12px] text-white/[0.35] ml-4 flex-shrink-0">{observation.timestamp}</span>
      </div>

      {/* Severity + status row */}
      <div className="flex items-center gap-3 mb-4">
        <span className={`flex items-center gap-1.5 text-[12px] ${severityTextClass[observation.severity]}`}>
          <SeverityDot severity={observation.severity} />
          {editable ? (
            <AppSelect
              value={observation.severity}
              onValueChange={(v) => onSeverityChange?.(v as Severity)}
              options={[
                { value: 'critical', label: 'Critical' },
                { value: 'high', label: 'High' },
                { value: 'moderate', label: 'Moderate' },
                { value: 'low', label: 'Low' },
              ]}
              triggerClassName="h-auto py-1 px-2 text-[12px]"
            />
          ) : (
            capitalize(observation.severity)
          )}
        </span>
        <span className="text-[12px] text-white/[0.35]">Status</span>
        <AppSelect
          value={observation.status}
          onValueChange={(v) => onStatusChange?.(v as ObservationStatus)}
          options={[
            { value: 'acknowledged', label: 'Acknowledged' },
            { value: 'requires_action', label: 'Requires action' },
            { value: 'resolved', label: 'Resolved' },
          ]}
          triggerClassName="h-auto py-1 px-2 text-[12px]"
          aria-label="Observation status"
        />
      </div>

      {/* Image grid */}
      {allImages.length > 0 && (
        <div className="mt-4">
          <div className={`grid gap-3 ${allImages.length === 1 ? 'grid-cols-1' : 'grid-cols-2'}`}>
            {allImages.map((img) => (
              <div key={img.id} className="relative aspect-[16/10] rounded-lg overflow-hidden bg-[#1C1C1F] group/img">
                <img
                  src={img.url}
                  alt={img.label}
                  className="absolute inset-0 w-full h-full object-cover"
                  loading="lazy"
                  onError={(e) => {
                    const target = e.target as HTMLImageElement;
                    target.style.display = 'none';
                    const fallback = target.nextElementSibling;
                    if (fallback) fallback.classList.remove('hidden');
                  }}
                />
                <div className="hidden w-full h-full flex items-center justify-center bg-[#1C1C1F] absolute inset-0">
                  <span className="text-[12px] text-white/[0.25] text-center px-4">{img.label}</span>
                </div>
                <span className="absolute bottom-2 left-2 text-[10px] text-white bg-black/60 px-1.5 py-0.5 rounded">{img.label}</span>
                {img.confidence != null && img.confidence > 0 && (
                  <span className="absolute top-2 right-2 text-[10px] text-white bg-black/60 px-1.5 py-0.5 rounded tabular-nums">{img.confidence}%</span>
                )}
                {editable && (
                  <button
                    onClick={() => handleRemoveImage(img.id)}
                    className="absolute top-2 left-2 opacity-0 group-hover/img:opacity-100 w-5 h-5 flex items-center justify-center rounded bg-black/60 text-white/[0.70] hover:text-error-30 transition-all duration-150"
                  >
                    <i className="fa-solid fa-xmark text-[9px]" />
                  </button>
                )}
              </div>
            ))}
          </div>
          <p className="text-[12px] text-white/[0.35] text-center mt-2">{observation.imageCaption}</p>
          {editable && (
            <button
              onClick={() => setShowImagePicker(true)}
              className="text-[12px] text-white/[0.30] hover:text-white/[0.55] mt-1 transition-colors duration-150"
            >
              Change images
            </button>
          )}
        </div>
      )}

      {/* Empty attachment zone */}
      {allImages.length === 0 && editable && (
        <div className="mt-4">
          <button
            onClick={() => setShowImagePicker(true)}
            className="w-full border border-dashed border-white/[0.08] rounded-xl p-6 flex flex-col items-center justify-center gap-2 cursor-pointer hover:border-white/[0.15] hover:bg-white/[0.02] transition-all duration-150"
          >
            <i className="fa-solid fa-image text-white/[0.20] text-lg" />
            <span className="text-[13px] text-white/[0.30]">Click to attach images from gallery</span>
          </button>
        </div>
      )}

      {/* Image picker popover */}
      {showImagePicker && (
        <ImagePickerPopover
          currentImages={allImages}
          onSelect={handlePickerSelect}
          onClose={() => setShowImagePicker(false)}
        />
      )}

      {/* AI analysis */}
      <div className="mt-4">
        <div className="mb-1">
          <p className="text-[11px] uppercase tracking-wider text-white/[0.30] font-medium">AI analysis</p>
        </div>
        {editable ? (
          <textarea
            ref={aiRef.ref}
            value={observation.aiDescription}
            onChange={(e) => { aiRef.handleInput(e); onAiDescriptionChange?.(e.target.value); }}
            placeholder="AI analysis will appear here..."
            className="w-full resize-none bg-transparent border-0 p-0 text-[14px] text-white/[0.80] leading-[1.7] focus:outline-none placeholder:text-white/[0.20]"
          />
        ) : (
          <p className="fb-body-2 text-white/[0.85]">{observation.aiDescription}</p>
        )}
      </div>

      {/* Pilot observation */}
      {(editable || observation.pilotContext) && (
        <div className="mt-4">
          <div className="flex items-center gap-2 mb-1">
            <p className="text-[11px] uppercase tracking-wider text-white/[0.30] font-medium">Pilot observation</p>
            {editable && !observation.pilotContext && (
              <span className="text-[11px] text-white/[0.25] italic">(click to add)</span>
            )}
          </div>
          {editable ? (
            <textarea
              ref={pilotRef.ref}
              value={observation.pilotContext || ''}
              onChange={(e) => { pilotRef.handleInput(e); onPilotContextChange?.(e.target.value); }}
              placeholder="Add your observation notes about this finding..."
              className={`w-full resize-none rounded-lg p-2 text-[14px] italic leading-relaxed transition-all duration-150 ${
                observation.pilotContext
                  ? 'bg-transparent border-0 text-white/[0.55] focus:outline-none'
                  : 'bg-transparent border border-dashed border-white/[0.08] text-white/[0.25] focus:bg-[#1C1C1F] focus:border-white/[0.08] focus:text-white/[0.55] focus:border-solid focus:outline-none'
              }`}
              rows={observation.pilotContext ? undefined : 2}
            />
          ) : (
            <p className="fb-body-2 text-white/[0.50] italic">{observation.pilotContext}</p>
          )}
        </div>
      )}
    </div>
  );
};

export default ObservationBlock;
