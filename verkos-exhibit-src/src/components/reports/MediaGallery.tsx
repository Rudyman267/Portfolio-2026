import React, { useState, useMemo, useRef } from 'react';
import { useReportStore } from '../../store/report.store';

export interface GalleryImageBboxData {
  objects: Array<{
    bbox: [number, number, number, number];
    class: string;
    conf: number;
  }>;
  resolution: [number, number];
}

export interface GalleryImage {
  id: string;
  url: string;            // displayed URL (raw by default)
  thumbnailUrl: string;
  flightId: string;
  flightName: string;
  timestamp: string;
  droneName: string;
  dockName: string;
  siteId: string;
  siteName: string;
  hasDetection: boolean;
  detectionLabel: string | null;
  detectionConfidence: number | null;
  filename: string;
  gpsLat: string;
  gpsLng: string;
  altitudeM: number;
  gimbalPitch: number;
  resolution: string;
  fileSizeMB: number;
  pilotNote?: string;
  // Optional forensic match metadata (for bbox toggle)
  mediaId?: string;
  annotatedUrl?: string;        // pre-rendered annotated image (data URL)
  bboxData?: GalleryImageBboxData;
}

export const initialMockGalleryImages: GalleryImage[] = [];

/** @deprecated Use useReportStore(s => s.galleryImages) */
export const mockGalleryImages = initialMockGalleryImages;

const MAX_DIMENSION = 1280;
const JPEG_QUALITY = 0.7;

async function compressImageToDataURL(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      const { width, height } = img;
      const scale = Math.min(1, MAX_DIMENSION / Math.max(width, height));
      const targetW = Math.round(width * scale);
      const targetH = Math.round(height * scale);

      const canvas = document.createElement('canvas');
      canvas.width = targetW;
      canvas.height = targetH;
      const ctx = canvas.getContext('2d');
      if (!ctx) { reject(new Error('Canvas not supported')); return; }

      ctx.imageSmoothingEnabled = true;
      ctx.imageSmoothingQuality = 'high';
      ctx.drawImage(img, 0, 0, targetW, targetH);

      const dataUrl = canvas.toDataURL('image/jpeg', JPEG_QUALITY);
      URL.revokeObjectURL(img.src);
      resolve(dataUrl);
    };
    img.onerror = () => reject(new Error(`Failed to load image: ${file.name}`));
    img.src = URL.createObjectURL(file);
  });
}

interface MediaGalleryProps {
  onImageClick?: (image: GalleryImage, index: number) => void;
  selectedFlightIds?: string[];
}

type DetectionFilter = 'all' | 'ai' | 'raw';

