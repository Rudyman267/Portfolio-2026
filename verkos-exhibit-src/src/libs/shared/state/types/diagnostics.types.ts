/**
 * Diagnostics Types
 *
 * Types related to system diagnostic messages and health state.
 */

// Health state constants
export enum HealthState {
  OK,
  WARNING,
  HARDWARE_FAILURE,
}

export const HealthStateLabel = {
  [HealthState.OK]: 'Healthy',
  [HealthState.WARNING]: 'Warning',
  [HealthState.HARDWARE_FAILURE]: 'Hardware checks failed',
};

// Diagnostic message level
export enum DiagnosticLevel {
  INFO = 0,
  WARNING = 1,
  ERROR = 2,
  CRITICAL = 3,
}

// Diagnostic component details
export interface DiagnosticDetails {
  module: number;
  component_index: number;
  sensor_index: number;
  [key: string]: any; // For additional properties
}

// Single diagnostic message
export interface DiagnosticMessage {
  level: DiagnosticLevel;
  error_code: string;
  description: string;
  resolution: any; // This could be more detailed if needed
  details: DiagnosticDetails;
  device_id: string;
  device_type: string;
  start_time: number;
  diagnostic_id: string;
}

// Complete diagnostics data for a device
export interface DiagnosticsData {
  health_state: HealthState;
  diagnostic_msgs: DiagnosticMessage[];
  timestamp?: number; // Added for consistency with other data types
}
