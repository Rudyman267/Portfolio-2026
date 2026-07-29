import { useQuery } from '@tanstack/react-query';
import { useDevicesApi } from '../api/drones.api';
import { DeviceBindingsResponse } from '../types/drone.types';

// Query keys for consistent cache management
export const DEVICE_BINDING_KEYS = {
  all: ['drones'] as const,
  bindings: () => [...DEVICE_BINDING_KEYS.all, 'bindings'] as const,
  binding: (id: string) => [...DEVICE_BINDING_KEYS.all, 'binding', id] as const,
};

/**
 * Hook for fetching and managing all device bindings
 */
export const useDeviceBindings = () => {
  const dronesApi = useDevicesApi();

  const query = useQuery<DeviceBindingsResponse>({
    queryKey: DEVICE_BINDING_KEYS.bindings(),
    queryFn: () => dronesApi.fetchDeviceBindings(),
    staleTime: 8 * 60 * 60 * 1000, // 8 hours
    refetchOnWindowFocus: false, // Don't refetch when window regains focus
  });

  return {
    bindings: query.data,
    isLoading: query.isLoading,
    error: query.error,
    refetch: query.refetch,
  };
};
