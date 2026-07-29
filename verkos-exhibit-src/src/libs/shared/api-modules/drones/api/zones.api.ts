import { useHttp } from '@auth';
import { DroneZone, OrgZonesResponse } from '../types/zone.types';

/**
 * Hook that provides access to drone-related API operations
 */
export const useOrgZonesApi = () => {
  // Get HTTP client from auth lib's provider
  const httpClient = useHttp();

  return {
    /**
     * Fetch all zones for the current organization
     */
    fetchOrgZones: async (): Promise<OrgZonesResponse> => {
      const response = await httpClient.get<OrgZonesResponse>(`/zone_sync`);
      return response.data;
    },
  };
};
export const useDeviceZoneApi = () => {
  // Get HTTP client from auth lib's provider
  const httpClient = useHttp();

  return {
    /**
     * Fetch zones for a specific device
     */
    fetchDeviceZones: async (deviceId: string): Promise<DroneZone> => {
      const response = await httpClient.get<DroneZone>(
        `/zone_sync/${deviceId}`
      );
      return response.data;
    },
  };
};
