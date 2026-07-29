/**
 * Access Control Types
 *
 * Types related to drone and payload access control.
 * These define who currently has access to operate drones and payloads.
 */

/**
 * User information for access control
 */
export interface AccessControlUser {
  user_id: string;
  name: string;
  is_user_online: boolean;
}

/**
 * Complete access control information for a device
 * Contains information about which users have control of drone and payload
 */
export interface AccessControlInfo {
  drone: AccessControlUser;
  payload: AccessControlUser;
  timestamp?: number;
}
