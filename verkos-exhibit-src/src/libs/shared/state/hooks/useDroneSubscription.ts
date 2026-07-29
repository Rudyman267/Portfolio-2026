import { useEffect, useMemo } from 'react';
import useDronesStore from '../stores/drones.store';
import { DroneTopicType } from '../../socket/enums/topic-types.enum';
import useSocketStore from '../../socket/store/socket.store';
import { formatDeviceTopic } from '../../socket/utils/topic-formatter';
import { getSharedSubscription } from '../utils/shared-subscription';
import { transformDroneTopicData } from '../utils/topic-transformers';

/**
 * Maps topic types to their corresponding property paths in the drone state
 */
const TOPIC_TO_PROPERTY_MAP: Record<DroneTopicType, string> = {
  [DroneTopicType.Position]: 'globalPosition',
  [DroneTopicType.Status]: 'status',
  [DroneTopicType.Battery]: 'battery',
  [DroneTopicType.AccessControl]: 'accessControl',
  [DroneTopicType.Diagnostics]: 'diagnostics',
  [DroneTopicType.Heartbeat]: 'heartbeat',
  [DroneTopicType.ProcessedSyncState]: 'processedSyncState',
  [DroneTopicType.Notification]: 'notifications',
  [DroneTopicType.Attitude]: 'attitude',
  [DroneTopicType.RTHPath]: 'rthPath',
  [DroneTopicType.CompletedGoto]: 'completedGoto',
  [DroneTopicType.FlightState]: 'flightState',
  [DroneTopicType.SafetyCommandStatus]: 'safetyCommandStatus',
  [DroneTopicType.Weather]: 'weather',
  [DroneTopicType.DroneStateData]: 'droneStateData',
  [DroneTopicType.PayloadsList]: 'payload',
};

/**
 * Core function to create drone data subscriptions
 * Gets socket store and creates subscriptions
 * @param droneIds Array of drone IDs or single ID
 * @param topics Array of topics
 * @param options Optional configuration
 * @returns Cleanup function
 */
function subscribeToDroneTopics(
  droneIds: string | string[],
  topics: DroneTopicType[],
  options?: {
    throttle?: number;
    transform?: (data: any) => any;
  }
): () => void {
  // Get socket store instance directly
  const socketStore = useSocketStore.getState();
  const { subscribe } = socketStore;

  // Normalize inputs to arrays
  const droneIdsArray = Array.isArray(droneIds) ? droneIds : [droneIds];

  // Skip if no topics/drones
  if (topics.length === 0 || droneIdsArray.length === 0) {
    // Return a no-op function when there's nothing to clean up
    return () => {
      // Intentionally empty - no subscriptions were created
    };
  }

  const unsubscribeFunctions: (() => void)[] = [];

  // Subscribe to each topic for each drone
  droneIdsArray.forEach((droneId) => {
    topics.forEach((topicType) => {
      // Create subscription key
      const subscriptionKey = `drone:${droneId}:${topicType}`;

      // Get property path
      const propertyPath = TOPIC_TO_PROPERTY_MAP[topicType];

      // Format topic
      const fullTopic = formatDeviceTopic(topicType, droneId);

      // Create shared subscription
      const unsubscribe = getSharedSubscription(
        subscriptionKey,
        subscribe,
        () => ({
          topic: fullTopic,
          options: options,
          callback: (data: any) => {
            const value = transformDroneTopicData(topicType, data, droneId);
            useDronesStore
              .getState()
              .updateDroneProperty(droneId, propertyPath, value);
          },
        })
      );

      unsubscribeFunctions.push(unsubscribe);
    });
  });

  // Return cleanup function
  return () => {
    unsubscribeFunctions.forEach((unsubscribe) => unsubscribe());
  };
}

/**
 * Hook for subscribing to drone topics and updating the central store
 * @param droneIds Single drone ID or array of IDs to subscribe to
 * @param topics Array of topics to subscribe to
 * @param options Optional configuration for throttling or data transformation
 */
export function useDroneSubscription(
  droneIds: string | string[],
  topics: DroneTopicType[],
  options?: {
    throttle?: number;
    transform?: (data: any) => any;
  }
) {
  // Normalize inputs to arrays for dependency tracking
  const droneIdsArray = useMemo(
    () => (Array.isArray(droneIds) ? droneIds : [droneIds]),
    [typeof droneIds === 'string' ? droneIds : droneIds.join(',')]
  );

  // Stable options reference
  const stableOptions = useMemo(() => options, []);

  // Set up subscriptions (connection-aware handled at socket layer)
  useEffect(() => {
    return subscribeToDroneTopics(droneIdsArray, topics, stableOptions);
  }, [droneIdsArray.join(','), topics.join(','), stableOptions]);
}

/**
 * Non-hook version that can be used anywhere
 * Returns a cleanup function that must be called to unsubscribe
 */
export function subscribeDrone(
  droneIds: string | string[],
  topics: DroneTopicType[],
  options?: {
    throttle?: number;
    transform?: (data: any) => any;
  }
): () => void {
  // Create subscriptions using common function
  return subscribeToDroneTopics(droneIds, topics, options);
}
