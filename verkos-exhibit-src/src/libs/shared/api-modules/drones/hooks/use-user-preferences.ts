import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useUserPreferenceApi } from '../api/user-preference.api';
import { UserPreferenceResponse } from '../types/user-preference.types';

// Query key factory for user preferences
const userPreferencesKeys = {
  all: ['user-preferences'] as const,
  settings: () => [...userPreferencesKeys.all, 'settings'] as const,
};

/**
 * Hook to fetch and update user preferences
 */
export const useUserPreferences = () => {
  const api = useUserPreferenceApi();
  const queryClient = useQueryClient();

  // Query for fetching user preferences
  const query = useQuery({
    queryKey: userPreferencesKeys.settings(),
    queryFn: api.fetchUserPreferences,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  // Mutation for updating user preferences
  const updatePreferencesMutation = useMutation<
    UserPreferenceResponse,
    Error,
    UserPreferenceResponse
  >({
    mutationFn: (preferences: UserPreferenceResponse) =>
      api.updateUserPreferences(preferences),
    onSuccess: (data) => {
      // Update the cache with the new preferences returned from the server
      queryClient.setQueryData(userPreferencesKeys.settings(), data);
    },
  });

  /**
   * Updates the altitude reference type preference
   * @param referenceType 0 for RLT, 1 for AGL
   */
  const updateAltitudeReferenceType = (referenceType: number) => {
    if (!query.data) {
      console.error('Cannot update preferences: No preference data loaded');
      return;
    }

    // Create a new preferences object with the updated field
    const updatedPreferences = {
      ...query.data,
      altitude_reference_type: referenceType,
    };

    // Call the mutation with the updated preferences
    return updatePreferencesMutation.mutate(updatedPreferences);
  };

  return {
    // Query data and status
    preferences: query.data,
    isLoading: query.isLoading,
    isError: query.isError,
    error: query.error,

    // Mutation methods and status
    updatePreferences: {
      mutate: updatePreferencesMutation.mutate,
      mutateAsync: updatePreferencesMutation.mutateAsync,
      isLoading: updatePreferencesMutation.isPending,
      error: updatePreferencesMutation.error,
    },
    updateAltitudeReferenceType,
  };
};
