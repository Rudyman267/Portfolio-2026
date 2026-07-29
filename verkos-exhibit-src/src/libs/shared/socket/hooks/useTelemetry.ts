import { useEffect, useState } from 'react';
import useSocketStore from '../store/socket.store';
import {
  OperationalTopics,
  HealthTopics,
  MediaTopics,
  EnvironmentTopics,
} from '../enums/drone-topics.enum';

export interface TelemetryData {
  operational: Record<string, any>;
  health: Record<string, any>;
  media: Record<string, any>;
  environment: Record<string, any>;
}

export const useTelemetry = (droneId: string) => {
  const { client, isConnected } = useSocketStore();
  const [telemetryData, setTelemetryData] = useState<TelemetryData>({
    operational: {},
    health: {},
    media: {},
    environment: {},
  });

  useEffect(() => {
    if (!client || !isConnected || !droneId) return;

    const unsubscribers: (() => void)[] = [];

    // Subscribe to operational topics
    Object.values(OperationalTopics).forEach((topic) => {
      const unsubscribe = client.subscribe(topic, {
        callback: (data: any) => {
          setTelemetryData((prev) => ({
            ...prev,
            operational: { ...prev.operational, [topic]: data },
          }));
        },
      });
      unsubscribers.push(unsubscribe);
    });

    // Subscribe to health topics
    Object.values(HealthTopics).forEach((topic) => {
      const unsubscribe = client.subscribe(topic, {
        callback: (data: any) => {
          setTelemetryData((prev) => ({
            ...prev,
            health: { ...prev.health, [topic]: data },
          }));
        },
      });
      unsubscribers.push(unsubscribe);
    });

    // Subscribe to media topics
    Object.values(MediaTopics).forEach((topic) => {
      const unsubscribe = client.subscribe(topic, {
        callback: (data: any) => {
          setTelemetryData((prev) => ({
            ...prev,
            media: { ...prev.media, [topic]: data },
          }));
        },
      });
      unsubscribers.push(unsubscribe);
    });

    // Subscribe to environment topics
    Object.values(EnvironmentTopics).forEach((topic) => {
      const unsubscribe = client.subscribe(topic, {
        callback: (data: any) => {
          setTelemetryData((prev) => ({
            ...prev,
            environment: { ...prev.environment, [topic]: data },
          }));
        },
      });
      unsubscribers.push(unsubscribe);
    });

    return () => {
      unsubscribers.forEach((unsubscribe) => unsubscribe());
    };
  }, [client, isConnected, droneId]);

  return telemetryData;
};
