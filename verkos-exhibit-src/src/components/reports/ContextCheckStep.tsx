import React, { useState } from 'react';
import { useNavigate } from '@tanstack/react-router';
import { useReportStore } from '@/store/report.store';
import type { FlightLog } from '@/libs/shared/api-modules/flights';

interface Props {
  selectedFlights: string[];
  flights: FlightLog[];
  wizardState: {
    siteIds: string[];
    agentId: string | null;
    templateId: string | null;
  };
  currentPath: string;
  onGenerateAnyway: () => void;
  onCancel: () => void;
}

const ContextCheckStep: React.FC<Props> = ({
  selectedFlights,
  flights,
  wizardState,
  currentPath,
  onGenerateAnyway,
  onCancel,
}) => {
  const navigate = useNavigate();
  const flightContexts = useReportStore((s) => s.flightContexts);
  const setFlightContext = useReportStore((s) => s.setFlightContext);
  const setWizardResumeState = useReportStore((s) => s.setWizardResumeState);

  const [expandedFlightId, setExpandedFlightId] = useState<string | null>(null);
  const [inlineText, setInlineText] = useState<Record<string, string>>({});

  const handleInlineSave = (flightId: string, siteId: string) => {
    const text = inlineText[flightId] ?? '';
    if (!text.trim()) return;
    setFlightContext(flightId, { siteId, text, source: 'typed', captureMode: 'retrospective' });
    setExpandedFlightId(null);
  };

  const handleOpenFullSession = (flightId: string) => {
    setWizardResumeState({
      siteIds: wizardState.siteIds,
      selectedFlightIds: selectedFlights,
      agentId: wizardState.agentId,
      templateId: wizardState.templateId,
      returnPath: currentPath,
    });
    navigate({
      to: '/flight/$flightId',
      params: { flightId } as never,
      search: { returnTo: currentPath } as never,
    });
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-[#1a1a1c] border border-white/[0.08] rounded-xl w-full max-w-2xl max-h-[80vh] flex flex-col">
        <div className="px-5 py-4 border-b border-white/[0.06]">
          <div className="text-white/[0.90] text-[15px] font-medium">Before generating</div>
          <div className="text-white/[0.50] text-[12px] mt-0.5">
            Pilot context helps the AI generate sharper reports.
          </div>
        </div>

        <div className="flex-1 overflow-y-auto px-5 py-3 space-y-2">
          {selectedFlights.map((fid) => {
            const flight = flights.find((f) => f.flight_id === fid);
            const ctx = flightContexts[fid];
            const hasContext = !!ctx && ctx.wordCount > 0;
            const isExpanded = expandedFlightId === fid;
            const missionName = flight?.missions?.[0]?.mission_name ?? `Flight ${fid.slice(0, 8)}`;
            const siteId = flight?.site_details?.site_id ?? '';

            return (
              <div
                key={fid}
                className="bg-white/[0.03] border border-white/[0.06] rounded-lg p-3"
              >
                <div className="flex items-center gap-3">
                  <i
                    className={
                      hasContext
                        ? 'fa-solid fa-circle-check text-success-30 text-[14px]'
                        : 'fa-solid fa-triangle-exclamation text-caution-30 text-[14px]'
                    }
                  />
                  <div className="flex-1 min-w-0">
                    <div className="text-[13px] text-white/[0.88] truncate">{missionName}</div>
                    <div className="text-[11px] text-white/[0.50] mt-0.5">
                      {hasContext ? `${ctx.wordCount} words of context` : 'No context'}
                    </div>
                  </div>
                  {!hasContext && (
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => setExpandedFlightId(isExpanded ? null : fid)}
                        className="text-[11px] text-white/[0.60] hover:text-white/[0.90] px-2 py-1 rounded cursor-pointer"
                      >
                        {isExpanded ? 'Cancel' : 'Add inline'}
                      </button>
                      <button
                        onClick={() => handleOpenFullSession(fid)}
                        className="text-[11px] text-primary-200 hover:text-primary-200/80 px-2 py-1 rounded cursor-pointer"
                      >
                        Open full session →
                      </button>
                    </div>
                  )}
                </div>

                {isExpanded && (
                  <div className="mt-3">
                    <textarea
                      value={inlineText[fid] ?? ''}
                      onChange={(e) => setInlineText({ ...inlineText, [fid]: e.target.value })}
                      placeholder="Brief notes — anything the AI should know about this flight..."
                      className="w-full min-h-[80px] bg-[#161618] border border-white/[0.08] rounded-md p-2 text-[13px] text-white/[0.85] resize-vertical focus:outline-none focus:border-primary-200/30"
                      autoFocus
                    />
                    <div className="mt-2 flex justify-end gap-2">
                      <button
                        onClick={() => handleInlineSave(fid, siteId)}
                        disabled={!(inlineText[fid] ?? '').trim()}
                        className="px-3 py-1 rounded-md bg-primary-200 text-black text-[12px] cursor-pointer hover:bg-primary-200/90 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        Save
                      </button>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        <div className="px-5 py-3 border-t border-white/[0.06] flex items-center justify-end gap-2">
          <button
            onClick={onCancel}
            className="px-3 py-1.5 rounded-md text-white/[0.60] hover:text-white/[0.90] text-[13px] cursor-pointer"
          >
            Cancel
          </button>
          <button
            onClick={onGenerateAnyway}
            className="px-4 py-1.5 rounded-md bg-primary-200 text-black text-[13px] font-medium cursor-pointer hover:bg-primary-200/90"
          >
            Generate report
          </button>
        </div>
      </div>
    </div>
  );
};

export default ContextCheckStep;
