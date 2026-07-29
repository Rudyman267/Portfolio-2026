/**
 * User Preference Settings Types
 */

export interface SoundAlertSettings {
  alerts_enabled: boolean;
  airspace_threats: boolean;
  failsafe_triggers: boolean;
  launch_failures: boolean;
  system_failures: boolean;
  flinks: {
    alerts_enabled: boolean;
    ids: string[];
  };
  ai_detection_alerts: boolean;
  thermal_alerts: boolean;
}

export interface LanguagePreference {
  name: string;
  lang: string;
}

export interface UnitSystem {
  title: string;
  value: string;
  distance: string;
  speed: string;
  time: string;
  temperature: string;
  angSpeed: string;
  area: string;
}

export interface UserPreferenceSettings {
  adsb_notification: boolean;
  advanced_manual_control: number;
  alt: number;
  altitude_reference_type: number;
  map_view: string;
  mission_helper_window: boolean;
  pan_sensitivity: number;
  pitch_and_roll: number;
  pitch_and_roll_speed_above_threshold: number;
  pitch_and_roll_speed_below_threshold: number;
  pitch_sensitivity: number;
  privacy_enabled: boolean;
  show_collision_radar: boolean;
  site_announcement_window: boolean;
  sound_alerts: SoundAlertSettings;
  speed: number;
  threshold_altitude: number;
  throttle: number;
  throttle_speed_above_threshold: number;
  throttle_speed_below_threshold: number;
  yaw: number;
  yaw_speed_above_threshold: number;
  yaw_speed_below_threshold: number;
  lang_pref: LanguagePreference;
  unit_system: UnitSystem;
}

export type UserPreferenceResponse = UserPreferenceSettings;
