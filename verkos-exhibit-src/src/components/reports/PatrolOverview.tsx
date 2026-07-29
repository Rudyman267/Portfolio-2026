import React from 'react';
import { Report, Severity } from '../../types/report.types';
import SeverityDot from './SeverityDot';

interface PatrolOverviewProps {
  report: Report;
}

const severities: Severity[] = ['critical', 'high', 'moderate', 'low'];

const PatrolOverview: React.FC<PatrolOverviewProps> = ({ report }) => {
  const severityCounts = React.useMemo<Record<Severity, number>>(() => {
    const counts: Record<Severity, number> = { critical: 0, high: 0, moderate: 0, low: 0 };
    report.observations.forEach((obs) => {
      counts[obs.severity] = (counts[obs.severity] || 0) + 1;
    });
    return counts;
  }, [report.observations]);

  const displayDetections = report.observations.length;

  return (
    <div
      className="mb-6 bg-[#161618] border border-white/[0.08] rounded-xl p-5"
      style={{ boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.04)' }}
    >
      <p className="text-[12px] uppercase tracking-wider text-white/[0.35] font-medium mb-4">Patrol Overview</p>

      <div className="flex items-baseline gap-8 border-t border-b border-white/[0.05] py-4 mb-4">
        <div className="flex items-baseline gap-2">
          <span className="fb-title-3 text-white/[0.92]">{displayDetections}</span>
          <span className="text-[13px] text-white/[0.45]">detections</span>
          {report.observations.length > 0 && (
            <span className="flex items-center gap-2 ml-1">
              {severities.map((sev) =>
                severityCounts[sev] > 0 ? (
                  <span key={sev} className="flex items-center gap-1">
                    <SeverityDot severity={sev} />
                    <span className="text-[13px] text-white/[0.45]">{severityCounts[sev]}</span>
                  </span>
                ) : null
              )}
            </span>
          )}
        </div>

        <span className="w-px h-3 bg-white/[0.08] self-center flex-shrink-0" />

        <div className="flex items-baseline gap-2">
          <span className="fb-title-3 text-white/[0.92]">
            {report.missionCount > 1 ? report.missionCount : '—'}
          </span>
          <span className="text-[13px] text-white/[0.45]">
            {report.missionCount > 1 ? 'missions' : 'flight duration'}
          </span>
        </div>

        <span className="w-px h-3 bg-white/[0.08] self-center flex-shrink-0" />

        <div className="flex items-baseline gap-2">
          <span className="fb-title-3 text-white/[0.92]">—</span>
          <span className="text-[13px] text-white/[0.45]">images</span>
        </div>
      </div>

      <p className="text-[13px] text-white/[0.45]">
        {report.missionCount > 1
          ? `${report.missionCount} missions · ${report.siteName} · ${report.date}`
          : `${report.siteName} · ${report.date}`}
      </p>
    </div>
  );
};

export default PatrolOverview;
