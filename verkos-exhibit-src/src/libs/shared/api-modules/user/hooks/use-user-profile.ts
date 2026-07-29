import { useQuery } from '@tanstack/react-query';
import { useUserProfileApi } from '../api/user-profile.api';
import { UserProfileResponse } from '../types/user-profile.types';

export const USER_PROFILE_KEYS = {
  all: ['userProfile'] as const,
  profile: () => [...USER_PROFILE_KEYS.all, 'profile'] as const,
};

export const useUserProfile = () => {
  const userProfileApi = useUserProfileApi();

  const query = useQuery<UserProfileResponse>({
    queryKey: USER_PROFILE_KEYS.profile(),
    queryFn: () => userProfileApi.fetchUserProfile(),
    staleTime: Infinity,
    refetchOnWindowFocus: false,
  });

  return {
    userProfile: query.data?.data,
    isLoading: query.isLoading,
    error: query.error,
    refetch: query.refetch,
  };
};
