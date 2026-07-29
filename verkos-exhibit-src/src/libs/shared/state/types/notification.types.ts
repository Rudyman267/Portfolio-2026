/**
 * Types for drone notifications
 */

// Notification categories
export enum NOTIFICATION_CATEGORY {
  AIRSPACE = 'airspace',
  FAILSAFE = 'failsafe',
  FLIGHT_EXECUTION = 'flight_execution',
  ACCESS_CONTROL = 'access_control',
  DEVICE_OPERATION = 'device_operation',
  API_CRUD = 'api_crud',
  ALARM_TRIGGER = 'alarm_trigger',
  AUTOMATION_TRIGGER = 'automation_trigger',
  HARDWARE_ACCESS = 'hardware_access',
  SYSTEM_FAILURE = 'system_failure',
  ZONES = 'zones',
  DETECTION_ALERT = 'detection_alert',
  DRC_LINK_DISCONNECTED = 'drc_link_disconnected',
  HARDWARE_FAILURE = 'hardware_failure',
}

// Notification levels
export enum NOTIFICATION_LEVEL {
  SUCCESS = 'success',
  ERROR = 'error',
  CRITICAL = 'critical',
  INFO = 'info',
  WARNING = 'warning',
}

export enum SEVERITY_LEVEL {
  NONE = 0,
  INFO = 1,
  WARNING = 2,
  ERROR = 3,
  CRITICAL = 4,
}

// Base notification interface
export interface ISocketNotification {
  category: NOTIFICATION_CATEGORY;
  level: NOTIFICATION_LEVEL;
  metadata: IAirspaceMetadata; // Type varies based on category
  timestamp?: number;
}

// Airspace metadata
export interface IAirspaceMetadata {
  threatId: string;
  sensorName: string;
  sensorType: string;
  intruderType: string;
  source: string;
  icao: string;
  heading: number;
  altitude: number;
  altitude_reference: string;
  distance: number;
  latitude: number;
  longitude: number;
  threat_horizontal_distance: number;
  threat_vertical_distance: number;
}

// Failsafe metadata
export interface IFailsafeMetadata {
  failsafe: string;
  failsafeAction?: string;
}

// System failure metadata
export interface ISystemFailureMetadata {
  systemFailure: string;
  systemFailureAction?: string;
  acknowledged?: boolean;
  acknowledged_by?: string;
  isResolved?: boolean;
  failureType?: string;
}

// Hardware failure metadata
export interface IHardwareFailureMetadata {
  message: string;
  errorCode?: number;
  errorResolution?: string;
}

// Flight execution metadata
export interface IFlightExecutionMetadata {
  message: string;
  errorCode?: number;
  errorResolution?: string;
}

// Collection of notifications for a drone
export interface DroneNotifications {
  // Array of notifications
  notifications: ISocketNotification[];
}