const MediaGallery: React.FC<MediaGalleryProps> = ({ onImageClick, selectedFlightIds }) => {
  const [activeFilter, setActiveFilter] = useState<DetectionFilter>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const galleryImagesAll = useReportStore(s => s.galleryImages);
  const addGalleryImages = useReportStore(s => s.addGalleryImages);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // When the report has a known set of selected flights, scope the gallery
  // (and its counters) to ONLY those flights — exclude forensic search hits
  // that came from other flights.
  const galleryImages = useMemo(() => {
    if (!selectedFlightIds || selectedFlightIds.length === 0) return galleryImagesAll;
    const allowed = new Set(selectedFlightIds);
    return galleryImagesAll.filter((img) => allowed.has(img.flightId) || img.flightId === 'uploaded');
  }, [galleryImagesAll, selectedFlightIds]);

  const flightCount = useMemo(() => {
    const seen = new Set<string>();
    galleryImages.forEach((img) => seen.add(img.flightId));
    return seen.size;
  }, [galleryImages]);

  const filtered = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return galleryImages.filter((img) => {
      if (activeFilter === 'ai' && !img.hasDetection) return false;
      if (activeFilter === 'raw' && img.hasDetection) return false;
      if (q.length > 0) {
        const filename = img.filename?.toLowerCase() ?? '';
        const mediaId = img.mediaId?.toLowerCase() ?? '';
        if (!filename.includes(q) && !mediaId.includes(q)) return false;
      }
      return true;
    });
  }, [activeFilter, searchQuery, galleryImages]);

  const grouped = useMemo(() => {
    const groups: { flightId: string; flightName: string; timestamp: string; droneName: string; images: GalleryImage[] }[] = [];
    filtered.forEach((img) => {
      const last = groups[groups.length - 1];
      if (last && last.flightId === img.flightId) {
        last.images.push(img);
      } else {
        groups.push({ flightId: img.flightId, flightName: img.flightName, timestamp: img.timestamp, droneName: img.droneName, images: [img] });
      }
    });
    return groups;
  }, [filtered]);

  const totalDetectionCount = useMemo(
    () => galleryImages.filter((i) => i.hasDetection).length,
    [galleryImages]
  );

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;

    const newImages: GalleryImage[] = [];
    for (const f of files) {
      try {
        const dataUrl = await compressImageToDataURL(f);
        const approxSizeKB = Math.round((dataUrl.length * 0.75) / 1024);
        const ts = Date.now() + Math.random();
        newImages.push({
          id: `up-${ts}`,
          url: dataUrl,
          thumbnailUrl: dataUrl,
          flightId: 'uploaded',
          flightName: 'Uploaded media',
          timestamp: new Date().toLocaleTimeString('en-US', { hour12: false }),
          droneName: '—',
          dockName: '—',
          siteId: 'uploaded',
          siteName: 'Uploaded',
          hasDetection: false,
          detectionLabel: null,
          detectionConfidence: null,
          filename: f.name,
          gpsLat: '',
          gpsLng: '',
          altitudeM: 0,
          gimbalPitch: 0,
          resolution: '',
          fileSizeMB: Math.round((approxSizeKB / 1024) * 100) / 100,
          pilotNote: '',
        });
      } catch (err) {
        console.error('Image compression failed:', f.name, err);
      }
    }

    if (newImages.length > 0) {
      addGalleryImages(newImages);
    }
    e.target.value = '';
  };

  return (
    <div className="h-full flex flex-col">
      <div className="p-3 pb-0">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-[13px] font-semibold text-white/[0.80]">Media</p>
            <p className="text-[12px] text-white/[0.30] mt-0.5">
              {galleryImages.length} files from {flightCount} flight{flightCount === 1 ? '' : 's'}
              {totalDetectionCount > 0 && ` · ${totalDetectionCount} with AI detections`}
            </p>
          </div>
          <button
            onClick={() => fileInputRef.current?.click()}
            className="flex items-center gap-1.5 text-[11px] text-white/[0.40] hover:text-white/[0.70] px-2 py-1 rounded-md hover:bg-white/[0.04] transition-colors duration-150 cursor-pointer"
          >
            <i className="fa-solid fa-upload text-[9px]" />
            Upload
          </button>
          <input
            ref={fileInputRef}
            type="file"
            multiple
            accept="image/*"
            className="hidden"
            onChange={handleUpload}
          />
        </div>

        {/* Search bar */}
        <div className="relative mt-3">
          <i className="fa-solid fa-magnifying-glass text-[10px] text-white/[0.30] absolute left-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by filename or media ID…"
            className="w-full bg-[#1C1C1F] border border-white/[0.08] rounded-md pl-7 pr-7 py-1.5 text-[12px] text-white/[0.80] placeholder:text-white/[0.25] focus:outline-none focus:border-primary-200/40 transition-colors duration-150"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-2 top-1/2 -translate-y-1/2 text-white/[0.30] hover:text-white/[0.60] transition-colors duration-150"
              aria-label="Clear search"
            >
              <i className="fa-solid fa-xmark text-[10px]" />
            </button>
          )}
        </div>

        {/* Filter pills */}
        <div className="flex gap-1.5 mt-2 pb-2" style={{ scrollbarWidth: 'none' }}>
          {([
            { id: 'all' as const, label: 'All' },
            { id: 'ai' as const, label: 'AI Detections' },
            { id: 'raw' as const, label: 'Raw Only' },
          ]).map((opt) => (
            <button
              key={opt.id}
              onClick={() => setActiveFilter(opt.id)}
              className={`flex-shrink-0 text-[11px] px-2.5 py-1 rounded-md transition-colors duration-150 ${
                activeFilter === opt.id
                  ? 'bg-white/[0.08] text-white/[0.80]'
                  : 'text-white/[0.35] hover:text-white/[0.55]'
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>

      {/* Image grid */}
      <div
        className="flex-1 overflow-y-auto p-3 pt-1"
        style={{ scrollbarWidth: 'thin', scrollbarColor: 'rgba(255,255,255,0.06) transparent' }}
      >
        {galleryImages.length === 0 ? (
          <div className="py-12 px-4 text-center">
            <i className="fa-solid fa-images text-white/[0.15] text-2xl mb-2" />
            <p className="text-[13px] text-white/[0.45] mb-1">No media yet</p>
            <p className="text-[12px] text-white/[0.30] mb-4">Upload images from your flight to attach them to observations.</p>
          </div>
        ) : filtered.length === 0 ? (
          <div className="py-12 px-4 text-center">
            <i className="fa-solid fa-filter-circle-xmark text-white/[0.15] text-2xl mb-2" />
            <p className="text-[13px] text-white/[0.45] mb-1">No matches</p>
            <p className="text-[12px] text-white/[0.30] mb-4">Try a different search or filter.</p>
          </div>
        ) : (
          grouped.map((group) => (
            <div key={group.flightId}>
              <p className="text-[11px] text-white/[0.25] uppercase tracking-wider py-2 sticky top-0 bg-[#0C0C0E] z-[1]">
                {group.flightName} · {group.timestamp.slice(0, 5)}
              </p>
              <div className="grid grid-cols-2 gap-2 mb-3">
                {group.images.map((img) => {
                  const globalIndex = galleryImages.findIndex((g) => g.id === img.id);
                  return (
                    <button
                      key={img.id}
                      onClick={() => onImageClick?.(img, globalIndex)}
                      className="relative aspect-[4/3] rounded-lg overflow-hidden bg-[#1C1C1F] cursor-pointer group/thumb hover:ring-2 hover:ring-primary-200/40 transition-all duration-150 hover:scale-[1.02]"
                    >
                      <img
                        src={img.thumbnailUrl}
                        alt={img.detectionLabel || `Capture at ${img.timestamp}`}
                        className="absolute inset-0 w-full h-full object-cover"
                        loading="lazy"
                      />
                      <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/60 to-transparent h-8 flex items-end px-1.5 pb-1">
                        <span className="text-[10px] text-white/[0.80] font-medium">{img.timestamp}</span>
                      </div>
                      {img.hasDetection && (
                        <span className="absolute top-1.5 right-1.5 text-[9px] font-medium bg-error-30/80 text-white px-1.5 py-0.5 rounded">AI</span>
                      )}
                      {/* Expand overlay on hover */}
                      <div className="absolute inset-0 bg-black/30 opacity-0 group-hover/thumb:opacity-100 transition-opacity duration-150 flex items-center justify-center">
                        <i className="fa-solid fa-expand text-white/[0.70] text-sm" />
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default MediaGallery;
