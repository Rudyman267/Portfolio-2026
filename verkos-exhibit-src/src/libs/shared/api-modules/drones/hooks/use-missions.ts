import { useQuery } from '@tanstack/react-query';
import { useMissionsApi } from '../api/missions.api';
import { MissionBESimple, MissionsResponse } from '../types/mission.types';

// Query keys for consistent cache management
export const MISSION_KEYS = {
  all: ['missions'] as const,
  allMissions: () => [...MISSION_KEYS.all, 'allMissions'] as const,
  missionDetails: (id: string) =>
    [...MISSION_KEYS.all, 'missionDetails', id] as const,
};

/**
 * Hook for fetching and managing all missions
 */
export const useMissions = () => {
  const missionsApi = useMissionsApi();

  const query = useQuery<MissionsResponse>({
    queryKey: MISSION_KEYS.allMissions(),
    queryFn: () => missionsApi.fetchMissions(),
    staleTime: 60000, // 1 minute
    refetchOnWindowFocus: false,
  });

  return {
    missions: query.data,
    isLoading: query.isLoading,
    error: query.error,
    refetch: query.refetch,
  };
};

/**
 * Hook for fetching a specific mission by ID
 */
export const useMissionById = (missionId: string) => {
  const missionsApi = useMissionsApi();

  const query = useQuery<MissionBESimple>({
    queryKey: MISSION_KEYS.missionDetails(missionId),
    queryFn: () => missionsApi.fetchMissionById(missionId),
    staleTime: 60000, // 1 minute
    refetchOnWindowFocus: false,
    // Only fetch if we have a mission ID
    enabled: !!missionId,
  });

  return {
    mission: query.data,
    isLoading: query.isLoading,
    error: query.error,
    refetch: query.refetch,
  };
};
