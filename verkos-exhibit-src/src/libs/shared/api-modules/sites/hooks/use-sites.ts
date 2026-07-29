import { useQuery } from '@tanstack/react-query';
import { useSitesApi } from '../api/sites.api';
import { SitesResponse } from '../types/sites.types';

export const SITES_KEYS = {
  all: ['sites'] as const,
  list: () => [...SITES_KEYS.all, 'list'] as const,
  detail: (id: string) => [...SITES_KEYS.all, 'detail', id] as const,
};

export const useSites = () => {
  const sitesApi = useSitesApi();

  const query = useQuery<SitesResponse>({
    queryKey: SITES_KEYS.list(),
    queryFn: () => sitesApi.fetchSites(),
    staleTime: 5 * 60 * 1000, // 5 minutes
    refetchOnWindowFocus: false,
  });

  return {
    data: query.data, // Direct array response
    sitesResponse: query.data,
    isLoading: query.isLoading,
    error: query.error,
    refetch: query.refetch,
  };
};
