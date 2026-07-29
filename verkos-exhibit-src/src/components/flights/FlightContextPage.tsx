import React, { useEffect } from 'react';
import { useParams, useSearch, useNavigate } from '@tanstack/react-router';
import { useReportStore } from '@/store/report.store';
import ResumeWizardBanner from './ResumeWizardBanner';
import LiveContextSession from './LiveContextSession';
import RetrospectiveContextSession from './RetrospectiveContextSession';
import {
  startMockFlightEventStream,
  stopMockFlightEventStream,
} from '@/services/mock-flight-events';
import {
  subscribeToFlightEvents,
  unsubscribeFromFlightEvents,
} from '@/services/flight-events-subscription';

const FlightContextPage: React.FC = () => {
  const { flightId } = useParams({ from: '/_layout/flight/$flightId' });
  const search = useSearch({ from: '/_layout/flight/$flightId' });
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

  const isLive = !!liveFlights[flightId];

  const handleBack = () => {
    navigate({
      to: '/flights',
      search: (search.returnTo ? { returnTo: search.returnTo } : {}) as never,
    });
  };

  return (
    <div className="px-6 py-6 max-w-[1400px] mx-auto">
      {search.returnTo && <ResumeWizardBanner returnPath={search.returnTo} />}

      <div className="mb-4">
        <button
          onClick={handleBack}
          className="inline-flex items-center gap-2 text-[13px] text-white/[0.55] hover:text-white/[0.90] cursor-pointer transition-colors"
        >
          <i className="fa-solid fa-arrow-left text-[11px]" />
          Back to flights
        </button>
      </div>

      <div>
        {isLive ? (
          <LiveContextSession flightId={flightId} />
        ) : (
          <RetrospectiveContextSession flightId={flightId} />
        )}
      </div>
    </div>
  );
};

export default FlightContextPage;
