import useDronesStore from '../../state/stores/drones.store';
import { OperationalTopics, HealthTopics } from '../enums/drone-topics.enum';
import type { TopicHandler } from '../interfaces/topic-handler.interface';

export const createTopicHandlers = (): TopicHandler[] => {
  const dronesStore = useDronesStore.getState();

  // Use the generic updateDroneProperty method for all topic handlers
  const handlers: TopicHandler[] = [
    // Operational topics
    {
      topic: OperationalTopics.STATUS,
      handler: (deviceId: string, data: any) =>
        dronesStore.updateDroneProperty(deviceId, 'status', data),
    },
    {
      topic: OperationalTopics.FLIGHT,
      handler: (deviceId: string, data: any) =>
        dronesStore.updateDroneProperty(deviceId, 'flightState', data),
    },
    {
      topic: OperationalTopics.POSITION,
      handler: (deviceId: string, data: any) =>
        dronesStore.updateDroneProperty(deviceId, 'globalPosition', data),
    },
    // Health topics
    {
      topic: HealthTopics.BATTERY,
      handler: (deviceId: string, data: any) =>
        dronesStore.updateDroneProperty(deviceId, 'battery', data),
    },
    {
      topic: HealthTopics.HARDWARE,
      handler: (deviceId: string, data: any) =>
        dronesStore.updateDroneProperty(deviceId, 'diagnostics', data),
    },
    {
      topic: HealthTopics.ALERTS,
      handler: (deviceId: string, data: any) =>
        dronesStore.updateDroneProperty(deviceId, 'notifications', data),
    },
  ];

  return handlers;
};
