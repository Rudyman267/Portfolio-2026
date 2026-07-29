import { useEffect, useMemo } from 'react';
import useSensorsStore from '../stores/sensors.store';
import { SensorTopicType } from '../../socket/enums/topic-types.enum';
import useSocketStore from '../../socket/store/socket.store';
import { getSharedSubscription } from '../utils/shared-subscription';

/**
 * Core function to create sensor data subscriptions
 * Gets socket store and creates subscriptions
 * @param sensorIds Array of sensor IDs or single ID
 * @param topics Array of topics
 * @param options Optional configuration
 * @returns Cleanup function
 */
function subscribeToSensorTopics(
  sensorIds: string | string[],
  topics: SensorTopicType[],
  options?: {
    throttle?: number;
    transform?: (data: any) => any;
  }
): () => void {
  const socketStore = useSocketStore.getState();
  const { subscribe } = socketStore;

  const sensorIdsArray = Array.isArray(sensorIds) ? sensorIds : [sensorIds];

  if (topics.length === 0 || sensorIdsArray.length === 0) {
    return () => {
      // Intentionally empty - no subscriptions were created
    };
  }

  const unsubscribeFunctions: (() => void)[] = [];

  sensorIdsArray.forEach((sensorId) => {
    topics.forEach((topicType) => {
      const subscriptionKey = `sensor:${sensorId}:${topicType}`;

      const fullTopic = `${sensorId}/${topicType}`;

      const unsubscribe = getSharedSubscription(
        subscriptionKey,
        subscribe,
        () => ({
          topic: fullTopic,
          options: options,
          callback: (data: any) => {
            useSensorsStore.getState().updateSensorData(sensorId, {
              id: sensorId,
              ...data,
            });
          },
        })
      );

      unsubscribeFunctions.push(unsubscribe);
    });
  });

  return () => {
    unsubscribeFunctions.forEach((unsubscribe) => unsubscribe());
  };
}

/**
 * Hook for subscribing to sensor topics and updating the central store
 * @param sensorIds Single sensor ID or array of IDs to subscribe to
 * @param topics Array of topics to subscribe to
 * @param options Optional configuration for throttling or data transformation
 */
export function useSensorSubscription(
  sensorIds: string | string[],
  topics: SensorTopicType[],
  options?: {
    throttle?: number;
    transform?: (data: any) => any;
  }
) {
  const { isConnected } = useSocketStore();

  const sensorIdsArray = useMemo(
    () => (Array.isArray(sensorIds) ? sensorIds : [sensorIds]),
    [typeof sensorIds === 'string' ? sensorIds : sensorIds.join(',')]
  );

  const stableOptions = useMemo(() => options, []);

  useEffect(() => {
    if (!isConnected) {
      return;
    }

    return subscribeToSensorTopics(sensorIdsArray, topics, stableOptions);
  }, [isConnected, sensorIdsArray.join(','), topics.join(','), stableOptions]);
}

/**
 * Non-hook version that can be used anywhere
 * Returns a cleanup function that must be called to unsubscribe
 */
export function subscribeSensor(
  sensorIds: string | string[],
  topics: SensorTopicType[],
  options?: {
    throttle?: number;
    transform?: (data: any) => any;
  }
): () => void {
  return subscribeToSensorTopics(sensorIds, topics, options);
}
