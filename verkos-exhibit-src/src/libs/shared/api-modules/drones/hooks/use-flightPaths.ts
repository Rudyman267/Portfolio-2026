import { useQuery } from '@tanstack/react-query';
import { useFlightLogApi } from '../api/flight-path.api';
import { FlightPathResponse } from '../types/flight-paths.types';

export interface FormattedFlightPath {
  latitude: number;
  longitude: number;
  altitude: number;
}

export const FLIGHT_PATH_KEYS = {
  all: ['flightPaths'] as const,
  flightPaths: (flightId: string) =>
    [...FLIGHT_PATH_KEYS.all, flightId] as const,
};

export const useFlightPaths = (flightId: string) => {
  const flightLogApi = useFlightLogApi();

  const query = useQuery<FlightPathResponse, Error, FormattedFlightPath[]>({
    queryKey: FLIGHT_PATH_KEYS.flightPaths(flightId),
    queryFn: () => flightLogApi.fetchFlightPaths(flightId),
    staleTime: 500,
    refetchOnWindowFocus: false,
    select: (data) => {
      return data.map((point) => ({
        latitude: point.lat,
        longitude: point.lon,
        altitude: point.alt,
      }));
    },
  });

  return {
    flightPaths: query.data || [],
    isLoading: query.isLoading,
    error: query.error,
    refetch: query.refetch,
  };
};
