import { useHttp } from '@auth';
import { DeviceBindingsResponse } from '../types/drone.types';

/**
 * Hook that provides access to drone-related API operations
 */
export const useDevicesApi = () => {
  // Get HTTP client from auth lib's provider
  const httpClient = useHttp();

  return {
    /**
     * Fetch all drone bindings for the current organization
     * This returns drones and their associated docking stations
     */
    fetchDeviceBindings: async (
      active = true
    ): Promise<DeviceBindingsResponse> => {
      const response = await httpClient.get<DeviceBindingsResponse>(
        `/device/bindings?active=${active}`
      );
      return response.data;
    },
  };
};
