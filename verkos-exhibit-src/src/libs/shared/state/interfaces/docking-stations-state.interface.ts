import {
  DockGlobalPosition,
  GlobalPosition,
  WeatherInfo,
} from '../types/telemetry.types';
import { DiagnosticsData } from '../types/diagnostics.types';
import { Payload } from '@libs/shared/api-modules';

export interface DockingStationState {
  id: string;
  name?: string;
  model?: string;
  serialNumber?: string;
  manufacturer?: string;
  deviceType?: string;
  edge_type?: number;
  bindingId: string;
  droneId?: string;
  site?: {
    id: string;
    name: string;
  };
  status?: Record<string, unknown>;
  globalPosition?: DockGlobalPosition;
  diagnostics?: DiagnosticsData;
  weather?: WeatherInfo;
  dockStatus?: DockingStationStatus;
  payload?: Payload[];
}

// Type for property paths (either string with dots or string array)
export type PropertyPath = string | string[];

export interface DockingStationsState {
  dockingStations: Record<string, DockingStationState>;
  // Update complete docking station data
  updateDockingStationData: (
    dockingStationId: string,
    data: DockingStationState
  ) => void;

  // Flexible property update to reduce boilerplate
  updateDockingStationProperty: (
    dockingStationId: string,
    propertyPath: PropertyPath,
    value: unknown
  ) => void;
}

export interface DockingStationStatus {
  lights?: {
    internal?: {
      state: number;
    };
    external?: {
      state: number;
    };
  };
  alarm?: {
    state: number;
  };
  emergency_stop?: {
    state: number;
  };
  local_storage?: {
    used: number;
    total: number;
  };
  occupancy?: {
    state: number;
  };
  enclosure?: {
    state: number;
  };
  dock_diagnostics?: number;
  dock_state?: number;
  supported_operations?: {
    rtds?: number;
  };
  operation_mode?: {
    state: number;
  };
  charging_rods?: {
    state: number;
  };
  connected?: boolean;
  workflow_state?: string | null;
  action_state?: string | null;
  drone_device_model_key?: number;
  total_flight_operations?: number;
  drone_power?: {
    state: number;
  };
  drone_charging?: {
    state: number;
  };
  rc_power?: {
    state: number | null;
  };
  maintenance_mode?: string | null;
  service_state?: string | null;
  silent_mode?: number;
}
