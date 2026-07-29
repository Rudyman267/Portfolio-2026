/**
 * System State Types
 *
 * Types related to drone, dock and system operational states.
 */

// Common state properties
interface BaseState {
  state: string;
  last_state: string | null;
  state_transited: boolean;
}

// Dock state information
export interface DockState extends BaseState {
  connected: boolean;
}

// Drone state information
export interface DroneSystemState extends BaseState {
  connected: boolean;
  armed: boolean;
}

// System state information
export type SystemState = BaseState;

// Progress tracking for operations
export interface OperationProgress {
  time_remaining: number | null;
  step_name: string | null;
  steps_completed: number | null;
  total_steps: number | null;
  step_progress_percentage: number | null;
  total_progress_percentage: number | null;
}

// Error information
export interface OperationError {
  code: string | null;
  description: string | null;
  resolution: string | null;
}

// Waypoint information
export interface WaypointInfo {
  total: number;
  current: number;
}

// Base metadata for operations
interface BaseOperationMetadata {
  id: string | null;
  operation_supported: string | null;
  state: string;
  last_state: string;
  state_transited: boolean;
  user_id: string | null;
  error: OperationError;
}

// Mission metadata
export interface MissionMetadata extends BaseOperationMetadata {
  mission_id: string;
  mission_name: string;
  request_type: string;
  can_be_paused: boolean;
  can_be_resumed: boolean;
  can_be_aborted: boolean;
  waypoints: WaypointInfo;
  takeoff_progress_percentage: number;
  progress: OperationProgress;
}

// Launch to location metadata
export interface LaunchToLocationMetadata extends BaseOperationMetadata {
  request_type: string;
  can_be_cancelled: boolean;
  takeoff_progress_percentage: number;
  progress: OperationProgress;
}

// Manual control metadata
export interface ManualControlMetadata extends BaseOperationMetadata {
  can_be_exited: boolean;
}

// RTL metadata (Return to Launch)
export interface RtlMetadata extends BaseOperationMetadata {
  can_be_cancelled: boolean;
  waypoints?: WaypointInfo;
  progress: OperationProgress;
}

// Landing metadata
export interface LandingMetadata extends BaseOperationMetadata {
  can_be_cancelled: boolean;
  progress: OperationProgress;
}

// POI metadata (Point of Interest)
export interface PoiMetadata extends BaseOperationMetadata {
  can_be_cancelled: boolean;
  progress: OperationProgress;
}

// Applied rules format: [ruleset_id, [rule1, rule2, ...]]
export type AppliedRules = Array<[number, number[]]>;

// Main operation state
export interface OperationState extends BaseState {
  applied_rules: AppliedRules;
  flight_id: string;
  failsafe_state: string;
  last_failsafe_state: string | null;
  failsafe_state_transited: boolean;
  drc_heartbeat_state: string;
  last_drc_heartbeat_state: string | null;
  drc_heartbeat_state_transited: boolean;
  next_allowed_operations: string[];
  mission_metadata: MissionMetadata;
  launch_to_location_metadata: LaunchToLocationMetadata;
  manual_control_metadata: ManualControlMetadata;
  rtds_metadata: RtlMetadata;
  rtsl_metadata: RtlMetadata;
  landing_metadata: LandingMetadata;
  panorama_metadata: PoiMetadata;
  poi_metadata: PoiMetadata;
  pl_metadata?: RtlMetadata;
  gtsa_metadata?: {
    id: string | null;
    operation_supported: string;
    state: string;
    last_state: string;
    state_transited: boolean;
    user_id: string | null;
    can_be_cancelled: boolean;
    progress: OperationProgress;
    error: OperationError;
  };
}

/**
 * Complete system state information
 */
export interface CompleteSystemState {
  dock: DockState;
  drone: DroneSystemState;
  system: SystemState;
  operation: OperationState;
  system_ping: number;
}
