import { useHttp } from '@auth';
import {
  TakeControlRequest,
  TakeControlResponse,
} from '../types/access-control.types';

/**
 * Hook that provides access to drone control API operations
 */
export const useAccessControlApi = () => {
  // Get HTTP client from auth lib's provider
  const httpClient = useHttp();

  return {
    /**
     * Take control of a drone
     *
     * @param payload The take control request payload
     * @returns The take control response
     */
    takeControl: async (
      payload: TakeControlRequest
    ): Promise<TakeControlResponse> => {
      const response = await httpClient.post<TakeControlResponse>(
        '/access_management/take_drone_control',
        payload
      );
      return response.data;
    },
  };
};
