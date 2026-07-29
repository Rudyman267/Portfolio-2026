/**
 * Telemetry Types
 *
 * Common types for telemetry data used across multiple modules and applications.
 * These are the core types for interacting with drone telemetry data.
 */

/**
 * Heartbeat interface definition
 * Represents the device heartbeat data used to track connection status
 */
export interface Heartbeat {
  connected: boolean;
  system_time: number | null;
  device_heartbeat_timestamp: number;
  time_since_boot?: {
    days: number | null;
    seconds: number | null;
  };
}

// RTK Fix State enum
export enum RTKFixState {
  NO_FIX = 0,
  FLOAT = 1,
  FIXED = 2,
}

// RTK Quality enum
export enum RTKQuality {
  NO_SOLUTION = 0,
  AUTONOMOUS = 1,
  DGNSS = 2,
  FLOAT_RTK = 3,
  FIXED_RTK = 4,
  RTK_FIXED = 5,
}

// Global Position RTK information
export interface RTKInfo {
  quality: RTKQuality;
  fix_state: RTKFixState;
  rtk_satellites: number;
  is_rtk_pl_enabled: boolean;
}

// Global Position Speed information
export interface SpeedInfo {
  horizontal: number;
  vertical: number;
}

// Global Position home reference
export interface HomePosition {
  latitude: number;
  longitude: number;
  distance: number;
}

/**
 * Attitude information
 *
 * Represents the orientation of the drone in 3D space
 * Roll, pitch in degrees (-180 to 180), yaw in degrees (0-360)
 */
export interface Attitude {
  roll: number; // Roll angle in degrees
  pitch: number; // Pitch angle in degrees
  yaw: number; // Yaw angle in degrees (heading)
}

/**
 * Enhanced Global Position
 *
 * Represents the complete position data received from the global_position topic
 * This interface matches the structure of the raw data coming from the drone
 */
export interface GlobalPosition {
  position: {
    latitude: number;
    longitude: number;
    height: number;
    elevation: number;
    gps_satellites: number;
  };
  // Additional fields from the existing interface to maintain compatibility
  timestamp?: number;
  // Optional enhanced fields
  speed?: SpeedInfo;
  home_position?: HomePosition;
  rtk?: RTKInfo;
  // AGL Height has been moved outside GlobalPosition to prevent it from being overwritten
  // by socket updates
}

export interface DockGlobalPosition {
  dock_location: {
    latitude: number;
    longitude: number;
    altitude: number;
  };
  safe_location: {
    latitude: number;
    longitude: number;
    altitude: number;
  };
}

/**
 * Path point for RTH and other navigation paths
 *
 * Represents a single point in a navigation path with 3D coordinates
 */
export interface PathPoint {
  latitude: number;
  longitude: number;
  height: number;
}

/**
 * Return To Home (RTH) Path
 *
 * Contains the planned path points for the drone's return to home route
 */
export interface RTHPath {
  timestamp: number | null;
  data: {
    planned_path_points: PathPoint[];
  };
}

/**
 * GotoCoordinate for completed goto points
 *
 * Represents a 3D coordinate that the drone has navigated to
 */
export interface GotoCoordinate {
  lat: number;
  lng: number;
  alt: number;
  takeOffAlt?: number;
}

/**
 * CompletedGoto
 *
 * Contains the coordinates of completed goto operations
 */
export interface CompletedGoto {
  goto_coordinates: GotoCoordinate[];
}

/**
 * Wind information for weather data
 *
 * Contains speed and direction information for wind conditions
 */
export interface WindInfo {
  speed: number; // Wind speed in m/s
  direction: number; // Wind direction in degrees (-1 if not available)
}

/**
 * Weather information
 *
 * Contains environmental data from weather sensors on docking stations
 */
export interface WeatherInfo {
  weather: {
    temperature: number; // Temperature in Celsius
    humidity: number; // Humidity percentage
    rainfall: number; // Rainfall amount in mm
    wind: WindInfo; // Wind information
  };
}

/**
 * Mission State
 *
 * Contains information about the currently executing mission
 */
export interface MissionState {
  timestamp: number;
  flight_id: string;
  waypoints_achieved: number;
  total_waypoints: number;
  time_remaining: number;
  state_css: DroneMissionState;
  percentage_completed: string;
  action: DroneMissionAction;
  start_time: string;
  end_time: string;
  message?: string;
  mission_id: string;
  mission_name: string;
  error?: {
    code?: string;
    description?: string;
    resolution?: string;
  };
}
/**
 * Safety Command Status types
 * Matches backend flight command types that are related to safety
 */
