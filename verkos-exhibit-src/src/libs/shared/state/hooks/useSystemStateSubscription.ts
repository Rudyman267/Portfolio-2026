import { useEffect, useMemo } from 'react';
import { SystemTopicType } from '../../socket/enums/topic-types.enum';
import useSocketStore from '../../socket/store/socket.store';
import useSystemStateStore from '../stores/system-state.store';
import { getSharedSubscription } from '../utils/shared-subscription';

/**
 * Format a system state topic for a binding
 */
const formatSystemStateTopic = (bindingId: string): string => {
  return `${bindingId}/${SystemTopicType.SystemState}`;
};

interface SystemStateOptions {
  throttle?: number;
  transform?: (data: any) => any;
}

/**
 * Core function to create system state subscriptions
 * Gets socket store and creates subscriptions
 * @param bindingIds Array of binding IDs or single ID
 * @param options Optional configuration
 * @returns Cleanup function
 */
function subscribeToSystemStateTopics(
  bindingIds: string | string[],
  options?: SystemStateOptions
): () => void {
  // Get socket store instance directly
  const socketStore = useSocketStore.getState();
  const { subscribe } = socketStore;

  // Normalize inputs to arrays
  const bindingIdsArray = Array.isArray(bindingIds) ? bindingIds : [bindingIds];

  // Skip if no bindings
  if (bindingIdsArray.length === 0) {
    // Return a no-op function when there's nothing to clean up
    return () => {
      // Intentionally empty - no subscriptions were created
    };
  }

  const unsubscribeFunctions: (() => void)[] = [];

  // Subscribe to system state for each binding
  bindingIdsArray.forEach((bindingId) => {
    // Create subscription key
    const subscriptionKey = `system:${bindingId}`;

    // Format topic
    const topic = formatSystemStateTopic(bindingId);

    // Create shared subscription
    const unsubscribe = getSharedSubscription(
      subscriptionKey,
      subscribe,
      () => ({
        topic,
        options,
        callback: (data: any) => {
          // Update store directly
          useSystemStateStore.getState().setSystemState(bindingId, data.data);
        },
      })
    );

    unsubscribeFunctions.push(unsubscribe);
  });

  // Return cleanup function
  return () => {
    unsubscribeFunctions.forEach((unsubscribe) => unsubscribe());
  };
}

/**
 * Hook for subscribing to system state topics and updating the central store
 * @param bindingIds Single binding ID or array of IDs to subscribe to
 * @param options Optional configuration for throttling or data transformation
 */
export function useSystemStateSubscription(
  bindingIds: string | string[],
  options?: SystemStateOptions
) {
  // Get socket store subscribe method for connection status
  const { isConnected } = useSocketStore();

  // Normalize inputs to arrays for dependency tracking
  const bindingIdsArray = useMemo(
    () => (Array.isArray(bindingIds) ? bindingIds : [bindingIds]),
    [typeof bindingIds === 'string' ? bindingIds : bindingIds.join(',')]
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
    return subscribeToSystemStateTopics(bindingIdsArray, stableOptions);
  }, [isConnected, bindingIdsArray.join(','), stableOptions]);
}

/**
 * Non-hook version that can be used anywhere
 * Returns a cleanup function that must be called to unsubscribe
 */
export function subscribeSystemState(
  bindingIds: string | string[],
  options?: SystemStateOptions
): () => void {
  // Create subscriptions using common function
  return subscribeToSystemStateTopics(bindingIds, options);
}
