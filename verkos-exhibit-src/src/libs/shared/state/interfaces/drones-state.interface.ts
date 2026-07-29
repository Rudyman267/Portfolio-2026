import { AccessControlInfo, DroneStateData } from '../types';
import { DiagnosticsData } from '../types';
import { GlobalPosition, Heartbeat } from '../types';
import { ISocketNotification } from '../types';
import {
  Attitude,
  RTHPath,
  CompletedGoto,
  FlightState,
  SafetyCommandsStatus,
} from '../types';
import { EdgeType } from '../types/edgetype.types';
import { WeatherInfo } from '../types';
import { Payload } from '@libs/shared/api-modules';

export interface DroneState {
  id: string;
  name?: string;
  model?: string;
  serialNumber?: string;
  manufacturer?: string;
  droneType?: string;
  bindingId: string;
  dockId?: string;
  edgeType: EdgeType;
  site?: any;
  status?: any;
  battery?: any;
  globalPosition?: GlobalPosition;
  // Height above ground level - moved to top level to prevent it from being overwritten by position updates
  aglHeight?: number;
  attitude?: Attitude;
  accessControl?: AccessControlInfo;
  diagnostics?: DiagnosticsData;
  heartbeat?: Heartbeat;
  processedSyncState?: any;
  notifications?: ISocketNotification[]; // Array of notifications for this drone
  rthPath?: RTHPath;
  completedGoto?: CompletedGoto;
  flightState?: FlightState; // Flight state data for the drone
  safetyCommandStatus?: SafetyCommandsStatus; // Safety commands status and history
  payload: Payload[];
  weather?: WeatherInfo;
  droneStateData?: DroneStateData;
}

// Type for property paths (either string with dots or string array)
export type PropertyPath = string | string[];

export interface DronesState {
  drones: Record<string, DroneState>;

  // Generic update for full drone data
  updateDroneData: (droneId: string, data: DroneState) => void;

  // Flexible property update to reduce boilerplate
  updateDroneProperty: (
    droneId: string,
    propertyPath: PropertyPath,
    value: any
  ) => void;
}
