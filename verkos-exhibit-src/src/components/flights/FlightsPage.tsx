import React, { useEffect } from 'react';
import { useSearch, useNavigate } from '@tanstack/react-router';
import { useReportStore } from '@/store/report.store';
import FlightList from './FlightList';
import ResumeWizardBanner from './ResumeWizardBanner';
import {
  startMockFlightEventStream,
  stopMockFlightEventStream,
} from '@/services/mock-flight-events';
import {
  subscribeToFlightEvents,
  unsubscribeFromFlightEvents,
} from '@/services/flight-events-subscription';

const FlightsPage: React.FC = () => {
  const search = useSearch({ from: '/_layout/flights' });
  const navigate = useNavigate();
  const demoMode = useReportStore((s) => s.demoMode);
  const liveFlights = useReportStore((s) => s.liveFlights);
  const applyFlightEvent = useReportStore((s) => s.applyFlightEvent);
  const clearLiveFlights = useReportStore((s) => s.clearLiveFlights);
  const currentOrgId = useReportStore((s) => s.currentOrgId);

  useEffect(() => {
    if (demoMode) {
      startMockFlightEventStream((event) => applyFlightEvent(event));
      return () => {
        stopMockFlightEventStream();
        clearLiveFlights();
      };
    } else if (currentOrgId) {
      subscribeToFlightEvents(currentOrgId, (event) => applyFlightEvent(event));
      return () => {
        unsubscribeFromFlightEvents();
        clearLiveFlights();
      };
    }
  }, [demoMode, currentOrgId, applyFlightEvent, clearLiveFlights]);

  const updateFilters = (patch: {
    filter?: 'live' | 'recent' | 'all';
    from?: string;
    to?: string;
    q?: string;
  }) => {
    navigate({
      to: '/flights',
      search: ((prev: Record<string, unknown>) => ({ ...prev, ...patch })) as never,
      replace: true,
    });
  };

  const handleFlightSelect = (flightId: string) => {
    navigate({
      to: '/flight/$flightId',
      params: { flightId } as never,
      search: (search.returnTo ? { returnTo: search.returnTo } : {}) as never,
    });
  };

  const liveCount = Object.keys(liveFlights).length;

  return (
    <div className="px-6 py-6 max-w-[1400px] mx-auto">
      {search.returnTo && <ResumeWizardBanner returnPath={search.returnTo} />}

      <div className="mb-5">
        <div className="flex items-center gap-2">
          <h2 className="text-[20px] font-semibold text-white/[0.92] tracking-tight">Flights</h2>
          {liveCount > 0 && (
            <span className="inline-flex items-center gap-1 text-[11px] text-emerald-300 bg-emerald-500/[0.10] border border-emerald-500/[0.20] rounded-md px-2 py-0.5">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              {liveCount} live
            </span>
          )}
        </div>
        <p className="text-[13px] text-white/[0.45] mt-1">
          Capture flight context while memory is fresh — live during flight or retrospectively from media
        </p>
      </div>

      <div>
        <FlightList
          onFlightSelect={handleFlightSelect}
          statusFilter={search.filter ?? 'recent'}
          dateFrom={search.from}
          dateTo={search.to}
          searchQuery={search.q ?? ''}
          onFiltersChange={updateFilters}
        />
      </div>
    </div>
  );
};

export default FlightsPage;
