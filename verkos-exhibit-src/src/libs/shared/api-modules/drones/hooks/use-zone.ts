import { useQuery } from '@tanstack/react-query';
import { useDeviceZoneApi, useOrgZonesApi } from '../api/zones.api';
import { DeviceZonesResponse, OrgZonesResponse } from '../types/zone.types';

// Query keys for consistent cache management
export const ZONE_KEYS = {
  all: ['zones'] as const,
  orgZones: () => [...ZONE_KEYS.all, 'orgZones'] as const,
  deviceZones: (id: string) => [...ZONE_KEYS.all, 'deviceZones', id] as const,
};

/**
 * Hook for fetching and managing all zones
 */
export const useOrgZones = () => {
  const orgZonesApi = useOrgZonesApi();

  const query = useQuery<OrgZonesResponse>({
    queryKey: ZONE_KEYS.orgZones(),
    queryFn: () => orgZonesApi.fetchOrgZones(),
    staleTime: 0, // 1 minute
    refetchOnWindowFocus: false,
  });

  return {
    orgZones: query.data,
    isLoading: query.isLoading,
    error: query.error,
    refetch: query.refetch,
  };
};

export const useDeviceZones = (deviceId: string) => {
  const deviceZonesApi = useDeviceZoneApi();

  const query = useQuery<DeviceZonesResponse>({
    queryKey: ZONE_KEYS.deviceZones(deviceId),
    queryFn: () => deviceZonesApi.fetchDeviceZones(deviceId),
    staleTime: 0, // No stale time - always fetch fresh data for zone updates
    refetchOnWindowFocus: false,
  });

  return {
    deviceZones: query.data,
    isLoading: query.isLoading,
    error: query.error,
    refetch: query.refetch,
  };
};
