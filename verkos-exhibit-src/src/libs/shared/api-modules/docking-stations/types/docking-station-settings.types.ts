/**
 * Docking station settings response interfaces
 */

/**
 * Vision precision landing settings
 */
export interface VisionPrecisionLandingSettings {
  landing_threshold: number;
  trigger_height: number;
  guided_approach: boolean;
  _id: string;
}

/**
 * RTK precision landing settings
 */
export interface RtkPrecisionLandingSettings {
  landing_threshold: number;
  trigger_height: number;
  guided_approach: boolean;
  _id: string;
}

/**
 * Dock location coordinates
 */
export interface DockLocation {
  latitude: number;
  longitude: number;
  altitude: number | null;
  _id: string;
}

/**
 * Safe location coordinates
 */
export interface SafeLocation {
  latitude: number;
  longitude: number;
  altitude: number | null;
  _id: string;
}

/**
 * User info for updated_by field
 */
export interface UpdatedByUser {
  _id: string;
  email: string;
  name: string;
}

/**
 * Docking station settings response
 */
export interface DockingStationSettingsResponse {
  _id: string;
  is_delete: boolean;
  auto_operations: boolean;
  landing_verification: boolean;
  precision_landing_mode: number;
  vision_pl: VisionPrecisionLandingSettings;
  rtk_pl: RtkPrecisionLandingSettings;
  device_id: string;
  binding_id: string;
  organization_id: string;
  createdAt: string;
  updated_at: string;
  __v: number;
  dock_location: DockLocation;
  updated_by: UpdatedByUser;
  safe_location: SafeLocation;
}
