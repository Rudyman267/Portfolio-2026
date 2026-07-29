import React, { useEffect, useState } from 'react';
import type { FlightLog } from '@/libs/shared/api-modules/flights';
import type { LiveFlight, FlightContext } from '@/types/report.types';
import ContextBadge from './ContextBadge';

type Props =
  | { variant: 'live'; live: LiveFlight; context?: FlightContext; onClick: () => void; isSelected?: boolean }
  | { variant: 'past'; flight: FlightLog; context?: FlightContext; onClick: () => void; isSelected?: boolean };

function formatElapsed(startedAt: string): string {
  const mins = Math.floor((Date.now() - new Date(startedAt).getTime()) / 60000);
  if (mins < 1) return 'just started';
  if (mins < 60) return `${mins}m ago`;
  return `${Math.floor(mins / 60)}h ${mins % 60}m ago`;
}

function formatDuration(startMs: number, endMs: number): string {
  const sec = Math.floor((endMs - startMs) / 1000);
  if (sec < 60) return `${sec}s`;
  const m = Math.floor(sec / 60), s = sec % 60;
  return s === 0 ? `${m}m` : `${m}m ${s}s`;
}

const FlightRow: React.FC<Props> = (props) => {
  const [, setTick] = useState(0);
  useEffect(() => {
    if (props.variant !== 'live') return;
    const id = window.setInterval(() => setTick((t) => t + 1), 10_000);
    return () => window.clearInterval(id);
  }, [props.variant]);

  if (props.variant === 'live') {
    const { live, context, onClick } = props;
    const pct = live.totalWaypoints > 0
      ? Math.round((live.currentWaypointNumber / live.totalWaypoints) * 100)
      : 0;
    return (
      <button
        onClick={onClick}
        className={`w-full flex items-start gap-3 p-3 rounded-xl border cursor-pointer transition-all duration-150 text-left ${
          props.isSelected
            ? 'bg-primary-200/10 border-primary-200/40 shadow-[inset_3px_0_0_var(--primary-200)]'
            : 'bg-white/[0.03] hover:bg-white/[0.05] border-success-30/20'
        }`}
      >
        <div className="relative flex-shrink-0 mt-1">
          <span className="block w-2 h-2 rounded-full bg-emerald-400" />
          <span className="absolute inset-0 w-2 h-2 rounded-full bg-emerald-400 animate-ping opacity-50" />
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-baseline gap-2">
            <span className="text-[13px] font-medium text-white/[0.92] truncate">{live.missionName}</span>
            <span className="text-[11px] text-white/[0.40] truncate">· {live.siteName ?? 'Unknown site'}</span>
          </div>

          <div className="text-[11px] text-white/[0.50] mt-0.5 truncate">
            {live.droneName ?? 'Unknown drone'} · {live.dockName ?? 'No dock'} · Started {formatElapsed(live.startedAt)}
          </div>

          <div className="flex items-center gap-2 mt-2">
            <div className="flex-1 h-1 bg-white/[0.06] rounded-full overflow-hidden max-w-[200px]">
              <div
                className="h-full bg-emerald-400 transition-all duration-300"
                style={{ width: `${pct}%` }}
              />
            </div>
            <span className="text-[11px] text-white/[0.45] tabular-nums">
              {live.currentWaypointNumber}/{live.totalWaypoints} ({pct}%)
            </span>
          </div>

          <div className="mt-2">
            <ContextBadge context={context} />
          </div>
        </div>

        {live.latestMediaThumbnailUrl && (
          <img
            src={live.latestMediaThumbnailUrl}
            alt="Latest capture"
            className="w-12 h-12 rounded-md object-cover flex-shrink-0 border border-white/[0.06]"
          />
        )}
      </button>
    );
  }

  const { flight, context, onClick } = props;
  const m = flight.missions?.[0];
  const durationStr = m?.mission_start_time && m?.mission_end_time
    ? formatDuration(new Date(m.mission_start_time).getTime(), new Date(m.mission_end_time).getTime())
    : '—';
  const ts = new Date(flight.timestamp);
  const timeStr = ts.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
  const dateStr = ts.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  const mediaCount = flight.total_media || flight.fb_media_count || 0;

  return (
    <button
      onClick={onClick}
      className={`w-full flex items-start gap-3 p-3 rounded-xl border cursor-pointer transition-all duration-150 text-left ${
        props.isSelected
          ? 'bg-primary-200/10 border-primary-200/40 shadow-[inset_3px_0_0_var(--primary-200)]'
          : 'bg-white/[0.03] hover:bg-white/[0.05] border-white/[0.06]'
      }`}
    >
      <div className="flex-1 min-w-0">
        <div className="flex items-baseline gap-2">
          <span className="text-[13px] font-medium text-white/[0.92] truncate">
            {m?.mission_name ?? 'Unknown mission'}
          </span>
          <span className="text-[11px] text-white/[0.40] truncate">· {dateStr} {timeStr}</span>
        </div>

        <div className="text-[11px] text-white/[0.50] mt-0.5 truncate">
          {flight.drone_details?.drone_name ?? 'Unknown drone'}
          {flight.docking_station?.docking_station_name ? ` · ${flight.docking_station.docking_station_name.trim()}` : ''}
          {durationStr !== '—' ? ` · ${durationStr}` : ''}
          {mediaCount > 0 ? ` · ${mediaCount} media` : ''}
        </div>

        <div className="mt-2">
          <ContextBadge context={context} />
        </div>
      </div>
    </button>
  );
};
export default FlightRow;
