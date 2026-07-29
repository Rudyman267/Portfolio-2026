import React, { useEffect, useState, useCallback, useRef } from 'react';
import type { MediaItem } from './RetrospectiveContextSession';

interface FlightMediaViewerProps {
  items: MediaItem[];
  initialIndex: number;
  notes: Record<string, string>;
  onNoteChange: (mediaId: string, note: string) => void;
  onClose: () => void;
}

const AUTOSAVE_MS = 600;

const formatTimestamp = (ts: string): string => {
  if (!ts) return '—';
  const d = new Date(ts);
  if (isNaN(d.getTime())) return ts;
  const date = d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  const time = d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true });
  return `${date} · ${time}`;
};

const MetaField: React.FC<{ label: string; value: string; mono?: boolean }> = ({ label, value, mono }) => (
  <div className="mb-4">
    <span className="text-[11px] uppercase tracking-wider text-white/[0.30] font-medium">{label}</span>
    <p
      className={`${mono ? 'text-[12px] font-mono' : 'text-[14px]'} text-white/[0.80] mt-0.5 break-words truncate`}
    >
      {value}
    </p>
  </div>
);

const FlightMediaViewer: React.FC<FlightMediaViewerProps> = ({
  items,
  initialIndex,
  notes,
  onNoteChange,
  onClose,
}) => {
  const [currentIndex, setCurrentIndex] = useState(initialIndex);
  const item = items[currentIndex];
  const persistedNote = notes[item?.mediaId] ?? '';
  const [localNote, setLocalNote] = useState(persistedNote);
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved'>('idle');
  const lastSyncedMediaIdRef = useRef<string | null>(item?.mediaId ?? null);

  const canPrev = currentIndex > 0;
  const canNext = currentIndex < items.length - 1;

  const goPrev = useCallback(() => {
    if (canPrev) setCurrentIndex((i) => i - 1);
  }, [canPrev]);
  const goNext = useCallback(() => {
    if (canNext) setCurrentIndex((i) => i + 1);
  }, [canNext]);

  // Sync local note when switching images
  useEffect(() => {
    if (!item) return;
    if (lastSyncedMediaIdRef.current !== item.mediaId) {
      setLocalNote(notes[item.mediaId] ?? '');
      setSaveStatus('idle');
      lastSyncedMediaIdRef.current = item.mediaId;
    }
  }, [item, notes]);

  // Debounced autosave
  useEffect(() => {
    if (!item) return;
    if (localNote === persistedNote) return;
    setSaveStatus('saving');
    const timer = window.setTimeout(() => {
      onNoteChange(item.mediaId, localNote);
      setSaveStatus('saved');
      window.setTimeout(() => setSaveStatus('idle'), 1500);
    }, AUTOSAVE_MS);
    return () => window.clearTimeout(timer);
  }, [localNote, persistedNote, item, onNoteChange]);

  // Keyboard nav
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement | null;
      const isTextInput =
        target && (target.tagName === 'TEXTAREA' || target.tagName === 'INPUT' || target.isContentEditable);
      if (e.key === 'Escape') {
        onClose();
        return;
      }
      if (isTextInput) return;
      if (e.key === 'ArrowLeft') goPrev();
      if (e.key === 'ArrowRight') goNext();
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [onClose, goPrev, goNext]);

  if (!item) return null;

  return (
    <div className="fixed inset-0 z-[70] bg-black/90 flex flex-col">
      {/* Top bar */}
      <div className="flex items-center justify-between px-6 py-4 flex-shrink-0 gap-4">
        <button
          onClick={onClose}
          className="w-8 h-8 rounded-lg bg-white/[0.06] hover:bg-white/[0.10] flex items-center justify-center transition-colors duration-150 cursor-pointer flex-shrink-0"
        >
          <i className="fa-solid fa-xmark text-white/[0.70]" />
        </button>
        <span className="text-[13px] text-white/[0.50] tabular-nums">
          {currentIndex + 1} / {items.length}
        </span>
        <span className="text-[12px] text-white/[0.45] truncate flex-1 text-right min-w-0">
          {item.fileName}
        </span>
      </div>

      {/* Main content */}
      <div className="flex flex-1 min-h-0">
        {/* Image area */}
        <div className="flex-1 relative flex items-center justify-center px-16">
          {item.dataUrl || item.thumbnailUrl ? (
            <img
              src={item.dataUrl ?? item.thumbnailUrl ?? ''}
              alt={item.fileName}
              className="max-w-full max-h-full object-contain rounded-lg"
            />
          ) : (
            <div className="text-white/[0.30] text-center">
              <i className="fa-solid fa-image text-5xl" />
            </div>
          )}

          {canPrev && (
            <button
              onClick={goPrev}
              className="absolute left-6 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-white/[0.08] hover:bg-white/[0.15] flex items-center justify-center transition-colors duration-150 cursor-pointer"
            >
              <i className="fa-solid fa-chevron-left text-white/[0.70]" />
            </button>
          )}
          {canNext && (
            <button
              onClick={goNext}
              className="absolute right-6 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-white/[0.08] hover:bg-white/[0.15] flex items-center justify-center transition-colors duration-150 cursor-pointer"
            >
              <i className="fa-solid fa-chevron-right text-white/[0.70]" />
            </button>
          )}
        </div>

        {/* Context panel */}
        <div
          className="w-[360px] flex-shrink-0 bg-[#161618] border-l border-white/[0.06] overflow-y-auto p-5"
          style={{ scrollbarWidth: 'thin', scrollbarColor: 'rgba(255,255,255,0.06) transparent' }}
        >
          <p className="text-[14px] font-semibold text-white/[0.85] mb-4">Image details</p>

          <MetaField label="Filename" value={item.fileName || '—'} />
          <MetaField label="Captured" value={formatTimestamp(item.captureTimestamp)} />
          <MetaField label="Media ID" value={item.mediaId} mono />

          <div className="border-t border-white/[0.06] my-4" />

          <div>
            <p className="text-[11px] uppercase tracking-wider text-white/[0.30] font-medium mb-1.5">
              Pilot note
            </p>
            <textarea
              value={localNote}
              onChange={(e) => setLocalNote(e.target.value)}
              placeholder="What's important about this image? Describe what you see, flag anything unusual, note authorized vs unauthorized activity..."
              className="w-full bg-[#1C1C1F] border border-white/[0.08] rounded-lg text-[13px] text-white/[0.80] px-3 py-2 focus:border-primary-200/40 focus:outline-none transition-colors duration-150 resize-y min-h-[120px] placeholder:text-white/[0.25]"
            />
            <p className="text-[11px] text-white/[0.30] mt-1">
              This note will be sent to the AI during report generation
            </p>
            <div className="mt-2 text-[11px] min-h-[14px]">
              {saveStatus === 'saving' && (
                <span className="text-white/[0.35]">
                  <i className="fa-solid fa-circle-notch fa-spin text-[10px]" /> Saving...
                </span>
              )}
              {saveStatus === 'saved' && (
                <span className="text-success-30">
                  <i className="fa-solid fa-check text-[10px]" /> Saved
                </span>
              )}
            </div>
          </div>

          <div className="border-t border-white/[0.06] my-4" />

          {/* Thumbnail strip */}
          <div
            className="flex gap-2 overflow-x-auto pb-2"
            style={{ scrollbarWidth: 'thin', scrollbarColor: 'rgba(255,255,255,0.06) transparent' }}
          >
            {items.map((m, idx) => {
              const isActive = idx === currentIndex;
              const noteText = (notes[m.mediaId] ?? '').trim();
              const hasNote = noteText.length > 0;
              return (
                <button
                  key={m.mediaId}
                  onClick={() => setCurrentIndex(idx)}
                  className={`relative flex-shrink-0 w-12 h-12 rounded-md overflow-hidden border transition-all duration-150 cursor-pointer ${
                    isActive
                      ? 'border-primary-200/60 scale-105'
                      : 'border-white/[0.06] hover:border-white/[0.15]'
                  }`}
                >
                  {m.thumbnailUrl || m.dataUrl ? (
                    <img
                      src={m.thumbnailUrl ?? m.dataUrl}
                      alt={m.fileName}
                      className="w-full h-full object-cover"
                      loading="lazy"
                    />
                  ) : (
                    <div className="w-full h-full bg-white/[0.04] flex items-center justify-center text-white/[0.30]">
                      <i className="fa-solid fa-image text-xs" />
                    </div>
                  )}
                  {hasNote && (
                    <div className="absolute top-0.5 right-0.5 w-1.5 h-1.5 rounded-full bg-primary-200" />
                  )}
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};

export default FlightMediaViewer;
