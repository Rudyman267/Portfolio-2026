import { useHttp } from '@auth';
import { UserProfileResponse } from '../types/user-profile.types';

export const useUserProfileApi = () => {
  const httpClient = useHttp();

  return {
    fetchUserProfile: async (): Promise<UserProfileResponse> => {
      const response = await httpClient.get<UserProfileResponse>(
        '/v2/user/profile'
      );
      return response.data;
    },
  };
};