export enum FlightCommandType {
  EXECUTE_MISSION = 'execute_mission',
  PAUSE_MISSION = 'pause_mission',
  RESUME_MISSION = 'resume_mission',
  RTH = 'return_to_home',
  DEPLOY_PARACHUTE = 'deploy_parachute',
  RTSL = 'return_to_safe_location',
  GTSA = 'go_to_safe_altitude',
  EMERGENCY_STOP = 'emergency_stop',
  ABORT = 'abort',
  LAUNCH_TO_LOCATION = 'launch_to_location',
  STOP_ALL = 'stop_all',
  EMERGENCY_LANDING = 'emergency_landing',
  ENTER_MANUAL_MODE = 'enter_manual_mode',
  EXIT_MANUAL_MODE = 'exit_manual_mode',
}

/**
 * Command Status enum
 * Matches backend command status values
 */
export enum CommandStatus {
  PROCESSING = 'processing',
  COMPLETED = 'completed',
  FAILED = 'failed',
}

/**
 * Safety Command Status Record
 *
 * Represents a single safety command execution record
 */
export interface SafetyCommandRecord {
  drone_id: string;
  command_id: string;
  command_type: FlightCommandType | string;
  issued_at: string;
  completed_at?: string;
  status: CommandStatus | string;
  error_details?: string;
  org_id: string;
}

/**
 * Safety Commands Status
 *
 * Contains the history of safety commands for a drone
 */
export interface SafetyCommandsStatus {
  commands: SafetyCommandRecord[];
}

export enum DroneMissionState {
  IDLE = 0,
  IN_PROGRESS = 1,
  PAUSED = 2,
  COMPLETED = 3,
  FAILED = 4,
  REJECTED = 5,
  CANCELLED = 6,
}

export enum GotoMissionState {
  UNKNOWN = -1,
  IDLE = 0,
  IN_PROGRESS = 1,
  COMPLETED = 2,
  CANCELLED = 3,
  FAILED = 4,
}

export enum DroneMissionAction {
  PREPARING = 0,
  WAITING_FOR_MISSION_START = 1,
  EXECUTING_MISSION = 2,
  RTH = 3,
  PULLING_LOGS = 4,
  MISSION_COMPLETED = 5,
}

export interface GotoCoordinates {
  coordinates: GotoCoordinate[];
  takeOffAlt: number;
  taskAltitude: number;
  flightType?: number;
}

/**
 * Launch To Location State
 *
 * Contains information about goto operations
 */
export interface LaunchToLocationState {
  timestamp: number;
  time_remaining: number;
  state: GotoMissionState;
  action?: number;
  id: string;
  error?: {
    code: string;
    description: string;
    resolution: string;
  };
  serving_request_type?: number;
  state_css?: string;
  message?: string;
  takeoff_progress_percentage?: number;
  last_performed_goto?: GotoCoordinates;
}

/**
 * Drone Flight Modes
 *
 * Enum representing the different flight modes a drone can be in
 */
export enum DroneFlightModes {
  MISSION = 'MISSION',
  LAUNCH_TO_LOCATION = 'LAUNCH_TO_LOCATION',
  RTH = 'RTH',
  RTSL = 'RTSL',
  UNKNOWN = 'UNKNOWN',
  MANUAL = 'MANUAL',
  GTSA = 'GTSA',
}

/**
 * Flight State
 *
 * Contains comprehensive information about the current flight state
 */
export interface FlightState {
  flight_id: string;
  user_id: string;
  mission_name: string;
  active_flight_mode: DroneFlightModes;
  armed: boolean;
  connected: boolean;
  mission_id: string;
  drone_mode: number;
  launch_to_location_metadata: LaunchToLocationState;
  mission_metadata: MissionState;
  manual_metadata: any;
  last_performed_goto?: GotoCoordinates;
}

/**
 * Drone State Telemetry
 *
 * Contains comprehensive drone state information including connection status,
 * operational capabilities, limits, and flight history
 */
export interface DroneStateData {
  connected: boolean;
  armed: boolean;
  low_battery: number;
  critical_low_battery: number;
  activation_time: number;
  beacon_state: number;
  rc_connected: boolean;
  rc_battery_percentage: number | null;
  mode: {
    state: number;
    reason: number;
    gear: number;
  };
  drone_diagnostics: number;
  drone_state: number;
  landing_status: number;
  supported_operations: {
    mission: number;
    go_to_location: number;
    manual: number;
    gtsa: number;
    rtsl: number;
    precision_landing: number;
    emergency_landing: number;
    panorama: number;
    poi: number;
  };
  mission_abortable: number;
  attitude_limit: {
    limit: number;
    is_near_height_limit: number;
  };
  distance_limit: {
    state: number;
    limit: number;
    is_near_area_limit: number;
    is_near_distance_limit: number;
  };
  flight_history: {
    time: number;
    flights: number;
    distance: number;
  };
}
