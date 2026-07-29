/**
 * Flight operation identifiers used for bulk drone control operations.
 * These IDs are used in the UI and mapped to API command types.
 */
export enum FlightOperationId {
  TAKE_CONTROL = 'takeControl',
  GTSA = 'gtsa',
  RTSL = 'rtsl',
  RTH = 'rth',
  STOP = 'stop',
}

/**
 * Set of all flight operation IDs for quick lookup.
 * Use this to check if an operation ID is a flight operation.
 */
export const FLIGHT_OPERATION_IDS = new Set<string>(
  Object.values(FlightOperationId)
);
