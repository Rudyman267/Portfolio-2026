import { UserPreferenceResponse } from '../types/user-preference.types';
import { useHttp } from '@auth';

/**
 * Hook that provides access to user preference API operations
 */
export const useUserPreferenceApi = () => {
  // Get HTTP client from auth lib's provider
  const httpClient = useHttp();

  return {
    /**
     * Fetch user preference settings
     */
    fetchUserPreferences: async (): Promise<UserPreferenceResponse> => {
      const response = await httpClient.get<UserPreferenceResponse>(
        '/user_preference_settings'
      );
      return response.data;
    },

    /**
     * Update user preference settings
     * Sends the entire preferences object to the server
     */
    updateUserPreferences: async (
      preferences: UserPreferenceResponse
    ): Promise<UserPreferenceResponse> => {
      const response = await httpClient.put<UserPreferenceResponse>(
        '/user_preference_settings',
        preferences
      );
      return response.data;
    },
  };
};
