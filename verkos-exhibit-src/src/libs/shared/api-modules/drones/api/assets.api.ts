/* eslint-disable @nx/enforce-module-boundaries */
import { useHttp } from '@auth';
import { Asset } from '../types/assets.types';

/**
 * Hook that provides access to drone-related API operations
 */
export const useAssetsApi = () => {
  // Get HTTP client from auth lib's provider
  const httpClient = useHttp();

  return {
    /**
     * Fetch all drone bindings for the current organization
     * This returns drones and their associated docking stations
     */
    fetchAssets: async (): Promise<Asset[]> => {
      const response = await httpClient.get<Asset[]>(`/assets`);
      return response.data;
    },
  };
};
