/**
 * Topic types for socket communication
 * These are the possible topics that can be subscribed to
 */
export enum DroneTopicType {
  Position = 'global_position',
  Status = 'status',
  Battery = 'battery',
  AccessControl = 'access_control_event',
  Diagnostics = 'diagnostics',
  Heartbeat = 'heartbeat',
  ProcessedSyncState = 'processed_zone_sync_state',
  Notification = 'notification',
  Attitude = 'imu_attitude',
  RTHPath = 'navigation/rth_path',
  CompletedGoto = 'completed_goto',
  FlightState = 'flight_state',
  SafetyCommandStatus = 'safety_commands_tracking',
  Weather = 'weather',
  DroneStateData = 'drone_state',
  PayloadsList = 'payloads_list',
}

/**
 * Topic types for docking stations
 */
export enum DockingStationTopicType {
  Position = 'global_position',
  Weather = 'weather',
  DockState = 'dock_state',
  PayloadsList = 'payloads_list',
}

export enum SystemTopicType {
  SystemState = 'system_state',
}

export enum SensorTopicType {
  Telemetry = 'airspace/telemetry',
}

/**
 * Topic types for remote controllers
 */
export enum RemoteControllerTopicType {
  GlobalPosition = 'global_position',
  SDRLinkState = 'sdr_link_state',
  DockState = 'dock_state',
}
