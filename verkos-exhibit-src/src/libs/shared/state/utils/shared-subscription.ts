/**
 * Shared subscription registry for efficient socket subscriptions
 *
 * This utility ensures that no matter how many components subscribe to the
 * same topic, only one actual subscription with one callback is created.
 * It manages reference counting and cleanup across the entire application.
 */

// Type for a subscription entry in the registry
interface SubscriptionEntry {
  count: number;
  unsubscribe: () => void;
}

// Static/shared registry that persists across all hook instances
const SHARED_SUBSCRIPTION_REGISTRY = new Map<string, SubscriptionEntry>();

/**
 * Get or create a shared subscription for a topic
 *
 * @param topicKey A unique key for the topic (e.g., "drone:123:position")
 * @param subscribe The subscribe function from socket store
 * @param createActualSubscription Function to create the actual subscription
 * @returns Function to unsubscribe (decrements reference count)
 */
export function getSharedSubscription(
  topicKey: string,
  subscribe: any,
  createActualSubscription: () => {
    topic: string;
    callback: (data: any) => void;
    options?: any;
  }
): () => void {
  // Check if we already have this subscription
  const existingEntry = SHARED_SUBSCRIPTION_REGISTRY.get(topicKey);

  if (existingEntry) {
    // Increment the reference count
    existingEntry.count++;

    // Return a function that decrements the count when called
    return () => decrementSubscription(topicKey);
  }

  // Safety check: if subscribe method is not available or not a function
  // (which can happen during HMR), return a no-op function
  if (!subscribe || typeof subscribe !== 'function') {
    console.warn(
      `Socket subscription unavailable for ${topicKey} - will retry on reconnect`
    );
    return () => {
      // Return a no-op function
    };
  }

  try {
    // No existing subscription, create a new one
    const { topic, callback, options } = createActualSubscription();

    // Subscribe with the unified callback
    const unsubscribe = subscribe(topic, {
      ...options,
      callback,
    });

    // Store in the registry with count 1
    SHARED_SUBSCRIPTION_REGISTRY.set(topicKey, {
      count: 1,
      unsubscribe,
    });

    // Return function to decrement count and potentially unsubscribe
    return () => decrementSubscription(topicKey);
  } catch (error) {
    // If subscription fails (e.g., socket not initialized), log and return no-op
    console.warn(
      `Failed to create subscription for ${topicKey}: ${error.message}`
    );
    return () => {
      // Return a no-op function
    };
  }
}

/**
 * Helper to decrement a subscription's reference count
 *
 * @param topicKey The topic key to decrement
 */
function decrementSubscription(topicKey: string): void {
  const entry = SHARED_SUBSCRIPTION_REGISTRY.get(topicKey);
  if (!entry) return;

  entry.count--;

  if (entry.count <= 0) {
    // Last reference is gone, actually unsubscribe
    entry.unsubscribe();
    SHARED_SUBSCRIPTION_REGISTRY.delete(topicKey);
  }
}

/**
 * Get the current reference count for a topic
 * Useful for debugging
 *
 * @param topicKey The topic key to check
 * @returns The reference count, or 0 if not found
 */
export function getSubscriptionCount(topicKey: string): number {
  return SHARED_SUBSCRIPTION_REGISTRY.get(topicKey)?.count || 0;
}

/**
 * Get all active shared subscriptions
 * Useful for debugging
 *
 * @returns Array of [topicKey, count] pairs
 */
export function getAllSubscriptions(): [string, number][] {
  return Array.from(SHARED_SUBSCRIPTION_REGISTRY.entries()).map(
    ([key, entry]) => [key, entry.count]
  );
}
