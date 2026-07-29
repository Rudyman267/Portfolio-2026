import React, { useState } from 'react';
import { useReportStore } from '../../store/report.store';
import type { GalleryImage } from './MediaGallery';
import type { ObservationImage } from '../../types/report.types';

interface ImagePickerPopoverProps {
  currentImages: ObservationImage[];
  onSelect: (images: ObservationImage[]) => void;
  onClose: () => void;
}

const ImagePickerPopover: React.FC<ImagePickerPopoverProps> = ({
  currentImages,
  onSelect,
  onClose,
}) => {
  const galleryImages = useReportStore(s => s.galleryImages);
  const [selectedIds, setSelectedIds] = useState<string[]>(
    currentImages.map((img) => img.id)
  );

  const toggleImage = (img: GalleryImage) => {
    setSelectedIds((prev) =>
      prev.includes(img.id) ? prev.filter((id) => id !== img.id) : [...prev, img.id]
    );
  };

  const handleDone = () => {
    const images: ObservationImage[] = selectedIds
      .map((id, idx) => {
        const gal = galleryImages.find((g) => g.id === id);
        if (!gal) return null;
        return {
          id: gal.id,
          url: gal.url,
          label: idx === 0 ? 'Raw capture' : idx === 1 ? 'AI annotated' : `Image ${idx + 1}`,
          timestamp: gal.timestamp,
          confidence: gal.hasDetection ? 95 : undefined,
        };
      })
      .filter(Boolean) as ObservationImage[];
    onSelect(images);
    onClose();
  };

  return (
    <div className="bg-[#161618] border border-white/[0.10] rounded-xl shadow-[0_8px_24px_rgba(0,0,0,0.5)] w-full flex flex-col mt-2 z-30" style={{ maxHeight: '480px' }}>
      <div className="p-4 pb-2">
        <p className="text-[14px] font-medium text-white/[0.85]">Select images</p>
        <p className="text-[12px] text-white/[0.35] mt-1">Click images to add to this observation</p>
      </div>

      <div
        className="flex-1 min-h-0 overflow-y-auto px-4"
        style={{ scrollbarWidth: 'thin', scrollbarColor: 'rgba(255,255,255,0.06) transparent' }}
      >
        {galleryImages.length === 0 ? (
          <div className="py-8 text-center">
            <p className="text-[13px] text-white/[0.40] mb-1">No images to attach</p>
            <p className="text-[12px] text-white/[0.25]">Upload media from the gallery panel first.</p>
          </div>
        ) : (
          <div className="grid grid-cols-3 gap-2 p-0.5">
            {galleryImages.map((img) => {
              const selIndex = selectedIds.indexOf(img.id);
              const isSelected = selIndex !== -1;
              return (
                <button
                  key={img.id}
                  onClick={() => toggleImage(img)}
                  className={`relative rounded-lg overflow-hidden bg-[#1C1C1F] cursor-pointer transition-all duration-150 ${
                    isSelected
                      ? 'ring-2 ring-primary-200'
                      : 'ring-1 ring-transparent hover:ring-white/[0.15]'
                  }`}
                  style={{ height: '110px' }}
                >
                  <img
                    src={img.thumbnailUrl}
                    alt=""
                    className="absolute inset-0 w-full h-full object-cover"
                    loading="lazy"
                  />
                  {isSelected && (
                    <span className="absolute top-1.5 right-1.5 w-5 h-5 rounded-full bg-primary-200 text-white text-[10px] font-bold flex items-center justify-center z-[1] shadow-sm">
                      {selIndex + 1}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        )}
      </div>

      <div className="flex items-center justify-between p-4 pt-2 border-t border-white/[0.06]">
        <span className="text-[12px] text-white/[0.40]">{selectedIds.length} selected</span>
        <div className="flex gap-2">
          <button onClick={onClose} className="text-[12px] text-white/[0.40] hover:text-white/[0.60] px-3 py-1.5 rounded-lg transition-colors duration-150">
            Cancel
          </button>
          <button
            onClick={handleDone}
            disabled={selectedIds.length === 0}
            className="text-[12px] font-medium bg-primary-200 text-white px-3 py-1.5 rounded-lg hover:bg-primary-100 transition-colors duration-150 disabled:opacity-40 disabled:cursor-not-allowed"
          >
            Attach {selectedIds.length} image{selectedIds.length !== 1 ? 's' : ''}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ImagePickerPopover;
