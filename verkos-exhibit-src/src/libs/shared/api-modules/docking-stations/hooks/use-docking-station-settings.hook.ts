import { useQuery } from '@tanstack/react-query';
import { useDockingStationSettingsApi } from '../api/docking-station-settings.api';

/**
 * Keys for docking station settings queries
 */
export const dockingStationSettingsKeys = {
  all: ['dockingStationSettings'] as const,
  detail: (bindingId: string) =>
    [...dockingStationSettingsKeys.all, bindingId] as const,
};

/**
 * Hook to fetch docking station settings
 *
 * @param bindingId The binding ID of the docking station
 * @param options Additional query options
 * @returns Query result with docking station settings data
 */
export const useDockingStationSettings = (bindingId?: string) => {
  const dockingStationSettingsApi = useDockingStationSettingsApi();

  const query = useQuery({
    queryKey: bindingId ? dockingStationSettingsKeys.detail(bindingId) : [],
    queryFn: async () => {
      if (!bindingId) {
        throw new Error(
          'Binding ID is required to fetch docking station settings'
        );
      }
      return dockingStationSettingsApi.fetchDockingStationSettings(bindingId);
    },
    staleTime: 60_000,
    refetchOnWindowFocus: false,
  });

  return {
    settings: query.data,
    isLoading: query.isLoading,
    error: query.error,
    refetch: query.refetch,
  };
};
