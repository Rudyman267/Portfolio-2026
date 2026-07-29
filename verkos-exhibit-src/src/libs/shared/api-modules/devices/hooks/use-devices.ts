import { useQuery } from '@tanstack/react-query';
import { fetchDevices } from '../api/devices.api';
import type { DeviceResponse } from '../types/device.types';

export const DEVICES_QUERY_KEY = ['devices'] as const;

export const useDevices = () => {
  return useQuery<DeviceResponse>({
    queryKey: DEVICES_QUERY_KEY,
    queryFn: fetchDevices,
    staleTime: 1000 * 60 * 5, // 5 minutes
    gcTime: 1000 * 60 * 10, // 10 minutes
  });
};
