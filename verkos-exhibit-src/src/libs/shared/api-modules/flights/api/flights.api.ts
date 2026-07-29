import { useHttp } from '@auth';
import { FlightLog, FlightsResponse } from '../types/flights.types';

export const useFlightsApi = () => {
  const httpClient = useHttp();

  return {
    fetchFlights: async (params?: {
      page?: number;
      limit?: number;
      siteId?: string;
    }): Promise<FlightsResponse> => {
      const searchParams = new URLSearchParams();
      searchParams.set('page', String(params?.page ?? 1));
      searchParams.set('limit', String(params?.limit ?? 100));
      searchParams.set('archived', 'false');

      const response = await httpClient.get<FlightsResponse>(
        `v2/flight?${searchParams.toString()}`
      );
      return response.data;
    },

    fetchFlightsByDate: async (
      dateFrom: string,
      dateTo: string,
      _siteId?: string
    ): Promise<FlightsResponse> => {
      // Paginate through flights until we find ones older than dateFrom
      // or until we've exhausted all pages
      const allFlights: FlightLog[] = [];
      let page = 1;
      const limit = 100;
      let keepSearching = true;

      const from = new Date(dateFrom);
      const to = new Date(dateTo);

      while (keepSearching && page <= 50) {
        const searchParams = new URLSearchParams();
        searchParams.set('page', String(page));
        searchParams.set('limit', String(limit));
        searchParams.set('archived', 'false');

        const response = await httpClient.get<FlightsResponse>(
          `v2/flight?${searchParams.toString()}`
        );

        const flights = response.data?.flightLogs ?? [];
        if (flights.length === 0) break;

        for (const f of flights) {
          const flightDate = new Date(f.timestamp);

          if (flightDate >= from && flightDate <= to) {
            allFlights.push(f);
          }

          if (flightDate < from) {
            keepSearching = false;
            break;
          }
        }

        page++;
      }

      return {
        flightLogs: allFlights,
        total: { value: allFlights.length, relation: 'eq' },
        page: '1',
        limit: String(allFlights.length),
      };
    },
  };
};
