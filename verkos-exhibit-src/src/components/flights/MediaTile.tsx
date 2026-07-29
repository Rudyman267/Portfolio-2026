import React from 'react';
import type { MediaItem } from './RetrospectiveContextSession';

interface Props {
  item: MediaItem;
  hasNote: boolean;
  onClick: () => void;
}

const MediaTile: React.FC<Props> = ({ item, hasNote, onClick }) => {
  return (
    <button
      type="button"
      onClick={onClick}
      className="group relative aspect-square bg-white/[0.04] border border-white/[0.06] rounded-lg overflow-hidden cursor-pointer hover:border-white/[0.15] transition-colors"
    >
      {item.thumbnailUrl || item.dataUrl ? (
        <img
          src={item.thumbnailUrl ?? item.dataUrl}
          alt={item.fileName}
          className="w-full h-full object-cover"
          loading="lazy"
        />
      ) : (
        <div className="w-full h-full flex items-center justify-center text-white/[0.30]">
          <i className="fa-solid fa-image text-2xl" />
        </div>
      )}
      <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
        <i className="fa-solid fa-expand text-white text-lg" />
      </div>
      {hasNote && (
        <div className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-primary-200 ring-2 ring-black/40" />
      )}
    </button>
  );
};

export default MediaTile;
