import { useQuery } from '@tanstack/react-query';
import { useAssetsApi } from '../api/assets.api';
import { Asset } from '../types/assets.types';

// Query keys for assets
const ASSETS_QUERY_KEYS = {
  all: ['assets'] as const,
  list: () => [...ASSETS_QUERY_KEYS.all, 'list'],
  detail: (id: string) => [...ASSETS_QUERY_KEYS.all, 'detail', id],
};

/**
 * Hook for managing assets data
 * Uses TanStack Query for data fetching, caching, and synchronization
 */
export const useOverlaidAssets = () => {
  const assetsApi = useAssetsApi();

  const query = useQuery<Asset[]>({
    queryKey: ASSETS_QUERY_KEYS.list(),
    queryFn: async () => {
      const assets = await assetsApi.fetchAssets();
      return assets.filter((asset) => asset.is_overlaid);
    },
    staleTime: 60000,
    refetchOnWindowFocus: false,
  });

  return {
    assets: query.data,
    isLoading: query.isLoading,
    error: query.error,
    refetch: query.refetch,
  };
};
