import { useHttp } from '@auth';

/**
 * Response structure for bulk flight operations
 */
export interface BulkFlightOperationResponse {
  success: boolean;
  message: string;
  device_count: number;
}

/**
 * Hook that provides access to drone flight operations API
 */
export const useFlightOperationsApi = () => {
  // Get HTTP client from auth lib's provider
  const httpClient = useHttp();

  return {
    /**
     * Initiates Return to Home (RTH) for multiple drones simultaneously
     * @param deviceIds Array of device IDs to perform RTH on
     */
    bulkReturnToHome: async (
      deviceIds: string[]
    ): Promise<BulkFlightOperationResponse> => {
      const response = await httpClient.post<BulkFlightOperationResponse>(
        '/bulk/flight/return_to_home',
        { deviceIds }
      );
      return response.data;
    },

    /**
     * Commands multiple drones to ascend to their configured safe altitude
     * @param deviceIds Array of device IDs to perform GTSA on
     */
    bulkGoToSafeAltitude: async (
      deviceIds: string[]
    ): Promise<BulkFlightOperationResponse> => {
      const response = await httpClient.post<BulkFlightOperationResponse>(
        '/bulk/flight/goto_safe_altitude',
        { deviceIds }
      );
      return response.data;
    },

    /**
     * Commands multiple drones to return to their configured safe location
     * @param deviceIds Array of device IDs to perform RTSL on
     */
    bulkReturnToSafeLocation: async (
      deviceIds: string[]
    ): Promise<BulkFlightOperationResponse> => {
      const response = await httpClient.post<BulkFlightOperationResponse>(
        '/bulk/flight/rtsl',
        { deviceIds }
      );
      return response.data;
    },

    /**
     * Stops any ongoing commands for multiple drones
     * @param deviceIds Array of device IDs to stop commands on
     */
    bulkStopAllCommands: async (
      deviceIds: string[]
    ): Promise<BulkFlightOperationResponse> => {
      const response = await httpClient.post<BulkFlightOperationResponse>(
        '/bulk/flight/stop_all',
        { deviceIds }
      );
      return response.data;
    },

    /**
     * Takes drone control for multiple drones
     * @param deviceIds Array of device IDs to take drone control for
     */
    bulkTakeDroneControl: async (
      deviceIds: string[]
    ): Promise<BulkFlightOperationResponse> => {
      const response = await httpClient.post<BulkFlightOperationResponse>(
        '/bulk/control/take_drone_control',
        { deviceIds }
      );
      return response.data;
    },

    /**
     * Takes payload control for multiple drones
     * @param deviceIds Array of device IDs to take payload control for
     */
    bulkTakePayloadControl: async (
      deviceIds: string[]
    ): Promise<BulkFlightOperationResponse> => {
      const response = await httpClient.post<BulkFlightOperationResponse>(
        '/bulk/control/take_payload_control',
        { deviceIds }
      );
      return response.data;
    },
  };
};
