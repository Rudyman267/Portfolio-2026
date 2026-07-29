import { useMutation } from '@tanstack/react-query';
import {
  useFlightOperationsApi,
  BulkFlightOperationResponse,
} from '../api/flight-operations.api';

/**
 * Hook for managing bulk flight operations on multiple drones
 */
export const useFlightOperations = () => {
  const flightOperationsApi = useFlightOperationsApi();

  // Return to Home (RTH) mutation
  const returnToHomeMutation = useMutation<
    BulkFlightOperationResponse,
    Error,
    string[]
  >({
    mutationFn: (deviceIds: string[]) =>
      flightOperationsApi.bulkReturnToHome(deviceIds),
    onSuccess: (data) => {
      console.log(`RTH successful for ${data.device_count} devices`);
    },
    onError: (error) => {
      console.error('RTH operation failed:', error);
    },
  });

  // Go To Safe Altitude (GTSA) mutation
  const goToSafeAltitudeMutation = useMutation<
    BulkFlightOperationResponse,
    Error,
    string[]
  >({
    mutationFn: (deviceIds: string[]) =>
      flightOperationsApi.bulkGoToSafeAltitude(deviceIds),
    onSuccess: (data) => {
      console.log(`GTSA successful for ${data.device_count} devices`);
    },
    onError: (error) => {
      console.error('GTSA operation failed:', error);
    },
  });

  // Return To Safe Location (RTSL) mutation
  const returnToSafeLocationMutation = useMutation<
    BulkFlightOperationResponse,
    Error,
    string[]
  >({
    mutationFn: (deviceIds: string[]) =>
      flightOperationsApi.bulkReturnToSafeLocation(deviceIds),
    onSuccess: (data) => {
      console.log(`RTSL successful for ${data.device_count} devices`);
    },
    onError: (error) => {
      console.error('RTSL operation failed:', error);
    },
  });

  // Stop All Commands mutation
  const stopAllCommandsMutation = useMutation<
    BulkFlightOperationResponse,
    Error,
    string[]
  >({
    mutationFn: (deviceIds: string[]) =>
      flightOperationsApi.bulkStopAllCommands(deviceIds),
    onSuccess: (data) => {
      console.log(`STOP successful for ${data.device_count} devices`);
    },
    onError: (error) => {
      console.error('STOP operation failed:', error);
    },
  });

  // Take Drone Control mutation
  const takeDroneControlMutation = useMutation<
    BulkFlightOperationResponse,
    Error,
    string[]
  >({
    mutationFn: (deviceIds: string[]) =>
      flightOperationsApi.bulkTakeDroneControl(deviceIds),
    onSuccess: (data) => {
      console.log(`Take control successful for ${data.device_count} devices`);
    },
    onError: (error) => {
      console.error('Take control operation failed:', error);
    },
  });

  // Take Payload Control mutation
  const takePayloadControlMutation = useMutation<
    BulkFlightOperationResponse,
    Error,
    string[]
  >({
    mutationFn: (deviceIds: string[]) =>
      flightOperationsApi.bulkTakePayloadControl(deviceIds),
    onSuccess: (data) => {
      console.log(
        `Take payload control successful for ${data.device_count} devices`
      );
    },
    onError: (error) => {
      console.error('Take payload control operation failed:', error);
    },
  });

  return {
    returnToHome: {
      mutate: returnToHomeMutation.mutate,
      mutateAsync: returnToHomeMutation.mutateAsync,
      isLoading: returnToHomeMutation.isPending,
      isError: returnToHomeMutation.isError,
      isSuccess: returnToHomeMutation.isSuccess,
      error: returnToHomeMutation.error,
      data: returnToHomeMutation.data,
      reset: returnToHomeMutation.reset,
    },
    goToSafeAltitude: {
      mutate: goToSafeAltitudeMutation.mutate,
      mutateAsync: goToSafeAltitudeMutation.mutateAsync,
      isLoading: goToSafeAltitudeMutation.isPending,
      isError: goToSafeAltitudeMutation.isError,
      isSuccess: goToSafeAltitudeMutation.isSuccess,
      error: goToSafeAltitudeMutation.error,
      data: goToSafeAltitudeMutation.data,
      reset: goToSafeAltitudeMutation.reset,
    },
    returnToSafeLocation: {
      mutate: returnToSafeLocationMutation.mutate,
      mutateAsync: returnToSafeLocationMutation.mutateAsync,
      isLoading: returnToSafeLocationMutation.isPending,
      isError: returnToSafeLocationMutation.isError,
      isSuccess: returnToSafeLocationMutation.isSuccess,
      error: returnToSafeLocationMutation.error,
      data: returnToSafeLocationMutation.data,
      reset: returnToSafeLocationMutation.reset,
    },
    stopAllCommands: {
      mutate: stopAllCommandsMutation.mutate,
      mutateAsync: stopAllCommandsMutation.mutateAsync,
      isLoading: stopAllCommandsMutation.isPending,
      isError: stopAllCommandsMutation.isError,
      isSuccess: stopAllCommandsMutation.isSuccess,
      error: stopAllCommandsMutation.error,
      data: stopAllCommandsMutation.data,
      reset: stopAllCommandsMutation.reset,
    },
    takeDroneControl: {
      mutate: takeDroneControlMutation.mutate,
      mutateAsync: takeDroneControlMutation.mutateAsync,
      isLoading: takeDroneControlMutation.isPending,
      isError: takeDroneControlMutation.isError,
      isSuccess: takeDroneControlMutation.isSuccess,
      error: takeDroneControlMutation.error,
      data: takeDroneControlMutation.data,
      reset: takeDroneControlMutation.reset,
    },
    takePayloadControl: {
      mutate: takePayloadControlMutation.mutate,
      mutateAsync: takePayloadControlMutation.mutateAsync,
      isLoading: takePayloadControlMutation.isPending,
      isError: takePayloadControlMutation.isError,
      isSuccess: takePayloadControlMutation.isSuccess,
      error: takePayloadControlMutation.error,
      data: takePayloadControlMutation.data,
      reset: takePayloadControlMutation.reset,
    },
  };
};
