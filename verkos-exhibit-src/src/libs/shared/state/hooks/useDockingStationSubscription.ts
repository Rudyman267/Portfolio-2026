import { useEffect, useMemo } from 'react';
import useDockingStationsStore from '../stores/docking-stations.store';
import { DockingStationTopicType } from '../../socket/enums/topic-types.enum';
import useSocketStore from '../../socket/store/socket.store';
import { formatDeviceTopic } from '../../socket/utils/topic-formatter';
import { getSharedSubscription } from '../utils/shared-subscription';
import { transformDockTopicData } from '../utils/topic-transformers';

/**
 * Maps topic types to their corresponding property paths in the docking station state
 */
const TOPIC_TO_PROPERTY_MAP: Record<DockingStationTopicType, string> = {
  [DockingStationTopicType.Position]: 'globalPosition',
  [DockingStationTopicType.Weather]: 'weather',
  [DockingStationTopicType.DockState]: 'dockStatus',
  [DockingStationTopicType.PayloadsList]: 'payload',
};

/**
 * Core function to create docking station data subscriptions
 * Gets socket store and creates subscriptions
 * @param dockingStationIds Array of docking station IDs or single ID
 * @param topics Array of topics
 * @param options Optional configuration
 * @returns Cleanup function
 */
function subscribeToDockingStationTopics(
  dockingStationIds: string | string[],
  topics: DockingStationTopicType[],
  options?: {
    throttle?: number;
    transform?: (data: any) => any;
  }
): () => void {
  // Get socket store instance directly
  const socketStore = useSocketStore.getState();
  const { subscribe } = socketStore;

  // Normalize inputs to arrays
  const dockingStationIdsArray = Array.isArray(dockingStationIds)
    ? dockingStationIds
    : [dockingStationIds];

  // Skip if no topics/docking stations
  if (topics.length === 0 || dockingStationIdsArray.length === 0) {
    // Return a no-op function when there's nothing to clean up
    return () => {
      // Intentionally empty - no subscriptions were created
    };
  }

  const unsubscribeFunctions: (() => void)[] = [];

  // Subscribe to each topic for each docking station
  dockingStationIdsArray.forEach((dockingStationId) => {
    topics.forEach((topicType) => {
      // Create subscription key
      const subscriptionKey = `dockingStation:${dockingStationId}:${topicType}`;

      // Get property path
      const propertyPath = TOPIC_TO_PROPERTY_MAP[topicType];

      // Format topic
      const fullTopic = formatDeviceTopic(topicType, dockingStationId);

      // Create shared subscription
      const unsubscribe = getSharedSubscription(
        subscriptionKey,
        subscribe,
        () => ({
          topic: fullTopic,
          options: options,
          callback: (data: any) => {
            const value = transformDockTopicData(
              topicType,
              data,
              dockingStationId
            );
            useDockingStationsStore
              .getState()
              .updateDockingStationProperty(
                dockingStationId,
                propertyPath,
                value
              );
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
 * Hook for subscribing to docking station topics and updating the central store
 * @param dockingStationIds Single docking station ID or array of IDs to subscribe to
 * @param topics Array of topics to subscribe to
 * @param options Optional configuration for throttling or data transformation
 */
export function useDockingStationSubscription(
  dockingStationIds: string | string[],
  topics: DockingStationTopicType[],
  options?: {
    throttle?: number;
    transform?: (data: any) => any;
  }
) {
  // Get socket store subscribe method for connection status
  const { isConnected } = useSocketStore();

  // Normalize inputs to arrays for dependency tracking
  const dockingStationIdsArray = useMemo(
    () =>
      Array.isArray(dockingStationIds)
        ? dockingStationIds
        : [dockingStationIds],
    [
      typeof dockingStationIds === 'string'
        ? dockingStationIds
        : dockingStationIds.join(','),
    ]
  );

  // Stable options reference
  const stableOptions = useMemo(() => options, []);

  // Set up subscriptions
  useEffect(() => {
    // Skip if not connected
    if (!isConnected) {
      return;
    }

    // Create subscriptions
    return subscribeToDockingStationTopics(
      dockingStationIdsArray,
      topics,
      stableOptions
    );
  }, [
    isConnected,
    dockingStationIdsArray.join(','),
    topics.join(','),
    stableOptions,
  ]);
}

/**
 * Non-hook version that can be used anywhere
 * Returns a cleanup function that must be called to unsubscribe
 */
export function subscribeDockingStation(
  dockingStationIds: string | string[],
  topics: DockingStationTopicType[],
  options?: {
    throttle?: number;
    transform?: (data: any) => any;
  }
): () => void {
  // Create subscriptions using common function
  return subscribeToDockingStationTopics(dockingStationIds, topics, options);
}
