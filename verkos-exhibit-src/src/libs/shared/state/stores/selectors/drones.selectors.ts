import type { DronesState, DroneState } from '../../interfaces/drones-state.interface';

/**
 * Base selector to get a specific drone by ID
 */
export const selectDroneById =
  (droneId: string) =>
  (state: DronesState): DroneState | undefined =>
    state.drones[droneId];

/**
 * Selector for drone's status
 */
export const selectDroneStatus =
  (droneId: string) =>
  (state: DronesState): DroneState['status'] | undefined =>
    state.drones[droneId]?.status;

/**
 * Selector for drone's flight state
 */
export const selectDroneFlightState =
  (droneId: string) =>
  (state: DronesState): DroneState['flightState'] | undefined =>
    state.drones[droneId]?.flightState;

/**
 * Selector for drone's position
 */
export const selectDronePosition =
  (droneId: string) =>
  (state: DronesState): DroneState['globalPosition'] | undefined =>
    state.drones[droneId]?.globalPosition;

/**
 * Selector for drone's battery status
 */
export const selectDroneBattery =
  (droneId: string) =>
  (state: DronesState): DroneState['battery'] | undefined =>
    state.drones[droneId]?.battery;

/**
 * Selector for drone's notifications/alerts
 */
export const selectDroneNotifications =
  (droneId: string) =>
  (state: DronesState): DroneState['notifications'] | undefined =>
    state.drones[droneId]?.notifications;

/**
 * Selector for drone's diagnostics
 */
export const selectDroneDiagnostics =
  (droneId: string) =>
  (state: DronesState): DroneState['diagnostics'] | undefined =>
    state.drones[droneId]?.diagnostics;

/**
 * Selector for drone's weather
 */
export const selectDroneWeather =
  (droneId: string) =>
  (state: DronesState): DroneState['weather'] | undefined =>
    state.drones[droneId]?.weather;

/**
 * Selector for drone's attitude
 */
export const selectDroneAttitude =
  (droneId: string) =>
  (state: DronesState): DroneState['attitude'] | undefined =>
    state.drones[droneId]?.attitude;

/**
 * Selector for drone's heartbeat
 */
export const selectDroneHeartbeat =
  (droneId: string) =>
  (state: DronesState): DroneState['heartbeat'] | undefined =>
    state.drones[droneId]?.heartbeat;

/**
 * Selector for drone's payload
 */
export const selectDronePayload =
  (droneId: string) =>
  (state: DronesState): DroneState['payload'] | undefined =>
    state.drones[droneId]?.payload;
