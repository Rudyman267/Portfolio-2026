// Base topic structure that all topics will follow
export const TOPIC_BASE = {
  PREFIX: '{org-id}/{device-id}', // Base prefix for all topics
  CATEGORY: 'telemetry', // Main category for all telemetry data
} as const;

// Operational topic definitions
export enum OperationalTopics {
  STATUS = 'operational/status', // Connection and operational mode
  FLIGHT = 'operational/flight', // Flight status and parameters
  POSITION = 'operational/position', // Position and navigation data
  PILOT = 'operational/pilot', // Pilot information
}

// Health and alerts topic definitions
export enum HealthTopics {
  BATTERY = 'health/battery', // Battery status and metrics
  HARDWARE = 'health/hardware', // Hardware components status
  ALERTS = 'health/alerts', // System alerts and warnings
}

// Media streaming topic definitions
export enum MediaTopics {
  VIDEO = 'media/video', // Video stream information
  MAP = 'media/map', // Map configuration and layers
}

// Environment topic definitions
export enum EnvironmentTopics {
  WEATHER = 'environment/weather', // Weather conditions
  AIRSPACE = 'environment/airspace', // Airspace restrictions and warnings
  DOCK = 'environment/dock', // Dock status and information
}

// Helper type to combine all topic enums
export type TopicType =
  | OperationalTopics
  | HealthTopics
  | MediaTopics
  | EnvironmentTopics;

// Helper function to construct full topic path
export const getTopicPath = (
  orgId: string,
  deviceId: string,
  topic: TopicType
): string => {
  return `${TOPIC_BASE.PREFIX.replace('{org-id}', orgId).replace(
    '{device-id}',
    deviceId
  )}/${TOPIC_BASE.CATEGORY}/${topic}`;
};

// Topic subscription management class
export class TopicManager {
  private readonly orgId: string;
  private readonly deviceId: string;

  constructor(orgId: string, deviceId: string) {
    this.orgId = orgId;
    this.deviceId = deviceId;
  }

  // Get full topic path for subscription
  public getTopic(topic: TopicType): string {
    return getTopicPath(this.orgId, this.deviceId, topic);
  }

  // Get all topics for a device
  public getAllTopics(): string[] {
    return [
      ...Object.values(OperationalTopics),
      ...Object.values(HealthTopics),
      ...Object.values(MediaTopics),
      ...Object.values(EnvironmentTopics),
    ].map((topic) => this.getTopic(topic));
  }

  // Get specific category topics
  public getOperationalTopics(): string[] {
    return Object.values(OperationalTopics).map((topic) =>
      this.getTopic(topic)
    );
  }

  public getHealthTopics(): string[] {
    return Object.values(HealthTopics).map((topic) => this.getTopic(topic));
  }

  public getMediaTopics(): string[] {
    return Object.values(MediaTopics).map((topic) => this.getTopic(topic));
  }

  public getEnvironmentTopics(): string[] {
    return Object.values(EnvironmentTopics).map((topic) =>
      this.getTopic(topic)
    );
  }
}
