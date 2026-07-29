import { useEffect, useMemo } from 'react';
import useRemoteControllersStore from '../stores/remote-controllers.store';
import { RemoteControllerTopicType } from '../../socket/enums/topic-types.enum';
import useSocketStore from '../../socket/store/socket.store';
import { formatDeviceTopic } from '../../socket/utils/topic-formatter';
import { getSharedSubscription } from '../utils/shared-subscription';

/**
 * Maps topic types to their corresponding property paths in the remote controller state
 */
const TOPIC_TO_PROPERTY_MAP: Record<RemoteControllerTopicType, string> = {
  [RemoteControllerTopicType.GlobalPosition]: 'globalPosition',
  [RemoteControllerTopicType.SDRLinkState]: 'sdrLinkState',
  [RemoteControllerTopicType.DockState]: 'dockState',
};

/**
 * Core function to create remote controller data subscriptions
 * Gets socket store and creates subscriptions
 * @param rcIds Array of remote controller IDs or single ID
 * @param topics Array of topics
 * @param options Optional configuration
 * @returns Cleanup function
 */
function subscribeToRemoteControllerTopics(
  rcIds: string | string[],
  topics: RemoteControllerTopicType[],
  options?: {
    throttle?: number;
    transform?: (data: any) => any;
  }
): () => void {
  // Get socket store instance directly
  const socketStore = useSocketStore.getState();
  const { subscribe } = socketStore;

  // Normalize inputs to arrays
  const rcIdsArray = Array.isArray(rcIds) ? rcIds : [rcIds];

  // Skip if no topics/RCs
  if (topics.length === 0 || rcIdsArray.length === 0) {
    // Return a no-op function when there's nothing to clean up
    return () => {
      // Intentionally empty - no subscriptions were created
    };
  }

  const unsubscribeFunctions: (() => void)[] = [];

  // Subscribe to each topic for each remote controller
  rcIdsArray.forEach((rcId) => {
    topics.forEach((topicType) => {
      // Create subscription key
      const subscriptionKey = `rc:${rcId}:${topicType}`;

      // Get property path
      const propertyPath = TOPIC_TO_PROPERTY_MAP[topicType];

      // Format topic
      const fullTopic = formatDeviceTopic(topicType, rcId);

      // Create shared subscription
      const unsubscribe = getSharedSubscription(
        subscriptionKey,
        subscribe,
        () => ({
          topic: fullTopic,
          options: options,
          callback: (data: any) => {
            // Update remote controller store directly
            useRemoteControllersStore
              .getState()
              .updateRemoteControllerProperty(rcId, propertyPath, data);
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
 * Hook for subscribing to remote controller topics and updating the central store
 * @param rcIds Single remote controller ID or array of IDs to subscribe to
 * @param topics Array of topics to subscribe to
 * @param options Optional configuration for throttling or data transformation
 */
export function useRemoteControllerSubscription(
  rcIds: string | string[],
  topics: RemoteControllerTopicType[],
  options?: {
    throttle?: number;
    transform?: (data: any) => any;
  }
) {
  // Normalize inputs to arrays for dependency tracking
  const rcIdsArray = useMemo(
    () => (Array.isArray(rcIds) ? rcIds : [rcIds]),
    [typeof rcIds === 'string' ? rcIds : rcIds.join(',')]
  );

  // Stable options reference
  const stableOptions = useMemo(() => options, []);

  // Set up subscriptions (connection-aware handled at socket layer)
  useEffect(() => {
    return subscribeToRemoteControllerTopics(rcIdsArray, topics, stableOptions);
  }, [rcIdsArray.join(','), topics.join(','), stableOptions]);
}

/**
 * Non-hook version that can be used anywhere
 * Returns a cleanup function that must be called to unsubscribe
 */
export function subscribeRemoteController(
  rcIds: string | string[],
  topics: RemoteControllerTopicType[],
  options?: {
    throttle?: number;
    transform?: (data: any) => any;
  }
): () => void {
  // Create subscriptions using common function
  return subscribeToRemoteControllerTopics(rcIds, topics, options);
}
