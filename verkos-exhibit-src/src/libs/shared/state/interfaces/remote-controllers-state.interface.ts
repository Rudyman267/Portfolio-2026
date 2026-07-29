export interface RCMapState {
  rcName: string;
  position: {
    latitude: number;
    longitude: number;
    altitude: number;
  };
  connected?: boolean;
}

export interface RCGlobalPosition {
  position: {
    latitude: number;
    longitude: number;
    height: number | null;
    elevation: number | null;
    gps_satellites: number | null;
  };
  speed: {
    horizontal: number | null;
    vertical: number | null;
  };
  home_position: {
    latitude: number | null;
    longitude: number | null;
    distance: number | null;
  };
  rtk: {
    quality: number | null;
    fix_state: number | null;
    rtk_satellites: number | null;
    is_rtk_pl_enabled: boolean | null;
  };
}

export interface RemoteControllerState {
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
  payload?: Array<{
    payload_index: string;
    type: string;
    model: string;
  }>;
  globalPosition?: RCGlobalPosition;
  sdrLinkState?: {
    frequency: number;
    signalStrength: number;
    timestamp: number;
  };
  dockState?: {
    connected: boolean;
    timestamp: number;
  };
  isOnline?: boolean;
  lastSeen?: number;
}

export type PropertyPath = string | string[];

export interface RemoteControllersState {
  remoteControllers: Record<string, RemoteControllerState>;

  updateRemoteControllerData: (
    remoteControllerId: string,
    data: RemoteControllerState
  ) => void;

  updateRemoteControllerProperty: (
    remoteControllerId: string,
    propertyPath: PropertyPath,
    value: unknown
  ) => void;
}
