import React from 'react';
import { ReportProfile } from '../../types/report.types';

interface ReportProfileCardProps {
  profile: ReportProfile;
}

const profileLabel: Record<ReportProfile, string> = {
  full_operational: 'Full operational',
  executive_summary: 'Executive summary',
  compliance: 'Compliance',
  incident: 'Incident',
  shift_summary: 'Shift summary',
};

const profileIcon: Record<ReportProfile, string> = {
  full_operational: 'fa-regular fa-shield-check',
  executive_summary: 'fa-regular fa-chart-pie',
  compliance: 'fa-regular fa-scale-balanced',
  incident: 'fa-regular fa-triangle-exclamation',
  shift_summary: 'fa-regular fa-clock-rotate-left',
};

const ReportProfileCard: React.FC<ReportProfileCardProps> = ({ profile }) => {
  return (
    <div
      className="bg-[#1C1C1F] border border-white/[0.06] rounded-lg p-3 flex items-center gap-2"
    >
      <i className={`${profileIcon[profile]} text-white/[0.50] text-sm`} />
      <span className="text-[13px] text-white/[0.85]">{profileLabel[profile]}</span>
    </div>
  );
};

export default ReportProfileCard;
