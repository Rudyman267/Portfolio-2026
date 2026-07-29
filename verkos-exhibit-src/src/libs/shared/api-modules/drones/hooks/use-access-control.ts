import { useMutation } from '@tanstack/react-query';
import { useAccessControlApi } from '../api/access-control.api';
import {
  TakeControlRequest,
  TakeControlResponse,
} from '../types/access-control.types';

// Query keys for consistent cache management
export const ACCESS_CONTROL_KEYS = {
  all: ['access-control'] as const,
  takeControl: () => [...ACCESS_CONTROL_KEYS.all, 'take-control'] as const,
};

/**
 * Hook for taking control of a drone
 *
 * @returns A mutation function for taking control of a drone
 */
export const useTakeControl = () => {
  const accessControlApi = useAccessControlApi();

  return useMutation<TakeControlResponse, Error, TakeControlRequest>({
    mutationFn: (payload) => accessControlApi.takeControl(payload),
    // Don't need to invalidate cache because this mutation doesn't affect existing queries
  });
};
