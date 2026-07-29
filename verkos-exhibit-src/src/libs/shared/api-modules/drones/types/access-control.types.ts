/**
 * Access Control Types
 */

/**
 * Request payload for taking control of a drone
 */
export interface TakeControlRequest {
  deviceId: string;
  userId: string;
}

/**
 * Response from the take control endpoint
 * This is a simple boolean indicating success/failure
 */
export type TakeControlResponse = boolean;

/**
 * Request payload for releasing control of a drone
 */
export interface ReleaseControlRequest {
  deviceId: string;
  userId: string;
}

/**
 * Response from the release control endpoint
 */
export interface ReleaseControlResponse {
  success: boolean;
  message: string;
}
