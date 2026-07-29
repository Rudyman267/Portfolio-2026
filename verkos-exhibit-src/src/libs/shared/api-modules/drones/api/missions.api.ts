import { useHttp } from '@auth';
import { MissionBESimple, MissionsResponse } from '../types/mission.types';

/**
 * Hook that provides access to mission-related API operations
 */
export const useMissionsApi = () => {
  // Get HTTP client from auth lib's provider
  const httpClient = useHttp();

  return {
    /**
     * Fetch all missions for the current organization
     */
    fetchMissions: async (): Promise<MissionsResponse> => {
      const response = await httpClient.get<MissionsResponse>('/v2/mission');
      return response.data;
    },

    /**
     * Fetch a specific mission by ID
     */
    fetchMissionById: async (missionId: string): Promise<MissionBESimple> => {
      const response = await httpClient.get<MissionBESimple>(
        `/v2/mission/${missionId}`
      );
      return response.data;
    },
  };
};
