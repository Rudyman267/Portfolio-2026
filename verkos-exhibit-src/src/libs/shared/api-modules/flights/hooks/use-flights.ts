import { useQuery } from '@tanstack/react-query';
import { useMemo } from 'react';
import { useHttp } from '@auth';
import { useFlightsApi } from '../api/flights.api';
import { FlightLog, FlightsResponse } from '../types/flights.types';
import { fetchFlightsByDate } from '@/api/media-gallery';

export const FLIGHTS_KEYS = {
  all: ['flights'] as const,
  list: (siteId?: string, date?: string) =>
    [...FLIGHTS_KEYS.all, 'list', siteId, date] as const,
};

/**
 * Format a Date as an ISO-like string with the user's local timezone offset
 * e.g. "2026-03-12T00:00:00.000+05:30" — required by the Media Gallery API.
 */
function toLocalIsoWithOffset(d: Date): string {
  const pad = (n: number, w = 2) => String(n).padStart(w, '0');
  const year = d.getFullYear();
  const month = pad(d.getMonth() + 1);
  const day = pad(d.getDate());
  const hh = pad(d.getHours());
  const mm = pad(d.getMinutes());
  const ss = pad(d.getSeconds());
  const ms = pad(d.getMilliseconds(), 3);
  const offsetMin = -d.getTimezoneOffset();
  const sign = offsetMin >= 0 ? '+' : '-';
  const oh = pad(Math.floor(Math.abs(offsetMin) / 60));
  const om = pad(Math.abs(offsetMin) % 60);
  return `${year}-${month}-${day}T${hh}:${mm}:${ss}.${ms}${sign}${oh}:${om}`;
}

export const useFlights = (
  siteId?: string | null,
  dateRange?: { from: Date; to: Date } | null
) => {
  const flightsApi = useFlightsApi();
  const httpClient = useHttp();

  const query = useQuery<FlightsResponse>({
    queryKey: FLIGHTS_KEYS.list(
      siteId ?? undefined,
      dateRange?.from?.toISOString()
    ),
    queryFn: async () => {
      if (dateRange) {
        // Use the Media Gallery API for date-filtered flight discovery,
        // since the /v2/flight endpoint ignores date params.
        const start = toLocalIsoWithOffset(dateRange.from);
        const end = toLocalIsoWithOffset(dateRange.to);
        const results = await fetchFlightsByDate(httpClient, start, end);

        // Map media-gallery results to the FlightLog shape the wizard expects.
        const flightLogs: FlightLog[] = results.map((r) => ({
          flight_id: r.flightId,
          site_details: { site_id: '', site_name: '' },
          drone_details: {
            drone_id: '',
            drone_name: r.flightTypes?.[0] ?? 'Drone',
            drone_model: '',
          },
          docking_station: {
            docking_station_name: '',
            docking_station_id: '',
          },
          missions: [
            {
              mission_name: r.missionName,
              mission_id: '',
              type: r.flightTypes?.[0] ?? '',
              mission_start_time: r.createdTime,
              mission_end_time: r.createdTime,
            },
          ],
          timestamp: r.createdTime,
          total_media: r.totalMedia,
          uploaded_media: r.totalMedia,
          fb_media_count: r.totalMedia,
          media_metadata_count: r.totalMedia,
        }));

        return {
          flightLogs,
          total: { value: flightLogs.length, relation: 'eq' },
          page: '1',
          limit: String(flightLogs.length),
        };
      }
      return flightsApi.fetchFlights({ limit: 100 });
    },
    staleTime: 2 * 60 * 1000,
    refetchOnWindowFocus: false,
  });

  // Filter flights: must match site (when known), have media, and fall within date range
  const flights = useMemo(() => {
    if (!query.data?.flightLogs) return [];
    return query.data.flightLogs.filter((f) => {
      const hasMedia =
        f.total_media > 0 || f.fb_media_count > 0 || f.uploaded_media > 0;
      // Media-gallery results don't carry site_details; skip site filter when empty.
      const matchesSite =
        !siteId || !f.site_details.site_id || f.site_details.site_id === siteId;

      let matchesDate = true;
      if (dateRange) {
        const flightDate = new Date(f.timestamp);
        matchesDate =
          flightDate >= dateRange.from && flightDate <= dateRange.to;
      }

      return hasMedia && matchesSite && matchesDate;
    });
  }, [query.data, siteId, dateRange]);

  // All flights (including no-media) for site filtering
  const allFlights = useMemo(() => {
    if (!query.data?.flightLogs) return [];
    return query.data.flightLogs.filter((f) => {
      const matchesSite =
        !siteId || !f.site_details.site_id || f.site_details.site_id === siteId;
      let matchesDate = true;
      if (dateRange) {
        const flightDate = new Date(f.timestamp);
        matchesDate =
          flightDate >= dateRange.from && flightDate <= dateRange.to;
      }
      return matchesSite && matchesDate;
    });
  }, [query.data, siteId, dateRange]);

  return {
    flights,
    allFlights,
    total: query.data?.total?.value ?? 0,
    isLoading: query.isLoading,
    error: query.error,
    refetch: query.refetch,
  };
};
