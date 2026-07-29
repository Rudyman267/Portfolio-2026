import React, { useEffect, useState, useCallback } from 'react';
import type { GalleryImage } from './MediaGallery';

interface MediaViewerProps {
  images: GalleryImage[];
  initialIndex: number;
  onClose: () => void;
  onAttachToObservation: (imageId: string, observationId: string) => void;
  observations: Array<{ id: string; number: number; title: string }>;
  onUpdateNote?: (imageId: string, note: string) => void;
}

const MediaViewer: React.FC<MediaViewerProps> = ({
  images,
  initialIndex,
  onClose,
  onAttachToObservation,
  observations,
  onUpdateNote,
}) => {
  const [currentIndex, setCurrentIndex] = useState(initialIndex);
  const [showObsPicker, setShowObsPicker] = useState(false);
  const [attachedFeedback, setAttachedFeedback] = useState<string | null>(null);
  const [showAnnotated, setShowAnnotated] = useState(true);

  const img = images[currentIndex];
  const canPrev = currentIndex > 0;
  const canNext = currentIndex < images.length - 1;

  const goPrev = useCallback(() => {
    if (canPrev) setCurrentIndex((i) => i - 1);
  }, [canPrev]);

  const goNext = useCallback(() => {
    if (canNext) setCurrentIndex((i) => i + 1);
  }, [canNext]);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
      if (e.key === 'ArrowLeft') goPrev();
      if (e.key === 'ArrowRight') goNext();
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [onClose, goPrev, goNext]);

  const handleAttach = (obsId: string) => {
    onAttachToObservation(img.id, obsId);
    setShowObsPicker(false);
    const obs = observations.find((o) => o.id === obsId);
    setAttachedFeedback(`Attached to #${obs?.number ?? '?'}`);
    setTimeout(() => setAttachedFeedback(null), 2000);
  };

  const formatDate = (ts: string) => {
    const h = ts.slice(0, 2);
    const m = ts.slice(3, 5);
    const s = ts.slice(6, 8);
    const ampm = Number(h) >= 12 ? 'PM' : 'AM';
    return `Apr 15, 2026 · ${h}:${m}:${s} ${ampm}`;
  };

  if (!img) return null;

  return (
    <div className="fixed inset-0 z-[70] bg-black/90 flex flex-col">
      {/* Top bar */}
      <div className="flex items-center justify-between px-6 py-4 flex-shrink-0">
        <button
          onClick={onClose}
          className="w-8 h-8 rounded-lg bg-white/[0.06] hover:bg-white/[0.10] flex items-center justify-center transition-colors duration-150"
        >
          <i className="fa-solid fa-xmark text-white/[0.70]" />
        </button>
        <span className="text-[13px] text-white/[0.50] tabular-nums">
          {currentIndex + 1} / {images.length}
        </span>
      </div>

      {/* Main content */}
      <div className="flex flex-1 min-h-0">
        {/* Image area */}
        <div className="flex-1 relative flex items-center justify-center px-16">
          <img
            src={img.annotatedUrl && showAnnotated ? img.annotatedUrl : img.url}
            alt={img.detectionLabel || img.filename}
            className="max-w-full max-h-full object-contain rounded-lg"
          />

          {/* Bbox toggle (only when annotated version exists) */}
          {img.annotatedUrl && (
            <button
              onClick={() => setShowAnnotated((v) => !v)}
              className="absolute top-4 left-4 flex items-center gap-2 bg-black/60 backdrop-blur-sm border border-white/[0.10] rounded-lg px-3 py-2 text-[12px] text-white/[0.85] hover:bg-black/80 transition-colors duration-150"
              aria-pressed={showAnnotated}
              title="Toggle detection overlay"
            >
              <i className={`fa-solid ${showAnnotated ? 'fa-eye' : 'fa-eye-slash'} text-[11px]`} />
              {showAnnotated ? 'Detections on' : 'Detections off'}
            </button>
          )}

          {/* Nav arrows */}
          {canPrev && (
            <button
              onClick={goPrev}
              className="absolute left-6 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-white/[0.08] hover:bg-white/[0.15] flex items-center justify-center transition-colors duration-150"
            >
              <i className="fa-solid fa-chevron-left text-white/[0.70]" />
            </button>
          )}
          {canNext && (
            <button
              onClick={goNext}
              className="absolute right-6 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-white/[0.08] hover:bg-white/[0.15] flex items-center justify-center transition-colors duration-150"
            >
              <i className="fa-solid fa-chevron-right text-white/[0.70]" />
            </button>
          )}
        </div>

        {/* Metadata panel */}
        <div
          className="w-[320px] flex-shrink-0 bg-[#161618] border-l border-white/[0.06] overflow-y-auto p-5"
          style={{ scrollbarWidth: 'thin', scrollbarColor: 'rgba(255,255,255,0.06) transparent' }}
        >
          <p className="text-[14px] font-semibold text-white/[0.85] mb-4">Image details</p>

          {img.filename && <MetaField label="Filename" value={img.filename} />}
          <MetaField label="Captured" value={formatDate(img.timestamp)} />
          <MetaField label="Flight" value={img.flightName} />
          {img.droneName && img.droneName !== '—' && <MetaField label="Drone" value={`${img.droneName} · ${img.dockName}`} />}
          {img.siteName && img.siteName !== 'Uploaded' && <MetaField label="Site" value={img.siteName} />}
          {img.gpsLat && img.gpsLng && <MetaField label="GPS" value={`${img.gpsLat}, ${img.gpsLng}`} />}
          {img.altitudeM > 0 && <MetaField label="Altitude" value={`${img.altitudeM}m AGL`} />}
          {img.gimbalPitch !== 0 && <MetaField label="Gimbal angle" value={`${img.gimbalPitch}° pitch`} />}
          {img.resolution && <MetaField label="Resolution" value={`${img.resolution}`} />}
          {img.fileSizeMB > 0 && <MetaField label="File size" value={`${img.fileSizeMB} MB`} />}

          {img.hasDetection && img.detectionLabel && (
            <>
              <div className="border-t border-white/[0.06] my-4" />
              <div className="mb-4">
                <span className="text-[11px] uppercase tracking-wider text-white/[0.30] font-medium">Detection</span>
                <p className="text-[14px] text-warning-30 mt-0.5 flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-warning-30 flex-shrink-0" />
                  {img.detectionLabel} ({img.detectionConfidence}% confidence)
                </p>
              </div>
            </>
          )}

          {/* Pilot note */}
          <div className="mb-4">
            <p className="text-[11px] uppercase tracking-wider text-white/[0.30] font-medium mb-1.5">Pilot note</p>
            <textarea
              value={img.pilotNote || ''}
              onChange={(e) => onUpdateNote?.(img.id, e.target.value)}
              placeholder="Add context about what's in this image (e.g. 'white truck near east gate, not authorized')"
              className="w-full bg-[#1C1C1F] border border-white/[0.08] rounded-lg text-[13px] text-white/[0.80] px-3 py-2 focus:border-primary-200/40 focus:outline-none transition-colors duration-150 resize-y min-h-[80px] placeholder:text-white/[0.25]"
              rows={3}
            />
            <p className="text-[11px] text-white/[0.30] mt-1">Visible to AI during report generation</p>
          </div>

          <div className="border-t border-white/[0.06] my-4" />

          {/* Attach button */}
          <div className="relative">
            {attachedFeedback ? (
              <div className="w-full py-2.5 rounded-lg text-center text-[13px] font-medium bg-success-30/15 text-success-30">
                {attachedFeedback}
              </div>
            ) : (
              <button
                onClick={() => setShowObsPicker((v) => !v)}
                className="w-full py-2.5 rounded-lg text-[13px] font-medium bg-primary-200 text-white hover:bg-primary-100 transition-colors duration-150"
              >
                Attach to observation
              </button>
            )}

            {showObsPicker && (
              <div className="absolute bottom-full mb-2 left-0 right-0 bg-[#1C1C1F] border border-white/[0.10] rounded-xl shadow-lg overflow-hidden z-10">
                {observations.length === 0 ? (
                  <p className="px-4 py-3 text-[13px] text-white/[0.40]">No observations yet</p>
                ) : (
                  observations.map((obs) => (
                    <button
                      key={obs.id}
                      onClick={() => handleAttach(obs.id)}
                      className="w-full text-left px-4 py-2.5 text-[13px] text-white/[0.75] hover:bg-white/[0.05] transition-colors duration-150 flex items-center gap-2"
                    >
                      <span className="text-white/[0.35]">#{obs.number}</span>
                      <span className="truncate">{obs.title || 'Untitled observation'}</span>
                    </button>
                  ))
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

const MetaField: React.FC<{ label: string; value: string }> = ({ label, value }) => (
  <div className="mb-4">
    <span className="text-[11px] uppercase tracking-wider text-white/[0.30] font-medium">{label}</span>
    <p className="text-[14px] text-white/[0.80] mt-0.5 break-words">{value}</p>
  </div>
);

export default MediaViewer;
