// Re-export specific items from each interface file to avoid naming conflicts
export type { DroneState, DronesState, PropertyPath } from './interfaces/drones-state.interface';
export type { SensorState, SensorsState } from './interfaces/sensors-state.interface';
export type { IntrudersState } from './interfaces/intruders-state.interface';
export type { 
  RemoteControllerState, 
  RemoteControllersState, 
  RCMapState, 
  RCGlobalPosition,
  PropertyPath as RCPropertyPath 
} from './interfaces/remote-controllers-state.interface';
export type { 
  DockingStationState, 
  DockingStationsState, 
  DockingStationStatus,
  PropertyPath as DockPropertyPath 
} from './interfaces/docking-stations-state.interface';

export { default as useDronesStore } from './stores/drones.store';
export { default as useSensorsStore } from './stores/sensors.store';
export { default as useIntrudersStore } from './stores/intruders.store';
export { default as useRemoteControllersStore } from './stores/remote-controllers.store';

export * from './hooks/useDroneSubscription';
export * from './hooks/useSensorSubscription';
export * from './hooks/useIntruderSubscription';
export * from './hooks/useRemoteControllerSubscription';
