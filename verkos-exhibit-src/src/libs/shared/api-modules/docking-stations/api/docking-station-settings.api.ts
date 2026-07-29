import { useHttp } from '@auth';
import { DockingStationSettingsResponse } from '../types/docking-station-settings.types';

/**
 * Hook that provides access to docking station settings API operations
 */
export const useDockingStationSettingsApi = () => {
  // Get HTTP client from auth lib's provider
  const httpClient = useHttp();

  return {
    /**
     * Fetch docking station settings by binding ID
     * @param bindingId The binding ID of the docking station
     */
    fetchDockingStationSettings: async (
      bindingId: string
    ): Promise<DockingStationSettingsResponse> => {
      const response = await httpClient.get<DockingStationSettingsResponse>(
        `/docking_station_settings/${bindingId}`
      );
      return response.data;
    },
  };
};
