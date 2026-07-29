import { useEffect } from 'react';
import useIntrudersStore from '../stores/intruders.store';
import useSocketStore from '../../socket/store/socket.store';
import { getSharedSubscription } from '../utils/shared-subscription';

/**
 * Core function to create intruder data subscriptions
 * Creates organization-level subscription for airspace intruders
 * @param orgId Organization ID for the subscription
 * @param options Optional configuration
 * @returns Cleanup function
 */
function subscribeToIntruderTopics(
  orgId: string,
  options?: {
    throttle?: number;
    transform?: (data: any) => any;
  }
): () => void {
  // Get socket store instance directly
  const socketStore = useSocketStore.getState();
  const { subscribe } = socketStore;

  // Skip if no orgId
  if (!orgId) {
    return () => {
      // Intentionally empty - no subscriptions were created
    };
  }

  const subscriptionKey = `intruders:${orgId}:airspace`;

  // Format topic: {orgId}/airspace/intruders
  const fullTopic = `airspace/intruders`;

  // Return cleanup function
  return getSharedSubscription(subscriptionKey, subscribe, () => ({
    topic: fullTopic,
    options: options,
    callback: (data: any) => {
      if (data && typeof data === 'object') {
        useIntrudersStore.getState().updateIntrudersData(data);
      }
    },
  }));
}

/**
 * Hook for subscribing to organization-level intruder topics
 * @param orgId Organization ID to subscribe to
 * @param options Optional configuration for throttling or data transformation
 */
export function useIntruderSubscription(
  orgId: string,
  options?: {
    throttle?: number;
    transform?: (data: any) => any;
  }
) {
  // Set up subscriptions (connection-aware handled at socket layer)
  useEffect(() => {
    if (!orgId) return;

    return subscribeToIntruderTopics(orgId, options);
  }, [orgId, options]);
}

/**
 * Non-hook version that can be used anywhere
 * Returns a cleanup function that must be called to unsubscribe
 */
export function subscribeIntruder(
  orgId: string,
  options?: {
    throttle?: number;
    transform?: (data: any) => any;
  }
): () => void {
  return subscribeToIntruderTopics(orgId, options);
}
