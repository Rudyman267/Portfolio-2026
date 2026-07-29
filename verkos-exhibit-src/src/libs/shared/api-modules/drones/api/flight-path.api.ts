import { useHttp } from '@auth';
import { FlightPathResponse } from '../types/flight-paths.types';

export const useFlightLogApi = () => {
  const httpClient = useHttp();

  return {
    /**
     * Fetch flight paths for a specific flight
     */
    fetchFlightPaths: async (flightId: string): Promise<FlightPathResponse> => {
      const response = await httpClient.get<FlightPathResponse>(
        `/v2/flight/${flightId}/telemetry/coordinates`
      );
      return response.data;
    },
  };
};
