import React from 'react';
import { Link } from '@tanstack/react-router';
import { DraftReport } from '../../types/report.types';
import SeverityDot from './SeverityDot';
import { formatDuration } from '../../utils/format';

interface DraftCardProps {
  draft: DraftReport;
}

const DraftCard: React.FC<DraftCardProps> = ({ draft }) => {
  const { mission } = draft;

  return (
    <div
      className="bg-[#161618] border border-white/[0.08] rounded-xl p-4 hover:border-white/[0.15] transition-all duration-150"
      style={{ boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.04)' }}
    >
      {/* Row 1: name + severity dot + time ago */}
      <div className="flex items-center gap-2 mb-1">
        <span className="text-[14px] font-medium text-white/[0.88] flex-1 truncate">{mission.name}</span>
        <SeverityDot severity={mission.highestSeverity} />
        <span className="text-[12px] text-white/[0.30] tabular-nums">2h ago</span>
      </div>

      {/* Row 2: metadata */}
      <div className="flex items-center gap-1.5 text-[12px] text-white/[0.45] flex-wrap">
        <i className="fa-solid fa-paper-plane text-[10px]" />
        <span>{mission.droneName}</span>
        <span>·</span>
        <i className="fa-solid fa-cube text-[10px]" />
        <span>{mission.dockName}</span>
        <span>·</span>
        <span className="tabular-nums">{formatDuration(mission.durationSeconds)}</span>
        <span>·</span>
        <i className="fa-solid fa-crosshairs text-[10px]" />
        <span className="tabular-nums">{mission.detectionCount} detections</span>
        <span>·</span>
        <i className="fa-solid fa-microphone text-[10px]" />
        <span className="tabular-nums">{mission.pilotNoteCount} notes</span>
      </div>

      {/* Row 3: review link */}
      <div className="mt-3">
        <Link
          to="/report/$reportId"
          params={{ reportId: draft.id } as never}
          className="text-[13px] font-medium text-primary-200 hover:text-primary-100 inline-flex items-center gap-1"
        >
          Review draft
          <i className="fa-solid fa-arrow-right text-[10px]" />
        </Link>
      </div>
    </div>
  );
};

export default DraftCard;
