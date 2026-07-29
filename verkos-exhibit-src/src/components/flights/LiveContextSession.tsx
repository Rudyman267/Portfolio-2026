import React, { useState, useEffect, useRef } from 'react';
import { useReportStore } from '@/store/report.store';
import { toast } from 'sonner';

interface Props {
  flightId: string;
}

const AUTOSAVE_MS = 600;

const LiveContextSession: React.FC<Props> = ({ flightId }) => {
  const liveFlight = useReportStore((s) => s.liveFlights[flightId]);
  const context = useReportStore((s) => s.flightContexts[flightId]);
  const setFlightContext = useReportStore((s) => s.setFlightContext);
  const updateFlightContextText = useReportStore((s) => s.updateFlightContextText);

  const [localText, setLocalText] = useState(context?.text ?? '');
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved'>('idle');
  const wasLiveRef = useRef(!!liveFlight);

  useEffect(() => {
    if (wasLiveRef.current && !liveFlight) {
      toast.success('Flight completed — session preserved for retrospective notes');
    }
    wasLiveRef.current = !!liveFlight;
  }, [liveFlight]);

  useEffect(() => {
    if (localText === (context?.text ?? '')) return;
    setSaveStatus('saving');
    const timer = window.setTimeout(() => {
      if (!context) {
        setFlightContext(flightId, {
          siteId: liveFlight?.siteId ?? '',
          text: localText,
          source: 'typed',
          captureMode: 'live',
        });
      } else {
        updateFlightContextText(flightId, localText);
      }
      setSaveStatus('saved');
      window.setTimeout(() => setSaveStatus('idle'), 1500);
    }, AUTOSAVE_MS);
    return () => window.clearTimeout(timer);
  }, [localText, context, flightId, liveFlight?.siteId, setFlightContext, updateFlightContextText]);

  const pct = liveFlight && liveFlight.totalWaypoints > 0
    ? Math.round((liveFlight.currentWaypointNumber / liveFlight.totalWaypoints) * 100)
    : 0;

  return (
    <div className="flex flex-col h-[calc(100vh-260px)]">
      <div className="mb-4">
        {liveFlight ? (
          <div className="flex items-start gap-3 p-3.5 rounded-lg bg-emerald-500/[0.05] border border-emerald-500/[0.20]">
            <div className="relative flex-shrink-0 mt-1">
              <span className="block w-2 h-2 rounded-full bg-emerald-400" />
              <span className="absolute inset-0 w-2 h-2 rounded-full bg-emerald-400 animate-ping opacity-50" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-[14px] font-medium text-white/[0.92] truncate">
                {liveFlight.missionName}
              </div>
              <div className="text-[12px] text-white/[0.55] mt-0.5 truncate">
                {liveFlight.siteName} · {liveFlight.droneName} · Waypoint {liveFlight.currentWaypointNumber}/{liveFlight.totalWaypoints} ({pct}%)
              </div>
            </div>
            <span className="text-[11px] text-emerald-300 font-medium flex-shrink-0">
              Flight in progress
            </span>
          </div>
        ) : (
          <div className="text-[13px] text-white/[0.65]">
            Flight session · {flightId.slice(0, 8)}
          </div>
        )}
      </div>

      <div className="text-[12px] text-white/[0.50] mb-2">
        Narrate what you see in real time. Observations, anomalies, authorizations — whatever catches your attention. Autosaves as you type.
      </div>

      <textarea
        value={localText}
        onChange={(e) => setLocalText(e.target.value)}
        placeholder="Example: Drone passing the east gate now — quiet, nothing unusual. Fence at the south boundary looks about the same as yesterday. Loading bay has the contractor trucks again..."
        className="flex-1 w-full bg-[#161618] border border-white/[0.06] rounded-xl p-4 text-[14px] text-white/[0.88] placeholder:text-white/[0.25] leading-relaxed resize-none focus:outline-none focus:border-primary-200/30"
        autoFocus
      />

      <div className="mt-3 flex items-center justify-between text-[12px]">
        <div className="text-white/[0.45]">
          {context
            ? `${context.wordCount} words · last edit ${new Date(context.lastEditedAt).toLocaleTimeString()}`
            : 'New session'}
          {saveStatus === 'saving' && (
            <span className="ml-2 text-white/[0.35]">
              <i className="fa-solid fa-circle-notch fa-spin text-[10px]" /> Saving...
            </span>
          )}
          {saveStatus === 'saved' && (
            <span className="ml-2 text-success-30">
              <i className="fa-solid fa-check text-[10px]" /> Saved
            </span>
          )}
        </div>
      </div>
    </div>
  );
};
export default LiveContextSession;
